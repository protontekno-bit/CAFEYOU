import React, { useRef, useState, useEffect } from 'react';
import { BackIcon, FullscreenIcon } from '../icons/Icons';
import { PlayerPlaceholder } from './PlayerPlaceholder';
import { useKaraoke } from '../../hooks/useKaraoke';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';
import { AppRole } from '../../types';

interface PlayerScreenProps {
  setRole?: (role: AppRole) => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ setRole }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { state, currentSong, nextSongs, nextSong } = useKaraoke();

  useYouTubePlayer({
    containerRef,
    appState: state,
    onSongEnd: () => {
      nextSong();
    },
    onErrorFallback: () => {
      nextSong();
    },
  });

  const nextSongItem = nextSongs[0] || null;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerWrapperRef.current?.requestFullscreen?.().catch((err) => {
        console.warn('Gagal masuk mode layar penuh:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Gagal keluar mode layar penuh:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const hasNoSongs = !currentSong && (!state?.queue || state.queue.length === 0);

  return (
    <div
      ref={playerWrapperRef}
      className="w-full h-screen bg-black relative group flex items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* Floating Header Controls (Muncul saat hover mouse) */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
        <div className="flex items-center gap-2">
          {setRole && (
            <button
              onClick={() => setRole('landing')}
              className="bg-black/70 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-2xl border border-white/10 flex items-center gap-2 transition-all hover:scale-105"
              title="Kembali ke Menu Utama"
            >
              <BackIcon className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          )}

          <div className="bg-black/70 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Layar Proyektor Terhubung</span>
          </div>
        </div>

        <button
          onClick={toggleFullScreen}
          className="bg-black/70 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-2xl border border-white/10 flex items-center gap-2 transition-all hover:scale-105"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Masuk Layar Penuh (F11)'}
        >
          <FullscreenIcon className="w-4 h-4 text-emerald-400" />
          <span>{isFullscreen ? 'Normal View' : 'Full Screen'}</span>
        </button>
      </div>

      {/* Placeholder jika antrean kosong */}
      {hasNoSongs && <PlayerPlaceholder />}

      {/* OVERLAY: Sedang Bernyanyi (Now Singing Banner) */}
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

      {/* OVERLAY: Lagu Berikutnya (Up Next Ticker) */}
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

      {/* OVERLAY: Running Text Banner (Pengumuman Kafe) */}
      {state?.runningText && (
        <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-r from-slate-950/95 via-blue-950/90 to-slate-950/95 border-t border-blue-500/30 py-2.5 px-4 backdrop-blur-md shadow-2xl pointer-events-none overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30 shrink-0">
              <span>📢</span>
              <span>INFO</span>
            </div>
            <div className="marquee-container overflow-hidden whitespace-nowrap flex-1">
              <span className="inline-block text-white text-sm font-bold tracking-wide animate-marquee">
                {state.runningText}
              </span>
            </div>
            <div className="text-[10px] text-blue-300 font-bold bg-blue-500/10 px-2 py-0.5 rounded shrink-0 border border-blue-500/20">
              CAFEYOU
            </div>
          </div>
        </div>
      )}

      {/* Wadah YouTube yang diisolasi agar tidak bentrok dengan React DOM */}
      <div
        ref={containerRef}
        className="w-full h-full pointer-events-none absolute inset-0 z-0"
      />
    </div>
  );
};
