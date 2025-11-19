import https from 'https';
import { CODESTRAL_API_KEY } from '../../config';
import { CompletionRequest, CompletionResponse, ChatRequest } from '../types';
import { z } from 'zod';

export async function codestralFIM(req: CompletionRequest): Promise<CompletionResponse> {
  const schema = z.object({
    prefix: z.string(),
    suffix: z.string().optional(),
    language: z.string(),
    maxTokens: z.number().optional(),
  });
  const data = schema.parse(req);

  const payload = {
    model: 'codestral-22b',
    prompt: `<suffix>${data.suffix ?? ''}</suffix><prefix>${data.prefix}</prefix><middle>`,
    max_tokens: data.maxTokens ?? 120,
    temperature: 0.2,
    stop: ['</middle>', '<prefix>', '<suffix>'],
  };

  const raw = await postJSON<any>('https://codestral.mistral.ai/v1/fim/completions', payload, CODESTRAL_API_KEY);
  const completion = raw?.choices?.[0]?.message?.content ?? '';
  return { completion };
}

/**
 * Helper – generic HTTPS POST that returns parsed JSON.
 */
function postJSON<T>(url: string, payload: any, token: string): Promise<T> {
  const parsed = new URL(url);
  const options = {
    hostname: parsed.hostname,
    path: parsed.pathname,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  return new Promise<T>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/* --------------------------------------------------------------
   Optional: Mistral‑style chat (kept for backwards compatibility)
   -------------------------------------------------------------- */
export async function mistralChat(req: ChatRequest): Promise<string> {
  const payload = {
    model: 'mistral-large-latest',
    messages: req.messages,
    temperature: req.temperature ?? 0.3,
  };
  const raw = await postJSON<any>('https://api.mistral.ai/v1/chat/completions', payload, MISTRAL_API_KEY);
  return raw?.choices?.[0]?.message?.content ?? '';
}