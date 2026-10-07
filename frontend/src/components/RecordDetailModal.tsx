import React from 'react';
import { X, CheckCircle2, ShieldAlert, Clock, Layers } from 'lucide-react';
import type { AnalysisRecord } from '../types';

interface RecordDetailModalProps {
  record: AnalysisRecord | null;
  onClose: () => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const complaintText = record.complaintText || record.text;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white border border-purple-100 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Analysis Details</h3>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                {new Date(record.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-purple-50 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Complaint Text */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Customer Complaint Text
          </label>
          <div className="p-4 rounded-2xl bg-purple-50/30 border border-purple-100 text-xs text-zinc-800 leading-relaxed font-sans">
            {complaintText}
          </div>
        </div>

        {/* Image Evidence (if any) */}
        {record.imagePreviewUrl && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
              Visual Evidence
            </label>
            <div className="p-3 rounded-2xl bg-zinc-50 border border-purple-100 flex justify-center">
              <img
                src={record.imagePreviewUrl}
                alt="Complaint evidence"
                className="max-h-56 rounded-xl object-contain"
              />
            </div>
          </div>
        )}

        {/* Mode & Prediction Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">
                Aspect
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-mono font-bold">
                {((record.aspectConfidence || 0) * 100).toFixed(1)}% Conf
              </span>
            </div>
            <div className="text-lg font-bold text-zinc-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
              <span>{record.aspectLabel}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                Severity
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-mono font-bold">
                {((record.severityConfidence || 0) * 100).toFixed(1)}% Conf
              </span>
            </div>
            <div className="text-lg font-bold text-zinc-900 flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <span>{record.severityLabel}</span>
            </div>
          </div>
        </div>

        {/* Probability Breakdown from raw response */}
        {record.rawResponse?.aspect?.probabilities && (
          <div className="space-y-3 pt-2 border-t border-purple-50">
            <div className="text-xs font-bold text-zinc-800">
              Detailed Probability Scores
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {Object.entries(record.rawResponse.aspect.probabilities).map(([k, v]) => (
                <div key={k} className="p-2 rounded-xl bg-purple-50/30 border border-purple-50 flex items-center justify-between">
                  <span className="text-zinc-600 font-medium">{k}</span>
                  <span className="font-bold text-purple-700">{((v as number) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-purple-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:bg-purple-700 transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
