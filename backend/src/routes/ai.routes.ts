import { Router } from 'express';
import { getCompletion, getChat } from '../ai';
import { AIProvider } from '../ai/models';
import { CompletionRequest, ChatRequest } from '../types';
import { z } from 'zod';

const router = Router();

const providerSchema = z.enum(Object.values(AIProvider) as [AIProvider, ...AIProvider[]]);

router.post('/completion', async (req, res, next) => {
  try {
    const provider = providerSchema.parse(
      req.query.provider ?? req.body.provider ?? req.headers['x-ai-provider']
    );
    const body: CompletionRequest = req.body;
    const result = await getCompletion(provider, body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/chat', async (req, res, next) => {
  try {
    const provider = providerSchema.parse(
      req.query.provider ?? req.body.provider ?? req.headers['x-ai-provider']
    );
    const body: ChatRequest = req.body;
    const reply = await getChat(provider, body);
    res.json({ reply });
  } catch (e) {
    next(e);
  }
});

export default router;