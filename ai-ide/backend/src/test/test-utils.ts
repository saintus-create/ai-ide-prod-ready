import supertest from 'supertest';
import { Express } from 'express';
import { createServer } from '../server';

export interface TestServer {
  app: Express;
  request: supertest.SuperTest<supertest.Test>;
  close: () => void;
}

export async function createTestServer(): Promise<TestServer> {
  const app = await createServer();
  const request = supertest(app);
  
  const close = () => {
    app.locals.server?.close();
  };
  
  return { app, request, close };
}

export async function setupTestEnvironment(): Promise<void> {
  // Setup test environment
  process.env.NODE_ENV = 'test';
}

export async function cleanupTestEnvironment(): Promise<void> {
  // Cleanup test environment
}