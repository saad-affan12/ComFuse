"""Comprehensive evaluation suite generating metrics, classification reports, confusion matrices, and comparison tables."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import torch
import torch.nn as nn
from transformers import DistilBertTokenizer
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    precision_recall_fscore_support
)

import config
from src.dataset import ComplaintDataset
from src.multimodal_model import MultimodalComplaintClassifier, TextOnlyComplaintClassifier
from torch.utils.data import DataLoader

def plot_confusion_matrix(cm, class_names, title, save_path):
    """Generate and save a publication-ready confusion matrix heatmap."""
    plt.figure(figsize=(7, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
        cbar=True,
        linewidths=1.0,
        linecolor="#f0f0f0"
    )
    plt.title(title, fontsize=13, fontweight="bold", pad=12)
    plt.xlabel("Predicted Label", fontsize=11, labelpad=8)
    plt.ylabel("True Label", fontsize=11, labelpad=8)
    plt.xticks(rotation=45, ha="right")
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"Confusion matrix saved to {save_path}")

def plot_comparison_chart(results_data, save_path):
    """Plot bar chart comparing Text-Only vs Multimodal performance."""
    metrics = ["Aspect Acc", "Aspect Macro F1", "Severity Acc", "Severity Macro F1"]
    
    t_data = results_data.get("text_only", {})
    m_data = results_data.get("multimodal", {})
    
    t_vals = [
        t_data.get("aspect", {}).get("accuracy", 0) * 100,
        t_data.get("aspect", {}).get("macro_f1", 0) * 100,
        t_data.get("severity", {}).get("accuracy", 0) * 100,
        t_data.get("severity", {}).get("macro_f1", 0) * 100,
    ]
    
    m_vals = [
        m_data.get("aspect", {}).get("accuracy", 0) * 100,
        m_data.get("aspect", {}).get("macro_f1", 0) * 100,
        m_data.get("severity", {}).get("accuracy", 0) * 100,
        m_data.get("severity", {}).get("macro_f1", 0) * 100,
    ]
    
    x = np.arange(len(metrics))
    width = 0.35
    
    plt.figure(figsize=(9, 5))
    plt.bar(x - width/2, t_vals, width, label="Text-Only (DistilBERT)", color="#4A90E2", alpha=0.9)
    plt.bar(x + width/2, m_vals, width, label="Multimodal (DistilBERT + ResNet-18)", color="#50E3C2", alpha=0.9)
    
    plt.ylabel("Score (%)", fontsize=11)
    plt.title("Model Comparison: Text-Only vs Multimodal Fusion", fontsize=13, fontweight="bold")
    plt.xticks(x, metrics, fontsize=10)
    plt.ylim(0, 100)
    plt.legend(frameon=True, facecolor="white", edgecolor="none")
    plt.grid(axis="y", linestyle="--", alpha=0.5)
    
    for i, v in enumerate(t_vals):
        plt.text(i - width/2, v + 1.5, f"{v:.1f}%", ha="center", fontsize=9, fontweight="bold")
    for i, v in enumerate(m_vals):
        plt.text(i + width/2, v + 1.5, f"{v:.1f}%", ha="center", fontsize=9, fontweight="bold")
        
    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close()
    print(f"Comparison chart saved to {save_path}")

def run_evaluation():
    """Run full test evaluation on Multimodal and Text-Only models."""
    os.makedirs(config.OUTPUTS_DIR, exist_ok=True)
    device = config.get_device()
    
    # Load test split
    test_csv_path = os.path.join(config.PROCESSED_DATA_DIR, "test.csv")
    test_df = pd.read_csv(test_csv_path)
    
    tokenizer = DistilBertTokenizer.from_pretrained(config.TEXT_MODEL_NAME)
    test_dataset = ComplaintDataset(test_df, tokenizer, is_train=False)
    test_loader = DataLoader(test_dataset, batch_size=config.BATCH_SIZE, shuffle=False)
    
    results = {}
    
    # -------------------------------------------------------------
    # 1. EVALUATE MULTIMODAL MODEL
    # -------------------------------------------------------------
    mm_ckpt_path = os.path.join(config.MULTIMODAL_MODEL_DIR, "best_model.pt")
    if os.path.exists(mm_ckpt_path):
        print(f"\nEvaluating Multimodal Model from {mm_ckpt_path}...")
        mm_ckpt = torch.load(mm_ckpt_path, map_location=device)
        mm_model = MultimodalComplaintClassifier().to(device)
        mm_model.load_state_dict(mm_ckpt["model_state_dict"])
        mm_model.eval()
        
        aspect_preds, aspect_trues = [], []
        sev_preds, sev_trues = [], []
        
        with torch.no_grad():
            for batch in test_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                images = batch["image"].to(device)
                has_image = batch["has_image"].to(device)
                
                outputs = mm_model(input_ids, attention_mask, images, has_image)
                
                a_p = torch.argmax(outputs["aspect_logits"], dim=-1).cpu().numpy()
                s_p = torch.argmax(outputs["severity_logits"], dim=-1).cpu().numpy()
                
                aspect_preds.extend(a_p)
                aspect_trues.extend(batch["aspect_id"].numpy())
                sev_preds.extend(s_p)
                sev_trues.extend(batch["severity_id"].numpy())
                
        # Metrics
        aspect_acc = accuracy_score(aspect_trues, aspect_preds)
        a_prec, a_rec, a_f1_macro, _ = precision_recall_fscore_support(aspect_trues, aspect_preds, average="macro", zero_division=0)
        _, _, a_f1_weighted, _ = precision_recall_fscore_support(aspect_trues, aspect_preds, average="weighted", zero_division=0)
        
        sev_acc = accuracy_score(sev_trues, sev_preds)
        s_prec, s_rec, s_f1_macro, _ = precision_recall_fscore_support(sev_trues, sev_preds, average="macro", zero_division=0)
        _, _, s_f1_weighted, _ = precision_recall_fscore_support(sev_trues, sev_preds, average="weighted", zero_division=0)
        
        aspect_rep = classification_report(
            aspect_trues, aspect_preds,
            target_names=[config.ID2ASPECT[i] for i in range(config.NUM_ASPECT_CLASSES)],
            output_dict=True,
            zero_division=0
        )
        sev_rep = classification_report(
            sev_trues, sev_preds,
            target_names=[config.ID2SEVERITY[i] for i in range(config.NUM_SEVERITY_CLASSES)],
            output_dict=True,
            zero_division=0
        )
        
        cm_aspect = confusion_matrix(aspect_trues, aspect_preds, labels=list(range(config.NUM_ASPECT_CLASSES)))
        cm_severity = confusion_matrix(sev_trues, sev_preds, labels=list(range(config.NUM_SEVERITY_CLASSES)))
        
        plot_confusion_matrix(
            cm_aspect,
            config.ASPECT_CLASSES,
            "Multimodal: Aspect Confusion Matrix",
            os.path.join(config.OUTPUTS_DIR, "aspect_confusion_matrix.png")
        )
        plot_confusion_matrix(
            cm_severity,
            config.SEVERITY_CLASSES,
            "Multimodal: Severity Confusion Matrix",
            os.path.join(config.OUTPUTS_DIR, "severity_confusion_matrix.png")
        )
        
        results["multimodal"] = {
            "aspect": {
                "accuracy": aspect_acc,
                "precision_macro": a_prec,
                "recall_macro": a_rec,
                "macro_f1": a_f1_macro,
                "weighted_f1": a_f1_weighted,
                "classification_report": aspect_rep
            },
            "severity": {
                "accuracy": sev_acc,
                "precision_macro": s_prec,
                "recall_macro": s_rec,
                "macro_f1": s_f1_macro,
                "weighted_f1": s_f1_weighted,
                "classification_report": sev_rep
            }
        }
    else:
        print(f"Multimodal checkpoint not found at {mm_ckpt_path}")

    # -------------------------------------------------------------
    # 2. EVALUATE TEXT-ONLY BASELINE MODEL
    # -------------------------------------------------------------
    to_ckpt_path = os.path.join(config.TEXT_ONLY_MODEL_DIR, "best_model.pt")
    if os.path.exists(to_ckpt_path):
        print(f"\nEvaluating Text-Only Baseline from {to_ckpt_path}...")
        to_ckpt = torch.load(to_ckpt_path, map_location=device)
        to_model = TextOnlyComplaintClassifier().to(device)
        to_model.load_state_dict(to_ckpt["model_state_dict"])
        to_model.eval()
        
        to_aspect_preds, to_aspect_trues = [], []
        to_sev_preds, to_sev_trues = [], []
        
        with torch.no_grad():
            for batch in test_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                
                outputs = to_model(input_ids, attention_mask)
                
                a_p = torch.argmax(outputs["aspect_logits"], dim=-1).cpu().numpy()
                s_p = torch.argmax(outputs["severity_logits"], dim=-1).cpu().numpy()
                
                to_aspect_preds.extend(a_p)
                to_aspect_trues.extend(batch["aspect_id"].numpy())
                to_sev_preds.extend(s_p)
                to_sev_trues.extend(batch["severity_id"].numpy())
                
        to_aspect_acc = accuracy_score(to_aspect_trues, to_aspect_preds)
        to_a_prec, to_a_rec, to_a_f1_macro, _ = precision_recall_fscore_support(to_aspect_trues, to_aspect_preds, average="macro", zero_division=0)
        _, _, to_a_f1_weighted, _ = precision_recall_fscore_support(to_aspect_trues, to_aspect_preds, average="weighted", zero_division=0)
        
        to_sev_acc = accuracy_score(to_sev_trues, to_sev_preds)
        to_s_prec, to_s_rec, to_s_f1_macro, _ = precision_recall_fscore_support(to_sev_trues, to_sev_preds, average="macro", zero_division=0)
        _, _, to_s_f1_weighted, _ = precision_recall_fscore_support(to_sev_trues, to_sev_preds, average="weighted", zero_division=0)
        
        results["text_only"] = {
            "aspect": {
                "accuracy": to_aspect_acc,
                "precision_macro": to_a_prec,
                "recall_macro": to_a_rec,
                "macro_f1": to_a_f1_macro,
                "weighted_f1": to_a_f1_weighted
            },
            "severity": {
                "accuracy": to_sev_acc,
                "precision_macro": to_s_prec,
                "recall_macro": to_s_rec,
                "macro_f1": to_s_f1_macro,
                "weighted_f1": to_s_f1_weighted
            }
        }
    else:
        print(f"Text-Only checkpoint not found at {to_ckpt_path}")

    # -------------------------------------------------------------
    # 3. SAVE RESULTS & PRINT COMPARISON TABLE
    # -------------------------------------------------------------
    results_json_path = os.path.join(config.OUTPUTS_DIR, "results.json")
    test_results_path = os.path.join(config.OUTPUTS_DIR, "test_results.json")
    model_comp_path = os.path.join(config.OUTPUTS_DIR, "model_comparison.json")
    
    with open(results_json_path, "w") as f:
        json.dump(results, f, indent=2)
    with open(test_results_path, "w") as f:
        json.dump(results, f, indent=2)
        
    # Save text classification reports
    if "multimodal" in results:
        aspect_text_rep = classification_report(
            aspect_trues, aspect_preds,
            target_names=[config.ID2ASPECT[i] for i in range(config.NUM_ASPECT_CLASSES)],
            zero_division=0
        )
        sev_text_rep = classification_report(
            sev_trues, sev_preds,
            target_names=[config.ID2SEVERITY[i] for i in range(config.NUM_SEVERITY_CLASSES)],
            zero_division=0
        )
        with open(os.path.join(config.OUTPUTS_DIR, "aspect_classification_report.txt"), "w") as f:
            f.write(aspect_text_rep)
        with open(os.path.join(config.OUTPUTS_DIR, "severity_classification_report.txt"), "w") as f:
            f.write(sev_text_rep)
            
    print(f"\nAll evaluation metrics saved to {results_json_path} and {test_results_path}")
    
    if "multimodal" in results and "text_only" in results:
        comparison_dict = {
            "text_only": {
                "aspect_accuracy": results["text_only"]["aspect"]["accuracy"],
                "aspect_macro_f1": results["text_only"]["aspect"]["macro_f1"],
                "severity_accuracy": results["text_only"]["severity"]["accuracy"],
                "severity_macro_f1": results["text_only"]["severity"]["macro_f1"]
            },
            "multimodal": {
                "aspect_accuracy": results["multimodal"]["aspect"]["accuracy"],
                "aspect_macro_f1": results["multimodal"]["aspect"]["macro_f1"],
                "severity_accuracy": results["multimodal"]["severity"]["accuracy"],
                "severity_macro_f1": results["multimodal"]["severity"]["macro_f1"]
            }
        }
        with open(model_comp_path, "w") as f:
            json.dump(comparison_dict, f, indent=2)
            
        plot_comparison_chart(results, os.path.join(config.OUTPUTS_DIR, "multimodal_vs_textonly_comparison.png"))
        
        print("\n" + "=" * 75)
        print("MODEL PERFORMANCE COMPARISON (TEST SET - 138 SAMPLES)")
        print("=" * 75)
        print(f"{'Model':<15} | {'Aspect Acc':<12} | {'Aspect F1':<12} | {'Severity Acc':<14} | {'Severity F1':<12}")
        print("-" * 75)
        to_a = results["text_only"]["aspect"]
        to_s = results["text_only"]["severity"]
        mm_a = results["multimodal"]["aspect"]
        mm_s = results["multimodal"]["severity"]
        
        print(f"{'Text-Only':<15} | {to_a['accuracy']*100:>10.2f}% | {to_a['macro_f1']:>12.4f} | {to_s['accuracy']*100:>12.2f}% | {to_s['macro_f1']:>12.4f}")
        print(f"{'Multimodal':<15} | {mm_a['accuracy']*100:>10.2f}% | {mm_a['macro_f1']:>12.4f} | {mm_s['accuracy']*100:>12.2f}% | {mm_s['macro_f1']:>12.4f}")
        print("=" * 75)
        
    return results

if __name__ == "__main__":
    run_evaluation()

