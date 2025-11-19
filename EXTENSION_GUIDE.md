# AI-IDE Extension Development Guide

A comprehensive guide for developing extensions that enhance the AI-IDE experience.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- TypeScript knowledge
- Understanding of modern web development
- Basic familiarity with AI/ML concepts (for AI extensions)

### Extension Architecture

Extensions in AI-IDE follow a plugin architecture that provides:
- **Sandboxed execution environment** for security
- **Type-safe API** for reliable development
- **Event-driven communication** with the host application
- **Resource management** for optimal performance
- **Inter-extension communication** for collaboration

### Development Setup

#### 1. Install Extension CLI
```bash
npm install -g @ai-ide/cli
```

#### 2. Create New Extension
```bash
ai-ide create-extension my-awesome-extension
cd my-awesome-extension
npm install
```

#### 3. Development Server
```bash
ai-ide extension dev
```

#### 4. Test in AI-IDE
```bash
ai-ide extension install ./dist
```

## 📁 Extension Structure

```
my-awesome-extension/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── index.ts              # Extension entry point
│   ├── manifest.json         # Extension metadata
│   ├── ui/
│   │   ├── panel.tsx         # Panel component
│   │   ├── commands.tsx      # Command palette commands
│   │   └── settings.tsx      # Settings UI
│   ├── api/
│   │   ├── file-system.ts    # File system API
│   │   ├── editor.ts         # Editor API
│   │   └── ai.ts             # AI API
│   ├── types/
│   │   ├── api.ts            # API type definitions
│   │   └── events.ts         # Event type definitions
│   └── utils/
│       └── helpers.ts        # Utility functions
└── docs/
    ├── api-reference.md
    └── user-guide.md
```

### Key Files

#### package.json
```json
{
  "name": "my-awesome-extension",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "ai-ide": {
    "apiVersion": "1.0.0",
    "capabilities": [
      "file-system",
      "editor",
      "ai"
    ]
  }
}
```

#### manifest.json
```json
{
  "id": "my-awesome-extension",
  "name": "My Awesome Extension",
  "description": "A sample extension for AI-IDE",
  "version": "1.0.0",
  "author": "Your Name",
  "homepage": "https://github.com/yourusername/my-awesome-extension",
  "repository": "https://github.com/yourusername/my-awesome-extension",
  "keywords": ["ai-ide", "extension", "productivity"],
  "engines": {
    "ai-ide": ">=1.0.0"
  },
  "permissions": [
    "file-system.read",
    "file-system.write",
    "editor.read",
    "editor.write"
  ],
  "contributes": {
    "commands": [
      {
        "id": "my-awesome.generate",
        "title": "Generate Code",
        "description": "Generate code using AI",
        "category": "My Awesome"
      }
    ],
    "panels": [
      {
        "id": "my-awesome-panel",
        "title": "My Awesome Panel",
        "icon": "🎯",
        "location": "right"
      }
    ],
    "settings": [
      {
        "id": "my-awesome-api-key",
        "title": "API Key",
        "type": "string",
        "default": "",
        "description": "Your API key for external service"
      }
    ]
  }
}
```

## 🔌 API Reference

### Core Extension API

#### Extension Context
```typescript
interface ExtensionContext {
  // Extension metadata
  id: string;
  version: string;
  
  // Extension configuration
  config: Record<string, any>;
  
  // API access
  api: AIIDEExtensionAPI;
  
  // Event system
  events: ExtensionEvents;
  
  // Logger
  logger: Logger;
}
```

