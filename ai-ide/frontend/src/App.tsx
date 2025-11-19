import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import Explorer from '@/components/Explorer';
import Editor from '@/components/Editor';
import GitPanel from '@/components/GitPanel';
import Chat from '@/components/Chat';
import { socket } from '@/lib/socket';

export default function App() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  return (
    <Layout>
      <div className="flex h-full">
        <Explorer />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Editor />
          <GitPanel />
        </div>
        <Chat />
      </div>

      {!connected && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white text-center py-1">
          Disconnected from server – reconnecting…
        </div>
      )}
    </Layout>
  );
}