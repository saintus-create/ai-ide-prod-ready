# 🚀 Quick Vercel Deployment Reference

## 1-Click Setup for Vercel

### Prerequisites
- Backend deployed (Railway/Render/Heroku)
- Vercel account
- Your domain URLs ready

### Quick Commands

#### Install & Setup
```bash
# Clone and setup
git clone <your-repo>
cd ai-ide
npm install

# Setup environment
cp .env.vercel.example .env.local
# Edit .env.local with your backend URLs
```

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Verify Deployment
```bash
# Run verification script
bash scripts/verify-deployment.sh
```

### Environment Variables for Vercel

Add these in Vercel Dashboard → Project → Settings → Environment Variables:

```
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
```

### Backend Deployment Options

| Service | Command | Cost |
|---------|---------|------|
| **Railway** | `railway up` | Free tier |
| **Render** | Connect GitHub | Free tier |
| **Heroku** | `heroku create && git push heroku main` | Free tier |
| **Vercel Functions** | Convert to serverless | Free tier |

### Quick Backend Setup (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| CORS Error | Update backend `CLIENT_ORIGIN` |
| WebSocket Failed | Use `wss://` for production |
| Build Failed | Check environment variables |
| API 404 | Verify backend URL is correct |

### Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Theme toggle works
- [ ] File explorer functions
- [ ] AI completion works
- [ ] Chat assistant responds
- [ ] Toast notifications appear
- [ ] Keyboard shortcuts work
- [ ] Git integration functions

### Support

For issues, check:
1. `VERCEL_DEPLOYMENT.md` - Detailed guide
2. Backend logs for API errors
3. Browser console for frontend errors
4. Vercel function logs for deployment issues

---

**Ready to deploy?** Run the verification script and start coding in your AI-IDE! 🎉