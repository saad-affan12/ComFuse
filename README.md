# ComFuse: A Multimodal Framework for Customer Complaint Aspect and Severity Classification

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-ee4c2c.svg)](https://pytorch.org/)
[![Transformers](https://img.shields.io/badge/🤗%20Transformers-4.40+-yellow.svg)](https://huggingface.co/docs/transformers)
[![Gradio](https://img.shields.io/badge/Gradio-Web%20UI-orange.svg)](https://gradio.app/)

An end-to-end multimodal deep learning system that takes customer complaint text alongside complaint screenshots or photos, and simultaneously predicts **Complaint Aspect** (e.g., Software, Hardware, Quality, Service, Price, Packaging) and **Complaint Severity** (No Explicit Reproach, Disapproval, Accusation, Blame).

Built for Deep Learning course demonstration, featuring a clean **Gradio Web UI**, real trained checkpoints, and fallback support for missing images.

---

## 📌 Table of Contents
1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Dataset Description & Preprocessing](#dataset-description--preprocessing)
4. [System Architecture](#system-architecture)
5. [Installation & Setup](#installation--setup)
6. [Dataset Preparation](#dataset-preparation)
7. [Model Training](#model-training)
8. [Evaluation & Results](#evaluation--results)
9. [Web Application (Gradio Demo)](#web-application-gradio-demo)
10. [Example Walkthrough](#example-walkthrough)
11. [Limitations & Future Scope](#limitations--future-scope)
12. [Viva Defense Cheatsheet](#viva-defense-cheatsheet)

---

## 1. Project Overview
In modern customer service operations (especially on social media like Twitter/X), customer complaints arrive as short, colloquial text often accompanied by screenshots, error dialogues, or hardware photos. Unimodal text models often struggle when texts are vague (e.g., *"Just look at this!"*). 

This project solves that bottleneck by constructing a unified multimodal neural network that fuses **DistilBERT** contextual text embeddings with **ResNet-18** visual feature representations, feeding into dual classification heads for multitask prediction.

---

## 2. Problem Statement
Given an incoming customer complaint tuple $(T, I)$ where:
- $T$ is the natural language complaint text,
- $I$ is an optional visual artifact (screenshot or photo, or $\emptyset$ if omitted),

Predict two distinct targets simultaneously:
1. **Complaint Aspect ($y_{\text{aspect}}$)**: 6 primary classes $\in \{\text{Software}, \text{Hardware}, \text{Quality}, \text{Service}, \text{Price}, \text{Packaging}\}$
2. **Complaint Severity ($y_{\text{severity}}$)**: 4 complaint severity levels $\in \{\text{No Explicit Reproach}, \text{Disapproval}, \text{Accusation}, \text{Blame}\}$

---

## 3. Dataset Description & Preprocessing
The model is trained on the Hugging Face dataset **`NShreya/Comp4.0`**:
- **Total Samples:** 915 raw samples
- **Raw Columns:** `thread_id`, `text`, `image_path` (PIL Images), `aspect`, `severity`

### Data Cleaning & Label Normalization
- **Text:** Decoded HTML entities (`&gt;`, `&amp;`), normalized whitespace/newlines, preserved punctuation essential for sentiment and syntax.
- **Aspect Mapping:** The raw dataset contained 51 noisy variations (e.g., `Software\n Quality`, `Harware. Quality`, `Sofware`). These were systematically mapped to the 6 primary classes using deterministic rules:
  - `Software`: 693 samples (75.7%)
  - `Hardware`: 90 samples (9.8%)
  - `Quality`: 57 samples (6.2%)
  - `Service`: 56 samples (6.1%)
  - `Price`: 10 samples (1.1%)
  - `Packaging`: 9 samples (1.0%)
- **Severity Mapping:** The raw 12 labels were normalized into 4 standard speech-act complaint severity tiers:
  - `Blame`: 279 samples (30.5%)
  - `Disapproval`: 269 samples (29.4%)
  - `No Explicit Reproach`: 211 samples (23.1%)
  - `Accusation`: 156 samples (17.0%)
- **Stratified Data Splits:** 
  - **Train:** 640 samples (70%)
  - **Validation:** 137 samples (15%)
  - **Test:** 138 samples (15%)
  - Stratification on `aspect` ensures minority classes (`Price`, `Packaging`) are represented proportionally in all splits without data leakage.
- **Missing Image Handling:** 914 of 915 samples have valid images. If an image is absent or unreadable, the pipeline synthesizes a zero tensor $\mathbf{0} \in \mathbb{R}^{3 \times 224 \times 224}$ and applies feature masking ($h_{\text{image}} = \mathbf{0}$).

---

## 4. System Architecture

```
                       COMPLAINT INPUT
                     ┌─────────────────┐
                     │  Complaint Text │
                     └────────┬────────┘
                              │
                    ┌─────────▼─────────┐
                    │    DistilBERT     │ (Pretrained Transformer)
                    │ (CLS Token Pool)  │
                    └─────────┬─────────┘
                              │ (768-d)
                    ┌─────────▼─────────┐
                    │  Linear + LayerNorm│
                    │   + ReLU + Drop   │
                    └─────────┬─────────┘
                              │ Text Features (256-d)
                              │
                              ├─────────────────────────────┐
                              │                             │
                     ┌────────┴────────┐                    │
                     │ Complaint Image │                    │
                     └────────┬────────┘                    │
                              │                             │
                    ┌─────────▼─────────┐                   │
                    │     ResNet-18     │ (Pretrained CNN)  │
                    │   (Frozen Base)   │                   │
                    └─────────┬─────────┘                   │
                              │ (512-d)                     │
                    ┌─────────▼─────────┐                   │
                    │  Linear + LayerNorm│                  │
                    │   + ReLU + Drop   │                   │
                    └─────────┬─────────┘                   │
                              │ Image Features (256-d)      │
                              │ (Zero if missing)           │
                              │                             │
                              └──────────────┬──────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  CONCATENATION  │ (512-d)
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  Linear + ReLU  │ (256-d bottleneck)
                                    │   + Dropout     │
                                    └────────┬────────┘
                                             │
                        ┌────────────────────┴────────────────────┐
                        │                                         │
               ┌────────▼────────┐                       ┌────────▼────────┐
               │   Aspect Head   │ (Linear 256 → 6)      │  Severity Head  │ (Linear 256 → 4)
               └────────┬────────┘                       └────────┬────────┘
                        │                                         │
               ┌────────▼────────┐                       ┌────────▼────────┐
               │ Predicted Aspect│                       │Predicted Severity│
               └─────────────────┘                       └─────────────────┘
```

---

## 5. Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo_url>
   cd Deep_Learning-project
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

---

## 6. Dataset Preparation
To download `NShreya/Comp4.0` from Hugging Face, run preprocessing, extract and store images, and generate the stratified train/val/test splits:
```bash
python -m src.preprocessing
```
*Generated artifacts:*
- `data/processed/full_cleaned.csv`
- `data/processed/train.csv` (640 rows)
- `data/processed/val.csv` (137 rows)
- `data/processed/test.csv` (138 rows)
- `data/processed/label_mappings.json`
- `data/processed/images/*.jpg` (local persistent image files)

---

## 7. Model Training

### Train Multimodal Model (DistilBERT + ResNet-18)
```bash
python src/train.py
```

### Train Text-Only Baseline Model (DistilBERT Unimodal)
```bash
python -c "from src.train import train_and_save_model; train_and_save_model('text_only', epochs=3)"
```

*Checkpoints and artifacts saved under:*
- `models/multimodal/best_model.pt`
- `models/text_only/best_model.pt`

---

## 8. Evaluation & Results
To compute test set evaluation, classification reports, confusion matrices, and the comparative benchmark:
```bash
python src/evaluate.py
```

Outputs are automatically generated in `outputs/`:
- `outputs/results.json`: Full numerical metrics (Accuracy, Precision, Recall, Macro F1, Weighted F1).
- `outputs/aspect_confusion_matrix.png`: Heatmap of Aspect predictions across classes.
- `outputs/severity_confusion_matrix.png`: Heatmap of Severity predictions.
- `outputs/multimodal_vs_textonly_comparison.png`: Side-by-side performance bar graph.

---

## 9. Web Application (Gradio Demo)
Launch the interactive demo locally:
```bash
python app.py
```
Open your browser at `http://127.0.0.1:7860`.

### UI Highlights:
- **Interactive Input:** Large text area for complaints + image upload widget.
- **Dual Predictions:** Real-time Aspect and Severity classification with probability confidence bars.
- **Dual Modes:** Automatically switches between **Multimodal Mode** (when an image is uploaded) and **Text-Only Mode** (fallback zero visual vector).
- **1-Click Test Examples:** 5 pre-loaded authentic test samples covering different aspects (Software, Hardware, Quality, Service, Packaging).

---

## 10. Example Walkthrough
1. **Input Text:**
   > *"Tweet 1. @AppleSupport Oh no I’m just trying to remind you that removing the headphone jack was an awful idea yet another headphone adapter isn’t working"*
2. **Input Image:** Photo of damaged headphone adapter cable.
3. **Model Prediction:**
   - **Aspect:** `Hardware` (~92% confidence)
   - **Severity:** `Blame` (~85% confidence)
   - **Mode:** `Multimodal (Text + Image)`

---

## 11. Limitations & Future Scope
- **Dataset Size:** 915 samples is relatively modest for multimodal deep learning; fine-tuning a larger dataset would improve minority aspect generalization (`Packaging`, `Price`).
- **Fusion Complexity:** Concatenation is simple and fast; incorporating **Cross-Attention** mechanisms (e.g., ViT patches attending to text queries) could yield richer representations.
- **OCR Integration:** Extracting textual error codes printed on uploaded screenshots using OCR would directly enrich the text pathway.

---

## 12. Viva Defense Cheatsheet
Refer to [`docs/viva_notes.md`](docs/viva_notes.md) for detailed, course-tailored answers to the 16 core oral examination questions.
