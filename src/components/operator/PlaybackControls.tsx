import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SkipIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from '../icons/Icons';
import { PlaybackStatus, SoundEffectType } from '../../types';
import { initFirebaseDatabase, ref, onValue } from '../../config/firebase';
import { STORAGE_KEY } from '../../constants/karaoke';

interface PlaybackControlsProps {
  playbackStatus: PlaybackStatus;
  volume: number;
  isMuted?: boolean;
  hasCurrentSong: boolean;
  onTogglePlay: () => void;
  onSkip: () => void;
  onReplay?: () => void;
  onVolumeChange: (newVolume: number) => void;
  onToggleMute: () => void;
  onQuickSoundEffect: (type: SoundEffectType) => void;
  onOpenRunningText?: () => void;
  onOpenSoundBoard?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackStatus,
  volume,
  isMuted = false,
  hasCurrentSong,
  onTogglePlay,
  onSkip,
  onReplay,
  onVolumeChange,
  onToggleMute,
  onQuickSoundEffect,
  onOpenRunningText,
  onOpenSoundBoard,
}) => {
  const isPlaying = playbackStatus === 'PLAYING';
  const [isPlayerOnline, setIsPlayerOnline] = useState<boolean>(false);

  // Monitor sinyal heartbeat dari Layar Proyektor TV
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) return;
    const hbRef = ref(db, `cafeyou/${STORAGE_KEY}/playerHeartbeat`);
    const unsub = onValue(hbRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        const diff = Date.now() - (val?.timestamp || 0);
        setIsPlayerOnline(diff < 25000);
      } else {
        setIsPlayerOnline(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>🎚️</span> Dek Kendali Utama
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
              isPlayerOnline
                ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                : 'text-slate-400 bg-slate-900 border-slate-700'
            }`}
            title={isPlayerOnline ? 'Layar Proyektor TV sedang aktif dan terhubung' : 'Layar Proyektor belum dibuka di browser TV atau sedang offline'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isPlayerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>TV: {isPlayerOnline ? 'Online' : 'Offline'}</span>
          </span>
          {hasCurrentSong && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ON AIR
            </span>
          )}
        </div>
      </div>

      {/* Tombol Playback Utama: Putar, Replay, Lewati */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          onClick={onTogglePlay}
          disabled={!hasCurrentSong}
          className={`py-3 px-2 sm:px-3 rounded-xl flex flex-col sm:flex-row justify-center items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-yellow-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20'
          }`}
          title={isPlaying ? 'Jeda pemutaran lagu' : 'Putar lagu'}
        >
          {isPlaying ? (
            <>
              <PauseIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Jeda</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Putar</span>
            </>
          )}
        </button>

        <button
          onClick={onReplay}
          disabled={!hasCurrentSong}
          className="py-3 px-2 sm:px-3 bg-slate-700/80 hover:bg-slate-700 active:scale-95 text-indigo-300 hover:text-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex flex-col sm:flex-row justify-center items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-all border border-slate-600/60 shadow-md"
          title="Putar ulang lagu yang sedang aktif dari awal (detik 0)"
        >
          <span className="text-base sm:text-lg">🔄</span>
          <span>Ulangi</span>
        </button>

        <button
          onClick={onSkip}
          disabled={!hasCurrentSong}
          className="py-3 px-2 sm:px-3 bg-slate-700/80 hover:bg-slate-700 active:scale-95 text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex flex-col sm:flex-row justify-center items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-all border border-slate-600/60 shadow-md"
          title="Lewati ke lagu berikutnya di antrean"
        >
          <SkipIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>Lewati</span>
        </button>
      </div>

      {/* Slider Volume & Mute */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2.5">
        <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
              isMuted
                ? 'bg-red-500/20 text-red-400'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title={isMuted ? 'Buka Mute' : 'Mute Suara'}
          >
            {isMuted ? (
              <>
                <VolumeMuteIcon className="w-4 h-4 text-red-400" />
                <span className="text-[11px] font-bold">MUTE</span>
              </>
            ) : (
              <>
                <VolumeIcon className="w-4 h-4 text-emerald-400" />
                <span>Volume Proyektor</span>
              </>
            )}
          </button>
          <span className="font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
          className="w-full h-2.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Quick Sound Effect Buttons */}
      <div className="pt-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Efek Suara Instan</span>
          <span className="text-[10px] text-slate-500">1-Klik</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onQuickSoundEffect('applause')}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-amber-300 hover:text-amber-200 border border-slate-700/70 hover:border-amber-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span>👏</span> Tepuk
          </button>
          <button
            onClick={() => onQuickSoundEffect('airhorn')}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-rose-300 hover:text-rose-200 border border-slate-700/70 hover:border-rose-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span>📯</span> Terompet
          </button>
          <button
            onClick={() => onQuickSoundEffect('cheer')}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-emerald-300 hover:text-emerald-200 border border-slate-700/70 hover:border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span>🎉</span> Hore
          </button>
        </div>
      </div>

      {/* Pintasan Cepat Proyektor (Running Text & Soundboard) */}
      {(onOpenRunningText || onOpenSoundBoard) && (
        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
          {onOpenRunningText && (
            <button
              type="button"
              onClick={onOpenRunningText}
              className="flex-1 py-2 px-3 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Atur pesan running text di layar TV"
            >
              <span>📢</span>
              <span>Running Text</span>
            </button>
          )}
          {onOpenSoundBoard && (
            <button
              type="button"
              onClick={onOpenSoundBoard}
              className="flex-1 py-2 px-3 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-indigo-300 border border-slate-700/80 hover:border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Buka panel soundboard lengkap"
            >
              <span>🎛️</span>
              <span>FX Penuh</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
