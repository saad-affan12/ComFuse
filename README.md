# ComFuse: Multimodal Customer Complaint Classification Using Text-Image Feature Fusion

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-ee4c2c.svg)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8+-646cff.svg)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)

**ComFuse** is an end-to-end multimodal customer complaint classification system that fuses textual grievance context with visual evidence (screenshots, photos of physical defects, billing receipts). It simultaneously predicts **Complaint Aspect** (6 categories) and **Complaint Severity** (4 intensity tiers) using a dual-head multitask neural architecture.

The project features a decoupled production-style architecture: a modern **React + Vite + TypeScript** frontend communicating via REST APIs with a **FastAPI** backend serving a frozen, pre-trained **DistilBERT + ResNet-18** multimodal checkpoint.

---

## 📌 System Architecture

```
                 COMFUSE FRONTEND
           React 19 + Vite + TypeScript
             (http://localhost:5173)
                       │
                       │ REST API (multipart/form-data)
                       ▼
                FastAPI BACKEND
             (http://localhost:8000)
                       │
                       │ In-memory inference
                       ▼
             src/inference.py (ComplaintPredictor)
                       │
                       ▼
         models/best_multimodal_model.pt
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
     Aspect Head             Severity Head
      (6 classes)             (4 classes)
```

### Multimodal ML Fusion Backbone (Frozen Checkpoint)
```
       Complaint Text (128 tokens)            Complaint Image (224x224 RGB)
                  │                                         │
                  ▼                                         ▼
             DistilBERT                                 ResNet-18
            [CLS] (768-d)                           Conv Backbone (512-d)
                  │                                         │
                  ▼                                         ▼
            Linear (256-d)                            Linear (256-d)
                  │                                         │
                  └───────────────────┬─────────────────────┘
                                      │
                                      ▼
                        Concatenation Fusion (512-d)
                                      │
                                      ▼
                        Fusion MLP (256-d, ReLU, Drop)
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
                 Aspect Logits               Severity Logits
                  (6 classes)                 (4 classes)
```

---

## 🚀 Quickstart: Running ComFuse Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.11 / 3.12 / 3.13)
- Node.js 18+ and npm (tested on Node v24.14)

---

### Step 1: Virtual Environment Setup

From the repository root directory:

```powershell
# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Windows Command Prompt:
.venv\Scripts\activate.bat
# Linux / macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

---

### Step 2: Start the FastAPI Backend

The backend loads `models/best_multimodal_model.pt` into memory **once** on startup:

```powershell
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

Verify backend health at:
- Health check: `http://localhost:8000/health`
- Interactive OpenAPI docs: `http://localhost:8000/docs`

---

### Step 3: Start the React Frontend

Open a new terminal window:

```powershell
cd frontend
npm install
npm run dev
```

Open your browser at:
👉 **`http://localhost:5173`**

The UI will automatically connect to `http://localhost:8000` (configured in `frontend/.env`), showing **● Model Online**.

---

## 📡 API Endpoints

### 1. Health Check
- **`GET /health`**
- **Response:**
  ```json
  {
    "status": "healthy",
    "model": "ComFuse",
    "device": "cpu"
  }
  ```

### 2. Predict Customer Complaint
- **`POST /predict`**
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `text` (string, required): Customer complaint narrative.
  - `image` (file, optional): Uploaded image screenshot (PNG, JPG, JPEG, WEBP).
- **Response:**
  ```json
  {
    "success": true,
    "prediction_mode": "multimodal",
    "aspect": {
      "label": "Software",
      "confidence": 0.91,
      "probabilities": {
        "Software": 0.91,
        "Hardware": 0.03,
        "Quality": 0.02,
        "Service": 0.02,
        "Price": 0.01,
        "Packaging": 0.01
      }
    },
    "severity": {
      "label": "Blame",
      "confidence": 0.74,
      "probabilities": {
        "Blame": 0.74,
        "Disapproval": 0.15,
        "No Explicit Reproach": 0.06,
        "Accusation": 0.05
      }
    }
  }
  ```

### 3. Real Test Set Examples
- **`GET /examples`**
- Returns 5 pre-curated test set complaint cases with real screenshot attachments to test with 1 click.

---

## 💻 Frontend Features

