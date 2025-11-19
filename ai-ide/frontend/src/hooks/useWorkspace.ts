import { useState, useCallback } from 'react';
import { socket } from '@/lib/socket';
import { FileNode } from '@/types';

export function useWorkspace() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);

  const refreshTree = async () => {
    const data = await socket.emitWithAck('workspace:getTree', {});
    setTree(data);
  };

  const loadFile = useCallback(async (rel: string) => {
    const resp = await socket.emitWithAck('workspace:read', rel);
    if (!resp.ok) throw new Error(resp.error);
    return resp.content as string;
  }, []);

  const saveFile = useCallback(async (rel: string, content: string) => {
    const resp = await socket.emitWithAck('workspace:write', { path: rel, content });
    if (!resp.ok) throw new Error(resp.error);
  }, []);

  const deleteFile = useCallback(async (rel: string) => {
    const resp = await socket.emitWithAck('workspace:delete', rel);
    if (!resp.ok) throw new Error(resp.error);
  }, []);

  const selectFile = (path: string) => setCurrentFile(path);

  return {
    currentFile,
    selectFile,
    tree,
    refreshTree,
    loadFile,
    saveFile,
    deleteFile,
  };
}