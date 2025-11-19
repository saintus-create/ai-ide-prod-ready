import { useEffect } from 'react';
import { FolderIcon, DocumentIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '@/hooks/useWorkspace';
import { FileNode } from '@/types';
import { socket } from '@/lib/socket';

function TreeNode({ node, path }: { node: FileNode; path: string }) {
  const { selectFile } = useWorkspace();
  const fullPath = `${path}/${node.name}`;

  return (
    <div className="ml-4">
      <div
        className="flex items-center py-0.5 hover:bg-surface/50 cursor-pointer"
        onClick={() => node.type === 'file' && selectFile(fullPath)}
      >
        {node.type === 'directory' ? (
          <FolderIcon className="w-4 h-4 mr-1 text-primary" />
        ) : (
          <DocumentIcon className="w-4 h-4 mr-1 text-gray-400" />
        )}
        <span>{node.name}</span>
      </div>
      {node.type === 'directory' && node.children?.map((c) => (
        <TreeNode key={c.name} node={c} path={fullPath} />
      ))}
    </div>
  );
}

export default function Explorer() {
  const { tree, refreshTree, currentFile, selectFile } = useWorkspace();

  useEffect(() => {
    refreshTree();
    // live updates
    socket.on('workspace:fileChanged', refreshTree);
    socket.on('workspace:fileDeleted', refreshTree);
    return () => {
      socket.off('workspace:fileChanged', refreshTree);
      socket.off('workspace:fileDeleted', refreshTree);
    };
  }, []);

  const createFile = async () => {
    const name = prompt('New file (relative to workspace, e.g. src/app.tsx):');
    if (!name) return;
    await socket.emitWithAck('workspace:write', { path: name, content: '' });
    refreshTree();
  };

  return (
    <aside className="w-64 bg-surface text-gray-100 p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">📁 Explorer</h3>
        <button onClick={createFile} title="New file">
          <PlusIcon className="w-5 h-5 text-primary" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tree.map((node) => (
          <TreeNode key={node.name} node={node} path="" />
        ))}
      </div>
    </aside>
  );
}