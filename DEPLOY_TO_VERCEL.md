# 🚀 Deploy to Vercel - Step by Step Guide

## Prerequisites
- GitHub account with your repository pushed
- Vercel account (free tier available)

## Step 1: Push Code to GitHub

```powershell
cd d:\Ecommerce_website

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Bookstore ecommerce website"

# Add remote (replace with your repo)
git remote add origin https://github.com/YOUR_USERNAME/bookstore.git

# Push
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select **"Import Git Repository"**
4. Paste your GitHub repo URL or select it from the list
5. Click **"Import"**

## Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `JWT_SECRET` | `your-random-secret-key` | Change to a random string! |
| `API_URL` | Your Vercel URL | Will be auto-filled |
| `DATABASE_URL` | `./bookstore.db` | SQLite location |

3. Click **"Save"**

## Step 4: Deploy

Click **"Deploy"** button. Vercel will:
- Build your Node.js backend
- Serve your frontend
- Create serverless functions for API

## After Deployment

1. Your site will be live at: `https://your-project.vercel.app`
2. Frontend: `https://your-project.vercel.app`
3. API: `https://your-project.vercel.app/api/...`

## Update Frontend API URL

After deployment, update the API URLs in your frontend files if needed:

**In `frontend/js/app.js`:**
```javascript
const API_URL = 'https://your-project.vercel.app';
```

**In all HTML files:**
Replace `http://localhost:5000` with `https://your-project.vercel.app`

## Important Notes

⚠️ **SQLite Limitations on Vercel**

Vercel's serverless functions don't support persistent file storage. For production:

### Option 1: Use MongoDB (Recommended)
```bash
npm install mongoose
```
Update database connection in `backend/server.js`

### Option 2: Use PostgreSQL
```bash
npm install pg
```
Use services like:
- Render (free tier)
- Railway.app
- Neon.tech

### Option 3: Use Supabase (Firebase Alternative)
- Free tier
- Built-in PostgreSQL
- Real-time features

## Database Migration

If switching from SQLite to MongoDB/PostgreSQL:

1. Export data from SQLite
2. Create database on cloud service
3. Update connection string in `.env`
4. Update models in `backend/server.js`
5. Re-deploy

## Monitoring

In Vercel Dashboard:
- View logs: **Deployments** → Click deployment → **Logs**
- Monitor functions: **Functions** tab
- Check analytics: **Analytics** tab

## Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records (instructions provided)

## Troubleshooting

**404 on API calls:**
- Check API routes in `vercel.json`
- Verify environment variables
- Check server logs

**Database not persisting:**
- Normal for Vercel + SQLite
- Migrate to cloud database

**CORS errors:**
- Backend already has CORS enabled
- Update allowed origins in `backend/server.js` if needed

## Rollback Deployment

In Vercel Dashboard:
1. Go to **Deployments**
2. Find previous working deployment
3. Click the "..." menu
4. Select **"Promote to Production"**

---

Need help? Check Vercel docs: https://vercel.com/docs
