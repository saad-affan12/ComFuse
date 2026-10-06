"""FastAPI Production Backend for ComFuse: Multimodal Customer Complaint Intelligence.

Production-ready deployment module for Railway.
Reuses the frozen PyTorch checkpoint (DistilBERT + ResNet-18) via src/inference.py.
"""

import io
import os
import sys
import urllib.request
from contextlib import asynccontextmanager
from typing import Dict, Optional, List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image

# Ensure project root is in python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config
from src.inference import ComplaintPredictor

# Global predictor instance loaded once at startup
predictor: Optional[ComplaintPredictor] = None

# Configurable upload limits from environment
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_IMAGE_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

# Pre-curated real examples from the frozen test dataset
REAL_EXAMPLES = [
    {
        "id": "sample_1",
        "title": "Software UI Glitch & Shuffle Bug",
        "text": "Tweet 1. @120401 When you have a moment, please send us over a DM. We're happy to take a closer look at this shuffle bug on your playlist interface.",
        "image_filename": "sample_0413_thread_414.jpg",
        "aspect": "Software",
        "severity": "Blame"
    },
    {
        "id": "sample_2",
        "title": "Product Quality & Physical Flaw",
        "text": "Tweet 1. @128693 We'd be happy to look into this issue with you. Send us a DM, and let us know what happened with your damaged device casing.",
        "image_filename": "sample_0455_thread_456.jpg",
        "aspect": "Quality",
        "severity": "Disapproval"
    },
    {
        "id": "sample_3",
        "title": "Customer Service & Billing Delay",
        "text": "Tweet 1. @121840 We'd be happy to look into this with you. Could you please send over your account details in a private message so we can verify the service charge?",
        "image_filename": "sample_0267_thread_268.jpg",
        "aspect": "Service",
        "severity": "Accusation"
    },
    {
        "id": "sample_4",
        "title": "Hardware Defect & Battery Malfunction",
        "text": "Tweet 1. @129040 We'd be happy to get you pointed in the right direction. Could you send us a DM detailing your device model and whether the overheating persists?",
        "image_filename": "sample_0488_thread_489.jpg",
        "aspect": "Hardware",
        "severity": "Blame"
    },
    {
        "id": "sample_5",
        "title": "Packaging / Transit Damage (Text-Only)",
        "text": "The external box arrived completely torn and opened, with items missing from the interior packaging. Urgent replacement needed.",
        "image_filename": None,
        "aspect": "Packaging",
        "severity": "Blame"
    }
]


