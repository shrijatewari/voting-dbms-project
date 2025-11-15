# 🚀 GitHub & Vercel Deployment - Step by Step

Follow these exact steps to deploy your project:

## Step 1: Create GitHub Repository

1. Go to https://github.com
2. Click the **"+"** icon → **"New repository"**
3. Fill in:
   - **Repository name**: `voting-dbms-project`
   - **Description**: `Government-grade Election Management System with AI-powered duplicate detection`
   - **Visibility**: Public (or Private)
   - **DO NOT** check "Initialize with README"
4. Click **"Create repository"**

## Step 2: Push Code to GitHub

Run these commands in your terminal:

```bash
cd /Users/shrijatewari/Desktop/voting-dbms-project

# Add remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/voting-dbms-project.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note**: You'll be prompted for your GitHub username and password (or use a Personal Access Token).

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your repository:
   - Select `voting-dbms-project`
   - Click **"Import"**
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables**:
   - Click **"Environment Variables"**
   - Add: `VITE_API_URL` = `http://localhost:3000` (we'll update this later)
7. Click **"Deploy"**

## Step 4: Deploy Backend to Vercel

### Option A: Separate Backend Project (Recommended)

1. In Vercel, create **another new project**
2. Import the same repository
3. Configure:
   - **Root Directory**: `./backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm install` (or leave empty)
   - **Output Directory**: (leave empty)
4. **Environment Variables**:
   ```
   DB_HOST=your_database_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=voting_dbms
   JWT_SECRET=your_secure_jwt_secret_min_32_chars
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```
5. Deploy

### Option B: Use Vercel Serverless Functions

Create `api/` folder in root and move backend routes there.

## Step 5: Update Frontend Environment Variable

After backend is deployed:

1. Go to Frontend project in Vercel
2. Settings → Environment Variables
3. Update `VITE_API_URL` to your backend URL:
   ```
   VITE_API_URL=https://your-backend-project.vercel.app
   ```
4. Redeploy

## Step 6: Database Setup

### Option A: Vercel Postgres (Easiest)

1. In Vercel Dashboard → Your Backend Project
2. Go to **Storage** tab
3. Click **"Create Database"** → **Postgres**
4. Copy connection string
5. Update backend environment variables

### Option B: External MySQL

Use services like:
- **PlanetScale** (free tier available)
- **Railway** (free tier)
- **Supabase** (free tier)

## Step 7: Run Migrations

After database is set up:

1. SSH into Vercel or use Vercel CLI:
```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
```

2. Run migrations:
```bash
cd backend
node src/db/migrate.js
# ... run all migrations
```

## Step 8: Test Deployment

1. Visit your frontend URL: `https://your-project.vercel.app`
2. Test registration
3. Test login
4. Check admin dashboard

## 🎉 Done!

Your project is now live on:
- **GitHub**: `https://github.com/YOUR_USERNAME/voting-dbms-project`
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.vercel.app`

## 📝 Quick Commands Reference

```bash
# Push updates to GitHub
git add .
git commit -m "Your commit message"
git push

# Vercel will auto-deploy on push (if connected)
```

## 🔧 Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify all dependencies in package.json
- Check for TypeScript errors

### API Not Working
- Verify CORS_ORIGIN in backend env
- Check VITE_API_URL in frontend env
- Test backend URL directly

### Database Connection
- Verify credentials
- Check if database allows external connections
- Test connection string locally first

---

**Need help?** Check the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

