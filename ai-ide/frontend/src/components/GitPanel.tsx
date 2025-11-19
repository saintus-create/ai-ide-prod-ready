import { useState } from 'react';
import { socket } from '@/lib/socket';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, RefreshIcon } from '@heroicons/react/24/outline';

export default function GitPanel() {
  const [status, setStatus] = useState<any>(null);
  const repoPath = '/workspace';

  const fetchStatus = async () => {
    socket.emit('git:status', repoPath, (resp: any) => {
      if (resp.ok) setStatus(resp.status);
    });
  };

  const pull = async () => {
    socket.emit('git:pull', { path: repoPath, remote: 'origin', branch: 'main' }, fetchStatus);
  };

  const push = async () => {
    socket.emit('git:push', { path: repoPath, remote: 'origin', branch: 'main' }, fetchStatus);
  };

  return (
    <div className="h-48 bg-overlay text-gray-200 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">🛠️ Git</h4>
        <button onClick={fetchStatus} title="Refresh">
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>

      <pre className="flex-1 overflow-y-auto text-xs whitespace-pre-wrap">
        {status ? JSON.stringify(status, null, 2) : 'Press ⟳ to load status'}
      </pre>

      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 bg-primary text-white py-1 rounded hover:bg-primary/80 flex items-center justify-center"
          onClick={pull}
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
          Pull
        </button>
        <button
          className="flex-1 bg-primary text-white py-1 rounded hover:bg-primary/80 flex items-center justify-center"
          onClick={push}
        >
          <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
          Push
        </button>
      </div>
    </div>
  );
}