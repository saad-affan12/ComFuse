import React from 'react';
import { Menu, ChevronRight, Cpu } from 'lucide-react';
import type { NavPage, HealthResponse } from '../types';

interface TopBarProps {
  currentPage: NavPage;
  health: HealthResponse;
  onOpenMobileMenu: () => void;
}

const PAGE_TITLES: Record<NavPage, { category: string; title: string }> = {
  analyze: { category: 'ComFuse AI', title: 'Multimodal Analysis' },
  dashboard: { category: 'Insights', title: 'Dashboard & Analytics' },
  history: { category: 'Storage', title: 'Analysis History' },
  'how-it-works': { category: 'Architecture', title: 'How ComFuse Works' },
  about: { category: 'System', title: 'About Prototype' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  health,
  onOpenMobileMenu,
}) => {
  const isHealthy = health.status === 'healthy';
  const pageInfo = PAGE_TITLES[currentPage] || { category: 'ComFuse AI', title: 'Workspace' };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-white/[0.06] bg-[#07070b]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.05]"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium">{pageInfo.category}</span>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-200 font-semibold">{pageInfo.title}</span>
        </div>
      </div>

      {/* Right: Backbone Pill & Health Status */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] text-[11px] text-zinc-300">
          <Cpu className="h-3 w-3 text-cyan-400" />
          <span className="font-mono text-zinc-300">DistilBERT + ResNet-18</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
            isHealthy
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isHealthy && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="text-[11px]">
            {isHealthy ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
