"""PyTorch Dataset and DataLoader for Multimodal Customer Complaint Classification."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import torch
from torch.utils.data import Dataset, DataLoader
import pandas as pd
from PIL import Image
from torchvision import transforms
from transformers import DistilBertTokenizer

import config

def get_image_transforms(is_train: bool = True):
    """ImageNet-standard image transformation pipeline."""
    if is_train:
        return transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.RandomHorizontalFlip(p=0.2),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    else:
        return transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

class ComplaintDataset(Dataset):
    """
    Multimodal Dataset loading complaint text and screenshots/images.
    Gracefully handles missing or unreadable images by supplying zero embeddings.
    """
    def __init__(
        self,
        dataframe: pd.DataFrame,
        tokenizer: DistilBertTokenizer,
        max_length: int = config.MAX_SEQ_LENGTH,
        is_train: bool = False,
        base_dir: str = config.PROCESSED_DATA_DIR
    ):
        self.df = dataframe.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.transform = get_image_transforms(is_train=is_train)
        self.base_dir = base_dir

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        text = str(row["text"])
        
        # 1. Text Tokenization
        encoded_text = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt"
        )
        input_ids = encoded_text["input_ids"].squeeze(0)
        attention_mask = encoded_text["attention_mask"].squeeze(0)
        
        # 2. Image Loading and Preprocessing
        img_rel_path = row.get("image_path", None)
        has_image = False
        image_tensor = torch.zeros(3, 224, 224, dtype=torch.float32)
        
        if pd.notna(img_rel_path) and img_rel_path:
            full_img_path = os.path.join(self.base_dir, str(img_rel_path))
            if os.path.exists(full_img_path):
                try:
                    with Image.open(full_img_path) as pil_img:
                        rgb_img = pil_img.convert("RGB")
                        image_tensor = self.transform(rgb_img)
                        has_image = True
                except Exception:
                    has_image = False
                    image_tensor = torch.zeros(3, 224, 224, dtype=torch.float32)
                    
        aspect_id = int(row.get("aspect_id", -1))
        severity_id = int(row.get("severity_id", -1))
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "image": image_tensor,
            "has_image": torch.tensor(1.0 if has_image else 0.0, dtype=torch.float32),
            "aspect_id": torch.tensor(aspect_id, dtype=torch.long),
            "severity_id": torch.tensor(severity_id, dtype=torch.long),
            "text": text,
            "sample_id": int(row.get("sample_id", idx))
        }

def get_dataloaders(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    tokenizer: DistilBertTokenizer,
    batch_size: int = config.BATCH_SIZE
):
    """Create train, validation, and test PyTorch DataLoaders."""
    train_dataset = ComplaintDataset(train_df, tokenizer, is_train=True)
    val_dataset = ComplaintDataset(val_df, tokenizer, is_train=False)
    test_dataset = ComplaintDataset(test_df, tokenizer, is_train=False)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader, test_loader
