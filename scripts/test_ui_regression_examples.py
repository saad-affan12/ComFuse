"""Test the 5 UI regression examples + thread_id 82 with both text and actual images."""
import os
import sys
import json
import pandas as pd
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config
from src.inference import ComplaintPredictor
from backend.main import REAL_EXAMPLES

def test_regression():
    print("=" * 80)
    print("UI REGRESSION EXAMPLES EVALUATION (REAL IMAGES + TEXT)")
    print("=" * 80)

    predictor = ComplaintPredictor()
    demo_img_dir = os.path.join(BASE_DIR, "assets", "demo_images")
    
    results = []
    for i, ex in enumerate(REAL_EXAMPLES):
        img_name = ex.get("image_filename")
        img_path = os.path.join(demo_img_dir, img_name) if img_name else None
        
        # Test multimodal if image exists, else text-only
        res = predictor.predict(text=ex["text"], image_input=img_path)
        
        is_aspect_correct = (res["aspect_prediction"] == ex["aspect"])
        is_severity_correct = (res["severity_prediction"] == ex["severity"])
        
        print(f"\n--- [Example {i+1}: {ex['id']} - {ex['title']}] ---")
        print(f"Image: {img_name} (exists: {os.path.exists(img_path) if img_path else False})")
        print(f"Text: {ex['text'][:90]}...")
        print(f"Ground Truth Aspect:   {ex['aspect']}")
        print(f"Predicted Aspect:      {res['aspect_prediction']} (Conf: {res['aspect_confidence']:.2f}%) -> {'[CORRECT]' if is_aspect_correct else '[INCORRECT]'}")
        print(f"Ground Truth Severity: {ex['severity']}")
        print(f"Predicted Severity:    {res['severity_prediction']} (Conf: {res['severity_confidence']:.2f}%) -> {'[CORRECT]' if is_severity_correct else '[INCORRECT]'}")
        print(f"Inference Mode:        {res['mode']}")

        results.append({
            "example_id": ex["id"],
            "title": ex["title"],
            "image": img_name or "None",
            "gt_aspect": ex["aspect"],
            "pred_aspect": res["aspect_prediction"],
            "aspect_conf": f"{res['aspect_confidence']:.2f}%",
            "aspect_status": "CORRECT" if is_aspect_correct else "INCORRECT",
            "gt_severity": ex["severity"],
            "pred_severity": res["severity_prediction"],
            "severity_conf": f"{res['severity_confidence']:.2f}%",
            "severity_status": "CORRECT" if is_severity_correct else "INCORRECT",
            "mode": res["mode"]
        })

    # Test thread_id 82
    text_82 = (
        "Tweet 1. @117457 We'd be concerned with an unresponsive device too. "
        "Let us know your iOS version in DM and we'll help: https://t.co/GDrqU22YpT "
        "Tweet 2. @116333 @115858 can your team let me know why my new iPhone 6 always has hanging problem "
        "I do not know what the problem is by I know I feel I am cheated by apple for phone do I ?"
    )
    res_82 = predictor.predict(text=text_82)
    is_a82 = (res_82["aspect_prediction"] == "Quality")
    is_s82 = (res_82["severity_prediction"] == "Blame")
    print(f"\n--- [Regression Sample: thread_id 82] ---")
    print(f"Ground Truth Aspect:   Quality")
    print(f"Predicted Aspect:      {res_82['aspect_prediction']} (Conf: {res_82['aspect_confidence']:.2f}%) -> {'[CORRECT]' if is_a82 else '[INCORRECT]'}")
    print(f"Ground Truth Severity: Blame")
    print(f"Predicted Severity:    {res_82['severity_prediction']} (Conf: {res_82['severity_confidence']:.2f}%) -> {'[CORRECT]' if is_s82 else '[INCORRECT]'}")
    
    results.append({
        "example_id": "thread_82",
        "title": "Unresponsive iPhone 6 Hanging",
        "image": "None",
        "gt_aspect": "Quality",
        "pred_aspect": res_82["aspect_prediction"],
        "aspect_conf": f"{res_82['aspect_confidence']:.2f}%",
        "aspect_status": "CORRECT" if is_a82 else "INCORRECT",
        "gt_severity": "Blame",
        "pred_severity": res_82["severity_prediction"],
        "severity_conf": f"{res_82['severity_confidence']:.2f}%",
        "severity_status": "CORRECT" if is_s82 else "INCORRECT",
        "mode": res_82["mode"]
    })

    df = pd.DataFrame(results)
    out_csv = os.path.join(config.OUTPUTS_DIR, "ui_regression_test_results.csv")
    df.to_csv(out_csv, index=False)
    print(f"\nSaved regression test summary to: {out_csv}")
    print("\nSUMMARY TABLE:")
    print(df[["example_id", "gt_aspect", "pred_aspect", "aspect_status", "gt_severity", "pred_severity", "severity_status"]].to_string(index=False))

if __name__ == "__main__":
    test_regression()
