/**
 * Extension System Type Definitions
 * Defines the complete type system for the AI-IDE extension framework
 */

export interface ExtensionManifest {
  /** Extension identifier (kebab-case) */
  name: string;
  
  /** Human-readable extension name */
  displayName: string;
  
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  
  /** Extension description */
  description: string;
  
  /** Author information */
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  
  /** Entry point file */
  main: string;
  
  /** Extension permissions */
  permissions: ExtensionPermission[];
  
  /** Extension dependencies */
  dependencies?: Record<string, string>;
  
  /** Compatible IDE versions */
  ideVersion?: {
    min: string;
    max: string;
  };
  
  /** Extension categories */
  categories: ExtensionCategory[];
  
  /** Keywords for search */
  keywords?: string[];
  
  /** Homepage or documentation URL */
  homepage?: string;
  
  /** Repository URL */
  repository?: string;
  
  /** License identifier */
  license?: string;
  
  /** Extension configuration schema */
  configSchema?: Record<string, any>;
  
  /** Default configuration values */
  defaultConfig?: Record<string, any>;
}

export type ExtensionPermission = 
  | 'workspace.read'
  | 'workspace.write'
  | 'workspace.fileSystem'
  | 'editor.read'
  | 'editor.write'
  | 'terminal.execute'
  | 'terminal.read'
  | 'ai.request'
  | 'git.read'
  | 'git.write'
  | 'settings.read'
  | 'settings.write'
  | 'ui.render'
  | 'ui.command'
  | 'ui.shortcut'
  | 'network.request'
  | 'storage.persistent';

export type ExtensionCategory = 
  | 'productivity'
  | 'themes'
  | 'language-support'
  | 'debugging'
  | 'git'
  | 'ai-tools'
  | 'integration'
  | 'utility'
  | 'snippets'
  | 'other';

export interface ExtensionInstance {
  /** Extension ID */
  id: string;
  
  /** Extension manifest */
  manifest: ExtensionManifest;
  
  /** Extension state */
  state: ExtensionState;
  
  /** Loaded module (if applicable) */
  module?: any;
  
  /** Extension instance (if applicable) */
  instance?: any;
  
  /** Error information */
  error?: Error | null;
  
  /** Installation timestamp */
  installedAt: Date;
  
  /** Last activation timestamp */
  lastActivated?: Date;
  
  /** Configuration */
  config: Record<string, any>;
}

export type ExtensionState = 
  | 'loading'
  | 'active'
  | 'inactive'
  | 'error'
  | 'disabled';

export interface ExtensionAPI {
  /** Workspace API */
  workspace: WorkspaceAPI;
  
  /** Editor API */
  editor: EditorAPI;
  
  /** Terminal API */
  terminal: TerminalAPI;
  
  /** AI API */
  ai: AIAPI;
  
  /** Git API */
  git: GitAPI;
  
  /** UI API */
  ui: UIAPI;
  
  /** Storage API */
  storage: StorageAPI;
  
  /** Configuration API */
  config: ConfigAPI;
  
  /** Events API */
  events: EventsAPI;
  
  /** HTTP API */
  http: HTTPAPI;
  
  /** Logger */
  logger: LoggerAPI;
}

export interface WorkspaceAPI {
  /** Read file contents */
  readFile(path: string): Promise<string>;
  
  /** Write file contents */
  writeFile(path: string, content: string): Promise<void>;
  
  /** Delete file or directory */
  delete(path: string): Promise<void>;
  
  /** List directory contents */
  listDirectory(path: string): Promise<WorkspaceItem[]>;
  
  /** Create directory */
  createDirectory(path: string): Promise<void>;
  
  /** Get file/directory info */
  getInfo(path: string): Promise<WorkspaceItem>;
  
  /** Search files */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  
  /** Watch for changes */
  watch(paths: string[], callback: (change: FileChangeEvent) => void): () => void;
}

export interface EditorAPI {
  /** Get active editor state */
  getActiveEditor(): EditorState | null;
  
  /** Execute command in editor */
  executeCommand(command: string, ...args: any[]): Promise<any>;
  
  /** Insert text at cursor */
  insertText(text: string): Promise<void>;
  
  /** Get selection */
  getSelection(): EditorSelection | null;
  
  /** Set selection */
  setSelection(selection: EditorSelection): Promise<void>;
  
  /** Get current line */
  getCurrentLine(): string;
  
  /** Get current position */
  getCursorPosition(): CursorPosition;
  
  /** Format document */
  format(): Promise<void>;
  
  /** Find and replace */
  findReplace(find: string, replace: string, options?: FindOptions): Promise<boolean>;
  
  /** Add text change listener */
  onTextChange(callback: (change: TextChangeEvent) => void): () => void;
  
