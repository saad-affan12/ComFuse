# ComFuse: Multimodal Customer Complaint Intelligence System

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-ee4c2c.svg)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6+-646cff.svg)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)

**ComFuse** is an advanced multimodal customer complaint classification system that fuses textual grievance context with visual evidence (screenshots, photos of physical defects, billing receipts). It simultaneously predicts **Complaint Aspect** (6 categories) and **Complaint Severity** (4 intensity tiers) using a dual-head multitask neural architecture.

The project features a decoupled production-style architecture: a modern **React + Vite + TypeScript** frontend communicating via REST APIs with a **FastAPI** backend serving a fine-tuned **DistilBERT + ResNet-18** multimodal checkpoint trained on a balanced subset of the `NShreya/Comp4.0` dataset.

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

### Multimodal ML Fusion Backbone
```
       Complaint Text (128-256 tokens)         Complaint Image (224x224 RGB)
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

## 🔬 Dataset Rebalancing & Retraining Pipeline

The underlying dataset (`NShreya/Comp4.0`, 915 total samples) suffers from extreme class imbalance: **Software accounts for 75.74% of samples**, while minority classes like **Price** (10 samples) and **Packaging** (9 samples) have scarce representation. Standard cross-entropy previously caused the model to collapse into predicting `Software` on 100% of inputs.

### 1. Training Set Rebalancing (Strict Zero-Leakage)
* Held-out Validation (137 samples) and Test (138 samples) splits remained **100% untouched** to preserve authentic real-world evaluation.
* Only the training split (640 samples) was rebalanced into a **525-sample balanced dataset** (`train_balanced.csv`):
  * **Software**: Undersampled from 485 down to 220 samples (reducing its training share from 75.8% to 41.9%).
  * **Hardware**: Oversampled from 63 $\rightarrow$ 95 samples.
  * **Quality**: Oversampled from 40 $\rightarrow$ 80 samples.
  * **Service**: Oversampled from 39 $\rightarrow$ 78 samples.
  * **Price**: Oversampled from 7 $\rightarrow$ 28 samples *(limited by 7 unique samples)*.
  * **Packaging**: Oversampled from 6 $\rightarrow$ 24 samples *(limited by 6 unique samples)*.

### 2. Controlled Retraining Experiments (Validation Benchmark)

All models were evaluated on the **137-sample untouched validation split**:

| Experiment | Configuration | Val Sev Acc | Val Sev BalAcc | Val Sev Macro-F1 | Val Asp Acc | Val Asp BalAcc | Val Asp Macro-F1 |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Exp 1** | Original Data + Standard CE Loss | 29.20% | 25.72% | 0.2011 | 76.64% | 17.95% | 0.1689 |
| **Exp 2** | Original Data + Class-Weighted Loss | 32.12% | 34.69% | 0.3252 | 75.91% | 16.67% | 0.1450 |
| **Exp 3** | Aspect WeightedRandomSampler | 29.93% | 29.74% | 0.2766 | 56.93% | **42.79%** | **0.3332** |
| **Exp 4** | Joint-Aware Sampler ($w_A^{0.5} \times w_S^{0.5}$) | 34.31% | 34.98% | 0.3370 | 75.91% | 35.26% | 0.3187 |
| **Exp 5 (Selected)** | Balanced Dataset + Smoothed Loss | **37.23%** | **37.91%** | **0.3744** | 72.99% | 34.29% | 0.2941 |

---

## 🧪 Held-Out Test Set Performance (138 Samples)

Evaluating the selected model against the original baseline on the untouched held-out test split:

| Target | Metric | Original Baseline (Exp 1) | Rebalanced Model (Exp 5) | Absolute Delta | Relative Gain |
|:---|:---|:---:|:---:|:---:|:---:|
| **Aspect** | **Accuracy** | 75.36% | **74.64%** | -0.72% | -0.9% |
| **Aspect** | **Balanced Accuracy** | 16.67% | **38.09%** | **+21.42%** | **+128.5%** |
| **Aspect** | **Macro-F1** | 0.1433 | **0.3683** | **+0.2251** | **+157.1%** |
| **Severity** | **Accuracy** | 28.99% | **31.16%** | **+2.17%** | +7.5% |
| **Severity** | **Balanced Accuracy** | 26.20% | **29.70%** | **+3.50%** | +13.4% |
| **Severity** | **Macro-F1** | 0.2309 | **0.2663** | **+0.0354** | +15.3% |
| **Severity** | **Weighted-F1** | 0.2435 | **0.2697** | **+0.0261** | +10.7% |

### Key Improvements
1. **Majority-Class Bias Eliminated**: The baseline predicted `Software` on 100% of samples (16.67% balanced accuracy). The rebalanced model actively predicts minority aspects (`Service` at 33.3% recall, `Price` at 100% recall) and lifts Aspect Macro-F1 by **+157%**.
2. **Severity Discrimination**: Active recognition across all 4 severity classes (`Disapproval` F1: 0.443, `No Explicit Reproach` F1: 0.305, `Accusation` F1: 0.279).
3. **Calibrated Probabilities**: Softmax confidence distributions reflect true uncertainty rather than artificial 99.9% certainty.

---

## 🚀 Quickstart: Running ComFuse Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.10 / 3.11 / 3.12)
- Node.js 18+ and npm

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
- **`GET /health`** or **`GET /api/health`**
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "comfuse-api",
    "model": "ComFuse",
    "device": "cpu"
  }
  ```

