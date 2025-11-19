import { useState, useCallback } from 'react';
import axios from 'axios';
import { FileNode } from '@/types';

const apiUrl = import.meta.env.VITE_API_URL || '';

export function useWorkspace() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/api/workspace/files`);
      setTree(response.data.files || []);
    } catch (error) {
      console.error('Failed to refresh tree:', error);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFile = useCallback(async (path: string): Promise<string> => {
    const response = await axios.get(`${apiUrl}/api/workspace/file`, { 
      params: { path } 
    });
    return response.data.content;
  }, []);

  const saveFile = useCallback(async (path: string, content: string) => {
    await axios.post(`${apiUrl}/api/workspace/file`, { path, content });
  }, []);

  const deleteFile = useCallback(async (path: string) => {
    await axios.delete(`${apiUrl}/api/workspace/file`, { data: { path } });
  }, []);

  const createFile = useCallback(async (path: string, content = '') => {
    await axios.post(`${apiUrl}/api/workspace/file`, { path, content });
  }, []);

  const createDirectory = useCallback(async (path: string) => {
    await axios.post(`${apiUrl}/api/workspace/mkdir`, { path });
  }, []);

  const renameFile = useCallback(async (oldPath: string, newPath: string) => {
    // For now, we'll read, delete, and write
    const content = await loadFile(oldPath);
    await createFile(newPath, content);
    await deleteFile(oldPath);
  }, [loadFile]);

  const selectFile = (path: string) => setCurrentFile(path);

  const getFileStats = useCallback(async (path: string) => {
    const response = await axios.get(`${apiUrl}/api/workspace/file`, { 
      params: { path } 
    });
    return {
      size: response.data.size,
      modified: response.data.modified
    };
  }, []);

  return {
    currentFile,
    selectFile,
    tree,
    loading,
    refreshTree,
    loadFile,
    saveFile,
    deleteFile,
    createFile,
    createDirectory,
    renameFile,
    getFileStats,
  };
}