  /** Add cursor change listener */
  onCursorChange(callback: (position: CursorPosition) => void): () => void;
}

export interface TerminalAPI {
  /** Execute command */
  execute(command: string, cwd?: string): Promise<TerminalResult>;
  
  /** Get terminal history */
  getHistory(): TerminalHistoryEntry[];
  
  /** Clear terminal */
  clear(): Promise<void>;
  
  /** Kill process */
  kill(sessionId: string): Promise<void>;
  
  /** Resize terminal */
  resize(sessionId: string, cols: number, rows: number): Promise<void>;
  
  /** Listen for output */
  onOutput(callback: (output: TerminalOutputEvent) => void): () => void;
}

export interface AIAPI {
  /** Send chat message */
  chat(message: string, options?: ChatOptions): Promise<AIMessage>;
  
  /** Stream chat response */
  streamChat(message: string, options?: ChatOptions): AsyncGenerator<AIMessage, void, unknown>;
  
  /** Generate code */
  generateCode(prompt: string, language?: string): Promise<string>;
  
  /** Analyze code */
  analyzeCode(code: string, language?: string): Promise<CodeAnalysis>;
  
  /** Get completion */
  complete(text: string, position: number, language?: string): Promise<Completion[]>;
}

export interface GitAPI {
  /** Get repository status */
  getStatus(): Promise<GitStatus>;
  
  /** Get branches */
  getBranches(): Promise<GitBranch[]>;
  
  /** Create branch */
  createBranch(name: string): Promise<void>;
  
  /** Switch branch */
  switchBranch(name: string): Promise<void>;
  
  /** Commit changes */
  commit(message: string): Promise<void>;
  
  /** Push changes */
  push(remote?: string, branch?: string): Promise<void>;
  
  /** Pull changes */
  pull(remote?: string, branch?: string): Promise<void>;
  
  /** Get commits */
  getCommits(count?: number): Promise<GitCommit[]>;
  
  /** Get diff */
  getDiff(file?: string): Promise<string>;
}

export interface UIAPI {
  /** Show notification */
  showNotification(message: string, type?: NotificationType): void;
  
  /** Show input dialog */
  showInputDialog(title: string, options?: InputOptions): Promise<string | null>;
  
  /** Show confirmation dialog */
  showConfirmationDialog(title: string, message: string): Promise<boolean>;
  
  /** Register command */
  registerCommand(id: string, title: string, command: () => Promise<void> | void): void;
  
  /** Register keybinding */
  registerKeybinding(key: string, command: string): void;
  
  /** Create webview */
  createWebview(options: WebviewOptions): Promise<WebviewHandle>;
  
  /** Show quick picker */
  showQuickPicker(items: QuickPickItem[], options?: QuickPickOptions): Promise<QuickPickItem | null>;
  
  /** Update status bar item */
  updateStatusBarItem(id: string, text: string, tooltip?: string): void;
}

export interface StorageAPI {
  /** Get global value */
  getGlobal(key: string, defaultValue?: any): Promise<any>;
  
  /** Set global value */
  setGlobal(key: string, value: any): Promise<void>;
  
  /** Delete global value */
  deleteGlobal(key: string): Promise<void>;
  
  /** Get workspace value */
  getWorkspace(key: string, defaultValue?: any): Promise<any>;
  
  /** Set workspace value */
  setWorkspace(key: string, value: any): Promise<void>;
  
  /** Delete workspace value */
  deleteWorkspace(key: string): Promise<void>;
  
  /** Get extension value */
  getExtension(key: string, defaultValue?: any): Promise<any>;
  
  /** Set extension value */
  setExtension(key: string, value: any): Promise<void>;
  
  /** Delete extension value */
  deleteExtension(key: string): Promise<void>;
}

export interface ConfigAPI {
  /** Get configuration */
  get(section?: string): Promise<any>;
  
  /** Set configuration */
  set(section: string, value: any): Promise<void>;
  
  /** Get workspace configuration */
  getWorkspace(section?: string): Promise<any>;
  
  /** Set workspace configuration */
  setWorkspace(section: string, value: any): Promise<void>;
  
  /** Get extension configuration */
  getExtension(section?: string): Promise<any>;
  
  /** Set extension configuration */
  setExtension(section: string, value: any): Promise<void>;
}

export interface EventsAPI {
  /** Emit event */
  emit(event: string, ...args: any[]): void;
  
  /** Listen to event */
  on(event: string, callback: (...args: any[]) => void): () => void;
  
  /** Listen to event once */
  once(event: string, callback: (...args: any[]) => void): () => void;
  
  /** Remove all listeners */
  removeAllListeners(event?: string): void;
}