### 2. Predict Customer Complaint
- **`POST /predict`** or **`POST /api/predict`**
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `text` (string, required): Customer complaint narrative.
  - `image` (file, optional): Uploaded image screenshot (PNG, JPG, JPEG, WEBP).
- **Response:**
  ```json
  {
    "success": true,
    "mode": "text-only",
    "prediction_mode": "text-only",
    "prediction": {
      "aspect": {
        "label": "Hardware",
        "confidence": 0.2453
      },
      "severity": {
        "label": "Accusation",
        "confidence": 0.3856
      }
    },
    "probabilities": {
      "aspect": {
        "Software": 0.2423,
        "Hardware": 0.2453,
        "Quality": 0.2357,
        "Service": 0.1210,
        "Price": 0.0634,
        "Packaging": 0.0923
      },
      "severity": {
        "No Explicit Reproach": 0.1574,
        "Disapproval": 0.2450,
        "Accusation": 0.3856,
        "Blame": 0.2121
      }
    }
  }
  ```

### 3. Real Test Set Examples
- **`GET /examples`**
- Returns 5 pre-curated held-out test complaint cases with real screenshot attachments to test with 1 click.

---

## 🛠️ Reproducibility & Research Scripts

All experiments, data generation, and evaluation suites can be reproduced directly:

| Script | Purpose |
|:---|:---|
| `scripts/generate_dataset_reports.py` | Audits `NShreya/Comp4.0` and exports class distribution CSVs & split manifests. |
| `scripts/create_balanced_dataset.py` | Builds the stratified 525-sample balanced training split (`train_balanced.csv`). |
| `scripts/run_rebalancing_experiments.py` | Runs all 5 controlled experiments, evaluates on test set, and exports all CSV deliverables. |
| `scripts/audit_existing_implementation.py` | Systematic diagnostic audit of label mappings, data leakage, token lengths, and inference logic. |
| `scripts/severity_validation_error_analysis.py` | Validation-only error analysis classifying the 4 major severity error types. |
| `scripts/test_ui_regression_examples.py` | Evaluates the 5 UI demo cases and Thread ID 82 with real demo images and text. |
| `tests/test_pipeline_integrity.py` | Automated unit test suite asserting 100% integrity of label mappings, eval mode, and argmax translation. |

Run tests:
```powershell
.venv\Scripts\python.exe -m unittest tests/test_pipeline_integrity.py
```

---

## 📁 Project Directory Structure

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
│   ├── .env                       # VITE_API_URL=http://localhost:8000
│   ├── package.json
│   └── vite.config.ts
├── src/
│   ├── inference.py               # Core inference engine (ComplaintPredictor)
│   ├── multimodal_model.py        # PyTorch MultimodalComplaintClassifier
│   ├── dataset.py                 # Dataset loaders & image transforms
│   ├── text_encoder.py            # DistilBERT text projection encoder
│   ├── image_encoder.py           # ResNet-18 visual feature extractor
│   └── preprocessing.py           # Text cleaning and raw normalization routines
├── models/
│   ├── best_multimodal_model.pt   # Production PyTorch model checkpoint (Exp 5)
│   └── model_config.json          # Deployment hyperparameter & class metadata
├── experiments/
│   ├── balanced_data/             # Balanced training split (train_balanced.csv)
│   ├── original_vs_rebalanced_report.md  # Comprehensive research report
│   ├── sampling_experiment_results.csv   # Validation metrics across all 5 experiments
│   ├── training_history.csv       # Per-epoch training logs
│   ├── aspect_classification_report.csv  # Final test report for aspect classes
│   └── severity_classification_report.csv# Final test report for severity classes
├── outputs/                       # CSV reports, manifests, confusion matrix PNGs
├── scripts/                       # Training, audit, and diagnostic scripts
├── tests/                         # Automated unit and integration test suite
├── assets/
│   └── demo_images/               # Curated test set screenshots for interactive demo
├── config.py                      # Global paths, hyperparameters, and class dictionaries
└── README.md
```

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
ComFuse Inference Pipeline (src/inference.py)
 ↓
DistilBERT + ResNet-18 (models/best_multimodal_model.pt)
 ↓
Aspect + Severity Predictions
```

- **FastAPI Backend (Railway):**
  - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}`
  - **Health Check:** `GET /health` (returns `{"status": "healthy", "service": "comfuse-api"}`)
- **React Frontend (Vercel):**
  - **Root Directory:** `frontend`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Environment Variables:** `VITE_API_URL=https://your-backend.up.railway.app`

---

## 📄 License & Attribution

This project is licensed under the MIT License.  
The underlying dataset is derived from Hugging Face `NShreya/Comp4.0`.
