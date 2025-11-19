export interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  context?: string;
  language?: string;
  prefix?: string;
  suffix?: string;
}

export interface CompletionResponse {
  text: string;
  completion?: string;
  tokens?: number;
  model?: string;
  provider?: string;
}

export interface ChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

export interface ChatResponse {
  reply: string;
  tokens?: number;
  model?: string;
  provider?: string;
}

export interface GitStatus {
  status: 'clean' | 'dirty';
  files: Array<{
    index: string;
    working_dir: string;
    path: string;
  }>;
  staged: string[];
  modified: string[];
  not_added: string[];
  deleted: string[];
  renamed: string[];
  ahead: number;
  behind: number;
  isClean(): boolean;
}

export interface WorkspaceFile {
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: string;
  path: string;
}

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  responseTime: string;
  checks: {
    workspace: {
      status: 'healthy' | 'unhealthy';
      message: string;
    };
    environment: {
      status: 'healthy' | 'partial' | 'unhealthy';
      message: string;
      missing?: string[];
    };
    memory: {
      status: 'healthy';
      used: number;
      total: number;
      unit: string;
    };
    uptime: {
      status: 'healthy';
      seconds: number;
      humanReadable: string;
    };
  };
  version: string;
  node: string;
  platform: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
}

export interface APIResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreamChunk {
  type: 'completion' | 'chat' | 'error' | 'done';
  data?: string;
  error?: string;
  token?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  status?: number;
  details?: any;
}
