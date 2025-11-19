import { useEffect } from 'react';

interface Hotkey {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const hotkey of hotkeys) {
        const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase();
        const ctrlMatch = !!event.ctrlKey === !!hotkey.ctrl;
        const shiftMatch = !!event.shiftKey === !!hotkey.shift;
        const altMatch = !!event.altKey === !!hotkey.alt;
        const metaMatch = !!event.metaKey === !!hotkey.meta;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          hotkey.handler();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys]);
}