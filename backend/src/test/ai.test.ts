import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestServer } from '../test-utils';

describe('AI Endpoints', () => {
  let testServer: Awaited<ReturnType<typeof createTestServer>>;

  beforeEach(async () => {
    testServer = await createTestServer();
  });

  afterEach(() => {
    testServer.close();
  });

  describe('POST /ai/chat', () => {
    it('should handle chat completion', async () => {
      const response = await testServer.request
        .post('/api/ai/chat')
        .send({
          provider: 'codestral',
          messages: [
            { role: 'user', content: 'Hello' }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('provider', 'codestral');
    });

    it('should validate request body', async () => {
      const response = await testServer.request
        .post('/api/ai/chat')
        .send({
          // Missing required fields
          messages: []
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /ai/complete', () => {
    it('should handle code completion', async () => {
      const response = await testServer.request
        .post('/api/ai/complete')
        .send({
          provider: 'codestral',
          prefix: 'function hello() {\n  console.log("',
          suffix: '");\n}',
          language: 'javascript'
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('provider', 'codestral');
      expect(response.body).toHaveProperty('language', 'javascript');
    });

    it('should validate completion request', async () => {
      const response = await testServer.request
        .post('/api/ai/complete')
        .send({
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /ai/stream', () => {
    it('should handle streaming completion', async () => {
      const response = await testServer.request
        .post('/api/ai/stream')
        .send({
          provider: 'codestral',
          prefix: 'console.log("',
          suffix: '");',
          language: 'javascript'
        })
        .expect(200);

      expect(response.body).toHaveProperty('stream', true);
      expect(response.body).toHaveProperty('eventType', 'start');
    });
  });
});