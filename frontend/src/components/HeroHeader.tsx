import React from 'react';
import { Cpu, Binary } from 'lucide-react';

export const HeroHeader: React.FC = () => {
  return (
    <div className="py-6 sm:py-8 border-b border-slate-900 bg-gradient-to-b from-slate-900/40 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                DistilBERT + ResNet-18
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">
                <Binary className="h-3 w-3 text-cyan-400" />
                Dual-Head Fusion
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Multimodal Customer Complaint Intelligence
            </h1>
            <p className="mt-1 text-sm sm:text-base text-slate-400 max-w-3xl">
              Analyze customer complaints using both textual context and visual evidence.
              Jointly predict complaint <strong className="text-slate-200">Aspect</strong> (6 categories) and <strong className="text-slate-200">Severity</strong> (4 intensity tiers) with calibrated deep learning inference.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Inference Model</div>
                <div className="font-mono text-slate-200">best_multimodal_model.pt</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
