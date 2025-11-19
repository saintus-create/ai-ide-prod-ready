import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CogIcon, 
  SparklesIcon,
  CodeBracketIcon,
  KeyboardIcon,
  PaletteIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { AIProvider } from '@/hooks/useAI';
import { useToast } from '@/hooks/useToast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  // AI Settings
  defaultAIProvider: AIProvider;
  aiTemperature: number;
  aiMaxTokens: number;
  aiAutoComplete: boolean;
  aiTriggerOnType: boolean;
  
  // Git Settings
  gitAutoCommit: boolean;
  gitCommitMessageTemplate: string;
  gitDefaultBranch: string;
  gitAutoPush: boolean;
  
  // Editor Settings
  fontSize: number;
  tabSize: number;
  autoSave: boolean;
  autoSaveDelay: number;
  showLineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
  
  // Keyboard Settings
  enableHotkeys: boolean;
  customShortcuts: Record<string, string>;
  
  // Theme Settings
  theme: 'light' | 'dark' | 'pure-black';
  sidebarWidth: number;
  fontFamily: string;
}

const defaultSettings: UserSettings = {
  // AI Settings
  defaultAIProvider: 'codestral' as AIProvider,
  aiTemperature: 0.7,
  aiMaxTokens: 100,
  aiAutoComplete: true,
  aiTriggerOnType: true,
  
  // Git Settings
  gitAutoCommit: false,
  gitCommitMessageTemplate: 'feat: {description}',
  gitDefaultBranch: 'main',
  gitAutoPush: false,
  
  // Editor Settings
  fontSize: 14,
  tabSize: 2,
  autoSave: true,
  autoSaveDelay: 1000,
  showLineNumbers: true,
  wordWrap: true,
  minimap: false,
  
  // Keyboard Settings
  enableHotkeys: true,
  customShortcuts: {},
  
  // Theme Settings
  theme: 'pure-black',
  sidebarWidth: 280,
  fontFamily: 'JetBrains Mono'
};

