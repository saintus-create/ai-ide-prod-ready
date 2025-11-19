import { useEffect, useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from '@/hooks/useToast';
import Layout from '@/components/Layout';
import Explorer from '@/components/Explorer';
import Editor from '@/components/Editor';
import GitPanel from '@/components/GitPanel';
import Chat from '@/components/Chat';
import ErrorBoundary from '@/components/ErrorBoundary';
import { socket } from '@/lib/socket';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { error } = useToast();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    
    // Connection status updates
    socket.on('connect_error', () => {
      error('Failed to connect to server. Please check if the backend is running.');
    });
    
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [error]);

  // Enhanced hotkeys setup
  useHotkeys([
    {
      key: ' ',
      ctrl: true,
      description: 'Trigger AI completion',
      handler: () => {
        window.dispatchEvent(new CustomEvent('trigger-completion'));
      }
    },
    {
      key: 'n',
      ctrl: true,
      shift: true,
      description: 'Create new file',
      handler: () => {
        const name = prompt('New file (relative to workspace, e.g. src/app.tsx):');
        if (name) {
          fetch('/api/workspace/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: name, content: '' })
          })
            .then(() => {
              // File creation will trigger refresh via socket events
            })
            .catch((err) => {
              error(`Failed to create file: ${err.message}`);
            });
        }
      }
    },
    {
      key: 'g',
      ctrl: true,
      shift: true,
      description: 'Toggle Git panel',
      handler: () => {
        setShowGitPanel(!showGitPanel);
      }
    },
    {
      key: 'b',
      ctrl: true,
      description: 'Toggle sidebar (mobile)',
      handler: () => {
        if (isMobile) {
          setShowSidebar(!showSidebar);
        }
      }
    },
  ]);

  const closeSidebar = () => setShowSidebar(false);

  return (
    <ErrorBoundary>
      <Layout>
        <div className="flex h-full relative">
          {/* Mobile Overlay */}
          {isMobile && showSidebar && (
            <div 
              className="fixed inset-0 bg-black/50 z-20"
              onClick={closeSidebar}
            />
          )}
          
          {/* Sidebar */}
          <div className={`
            ${isMobile ? 'fixed inset-y-0 left-0 z-30' : 'relative'}
            transition-transform duration-300 ease-in-out
            ${isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'}
          `}>
            {/* Mobile toggle button */}
            {isMobile && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="absolute -right-10 top-4 z-40 p-2 bg-overlay border border-surface/30 rounded-r"
                title="Toggle sidebar"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            )}
            
            <ErrorBoundary>
              <Explorer />
            </ErrorBoundary>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            {/* Mobile Header with controls */}
            {isMobile && (
              <div className="bg-surface/80 border-b border-surface/30 p-2 flex items-center justify-between">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-surface/50 rounded"
                  title="Open sidebar"
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400">AI-IDE</span>
                <div className="w-9" /> {/* Spacer for alignment */}
              </div>
            )}
            
            <ErrorBoundary>
              <Editor />
            </ErrorBoundary>
            
            {showGitPanel && (
              <ErrorBoundary>
                <GitPanel />
              </ErrorBoundary>
            )}
          </div>
          
          {/* Chat Panel - Hidden on mobile by default */}
          <div className={`
            ${isMobile ? 'hidden' : 'block'}
            w-80 border-l border-surface/30
          `}>
            <ErrorBoundary>
              <Chat />
            </ErrorBoundary>
          </div>
        </div>

        {!connected && (
          <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-center py-1 z-40">
            Disconnected from server – reconnecting…
          </div>
        )}
      </Layout>
    </ErrorBoundary>
  );
}