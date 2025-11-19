import { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { autocomplete } from '@codemirror/autocomplete';
import { useAI } from '@/hooks/useAI';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import { CompletionRequest } from '@/types';

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentFile, loadFile, saveFile } = useWorkspace();
  const { requestCompletion } = useAI();
  const { error } = useToast();
  const [provider, setProvider] = useState<'codestral' | 'chatgpt-oss' | 'dkimi'>('codestral');
  const [isCompleting, setIsCompleting] = useState(false);

  // Load file content whenever the selected file changes
  const [doc, setDoc] = useState('// Select a file from the Explorer');

  useEffect(() => {
    if (!currentFile) return;
    loadFile(currentFile).then((content) => setDoc(content ?? ''));
  }, [currentFile, loadFile]);

  // Handle hotkey completion trigger
  useEffect(() => {
    const handleCompletionTrigger = () => {
      // Trigger completion at cursor position
      const view = (containerRef.current as any)?._codemirrorView;
      if (view) {
        const pos = view.state.selection.main.head;
        const prefix = view.state.doc.sliceString(0, pos);
        const suffix = view.state.doc.sliceString(pos);
        
        requestCompletion(
          {
            prefix,
            suffix,
            language: 'javascript',
          } as CompletionRequest,
          provider
        )
        .then((result) => {
          view.dispatch({
            changes: { from: pos, insert: result.completion },
            selection: { anchor: pos + result.completion.length }
          });
        })
        .catch((err) => {
          error(`Completion failed: ${err.message}`);
        });
      }
    };

    window.addEventListener('trigger-completion', handleCompletionTrigger);
    return () => window.removeEventListener('trigger-completion', handleCompletionTrigger);
  }, [provider, error, requestCompletion]);

  // Initialise CodeMirror
  useEffect(() => {
    if (!containerRef.current) return;
    
    const startState = EditorState.create({
      doc,
      extensions: [
        javascript(),
        keymap.of([...defaultKeymap, indentWithTab]),
        autocomplete({
          override: [
            async (context) => {
              if (isCompleting) return null;
              
              setIsCompleting(true);
              try {
                const prefix = context.state.doc.sliceString(0, context.pos);
                const suffix = context.state.doc.sliceString(context.pos);
                const result = await requestCompletion(
                  {
                    prefix,
                    suffix,
                    language: 'javascript',
                  } as CompletionRequest,
                  provider
                );
                return {
                  from: context.pos,
                  options: [{ 
                    label: result.completion, 
                    apply: result.completion 
                  }],
                };
              } catch (err) {
                error(`Completion failed: ${(err as Error).message}`);
                return null;
              } finally {
                setIsCompleting(false);
              }
            },
          ],
        }),
        EditorView.updateListener.of((v) => {
          if (v.docChanged) {
            const newDoc = v.state.doc.toString();
            setDoc(newDoc);
            // debounce save after 1 s
            if (currentFile) debounceSave(currentFile, newDoc);
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    // Store reference for external access
    (containerRef.current as any)._codemirrorView = view;

    return () => view.destroy();
  }, [containerRef, provider, currentFile, isCompleting, error, requestCompletion, saveFile]);

  // Debounced auto‑save
  const debounceSave = (() => {
    let timer: NodeJS.Timeout;
    return (path: string, content: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => saveFile(path, content), 1000);
    };
  })();

  return (
    <div className="flex-1 overflow-hidden relative">
      <div className="h-full" ref={containerRef} />
      {currentFile && (
        <div className="absolute top-2 left-2 bg-overlay/80 text-gray-300 px-2 py-1 rounded text-xs">
          {currentFile}
        </div>
      )}
    </div>
  );
}