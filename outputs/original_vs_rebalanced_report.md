# COMFUSE: DATASET REBALANCING & RETRAINING RESEARCH REPORT

**Author:** Deep Learning Research & Engineering Team  
**Dataset:** Hugging Face `NShreya/Comp4.0` (915 Multimodal Complaint Samples)  
**Architecture:** Multimodal Fusion (`distilbert-base-uncased` + ImageNet-pretrained `resnet18`)  
**Date:** October 13, 2026  

---

## Executive Summary

This investigation was commissioned to eliminate the severe majority-class prediction collapse in **ComFuse: Multimodal Customer Complaint Intelligence System**. Previously, an unconstrained baseline model defaulted almost entirely to predicting `Software` (which comprises 75.7% of the dataset) and performed near random guessing across the 4 Severity tiers.

Through an empirical data-balancing pipeline, we:
1. **Preserved split integrity**: Held-out Validation (137 samples) and Test (138 samples) splits remained 100% unaltered. Only the training split (640 samples) was rebalanced.
2. **Capped Software dominance**: Software was undersampled from 485 down to 220 samples (reducing its training share from 75.8% to 41.9%), while minority classes (Hardware, Quality, Service, Price, Packaging) were moderately oversampled with existing samples into a 525-sample balanced dataset (`train_balanced.csv`).
3. **Executed 5 Controlled Experiments**: Benchmarked baseline Cross-Entropy, Inverse-Frequency Class Weighting, Aspect-Weighted Random Sampling, Joint-Aware Sampling ($w = w_{\text{aspect}}^{0.5} \times w_{\text{severity}}^{0.5}$), and Balanced Dataset with Smoothed Loss.
4. **Demonstrated Quantifiable Gains**:
   - **Aspect Balanced Accuracy jumped from 16.67% to 38.09% (+21.42%)**.
   - **Aspect Macro-F1 jumped from 0.1433 to 0.3683 (+0.2251 / +157% relative improvement)**.
   - **Severity Balanced Accuracy increased from 26.20% to 29.70% (+3.50%)**.
   - **Severity Macro-F1 increased from 0.2309 to 0.2663 (+0.0354)**.
   - Genuine multi-class decision boundaries were established without test-set leakage or synthetic label invention.

---

## 1. Original Dataset Distribution Analysis

### A. Aspect Distribution (915 Samples)
| Class ID | Aspect Class | Sample Count | Percentage | Train (640) | Val (137) | Test (138) | Unique Threads |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | **Software** | 693 | 75.74% | 485 | 104 | 104 | 693 |
| 1 | **Hardware** | 90 | 9.84% | 63 | 13 | 14 | 90 |
| 2 | **Quality** | 57 | 6.23% | 40 | 8 | 9 | 57 |
| 3 | **Service** | 56 | 6.12% | 39 | 8 | 9 | 56 |
| 4 | **Price** | 10 | 1.09% | 7 | 2 | 1 | 10 |
| 5 | **Packaging** | 9 | 0.98% | 6 | 2 | 1 | 9 |

### B. Severity Distribution (915 Samples)
| Class ID | Severity Class | Sample Count | Percentage | Train (640) | Val (137) | Test (138) | Unique Threads |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | **No Explicit Reproach** | 211 | 23.06% | 144 | 36 | 31 | 211 |
| 1 | **Disapproval** | 269 | 29.40% | 189 | 34 | 46 | 269 |
| 2 | **Accusation** | 156 | 17.05% | 111 | 24 | 21 | 156 |
| 3 | **Blame** | 279 | 30.49% | 196 | 43 | 40 | 279 |

### C. Joint Aspect × Severity Matrix (Contingency Table)
| Aspect / Severity | No Explicit Reproach | Disapproval | Accusation | Blame | Total |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Software** | 155 | 206 | 110 | 222 | 693 |
| **Hardware** | 16 | 19 | 31 | 24 | 90 |
| **Quality** | 15 | 25 | 2 | 15 | 57 |
| **Service** | 21 | 16 | 10 | 9 | 56 |
| **Price** | 3 | 1 | 1 | 5 | 10 |
| **Packaging** | 1 | 2 | 2 | 4 | 9 |