#### AI-IDE Extension API
```typescript
interface AIIDEExtensionAPI {
  // File System
  fileSystem: {
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    readDirectory(path: string): Promise<FileInfo[]>;
    createDirectory(path: string): Promise<void>;
    deleteFile(path: string): Promise<void>;
    watch(path: string, callback: FileChangeCallback): FileWatcher;
  };
  
  // Editor
  editor: {
    getCurrentFile(): Promise<EditorFile | null>;
    getSelection(): Promise<string>;
    replaceSelection(text: string): Promise<void>;
    insertText(text: string): Promise<void>;
    getCursor(): Promise<CursorPosition>;
    setCursor(position: CursorPosition): Promise<void>;
    formatCode(): Promise<void>;
    findInFiles(query: string): Promise<SearchResult[]>;
  };
  
  // AI Services
  ai: {
    complete(prompt: string, options?: CompletionOptions): Promise<AICompletion>;
    chat(message: string, context?: ChatContext): Promise<AIResponse>;
    analyzeCode(code: string, language: string): Promise<CodeAnalysis>;
    generateTests(code: string, framework: string): Promise<string>;
    refactorCode(code: string, instructions: string): Promise<string>;
  };
  
  // Workspace
  workspace: {
    getCurrentProject(): Promise<ProjectInfo>;
    getProjectFiles(filter?: FileFilter): Promise<string[]>;
    installDependencies(packageName: string, version?: string): Promise<void>;
    runCommand(command: string, args?: string[]): Promise<CommandResult>;
  };
  
  // UI
  ui: {
    showNotification(message: string, type?: NotificationType): Promise<void>;
    showDialog(options: DialogOptions): Promise<DialogResult>;
    createPanel(panel: PanelConfig): Promise<PanelHandle>;
    executeCommand(command: CommandConfig): Promise<any>;
    openUrl(url: string): Promise<void>;
  };
}
```

### Event System

#### Event Types
```typescript
interface ExtensionEvents {
  // File system events
  'file:created': (fileInfo: FileInfo) => void;
  'file:modified': (fileInfo: FileInfo) => void;
  'file:deleted': (fileInfo: FileInfo) => void;
  
  // Editor events
  'editor:opened': (file: EditorFile) => void;
  'editor:closed': (file: EditorFile) => void;
  'selection:changed': (selection: EditorSelection) => void;
  'cursor:changed': (position: CursorPosition) => void;
  
  // AI events
  'ai:completion': (completion: AICompletion) => void;
  'ai:error': (error: AIError) => void;
  
  // Extension events
  'extension:activated': () => void;
  'extension:deactivated': () => void;
  'settings:changed': (settings: Record<string, any>) => void;
}
```

#### Event Handling
```typescript
import { ExtensionContext } from 'ai-ide-extension-api';

export function activate(context: ExtensionContext) {
  // Subscribe to events
  context.events.on('file:modified', handleFileModified);
  context.events.on('editor:opened', handleEditorOpened);
  
  // Register commands
  context.api.ui.executeCommand({
    id: 'my-awesome.generate',
    handler: generateCode
  });
  
  // Create UI panel
  context.api.ui.createPanel({
    id: 'my-awesome-panel',
    title: 'My Awesome Panel',
    component: MyPanelComponent,
    location: 'right'
  });
}

function handleFileModified(fileInfo: FileInfo) {
  context.logger.info(`File modified: ${fileInfo.path}`);
  
  // Check if it's a relevant file type
  if (fileInfo.path.endsWith('.js') || fileInfo.path.endsWith('.ts')) {
    // Do something with the modified file
    analyzeFile(fileInfo.path);
  }
}

function handleEditorOpened(file: EditorFile) {
  context.logger.info(`Editor opened: ${file.path}`);
  
  // Add custom functionality when certain files are opened
  if (file.path.endsWith('.test.ts')) {
    // Add test-specific functionality
    addTestTools(file);
  }
}
```

## 🎨 UI Components

### Creating Extension Panels

