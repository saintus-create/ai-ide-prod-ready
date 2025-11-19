# AI-IDE Vercel Deployment Checklist

Use this checklist to ensure your deployment is successful.

## Pre-Deployment

### Backend Setup
- [ ] Backend deployed to Railway/Render/Heroku/Vercel Functions
- [ ] Backend API is accessible at the deployed URL
- [ ] WebSocket server is running and accessible
- [ ] CORS configured for your Vercel domain
- [ ] Environment variables set on backend:
  - [ ] `CODESTRAL_API_KEY`
  - [ ] `HF_TOKEN`
  - [ ] `CLIENT_ORIGIN` (your Vercel domain)
  - [ ] `PORT`

### Frontend Configuration
- [ ] Environment variables created:
  - [ ] `VITE_API_URL` (backend URL)
  - [ ] `VITE_WS_URL` (WebSocket URL)
- [ ] Build test successful: `npm run build`
- [ ] Dependencies updated in `package.json`
- [ ] `vercel.json` configuration present

### Vercel Setup
- [ ] Vercel account created
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] Vercel login: `vercel login`
- [ ] Project imported to Vercel dashboard
- [ ] Environment variables added in Vercel dashboard
- [ ] Build settings configured:
  - [ ] Framework: Vite
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `frontend/dist`

## Deployment Process

### Automated Deployment (Recommended)
```bash
# Run the verification script
bash scripts/verify-deployment.sh

# Deploy frontend
cd frontend && vercel --prod
```

### Manual Deployment
- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Trigger deployment from Vercel dashboard
- [ ] Monitor build logs for errors
- [ ] Verify deployment URL

## Post-Deployment Verification

### Frontend Tests
- [ ] Website loads at Vercel URL
- [ ] Theme toggle works correctly
- [ ] Pure black theme displays properly
- [ ] Toast notifications appear
- [ ] All keyboard shortcuts function:
  - [ ] Ctrl+S (Save)
  - [ ] Ctrl+N (New file)
  - [ ] Ctrl+O (Open file)
  - [ ] Ctrl+F (Find)
  - [ ] Ctrl+H (Replace)
  - [ ] Ctrl+` (Toggle panel)

### Backend Integration
- [ ] File explorer loads files
- [ ] File creation/deletion works
- [ ] Code editor displays content
- [ ] AI completion API responds
- [ ] Chat assistant responds
- [ ] Git panel functions

### WebSocket Tests
- [ ] WebSocket connection established
- [ ] Real-time file updates work
- [ ] Git status updates appear
- [ ] No connection errors in console

### Cross-Browser Testing
- [ ] Chrome - All features work
- [ ] Firefox - All features work
- [ ] Safari - All features work
- [ ] Edge - All features work

### Mobile Testing
- [ ] Responsive layout works
- [ ] Touch interactions function
- [ ] Theme toggle accessible
- [ ] Keyboard shortcuts accessible

## Performance Checks

### Loading Performance
- [ ] Initial page load < 3 seconds
- [ ] Code editor loads quickly
- [ ] File tree loads without delay
- [ ] No console errors

### Memory Usage
- [ ] No memory leaks in long sessions
- [ ] WebSocket connections stable
- [ ] Editor performance remains smooth

## Security Verification

### Environment Security
- [ ] No API keys exposed in frontend
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Rate limiting active on backend

### Content Security
- [ ] Helmet.js headers configured
- [ ] XSS protection active
- [ ] Content-Type headers set
- [ ] Frame options configured

## Troubleshooting Checklist

If issues occur, check these common problems:

### Build Failures
- [ ] Node.js version >= 18.0.0
- [ ] npm version >= 8.0.0
- [ ] All dependencies in package.json
- [ ] TypeScript errors resolved

### API Connection Issues
- [ ] Backend URL accessible
- [ ] Environment variables correct
- [ ] CORS headers set correctly
- [ ] WebSocket URL uses wss:// for production

### Theme/Styling Issues
- [ ] Tailwind CSS built correctly
- [ ] CSS files loading
- [ ] No 404 errors for CSS/JS files
- [ ] Theme persistence works

### Performance Issues
- [ ] Bundle size optimized
- [ ] Code splitting configured
- [ ] Images optimized
- [ ] CDN configured

## Final Sign-off

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring setup (Vercel Analytics)
- [ ] Team notified of deployment

---

## Quick Commands Reference

```bash
# Development
npm run dev

# Vercel deployment
npm run vercel:deploy

# Deployment verification
bash scripts/verify-deployment.sh

# Local build test
npm run build
```

**Deployment Complete! 🎉**

Your AI-IDE with pure black theme is now live on Vercel!