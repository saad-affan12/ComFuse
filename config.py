"""Central configuration file for Multimodal Customer Complaint Classification."""
import os
import torch

# Base Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, "processed")
IMAGES_DIR = os.path.join(PROCESSED_DATA_DIR, "images")
MODELS_DIR = os.path.join(BASE_DIR, "models")
MULTIMODAL_MODEL_DIR = os.path.join(MODELS_DIR, "multimodal")
TEXT_ONLY_MODEL_DIR = os.path.join(MODELS_DIR, "text_only")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

# Hugging Face Dataset
HF_DATASET_NAME = "NShreya/Comp4.0"

# Hyperparameters & Model Specifications (Phase 14)
SEED = 42
MODEL_NAME = "distilbert-base-uncased"
IMAGE_MODEL = "resnet18"
MAX_LENGTH = 128
BATCH_SIZE = 16
LEARNING_RATE = 3e-5
EPOCHS = 3
DROPOUT = 0.2
EARLY_STOPPING_PATIENCE = 2
NUM_WORKERS = 0

# Aliases for compatibility
TEXT_MODEL_NAME = MODEL_NAME
IMAGE_MODEL_NAME = IMAGE_MODEL
MAX_SEQ_LENGTH = MAX_LENGTH
DROPOUT_RATE = DROPOUT
NUM_EPOCHS = EPOCHS
WEIGHT_DECAY = 0.01

# Feature Dimensions
TEXT_EMBED_DIM = 768       # DistilBERT hidden size
TEXT_PROJ_DIM = 256
IMAGE_RAW_DIM = 512        # ResNet18 feature output size
IMAGE_PROJ_DIM = 256
FUSION_HIDDEN_DIM = 256
IMAGE_SIZE = (224, 224)

# Primary Task Classes
ASPECT_CLASSES = [
    "Software",
    "Hardware",
    "Quality",
    "Service",
    "Price",
    "Packaging"
]

SEVERITY_CLASSES = [
    "No Explicit Reproach",
    "Disapproval",
    "Accusation",
    "Blame"
]

ASPECT2ID = {name: i for i, name in enumerate(ASPECT_CLASSES)}
ID2ASPECT = {i: name for i, name in enumerate(ASPECT_CLASSES)}

SEVERITY2ID = {name: i for i, name in enumerate(SEVERITY_CLASSES)}
ID2SEVERITY = {i: name for i, name in enumerate(SEVERITY_CLASSES)}

NUM_ASPECT_CLASSES = len(ASPECT_CLASSES)
NUM_SEVERITY_CLASSES = len(SEVERITY_CLASSES)

def get_device():
    """Select the best available compute device: CUDA > MPS > CPU."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")

DEVICE = get_device()
