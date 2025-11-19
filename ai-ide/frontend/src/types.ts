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