import https from 'https';
import { URL } from 'url';
import { HF_TOKEN } from '../../config';

/**
 * Generic POST helper for the Hugging Face Inference API.
 * Returns parsed JSON.
 */
export function hfPost<T>(modelId: string, payload: any): Promise<T> {
  const endpoint = new URL(`https://api-inference.huggingface.co/models/${modelId}`);

  const options = {
    hostname: endpoint.hostname,
    path: endpoint.pathname,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
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
          reject(new Error(`HF JSON parse error: ${(e as Error).message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Chat endpoint – expects OpenAI‑style messages array.
 */
export async function hfChat(
  modelId: string,
  messages: { role: string; content: string }[],
  temperature = 0.3
) {
  const payload = {
    inputs: { messages },
    parameters: { temperature },
  };
  const raw = await hfPost<any>(modelId, payload);
  // Normalise the varied response shapes
  const content =
    raw?.generated_text ??
    raw?.choices?.[0]?.message?.content ??
    raw?.response ??
    '';
  return content;
}

/**
 * Completion endpoint – simple text prompt.
 */
export async function hfCompletion(
  modelId: string,
  prompt: string,
  maxTokens = 256,
  temperature = 0.2,
  stop?: string[]
) {
  const payload = {
    inputs: prompt,
    parameters: { max_new_tokens: maxTokens, temperature, stop },
  };
  const raw = await hfPost<any>(modelId, payload);
  return raw?.generated_text ?? raw?.output?.[0] ?? '';
}