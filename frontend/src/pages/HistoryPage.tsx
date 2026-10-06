import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Eye,
  FileText,
  Clock,
  ArrowUpDown,
  AlertTriangle,
  Layers
} from 'lucide-react';
import type { AnalysisRecord } from '../types';

interface HistoryPageProps {
  history: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearHistory: () => void;
  onNavigateToAnalyze: () => void;
}

const ASPECT_OPTIONS = ['All', 'Software', 'Hardware', 'Quality', 'Service', 'Price', 'Packaging'];
const SEVERITY_OPTIONS = ['All', 'Blame', 'Disapproval', 'No Explicit Reproach', 'Accusation'];
const MODE_OPTIONS = ['All', 'multimodal', 'text-only'];
const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest Confidence', 'Lowest Confidence'];

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onSelectRecord,
  onDeleteRecord,
  onClearHistory,
  onNavigateToAnalyze,
}) => {
  const [search, setSearch] = useState<string>('');
  const [aspectFilter, setAspectFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [modeFilter, setModeFilter] = useState<string>('All');
  const [sortOption, setSortOption] = useState<string>('Newest');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Filter & Sort Pipeline
  const filteredRecords = useMemo(() => {
    let result = [...history];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.aspectLabel.toLowerCase().includes(q) ||
          r.severityLabel.toLowerCase().includes(q)
      );
    }

    // Aspect filter
    if (aspectFilter !== 'All') {
      result = result.filter((r) => r.aspectLabel === aspectFilter);
    }

    // Severity filter
    if (severityFilter !== 'All') {
      result = result.filter((r) => r.severityLabel === severityFilter);
    }

    // Mode filter
    if (modeFilter !== 'All') {
      result = result.filter((r) => r.mode === modeFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'Newest') {
        return Number(b.id) - Number(a.id);
      }
      if (sortOption === 'Oldest') {
        return Number(a.id) - Number(b.id);
      }
      if (sortOption === 'Highest Confidence') {
        return (b.aspectConfidence || 0) - (a.aspectConfidence || 0);
      }
      if (sortOption === 'Lowest Confidence') {
        return (a.aspectConfidence || 0) - (b.aspectConfidence || 0);
      }
      return 0;
    });

    return result;
  }, [history, search, aspectFilter, severityFilter, modeFilter, sortOption]);

  if (history.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Review and filter previously analyzed customer complaints.
          </p>
        </div>

        <div className="p-12 text-center bg-[#0c0d16] border border-white/[0.08] rounded-2xl flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Complaint History Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Analyzed complaints are stored in local browser memory and displayed here with full classification details.
            </p>
          </div>
          <button
            onClick={onNavigateToAnalyze}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header with Clear History Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Review, search, and manage previously analyzed customer complaints ({history.length} records).
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-rose-900/50 hover:border-rose-700 bg-rose-950/30 text-rose-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="h-4 w-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints, aspects, or severity labels..."
            className="w-full bg-[#080910] border border-white/[0.07] focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
          />
        </div>

        {/* Filters and Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          
          {/* Aspect Filter */}
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
              Aspect
            </label>
            <select
              value={aspectFilter}
              onChange={(e) => setAspectFilter(e.target.value)}
              className="w-full bg-[#080910] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-zinc-200 outline-none cursor-pointer"
            >
              {ASPECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0c0d16]">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-[#080910] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-zinc-200 outline-none cursor-pointer"
            >
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0c0d16]">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1">
              Mode
            </label>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full bg-[#080910] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-zinc-200 outline-none capitalize cursor-pointer"
            >
              {MODE_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0c0d16]">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[10px] text-zinc-400 font-semibold uppercase block mb-1 flex items-center gap-1">
              <ArrowUpDown className="h-2.5 w-2.5" />
              Sort By
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full bg-[#080910] border border-white/[0.07] rounded-lg px-2.5 py-1.5 text-zinc-200 outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0c0d16]">
                  {opt}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-[#0c0d16] border border-white/[0.08] rounded-2xl overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No complaints match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Time</th>
                  <th className="py-3 px-4 font-semibold">Mode</th>
                  <th className="py-3 px-4 font-semibold">Complaint Preview</th>
                  <th className="py-3 px-4 font-semibold">Aspect</th>
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {r.timestamp}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          r.mode === 'multimodal'
                            ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {r.mode === 'multimodal' ? <Eye className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
                        {r.mode}
                      </span>
                    </td>
                    <td
                      onClick={() => onSelectRecord(r)}
                      className="py-3 px-4 max-w-[280px] truncate text-zinc-200 group-hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      {r.text}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white">{r.aspectLabel}</span>
                      <span className="ml-1 text-[10px] text-cyan-400 font-mono">
                        {(r.aspectConfidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white">{r.severityLabel}</span>
                      <span className="ml-1 text-[10px] text-amber-400 font-mono">
                        {(r.severityConfidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectRecord(r)}
                          className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400 bg-[#0c0d16] rounded-xl border border-white/[0.08]">
            No complaints match the filter.
          </div>
        ) : (
          filteredRecords.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl bg-[#0c0d16] border border-white/[0.08] space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono text-[11px] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {r.timestamp}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    r.mode === 'multimodal'
                      ? 'bg-cyan-950 text-cyan-300'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {r.mode}
                </span>
              </div>

              <p
                onClick={() => onSelectRecord(r)}
                className="text-xs text-zinc-200 line-clamp-2 cursor-pointer"
              >
                {r.text}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                <div>
                  <span className="font-semibold text-white">{r.aspectLabel}</span>
                  <span className="text-zinc-400"> • </span>
                  <span className="font-semibold text-white">{r.severityLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectRecord(r)}
                    className="text-xs text-cyan-400 font-semibold cursor-pointer"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onDeleteRecord(r.id)}
                    className="text-zinc-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Clear History */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0e101a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Clear Analysis History?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This will permanently delete all {history.length} analysis records saved in your current browser session. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:bg-white/[0.05] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
