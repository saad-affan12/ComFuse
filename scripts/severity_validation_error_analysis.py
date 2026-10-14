"""Validation Error Analysis Script for Severity & Aspect.
Evaluates the 137-sample held-out validation set and produces:
  - validation_severity_error_analysis.csv (true label, pred label, confidence, text, thread_id, linguistic error category)
  - validation_aspect_error_analysis.csv (true label, pred label, confidence, text, thread_id)
  - Quantitative breakdown of error categories
"""
import os
import sys
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config
from src.inference import ComplaintPredictor

def analyze_validation_errors():
    print("=" * 80)
    print("VALIDATION SET ERROR ANALYSIS (137 SAMPLES)")
    print("=" * 80)

    val_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "val.csv"))
    predictor = ComplaintPredictor()

    severity_errors = []
    aspect_errors = []

    # Diagnostic keyword patterns
    accusation_keywords = ["cheated", "scam", "fraud", "stealing", "ripoff", "you broke", "ruining", "ruined", "why did you"]
    blame_keywords = ["your fault", "apple's fault", "blame", "due to your update", "because of update", "unacceptable", "fix this", "hate"]
    disapproval_keywords = ["annoying", "disappointed", "slow", "hanging", "not working", "fails", "terrible", "bad", "worst"]
    neutral_keywords = ["how do i", "can you help", "question", "settings", "update", "is there", "please help"]

    for idx, row in val_df.iterrows():
        text = str(row["text"])
        thread_id = row.get("thread_id", row.get("sample_id", idx))
        gt_aspect = row["aspect"]
        gt_severity = row["severity"]

        # Run inference
        res = predictor.predict(text=text)
        pred_asp = res["aspect_prediction"]
        pred_sev = res["severity_prediction"]
        asp_conf = res["aspect_confidence"]
        sev_conf = res["severity_confidence"]

        # 1. Severity Error Analysis
        if pred_sev != gt_severity:
            # Diagnose linguistic pattern
            lower_t = text.lower()
            detected_patterns = []
            if any(k in lower_t for k in accusation_keywords):
                detected_patterns.append("Accusatory Language")
            if any(k in lower_t for k in blame_keywords):
                detected_patterns.append("Blaming/Causal Language")
            if any(k in lower_t for k in disapproval_keywords):
                detected_patterns.append("General Disapproval/Flaw")
            if any(k in lower_t for k in neutral_keywords):
                detected_patterns.append("Neutral/Inquiry Style")

            # Diagnose boundary confusion type
            if {gt_severity, pred_sev} == {"Accusation", "Blame"}:
                error_type = "Accusation-Blame Semantic Overlap"
            elif {gt_severity, pred_sev} == {"Disapproval", "Blame"}:
                error_type = "Disapproval-Blame Boundary Ambiguity"
            elif {gt_severity, pred_sev} == {"Disapproval", "Accusation"}:
                error_type = "Disapproval-Accusation Ambiguity"
            elif "No Explicit Reproach" in [gt_severity, pred_sev]:
                error_type = "Polite/Reproach Boundary Mismatch"
            else:
                error_type = "Other"

            severity_errors.append({
                "thread_id": thread_id,
                "sample_id": row.get("sample_id", idx),
                "ground_truth_severity": gt_severity,
                "predicted_severity": pred_sev,
                "severity_confidence": round(sev_conf, 2),
                "error_type": error_type,
                "linguistic_markers": ", ".join(detected_patterns) if detected_patterns else "None detected",
                "text_snippet": text[:140] + ("..." if len(text) > 140 else "")
            })

        # 2. Aspect Error Analysis
        if pred_asp != gt_aspect:
            aspect_errors.append({
                "thread_id": thread_id,
                "sample_id": row.get("sample_id", idx),
                "ground_truth_aspect": gt_aspect,
                "predicted_aspect": pred_asp,
                "aspect_confidence": round(asp_conf, 2),
                "text_snippet": text[:140] + ("..." if len(text) > 140 else "")
            })

    # Save to CSV
    sev_err_df = pd.DataFrame(severity_errors)
    asp_err_df = pd.DataFrame(aspect_errors)

    sev_out_path = os.path.join(config.OUTPUTS_DIR, "validation_severity_error_analysis.csv")
    asp_out_path = os.path.join(config.OUTPUTS_DIR, "validation_aspect_error_analysis.csv")
    sev_err_df.to_csv(sev_out_path, index=False)
    asp_err_df.to_csv(asp_out_path, index=False)
    
    # Also save to experiments/
    sev_err_df.to_csv(os.path.join(config.BASE_DIR, "experiments", "validation_severity_error_analysis.csv"), index=False)
    asp_err_df.to_csv(os.path.join(config.BASE_DIR, "experiments", "validation_aspect_error_analysis.csv"), index=False)

    print(f"\nTotal Validation Samples: {len(val_df)}")
    print(f"Severity Errors: {len(sev_err_df)} / {len(val_df)} ({len(sev_err_df)/len(val_df)*100:.1f}%)")
    print(f"Aspect Errors:   {len(asp_err_df)} / {len(val_df)} ({len(asp_err_df)/len(val_df)*100:.1f}%)")
    
    print("\n--- SEVERITY ERROR BREAKDOWN BY ERROR TYPE ---")
    print(sev_err_df["error_type"].value_counts().to_string())

    print("\n--- TOP CONFUSION PAIRS IN SEVERITY ---")
    pairs = sev_err_df.groupby(["ground_truth_severity", "predicted_severity"]).size().reset_index(name="count")
    print(pairs.sort_values(by="count", ascending=False).to_string(index=False))

    print("\n--- SAMPLE REAL SEVERITY ERRORS (FIRST 5) ---")
    for _, r in sev_err_df.head(5).iterrows():
        print(f"  [Thread {r['thread_id']}] GT: {r['ground_truth_severity']} -> Pred: {r['predicted_severity']} ({r['severity_confidence']}%)")
        print(f"    Type: {r['error_type']} | Markers: {r['linguistic_markers']}")
        print(f"    Text: {r['text_snippet']}\n")

if __name__ == "__main__":
    analyze_validation_errors()
