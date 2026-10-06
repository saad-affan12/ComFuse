import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import re
import html
import json
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.model_selection import train_test_split
from datasets import load_dataset

import config

def clean_text(text: str) -> str:
    """Robust text cleaning for Transformer input."""
    if not isinstance(text, str) or not text.strip():
        return ""
    # Decode HTML entities (e.g., &gt;, &lt;, &amp;)
    text = html.unescape(text)
    # Normalize excessive newlines and whitespace
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()

def normalize_aspect(raw_aspect: str) -> str:
    """
    Map raw noisy aspect labels into primary classes:
    ['Software', 'Hardware', 'Quality', 'Service', 'Price', 'Packaging']
    """
    s = str(raw_aspect).strip().lower()
    # Correct common typos
    s = s.replace("sofware", "software").replace("sevice", "service").replace("qualtiy", "quality")
    # Split by separators
    tokens = re.split(r'[\n\s.,/&]+', s)
    tokens = [t for t in tokens if t]
    
    valid_aspects = ["software", "hardware", "quality", "service", "price", "packaging"]
    for t in tokens:
        if t in valid_aspects:
            return t.capitalize()
    return "Other"

def normalize_severity(raw_severity: str) -> str:
    """
    Map raw severity strings into the 4 canonical complaint severity levels:
    ['No Explicit Reproach', 'Disapproval', 'Accusation', 'Blame']
    """
    s = str(raw_severity).strip()
    s = re.sub(r'\s+', ' ', s)
    if "Blame" in s:
        return "Blame"
    elif "Disapproval" in s:
        return "Disapproval"
    elif "Accusation" in s:
        return "Accusation"
    elif "No Explicit Reproach" in s:
        return "No Explicit Reproach"
    return s

