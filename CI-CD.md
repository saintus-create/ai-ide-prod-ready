# CI/CD & Infrastructure Guide

## Overview

This document outlines the comprehensive CI/CD pipeline and infrastructure setup for the AI-IDE project. The system provides automated testing, security scanning, performance validation, and deployment across multiple environments.

## CI/CD Pipeline Architecture

### Workflow Files

1. **`.github/workflows/ci-cd.yml`** - Main CI/CD pipeline
   - Multi-stage testing and validation
   - Automated builds and deployments
   - Security scanning and performance monitoring

2. **`.github/workflows/deployment.yml`** - Environment-specific deployments
   - Staging and production deployments
   - Docker image building and pushing
   - Database migration management

3. **`.github/workflows/dependency-review.yml`** - Dependency monitoring
   - Automated dependency vulnerability scanning
   - License compliance checking
   - Outdated package detection

## Pipeline Stages

### 1. Code Quality & Testing
```yaml
Lint and Test:
  - ESLint code analysis
  - Backend Jest testing (85%+ coverage)
  - Frontend Vitest testing
  - E2E testing with Playwright
  - Coverage reporting to Codecov
```

### 2. Security Scanning
```yaml
Security Scan:
  - Dependency vulnerability audit
  - Secrets scanning in code
  - Dockerfile security analysis
  - SAST (Static Application Security Testing)
```

### 3. Build & Containerization
```yaml
Build and Push:
  - Multi-stage Docker builds
  - Image security scanning
  - Container registry pushing
  - Artifact storage
```

### 4. Performance Validation
```yaml
Performance Budget:
  - Lighthouse CI auditing
  - Bundle size monitoring
  - Performance metrics validation
  - Visual regression testing
```

### 5. Deployment
```yaml
Deploy:
  - Environment-specific deployments
  - Health check validation
  - Rollback capability testing
  - Notification systems
```

## Environment Strategy

### Development Environment
- **URL**: `http://localhost:3001` (API) + `http://localhost:3000` (Frontend)
- **Trigger**: Direct code changes
- **Features**: Hot reloading, debug mode, verbose logging

### Staging Environment
- **URL**: `https://staging-ai-ide.vercel.app`
- **Trigger**: Push to `develop` branch
- **Features**: Production build, automated testing, performance monitoring

### Production Environment
- **URL**: `https://ai-ide.vercel.app`
- **Trigger**: Push to `main` branch
- **Features**: Full optimization, monitoring, alerts

## Docker Configuration

### Backend Dockerfile
```dockerfile
# Multi-stage build with security hardening
FROM node:22-alpine AS builder
# ... build stage

FROM node:22-alpine AS runtime
# Non-root user setup
RUN adduser -S nextjs -u 1001
USER nextjs

# Health check implementation
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r => process.exit(r.ok ? 0 : 1))"
```

### Frontend Dockerfile
```dockerfile
# Nginx-based production serving
FROM nginx:alpine

# Security headers and caching
# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Performance Monitoring

### Lighthouse CI Configuration
- **Desktop**: 1920x1080, RTT 40ms, 10Mbps throughput
- **Mobile**: 375x812, RTT 150ms, 1.6Mbps throughput
- **Metrics**: Performance, Accessibility, Best Practices, SEO
- **Budgets**: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Bundle Analysis
- **Initial Bundle**: < 500KB
- **Total Bundle**: < 1MB
- **Component Styles**: < 5KB each
- **CodeMirror**: < 200KB total

### Performance Scripts
```bash
# Run security scan
./scripts/security-scan.sh

# Run performance check
./scripts/performance-check.sh

# Generate performance report
./scripts/generate-perf-report.sh
```

## Security Implementation

### Security Scanning
- **npm audit**: Dependency vulnerability scanning
- **Secrets detection**: Gitleaks or TruffleHog integration
- **SAST**: CodeQL or Semgrep analysis
- **Container scanning**: Docker image vulnerability assessment

### Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### Authentication & Authorization
- **API Keys**: Bearer token authentication
- **Rate Limiting**: Express-rate-limit middleware
- **Input Validation**: Zod schema validation
- **CORS**: Configured for specific origins

## OpenAPI Specification

### API Documentation
- **File**: `api-spec.yaml`
- **Validation**: OpenAPI 3.0.3 compliance
- **Documentation**: Auto-generated with Swagger UI
- **Testing**: Automated API contract testing

### Endpoint Categories
1. **Health**: System status and monitoring
2. **Workspace**: File system operations
3. **AI**: Code completion and chat
4. **Git**: Version control integration

## Environment Variables

### Required Secrets
```bash
# GitHub
GITHUB_TOKEN: Personal access token for repository operations

