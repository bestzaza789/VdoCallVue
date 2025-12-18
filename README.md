# VdoCall - 1:1 Video Call Application

ระบบ Video Call แบบ 1:1 พร้อม Screen Sharing สร้างด้วย Vue 3 + WebRTC

## ✨ Features

- 📹 1:1 Video Call
- 🖥️ Screen Sharing
- 🎤 Mute/Unmute Audio
- 📷 Camera Toggle
- ⏳ Queue System (max 2 users per room)

## 🚀 Quick Start (Local Development)

### 1. Start Server
```bash
cd server
npm install
npm start
```

### 2. Start Client
```bash
cd client
npm install
npm run dev
```

### 3. Open Browser
- Go to http://localhost:5173
- Create or join a room
- Share the link with another person

---

## 🌐 Deployment

### Server → Render.com

1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Create new **Web Service**
4. Connect your GitHub repo
5. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add **Environment Variable**:
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app`

### Client → Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repo
3. Set:
   - **Root Directory**: `client`
   - **Framework**: Vite
4. Add **Environment Variable**:
   - `VITE_SIGNALING_SERVER` = `https://your-server.onrender.com`
5. Deploy!

---

## 📁 Project Structure

```
VdoCall/
├── client/                 # Vue 3 Frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── composables/    # useWebRTC logic
│   │   └── App.vue
│   └── package.json
│
└── server/                 # Signaling Server
    ├── index.js            # Socket.io server
    └── package.json
```

## ⚠️ Notes

- Render free tier will sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds to wake up
- For production, consider paid tiers
