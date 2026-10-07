import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Eye,
  AlertTriangle,
  History
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
          (r.complaintText || r.text || '').toLowerCase().includes(q) ||
          (r.aspectLabel || '').toLowerCase().includes(q) ||
          (r.severityLabel || '').toLowerCase().includes(q)
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
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortOption === 'Oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
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
      <div className="space-y-6 animate-in fade-in duration-300 pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            Review and filter previously analyzed customer complaints.
          </p>
        </div>

        <div className="p-12 text-center dribbble-card bg-white border border-purple-100 flex flex-col items-center justify-center space-y-4">
          <div className="h-14 w-14 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
            <History className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900">No Analysis History Yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              Your inspected complaint records and multimodal predictions will be stored locally and displayed here.
            </p>
          </div>
          <button
            onClick={onNavigateToAnalyze}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#9333ea] to-[#7c3aed] text-white text-xs font-bold shadow-md shadow-purple-500/25 hover:shadow-lg transition cursor-pointer"
          >
            Analyze First Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Analysis History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            {history.length} saved {history.length === 1 ? 'record' : 'records'} stored in your local session.
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition shadow-sm cursor-pointer w-fit"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear All Records</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="dribbble-card p-4 sm:p-5 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, aspect, or severity..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-purple-50/30 border border-purple-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-200 text-zinc-800 placeholder-zinc-400"
            />
          </div>

          {/* Aspect Select */}
          <select
            value={aspectFilter}
            onChange={(e) => setAspectFilter(e.target.value)}
            className="px-3.5 py-2 text-xs bg-purple-50/30 border border-purple-100 rounded-full text-zinc-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {ASPECT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>Aspect: {opt}</option>
            ))}
          </select>

          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3.5 py-2 text-xs bg-purple-50/30 border border-purple-100 rounded-full text-zinc-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>Severity: {opt}</option>
            ))}
          </select>

          {/* Mode Select */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3.5 py-2 text-xs bg-purple-50/30 border border-purple-100 rounded-full text-zinc-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>Mode: {opt}</option>
            ))}
          </select>

          {/* Sort Select */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3.5 py-2 text-xs bg-purple-50/30 border border-purple-100 rounded-full text-zinc-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>Sort: {opt}</option>
            ))}
          </select>

        </div>
      </div>

      {/* History Table */}
      <div className="dribbble-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-50 bg-purple-50/30 text-zinc-500 uppercase font-mono text-[10px]">
                <th className="py-3.5 px-4 font-bold">Complaint Text</th>
                <th className="py-3.5 px-4 font-bold">Modality</th>
                <th className="py-3.5 px-4 font-bold">Predicted Aspect</th>
                <th className="py-3.5 px-4 font-bold">Predicted Severity</th>
                <th className="py-3.5 px-4 font-bold">Timestamp</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="hover:bg-purple-50/40 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-4 max-w-sm truncate text-zinc-800 font-semibold">
                    {record.complaintText || record.text}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        record.mode === 'multimodal'
                          ? 'bg-purple-100 border-purple-200 text-purple-700'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                      }`}
                    >
                      {record.mode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-purple-700">{record.aspectLabel}</span>
                    <span className="text-zinc-400 text-[10px] ml-1">
                      ({((record.aspectConfidence || 0) * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-amber-700">{record.severityLabel}</span>
                    <span className="text-zinc-400 text-[10px] ml-1">
                      ({((record.severityConfidence || 0) * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(record.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectRecord(record)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-700 hover:bg-purple-100/60 transition cursor-pointer"
                        title="Inspect record"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Clearing History */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-purple-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-purple-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Clear All Analysis History?</h3>
                <p className="text-xs text-zinc-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-600/20 hover:bg-rose-700 cursor-pointer"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
