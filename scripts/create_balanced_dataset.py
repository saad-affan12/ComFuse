"""Balanced training dataset generator and sampling strategy evaluator.
Generates:
  - balanced_train_manifest.csv
  - visual comparison of original vs balanced training distributions
  - sampling weight strategies (Strategy A, B, C)
"""
import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config

EXPERIMENT_DIR = os.path.join(BASE_DIR, "experiments")
os.makedirs(EXPERIMENT_DIR, exist_ok=True)
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

def generate_balanced_train_dataset(seed=42):
    train_path = os.path.join(config.PROCESSED_DATA_DIR, "train.csv")
    df_train = pd.read_csv(train_path)
    
    np.random.seed(seed)
    
    print(f"Original Training Samples: {len(df_train)}")
    print("Original Training Aspect Counts:")
    print(df_train["aspect"].value_counts())
    print("\nOriginal Training Severity Counts:")
    print(df_train["severity"].value_counts())

    # Strategy C + B: Controlled Software Undersampling + Moderate Minority Oversampling
    # 1. Undersample Software from 485 to 220 samples, preserving severity distribution within Software
    sw_df = df_train[df_train["aspect"] == "Software"]
    # Stratified sampling within Software across Severity
    sw_sampled = sw_df.groupby("severity", group_keys=False).apply(
        lambda g: g.sample(frac=220.0 / len(sw_df), random_state=seed)
    )
    # Ensure exact sample count
    if len(sw_sampled) > 220:
        sw_sampled = sw_sampled.sample(n=220, random_state=seed)
    elif len(sw_sampled) < 220:
        remaining = sw_df.drop(sw_sampled.index)
        sw_sampled = pd.concat([sw_sampled, remaining.sample(n=220 - len(sw_sampled), random_state=seed)])

    # 2. Moderate Oversampling of Minorities (real samples duplicated with tracking)
    # Target counts:
    # Hardware (orig 63): target 95 (~1.5x)
    # Quality (orig 40): target 80 (2.0x)
    # Service (orig 39): target 78 (2.0x)
    # Price (orig 7): target 28 (4.0x) - note: limited unique samples (7)
    # Packaging (orig 6): target 24 (4.0x) - note: limited unique samples (6)
    
    targets = {
        "Hardware": 95,
        "Quality": 80,
        "Service": 78,
        "Price": 28,
        "Packaging": 24
    }
    
    minority_dfs = []
    for aspect_name, target_count in targets.items():
        asp_df = df_train[df_train["aspect"] == aspect_name]
        orig_count = len(asp_df)
        if orig_count == 0:
            continue
        # Sample with replacement to reach target_count
        sampled = asp_df.sample(n=target_count, replace=True, random_state=seed)
        minority_dfs.append(sampled)
        
    df_balanced_train = pd.concat([sw_sampled] + minority_dfs, ignore_index=True)
    df_balanced_train = df_balanced_train.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    
    print("\n" + "="*60)
    print(f"Balanced Training Dataset Created: {len(df_balanced_train)} samples")
    print("="*60)
    print("Balanced Aspect Counts:")
    print(df_balanced_train["aspect"].value_counts())
    print("\nBalanced Severity Counts:")
    print(df_balanced_train["severity"].value_counts())
    
    # Save balanced training dataset and manifest
    balanced_dir = os.path.join(EXPERIMENT_DIR, "balanced_data")
    os.makedirs(balanced_dir, exist_ok=True)
    
    balanced_train_file = os.path.join(balanced_dir, "train_balanced.csv")
    df_balanced_train.to_csv(balanced_train_file, index=False)
    
    manifest_rows = []
    for idx, row in df_balanced_train.iterrows():
        manifest_rows.append({
            "balanced_index": idx,
            "original_sample_id": row["sample_id"],
            "thread_id": row.get("thread_id", ""),
            "aspect": row["aspect"],
            "aspect_id": row["aspect_id"],
            "severity": row["severity"],
            "severity_id": row["severity_id"],
            "is_duplicate": bool(df_balanced_train["sample_id"].iloc[:idx].isin([row["sample_id"]]).any()),
            "image_available": False
        })
    manifest_df = pd.DataFrame(manifest_rows)
    
    manifest_path_exp = os.path.join(EXPERIMENT_DIR, "balanced_train_manifest.csv")
    manifest_path_out = os.path.join(OUTPUTS_DIR, "balanced_train_manifest.csv")
    manifest_df.to_csv(manifest_path_exp, index=False)
    manifest_df.to_csv(manifest_path_out, index=False)
    print(f"Saved: {manifest_path_exp}")

    # Generate Visual Comparison: Original vs Balanced Training Distribution
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # Aspect Comparison
    orig_asp = [len(df_train[df_train["aspect"] == a]) for a in config.ASPECT_CLASSES]
    bal_asp = [len(df_balanced_train[df_balanced_train["aspect"] == a]) for a in config.ASPECT_CLASSES]
    
    orig_asp_pct = [c / len(df_train) * 100 for c in orig_asp]
    bal_asp_pct = [c / len(df_balanced_train) * 100 for c in bal_asp]
    
    x = np.arange(len(config.ASPECT_CLASSES))
    width = 0.35
    
    # Aspect Counts
    axes[0, 0].bar(x - width/2, orig_asp, width, label="Original Train (N=640)", color="#2b5c8f")
    axes[0, 0].bar(x + width/2, bal_asp, width, label="Balanced Train (N=525)", color="#e6550d")
    axes[0, 0].set_title("Aspect Sample Counts: Original vs Balanced Train", fontsize=12, fontweight="bold")
    axes[0, 0].set_xticks(x)
    axes[0, 0].set_xticklabels(config.ASPECT_CLASSES, rotation=15)
    axes[0, 0].set_ylabel("Count")
    axes[0, 0].legend()
    axes[0, 0].grid(axis="y", linestyle="--", alpha=0.7)
    
    # Aspect Percentages
    axes[0, 1].bar(x - width/2, orig_asp_pct, width, label="Original Train %", color="#2b5c8f")
    axes[0, 1].bar(x + width/2, bal_asp_pct, width, label="Balanced Train %", color="#e6550d")
    axes[0, 1].set_title("Aspect Share (%): Original vs Balanced Train", fontsize=12, fontweight="bold")
    axes[0, 1].set_xticks(x)
    axes[0, 1].set_xticklabels(config.ASPECT_CLASSES, rotation=15)
    axes[0, 1].set_ylabel("Percentage (%)")
    axes[0, 1].legend()
    axes[0, 1].grid(axis="y", linestyle="--", alpha=0.7)
    for i, v in enumerate(orig_asp_pct):
        axes[0, 1].text(i - width/2, v + 1, f"{v:.1f}%", ha="center", fontsize=8)
    for i, v in enumerate(bal_asp_pct):
        axes[0, 1].text(i + width/2, v + 1, f"{v:.1f}%", ha="center", fontsize=8)
    axes[0, 1].set_ylim(0, 85)

    # Severity Comparison
    orig_sev = [len(df_train[df_train["severity"] == s]) for s in config.SEVERITY_CLASSES]
    bal_sev = [len(df_balanced_train[df_balanced_train["severity"] == s]) for s in config.SEVERITY_CLASSES]
    orig_sev_pct = [c / len(df_train) * 100 for c in orig_sev]
    bal_sev_pct = [c / len(df_balanced_train) * 100 for c in bal_sev]
    
    xs = np.arange(len(config.SEVERITY_CLASSES))
    
    # Severity Counts
    axes[1, 0].bar(xs - width/2, orig_sev, width, label="Original Train (N=640)", color="#3182bd")
    axes[1, 0].bar(xs + width/2, bal_sev, width, label="Balanced Train (N=525)", color="#31a354")
    axes[1, 0].set_title("Severity Sample Counts: Original vs Balanced Train", fontsize=12, fontweight="bold")
    axes[1, 0].set_xticks(xs)
    axes[1, 0].set_xticklabels(config.SEVERITY_CLASSES, rotation=15)
    axes[1, 0].set_ylabel("Count")
    axes[1, 0].legend()
    axes[1, 0].grid(axis="y", linestyle="--", alpha=0.7)

    # Severity Percentages
    axes[1, 1].bar(xs - width/2, orig_sev_pct, width, label="Original Train %", color="#3182bd")
    axes[1, 1].bar(xs + width/2, bal_sev_pct, width, label="Balanced Train %", color="#31a354")
    axes[1, 1].set_title("Severity Share (%): Original vs Balanced Train", fontsize=12, fontweight="bold")
    axes[1, 1].set_xticks(xs)
    axes[1, 1].set_xticklabels(config.SEVERITY_CLASSES, rotation=15)
    axes[1, 1].set_ylabel("Percentage (%)")
    axes[1, 1].legend()
    axes[1, 1].grid(axis="y", linestyle="--", alpha=0.7)
    for i, v in enumerate(orig_sev_pct):
        axes[1, 1].text(i - width/2, v + 1, f"{v:.1f}%", ha="center", fontsize=8)
    for i, v in enumerate(bal_sev_pct):
        axes[1, 1].text(i + width/2, v + 1, f"{v:.1f}%", ha="center", fontsize=8)
    axes[1, 1].set_ylim(0, 45)

    plt.tight_layout()
    comp_chart_path = os.path.join(EXPERIMENT_DIR, "original_vs_balanced_distribution.png")
    plt.savefig(comp_chart_path, dpi=300)
    plt.savefig(os.path.join(OUTPUTS_DIR, "original_vs_balanced_distribution.png"), dpi=300)
    plt.close()
    print(f"Saved: {comp_chart_path}")

    return df_balanced_train

if __name__ == "__main__":
    generate_balanced_train_dataset()
