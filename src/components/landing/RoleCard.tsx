import React from 'react';

export type RoleThemeColor = 'blue' | 'emerald' | 'purple' | 'amber' | 'cyan' | 'orange';

interface RoleCardProps {
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  themeColor: RoleThemeColor;
  chips?: string[];
  actionText?: string;
  onClick: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  title,
  badge,
  description,
  icon,
  themeColor,
  chips = [],
  actionText = 'Buka Layar →',
  onClick,
}) => {
  const getThemeClasses = () => {
    switch (themeColor) {
      case 'orange':
      case 'amber':
        return {
          hoverBorder: 'hover:border-amber-500/70 hover:shadow-[0_8px_25px_rgba(245,158,11,0.2)]',
          topLine: 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500',
          gradientHover: 'from-amber-500/10 via-orange-500/5 to-transparent',
          iconContainer: 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-amber-500/30',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          chip: 'bg-amber-500/10 text-amber-200/90 border-amber-500/20',
          actionText: 'text-amber-400 group-hover:text-amber-300',
        };
      case 'emerald':
        return {
          hoverBorder: 'hover:border-emerald-500/70 hover:shadow-[0_8px_25px_rgba(16,185,129,0.2)]',
          topLine: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500',
          gradientHover: 'from-emerald-500/10 via-teal-500/5 to-transparent',
          iconContainer: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30',
          badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          chip: 'bg-emerald-500/10 text-emerald-200/90 border-emerald-500/20',
          actionText: 'text-emerald-400 group-hover:text-emerald-300',
        };
      case 'purple':
        return {
          hoverBorder: 'hover:border-purple-500/70 hover:shadow-[0_8px_25px_rgba(168,85,247,0.2)]',
          topLine: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500',
          gradientHover: 'from-purple-500/10 via-pink-500/5 to-transparent',
          iconContainer: 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-purple-500/30',
          badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          chip: 'bg-purple-500/10 text-purple-200/90 border-purple-500/20',
          actionText: 'text-purple-400 group-hover:text-purple-300',
        };
      case 'cyan':
        return {
          hoverBorder: 'hover:border-cyan-500/70 hover:shadow-[0_8px_25px_rgba(6,182,212,0.2)]',
          topLine: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500',
          gradientHover: 'from-cyan-500/10 via-blue-500/5 to-transparent',
          iconContainer: 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-cyan-500/30',
          badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          chip: 'bg-cyan-500/10 text-cyan-200/90 border-cyan-500/20',
          actionText: 'text-cyan-400 group-hover:text-cyan-300',
        };
      case 'blue':
      default:
        return {
          hoverBorder: 'hover:border-blue-500/70 hover:shadow-[0_8px_25px_rgba(59,130,246,0.2)]',
          topLine: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500',
          gradientHover: 'from-blue-500/10 via-indigo-500/5 to-transparent',
          iconContainer: 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/30',
          badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          chip: 'bg-blue-500/10 text-blue-200/90 border-blue-500/20',
          actionText: 'text-blue-400 group-hover:text-blue-300',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-800/90 transition-all duration-300 text-left flex flex-col justify-between overflow-hidden hover:-translate-y-1 cursor-pointer shadow-xl ${theme.hoverBorder} active:scale-[0.98] w-full`}
    >
      {/* Top Accent Line on Hover */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${theme.topLine}`}
      />

      {/* Subtle Background Glow on Hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br ${theme.gradientHover}`}
      />

      {/* Header Bagian Atas Kartu */}
      <div className="relative z-10 w-full mb-2">
        <div className="flex items-center justify-between gap-1 mb-2.5">
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badge}`}
          >
            {badge}
          </span>
          <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-[10px] font-mono">
            ● Aktif
          </span>
        </div>

        <div className="flex items-center gap-2.5 mb-2">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300 ${theme.iconContainer}`}
          >
            {icon}
          </div>
          <h2 className="text-base font-bold text-white group-hover:text-white tracking-tight leading-snug">
            {title}
          </h2>
        </div>

        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-3 min-h-[38px]">
          {description}
        </p>
      </div>

      {/* Footer Kartu: Feature Chips & Action Link */}
      <div className="relative z-10 w-full pt-2.5 border-t border-slate-800/70 mt-auto flex flex-col gap-2">
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip, idx) => (
              <span
                key={idx}
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${theme.chip}`}
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <span className={`text-[11px] font-extrabold flex items-center gap-1 ${theme.actionText}`}>
            <span>{actionText}</span>
            <span className="transform group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </span>
          <span className="text-[9px] text-slate-500 font-mono">
            CAFEYOU
          </span>
        </div>
      </div>
    </button>
  );
};
