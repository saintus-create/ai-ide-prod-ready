export type AIProvider = 'codestral' | 'chatgpt-oss' | 'dkimi';

export interface CompletionRequest {
  prefix: string;
  suffix?: string;
  language: string;
  maxTokens?: number;
}

export interface CompletionResponse {
  completion: string;
}

export interface ChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

// Extension System Types
export interface Extension {
  id: string;
  name: string;
  manifest: ExtensionManifest;
  state: 'loading' | 'active' | 'inactive' | 'error' | 'disabled';
  installedAt: Date;
  lastActivated?: Date;
  error?: string;
  config: Record<string, any>;
}

export interface ExtensionManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  main: string;
  permissions: string[];
  dependencies?: Record<string, string>;
  ideVersion?: {
    min: string;
    max: string;
  };
  categories: string[];
  keywords?: string[];
  homepage?: string;
  repository?: string;
  license?: string;
  configSchema?: Record<string, any>;
  defaultConfig?: Record<string, any>;
}

export interface ExtensionState {
  loading: boolean;
  installedExtensions: Set<string>;
  activeExtensions: Extension[];
  extensionsWithErrors: Extension[];
}

export interface ExtensionInstallOptions {
  manifest: string;
  source?: 'local' | 'marketplace' | 'url';
  config?: Record<string, any>;
}