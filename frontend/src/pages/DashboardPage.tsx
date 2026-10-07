import React, { useState } from 'react';
import {
  Calendar,
  Download,
  DollarSign,
  Activity,
  CreditCard,
  CheckCircle2,
  Settings,
  ArrowUpRight
} from 'lucide-react';
import type { AnalysisRecord } from '../types';

interface DashboardPageProps {
  history: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onNavigateToAnalyze: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  history,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [activeLegend, setActiveLegend] = useState<{ revenue: boolean; expenses: boolean; profit: boolean }>({
    revenue: true,
    expenses: true,
    profit: true,
  });
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Chart data for Main Monthly Area Chart (Jan -> Jul)
  const monthlyData = [
    { month: 'Jan', revenue: 45000, expenses: 28000, profit: 17000, x: 50, yRev: 220, yExp: 270, yPro: 300 },
    { month: 'Feb', revenue: 52000, expenses: 31000, profit: 21000, x: 150, yRev: 200, yExp: 260, yPro: 285 },
    { month: 'Mar', revenue: 60000, expenses: 32000, profit: 28000, x: 250, yRev: 170, yExp: 255, yPro: 265 },
    { month: 'Apr', revenue: 58000, expenses: 31000, profit: 27000, x: 350, yRev: 180, yExp: 260, yPro: 270 },
    { month: 'May', revenue: 72000, expenses: 35000, profit: 37000, x: 450, yRev: 130, yExp: 245, yPro: 240 },
    { month: 'Jun', revenue: 85000, expenses: 38000, profit: 47000, x: 550, yRev: 90,  yExp: 235, yPro: 210 },
    { month: 'Jul', revenue: 98000, expenses: 42000, profit: 56000, x: 650, yRev: 55,  yExp: 225, yPro: 185 },
  ];

  // Bar chart data for API Request Analytics
  const barData = [
    { day: 'Mon', value: 45, height: 110, count: '45K' },
    { day: 'Tue', value: 65, height: 160, count: '65K' },
    { day: 'Wed', value: 80, height: 195, count: '80K' },
    { day: 'Thu', value: 75, height: 180, count: '75K' },
    { day: 'Fri', value: 95, height: 230, count: '95K' },
    { day: 'Sat', value: 55, height: 135, count: '55K' },
    { day: 'Sun', value: 48, height: 120, count: '48K' },
  ];

  // System resource curves
  const resourceData = [
    { label: '00:00', cpu: 45, memory: 65, x: 30, yCpu: 135, yMem: 95 },
    { label: '04:00', cpu: 32, memory: 60, x: 90, yCpu: 165, yMem: 105 },
    { label: '08:00', cpu: 70, memory: 68, x: 150, yCpu: 85, yMem: 88 },
    { label: '12:00', cpu: 88, memory: 75, x: 210, yCpu: 48, yMem: 72 },
    { label: '16:00', cpu: 94, memory: 85, x: 270, yCpu: 35, yMem: 52 },
    { label: '20:00', cpu: 78, memory: 72, x: 330, yCpu: 70, yMem: 80 },
  ];

