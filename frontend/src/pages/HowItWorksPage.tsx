import React from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Sliders,
  Merge,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ArrowDown,
  Layers,
  Cpu,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-purple-50/40 to-white border border-purple-100/90 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-purple-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200/80 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
            <span>NEURAL MULTIMODAL ARCHITECTURE</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            How ComFuse Works
          </h1>
          
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-3xl font-medium">
            ComFuse is an end-to-end multimodal deep learning system that concurrently classifies customer complaint <strong className="text-purple-700 font-semibold">Aspect</strong> and urgency <strong className="text-purple-700 font-semibold">Severity</strong>. It fuses contextual linguistic tokens from <strong>DistilBERT</strong> with spatial defect representations from <strong>ResNet-18</strong> through symmetrical bottleneck projections and late fusion.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Linguistic Encoder</span>
              <span className="text-xs font-bold text-zinc-900">DistilBERT (768-d)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Visual Encoder</span>
              <span className="text-xs font-bold text-emerald-700">ResNet-18 (512-d)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Fusion Bottleneck</span>
              <span className="text-xs font-bold text-purple-700">Joint MLP (256-d)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 border border-purple-100/80 shadow-2xs">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-semibold">Inference Latency</span>
              <span className="text-xs font-bold text-emerald-600">~115ms (CPU Native)</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Fidelity Visual Architecture Flowchart */}
      <div className="dribbble-card p-6 sm:p-9 bg-white border border-zinc-200/80 space-y-8 relative overflow-hidden">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-7">
          
          {/* FLOW HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
                End-to-End Pipeline
              </span>
              <h2 className="text-lg font-extrabold text-zinc-900 mt-1.5">
                Multimodal Neural Forward Pass Flow
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Deterministic CPU Forward Graph</span>
            </div>
          </div>

          {/* STAGE 01: DUAL INPUT ENCODERS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                Stage 01 • Parallel Unimodal Encoders
              </span>
              <span className="text-purple-600 font-bold">Raw Inputs to Feature Vectors</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Text Encoder Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50/70 via-white to-white border border-purple-100 shadow-2xs hover:shadow-xs transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-2xs">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">Stage 01A • Text</span>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900">DistilBERT Transformer</h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 font-bold border border-purple-200/60">
                    768-d
                  </span>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  WordPiece tokenizes customer text up to 128 tokens. 6 self-attention transformer layers extract deep bidirectional context, outputting the sequence-level pooled <code className="text-purple-700 bg-purple-100/60 px-1 py-0.5 rounded font-mono font-bold">[CLS]</code> token embedding.
                </p>

                <div className="pt-2 border-t border-purple-100/70 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Input: tokens [B, 128]</span>
                  <span className="text-purple-700 font-bold">Pooled [CLS] → [B, 768]</span>
                </div>
              </div>

              {/* Vision Encoder Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50/70 via-white to-white border border-emerald-100 shadow-2xs hover:shadow-xs transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Stage 01B • Vision</span>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900">ResNet-18 Backbone</h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold border border-emerald-200/60">
                    512-d
                  </span>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  Evidence screenshots and defect photos are normalized to 224×224 RGB tensors. Residual convolutional layers extract spatial defects. When no image is provided, a zero-tensor is automatically injected without breaking the forward graph.
                </p>

                <div className="pt-2 border-t border-emerald-100/70 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>Input: RGB [B, 3, 224, 224]</span>
                  <span className="text-emerald-700 font-bold">Conv Pooling → [B, 512]</span>
                </div>
              </div>

            </div>
          </div>

          {/* FLOW CONNECTOR 1 -> 2 */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-mono text-zinc-600 shadow-2xs">
              <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
              <span>Symmetrical Bottleneck Projections (768-d & 512-d → 256-d)</span>
            </div>
          </div>

          {/* STAGE 02: SYMMETRICAL BOTTLENECK PROJECTION */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/50 via-white to-white border border-indigo-100/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shadow-2xs">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-700 uppercase">
                    Stage 02 • Dimension Equalization
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                    Symmetrical Bottleneck Projections
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-100/80 px-3 py-1 rounded-full self-start sm:self-auto border border-indigo-200/60">
                Latent 256-d Space
              </span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Because raw text embeddings (768-d) outnumber vision embeddings (512-d), direct concatenation causes linguistic dominance. ComFuse projects both modalities into an identical 256-d latent subspace with LayerNorm, ReLU, and Dropout regularization.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-purple-700 font-bold">
                  <span>Text Projection Layer</span>
                  <span>768 → 256-d</span>
                </div>
                <div className="text-zinc-500 text-[11px]">Linear(768, 256) + LayerNorm + ReLU + Dropout(0.20)</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-2xs text-xs font-mono space-y-1">
                <div className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>Vision Projection Layer</span>
                  <span>512 → 256-d</span>
                </div>
                <div className="text-zinc-500 text-[11px]">Linear(512, 256) + LayerNorm + ReLU + Dropout(0.20)</div>
              </div>
            </div>
          </div>

          {/* FLOW CONNECTOR 2 -> 3 */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-mono text-zinc-600 shadow-2xs">
              <ArrowDown className="h-3.5 w-3.5 text-purple-600" />
              <span>Feature Concatenation [256-d Text ⊕ 256-d Vision] → 512-d</span>
            </div>
          </div>

          {/* STAGE 03: MULTIMODAL FUSION CORE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50/60 via-white to-purple-50/40 border border-purple-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-2xs">
                  <Merge className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">
                    Stage 03 • Fusion Core
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900">
                    Late Multimodal Concatenation & Bottleneck MLP
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-purple-900 bg-purple-100 px-3 py-1 rounded-full self-start sm:self-auto border border-purple-200/60">
                Joint Vector [B, 256]
              </span>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              The projected text and visual features are concatenated into a 512-d unified vector. A Multilayer Perceptron (MLP) compresses cross-modal interactions into a dense 256-d joint semantic embedding that simultaneously grounds customer claims in visual defect reality.
            </p>

            <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-2xs flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-600 font-semibold">Joint Forward Formulation:</span>
              <span className="text-purple-700 font-bold">
                fused = Dropout(ReLU(LayerNorm(Linear(512 → 256))))
              </span>
            </div>
          </div>

          {/* FLOW CONNECTOR 3 -> 4 */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-xs font-mono text-zinc-600 shadow-2xs">
              <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
              <span>Multitask Shared Latent Representation [B, 256]</span>
            </div>
          </div>

          {/* STAGE 04: DUAL MULTITASK HEADS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Stage 04 • Dual Multitask Classification Heads
              </span>
              <span className="text-blue-600 font-bold">Simultaneous Prediction</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Aspect Classification Head */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-50/70 via-white to-white border border-purple-100 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 shadow-2xs">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">Head 01 • Aspect</span>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900">Grievance Domain</h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 font-bold border border-purple-200/60">
                    6 Classes
                  </span>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  Specialized linear projection <code className="font-mono text-purple-700 font-bold">Linear(256 → 6)</code> with Softmax calibration identifies the exact complaint department:
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">Software</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">Hardware</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">Quality</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">Service</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">Price</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-semibold">Packaging</span>
                </div>
              </div>

              {/* Severity Classification Head */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-white border border-amber-100 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shadow-2xs">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">Head 02 • Severity</span>
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900">Urgency & Emotion</h3>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold border border-amber-200/60">
                    4 Levels
                  </span>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  Specialized linear projection <code className="font-mono text-amber-700 font-bold">Linear(256 → 4)</code> with Softmax calibration determines SLA escalation tier:
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold">No Explicit Reproach</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold">Disapproval</span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-semibold">Accusation</span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-semibold">Blame</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3 Key Architectural Pillars */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 uppercase">
            Core Design Principles
          </span>
          <h2 className="text-xl font-extrabold text-zinc-900 mt-2">
            Why ComFuse Outperforms Traditional Models
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 w-fit">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Zero-Imputation Fallback</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Real customers do not always provide images. When no image is present, ComFuse injects a zero-tensor into ResNet-18, allowing seamless text-only execution through the exact same weights.
            </p>
          </div>

          <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 w-fit">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">Symmetrical Equalization</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Standard multimodal models suffer from text dominance because linguistic vectors are larger. Equalizing both modalities to 256-d ensures visual signals carry proportionate weight.
            </p>
          </div>

          <div className="dribbble-card p-6 bg-white border border-zinc-200/80 space-y-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 w-fit">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900">+157% Macro-F1 Balanced Training</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Trained with smoothed geometric sample weights [w_i = sqrt(w_a) * sqrt(w_s)] and label smoothing (0.05), preventing majority-class collapse on rare categories.
            </p>
          </div>

        </div>
      </div>

      {/* Production Footnote */}
      <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
          <span>Active Checkpoint: <code className="font-mono text-purple-800 font-bold">models/best_multimodal_model.pt</code> (312.4 MB) loaded on CPU runtime</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">Zero Cloud LLM API Dependency</span>
      </div>

    </div>
  );
};
