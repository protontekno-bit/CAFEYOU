import React from 'react';
import { Song } from '../../types';

interface PlayerStageBannersProps {
  currentSong: Song | null;
  nextSongItem: Song | null;
}

export const PlayerStageBanners: React.FC<PlayerStageBannersProps> = ({
  currentSong,
  nextSongItem,
}) => {
  return (
    <>
      {/* Sedang Bernyanyi (Now Singing Banner) */}
      {currentSong && (
        <div className="absolute top-6 left-6 z-30 pointer-events-none animate-fadeIn">
          <div className="bg-slate-950/85 backdrop-blur-md border border-blue-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center gap-3.5 max-w-sm sm:max-w-md">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30 shrink-0">
              🎤
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Sedang Bernyanyi
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ON STAGE</span>
              </div>
              <div className="text-white font-extrabold text-sm sm:text-base truncate mt-0.5">
                {currentSong.requester}
              </div>
              <div className="text-slate-300 text-xs truncate mt-0.5 opacity-80">
                {currentSong.title}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lagu Berikutnya (Up Next Ticker) */}
      {nextSongItem && currentSong && (
        <div className="absolute top-6 right-6 z-30 pointer-events-none animate-fadeIn hidden md:block">
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center gap-3 max-w-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold shrink-0">
              ⏭️
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Berikutnya:
              </div>
              <div className="text-white font-bold text-xs truncate">
                {nextSongItem.requester}
              </div>
              <div className="text-slate-400 text-[11px] truncate">
                {nextSongItem.title}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
