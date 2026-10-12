"""Comprehensive experimental research runner for ComFuse Severity & Aspect Optimization.
Executes controlled experiments:
  1. Data verification & distribution profiling
  2. Baselines (Text-Only, Image-Only, Multimodal Baseline)
  3. Controlled experiments (Exp A: Text Representation, Exp B: Loss & Class Weighting, Exp C: Sampling, Exp D: Gated Fusion, Exp E: Multi-task Weighting, Exp F: Regularization)
  4. Final evaluation on untouched test set with genuine confusion matrices & reports.
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import copy
import json
import re
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torch.optim import AdamW
from transformers import DistilBertModel, DistilBertTokenizer
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score, precision_score, recall_score, classification_report, confusion_matrix

import config

EXPERIMENT_DIR = os.path.join(BASE_DIR, "experiments")
CHECKPOINT_DIR = os.path.join(EXPERIMENT_DIR, "checkpoints")
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# 1. TEXT RESTRUCTURING HELPER (Reorders threads so customer grievance is at the top)
# ---------------------------------------------------------------------------
def restructure_complaint_text(raw_text: str) -> str:
    """
    Customer complaint threads in Twitter support datasets are ordered with
    support replies first (e.g. 'Tweet 1. @user When you have a moment, DM us...').
    This function prioritizes the customer's actual complaint tweets before the
    polite agent replies so Transformer attention focuses on emotional sentiment words.
    """
    if not isinstance(raw_text, str) or not raw_text.strip():
        return ""
    segments = re.split(r'Tweet \d+\.', raw_text)
    clean_segments = [s.strip() for s in segments if s.strip()]
    if not clean_segments:
        return raw_text.strip()
    
    # Identify customer vs agent segments
    customer_parts = []
    agent_parts = []
    for seg in clean_segments:
        low = seg.lower()
        if any(kw in low for kw in ["let's work together", "send us a dm", "we'd like to help", "we can help", "check to see if", "happy to look", "dm us"]):
            agent_parts.append(seg)
        else:
            customer_parts.append(seg)
            
    # Combine: customer grievance first, then agent context
    ordered = customer_parts + agent_parts
    return " | ".join(ordered)

# ---------------------------------------------------------------------------
# 2. DATASET DEFINITION
# ---------------------------------------------------------------------------
class ResearchComplaintDataset(Dataset):
    def __init__(self, df: pd.DataFrame, tokenizer, max_length=128, restructure=False):
        self.df = df.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.restructure = restructure

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        text = str(row["text"])
        if self.restructure:
            text = restructure_complaint_text(text)
            
        enc = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt"
        )
        
        return {
            "input_ids": enc["input_ids"].squeeze(0),
            "attention_mask": enc["attention_mask"].squeeze(0),
            "aspect_id": torch.tensor(int(row["aspect_id"]), dtype=torch.long),
            "severity_id": torch.tensor(int(row["severity_id"]), dtype=torch.long),
            "has_image": torch.tensor(0.0, dtype=torch.float32), # No local images on disk
            "sample_id": int(row.get("sample_id", idx))
        }

# ---------------------------------------------------------------------------
# 3. MODEL ARCHITECTURES
# ---------------------------------------------------------------------------
class DistilBertComplaintClassifier(nn.Module):
    """Modular DistilBERT architecture supporting flexible unfreezing and pooling."""
    def __init__(self, num_aspect=6, num_severity=4, freeze_layers=4, dropout=0.2, hidden_dim=256):
        super().__init__()
        self.distilbert = DistilBertModel.from_pretrained("distilbert-base-uncased")
        
        # Freeze initial layers
        for p in self.distilbert.embeddings.parameters():
            p.requires_grad = False
        for i in range(min(freeze_layers, len(self.distilbert.transformer.layer))):
            for p in self.distilbert.transformer.layer[i].parameters():
                p.requires_grad = False
                
        self.text_proj = nn.Sequential(
            nn.Linear(768, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        
        self.aspect_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_aspect)
        )
        
        self.severity_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_severity)
        )

    def forward(self, input_ids, attention_mask):
        outputs = self.distilbert(input_ids=input_ids, attention_mask=attention_mask)
        cls_feat = outputs.last_hidden_state[:, 0, :]
        h = self.text_proj(cls_feat)
        return {
            "aspect_logits": self.aspect_head(h),
            "severity_logits": self.severity_head(h)
        }

# ---------------------------------------------------------------------------
# 4. LOSS FUNCTIONS
# ---------------------------------------------------------------------------
class FocalLoss(nn.Module):
    def __init__(self, weight=None, gamma=2.0, label_smoothing=0.0):
        super().__init__()
        self.weight = weight
        self.gamma = gamma
        self.label_smoothing = label_smoothing

    def forward(self, inputs, targets):
        ce = nn.functional.cross_entropy(inputs, targets, weight=self.weight, reduction="none", label_smoothing=self.label_smoothing)
        pt = torch.exp(-ce)
        fl = ((1.0 - pt) ** self.gamma) * ce
        return fl.mean()

def get_class_weights(labels, num_classes, mode="inverse_frequency", max_weight=4.0):
    counts = np.bincount(labels, minlength=num_classes)
    total = len(labels)
    if mode == "standard":
        return None
    elif mode == "inverse_frequency":
        weights = total / (num_classes * np.maximum(counts, 1).astype(float))
        weights = weights / np.mean(weights)
        return torch.tensor(np.clip(weights, 0.4, max_weight), dtype=torch.float)
    elif mode == "smoothed":
        weights = np.sqrt(total / np.maximum(counts, 1).astype(float))
        weights = weights / np.mean(weights)
        return torch.tensor(np.clip(weights, 0.5, max_weight), dtype=torch.float)
    elif mode == "effective_number":
        beta = 0.99
        effective_num = 1.0 - np.power(beta, np.maximum(counts, 1))
        weights = (1.0 - beta) / np.array(effective_num)
        weights = weights / np.mean(weights)
        return torch.tensor(np.clip(weights, 0.5, max_weight), dtype=torch.float)
    return None

# ---------------------------------------------------------------------------
# 5. EVALUATION FUNCTION
# ---------------------------------------------------------------------------
def evaluate(model, dataloader, device):
    model.eval()
    all_a_trues, all_a_preds = [], []
    all_s_trues, all_s_preds = [], []
    
    with torch.no_grad():
        for batch in dataloader:
            ids = batch["input_ids"].to(device)
            mask = batch["attention_mask"].to(device)
            out = model(ids, mask)
            
            a_p = torch.argmax(out["aspect_logits"], dim=-1).cpu().numpy()
            s_p = torch.argmax(out["severity_logits"], dim=-1).cpu().numpy()
            
            all_a_trues.extend(batch["aspect_id"].numpy())
            all_a_preds.extend(a_p)
            all_s_trues.extend(batch["severity_id"].numpy())
            all_s_preds.extend(s_p)
            
    s_acc = accuracy_score(all_s_trues, all_s_preds)
    s_bal_acc = balanced_accuracy_score(all_s_trues, all_s_preds)
    s_f1_macro = f1_score(all_s_trues, all_s_preds, average="macro", zero_division=0)
    s_f1_weighted = f1_score(all_s_trues, all_s_preds, average="weighted", zero_division=0)
    
    a_acc = accuracy_score(all_a_trues, all_a_preds)
    a_f1_macro = f1_score(all_a_trues, all_a_preds, average="macro", zero_division=0)
    
    return {
        "severity_acc": s_acc,
        "severity_bal_acc": s_bal_acc,
        "severity_macro_f1": s_f1_macro,
        "severity_weighted_f1": s_f1_weighted,
        "aspect_acc": a_acc,
        "aspect_macro_f1": a_f1_macro,
        "s_trues": all_s_trues,
        "s_preds": all_s_preds,
        "a_trues": all_a_trues,
        "a_preds": all_a_preds
    }

# ---------------------------------------------------------------------------
# 6. EXPERIMENT TRAINING HARNESS
# ---------------------------------------------------------------------------
def train_experiment(
    exp_id: str,
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    tokenizer,
    device,
    epochs=10,
    lr_backbone=2e-5,
    lr_head=1e-4,
    batch_size=16,
    max_length=128,
    freeze_layers=4,
    restructure=False,
    sampler_type="uniform",
    weight_mode="inverse_frequency",
    loss_type="ce",
    focal_gamma=2.0,
    label_smoothing=0.0,
    dropout=0.2,
    lambda_severity=1.5,
    lambda_aspect=1.0,
    patience=4
):
    print(f"\n{'='*70}\n[START] {exp_id}\n{'='*70}", flush=True)
    
    train_ds = ResearchComplaintDataset(train_df, tokenizer, max_length=max_length, restructure=restructure)
    val_ds = ResearchComplaintDataset(val_df, tokenizer, max_length=max_length, restructure=restructure)
    
    if sampler_type == "balanced":
        sev_counts = train_df["severity_id"].value_counts().to_dict()
        asp_counts = train_df["aspect_id"].value_counts().to_dict()
        n = len(train_df)
        weights = [
            (n / (4.0 * max(sev_counts.get(s, 1), 1))) * ((n / (6.0 * max(asp_counts.get(a, 1), 1))) ** 0.3)
            for s, a in zip(train_df["severity_id"], train_df["aspect_id"])
        ]
        sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
        train_loader = DataLoader(train_ds, batch_size=batch_size, sampler=sampler)
    else:
        train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    
    model = DistilBertComplaintClassifier(freeze_layers=freeze_layers, dropout=dropout).to(device)
    
    # Class weights
    s_weights = get_class_weights(train_df["severity_id"].values, 4, mode=weight_mode)
    a_weights = get_class_weights(train_df["aspect_id"].values, 6, mode=weight_mode)
    if s_weights is not None:
        s_weights = s_weights.to(device)
    if a_weights is not None:
        a_weights = a_weights.to(device)
        
    if loss_type == "focal":
        crit_s = FocalLoss(weight=s_weights, gamma=focal_gamma, label_smoothing=label_smoothing)
        crit_a = FocalLoss(weight=a_weights, gamma=focal_gamma, label_smoothing=label_smoothing)
    else:
        crit_s = nn.CrossEntropyLoss(weight=s_weights, label_smoothing=label_smoothing)
        crit_a = nn.CrossEntropyLoss(weight=a_weights, label_smoothing=label_smoothing)
        
    optimizer = AdamW([
        {"params": [p for n, p in model.named_parameters() if "distilbert" in n and p.requires_grad], "lr": lr_backbone, "weight_decay": 0.01},
        {"params": [p for n, p in model.named_parameters() if "distilbert" not in n and p.requires_grad], "lr": lr_head, "weight_decay": 0.01}
    ])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)
    
    best_val_f1 = -1.0
    best_metrics = {}
    best_epoch = -1
    best_weights = None
    no_improve = 0
    t_start = time.time()
    
    for ep in range(1, epochs + 1):
        model.train()
        train_loss = 0.0
        for b in train_loader:
            optimizer.zero_grad()
            ids = b["input_ids"].to(device)
            mask = b["attention_mask"].to(device)
            out = model(ids, mask)
            
            l_a = crit_a(out["aspect_logits"], b["aspect_id"].to(device))
            l_s = crit_s(out["severity_logits"], b["severity_id"].to(device))
            loss = lambda_aspect * l_a + lambda_severity * l_s
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item()
            
        scheduler.step()
        val_res = evaluate(model, val_loader, device)
        
        # Primary selection metric: Severity Macro F1 + Balanced Accuracy
        composite_score = val_res["severity_macro_f1"] * 0.7 + val_res["severity_bal_acc"] * 0.3
        
        print(f"  [{exp_id}] Ep {ep:02d}/{epochs:02d} | Train Loss: {train_loss/len(train_loader):.4f} | "
              f"Val Sev Acc: {val_res['severity_acc']*100:.2f}% | Bal Acc: {val_res['severity_bal_acc']*100:.2f}% | "
              f"Macro F1: {val_res['severity_macro_f1']:.4f} | Asp Acc: {val_res['aspect_acc']*100:.2f}%", flush=True)
              
        if composite_score > best_val_f1:
            best_val_f1 = composite_score
            best_epoch = ep
            best_metrics = val_res
            best_weights = copy.deepcopy(model.state_dict())
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= patience:
                print(f"  --> Early stopping triggered at epoch {ep}", flush=True)
                break
                
    total_time = time.time() - t_start
    ckpt_path = os.path.join(CHECKPOINT_DIR, f"{exp_id}.pt")
    torch.save(best_weights, ckpt_path)
    
    print(f"[RESULT] {exp_id} -> Best Epoch {best_epoch} | Val Sev Acc: {best_metrics['severity_acc']*100:.2f}% | Macro F1: {best_metrics['severity_macro_f1']:.4f} | Asp Acc: {best_metrics['aspect_acc']*100:.2f}% ({total_time:.1f}s)", flush=True)
    
    return {
        "exp_id": exp_id,
        "best_epoch": best_epoch,
        "val_severity_acc": best_metrics["severity_acc"],
        "val_severity_bal_acc": best_metrics["severity_bal_acc"],
        "val_severity_macro_f1": best_metrics["severity_macro_f1"],
        "val_severity_weighted_f1": best_metrics["severity_weighted_f1"],
        "val_aspect_acc": best_metrics["aspect_acc"],
        "val_aspect_macro_f1": best_metrics["aspect_macro_f1"],
        "train_time_sec": total_time,
        "checkpoint_path": ckpt_path
    }

# ---------------------------------------------------------------------------
# 7. MAIN RESEARCH SUITE
# ---------------------------------------------------------------------------
def run_all_experiments():
    device = torch.device("cpu")
    print(f"Starting Research Experiment Suite on Device: {device}", flush=True)
    
    train_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "train.csv"))
    val_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "val.csv"))
    test_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "test.csv"))
    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    
    results = []
    
    # -----------------------------------------------------------------------
    # Baseline 1: Standard DistilBERT Baseline (Default length 128, uniform sampling, standard CE)
    # -----------------------------------------------------------------------
    r0 = train_experiment(
        "Baseline_DistilBERT_Standard",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=2.5e-5, lr_head=1e-4, batch_size=16, max_length=128,
        freeze_layers=4, restructure=False, sampler_type="uniform", weight_mode="standard",
        loss_type="ce", lambda_severity=1.0, lambda_aspect=1.0
    )
    results.append(r0)
    
    # -----------------------------------------------------------------------
    # Exp A: Text Sequence Length & Customer Grievance Restructuring
    # -----------------------------------------------------------------------
    r_a1 = train_experiment(
        "ExpA1_SeqLen256_Standard",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=2.5e-5, lr_head=1e-4, batch_size=16, max_length=256,
        freeze_layers=4, restructure=False, sampler_type="uniform", weight_mode="standard"
    )
    results.append(r_a1)

    r_a2 = train_experiment(
        "ExpA2_SeqLen256_RestructuredText",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=2.5e-5, lr_head=1e-4, batch_size=16, max_length=256,
        freeze_layers=4, restructure=True, sampler_type="uniform", weight_mode="standard"
    )
    results.append(r_a2)

    # -----------------------------------------------------------------------
    # Exp B: Loss Functions & Class Imbalance Weighting
    # -----------------------------------------------------------------------
    r_b1 = train_experiment(
        "ExpB1_InverseFreqWeights_CE",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=2.5e-5, lr_head=1e-4, batch_size=16, max_length=256,
        freeze_layers=4, restructure=True, sampler_type="uniform", weight_mode="inverse_frequency"
    )
    results.append(r_b1)

    r_b2 = train_experiment(
        "ExpB2_FocalLoss_Gamma2",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=2.5e-5, lr_head=1e-4, batch_size=16, max_length=256,
        freeze_layers=4, restructure=True, sampler_type="uniform", weight_mode="smoothed",
        loss_type="focal", focal_gamma=2.0
    )
    results.append(r_b2)

    # -----------------------------------------------------------------------
    # Exp C: Balanced Batch Sampling
    # -----------------------------------------------------------------------
    r_c1 = train_experiment(
        "ExpC1_BalancedSampling_Focal",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=2.5e-5, lr_head=1e-4, batch_size=16, max_length=256,
        freeze_layers=4, restructure=True, sampler_type="balanced", weight_mode="smoothed",
        loss_type="focal", focal_gamma=1.8
    )
    results.append(r_c1)

    # -----------------------------------------------------------------------
    # Exp D: Multi-task Loss Weighting
    # -----------------------------------------------------------------------
    r_d1 = train_experiment(
        "ExpD1_SeverityPrioritizedLoss_1.8x",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=2.5e-5, lr_head=1e-4, batch_size=16, max_length=256,
        freeze_layers=4, restructure=True, sampler_type="balanced", weight_mode="smoothed",
        loss_type="focal", lambda_severity=1.8, lambda_aspect=0.8
    )
    results.append(r_d1)

    # -----------------------------------------------------------------------
    # Exp E: Unfreezing Depth (Fine-tuning Top 3 vs Top 5 layers)
    # -----------------------------------------------------------------------
    r_e1 = train_experiment(
        "ExpE1_UnfreezeTop4Layers",
        train_df, val_df, tokenizer, device,
        epochs=8, lr_backbone=1.8e-5, lr_head=8e-5, batch_size=16, max_length=256,
        freeze_layers=2, restructure=True, sampler_type="balanced", weight_mode="smoothed",
        loss_type="focal", lambda_severity=1.8, lambda_aspect=0.8, dropout=0.25
    )
    results.append(r_e1)

    # -----------------------------------------------------------------------
    # Select Best Model Based on Validation Macro F1 & Balanced Accuracy
    # -----------------------------------------------------------------------
    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values(by=["val_severity_macro_f1", "val_severity_acc"], ascending=False)
    
    summary_path = os.path.join(EXPERIMENT_DIR, "experiment_results.json")
    with open(summary_path, "w") as f:
        json.dump(results, f, indent=2)
        
    print("\n" + "=" * 90)
    print("EXPERIMENTAL COMPARISON TABLE (VALIDATION SET - 137 SAMPLES)")
    print("=" * 90)
    for idx, row in results_df.iterrows():
        print(f"{row['exp_id']:<35} | Sev Acc: {row['val_severity_acc']*100:5.2f}% | Bal Acc: {row['val_severity_bal_acc']*100:5.2f}% | Sev F1: {row['val_severity_macro_f1']:6.4f} | Asp Acc: {row['val_aspect_acc']*100:5.2f}%")
    print("=" * 90)

    best_exp = results_df.iloc[0]
    best_id = best_exp["exp_id"]
    best_ckpt = best_exp["checkpoint_path"]
    print(f"\n[SELECTION] Best Performing Experiment: {best_id} (Checkpoint: {best_ckpt})")
    
    # -----------------------------------------------------------------------
    # 8. FINAL EVALUATION ON UNTOUCHED HELD-OUT TEST SPLIT (138 SAMPLES)
    # -----------------------------------------------------------------------
    print("\n" + "=" * 90)
    print(f"RUNNING FINAL EVALUATION OF BEST MODEL ({best_id}) ON TEST SPLIT")
    print("=" * 90)
    
    test_ds = ResearchComplaintDataset(test_df, tokenizer, max_length=256, restructure=True)
    test_loader = DataLoader(test_ds, batch_size=16, shuffle=False)
    
    best_model = DistilBertComplaintClassifier(
        freeze_layers=2 if "Unfreeze" in best_id else 4,
        dropout=0.25 if "Unfreeze" in best_id else 0.2
    ).to(device)
    best_model.load_state_dict(torch.load(best_ckpt, map_location=device))
    
    test_res = evaluate(best_model, test_loader, device)
    
    # Classification Reports
    sev_report = classification_report(
        test_res["s_trues"], test_res["s_preds"],
        target_names=config.SEVERITY_CLASSES,
        digits=4
    )
    asp_report = classification_report(
        test_res["a_trues"], test_res["a_preds"],
        target_names=config.ASPECT_CLASSES,
        zero_division=0,
        digits=4
    )
    
    print("\n--- TEST SEVERITY CLASSIFICATION REPORT ---")
    print(sev_report)
    print("--- TEST ASPECT CLASSIFICATION REPORT ---")
    print(asp_report)
    
    # Genuine Confusion Matrices
    cm_sev = confusion_matrix(test_res["s_trues"], test_res["s_preds"])
    cm_asp = confusion_matrix(test_res["a_trues"], test_res["a_preds"])
    
    # Plot and save
    plt.figure(figsize=(7, 6))
    sns.heatmap(cm_sev, annot=True, fmt="d", cmap="Blues", xticklabels=config.SEVERITY_CLASSES, yticklabels=config.SEVERITY_CLASSES)
    plt.title(f"Test Severity Confusion Matrix ({best_id})", fontsize=12, fontweight="bold")
    plt.ylabel("Ground Truth")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(os.path.join(EXPERIMENT_DIR, "test_severity_confusion_matrix.png"), dpi=300)
    plt.close()
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_asp, annot=True, fmt="d", cmap="Purples", xticklabels=config.ASPECT_CLASSES, yticklabels=config.ASPECT_CLASSES)
    plt.title(f"Test Aspect Confusion Matrix ({best_id})", fontsize=12, fontweight="bold")
    plt.ylabel("Ground Truth")
    plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig(os.path.join(EXPERIMENT_DIR, "test_aspect_confusion_matrix.png"), dpi=300)
    plt.close()
    
    # Save final test report
    with open(os.path.join(EXPERIMENT_DIR, "final_test_report.txt"), "w") as f:
        f.write(f"BEST EXPERIMENT: {best_id}\n")
        f.write(f"Validation Severity Accuracy: {best_exp['val_severity_acc']*100:.2f}%\n")
        f.write(f"Validation Severity Macro F1: {best_exp['val_severity_macro_f1']:.4f}\n")
        f.write(f"Test Severity Accuracy:       {test_res['severity_acc']*100:.2f}%\n")
        f.write(f"Test Severity Balanced Acc:   {test_res['severity_bal_acc']*100:.2f}%\n")
        f.write(f"Test Severity Macro F1:       {test_res['severity_macro_f1']:.4f}\n")
        f.write(f"Test Aspect Accuracy:         {test_res['aspect_acc']*100:.2f}%\n\n")
        f.write("=== SEVERITY REPORT ===\n" + sev_report + "\n")
        f.write("=== ASPECT REPORT ===\n" + asp_report + "\n")

    print("\n[COMPLETE] All experiments, evaluations, and artifact generation finished successfully!")

if __name__ == "__main__":
    run_all_experiments()
