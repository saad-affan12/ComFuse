# ComFuse: Production Deployment Guide

This guide provides end-to-end instructions for deploying the **ComFuse: Multimodal Customer Complaint Intelligence** platform to production:
- **Backend API:** FastAPI deployed to **Railway**
- **Frontend App:** React 19 + Vite deployed to **Vercel**
- **Model Storage:** PyTorch model checkpoint handling via Git LFS or Cloud Storage

---

## 1. System Topology

```
                  ┌────────────────────────────────┐
                  │          END USER              │
                  │   Browser / Mobile Device      │
                  └───────────────┬────────────────┘
                                  │ HTTPS
                                  ▼
                  ┌────────────────────────────────┐
                  │      VERCEL (Frontend)         │
                  │ React 19 + Vite + Tailwind CSS │
                  │ https://comfuse.vercel.app     │
                  └───────────────┬────────────────┘
                                  │ REST API (HTTPS)
                                  │ CORS Protected
                                  ▼
                  ┌────────────────────────────────┐
                  │      RAILWAY (Backend)         │
                  │ FastAPI + Uvicorn (0.0.0.0)    │
                  │ https://comfuse.up.railway.app │
                  └───────────────┬────────────────┘
                                  │ In-Memory Pipeline
                                  ▼
                  ┌────────────────────────────────┐
                  │       FROZEN ML MODEL          │
                  │ models/best_multimodal_model.pt│
                  │ (DistilBERT + ResNet-18)       │
                  └────────────────────────────────┘
```

---

## 2. Model Checkpoint Handling (Phase 9)

The trained PyTorch checkpoint `models/best_multimodal_model.pt` is **~312 MB**. Because GitHub rejects files larger than 100 MB during a standard `git push`, choose one of the following two supported deployment approaches:

### Option A: Git LFS (Recommended for Railway)
Railway automatically detects and pulls Git LFS pointers during build if Git LFS is configured.

1. Install Git LFS locally (if not already installed):
   ```bash
   git lfs install
   ```
2. Verify tracking configured in `.gitattributes`:
   ```bash
   git lfs track "models/*.pt"
   ```
3. Stage and commit the model:
   ```bash
   git add .gitattributes
   git add -f models/best_multimodal_model.pt
   git commit -m "chore: track model checkpoint with Git LFS"
   git push origin main
   ```

### Option B: Remote Checkpoint URL (`MODEL_CHECKPOINT_URL`)
If you prefer not to use Git LFS quotas on GitHub:
1. Upload `models/best_multimodal_model.pt` to an object store (e.g., GitHub Release assets, AWS S3, Cloudflare R2, or Google Cloud Storage).
2. Set the `MODEL_CHECKPOINT_URL` environment variable in Railway:
   ```bash
   MODEL_CHECKPOINT_URL=https://github.com/saad-affan12/ComFuse/releases/download/v1.0.0/best_multimodal_model.pt
   ```
3. The backend (`backend/main.py`) automatically downloads and caches the checkpoint on container startup if it is not present on disk.

---

## 3. Backend Deployment to Railway

### Step 1: Create Railway Project
1. Log in to [Railway](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `saad-affan12/ComFuse`.

### Step 2: Configure Build & Deploy Settings
Railway uses the included `railway.toml` and `Procfile` automatically.
- **Root Directory:** `/` (Project root)
- **Start Command:**
  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
  ```
- **Healthcheck Path:** `/health`
- **Healthcheck Timeout:** 180 seconds

### Step 3: Set Backend Environment Variables
In Railway Dashboard → **Variables**, configure:

| Variable | Recommended Value | Description |
|:---|:---|:---|
| `CORS_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:5173` | Allowed frontend domains (comma-separated, no trailing slashes) |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum upload size for complaint images |
| `MODEL_CHECKPOINT_URL` | *(Optional)* | Direct download link for model checkpoint if not using Git LFS |

### Step 4: Generate Public Domain
1. In Railway, navigate to **Settings** → **Networking** → **Public Networking**.
2. Click **Generate Domain** (e.g. `https://comfuse-api-production.up.railway.app`).
3. Verify backend health by visiting:
   ```
   https://comfuse-api-production.up.railway.app/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "comfuse-api",
     "model": "ComFuse",
     "device": "cpu"
   }
   ```

---

## 4. Frontend Deployment to Vercel

### Step 1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project** and import `saad-affan12/ComFuse`.

### Step 2: Configure Project Settings
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 3: Set Frontend Environment Variables
In Vercel Dashboard → **Settings** → **Environment Variables**:

| Variable | Value | Description |
|:---|:---|:---|
| `VITE_API_URL` | `https://comfuse-api-production.up.railway.app` | Your deployed Railway backend URL (no trailing slash) |

### Step 4: Deploy
Click **Deploy**. Vercel will build the frontend bundle and assign a public domain (e.g. `https://comfuse.vercel.app`).

---

## 5. Connecting Frontend to Backend (CORS Finalization)

Once your Vercel URL is live:
1. Return to Railway Dashboard → **Variables**.
2. Update `CORS_ORIGINS` to include your exact Vercel domain:
   ```
   CORS_ORIGINS=https://comfuse.vercel.app,http://localhost:5173
   ```
3. Railway will redeploy automatically with the updated CORS policy.
4. Open `https://comfuse.vercel.app` in your browser. The status badge will show **● Model Online**.

---

## 6. Local Testing Commands

### Backend Local Test
```powershell
# Activate environment
.venv\Scripts\Activate.ps1

# Launch backend locally
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Frontend Local Test
```powershell
cd frontend
npm install
npm run dev
```

---

## 7. Troubleshooting Common Deployment Issues

### Issue 1: "Unable to connect to ComFuse backend" (CORS or Down)
- **Check 1:** Ensure Railway service is active and `/health` returns `200 OK`.
- **Check 2:** Ensure `CORS_ORIGINS` in Railway matches your Vercel URL exactly (including `https://`, no trailing slash).
- **Check 3:** Ensure `VITE_API_URL` in Vercel environment variables does not have a trailing `/`.

### Issue 2: Railway Build Out-of-Memory (OOM)
- ResNet-18 + DistilBERT inference runs within 1 GB RAM on CPU.
- Ensure minimum container memory on Railway is at least 1 GB (Railway starter tier provides up to 8 GB).

### Issue 3: 413 Payload Too Large on Image Upload
- Image exceeds the `MAX_UPLOAD_SIZE_MB` limit (default 10 MB).
- Adjust `MAX_UPLOAD_SIZE_MB` in Railway if larger customer screenshots are expected.

### Issue 4: Cold-Start Latency
- The first request after a sleep or restart initializes model weights in memory (~3–5 seconds on CPU).
- The frontend timeout is configured to 45 seconds to safely accommodate cold starts.
