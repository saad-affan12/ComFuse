import React from 'react';
import {
  BarChart3,
  Eye,
  FileText,
  Activity,
  CheckCircle2,
  ShieldAlert,
  Clock
} from 'lucide-react';
import type { AnalysisRecord } from '../types';

interface DashboardPageProps {
  history: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onNavigateToAnalyze: () => void;
}

const ASPECT_CLASSES = ['Software', 'Hardware', 'Quality', 'Service', 'Price', 'Packaging'];
const SEVERITY_CLASSES = ['Blame', 'Disapproval', 'No Explicit Reproach', 'Accusation'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  history,
  onSelectRecord,
  onNavigateToAnalyze,
}) => {
  const total = history.length;
  const multimodalCount = history.filter((r) => r.mode === 'multimodal').length;
  const textOnlyCount = history.filter((r) => r.mode === 'text-only').length;

  // Aspect distribution
  const aspectCounts: Record<string, number> = {};
  ASPECT_CLASSES.forEach((c) => (aspectCounts[c] = 0));
  history.forEach((r) => {
    if (r.aspectLabel) {
      aspectCounts[r.aspectLabel] = (aspectCounts[r.aspectLabel] || 0) + 1;
    }
  });

  // Severity distribution
  const severityCounts: Record<string, number> = {};
  SEVERITY_CLASSES.forEach((c) => (severityCounts[c] = 0));
  history.forEach((r) => {
    if (r.severityLabel) {
      severityCounts[r.severityLabel] = (severityCounts[r.severityLabel] || 0) + 1;
    }
  });

  // Top Aspect & Severity
  let topAspect = 'None';
  let maxAspectCount = 0;
  Object.entries(aspectCounts).forEach(([k, v]) => {
    if (v > maxAspectCount) {
      maxAspectCount = v;
      topAspect = k;
    }
  });

  let topSeverity = 'None';
  let maxSeverityCount = 0;
  Object.entries(severityCounts).forEach(([k, v]) => {
    if (v > maxSeverityCount) {
      maxSeverityCount = v;
      topSeverity = k;
    }
  });

  // Average confidence
  const avgAspectConf =
    total > 0
      ? (history.reduce((acc, r) => acc + (r.aspectConfidence || 0), 0) / total) * 100
      : 0;
  const avgSeverityConf =
    total > 0
      ? (history.reduce((acc, r) => acc + (r.severityConfidence || 0), 0) / total) * 100
      : 0;

  if (total === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Analytics Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Understand your complaint analysis activity from actual session data.
          </p>
        </div>

        <div className="p-12 text-center bg-[#0c0d16] border border-white/[0.08] rounded-2xl flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Analysis Records Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Run your first complaint analysis in the workspace to generate live analytics and distributions.
            </p>
          </div>
          <button
            onClick={onNavigateToAnalyze}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            Go to Analyze Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Analytics Overview
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Understand your complaint analysis activity generated from the current session.
        </p>
      </div>

      {/* KPI Row (5 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div className="p-4 rounded-xl bg-[#0c0d16] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Analyses</span>
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{total}</div>
          <div className="text-[10px] text-zinc-400">Recorded sessions</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0d16] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Multimodal</span>
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{multimodalCount}</div>
          <div className="text-[10px] text-indigo-300 font-mono">
            {total > 0 ? ((multimodalCount / total) * 100).toFixed(0) : 0}% of total
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0d16] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Text-Only</span>
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{textOnlyCount}</div>
          <div className="text-[10px] text-zinc-400 font-mono">
            {total > 0 ? ((textOnlyCount / total) * 100).toFixed(0) : 0}% of total
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0d16] border border-white/[0.07] space-y-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Top Aspect</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-extrabold text-white truncate">{topAspect}</div>
          <div className="text-[10px] text-zinc-400 font-mono">{maxAspectCount} occurrences</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0c0d16] border border-white/[0.07] space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Top Severity</span>
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-extrabold text-white truncate">{topSeverity}</div>
          <div className="text-[10px] text-zinc-400 font-mono">{maxSeverityCount} occurrences</div>
        </div>

      </div>

      {/* Main Analytics: Aspect vs Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Aspect Distribution */}
        <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Aspect Distribution
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">6 classes</span>
          </div>

          <div className="space-y-2.5">
            {ASPECT_CLASSES.map((cls) => {
              const count = aspectCounts[cls] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={cls} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{cls}</span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#080910] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Severity Distribution
            </h3>
            <span className="text-[10px] font-mono text-zinc-400">4 tiers</span>
          </div>

          <div className="space-y-2.5">
            {SEVERITY_CLASSES.map((cls) => {
              const count = severityCounts[cls] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={cls} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{cls}</span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#080910] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-400 transition-all duration-500"
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Second Row: Analysis Mode Ratio & Average Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Mode Split */}
        <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Analysis Mode Breakdown
          </h3>
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Multimodal: {multimodalCount}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                <span>Text-Only: {textOnlyCount}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-cyan-300">
                {total > 0 ? ((multimodalCount / total) * 100).toFixed(0) : 0}%
              </span>
              <div className="text-[10px] text-zinc-400">Multimodal Adoption</div>
            </div>
          </div>
          <div className="h-2.5 w-full bg-[#080910] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${total > 0 ? (multimodalCount / total) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-zinc-700"
              style={{ width: `${total > 0 ? (textOnlyCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Confidence Overview */}
        <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Mean Model Confidence
          </h3>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.04]">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Aspect Mean</div>
              <div className="text-xl font-extrabold text-cyan-300 font-mono mt-0.5">
                {avgAspectConf.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#080910] border border-white/[0.04]">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Severity Mean</div>
              <div className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">
                {avgSeverityConf.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Table (Last 5-10 records) */}
      <div className="p-5 rounded-2xl bg-[#0c0d16] border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Recent Analyses
          </h3>
          <span className="text-[11px] text-zinc-400">Click any row to view details</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-400 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold">Time</th>
                <th className="py-2.5 px-3 font-semibold">Mode</th>
                <th className="py-2.5 px-3 font-semibold">Complaint Excerpt</th>
                <th className="py-2.5 px-3 font-semibold">Aspect</th>
                <th className="py-2.5 px-3 font-semibold">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {history.slice(0, 8).map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelectRecord(r)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {r.timestamp}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
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
                  <td className="py-3 px-3 max-w-[240px] truncate text-zinc-200 group-hover:text-cyan-300 transition-colors">
                    {r.text}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-white">{r.aspectLabel}</span>
                    <span className="ml-1 text-[10px] text-cyan-400 font-mono">
                      {(r.aspectConfidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-white">{r.severityLabel}</span>
                    <span className="ml-1 text-[10px] text-amber-400 font-mono">
                      {(r.severityConfidence * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
