# 🚀 Deploy to Vercel - Step by Step Guide

## ⚠️ Important: Database Setup Required!

This project now uses **PostgreSQL** instead of SQLite. Before deploying:
1. Read [DATABASE_SETUP.md](DATABASE_SETUP.md)
2. Set up PostgreSQL database (recommended: Vercel PostgreSQL)
3. Add `DATABASE_URL` environment variable

## Prerequisites
- GitHub account with your repository pushed
- Vercel account (free tier available)
- PostgreSQL database (Vercel, Supabase, Railway, etc.)

## Step 1: Push Code to GitHub

```powershell
cd d:\Ecommerce_website

# Initialize git
git init

# Add all files (note: .env won't be pushed due to .gitignore)
git add .

# Commit
git commit -m "Initial commit: Bookstore ecommerce website with PostgreSQL"

# Add remote (replace with your repo)
git remote add origin https://github.com/YOUR_USERNAME/bookstore.git

# Push
git branch -M main
git push -u origin main
```

## Step 2: Set Up Database on Vercel

**Option A: Vercel PostgreSQL (Easiest)**
1. Go to [vercel.com](https://vercel.com)
2. Select your project → **Storage**
3. Click **"Create Database"** → Select **PostgreSQL**
4. Follow Vercel's setup
5. Vercel **automatically adds `DATABASE_URL` environment variable** ✅

**Option B: External Database (Supabase, Railway, etc.)**
- Create database on your chosen provider
- Copy connection string
- You'll add this manually in Step 4

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select **"Import Git Repository"**
4. Paste your GitHub repo URL or select it from the list
5. Click **"Import"**

## Step 4: Configure Environment Variables

In Vercel Dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | Your PostgreSQL connection string | Required! |
| `JWT_SECRET` | `your-random-secret-key` | Change to a random string! |

3. Click **"Save"**

## Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for deployment to complete
3. Your app is live! 🎉

## Common Issues & Fixes

### Issue: "Cannot find module 'pg'"
- Solution: The `npm install` might not have run. Check build logs.
- Make sure `package.json` has `"pg"` in dependencies (not `sqlite3`)

### Issue: "Database connection failed"
- Make sure `DATABASE_URL` environment variable is set in Vercel
- Verify connection string is correct
- Check PostgreSQL server is running/accessible

### Issue: "Tables don't exist"
- The tables are created automatically on first run
- Check server logs to see initialization messages
- If needed, you can manually create tables using your database admin panel

## Monitor Your Deployment

1. Go to Vercel Project Dashboard
2. Check **Deployments** tab to see build status
3. Check **Functions** logs to debug server errors
4. Use **Storage** tab to view your PostgreSQL database

## Test Your Live App

1. Get your Vercel URL from the dashboard
2. Visit: `https://your-project.vercel.app`
3. Test registration, login, products, and orders
4. Default admin: admin@bookstore.com / admin123 (Change in production!)

## Next Steps

- ✅ Database is set up
- ✅ Code is deployed
- ✅ App is live
- 🔄 Next: Monitor logs and test thoroughly
- 🔐 Change default admin password
- 📊 Add custom domain (optional)

## Need Help?

- Check Vercel Build Logs: `Deployments` → Select Deploy → `Logs`
- Check PostgreSQL connection: `Storage` → Select Database → Details
- Review backend logs: Output tab shows `console.log` messages


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
