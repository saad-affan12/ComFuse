import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  History,
  Cpu,
  Info,
  Layers,
  X,
  Server
} from 'lucide-react';
import type { NavPage, HealthResponse } from '../types';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  health: HealthResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  health,
  isOpen,
  onClose,
}) => {
  const isHealthy = health.status === 'healthy';
  const isLoading = health.status === 'loading';

  const navGroups: {
    title: string;
    items: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[];
  }[] = [
    {
      title: 'ANALYZE',
      items: [
        { id: 'analyze', label: 'Analyze', icon: Sparkles },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'history', label: 'History', icon: History },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { id: 'how-it-works', label: 'How It Works', icon: Cpu },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'about', label: 'About', icon: Info },
      ],
    },
  ];

  const handleSelect = (page: NavPage) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a0b12] border-r border-white/[0.07] flex flex-col justify-between transition-transform duration-250 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Brand */}
        <div className="p-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Original ComFuse Feature-Fusion Icon */}
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-[#0a0b12] rounded-[10px] flex items-center justify-center">
                <Layers className="h-4.5 w-4.5 text-cyan-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider text-white">COMFUSE</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal truncate max-w-[140px]">
                Complaint Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Center: Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-cyan-400" />
                    )}
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? 'text-cyan-400'
                          : 'text-zinc-400 group-hover:text-zinc-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom: Model Status Pill */}
        <div className="p-4 border-t border-white/[0.06] bg-[#07070b]/60">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                {isHealthy && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isHealthy ? 'bg-emerald-500' : isLoading ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <div>
                <div className="text-[11px] font-semibold text-zinc-200">
                  {isHealthy ? 'Model Online' : isLoading ? 'Connecting...' : 'Backend Offline'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {isHealthy ? `Device: ${health.device || 'cpu'}` : 'Check Railway / API'}
                </div>
              </div>
            </div>

            <Server className="h-3.5 w-3.5 text-zinc-400" />
          </div>
        </div>
      </aside>
    </>
  );
};
