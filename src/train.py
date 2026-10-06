"""Training pipeline for Multimodal Model and Text-Only Baseline."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import json
import time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.optim import AdamW
from transformers import DistilBertTokenizer
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

import config
from src.dataset import get_dataloaders
from src.multimodal_model import MultimodalComplaintClassifier, TextOnlyComplaintClassifier

def compute_metrics(y_true, y_pred):
    """Calculate multi-class evaluation metrics."""
    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    precision_macro = precision_score(y_true, y_pred, average="macro", zero_division=0)
    recall_macro = recall_score(y_true, y_pred, average="macro", zero_division=0)
    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "precision_macro": precision_macro,
        "recall_macro": recall_macro
    }

def train_epoch(model, dataloader, optimizer, criterion_aspect, criterion_severity, device, is_multimodal=True):
    """Run one epoch of training."""
    model.train()
    total_loss = 0.0
    total_aspect_loss = 0.0
    total_severity_loss = 0.0
    
    for batch in dataloader:
        optimizer.zero_grad()
        
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        aspect_targets = batch["aspect_id"].to(device)
        severity_targets = batch["severity_id"].to(device)
        
        if is_multimodal:
            images = batch["image"].to(device)
            has_image = batch["has_image"].to(device)
            outputs = model(input_ids, attention_mask, images, has_image)
        else:
            outputs = model(input_ids, attention_mask)
            
        aspect_logits = outputs["aspect_logits"]
        severity_logits = outputs["severity_logits"]
        
        loss_aspect = criterion_aspect(aspect_logits, aspect_targets)
        loss_severity = criterion_severity(severity_logits, severity_targets)
        loss = loss_aspect + loss_severity
        
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        
        total_loss += loss.item()
        total_aspect_loss += loss_aspect.item()
        total_severity_loss += loss_severity.item()
        
    num_batches = len(dataloader)
    return {
        "loss": total_loss / num_batches,
        "aspect_loss": total_aspect_loss / num_batches,
        "severity_loss": total_severity_loss / num_batches
    }

def evaluate_model(model, dataloader, criterion_aspect, criterion_severity, device, is_multimodal=True):
    """Evaluate model on validation or test dataset."""
    model.eval()
    total_loss = 0.0
    total_aspect_loss = 0.0
    total_severity_loss = 0.0
    
    all_aspect_preds = []
    all_aspect_trues = []
    all_severity_preds = []
    all_severity_trues = []
    
    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            aspect_targets = batch["aspect_id"].to(device)
            severity_targets = batch["severity_id"].to(device)
            
            if is_multimodal:
                images = batch["image"].to(device)
                has_image = batch["has_image"].to(device)
                outputs = model(input_ids, attention_mask, images, has_image)
            else:
                outputs = model(input_ids, attention_mask)
                
            aspect_logits = outputs["aspect_logits"]
            severity_logits = outputs["severity_logits"]
            
            loss_aspect = criterion_aspect(aspect_logits, aspect_targets)
            loss_severity = criterion_severity(severity_logits, severity_targets)
            loss = loss_aspect + loss_severity
            
            total_loss += loss.item()
            total_aspect_loss += loss_aspect.item()
            total_severity_loss += loss_severity.item()
            
            aspect_preds = torch.argmax(aspect_logits, dim=-1).cpu().numpy()
            severity_preds = torch.argmax(severity_logits, dim=-1).cpu().numpy()
            
            all_aspect_preds.extend(aspect_preds)
            all_aspect_trues.extend(aspect_targets.cpu().numpy())
            all_severity_preds.extend(severity_preds)
            all_severity_trues.extend(severity_targets.cpu().numpy())
            
    num_batches = len(dataloader)
    aspect_metrics = compute_metrics(all_aspect_trues, all_aspect_preds)
    severity_metrics = compute_metrics(all_severity_trues, all_severity_preds)
    
    return {
        "loss": total_loss / num_batches,
        "aspect_loss": total_aspect_loss / num_batches,
        "severity_loss": total_severity_loss / num_batches,
        "aspect_metrics": aspect_metrics,
        "severity_metrics": severity_metrics,
        "aspect_preds": all_aspect_preds,
        "aspect_trues": all_aspect_trues,
        "severity_preds": all_severity_preds,
        "severity_trues": all_severity_trues
    }

def train_and_save_model(model_type="multimodal", epochs=config.NUM_EPOCHS, lr=config.LEARNING_RATE):
    """
    Train either 'multimodal' or 'text_only' model with validation selection.
    """
    device = config.get_device()
    print(f"\n{'=' * 60}")
    print(f"TRAINING {model_type.upper()} MODEL ON DEVICE: {device}")
    print(f"{'=' * 60}")
    
    # Load dataset splits
    train_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "train.csv"))
    val_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "val.csv"))
    test_df = pd.read_csv(os.path.join(config.PROCESSED_DATA_DIR, "test.csv"))
    
    tokenizer = DistilBertTokenizer.from_pretrained(config.TEXT_MODEL_NAME)
    train_loader, val_loader, test_loader = get_dataloaders(
        train_df, val_df, test_df, tokenizer, batch_size=config.BATCH_SIZE
    )
    
    is_multimodal = (model_type == "multimodal")
    if is_multimodal:
        model = MultimodalComplaintClassifier().to(device)
        save_dir = config.MULTIMODAL_MODEL_DIR
    else:
        model = TextOnlyComplaintClassifier().to(device)
        save_dir = config.TEXT_ONLY_MODEL_DIR
        
    os.makedirs(save_dir, exist_ok=True)
    
    # Class weights or standard CrossEntropy
    criterion_aspect = nn.CrossEntropyLoss()
    criterion_severity = nn.CrossEntropyLoss()
    
    # Optimizer only on parameters requiring grad
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = AdamW(trainable_params, lr=lr, weight_decay=config.WEIGHT_DECAY)
    
    best_val_score = -1.0
    best_epoch = -1
    training_history = []
    
    start_time = time.time()
    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        train_res = train_epoch(
            model, train_loader, optimizer, criterion_aspect, criterion_severity, device, is_multimodal=is_multimodal
        )
        val_res = evaluate_model(
            model, val_loader, criterion_aspect, criterion_severity, device, is_multimodal=is_multimodal
        )
        
        # Combined score for model selection: average macro F1 across Aspect & Severity
        val_score = (val_res["aspect_metrics"]["macro_f1"] + val_res["severity_metrics"]["macro_f1"]) / 2.0
        epoch_duration = time.time() - epoch_start
        
        print(f"Epoch {epoch:02d}/{epochs:02d} [{epoch_duration:.1f}s]:")
        print(f"  Train Loss: {train_res['loss']:.4f} | Val Loss: {val_res['loss']:.4f}")
        print(f"  Val Aspect   -> Acc: {val_res['aspect_metrics']['accuracy']*100:.2f}% | Macro F1: {val_res['aspect_metrics']['macro_f1']:.4f} | Weighted F1: {val_res['aspect_metrics']['weighted_f1']:.4f}")
        print(f"  Val Severity -> Acc: {val_res['severity_metrics']['accuracy']*100:.2f}% | Macro F1: {val_res['severity_metrics']['macro_f1']:.4f} | Weighted F1: {val_res['severity_metrics']['weighted_f1']:.4f}")
        print(f"  Combined Val F1: {val_score:.4f}")
        
        hist_entry = {
            "epoch": epoch,
            "train_loss": train_res["loss"],
            "val_loss": val_res["loss"],
            "val_aspect_acc": val_res["aspect_metrics"]["accuracy"],
            "val_aspect_f1": val_res["aspect_metrics"]["macro_f1"],
            "val_severity_acc": val_res["severity_metrics"]["accuracy"],
            "val_severity_f1": val_res["severity_metrics"]["macro_f1"],
            "combined_score": val_score
        }
        training_history.append(hist_entry)
        
        # Checkpoint if best validation score
        if val_score > best_val_score:
            best_val_score = val_score
            best_epoch = epoch
            checkpoint_data = {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_score": val_score,
                "aspect_metrics": val_res["aspect_metrics"],
                "severity_metrics": val_res["severity_metrics"],
                "model_type": model_type,
                "config": {
                    "text_model": config.TEXT_MODEL_NAME,
                    "image_model": config.IMAGE_MODEL_NAME,
                    "max_seq_length": config.MAX_SEQ_LENGTH,
                    "aspect_classes": config.ASPECT_CLASSES,
                    "severity_classes": config.SEVERITY_CLASSES
                }
            }
            checkpoint_path = os.path.join(save_dir, "best_model.pt")
            torch.save(checkpoint_data, checkpoint_path)
            
            if is_multimodal:
                root_ckpt_path = os.path.join(config.MODELS_DIR, "best_multimodal_model.pt")
                torch.save(checkpoint_data, root_ckpt_path)
                print(f"  --> Saved new best checkpoint to {root_ckpt_path} (epoch {epoch})")
            else:
                print(f"  --> Saved new best checkpoint to {checkpoint_path} (epoch {epoch})")
            
    total_time = time.time() - start_time
    print(f"\n{model_type.upper()} Training Completed in {total_time:.1f}s. Best Epoch: {best_epoch} (Combined F1: {best_val_score:.4f})")
    
    # Save tokenizer, config, and mappings
    tokenizer.save_pretrained(save_dir)
    with open(os.path.join(save_dir, "training_history.json"), "w") as f:
        json.dump(training_history, f, indent=2)
        
    if is_multimodal:
        os.makedirs(config.OUTPUTS_DIR, exist_ok=True)
        with open(os.path.join(config.OUTPUTS_DIR, "training_history.json"), "w") as f:
            json.dump(training_history, f, indent=2)
            
        model_cfg = {
            "model_type": "multimodal",
            "text_encoder": config.TEXT_MODEL_NAME,
            "image_encoder": config.IMAGE_MODEL_NAME,
            "max_length": config.MAX_LENGTH,
            "batch_size": config.BATCH_SIZE,
            "learning_rate": lr,
            "epochs": epochs,
            "best_epoch": best_epoch,
            "best_val_score": best_val_score,
            "aspect_classes": config.ASPECT_CLASSES,
            "severity_classes": config.SEVERITY_CLASSES
        }
        with open(os.path.join(config.MODELS_DIR, "model_config.json"), "w") as f:
            json.dump(model_cfg, f, indent=2)
            
        label_map = {
            "aspect2id": config.ASPECT2ID,
            "id2aspect": config.ID2ASPECT,
            "severity2id": config.SEVERITY2ID,
            "id2severity": config.ID2SEVERITY
        }
        with open(os.path.join(config.MODELS_DIR, "label_mappings.json"), "w") as f:
            json.dump(label_map, f, indent=2)
        
    return best_epoch, best_val_score

if __name__ == "__main__":
    train_and_save_model("multimodal", epochs=config.NUM_EPOCHS)