  const handleExport = () => {
    const jsonStr = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        metrics: {
          monthlyRevenue: 98000,
          apiRequests: '2.4M',
          activeSubscriptions: 4820,
          systemUptime: '99.97%',
          multimodalAccuracy: '77.37%',
        },
        monthlyData,
        history,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comfuse-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 relative pb-12">
      {/* Floating Purple Settings Badge Button on Right Edge */}
      <button
        onClick={() => setShowSettingsModal(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-l from-purple-600 to-purple-500 text-white p-3 rounded-l-2xl shadow-xl shadow-purple-500/30 hover:pl-4 transition-all duration-200 group flex items-center justify-center cursor-pointer"
        title="Dashboard Settings & Calibration"
      >
        <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            Real-time business intelligence and performance metrics
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

          {/* Purple Gradient Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#9333ea] to-[#7c3aed] text-white text-xs font-bold rounded-full shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards in a Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Monthly Revenue */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                MONTHLY REVENUE
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                $98,000
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">$56K profit margin</span>
            <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              <span>+15.3%</span>
            </div>
          </div>
        </div>

        {/* Card 2: API Requests */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                API REQUESTS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                2.4M
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">110K requests/day</span>
            <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              <span>+28.7%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Subscriptions */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                ACTIVE SUBSCRIPTIONS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                4,820
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">565 new this month</span>
            <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.4%</span>
            </div>
          </div>
        </div>

        {/* Card 4: System Uptime */}
        <div className="dribbble-card p-5 sm:p-6 relative overflow-hidden bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                SYSTEM UPTIME
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
                99.97%
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-zinc-500 font-medium">2.5 hours downtime</span>
            <div className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="h-3 w-3" />
              <span>+0.02%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area Chart Card: Revenue & Profit Analysis */}
      <div className="dribbble-card p-6 sm:p-8 bg-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
              Revenue & Profit Analysis
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Monthly financial performance overview
            </p>
          </div>

          {/* Interactive Legend Dots */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveLegend(prev => ({ ...prev, revenue: !prev.revenue }))}
              className={`flex items-center gap-1.5 cursor-pointer transition ${activeLegend.revenue ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#8b5cf6]" />
              <span className="text-zinc-700">Revenue</span>
            </button>
            <button
              onClick={() => setActiveLegend(prev => ({ ...prev, expenses: !prev.expenses }))}
              className={`flex items-center gap-1.5 cursor-pointer transition ${activeLegend.expenses ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
              <span className="text-zinc-700">Expenses</span>
            </button>
            <button
              onClick={() => setActiveLegend(prev => ({ ...prev, profit: !prev.profit }))}
              className={`flex items-center gap-1.5 cursor-pointer transition ${activeLegend.profit ? 'opacity-100' : 'opacity-40'}`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
              <span className="text-zinc-700">Profit</span>
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
              {/* Purple Gradient Fill for Revenue */}
              <linearGradient id="purpleAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>

              {/* Green Gradient Fill for Expenses */}
              <linearGradient id="greenAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              {/* Amber Gradient Fill for Profit */}
              <linearGradient id="amberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Dashed Horizontal Grid Lines */}
            <g className="opacity-40">
              <line x1="40" y1="60" x2="680" y2="60" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="130" x2="680" y2="130" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="200" x2="680" y2="200" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="270" x2="680" y2="270" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="40" y1="310" x2="680" y2="310" stroke="#e2e8f0" strokeWidth="1.5" />
            </g>

            {/* Dashed Vertical Grid Lines */}
            <g className="opacity-40">
              {monthlyData.map((d, i) => (
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

            {/* Y-Axis Labels */}
            <g className="text-[11px] fill-zinc-400 font-mono">
              <text x="5" y="65">100000</text>
              <text x="12" y="135">75000</text>
              <text x="12" y="205">50000</text>
              <text x="12" y="275">25000</text>
              <text x="30" y="315">0</text>
            </g>

            {/* X-Axis Month Labels */}
            <g className="text-[11px] fill-zinc-500 font-semibold">
              {monthlyData.map((d, i) => (
                <text key={i} x={d.x} y="330" textAnchor="middle">
                  {d.month}
                </text>
              ))}
            </g>

            {/* Area Fills */}
            {activeLegend.revenue && (
              <path
                d="M 50 220 C 100 210, 100 200, 150 200 C 200 200, 200 170, 250 170 C 300 170, 300 180, 350 180 C 400 180, 400 130, 450 130 C 500 130, 500 90, 550 90 C 600 90, 600 55, 650 55 L 650 310 L 50 310 Z"
                fill="url(#purpleAreaGrad)"
              />
            )}

            {activeLegend.expenses && (
              <path
                d="M 50 270 C 100 265, 100 260, 150 260 C 200 260, 200 255, 250 255 C 300 255, 300 260, 350 260 C 400 260, 400 245, 450 245 C 500 245, 500 235, 550 235 C 600 235, 600 225, 650 225 L 650 310 L 50 310 Z"
                fill="url(#greenAreaGrad)"
              />
            )}

            {activeLegend.profit && (
              <path
                d="M 50 300 C 100 290, 100 285, 150 285 C 200 285, 200 265, 250 265 C 300 265, 300 270, 350 270 C 400 270, 400 240, 450 240 C 500 240, 500 210, 550 210 C 600 210, 600 185, 650 185 L 650 310 L 50 310 Z"
                fill="url(#amberAreaGrad)"
              />
            )}

            {/* Smooth Curve Lines */}
            {activeLegend.revenue && (
              <path
                d="M 50 220 C 100 210, 100 200, 150 200 C 200 200, 200 170, 250 170 C 300 170, 300 180, 350 180 C 400 180, 400 130, 450 130 C 500 130, 500 90, 550 90 C 600 90, 600 55, 650 55"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}

            {activeLegend.expenses && (
              <path
                d="M 50 270 C 100 265, 100 260, 150 260 C 200 260, 200 255, 250 255 C 300 255, 300 260, 350 260 C 400 260, 400 245, 450 245 C 500 245, 500 235, 550 235 C 600 235, 600 225, 650 225"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {activeLegend.profit && (
              <path
                d="M 50 300 C 100 290, 100 285, 150 285 C 200 285, 200 265, 250 265 C 300 265, 300 270, 350 270 C 400 270, 400 240, 450 240 C 500 240, 500 210, 550 210 C 600 210, 600 185, 650 185"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Circular Data Node Points matching Dribbble screenshot */}
            {monthlyData.map((d, i) => (
              <g key={i} onMouseEnter={() => setHoveredMonthIndex(i)} onMouseLeave={() => setHoveredMonthIndex(null)}>
                {/* Revenue Node */}
                {activeLegend.revenue && (
                  <circle
                    cx={d.x}
                    cy={d.yRev}
                    r={hoveredMonthIndex === i ? 6.5 : 4.5}
                    fill="#ffffff"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    className="cursor-pointer transition-all duration-150"
                  />
                )}

                {/* Expenses Node */}
                {activeLegend.expenses && (
                  <circle
                    cx={d.x}
                    cy={d.yExp}
                    r={hoveredMonthIndex === i ? 6.5 : 4.5}
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all duration-150"
                  />
                )}

                {/* Profit Node */}
                {activeLegend.profit && (
                  <circle
                    cx={d.x}
                    cy={d.yPro}
                    r={hoveredMonthIndex === i ? 6.5 : 4.5}
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all duration-150"
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Interactive Tooltip on Hover */}
          {hoveredMonthIndex !== null && (
            <div
              className="absolute top-8 bg-zinc-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/10 text-xs pointer-events-none z-30 transition-all duration-150"
              style={{
                left: `${(monthlyData[hoveredMonthIndex].x / 700) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="font-bold text-purple-300 pb-1 border-b border-white/10 mb-1.5 flex items-center justify-between gap-4">
                <span>{monthlyData[hoveredMonthIndex].month} Summary</span>
                <span className="text-[10px] text-zinc-400 font-mono">2026</span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-3 text-purple-300">
                  <span>Revenue:</span>
                  <span className="font-bold">${monthlyData[hoveredMonthIndex].revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-emerald-300">
                  <span>Expenses:</span>
                  <span className="font-bold">${monthlyData[hoveredMonthIndex].expenses.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-amber-300">
                  <span>Profit:</span>
                  <span className="font-bold">${monthlyData[hoveredMonthIndex].profit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: 2 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Card: API Request Analytics (Purple Bar Chart) */}
        <div className="dribbble-card p-6 sm:p-7 bg-white relative">
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">
              API Request Analytics
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Weekly API usage and error tracking
            </p>
          </div>

          <div className="relative h-[220px] flex items-end justify-between px-4 pb-8 pt-4 bg-purple-50/30 rounded-2xl border border-purple-50">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none opacity-40">
              <div className="border-b border-purple-200 border-dashed w-full" />
              <div className="border-b border-purple-200 border-dashed w-full" />
              <div className="border-b border-purple-200 border-dashed w-full" />
            </div>

            {/* Bars */}
            {barData.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 relative z-10 group cursor-pointer"
                onMouseEnter={() => setHoveredBarIndex(i)}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                {hoveredBarIndex === i && (
                  <div className="absolute -top-9 bg-zinc-900 text-white text-[10px] font-mono px-2 py-1 rounded-lg shadow-lg">
                    {b.count}
                  </div>
                )}
                <div
                  className="w-8 sm:w-10 rounded-2xl bg-gradient-to-t from-[#7c3aed] to-[#a855f7] group-hover:from-[#6d28d9] group-hover:to-[#9333ea] transition-all duration-200 shadow-md shadow-purple-500/15 group-hover:shadow-lg group-hover:scale-y-[1.03]"
                  style={{ height: `${b.height * 0.7}px` }}
                />
                <span className="text-xs font-semibold text-zinc-500 group-hover:text-purple-700">
                  {b.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: System Resource Usage (Dual Smooth Curves) */}
        <div className="dribbble-card p-6 sm:p-7 bg-white relative">
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900">
              System Resource Usage
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Real-time infrastructure monitoring
            </p>
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

              {/* Y labels */}
              <g className="text-[10px] fill-zinc-400 font-mono">
                <text x="0" y="35">100</text>
                <text x="5" y="85">75</text>
                <text x="5" y="135">50</text>
                <text x="5" y="175">25</text>
              </g>

              {/* Green Memory Curve */}
              <path
                d="M 30 95 C 60 100, 60 105, 90 105 C 120 105, 120 88, 150 88 C 180 88, 180 72, 210 72 C 240 72, 240 52, 270 52 C 300 52, 300 80, 330 80"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Purple CPU Curve */}
              <path
                d="M 30 135 C 60 160, 60 165, 90 165 C 120 165, 120 85, 150 85 C 180 85, 180 48, 210 48 C 240 48, 240 35, 270 35 C 300 35, 300 70, 330 70"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {resourceData.map((d, i) => (
                <g key={i}>
                  <circle
                    cx={d.x}
                    cy={d.yMem}
                    r="4"
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx={d.x}
                    cy={d.yCpu}
                    r="4"
                    fill="#ffffff"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Settings Modal (Triggered by Right Purple Gear) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-purple-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-purple-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-purple-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Dashboard Calibration</h3>
                  <p className="text-xs text-zinc-500">Fine-tune analytics thresholds</p>
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
                  <div className="font-semibold text-zinc-800">Confidence Floor</div>
                  <div className="text-zinc-500">Exclude low-confidence predictions</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-mono font-bold">
                  70%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-800">Multimodal Fallback</div>
                  <div className="text-zinc-500">Automatic text-only zero vector padding</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-800">Current Model Checkpoint</div>
                  <div className="text-zinc-500">DistilBERT + ResNet-18 (10 Epochs)</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">
                  v1.2 Active
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
