/**
 * Extension Routes
 * Handles WebSocket communication for extension lifecycle and operations
 */

import { Router } from 'express';
import { Server } from 'socket.io';
import { ExtensionService } from '../services/extension';
import { ExtensionError } from '../types/extension';

export function setupExtensionRoutes(io: Server, extensionService: ExtensionService) {
  const router = Router();

  // Extension lifecycle events
  io.on('connection', (socket) => {
    console.log('Client connected for extension operations');

    // List all extensions
    socket.on('extension:list', (callback) => {
      try {
        const extensions = extensionService.getAllExtensions();
        callback({ success: true, extensions });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    // Install extension
    socket.on('extension:install', async (data, callback) => {
      try {
        const { workspaceId, manifest, source = 'local', config = {} } = data;
        
        // Parse extension manifest
        let extensionManifest;
        try {
          extensionManifest = typeof manifest === 'string' ? JSON.parse(manifest) : manifest;
        } catch (error) {
          throw new Error('Invalid extension manifest JSON');
        }

        // Load extension module (in a real implementation, this would load from file system)
        const extensionModule = await loadExtensionModule(extensionManifest.name);
        
        // Register extension
        const extensionId = await extensionService.registerExtension(
          extensionManifest,
          extensionModule,
          config
        );

        // Auto-activate installed extension
        await extensionService.activateExtension(extensionManifest.name);

        callback({ success: true, extensionId });
        
        // Emit extension installed event
        io.emit('extension:installed', { extensionId, name: extensionManifest.name });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        callback({ success: false, error: errorMessage });
        socket.emit('install:error', errorMessage);
      }
    });

    // Uninstall extension
    socket.on('extension:uninstall', async (data, callback) => {
      try {
        const { workspaceId, extensionName } = data;
        
        await extensionService.unregisterExtension(extensionName);
        
        callback({ success: true });
        
        // Emit extension uninstalled event
        io.emit('extension:uninstalled', { extensionId: extensionName, name: extensionName });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        callback({ success: false, error: errorMessage });
        socket.emit('uninstall:error', errorMessage);
      }
    });

    // Activate extension
    socket.on('extension:activate', async (data, callback) => {
      try {
        const { workspaceId, extensionName } = data;
        
        await extensionService.activateExtension(extensionName);
        
        callback({ success: true });
        
        // Emit extension activated event
        io.emit('extension:activated', { extensionId: extensionName, name: extensionName });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        callback({ success: false, error: errorMessage });
        socket.emit('activate:error', errorMessage);
      }
    });

    // Deactivate extension
    socket.on('extension:deactivate', async (data, callback) => {
      try {
        const { workspaceId, extensionName } = data;
        
        await extensionService.deactivateExtension(extensionName);
        
        callback({ success: true });
        
        // Emit extension deactivated event
        io.emit('extension:deactivated', { extensionId: extensionName, name: extensionName });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        callback({ success: false, error: errorMessage });
        socket.emit('deactivate:error', errorMessage);
      }
    });

    // Reload extension
    socket.on('extension:reload', async (data, callback) => {
      try {
        const { workspaceId, extensionName } = data;
        
        // Deactivate and reactivate
        await extensionService.deactivateExtension(extensionName);
        
        // Get extension instance
        const instance = extensionService.getExtension(extensionName);
        if (instance) {
          // Reload module (in real implementation)
          const extensionModule = await loadExtensionModule(extensionName);
          await extensionService.loadExtensionModule(instance, extensionModule);
          await extensionService.activateExtension(extensionName);
        }
        
        callback({ success: true });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        callback({ success: false, error: errorMessage });
      }
    });

    // Reload all extensions
    socket.on('extension:reloadAll', async (data, callback) => {
      try {
        const { workspaceId } = data;
        
        const activeExtensions = extensionService.getActiveExtensions();
        const names = activeExtensions.map(ext => ext.manifest.name);
        
        // Deactivate all
        for (const name of names) {
          await extensionService.deactivateExtension(name);
        }
        
        // Reactivate all
        for (const name of names) {
          await extensionService.activateExtension(name);
        }
        
        callback({ success: true });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        callback({ success: false, error: errorMessage });
      }
    });

    // Execute extension command
    socket.on('extension:execute-command', async (data, callback) => {
      try {
        const { extensionName, commandName, args = [] } = data;
        
        const result = await extensionService.executeExtensionCommand(
          extensionName,
          commandName,
          ...args
        );
        
        callback(result);
        
      } catch (error) {
        callback({
          success: false,
          error: (error as Error).message,
          duration: 0
        });
      }
    });

    // Get extension errors
    socket.on('extension:errors', (callback) => {
      try {
        const errors = extensionService.getExtensionErrors();
        callback({ success: true, errors });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    // Enable/disable extension
    socket.on('extension:set-enabled', (data, callback) => {
      try {
        const { extensionName, enabled } = data;
        
        extensionService.setExtensionEnabled(extensionName, enabled);
        
        callback({ success: true });
        
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    // Get extension statistics
    socket.on('extension:stats', (callback) => {
      try {
        const stats = extensionService.getStatistics();
        callback({ success: true, stats });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    });

    // Handle extension webview messages
    socket.on('extension:webview-message', (data) => {
      try {
        const { webviewId, message } = data;
        
        // Forward message to extension
        // This would be handled by the extension service in a real implementation
        io.emit('webview:message-received', { webviewId, message });
        
      } catch (error) {
        console.error('Error handling webview message:', error);
      }
    });

    // Handle extension status bar updates
    socket.on('extension:statusbar-update', (data) => {
      try {
        const { extensionName, itemId, text, tooltip } = data;
        
        // Forward status bar update to clients
        io.emit('extension:statusbar:item:updated', {
          extensionName,
          itemId,
          text,
          tooltip
        });
        
      } catch (error) {
        console.error('Error handling statusbar update:', error);
      }
    });

    // Handle extension command registration
    socket.on('extension:command-registered', (data) => {
      try {
        const { extensionName, commandId, title } = data;
        
        // Forward command registration to clients
        io.emit('extension:command:registered', {
          extensionName,
          commandId,
          title
        });
        
      } catch (error) {
        console.error('Error handling command registration:', error);
      }
    });

    // Handle extension keybinding registration
    socket.on('extension:keybinding-registered', (data) => {
      try {
        const { extensionName, key, command } = data;
        
        // Forward keybinding registration to clients
        io.emit('extension:keybinding:registered', {
          extensionName,
          key,
          command
        });
        
      } catch (error) {
        console.error('Error handling keybinding registration:', error);
      }
    });

    // Handle extension notifications
    socket.on('extension:notification', (data) => {
      try {
        const { extensionName, message, type = 'info' } = data;
        
        // Broadcast notification to all clients
        io.emit('extension:notification', {
          extensionName,
          message,
          type
        });
        
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    });

    // Handle extension configuration changes
    socket.on('extension:config-changed', (data) => {
      try {
        const { extensionName, config } = data;
        
        // Emit configuration change event
        io.emit('extension:config:changed', { extensionName, config });
        
      } catch (error) {
        console.error('Error handling config change:', error);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log('Client disconnected from extension operations');
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Extension socket error:', error);
    });
  });

  // API endpoints for HTTP requests
  router.get('/extensions', (req, res) => {
    try {
      const extensions = extensionService.getAllExtensions();
      res.json({
        success: true,
        extensions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  router.get('/extensions/:name', (req, res) => {
    try {
      const extensionName = req.params.name;
      const extension = extensionService.getExtension(extensionName);
      
      if (!extension) {
        return res.status(404).json({
          success: false,
          error: `Extension '${extensionName}' not found`
        });
      }
      
      res.json({
        success: true,
        extension
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  router.get('/extensions/errors', (req, res) => {
    try {
      const errors = extensionService.getExtensionErrors();
      res.json({
        success: true,
        errors
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  router.get('/extensions/stats', (req, res) => {
    try {
      const stats = extensionService.getStatistics();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  router.post('/extensions/:name/activate', (req, res) => {
    try {
      const extensionName = req.params.name;
      
      extensionService.activateExtension(extensionName);
      
      res.json({
        success: true,
        message: `Extension '${extensionName}' activated`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  router.post('/extensions/:name/deactivate', (req, res) => {
    try {
      const extensionName = req.params.name;
      
      extensionService.deactivateExtension(extensionName);
      
      res.json({
        success: true,
        message: `Extension '${extensionName}' deactivated`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  router.post('/extensions/:name/enable', (req, res) => {
    try {
      const extensionName = req.params.name;
      const { enabled } = req.body;
      
      extensionService.setExtensionEnabled(extensionName, enabled);
      
      res.json({
        success: true,
        message: `Extension '${extensionName}' ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // Handle extension manifest validation
  router.post('/extensions/validate-manifest', (req, res) => {
    try {
      const { manifest } = req.body;
      
      if (!manifest) {
        return res.status(400).json({
          success: false,
          error: 'Extension manifest is required'
        });
      }

      // Basic validation
      const requiredFields = ['name', 'displayName', 'version', 'description', 'main', 'permissions'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      // Validate name format
      if (!/^[a-z0-9-]+$/.test(manifest.name)) {
        return res.status(400).json({
          success: false,
          error: 'Extension name must be kebab-case (lowercase letters, numbers, hyphens)'
        });
      }

      // Validate version format
      if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
        return res.status(400).json({
          success: false,
          error: 'Extension version must be semantic version format (e.g., 1.0.0)'
        });
      }

      // Validate permissions
      const validPermissions = [
        'workspace.read', 'workspace.write', 'workspace.fileSystem',
        'editor.read', 'editor.write',
        'terminal.execute', 'terminal.read',
        'ai.request',
        'git.read', 'git.write',
        'settings.read', 'settings.write',
        'ui.render', 'ui.command', 'ui.shortcut',
        'network.request', 'storage.persistent'
      ];

      const invalidPermissions = manifest.permissions.filter(
        (perm: string) => !validPermissions.includes(perm)
      );

      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`
        });
      }

      res.json({
        success: true,
        message: 'Extension manifest is valid'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  });

  return router;
}

// Helper function to load extension modules
async function loadExtensionModule(extensionName: string): Promise<any> {
  // In a real implementation, this would dynamically import the extension module
  // For now, we'll return mock modules for demo purposes
  
  try {
    switch (extensionName) {
      case 'hello-world':
        // Import the Hello World extension module
        const helloWorldModule = await import('../../extensions/hello-world/src/extension.ts');
        return helloWorldModule;
        
      case 'custom-theme':
        // Import the Custom Theme extension module
        const customThemeModule = await import('../../extensions/custom-theme/src/extension.ts');
        return customThemeModule;
        
      default:
        // For unknown extensions, return a basic mock extension
        return {
          default: class MockExtension {
            constructor(context: any) {
              this.context = context;
            }
            
            async onLoad() {
              console.log(`Mock extension loaded: ${extensionName}`);
            }
            
            async onActivate() {
              console.log(`Mock extension activated: ${extensionName}`);
            }
            
            async onDeactivate() {
              console.log(`Mock extension deactivated: ${extensionName}`);
            }
          },
          manifest: {
            name: extensionName,
            displayName: `Mock ${extensionName}`,
            version: '1.0.0',
            description: 'A mock extension for demonstration purposes',
            author: { name: 'Mock Author' },
            main: 'dist/mock.js',
            permissions: ['ui.render'],
            categories: ['mock']
          }
        };
    }
  } catch (error) {
    console.error(`Failed to load extension module '${extensionName}':`, error);
    throw new Error(`Failed to load extension module: ${extensionName}`);
  }
}