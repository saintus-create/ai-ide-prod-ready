import { useState } from 'react';
import { socket } from '@/lib/socket';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, RefreshIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

export default function GitPanel() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();
  const repoPath = '/workspace';

  const fetchStatus = async () => {
    setIsLoading(true);
    socket.emit('git:status', repoPath, (resp: any) => {
      setIsLoading(false);
      if (resp.ok) {
        setStatus(resp.status);
        success('Git status refreshed');
      } else {
        error(`Failed to get status: ${resp.error}`);
      }
    });
  };

  const pull = async () => {
    setIsLoading(true);
    socket.emit('git:pull', { path: repoPath, remote: 'origin', branch: 'main' }, (resp: any) => {
      setIsLoading(false);
      if (resp.ok) {
        success('Pulled successfully');
        fetchStatus();
      } else {
        error(`Pull failed: ${resp.error}`);
      }
    });
  };

  const push = async () => {
    setIsLoading(true);
    socket.emit('git:push', { path: repoPath, remote: 'origin', branch: 'main' }, (resp: any) => {
      setIsLoading(false);
      if (resp.ok) {
        success('Pushed successfully');
        fetchStatus();
      } else {
        error(`Push failed: ${resp.error}`);
      }
    });
  };

  return (
    <div className="h-48 bg-overlay text-gray-200 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">🛠️ Git</h4>
        <button 
          onClick={fetchStatus} 
          title="Refresh"
          disabled={isLoading}
          className="disabled:opacity-50"
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>

      <pre className="flex-1 overflow-y-auto text-xs whitespace-pre-wrap bg-black/20 p-2 rounded">
        {status ? JSON.stringify(status, null, 2) : 'Press ⟳ to load status'}
      </pre>

      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 bg-primary text-white py-1 rounded hover:bg-primary/80 flex items-center justify-center disabled:opacity-50"
          onClick={pull}
          disabled={isLoading}
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
          Pull
        </button>
        <button
          className="flex-1 bg-primary text-white py-1 rounded hover:bg-primary/80 flex items-center justify-center disabled:opacity-50"
          onClick={push}
          disabled={isLoading}
        >
          <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
          Push
        </button>
      </div>
    </div>
  );
}