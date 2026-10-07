import React, { useState } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Bell,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import type { NavPage, HealthResponse } from '../types';

interface TopBarProps {
  currentPage: NavPage;
  health: HealthResponse;
  onOpenMobileMenu: () => void;
  onSearch?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  health,
  onOpenMobileMenu,
}) => {
  const isHealthy = health.status === 'healthy';
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-[#9333ea] via-[#a855f7] to-[#7c3aed] text-white shadow-md shadow-purple-500/10 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left: Mobile Menu & Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dribbble Pill Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white/20 hover:bg-white/25 focus:bg-white/30 text-white placeholder-white/70 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition placeholder:text-white/70 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Model Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs text-white backdrop-blur-sm shadow-sm">
          <Layers className="h-3.5 w-3.5 text-purple-200" />
          <span className="font-medium text-white text-[11px]">DistilBERT + ResNet-18</span>
          <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-300 animate-pulse' : 'bg-rose-300'}`} />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition relative"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Notification Bell with Pink Badge Dot */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-pink-400 ring-2 ring-purple-600 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-purple-100 p-3 text-zinc-800 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 font-semibold text-purple-900">
                <span>System Notifications</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">1 New</span>
              </div>
              <div className="py-2.5 space-y-1">
                <div className="font-medium text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-purple-600" />
                  <span>Model Re-trained to 10 Epochs</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Best multimodal checkpoint saved with improved severity F1 score (+102%).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer group">
          <div className="h-8 w-8 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-white font-semibold text-xs shadow-sm ring-2 ring-white/20">
            AI
          </div>
          <div className="hidden lg:block text-left text-xs text-white leading-tight">
            <div className="font-semibold text-white">ComFuse Admin</div>
          </div>
          <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-white/70 group-hover:text-white transition" />
        </div>
      </div>
    </header>
  );
};

