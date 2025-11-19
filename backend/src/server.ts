import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import aiRoutes from './routes/ai.routes';
import gitRoutes from './routes/git.routes';
import { attachWebSocket } from './routes/ws.routes';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';

// ---------------------------------------------------------------
// Load environment variables
// ---------------------------------------------------------------
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);

// ---------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? '*' }));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(rateLimiter);

// ---------------------------------------------------------------
// API routes
// ---------------------------------------------------------------
app.use('/api/ai', aiRoutes);
app.use('/api/git', gitRoutes);

// ---------------------------------------------------------------
// Serve the built front‑end (when `npm run build` was executed)
// ---------------------------------------------------------------
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// SPA fallback – any unknown route serves index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// ---------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------------
// WebSocket layer
// ---------------------------------------------------------------
attachWebSocket(httpServer);

// ---------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------
const PORT = Number(process.env.PORT) || 4000;
httpServer.listen(PORT, () => console.log(`🚀 Backend listening on http://localhost:${PORT}`));