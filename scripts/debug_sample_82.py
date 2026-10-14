import os
import sys
import torch
import torch.nn.functional as F
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config
from src.inference import ComplaintPredictor

def debug_sample():
    print("=" * 70)
    print("PHASE 2 & 4 AUDIT: CHECKPOINT & SAMPLE THREAD_ID 82")
    print("=" * 70)

    # 1. Inspect Checkpoint
    ckpt_path = os.path.join(config.MODELS_DIR, "best_multimodal_model.pt")
    print(f"Checkpoint path: {ckpt_path}")
    print(f"File exists: {os.path.exists(ckpt_path)}")
    if os.path.exists(ckpt_path):
        mtime = os.path.getmtime(ckpt_path)
        print(f"Modification time: {time.ctime(mtime)}")
        ckpt = torch.load(ckpt_path, map_location="cpu")
        print(f"Checkpoint keys: {list(ckpt.keys())}")
        print(f"Saved Aspect metrics: {ckpt.get('aspect_metrics')}")
        print(f"Saved Severity metrics: {ckpt.get('severity_metrics')}")
        print(f"Saved Val Score: {ckpt.get('val_score')}")
        print(f"Saved Config: {ckpt.get('config')}")

    # 2. Inspect Predictor Loading
    predictor = ComplaintPredictor(checkpoint_path=ckpt_path)
    print(f"Predictor model training mode: {predictor.model.training} (should be False)")

    # 3. Sample details
    text = (
        "Tweet 1. @117457 We'd be concerned with an unresponsive device too. "
        "Let us know your iOS version in DM and we'll help: https://t.co/GDrqU22YpT "
        "Tweet 2. @116333 @115858 can your team let me know why my new iPhone 6 always has hanging problem "
        "I do not know what the problem is by I know I feel I am cheated by apple for phone do I ?"
    )
    print(f"\nGround Truth for thread_id 82:")
    print("  Aspect: Quality")
    print("  Severity: Blame")

    # 4. Forward pass step by step to log raw logits
    encoded = predictor.tokenizer(
        text,
        padding="max_length",
        truncation=True,
        max_length=config.MAX_SEQ_LENGTH,
        return_tensors="pt"
    )
    input_ids = encoded["input_ids"].to(predictor.device)
    attention_mask = encoded["attention_mask"].to(predictor.device)
    image_tensor = torch.zeros(1, 3, 224, 224, dtype=torch.float32).to(predictor.device)
    has_image_tensor = torch.tensor([0.0], dtype=torch.float32).to(predictor.device)

    with torch.no_grad():
        outputs = predictor.model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            image=image_tensor,
            has_image=has_image_tensor
        )
        aspect_logits = outputs["aspect_logits"]
        severity_logits = outputs["severity_logits"]
        aspect_probs = F.softmax(aspect_logits, dim=-1).squeeze(0)
        severity_probs = F.softmax(severity_logits, dim=-1).squeeze(0)

    print("\n--- RAW MODEL OUTPUTS ---")
    print(f"Aspect Logits:   {aspect_logits.squeeze(0).cpu().numpy()}")
    print(f"Severity Logits: {severity_logits.squeeze(0).cpu().numpy()}")
    print(f"Aspect Probs:    {aspect_probs.cpu().numpy()}")
    print(f"Severity Probs:  {severity_probs.cpu().numpy()}")

    res = predictor.predict(text=text)
    print("\n--- HIGH-LEVEL PREDICTION DICT ---")
    print(f"Predicted Aspect:   {res['aspect_prediction']} ({res['aspect_confidence']:.2f}%)")
    print(f"Aspect Dist:        {res['aspect_probs']}")
    print(f"Predicted Severity: {res['severity_prediction']} ({res['severity_confidence']:.2f}%)")
    print(f"Severity Dist:      {res['severity_probs']}")

if __name__ == "__main__":
    import time
    debug_sample()
