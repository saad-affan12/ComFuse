import React from 'react';
import {
  Cpu,
  Layers,
  ArrowDown,
  Merge,
  CheckCircle2,
  ShieldAlert,
  Binary
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
          <Binary className="h-3.5 w-3.5 text-cyan-400" />
          <span>Multimodal Pipeline Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          How ComFuse Works
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
          ComFuse fuses contextual linguistic tokens from <strong>DistilBERT</strong> with deep visual convolutions from <strong>ResNet-18</strong> to simultaneously predict customer complaint aspect and severity.
        </p>
      </div>

      {/* Visual Pipeline Sequence */}
      <div className="space-y-5">
        
        {/* Step 1 & 2: Dual Encoders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 01 Text Encoder */}
          <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3 relative overflow-hidden">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              STAGE 01 • TEXT ENCODER
            </span>
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Cpu className="h-5 w-5 text-indigo-400" />
              <span>DistilBERT (distilbert-base-uncased)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Customer complaint text is tokenized into WordPiece sequences (up to 128 tokens). The contextual pooled <code className="text-indigo-300 bg-black/40 px-1 py-0.5 rounded font-mono">[CLS]</code> token (768 dimensions) captures grievance semantics and tone.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-zinc-300">
              <span className="px-2 py-1 rounded bg-[#080910] border border-white/[0.05]">Input: Text (128)</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-bold">Pooled: 768-d</span>
            </div>
          </div>

          {/* 02 Visual Encoder */}
          <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3 relative overflow-hidden">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              STAGE 02 • IMAGE ENCODER
            </span>
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Layers className="h-5 w-5 text-cyan-400" />
              <span>ResNet-18 (ImageNet Pretrained)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Evidence screenshots and hardware photos are normalized to 224×224 RGB tensors. The convolutional backbone extracts spatial defect representations (512 dimensions). A zero tensor handles missing images.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-zinc-300">
              <span className="px-2 py-1 rounded bg-[#080910] border border-white/[0.05]">Input: 3×224×224</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-bold">Conv Pool: 512-d</span>
            </div>
          </div>

        </div>

        {/* Arrow Connector */}
        <div className="flex justify-center text-zinc-400">
          <ArrowDown className="h-5 w-5" />
        </div>

        {/* Step 3: Feature Projection */}
        <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
              STAGE 03 • INTERMEDIATE BOTTLENECK PROJECTION
            </span>
            <span className="text-xs text-zinc-400 font-mono">Equal Modality Weighting</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.06] text-xs font-mono space-y-1">
              <div className="text-indigo-400 font-semibold">Text Projection</div>
              <div className="text-zinc-300">768-d → Linear → LayerNorm → ReLU → Dropout → <strong>256-d</strong></div>
            </div>
            <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.06] text-xs font-mono space-y-1">
              <div className="text-cyan-400 font-semibold">Image Projection</div>
              <div className="text-zinc-300">512-d → Linear → LayerNorm → ReLU → Dropout → <strong>256-d</strong></div>
            </div>
          </div>
        </div>

        {/* Arrow Connector */}
        <div className="flex justify-center text-zinc-400">
          <ArrowDown className="h-5 w-5" />
        </div>

        {/* Step 4: Concatenation Fusion */}
        <div className="p-5 rounded-2xl bg-[#0c0d16] border border-indigo-500/30 shadow-lg shadow-indigo-500/5 space-y-3">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            STAGE 04 • CONCATENATION & FUSION MLP
          </span>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
              <Merge className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Unified Multimodal Representation</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                [256-d Text ⊕ 256-d Vision] → 512-d Vector → Linear(512 → 256) → ReLU → Dropout(0.3)
              </p>
            </div>
          </div>
        </div>

        {/* Arrow Connector */}
        <div className="flex justify-center text-zinc-400">
          <ArrowDown className="h-5 w-5" />
        </div>

        {/* Step 5: Dual Classification Heads */}
        <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-4">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            STAGE 05 • DUAL TASK CLASSIFICATION HEADS
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl bg-[#080910] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  Head 1: Complaint Aspect
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300">
                  6 classes
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Software, Hardware, Quality, Service, Price, Packaging
              </p>
              <div className="text-[10px] text-zinc-400 font-mono pt-1">
                Linear(256 → 6) + CrossEntropyLoss
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#080910] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  Head 2: Complaint Severity
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300">
                  4 tiers
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                No Explicit Reproach, Disapproval, Accusation, Blame
              </p>
              <div className="text-[10px] text-zinc-400 font-mono pt-1">
                Linear(256 → 4) + CrossEntropyLoss
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Held-Out Test Evaluation Card */}
      <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Evaluated Benchmark Performance (Test Split: 138 samples)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.04]">
            <div className="text-[10px] text-zinc-400 uppercase">Aspect Accuracy</div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">76.09%</div>
          </div>
          <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.04]">
            <div className="text-[10px] text-zinc-400 uppercase">Aspect Weighted F1</div>
            <div className="text-lg font-extrabold text-indigo-300 font-mono mt-0.5">0.7516</div>
          </div>
          <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.04]">
            <div className="text-[10px] text-zinc-400 uppercase">Severity Accuracy</div>
            <div className="text-lg font-extrabold text-amber-300 font-mono mt-0.5">43.48%</div>
          </div>
          <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.04]">
            <div className="text-[10px] text-zinc-400 uppercase">Severity Macro F1</div>
            <div className="text-lg font-extrabold text-rose-300 font-mono mt-0.5">0.4074</div>
          </div>
        </div>
      </div>

    </div>
  );
};
