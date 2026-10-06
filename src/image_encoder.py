"""Image encoder utilizing pretrained ResNet-18 for complaint image representations."""
import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights

import config

class ImageEncoder(nn.Module):
    """
    ResNet-18 image encoder with frozen convolutional backbone and projection layer.
    Extracts 512-dim pooled features and projects to multimodal space.
    """
    def __init__(
        self,
        raw_dim: int = config.IMAGE_RAW_DIM,
        proj_dim: int = config.IMAGE_PROJ_DIM,
        dropout_rate: float = config.DROPOUT_RATE,
        freeze_backbone: bool = True
    ):
        super(ImageEncoder, self).__init__()
        weights = ResNet18_Weights.DEFAULT
        backbone = resnet18(weights=weights)
        
        if freeze_backbone:
            for param in backbone.parameters():
                param.requires_grad = False
                
        # Remove the final 1000-class classification head, retain avgpool
        self.conv_base = nn.Sequential(*list(backbone.children())[:-1])
        
        self.projection = nn.Sequential(
            nn.Linear(raw_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate)
        )

    def forward(self, images: torch.Tensor, has_image: torch.Tensor = None) -> torch.Tensor:
        """
        Forward pass for image encoder.
        images: (batch_size, 3, 224, 224)
        has_image: (batch_size, 1) or (batch_size,) indicator tensor
        Returns:
            image_features: (batch_size, proj_dim)
        """
        batch_size = images.size(0)
        
        # If all samples in batch are missing images, short-circuit with zeros
        if has_image is not None and (has_image == 0).all():
            return torch.zeros(batch_size, config.IMAGE_PROJ_DIM, device=images.device)
            
        raw_feats = self.conv_base(images)           # (batch_size, 512, 1, 1)
        flat_feats = raw_feats.view(batch_size, -1)   # (batch_size, 512)
        proj_feats = self.projection(flat_feats)      # (batch_size, proj_dim)
        
        # Zero out missing image embeddings
        if has_image is not None:
            if has_image.dim() == 1:
                mask = has_image.unsqueeze(1)         # (batch_size, 1)
            else:
                mask = has_image
            proj_feats = proj_feats * mask
            
        return proj_feats