#### Panel Component
```tsx
import React from 'react';
import { useExtensionAPI } from 'ai-ide-extension-api';

export function MyPanelComponent() {
  const api = useExtensionAPI();
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    loadFiles();
  }, []);
  
  const loadFiles = async () => {
    setLoading(true);
    try {
      const projectFiles = await api.workspace.getProjectFiles({
        extensions: ['.js', '.ts', '.jsx', '.tsx']
      });
      setFiles(projectFiles);
    } catch (error) {
      api.ui.showNotification('Failed to load files', 'error');
    }
    setLoading(false);
  };
  
  const analyzeFile = async (filePath: string) => {
    try {
      const code = await api.fileSystem.readFile(filePath);
      const analysis = await api.ai.analyzeCode(code, getLanguage(filePath));
      
      api.ui.showNotification(`Analysis complete for ${filePath}`, 'info');
    } catch (error) {
      api.ui.showNotification('Analysis failed', 'error');
    }
  };
  
  if (loading) {
    return <div className="extension-panel-loading">Loading...</div>;
  }
  
  return (
    <div className="my-awesome-panel">
      <div className="panel-header">
        <h3>Code Analysis</h3>
        <button onClick={loadFiles}>Refresh</button>
      </div>
      
      <div className="panel-content">
        {files.length === 0 ? (
          <div className="no-files">No files found</div>
        ) : (
          <ul className="file-list">
            {files.map(file => (
              <li key={file.path} className="file-item">
                <span className="file-name">{file.name}</span>
                <button 
                  onClick={() => analyzeFile(file.path)}
                  className="analyze-btn"
                >
                  Analyze
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

### Command Palette Integration

#### Registering Commands
```typescript
// In your extension's activate function
context.api.ui.executeCommand({
  id: 'my-awesome.analyze-file',
  title: 'My Awesome: Analyze Current File',
  description: 'Analyze the current file for potential improvements',
  category: 'My Awesome',
  keybinding: 'ctrl+shift+a',
  handler: async () => {
    try {
      const currentFile = await context.api.editor.getCurrentFile();
      if (!currentFile) {
        context.api.ui.showNotification('No file open', 'warning');
        return;
      }
      
      const code = await context.api.fileSystem.readFile(currentFile.path);
      const analysis = await context.api.ai.analyzeCode(code, currentFile.language);
      
      // Display results in a panel or notification
      context.api.ui.showNotification(`Found ${analysis.suggestions.length} suggestions`, 'info');
    } catch (error) {
      context.api.ui.showNotification('Analysis failed', 'error');
    }
  }
});
```

### Settings UI

#### Custom Settings Component
```tsx
import React from 'react';
import { useExtensionSettings } from 'ai-ide-extension-api';

export function MySettingsComponent() {
  const { settings, updateSetting } = useExtensionSettings();
  
  return (
    <div className="my-awesome-settings">
      <div className="setting-group">
        <label htmlFor="api-key">API Key</label>
        <input
          id="api-key"
          type="password"
          value={settings['my-awesome-api-key'] || ''}
          onChange={(e) => updateSetting('my-awesome-api-key', e.target.value)}
          placeholder="Enter your API key"
        />
      </div>
      
      <div className="setting-group">
        <label htmlFor="analysis-depth">Analysis Depth</label>
        <select
          id="analysis-depth"
          value={settings['my-awesome-analysis-depth'] || 'basic'}
          onChange={(e) => updateSetting('my-awesome-analysis-depth', e.target.value)}
        >
          <option value="basic">Basic</option>
          <option value="detailed">Detailed</option>
          <option value="comprehensive">Comprehensive</option>
        </select>
      </div>
      
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings['my-awesome-auto-analyze'] || false}
            onChange={(e) => updateSetting('my-awesome-auto-analyze', e.target.checked)}
          />
          Auto-analyze on file save
        </label>
      </div>
    </div>
  );
}
```

## 🤖 AI Integration

### Code Analysis Extension

```typescript
export class CodeAnalysisExtension {
  private context: ExtensionContext;
  
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  
  async analyzeCurrentFile(): Promise<CodeAnalysis> {
    const currentFile = await this.context.api.editor.getCurrentFile();
    if (!currentFile) {
      throw new Error('No file open');
    }
    
    const code = await this.context.api.fileSystem.readFile(currentFile.path);
    return await this.context.api.ai.analyzeCode(code, currentFile.language);
  }
  
  async generateRefactorSuggestions(filePath: string): Promise<RefactorSuggestion[]> {
    const code = await this.context.api.fileSystem.readFile(filePath);
    const analysis = await this.context.api.ai.analyzeCode(code, getLanguage(filePath));
    
    return analysis.suggestions.map(suggestion => ({
      title: suggestion.title,
      description: suggestion.description,
      code: suggestion.suggestedCode,
      priority: suggestion.priority,
      impact: this.calculateImpact(suggestion)
    }));
  }
  
