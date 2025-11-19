import { useState, useRef, useCallback } from 'react';
import { 
  FolderIcon, 
  DocumentIcon, 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  FolderPlusIcon,
  DocumentPlusIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useWorkspace } from '@/hooks/useWorkspace';
import { FileNode } from '@/types';
import { useToast } from '@/hooks/useToast';

// Validation helpers
const validateFileName = (name: string): string | null => {
  if (!name.trim()) return 'File name cannot be empty';
  if (name.includes('/')) return 'File name cannot contain slashes';
  if (name.includes('\\')) return 'File name cannot contain backslashes';
  if (name.includes('..')) return 'File name cannot contain double dots';
  if (name.includes(':')) return 'File name cannot contain colons';
  if (name.includes('*')) return 'File name cannot contain asterisks';
  if (name.includes('?')) return 'File name cannot contain question marks';
  if (name.includes('"')) return 'File name cannot contain quotes';
  if (name.includes('<')) return 'File name cannot contain angle brackets';
  if (name.includes('>')) return 'File name cannot contain angle brackets';
  if (name.includes('|')) return 'File name cannot contain pipes';
  return null;
};

interface ContextMenuProps {
  x: number;
  y: number;
  path: string;
  type: 'file' | 'directory';
  onClose: () => void;
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
  onCreateFile: (path: string) => void;
  onCreateDirectory: (path: string) => void;
}

function ContextMenu({ 
  x, y, path, type, onClose, onRename, onDelete, onCreateFile, onCreateDirectory 
}: ContextMenuProps) {
  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed bg-surface border border-surface/30 rounded-lg shadow-lg z-50 py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={handleClickOutside}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCreateFile(path);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-surface/50 flex items-center gap-2"
      >
        <DocumentPlusIcon className="w-4 h-4" />
        New File
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCreateDirectory(path);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-surface/50 flex items-center gap-2"
      >
        <FolderPlusIcon className="w-4 h-4" />
        New Folder
      </button>
      
      <div className="border-t border-surface/30 my-1" />
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename(path);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-surface/50 flex items-center gap-2"
      >
        <PencilIcon className="w-4 h-4" />
        Rename
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(path);
          onClose();
        }}
        className="w-full px-3 py-1.5 text-left hover:bg-red-600/20 text-red-400 flex items-center gap-2"
      >
        <TrashIcon className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}

interface EditableNameProps {
  value: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
  type: 'file' | 'directory';
}

function EditableName({ value, onSave, onCancel, type }: EditableNameProps) {
  const [name, setName] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const validationError = validateFileName(name);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (name.trim() === value) {
      onCancel();
      return;
    }
    
    onSave(name.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex-1 flex items-center gap-1">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        className="bg-overlay border border-primary/50 rounded px-1 py-0.5 text-sm flex-1"
        autoFocus
      />
      {error && (
        <span className="text-xs text-red-400 absolute top-full left-0 z-10 bg-overlay p-1 rounded border border-red-500/50">
          {error}
        </span>
      )}
    </div>
  );
}

interface TreeNodeProps {
  node: FileNode;
  path: string;
  level: number;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onCreateFile: (path: string) => void;
  onCreateDirectory: (path: string) => void;
  onSelectFile: (path: string) => void;
}

