import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { GridTabItem, GridTabSectionType } from '../utils/gridTabsStorage';

interface InteractiveGridTabsProps {
  sectionKey: GridTabSectionType;
  sectionLabel: string;
  tabs: GridTabItem[];
  onNavigateTab: (targetLink: string) => void;
  isDark?: boolean;
}

export const InteractiveGridTabs: React.FC<InteractiveGridTabsProps> = ({
  sectionKey,
  sectionLabel,
  tabs,
  onNavigateTab,
  isDark = false,
}) => {
  const activeTabs = tabs.filter((t) => t.isActive && t.section === sectionKey);

  if (activeTabs.length === 0) return null;

  return (
    <div className="w-full space-y-2 mt-2 mb-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <h4
            className={`text-xs sm:text-sm font-black tracking-wide uppercase ${
              isDark ? 'text-teal-300' : 'text-[#002b49]'
            }`}
          >
            {sectionLabel} • Interactive Grid
          </h4>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-white/10 text-teal-300' : 'bg-teal-50 text-teal-700 border border-teal-200'
          }`}
        >
          Desktop 5x5 • Mobile 3x3 (2:2 Ratio)
        </span>
      </div>

      {/* Grid Container (2:2 ratio cards) */}
      <div
        className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 w-full"
        role="tablist"
        aria-label={sectionLabel}
      >
        {activeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            onClick={() => onNavigateTab(tab.targetLink)}
            style={{ aspectRatio: '2 / 2' }}
            className={`group relative w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-300 transform active:scale-95 hover:scale-[1.03] hover:shadow-lg cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              isDark
                ? 'border-cyan-900/50 bg-[#00172d] shadow-cyan-950/40 hover:border-teal-400/60'
                : 'border-slate-200 bg-white shadow-xs hover:border-teal-500 hover:shadow-teal-900/10'
            }`}
          >
            {/* Custom Tab Banner Image */}
            {tab.imageUrl ? (
              <img
                src={tab.imageUrl}
                alt={tab.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-900 to-[#001b33] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-teal-300 opacity-60" />
              </div>
            )}

            {/* Gradient Contrast Overlay (2:2 ratio frame) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:from-black/90 group-hover:via-black/25 transition-colors pointer-events-none" />

            {/* Optional Badge */}
            {tab.badge && (
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-teal-500/90 text-white shadow-xs backdrop-blur-xs">
                {tab.badge}
              </span>
            )}

            {/* Title & Navigation Cue at Bottom */}
            <div className="absolute bottom-0 inset-x-0 p-2 sm:p-2.5 z-10 flex items-end justify-between gap-1 pointer-events-none">
              <span className="text-[11px] sm:text-xs font-black text-white leading-tight line-clamp-2 drop-shadow-md">
                {tab.title}
              </span>
              <ExternalLink className="w-3 h-3 text-teal-300 opacity-70 group-hover:opacity-100 shrink-0 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
