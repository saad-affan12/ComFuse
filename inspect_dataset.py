"""Dataset inspection script for NShreya/Comp4.0"""
import os
import json
import pandas as pd
from datasets import load_dataset
from PIL import Image

def inspect():
    print("=" * 60)
    print("STEP 1: LOADING DATASET NShreya/Comp4.0 FROM HUGGINGFACE")
    print("=" * 60)
    
    try:
        ds = load_dataset("NShreya/Comp4.0")
        print(f"Dataset successfully loaded. Splits available: {list(ds.keys())}")
    except Exception as e:
        print(f"Error loading dataset directly: {e}")
        return

    for split in ds.keys():
        print(f"\n--- Split: {split} ({len(ds[split])} samples) ---")
        print(f"Features: {ds[split].features}")
        df = ds[split].to_pandas()
        print(f"DataFrame columns: {df.columns.tolist()}")
        print(f"Missing values per column:\n{df.isnull().sum()}")
        
        # Check aspect and severity columns
        for col in df.columns:
            if 'aspect' in col.lower():
                print(f"\nUnique values in '{col}' ({df[col].nunique()}):")
                print(df[col].value_counts(dropna=False))
            elif 'severity' in col.lower():
                print(f"\nUnique values in '{col}' ({df[col].nunique()}):")
                print(df[col].value_counts(dropna=False))
        
        # Check image column / image formats
        img_cols = [c for c in df.columns if 'image' in c.lower() or 'img' in c.lower() or 'pic' in c.lower()]
        print(f"\nPotential Image Columns: {img_cols}")
        for ic in img_cols:
            sample_val = df[ic].iloc[0] if len(df) > 0 else None
            print(f"Sample value in '{ic}': {type(sample_val)} -> {sample_val if not isinstance(sample_val, (dict, list, Image.Image)) else str(type(sample_val))}")
        
        # Print sample records
        print("\nSample Record 0:")
        rec = ds[split][0]
        for k, v in rec.items():
            if isinstance(v, Image.Image):
                print(f"  {k}: PIL Image size={v.size}, mode={v.mode}")
            elif isinstance(v, (str, int, float, bool)) or v is None:
                print(f"  {k}: {repr(v)[:120]}")
            else:
                print(f"  {k}: {type(v)}")

if __name__ == "__main__":
    inspect()
