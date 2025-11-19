import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestServer } from '../test-utils';
import fs from 'fs/promises';
import path from 'path';

describe('Git Endpoints', () => {
  let testServer: Awaited<ReturnType<typeof createTestServer>>;
  const testWorkspacePath = path.join(process.cwd(), 'test-git-workspace');

  beforeEach(async () => {
    testServer = await createTestServer();
    // Create test workspace
    await fs.mkdir(testWorkspacePath, { recursive: true });
    await fs.writeFile(path.join(testWorkspacePath, 'test.txt'), 'test content');
  });

  afterEach(async () => {
    testServer.close();
    // Clean up test workspace
    try {
      await fs.rm(testWorkspacePath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('GET /git/status', () => {
    it('should return git status', async () => {
      const response = await testServer.request
        .get('/api/git/status')
        .query({ path: testWorkspacePath })
        .expect(200);

      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('staged');
      expect(response.body).toHaveProperty('unstaged');
      expect(response.body).toHaveProperty('untracked');
    });
  });

  describe('GET /git/branches', () => {
    it('should return git branches', async () => {
      const response = await testServer.request
        .get('/api/git/branches')
        .query({ path: testWorkspacePath })
        .expect(200);

      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('branches');
      expect(Array.isArray(response.body.branches)).toBe(true);
    });
  });

  describe('GET /git/log', () => {
    it('should return git log', async () => {
      const response = await testServer.request
        .get('/api/git/log')
        .query({ 
          path: testWorkspacePath,
          limit: 10
        })
        .expect(200);

      expect(response.body).toHaveProperty('commits');
      expect(Array.isArray(response.body.commits)).toBe(true);
    });
  });

  describe('GET /git/diff', () => {
    it('should return git diff', async () => {
      const response = await testServer.request
        .get('/api/git/diff')
        .query({ path: testWorkspacePath })
        .expect(200);

      expect(response.body).toHaveProperty('diff');
    });
  });

  describe('POST /git/commit', () => {
    it('should commit changes', async () => {
      const response = await testServer.request
        .post('/api/git/commit')
        .send({
          path: testWorkspacePath,
          message: 'Test commit',
          author: {
            name: 'Test User',
            email: 'test@example.com'
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    it('should validate commit request', async () => {
      const response = await testServer.request
        .post('/api/git/commit')
        .send({
          // Missing required fields
          path: testWorkspacePath
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});