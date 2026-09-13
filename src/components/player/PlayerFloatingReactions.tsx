import React from 'react';

export interface FloatingReaction {
  id: string;
  emoji: string;
  tableNumber: string;
  leftPercent: number;
}

interface PlayerFloatingReactionsProps {
  reactions: FloatingReaction[];
}

export const PlayerFloatingReactions: React.FC<PlayerFloatingReactionsProps> = ({ reactions }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
      {reactions.map((rx) => (
        <div
          key={rx.id}
          style={{
            left: `${rx.leftPercent}%`,
            bottom: '15%',
          }}
          className="absolute flex flex-col items-center animate-floatUp"
        >
          <div className="text-5xl sm:text-6xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transform hover:scale-125 transition-transform">
            {rx.emoji}
          </div>
          <div className="px-2.5 py-0.5 mt-1 bg-slate-950/80 backdrop-blur-md border border-blue-500/30 rounded-full text-[10px] font-bold text-blue-300 shadow-lg">
            {rx.tableNumber}
          </div>
        </div>
      ))}
    </div>
  );
};
