/**
 * Hello World Extension
 * A simple example extension demonstrating basic extension API usage
 */

import { ExtensionContext, ExtensionLifecycle } from '../types/extension';

export default class HelloWorldExtension implements ExtensionLifecycle {
  private context: ExtensionContext;
  private statusBarItemId: string | null = null;
  private commandsRegistered = false;

  constructor(context: ExtensionContext) {
    this.context = context;
  }

  async onLoad(): Promise<void> {
    this.context.logger.info('Hello World Extension: Loading...');
    
    // Log extension configuration
    this.context.logger.info(`Extension ID: ${this.context.extensionId}`);
    this.context.logger.info(`Extension Name: ${this.context.manifest.name}`);
    this.context.logger.info(`Configuration: ${JSON.stringify(this.context.config)}`);
  }

  async onActivate(): Promise<void> {
    this.context.logger.info('Hello World Extension: Activated!');
    
    // Register commands
    this.registerCommands();
    
    // Create status bar item
    this.createStatusBarItem();
    
    // Show notification
    this.context.ui.showNotification(
      `Hello World Extension activated! Welcome to the AI-IDE!`,
      'success'
    );

    // Register keyboard shortcut
    this.context.ui.registerKeybinding('ctrl+shift+h', 'hello-world.show-message');

    // Listen for events
    this.context.events.on('workspace:file:changed', (filePath: string) => {
      this.context.logger.info(`File changed: ${filePath}`);
    });

    // Set up periodic status update
    this.updateStatusBar();
    setInterval(() => this.updateStatusBar(), 30000); // Update every 30 seconds
  }

  async onDeactivate(): Promise<void> {
    this.context.logger.info('Hello World Extension: Deactivated');
    
    // Clean up resources
    this.statusBarItemId = null;
    this.commandsRegistered = false;
    
    // Show notification
    this.context.ui.showNotification('Hello World Extension deactivated', 'info');
  }

  async onConfigChange(config: any): Promise<void> {
    this.context.logger.info('Hello World Extension: Configuration changed');
    this.context.logger.info(`New configuration: ${JSON.stringify(config)}`);
    
    // Update status bar with new configuration
    if (this.statusBarItemId) {
      const greeting = config.greeting || 'Hello';
      const customMessage = config.customMessage || 'Hello from Hello World Extension!';
      this.context.ui.updateStatusBarItem(
        this.statusBarItemId,
        `${greeting}! 👋`,
        customMessage
      );
    }
  }

  private registerCommands(): void {
    if (this.commandsRegistered) return;

    // Show hello message command
    this.context.ui.registerCommand(
      'hello-world.show-message',
      'Hello World: Show Greeting',
      async () => {
        const name = this.context.config.name || 'Developer';
        const greeting = this.context.config.greeting || 'Hello';
        const customMessage = this.context.config.customMessage || 'Welcome to the AI-IDE!';
        
        this.context.ui.showNotification(
          `${greeting}, ${name}! ${customMessage}`,
          'info'
        );
      }
    );

    // Show settings command
    this.context.ui.registerCommand(
      'hello-world.show-settings',
      'Hello World: Show Settings',
      async () => {
        const name = await this.context.ui.showInputDialog('Enter your name:', {
          placeholder: 'Your name here...',
          validate: (value) => {
            if (!value.trim()) return 'Name cannot be empty';
            return null;
          }
        });

        if (name) {
          await this.context.config.setExtension('name', name);
          this.context.ui.showNotification(`Name saved: ${name}`, 'success');
        }
      }
    );

    // List workspace files command
    this.context.ui.registerCommand(
      'hello-world.list-files',
      'Hello World: List Files',
      async () => {
        try {
          const files = await this.context.workspace.listDirectory('.');
          const fileNames = files.map(file => file.name).join('\n');
          
          this.context.ui.showNotification(
            `Found ${files.length} items in workspace:\n${fileNames}`,
            'info'
          );
        } catch (error) {
          this.context.logger.error('Failed to list files:', error);
          this.context.ui.showNotification('Failed to list files', 'error');
        }
      }
    );

    // Get AI completion example
    this.context.ui.registerCommand(
      'hello-world.ai-completion',
      'Hello World: AI Completion Demo',
      async () => {
        try {
          const currentLine = this.context.editor.getCurrentLine();
          
          if (!currentLine) {
            this.context.ui.showNotification('No text in current editor line', 'warning');
            return;
          }

          this.context.ui.showNotification('Getting AI completion...', 'info');
          
          const completions = await this.context.ai.complete(currentLine, currentLine.length, 'javascript');
          
          if (completions.length > 0) {
            const topCompletion = completions[0];
            this.context.ui.showNotification(
              `Top completion: ${topCompletion.insertText}`,
              'info'
            );
          } else {
            this.context.ui.showNotification('No AI completions available', 'warning');
          }
        } catch (error) {
          this.context.logger.error('AI completion failed:', error);
          this.context.ui.showNotification('AI completion failed', 'error');
        }
      }
    );

    // Git status command
    this.context.ui.registerCommand(
      'hello-world.git-status',
      'Hello World: Git Status',
      async () => {
        try {
          const status = await this.context.git.getStatus();
          
          let statusMessage = `Branch: ${status.branch}`;
          statusMessage += `\nStaged: ${status.staged.length} files`;
          statusMessage += `\nModified: ${status.modified.length} files`;
          statusMessage += `\nUntracked: ${status.untracked.length} files`;
          
          if (status.ahead > 0) {
            statusMessage += `\nAhead: ${status.ahead} commits`;
          }
          if (status.behind > 0) {
            statusMessage += `\nBehind: ${status.behind} commits`;
          }
          
          this.context.ui.showNotification(statusMessage, 'info');
        } catch (error) {
          this.context.logger.error('Git status failed:', error);
          this.context.ui.showNotification('Git status failed - not a git repository?', 'warning');
        }
      }
    );

    this.commandsRegistered = true;
    this.context.logger.info('Hello World Extension: Commands registered');
  }

