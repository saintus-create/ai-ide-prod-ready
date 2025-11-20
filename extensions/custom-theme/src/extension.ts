/**
 * Custom Theme Extension
 * Provides custom themes and color schemes for the AI-IDE
 */

import { ExtensionContext, ExtensionLifecycle } from '../types/extension';

interface Theme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  syntax: {
    keyword: string;
    string: string;
    comment: string;
    number: string;
    function: string;
    variable: string;
    type: string;
  };
  isDark: boolean;
}

export default class CustomThemeExtension implements ExtensionLifecycle {
  private context: ExtensionContext;
  private currentTheme: string = 'oceanic';
  private themes: Map<string, Theme> = new Map();
  private originalTheme: any = null;

  constructor(context: ExtensionContext) {
    this.context = context;
    this.initializeThemes();
  }

  async onLoad(): Promise<void> {
    this.context.logger.info('Custom Theme Extension: Loading...');
    
    // Load saved theme
    const savedTheme = await this.context.storage.getExtension('currentTheme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
  }

  async onActivate(): Promise<void> {
    this.context.logger.info('Custom Theme Extension: Activated!');
    
    // Register commands
    this.registerCommands();
    
    // Apply saved theme
    await this.applyTheme(this.currentTheme);
    
    // Show notification
    this.context.ui.showNotification(
      `Custom Theme Extension activated! Current theme: ${this.themes.get(this.currentTheme)?.displayName || this.currentTheme}`,
      'success'
    );

    // Register keyboard shortcuts
    this.context.ui.registerKeybinding('ctrl+shift+t', 'custom-theme.cycle-theme');
    this.context.ui.registerKeybinding('ctrl+alt+t', 'custom-theme.open-themes');
  }

  async onDeactivate(): Promise<void> {
    this.context.logger.info('Custom Theme Extension: Deactivated');
    
    // Restore original theme
    if (this.originalTheme) {
      await this.restoreOriginalTheme();
    }
    
    // Show notification
    this.context.ui.showNotification('Custom Theme Extension deactivated', 'info');
  }

  async onConfigChange(config: any): Promise<void> {
    this.context.logger.info('Custom Theme Extension: Configuration changed');
    
    const enableAutoTheme = config.enableAutoTheme;
    if (enableAutoTheme) {
      this.context.logger.info('Auto theme switching enabled');
      this.setupAutoTheme();
    }
  }

  private initializeThemes(): void {
    // Oceanic theme
    this.themes.set('oceanic', {
      id: 'oceanic',
      name: 'oceanic',
      displayName: 'Oceanic',
      description: 'Deep ocean blue theme with calming tones',
      colors: {
        primary: '#1B4F72',
        secondary: '#2E86AB',
        accent: '#A23B72',
        background: '#0D1B2A',
        surface: '#1B263B',
        text: '#E0E1DD',
        textSecondary: '#778DA9',
        border: '#415A77',
        success: '#52B788',
        warning: '#F4A261',
        error: '#E63946',
        info: '#457B9D'
      },
      syntax: {
        keyword: '#7FDBCA',
        string: '#2ECC71',
        comment: '#95A5A6',
        number: '#F39C12',
        function: '#3498DB',
        variable: '#E74C3C',
        type: '#9B59B6'
      },
      isDark: true
    });

    // Solarized Light
    this.themes.set('solarized-light', {
      id: 'solarized-light',
      name: 'solarized-light',
      displayName: 'Solarized Light',
      description: 'Bright and clean solarized light theme',
      colors: {
        primary: '#268BD2',
        secondary: '#859900',
        accent: '#B58900',
        background: '#FDF6E3',
        surface: '#EEE8D5',
        text: '#657B83',
        textSecondary: '#93A1A1',
        border: '#93A1A1',
        success: '#2ECC71',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB'
      },
      syntax: {
        keyword: '#859900',
        string: '#2ECC71',
        comment: '#93A1A1',
        number: '#D33682',
        function: '#268BD2',
        variable: '#268BD2',
        type: '#B58900'
      },
      isDark: false
    });

    // Dracula
    this.themes.set('dracula', {
      id: 'dracula',
      name: 'dracula',
      displayName: 'Dracula',
      description: 'Dark theme based on Dracula colors',
      colors: {
        primary: '#6272A4',
        secondary: '#50FA7B',
        accent: '#BD93F9',
        background: '#282A36',
        surface: '#44475A',
        text: '#F8F8F2',
        textSecondary: '#BD93F9',
        border: '#6272A4',
        success: '#50FA7B',
        warning: '#FFB86C',
        error: '#FF5555',
        info: '#8BE9FD'
      },
      syntax: {
        keyword: '#FF79C6',
        string: '#F1FA8C',
        comment: '#6272A4',
        number: '#BD93F9',
        function: '#8BE9FD',
        variable: '#F8F8F2',
        type: '#FF79C6'
      },
      isDark: true
    });

    // Forest
    this.themes.set('forest', {
      id: 'forest',
      name: 'forest',
      displayName: 'Forest',
      description: 'Nature-inspired green theme',
      colors: {
        primary: '#2D5A27',
        secondary: '#4A7C59',
        accent: '#7FB069',
        background: '#0F1F0F',
        surface: '#1A331A',
        text: '#E8F5E8',
        textSecondary: '#A8D5A8',
        border: '#4A7C59',
        success: '#7FB069',
        warning: '#FFB347',
        error: '#FF6B6B',
        info: '#4ECDC4'
      },
      syntax: {
        keyword: '#7FB069',
        string: '#A8E6CF',
        comment: '#A8D5A8',
        number: '#FFD93D',
        function: '#4ECDC4',
        variable: '#FF6B6B',
        type: '#A8E6CF'
      },
      isDark: true
    });

    // Sunset
    this.themes.set('sunset', {
      id: 'sunset',
      name: 'sunset',
      displayName: 'Sunset',
      description: 'Warm sunset colors with gradient accents',
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        background: '#2C1810',
        surface: '#3E2723',
        text: '#FFF8E1',
        textSecondary: '#FFCC02',
        border: '#FF6B6B',
        success: '#4ECDC4',
        warning: '#FFE66D',
        error: '#FF5252',
        info: '#42A5F5'
      },
      syntax: {
        keyword: '#FF6B6B',
        string: '#4ECDC4',
        comment: '#BCAAA4',
        number: '#FFE66D',
        function: '#42A5F5',
        variable: '#FF8A65',
        type: '#AB47BC'
      },
      isDark: true
    });
  }