def run_preprocessing():
    """Main preprocessing pipeline."""
    print("=" * 60)
    print("STARTING DATA PREPROCESSING & CLEANING")
    print("=" * 60)
    
    os.makedirs(config.PROCESSED_DATA_DIR, exist_ok=True)
    os.makedirs(config.IMAGES_DIR, exist_ok=True)
    
    # 1. Load dataset
    print(f"Loading Hugging Face dataset '{config.HF_DATASET_NAME}'...")
    ds = load_dataset(config.HF_DATASET_NAME)["train"]
    print(f"Loaded raw samples: {len(ds)}")
    
    raw_aspects = [item["aspect"] for item in ds]
    raw_severities = [item["severity"] for item in ds]
    
    records = []
    missing_images_count = 0
    saved_images_count = 0
    
    mapping_aspect_dict = {}
    mapping_severity_dict = {}
    
    for i, item in enumerate(ds):
        thread_id = item.get("thread_id", i)
        raw_txt = item.get("text", "")
        cleaned_txt = clean_text(raw_txt)
        if not cleaned_txt:
            continue
            
        raw_asp = item.get("aspect", "")
        asp = normalize_aspect(raw_asp)
        mapping_aspect_dict[str(raw_asp)] = asp
        
        raw_sev = item.get("severity", "")
        sev = normalize_severity(raw_sev)
        mapping_severity_dict[str(raw_sev)] = sev
        
        # Process and save image
        img_obj = item.get("image_path", None)
        local_img_rel_path = None
        
        if img_obj is not None and isinstance(img_obj, Image.Image):
            img_filename = f"sample_{i:04d}_thread_{thread_id}.jpg"
            img_dest = os.path.join(config.IMAGES_DIR, img_filename)
            try:
                # Convert to RGB to handle RGBA or palette modes
                rgb_img = img_obj.convert("RGB")
                rgb_img.save(img_dest, format="JPEG", quality=90)
                local_img_rel_path = os.path.join("images", img_filename)
                saved_images_count += 1
            except Exception as e:
                print(f"Warning: Failed to save image for sample {i}: {e}")
                missing_images_count += 1
        else:
            missing_images_count += 1
            
        records.append({
            "sample_id": i,
            "thread_id": thread_id,
            "text": cleaned_txt,
            "image_path": local_img_rel_path,
            "aspect": asp,
            "aspect_id": config.ASPECT2ID.get(asp, -1),
            "severity": sev,
            "severity_id": config.SEVERITY2ID.get(sev, -1),
            "has_image": local_img_rel_path is not None
        })
        
    df = pd.DataFrame(records)
    print(f"\nTotal cleaned records: {len(df)}")
    print(f"Images saved: {saved_images_count}, Missing/None images: {missing_images_count}")
    
    # 2. Print Label Mapping Details
    print("\n--- ORIGINAL TO NORMALIZED ASPECT MAPPING ---")
    for raw_k, norm_v in sorted(mapping_aspect_dict.items(), key=lambda x: str(x[0])):
        print(f"  {repr(raw_k)} -> '{norm_v}'")
        
    print("\n--- ORIGINAL TO NORMALIZED SEVERITY MAPPING ---")
    for raw_k, norm_v in sorted(mapping_severity_dict.items(), key=lambda x: str(x[0])):
        print(f"  {repr(raw_k)} -> '{norm_v}'")
        
    print("\nCleaned Aspect Distribution:")
    print(df["aspect"].value_counts())
    
    print("\nCleaned Severity Distribution:")
    print(df["severity"].value_counts())
    
    # 3. Stratified Train / Val / Test Split (70% / 15% / 15%)
    # First split: 70% Train, 30% Temp (Val + Test)
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=config.SEED,
        stratify=df["aspect"]
    )
    
    # Second split: 15% Val, 15% Test (50% of 30%)
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=config.SEED,
        stratify=temp_df["aspect"]
    )
    
    print("\n--- SPLIT STATISTICS ---")
    print(f"Train samples: {len(train_df)} ({len(train_df)/len(df)*100:.1f}%)")
    print(f"Validation samples: {len(val_df)} ({len(val_df)/len(df)*100:.1f}%)")
    print(f"Test samples: {len(test_df)} ({len(test_df)/len(df)*100:.1f}%)")
    
    print("\nAspect distribution in Train split:")
    print(train_df["aspect"].value_counts())
    print("\nAspect distribution in Val split:")
    print(val_df["aspect"].value_counts())
    print("\nAspect distribution in Test split:")
    print(test_df["aspect"].value_counts())
    
    # 4. Save to Disk
    full_csv_path = os.path.join(config.PROCESSED_DATA_DIR, "full_cleaned.csv")
    train_csv_path = os.path.join(config.PROCESSED_DATA_DIR, "train.csv")
    val_csv_path = os.path.join(config.PROCESSED_DATA_DIR, "val.csv")
    validation_csv_path = os.path.join(config.PROCESSED_DATA_DIR, "validation.csv")
    test_csv_path = os.path.join(config.PROCESSED_DATA_DIR, "test.csv")
    mappings_json_path = os.path.join(config.PROCESSED_DATA_DIR, "label_mappings.json")
    
    df.to_csv(full_csv_path, index=False)
    train_df.to_csv(train_csv_path, index=False)
    val_df.to_csv(val_csv_path, index=False)
    val_df.to_csv(validation_csv_path, index=False)
    test_df.to_csv(test_csv_path, index=False)
    
    mappings_data = {
        "aspect2id": config.ASPECT2ID,
        "id2aspect": config.ID2ASPECT,
        "severity2id": config.SEVERITY2ID,
        "id2severity": config.ID2SEVERITY,
        "raw_aspect_mapping": mapping_aspect_dict,
        "raw_severity_mapping": mapping_severity_dict,
        "aspect_classes": config.ASPECT_CLASSES,
        "severity_classes": config.SEVERITY_CLASSES
    }
    with open(mappings_json_path, "w", encoding="utf-8") as f:
        json.dump(mappings_data, f, indent=2)
        
    # Generate Preprocessing Report (outputs/data_report.json)
    os.makedirs(config.OUTPUTS_DIR, exist_ok=True)
    report_data = {
        "total_samples": len(ds),
        "valid_samples": len(df),
        "removed_samples": len(ds) - len(df),
        "missing_text_count": int((df["text"].str.strip() == "").sum()),
        "missing_image_count": missing_images_count,
        "saved_images_count": saved_images_count,
        "aspect_distribution": df["aspect"].value_counts().to_dict(),
        "severity_distribution": df["severity"].value_counts().to_dict(),
        "splits": {
            "train": len(train_df),
            "validation": len(val_df),
            "test": len(test_df)
        }
    }
    report_json_path = os.path.join(config.OUTPUTS_DIR, "data_report.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
        
    print(f"\nProcessed data saved to {config.PROCESSED_DATA_DIR}")
    print(f"Data report saved to {report_json_path}")
    print("Files created: full_cleaned.csv, train.csv, val.csv, validation.csv, test.csv, label_mappings.json, data_report.json")
    print("Preprocessing completed successfully!")
    return train_df, val_df, test_df

if __name__ == "__main__":
    run_preprocessing()
