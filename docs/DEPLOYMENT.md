# 🚀 Hosting & Deployment Guide

This document covers all ways to deploy and distribute PwmngerTS, from zero-cost cloud hosting to production Docker environments and browser extension publishing.

---

## ☁️ Zero-Cost Cloud Hosting (Recommended)

PwmngerTS can be hosted entirely for free using industry-leading platforms.

### 1. 💾 Database (Supabase)
- **Provider:** [Supabase](https://supabase.com) (PostgreSQL)
- **Setup:** Create a new project and copy the **URI Connection String** (Transaction mode).
- **Tip:** Ensure your password is URL-encoded if it contains special characters.

### 2. ⚙️ Backend API (Render)
- **Provider:** [Render](https://render.com)
- **Build Command:** `pnpm install && pnpm --filter backend build`
- **Start Command:** `pnpm --filter backend exec prisma migrate deploy && pnpm --filter backend start`
- **Environment:**
    - `DATABASE_URL`: Your Supabase URI.
    - `JWT_SECRET`: A high-entropy random string.

### 3. 🎨 Frontend (Vercel)
- **Provider:** [Vercel](https://vercel.com)
- **Root Directory:** `apps/web`
- **Framework:** Vite
- **Variables:** `VITE_API_URL` -> Your Render backend URL.

---

## 🐳 Docker Deployment (Self-Hosting)

For private servers or home labs.

### Prerequisites
- Docker Engine & Docker Compose.
- A reverse proxy (Nginx/Caddy) with TLS (HTTPS is required for Web Crypto).

### Steps
1.  **Clone Source**: `git clone https://github.com/okikijesutech/PwmngerTS.git`
2.  **Environment**: Create `apps/backend/.env` with your DB and JWT secrets.
3.  **Launch**: `docker-compose up -d --build`

---

## 🧪 Testing Sandbox (Isolated)

To run a safe, local-only environment for security testing or development:
1.  Follow the Docker steps above.
2.  **Isolation**: Disconnect from the internet. The app works fully offline for local vault operations.
3.  **Reset**: `docker-compose down -v` to wipe all data.

---

## 🧩 Extension & Mobile Distribution

### 🧩 Browser Extension
1.  **Build**: `cd apps/extension && pnpm build`
2.  **Manual Install**: 
    - Go to `chrome://extensions`.
    - Enable **Developer Mode**.
    - Click **Load Unpacked** and select `apps/extension/dist`.
3.  **Web Store**: Package the `dist` folder as a ZIP and upload via the Chrome Developer Dashboard.

### 📱 Mobile (Experimental)
- The mobile app is currently in the "Core Logic" phase. Build instructions will be updated upon UI completion.

---

## 📁 Environment Variables Checklist

| Variable | Scope | Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | Backend | Yes |
| `JWT_SECRET` | Backend | Yes |
| `SESSION_SECRET`| Backend | Yes (for persistent state) |
| `VITE_API_URL` | Frontend | Yes |
| `NODE_ENV` | All | `production` |
