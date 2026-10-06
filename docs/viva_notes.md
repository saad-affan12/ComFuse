# 🎓 Deep Learning Course Viva & Defense Notes

**Project Title:** Multimodal Customer Complaint Classification Using Transformers & CNNs  
**Dataset:** `NShreya/Comp4.0` (Hugging Face)  
**Architecture:** DistilBERT (Text) + ResNet-18 (Image) Feature Fusion + Multi-Task Classification Heads

---

### 1. Why multimodal?
Customer complaints in social media (e.g., Twitter/X) frequently contain incomplete text like *"Look at this screen!"* or *"It broke again!"*. The text alone lacks semantic specificity. Pairing the complaint text with the accompanying screenshot or photo (e.g., battery health menu, cracked display, delivery receipt) provides complementary sensory signals. Multimodal systems leverage cross-modal synergies to resolve linguistic ambiguities and boost classification accuracy and severity detection.

---

### 2. Why DistilBERT?
DistilBERT is a lightweight distilled variant of BERT (*Bidirectional Encoder Representations from Transformers*):
- **40% smaller and 60% faster** than BERT-base while retaining **97% of BERT's language comprehension capabilities**.
- Distillation transfers knowledge from a 12-layer teacher network (BERT) to a 6-layer student network using cross-entropy and cosine embedding losses.
- For small-to-medium datasets (e.g., ~1,000 samples) running on local/CPU environments, DistilBERT prevents heavy overfitting and trains rapidly with minimal latency.

---

### 3. Why ResNet-18?
ResNet-18 is a convolutional neural network (CNN) with 18 weighted layers equipped with **residual skip connections** ($y = F(x) + x$):
- Skip connections eliminate the **vanishing gradient problem**, allowing gradients to flow back without attenuation.
- ResNet-18 has only ~11.7 million parameters (compared to 25M+ for ResNet-50 or 138M for VGG-16), making feature extraction extremely fast and memory-efficient.
- Pretrained on ImageNet (1.2M natural images across 1,000 categories), its convolutional filters already understand low-level edges, textures, and high-level object shapes without requiring training from scratch.

---

### 4. Why feature fusion?
Multimodal fusion can happen at three stages:
1. **Early fusion (Data-level):** Combining raw pixels and token IDs before any feature learning (difficult due to incompatible data modalities).
2. **Intermediate/Feature fusion (Representation-level):** Extracting dense latent embeddings from specialized unimodal encoders, projecting them to a compatible vector space, and fusing them into a unified representation.
3. **Late fusion (Decision-level):** Running separate classifiers and averaging predicted probabilities.

Feature fusion allows non-linear cross-modal feature interactions in the shared bottleneck layer before task heads make decisions.

---

### 5. Why concatenate embeddings?
Concatenation ($[h_{text} \,\|\, h_{image}]$) preserves 100% of the individual representations from both modalities without information loss or destructive interference (unlike element-wise addition or dot-products, which require identical dimensions and can cancel out modality-specific features). A subsequent linear transformation ($\mathbf{W} \cdot [h_{text} \,\|\, h_{image}] + \mathbf{b}$) with non-linear activation (ReLU) allows the model to learn weighted inter-modal dependencies.

---

### 6. What is transfer learning?
Transfer learning is a machine learning paradigm where knowledge learned by a model on a large source dataset (e.g., Wikipedia/BookCorpus for DistilBERT, ImageNet for ResNet) is transferred and repurposed for a target task with a smaller dataset. Instead of learning visual filters or language syntax from scratch, the model starts with pre-converged feature representations.

---

### 7. Why freeze CNN layers?
Freezing layers sets `requires_grad = False`, preventing their weights from being updated by backpropagation during training:
- **Prevents catastrophic forgetting:** With a small dataset (~900 images), backpropagation through 11M weights would overfit immediately to noise and destroy general visual feature detectors.
- **Computational efficiency:** Avoids computing gradients for frozen convolution layers, slashing training time and RAM requirements by over 70%.

---

### 8. What is fine-tuning?
Fine-tuning is the process of adjusting a subset of pretrained model weights using a low learning rate (e.g., $3 \times 10^{-5}$) on task-specific training data. In our pipeline, earlier DistilBERT layers and the ResNet backbone are frozen, while the top transformer layers, projection matrices, fusion layer, and classification heads are tuned together.

---

