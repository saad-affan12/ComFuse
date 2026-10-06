# ComFuse Frontend & Backend Architecture

This document describes the decoupled full-stack architecture for **ComFuse: Multimodal Customer Complaint Intelligence**, connecting a modern React + TypeScript frontend to a high-throughput FastAPI inference server powered by frozen PyTorch checkpoints.

---

## 1. System Topology Overview

```
                      ┌──────────────────────────────────────┐
                      │           COMFUSE CLIENT             │
                      │    React 19 + Vite + TypeScript      │
                      │         Tailwind CSS v4              │
                      │     (http://localhost:5173)          │
                      └──────────────────┬───────────────────┘
                                         │
                                         │ REST API (FormData / JSON)
                                         │ CORS-enabled
                                         ▼
                      ┌──────────────────────────────────────┐
                      │           FASTAPI BACKEND            │
                      │         Uvicorn ASGI Engine          │
                      │     (http://localhost:8000)          │
                      │                                      │
                      │   GET /health    GET /examples       │
                      │   POST /predict  GET /assets/*       │
                      └──────────────────┬───────────────────┘
                                         │
                                         │ In-Memory Python Call
                                         │ (Model loaded once at startup)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        INFERENCE ENGINE              │
                      │          src/inference.py            │
                      │       (ComplaintPredictor)           │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │         PYTORCH CHECKPOINT           │
                      │    models/best_multimodal_model.pt   │
                      │                                      │
                      │   Text: DistilBERT (256-d bottleneck)│
                      │   Img:  ResNet-18  (256-d bottleneck)│
                      │   Fusion: Concatenation (512-d)      │
                      │   Dual Heads: Aspect (6) + Sev (4)   │
                      └──────────────────────────────────────┘
```

---

## 2. Component Breakdown

### A. Frontend Layer (`frontend/`)
- **Framework:** React 19 + Vite + TypeScript.
- **Styling:** Tailwind CSS v4 with custom dark palette, subtle borders, and smooth transitions.
- **Icons:** `lucide-react`.
- **API Client:** `axios` configured with `VITE_API_URL` environment variable and fallback to `http://localhost:8000`.
- **Key Modules:**
  - `Navbar.tsx`: Real-time backend connectivity heartbeat indicator (`● Model Online` / `● Backend Offline`), tab switching between Analysis Workspace, How It Works, and About.
  - `HeroHeader.tsx`: Contextual title, subtitle, model backbone badges (`DistilBERT + ResNet-18`).
  - `ComplaintInput.tsx`: Left workspace panel containing a customer grievance text area, character counter, drag-and-drop file uploader with preview and dismiss controls, file size/MIME validation, and stateful trigger button.
  - `PredictionResult.tsx`: Right workspace panel displaying top Aspect category, top Severity level, confidence tags, and horizontal calibrated probability bars across all 6 Aspect categories and all 4 Severity tiers.
  - `ArchitectureDiagram.tsx`: Expandable flow visualizer showing text encoding, image encoding, intermediate feature fusion, and classification heads.
  - `ExampleCards.tsx`: 1-click test dataset case loaders that populate sample text and screenshot evidence directly from the test split.
  - `SessionHistory.tsx`: In-memory session table of recent predictions with timestamps and confidence scores.

### B. Backend Layer (`backend/main.py`)
- **Framework:** FastAPI with Uvicorn server.
- **Lifecycle Management:** Loads `ComplaintPredictor` inside `lifespan` context manager at server startup, eliminating model re-instantiation overhead on incoming requests.
- **File & Security Validation:**
  - Enforces `image/jpeg`, `image/png`, `image/webp` MIME checking.
  - Caps image upload size at 10 MB.
  - Reads image into memory via `io.BytesIO` and PIL. No sensitive user uploads are stored on disk.
- **CORS:** Restricts access to authorized local origins (`http://localhost:5173`, `http://127.0.0.1:5173`).

### C. Inference Core (`src/inference.py` & Checkpoint)
- **Model Checkpoint:** `models/best_multimodal_model.pt` (frozen PyTorch state dict).
- **Dual Backbone:**
  - **Text:** `distilbert-base-uncased` pooled representation projected to 256 dimensions.
  - **Vision:** `resnet18` convolutional feature extractor projected to 256 dimensions (with zero-tensor fallback for text-only inputs).
- **Fusion:** Feature concatenation (512 dimensions) + Multilayer Perceptron.
- **Output Heads:**
  1. Aspect Head: 6 classes (`Software`, `Hardware`, `Quality`, `Service`, `Price`, `Packaging`).
  2. Severity Head: 4 classes (`No Explicit Reproach`, `Disapproval`, `Accusation`, `Blame`).

---

## 3. API Contract Reference

### `GET /health`
- **Purpose:** Verifies backend health and model loading readiness.
- **Response:**
  ```json
  {
    "status": "healthy",
    "model": "ComFuse",
    "device": "cpu"
  }
  ```

### `GET /examples`
- **Purpose:** Returns curated real test set samples for frontend exploration.
- **Response:**
  ```json
  {
    "examples": [
      {
        "id": "sample_1",
        "title": "Software UI Glitch & Shuffle Bug",
        "text": "Tweet 1. @120401 When you have a moment, please send us over a DM...",
        "image_filename": "sample_0413_thread_414.jpg",
        "aspect": "Software",
        "severity": "Blame"
      }
    ]
  }
  ```

### `POST /predict`
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `text` (string, required): Customer complaint narrative.
  - `image` (file, optional): Uploaded PNG/JPG evidence screenshot.
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
    },
    "metadata": {
      "text_length": 142,
      "has_image": true,
      "explanation": "Text features were extracted using DistilBERT and visual features were extracted using ResNet-18..."
    }
  }
  ```

---

## 4. Development & Production Runbook

### Start Backend
```powershell
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

### Start Frontend
```powershell
cd frontend
npm run dev
```
Navigate to `http://localhost:5173`.
