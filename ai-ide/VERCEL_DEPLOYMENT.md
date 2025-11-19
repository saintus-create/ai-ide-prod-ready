# Vercel Deployment Guide

This guide covers deploying the AI-IDE frontend to Vercel while hosting the backend separately.

## Architecture Overview

- **Frontend**: Deployed to Vercel (React + Vite)
- **Backend**: Deploy to separate service (Railway, Render, Heroku, Vercel Functions)
- **Communication**: Frontend connects to backend via environment variables

## Prerequisites

1. Vercel account ([vercel.com](https://vercel.com))
2. Backend deployment service (see [Backend Deployment Options](#backend-deployment-options))
3. Your AI API keys (Codestral, Hugging Face, etc.)

## Step 1: Deploy Backend

Choose one of the following options for your backend:

### Option A: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Option B: Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables from your `.env` file

### Option C: Heroku
```bash
# Install Heroku CLI and login
heroku create your-backend-name

# Set environment variables
heroku config:set CODESTRAL_API_KEY=your_key
heroku config:set HF_TOKEN=your_token
heroku config:set CLIENT_ORIGIN=https://your-app.vercel.app

# Deploy
git push heroku main
```

### Option D: Vercel Functions (Advanced)
Convert Express routes to Vercel serverless functions:
```javascript
// api/completion.js
export default async function handler(req, res) {
  // Your completion logic here
  res.json({ result: 'completion' });
}
```

## Step 2: Configure Frontend Environment Variables

### For Development
Create `.env.local` in the frontend directory:
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

### For Production
Add these variables in your Vercel dashboard:
- `VITE_API_URL`: Your production backend URL
- `VITE_WS_URL`: Your production WebSocket URL

## Step 3: Deploy to Vercel

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel --prod
```

### Option 2: Git Integration
1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Set framework preset to "Vite"
4. Configure environment variables
5. Deploy

### Option 3: Vercel for GitHub
1. Install Vercel GitHub App
2. Select your repository
3. Configure build settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
4. Add environment variables

## Step 4: Update Backend CORS

Ensure your backend allows requests from your Vercel domain:

```typescript
// backend/src/server.ts
app.use(cors({
  origin: [
    'http://localhost:5173', // Development
    'https://your-app.vercel.app', // Production
    process.env.CLIENT_ORIGIN
  ].filter(Boolean)
}));
```

## Environment Variables Reference

### Frontend (Vercel)
| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `https://backend.railway.app` | Backend API base URL |
| `VITE_WS_URL` | `wss://backend.railway.app` | WebSocket connection URL |

### Backend (Your chosen platform)
| Variable | Example | Description |
|----------|---------|-------------|
| `CODESTRAL_API_KEY` | `sk-...` | Codestral API key |
| `HF_TOKEN` | `hf_...` | Hugging Face token |
| `CLIENT_ORIGIN` | `https://your-app.vercel.app` | Frontend domain |
| `PORT` | `4000` | Server port |

## Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] CORS configured for Vercel domain
- [ ] Environment variables set in Vercel dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `frontend/dist`
- [ ] Test WebSocket connection
- [ ] Test API requests
- [ ] Verify theme toggle works
- [ ] Test all AI providers

## Troubleshooting

### CORS Errors
```bash
# Check backend logs for CORS issues
# Ensure CLIENT_ORIGIN matches your Vercel domain exactly
```

### WebSocket Connection Issues
```javascript
// Check if WebSocket URL is correct and uses wss:// in production
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
```

### Build Failures
```bash
# Check Vercel build logs
# Ensure all dependencies are listed in package.json
# Verify build command runs successfully locally
```

### Environment Variables Not Loading
```bash
# Ensure variables start with VITE_ for frontend access
# Restart Vercel deployment after adding variables
```

## Custom Domain (Optional)

1. Go to Vercel dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update `CLIENT_ORIGIN` in backend environment variables
4. Update VITE_API_URL/VITE_WS_URL if domain changes

## Performance Optimization

- Enable Vercel's Edge Network
- Use Vercel's Analytics for monitoring
- Optimize bundle size with Vite's build optimizations
- Consider implementing code splitting for large dependencies

## Security Considerations

- Never expose API keys in frontend code
- Use Vercel's environment variables for sensitive data
- Enable HTTPS for all connections (wss:// for WebSocket)
- Implement rate limiting on backend
- Use CORS properly to restrict origins