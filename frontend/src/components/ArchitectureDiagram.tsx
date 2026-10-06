import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon, FileText, ArrowRight, ArrowDown, Merge, Layers } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              How ComFuse Analyzes This Complaint
            </h3>
            <p className="text-xs text-slate-400">
              Dual-backbone feature fusion architecture (DistilBERT + ResNet-18)
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 sm:p-6 border-t border-slate-800/80 bg-slate-950/70">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* TEXT BRANCH */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <FileText className="h-4 w-4" />
                Textual Branch
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono">Complaint Text</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="px-2 py-1 rounded bg-indigo-950/80 text-indigo-300 font-semibold border border-indigo-800/50">
                  DistilBERT
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="px-2 py-1 rounded bg-slate-800 text-cyan-400 font-mono font-bold">256-d</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Encodes linguistic cues, reproach intensity, and semantic complaints into a dense 256-dimensional representation.
              </p>
            </div>

            {/* IMAGE BRANCH */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                <ImageIcon className="h-4 w-4" />
                Visual Branch
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono">Evidence Image</span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="px-2 py-1 rounded bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-800/50">
                  ResNet-18
                </span>
                <ArrowRight className="h-3 w-3 text-slate-400" />
                <span className="px-2 py-1 rounded bg-slate-800 text-cyan-400 font-mono font-bold">256-d</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Extracts visual artifacts (cracked screens, app error dialogs, billing notices) or zero fallback tensor if absent.
              </p>
            </div>

          </div>

          {/* FUSION AND OUTPUTS FLOW */}
          <div className="mt-4 flex flex-col items-center">
            
            <div className="my-2 flex items-center justify-center">
              <ArrowDown className="h-4 w-4 text-slate-400" />
            </div>

            <div className="w-full max-w-xl bg-slate-900/90 border border-indigo-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Merge className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Concatenation & Fusion MLP</div>
                  <div className="text-[11px] text-slate-400 font-mono">[256-d Text ⊕ 256-d Image] → 512-d Fused Vector</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-medium">
                Unified Representation
              </span>
            </div>

            <div className="my-2 flex items-center justify-center">
              <ArrowDown className="h-4 w-4 text-slate-400" />
            </div>

            {/* DUAL HEADS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Head 1: Complaint Aspect</div>
                  <div className="text-[10px] text-slate-400">Software, Hardware, Quality, Service, Price, Packaging</div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  6 classes
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Head 2: Complaint Severity</div>
                  <div className="text-[10px] text-slate-400">No Reproach, Disapproval, Accusation, Blame</div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  4 classes
                </span>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
};
