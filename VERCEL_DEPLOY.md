# 🚀 Vercel Deployment Guide

## Quick Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

#### Frontend Deployment:

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your `voting-dbms-project` repository
5. Configure Frontend:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. **Environment Variables** (click "Environment Variables"):
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```
   (Update this after backend is deployed)
7. Click **"Deploy"**

#### Backend Deployment:

1. In Vercel, create **another new project**
2. Import the same `voting-dbms-project` repository
3. Configure Backend:
   - **Root Directory**: `./backend`
   - **Framework Preset**: Other
   - **Build Command**: (leave empty or `npm install`)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`
4. **Environment Variables** (add these):
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
5. Click **"Deploy"**

### Option 2: Deploy via Vercel CLI

#### Install Vercel CLI:
```bash
npm install -g vercel
```

#### Deploy Frontend:
```bash
cd /Users/shrijatewari/Desktop/voting-dbms-project

# Login to Vercel
vercel login

# Deploy frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? voting-dbms-project-frontend
# - Directory? ./
# - Override settings? No
```

#### Deploy Backend:
```bash
cd /Users/shrijatewari/Desktop/voting-dbms-project/backend

# Deploy backend
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? voting-dbms-project-backend
# - Directory? ./
```

#### Set Environment Variables via CLI:
```bash
# Frontend
cd /Users/shrijatewari/Desktop/voting-dbms-project
vercel env add VITE_API_URL production
# Enter: https://your-backend-url.vercel.app

# Backend
cd backend
vercel env add DB_HOST production
vercel env add DB_USER production
vercel env add DB_PASSWORD production
vercel env add DB_NAME production
vercel env add JWT_SECRET production
vercel env add CORS_ORIGIN production
# Enter values when prompted
```

## Database Setup

### Option A: Vercel Postgres (Easiest)

1. In Vercel Dashboard → Your Backend Project
2. Go to **Storage** tab
3. Click **"Create Database"** → **Postgres**
4. Copy connection string
5. Update backend environment variables with Postgres connection details

### Option B: External MySQL

Use services like:
- **PlanetScale** (free tier, MySQL-compatible)
- **Railway** (free tier, MySQL)
- **Supabase** (free tier, Postgres)

## After Deployment

1. **Update Frontend API URL**: 
   - Go to Frontend project → Settings → Environment Variables
   - Update `VITE_API_URL` to your backend URL
   - Redeploy

2. **Run Database Migrations**:
   - You'll need to run migrations after database is set up
   - See DEPLOYMENT.md for migration commands

3. **Test Your Deployment**:
   - Visit frontend URL
   - Test registration
   - Test login
   - Check admin dashboard

## Your URLs

After deployment, you'll have:
- **Frontend**: `https://voting-dbms-project-frontend.vercel.app`
- **Backend**: `https://voting-dbms-project-backend.vercel.app`

## Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **API not working**: Verify CORS_ORIGIN and VITE_API_URL
- **Database connection**: Check credentials and firewall rules

