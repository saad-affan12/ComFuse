import React from 'react';
import { Layers, Cpu } from 'lucide-react';

interface AboutTabProps {
  tab: 'architecture' | 'about';
}

export const AboutTab: React.FC<AboutTabProps> = ({ tab }) => {
  if (tab === 'architecture') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            System Architecture
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">
            Multimodal Feature Fusion Architecture
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            ComFuse addresses multimodal customer complaints by jointly learning from textual narratives and visual screenshots (such as app error dialogs, billing slips, or damaged device casings).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Cpu className="h-4 w-4" />
              <span>1. Text Representation (DistilBERT)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complaint text is tokenized with WordPiece up to 128 tokens. The pooled <code className="text-indigo-300 bg-slate-950 px-1 py-0.5 rounded">[CLS]</code> token (768 dimensions) passes through a linear projector and LayerNorm into a compact <strong>256-dimensional</strong> textual embedding.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <Layers className="h-4 w-4" />
              <span>2. Visual Representation (ResNet-18)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evidence images are resized and normalized to 224×224 ImageNet specifications. The 512-dimensional output from the ResNet-18 convolutional backbone is projected down to <strong>256 dimensions</strong>. A zero-vector fallback handles missing images seamlessly.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
            3. Intermediate Feature Concatenation & Dual Heads
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The 256-d text vector and 256-d visual vector are concatenated into a <strong>512-dimensional fused representation</strong>, passed through a fusion MLP with Dropout and ReLU activations, and fed to two simultaneous classification heads:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs font-bold text-indigo-300">Complaint Aspect (6 classes)</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Software, Hardware, Quality, Service, Price, Packaging
              </p>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs font-bold text-amber-300">Complaint Severity (4 classes)</div>
              <p className="text-[11px] text-slate-400 mt-1">
                No Explicit Reproach, Disapproval, Accusation, Blame
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          About ComFuse
        </span>
        <h2 className="text-2xl font-bold text-white mt-1">
          Deep Learning Course Capstone Project
        </h2>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          ComFuse is an enterprise-grade AI decision support system designed to automate customer support triage by understanding both verbal grievances and visual bug screenshots.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Dataset & Benchmark</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Trained on the curated multimodal benchmark dataset <strong className="text-slate-200">NShreya/Comp4.0</strong>, comprising customer complaints with associated user-uploaded images collected from social platforms.
        </p>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
          <li><strong>Train split:</strong> 640 annotated samples</li>
          <li><strong>Validation split:</strong> 137 annotated samples</li>
          <li><strong>Test split:</strong> 138 independent held-out evaluation samples</li>
          <li><strong>Model Checkpoint:</strong> <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">models/best_multimodal_model.pt</code></li>
        </ul>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Production Decoupling</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The machine learning core is completely decoupled from the presentation layer: a lightweight React 19 + Vite frontend interacts over REST API endpoints with a high-performance FastAPI server running the PyTorch inference pipeline on CPU.
        </p>
      </div>
    </div>
  );
};
