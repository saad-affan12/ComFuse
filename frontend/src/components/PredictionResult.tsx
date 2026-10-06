import React from 'react';
import { Layers, ShieldAlert, Cpu, CheckCircle2, Eye, FileText } from 'lucide-react';
import type { PredictionResponse } from '../types';

interface PredictionResultProps {
  prediction: PredictionResponse | null;
  isLoading: boolean;
}

// Ordered classes matching config.py
const ASPECT_ORDER = ['Software', 'Hardware', 'Quality', 'Service', 'Price', 'Packaging'];
const SEVERITY_ORDER = ['No Explicit Reproach', 'Disapproval', 'Accusation', 'Blame'];

export const PredictionResult: React.FC<PredictionResultProps> = ({ prediction, isLoading }) => {
  if (isLoading) {
    return (
      <div
        className="h-full min-h-[460px] bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-950/40"
        aria-live="polite"
      >
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          <Cpu className="h-6 w-6 text-indigo-400 absolute" />
        </div>
        <h3 className="text-base font-semibold text-slate-100">
          Running Multimodal Neural Inference
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          DistilBERT is extracting contextual linguistic representations while ResNet-18 computes visual feature embeddings...
        </p>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div
        className="h-full min-h-[460px] bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner"
        aria-live="polite"
      >
        <div className="h-12 w-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
          <Layers className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          Your complaint analysis will appear here.
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Enter customer complaint text and optional screenshot evidence on the left, then click <strong>Analyze Complaint</strong>.
        </p>
      </div>
    );
  }

  const { prediction_mode, aspect, severity, metadata } = prediction;
  const isMultimodal = prediction_mode.toLowerCase() === 'multimodal';

  return (
    <div
      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col gap-6 shadow-xl shadow-slate-950/40"
      aria-live="polite"
    >
      
      {/* Top Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500"></div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Analysis Result
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isMultimodal
                ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
            }`}
          >
            {isMultimodal ? (
              <>
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                <span>Multimodal Fusion</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Text-Only Fallback</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* ASPECT PREDICTION CARD */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Complaint Aspect
            </span>
            <span className="text-[10px] text-slate-400 font-mono">6 classes</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Confidence:</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              {(aspect.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Top predicted label */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {aspect.label}
          </span>
          <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Top Prediction
          </span>
        </div>

        {/* Probability distribution horizontal bars */}
        <div className="space-y-2 pt-2 border-t border-slate-900">
          {ASPECT_ORDER.map((cls) => {
            const prob = aspect.probabilities[cls] ?? 0;
            const pct = (prob * 100).toFixed(1);
            const isTop = cls === aspect.label;

            return (
              <div key={cls} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${isTop ? 'text-white' : 'text-slate-400'}`}>
                    {cls}
                  </span>
                  <span className={`font-mono text-[11px] ${isTop ? 'text-indigo-300 font-bold' : 'text-slate-400'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTop
                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                        : 'bg-slate-700/60'
                    }`}
                    style={{ width: `${Math.max(Number(pct), 2)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEVERITY PREDICTION CARD */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Complaint Severity
            </span>
            <span className="text-[10px] text-slate-400 font-mono">4 classes</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Confidence:</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              {(severity.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Top predicted label */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {severity.label}
          </span>
          <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            Top Prediction
          </span>
        </div>

        {/* Probability distribution horizontal bars */}
        <div className="space-y-2 pt-2 border-t border-slate-900">
          {SEVERITY_ORDER.map((cls) => {
            const prob = severity.probabilities[cls] ?? 0;
            const pct = (prob * 100).toFixed(1);
            const isTop = cls === severity.label;

            return (
              <div key={cls} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${isTop ? 'text-white' : 'text-slate-400'}`}>
                    {cls}
                  </span>
                  <span className={`font-mono text-[11px] ${isTop ? 'text-amber-300 font-bold' : 'text-slate-400'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTop
                        ? 'bg-gradient-to-r from-amber-500 to-rose-400'
                        : 'bg-slate-700/60'
                    }`}
                    style={{ width: `${Math.max(Number(pct), 2)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {metadata?.explanation && (
        <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
          <strong className="text-slate-300">Model Pipeline: </strong>
          {metadata.explanation}
        </div>
      )}

    </div>
  );
};
