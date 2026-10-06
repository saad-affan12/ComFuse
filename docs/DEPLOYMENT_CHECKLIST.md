# ComFuse: Production Deployment Checklist

Use this checklist to verify that all deployment steps have been executed and validated across Railway, Vercel, and GitHub.

---

## 1. Repository & Security Checks

- [x] **Git repository clean:** Working tree clean, `.gitignore` excludes `.venv`, cache files, and node modules.
- [x] **No secrets committed:** `.env` files properly excluded; only `.env.example` templates committed.
- [x] **Git LFS configured:** `.gitattributes` tracks `models/*.pt` checkpoints.

---

## 2. Backend (FastAPI / Railway) Checks

- [x] **Backend starts successfully:** `uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}` boots without errors.
- [x] **Model loads once at startup:** Singleton pattern via `lifespan` context manager; no model re-instantiation per request.
- [x] **Health check endpoint operational:** `GET /health` returns `200 OK` with `{"status": "healthy", "service": "comfuse-api"}`.
- [x] **Predict endpoint operational:** `POST /predict` accepts `multipart/form-data` and returns un-fabricated predictions.
- [x] **Text + image multimodal mode works:** Joint DistilBERT + ResNet-18 fusion inference succeeds.
- [x] **Text-only fallback works:** Clean zero visual embedding fallback when image is omitted.
- [x] **Image format validation works:** Rejects unsupported MIME types with `400 Bad Request`.
- [x] **Image size limitation works:** Rejects oversized images (> 10 MB) with `413 Payload Too Large`.
- [x] **Empty text validation works:** Rejects empty or whitespace-only complaints with `400 Bad Request`.
- [x] **Dynamic CORS configured:** Reads comma-separated origins from `CORS_ORIGINS` environment variable.
- [x] **Railway start command configured:** `railway.toml` and `Procfile` configured with dynamic `${PORT:-8000}`.
- [x] **Model checkpoint accessible:** Handled via Git LFS or `MODEL_CHECKPOINT_URL` automatic downloader.

---

## 3. Frontend (React + Vite / Vercel) Checks

- [x] **Frontend builds cleanly:** `npm run build` succeeds with zero TypeScript or bundler errors.
- [x] **Vercel SPA routing configured:** `frontend/vercel.json` contains rewrites to `index.html`.
- [x] **Dynamic API URL configured:** Uses `import.meta.env.VITE_API_URL` with fallback to `http://localhost:8000`.
- [x] **Multipart form submission:** Sends direct `FormData` multipart payloads to backend without base64 bloating.
- [x] **Heartbeat health display:** Shows live `● Model Online` / `● Backend Offline` status.
- [x] **Non-aggressive polling:** Performs non-intrusive status check on application mount.
- [x] **Calibrated probabilities:** Displays complete horizontal probability bars across all 6 Aspect categories and 4 Severity levels.
- [x] **Comprehensive error messaging:** Friendly user notifications for 400, 413, 500, network disconnects, and timeouts.
- [x] **Session history tracking:** In-memory tracking of the last 5 analyses without database persistence.

---

## 4. Post-Deployment Verification

- [ ] **Railway public domain active:** `https://<your-backend>.up.railway.app/health` returns `healthy`.
- [ ] **Vercel public domain active:** `https://<your-frontend>.vercel.app` loads without errors.
- [ ] **CORS updated on Railway:** Railway `CORS_ORIGINS` includes exact Vercel URL.
- [ ] **Live prediction verified:** Submit sample complaint and verify live Aspect and Severity predictions.
