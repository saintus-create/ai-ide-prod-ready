# Contributing to AI-IDE

Thank you for your interest in contributing to AI-IDE! This document provides guidelines and information for contributors.

## 🎯 Project Overview

AI-IDE is a production-ready AI-powered development environment with:
- Modern web-based interface
- Comprehensive testing infrastructure
- Enterprise-grade CI/CD pipeline
- Extension system for customization
- Full accessibility support

## 🚀 Getting Started

### Development Environment Setup

#### Prerequisites
- Node.js 18+ and npm/pnpm
- Git for version control
- Docker for containerized development
- VS Code (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - GitLens

#### Quick Start
```bash
# Clone the repository
git clone https://github.com/saintus-create/ai-ide-prod-ready.git
cd ai-ide-prod-ready

# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test
```

#### Development Commands
```bash
# Development
npm run dev:backend        # Start backend API server
npm run dev:frontend       # Start frontend development server
npm run dev:storybook      # Start Storybook component gallery

# Testing
npm test                   # Run all tests
npm run test:unit          # Unit tests only
npm run test:e2e          # End-to-end tests
npm run test:coverage     # Coverage report
npm run test:watch        # Watch mode

# Code Quality
npm run lint              # ESLint checking
npm run lint:fix          # Fix ESLint issues
npm run format            # Prettier formatting
npm run type-check        # TypeScript type checking

# Building
npm run build             # Production build
npm run build:analyze     # Build with bundle analysis
```

## 📋 Development Workflow

### Git Workflow

We follow the **Git Flow** branching strategy:

#### Branch Types
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

#### Development Process
```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/amazing-feature

# 2. Develop and commit
# ... make changes ...
git add .
git commit -m "feat: add amazing feature"

# 3. Push and create PR
git push origin feature/amazing-feature

# 4. Update develop from main
git checkout develop
git pull origin develop
```

#### Commit Message Convention

We use **Conventional Commits** for clear, consistent commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Build process or auxiliary tool changes
- `ci:` CI/CD changes
- `perf:` Performance improvements

**Examples:**
```bash
feat(editor): add syntax highlighting for Python
fix(file-explorer): resolve drag-and-drop issue on Safari
docs(api): update authentication documentation
test(ui): add test for settings modal validation
refactor(ai): optimize completion response parsing
```

### Pull Request Process

#### Before Submitting
1. **Code Quality**
   - Run `npm run lint` and fix all issues
   - Run `npm run type-check` to ensure TypeScript correctness
   - Ensure all tests pass: `npm test`
   - Update tests for new features

2. **Documentation**
   - Update relevant documentation
   - Add JSDoc comments for new functions
   - Update API documentation if needed

3. **Testing**
   - Add unit tests for new functionality
   - Update E2E tests if UI changes
   - Ensure coverage doesn't decrease

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

#### Review Process
1. **Automated Checks** (must pass)
   - CI pipeline builds successfully
   - All tests pass
   - Code quality checks pass
   - Security scans pass

2. **Code Review** (required)
   - At least 2 approvals from maintainers
   - All review comments addressed
   - Tests updated if necessary

3. **Manual Testing**
   - Feature tested manually
   - Edge cases considered
   - Performance impact assessed

## 🏗️ Architecture Guidelines

### Project Structure
```
ai-ide/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── test/           # Test files
│   └── package.json
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   ├── test/           # Test files
│   │   └── e2e/            # E2E tests
│   └── package.json
├── scripts/               # Build and deployment scripts
├── docs/                  # Documentation
└── .github/              # GitHub workflows
```

### Backend Guidelines

#### API Design
- Follow RESTful principles
- Use proper HTTP status codes
- Implement comprehensive error handling
- Add request validation with Zod
- Document all endpoints in OpenAPI spec

#### Error Handling
```typescript
// Standardized error response
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details",
  "timestamp": "2025-11-20T07:10:47.000Z",
  "path": "/api/endpoint"
}

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});
```

#### Service Architecture
```typescript
// Service interface
interface WorkspaceService {
  listFiles(path: string): Promise<FileInfo[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
}

// Service implementation
export class WorkspaceServiceImpl implements WorkspaceService {
  constructor(
    private fileSystem: FileSystemInterface,
    private logger: Logger
  ) {}
  
  async listFiles(path: string): Promise<FileInfo[]> {
    try {
      this.logger.info(`Listing files in ${path}`);
      const files = await this.fileSystem.readDirectory(path);
      return files.map(file => ({
        path: file.path,
        name: file.name,
        type: file.isDirectory ? 'directory' : 'file',
        size: file.size,
        modified: file.modified
      }));
    } catch (error) {
      this.logger.error(`Failed to list files in ${path}`, error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}
```

### Frontend Guidelines

#### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Follow the single responsibility principle
- Use TypeScript for type safety
- Prefer composition over inheritance

#### Component Structure
```tsx
// Props interface
interface EditorProps {
  file: FileInfo;
  onChange: (content: string) => void;
  onSave: () => void;
  readonly?: boolean;
}

// Component with proper structure
export const Editor: React.FC<EditorProps> = ({
  file,
  onChange,
  onSave,
  readonly = false
}) => {
  // Hooks
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useToast();
  
  // Effects
  useEffect(() => {
    loadFile();
  }, [file.path]);
  
  // Event handlers
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onChange(newContent);
  }, [onChange]);
  
  const handleSave = useCallback(async () => {
    try {
      await onSave();
      showNotification('File saved successfully', 'success');
    } catch (error) {
      showNotification('Failed to save file', 'error');
    }
  }, [onSave, showNotification]);
  
  // Render
  if (isLoading) {
    return <Spinner size="md" />;
  }
  
  return (
    <div className="editor">
      <CodeMirror
        value={content}
        onChange={handleContentChange}
        readOnly={readonly}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};
```

#### State Management
```typescript
// Custom hook for file state
export const useFileEditor = (file: FileInfo) => {
  const [content, setContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const save = useCallback(async () => {
    if (!isDirty) return;
    
    setIsSaving(true);
    try {
      await FileService.saveFile(file.path, content);
      setIsDirty(false);
      showNotification('File saved', 'success');
    } catch (error) {
      showNotification('Failed to save file', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [content, isDirty, file.path]);
  
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(newContent !== content);
  }, [content]);
  
  return {
    content,
    isDirty,
    isSaving,
    updateContent,
    save
  };
};
```

#### Performance Optimization
```tsx
// Memoized component
export const FileTree = React.memo<FileTreeProps>(({ files, onFileSelect }) => {
  const handleFileClick = useCallback((file: FileInfo) => {
    onFileSelect(file);
  }, [onFileSelect]);
  
  return (
    <div className="file-tree">
      {files.map(file => (
        <FileTreeItem
          key={file.path}
          file={file}
          onClick={handleFileClick}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return prevProps.files.length === nextProps.files.length &&
         prevProps.files.every((file, index) => 
           file.path === nextProps.files[index].path
         );
});
```

## 🧪 Testing Guidelines

### Testing Philosophy
- **Test Pyramid**: Many unit tests, some integration tests, few E2E tests
- **Test Coverage**: Maintain >85% coverage
- **Test Maintainability**: Tests should be as maintainable as production code
- **Test Isolation**: Tests should not depend on each other

### Backend Testing

#### Unit Tests
```typescript
// WorkspaceService test
describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let mockFileSystem: jest.Mocked<FileSystemInterface>;
  
  beforeEach(() => {
    mockFileSystem = createMockFileSystem();
    service = new WorkspaceServiceImpl(mockFileSystem);
  });
  
  describe('listFiles', () => {
    it('should return list of files', async () => {
      // Arrange
      const files = [
        { path: 'test.js', isDirectory: false, size: 1024 },
        { path: 'src', isDirectory: true, size: 4096 }
      ];
      mockFileSystem.readDirectory.mockResolvedValue(files);
      
      // Act
      const result = await service.listFiles('/path');
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        path: 'test.js',
        name: 'test.js',
        type: 'file',
        size: 1024,
        modified: expect.any(Date)
      });
    });
    
    it('should handle filesystem errors', async () => {
      // Arrange
      mockFileSystem.readDirectory.mockRejectedValue(new Error('Permission denied'));
      
      // Act & Assert
      await expect(service.listFiles('/restricted'))
        .rejects
        .toThrow('Failed to list files: Permission denied');
    });
  });
});
```

#### Integration Tests
```typescript
// API integration test
describe('Workspace API', () => {
  let app: Express;
  
  beforeAll(async () => {
    app = await createTestApp();
  });
  
  it('should list workspace files', async () => {
    // Create test file
    await FileSystem.writeFile('test.js', 'console.log("hello");');
    
    // Request
    const response = await request(app)
      .get('/api/workspace/files')
      .expect(200);
    
    // Verify
    expect(response.body).toEqual({
      files: [
        expect.objectContaining({
          path: 'test.js',
          name: 'test.js',
          type: 'file'
        })
      ]
    });
  });
});
```

### Frontend Testing

#### Component Tests
```tsx
// SettingsModal test
describe('SettingsModal', () => {
  it('should save settings when form is submitted', async () => {
    // Render component
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    // Fill form
    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'test-key' }
    });
    
    fireEvent.click(screen.getByText('Save'));
    
    // Verify
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        'api-key': 'test-key'
      });
    });
  });
  
  it('should handle validation errors', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    
    // Try to save without required field
    fireEvent.click(screen.getByText('Save'));
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('API Key is required')).toBeInTheDocument();
    });
  });
});
```

#### E2E Tests
```typescript
// Playwright E2E test
test.describe('File Management', () => {
  test('should create and edit files', async ({ page }) => {
    // Navigate to AI-IDE
    await page.goto('/');
    
    // Create new file
    await page.click('[data-testid="new-file-button"]');
    await page.fill('[data-testid="filename-input"]', 'test.js');
    await page.click('[data-testid="create-file-confirm"]');
    
    // Verify file appears in explorer
    await expect(page.locator('[data-testid="file-tree"]')).toContainText('test.js');
    
    // Edit file
    await page.click('[data-testid="file-tree"] [data-testid="test.js"]');
    await page.fill('[data-testid="editor"]', 'console.log("hello world");');
    
    // Save file
    await page.click('[data-testid="save-button"]');
    
    // Verify notification
    await expect(page.locator('[data-testid="toast"]')).toContainText('File saved');
  });
});
```

## 📊 Code Quality

### ESLint Configuration
```json
{
  "extends": [
    "@ai-ide/eslint-config",
    "@ai-ide/eslint-config/react",
    "@ai-ide/eslint-config/typescript"
  ],
  "rules": {
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "complexity": ["error", 10]
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false
}
```

### TypeScript Guidelines
```typescript
// Strict interfaces
interface FileInfo {
  readonly path: string;
  readonly name: string;
  readonly type: 'file' | 'directory';
  readonly size: number;
  readonly modified: Date;
}

// Generic utilities
type APIResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};

// Discriminated unions
type FileAction = 
  | { type: 'create'; path: string; content: string }
  | { type: 'delete'; path: string }
  | { type: 'rename'; from: string; to: string };

// Result pattern
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

async function readFile(path: string): Promise<Result<string>> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return { ok: true, value: content };
  } catch (error) {
    return { ok: false, error };
  }
}
```

## 🔧 Build & Deployment

### Build Process
```yaml
# CI pipeline stages
stages:
  - lint          # Code quality checks
  - test          # Unit and integration tests
  - security      # Security scanning
  - build         # Production builds
  - e2e          # End-to-end tests
  - deploy        # Deployment
```

### Environment Configuration
```bash
# Development
NODE_ENV=development
API_URL=http://localhost:3001
WS_URL=ws://localhost:3001

# Staging
NODE_ENV=staging
API_URL=https://staging-api.ai-ide.dev
WS_URL=wss://staging-api.ai-ide.dev

# Production
NODE_ENV=production
API_URL=https://api.ai-ide.dev
WS_URL=wss://api.ai-ide.dev
```

## 🐛 Bug Reports

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 96.0]
- Version: [e.g. 1.0.0]

