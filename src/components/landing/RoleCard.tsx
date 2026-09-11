import React from 'react';

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  themeColor: 'blue' | 'emerald';
  onClick: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  title,
  description,
  icon,
  themeColor,
  onClick,
}) => {
  const isBlue = themeColor === 'blue';

  return (
    <button
      onClick={onClick}
      className={`group relative bg-slate-800 p-8 rounded-2xl border border-slate-700 transition-all text-left flex flex-col items-center text-center overflow-hidden hover:shadow-2xl ${
        isBlue
          ? 'hover:border-blue-500 hover:shadow-blue-500/10'
          : 'hover:border-emerald-500 hover:shadow-emerald-500/10'
      }`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${
          isBlue ? 'from-blue-500/5 to-transparent' : 'from-emerald-500/5 to-transparent'
        }`}
      />
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${
          isBlue
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-emerald-500/10 text-emerald-400'
        }`}
      >
        {icon}
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </button>
  );
};
