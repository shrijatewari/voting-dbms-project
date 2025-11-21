# 🚀 Deploy to Vercel - Complete Guide

## ✅ Code is on GitHub
**Repository**: https://github.com/shrijatewari/voting-dbms-project

---

## 📱 PART 1: Deploy Frontend

### Step 1: Go to Vercel
1. Visit: **https://vercel.com**
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### Step 2: Import Frontend Project
1. Click **"Add New Project"** (or **"New Project"**)
2. Click **"Import Git Repository"**
3. Find: **`shrijatewari/voting-dbms-project`**
4. Click **"Import"**

### Step 3: Configure Frontend
1. **Project Name**: `voting-dbms-frontend` (or leave default)
2. **Framework Preset**: **Vite** (should auto-detect)
3. **Root Directory**: `./` (leave as is)
4. **Build Command**: `npm run build` ✅
5. **Output Directory**: `dist` ✅
6. **Install Command**: `npm install` ✅

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app` | Production, Preview, Development |

**Note**: Update this after backend is deployed!

### Step 5: Deploy Frontend
1. Click **"Deploy"** button
2. Wait 2-3 minutes for build
3. **Copy your frontend URL** (e.g., `https://voting-dbms-frontend.vercel.app`)

---

## 🔧 PART 2: Deploy Backend

### Step 1: Create Backend Project
1. In Vercel dashboard, click **"Add New Project"** again
2. Import same repo: **`shrijatewari/voting-dbms-project`**

### Step 2: Configure Backend
1. **Project Name**: `voting-dbms-backend`
2. **Framework Preset**: **Other**
3. **Root Directory**: Click **"Edit"** → Set to **`backend`** ⚠️ IMPORTANT!
4. **Build Command**: Leave **empty**
5. **Output Directory**: Leave **empty**
6. **Install Command**: `npm install`

### Step 3: Add Backend Environment Variables
Click **"Environment Variables"** and add ALL of these:

```
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=voting_system
DB_PORT=3306
JWT_SECRET=generate_a_random_32_character_string_here_minimum
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

**Important Notes**:
- Replace `your_database_host`, `your_database_user`, etc. with actual values
- For `JWT_SECRET`: Generate a random string (32+ characters)
- For `CORS_ORIGIN`: Use your frontend URL from Part 1, Step 5

### Step 4: Deploy Backend
1. Click **"Deploy"**
2. Wait for deployment
3. **Copy your backend URL** (e.g., `https://voting-dbms-backend.vercel.app`)

---

## 🔄 PART 3: Update Frontend API URL

1. Go to **Frontend Project** in Vercel dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Find `VITE_API_URL`
5. Click **"Edit"**
6. Change value to: `https://your-backend-url.vercel.app`
7. Click **"Save"**
8. Go to **"Deployments"** tab
9. Click **"..."** on latest deployment
10. Click **"Redeploy"**

---

## 🗄️ PART 4: Database Setup

### Option A: Vercel Postgres (Recommended - Easiest)

1. In **Backend Project** → Click **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Click **"Create"**
5. Copy connection details
6. Update backend environment variables:
   - `DB_HOST` = (from connection string)
   - `DB_USER` = (from connection string)
   - `DB_PASSWORD` = (from connection string)
   - `DB_NAME` = (from connection string)
   - `DB_PORT` = 5432 (for Postgres)
7. Redeploy backend

### Option B: External MySQL (PlanetScale - Free)

1. Go to: **https://planetscale.com**
2. Sign up with GitHub
3. Create new database
4. Copy connection details
5. Update backend environment variables in Vercel
6. Redeploy backend

### Option C: Railway MySQL (Free)

1. Go to: **https://railway.app**
2. Sign up with GitHub
3. Create new MySQL database
4. Copy connection details
5. Update backend environment variables in Vercel
6. Redeploy backend

---

## 📊 PART 5: Run Database Migrations

After database is set up:

### Option 1: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your backend project
cd backend
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations locally (pointing to production DB)
npm run migrate
npm run migrate:extended
npm run migrate:profile
```

### Option 2: Using Database Tool
- Connect to your database using a tool like **TablePlus**, **DBeaver**, or **MySQL Workbench**
- Run SQL scripts from `backend/src/db/migrate.js` and `backend/src/db/migrate_extended.js`

---

## ✅ PART 6: Verify Deployment

1. **Frontend**: Visit your frontend URL
2. **Backend**: Visit `https://your-backend-url.vercel.app/api/health` (if you have a health endpoint)
3. **Test**:
   - Try registering a new user
   - Test login
   - Check admin dashboard

---

## 🎉 Success!

Your app is now live:
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.vercel.app`
- **GitHub**: `https://github.com/shrijatewari/voting-dbms-project`

---

## 🔧 Troubleshooting

### Build Fails?
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Check for TypeScript/ESLint errors

### API Not Working?
- Verify `VITE_API_URL` matches backend URL
- Check `CORS_ORIGIN` matches frontend URL
- Check backend deployment logs

### Database Connection Issues?
- Verify database credentials
- Check if database allows external connections
- Test connection string format

### Need Help?
- Check Vercel deployment logs
- Check browser console for errors
- Verify environment variables are set correctly

