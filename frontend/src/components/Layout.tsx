import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/hooks/useTheme';
import ToastContainer from './ToastContainer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { dark, toggle } = useTheme();

  return (
    <div className="h-screen w-screen bg-surface text-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-10 bg-surface/80 backdrop-blur-sm border-b border-surface/30 flex items-center px-4 justify-between">
        <span className="font-mono text-sm">AI‑IDE – Codestral / ChatGPT‑OSS / dKimi</span>
        
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
      </header>

      {/* Main UI */}
      <main className="flex-1 overflow-hidden">{children}</main>
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}