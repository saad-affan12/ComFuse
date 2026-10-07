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
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12">
      
      {/* Title */}
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200/60 shadow-sm">
          <Binary className="h-3.5 w-3.5 text-purple-600" />
          <span>Multimodal Neural Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          How ComFuse Works
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-2xl font-medium">
          ComFuse fuses contextual linguistic tokens from <strong>DistilBERT</strong> with deep visual convolutions from <strong>ResNet-18</strong> to simultaneously predict customer complaint aspect and severity.
        </p>
      </div>

      {/* Visual Pipeline Sequence */}
      <div className="space-y-6">
        
        {/* Step 1 & 2: Dual Encoders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 01 Text Encoder */}
          <div className="dribbble-card p-6 space-y-3 relative overflow-hidden bg-white">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              STAGE 01 • TEXT ENCODER
            </span>
            <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-base pt-1">
              <Cpu className="h-5 w-5 text-purple-600" />
              <span>DistilBERT (distilbert-base-uncased)</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Customer complaint text is tokenized into WordPiece sequences (up to 128 tokens). The contextual pooled <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded font-mono font-bold">[CLS]</code> token (768 dimensions) captures grievance semantics and tone.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-zinc-700">
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-100 font-semibold">Input: Text (128)</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 border border-purple-200 font-bold">Pooled: 768-d</span>
            </div>
          </div>

          {/* 02 Visual Encoder */}
          <div className="dribbble-card p-6 space-y-3 relative overflow-hidden bg-white">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              STAGE 02 • IMAGE ENCODER
            </span>
            <div className="flex items-center gap-2.5 text-zinc-900 font-bold text-base pt-1">
              <Layers className="h-5 w-5 text-emerald-600" />
              <span>ResNet-18 (ImageNet Pretrained)</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Evidence screenshots and hardware photos are normalized to 224×224 RGB tensors. The convolutional backbone extracts spatial defect representations (512 dimensions). A zero tensor handles missing images.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-zinc-700">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-100 font-semibold">Input: 3×224×224</span>
              <span>→</span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">Conv Pool: 512-d</span>
            </div>
          </div>

        </div>

        {/* Arrow Connector */}
        <div className="flex justify-center text-purple-400">
          <ArrowDown className="h-6 w-6" />
        </div>

        {/* Step 3: Feature Projection */}
        <div className="dribbble-card p-6 sm:p-7 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              STAGE 03 • INTERMEDIATE BOTTLENECK PROJECTION
            </span>
            <span className="text-xs text-zinc-500 font-mono font-semibold">Equal Modality Weighting</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs font-mono space-y-1">
              <div className="text-purple-700 font-bold">Text Projection</div>
              <div className="text-zinc-600">768-d → Linear → LayerNorm → ReLU → Dropout → <strong>256-d</strong></div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs font-mono space-y-1">
              <div className="text-emerald-700 font-bold">Image Projection</div>
              <div className="text-zinc-600">512-d → Linear → LayerNorm → ReLU → Dropout → <strong>256-d</strong></div>
            </div>
          </div>
        </div>

        {/* Arrow Connector */}
        <div className="flex justify-center text-purple-400">
          <ArrowDown className="h-6 w-6" />
        </div>

        {/* Step 4: Late Multimodal Fusion */}
        <div className="dribbble-card p-6 sm:p-7 space-y-4 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              STAGE 04 • LATE MULTIMODAL FUSION
            </span>
            <span className="text-xs text-purple-700 font-mono font-bold">512-d Concatenation</span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-purple-50 border border-purple-100 text-xs space-y-2">
            <div className="flex items-center gap-2 text-zinc-900 font-bold">
              <Merge className="h-4 w-4 text-purple-600" />
              <span>Feature Concatenation & Bottleneck MLP</span>
            </div>
            <p className="text-zinc-600 font-mono text-[11px]">
              fused_vector = [ text_proj (256) || image_proj (256) ] → Linear(512, 256) → ReLU → Dropout(0.2)
            </p>
          </div>
        </div>

        {/* Arrow Connector */}
        <div className="flex justify-center text-purple-400">
          <ArrowDown className="h-6 w-6" />
        </div>

        {/* Step 5: Dual Classification Heads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="dribbble-card p-6 space-y-2 bg-white border border-purple-100">
            <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <span>Aspect Classifier Head</span>
            </div>
            <p className="text-xs text-zinc-600 font-mono">
              Linear(256 → 6) → CrossEntropyLoss
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Software</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Hardware</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Quality</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Service</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Price</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Packaging</span>
            </div>
          </div>

          <div className="dribbble-card p-6 space-y-2 bg-white border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>Severity Classifier Head</span>
            </div>
            <p className="text-xs text-zinc-600 font-mono">
              Linear(256 → 4) → CrossEntropyLoss
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">No Explicit Reproach</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Disapproval</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Accusation</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Blame</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