interface SettingsSection {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    name: 'General',
    icon: CogIcon,
    description: 'Basic application settings'
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    icon: SparklesIcon,
    description: 'Configure AI completion and chat'
  },
  {
    id: 'git',
    name: 'Git',
    icon: CodeBracketIcon,
    description: 'Git workflow and automation'
  },
  {
    id: 'editor',
    name: 'Editor',
    icon: CogIcon,
    description: 'Code editor preferences'
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    icon: KeyboardIcon,
    description: 'Hotkeys and shortcuts'
  },
  {
    id: 'theme',
    name: 'Theme',
    icon: PaletteIcon,
    description: 'Appearance and theming'
  }
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ai-ide-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('ai-ide-settings', JSON.stringify(settings));
    setHasUnsavedChanges(false);
    success('Settings saved successfully');
  };

  // Reset settings to defaults
  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      setHasUnsavedChanges(true);
    }
  };

  // Update setting and mark as changed
  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle modal close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const shouldSave = confirm('You have unsaved changes. Save before closing?');
      if (shouldSave) {
        saveSettings();
      }
    }
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveSettings();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasUnsavedChanges]);

  if (!isOpen) return null;

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Startup</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Restore last workspace on startup</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              defaultChecked={true}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Remember open tabs</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              defaultChecked={true}
            />
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Files</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Default workspace path</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
              defaultValue="/workspace"
            />
          </div>
          <label className="flex items-center justify-between">
            <span className="text-sm">Show hidden files</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Provider Configuration</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Default AI Provider</label>
            <select 
              className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
              value={settings.defaultAIProvider}
              onChange={(e) => updateSetting('defaultAIProvider', e.target.value as AIProvider)}
            >
              <option value="codestral">Codestral (Recommended)</option>
              <option value="chatgpt-oss">ChatGPT-OSS</option>
              <option value="dkimi">dKimi (Korean)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Temperature</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.aiTemperature}
                onChange={(e) => updateSetting('aiTemperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-400">{settings.aiTemperature}</span>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Max Tokens</label>
              <input
                type="number"
                min="1"
                max="4000"
                value={settings.aiMaxTokens}
                onChange={(e) => updateSetting('aiMaxTokens', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Completion Behavior</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Enable AI auto-completion</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.aiAutoComplete}
              onChange={(e) => updateSetting('aiAutoComplete', e.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Trigger on type (Ctrl+Space)</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.aiTriggerOnType}
              onChange={(e) => updateSetting('aiTriggerOnType', e.target.checked)}
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderGitSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Git Workflow</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Enable auto-commit on save</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.gitAutoCommit}
              onChange={(e) => updateSetting('gitAutoCommit', e.target.checked)}
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm">Auto-push after commit</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.gitAutoPush}
              onChange={(e) => updateSetting('gitAutoPush', e.target.checked)}
            />
          </label>
          
          <div>
            <label className="block text-sm mb-1">Default branch name</label>
            <input
              type="text"
              value={settings.gitDefaultBranch}
              onChange={(e) => updateSetting('gitDefaultBranch', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Commit message template</label>
            <textarea
              value={settings.gitCommitMessageTemplate}
              onChange={(e) => updateSetting('gitCommitMessageTemplate', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-1">
              Available variables: {'{description}'}, {'{file}'}, {'{date}'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditorSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Editor Behavior</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Enable auto-save</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.autoSave}
              onChange={(e) => updateSetting('autoSave', e.target.checked)}
            />
          </label>
          
          <div>
            <label className="block text-sm mb-1">Auto-save delay (ms)</label>
            <input
              type="number"
              min="500"
              max="10000"
              step="500"
              value={settings.autoSaveDelay}
              onChange={(e) => updateSetting('autoSaveDelay', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Appearance</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Font size</label>
            <input
              type="range"
              min="10"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-400">{settings.fontSize}px</span>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Tab size</label>
            <select
              value={settings.tabSize}
              onChange={(e) => updateSetting('tabSize', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Font family</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => updateSetting('fontFamily', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface/30 rounded text-sm"
            >
              <option value="JetBrains Mono">JetBrains Mono</option>
              <option value="Fira Code">Fira Code</option>
              <option value="Consolas">Consolas</option>
              <option value="Monaco">Monaco</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>
          
          <label className="flex items-center justify-between">
            <span className="text-sm">Show line numbers</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.showLineNumbers}
              onChange={(e) => updateSetting('showLineNumbers', e.target.checked)}
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span className="text-sm">Enable word wrap</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.wordWrap}
              onChange={(e) => updateSetting('wordWrap', e.target.checked)}
            />
          </label>
        </div>
      </div>
    </div>
  );

  const renderKeyboardSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Keyboard Shortcuts</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Enable keyboard shortcuts</span>
            <input
              type="checkbox"
              className="rounded bg-surface border border-surface/30"
              checked={settings.enableHotkeys}
              onChange={(e) => updateSetting('enableHotkeys', e.target.checked)}
            />
          </label>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Available Shortcuts</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>Save current file</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+S</kbd>
          </div>
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>Save all files</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+Shift+S</kbd>
          </div>
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>New file</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+N</kbd>
          </div>
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>Open explorer</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+O</kbd>
          </div>
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>AI completion</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+Space</kbd>
          </div>
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>Toggle comment</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+/</kbd>
          </div>
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>Find in file</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+F</kbd>
          </div>
          <div className="flex justify-between py-1 border-b border-surface/20">
            <span>Replace in file</span>
            <kbd className="bg-surface px-2 py-1 rounded text-xs">Ctrl+H</kbd>
          </div>
        </div>
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Color Theme</h4>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', name: 'Light', preview: 'bg-white border-gray-200' },
            { id: 'dark', name: 'Dark', preview: 'bg-gray-800 border-gray-600' },
            { id: 'pure-black', name: 'Pure Black', preview: 'bg-black border-gray-800' }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => updateSetting('theme', theme.id)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                settings.theme === theme.id 
                  ? 'border-primary' 
                  : 'border-surface/30 hover:border-surface/50'
              }`}
            >
              <div className={`w-full h-8 rounded mb-2 ${theme.preview}`} />
              <div className="text-sm text-center">{theme.name}</div>
              {settings.theme === theme.id && (
                <CheckIcon className="w-4 h-4 mx-auto mt-1 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Layout</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Sidebar width</label>
            <input
              type="range"
              min="200"
              max="400"
              value={settings.sidebarWidth}
              onChange={(e) => updateSetting('sidebarWidth', parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-400">{settings.sidebarWidth}px</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'ai': return renderAISettings();
      case 'git': return renderGitSettings();
      case 'editor': return renderEditorSettings();
      case 'keyboard': return renderKeyboardSettings();
      case 'theme': return renderThemeSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-overlay border border-surface/30 rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface/30">
          <div className="flex items-center gap-3">
            <CogIcon className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold">Settings</h2>
            {hasUnsavedChanges && (
              <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-xs">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetSettings}
              className="px-3 py-1.5 text-sm hover:bg-surface/50 rounded transition-colors"
              title="Reset to defaults"
            >
              Reset
            </button>
            <button
              onClick={saveSettings}
              disabled={!hasUnsavedChanges}
              className="px-3 py-1.5 text-sm bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-surface/50 rounded transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-surface/30 p-4">
            <div className="space-y-1">
              {settingsSections.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary/20 text-primary'
                        : 'hover:bg-surface/50 text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-xs text-gray-400">{section.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold mb-4">
                {settingsSections.find(s => s.id === activeSection)?.name} Settings
              </h3>
              {renderActiveSection()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-surface/30 p-4 flex items-center justify-between text-sm text-gray-400">
          <div>Press Esc to close • Ctrl+S to save</div>
          <div>AI-IDE Settings v1.0.0</div>
        </div>
      </div>
    </div>
  );
}
