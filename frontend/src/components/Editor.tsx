import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, Decoration } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { go } from '@codemirror/lang-go';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { autocomplete } from '@codemirror/autocomplete';
import { 
  XMarkIcon, 
  PinIcon, 
  DocumentIcon,
  CircleStackIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAI } from '@/hooks/useAI';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useToast } from '@/hooks/useToast';
import { CompletionRequest } from '@/types';
import classNames from 'classnames';

interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isModified: boolean;
  isPinned: boolean;
  language: string;
  isLoading: boolean;
}

interface EditorTabProps {
  tab: Tab;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSave: (id: string) => void;
}

function EditorTab({ tab, isActive, onSelect, onClose, onTogglePin, onSave }: EditorTabProps) {
  const handleDoubleClick = () => {
    onTogglePin(tab.id);
  };

  return (
    <div
      className={classNames(
        'flex items-center gap-2 px-3 py-2 border-r border-surface/30 cursor-pointer group relative min-w-0 max-w-xs',
        isActive ? 'bg-overlay border-b-2 border-b-primary' : 'bg-surface/50 hover:bg-surface/70'
      )}
      onClick={() => onSelect(tab.id)}
      onDoubleClick={handleDoubleClick}
      title={tab.path}
    >
      <DocumentIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      
      <span className="truncate text-sm">{tab.name}</span>
      
      {tab.isModified && (
        <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" title="Unsaved changes" />
      )}
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {tab.isLoading && (
          <ArrowDownTrayIcon className="w-3 h-3 text-gray-400 animate-spin" />
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(tab.id);
          }}
          className="p-0.5 hover:bg-green-600/20 rounded"
          title="Save"
          disabled={!tab.isModified}
        >
          <ArrowDownTrayIcon className="w-3 h-3 text-green-400" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(tab.id);
          }}
          className={classNames(
            'p-0.5 rounded transition-colors',
            tab.isPinned ? 'text-primary' : 'text-gray-400 hover:text-primary'
          )}
          title={tab.isPinned ? 'Unpin' : 'Pin'}
        >
          <PinIcon className="w-3 h-3" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(tab.id);
          }}
          className="p-0.5 hover:bg-red-600/20 rounded"
          title="Close"
        >
          <XMarkIcon className="w-3 h-3 text-red-400" />
        </button>
      </div>
    </div>
  );
}

interface EditorTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSaveTab: (id: string) => void;
  onCloseAll: () => void;
  onCloseOthers: (id: string) => void;
}

