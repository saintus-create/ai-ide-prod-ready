import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestServer } from '../test-utils';
import fs from 'fs/promises';
import path from 'path';

describe('Workspace Endpoints', () => {
  let testServer: Awaited<ReturnType<typeof createTestServer>>;
  const testWorkspacePath = path.join(process.cwd(), 'test-workspace');

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

  describe('GET /workspace/files', () => {
    it('should list directory contents', async () => {
      const response = await testServer.request
        .get('/api/workspace/files')
        .query({ path: testWorkspacePath })
        .expect(200);

      expect(response.body).toHaveProperty('files');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0]).toHaveProperty('name', 'test.txt');
    });

    it('should handle non-existent paths', async () => {
      const response = await testServer.request
        .get('/api/workspace/files')
        .query({ path: '/non/existent/path' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should prevent directory traversal', async () => {
      const response = await testServer.request
        .get('/api/workspace/files')
        .query({ path: '../../../etc' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Directory traversal detected');
    });
  });

  describe('GET /workspace/file', () => {
    it('should read file content', async () => {
      const testFilePath = path.join(testWorkspacePath, 'test.txt');
      const response = await testServer.request
        .get('/api/workspace/file')
        .query({ path: testFilePath })
        .expect(200);

      expect(response.body).toHaveProperty('path', testFilePath);
      expect(response.body).toHaveProperty('content', 'test content');
    });

    it('should return 404 for non-existent files', async () => {
      const response = await testServer.request
        .get('/api/workspace/file')
        .query({ path: path.join(testWorkspacePath, 'nonexistent.txt') })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /workspace/file', () => {
    it('should create new file', async () => {
      const newFilePath = path.join(testWorkspacePath, 'new-file.txt');
      const response = await testServer.request
        .post('/api/workspace/file')
        .send({
          path: newFilePath,
          content: 'new file content'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('path', newFilePath);
    });

    it('should update existing file', async () => {
      const testFilePath = path.join(testWorkspacePath, 'test.txt');
      const response = await testServer.request
        .post('/api/workspace/file')
        .send({
          path: testFilePath,
          content: 'updated content'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('path', testFilePath);
    });
  });

  describe('DELETE /workspace/file', () => {
    it('should delete file', async () => {
      const testFilePath = path.join(testWorkspacePath, 'test.txt');
      const response = await testServer.request
        .delete('/api/workspace/file')
        .query({ path: testFilePath })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 404 for non-existent files', async () => {
      const response = await testServer.request
        .delete('/api/workspace/file')
        .query({ path: path.join(testWorkspacePath, 'nonexistent.txt') })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});