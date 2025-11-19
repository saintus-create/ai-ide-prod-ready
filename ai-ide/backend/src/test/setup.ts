import { beforeEach, afterEach } from '@jest/globals';

// Global test setup
beforeEach(() => {
  // Reset environment variables
  process.env.NODE_ENV = 'test';
  process.env.CODESTRAL_API_KEY = 'test-key';
  process.env.MISTRAL_API_KEY = 'test-key';
  process.env.HF_TOKEN = 'test-key';
  process.env.CLIENT_ORIGIN = 'http://localhost:3000';
  process.env.VITE_API_URL = 'http://localhost:3001/api';
  process.env.VITE_WS_URL = 'ws://localhost:3001';
});

afterEach(() => {
  // Clean up after each test
  jest.clearAllMocks();
});