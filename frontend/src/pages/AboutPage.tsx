import React from 'react';
import { Layers, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const techStack = [
    { category: 'Deep Learning', items: ['PyTorch 2.2+', 'Transformers (DistilBERT)', 'Torchvision (ResNet-18)'] },
    { category: 'Backend Engine', items: ['FastAPI', 'Uvicorn ASGI', 'Pillow (PIL)'] },
    { category: 'Frontend UI', items: ['React 19', 'Vite 8', 'TypeScript', 'Tailwind CSS v4', 'Lucide React'] },
    { category: 'Dataset Benchmark', items: ['Hugging Face NShreya/Comp4.0', '915 Multi-turn Complaints', 'Held-out Test (138)'] }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
      
      {/* Brand & Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm tracking-wider text-white">COMFUSE • v1.0</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Multimodal Customer Complaint Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
          An academic research prototype developed for automated triage of real-world customer complaints through joint textual and visual representation fusion.
        </p>
      </div>

      {/* Purpose & Project Context */}
      <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Project Objective & Problem Statement
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Customer service disputes on modern platforms frequently feature terse text accompanied by screenshot evidence (e.g. app freeze screens, damaged packages, or invalid billing deductions). Pure textual classifiers fail on ambiguous text like <em>"Look at this issue!"</em>, while computer vision alone misses nuanced speech acts.
        </p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          ComFuse bridges this gap by unifying DistilBERT linguistic representations with ResNet-18 visual feature maps, predicting both the <strong>Complaint Aspect</strong> (6 categories) and <strong>Complaint Severity</strong> (4 intensity levels) concurrently.
        </p>
      </div>

      {/* Technology Stack Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {techStack.map((col) => (
          <div key={col.category} className="p-4 rounded-xl bg-[#0c0d16] border border-white/[0.07] space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              {col.category}
            </span>
            <ul className="space-y-1 text-xs text-zinc-300 font-mono">
              {col.items.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-indigo-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Checkpoint Preservation Note */}
      <div className="p-4 rounded-xl bg-[#080910] border border-white/[0.06] flex items-start gap-3 text-xs text-zinc-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-zinc-200">Reproducibility Guarantee: </strong>
          The underlying deep learning weights (<code className="text-cyan-300 font-mono">models/best_multimodal_model.pt</code>) are frozen. The application UI connects directly via REST API calls to the PyTorch inference runtime, ensuring strictly verifiable predictions.
        </div>
      </div>

    </div>
  );
};
