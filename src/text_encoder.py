"""Text encoder utilizing pretrained DistilBERT for customer complaint representation."""
import torch
import torch.nn as nn
from transformers import DistilBertModel

import config

class TextEncoder(nn.Module):
    """
    DistilBERT-based text encoder.
    Extracts [CLS] token contextual embedding and projects to common feature space.
    """
    def __init__(
        self,
        model_name: str = config.TEXT_MODEL_NAME,
        embed_dim: int = config.TEXT_EMBED_DIM,
        proj_dim: int = config.TEXT_PROJ_DIM,
        dropout_rate: float = config.DROPOUT_RATE,
        freeze_layers: int = 4
    ):
        super(TextEncoder, self).__init__()
        self.distilbert = DistilBertModel.from_pretrained(model_name)
        
        # Optionally freeze early layers for CPU training speed and regularization
        if freeze_layers > 0:
            # DistilBERT has transformer.layer (6 Transformer blocks)
            # Freeze embeddings
            for p in self.distilbert.embeddings.parameters():
                p.requires_grad = False
            # Freeze first `freeze_layers` transformer blocks
            for i in range(min(freeze_layers, len(self.distilbert.transformer.layer))):
                for p in self.distilbert.transformer.layer[i].parameters():
                    p.requires_grad = False
                    
        self.projection = nn.Sequential(
            nn.Linear(embed_dim, proj_dim),
            nn.LayerNorm(proj_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate)
        )

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        """
        Forward pass for text encoder.
        input_ids: (batch_size, seq_len)
        attention_mask: (batch_size, seq_len)
        Returns:
            text_proj: (batch_size, proj_dim)
        """
        outputs = self.distilbert(input_ids=input_ids, attention_mask=attention_mask)
        # DistilBERT pooled [CLS] representation is at index 0 of last_hidden_state
        cls_embedding = outputs.last_hidden_state[:, 0, :]  # (batch_size, 768)
        text_features = self.projection(cls_embedding)       # (batch_size, proj_dim)
        return text_features