  async applyRefactor(filePath: string, suggestion: RefactorSuggestion): Promise<void> {
    const originalCode = await this.context.api.fileSystem.readFile(filePath);
    
    // Preview the change
    const preview = await this.context.api.ui.showDialog({
      title: 'Preview Refactor',
      message: `Apply this refactor?\n\n${suggestion.description}`,
      type: 'confirm',
      details: `Original:\n${originalCode}\n\nRefactored:\n${suggestion.code}`
    });
    
    if (preview === 'confirm') {
      await this.context.api.fileSystem.writeFile(filePath, suggestion.code);
      await this.context.api.ui.showNotification('Refactor applied', 'success');
    }
  }
  
  private calculateImpact(suggestion: CodeSuggestion): RefactorImpact {
    // AI-powered impact analysis
    return {
      performance: suggestion.estimatedPerformanceImpact,
      maintainability: suggestion.estimatedMaintainabilityImpact,
      readability: suggestion.estimatedReadabilityImpact,
      risk: this.assessRisk(suggestion)
    };
  }
  
  private assessRisk(suggestion: CodeSuggestion): 'low' | 'medium' | 'high' {
    // AI-driven risk assessment
    const riskFactors = [
      suggestion.complexity,
      suggestion.scope,
      suggestion.breakingChange
    ];
    
    const avgRisk = riskFactors.reduce((sum, factor) => sum + factor, 0) / riskFactors.length;
    
    if (avgRisk < 0.3) return 'low';
    if (avgRisk < 0.7) return 'medium';
    return 'high';
  }
}
```

### Code Generation Extension

```typescript
export class CodeGenerationExtension {
  private context: ExtensionContext;
  
  constructor(context: ExtensionContext) {
    this.context = context;
  }
  
  async generateComponent(componentName: string, framework: string): Promise<string> {
    const prompt = `
      Generate a ${framework} component named ${componentName} with the following requirements:
      - Modern ${framework} patterns
      - TypeScript support
      - Accessible markup
      - Responsive design
      - Clean, maintainable code
    `;
    
    const completion = await this.context.api.ai.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1000
    });
    
    return completion.text;
  }
  
  async generateTest(filePath: string, framework: string): Promise<string> {
    const code = await this.context.api.fileSystem.readFile(filePath);
    const prompt = `
      Generate comprehensive ${framework} tests for this code:
      ${code}
      
      Include:
      - Unit tests for all public methods
      - Error handling tests
      - Edge case coverage
      - Mock external dependencies
    `;
    
    const completion = await this.context.api.ai.complete(prompt, {
      temperature: 0.2,
      maxTokens: 1500
    });
    
    return completion.text;
  }
  
  async generateDocs(code: string, language: string): Promise<string> {
    const prompt = `
      Generate comprehensive documentation for this ${language} code:
      ${code}
      
      Include:
      - Function/method descriptions
      - Parameter explanations
      - Return value documentation
      - Usage examples
      - Type definitions
    `;
    
    const completion = await this.context.api.ai.complete(prompt, {
      temperature: 0.1,
      maxTokens: 800
    });
    
    return completion.text;
  }
}
```

## 🔧 Advanced Features

### File Watchers

```typescript
export class FileWatcherExtension {
  private watchers: FileWatcher[] = [];
  
  async setupWatchers() {
    // Watch for TypeScript file changes
    const tsWatcher = await this.context.api.fileSystem.watch(
      'src/**/*.ts',
      (change) => this.handleTsFileChange(change)
    );
    this.watchers.push(tsWatcher);
    
    // Watch for config changes
    const configWatcher = await this.context.api.fileSystem.watch(
      '*.json',
      (change) => this.handleConfigChange(change)
    );
    this.watchers.push(configWatcher);
  }
  
  private async handleTsFileChange(change: FileChange) {
    if (change.type === 'created' || change.type === 'modified') {
      // Auto-format on save
      if (change.path.endsWith('.ts') || change.path.endsWith('.tsx')) {
        await this.context.api.editor.formatCode();
      }
      
      // Re-run tests if test file
      if (change.path.includes('.test.')) {
        await this.runTestsForFile(change.path);
      }
    }
  }
  
