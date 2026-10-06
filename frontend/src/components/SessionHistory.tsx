import React from 'react';
import { History, Eye, FileText, Clock } from 'lucide-react';
import type { HistoryItem } from '../types';

interface SessionHistoryProps {
  history: HistoryItem[];
  onSelectHistory?: (item: HistoryItem) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Session Analysis History (Last 5)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          In-memory session only • Not stored in DB
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-2 px-3 font-semibold">Time</th>
              <th className="py-2 px-3 font-semibold">Mode</th>
              <th className="py-2 px-3 font-semibold">Complaint Excerpt</th>
              <th className="py-2 px-3 font-semibold">Predicted Aspect</th>
              <th className="py-2 px-3 font-semibold">Predicted Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {history.map((item) => {
              const isMultimodal = item.mode === 'multimodal';
              return (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {item.timestamp}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        isMultimodal
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-850'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isMultimodal ? <Eye className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      {item.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-[260px] truncate text-slate-300 font-normal">
                    {item.text}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-100">{item.aspectLabel}</span>
                    <span className="ml-1.5 text-[10px] text-indigo-400 font-mono">
                      {(item.aspectConfidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-100">{item.severityLabel}</span>
                    <span className="ml-1.5 text-[10px] text-amber-400 font-mono">
                      {(item.severityConfidence * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