function TreeNode({ 
  node, 
  path, 
  level, 
  onDelete, 
  onRename, 
  onCreateFile, 
  onCreateDirectory, 
  onSelectFile 
}: TreeNodeProps) {
  const { currentFile, selectFile, refreshTree } = useWorkspace();
  const { success, error } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  
  const fullPath = path ? `${path}/${node.name}` : node.name;
  const isSelected = currentFile === fullPath;

  const handleClick = () => {
    if (node.type === 'file') {
      onSelectFile(fullPath);
    } else {
      setExpanded(!expanded);
    }
  };

  const handleRename = useCallback(async (newName: string) => {
    try {
      const newPath = path ? `${path}/${newName}` : newName;
      await onRename(fullPath, newPath);
      success(`Renamed to: ${newName}`);
      await refreshTree();
    } catch (err) {
      error(`Failed to rename: ${(err as Error).message}`);
    }
  }, [fullPath, path, onRename, success, error, refreshTree]);

  const handleDelete = async () => {
    if (confirm(`Delete ${node.name}?`)) {
      try {
        await onDelete(fullPath);
        success(`Deleted: ${node.name}`);
        if (isSelected) {
          selectFile('');
        }
        await refreshTree();
      } catch (err) {
        error(`Failed to delete: ${(err as Error).message}`);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreateFile = async (targetPath: string) => {
    const name = prompt('Enter file name:');
    if (!name) return;

    const validationError = validateFileName(name);
    if (validationError) {
      error(validationError);
      return;
    }

    const newPath = targetPath ? `${targetPath}/${name}` : name;
    try {
      await onCreateFile(newPath);
      success(`Created file: ${name}`);
      await refreshTree();
    } catch (err) {
      error(`Failed to create file: ${(err as Error).message}`);
    }
  };

  const handleCreateDirectory = async (targetPath: string) => {
    const name = prompt('Enter folder name:');
    if (!name) return;

    const validationError = validateFileName(name);
    if (validationError) {
      error(validationError);
      return;
    }

    const newPath = targetPath ? `${targetPath}/${name}` : name;
    try {
      await onCreateDirectory(newPath);
      success(`Created folder: ${name}`);
      await refreshTree();
    } catch (err) {
      error(`Failed to create folder: ${(err as Error).message}`);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-0.5 hover:bg-surface/50 cursor-pointer group relative ${
          isSelected ? 'bg-primary/20 text-primary' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={() => node.type === 'file' && setIsEditing(true)}
      >
        {node.type === 'directory' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 mr-1 flex items-center justify-center"
          >
            <ArrowPathIcon 
              className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <div className="w-4 h-4 mr-1" />
        )}

        <div className="flex items-center flex-1">
          {node.type === 'directory' ? (
            <FolderIcon className="w-4 h-4 mr-1 text-primary" />
          ) : (
            <DocumentIcon className="w-4 h-4 mr-1 text-gray-400" />
          )}
          
          {isEditing ? (
            <EditableName
              value={node.name}
              onSave={(newName) => {
                setIsEditing(false);
                if (newName !== node.name) {
                  handleRename(newName);
                }
              }}
              onCancel={() => setIsEditing(false)}
              type={node.type}
            />
          ) : (
            <span className="flex-1 truncate">{node.name}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 hover:bg-surface/50 rounded transition-colors"
            title="Rename"
          >
            <PencilIcon className="w-3 h-3 text-gray-400" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (node.type === 'file') {
                handleDelete();
              } else {
                handleCreateDirectory(fullPath);
              }
            }}
            className="p-1 hover:bg-red-600/20 rounded transition-colors"
            title={node.type === 'file' ? 'Delete' : 'New Folder'}
          >
            {node.type === 'file' ? (
              <TrashIcon className="w-3 h-3 text-red-400" />
            ) : (
              <FolderPlusIcon className="w-3 h-3 text-primary" />
            )}
          </button>
          
          <button
            className="p-1 hover:bg-surface/50 rounded transition-colors"
            title="More actions"
          >
            <EllipsisVerticalIcon className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          path={fullPath}
          type={node.type}
          onClose={() => setContextMenu(null)}
          onRename={(path) => {
            setIsEditing(true);
            setContextMenu(null);
          }}
          onDelete={handleDelete}
          onCreateFile={handleCreateFile}
          onCreateDirectory={handleCreateDirectory}
        />
      )}
    </div>
  );
}

export default function Explorer() {
  const { 
    tree, 
    refreshTree, 
    currentFile, 
    selectFile, 
    deleteFile, 
    createFile, 
    createDirectory, 
    renameFile,
    loading 
  } = useWorkspace();
  const { success, error } = useToast();
  const [creatingType, setCreatingType] = useState<'file' | 'directory' | null>(null);

  const handleCreateRootItem = async (type: 'file' | 'directory') => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    const validationError = validateFileName(name);
    if (validationError) {
      error(validationError);
      return;
    }

    try {
      if (type === 'file') {
        await createFile(name);
        success(`Created file: ${name}`);
      } else {
        await createDirectory(name);
        success(`Created folder: ${name}`);
      }
      await refreshTree();
    } catch (err) {
      error(`Failed to create ${type}: ${(err as Error).message}`);
    } finally {
      setCreatingType(null);
    }
  };

  const handleCreateRootFile = () => handleCreateRootItem('file');
  const handleCreateRootDirectory = () => handleCreateRootItem('directory');
  const handleCreateRootDirectory = () => handleCreateRootItem('directory');

  return (
    <aside className="w-64 bg-overlay text-gray-100 p-2 flex flex-col border-r border-surface/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">📁 Explorer</h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleCreateRootFile}
            title="New file"
            className="hover:bg-surface/50 p-1 rounded transition-colors"
          >
            <DocumentPlusIcon className="w-4 h-4 text-primary" />
          </button>
          <button 
            onClick={() => handleCreateRootDirectory()}
            title="New folder"
            className="hover:bg-surface/50 p-1 rounded transition-colors"
          >
            <FolderPlusIcon className="w-4 h-4 text-primary" />
          </button>
          <button 
            onClick={refreshTree}
            disabled={loading}
            title="Refresh"
            className="hover:bg-surface/50 p-1 rounded transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-4">
            <ArrowPathIcon className="w-5 h-5 mx-auto mb-2 animate-spin" />
            Loading files...
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="text-sm">
              No files yet.
            </div>
            <div className="mt-2 flex gap-2 justify-center">
              <button
                onClick={handleCreateRootFile}
                className="px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded text-xs flex items-center gap-1"
              >
                <DocumentPlusIcon className="w-3 h-3" />
                New File
              </button>
              <button
                onClick={() => handleCreateRootDirectory()}
                className="px-2 py-1 bg-primary/20 hover:bg-primary/30 rounded text-xs flex items-center gap-1"
              >
                <FolderPlusIcon className="w-3 h-3" />
                New Folder
              </button>
            </div>
          </div>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={node.name}
              node={node}
              path=""
              level={0}
              onDelete={deleteFile}
              onRename={renameFile}
              onCreateFile={createFile}
              onCreateDirectory={createDirectory}
              onSelectFile={selectFile}
            />
          ))
        )}
      </div>
    </aside>
  );
}