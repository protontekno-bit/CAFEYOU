import React from 'react';
import {
  PlayIcon,
  PauseIcon,
  SkipIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from '../icons/Icons';
import { PlaybackStatus, SoundEffectType } from '../../types';

interface PlaybackControlsProps {
  playbackStatus: PlaybackStatus;
  volume: number;
  isMuted?: boolean;
  hasCurrentSong: boolean;
  onTogglePlay: () => void;
  onSkip: () => void;
  onVolumeChange: (newVolume: number) => void;
  onToggleMute: () => void;
  onQuickSoundEffect: (type: SoundEffectType) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackStatus,
  volume,
  isMuted = false,
  hasCurrentSong,
  onTogglePlay,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onQuickSoundEffect,
}) => {
  const isPlaying = playbackStatus === 'PLAYING';

  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>🎚️</span> Dek Kendali Utama
        </h2>
        {hasCurrentSong && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Aktif
          </span>
        )}
      </div>

      {/* Tombol Playback Utama */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onTogglePlay}
          disabled={!hasCurrentSong}
          className={`py-3.5 px-4 rounded-xl flex justify-center items-center gap-2.5 text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-yellow-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20'
          }`}
        >
          {isPlaying ? (
            <>
              <PauseIcon className="w-5 h-5" />
              <span>Jeda (Pause)</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-5 h-5" />
              <span>Putar (Play)</span>
            </>
          )}
        </button>

        <button
          onClick={onSkip}
          disabled={!hasCurrentSong}
          className="py-3.5 px-4 bg-slate-700 hover:bg-slate-600 active:scale-95 text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex justify-center items-center gap-2 text-sm font-bold transition-all border border-slate-600/50 shadow-md"
        >
          <SkipIcon className="w-5 h-5" />
          <span>Lewati (Skip)</span>
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
    </div>
  );
};
