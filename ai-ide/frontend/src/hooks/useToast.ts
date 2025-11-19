import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => 
    showToast(message, 'success', duration), [showToast]);

  const error = useCallback((message: string, duration?: number) => 
    showToast(message, 'error', duration), [showToast]);

  const info = useCallback((message: string, duration?: number) => 
    showToast(message, 'info', duration), [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
  };
}