  private registerCommands(): void {
    // Cycle through themes
    this.context.ui.registerCommand(
      'custom-theme.cycle-theme',
      'Custom Theme: Cycle Themes',
      async () => {
        const themeIds = Array.from(this.themes.keys());
        const currentIndex = themeIds.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeIds.length;
        const nextTheme = themeIds[nextIndex];
        
        await this.applyTheme(nextTheme);
      }
    );

    // Open theme picker
    this.context.ui.registerCommand(
      'custom-theme.open-themes',
      'Custom Theme: Open Theme Picker',
      async () => {
        await this.showThemePicker();
      }
    );

    // Apply specific themes
    for (const [themeId, theme] of this.themes) {
      this.context.ui.registerCommand(
        `custom-theme.apply.${themeId}`,
        `Custom Theme: Apply ${theme.displayName}`,
        async () => {
          await this.applyTheme(themeId);
        }
      );
    }

    // Export theme
    this.context.ui.registerCommand(
      'custom-theme.export',
      'Custom Theme: Export Current Theme',
      async () => {
        await this.exportTheme();
      }
    );

    // Import theme
    this.context.ui.registerCommand(
      'custom-theme.import',
      'Custom Theme: Import Theme',
      async () => {
        await this.importTheme();
      }
    );
  }

  private async applyTheme(themeId: string): Promise<void> {
    const theme = this.themes.get(themeId);
    if (!theme) {
      this.context.ui.showNotification(`Theme '${themeId}' not found`, 'error');
      return;
    }

    try {
      // Store original theme if first time
      if (!this.originalTheme) {
        this.originalTheme = await this.getCurrentTheme();
      }

      // Apply theme to IDE
      await this.applyThemeToIDE(theme);
      
      // Update current theme
      this.currentTheme = themeId;
      await this.context.storage.setExtension('currentTheme', themeId);
      
      // Show notification
      this.context.ui.showNotification(
        `Applied theme: ${theme.displayName}`,
        'success'
      );

      this.context.logger.info(`Applied theme: ${theme.displayName}`);
    } catch (error) {
      this.context.logger.error('Failed to apply theme:', error);
      this.context.ui.showNotification('Failed to apply theme', 'error');
    }
  }

