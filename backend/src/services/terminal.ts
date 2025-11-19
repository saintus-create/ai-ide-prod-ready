import { WebSocket } from 'ws';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

export interface TerminalSession {
  id: string;
  pid: number;
  cwd: string;
  startTime: Date;
  process: any;
}

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  timestamp: Date;
  workingDirectory: string;
  exitCode?: number;
}

export class TerminalService {
  private sessions: Map<string, TerminalSession> = new Map();
  private commandHistory: TerminalCommand[] = [];
  private wsConnections: Map<string, WebSocket> = new Map();

  // Initialize terminal service
  async initialize(): Promise<void> {
    console.log('🖥️ Terminal service initialized');
    
    // Set up environment variables
    process.env.TERM = 'xterm-256color';
    process.env.COLUMNS = '80';
    process.env.LINES = '24';
  }

  // Create new terminal session
  createSession(cwd: string = '/workspace', cols: number = 80, rows: number = 24): TerminalSession {
    const sessionId = randomUUID();
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    
    const process = spawn(shell, [], {
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLUMNS: cols.toString(),
        LINES: rows.toString()
      },
      stdio: 'pipe'
    });

    const session: TerminalSession = {
      id: sessionId,
      pid: process.pid,
      cwd,
      startTime: new Date(),
      process
    };

    this.sessions.set(sessionId, session);
    
    // Handle process output
    process.stdout?.on('data', (data) => {
      this.broadcastToSession(sessionId, {
        type: 'output',
        data: data.toString()
      });
    });

    process.stderr?.on('data', (data) => {
      this.broadcastToSession(sessionId, {
        type: 'output',
        data: data.toString()
      });
    });

    // Handle process exit
    process.on('exit', (code) => {
      this.broadcastToSession(sessionId, {
        type: 'output',
        data: `\r\nprocess exited with code ${code}\r\n`
      });
      
      this.sessions.delete(sessionId);
    });

    // Handle process error
    process.on('error', (error) => {
      this.broadcastToSession(sessionId, {
        type: 'error',
        error: error.message
      });
    });

