import * as fs from 'fs';
import * as path from 'path';

export const CODESTRAL_API_KEY = process.env.CODESTRAL_API_KEY!;
export const MISTRAL_API_KEY   = process.env.MISTRAL_API_KEY!;
export const HF_TOKEN          = process.env.HF_TOKEN ??
  // If you mount Docker secret at /run/secrets/hf_token, read it:
  (fs.existsSync('/run/secrets/hf_token')
    ? fs.readFileSync('/run/secrets/hf_token', 'utf8').trim()
    : '');

export const ALLOWED_PROVIDERS = (process.env.ALLOWED_PROVIDERS ?? 'codestral,chatgpt-oss,dkimi')
  .split(',')
  .map((p) => p.trim().toLowerCase());