  private async applyThemeToIDE(theme: Theme): Promise<void> {
    // Create CSS variables for the theme
    const cssVariables = `
      :root {
        --primary-color: ${theme.colors.primary};
        --secondary-color: ${theme.colors.secondary};
        --accent-color: ${theme.colors.accent};
        --background-color: ${theme.colors.background};
        --surface-color: ${theme.colors.surface};
        --text-color: ${theme.colors.text};
        --text-secondary-color: ${theme.colors.textSecondary};
        --border-color: ${theme.colors.border};
        --success-color: ${theme.colors.success};
        --warning-color: ${theme.colors.warning};
        --error-color: ${theme.colors.error};
        --info-color: ${theme.colors.info};
        
        /* Syntax highlighting colors */
        --keyword-color: ${theme.syntax.keyword};
        --string-color: ${theme.syntax.string};
        --comment-color: ${theme.syntax.comment};
        --number-color: ${theme.syntax.number};
        --function-color: ${theme.syntax.function};
        --variable-color: ${theme.syntax.variable};
        --type-color: ${theme.syntax.type};
      }
      
      body {
        background-color: var(--background-color);
        color: var(--text-color);
      }
      
      .bg-primary { background-color: var(--primary-color); }
      .bg-secondary { background-color: var(--secondary-color); }
      .bg-surface { background-color: var(--surface-color); }
      .bg-background { background-color: var(--background-color); }
      
      .text-primary { color: var(--text-color); }
      .text-secondary { color: var(--text-secondary-color); }
      .text-accent { color: var(--accent-color); }
      
      .border-color { border-color: var(--border-color); }
      
      .keyword { color: var(--keyword-color); }
      .string { color: var(--string-color); }
      .comment { color: var(--comment-color); }
      .number { color: var(--number-color); }
      .function { color: var(--function-color); }
      .variable { color: var(--variable-color); }
      .type { color: var(--type-color); }
    `;

    // Inject theme CSS
    this.injectThemeCSS(cssVariables);

    // Notify IDE about theme change
    this.context.events.emit('theme:changed', theme);
  }

