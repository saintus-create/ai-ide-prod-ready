import React, { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useToast } from '../hooks/useToast';
import './Terminal.css';

interface TerminalProps {
  workingDirectory?: string;
  onCommandComplete?: (command: string, exitCode: number) => void;
  className?: string;
}

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
  command?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
  workingDirectory = '/workspace',
  onCommandComplete,
  className = ''
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { showToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [currentBuffer, setCurrentBuffer] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // WebSocket connection for terminal
  const { connect, send, isOpen, onMessage } = useWebSocket('ws://localhost:4000/ws/terminal');

  // Initialize connection
  useEffect(() => {
    const initTerminal = async () => {
      try {
        await connect();
        setIsConnected(true);
        addLine('output', '🖥️ AI-IDE Terminal Ready\nType "help" for available commands.\n\n');
      } catch (error) {
        showToast('Failed to connect to terminal', 'error');
        addLine('error', 'Error: Failed to connect to terminal\n');
      }
    };

    initTerminal();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    onMessage((data) => {
      try {
        const message = JSON.parse(data);
        handleTerminalMessage(message);
      } catch (error) {
        console.error('Failed to parse terminal message:', error);
      }
    });
  }, [onMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when clicking in terminal
  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Add line to terminal
  const addLine = (type: 'input' | 'output' | 'error', content: string, command?: string) => {
    setLines(prev => [...prev, {
      type,
      content,
      timestamp: new Date(),
      command
    }]);
  };

  // Handle terminal message
  const handleTerminalMessage = (message: any) => {
    switch (message.type) {
      case 'output':
        addLine('output', message.data);
        setIsProcessing(false);
        break;
        
      case 'error':
        addLine('error', `Error: ${message.error}\n`);
        setIsProcessing(false);
        break;
        
      case 'session':
        // Terminal session initialized
        break;
        
      default:
        console.log('Unknown terminal message:', message);
    }
  };

  // Execute command
  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    
    // Add command to terminal
    addLine('input', `$ ${command}\n`, command);
    setCurrentBuffer('');
    setIsProcessing(true);

    try {
      // Send command via WebSocket
      send(JSON.stringify({
        type: 'command',
        command: command.trim(),
        cwd: workingDirectory
      }));
    } catch (error) {
      console.error('Failed to execute command:', error);
      addLine('error', `Error: Failed to execute command\n`);
      setIsProcessing(false);
    }
  };

  // Handle key presses
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        if (currentBuffer.trim() && !isProcessing) {
          executeCommand(currentBuffer);
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          const command = commandHistory[commandHistory.length - 1 - newIndex];
          setCurrentBuffer(command);
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex > -1) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          
          if (newIndex === -1) {
            setCurrentBuffer('');
          } else {
            const command = commandHistory[commandHistory.length - 1 - newIndex];
            setCurrentBuffer(command);
          }
        }
        break;
        
      case 'Tab':
        e.preventDefault();
        // TODO: Implement tab completion
        break;
        
      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          addLine('output', '^C\n');
          setIsProcessing(false);
        }
        break;
    }
  };

  // Clear terminal
  const clearTerminal = () => {
    setLines([]);
    addLine('output', 'Terminal cleared\n\n');
  };

  // Reconnect to terminal
  const reconnect = async () => {
    try {
      await connect();
      setIsConnected(true);
      addLine('output', '🔄 Reconnected to terminal\n\n');
    } catch (error) {
      addLine('error', 'Failed to reconnect\n');
    }
  };

  // Built-in help command
  const showHelp = () => {
    const helpText = `AI-IDE Terminal Help

Built-in Commands:
  clear       - Clear the terminal screen
  ls          - List directory contents
  pwd         - Print working directory  
  cd [dir]    - Change directory
  help        - Show this help message
  history     - Show command history
  whoami      - Display current user
  echo [text] - Display text

Tips:
  - Use Tab for auto-completion
  - Use Up/Down arrows for command history
  - Use Ctrl+C to interrupt running processes
`;
    addLine('output', helpText + '\n');
  };

  // Handle built-in commands
  const handleBuiltInCommand = (command: string): boolean => {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd) {
      case 'clear':
        clearTerminal();
        return true;
        
      case 'help':
        showHelp();
        return true;
        
      case 'history':
        let historyText = 'Command History:\n\n';
        commandHistory.forEach((cmd, index) => {
          historyText += `${index + 1}  ${cmd}\n`;
        });
        addLine('output', historyText + '\n');
        return true;
        
      default:
        return false;
    }
  };

  const getPrompt = () => {
    const user = 'user';
    const host = 'ai-ide';
    return `\x1b[32m${user}@${host}\x1b[0m:\x1b[34m${workingDirectory}\x1b[0m$ `;
  };

  return (
    <div className={`terminal-container ${className}`}>
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">⚡</span>
          <span>Terminal</span>
        </div>
        
        <div className="terminal-controls">
          <span className={`status-badge ${isConnected ? 'status-success' : 'status-error'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          
          {isProcessing && (
            <span className="status-badge status-warning">
              Processing...
            </span>
          )}
          
          <button
            onClick={clearTerminal}
            className="terminal-button"
            title="Clear terminal"
          >
            🗑️
          </button>
          
          <button
            onClick={reconnect}
            className="terminal-button"
            title="Reconnect"
            disabled={isConnected}
          >
            🔄
          </button>
        </div>
      </div>
      
      <div 
        className="terminal-content" 
        ref={scrollRef}
        onClick={handleTerminalClick}
      >
        {lines.map((line, index) => (
          <div key={index} className={`terminal-line terminal-line-${line.type}`}>
            {line.type === 'input' && (
              <span className="terminal-prompt">
                {getPrompt()}
              </span>
            )}
            <span 
              className="terminal-content-text"
              dangerouslySetInnerHTML={{ 
                __html: line.content.replace(/\n/g, '<br>') 
              }}
            />
          </div>
        ))}
        
        {isConnected && (
          <div className="terminal-line terminal-line-input">
            <span className="terminal-prompt">
              {getPrompt()}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={currentBuffer}
              onChange={(e) => setCurrentBuffer(e.target.value)}
              onKeyDown={handleKeyPress}
              className="terminal-input"
              disabled={isProcessing}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
      </div>
      
      <div className="terminal-footer">
        <div className="terminal-help">
          <span className="help-text">
            Commands: {commandHistory.length} | 
            {isProcessing ? ' Processing' : ' Ready'} | 
            Tab: Complete | ↑↓: History | Ctrl+C: Interrupt
          </span>
        </div>
      </div>
    </div>
  );
};