### 9. What is overfitting?
Overfitting occurs when a neural network memorizes training set peculiarities, noise, and idiosyncrasies rather than learning generalizable patterns.
- **Symptoms:** Low training loss but plateauing or rising validation loss.
- **Mitigation strategies in this project:**
  1. Dropout ($p=0.2$) in projection and fusion bottlenecks.
  2. Weight decay ($L_2$ regularization $\lambda = 0.01$) in AdamW.
  3. Freezing early backbone layers.
  4. Layer normalization (`nn.LayerNorm`).
  5. Early stopping based on validation macro F1.

---

### 10. Why use macro F1?
The raw dataset has severe class imbalance (e.g., Software has ~690 samples, whereas Packaging has ~9 samples).
- **Accuracy** is misleading: predicting "Software" on all samples would achieve ~75% accuracy despite completely failing on minority classes.
- **Macro F1** computes the harmonic mean of precision and recall for *each class independently* and then computes the unweighted arithmetic mean across all classes:
  $$\text{Macro F1} = \frac{1}{K} \sum_{k=1}^K F1_k$$
It treats every complaint aspect and severity level with equal importance, penalizing models that ignore minority classes.

---

### 11. How does the model handle missing images?
1. In the dataset pipeline, if an image path is missing, corrupted, or null, the loader generates a zero tensor $\mathbf{0} \in \mathbb{R}^{3 \times 224 \times 224}$ and flags `has_image = False` ($0.0$).
2. The image encoder explicitly masks visual projection features with the `has_image` indicator, guaranteeing zeroed visual features ($h_{image} = \mathbf{0}_{256}$).
3. The fusion bottleneck processes $[h_{text} \,\|\, \mathbf{0}_{256}]$, allowing the model to make predictions purely from text without numerical instability or crashing.

---

### 12. What is the difference between text-only and multimodal?
- **Text-only:** Relies exclusively on textual cues (DistilBERT). If a user writes *"Look at how the display looks"*, it may not discern whether it is a software rendering glitch or broken hardware glass.
- **Multimodal:** Integrates visual tokens from the screenshot/photo with textual context. If the image depicts physical screen damage, the visual branch steers the classification head toward *Hardware* rather than *Software*.

---

### 13. What is the input/output of the model?
- **Inputs:**
  1. Complaint Text: Tokenized string $\to$ `input_ids` $(B, 128)$ and `attention_mask` $(B, 128)$.
  2. Complaint Image: Transformed RGB tensor $(B, 3, 224, 224)$ + boolean flag `has_image` $(B, 1)$.
- **Outputs:**
  1. Aspect Head: Logits $\to$ Softmax probabilities over 6 aspect classes (`Software`, `Hardware`, `Quality`, `Service`, `Price`, `Packaging`).
  2. Severity Head: Logits $\to$ Softmax probabilities over 4 severity classes (`No Explicit Reproach`, `Disapproval`, `Accusation`, `Blame`).

---

### 14. Why use pretrained models?
1. **Sample efficiency:** Training a vision-language system from scratch requires millions of paired images and texts; our dataset has under 1,000 samples.
2. **Convergence speed:** Pretrained feature spaces provide an inductive bias that converges in 3-5 epochs.
3. **Generalization:** Pretrained models have seen diverse vocabulary, grammar, and visual concepts, rendering them robust against typos, slang, and varied lighting.

---

### 15. What are the limitations?
1. **Dataset size:** ~915 samples with notable class skew (Software dominates; Price and Packaging have < 15 samples each).
2. **Fusion simplicity:** Concatenation does not dynamically cross-attend tokens to image regions (unlike Perceiver or Cross-Attention Transformer architectures).
3. **OCR absence:** Images with embedded text/error codes rely on standard CNN visual activations rather than explicit OCR transcription.

---

### 16. What would you improve with more time?
1. **Cross-Attention Fusion:** Implement cross-attention layers where text query tokens attend to image patch tokens (e.g., CLIP or ViT-based architectures like BLIP-2).
2. **Optical Character Recognition (OCR):** Extract on-screen text from screenshots using Tesseract/EasyOCR and concatenate OCR tokens into the DistilBERT sequence.
3. **Class Rebalancing:** Apply Focal Loss or class-weighted cross-entropy to boost minority classes (Packaging, Price).
4. **Data Augmentation:** Implement back-translation for text and Random Erasing / Color Jitter for images.
