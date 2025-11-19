import { AIProvider, HF_MODEL_MAP } from './models';
import { codestralFIM, mistralChat } from './codestral';
import { hfChat, hfCompletion } from './huggingface';
import { CompletionRequest, CompletionResponse, ChatRequest } from '../types';
import { z } from 'zod';

/* -----------------------------------------------------------------
   PUBLIC API – Completion
   ----------------------------------------------------------------- */
export async function getCompletion(
  provider: AIProvider,
  req: CompletionRequest
): Promise<CompletionResponse> {
  switch (provider) {
    case AIProvider.Codestral:
      return codestralFIM(req);

    case AIProvider.ChatGPTOSS:
    case AIProvider.DKimi:
      const modelId = HF_MODEL_MAP[provider];
      const prompt = `${req.prefix || ''}${req.suffix ? '\n' + req.suffix : ''}`;
      const completion = await hfCompletion(modelId, prompt, req.maxTokens ?? 120, 0.2);
      return { completion };

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/* -----------------------------------------------------------------
   PUBLIC API – Chat
   ----------------------------------------------------------------- */
export async function getChat(provider: AIProvider, req: ChatRequest): Promise<string> {
  const messages = req.messages.map((m) => ({ role: m.role, content: m.content }));

  switch (provider) {
    case AIProvider.ChatGPTOSS:
    case AIProvider.DKimi:
      const modelId = HF_MODEL_MAP[provider];
      return hfChat(modelId, messages, req.temperature ?? 0.3);

    case AIProvider.Codestral:
      // Re‑use the existing Mistral chat client (still works)
      return mistralChat(req);

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}