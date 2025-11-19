import axios from 'axios';
import { AIProvider } from '@/types';
import { CompletionRequest, CompletionResponse, ChatRequest } from '@/types';

export function useAI() {
  const requestCompletion = async (
    payload: CompletionRequest,
    provider: AIProvider = 'codestral'
  ): Promise<CompletionResponse> => {
    const res = await axios.post<CompletionResponse>('/api/ai/completion', {
      ...payload,
      provider,
    });
    return res.data;
  };

  const chat = async (payload: ChatRequest, provider: AIProvider = 'codestral'): Promise<string> => {
    const res = await axios.post<{ reply: string }>('/api/ai/chat', {
      ...payload,
      provider,
    });
    return res.data.reply;
  };

  return { requestCompletion, chat };
}