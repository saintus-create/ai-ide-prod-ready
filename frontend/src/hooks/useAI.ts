import axios from 'axios';
import { AIProvider } from '@/types';
import { CompletionRequest, CompletionResponse, ChatRequest } from '@/types';

// Use environment variable for API URL, with fallback for development
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useAI() {
  const requestCompletion = async (
    payload: CompletionRequest,
    provider: AIProvider = 'codestral'
  ): Promise<CompletionResponse> => {
    const res = await axios.post<CompletionResponse>(`${apiUrl}/api/ai/completion`, {
      ...payload,
      provider,
    });
    return res.data;
  };

  const chat = async (payload: ChatRequest, provider: AIProvider = 'codestral'): Promise<string> => {
    const res = await axios.post<{ reply: string }>(`${apiUrl}/api/ai/chat`, {
      ...payload,
      provider,
    });
    return res.data.reply;
  };

  return { requestCompletion, chat };
}