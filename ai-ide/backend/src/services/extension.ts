/**
 * Extension Service
 * Core extension management system with lifecycle management and security
 */

import { 
  ExtensionInstance, 
  ExtensionManifest, 
  ExtensionState, 
  ExtensionLifecycle, 
  ExtensionContext, 
  ExtensionAPI,
  ExtensionError,
  ExtensionExecutionResult,
  WorkspaceAPI,
  EditorAPI,
  TerminalAPI,
  AIAPI,
  GitAPI,
  UIAPI,
  StorageAPI,
  ConfigAPI,
  EventsAPI,
  HTTPAPI,
  LoggerAPI,
  HTTPOptions,
  HTTPResponse,
  WorkspaceItem,
  SearchOptions,
  SearchResult,
  FileChangeEvent,
  EditorState,
  EditorSelection,
  CursorPosition,
  TextChangeEvent,
  FindOptions,
  TerminalResult,
  TerminalHistoryEntry,
  TerminalOutputEvent,
  AIMessage,
  ChatOptions,
  CodeAnalysis,
  CodeIssue,
  CodeSuggestion,
  Completion,
  GitStatus,
  GitBranch,
  GitCommit,
  FileStatus,
  NotificationType,
  InputOptions,
  WebviewOptions,
  WebviewHandle,
  QuickPickItem,
  QuickPickOptions,
  LoggerAPI as LoggerType
} from '../types/extension';
import { EventEmitter } from 'events';
import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ExtensionRegistry {
  extensions: Map<string, ExtensionInstance>;
  activeEvents: Map<string, NodeJS.Timeout[]>;
  eventListeners: Map<string, Map<string, (...args: any[]) => void>>;
  webviews: Map<string, any>;
  commands: Map<string, () => Promise<void> | void>;
  keybindings: Map<string, string[]>;
  statusBarItems: Map<string, { text: string; tooltip?: string }>;
}

export class ExtensionService {
  private registry: ExtensionRegistry;
  private eventEmitter: EventEmitter;
  private executionContext: Map<string, any>;
  private permissionMatrix: Map<string, Set<string>>;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.registry = {
      extensions: new Map(),
      activeEvents: new Map(),
      eventListeners: new Map(),
      webviews: new Map(),
      commands: new Map(),
      keybindings: new Map(),
      statusBarItems: new Map()
    };

    this.eventEmitter = new EventEmitter();
    this.executionContext = new Map();
    this.permissionMatrix = new Map();
    this.workspacePath = workspacePath;
    