  private async handleConfigChange(change: FileChange) {
    if (change.type === 'modified') {
      // Notify user of config changes
      await this.context.api.ui.showNotification(
        `Configuration file changed: ${change.path}`,
        'info'
      );
    }
  }
  
  async cleanup() {
    this.watchers.forEach(watcher => watcher.dispose());
    this.watchers = [];
  }
}
```

### Inter-Extension Communication

```typescript
export class ExtensionCommunication {
  private channels: Map<string, MessageChannel> = new Map();
  
  constructor(private context: ExtensionContext) {}
  
  // Send message to another extension
  async sendMessage(targetExtensionId: string, message: any): Promise<void> {
    const channel = this.getChannel(targetExtensionId);
    channel.postMessage({
      from: this.context.id,
      type: 'message',
      data: message,
      timestamp: Date.now()
    });
  }
  
  // Listen for messages from other extensions
  setupMessageHandler(handler: MessageHandler): void {
    this.context.events.on('extension:message', handler);
  }
  
  // Publish to extension events
  publishEvent(eventType: string, data: any): void {
    this.context.events.emit(`extension:${eventType}`, data);
  }
  
  private getChannel(extensionId: string): MessageChannel {
    if (!this.channels.has(extensionId)) {
      const channel = new MessageChannel();
      this.channels.set(extensionId, channel);
    }
    return this.channels.get(extensionId)!;
  }
}
```

### Custom Language Support

```typescript
export class CustomLanguageExtension {
  private languageServer: LanguageServer;
  
  async activate(): Promise<void> {
    // Register custom language
    await this.context.api.editor.registerLanguage({
      id: 'my-custom-lang',
      name: 'My Custom Language',
      extensions: ['.mcl'],
      syntax: this.getSyntaxDefinition(),
      languageServer: this.createLanguageServer()
    });
  }
  
