import { Router } from 'express';
import { getCompletion, getChat } from '../ai';
import { AIProvider } from '../ai/models';
import { CompletionRequest, ChatRequest } from '../types';
import { z } from 'zod';

const router = Router();

const providerSchema = z.enum(Object.values(AIProvider) as [AIProvider, ...AIProvider[]]);

// Enhanced completion schema with streaming parameters
const completionSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: providerSchema.optional(),
  maxTokens: z.number().min(1).max(4000).optional().default(100),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  context: z.string().optional(),
  language: z.string().optional(),
  stream: z.boolean().optional().default(false)
});

// Enhanced chat schema
const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1)
  })).min(1, 'At least one message required'),
  model: providerSchema.optional(),
  maxTokens: z.number().min(1).max(4000).optional().default(1000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  stream: z.boolean().optional().default(false)
});

// GET /api/ai/models - List available models
router.get('/models', async (req, res) => {
  try {
    const models = Object.values(AIProvider).map(provider => ({
      id: provider,
      name: getModelDisplayName(provider),
      provider: getProviderDisplayName(provider),
      description: getModelDescription(provider),
      capabilities: getModelCapabilities(provider)
    }));
    
    res.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch available models' 
    });
  }
});

// POST /api/ai/completion - Standard completion
router.post('/completion', async (req, res, next) => {
  try {
    const body = completionSchema.parse(req.body);
    const provider = body.model || providerSchema.parse(
      req.query.provider ?? req.headers['x-ai-provider']
    );
    
    const completionRequest: CompletionRequest = {
      prompt: body.prompt,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      context: body.context,
      language: body.language
    };
    
    const result = await getCompletion(provider, completionRequest);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// POST /api/ai/completion/stream - Streaming completion
router.post('/completion/stream', async (req, res, next) => {
  try {
    const body = completionSchema.parse({ ...req.body, stream: true });
    const provider = body.model || providerSchema.parse(
      req.query.provider ?? req.headers['x-ai-provider']
    );
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const completionRequest: CompletionRequest = {
      prompt: body.prompt,
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      context: body.context,
      language: body.language
    };
    
    // This would need to be implemented in the AI service
    // For now, we'll fall back to non-streaming
    const result = await getCompletion(provider, completionRequest);
    
    // Send as streaming data
    res.write(`data: ${JSON.stringify({ type: 'completion', data: result.text })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    console.error('Streaming completion error:', e);
    res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    res.end();
    next(e);
  }
});

// POST /api/ai/chat - Standard chat
router.post('/chat', async (req, res, next) => {
  try {
    const body = chatSchema.parse(req.body);
    const provider = body.model || providerSchema.parse(
      req.query.provider ?? req.body.provider ?? req.headers['x-ai-provider']
    );
    
    const chatRequest: ChatRequest = {
      messages: body.messages,
      maxTokens: body.maxTokens,
      temperature: body.temperature
    };
    
    const reply = await getChat(provider, chatRequest);
    res.json({ reply });
  } catch (e) {
    next(e);
  }
});

// POST /api/ai/chat/stream - Streaming chat
router.post('/chat/stream', async (req, res, next) => {
  try {
    const body = chatSchema.parse({ ...req.body, stream: true });
    const provider = body.model || providerSchema.parse(
      req.query.provider ?? req.body.provider ?? req.headers['x-ai-provider']
    );
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const chatRequest: ChatRequest = {
      messages: body.messages,
      maxTokens: body.maxTokens,
      temperature: body.temperature
    };
    
    // This would need to be implemented in the AI service for true streaming
    const reply = await getChat(provider, chatRequest);
    
    // Send as streaming data
    res.write(`data: ${JSON.stringify({ type: 'chat', data: reply })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    console.error('Streaming chat error:', e);
    res.write(`data: ${JSON.stringify({ type: 'error', error: e.message })}\n\n`);
    res.end();
    next(e);
  }
});

// Helper functions for model information
function getModelDisplayName(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.Codestral:
      return 'Codestral';
    case AIProvider.ChatGPTOSS:
      return 'ChatGPT-OSS';
    case AIProvider.DKimi:
      return 'dKimi';
    default:
      return provider;
  }
}

function getProviderDisplayName(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.Codestral:
      return 'Mistral AI';
    case AIProvider.ChatGPTOSS:
      return 'Hugging Face';
    case AIProvider.DKimi:
      return 'Hugging Face';
    default:
      return 'Unknown';
  }
}

function getModelDescription(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.Codestral:
      return 'Advanced code completion model by Mistral AI, optimized for programming tasks';
    case AIProvider.ChatGPTOSS:
      return 'Open-source chat model based on OpenChatKit, suitable for general conversations';
    case AIProvider.DKimi:
      return 'Korean-language chat model optimized for Korean text understanding and generation';
    default:
      return 'AI model for text generation and completion';
  }
}

function getModelCapabilities(provider: AIProvider): string[] {
  switch (provider) {
    case AIProvider.Codestral:
      return ['code-completion', 'code-generation', 'programming-languages'];
    case AIProvider.ChatGPTOSS:
      return ['chat', 'conversation', 'general-purpose'];
    case AIProvider.DKimi:
      return ['chat', 'korean-language', 'conversation'];
    default:
      return ['text-generation'];
  }
}

export default router;