    this.setupEventHandlers();
  }

  /**
   * Register a new extension
   */
  async registerExtension(
    manifest: ExtensionManifest, 
    module: any, 
    config: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Validate manifest
      this.validateManifest(manifest);
      
      // Check for conflicts
      if (this.registry.extensions.has(manifest.name)) {
        throw new Error(`Extension '${manifest.name}' is already registered`);
      }

      // Create extension instance
      const extensionId = this.generateExtensionId();
      const instance: ExtensionInstance = {
        id: extensionId,
        manifest,
        state: 'loading',
        config: { ...manifest.defaultConfig, ...config },
        installedAt: new Date(),
        error: null
      };

      // Store extension
      this.registry.extensions.set(manifest.name, instance);
      
      // Set up permission matrix
      this.setupPermissions(manifest);

      // Load extension module
      await this.loadExtensionModule(instance, module);

      // Initialize lifecycle
      await this.initializeExtension(instance);

      return extensionId;
    } catch (error) {
      console.error(`Failed to register extension ${manifest.name}:`, error);
      throw error;
    }
  }

  /**
   * Activate an extension
   */
  async activateExtension(extensionName: string): Promise<void> {
    const instance = this.registry.extensions.get(extensionName);
    if (!instance) {
      throw new Error(`Extension '${extensionName}' not found`);
    }

    if (instance.state === 'active') {
      return; // Already active
    }

    try {
      instance.state = 'loading';
      instance.lastActivated = new Date();
      
      // Check permissions
      this.checkPermissions(extensionName, ['ui.render']);

      // Activate extension if it has lifecycle methods
      if (instance.instance && typeof instance.instance.onActivate === 'function') {
        await instance.instance.onActivate();
      }

      instance.state = 'active';
      this.eventEmitter.emit('extension:activated', extensionName, instance);
      
      console.log(`Extension '${extensionName}' activated successfully`);
    } catch (error) {
      instance.state = 'error';
      instance.error = error as Error;
      console.error(`Failed to activate extension '${extensionName}':`, error);
      throw error;
    }
  }

  /**
   * Deactivate an extension
   */
  async deactivateExtension(extensionName: string): Promise<void> {
    const instance = this.registry.extensions.get(extensionName);
    if (!instance) {
      throw new Error(`Extension '${extensionName}' not found`);
    }

    if (instance.state !== 'active') {
      return; // Not active
    }

    try {
      // Deactivate extension
      if (instance.instance && typeof instance.instance.onDeactivate === 'function') {
        await instance.instance.onDeactivate();
      }

      // Clean up events
      this.cleanupExtensionEvents(extensionName);
      
      // Clean up webviews
      this.cleanupExtensionWebviews(extensionName);
      
      // Remove commands
      this.cleanupExtensionCommands(extensionName);
      
      // Remove keybindings
      this.cleanupExtensionKeybindings(extensionName);
      
      // Remove status bar items
      this.cleanupExtensionStatusBarItems(extensionName);

      instance.state = 'inactive';
      this.eventEmitter.emit('extension:deactivated', extensionName, instance);
      
      console.log(`Extension '${extensionName}' deactivated successfully`);
    } catch (error) {
      instance.error = error as Error;
      console.error(`Failed to deactivate extension '${extensionName}':`, error);
      throw error;
    }
  }

  /**
   * Unregister an extension
   */
  async unregisterExtension(extensionName: string): Promise<void> {
    const instance = this.registry.extensions.get(extensionName);
    if (!instance) {
      throw new Error(`Extension '${extensionName}' not found`);
    }

    // Deactivate if active
    if (instance.state === 'active') {
      await this.deactivateExtension(extensionName);
    }

    // Dispose extension
    if (instance.instance && typeof instance.instance.dispose === 'function') {
      try {
        await instance.instance.dispose();
      } catch (error) {
        console.error(`Error disposing extension '${extensionName}':`, error);
      }
    }

    // Clean up
    this.registry.extensions.delete(extensionName);
    this.permissionMatrix.delete(extensionName);
    this.cleanupExtensionEvents(extensionName);
    
    this.eventEmitter.emit('extension:unregistered', extensionName);
    
    console.log(`Extension '${extensionName}' unregistered successfully`);
  }

  /**
   * Get extension instance
   */
  getExtension(extensionName: string): ExtensionInstance | undefined {
    return this.registry.extensions.get(extensionName);
  }

  /**
   * Get all registered extensions
   */
  getAllExtensions(): ExtensionInstance[] {
    return Array.from(this.registry.extensions.values());
  }

  /**
   * Get active extensions
   */
  getActiveExtensions(): ExtensionInstance[] {
    return this.getAllExtensions().filter(ext => ext.state === 'active');
  }

  /**
   * Execute extension command
   */
  async executeExtensionCommand(
    extensionName: string, 
    commandName: string, 
    ...args: any[]
  ): Promise<ExtensionExecutionResult> {
    const startTime = Date.now();
    const instance = this.registry.extensions.get(extensionName);
    
    if (!instance) {
      return {
        success: false,
        error: `Extension '${extensionName}' not found`,
        duration: Date.now() - startTime
      };
    }

    try {
      this.checkPermissions(extensionName, ['ui.command']);
      
      const commandKey = `${extensionName}:${commandName}`;
      const command = this.registry.commands.get(commandKey);
      
      if (!command) {
        return {
          success: false,
          error: `Command '${commandName}' not found in extension '${extensionName}'`,
          duration: Date.now() - startTime
        };
      }

      const result = await command(...args);
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Register UI command
   */
  registerCommand(
    extensionName: string, 
    commandId: string, 
    title: string, 
    handler: () => Promise<void> | void
  ): void {
    const commandKey = `${extensionName}:${commandId}`;
    this.registry.commands.set(commandKey, handler);
    this.eventEmitter.emit('command:registered', extensionName, commandId, title);
  }

  /**
   * Register keybinding
   */
  registerKeybinding(extensionName: string, key: string, command: string): void {
    if (!this.registry.keybindings.has(extensionName)) {
      this.registry.keybindings.set(extensionName, []);
    }
    
    const keybindings = this.registry.keybindings.get(extensionName)!;
    keybindings.push(key);
    
    this.eventEmitter.emit('keybinding:registered', extensionName, key, command);
  }

  /**
   * Register status bar item
   */
  registerStatusBarItem(
    extensionName: string, 
    id: string, 
    text: string, 
    tooltip?: string
  ): void {
    this.registry.statusBarItems.set(`${extensionName}:${id}`, { text, tooltip });
    this.eventEmitter.emit('statusbar:item:registered', extensionName, id, text, tooltip);
  }

  /**
   * Get extension API for an extension
   */
  getExtensionAPI(extensionName: string): ExtensionAPI | null {
    const instance = this.registry.extensions.get(extensionName);
    if (!instance) {
      return null;
    }

    return this.createExtensionAPI(extensionName);
  }

  /**
   * Get extension errors
   */
  getExtensionErrors(): ExtensionError[] {
    const errors: ExtensionError[] = [];
    
    for (const [name, instance] of this.registry.extensions) {
      if (instance.error) {
        errors.push({
          extensionId: name,
          message: instance.error.message,
          stack: instance.error.stack,
          timestamp: new Date(),
          fatal: instance.state === 'error'
        });
      }
    }
    
    return errors;
  }

  /**
   * Enable/disable extension
   */
  setExtensionEnabled(extensionName: string, enabled: boolean): void {
    const instance = this.registry.extensions.get(extensionName);
    if (!instance) {
      throw new Error(`Extension '${extensionName}' not found`);
    }

    if (enabled && instance.state === 'inactive') {
      this.activateExtension(extensionName);
    } else if (!enabled && instance.state === 'active') {
      this.deactivateExtension(extensionName);
    }
  }

  /**
   * Validate manifest
   */
  private validateManifest(manifest: ExtensionManifest): void {
    if (!manifest.name || !/^[a-z0-9-]+$/.test(manifest.name)) {
      throw new Error('Extension name must be kebab-case (lowercase letters, numbers, hyphens)');
    }

    if (!manifest.displayName) {
      throw new Error('Extension must have a display name');
    }

    if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Extension must have a valid semantic version (e.g., 1.0.0)');
    }

    if (!manifest.main) {
      throw new Error('Extension must specify main entry point');
    }

    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Extension permissions must be an array');
    }

    if (!Array.isArray(manifest.categories) || manifest.categories.length === 0) {
      throw new Error('Extension must specify at least one category');
    }
  }

  /**
   * Generate unique extension ID
   */
  private generateExtensionId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load extension module
   */
  private async loadExtensionModule(instance: ExtensionInstance, module: any): Promise<void> {
    try {
      // Check if module has an exported class or object
      if (typeof module.default === 'function') {
        const context = this.createExtensionContext(instance);
        instance.instance = new module.default(context);
      } else if (typeof module.default === 'object' && module.default !== null) {
        // Check if it's already an instantiated extension
        instance.instance = module.default;
      } else {
        throw new Error('Extension module must export a class or object');
      }

      // Call onLoad if available
      if (instance.instance && typeof instance.instance.onLoad === 'function') {
        await instance.instance.onLoad();
      }

    } catch (error) {
      instance.state = 'error';
      instance.error = error as Error;
      throw error;
    }
  }

  /**
   * Initialize extension
   */
  private async initializeExtension(instance: ExtensionInstance): Promise<void> {
    // Set up event listeners
    this.setupExtensionEventListeners(instance);
    
    // Initialize storage for extension
    await this.initializeExtensionStorage(instance);
  }

  /**
   * Create extension context
   */
  private createExtensionContext(instance: ExtensionInstance): ExtensionContext {
    return {
      extensionId: instance.id,
      manifest: instance.manifest,
      api: this.createExtensionAPI(instance.manifest.name),
      config: instance.config,
      logger: this.createLoggerAPI(instance.manifest.name),
      storage: this.createStorageAPI(instance.manifest.name)
    };
  }

  /**
   * Create extension API
   */
  private createExtensionAPI(extensionName: string): ExtensionAPI {
    const extensionId = extensionName;
    
    return {
      workspace: this.createWorkspaceAPI(extensionId),
      editor: this.createEditorAPI(extensionId),
      terminal: this.createTerminalAPI(extensionId),
      ai: this.createAIAPI(extensionId),
      git: this.createGitAPI(extensionId),
      ui: this.createUIAPI(extensionId),
      storage: this.createStorageAPI(extensionId),
      config: this.createConfigAPI(extensionId),
      events: this.createEventsAPI(extensionId),
      http: this.createHTTPAPI(extensionId),
      logger: this.createLoggerAPI(extensionId)
    };
  }

  /**
   * Create Workspace API
   */
  private createWorkspaceAPI(extensionName: string): WorkspaceAPI {
    return {
      readFile: async (filePath: string): Promise<string> => {
        this.checkPermissions(extensionName, ['workspace.read']);
        const fullPath = path.join(this.workspacePath, filePath);
        return fs.readFile(fullPath, 'utf-8');
      },
      
      writeFile: async (filePath: string, content: string): Promise<void> => {
        this.checkPermissions(extensionName, ['workspace.write']);
        const fullPath = path.join(this.workspacePath, filePath);
        await fs.writeFile(fullPath, content, 'utf-8');
        this.eventEmitter.emit('workspace:file:changed', filePath);
      },
      
      delete: async (filePath: string): Promise<void> => {
        this.checkPermissions(extensionName, ['workspace.fileSystem']);
        const fullPath = path.join(this.workspacePath, filePath);
        await fs.rm(fullPath, { recursive: true });
        this.eventEmitter.emit('workspace:file:deleted', filePath);
      },
      
      listDirectory: async (dirPath: string): Promise<WorkspaceItem[]> => {
        this.checkPermissions(extensionName, ['workspace.read']);
        const fullPath = path.join(this.workspacePath, dirPath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        
        return entries.map(entry => ({
          path: path.join(dirPath, entry.name),
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          isFile: () => entry.isFile(),
          isDirectory: () => entry.isDirectory()
        }));
      },
      
      createDirectory: async (dirPath: string): Promise<void> => {
        this.checkPermissions(extensionName, ['workspace.fileSystem']);
        const fullPath = path.join(this.workspacePath, dirPath);
        await fs.mkdir(fullPath, { recursive: true });
      },
      
      getInfo: async (itemPath: string): Promise<WorkspaceItem> => {
        this.checkPermissions(extensionName, ['workspace.read']);
        const fullPath = path.join(this.workspacePath, itemPath);
        const stats = await fs.stat(fullPath);
        
        return {
          path: itemPath,
          name: path.basename(itemPath),
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime,
          isFile: () => stats.isFile(),
          isDirectory: () => stats.isDirectory()
        };
      },
      
      search: async (query: string, options?: SearchOptions): Promise<SearchResult[]> => {
        this.checkPermissions(extensionName, ['workspace.read']);
        // Implement search logic here
        return [];
      },
      
      watch: (paths: string[], callback: (change: FileChangeEvent) => void): (() => void) => {
        this.checkPermissions(extensionName, ['workspace.read']);
        
        const unwatchFns: (() => void)[] = [];
        for (const path of paths) {
          // Set up file watching for each path
          unwatchFns.push(() => {
            // Cleanup watchers
          });
        }
        
        // Store callback for cleanup
        const callbackKey = `${extensionName}_${Date.now()}`;
        this.eventEmitter.on('workspace:file:changed', callback);
        
        return () => {
          unwatchFns.forEach(fn => fn());
          this.eventEmitter.off('workspace:file:changed', callback);
        };
      }
    };
  }

  /**
   * Create Editor API
   */
  private createEditorAPI(extensionName: string): EditorAPI {
    return {
      getActiveEditor: (): EditorState | null => {
        this.checkPermissions(extensionName, ['editor.read']);
        // Return current editor state
        return null;
      },
      
      executeCommand: async (command: string, ...args: any[]): Promise<any> => {
        this.checkPermissions(extensionName, ['editor.write']);
        // Execute editor command
        return null;
      },
      
      insertText: async (text: string): Promise<void> => {
        this.checkPermissions(extensionName, ['editor.write']);
        // Insert text at cursor
      },
      
      getSelection: (): EditorSelection | null => {
        this.checkPermissions(extensionName, ['editor.read']);
        return null;
      },
      
      setSelection: async (selection: EditorSelection): Promise<void> => {
        this.checkPermissions(extensionName, ['editor.write']);
        // Set selection
      },
      
      getCurrentLine: (): string => {
        this.checkPermissions(extensionName, ['editor.read']);
        return '';
      },
      
      getCursorPosition: (): CursorPosition => {
        this.checkPermissions(extensionName, ['editor.read']);
        return { line: 0, column: 0 };
      },
      
      format: async (): Promise<void> => {
        this.checkPermissions(extensionName, ['editor.write']);
        // Format document
      },
      
      findReplace: async (find: string, replace: string, options?: FindOptions): Promise<boolean> => {
        this.checkPermissions(extensionName, ['editor.write']);
        return false;
      },
      
      onTextChange: (callback: (change: TextChangeEvent) => void): (() => void) => {
        this.checkPermissions(extensionName, ['editor.read']);
        this.eventEmitter.on('editor:text:changed', callback);
        return () => this.eventEmitter.off('editor:text:changed', callback);
      },
      
      onCursorChange: (callback: (position: CursorPosition) => void): (() => void) => {
        this.checkPermissions(extensionName, ['editor.read']);
        this.eventEmitter.on('editor:cursor:changed', callback);
        return () => this.eventEmitter.off('editor:cursor:changed', callback);
      }
    };
  }

  /**
   * Create Terminal API
   */
  private createTerminalAPI(extensionName: string): TerminalAPI {
    return {
      execute: async (command: string, cwd?: string): Promise<TerminalResult> => {
        this.checkPermissions(extensionName, ['terminal.execute']);
        // Execute terminal command
        return { output: '', exitCode: 0, duration: 0 };
      },
      
      getHistory: (): TerminalHistoryEntry[] => {
        this.checkPermissions(extensionName, ['terminal.read']);
        return [];
      },
      
      clear: async (): Promise<void> => {
        this.checkPermissions(extensionName, ['terminal.execute']);
        // Clear terminal
      },
      
      kill: async (sessionId: string): Promise<void> => {
        this.checkPermissions(extensionName, ['terminal.execute']);
        // Kill terminal session
      },
      
      resize: async (sessionId: string, cols: number, rows: number): Promise<void> => {
        this.checkPermissions(extensionName, ['terminal.execute']);
        // Resize terminal
      },
      
      onOutput: (callback: (output: TerminalOutputEvent) => void): (() => void) => {
        this.checkPermissions(extensionName, ['terminal.read']);
        this.eventEmitter.on('terminal:output', callback);
        return () => this.eventEmitter.off('terminal:output', callback);
      }
    };
  }

  /**
   * Create AI API
   */
  private createAIAPI(extensionName: string): AIAPI {
    return {
      chat: async (message: string, options?: ChatOptions): Promise<AIMessage> => {
        this.checkPermissions(extensionName, ['ai.request']);
        // Send chat message
        return { role: 'assistant', content: '', timestamp: new Date() };
      },
      
      streamChat: async function* (message: string, options?: ChatOptions): AsyncGenerator<AIMessage> {
        this.checkPermissions(extensionName, ['ai.request']);
        // Stream chat response
        yield { role: 'assistant', content: '', timestamp: new Date() };
      },
      
      generateCode: async (prompt: string, language?: string): Promise<string> => {
        this.checkPermissions(extensionName, ['ai.request']);
        return '';
      },
      
      analyzeCode: async (code: string, language?: string): Promise<CodeAnalysis> => {
        this.checkPermissions(extensionName, ['ai.request']);
        return { issues: [], suggestions: [] };
      },
      
      complete: async (text: string, position: number, language?: string): Promise<Completion[]> => {
        this.checkPermissions(extensionName, ['ai.request']);
        return [];
      }
    };
  }

  /**
   * Create Git API
   */
  private createGitAPI(extensionName: string): GitAPI {
    return {
      getStatus: async (): Promise<GitStatus> => {
        this.checkPermissions(extensionName, ['git.read']);
        return {
          branch: '',
          ahead: 0,
          behind: 0,
          staged: [],
          modified: [],
          untracked: []
        };
      },
      
      getBranches: async (): Promise<GitBranch[]> => {
        this.checkPermissions(extensionName, ['git.read']);
        return [];
      },
      
      createBranch: async (name: string): Promise<void> => {
        this.checkPermissions(extensionName, ['git.write']);
        // Create branch
      },
      
      switchBranch: async (name: string): Promise<void> => {
        this.checkPermissions(extensionName, ['git.write']);
        // Switch branch
      },
      
      commit: async (message: string): Promise<void> => {
        this.checkPermissions(extensionName, ['git.write']);
        // Commit changes
      },
      
      push: async (remote?: string, branch?: string): Promise<void> => {
        this.checkPermissions(extensionName, ['git.write']);
        // Push changes
      },
      
      pull: async (remote?: string, branch?: string): Promise<void> => {
        this.checkPermissions(extensionName, ['git.write']);
        // Pull changes
      },
      
      getCommits: async (count?: number): Promise<GitCommit[]> => {
        this.checkPermissions(extensionName, ['git.read']);
        return [];
      },
      
      getDiff: async (file?: string): Promise<string> => {
        this.checkPermissions(extensionName, ['git.read']);
        return '';
      }
    };
  }

  /**
   * Create UI API
   */
  private createUIAPI(extensionName: string): UIAPI {
    return {
      showNotification: (message: string, type: NotificationType = 'info'): void => {
        this.checkPermissions(extensionName, ['ui.render']);
        this.eventEmitter.emit('ui:notification', extensionName, message, type);
      },
      
      showInputDialog: async (title: string, options?: InputOptions): Promise<string | null> => {
        this.checkPermissions(extensionName, ['ui.render']);
        // Return input dialog implementation
        return null;
      },
      
      showConfirmationDialog: async (title: string, message: string): Promise<boolean> => {
        this.checkPermissions(extensionName, ['ui.render']);
        // Return confirmation dialog implementation
        return false;
      },
      
      registerCommand: (id: string, title: string, command: () => Promise<void> | void): void => {
        this.checkPermissions(extensionName, ['ui.command']);
        this.registerCommand(extensionName, id, title, command);
      },
      
      registerKeybinding: (key: string, command: string): void => {
        this.checkPermissions(extensionName, ['ui.shortcut']);
        this.registerKeybinding(extensionName, key, `${extensionName}:${command}`);
      },
      
      createWebview: async (options: WebviewOptions): Promise<WebviewHandle> => {
        this.checkPermissions(extensionName, ['ui.render']);
        const webviewId = `${extensionName}_webview_${Date.now()}`;
        
        // Store webview reference
        const webview = {
          id: webviewId,
          show: () => this.eventEmitter.emit('ui:webview:show', webviewId, options),
          hide: () => this.eventEmitter.emit('ui:webview:hide', webviewId),
          dispose: () => this.eventEmitter.emit('ui:webview:dispose', webviewId),
          postMessage: (message: any) => this.eventEmitter.emit('ui:webview:message', webviewId, message)
        };
        
        this.registry.webviews.set(webviewId, webview);
        return webview;
      },
      
      showQuickPicker: async (items: QuickPickItem[], options?: QuickPickOptions): Promise<QuickPickItem | null> => {
        this.checkPermissions(extensionName, ['ui.render']);
        // Return quick picker implementation
        return null;
      },
      
      updateStatusBarItem: (id: string, text: string, tooltip?: string): void => {
        this.checkPermissions(extensionName, ['ui.render']);
        this.registerStatusBarItem(extensionName, id, text, tooltip);
      }
    };
  }

  /**
   * Create Storage API
   */
  private createStorageAPI(extensionName: string): StorageAPI {
    const getExtensionId = () => extensionName;
    
    return {
      getGlobal: async (key: string, defaultValue?: any): Promise<any> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Return global storage value
        return defaultValue;
      },
      
      setGlobal: async (key: string, value: any): Promise<void> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Set global storage value
      },
      
      deleteGlobal: async (key: string): Promise<void> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Delete global storage value
      },
      
      getWorkspace: async (key: string, defaultValue?: any): Promise<any> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Return workspace storage value
        return defaultValue;
      },
      
      setWorkspace: async (key: string, value: any): Promise<void> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Set workspace storage value
      },
      
      deleteWorkspace: async (key: string): Promise<void> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Delete workspace storage value
      },
      
      getExtension: async (key: string, defaultValue?: any): Promise<any> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Return extension storage value
        const instance = this.registry.extensions.get(extensionName);
        return instance?.config[key] ?? defaultValue;
      },
      
      setExtension: async (key: string, value: any): Promise<void> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Set extension storage value
        const instance = this.registry.extensions.get(extensionName);
        if (instance) {
          instance.config[key] = value;
        }
      },
      
      deleteExtension: async (key: string): Promise<void> => {
        this.checkPermissions(extensionName, ['storage.persistent']);
        // Delete extension storage value
        const instance = this.registry.extensions.get(extensionName);
        if (instance) {
          delete instance.config[key];
        }
      }
    };
  }

  /**
   * Create Config API
   */
  private createConfigAPI(extensionName: string): ConfigAPI {
    return {
      get: async (section?: string): Promise<any> => {
        this.checkPermissions(extensionName, ['settings.read']);
        // Return IDE configuration
        return null;
      },
      
      set: async (section: string, value: any): Promise<void> => {
        this.checkPermissions(extensionName, ['settings.write']);
        // Set IDE configuration
      },
      
      getWorkspace: async (section?: string): Promise<any> => {
        this.checkPermissions(extensionName, ['settings.read']);
        // Return workspace configuration
        return null;
      },
      
      setWorkspace: async (section: string, value: any): Promise<void> => {
        this.checkPermissions(extensionName, ['settings.write']);
        // Set workspace configuration
      },
      
      getExtension: async (section?: string): Promise<any> => {
        this.checkPermissions(extensionName, ['settings.read']);
        const instance = this.registry.extensions.get(extensionName);
        return instance?.config[section || 'default'] ?? null;
      },
      
      setExtension: async (section: string, value: any): Promise<void> => {
        this.checkPermissions(extensionName, ['settings.write']);
        const instance = this.registry.extensions.get(extensionName);
        if (instance) {
          instance.config[section] = value;
        }
      }
    };
  }

  /**
   * Create Events API
   */
  private createEventsAPI(extensionName: string): EventsAPI {
    return {
      emit: (event: string, ...args: any[]): void => {
        this.eventEmitter.emit(event, ...args);
      },
      
      on: (event: string, callback: (...args: any[]) => void): (() => void) => {
        this.eventEmitter.on(event, callback);
        
        // Store for cleanup
        if (!this.registry.eventListeners.has(extensionName)) {
          this.registry.eventListeners.set(extensionName, new Map());
        }
        const listeners = this.registry.eventListeners.get(extensionName)!;
        listeners.set(event, callback);
        
        return () => {
          this.eventEmitter.off(event, callback);
          listeners.delete(event);
        };
      },
      
      once: (event: string, callback: (...args: any[]) => void): (() => void) => {
        this.eventEmitter.once(event, callback);
        
        // Store for cleanup
        if (!this.registry.eventListeners.has(extensionName)) {
          this.registry.eventListeners.set(extensionName, new Map());
        }
        const listeners = this.registry.eventListeners.get(extensionName)!;
        listeners.set(event, callback);
        
        return () => {
          this.eventEmitter.off(event, callback);
          listeners.delete(event);
        };
      },
      
      removeAllListeners: (event?: string): void => {
        if (event) {
          this.eventEmitter.removeAllListeners(event);
        } else {
          this.eventEmitter.removeAllListeners();
        }
      }
    };
  }

  /**
   * Create HTTP API
   */
  private createHTTPAPI(extensionName: string): HTTPAPI {
    return {
      request: async (url: string, options: HTTPOptions = {}): Promise<HTTPResponse> => {
        this.checkPermissions(extensionName, ['network.request']);
        
        // Basic HTTP request implementation
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url, {
          method: options.method || 'GET',
          headers: options.headers,
          body: options.body,
          timeout: options.timeout
        });
        
        const data = await response.text();
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data
        };
      },
      
      get: async (url: string, headers?: Record<string, string>): Promise<HTTPResponse> => {
        return this.request(url, { method: 'GET', headers });
      },
      
      post: async (url: string, data?: any, headers?: Record<string, string>): Promise<HTTPResponse> => {
        return this.request(url, { method: 'POST', body: data, headers });
      },
      
      put: async (url: string, data?: any, headers?: Record<string, string>): Promise<HTTPResponse> => {
        return this.request(url, { method: 'PUT', body: data, headers });
      },
      
      delete: async (url: string, headers?: Record<string, string>): Promise<HTTPResponse> => {
        return this.request(url, { method: 'DELETE', headers });
      }
    };
  }

  /**
   * Create Logger API
   */
  private createLoggerAPI(extensionName: string): LoggerType {
    const baseLogger = {
      debug: (message: string, ...args: any[]): void => {
        console.log(`[${extensionName}] DEBUG: ${message}`, ...args);
      },
      
      info: (message: string, ...args: any[]): void => {
        console.log(`[${extensionName}] INFO: ${message}`, ...args);
      },
      
      warn: (message: string, ...args: any[]): void => {
        console.warn(`[${extensionName}] WARN: ${message}`, ...args);
      },
      
      error: (message: string, ...args: any[]): void => {
        console.error(`[${extensionName}] ERROR: ${message}`, ...args);
      },
      
      child: (context: Record<string, any>): LoggerType => {
        return {
          debug: (message: string, ...args: any[]) => 
            console.log(`[${extensionName}] DEBUG ${JSON.stringify(context)}: ${message}`, ...args),
          info: (message: string, ...args: any[]) => 
            console.log(`[${extensionName}] INFO ${JSON.stringify(context)}: ${message}`, ...args),
          warn: (message: string, ...args: any[]) => 
            console.warn(`[${extensionName}] WARN ${JSON.stringify(context)}: ${message}`, ...args),
          error: (message: string, ...args: any[]) => 
            console.error(`[${extensionName}] ERROR ${JSON.stringify(context)}: ${message}`, ...args),
          child: (childContext: Record<string, any>) => 
            this.createLoggerAPI(extensionName).child({ ...context, ...childContext })
        };
      }
    };
    
    return baseLogger;
  }

  /**
   * Setup permissions for extension
   */
  private setupPermissions(manifest: ExtensionManifest): void {
    const permissions = new Set(manifest.permissions);
    this.permissionMatrix.set(manifest.name, permissions);
  }

  /**
   * Check extension permissions
   */
  private checkPermissions(extensionName: string, requiredPermissions: string[]): void {
    const grantedPermissions = this.permissionMatrix.get(extensionName);
    if (!grantedPermissions) {
      throw new Error(`No permissions found for extension '${extensionName}'`);
    }

    for (const permission of requiredPermissions) {
      if (!grantedPermissions.has(permission)) {
        throw new Error(`Extension '${extensionName}' does not have permission '${permission}'`);
      }
    }
  }

  /**
   * Setup extension event listeners
   */
  private setupExtensionEventListeners(instance: ExtensionInstance): void {
    // Setup configuration change listener
    this.eventEmitter.on('config:changed', (changedExtension: string) => {
      if (changedExtension === instance.manifest.name && instance.instance.onConfigChange) {
        instance.instance.onConfigChange(instance.config);
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Handle extension lifecycle events
    this.eventEmitter.on('extension:activated', (name: string, instance: ExtensionInstance) => {
      console.log(`Extension ${name} activated`);
    });

    this.eventEmitter.on('extension:deactivated', (name: string, instance: ExtensionInstance) => {
      console.log(`Extension ${name} deactivated`);
    });
  }

  /**
   * Cleanup extension events
   */
  private cleanupExtensionEvents(extensionName: string): void {
    const listeners = this.registry.eventListeners.get(extensionName);
    if (listeners) {
      for (const [event, callback] of listeners) {
        this.eventEmitter.off(event, callback);
      }
      this.registry.eventListeners.delete(extensionName);
    }

    const timeouts = this.registry.activeEvents.get(extensionName);
    if (timeouts) {
      timeouts.forEach(timeout => clearTimeout(timeout));
      this.registry.activeEvents.delete(extensionName);
    }
  }

  /**
   * Cleanup extension webviews
   */
  private cleanupExtensionWebviews(extensionName: string): void {
    for (const [id, webview] of this.registry.webviews) {
      if (id.startsWith(extensionName)) {
        webview.dispose();
        this.registry.webviews.delete(id);
      }
    }
  }

  /**
   * Cleanup extension commands
   */
  private cleanupExtensionCommands(extensionName: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.registry.commands.keys()) {
      if (key.startsWith(`${extensionName}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.registry.commands.delete(key));
  }

  /**
   * Cleanup extension keybindings
   */
  private cleanupExtensionKeybindings(extensionName: string): void {
    this.registry.keybindings.delete(extensionName);
  }

  /**
   * Cleanup extension status bar items
   */
  private cleanupExtensionStatusBarItems(extensionName: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.registry.statusBarItems.keys()) {
      if (key.startsWith(`${extensionName}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.registry.statusBarItems.delete(key));
  }

  /**
   * Initialize extension storage
   */
  private async initializeExtensionStorage(instance: ExtensionInstance): Promise<void> {
    // Initialize extension's persistent storage
    // This could involve creating storage directories, loading existing data, etc.
    console.log(`Initialized storage for extension ${instance.manifest.name}`);
  }

  /**
   * Get extension statistics
   */
  getStatistics(): {
    total: number;
    active: number;
    inactive: number;
    withErrors: number;
    permissions: Map<string, number>;
  } {
    const extensions = this.getAllExtensions();
    const active = extensions.filter(ext => ext.state === 'active').length;
    const inactive = extensions.filter(ext => ext.state === 'inactive').length;
    const withErrors = extensions.filter(ext => ext.state === 'error').length;
    
    const permissions = new Map<string, number>();
    for (const [name, perms] of this.permissionMatrix) {
      for (const perm of perms) {
        permissions.set(perm, (permissions.get(perm) || 0) + 1);
      }
    }

    return {
      total: extensions.length,
      active,
      inactive,
      withErrors,
      permissions
    };
  }
}