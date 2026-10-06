import React from 'react';
import { Activity, Layers, Info, HelpCircle } from 'lucide-react';
import type { HealthResponse } from '../types';

interface NavbarProps {
  health: HealthResponse;
  activeTab: 'analyze' | 'architecture' | 'about';
  setActiveTab: (tab: 'analyze' | 'architecture' | 'about') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, activeTab, setActiveTab }) => {
  const isHealthy = health.status === 'healthy';
  const isLoading = health.status === 'loading';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Layers className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">COMFUSE</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Customer Complaint Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analyze'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Analyze</span>
          </button>
          
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>How It Works</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'about'
                ? 'bg-slate-800/90 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Info className="h-4 w-4" />
            <span>About</span>
          </button>
        </nav>

        {/* Health Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isHealthy
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : isLoading
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
            }`}
            title={`Backend device: ${health.device}`}
          >
            <span className="relative flex h-2 w-2">
              {isHealthy && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy ? 'bg-emerald-500' : isLoading ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span>
              {isHealthy ? 'Model Online' : isLoading ? 'Loading...' : 'Backend Offline'}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