## Additional Context
Screenshots, error logs, etc.
```

### Performance Issues
```markdown
## Performance Issue
Performance-related bug report

## Performance Impact
- Response time: [e.g. 5s instead of 200ms]
- Memory usage: [e.g. 2GB instead of 100MB]
- CPU usage: [e.g. 80% instead of 10%]

## Reproduction
Steps that cause the issue

## Profiling Data
Chrome DevTools performance profile or similar
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Other ways to solve this problem

## Additional Context
Mockups, examples, related issues
```

## 📋 Issue Triage

### Priority Levels
- **P0 - Critical**: Blocking production, immediate fix required
- **P1 - High**: Important features, fix within sprint
- **P2 - Medium**: Normal features, fix within quarter
- **P3 - Low**: Nice-to-have features, backlog

### Labels
- `bug` - Bug reports
- `enhancement` - Feature requests
- `documentation` - Documentation improvements
- `good-first-issue` - Beginner-friendly issues
- `help-wanted` - Looking for community help
- `question` - Questions and discussions

## 🎓 Learning Resources

### Code Style Guides
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React Component Patterns](https://react.dev/learn/thinking-in-react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Testing Resources
- [Jest Testing Patterns](https://jestjs.io/docs/en/tutorial-async)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro/)

### Development Tools
- [VS Code Extension Recommendations](#)
- [Chrome DevTools Guide](#)
- [Git Documentation](https://git-scm.com/docs)

## 🤝 Community Guidelines

### Code of Conduct
We are committed to providing a welcoming and inclusive environment. Please:

- **Be respectful** - Treat all community members with respect
- **Be inclusive** - Welcome people of all backgrounds and experience levels
- **Be constructive** - Provide helpful feedback and suggestions
- **Be patient** - Help others learn and grow

### Communication Channels
- **GitHub Discussions** - Feature discussions and Q&A
- **Discord** - Real-time chat and community support
- **Email** - Private matters: contact@ai-ide.dev

### Recognition
Contributors are recognized in:
- **Contributors.md** - Comprehensive contributor list
- **Release notes** - Feature acknowledgments
- **Hall of Fame** - Outstanding contributions

## 🏆 Getting Help

### Before Asking for Help
1. Check existing documentation
2. Search through existing issues
3. Try the latest version
4. Reproduce the issue

### How to Ask Questions
1. **Search first** - Check documentation and existing issues
2. **Provide context** - Include environment, steps to reproduce
3. **Be specific** - Ask one question at a time
4. **Include examples** - Provide minimal reproducible examples

### Office Hours
- **Weekly**: Thursday 2-3 PM PST
- **Format**: Q&A, code review, pair programming
- **Zoom Link**: [Available in Discord](discord.gg/ai-ide)

## 📝 Documentation Contributions

### Documentation Standards
- **Clear and concise** - Use simple, direct language
- **Comprehensive** - Cover all use cases
- **Up-to-date** - Keep documentation current with code
- **Accessible** - Write for all skill levels

### Documentation Types
- **API Reference** - Complete API documentation
- **Tutorials** - Step-by-step guides
- **Guides** - Conceptual explanations
- **Examples** - Code samples and demos

### Writing Guidelines
```markdown
## Code Examples
Use triple backticks with language specification

```typescript
const example = 'code here';
```

## Screenshots
Include screenshots for UI changes

## Links
Use relative links for internal documentation

## Warnings
Use warnings for important information

> **Warning**: This action cannot be undone
```

Thank you for contributing to AI-IDE! Your contributions help make this project better for everyone. 🎉