def resolve_checkpoint_path() -> str:
    """Find or download checkpoint if remote URL is configured."""
    ckpt_path = os.path.join(config.MODELS_DIR, "best_multimodal_model.pt")
    if os.path.exists(ckpt_path) and os.path.getsize(ckpt_path) > 1000000:
        return ckpt_path

    # Fallback to multimodal subdirectory
    alt_path = os.path.join(config.MULTIMODAL_MODEL_DIR, "best_model.pt")
    if os.path.exists(alt_path) and os.path.getsize(alt_path) > 1000000:
        return alt_path

    # Optional remote download for cloud environments without Git LFS
    checkpoint_url = os.getenv("MODEL_CHECKPOINT_URL")
    if checkpoint_url:
        print(f"[ComFuse Backend] Downloading checkpoint from {checkpoint_url}...")
        os.makedirs(config.MODELS_DIR, exist_ok=True)
        urllib.request.urlretrieve(checkpoint_url, ckpt_path)
        print(f"[ComFuse Backend] Downloaded checkpoint ({os.path.getsize(ckpt_path)} bytes)")
        return ckpt_path

    return ckpt_path


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ComFuse PyTorch model once during application startup."""
    global predictor
    ckpt_path = resolve_checkpoint_path()

    print(f"[ComFuse Backend] Loading model checkpoint from: {ckpt_path} ...")
    predictor = ComplaintPredictor(checkpoint_path=ckpt_path)
    device_name = str(predictor.device)
    print(f"[ComFuse Backend] ComFuse model initialized successfully on: {device_name}")
    yield
    print("[ComFuse Backend] Application shutting down.")


app = FastAPI(
    title="ComFuse API",
    description="Multimodal Customer Complaint Classification API (DistilBERT + ResNet-18)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration: comma-separated list via CORS_ORIGINS environment variable
cors_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static demo images if present
demo_images_dir = os.path.join(BASE_DIR, "assets", "demo_images")
if os.path.exists(demo_images_dir):
    app.mount("/assets/demo_images", StaticFiles(directory=demo_images_dir), name="demo_images")


@app.get("/health", summary="Health Check")
async def health_check():
    """Liveness and readiness health check endpoint for Railway and frontend."""
    global predictor
    is_ready = predictor is not None
    return {
        "status": "healthy" if is_ready else "loading",
        "service": "comfuse-api",
        "model": "ComFuse",
        "device": str(predictor.device) if predictor else "unknown"
    }


@app.get("/examples", summary="Curated Test Examples")
async def get_examples():
    """Retrieve 5 pre-curated held-out test samples for 1-click evaluation."""
    return {"examples": REAL_EXAMPLES}


@app.post("/predict", summary="Classify Customer Complaint")
async def predict_complaint(
    text: str = Form(default="", description="Customer complaint text"),
    image: Optional[UploadFile] = File(None, description="Optional complaint screenshot/image")
):
    """
    Accepts customer complaint text and optional image screenshot.
    Uses DistilBERT + ResNet-18 multimodal fusion model or text-only fallback.
    Returns real Aspect and Severity predictions with complete probability distributions.
    """
    global predictor
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is currently initializing. Please try again shortly."
        )

    clean_text = text.strip() if text else ""
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a complaint before analyzing."
        )

    pil_image: Optional[Image.Image] = None

    if image is not None and image.filename:
        # 1. Validate MIME type
        content_type = (image.content_type or "").lower()
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format. Please upload a PNG or JPEG image (received {content_type or 'unknown'})."
            )

        # 2. Validate file size and read in-memory safely (cleaned up upon request termination)
        try:
            image_bytes = await image.read()
            if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Image file exceeds maximum allowable size of {MAX_UPLOAD_SIZE_MB} MB."
                )

            if len(image_bytes) > 0:
                try:
                    # Open and verify image structure
                    test_buf = io.BytesIO(image_bytes)
                    with Image.open(test_buf) as img_checker:
                        img_checker.verify()
                    # Re-open verified stream into fresh PIL Image
                    pil_image = Image.open(io.BytesIO(image_bytes))
                except Exception:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Unable to process this image. The file appears to be corrupted or invalid."
                    )
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error processing uploaded image."
            )

    # 3. Model inference using existing frozen ComFuse pipeline
    try:
        raw_result = predictor.predict(text=clean_text, image_input=pil_image)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during neural inference. Please try again."
        )

    prediction_mode = "multimodal" if (pil_image is not None and raw_result["mode"].lower() == "multimodal") else "text-only"

    # Exact probabilities (0.0 to 1.0)
    aspect_probs: Dict[str, float] = {
        k: round(float(v), 4) for k, v in raw_result["aspect_probs"].items()
    }
    severity_probs: Dict[str, float] = {
        k: round(float(v), 4) for k, v in raw_result["severity_probs"].items()
    }

    aspect_label = raw_result["aspect_prediction"]
    severity_label = raw_result["severity_prediction"]

    aspect_conf = aspect_probs.get(aspect_label, round(raw_result["aspect_confidence"] / 100.0, 4))
    severity_conf = severity_probs.get(severity_label, round(raw_result["severity_confidence"] / 100.0, 4))

    # Standardized response complying with both Phase 2 spec and UI components
    return {
        "success": True,
        "mode": prediction_mode,
        "prediction_mode": prediction_mode,
        "prediction": {
            "aspect": {
                "label": aspect_label,
                "confidence": aspect_conf
            },
            "severity": {
                "label": severity_label,
                "confidence": severity_conf
            }
        },
        "probabilities": {
            "aspect": aspect_probs,
            "severity": severity_probs
        },
        # Direct aliases for UI components
        "aspect": {
            "label": aspect_label,
            "confidence": aspect_conf,
            "probabilities": aspect_probs
        },
        "severity": {
            "label": severity_label,
            "confidence": severity_conf,
            "probabilities": severity_probs
        },
        "metadata": {
            "text_length": len(clean_text),
            "has_image": pil_image is not None,
            "explanation": raw_result.get("explanation", "")
        }
    }
