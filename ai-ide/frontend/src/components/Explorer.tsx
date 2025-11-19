import { useEffect, useState } from 'react';
import { FolderIcon, DocumentIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useWorkspace } from '@/hooks/useWorkspace';
import { FileNode } from '@/types';
import { socket } from '@/lib/socket';
import { useToast } from '@/hooks/useToast';

function TreeNode({ node, path, onDelete }: { 
  node: FileNode; 
  path: string;
  onDelete: (path: string) => void;
}) {
  const { selectFile } = useWorkspace();
  const fullPath = `${path}/${node.name}`;

  const handleClick = () => {
    if (node.type === 'file') {
      selectFile(fullPath);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete ${fullPath}?`)) {
      onDelete(fullPath);
    }
  };

  return (
    <div className="ml-4 group">
      <div
        className="flex items-center py-0.5 hover:bg-surface/50 cursor-pointer"
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <FolderIcon className="w-4 h-4 mr-1 text-primary" />
        ) : (
          <DocumentIcon className="w-4 h-4 mr-1 text-gray-400" />
        )}
        <span className="flex-1">{node.name}</span>
        {node.type === 'file' && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-all"
            title="Delete file"
          >
            <TrashIcon className="w-3 h-3 text-red-400" />
          </button>
        )}
      </div>
      {node.type === 'directory' && node.children?.map((c) => (
        <TreeNode key={c.name} node={c} path={fullPath} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function Explorer() {
  const { tree, refreshTree, currentFile, selectFile, deleteFile } = useWorkspace();
  const { success, error } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshTree();
    // live updates
    socket.on('workspace:fileChanged', () => {
      setIsRefreshing(true);
      setTimeout(() => refreshTree().then(() => setIsRefreshing(false)), 100);
    });
    socket.on('workspace:fileDeleted', () => {
      setIsRefreshing(true);
      setTimeout(() => refreshTree().then(() => setIsRefreshing(false)), 100);
    });
    return () => {
      socket.off('workspace:fileChanged');
      socket.off('workspace:fileDeleted');
    };
  }, []);

  const createFile = async () => {
    const name = prompt('New file (relative to workspace, e.g. src/app.tsx):');
    if (!name) return;
    
    try {
      await socket.emitWithAck('workspace:write', { path: name, content: '' });
      success(`Created file: ${name}`);
      refreshTree();
    } catch (err) {
      error(`Failed to create file: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await deleteFile(path);
      success(`Deleted: ${path}`);
      if (currentFile === path) {
        selectFile('');
      }
    } catch (err) {
      error(`Failed to delete file: ${(err as Error).message}`);
    }
  };

  return (
    <aside className="w-64 bg-overlay text-gray-100 p-2 flex flex-col border-r border-surface/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">📁 Explorer</h3>
        <button 
          onClick={createFile} 
          title="New file"
          className="hover:bg-surface/50 p-1 rounded"
        >
          <PlusIcon className="w-5 h-5 text-primary" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            {isRefreshing ? 'Loading...' : 'No files yet. Click + to create one.'}
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode key={node.name} node={node} path="" onDelete={handleDelete} />
          ))
        )}
      </div>
    </aside>
  );
}