export interface HTTPAPI {
  /** Make HTTP request */
  request(url: string, options?: HTTPOptions): Promise<HTTPResponse>;
  
  /** Make GET request */
  get(url: string, headers?: Record<string, string>): Promise<HTTPResponse>;
  
  /** Make POST request */
  post(url: string, data?: any, headers?: Record<string, string>): Promise<HTTPResponse>;
  
  /** Make PUT request */
  put(url: string, data?: any, headers?: Record<string, string>): Promise<HTTPResponse>;
  
  /** Make DELETE request */
  delete(url: string, headers?: Record<string, string>): Promise<HTTPResponse>;
}

export interface LoggerAPI {
  /** Log debug message */
  debug(message: string, ...args: any[]): void;
  
  /** Log info message */
  info(message: string, ...args: any[]): void;
  
  /** Log warning message */
  warn(message: string, ...args: any[]): void;
  
  /** Log error message */
  error(message: string, ...args: any[]): void;
  
  /** Create child logger */
  child(context: Record<string, any>): LoggerAPI;
}

// Supporting types for API interfaces
export interface WorkspaceItem {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  isFile(): boolean;
  isDirectory(): boolean;
}

export interface SearchOptions {
  include?: string[];
  exclude?: string[];
  maxResults?: number;
  caseSensitive?: boolean;
}

export interface SearchResult {
  path: string;
  line?: number;
  column?: number;
  match: string;
  preview: string;
}

export interface FileChangeEvent {
  type: 'created' | 'changed' | 'deleted';
  path: string;
  content?: string;
  timestamp: Date;
}

export interface EditorState {
  file: string;
  content: string;
  selection: EditorSelection;
  cursor: CursorPosition;
}

export interface EditorSelection {
  start: CursorPosition;
  end: CursorPosition;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface TextChangeEvent {
  content: string;
  selection: EditorSelection;
  timestamp: Date;
}

export interface FindOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  replace?: boolean;
}

export interface TerminalResult {
  output: string;
  exitCode: number;
  duration: number;
}

export interface TerminalHistoryEntry {
  command: string;
  output: string;
  timestamp: Date;
  exitCode: number;
}

export interface TerminalOutputEvent {
  sessionId: string;
  output: string;
  timestamp: Date;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string[];
}

export interface CodeAnalysis {
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  complexity?: number;
  quality?: number;
}

export interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface CodeSuggestion {
  type: 'refactor' | 'optimization' | 'best-practice';
  message: string;
  code?: string;
}

export interface Completion {
  label: string;
  kind: string;
  detail?: string;
  documentation?: string;
  insertText: string;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: FileStatus[];
  modified: FileStatus[];
  untracked: FileStatus[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  tracking?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: Date;
  files: string[];
}

export interface FileStatus {
  path: string;
  status: string;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface InputOptions {
  placeholder?: string;
  password?: boolean;
  validate?: (value: string) => string | null;
}

export interface WebviewOptions {
  title: string;
  html: string;
  showOptionsMenu?: boolean;
  allowScripts?: boolean;
}

export interface WebviewHandle {
  id: string;
  show(): void;
  hide(): void;
  dispose(): void;
  postMessage(message: any): void;
}

export interface QuickPickItem {
  label: string;
  description?: string;
  detail?: string;
  picked?: boolean;
}

export interface QuickPickOptions {
  placeHolder?: string;
  canPickMany?: boolean;
  matchOnDescription?: boolean;
  matchOnDetail?: boolean;
}

export interface HTTPOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  followRedirects?: boolean;
}

export interface HTTPResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

// Extension lifecycle hooks
export interface ExtensionLifecycle {
  /** Called when extension is loaded */
  onLoad?(): Promise<void> | void;
  
  /** Called when extension is activated */
  onActivate?(): Promise<void> | void;
  
  /** Called when extension is deactivated */
  onDeactivate?(): Promise<void> | void;
  
  /** Called when extension configuration changes */
  onConfigChange?(config: any): Promise<void> | void;
  
  /** Extension dispose method */
  dispose?(): Promise<void> | void;
}

// Extension context passed to extension modules
export interface ExtensionContext {
  /** Extension instance ID */
  extensionId: string;
  
  /** Extension manifest */
  manifest: ExtensionManifest;
  
  /** Extension API */
  api: ExtensionAPI;
  
  /** Extension configuration */
  config: Record<string, any>;
  
  /** Logger for this extension */
  logger: LoggerAPI;
  
  /** Storage for this extension */
  storage: StorageAPI;
}

// Extension execution result
export interface ExtensionExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

// Extension error details
export interface ExtensionError {
  extensionId: string;
  message: string;
  stack?: string;
  timestamp: Date;
  fatal?: boolean;
}