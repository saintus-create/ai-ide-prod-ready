import { WebSocketServer, WebSocket } from 'ws';
import { Express } from 'express';
import { TerminalService } from '../services/terminal';
import { Logger } from '../utils/logger';

interface TerminalWebSocketMessage {
  type: 'init' | 'command' | 'resize' | 'tab-complete';
  sessionId?: string;
  cwd?: string;
  cols?: number;
  rows?: number;
  command?: string;
  buffer?: string;
}

interface TerminalWebSocketResponse {
  type: 'output' | 'session' | 'error' | 'resize' | 'tab-complete';
  sessionId?: string;
  data?: string;
  error?: string;
  cols?: number;
  rows?: number;
  completed?: string;
  isDirectory?: boolean;
  pid?: number;
  startTime?: string;
  cwd?: string;
}

export class TerminalWebSocketHandler {
  private wss: WebSocketServer;
  private terminalService: TerminalService;
  private logger: Logger;
  private connectionCounter = 0;

  constructor(app: Express, terminalService: TerminalService) {
    this.terminalService = terminalService;
    this.logger = new Logger('TerminalWebSocket');
    
    this.wss = new WebSocketServer({
      server: app,
      path: '/ws/terminal',
      perMessageDeflate: {
        zlibDeflateOptions: {
          threshold: 1024,
          concurrencyLimit: 10,
          windowBits: 15
        }
      }
    });

    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const connectionId = `terminal_${++this.connectionCounter}`;
      const clientAddress = request.socket.remoteAddress;
      
      this.logger.info(`Terminal WebSocket connection established: ${connectionId} from ${clientAddress}`);
      
      // Register the connection with terminal service
      this.terminalService.registerConnection(connectionId, ws);

      // Handle incoming messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message: TerminalWebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, connectionId, message);
        } catch (error) {
          this.logger.error('Failed to parse terminal message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handle connection close
      ws.on('close', () => {
        this.logger.info(`Terminal WebSocket connection closed: ${connectionId}`);
        this.terminalService.unregisterConnection(connectionId);
      });

      // Handle errors
      ws.on('error', (error) => {
        this.logger.error(`Terminal WebSocket error for ${connectionId}:`, error);
      });

      // Send welcome message
      this.sendMessage(ws, {
        type: 'output',
        data: '🖥️ AI-IDE Terminal Ready\nType "help" for available commands.\n\n'
      });
    });

    this.wss.on('error', (error) => {
      this.logger.error('WebSocket server error:', error);
    });

    this.logger.info('Terminal WebSocket server initialized on /ws/terminal');
  }

  private async handleMessage(ws: WebSocket, connectionId: string, message: TerminalWebSocketMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'init':
          await this.handleInit(ws, connectionId, message);
          break;
          
        case 'command':
          await this.handleCommand(ws, connectionId, message);
          break;
          
        case 'resize':
          await this.handleResize(ws, connectionId, message);
          break;
          
        case 'tab-complete':
          await this.handleTabComplete(ws, connectionId, message);
          break;
          
        default:
          this.sendError(ws, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling terminal message:`, error);
      this.sendError(ws, `Internal server error: ${error.message}`);
    }
  }

  private async handleInit(ws: WebSocket, connectionId: string, message: TerminalWebSocketMessage): Promise<void> {
    const { cwd = '/workspace', cols = 80, rows = 24 } = message;
    
    this.logger.info(`Initializing terminal session for ${connectionId}`);
    
    // Create new terminal session
    const session = this.terminalService.createSession(cwd, cols, rows);
    
    // Send session info back to client
    this.sendMessage(ws, {
      type: 'session',
      sessionId: session.id,
      pid: session.pid,
      startTime: session.startTime.toISOString(),
      cwd: session.cwd
    });

    // Send prompt
    this.sendMessage(ws, {
      type: 'output',
      data: `\n$ AI-IDE Terminal v1.0.0\nCurrent directory: ${session.cwd}\n\n`
    });

    this.logger.info(`Terminal session initialized: ${session.id} (PID: ${session.pid})`);
  }

  private async handleCommand(ws: WebSocket, connectionId: string, message: TerminalWebSocketMessage): Promise<void> {
    const { command, cwd } = message;
    
    if (!command) {
      this.sendError(ws, 'Command is required');
      return;
    }

    // For now, we'll use the first session (in production, you'd want session management)
    const sessions = Array.from((this.terminalService as any).sessions?.keys() || []);
    const sessionId = sessions[0];
    
    if (!sessionId) {
      this.sendError(ws, 'No active terminal session');
      return;
    }

    this.logger.info(`Executing command in session ${sessionId}: ${command}`);

    try {
      await this.terminalService.executeCommand(sessionId, command);
    } catch (error) {
      this.sendError(ws, `Failed to execute command: ${error.message}`);
    }
  }

  private async handleResize(ws: WebSocket, connectionId: string, message: TerminalWebSocketMessage): Promise<void> {
    const { cols, rows } = message;
    
    if (!cols || !rows) {
      this.sendError(ws, 'Cols and rows are required for resize');
      return;
    }

    // Get the active session and resize it
    const sessions = Array.from((this.terminalService as any).sessions?.keys() || []);
    const sessionId = sessions[0];
    
    if (!sessionId) {
      this.sendError(ws, 'No active terminal session');
      return;
    }

    this.terminalService.resizeSession(sessionId, cols, rows);
    
    this.logger.info(`Resized terminal session ${sessionId} to ${cols}x${rows}`);
  }

  private async handleTabComplete(ws: WebSocket, connectionId: string, message: TerminalWebSocketMessage): Promise<void> {
    const { buffer } = message;
    
    if (!buffer) {
      this.sendError(ws, 'Buffer is required for tab completion');
      return;
    }

    // Get the active session
    const sessions = Array.from((this.terminalService as any).sessions?.keys() || []);
    const sessionId = sessions[0];
    
    if (!sessionId) {
      this.sendError(ws, 'No active terminal session');
      return;
    }

    await this.terminalService.handleTabCompletion(sessionId, buffer);
    
    this.logger.info(`Tab completion requested for session ${sessionId}`);
  }

  private sendMessage(ws: WebSocket, message: TerminalWebSocketResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      error
    });
  }

  // Get server statistics
  getStats() {
    return {
      connections: this.wss.clients.size,
      terminalService: this.terminalService.getStatistics()
    };
  }

  // Close the WebSocket server
  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.logger.info('Terminal WebSocket server closed');
        resolve();
      });
    });
  }
}