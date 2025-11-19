# Testing Guide

## Overview

The AI-IDE project includes a comprehensive testing infrastructure with multiple layers of testing:

- **Unit Tests**: Backend API endpoints with Jest
- **Component Tests**: Frontend components with Vitest + React Testing Library
- **E2E Tests**: Full application workflows with Playwright
- **Storybook**: Interactive component documentation

## Backend Testing (Jest)

### Running Tests

```bash
cd backend
npm install
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ci       # CI mode
```

### Test Structure

```
backend/src/test/
├── setup.ts           # Test environment setup
├── test-utils.ts      # Shared test utilities
├── health.test.ts     # Health endpoint tests
├── workspace.test.ts  # Workspace endpoint tests
├── ai.test.ts         # AI endpoint tests
└── git.test.ts        # Git endpoint tests
```

### Coverage Requirements

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Frontend Testing (Vitest)

### Running Tests

```bash
cd frontend
npm install
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ci       # CI mode
```

### Test Structure

```
frontend/src/test/
├── setup.ts              # Test environment setup
├── useTheme.test.tsx     # useTheme hook tests
├── ErrorBoundary.test.tsx # Error boundary tests
└── SettingsModal.test.tsx # Settings modal tests
```

### Mocking

- `localStorage`: Automatically mocked for persistence testing
- `fetch`: Mocked for API calls
- `WebSocket`: Mocked for real-time features
- React components: Cleaned up after each test

## E2E Testing (Playwright)

### Running Tests

```bash
cd frontend
npm install
npm run test:e2e          # Run all E2E tests
npx playwright install    # Install browsers
```

### Test Coverage

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: iOS Safari, Android Chrome
- **Features**: 
  - Application loading
  - Settings modal interaction
  - Theme switching
  - Mobile responsiveness
  - Keyboard shortcuts
  - Error boundary handling
  - LocalStorage persistence

### Screenshots & Videos

E2E tests automatically capture:
- **Screenshots**: On failure only
- **Videos**: Retained on failure for debugging

## Storybook (Component Documentation)

### Running Storybook

```bash
cd frontend
npm install
npm run storybook         # Start Storybook dev server
npm run build-storybook   # Build static version
```

### Available Stories

- **SettingsModal**: Complete settings interface
- **ErrorBoundary**: Error handling UI
- **Editor**: Multi-tab code editor

### Story Features

- **Interactive**: Live component testing
- **Responsive**: Mobile, tablet, desktop viewports
- **Themed**: Light and dark theme support
- **Accessible**: A11y testing integration

## Code Quality

### ESLint

```bash
# Backend
cd backend
npm run lint
npm run lint:fix

# Frontend  
cd frontend
npm run lint
npm run lint:fix
```

### Prettier

```bash
# Format all code
npx prettier --write backend/src/
npx prettier --write frontend/src/
```

## Docker Health Checks

### Backend Health Check

```bash
# Inside container
curl http://localhost:4000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T06:31:48.000Z",
  "uptime": 123.456,
  "memory": { ... },
  "database": { ... },
  "aiProvider": { ... }
}
```

### Frontend Health Check

```bash
# Inside container
curl http://localhost:3000/health
```

Response:
```
healthy
```

## Continuous Integration

### Test Commands for CI

```bash
# Backend
npm run test:ci

# Frontend  
npm run test:ci
npm run test:e2e
npm run lint
npm run build
```

## Best Practices

### Writing Tests

1. **Unit Tests**: Test individual functions and API endpoints
2. **Component Tests**: Test React components with user interactions
3. **E2E Tests**: Test complete user workflows
4. **Test Coverage**: Maintain 70%+ coverage

### Mocking Guidelines

- Use `vi.fn()` for function mocks
- Mock external dependencies (localStorage, fetch, WebSocket)
- Reset mocks after each test
- Use realistic test data

### Accessibility Testing

- Include `aria-*` attributes in components
- Test keyboard navigation
- Verify color contrast
- Check screen reader compatibility

## Debugging Tests

### Backend Tests

```bash
# Debug specific test
npm test -- --testNamePattern="should list directory contents"

# Debug with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend Tests

```bash
# Debug specific test
npm test -- --testNamePattern="should toggle theme"

# UI mode for debugging
npm test -- --ui
```

### E2E Tests

```bash
# Debug mode with browser
npx playwright test --debug

# headed mode to see browser
npx playwright test --headed

# Trace viewer
npx playwright show-trace trace.zip
```

## Performance Testing

### Load Testing

```bash
# Using Artillery or similar
npm install -g artillery
artillery run load-test.yml
```

### Bundle Analysis

```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
npm run build
webpack-bundle-analyzer dist/static/js/*.js
```

## Security Testing

### Dependency Scanning

```bash
# Audit dependencies
npm audit
npm audit fix

# Security scanning with Snyk
npm install -g snyk
snyk test
```

## Test Data Management

### Test Fixtures

- Store test data in `__fixtures__/` directories
- Use realistic data that matches production
- Keep fixtures small and focused

### Database Seeding

```typescript
// In test setup
beforeEach(async () => {
  await seedTestDatabase();
});

afterEach(async () => {
  await clearTestDatabase();
});
```

This testing infrastructure ensures the AI-IDE is robust, maintainable, and ready for production deployment.