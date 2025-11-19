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