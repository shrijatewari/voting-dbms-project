# 🚀 Deploy to Vercel - Step by Step

Your GitHub repo is ready: `https://github.com/shrijatewari/voting-dbms-project`

## 📋 Deploy Frontend First

### Step 1: Go to Vercel
1. Open https://vercel.com
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"** (use your GitHub account)

### Step 2: Import Project
1. Click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Find and select **`shrijatewari/voting-dbms-project`**
4. Click **"Import"**

### Step 3: Configure Frontend
1. **Project Name**: `voting-dbms-frontend` (or leave default)
2. **Framework Preset**: Select **"Vite"** (should auto-detect)
3. **Root Directory**: `./` (leave as is)
4. **Build Command**: `npm run build` (should be auto-filled)
5. **Output Directory**: `dist` (should be auto-filled)
6. **Install Command**: `npm install` (should be auto-filled)

### Step 4: Add Environment Variable
1. Click **"Environment Variables"** section
2. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `http://localhost:3000` (we'll update this after backend deploy)
   - **Environment**: Select all (Production, Preview, Development)
3. Click **"Add"**

### Step 5: Deploy
1. Click **"Deploy"** button
2. Wait for build to complete (2-3 minutes)
3. Copy your frontend URL (e.g., `https://voting-dbms-frontend.vercel.app`)

---

## 📋 Deploy Backend

### Step 1: Create New Project
1. In Vercel dashboard, click **"Add New Project"** again
2. Import the same repository: `shrijatewari/voting-dbms-project`

### Step 2: Configure Backend
1. **Project Name**: `voting-dbms-backend`
2. **Framework Preset**: Select **"Other"**
3. **Root Directory**: Click **"Edit"** and set to `backend`
4. **Build Command**: Leave empty (or `npm install`)
5. **Output Directory**: Leave empty
6. **Install Command**: `npm install`

### Step 3: Add Environment Variables
Click **"Environment Variables"** and add these:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=voting_dbms
JWT_SECRET=your_secure_jwt_secret_min_32_characters_long
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://voting-dbms-frontend.vercel.app
```

**Important**: 
- Replace `your_password` with your actual database password
- Replace `your_secure_jwt_secret_min_32_characters_long` with a secure random string (32+ chars)
- Replace the CORS_ORIGIN with your actual frontend URL from Step 5 above

### Step 4: Deploy Backend
1. Click **"Deploy"**
2. Wait for deployment
3. Copy your backend URL (e.g., `https://voting-dbms-backend.vercel.app`)

---

## 🔄 Update Frontend API URL

### Step 1: Go to Frontend Project
1. In Vercel dashboard, go to your **frontend project**
2. Click **"Settings"** tab
3. Click **"Environment Variables"**

### Step 2: Update VITE_API_URL
1. Find `VITE_API_URL`
2. Click **"Edit"**
3. Change value to your backend URL: `https://voting-dbms-backend.vercel.app`
4. Click **"Save"**

### Step 3: Redeploy
1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

---

## 🗄️ Database Setup (Choose One)

### Option A: Vercel Postgres (Easiest - Recommended)

1. In your **backend project** in Vercel
2. Go to **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Click **"Create"**
6. Copy the connection details
7. Update backend environment variables:
   - `DB_HOST` = (from connection string)
   - `DB_USER` = (from connection string)
   - `DB_PASSWORD` = (from connection string)
   - `DB_NAME` = (from connection string)

### Option B: External MySQL

Use one of these free services:
- **PlanetScale**: https://planetscale.com (MySQL-compatible, free tier)
- **Railway**: https://railway.app (MySQL, free tier)
- **Supabase**: https://supabase.com (Postgres, free tier)

After creating database, update environment variables in Vercel.

---

## ✅ Final Steps

1. **Run Database Migrations**:
   - You'll need to connect to your database and run the migration scripts
   - See `backend/src/db/` folder for migration files

2. **Test Your Deployment**:
   - Visit your frontend URL
   - Try registering a new user
   - Test login
   - Check admin dashboard

---

## 🎉 Done!

Your project is now live:
- **Frontend**: `https://voting-dbms-frontend.vercel.app`
- **Backend**: `https://voting-dbms-backend.vercel.app`
- **GitHub**: `https://github.com/shrijatewari/voting-dbms-project`

---

## 🔧 Troubleshooting

**Build Fails?**
- Check build logs in Vercel dashboard
- Verify all dependencies in package.json
- Check for TypeScript errors

**API Not Working?**
- Verify `VITE_API_URL` in frontend matches backend URL
- Check `CORS_ORIGIN` in backend matches frontend URL
- Check backend deployment logs

**Database Connection Issues?**
- Verify database credentials
- Check if database allows external connections
- Test connection string locally first

---

**Need help?** Check the full guide in `VERCEL_DEPLOY.md`

