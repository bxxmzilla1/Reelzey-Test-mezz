# 📝 Pre-Deployment Checklist

Use this checklist to ensure everything is ready before pushing to GitHub and deploying to Vercel.

## ✅ Code & Configuration

- [x] `.gitignore` updated with proper exclusions
- [x] `vercel.json` configuration file created
- [x] PWA `manifest.json` created in `public/` directory
- [x] Service Worker (`sw.js`) created in `public/` directory
- [x] Service Worker registration added to `index.html`
- [x] PWA meta tags added to `index.html`
- [x] Favicon added
- [x] App icons created (192x192 and 512x512)

## ✅ Environment & Security

- [x] `env.example` file created for reference
- [ ] `.env.local` file created with your actual `GEMINI_API_KEY`
- [ ] Verified `.env.local` is in `.gitignore` (DO NOT commit API keys!)
- [ ] API key tested and working locally

## ✅ Documentation

- [x] `README.md` updated with deployment instructions
- [x] `DEPLOYMENT.md` guide created
- [x] GitHub Actions CI/CD workflow added (optional)

## ✅ Testing Locally

- [ ] Run `npm install` successfully
- [ ] Run `npm run dev` and verify app works
- [ ] Test all main features
- [ ] Run `npm run build` successfully
- [ ] Run `npm run preview` and test production build
- [ ] Test PWA features in browser:
  - [ ] Manifest loads correctly
  - [ ] Service Worker registers
  - [ ] App is installable
  - [ ] Works after going offline (cached resources)

## ✅ Git Repository

- [ ] Git initialized (`git init`)
- [ ] All files added (`git add .`)
- [ ] Initial commit created
- [ ] GitHub repository created
- [ ] Remote origin added
- [ ] Code pushed to GitHub

## ✅ Vercel Deployment

- [ ] Vercel account created/logged in
- [ ] Project imported from GitHub
- [ ] Build settings verified:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Framework: Vite
- [ ] Environment variable `GEMINI_API_KEY` added in Vercel
- [ ] First deployment completed successfully
- [ ] Production URL tested and working

## ✅ Post-Deployment Verification

- [ ] Visit production URL
- [ ] Test main features
- [ ] Check PWA installation
- [ ] Test offline functionality
- [ ] Verify API calls work
- [ ] Check browser console for errors
- [ ] Test on mobile device (if applicable)

## 🎯 Optional Enhancements

- [ ] Custom domain configured
- [ ] Vercel Analytics enabled
- [ ] GitHub Actions secrets added (`GEMINI_API_KEY`)
- [ ] Error monitoring setup (e.g., Sentry)
- [ ] Replace placeholder icons with custom ones
- [ ] Add screenshots to manifest.json
- [ ] Configure og:image for social sharing

## 📞 Need Help?

- Check [README.md](./README.md) for general information
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment steps
- Review [Vercel Documentation](https://vercel.com/docs)
- Review [Vite Documentation](https://vitejs.dev/)

---

**Before you deploy, make sure all items in the "Testing Locally" section are checked!**