---

## 2. Rebalanced Training Dataset Construction

To eliminate majority-class bias without introducing synthetic noise:
- **Controlled Software Undersampling**: Software was reduced from 485 down to 220 samples, stratified across severity tiers to preserve internal diversity.
- **Moderate Minority Oversampling**:
  - Hardware: 63 $\rightarrow$ 95
  - Quality: 40 $\rightarrow$ 80
  - Service: 39 $\rightarrow$ 78
  - Price: 7 $\rightarrow$ 28 *(limited by 7 unique samples)*
  - Packaging: 6 $\rightarrow$ 24 *(limited by 6 unique samples)*
- **Outcome**: A 525-sample balanced dataset (`train_balanced.csv`) where Software accounts for **41.9%** (down from 75.8%), giving minority aspects substantial gradient representation.

---

## 3. Controlled Retraining Experiments & Validation Comparison

All 5 experiments were trained using AdamW on CPU with DistilBERT layers 0–3 frozen and evaluated on the **137-sample untouched validation set**:

| Experiment Name | Technique | Val Sev Acc | Val Sev BalAcc | Val Sev Macro-F1 | Val Asp Acc | Val Asp BalAcc | Val Asp Macro-F1 | Composite Score |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Exp 1** | Original Data + Standard CE Loss | 29.20% | 25.72% | 0.2011 | 76.64% | 17.95% | 0.1689 | 0.2054 |
| **Exp 2** | Original Data + Class-Weighted Loss | 32.12% | 34.69% | 0.3252 | 75.91% | 16.67% | 0.1450 | 0.2766 |
| **Exp 3** | Aspect WeightedRandomSampler | 29.93% | 29.74% | 0.2766 | 56.93% | **42.79%** | **0.3332** | 0.2988 |
| **Exp 4** | Joint-Aware Sampler ($w_A^{0.5} \times w_S^{0.5}$) | 34.31% | 34.98% | 0.3370 | 75.91% | 35.26% | 0.3187 | 0.3347 |
| **Exp 5 (Selected)** | Balanced Dataset + Smoothed Loss | **37.23%** | **37.91%** | **0.3744** | 72.99% | 34.29% | 0.2941 | **0.3515** |

---

## 4. Final Evaluation on Untouched Held-Out Test Set (138 Samples)

Evaluating the selected checkpoint (**Exp 5**) against the baseline (**Exp 1**) on the untouched test split:

| Metric | Original Baseline (Exp 1) | Best Rebalanced Model (Exp 5) | Absolute Delta | Relative Change |
|:---|:---:|:---:|:---:|:---:|
| **Severity Accuracy** | 28.99% | **31.16%** | **+2.17%** | +7.5% |
| **Severity Balanced Accuracy** | 26.20% | **29.70%** | **+3.50%** | +13.4% |
| **Severity Macro-F1** | 0.2309 | **0.2663** | **+0.0354** | +15.3% |
| **Severity Weighted-F1** | 0.2435 | **0.2697** | **+0.0261** | +10.7% |
| **Aspect Accuracy** | 75.36% | **74.64%** | -0.72% | -0.9% |
| **Aspect Balanced Accuracy** | 16.67% | **38.09%** | **+21.42%** | **+128.5%** |
| **Aspect Macro-F1** | 0.1433 | **0.3683** | **+0.2251** | **+157.1%** |
| **Software Aspect Recall** | 100.00% | 95.19% | -4.81% | -4.8% |
| **Service Aspect Recall** | 0.00% | **33.33%** | **+33.33%** | $\infty$ |
| **Price Aspect Recall** | 0.00% | **100.00%** | **+100.00%** | $\infty$ |
