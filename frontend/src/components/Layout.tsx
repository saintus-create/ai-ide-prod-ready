import { useState } from 'react';
import { SunIcon, MoonIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/hooks/useTheme';
import ToastContainer from './ToastContainer';
import SettingsModal from './SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { dark, toggle } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="h-screen w-screen bg-surface text-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-10 bg-surface/80 backdrop-blur-sm border-b border-surface/30 flex items-center px-4 justify-between">
        <span className="font-mono text-sm">AI‑IDE – Codestral / ChatGPT‑OSS / dKimi</span>
        
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded hover:bg-surface/50 transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="w-4 h-4 text-gray-400 hover:text-primary" />
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded hover:bg-surface/50 transition-colors"
            title={`Switch to ${dark ? 'light' : 'dark'} mode`}
          >
            {dark ? (
              <SunIcon className="w-4 h-4 text-primary" />
            ) : (
              <MoonIcon className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </header>

      {/* Main UI */}
      <main className="flex-1 overflow-hidden">{children}</main>
      
      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}