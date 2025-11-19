export enum AIProvider {
  Codestral = 'codestral',
  ChatGPTOSS = 'chatgpt-oss',
  DKimi = 'dkimi',
}

/** Only the Hugging Face providers need a model ID map */
export const HF_MODEL_MAP: Record<AIProvider.ChatGPTOSS | AIProvider.DKimi, string> = {
  [AIProvider.ChatGPTOSS]: 'OpenChatKit/ChatGPT-OSS',
  [AIProvider.DKimi]: 'kakaoenterprise/dkimi',
};