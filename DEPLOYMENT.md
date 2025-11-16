# Deployment Guide - GitHub & Vercel

## ✅ GitHub Status
Your code is already pushed to: `https://github.com/shrijatewari/voting-dbms-project.git`

## 🚀 Vercel Deployment Steps

### Frontend Deployment (React/Vite)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose `shrijatewari/voting-dbms-project`

3. **Configure Frontend Project**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables** (Add these in Vercel Dashboard):
   ```
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your frontend will be live at: `https://your-project-name.vercel.app`

### Backend Deployment (Node.js/Express)

1. **Create Separate Backend Project in Vercel**
   - Click "Add New Project" again
   - Import the same repository: `shrijatewari/voting-dbms-project`

2. **Configure Backend Project**
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty or `npm install`)
   - **Output Directory:** (leave empty)
   - **Install Command:** `npm install`

3. **Environment Variables** (Add these in Vercel Dashboard):
   ```
   NODE_ENV=production
   DB_HOST=your-database-host
   DB_PORT=3306
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=voting_system
   JWT_SECRET=9e660f6bebbf8e8d72e6f4d7d11182635bfdf5230abd80a4d663d82b70d38f6826f40ad12061ce0393e3f8efb85dc4b3d13b7f4a504942ffedbcf26078320521
   JWT_EXPIRES_IN=30d
   FRONTEND_ORIGIN=https://your-frontend-url.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Your backend will be live at: `https://your-backend-project-name.vercel.app`

### Update Frontend API URL

After backend is deployed, update frontend environment variable:
1. Go to Frontend Project Settings → Environment Variables
2. Update `VITE_API_URL` to your backend URL: `https://your-backend-url.vercel.app/api`

### Quick Deploy Commands (Alternative)

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy Frontend (from root directory)
cd /Users/shrijatewari/Desktop/voting-dbms-project
vercel

# Deploy Backend (from backend directory)
cd /Users/shrijatewari/Desktop/voting-dbms-project/backend
vercel
```

## 📝 Important Notes

1. **Database**: Make sure your MySQL database is accessible from Vercel (use a hosted database like PlanetScale, AWS RDS, or Railway)

2. **CORS**: Backend already configured to accept requests from frontend origin

3. **Environment Variables**: Keep sensitive data in Vercel Environment Variables, not in code

4. **Build Time**: Frontend builds in ~2-3 minutes, Backend in ~1-2 minutes

5. **Auto-Deploy**: Vercel automatically deploys on every push to `main` branch

## 🔗 Your Repository
https://github.com/shrijatewari/voting-dbms-project
