import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { autocomplete } from '@codemirror/autocomplete';
import { useAI } from '@/hooks/useAI';
import { useWorkspace } from '@/hooks/useWorkspace';
import { CompletionRequest } from '@/types';

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentFile, loadFile, saveFile } = useWorkspace();
  const { requestCompletion } = useAI();
  const [provider, setProvider] = useState<'codestral' | 'chatgpt-oss' | 'dkimi'>('codestral');

  // Load file content whenever the selected file changes
  const [doc, setDoc] = useState('// Select a file from the Explorer');

  useEffect(() => {
    if (!currentFile) return;
    loadFile(currentFile).then((content) => setDoc(content ?? ''));
  }, [currentFile, loadFile]);

  // Initialise CodeMirror once
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
                options: [{ label: result.completion, apply: result.completion }],
              };
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

    return () => view.destroy();
  }, [containerRef, provider]);

  // Debounced auto‑save
  const debounceSave = (() => {
    let timer: NodeJS.Timeout;
    return (path: string, content: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => saveFile(path, content), 1000);
    };
  })();

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full" ref={containerRef} />
    </div>
  );
}