  private createStatusBarItem(): void {
    if (this.statusBarItemId) return;

    const greeting = this.context.config.greeting || 'Hello';
    const name = this.context.config.name || 'Developer';
    const customMessage = this.context.config.customMessage || 'Hello from Hello World Extension!';
    
    this.statusBarItemId = 'hello-world-status';
    this.context.ui.registerStatusBarItem(
      this.statusBarItemId,
      `${greeting}! 👋`,
      customMessage
    );
  }

  private updateStatusBar(): void {
    if (!this.statusBarItemId) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const greeting = this.context.config.greeting || 'Hello';
    
    this.context.ui.updateStatusBarItem(
      this.statusBarItemId,
      `${greeting}! 👋 ${timeString}`,
      'Hello World Extension - Click to show greeting'
    );
  }

  async dispose(): Promise<void> {
    this.context.logger.info('Hello World Extension: Disposing...');
    
    // Clear intervals
    // (This would be handled in the actual implementation)
    
    // Clean up event listeners
    this.context.events.removeAllListeners();
    
    // Clear status bar
    if (this.statusBarItemId) {
      // In a real implementation, you'd call a method to remove the status bar item
      this.statusBarItemId = null;
    }
    
    this.context.logger.info('Hello World Extension: Disposed');
  }
}

// Extension manifest
export const manifest = {
  name: 'hello-world',
  displayName: 'Hello World Extension',
  version: '1.0.0',
  description: 'A simple hello world extension that demonstrates the extension API. Perfect for developers getting started with the AI-IDE extension system.',
  author: {
    name: 'AI-IDE Team',
    email: 'dev@ai-ide.com',
    url: 'https://github.com/ai-ide'
  },
  main: 'dist/hello-world.js',
  permissions: [
    'workspace.read',
    'ui.render',
    'ui.command',
    'ui.shortcut',
    'terminal.execute',
    'ai.request',
    'git.read'
  ],
  categories: ['utility', 'example', 'productivity'],
  keywords: ['example', 'hello world', 'tutorial', 'demo'],
  homepage: 'https://github.com/ai-ide/extensions/tree/main/hello-world',
  repository: 'https://github.com/ai-ide/extensions',
  license: 'MIT',
  configSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Your name for personalized greetings',
        default: 'Developer'
      },
      greeting: {
        type: 'string',
        description: 'Greeting message',
        default: 'Hello',
        enum: ['Hello', 'Hi', 'Greetings', 'Hey']
      },
      customMessage: {
        type: 'string',
        description: 'Custom message to display',
        default: 'Hello from Hello World Extension!'
      },
      showNotifications: {
        type: 'boolean',
        description: 'Show welcome notifications',
        default: true
      },
      autoUpdateStatus: {
        type: 'boolean',
        description: 'Automatically update status bar with current time',
        default: true
      }
    }
  },
  defaultConfig: {
    name: 'Developer',
    greeting: 'Hello',
    customMessage: 'Hello from Hello World Extension!',
    showNotifications: true,
    autoUpdateStatus: true
  }
};