    return session;
  }

  // Get existing session
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  // Execute command in session
  async executeCommand(sessionId: string, command: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.process) {
      throw new Error(`Session ${sessionId} not found or process not available`);
    }

    const commandId = randomUUID();
    const commandRecord: TerminalCommand = {
      id: commandId,
      command,
      output: '',
      timestamp: new Date(),
      workingDirectory: session.cwd
    };

    try {
      // Handle built-in commands
      if (this.isBuiltInCommand(command)) {
        await this.handleBuiltInCommand(session, command, commandRecord);
        return;
      }

      // Write command to process stdin
      if (session.process.stdin && !session.process.stdin.destroyed) {
        session.process.stdin.write(command + '\n');
        
        // Store command record
        this.commandHistory.push(commandRecord);
        
        // Notify client
        this.broadcastToSession(sessionId, {
          type: 'output',
          data: `$ ${command}\r\n`
        });
      }
    } catch (error) {
      this.broadcastToSession(sessionId, {
        type: 'error',
        error: `Failed to execute command: ${error.message}`
      });
      
      commandRecord.output = `Error: ${error.message}`;
      this.commandHistory.push(commandRecord);
    }
  }

  // Handle built-in commands
  private async handleBuiltInCommand(session: TerminalSession, command: string, record: TerminalCommand): Promise<void> {
    const [cmd, ...args] = command.split(' ');
    
    try {
      let output = '';
      
      switch (cmd) {
        case 'clear':
          output = ''; // Clear screen
          break;
          
        case 'ls':
          output = await this.listDirectory(session.cwd);
          break;
          
        case 'pwd':
          output = session.cwd + '\n';
          break;
          
        case 'cd':
          const newDir = args[0] || '/workspace';
          output = await this.changeDirectory(session, newDir);
          break;
          
        case 'help':
          output = this.getHelpText();
          break;
          
        case 'history':
          output = this.getCommandHistory();
          break;
          
        case 'whoami':
          output = 'ai-ide-user\n';
          break;
          
        case 'echo':
          output = args.join(' ') + '\n';
          break;
          
        default:
          throw new Error(`Unknown built-in command: ${cmd}`);
      }
      
      record.output = output;
      this.commandHistory.push(record);
      
      // Broadcast output
      if (output) {
        this.broadcastToSession(session.id, {
          type: 'output',
          data: output
        });
      }
      
    } catch (error) {
      record.output = `Error: ${error.message}`;
      this.commandHistory.push(record);
      
      this.broadcastToSession(session.id, {
        type: 'error',
        error: error.message
      });
    }
  }

  // Check if command is built-in
  private isBuiltInCommand(command: string): boolean {
    const builtInCommands = ['clear', 'ls', 'pwd', 'cd', 'help', 'history', 'whoami', 'echo'];
    const cmd = command.split(' ')[0];
    return builtInCommands.includes(cmd);
  }

  // List directory contents
  private async listDirectory(dir: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(dir);
      
      let output = '';
      for (const file of files.sort()) {
        try {
          const stats = await fs.stat(`${dir}/${file}`);
          const type = stats.isDirectory() ? 'd' : '-';
          const size = stats.size.toString().padStart(8);
          const date = stats.mtime.toISOString().split('T')[0];
          output += `${type}${size} ${date} ${file}\r\n`;
        } catch {
          output += `?         ? ? ${file}\r\n`;
        }
      }
      
      return output;
    } catch (error) {
      throw new Error(`Cannot list directory: ${error.message}`);
    }
  }

  // Change directory
  private async changeDirectory(session: TerminalSession, newDir: string): Promise<string> {
    try {
      const fs = await import('fs/promises');
      
      // Handle relative paths
      let targetDir = newDir;
      if (!newDir.startsWith('/')) {
        targetDir = `${session.cwd}/${newDir}`;
      }
      
      // Resolve to absolute path
      targetDir = targetDir.replace(/\/+/g, '/'); // Normalize path
      
      // Check if directory exists
      const stats = await fs.stat(targetDir);
      if (!stats.isDirectory()) {
        throw new Error(`${targetDir} is not a directory`);
      }
      
      session.cwd = targetDir;
      return '';
      
    } catch (error) {
      throw new Error(`Cannot change directory: ${error.message}`);
    }
  }

  // Get help text
  private getHelpText(): string {
    return `AI-IDE Terminal Help

Built-in Commands:
  clear       - Clear the terminal screen
  ls [dir]    - List directory contents
  pwd         - Print working directory  
  cd [dir]    - Change directory
  help        - Show this help message
  history     - Show command history
  whoami      - Display current user
  echo [text] - Display text

External Commands:
  All standard shell commands are supported.
  Use 'exit' to close the terminal session.

Tips:
  - Use Tab for auto-completion
  - Use Up/Down arrows for command history
  - Use Ctrl+C to interrupt running processes
`;
  }

  // Get command history
  private getCommandHistory(): string {
    let output = 'Command History:\r\n\r\n';
    for (let i = this.commandHistory.length - 1; i >= 0 && i >= this.commandHistory.length - 20; i--) {
      const cmd = this.commandHistory[i];
      const time = cmd.timestamp.toLocaleTimeString();
      output += `${time}  ${cmd.command}\r\n`;
    }
    return output;
  }

  // Resize terminal
  resizeSession(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update environment variables
      process.env.COLUMNS = cols.toString();
      process.env.LINES = rows.toString();
      
      // Send signal to resize process (Linux/Mac)
      if (session.process.pid && process.platform !== 'win32') {
        try {
          const { kill } = require('child_process');
          kill(session.process.pid, 'SIGWINCH');
        } catch (error) {
          console.warn('Failed to send SIGWINCH:', error);
        }
      }
    }
  }

  // Handle tab completion
  async handleTabCompletion(sessionId: string, buffer: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const parts = buffer.split(' ');
      const lastPart = parts[parts.length - 1];
      
      // If it's a file path
      if (lastPart.includes('/') || lastPart.includes('\\')) {
        const dir = path.dirname(lastPart);
        const prefix = path.basename(lastPart);
        const targetDir = path.resolve(session.cwd, dir);
        
        try {
          const files = await fs.readdir(targetDir);
          const matches = files.filter(f => f.startsWith(prefix));
          
          if (matches.length === 1) {
            // Complete to single match
            const completed = path.join(dir, matches[0]);
            this.broadcastToSession(sessionId, {
              type: 'tab-complete',
              completed,
              isDirectory: false
            });
          } else if (matches.length > 1) {
            // Show all matches
            let output = '\r\n';
            for (const match of matches.sort()) {
              output += match + '  ';
            }
            output += '\r\n' + buffer;
            
            this.broadcastToSession(sessionId, {
              type: 'output',
              data: output
            });
          }
        } catch (error) {
          // Directory doesn't exist or no access
        }
      }
    } catch (error) {
      // Tab completion failed
    }
  }

  // Broadcast message to session
  private broadcastToSession(sessionId: string, message: any): void {
    for (const [connectionId, ws] of this.wsConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          sessionId
        }));
      }
    }
  }

  // Register WebSocket connection
  registerConnection(connectionId: string, ws: WebSocket): void {
    this.wsConnections.set(connectionId, ws);
    
    ws.on('close', () => {
      this.wsConnections.delete(connectionId);
    });
  }

  // Unregister WebSocket connection
  unregisterConnection(connectionId: string): void {
    this.wsConnections.delete(connectionId);
  }

  // Close session
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.process) {
      try {
        session.process.kill();
      } catch (error) {
        console.warn('Failed to kill process:', error);
      }
      this.sessions.delete(sessionId);
    }
  }

  // Get service statistics
  getStatistics() {
    return {
      activeSessions: this.sessions.size,
      totalCommands: this.commandHistory.length,
      connectedClients: this.wsConnections.size,
      sessions: Array.from(this.sessions.values()).map(session => ({
        id: session.id,
        pid: session.pid,
        cwd: session.cwd,
        uptime: Date.now() - session.startTime.getTime()
      }))
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Close all sessions
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId);
    }
    
    // Close all WebSocket connections
    for (const ws of this.wsConnections.values()) {
      try {
        ws.close();
      } catch (error) {
        console.warn('Failed to close WebSocket:', error);
      }
    }
    
    this.sessions.clear();
    this.wsConnections.clear();
    this.commandHistory = [];
    
    console.log('🖥️ Terminal service cleaned up');
  }
}