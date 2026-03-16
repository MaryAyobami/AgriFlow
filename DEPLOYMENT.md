# AgriFlow — Deployment Guide

## Getting a Gemini API Key (for AI Insights)

1. Visit **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key — it starts with `AIza...`
5. Paste it as `GEMINI_API_KEY` in your `.env` file

> The app works fully without a Gemini key — you'll just get curated static insights on the Dashboard instead of live AI analysis.

---

## Option 1 — Railway (Recommended, Free Tier Available)

Railway is the easiest option. It auto-detects Node.js projects.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy from the project folder
cd remix_-agriflow_-commercial-farm-management-system
railway init       # creates a new project
railway up         # deploys the app
```

**Set environment variables on Railway dashboard:**
- `JWT_SECRET` → any long random string
- `GEMINI_API_KEY` → your Gemini key (optional)

The `railway.json` file is already configured for you.

---

## Option 2 — Render (Free Tier)

1. Push the project to GitHub
2. Go to **[render.com](https://render.com)** → New → Web Service
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Apply**
5. Add environment variables:
   - `JWT_SECRET` → any long random string
   - `GEMINI_API_KEY` → optional

> Render gives you a free persistent disk (1GB) for the SQLite database.

---

## Option 3 — Docker (Self-Hosted / VPS)

```bash
# Build the image
docker build -t agriflow .

# Run with persistent data
docker run -d \
  -p 3000:3000 \
  -v agriflow_data:/app/data \
  -e JWT_SECRET=your-long-secret \
  -e GEMINI_API_KEY=your-key \
  --name agriflow \
  agriflow
```

App will be at **http://your-server:3000**

---

## Option 4 — Run on Any Linux Server (VPS)

```bash
# Clone / upload project files
git clone <your-repo> agriflow && cd agriflow

# Copy and fill in environment variables
cp .env.example .env
nano .env   # set JWT_SECRET and optionally GEMINI_API_KEY

# Install dependencies
npm install

# Build frontend
npm run build

# Start production server
npm run start

# (Optional) keep it running with PM2
npm install -g pm2
pm2 start "npm run start" --name agriflow
pm2 save
pm2 startup
```

---

## Default Admin Credentials

After first deploy, log in with:
- **Username:** `admin`
- **Password:** `admin`

> ⚠️ Change the admin password immediately after first login via User Management.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ Yes in production | Secret for signing JWT tokens. Use a long random string. |
| `GEMINI_API_KEY` | ❌ Optional | Enables live AI insights. Get free at aistudio.google.com |
| `PORT` | ❌ Optional | Server port. Defaults to 3000. |
| `DB_PATH` | ❌ Optional | Path to SQLite file. Defaults to `./farm.db`. |
