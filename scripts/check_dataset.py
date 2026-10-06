"""Dataset Sanity Check Script for Multimodal Customer Complaint Classification."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pandas as pd
from PIL import Image
import config

def verify_dataset():
    print("=" * 65)
    print("     DATASET SANITY CHECK & INTEGRITY VERIFICATION")
    print("=" * 65)
    
    train_path = os.path.join(config.PROCESSED_DATA_DIR, "train.csv")
    val_path = os.path.join(config.PROCESSED_DATA_DIR, "val.csv")
    if not os.path.exists(val_path):
        val_path = os.path.join(config.PROCESSED_DATA_DIR, "validation.csv")
    test_path = os.path.join(config.PROCESSED_DATA_DIR, "test.csv")
    
    for p, name in [(train_path, "Train"), (val_path, "Validation"), (test_path, "Test")]:
        if not os.path.exists(p):
            print(f"❌ Error: {name} split not found at {p}")
            sys.exit(1)
            
    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    test_df = pd.read_csv(test_path)
    
    # 1. Sample Counts
    print(f"Train split samples      : {len(train_df)}")
    print(f"Validation split samples : {len(val_df)}")
    print(f"Test split samples       : {len(test_df)}")
    total = len(train_df) + len(val_df) + len(test_df)
    print(f"Total dataset samples    : {total}")
    print("-" * 65)
    
    # 2. Leakage Verification (Overlap check)
    train_ids = set(train_df["thread_id"].tolist())
    val_ids = set(val_df["thread_id"].tolist())
    test_ids = set(test_df["thread_id"].tolist())
    
    train_val_overlap = train_ids.intersection(val_ids)
    train_test_overlap = train_ids.intersection(test_ids)
    val_test_overlap = val_ids.intersection(test_ids)
    
    print("Data Leakage Check:")
    print(f"  Train / Validation Overlap: {len(train_val_overlap)} samples")
    print(f"  Train / Test Overlap      : {len(train_test_overlap)} samples")
    print(f"  Validation / Test Overlap : {len(val_test_overlap)} samples")
    assert len(train_val_overlap) == 0, "Train and Validation split overlap detected!"
    assert len(train_test_overlap) == 0, "Train and Test split overlap detected!"
    assert len(val_test_overlap) == 0, "Validation and Test split overlap detected!"
    print("  --> No data leakage found across splits.")
    print("-" * 65)
    
    # 3. Label Distributions
    print("Train Aspect Distribution:")
    print(train_df["aspect"].value_counts().to_dict())
    print("\nTrain Severity Distribution:")
    print(train_df["severity"].value_counts().to_dict())
    print("-" * 65)
    
    # 4. Check 5 Text Examples
    print("Inspecting 5 Text Samples:")
    for idx, row in test_df.head(5).iterrows():
        print(f"  [Sample {row['sample_id']}] Aspect: {row['aspect']:<10} | Severity: {row['severity']:<20}")
        print(f"   Text: {row['text'][:90]}...")
    print("-" * 65)
    
    # 5. Check 5 Images & Dimensions
    print("Inspecting 5 Image Samples:")
    tested_images = 0
    for idx, row in test_df.iterrows():
        img_rel = row.get("image_path", None)
        if pd.notna(img_rel) and img_rel:
            full_img_path = os.path.join(config.PROCESSED_DATA_DIR, str(img_rel))
            if os.path.exists(full_img_path):
                with Image.open(full_img_path) as im:
                    print(f"  [Image {row['sample_id']}] File: {os.path.basename(full_img_path)} | Mode: {im.mode} | Size: {im.size}")
                    assert im.size[0] > 0 and im.size[1] > 0, "Invalid image dimensions!"
                tested_images += 1
                if tested_images >= 5:
                    break
    assert tested_images >= 5, "Could not test at least 5 images!"
    print(f"  --> Successfully verified {tested_images} test images.")
    print("=" * 65)
    print("✅ DATASET SANITY CHECK SUCCESSFUL - ALL DATA VERIFIED")
    print("=" * 65)

if __name__ == "__main__":
    verify_dataset()
