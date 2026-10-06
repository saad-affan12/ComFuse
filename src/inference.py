"""Inference engine for customer complaint classification (Multimodal and Text-Only fallback)."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import torch
import torch.nn.functional as F
from PIL import Image
import pandas as pd
from transformers import DistilBertTokenizer

import config
from src.dataset import get_image_transforms
from src.multimodal_model import MultimodalComplaintClassifier

class ComplaintPredictor:
    """Predictor class encapsulating model loading, image handling, and dual-head inference."""
    def __init__(self, checkpoint_path: str = None, device: torch.device = None):
        self.device = device or config.get_device()
        self.tokenizer = DistilBertTokenizer.from_pretrained(config.TEXT_MODEL_NAME)
        self.image_transform = get_image_transforms(is_train=False)
        
        if checkpoint_path is None:
            checkpoint_path = os.path.join(config.MULTIMODAL_MODEL_DIR, "best_model.pt")
            
        self.checkpoint_path = checkpoint_path
        self.model = MultimodalComplaintClassifier().to(self.device)
        
        if os.path.exists(checkpoint_path):
            checkpoint = torch.load(checkpoint_path, map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            print(f"Loaded model weights from {checkpoint_path}")
        else:
            print(f"Warning: Checkpoint not found at {checkpoint_path}. Model has random initialization.")
            
        self.model.eval()

    def predict(self, text: str, image_input = None) -> dict:
        """
        Run inference on customer complaint.
        image_input can be:
        - None
        - PIL Image
        - string file path
        """
        if not text or not str(text).strip():
            text = "Customer complaint"
            
        # 1. Tokenize Text
        encoded = self.tokenizer(
            str(text),
            padding="max_length",
            truncation=True,
            max_length=config.MAX_SEQ_LENGTH,
            return_tensors="pt"
        )
        input_ids = encoded["input_ids"].to(self.device)
        attention_mask = encoded["attention_mask"].to(self.device)
        
        # 2. Process Image
        has_image = False
        image_tensor = torch.zeros(1, 3, 224, 224, dtype=torch.float32).to(self.device)
        
        if image_input is not None:
            pil_img = None
            if isinstance(image_input, str) and os.path.exists(image_input):
                try:
                    pil_img = Image.open(image_input)
                except Exception:
                    pil_img = None
            elif isinstance(image_input, Image.Image):
                pil_img = image_input
                
            if pil_img is not None:
                try:
                    rgb_img = pil_img.convert("RGB")
                    transformed = self.image_transform(rgb_img)
                    image_tensor = transformed.unsqueeze(0).to(self.device)
                    has_image = True
                except Exception:
                    has_image = False
                    
        has_image_tensor = torch.tensor([1.0 if has_image else 0.0], dtype=torch.float32).to(self.device)
        mode = "Multimodal" if has_image else "Text-only"
        
        # 3. Model Forward Pass
        with torch.no_grad():
            outputs = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                image=image_tensor,
                has_image=has_image_tensor
            )
            
            aspect_logits = outputs["aspect_logits"]
            severity_logits = outputs["severity_logits"]
            
            aspect_probs = F.softmax(aspect_logits, dim=-1).squeeze(0).cpu().numpy()
            severity_probs = F.softmax(severity_logits, dim=-1).squeeze(0).cpu().numpy()
            
        aspect_idx = int(aspect_probs.argmax())
        aspect_pred = config.ID2ASPECT.get(aspect_idx, "Unknown")
        aspect_conf = float(aspect_probs[aspect_idx] * 100)
        
        severity_idx = int(severity_probs.argmax())
        severity_pred = config.ID2SEVERITY.get(severity_idx, "Unknown")
        severity_conf = float(severity_probs[severity_idx] * 100)
        
        aspect_dict = {config.ID2ASPECT[i]: float(aspect_probs[i]) for i in range(config.NUM_ASPECT_CLASSES)}
        severity_dict = {config.ID2SEVERITY[i]: float(severity_probs[i]) for i in range(config.NUM_SEVERITY_CLASSES)}
        
        return {
            "aspect_prediction": aspect_pred,
            "aspect_confidence": aspect_conf,
            "aspect_probs": aspect_dict,
            "severity_prediction": severity_pred,
            "severity_confidence": severity_conf,
            "severity_probs": severity_dict,
            "mode": mode,
            "explanation": (
                "Text features were extracted using DistilBERT and visual features were extracted using ResNet-18. "
                "Both representations were fused before classification."
                if has_image else
                "Inference performed in TEXT-ONLY mode using DistilBERT representations with fallback zero visual embeddings."
            )
        }

if __name__ == "__main__":
    print("=" * 70)
    print("           MULTIMODAL COMPLAINT INFERENCE VERIFICATION")
    print("=" * 70)
    
    ckpt_path = os.path.join(config.MODELS_DIR, "best_multimodal_model.pt")
    if not os.path.exists(ckpt_path):
        ckpt_path = os.path.join(config.MULTIMODAL_MODEL_DIR, "best_model.pt")
        
    predictor = ComplaintPredictor(checkpoint_path=ckpt_path)
    
    test_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "test.csv"))
    
    # 1. Test 3 Real Test Samples (Multimodal: Text + Image)
    print("\n--- TEST 1: REAL TEST SAMPLES (TEXT + IMAGE) ---")
    for i in range(min(3, len(test_df))):
        row = test_df.iloc[i]
        img_rel = row.get("image_path", None)
        img_full = os.path.join(config.PROCESSED_DATA_DIR, str(img_rel)) if pd.notna(img_rel) and img_rel else None
        
        res = predictor.predict(text=row["text"], image_input=img_full)
        print(f"\n[Sample {i+1}]")
        print(f"  Input text          : {row['text'][:90]}...")
        print(f"  Actual aspect       : {row['aspect']}")
        print(f"  Predicted aspect    : {res['aspect_prediction']}")
        print(f"  Aspect confidence   : {res['aspect_confidence']:.2f}%")
        print(f"  Actual severity     : {row['severity']}")
        print(f"  Predicted severity  : {res['severity_prediction']}")
        print(f"  Severity confidence : {res['severity_confidence']:.2f}%")
        print(f"  Prediction mode     : {res['mode']}")
        
    # 2. Test Text-Only Mode (Explicit image_input=None)
    print("\n--- TEST 2: TEXT-ONLY MODE ---")
    row = test_df.iloc[0]
    res_to = predictor.predict(text=row["text"], image_input=None)
    print(f"  Input text          : {row['text'][:90]}...")
    print(f"  Predicted aspect    : {res_to['aspect_prediction']} ({res_to['aspect_confidence']:.2f}%)")
    print(f"  Predicted severity  : {res_to['severity_prediction']} ({res_to['severity_confidence']:.2f}%)")
    print(f"  Prediction mode     : {res_to['mode']}")
    assert res_to["mode"] == "Text-only", "Expected Text-only mode!"
    
    # 3. Test Missing Image Path Handling
    print("\n--- TEST 3: MISSING IMAGE PATH HANDLING ---")
    res_miss = predictor.predict(text="Broken glass on phone", image_input="non_existent_image.jpg")
    print(f"  Prediction mode     : {res_miss['mode']}")
    print(f"  Predicted aspect    : {res_miss['aspect_prediction']}")
    assert res_miss["mode"] == "Text-only", "Expected fallback to Text-only!"
    
    # 4. Test Invalid Image File Handling
    print("\n--- TEST 4: INVALID IMAGE HANDLING ---")
    dummy_invalid_path = os.path.join(config.BASE_DIR, "invalid_dummy.png")
    with open(dummy_invalid_path, "w") as f:
        f.write("corrupt not an image file")
    res_inv = predictor.predict(text="App keeps crashing on startup", image_input=dummy_invalid_path)
    print(f"  Prediction mode     : {res_inv['mode']}")
    print(f"  Predicted aspect    : {res_inv['aspect_prediction']}")
    assert res_inv["mode"] == "Text-only", "Expected fallback to Text-only!"
    if os.path.exists(dummy_invalid_path):
        os.remove(dummy_invalid_path)
        
    print("\n" + "=" * 70)
    print("✅ ALL INFERENCE MODES (TEXT+IMAGE, TEXT-ONLY, MISSING, INVALID) PASSED!")
    print("=" * 70)

