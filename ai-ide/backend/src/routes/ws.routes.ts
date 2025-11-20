import { Server as IOServer } from 'socket.io';
import { WorkspaceService } from '../workspace/service';
import { AIProvider } from '../ai/models';
import { getCompletion } from '../ai';
import { TerminalService } from '../services/terminal';
import { TerminalWebSocketHandler } from './terminal';

export function attachWebSocket(server: any, terminalService?: TerminalService) {
  const io = new IOServer(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  const workspace = new WorkspaceService();
  
  // Initialize terminal WebSocket handler if service is provided
  let terminalHandler: TerminalWebSocketHandler | null = null;
  if (terminalService) {
    terminalHandler = new TerminalWebSocketHandler(server, terminalService);
    console.log('🖥️ Terminal WebSocket handler initialized');
  }

  // Broadcast file changes to every client
  workspace.on('file:changed', (rel) => io.emit('workspace:fileChanged', rel));
  workspace.on('file:deleted', (rel) => io.emit('workspace:fileDeleted', rel));

  io.on('connection', (socket) => {
    console.log('🟢 client connected', socket.id);

    // ---------- Explorer ----------
    socket.on('workspace:getTree', async (_, cb) => {
      const tree = await workspace.getTree();
      cb(tree);
    });

    socket.on('workspace:read', async (rel: string, cb) => {
      try {
        const content = await workspace.readFile(rel);
        cb({ ok: true, content });
      } catch (e) {
        cb({ ok: false, error: (e as Error).message });
      }
    });

    socket.on('workspace:write', async (payload: { path: string; content: string }, cb) => {
      try {
        await workspace.writeFile(payload.path, payload.content);
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: (e as Error).message });
      }
    });

    socket.on('workspace:delete', async (rel: string, cb) => {
      try {
        await workspace.deletePath(rel);
        cb({ ok: true });
      } catch (e) {
        cb({ ok: false, error: (e as Error).message });
      }
    });

    // ---------- AI Completion (stream‑simulated) ----------
    socket.on('ai:complete', async (req: { provider: AIProvider; prefix: string; suffix?: string }, cb) => {
      try {
        const result = await getCompletion(req.provider, {
          prefix: req.prefix,
          suffix: req.suffix,
          language: 'javascript',
        });
        // Simulate streaming by sending chunks every 50 ms
        const chunks = result.completion.match(/.{1,30}/g) ?? [];
        for (const ch of chunks) {
          socket.emit('ai:completionChunk', ch);
          await new Promise((r) => setTimeout(r, 50));
        }
        cb({ done: true });
      } catch (e) {
        cb({ error: (e as Error).message });
      }
    });

    // ---------- Git status (on‑demand) ----------
    socket.on('git:status', async (repoPath: string, cb) => {
      try {
        const { GitService } = await import('../git/service');
        const svc = new GitService(repoPath);
        const status = await svc.status();
        cb({ ok: true, status });
      } catch (e) {
        cb({ ok: false, error: (e as Error).message });
      }
    });

    socket.on('disconnect', () => console.log('🔴 client disconnected', socket.id));
  });

  // Return handlers info for monitoring
  return {
    io,
    terminalHandler: terminalHandler,
    getStats: () => ({
      socketConnections: io.engine.clientsCount,
      terminalHandler: terminalHandler?.getStats()
    })
  };
}