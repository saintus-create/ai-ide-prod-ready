import { useEffect, useState } from 'react';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useToast } from '@/hooks/useToast';
import Layout from '@/components/Layout';
import Explorer from '@/components/Explorer';
import Editor from '@/components/Editor';
import GitPanel from '@/components/GitPanel';
import Chat from '@/components/Chat';
import { socket } from '@/lib/socket';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(true);
  const { error } = useToast();

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

  // Hotkeys setup
  useHotkeys([
    {
      key: ' ',
      ctrl: true,
      description: 'Trigger AI completion',
      handler: () => {
        // Trigger completion in editor - this will be handled by the Editor component
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
          socket.emitWithAck('workspace:write', { path: name, content: '' })
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
  ]);

  return (
    <Layout>
      <div className="flex h-full">
        <Explorer />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Editor />
          {showGitPanel && <GitPanel />}
        </div>
        <Chat />
      </div>

      {!connected && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-center py-1 z-40">
          Disconnected from server – reconnecting…
        </div>
      )}
    </Layout>
  );
}