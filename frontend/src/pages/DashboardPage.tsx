import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  FileText,
  Activity,
  Layers,
  ShieldAlert,
  Settings,
  ArrowUpRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import type { AnalysisRecord } from '../types';

interface DashboardPageProps {
  history: AnalysisRecord[];
  onSelectRecord?: (record: AnalysisRecord) => void;
  onNavigateToAnalyze?: () => void;
}

const ASPECT_CLASSES = ['Software', 'Hardware', 'Quality', 'Service', 'Price', 'Packaging'] as const;
const SEVERITY_CLASSES = ['No Explicit Reproach', 'Disapproval', 'Accusation', 'Blame'] as const;

// Base benchmark dataset counts (Comp4.0 benchmark: 915 total complaints)
const BASELINE_ASPECT: Record<string, number> = {
  Software: 693,
  Hardware: 90,
  Quality: 57,
  Service: 56,
  Price: 10,
  Packaging: 9,
};

const BASELINE_SEVERITY: Record<string, number> = {
  'Blame': 279,
  'Disapproval': 269,
  'No Explicit Reproach': 211,
  'Accusation': 156,
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  history,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [activeLegend, setActiveLegend] = useState<{ aspect: boolean; severity: boolean; joint: boolean }>({
    aspect: true,
    severity: true,
    joint: true,
  });
  const [hoveredCaseIndex, setHoveredCaseIndex] = useState<number | null>(null);
  const [hoveredAspectIndex, setHoveredAspectIndex] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Compute live dynamic statistics combining session history + benchmark
  const stats = useMemo(() => {
    const sessionTotal = history.length;
    const sessionMultimodal = history.filter((r) => r.mode === 'multimodal' || r.imagePresent).length;
    const sessionTextOnly = sessionTotal - sessionMultimodal;

    // Dynamic Aspect counts
    const aspectCounts: Record<string, number> = { ...BASELINE_ASPECT };
    history.forEach((r) => {
      const label = r.aspectLabel;
      if (label && aspectCounts[label] !== undefined) {
        aspectCounts[label] += 1;
      }
    });

    // Dynamic Severity counts
    const severityCounts: Record<string, number> = { ...BASELINE_SEVERITY };
    history.forEach((r) => {
      const label = r.severityLabel;
      if (label && severityCounts[label] !== undefined) {
        severityCounts[label] += 1;
      }
    });

    const totalComplaints = 915 + sessionTotal;

    // Average Confidences from session history (or high-confidence baseline if 0 session records)
    const avgAspectConf = sessionTotal > 0
      ? (history.reduce((acc, r) => acc + (r.aspectConfidence || 0.8), 0) / sessionTotal) * 100
      : 84.6;

    const avgSeverityConf = sessionTotal > 0
      ? (history.reduce((acc, r) => acc + (r.severityConfidence || 0.75), 0) / sessionTotal) * 100
      : 76.8;

    const overallConfidence = ((avgAspectConf + avgSeverityConf) / 2);

    // Multimodal ratio
    const multimodalRatio = sessionTotal > 0
      ? (sessionMultimodal / sessionTotal) * 100
      : 72.4;

    // Top Aspect & Severity
    let topAspect = 'Software';
    let maxAspectVal = 0;
    Object.entries(aspectCounts).forEach(([k, v]) => {
      if (v > maxAspectVal) {
        maxAspectVal = v;
        topAspect = k;
      }
    });

    let topSeverity = 'Blame';
    let maxSevVal = 0;
    Object.entries(severityCounts).forEach(([k, v]) => {
      if (v > maxSevVal) {
        maxSevVal = v;
        topSeverity = k;
      }
    });

    return {
      sessionTotal,
      sessionMultimodal,
      sessionTextOnly,
      totalComplaints,
      aspectCounts,
      severityCounts,
      avgAspectConf,
      avgSeverityConf,
      overallConfidence,
      multimodalRatio,
      topAspect,
      topSeverity,
    };
  }, [history]);

  // Construct chart timeline cases from real history entries (or representative recent benchmark cases)
  const timelineData = useMemo(() => {
    const defaultCases = [
      { id: '1', name: 'Case #1', aspect: 82, severity: 74, joint: 78, text: 'Spotify playlist UI freeze bug', x: 50 },
      { id: '2', name: 'Case #2', aspect: 88, severity: 79, joint: 84, text: 'Damaged headphone casing crack', x: 150 },
      { id: '3', name: 'Case #3', aspect: 94, severity: 82, joint: 88, text: 'Billing deduction delay dispute', x: 250 },
      { id: '4', name: 'Case #4', aspect: 89, severity: 86, joint: 88, text: 'Camera sensor blur glitch', x: 350 },
      { id: '5', name: 'Case #5', aspect: 92, severity: 88, joint: 90, text: 'Shipping box smashed on delivery', x: 450 },
      { id: '6', name: 'Case #6', aspect: 95, severity: 91, joint: 93, text: 'Subscription renewal cancellation error', x: 550 },
      { id: '7', name: 'Case #7', aspect: 97, severity: 94, joint: 96, text: 'Battery overheating alarm notification', x: 650 },
    ];

    if (history.length === 0) {
      return defaultCases;
    }

    // Use recent history items
    const recent = [...history].slice(0, 7).reverse();
    const xCoords = [50, 150, 250, 350, 450, 550, 650];

    return recent.map((item, idx) => {
      const asp = Math.round((item.aspectConfidence || 0.85) * 100);
      const sev = Math.round((item.severityConfidence || 0.78) * 100);
      const jnt = Math.round((asp + sev) / 2);
      const snippet = (item.complaintText || item.text || '').substring(0, 45) + '...';

      return {
        id: item.id || `session_${idx + 1}`,
        name: `Case #${idx + 1}`,
        aspect: asp,
        severity: sev,
        joint: jnt,
        text: snippet,
        x: xCoords[idx] || (idx * 90 + 50),
      };
    });
  }, [history]);

  // Convert confidence percentage (0 - 100%) to SVG Y coordinate (310 is 0%, 50 is 100%)
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return 310 - (clamped / 100) * 250;
  };

  // Aspect bar chart data
  const maxAspectVal = Math.max(...Object.values(stats.aspectCounts));
  const aspectBarData = ASPECT_CLASSES.map((cls) => {
    const count = stats.aspectCounts[cls] || 0;
    const heightPercent = maxAspectVal > 0 ? (count / maxAspectVal) * 180 : 20;
    return {
      category: cls,
      count,
      height: Math.max(25, heightPercent),
    };
  });

  // Severity curves data
  const totalSev = Object.values(stats.severityCounts).reduce((a, b) => a + b, 0);
  const severityBreakdown = SEVERITY_CLASSES.map((sev, idx) => {
    const count = stats.severityCounts[sev] || 0;
    const pct = totalSev > 0 ? ((count / totalSev) * 100).toFixed(1) : '25.0';
    return {
      label: sev,
      count,
      percent: pct,
      x: idx * 95 + 40,
      y: 170 - (Number(pct) / 40) * 120,
    };
  });

  // Export Data directly as a clean, professionally styled PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Document Header
      doc.setFillColor(147, 51, 234); // Purple #9333ea
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('COMFUSE: MULTIMODAL COMPLAINT INTELLIGENCE REPORT', 14, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${dateStr} at ${timeStr} | Dual-Encoder: DistilBERT + ResNet-18`, 14, 22);

      // Section 1: Executive KPI Overview
      doc.setTextColor(30, 27, 75);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Executive Intelligence Overview', 14, 38);

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 42, 182, 30, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      doc.text(`Total Complaints Processed:`, 20, 52);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${stats.totalComplaints.toLocaleString()}`, 75, 52);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Avg Prediction Confidence:`, 20, 64);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${stats.overallConfidence.toFixed(1)}%`, 75, 64);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Multimodal Evidence Rate:`, 115, 52);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${stats.multimodalRatio.toFixed(1)}%`, 170, 52);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Primary Escalation Category:`, 115, 64);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(147, 51, 234);
      doc.text(`${stats.topSeverity}`, 170, 64);

      // Section 2: Complaint Aspect Breakdown Table
      doc.setTextColor(30, 27, 75);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Complaint Aspect Breakdown (6 Target Classes)', 14, 84);

      let currentY = 92;
      doc.setFillColor(243, 232, 255); // Light purple
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 33, 168);
      doc.text('Aspect Class', 20, currentY + 5.5);
      doc.text('Total Count', 100, currentY + 5.5);
      doc.text('Percentage Share', 150, currentY + 5.5);

      currentY += 8;
      const totalAspects = Object.values(stats.aspectCounts).reduce((a, b) => a + b, 0);

      ASPECT_CLASSES.forEach((cls) => {
        const count = stats.aspectCounts[cls] || 0;
        const pct = totalAspects > 0 ? ((count / totalAspects) * 100).toFixed(1) : '0';

        doc.setFillColor(255, 255, 255);
        doc.rect(14, currentY, 182, 7, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(14, currentY + 7, 196, currentY + 7);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(cls, 20, currentY + 5);
        doc.text(count.toLocaleString(), 100, currentY + 5);
        doc.text(`${pct}%`, 150, currentY + 5);

        currentY += 7;
      });

      // Section 3: Complaint Severity Breakdown Table
      currentY += 8;
      doc.setTextColor(30, 27, 75);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. Complaint Severity Breakdown (4 Intensity Tiers)', 14, currentY);

      currentY += 8;
      doc.setFillColor(254, 243, 199); // Light amber
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('Severity Class', 20, currentY + 5.5);
      doc.text('Incident Count', 100, currentY + 5.5);
      doc.text('Triage Ratio', 150, currentY + 5.5);

      currentY += 8;
      SEVERITY_CLASSES.forEach((sev) => {
        const count = stats.severityCounts[sev] || 0;
        const pct = totalSev > 0 ? ((count / totalSev) * 100).toFixed(1) : '0';

        doc.setFillColor(255, 255, 255);
        doc.rect(14, currentY, 182, 7, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(14, currentY + 7, 196, currentY + 7);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(sev, 20, currentY + 5);
        doc.text(count.toLocaleString(), 100, currentY + 5);
        doc.text(`${pct}%`, 150, currentY + 5);

        currentY += 7;
      });

      // Section 4: Recent Analyzed Cases Log
      currentY += 8;
      doc.setTextColor(30, 27, 75);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Recent Inspected Complaint Log', 14, currentY);

      currentY += 8;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Complaint Excerpt', 20, currentY + 5.5);
      doc.text('Aspect', 110, currentY + 5.5);
      doc.text('Severity', 145, currentY + 5.5);
      doc.text('Modality', 175, currentY + 5.5);

      currentY += 8;
      const recentCases = history.length > 0
        ? history.slice(0, 5)
        : [
            { text: 'Shuffle bug on playlist interface causes playback freeze', aspectLabel: 'Software', severityLabel: 'Blame', mode: 'multimodal' },
            { text: 'Damaged device casing crack observed upon opening package', aspectLabel: 'Quality', severityLabel: 'Disapproval', mode: 'multimodal' },
            { text: 'Unexplained service fee deduction charged on account invoice', aspectLabel: 'Service', severityLabel: 'Accusation', mode: 'text-only' },
          ];

      recentCases.forEach((item: any) => {
        const textSample = (item.complaintText || item.text || '').substring(0, 50) + '...';
        doc.setFillColor(255, 255, 255);
        doc.rect(14, currentY, 182, 7, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(14, currentY + 7, 196, currentY + 7);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(textSample, 20, currentY + 5);
        doc.text(item.aspectLabel || 'Software', 110, currentY + 5);
        doc.text(item.severityLabel || 'Blame', 145, currentY + 5);
        doc.text(item.mode === 'multimodal' ? 'Image+Text' : 'Text', 175, currentY + 5);

        currentY += 7;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('ComFuse AI System • Automated Multimodal Intelligence • Confidential Document', 14, 288);

      // Save PDF file
      doc.save(`ComFuse-Analytics-Report-${now.toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 relative pb-12">
      {/* Floating Purple Settings Badge Button on Right Edge */}
      <button
        onClick={() => setShowSettingsModal(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-l from-purple-600 to-purple-500 text-white p-3 rounded-l-2xl shadow-xl shadow-purple-500/30 hover:pl-4 transition-all duration-200 group flex items-center justify-center cursor-pointer"
        title="Model Calibration & Weights"
      >
        <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Analytics Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono font-bold text-xs">
              Live ComFuse Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            Real-time multimodal complaint intelligence, aspect distributions, and severity triage metrics
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Date Range Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-purple-100 rounded-full text-xs font-semibold text-zinc-700 shadow-sm hover:bg-purple-50/50 transition cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>
                {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'All Time'}
              </span>
            </button>

            {showTimeDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-purple-100 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { setTimeRange('7d'); setShowTimeDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 font-medium text-zinc-700 cursor-pointer"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => { setTimeRange('30d'); setShowTimeDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 font-medium text-zinc-700 cursor-pointer"
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => { setTimeRange('all'); setShowTimeDropdown(false); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 font-medium text-zinc-700 cursor-pointer"
                >
                  All Time
                </button>
              </div>
            )}
          </div>

          {/* Purple Gradient Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#9333ea] to-[#7c3aed] text-white text-xs font-bold rounded-full shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            title="Export complete report as PDF"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* 4 Project-Specific Stat Cards in a Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total Complaints Processed */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                TOTAL COMPLAINTS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                {stats.totalComplaints.toLocaleString()}
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">
              {stats.sessionTotal > 0 ? `+${stats.sessionTotal} session inputs` : 'Benchmark: 915 cases'}
            </span>
            <div className="flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-mono">
              <ArrowUpRight className="h-3 w-3" />
              <span>Live Synced</span>
            </div>
          </div>
        </div>

        {/* Card 2: Average Prediction Confidence */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                AVG PREDICTION CONFIDENCE
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                {stats.overallConfidence.toFixed(1)}%
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">Aspect & Severity Joint</span>
            <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
              <ArrowUpRight className="h-3 w-3" />
              <span>Calibrated</span>
            </div>
          </div>
        </div>

        {/* Card 3: Multimodal Attachment Rate */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                MULTIMODAL EVIDENCE RATE
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                {stats.multimodalRatio.toFixed(1)}%
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">Text + Screenshot Fusion</span>
            <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
              <ArrowUpRight className="h-3 w-3" />
              <span>Dual-Modal</span>
            </div>
          </div>
        </div>

        {/* Card 4: Top Severity Triage Level */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                PRIMARY SEVERITY ESCALATION
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1 truncate max-w-[170px]">
                {stats.topSeverity}
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">Priority SLA Route</span>
            <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-mono">
              <ArrowUpRight className="h-3 w-3" />
              <span>High Attention</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Area Chart Card: Complaint Prediction Confidence & Volume Trends */}
      <div className="dribbble-card p-6 sm:p-8 bg-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
              Complaint Confidence & Volume Analytics
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live confidence trajectories across recent complaints (Aspect vs Severity vs Joint Fusion)
            </p>
          </div>

          {/* Interactive Legend Dots */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveLegend((prev) => ({ ...prev, aspect: !prev.aspect }))}
              className={`flex items-center gap-1.5 cursor-pointer transition ${activeLegend.aspect ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
              <span className="text-zinc-700">Aspect Confidence (%)</span>
            </button>
            <button
              onClick={() => setActiveLegend((prev) => ({ ...prev, severity: !prev.severity }))}
              className={`flex items-center gap-1.5 cursor-pointer transition ${activeLegend.severity ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              <span className="text-zinc-700">Severity Confidence (%)</span>
            </button>
            <button
              onClick={() => setActiveLegend((prev) => ({ ...prev, joint: !prev.joint }))}
              className={`flex items-center gap-1.5 cursor-pointer transition ${activeLegend.joint ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
              <span className="text-zinc-700">Joint Fusion (%)</span>
            </button>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full h-[320px] sm:h-[360px]">
          <svg
            viewBox="0 0 700 340"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="aspectGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="jointGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Dashed Horizontal Grid Lines */}
            <g className="opacity-40">
              <line x1="40" y1="60" x2="680" y2="60" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="122" x2="680" y2="122" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="185" x2="680" y2="185" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="247" x2="680" y2="247" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="310" x2="680" y2="310" stroke="#e2e8f0" strokeWidth="1.5" />
            </g>

            {/* Dashed Vertical Grid Lines */}
            <g className="opacity-40">
              {timelineData.map((d, i) => (
                <line
                  key={i}
                  x1={d.x}
                  y1="50"
                  x2={d.x}
                  y2="310"
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}
            </g>

            {/* Y-Axis Labels: Project-specific Confidence % */}
            <g className="text-[11px] fill-zinc-400 font-mono">
              <text x="12" y="65">100%</text>
              <text x="18" y="127">75%</text>
              <text x="18" y="190">50%</text>
              <text x="18" y="252">25%</text>
              <text x="25" y="315">0%</text>
            </g>

            {/* X-Axis Labels: Complaint Cases */}
            <g className="text-[11px] fill-zinc-500 font-semibold">
              {timelineData.map((d, i) => (
                <text key={i} x={d.x} y="330" textAnchor="middle">
                  {d.name}
                </text>
              ))}
            </g>

            {/* SVG Path Construction */}
            {(() => {
              const makePath = (key: 'aspect' | 'severity' | 'joint') => {
                const pts = timelineData.map((d) => ({ x: d.x, y: getY(d[key]) }));
                if (pts.length === 0) return '';
                let path = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[i];
                  const p1 = pts[i + 1];
                  const cx = (p0.x + p1.x) / 2;
                  path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
                }
                return path;
              };

              const makeArea = (key: 'aspect' | 'severity' | 'joint') => {
                const linePath = makePath(key);
                if (!linePath) return '';
                const lastX = timelineData[timelineData.length - 1].x;
                const firstX = timelineData[0].x;
                return `${linePath} L ${lastX} 310 L ${firstX} 310 Z`;
              };

              return (
                <>
                  {activeLegend.aspect && (
                    <>
                      <path d={makeArea('aspect')} fill="url(#aspectGrad)" />
                      <path d={makePath('aspect')} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
                    </>
                  )}
                  {activeLegend.severity && (
                    <>
                      <path d={makeArea('severity')} fill="url(#severityGrad)" />
                      <path d={makePath('severity')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    </>
                  )}
                  {activeLegend.joint && (
                    <>
                      <path d={makeArea('joint')} fill="url(#jointGrad)" />
                      <path d={makePath('joint')} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                    </>
                  )}
                </>
              );
            })()}

            {/* Circular Data Node Points matching Dribbble screenshot */}
            {timelineData.map((d, i) => (
              <g
                key={i}
                onMouseEnter={() => setHoveredCaseIndex(i)}
                onMouseLeave={() => setHoveredCaseIndex(null)}
                className="cursor-pointer"
              >
                {activeLegend.aspect && (
                  <circle
                    cx={d.x}
                    cy={getY(d.aspect)}
                    r={hoveredCaseIndex === i ? 6.5 : 4.5}
                    fill="#ffffff"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                  />
                )}
                {activeLegend.severity && (
                  <circle
                    cx={d.x}
                    cy={getY(d.severity)}
                    r={hoveredCaseIndex === i ? 6.5 : 4.5}
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                )}
                {activeLegend.joint && (
                  <circle
                    cx={d.x}
                    cy={getY(d.joint)}
                    r={hoveredCaseIndex === i ? 6.5 : 4.5}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoveredCaseIndex !== null && (
            <div
              className="absolute top-8 bg-zinc-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/10 text-xs pointer-events-none z-30 transition-all duration-150"
              style={{
                left: `${(timelineData[hoveredCaseIndex].x / 700) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-bold text-purple-300 pb-1 border-b border-white/10 mb-1.5 flex items-center justify-between gap-4">
                <span>{timelineData[hoveredCaseIndex].name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">Telemetry</span>
              </div>
              <p className="text-[11px] text-zinc-300 mb-2 line-clamp-1 max-w-[200px]">
                "{timelineData[hoveredCaseIndex].text}"
              </p>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-4 text-purple-300">
                  <span>Aspect Conf:</span>
                  <span className="font-bold">{timelineData[hoveredCaseIndex].aspect}%</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-emerald-300">
                  <span>Severity Conf:</span>
                  <span className="font-bold">{timelineData[hoveredCaseIndex].severity}%</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-amber-300">
                  <span>Joint Score:</span>
                  <span className="font-bold">{timelineData[hoveredCaseIndex].joint}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: 2 Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Left Card: Aspect Class Distribution Bar Chart */}
        <div className="dribbble-card p-6 sm:p-7 bg-white relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                Complaint Aspect Distribution
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Frequency across 6 target classification categories
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              6 Classes
            </span>
          </div>

          <div className="relative h-[220px] flex items-end justify-between px-3 pb-8 pt-4 bg-purple-50/30 rounded-2xl border border-purple-50">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none opacity-40">
              <div className="border-b border-purple-200 border-dashed w-full" />
              <div className="border-b border-purple-200 border-dashed w-full" />
              <div className="border-b border-purple-200 border-dashed w-full" />
            </div>

            {/* Bars for 6 Aspect Classes */}
            {aspectBarData.map((b, i) => (
              <div
                key={b.category}
                className="flex flex-col items-center gap-2 relative z-10 group cursor-pointer"
                onMouseEnter={() => setHoveredAspectIndex(i)}
                onMouseLeave={() => setHoveredAspectIndex(null)}
              >
                {hoveredAspectIndex === i && (
                  <div className="absolute -top-9 bg-zinc-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                    {b.count.toLocaleString()} cases
                  </div>
                )}
                <div
                  className="w-7 sm:w-9 rounded-2xl bg-gradient-to-t from-[#7c3aed] to-[#a855f7] group-hover:from-[#6d28d9] group-hover:to-[#9333ea] transition-all duration-200 shadow-md shadow-purple-500/15 group-hover:shadow-lg group-hover:scale-y-[1.03]"
                  style={{ height: `${b.height}px` }}
                />
                <span className="text-[11px] font-bold text-zinc-600 group-hover:text-purple-700 truncate max-w-[50px] text-center">
                  {b.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Severity Triage Intensity Radar & Curves */}
        <div className="dribbble-card p-6 sm:p-7 bg-white relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                Severity Triage Intensity
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Distribution across 4 complaint severity speech acts
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
              4 Levels
            </span>
          </div>

          <div className="relative h-[220px] bg-purple-50/30 rounded-2xl border border-purple-50 p-4">
            <svg
              viewBox="0 0 360 180"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Dashed Horizontal Grid */}
              <g className="opacity-40">
                <line x1="25" y1="30" x2="350" y2="30" stroke="#cbd5e1" strokeDasharray="3 3" />
                <line x1="25" y1="80" x2="350" y2="80" stroke="#cbd5e1" strokeDasharray="3 3" />
                <line x1="25" y1="130" x2="350" y2="130" stroke="#cbd5e1" strokeDasharray="3 3" />
                <line x1="25" y1="170" x2="350" y2="170" stroke="#cbd5e1" strokeWidth="1" />
              </g>

              {/* Y labels: Percentage of Severity */}
              <g className="text-[10px] fill-zinc-400 font-mono">
                <text x="0" y="35">40%</text>
                <text x="0" y="85">30%</text>
                <text x="0" y="135">20%</text>
                <text x="0" y="175">10%</text>
              </g>

              {/* Smooth Severity Distribution Curve */}
              <path
                d="M 40 100 C 80 120, 100 70, 135 70 C 180 70, 200 130, 230 130 C 270 130, 290 60, 325 60"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Purple Confidence Trajectory Curve */}
              <path
                d="M 40 120 C 80 140, 100 90, 135 90 C 180 90, 200 110, 230 110 C 270 110, 290 50, 325 50"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points for 4 Severity Classes */}
              {severityBreakdown.map((d) => (
                <g key={d.label}>
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={d.x}
                    cy={d.y - 10}
                    r="4"
                    fill="#ffffff"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                  />
                </g>
              ))}

              {/* X labels */}
              <g className="text-[9px] fill-zinc-500 font-bold">
                <text x="40" y="178" textAnchor="middle">No Reproach</text>
                <text x="135" y="178" textAnchor="middle">Disapproval</text>
                <text x="230" y="178" textAnchor="middle">Accusation</text>
                <text x="325" y="178" textAnchor="middle">Blame</text>
              </g>
            </svg>
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-purple-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-purple-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">ComFuse Telemetry & Thresholds</h3>
                  <p className="text-xs text-zinc-500">Dual-task multimodal parameters</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-full hover:bg-purple-50 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-800">Aspect Classifier Backbone</div>
                  <div className="text-zinc-500">DistilBERT (768-d ➔ 256-d projection)</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
                  77.4% Acc
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-800">Visual Convolutional Encoder</div>
                  <div className="text-zinc-500">ResNet-18 (512-d ➔ 256-d bottleneck)</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-800">Severity Task Loss Weight</div>
                  <div className="text-zinc-500">Loss = Loss_Aspect + 1.35 * Loss_Severity</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">
                  1.35x Priority
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-50 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-full bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/25 hover:bg-purple-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
