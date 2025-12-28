<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Reelzey - AI Studio App

A powerful AI-powered creative studio application built with React, TypeScript, and Vite. This Progressive Web App (PWA) provides an intuitive interface for AI-driven content creation.

View your app in AI Studio: https://ai.studio/apps/drive/1N1CpoLkCrXNETGk0ddlg209tEsxxFh0Y

## 🚀 Features

- 🎨 AI-powered creative tools
- 📱 Progressive Web App (PWA) - installable on desktop and mobile
- ⚡ Fast and responsive interface built with Vite
- 🎭 Multiple creative modes and tools
- 🖼️ Image processing and manipulation
- 🎬 Video creation capabilities
- 📝 Script creation and management

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🏃 Run Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd reelzey
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `env.example` to `.env.local`
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🌐 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Vite configuration
   - Add environment variable:
     - Key: `GEMINI_API_KEY`
     - Value: Your Gemini API key
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add environment variable:**
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   Then paste your API key when prompted.

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ **Important:** Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

## 📦 Build for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## 🔍 Preview Production Build

```bash
npm run preview
```

## 📱 PWA Features

This app is a Progressive Web App, which means:

- ✅ Installable on desktop and mobile devices
- ✅ Works offline with cached resources
- ✅ Fast loading with service worker caching
- ✅ App-like experience with standalone display mode

### Installing the PWA

On desktop browsers:
- Look for the install icon in the address bar
- Click to install the app to your desktop

On mobile devices:
- Open the menu and select "Add to Home Screen"
- The app will appear on your home screen like a native app

## 🛠️ Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 6
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Integration:** Google Gemini AI
- **PWA:** Service Worker with cache-first strategy

## 📂 Project Structure

```
reelzey/
├── components/          # React components
├── services/           # API services (Gemini)
├── public/            # Static assets (PWA manifest, icons, service worker)
├── index.html         # HTML entry point
├── index.tsx          # React entry point
├── App.tsx            # Main App component
├── vite.config.ts     # Vite configuration
├── vercel.json        # Vercel deployment config
└── package.json       # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Build fails on Vercel
- Ensure all dependencies are listed in `package.json`
- Check that `GEMINI_API_KEY` is set in Vercel environment variables

### Service Worker not updating
- Clear browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)
- Unregister service worker in browser DevTools > Application > Service Workers

### API key not working
- Verify your Gemini API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Ensure the key is properly set in environment variables
- Redeploy after adding environment variables

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ using Google Gemini AI
