# 🚀 Deployment Guide - GitHub & Vercel

This guide will help you deploy your Election Management System to GitHub and Vercel.

---

## 📋 Prerequisites

1. **GitHub Account** - Sign up at [github.com](https://github.com)
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Git Installed** - Check with `git --version`

---

## 🔷 Step 1: Prepare GitHub Repository

### 1.1 Initialize Git Repository

```bash
# Navigate to project directory
cd /Users/shrijatewari/Desktop/voting-dbms-project

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete Election Management System with AI backend"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and click **"New Repository"**
2. Repository name: `voting-dbms-project` (or your preferred name)
3. Description: `Government-grade Election Management System with AI-powered duplicate detection, biometric verification, and comprehensive voter roll management`
4. Set to **Public** (or Private if you prefer)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### 1.3 Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/voting-dbms-project.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## 🔷 Step 2: Deploy Frontend to Vercel

### 2.1 Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### 2.2 Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository:
   - Select `voting-dbms-project` from the list
   - Click **"Import"**
4. Configure Project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables**:
   Add these in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   ```

6. Click **"Deploy"**

### 2.3 Deploy via CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? voting-dbms-project
# - Directory? ./
# - Override settings? No
```

---

## 🔷 Step 3: Deploy Backend to Vercel

### 3.1 Create Backend Vercel Configuration

Create `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

### 3.2 Deploy Backend

1. In Vercel Dashboard, create a **new project** for backend
2. Import the same repository
3. Configure:
   - **Root Directory**: `./backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm install`
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

4. **Environment Variables** (add in Vercel):
   ```
   DB_HOST=your_mysql_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=voting_dbms
   JWT_SECRET=your_jwt_secret_min_32_chars
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```

5. Deploy

---

## 🔷 Step 4: Database Setup

### Option A: Use Vercel Postgres (Recommended for Demo)

1. In Vercel Dashboard → Your Backend Project → Storage
2. Create **Postgres Database**
3. Update environment variables with new connection string

### Option B: Use External MySQL (Production)

Use services like:
- **PlanetScale** (MySQL-compatible)
- **Railway** (MySQL)
- **AWS RDS** (MySQL)
- **DigitalOcean** (Managed MySQL)

Update `DB_HOST` in Vercel environment variables.

---

## 🔷 Step 5: AI Services Deployment

### Option A: Deploy Each Service to Vercel

1. Create separate Vercel projects for each AI service
2. Root directory: `ai-services/duplicate-engine`, etc.
3. Build command: `pip install -r requirements.txt`
4. Runtime: Python 3.11

### Option B: Use Docker on Railway/Render

1. Use `ai-services/docker-compose.yml`
2. Deploy to Railway or Render
3. Update AI service URLs in backend environment variables

### Option C: Keep Local (Development Only)

For development, run AI services locally and update URLs.

---

## 🔷 Step 6: Update Environment Variables

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.vercel.app
```

### Backend (Vercel)
```
DB_HOST=your_database_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=voting_dbms
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=https://your-frontend.vercel.app
AI_DUPLICATE_SERVICE_URL=https://your-ai-service.vercel.app
# ... other AI service URLs
```

---

## 🔷 Step 7: Run Database Migrations

After deployment, run migrations:

```bash
# SSH into Vercel or use Vercel CLI
vercel env pull .env.local

# Run migrations
cd backend
node src/db/migrate.js
node src/db/migrate_extended.js
node src/db/migrate_profile_complete.js
node src/db/migrate_biometric_complete.js
node src/db/migrate_enhanced_features.js
node src/db/migrate_ai_tables.js
```

---

## ✅ Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend API responding
- [ ] Database connected
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] CORS configured correctly
- [ ] AI services accessible (if deployed)
- [ ] Test registration flow
- [ ] Test admin dashboard
- [ ] Test API endpoints

---

## 🔧 Troubleshooting

### Frontend Build Fails
- Check `package.json` scripts
- Verify all dependencies installed
- Check for TypeScript errors

### Backend Deployment Fails
- Verify Node.js version (Vercel uses Node 18+)
- Check environment variables
- Verify database connection

### CORS Errors
- Update `CORS_ORIGIN` in backend env
- Check frontend `VITE_API_URL`

### Database Connection Issues
- Verify credentials
- Check firewall rules
- Test connection locally first

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🎉 Success!

Your Election Management System should now be live on:
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-backend.vercel.app`

Happy deploying! 🚀

