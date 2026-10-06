"""Multimodal fusion model and Text-only baseline model for Customer Complaint Classification."""
import torch
import torch.nn as nn

import config
from src.text_encoder import TextEncoder
from src.image_encoder import ImageEncoder

class MultimodalComplaintClassifier(nn.Module):
    """
    Multimodal fusion architecture combining DistilBERT text representations
    and ResNet-18 image representations with two specialized classification heads
    for Aspect and Severity.
    """
    def __init__(
        self,
        num_aspect_classes: int = config.NUM_ASPECT_CLASSES,
        num_severity_classes: int = config.NUM_SEVERITY_CLASSES,
        text_proj_dim: int = config.TEXT_PROJ_DIM,
        image_proj_dim: int = config.IMAGE_PROJ_DIM,
        fusion_dim: int = config.FUSION_HIDDEN_DIM,
        dropout_rate: float = config.DROPOUT_RATE,
        freeze_distilbert_layers: int = 4
    ):
        super(MultimodalComplaintClassifier, self).__init__()
        
        self.text_encoder = TextEncoder(
            embed_dim=config.TEXT_EMBED_DIM,
            proj_dim=text_proj_dim,
            dropout_rate=dropout_rate,
            freeze_layers=freeze_distilbert_layers
        )
        
        self.image_encoder = ImageEncoder(
            raw_dim=config.IMAGE_RAW_DIM,
            proj_dim=image_proj_dim,
            dropout_rate=dropout_rate,
            freeze_backbone=True
        )
        
        # Multimodal fusion bottleneck
        concat_dim = text_proj_dim + image_proj_dim
        self.fusion = nn.Sequential(
            nn.Linear(concat_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate)
        )
        
        # Dual task classification heads
        self.aspect_head = nn.Linear(fusion_dim, num_aspect_classes)
        self.severity_head = nn.Linear(fusion_dim, num_severity_classes)

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
        image: torch.Tensor = None,
        has_image: torch.Tensor = None
    ):
        """
        Forward pass.
        If image is None, automatically acts in TEXT-ONLY fallback mode with zero image features.
        """
        # 1. Extract text features
        text_feats = self.text_encoder(input_ids, attention_mask)  # (B, text_proj_dim)
        
        # 2. Extract image features
        if image is not None:
            image_feats = self.image_encoder(image, has_image)      # (B, image_proj_dim)
        else:
            image_feats = torch.zeros(
                text_feats.size(0),
                config.IMAGE_PROJ_DIM,
                device=text_feats.device
            )
            
        # 3. Concatenate text and visual features
        fused_raw = torch.cat([text_feats, image_feats], dim=-1)   # (B, concat_dim)
        
        # 4. Multimodal bottleneck
        multimodal_feats = self.fusion(fused_raw)                   # (B, fusion_dim)
        
        # 5. Dual classification heads
        aspect_logits = self.aspect_head(multimodal_feats)          # (B, num_aspect_classes)
        severity_logits = self.severity_head(multimodal_feats)      # (B, num_severity_classes)
        
        return {
            "aspect_logits": aspect_logits,
            "severity_logits": severity_logits,
            "multimodal_features": multimodal_feats
        }


class TextOnlyComplaintClassifier(nn.Module):
    """
    Lightweight Text-only baseline model utilizing DistilBERT
    with two classification heads for direct performance comparison.
    """
    def __init__(
        self,
        num_aspect_classes: int = config.NUM_ASPECT_CLASSES,
        num_severity_classes: int = config.NUM_SEVERITY_CLASSES,
        text_proj_dim: int = config.TEXT_PROJ_DIM,
        fusion_dim: int = config.FUSION_HIDDEN_DIM,
        dropout_rate: float = config.DROPOUT_RATE,
        freeze_distilbert_layers: int = 4
    ):
        super(TextOnlyComplaintClassifier, self).__init__()
        
        self.text_encoder = TextEncoder(
            embed_dim=config.TEXT_EMBED_DIM,
            proj_dim=text_proj_dim,
            dropout_rate=dropout_rate,
            freeze_layers=freeze_distilbert_layers
        )
        
        self.dense = nn.Sequential(
            nn.Linear(text_proj_dim, fusion_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate)
        )
        
        self.aspect_head = nn.Linear(fusion_dim, num_aspect_classes)
        self.severity_head = nn.Linear(fusion_dim, num_severity_classes)

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor):
        text_feats = self.text_encoder(input_ids, attention_mask)
        rep = self.dense(text_feats)
        aspect_logits = self.aspect_head(rep)
        severity_logits = self.severity_head(rep)
        return {
            "aspect_logits": aspect_logits,
            "severity_logits": severity_logits
        }
