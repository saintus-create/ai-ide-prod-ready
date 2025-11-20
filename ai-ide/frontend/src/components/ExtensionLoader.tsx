/**
 * Extension Loader Component
 * Handles extension loading, hot-reloading, and management on the frontend
 */

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Extension } from '../types/extension';

interface ExtensionLoaderProps {
  onExtensionLoad?: (extension: Extension) => void;
  onExtensionError?: (error: string) => void;
  workspaceId?: string;
}

interface ExtensionInstallOptions {
  manifest: string;
  source?: 'local' | 'marketplace' | 'url';
  config?: Record<string, any>;
}

export const ExtensionLoader: React.FC<ExtensionLoaderProps> = ({
  onExtensionLoad,
  onExtensionError,
  workspaceId = 'default'
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installedExtensions, setInstalledExtensions] = useState<Set<string>>(new Set());

  // Initialize WebSocket connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    const newSocket = io(wsUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Extension Loader: Connected to server');
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Extension Loader: Disconnected from server');
    });

    // Extension events
    newSocket.on('extension:loaded', (data: any) => {
      const extension: Extension = {
        id: data.id,
        name: data.name,
        manifest: data.manifest,
        state: data.state,
        installedAt: new Date(data.installedAt),
        lastActivated: data.lastActivated ? new Date(data.lastActivated) : undefined,
        error: data.error,
        config: data.config || {}
      };
      
      setExtensions(prev => {
        const existing = prev.find(ext => ext.id === extension.id);
        if (existing) {
          return prev.map(ext => ext.id === extension.id ? extension : ext);
        }
        return [...prev, extension];
      });

      if (onExtensionLoad) {
        onExtensionLoad(extension);
      }
    });

    newSocket.on('extension:error', (data: { extensionId: string; error: string }) => {
      console.error(`Extension ${data.extensionId} error:`, data.error);
      setError(`Extension Error: ${data.error}`);
      
      if (onExtensionError) {
        onExtensionError(data.error);
      }
    });

    newSocket.on('extension:activated', (data: { extensionId: string; name: string }) => {
      setExtensions(prev => prev.map(ext => 
        ext.id === data.extensionId ? { ...ext, state: 'active' as const } : ext
      ));
    });

    newSocket.on('extension:deactivated', (data: { extensionId: string; name: string }) => {
      setExtensions(prev => prev.map(ext => 
        ext.id === data.extensionId ? { ...ext, state: 'inactive' as const } : ext
      ));
    });

    newSocket.on('extension:installed', (data: { extensionId: string; name: string }) => {
      setInstalledExtensions(prev => new Set([...prev, data.name]));
    });

    newSocket.on('extension:uninstalled', (data: { extensionId: string; name: string }) => {
      setInstalledExtensions(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.name);
        return newSet;
      });
      setExtensions(prev => prev.filter(ext => ext.id !== data.extensionId));
    });

    // Request initial extensions list
    newSocket.emit('extension:list');

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [workspaceId, onExtensionLoad, onExtensionError]);

  // Install extension
  const installExtension = useCallback(async (options: ExtensionInstallOptions): Promise<boolean> => {
    if (!socket) {
      setError('Extension Loader: Not connected to server');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      return new Promise<boolean>((resolve, reject) => {
        socket.emit('extension:install', {
          workspaceId,
          manifest: options.manifest,
          source: options.source || 'local',
          config: options.config
        });

        const timeout = setTimeout(() => {
          reject(new Error('Extension installation timeout'));
        }, 30000); // 30 second timeout

        socket.once('extension:install:response', (response: { success: boolean; error?: string; extensionId?: string }) => {
          clearTimeout(timeout);
          
          if (response.success) {
            resolve(true);
          } else {
            setError(response.error || 'Unknown installation error');
            reject(new Error(response.error || 'Installation failed'));
          }
        });

        socket.once('install:error', (error: string) => {
          clearTimeout(timeout);
          setError(error);
          reject(new Error(error));
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Installation failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [socket, workspaceId]);

  // Uninstall extension
  const uninstallExtension = useCallback(async (extensionName: string): Promise<boolean> => {
    if (!socket) {
      setError('Extension Loader: Not connected to server');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      return new Promise<boolean>((resolve, reject) => {
        socket.emit('extension:uninstall', {
          workspaceId,
          extensionName
        });

        const timeout = setTimeout(() => {
          reject(new Error('Extension uninstallation timeout'));
        }, 10000);

        socket.once('extension:uninstall:response', (response: { success: boolean; error?: string }) => {
          clearTimeout(timeout);
          
          if (response.success) {
            resolve(true);
          } else {
            setError(response.error || 'Unknown uninstallation error');
            reject(new Error(response.error || 'Uninstallation failed'));
          }
        });

        socket.once('uninstall:error', (error: string) => {
          clearTimeout(timeout);
          setError(error);
          reject(new Error(error));
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Uninstallation failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [socket, workspaceId]);

  // Activate extension
  const activateExtension = useCallback(async (extensionName: string): Promise<boolean> => {
    if (!socket) {
      setError('Extension Loader: Not connected to server');
      return false;
    }

    try {
      return new Promise<boolean>((resolve, reject) => {
        socket.emit('extension:activate', {
          workspaceId,
          extensionName
        });

        const timeout = setTimeout(() => {
          reject(new Error('Extension activation timeout'));
        }, 10000);

        socket.once('extension:activate:response', (response: { success: boolean; error?: string }) => {
          clearTimeout(timeout);
          
          if (response.success) {
            resolve(true);
          } else {
            setError(response.error || 'Unknown activation error');
            reject(new Error(response.error || 'Activation failed'));
          }
        });

        socket.once('activate:error', (error: string) => {
          clearTimeout(timeout);
          setError(error);
          reject(new Error(error));
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Activation failed';
      setError(errorMessage);
      return false;
    }
  }, [socket, workspaceId]);

  // Deactivate extension
  const deactivateExtension = useCallback(async (extensionName: string): Promise<boolean> => {
    if (!socket) {
      setError('Extension Loader: Not connected to server');
      return false;
    }

    try {
      return new Promise<boolean>((resolve, reject) => {
        socket.emit('extension:deactivate', {
          workspaceId,
          extensionName
        });

        const timeout = setTimeout(() => {
          reject(new Error('Extension deactivation timeout'));
        }, 10000);

        socket.once('extension:deactivate:response', (response: { success: boolean; error?: string }) => {
          clearTimeout(timeout);
          
          if (response.success) {
            resolve(true);
          } else {
            setError(response.error || 'Unknown deactivation error');
            reject(new Error(response.error || 'Deactivation failed'));
          }
        });

        socket.once('deactivate:error', (error: string) => {
          clearTimeout(timeout);
          setError(error);
          reject(new Error(error));
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Deactivation failed';
      setError(errorMessage);
      return false;
    }
  }, [socket, workspaceId]);

  // Hot reload extension (for development)
  const hotReloadExtension = useCallback(async (extensionName: string): Promise<boolean> => {
    if (!socket) {
      setError('Extension Loader: Not connected to server');
      return false;
    }

    try {
      socket.emit('extension:reload', {
        workspaceId,
        extensionName
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Hot reload failed';
      setError(errorMessage);
      return false;
    }
  }, [socket, workspaceId]);

  // Reload all extensions
  const reloadAllExtensions = useCallback(async (): Promise<void> => {
    if (!socket) {
      setError('Extension Loader: Not connected to server');
      return;
    }

    try {
      socket.emit('extension:reloadAll', { workspaceId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Reload failed';
      setError(errorMessage);
    }
  }, [socket, workspaceId]);

  // Get extension by name
  const getExtension = useCallback((name: string): Extension | undefined => {
    return extensions.find(ext => ext.name === name);
  }, [extensions]);

  // Check if extension is installed
  const isExtensionInstalled = useCallback((name: string): boolean => {
    return installedExtensions.has(name);
  }, [installedExtensions]);

  // Check if extension is active
  const isExtensionActive = useCallback((name: string): boolean => {
    const extension = getExtension(name);
    return extension?.state === 'active';
  }, [getExtension]);

  // Get active extensions
  const getActiveExtensions = useCallback((): Extension[] => {
    return extensions.filter(ext => ext.state === 'active');
  }, [extensions]);

  // Get extensions with errors
  const getExtensionsWithErrors = useCallback((): Extension[] => {
    return extensions.filter(ext => ext.state === 'error' || ext.error);
  }, [extensions]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    extensions,
    loading,
    error,
    isConnected: socket?.connected ?? false,
    
    // Installation/Uninstallation
    installExtension,
    uninstallExtension,
    
    // Activation/Deactivation
    activateExtension,
    deactivateExtension,
    
    // Development
    hotReloadExtension,
    reloadAllExtensions,
    
    // Utilities
    getExtension,
    isExtensionInstalled,
    isExtensionActive,
    getActiveExtensions,
    getExtensionsWithErrors,
    
    // Error handling
    clearError
  };
};

// Hook for using extension loader in components
export const useExtensionLoader = (workspaceId?: string) => {
  const [extensionLoader, setExtensionLoader] = useState<ReturnType<typeof ExtensionLoader> | null>(null);

  useEffect(() => {
    const loader = ExtensionLoader({
      onExtensionLoad: (extension) => {
        console.log('Extension loaded:', extension.name);
      },
      onExtensionError: (error) => {
        console.error('Extension error:', error);
      },
      workspaceId
    });

    setExtensionLoader(loader);
  }, [workspaceId]);

  return extensionLoader;
};

// Hook for managing specific extensions
export const useExtension = (extensionName: string) => {
  const loader = useExtensionLoader();
  
  const extension = loader?.getExtension(extensionName);
  const isInstalled = loader?.isExtensionInstalled(extensionName);
  const isActive = loader?.isExtensionActive(extensionName);

  const activate = loader ? () => loader.activateExtension(extensionName) : undefined;
  const deactivate = loader ? () => loader.deactivateExtension(extensionName) : undefined;
  const hotReload = loader ? () => loader.hotReloadExtension(extensionName) : undefined;

  return {
    extension,
    isInstalled,
    isActive,
    activate,
    deactivate,
    hotReload
  };
};