- **Modern SaaS Dashboard:** Clean, responsive, dark-mode design with subtle borders and restrained contrast.
- **Real-Time Connectivity:** Automatic heartbeat to `GET /health` displaying real-time model readiness.
- **Multimodal & Text-Only Switching:** Uploading an image triggers multimodal fusion; omitting an image seamlessly triggers text-only fallback.
- **Full Calibrated Probabilities:** Displays complete horizontal probability distributions for all 6 Aspect categories and all 4 Severity levels directly from the PyTorch model.
- **1-Click Test Samples:** Built-in test cases taken directly from the held-out evaluation set (`data/processed/test.csv`).
- **Session Analysis History:** In-memory tracking of the last 5 analyses in the current session (no external database required).
- **Interactive Architecture Explainer:** Expandable visualization of the DistilBERT + ResNet-18 fusion pipeline.

---

## 📁 Project Structure

```
ComFuse/
├── backend/
│   ├── main.py                    # FastAPI application, CORS, endpoints, lifespan loader
│   └── requirements.txt           # Backend-specific Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components (Navbar, HeroHeader, ComplaintInput, etc.)
│   │   ├── api.ts                 # Axios API client connecting to backend
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── App.tsx                # Main application workspace layout
│   │   ├── index.css              # Tailwind CSS styles
│   │   └── main.tsx               # React root entry
│   ├── public/
│   ├── .env                       # VITE_API_URL=http://localhost:8000
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── src/
│   ├── inference.py               # Core inference engine (ComplaintPredictor)
│   ├── multimodal_model.py        # PyTorch MultimodalComplaintClassifier
│   ├── dataset.py                 # Dataset loaders & image transforms
│   ├── train.py                   # Multitask training loop
│   └── evaluate.py                # Evaluation & metric calculation
├── models/
│   └── best_multimodal_model.pt   # Frozen trained PyTorch model checkpoint
├── data/
│   └── processed/                 # Frozen train (640), val (137), test (138) CSV splits
├── assets/
│   └── demo_images/               # Real test set screenshots for interactive demo
├── docs/
│   ├── frontend_architecture.md   # Detailed architecture documentation
│   └── viva_notes.md              # Defense preparation & theoretical notes
├── config.py                      # Global paths, hyperparameters, and class dictionaries
└── app.py                         # [LEGACY] Preserved Gradio UI fallback
```

---

## 🧪 Model Performance on Held-Out Test Set (138 samples)

| Task | Target Classes | Test Accuracy | Macro F1 | Weighted F1 |
|:-----|:--------------:|:-------------:|:--------:|:-----------:|
| **Aspect Classification** | 6 | **76.09%** | **0.4619** | **0.7516** |
| **Severity Classification** | 4 | **43.48%** | **0.4074** | **0.4294** |

---

## 🚀 Deployment

### Production Architecture

```
User
 ↓
Vercel React Frontend (https://comfuse.vercel.app)
 ↓ HTTPS
Railway FastAPI Backend (https://comfuse-api.up.railway.app)
 ↓
Existing ComFuse Inference Pipeline (src/inference.py)
 ↓
DistilBERT + ResNet-18 (models/best_multimodal_model.pt)
 ↓
Aspect + Severity Predictions
```

### Deployment Configuration Summary

- **FastAPI Backend (Railway):**
  - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}`
  - **Health Check:** `GET /health` (returns `{"status": "healthy", "service": "comfuse-api"}`)
  - **Environment Variables:** `CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173`
- **React Frontend (Vercel):**
  - **Root Directory:** `frontend`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Environment Variables:** `VITE_API_URL=https://your-backend.up.railway.app`
- **Model Weights Handling:**
  - Tracked via Git LFS (`.gitattributes`) or served remotely via `MODEL_CHECKPOINT_URL`.

For full step-by-step instructions, see the dedicated [Deployment Guide](docs/DEPLOYMENT.md).

---

## ⚠️ Troubleshooting

1. **Backend Shows "Backend Offline" in Frontend:**
   - Verify that the FastAPI backend is running on `http://localhost:8000`.
   - Test `curl http://localhost:8000/health` in your terminal.
   - Ensure the `.venv` Python environment is used.

2. **CORS Error in Browser Console:**
   - The backend allows `http://localhost:5173` and `http://127.0.0.1:5173`. Make sure the frontend is accessed through one of these ports.

3. **Memory / CPU Usage:**
   - DistilBERT and ResNet-18 execute smoothly on any modern multi-core CPU. The model is loaded once into memory at startup and retained across requests.