function EditorTabs({ 
  tabs, 
  activeTabId, 
  onSelectTab, 
  onCloseTab, 
  onTogglePin, 
  onSaveTab,
  onCloseAll,
  onCloseOthers 
}: EditorTabsProps) {
  const [showCloseAll, setShowCloseAll] = useState(false);

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    const contextMenu = document.createElement('div');
    contextMenu.className = 'fixed bg-surface border border-surface/30 rounded-lg shadow-lg z-50 py-1 min-w-[120px]';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    
    contextMenu.innerHTML = `
      <button class="w-full px-3 py-1.5 text-left hover:bg-surface/50" data-action="save">Save</button>
      <button class="w-full px-3 py-1.5 text-left hover:bg-surface/50" data-action="close-others">Close Others</button>
      <button class="w-full px-3 py-1.5 text-left hover:bg-surface/50" data-action="close-all">Close All</button>
    `;
    
    document.body.appendChild(contextMenu);
    
    const handleClick = (e: MouseEvent) => {
      const action = (e.target as HTMLElement).dataset.action;
      if (action === 'save') onSaveTab(tabId);
      if (action === 'close-others') onCloseOthers(tabId);
      if (action === 'close-all') onCloseAll();
      
      document.body.removeChild(contextMenu);
      document.removeEventListener('click', handleClick);
    };
    
    setTimeout(() => document.addEventListener('click', handleClick), 0);
  };

  const pinnedTabs = tabs.filter(tab => tab.isPinned);
  const unpinnedTabs = tabs.filter(tab => !tab.isPinned);

  return (
    <div className="flex items-center border-b border-surface/30 bg-surface/20">
      <div className="flex flex-1 overflow-x-auto">
        {/* Pinned tabs first */}
        {pinnedTabs.map(tab => (
          <EditorTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={onSelectTab}
            onClose={onCloseTab}
            onTogglePin={onTogglePin}
            onSave={onSaveTab}
          />
        ))}
        
        {/* Pinned tab separator */}
        {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
          <div className="w-px h-6 bg-surface/30 mx-1" />
        )}
        
        {/* Unpinned tabs */}
        {unpinnedTabs.map(tab => (
          <div key={tab.id} onContextMenu={(e) => handleContextMenu(e, tab.id)}>
            <EditorTab
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={onSelectTab}
              onClose={onCloseTab}
              onTogglePin={onTogglePin}
              onSave={onSaveTab}
            />
          </div>
        ))}
      </div>
      
      {/* Tab management actions */}
      {tabs.length > 1 && (
        <div className="flex items-center px-2 border-l border-surface/30">
          <button
            onClick={() => setShowCloseAll(!showCloseAll)}
            className="p-1 hover:bg-surface/50 rounded text-gray-400"
            title="Tab actions"
          >
            <CircleStackIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentFile, loadFile, saveFile } = useWorkspace();
  const { requestCompletion } = useAI();
  const { error } = useToast();
  const [provider, setProvider] = useState<'codestral' | 'chatgpt-oss' | 'dkimi'>('codestral');
  const [isCompleting, setIsCompleting] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Auto-load file when selected in explorer
  useEffect(() => {
    if (!currentFile) return;
    
    // Check if file is already open
    const existingTab = tabs.find(tab => tab.path === currentFile);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }
    
    // Create new tab
    const fileName = currentFile.split('/').pop() || currentFile;
    const language = getLanguageFromExtension(fileName);
    const newTab: Tab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      path: currentFile,
      name: fileName,
      content: '',
      originalContent: '',
      isModified: false,
      isPinned: false,
      language,
      isLoading: true
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    
    // Load file content
    loadFile(currentFile)
      .then(content => {
        setTabs(prev => prev.map(tab => 
          tab.id === newTab.id 
            ? { ...tab, content, originalContent: content, isLoading: false }
            : tab
        ));
      })
      .catch(err => {
        error(`Failed to load file: ${err.message}`);
        setTabs(prev => prev.filter(tab => tab.id !== newTab.id));
      });
  }, [currentFile, loadFile, error]);

  // Update active tab content when file is selected
  useEffect(() => {
    if (!activeTabId || !currentFile) return;
    
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab || activeTab.path !== currentFile) return;
    
    loadFile(currentFile)
      .then(content => {
        setTabs(prev => prev.map(tab => 
          tab.id === activeTabId 
            ? { ...tab, content, originalContent: content, isLoading: false }
            : tab
        ));
      })
      .catch(err => {
        error(`Failed to load file: ${err.message}`);
      });
  }, [activeTabId, currentFile, loadFile, error, tabs]);

  // Tab management functions
  const handleSelectTab = useCallback((id: string) => {
    setActiveTabId(id);
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      // Update current file selection
      window.dispatchEvent(new CustomEvent('select-file', { detail: tab.path }));
    }
  }, [tabs]);

  const handleCloseTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    
    if (tab.isModified) {
      const shouldSave = confirm(`"${tab.name}" has unsaved changes. Save before closing?`);
      if (shouldSave) {
        saveFile(tab.path, tab.content).catch(err => {
          error(`Failed to save: ${err.message}`);
          return;
        });
      }
    }
    
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id) {
      const remainingTabs = tabs.filter(t => t.id !== id);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
    }
  }, [tabs, activeTabId, saveFile, error]);

  const handleTogglePin = useCallback((id: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === id ? { ...tab, isPinned: !tab.isPinned } : tab
    ));
  }, []);

  const handleSaveTab = useCallback(async (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    
    try {
      await saveFile(tab.path, tab.content);
      setTabs(prev => prev.map(t => 
        t.id === id 
          ? { ...t, originalContent: t.content, isModified: false }
          : t
      ));
    } catch (err) {
      error(`Failed to save: ${(err as Error).message}`);
    }
  }, [tabs, saveFile, error]);

  const handleSaveAll = useCallback(async () => {
    const modifiedTabs = tabs.filter(tab => tab.isModified);
    for (const tab of modifiedTabs) {
      try {
        await saveFile(tab.path, tab.content);
      } catch (err) {
        error(`Failed to save ${tab.name}: ${(err as Error).message}`);
      }
    }
    
    setTabs(prev => prev.map(tab => ({
      ...tab,
      originalContent: tab.content,
      isModified: false
    })));
  }, [tabs, saveFile, error]);

  const handleCloseAll = useCallback(() => {
    const modifiedTabs = tabs.filter(tab => tab.isModified);
    if (modifiedTabs.length > 0) {
      const shouldSave = confirm(`${modifiedTabs.length} file(s) have unsaved changes. Save all before closing?`);
      if (shouldSave) {
        handleSaveAll();
      }
    }
    setTabs([]);
    setActiveTabId(null);
  }, [tabs, handleSaveAll]);

  const handleCloseOthers = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;
    
    const otherTabs = tabs.filter(t => t.id !== id);
    const modifiedTabs = otherTabs.filter(tab => tab.isModified);
    
    if (modifiedTabs.length > 0) {
      const shouldSave = confirm(`${modifiedTabs.length} file(s) have unsaved changes. Save all before closing?`);
      if (shouldSave) {
        otherTabs.filter(tab => tab.isModified).forEach(tab => {
          saveFile(tab.path, tab.content).catch(err => {
            error(`Failed to save ${tab.name}: ${err.message}`);
          });
        });
      }
    }
    
    setTabs([tab]);
    setActiveTabId(id);
  }, [tabs, saveFile, error]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          if (activeTabId) {
            handleSaveTab(activeTabId);
          }
        } else if (e.key === 'w') {
          e.preventDefault();
          if (activeTabId) {
            handleCloseTab(activeTabId);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, handleSaveTab, handleCloseTab]);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

  // Initialize CodeMirror
  useEffect(() => {
    if (!containerRef.current || !activeTab) return;
    
    const getLanguageExtension = (language: string) => {
      switch (language) {
        case 'javascript':
        case 'typescript':
        case 'jsx':
        case 'tsx':
          return javascript({ jsx: true, typescript: language === 'typescript' });
        case 'python':
        case 'py':
          return python();
        case 'go':
          return go();
        default:
          return [];
      }
    };

    const startState = EditorState.create({
      doc: activeTab.content,
      extensions: [
        ...getLanguageExtension(activeTab.language),
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
                    prompt: `${prefix}${suffix}`,
                    language: activeTab.language,
                  } as CompletionRequest,
                  provider
                );
                return {
                  from: context.pos,
                  options: [{ 
                    label: result.completion || result.text, 
                    apply: result.completion || result.text 
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
            const newContent = v.state.doc.toString();
            setTabs(prev => prev.map(tab => 
              tab.id === activeTabId
                ? { ...tab, content: newContent, isModified: newContent !== tab.originalContent }
                : tab
            ));
          }
        }),
        EditorView.theme({
          '&': {
            backgroundColor: 'transparent',
            color: 'inherit',
          },
          '.cm-content': {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '14px',
          },
          '.cm-focused': {
            outline: 'none',
          },
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
  }, [activeTabId, provider, isCompleting, error, requestCompletion]);

  if (!activeTab) {
    return (
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-overlay">
        <div className="text-center text-gray-500">
          <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium mb-2">No file selected</h3>
          <p className="text-sm">Select a file from the Explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <EditorTabs
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onTogglePin={handleTogglePin}
        onSaveTab={handleSaveTab}
        onCloseAll={handleCloseAll}
        onCloseOthers={handleCloseOthers}
      />
      
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full" ref={containerRef} />
        <div className="absolute bottom-2 left-2 flex items-center gap-4 text-xs text-gray-500">
          <span>{activeTab.language}</span>
          {activeTab.isModified && (
            <span className="text-yellow-400">● Unsaved</span>
          )}
          <span>{tabs.length} tab{tabs.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine language from file extension
function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'md':
      return 'markdown';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'xml':
      return 'xml';
    default:
      return 'text';
  }
}