  private getSyntaxDefinition(): LanguageDefinition {
    return {
      keywords: ['function', 'var', 'if', 'else'],
      operators: ['=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>=', '>>>='],
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      tokenizer: {
        root: [
          [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
          { include: '@whitespace' },
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@symbols)/, '@brackets'],
          [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
          [/[0-9]*\.[0-9]+([eE][\-+]?[0-9]+)?[fFdD]?/, 'number.float'],
          [/[0-9]+/, 'number'],
          [/["']/, 'string.quote'],
          [/[;,.]/, 'delimiter']
        ],
        whitespace: [
          [/[ \t\r\n]+/, 'white'],
          [/\/\*/, 'comment', '@comment'],
          [/\/\/.*$/, 'comment'],
        ],
        comment: [
          [/[^\/*]+/, 'comment' ],
          [/\*\//, 'comment', '@pop' ],
          [/[\/*]/, 'comment' ]
        ]
      }
    };
  }
  
  private createLanguageServer(): LanguageServer {
    return {
      async provideCompletion(document, position) {
        // AI-powered completion
        const codeContext = document.getText();
        const lineContext = document.getLineContent(position.lineNumber);
        
        const completion = await this.context.api.ai.complete(
          `Complete this code: ${codeContext}\nCurrent line: ${lineContext}`,
          { type: 'completion' }
        );
        
        return completion.suggestions.map(suggestion => ({
          label: suggestion.text,
          kind: this.mapCompletionKind(suggestion.type),
          documentation: suggestion.documentation,
          insertText: suggestion.text
        }));
      },
      
      async provideHover(document, position) {
        const codeContext = document.getText();
        const lineContext = document.getLineContent(position.lineNumber);
        
        const hover = await this.context.api.ai.complete(
          `Explain this code: ${lineContext}`,
          { type: 'hover' }
        );
        
        return {
          contents: hover.text,
          range: {
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: lineContext.length
          }
        };
      }
    };
  }
  
  private mapCompletionKind(type: string): CompletionItemKind {
    switch (type) {
      case 'function': return CompletionItemKind.Function;
      case 'class': return CompletionItemKind.Class;
      case 'interface': return CompletionItemKind.Interface;
      case 'variable': return CompletionItemKind.Variable;
      default: return CompletionItemKind.Text;
    }
  }
}
```

## 🧪 Testing Extensions

### Extension Testing Setup

```typescript
// src/test/extension.test.ts
import { ExtensionTester } from '@ai-ide/extension-tester';

describe('My Awesome Extension', () => {
  let tester: ExtensionTester;
  
  beforeEach(async () => {
    tester = new ExtensionTester();
    await tester.setup();
  });
  
  afterEach(async () => {
    await tester.cleanup();
  });
  
  it('should analyze JavaScript files', async () => {
    // Create test file
    await tester.fileSystem.writeFile('test.js', `
      function badFunction() {
        console.log('hello world');
      }
    `);
    
    // Run extension command
    await tester.commands.execute('my-awesome.analyze-current-file');
    
    // Assert results
    const analysis = await tester.ui.getLatestAnalysis();
    expect(analysis.suggestions).toHaveLength(1);
    expect(analysis.suggestions[0].title).toBe('Use console.log appropriately');
  });
  
  it('should respect user settings', async () => {
    // Configure extension
    await tester.settings.set('my-awesome-analysis-depth', 'comprehensive');
    
    // Test with comprehensive analysis
    await tester.fileSystem.writeFile('complex.js', '// complex code here');
    
    const result = await tester.ai.analyze('complex.js');
    expect(result.depth).toBe('comprehensive');
  });
});
```

### UI Testing

```typescript
// src/test/ui.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyPanelComponent } from '../ui/panel';
import { createMockExtensionAPI } from '@ai-ide/extension-tester';

describe('MyPanelComponent', () => {
  it('should display files correctly', async () => {
    const mockAPI = createMockExtensionAPI({
      workspace: {
        getProjectFiles: jest.fn().mockResolvedValue([
          { name: 'test.js', path: 'test.js' },
          { name: 'test.ts', path: 'test.ts' }
        ])
      }
    });
    
    render(<MyPanelComponent api={mockAPI} />);
    
    await waitFor(() => {
      expect(screen.getByText('test.js')).toBeInTheDocument();
      expect(screen.getByText('test.ts')).toBeInTheDocument();
    });
  });
  
  it('should handle file analysis', async () => {
    const mockAPI = createMockExtensionAPI({
      fileSystem: {
        readFile: jest.fn().mockResolvedValue('console.log("hello");')
      },
      ai: {
        analyzeCode: jest.fn().mockResolvedValue({
          suggestions: [{ title: 'Suggestion 1' }]
        })
      },
      ui: {
        showNotification: jest.fn()
      }
    });
    
    render(<MyPanelComponent api={mockAPI} />);
    
    const analyzeButton = screen.getByText('Analyze');
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(mockAPI.ui.showNotification).toHaveBeenCalledWith(
        'Found 1 suggestions',
        'info'
      );
    });
  });
});
```

## 📦 Publishing Extensions

### Publishing to Extension Registry

#### 1. Build Extension
```bash
npm run build
```

#### 2. Test Extension
```bash
ai-ide extension test ./dist
```

#### 3. Package Extension
```bash
ai-ide extension package
```

#### 4. Publish to Registry
```bash
ai-ide extension publish --registry https://extensions.ai-ide.dev
```

#### Extension Package Structure
```
my-awesome-extension@1.0.0.tgz
├── package.json
├── manifest.json
├── dist/
│   ├── index.js
│   ├── ui/
│   └── assets/
└── LICENSE
```

### Version Management

#### Version Update Script
```bash
#!/bin/bash
# update-version.sh

NEW_VERSION=$1
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "Updating version from $CURRENT_VERSION to $NEW_VERSION"

# Update package.json
npm version $NEW_VERSION --no-git-tag-version

# Update manifest.json
jq ".version = \"$NEW_VERSION\"" manifest.json > manifest.json.tmp
mv manifest.json.tmp manifest.json

# Build and test
npm run build
ai-ide extension test ./dist

echo "Version update complete!"
```

## 🔒 Security & Best Practices

### Security Guidelines

#### 1. Input Validation
```typescript
import { z } from 'zod';

const SettingsSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  timeout: z.number().min(1000).max(60000),
  enableNotifications: z.boolean()
});

export function validateSettings(settings: any): SettingsSchema {
  return SettingsSchema.parse(settings);
}
```

#### 2. Resource Cleanup
```typescript
export class ExtensionResourceManager {
  private resources: Array<{ dispose: () => void }> = [];
  
  addResource(resource: { dispose: () => void }) {
    this.resources.push(resource);
  }
  
  cleanup() {
    this.resources.forEach(resource => {
      try {
        resource.dispose();
      } catch (error) {
        // Log error but don't fail cleanup
        console.error('Error disposing resource:', error);
      }
    });
    this.resources = [];
  }
}
```

#### 3. Error Handling
```typescript
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    context.logger.error(`Error in ${context}:`, error);
    context.api.ui.showNotification(
      `Error in ${context}: ${error.message}`,
      'error'
    );
    return null;
  }
}
```

### Performance Guidelines

#### 1. Debouncing Expensive Operations
```typescript
import { debounce } from 'lodash';

export class PerformanceManager {
  private debouncedAnalyze = debounce(
    this.analyzeCode.bind(this),
    500
  );
  
  async scheduleAnalysis(code: string) {
    this.debouncedAnalyze(code);
  }
}
```

#### 2. Memory Management
```typescript
export class MemoryManager {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_CACHE_SIZE = 100;
  
  set(key: string, value: any) {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if entry is stale (older than 5 minutes)
    if (Date.now() - entry.timestamp > 300000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
}
```

## 📊 Extension Analytics

### Performance Monitoring
```typescript
export class ExtensionAnalytics {
  private metrics: Map<string, number> = new Map();
  
  startTimer(operation: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.recordMetric(operation, duration);
    };
  }
  
  recordMetric(operation: string, value: number) {
    const existing = this.metrics.get(operation) || 0;
    this.metrics.set(operation, existing + value);
    
    // Send to analytics service if enabled
    if (this.context.config.analyticsEnabled) {
      this.sendMetric(operation, value);
    }
  }
  
  async getPerformanceReport(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      totalOperations: this.metrics.size,
      averageDuration: this.calculateAverageDuration(),
      slowestOperation: this.getSlowestOperation(),
      operationBreakdown: Object.fromEntries(this.metrics)
    };
    
    return report;
  }
}
```

### Error Reporting
```typescript
export class ErrorReporter {
  async reportError(error: Error, context: string): Promise<void> {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      extension: this.context.id,
      version: this.context.version,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Send to error reporting service
    if (this.context.config.errorReportingEnabled) {
      await this.sendErrorReport(errorReport);
    }
    
    // Log locally
    console.error('Extension Error:', errorReport);
  }
}
```

## 🚀 Advanced Examples

### Git Integration Extension
### Docker Support Extension  
### Testing Framework Integration
### Database Connection Extension

[Additional examples would continue here...]

## 📚 Resources

### Extension Development Tools
- [@ai-ide/cli](https://github.com/ai-ide/cli) - Extension CLI
- [@ai-ide/extension-tester](https://github.com/ai-ide/extension-tester) - Testing framework
- [@ai-ide/extension-api](https://github.com/ai-ide/extension-api) - API types
- [Extension Samples](https://github.com/ai-ide/extension-samples) - Example extensions

### Community Resources
- [Extension Discord](https://discord.gg/ai-ide-extensions)
- [Developer Forum](https://forum.ai-ide.dev)
- [Weekly Office Hours](https://calendly.com/ai-ide-extensions)
- [GitHub Discussions](https://github.com/ai-ide/extensions/discussions)

### Documentation
- [Extension API Reference](https://docs.ai-ide.dev/extension-api)
- [UI Component Library](https://docs.ai-ide.dev/ui-components)
- [AI Integration Guide](https://docs.ai-ide.dev/ai-integration)
- [Security Guidelines](https://docs.ai-ide.dev/security)

This guide provides everything you need to build powerful extensions for AI-IDE. Start with the basic examples and gradually implement more advanced features as you become familiar with the extension system.