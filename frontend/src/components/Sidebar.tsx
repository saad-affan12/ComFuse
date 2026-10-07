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
          className="fixed inset-0 z-40 bg-purple-950/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-purple-100/80 flex flex-col justify-between transition-transform duration-250 ease-out shadow-sm lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Brand */}
        <div className="p-5 pb-4 border-b border-purple-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#9333ea] to-[#c084fc] p-[1.5px] shadow-md shadow-purple-500/20">
              <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-zinc-900">COMFUSE</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium truncate max-w-[140px]">
                Complaint Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-purple-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Center: Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group relative cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/25 font-bold'
                        : 'text-zinc-600 hover:text-purple-700 hover:bg-purple-50/70'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-400 group-hover:text-purple-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom: Model Status Card */}
        <div className="p-4 border-t border-purple-50 bg-gradient-to-b from-transparent to-purple-50/50">
          <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {isHealthy && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isHealthy ? 'bg-emerald-500' : isLoading ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <div>
                <div className="text-xs font-bold text-zinc-800">
                  {isHealthy ? 'Model Active' : isLoading ? 'Connecting...' : 'Backend Offline'}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {isHealthy ? `Device: ${health.device || 'cpu'}` : 'Check API'}
                </div>
              </div>
            </div>

            <Server className="h-4 w-4 text-purple-400" />
          </div>
        </div>
      </aside>
    </>
  );
};
