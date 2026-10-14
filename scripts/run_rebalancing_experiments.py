"""Controlled Rebalancing and Retraining Research Suite for ComFuse.
Runs the 5 required controlled experiments:
  1. Exp 1: Original training data + standard loss
  2. Exp 2: Original training data + class-weighted loss
  3. Exp 3: Balanced sampler (Aspect inverse-frequency WeightedRandomSampler) + standard loss
  4. Exp 4: Joint-aware sampler (aspect_weight^alpha * severity_weight^beta) + standard loss
  5. Exp 5: Balanced training dataset (train_balanced.csv) + moderate class-weighted loss

Outputs:
  - sampling_experiment_results.csv
  - training_history.csv
  - aspect_classification_report.csv
  - severity_classification_report.csv
  - aspect_confusion_matrix.csv
  - severity_confusion_matrix.csv
  - visual confusion matrix heatmaps
"""
import os
import sys
import copy
import json
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torch.optim import AdamW
from transformers import DistilBertTokenizer
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, f1_score,
    precision_score, recall_score, classification_report, confusion_matrix
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config
from src.multimodal_model import MultimodalComplaintClassifier
from src.dataset import ComplaintDataset

EXPERIMENT_DIR = os.path.join(BASE_DIR, "experiments")
CHECKPOINT_DIR = os.path.join(EXPERIMENT_DIR, "checkpoints")
BALANCED_DIR = os.path.join(EXPERIMENT_DIR, "balanced_data")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(CHECKPOINT_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. EVALUATION UTILITY
# ---------------------------------------------------------------------------
def evaluate_model(model, dataloader, device):
    model.eval()
    all_a_trues, all_a_preds = [], []
    all_s_trues, all_s_preds = [], []
    
    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            images = batch["image"].to(device)
            has_image = batch["has_image"].to(device)
            
            outputs = model(input_ids, attention_mask, images, has_image)
            
            a_p = torch.argmax(outputs["aspect_logits"], dim=-1).cpu().numpy()
            s_p = torch.argmax(outputs["severity_logits"], dim=-1).cpu().numpy()
            
            all_a_trues.extend(batch["aspect_id"].numpy())
            all_a_preds.extend(a_p)
            all_s_trues.extend(batch["severity_id"].numpy())
            all_s_preds.extend(s_p)
            
    # Aspect metrics
    a_acc = accuracy_score(all_a_trues, all_a_preds)
    a_bal_acc = balanced_accuracy_score(all_a_trues, all_a_preds)
    a_macro_f1 = f1_score(all_a_trues, all_a_preds, average="macro", zero_division=0)
    a_weighted_f1 = f1_score(all_a_trues, all_a_preds, average="weighted", zero_division=0)
    a_recalls = recall_score(all_a_trues, all_a_preds, average=None, zero_division=0, labels=list(range(config.NUM_ASPECT_CLASSES)))
    
    # Severity metrics
    s_acc = accuracy_score(all_s_trues, all_s_preds)
    s_bal_acc = balanced_accuracy_score(all_s_trues, all_s_preds)
    s_macro_f1 = f1_score(all_s_trues, all_s_preds, average="macro", zero_division=0)
    s_weighted_f1 = f1_score(all_s_trues, all_s_preds, average="weighted", zero_division=0)
    s_recalls = recall_score(all_s_trues, all_s_preds, average=None, zero_division=0, labels=list(range(config.NUM_SEVERITY_CLASSES)))

    return {
        "aspect_acc": a_acc,
        "aspect_bal_acc": a_bal_acc,
        "aspect_macro_f1": a_macro_f1,
        "aspect_weighted_f1": a_weighted_f1,
        "aspect_recalls": a_recalls,
        "severity_acc": s_acc,
        "severity_bal_acc": s_bal_acc,
        "severity_macro_f1": s_macro_f1,
        "severity_weighted_f1": s_weighted_f1,
        "severity_recalls": s_recalls,
        "a_trues": all_a_trues,
        "a_preds": all_a_preds,
        "s_trues": all_s_trues,
        "s_preds": all_s_preds
    }

# ---------------------------------------------------------------------------
# 2. CLASS WEIGHT COMPUTATION
# ---------------------------------------------------------------------------
def compute_class_weights(labels, num_classes, mode="inverse_frequency", max_weight=4.0):
    counts = np.bincount(labels, minlength=num_classes)
    total = len(labels)
    if mode == "none":
        return None
    elif mode == "inverse_frequency":
        # standard inverse frequency: N / (C * count)
        w = total / (num_classes * np.maximum(counts, 1).astype(float))
        w = w / np.mean(w)
        return torch.tensor(np.clip(w, 0.3, max_weight), dtype=torch.float32)
    elif mode == "smoothed":
        # square root smoothed: sqrt(N / count)
        w = np.sqrt(total / np.maximum(counts, 1).astype(float))
        w = w / np.mean(w)
        return torch.tensor(np.clip(w, 0.4, max_weight), dtype=torch.float32)
    return None

# ---------------------------------------------------------------------------
# 3. EXPERIMENT TRAINING RUNNER
# ---------------------------------------------------------------------------
def run_single_experiment(
    exp_name: str,
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    tokenizer,
    device,
    sampler_type: str = "uniform",
    weight_mode: str = "none",
    alpha: float = 0.5,
    beta: float = 0.5,
    epochs: int = 7,
    batch_size: int = 16,
    lr_distilbert: float = 2.5e-5,
    lr_heads: float = 1.2e-4,
    freeze_distilbert_layers: int = 4
):
    print(f"\n{'='*75}\n[RUNNING] {exp_name}\n{'='*75}", flush=True)
    
    # Datasets
    train_ds = ComplaintDataset(train_df, tokenizer, max_length=config.MAX_SEQ_LENGTH, is_train=True)
    val_ds = ComplaintDataset(val_df, tokenizer, max_length=config.MAX_SEQ_LENGTH, is_train=False)
    
    # Sampler construction
    if sampler_type == "aspect_weighted":
        # Strategy B: WeightedRandomSampler based on Aspect inverse frequency
        asp_counts = train_df["aspect_id"].value_counts().to_dict()
        n = len(train_df)
        weights = [n / (6.0 * max(asp_counts.get(a, 1), 1)) for a in train_df["aspect_id"]]
        sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
        train_loader = DataLoader(train_ds, batch_size=batch_size, sampler=sampler)
    elif sampler_type == "joint_aware":
        # Strategy A: Joint-aware sampler: w = (aspect_weight^alpha) * (severity_weight^beta)
        asp_counts = train_df["aspect_id"].value_counts().to_dict()
        sev_counts = train_df["severity_id"].value_counts().to_dict()
        n = len(train_df)
        weights = []
        for a, s in zip(train_df["aspect_id"], train_df["severity_id"]):
            w_a = (n / (6.0 * max(asp_counts.get(a, 1), 1))) ** alpha
            w_s = (n / (4.0 * max(sev_counts.get(s, 1), 1))) ** beta
            combined_w = w_a * w_s
            weights.append(combined_w)
        # Normalize and clip weights
        weights = np.array(weights)
        weights = weights / np.mean(weights)
        weights = np.clip(weights, 0.2, 5.0).tolist()
        sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
        train_loader = DataLoader(train_ds, batch_size=batch_size, sampler=sampler)
    else:
        train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    
    # Model instantiation
    torch.manual_seed(config.SEED)
    model = MultimodalComplaintClassifier(
        num_aspect_classes=config.NUM_ASPECT_CLASSES,
        num_severity_classes=config.NUM_SEVERITY_CLASSES,
        freeze_distilbert_layers=freeze_distilbert_layers
    ).to(device)
    
    # Loss functions & class weights
    a_weights = compute_class_weights(train_df["aspect_id"].values, config.NUM_ASPECT_CLASSES, mode=weight_mode)
    s_weights = compute_class_weights(train_df["severity_id"].values, config.NUM_SEVERITY_CLASSES, mode=weight_mode)
    
    if a_weights is not None:
        a_weights = a_weights.to(device)
    if s_weights is not None:
        s_weights = s_weights.to(device)
        
    crit_aspect = nn.CrossEntropyLoss(weight=a_weights)
    crit_severity = nn.CrossEntropyLoss(weight=s_weights)
    
    # Optimizer
    optimizer = AdamW([
        {"params": [p for n, p in model.named_parameters() if "text_encoder.distilbert" in n and p.requires_grad], "lr": lr_distilbert, "weight_decay": 0.01},
        {"params": [p for n, p in model.named_parameters() if "text_encoder.distilbert" not in n and p.requires_grad], "lr": lr_heads, "weight_decay": 0.01}
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    
    # Training Loop
    history = []
    best_score = -1.0
    best_epoch = -1
    best_state_dict = None
    best_val_metrics = {}
    
    t0 = time.time()
    for ep in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for batch in train_loader:
            optimizer.zero_grad()
            ids = batch["input_ids"].to(device)
            mask = batch["attention_mask"].to(device)
            imgs = batch["image"].to(device)
            has_img = batch["has_image"].to(device)
            
            out = model(ids, mask, imgs, has_img)
            
            l_a = crit_aspect(out["aspect_logits"], batch["aspect_id"].to(device))
            l_s = crit_severity(out["severity_logits"], batch["severity_id"].to(device))
            loss = l_a + 1.2 * l_s
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item()
            
        scheduler.step()
        train_loss /= len(train_loader)
        
        # Validation
        val_res = evaluate_model(model, val_loader, device)
        
        # Predefined selection criterion: balances severity Macro-F1 + severity balanced accuracy + aspect Macro-F1
        score = (
            val_res["severity_macro_f1"] * 0.45 +
            val_res["severity_bal_acc"] * 0.25 +
            val_res["aspect_macro_f1"] * 0.30
        )
        
        print(f"  Ep {ep:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} | "
              f"Val Sev Acc: {val_res['severity_acc']*100:.2f}% | Sev BalAcc: {val_res['severity_bal_acc']*100:.2f}% | Sev Macro-F1: {val_res['severity_macro_f1']:.4f} | "
              f"Val Asp Acc: {val_res['aspect_acc']*100:.2f}% | Asp BalAcc: {val_res['aspect_bal_acc']*100:.2f}% | Asp Macro-F1: {val_res['aspect_macro_f1']:.4f}", flush=True)
              
        epoch_log = {
            "experiment": exp_name,
            "epoch": ep,
            "train_loss": round(train_loss, 4),
            "val_severity_acc": round(val_res["severity_acc"], 4),
            "val_severity_bal_acc": round(val_res["severity_bal_acc"], 4),
            "val_severity_macro_f1": round(val_res["severity_macro_f1"], 4),
            "val_severity_weighted_f1": round(val_res["severity_weighted_f1"], 4),
            "val_aspect_acc": round(val_res["aspect_acc"], 4),
            "val_aspect_bal_acc": round(val_res["aspect_bal_acc"], 4),
            "val_aspect_macro_f1": round(val_res["aspect_macro_f1"], 4),
            "val_aspect_weighted_f1": round(val_res["aspect_weighted_f1"], 4),
            "composite_score": round(score, 4)
        }
        history.append(epoch_log)
        
        if score > best_score:
            best_score = score
            best_epoch = ep
            best_state_dict = copy.deepcopy(model.state_dict())
            best_val_metrics = val_res

    duration = time.time() - t0
    ckpt_path = os.path.join(CHECKPOINT_DIR, f"{exp_name}.pt")
    torch.save({
        "model_state_dict": best_state_dict,
        "best_epoch": best_epoch,
        "best_score": best_score,
        "experiment_name": exp_name
    }, ckpt_path)
    print(f"[BEST] {exp_name} -> Epoch {best_epoch} | Sev Acc: {best_val_metrics['severity_acc']*100:.2f}% | Sev F1: {best_val_metrics['severity_macro_f1']:.4f} | Asp Acc: {best_val_metrics['aspect_acc']*100:.2f}% | Asp F1: {best_val_metrics['aspect_macro_f1']:.4f} ({duration:.1f}s)", flush=True)

    summary = {
        "experiment_name": exp_name,
        "best_epoch": best_epoch,
        "val_severity_acc": best_val_metrics["severity_acc"],
        "val_severity_bal_acc": best_val_metrics["severity_bal_acc"],
        "val_severity_macro_f1": best_val_metrics["severity_macro_f1"],
        "val_severity_weighted_f1": best_val_metrics["severity_weighted_f1"],
        "val_aspect_acc": best_val_metrics["aspect_acc"],
        "val_aspect_bal_acc": best_val_metrics["aspect_bal_acc"],
        "val_aspect_macro_f1": best_val_metrics["aspect_macro_f1"],
        "val_aspect_weighted_f1": best_val_metrics["aspect_weighted_f1"],
        "composite_score": best_score,
        "train_time_sec": round(duration, 1),
        "checkpoint_path": ckpt_path
    }
    
    return summary, history, best_val_metrics

# ---------------------------------------------------------------------------
# 4. MAIN EXPERIMENTAL RESEARCH SUITE
# ---------------------------------------------------------------------------
def run_all_experiments():
    device = torch.device("cpu")
    print("=" * 80)
    print(f"COMFUSE CONTROLLED REBALANCING & RETRAINING SUITE (Device: {device})")
    print("=" * 80)
    
    # Load untouched splits
    train_orig = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "train.csv"))
    val_orig = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "val.csv"))
    test_orig = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "test.csv"))
    
    # Load balanced training dataset created earlier
    balanced_train_path = os.path.join(BALANCED_DIR, "train_balanced.csv")
    if not os.path.exists(balanced_train_path):
        from scripts.create_balanced_dataset import generate_balanced_train_dataset
        train_balanced = generate_balanced_train_dataset()
    else:
        train_balanced = pd.read_csv(balanced_train_path)
        
    tokenizer = DistilBertTokenizer.from_pretrained(config.TEXT_MODEL_NAME)
    
    experiment_results = []
    all_histories = []
    best_models_cache = {}
    
    # -----------------------------------------------------------------------
    # Experiment 1: Original training data + original loss
    # -----------------------------------------------------------------------
    res1, hist1, metrics1 = run_single_experiment(
        exp_name="Exp1_OriginalData_OriginalLoss",
        train_df=train_orig,
        val_df=val_orig,
        tokenizer=tokenizer,
        device=device,
        sampler_type="uniform",
        weight_mode="none",
        epochs=7
    )
    experiment_results.append(res1)
    all_histories.extend(hist1)
    best_models_cache["Exp1_OriginalData_OriginalLoss"] = metrics1
    
    # -----------------------------------------------------------------------
    # Experiment 2: Original training data + class-weighted loss
    # -----------------------------------------------------------------------
    res2, hist2, metrics2 = run_single_experiment(
        exp_name="Exp2_OriginalData_ClassWeightedLoss",
        train_df=train_orig,
        val_df=val_orig,
        tokenizer=tokenizer,
        device=device,
        sampler_type="uniform",
        weight_mode="inverse_frequency",
        epochs=7
    )
    experiment_results.append(res2)
    all_histories.extend(hist2)
    best_models_cache["Exp2_OriginalData_ClassWeightedLoss"] = metrics2
    
    # -----------------------------------------------------------------------
    # Experiment 3: Balanced sampler + original loss
    # -----------------------------------------------------------------------
    res3, hist3, metrics3 = run_single_experiment(
        exp_name="Exp3_BalancedSampler_OriginalLoss",
        train_df=train_orig,
        val_df=val_orig,
        tokenizer=tokenizer,
        device=device,
        sampler_type="aspect_weighted",
        weight_mode="none",
        epochs=7
    )
    experiment_results.append(res3)
    all_histories.extend(hist3)
    best_models_cache["Exp3_BalancedSampler_OriginalLoss"] = metrics3
    
    # -----------------------------------------------------------------------
    # Experiment 4: Joint-aware sampler + original loss
    # -----------------------------------------------------------------------
    res4, hist4, metrics4 = run_single_experiment(
        exp_name="Exp4_JointAwareSampler_OriginalLoss",
        train_df=train_orig,
        val_df=val_orig,
        tokenizer=tokenizer,
        device=device,
        sampler_type="joint_aware",
        weight_mode="none",
        alpha=0.5,
        beta=0.5,
        epochs=7
    )
    experiment_results.append(res4)
    all_histories.extend(hist4)
    best_models_cache["Exp4_JointAwareSampler_OriginalLoss"] = metrics4
    
    # -----------------------------------------------------------------------
    # Experiment 5: Best sampling method (Balanced Dataset) + moderate class-weighted loss
    # -----------------------------------------------------------------------
    res5, hist5, metrics5 = run_single_experiment(
        exp_name="Exp5_BalancedDataset_SmoothedLoss",
        train_df=train_balanced,
        val_df=val_orig,
        tokenizer=tokenizer,
        device=device,
        sampler_type="uniform",
        weight_mode="smoothed",
        epochs=7
    )
    experiment_results.append(res5)
    all_histories.extend(hist5)
    best_models_cache["Exp5_BalancedDataset_SmoothedLoss"] = metrics5

    # -----------------------------------------------------------------------
    # Save Deliverables 5 & 6: sampling_experiment_results.csv & training_history.csv
    # -----------------------------------------------------------------------
    exp_df = pd.DataFrame(experiment_results)
    exp_csv_path_exp = os.path.join(EXPERIMENT_DIR, "sampling_experiment_results.csv")
    exp_csv_path_out = os.path.join(OUTPUTS_DIR, "sampling_experiment_results.csv")
    exp_df.to_csv(exp_csv_path_exp, index=False)
    exp_df.to_csv(exp_csv_path_out, index=False)
    print(f"\nSaved: {exp_csv_path_exp}")

    hist_df = pd.DataFrame(all_histories)
    hist_csv_path_exp = os.path.join(EXPERIMENT_DIR, "training_history.csv")
    hist_csv_path_out = os.path.join(OUTPUTS_DIR, "training_history.csv")
    hist_df.to_csv(hist_csv_path_exp, index=False)
    hist_df.to_csv(hist_csv_path_out, index=False)
    print(f"Saved: {hist_csv_path_exp}")

    # Print Validation Comparison
    print("\n" + "=" * 90)
    print("VALIDATION COMPARISON ACROSS ALL 5 EXPERIMENTS (137 SAMPLES)")
    print("=" * 90)
    for _, r in exp_df.iterrows():
        print(f"{r['experiment_name']:<38} | Sev Acc: {r['val_severity_acc']*100:5.2f}% | BalAcc: {r['val_severity_bal_acc']*100:5.2f}% | Sev F1: {r['val_severity_macro_f1']:6.4f} | Asp Acc: {r['val_aspect_acc']*100:5.2f}% | Asp F1: {r['val_aspect_macro_f1']:6.4f}")
    print("=" * 90)

    # -----------------------------------------------------------------------
    # SELECT BEST MODEL CHECKPOINT (Based on composite validation score)
    # -----------------------------------------------------------------------
    best_row = exp_df.sort_values(by="composite_score", ascending=False).iloc[0]
    best_exp_name = best_row["experiment_name"]
    best_ckpt_file = best_row["checkpoint_path"]
    print(f"\n[SELECTION] Best Checkpoint: {best_exp_name} (Composite: {best_row['composite_score']:.4f})")
    print(f"Checkpoint location: {best_ckpt_file}")

    # -----------------------------------------------------------------------
    # EVALUATE BEST MODEL AND BASELINE ON THE HELD-OUT TEST SET (138 SAMPLES)
    # -----------------------------------------------------------------------
    print("\n" + "=" * 90)
    print(f"EVALUATING BEST MODEL ({best_exp_name}) ON HELD-OUT TEST SPLIT (138 SAMPLES)")
    print("=" * 90)

    test_ds = ComplaintDataset(test_orig, tokenizer, max_length=config.MAX_SEQ_LENGTH, is_train=False)
    test_loader = DataLoader(test_ds, batch_size=16, shuffle=False)

    best_model = MultimodalComplaintClassifier(freeze_distilbert_layers=4).to(device)
    saved_ckpt = torch.load(best_ckpt_file, map_location=device)
    best_model.load_state_dict(saved_ckpt["model_state_dict"])
    
    test_metrics = evaluate_model(best_model, test_loader, device)

    # Also evaluate Baseline (Exp1) on test set for exact before/after comparison
    base_ckpt_file = os.path.join(CHECKPOINT_DIR, "Exp1_OriginalData_OriginalLoss.pt")
    base_model = MultimodalComplaintClassifier(freeze_distilbert_layers=4).to(device)
    saved_base_ckpt = torch.load(base_ckpt_file, map_location=device)
    base_model.load_state_dict(saved_base_ckpt["model_state_dict"])
    base_test_metrics = evaluate_model(base_model, test_loader, device)

    # -----------------------------------------------------------------------
    # DELIVERABLES 7 & 8: Classification Reports (CSV)
    # -----------------------------------------------------------------------
    # Aspect classification report
    asp_rep_dict = classification_report(
        test_metrics["a_trues"], test_metrics["a_preds"],
        target_names=config.ASPECT_CLASSES,
        zero_division=0,
        output_dict=True
    )
    asp_rep_df = pd.DataFrame(asp_rep_dict).transpose().reset_index()
    asp_rep_df.rename(columns={"index": "class_or_metric"}, inplace=True)
    asp_csv_exp = os.path.join(EXPERIMENT_DIR, "aspect_classification_report.csv")
    asp_csv_out = os.path.join(OUTPUTS_DIR, "aspect_classification_report.csv")
    asp_rep_df.to_csv(asp_csv_exp, index=False)
    asp_rep_df.to_csv(asp_csv_out, index=False)
    print(f"Saved: {asp_csv_exp}")

    # Severity classification report
    sev_rep_dict = classification_report(
        test_metrics["s_trues"], test_metrics["s_preds"],
        target_names=config.SEVERITY_CLASSES,
        zero_division=0,
        output_dict=True
    )
    sev_rep_df = pd.DataFrame(sev_rep_dict).transpose().reset_index()
    sev_rep_df.rename(columns={"index": "class_or_metric"}, inplace=True)
    sev_csv_exp = os.path.join(EXPERIMENT_DIR, "severity_classification_report.csv")
    sev_csv_out = os.path.join(OUTPUTS_DIR, "severity_classification_report.csv")
    sev_rep_df.to_csv(sev_csv_exp, index=False)
    sev_rep_df.to_csv(sev_csv_out, index=False)
    print(f"Saved: {sev_csv_exp}")

    # -----------------------------------------------------------------------
    # DELIVERABLES 9 & 10: Confusion Matrices (CSV & Visual Heatmaps)
    # -----------------------------------------------------------------------
    cm_aspect = confusion_matrix(test_metrics["a_trues"], test_metrics["a_preds"], labels=list(range(config.NUM_ASPECT_CLASSES)))
    cm_sev = confusion_matrix(test_metrics["s_trues"], test_metrics["s_preds"], labels=list(range(config.NUM_SEVERITY_CLASSES)))

    # Aspect CM CSV
    cm_asp_df = pd.DataFrame(cm_aspect, index=config.ASPECT_CLASSES, columns=config.ASPECT_CLASSES)
    cm_asp_csv_exp = os.path.join(EXPERIMENT_DIR, "aspect_confusion_matrix.csv")
    cm_asp_csv_out = os.path.join(OUTPUTS_DIR, "aspect_confusion_matrix.csv")
    cm_asp_df.to_csv(cm_asp_csv_exp)
    cm_asp_df.to_csv(cm_asp_csv_out)
    print(f"Saved: {cm_asp_csv_exp}")

    # Severity CM CSV
    cm_sev_df = pd.DataFrame(cm_sev, index=config.SEVERITY_CLASSES, columns=config.SEVERITY_CLASSES)
    cm_sev_csv_exp = os.path.join(EXPERIMENT_DIR, "severity_confusion_matrix.csv")
    cm_sev_csv_out = os.path.join(OUTPUTS_DIR, "severity_confusion_matrix.csv")
    cm_sev_df.to_csv(cm_sev_csv_exp)
    cm_sev_df.to_csv(cm_sev_csv_out)
    print(f"Saved: {cm_sev_csv_exp}")

    # Visual Heatmaps
    plt.figure(figsize=(8, 6.5))
    sns.heatmap(cm_aspect, annot=True, fmt="d", cmap="Purples", xticklabels=config.ASPECT_CLASSES, yticklabels=config.ASPECT_CLASSES)
    plt.title(f"Test Aspect Confusion Matrix ({best_exp_name})", fontsize=12, fontweight="bold", pad=12)
    plt.ylabel("Ground Truth Label", fontsize=11)
    plt.xlabel("Predicted Label", fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(EXPERIMENT_DIR, "aspect_confusion_matrix.png"), dpi=300)
    plt.savefig(os.path.join(OUTPUTS_DIR, "aspect_confusion_matrix.png"), dpi=300)
    plt.close()

    plt.figure(figsize=(7, 6))
    sns.heatmap(cm_sev, annot=True, fmt="d", cmap="Blues", xticklabels=config.SEVERITY_CLASSES, yticklabels=config.SEVERITY_CLASSES)
    plt.title(f"Test Severity Confusion Matrix ({best_exp_name})", fontsize=12, fontweight="bold", pad=12)
    plt.ylabel("Ground Truth Label", fontsize=11)
    plt.xlabel("Predicted Label", fontsize=11)
    plt.tight_layout()
    plt.savefig(os.path.join(EXPERIMENT_DIR, "severity_confusion_matrix.png"), dpi=300)
    plt.savefig(os.path.join(OUTPUTS_DIR, "severity_confusion_matrix.png"), dpi=300)
    plt.close()

    # -----------------------------------------------------------------------
    # DELIVERABLE 11: Original-versus-Rebalanced Comparison Report (CSV + Markdown)
    # -----------------------------------------------------------------------
    comparison_rows = [
        {
            "Metric": "Severity Accuracy",
            "Original Baseline (Exp 1)": f"{base_test_metrics['severity_acc']*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['severity_acc']*100:.2f}%",
            "Delta": f"{(test_metrics['severity_acc'] - base_test_metrics['severity_acc'])*100:+.2f}%"
        },
        {
            "Metric": "Severity Balanced Accuracy",
            "Original Baseline (Exp 1)": f"{base_test_metrics['severity_bal_acc']*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['severity_bal_acc']*100:.2f}%",
            "Delta": f"{(test_metrics['severity_bal_acc'] - base_test_metrics['severity_bal_acc'])*100:+.2f}%"
        },
        {
            "Metric": "Severity Macro-F1",
            "Original Baseline (Exp 1)": f"{base_test_metrics['severity_macro_f1']:.4f}",
            "Best Rebalanced (Exp)": f"{test_metrics['severity_macro_f1']:.4f}",
            "Delta": f"{(test_metrics['severity_macro_f1'] - base_test_metrics['severity_macro_f1']):+.4f}"
        },
        {
            "Metric": "Severity Weighted-F1",
            "Original Baseline (Exp 1)": f"{base_test_metrics['severity_weighted_f1']:.4f}",
            "Best Rebalanced (Exp)": f"{test_metrics['severity_weighted_f1']:.4f}",
            "Delta": f"{(test_metrics['severity_weighted_f1'] - base_test_metrics['severity_weighted_f1']):+.4f}"
        },
        {
            "Metric": "Aspect Accuracy",
            "Original Baseline (Exp 1)": f"{base_test_metrics['aspect_acc']*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['aspect_acc']*100:.2f}%",
            "Delta": f"{(test_metrics['aspect_acc'] - base_test_metrics['aspect_acc'])*100:+.2f}%"
        },
        {
            "Metric": "Aspect Balanced Accuracy",
            "Original Baseline (Exp 1)": f"{base_test_metrics['aspect_bal_acc']*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['aspect_bal_acc']*100:.2f}%",
            "Delta": f"{(test_metrics['aspect_bal_acc'] - base_test_metrics['aspect_bal_acc'])*100:+.2f}%"
        },
        {
            "Metric": "Aspect Macro-F1",
            "Original Baseline (Exp 1)": f"{base_test_metrics['aspect_macro_f1']:.4f}",
            "Best Rebalanced (Exp)": f"{test_metrics['aspect_macro_f1']:.4f}",
            "Delta": f"{(test_metrics['aspect_macro_f1'] - base_test_metrics['aspect_macro_f1']):+.4f}"
        },
        {
            "Metric": "Software Aspect Recall",
            "Original Baseline (Exp 1)": f"{base_test_metrics['aspect_recalls'][0]*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['aspect_recalls'][0]*100:.2f}%",
            "Delta": f"{(test_metrics['aspect_recalls'][0] - base_test_metrics['aspect_recalls'][0])*100:+.2f}%"
        },
        {
            "Metric": "Hardware Aspect Recall",
            "Original Baseline (Exp 1)": f"{base_test_metrics['aspect_recalls'][1]*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['aspect_recalls'][1]*100:.2f}%",
            "Delta": f"{(test_metrics['aspect_recalls'][1] - base_test_metrics['aspect_recalls'][1])*100:+.2f}%"
        },
        {
            "Metric": "Quality Aspect Recall",
            "Original Baseline (Exp 1)": f"{base_test_metrics['aspect_recalls'][2]*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['aspect_recalls'][2]*100:.2f}%",
            "Delta": f"{(test_metrics['aspect_recalls'][2] - base_test_metrics['aspect_recalls'][2])*100:+.2f}%"
        },
        {
            "Metric": "Service Aspect Recall",
            "Original Baseline (Exp 1)": f"{base_test_metrics['aspect_recalls'][3]*100:.2f}%",
            "Best Rebalanced (Exp)": f"{test_metrics['aspect_recalls'][3]*100:.2f}%",
            "Delta": f"{(test_metrics['aspect_recalls'][3] - base_test_metrics['aspect_recalls'][3])*100:+.2f}%"
        }
    ]
    comp_df = pd.DataFrame(comparison_rows)
    comp_csv_exp = os.path.join(EXPERIMENT_DIR, "original_vs_rebalanced_comparison.csv")
    comp_csv_out = os.path.join(OUTPUTS_DIR, "original_vs_rebalanced_comparison.csv")
    comp_df.to_csv(comp_csv_exp, index=False)
    comp_df.to_csv(comp_csv_out, index=False)
    print(f"Saved: {comp_csv_exp}")

    print("\n" + "=" * 90)
    print("ORIGINAL BASELINE VS BEST REBALANCED MODEL ON TEST SPLIT (138 SAMPLES)")
    print("=" * 90)
    print(comp_df.to_string(index=False))

    # Print Confusion Matrices
    print("\n--- TEST ASPECT CONFUSION MATRIX ---")
    print(cm_asp_df.to_string())
    print("\n--- TEST SEVERITY CONFUSION MATRIX ---")
    print(cm_sev_df.to_string())

    # -----------------------------------------------------------------------
    # DELIVERABLE 12: INTEGRATE BEST CHECKPOINT & CONFIG
    # -----------------------------------------------------------------------
    prod_ckpt_path = os.path.join(config.MODELS_DIR, "best_multimodal_model.pt")
    torch.save({
        "model_state_dict": saved_ckpt["model_state_dict"],
        "experiment_name": best_exp_name,
        "selected_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "test_severity_acc": float(test_metrics["severity_acc"]),
        "test_severity_macro_f1": float(test_metrics["severity_macro_f1"]),
        "test_aspect_acc": float(test_metrics["aspect_acc"]),
        "test_aspect_macro_f1": float(test_metrics["aspect_macro_f1"])
    }, prod_ckpt_path)
    print(f"\n[INTEGRATION] Checkpoint integrated into production: {prod_ckpt_path}")

    # Save matching model configuration
    model_cfg = {
        "model_name": config.MODEL_NAME,
        "image_model": config.IMAGE_MODEL,
        "architecture": "DistilBert + ResNet18 Multimodal Classifier",
        "best_experiment": best_exp_name,
        "max_seq_length": config.MAX_SEQ_LENGTH,
        "text_proj_dim": config.TEXT_PROJ_DIM,
        "image_proj_dim": config.IMAGE_PROJ_DIM,
        "fusion_hidden_dim": config.FUSION_HIDDEN_DIM,
        "num_aspect_classes": config.NUM_ASPECT_CLASSES,
        "num_severity_classes": config.NUM_SEVERITY_CLASSES,
        "aspect_classes": config.ASPECT_CLASSES,
        "severity_classes": config.SEVERITY_CLASSES,
        "aspect2id": config.ASPECT2ID,
        "id2aspect": config.ID2ASPECT,
        "severity2id": config.SEVERITY2ID,
        "id2severity": config.ID2SEVERITY,
        "test_metrics": {
            "severity_accuracy": float(test_metrics["severity_acc"]),
            "severity_balanced_accuracy": float(test_metrics["severity_bal_acc"]),
            "severity_macro_f1": float(test_metrics["severity_macro_f1"]),
            "severity_weighted_f1": float(test_metrics["severity_weighted_f1"]),
            "aspect_accuracy": float(test_metrics["aspect_acc"]),
            "aspect_balanced_accuracy": float(test_metrics["aspect_bal_acc"]),
            "aspect_macro_f1": float(test_metrics["aspect_macro_f1"]),
            "aspect_weighted_f1": float(test_metrics["aspect_weighted_f1"])
        }
    }
    with open(os.path.join(config.MODELS_DIR, "model_config.json"), "w") as f:
        json.dump(model_cfg, f, indent=2)
    with open(os.path.join(EXPERIMENT_DIR, "best_model_config.json"), "w") as f:
        json.dump(model_cfg, f, indent=2)

    print("\n[COMPLETE] All 5 experiments completed, evaluated, and deliverables produced successfully!")

if __name__ == "__main__":
    run_all_experiments()