  private injectThemeCSS(css: string): void {
    // Remove existing theme style
    const existingStyle = document.getElementById('custom-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create and inject new style
    const style = document.createElement('style');
    style.id = 'custom-theme-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  private async getCurrentTheme(): Promise<any> {
    // In a real implementation, this would get the current IDE theme
    return {
      isDark: document.documentElement.classList.contains('dark'),
      colors: {}
    };
  }

  private async restoreOriginalTheme(): Promise<void> {
    if (this.originalTheme) {
      // Restore original theme
      // This would restore the original IDE theme in a real implementation
      this.context.logger.info('Restored original theme');
    }
  }

  private async showThemePicker(): Promise<void> {
    const themes = Array.from(this.themes.values());
    const themeItems = themes.map(theme => ({
      label: theme.displayName,
      description: theme.description,
      detail: theme.isDark ? 'Dark Theme' : 'Light Theme',
      picked: theme.id === this.currentTheme
    }));

    const selected = await this.context.ui.showQuickPicker(themeItems, {
      placeHolder: 'Select a theme to apply',
      canPickMany: false,
      matchOnDescription: true,
      matchOnDetail: true
    });

    if (selected) {
      const theme = themes.find(t => t.displayName === selected.label);
      if (theme) {
        await this.applyTheme(theme.id);
      }
    }
  }

  private async exportTheme(): Promise<void> {
    const theme = this.themes.get(this.currentTheme);
    if (!theme) return;

    const exportData = {
      theme,
      exportedAt: new Date().toISOString(),
      extension: 'custom-theme',
      version: this.context.manifest.version
    };

    const json = JSON.stringify(exportData, null, 2);
    
    // Create and download file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name}-theme.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    this.context.ui.showNotification(`Exported theme: ${theme.displayName}`, 'success');
  }

  private async importTheme(): Promise<void> {
    try {
      const fileName = await this.context.ui.showInputDialog('Enter theme JSON file path:');
      if (!fileName) return;

      const response = await this.context.http.get(`file://${fileName}`);
      const importData = JSON.parse(response.data);

      if (importData.theme) {
        const theme: Theme = importData.theme;
        this.themes.set(theme.id, theme);
        
        this.context.ui.showNotification(`Imported theme: ${theme.displayName}`, 'success');
        this.context.logger.info(`Imported theme: ${theme.displayName}`);
      }
    } catch (error) {
      this.context.logger.error('Failed to import theme:', error);
      this.context.ui.showNotification('Failed to import theme', 'error');
    }
  }

  private setupAutoTheme(): void {
    // Auto theme switching based on time of day
    const now = new Date();
    const hour = now.getHours();

    let suggestedTheme = 'oceanic';
    
    if (hour >= 6 && hour < 12) {
      suggestedTheme = 'solarized-light'; // Morning - bright
    } else if (hour >= 12 && hour < 18) {
      suggestedTheme = 'sunset'; // Afternoon - warm
    } else if (hour >= 18 && hour < 22) {
      suggestedTheme = 'oceanic'; // Evening - calming
    } else {
      suggestedTheme = 'dracula'; // Night - dark
    }

    if (suggestedTheme !== this.currentTheme) {
      this.context.ui.showNotification(
        `Auto theme switching to ${this.themes.get(suggestedTheme)?.displayName} based on time of day`,
        'info'
      );
      this.applyTheme(suggestedTheme);
    }
  }

  async dispose(): Promise<void> {
    this.context.logger.info('Custom Theme Extension: Disposing...');
    
    // Restore original theme
    if (this.originalTheme) {
      await this.restoreOriginalTheme();
    }
    
    // Remove theme CSS
    const existingStyle = document.getElementById('custom-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    this.context.logger.info('Custom Theme Extension: Disposed');
  }
}

// Extension manifest
export const manifest = {
  name: 'custom-theme',
  displayName: 'Custom Theme Pack',
  version: '1.0.0',
  description: 'A collection of beautiful custom themes for the AI-IDE. Includes dark, light, and colorful themes with syntax highlighting.',
  author: {
    name: 'Theme Creator',
    email: 'themes@ai-ide.com',
    url: 'https://github.com/theme-creator'
  },
  main: 'dist/custom-theme.js',
  permissions: [
    'ui.render',
    'ui.command',
    'ui.shortcut',
    'settings.read',
    'settings.write'
  ],
  categories: ['themes', 'productivity'],
  keywords: ['theme', 'color', 'dark', 'light', 'syntax', 'customization'],
  homepage: 'https://github.com/theme-creator/custom-theme',
  repository: 'https://github.com/theme-creator/custom-theme',
  license: 'Apache-2.0',
  configSchema: {
    type: 'object',
    properties: {
      enableAutoTheme: {
        type: 'boolean',
        description: 'Automatically switch themes based on time of day',
        default: false
      },
      defaultTheme: {
        type: 'string',
        description: 'Default theme to use',
        default: 'oceanic',
        enum: ['oceanic', 'solarized-light', 'dracula', 'forest', 'sunset']
      },
      animateTransitions: {
        type: 'boolean',
        description: 'Animate theme transitions',
        default: true
      }
    }
  },
  defaultConfig: {
    enableAutoTheme: false,
    defaultTheme: 'oceanic',
    animateTransitions: true
  }
};