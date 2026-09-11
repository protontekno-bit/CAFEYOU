import React from 'react';

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  themeColor: 'blue' | 'emerald' | 'purple';
  onClick: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  title,
  description,
  icon,
  themeColor,
  onClick,
}) => {
  const getThemeClasses = () => {
    switch (themeColor) {
      case 'emerald':
        return {
          hoverBorder: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
          gradient: 'from-emerald-500/5 to-transparent',
          iconBg: 'bg-emerald-500/10 text-emerald-400',
        };
      case 'purple':
        return {
          hoverBorder: 'hover:border-purple-500 hover:shadow-purple-500/10',
          gradient: 'from-purple-500/5 to-transparent',
          iconBg: 'bg-purple-500/10 text-purple-400',
        };
      case 'blue':
      default:
        return {
          hoverBorder: 'hover:border-blue-500 hover:shadow-blue-500/10',
          gradient: 'from-blue-500/5 to-transparent',
          iconBg: 'bg-blue-500/10 text-blue-400',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <button
      onClick={onClick}
      className={`group relative bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-slate-800 transition-all text-left flex flex-col items-center text-center overflow-hidden hover:shadow-2xl active:scale-95 ${theme.hoverBorder}`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${theme.gradient}`}
      />
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg ${theme.iconBg}`}
      >
        {icon}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{description}</p>
    </button>
  );
};
