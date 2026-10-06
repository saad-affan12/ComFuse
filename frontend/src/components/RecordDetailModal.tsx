import React from 'react';
import { X, Eye, FileText, CheckCircle2, ShieldAlert, Clock, Layers } from 'lucide-react';
import type { AnalysisRecord } from '../types';

interface RecordDetailModalProps {
  record: AnalysisRecord | null;
  onClose: () => void;
}

const ASPECT_ORDER = ['Software', 'Hardware', 'Quality', 'Service', 'Price', 'Packaging'];
const SEVERITY_ORDER = ['No Explicit Reproach', 'Disapproval', 'Accusation', 'Blame'];

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const isMultimodal = record.mode === 'multimodal';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#0e101a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Analysis Details</h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3" />
                {record.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Complaint Text */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Customer Complaint
          </label>
          <div className="p-3.5 rounded-xl bg-[#080910] border border-white/[0.06] text-xs text-zinc-200 leading-relaxed font-sans">
            {record.text}
          </div>
        </div>

        {/* Mode & Highlights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#080910] border border-white/[0.06] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Complaint Aspect
            </span>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                {record.aspectLabel}
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {(record.aspectConfidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080910] border border-white/[0.06] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Complaint Severity
            </span>
            <div className="flex items-baseline justify-between">
              <div className="text-xl font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                {record.severityLabel}
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {(record.severityConfidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Aspect Probability Distribution */}
        {record.aspectProbabilities && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span>Aspect Probability Distribution</span>
              <span className="text-[10px] text-zinc-400 font-mono">6 classes</span>
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-[#080910] border border-white/[0.06]">
              {ASPECT_ORDER.map((cls) => {
                const prob = record.aspectProbabilities[cls] ?? 0;
                const pct = (prob * 100).toFixed(1);
                const isTop = cls === record.aspectLabel;
                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isTop ? 'text-white font-bold' : 'text-zinc-400'}>
                        {cls}
                      </span>
                      <span className={`font-mono ${isTop ? 'text-cyan-400 font-bold' : 'text-zinc-400'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isTop
                            ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                            : 'bg-zinc-700/50'
                        }`}
                        style={{ width: `${Math.max(Number(pct), 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Severity Probability Distribution */}
        {record.severityProbabilities && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
              <span>Severity Probability Distribution</span>
              <span className="text-[10px] text-zinc-400 font-mono">4 classes</span>
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-[#080910] border border-white/[0.06]">
              {SEVERITY_ORDER.map((cls) => {
                const prob = record.severityProbabilities[cls] ?? 0;
                const pct = (prob * 100).toFixed(1);
                const isTop = cls === record.severityLabel;
                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isTop ? 'text-white font-bold' : 'text-zinc-400'}>
                        {cls}
                      </span>
                      <span className={`font-mono ${isTop ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isTop
                            ? 'bg-gradient-to-r from-amber-500 to-rose-400'
                            : 'bg-zinc-700/50'
                        }`}
                        style={{ width: `${Math.max(Number(pct), 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            {isMultimodal ? <Eye className="h-3.5 w-3.5 text-cyan-400" /> : <FileText className="h-3.5 w-3.5 text-zinc-400" />}
            <span>Mode: {record.mode}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
