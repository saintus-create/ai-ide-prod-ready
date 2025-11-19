import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestServer } from '../test-utils';

describe('Health Endpoints', () => {
  let testServer: Awaited<ReturnType<typeof createTestServer>>;

  beforeEach(async () => {
    testServer = await createTestServer();
  });

  afterEach(() => {
    testServer.close();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await testServer.request
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('aiProvider');
    });

    it('should include correct system information', async () => {
      const response = await testServer.request
        .get('/api/health')
        .expect(200);

      expect(response.body.memory).toHaveProperty('used');
      expect(response.body.memory).toHaveProperty('total');
      expect(response.body.memory).toHaveProperty('percentage');
      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('heapTotal');

      expect(response.body.database).toHaveProperty('status');
      expect(response.body.database).toHaveProperty('type');

      expect(response.body.aiProvider).toHaveProperty('available');
      expect(response.body.aiProvider).toHaveProperty('codestral');
      expect(response.body.aiProvider).toHaveProperty('huggingface');
    });
  });
});