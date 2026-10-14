"""Dataset inspection, distribution analysis, and manifest generation for ComFuse.
Generates:
  - original_class_distribution.csv
  - joint_aspect_severity_distribution.csv
  - split_manifest.csv
  - Visual charts of class imbalance
"""
import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config

EXPERIMENT_DIR = os.path.join(BASE_DIR, "experiments")
os.makedirs(EXPERIMENT_DIR, exist_ok=True)
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

def run_distribution_analysis():
    train_path = os.path.join(config.PROCESSED_DATA_DIR, "train.csv")
    val_path = os.path.join(config.PROCESSED_DATA_DIR, "val.csv")
    test_path = os.path.join(config.PROCESSED_DATA_DIR, "test.csv")
    full_path = os.path.join(config.PROCESSED_DATA_DIR, "full_cleaned.csv")

    df_train = pd.read_csv(train_path)
    df_val = pd.read_csv(val_path)
    df_test = pd.read_csv(test_path)
    
    df_train["split"] = "train"
    df_val["split"] = "val"
    df_test["split"] = "test"
    
    # Combined dataset with split indicator
    df_all = pd.concat([df_train, df_val, df_test], ignore_index=True)
    
    print(f"Total samples across splits: {len(df_all)}")
    print(f"Columns: {list(df_all.columns)}")
    print(f"Splits breakdown: Train={len(df_train)}, Val={len(df_val)}, Test={len(df_test)}")

    # Check image availability on disk
    def check_image_exists(rel_path):
        if pd.isna(rel_path) or not str(rel_path).strip():
            return False
        full_p = os.path.join(config.PROCESSED_DATA_DIR, str(rel_path))
        return os.path.exists(full_p)

    df_all["image_available_on_disk"] = df_all["image_path"].apply(check_image_exists)
    df_all["has_valid_text"] = df_all["text"].apply(lambda t: bool(pd.notna(t) and str(t).strip()))

    # 1. ORIGINAL CLASS DISTRIBUTION REPORT
    # For Aspect classes and Severity classes:
    # - Number of samples
    # - Percentage of the dataset
    # - Missing or invalid samples
    # - Number of unique thread IDs
    # - Number of available images
    rows = []
    total_samples = len(df_all)

    # Aspect classes
    for asp in config.ASPECT_CLASSES:
        sub = df_all[df_all["aspect"] == asp]
        count = len(sub)
        pct = (count / total_samples) * 100.0 if total_samples > 0 else 0.0
        missing_text = (sub["has_valid_text"] == False).sum()
        unique_threads = sub["thread_id"].nunique() if "thread_id" in sub.columns else sub["sample_id"].nunique()
        avail_images = sub["image_available_on_disk"].sum()
        rows.append({
            "target_type": "Aspect",
            "class_name": asp,
            "class_id": config.ASPECT2ID[asp],
            "sample_count": count,
            "percentage": round(pct, 2),
            "train_count": len(df_train[df_train["aspect"] == asp]),
            "val_count": len(df_val[df_val["aspect"] == asp]),
            "test_count": len(df_test[df_test["aspect"] == asp]),
            "missing_or_invalid_samples": missing_text,
            "unique_thread_ids": unique_threads,
            "available_images_on_disk": avail_images
        })

    # Severity classes
    for sev in config.SEVERITY_CLASSES:
        sub = df_all[df_all["severity"] == sev]
        count = len(sub)
        pct = (count / total_samples) * 100.0 if total_samples > 0 else 0.0
        missing_text = (sub["has_valid_text"] == False).sum()
        unique_threads = sub["thread_id"].nunique() if "thread_id" in sub.columns else sub["sample_id"].nunique()
        avail_images = sub["image_available_on_disk"].sum()
        rows.append({
            "target_type": "Severity",
            "class_name": sev,
            "class_id": config.SEVERITY2ID[sev],
            "sample_count": count,
            "percentage": round(pct, 2),
            "train_count": len(df_train[df_train["severity"] == sev]),
            "val_count": len(df_val[df_val["severity"] == sev]),
            "test_count": len(df_test[df_test["severity"] == sev]),
            "missing_or_invalid_samples": missing_text,
            "unique_thread_ids": unique_threads,
            "available_images_on_disk": avail_images
        })

    dist_df = pd.DataFrame(rows)
    orig_dist_path_exp = os.path.join(EXPERIMENT_DIR, "original_class_distribution.csv")
    orig_dist_path_out = os.path.join(OUTPUTS_DIR, "original_class_distribution.csv")
    dist_df.to_csv(orig_dist_path_exp, index=False)
    dist_df.to_csv(orig_dist_path_out, index=False)
    print(f"Saved: {orig_dist_path_exp}")

    # 2. JOINT ASPECT x SEVERITY DISTRIBUTION REPORT
    joint_full = pd.crosstab(df_all["aspect"], df_all["severity"]).reindex(
        index=config.ASPECT_CLASSES, columns=config.SEVERITY_CLASSES, fill_value=0
    )
    joint_train = pd.crosstab(df_train["aspect"], df_train["severity"]).reindex(
        index=config.ASPECT_CLASSES, columns=config.SEVERITY_CLASSES, fill_value=0
    )
    
    # Save 2D crosstab
    joint_path_exp = os.path.join(EXPERIMENT_DIR, "joint_aspect_severity_distribution.csv")
    joint_path_out = os.path.join(OUTPUTS_DIR, "joint_aspect_severity_distribution.csv")
    joint_full.to_csv(joint_path_exp)
    joint_full.to_csv(joint_path_out)
    print(f"Saved: {joint_path_exp}")

    # Also make a flattened version with counts and percentages for both full and train
    joint_rows = []
    for asp in config.ASPECT_CLASSES:
        for sev in config.SEVERITY_CLASSES:
            sub = df_all[(df_all["aspect"] == asp) & (df_all["severity"] == sev)]
            sub_tr = df_train[(df_train["aspect"] == asp) & (df_train["severity"] == sev)]
            joint_rows.append({
                "aspect": asp,
                "severity": sev,
                "total_count": len(sub),
                "total_pct": round((len(sub) / total_samples) * 100, 2),
                "train_count": len(sub_tr),
                "train_pct": round((len(sub_tr) / len(df_train)) * 100, 2),
                "val_count": len(df_val[(df_val["aspect"] == asp) & (df_val["severity"] == sev)]),
                "test_count": len(df_test[(df_test["aspect"] == asp) & (df_test["severity"] == sev)]),
                "unique_threads": sub["thread_id"].nunique() if "thread_id" in sub.columns else sub["sample_id"].nunique()
            })
    joint_detailed_df = pd.DataFrame(joint_rows)
    joint_detailed_path = os.path.join(EXPERIMENT_DIR, "joint_aspect_severity_detailed.csv")
    joint_detailed_df.to_csv(joint_detailed_path, index=False)
    print(f"Saved: {joint_detailed_path}")

    # 3. SPLIT MANIFEST (Deliverable 4)
    # Manifest containing sample ID, split, Aspect label, Severity label, and image availability
    manifest_df = df_all[[
        "sample_id", "thread_id", "split", "aspect", "aspect_id", "severity", "severity_id", "image_available_on_disk"
    ]].copy()
    manifest_df.rename(columns={"image_available_on_disk": "image_availability"}, inplace=True)
    manifest_path_exp = os.path.join(EXPERIMENT_DIR, "split_manifest.csv")
    manifest_path_out = os.path.join(OUTPUTS_DIR, "split_manifest.csv")
    manifest_df.to_csv(manifest_path_exp, index=False)
    manifest_df.to_csv(manifest_path_out, index=False)
    print(f"Saved: {manifest_path_exp}")

    # 4. VISUAL BAR CHARTS SHOWING ORIGINAL IMBALANCE
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Aspect Bar Chart
    asp_counts = [len(df_all[df_all["aspect"] == a]) for a in config.ASPECT_CLASSES]
    asp_colors = ["#2b5c8f" if a == "Software" else "#6baed6" for a in config.ASPECT_CLASSES]
    bars1 = axes[0].bar(config.ASPECT_CLASSES, asp_counts, color=asp_colors, edgecolor="black", linewidth=0.8)
    axes[0].set_title("Original Aspect Class Distribution (NShreya/Comp4.0)", fontsize=13, fontweight="bold", pad=12)
    axes[0].set_ylabel("Number of Samples", fontsize=11)
    axes[0].set_xlabel("Aspect Class", fontsize=11)
    for bar in bars1:
        yval = bar.get_height()
        pct = (yval / total_samples) * 100
        axes[0].text(bar.get_x() + bar.get_width()/2.0, yval + 10, f"{yval}\n({pct:.1f}%)", ha="center", va="bottom", fontsize=9, fontweight="bold")
    axes[0].set_ylim(0, max(asp_counts) * 1.15)
    
    # Severity Bar Chart
    sev_counts = [len(df_all[df_all["severity"] == s]) for s in config.SEVERITY_CLASSES]
    sev_colors = ["#3182bd", "#6baed6", "#9ecae1", "#c6dbef"]
    bars2 = axes[1].bar(config.SEVERITY_CLASSES, sev_counts, color=sev_colors, edgecolor="black", linewidth=0.8)
    axes[1].set_title("Original Severity Class Distribution (NShreya/Comp4.0)", fontsize=13, fontweight="bold", pad=12)
    axes[1].set_ylabel("Number of Samples", fontsize=11)
    axes[1].set_xlabel("Severity Class", fontsize=11)
    for bar in bars2:
        yval = bar.get_height()
        pct = (yval / total_samples) * 100
        axes[1].text(bar.get_x() + bar.get_width()/2.0, yval + 6, f"{yval}\n({pct:.1f}%)", ha="center", va="bottom", fontsize=9, fontweight="bold")
    axes[1].set_ylim(0, max(sev_counts) * 1.18)

    plt.tight_layout()
    chart_path = os.path.join(EXPERIMENT_DIR, "original_imbalance_distribution.png")
    chart_path_out = os.path.join(OUTPUTS_DIR, "original_imbalance_distribution.png")
    plt.savefig(chart_path, dpi=300)
    plt.savefig(chart_path_out, dpi=300)
    plt.close()
    print(f"Saved: {chart_path}")

    # Heatmap of Joint Distribution
    plt.figure(figsize=(8, 6))
    sns.heatmap(joint_full, annot=True, fmt="d", cmap="YlGnBu", cbar=True, linewidths=0.5)
    plt.title("Joint Aspect × Severity Distribution Matrix (All 915 Samples)", fontsize=12, fontweight="bold", pad=12)
    plt.xlabel("Severity Target", fontsize=11)
    plt.ylabel("Aspect Target", fontsize=11)
    plt.tight_layout()
    joint_img_path = os.path.join(EXPERIMENT_DIR, "original_joint_heatmap.png")
    plt.savefig(joint_img_path, dpi=300)
    plt.savefig(os.path.join(OUTPUTS_DIR, "original_joint_heatmap.png"), dpi=300)
    plt.close()
    print(f"Saved: {joint_img_path}")

    print("\n--- SUMMARY OF ORIGINAL IMBALANCE ---")
    print(dist_df.to_string())
    print("\n--- JOINT ASPECT x SEVERITY CONTINGENCY TABLE ---")
    print(joint_full.to_string())

if __name__ == "__main__":
    run_distribution_analysis()
