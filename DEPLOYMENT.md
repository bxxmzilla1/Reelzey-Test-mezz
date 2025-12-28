# 🚀 Deployment Guide

This guide will walk you through deploying your Reelzey app to GitHub and Vercel.

## 📋 Pre-Deployment Checklist

- [ ] Node.js installed (v16+)
- [ ] Git installed
- [ ] GitHub account created
- [ ] Vercel account created
- [ ] Gemini API key obtained from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Part 1: Push to GitHub

### Step 1: Initialize Git Repository (if not already done)

```bash
git init
```

### Step 2: Add Your Files

```bash
git add .
```

### Step 3: Create Initial Commit

```bash
git commit -m "Initial commit: Reelzey PWA ready for deployment"
```

### Step 4: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right
3. Select "New repository"
4. Name your repository (e.g., `reelzey`)
5. Choose visibility (Public or Private)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### Step 5: Link and Push to GitHub

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Part 2: Deploy to Vercel

### Method A: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Sign Up/Login to Vercel
1. Go to [Vercel](https://vercel.com)
2. Sign up or login (you can use your GitHub account)

#### Step 2: Import Project
1. Click "Add New" → "Project"
2. Connect your GitHub account if not already connected
3. Find and select your `reelzey` repository
4. Click "Import"

#### Step 3: Configure Project
1. Vercel will auto-detect Vite configuration
2. Verify the settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### Step 4: Add Environment Variables
1. Click "Environment Variables" section
2. Add your variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your actual Gemini API key
   - **Environment:** Select all (Production, Preview, Development)
3. Click "Add"

#### Step 5: Deploy
1. Click "Deploy"
2. Wait for deployment to complete (usually 1-2 minutes)
3. You'll get a URL like: `https://your-project.vercel.app`

### Method B: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

```bash
# Navigate to your project directory
cd path/to/reelzey

# Deploy to preview
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? Accept default or customize
# - In which directory is your code located? ./
```

#### Step 4: Add Environment Variable

```bash
vercel env add GEMINI_API_KEY
```

When prompted:
1. Paste your Gemini API key
2. Select environments: Production, Preview, Development (use space to select, enter to confirm)

#### Step 5: Deploy to Production

```bash
vercel --prod
```

## Part 3: Verify Deployment

### Test Your Deployment

1. **Open your Vercel URL** in a browser
2. **Check PWA functionality:**
   - Look for install prompt in browser
   - Try installing the app
   - Check if it works offline (after first load)
3. **Test core features:**
   - Verify UI loads correctly
   - Test AI features with Gemini API
   - Check all components render properly

### Check PWA Status

1. Open browser DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Check:
   - ✅ Manifest loads correctly
   - ✅ Service Worker is registered
   - ✅ Icons are available
   - ✅ App is installable

## Part 4: Post-Deployment

### Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically build and deploy your changes!

### Environment Variable Updates

To update environment variables:

**Via Dashboard:**
1. Go to Project Settings → Environment Variables
2. Edit or add variables
3. Redeploy for changes to take effect

**Via CLI:**
```bash
vercel env rm GEMINI_API_KEY  # Remove old
vercel env add GEMINI_API_KEY  # Add new
```

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all imports use correct paths
- Check `package.json` has all dependencies

**Error: "Environment variable not found"**
- Verify `GEMINI_API_KEY` is set in Vercel
- Redeploy after adding environment variables

### Service Worker Issues

**Service Worker not updating:**
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister()
  }
})
```
Then hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

### PWA Not Installing

- Check manifest.json loads: `https://your-url.vercel.app/manifest.json`
- Ensure HTTPS is enabled (Vercel does this automatically)
- Verify icons are accessible
- Check browser console for PWA errors

## 📊 Monitoring

### View Deployment Logs

**Dashboard:**
1. Go to Vercel Dashboard
2. Click your project
3. Click "Deployments"
4. Select a deployment
5. View "Building" and "Runtime" logs

**CLI:**
```bash
vercel logs
```

### Analytics

Enable Vercel Analytics:
1. Go to Project Settings
2. Click "Analytics"
3. Enable Web Analytics
4. View real-time traffic and performance

## 🔄 Updating Your App

1. Make changes locally
2. Test with `npm run dev`
3. Commit changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
4. Push to GitHub:
   ```bash
   git push origin main
   ```
5. Vercel automatically deploys!

## 🎉 Success!

Your Reelzey PWA is now live! Share your Vercel URL with others and enjoy your deployed application.

### Quick Links

- 🌐 Your Production URL: Check Vercel Dashboard
- 📊 Analytics: Vercel Dashboard → Analytics
- 🔧 Settings: Vercel Dashboard → Settings
- 📝 Logs: Vercel Dashboard → Deployments → [Latest] → Logs

---

Need help? Check the [main README](./README.md) or open an issue on GitHub.

