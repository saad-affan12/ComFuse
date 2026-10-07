import React from 'react';
import { Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const techStack = [
    { category: 'Deep Learning', items: ['PyTorch 2.2+', 'Transformers (DistilBERT)', 'Torchvision (ResNet-18)'] },
    { category: 'Backend Engine', items: ['FastAPI', 'Uvicorn ASGI', 'Pillow (PIL)'] },
    { category: 'Frontend UI', items: ['React 19', 'Vite 8', 'TypeScript', 'Tailwind CSS v4', 'Lucide React'] },
    { category: 'Dataset Benchmark', items: ['Hugging Face NShreya/Comp4.0', '915 Multi-turn Complaints', 'Held-out Test (138)'] }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12">
      
      {/* Brand & Title */}
      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
          <Layers className="h-4 w-4 text-purple-600" />
          <span>COMFUSE • AI ARCHITECTURE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
          Multimodal Customer Complaint Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-2xl font-medium">
          Automated triage of real-world customer complaints through joint textual and visual representation fusion.
        </p>
      </div>

      {/* Purpose & Project Context */}
      <div className="dribbble-card p-6 sm:p-7 space-y-3 bg-white">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-700">
          Project Objective & Problem Statement
        </h3>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Customer service disputes on modern platforms frequently feature terse text accompanied by screenshot evidence (e.g. app freeze screens, damaged packages, or invalid billing deductions). Pure textual classifiers fail on ambiguous text like <em>"Look at this issue!"</em>, while computer vision alone misses nuanced speech acts.
        </p>
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          ComFuse bridges this gap by unifying DistilBERT linguistic representations with ResNet-18 visual feature maps, predicting both the <strong>Complaint Aspect</strong> (6 categories) and <strong>Complaint Severity</strong> (4 intensity levels) concurrently.
        </p>
      </div>

      {/* Technology Stack Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {techStack.map((col) => (
          <div key={col.category} className="dribbble-card p-5 sm:p-6 space-y-3 bg-white">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600">
              {col.category}
            </span>
            <ul className="space-y-2 text-xs text-zinc-700 font-mono">
              {col.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Checkpoint Preservation Note */}
      <div className="dribbble-card p-5 sm:p-6 bg-purple-50/40 border border-purple-100 flex items-start gap-3.5 text-xs text-zinc-600">
        <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-zinc-900 font-bold">Live Checkpoint Runtime: </strong>
          The underlying deep learning weights (<code className="text-purple-700 bg-purple-100/80 px-1.5 py-0.5 rounded font-mono font-bold">models/best_multimodal_model.pt</code>) are actively served via FastAPI. The application UI connects directly via REST API calls to the PyTorch inference runtime, ensuring instant, reproducible predictions.
        </div>
      </div>

    </div>
  );
};
