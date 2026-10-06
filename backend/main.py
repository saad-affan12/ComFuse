"""FastAPI Backend for ComFuse: Multimodal Customer Complaint Intelligence.

Serves model inference via the frozen ComFuse checkpoint (DistilBERT + ResNet-18)
and src/inference.py.
"""

import io
import os
import sys
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

# Max allowable image upload size (10MB)
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the ComFuse PyTorch model once during startup."""
    global predictor
    ckpt_path = os.path.join(config.MODELS_DIR, "best_multimodal_model.pt")
    if not os.path.exists(ckpt_path):
        ckpt_path = os.path.join(config.MULTIMODAL_MODEL_DIR, "best_model.pt")

    print(f"[ComFuse Backend] Loading checkpoint from: {ckpt_path} ...")
    predictor = ComplaintPredictor(checkpoint_path=ckpt_path)
    device_name = str(predictor.device)
    print(f"[ComFuse Backend] Model successfully initialized on device: {device_name}")
    yield
    print("[ComFuse Backend] Shutting down.")


app = FastAPI(
    title="ComFuse API",
    description="Multimodal Customer Complaint Classification API (DistilBERT + ResNet-18)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for local frontend
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static demo images directory if it exists
demo_images_dir = os.path.join(BASE_DIR, "assets", "demo_images")
if os.path.exists(demo_images_dir):
    app.mount("/assets/demo_images", StaticFiles(directory=demo_images_dir), name="demo_images")


@app.get("/health", summary="API & Model Health Check")
async def health_check():
    """Verify backend status and model readiness."""
    global predictor
    if predictor is None:
        return {
            "status": "loading",
            "model": "ComFuse",
            "device": "unknown"
        }
    return {
        "status": "healthy",
        "model": "ComFuse",
        "device": str(predictor.device)
    }


@app.get("/examples", summary="Retrieve Curated Real Test Examples")
async def get_examples():
    """Return real test samples for 1-click user testing in frontend."""
    return {"examples": REAL_EXAMPLES}


@app.post("/predict", summary="Classify Customer Complaint")
async def predict_complaint(
    text: str = Form(..., description="Customer complaint text"),
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
            detail="Model is currently initializing or unavailable."
        )

    clean_text = text.strip() if text else ""
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a complaint before analyzing."
        )

    pil_image: Optional[Image.Image] = None

    if image is not None and image.filename:
        # Check MIME type
        if image.content_type and image.content_type.lower() not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to process this image. Please upload a PNG or JPEG image (received {image.content_type})."
            )

        # Read and check size
        try:
            image_bytes = await image.read()
            if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image file too large. Maximum supported size is 10 MB."
                )

            if len(image_bytes) > 0:
                try:
                    pil_image = Image.open(io.BytesIO(image_bytes))
                    pil_image.verify()  # Verify image integrity
                    # Re-open because verify() mutates file pointer
                    pil_image = Image.open(io.BytesIO(image_bytes))
                except Exception:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Unable to process this image. The image file is corrupt or invalid."
                    )
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error reading uploaded image file."
            )

    # Run inference using the frozen ComFuse predictor
    try:
        raw_result = predictor.predict(text=clean_text, image_input=pil_image)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during model inference. Please try again."
        )

    prediction_mode = "multimodal" if (pil_image is not None and raw_result["mode"].lower() == "multimodal") else "text-only"

    # Extract exact probabilities (0.0 to 1.0) and round cleanly
    aspect_probs: Dict[str, float] = {
        k: round(float(v), 4) for k, v in raw_result["aspect_probs"].items()
    }
    severity_probs: Dict[str, float] = {
        k: round(float(v), 4) for k, v in raw_result["severity_probs"].items()
    }

    aspect_label = raw_result["aspect_prediction"]
    severity_label = raw_result["severity_prediction"]

    aspect_confidence = aspect_probs.get(aspect_label, round(raw_result["aspect_confidence"] / 100.0, 4))
    severity_confidence = severity_probs.get(severity_label, round(raw_result["severity_confidence"] / 100.0, 4))

    return {
        "success": True,
        "prediction_mode": prediction_mode,
        "aspect": {
            "label": aspect_label,
            "confidence": aspect_confidence,
            "probabilities": aspect_probs
        },
        "severity": {
            "label": severity_label,
            "confidence": severity_confidence,
            "probabilities": severity_probs
        },
        "metadata": {
            "text_length": len(clean_text),
            "has_image": pil_image is not None,
            "explanation": raw_result.get("explanation", "")
        }
    }