# Vercel
VERCEL_TOKEN: Vercel API token
VERCEL_ORG_ID: Vercel organization ID
VERCEL_PROJECT_ID: Vercel project ID

# Docker
DOCKER_USERNAME: Docker Hub username
DOCKER_PASSWORD: Docker Hub password

# Notifications
SLACK_WEBHOOK: Slack webhook for deployment notifications

# API Keys
CODESTRAL_API_KEY: Codestral API key
MISTRAL_API_KEY: Mistral API key
HF_TOKEN: Hugging Face token
```

### Configuration Variables
```bash
# Environment
NODE_ENV: production/development
CLIENT_ORIGIN: Frontend origin URL
VITE_API_URL: API endpoint URL
VITE_WS_URL: WebSocket endpoint URL

# Docker
REGISTRY: Container registry URL
IMAGE_NAME: Base image name
```

## Monitoring & Alerting

### Health Checks
- **API Health**: `/api/health` endpoint
- **Frontend Health**: `/health` endpoint
- **Database Health**: Connection and query testing
- **External Services**: AI provider availability

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **API Response Times**: Endpoint latency monitoring
- **Error Rates**: Application error tracking
- **Resource Usage**: Memory and CPU monitoring

### Logging Strategy
```yaml
Backend:
  - Structured JSON logging
  - Request/response logging
  - Error stack traces
  - Security event logging

Frontend:
  - Error boundary logging
  - Performance monitoring
  - User interaction tracking
  - Security event logging
```

## Deployment Rollback Strategy

### Automatic Rollback Triggers
- Health check failures
- Performance regression detection
- High error rates (>5%)
- Security vulnerability detection

### Manual Rollback Process
1. **Identify Issue**: Review monitoring dashboards
2. **Assess Impact**: Determine affected systems
3. **Execute Rollback**: Deploy previous stable version
4. **Verify Recovery**: Ensure systems are healthy
5. **Post-Incident**: Document and analyze

### Rollback Commands
```bash
# Rollback frontend
vercel rollback --token=$VERCEL_TOKEN

# Rollback backend (Kubernetes)
kubectl rollout undo deployment/ai-ide-backend

# Rollback database migration
npm run db:migrate:down --env=production
```

## Quality Gates

### Pre-deployment Checks
- [ ] All tests passing
- [ ] Coverage > 80%
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Changelog generated

### Post-deployment Verification
- [ ] Health checks passing
- [ ] Smoke tests successful
- [ ] Performance metrics within limits
- [ ] No critical errors in logs
- [ ] User acceptance testing passed

## Developer Workflow

### Getting Started
1. **Fork Repository**: Create personal fork
2. **Clone Locally**: `git clone <repository-url>`
3. **Install Dependencies**: `npm install` in both directories
4. **Run Tests**: `npm test` to verify setup
5. **Start Development**: `npm run dev`

### Pull Request Process
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Implement feature/fix
3. **Run Tests**: Ensure all tests pass
4. **Update Documentation**: Keep docs current
5. **Create PR**: Include detailed description
6. **Address Reviews**: Respond to code review feedback
7. **Merge**: Squash and merge after approval

### Release Process
1. **Version Bump**: Update package.json versions
2. **Generate Changelog**: Auto-generate from commits
3. **Tag Release**: Create git tag with version
4. **Deploy**: Trigger production deployment
5. **Verify**: Ensure deployment successful
6. **Notify**: Update team channels

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version compatibility
nvm use 22
```

#### Test Failures
```bash
# Backend tests
cd backend
npm run test:ci -- --verbose

# Frontend tests
cd frontend
npm run test:ci -- --reporter=verbose

# E2E tests
cd frontend
npx playwright test --debug
```

#### Performance Issues
```bash
# Analyze bundle size
cd frontend
npm run build
npx webpack-bundle-analyzer dist/static/js/*.js

# Run Lighthouse audit
npm run lhci autorun
```

#### Deployment Issues
```bash
# Check Vercel deployment
vercel logs --token=$VERCEL_TOKEN

# Check Docker registry
docker images | grep ai-ide
docker logs <container-id>
```

### Support Channels
- **GitHub Issues**: Technical bugs and feature requests
- **Slack**: Real-time team communication
- **Documentation**: Inline code documentation
- **Wiki**: Extended technical documentation

This CI/CD infrastructure ensures reliable, secure, and performant deployments of the AI-IDE application across all environments.