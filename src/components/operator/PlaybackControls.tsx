import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SkipIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from '../icons/Icons';
import { PlaybackStatus, SoundEffectType } from '../../types';
import { initFirebaseDatabase, ref, onValue, set } from '../../config/firebase';
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
  onSeek?: (seconds: number) => void;
  onSeekTo?: (targetTime: number) => void;
  onStopToStandby?: () => void;
  onRemotePlayerCommand?: (command: 'reload' | 'mute' | 'unmute') => void;
}

interface SongProgress {
  currentTime: number;
  duration: number;
  isPlaying?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
  onSeek,
  onSeekTo,
  onStopToStandby,
  onRemotePlayerCommand,
}) => {
  const isPlaying = playbackStatus === 'PLAYING';
  const [isPlayerOnline, setIsPlayerOnline] = useState<boolean>(false);
  const [playerDeviceName, setPlayerDeviceName] = useState<string>('');
  const [progress, setProgress] = useState<SongProgress>({ currentTime: 0, duration: 0 });

  // 1. Monitor status detil TV Proyektor via session lock & heartbeat
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) return;

    // Baca session lock untuk mengetahui nama perangkat proyektor aktif
    const lockRef = ref(db, `cafeyou/player_session_lock/${STORAGE_KEY}`);
    const unsubLock = onValue(lockRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        const diff = Date.now() - (val?.lastHeartbeat || 0);
        const online = Math.abs(diff) < 18000;
        setIsPlayerOnline(online);
        setPlayerDeviceName(online ? (val?.deviceLabel || 'TV Master') : '');
      } else {
        setIsPlayerOnline(false);
        setPlayerDeviceName('');
      }
    });

    // Baca progres durasi lagu dari TV Master
    const progRef = ref(db, `cafeyou/player_progress/${STORAGE_KEY}`);
    const unsubProg = onValue(progRef, (snap) => {
      if (snap.exists() && hasCurrentSong) {
        const val = snap.val();
        setProgress({
          currentTime: val?.currentTime || 0,
          duration: val?.duration || 0,
          isPlaying: val?.isPlaying,
        });
      } else {
        setProgress({ currentTime: 0, duration: 0 });
      }
    });

    return () => {
      unsubLock();
      unsubProg();
    };
  }, [hasCurrentSong]);

  const handleRemoteReloadPlayer = () => {
    if (!window.confirm('Kirim sinyal muat ulang (reload) ke layar proyektor TV?')) return;
    if (onRemotePlayerCommand) {
      onRemotePlayerCommand('reload');
    } else {
      try {
        const db = initFirebaseDatabase();
        if (db) {
          const cmdRef = ref(db, `cafeyou/player_commands/${STORAGE_KEY}`);
          set(cmdRef, { command: 'reload', timestamp: Date.now() }).catch(() => {});
        }
      } catch {}
    }
  };

  const progressPercent = progress.duration > 0
    ? Math.min(100, (progress.currentTime / progress.duration) * 100)
    : 0;

  return (
    <div className="bg-slate-800/95 rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-700/60 space-y-4">
      {/* 1. Header Dek Kendali & Status Proyektor */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>🎚️</span> Dek Kendali Utama
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
              isPlayerOnline
                ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                : 'text-slate-400 bg-slate-900 border-slate-700'
            }`}
            title={isPlayerOnline ? `Layar TV Aktif: ${playerDeviceName || 'Online'}` : 'Layar Proyektor belum dibuka di TV atau sedang offline'}
          >
            <span className={`w-2 h-2 rounded-full ${isPlayerOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`} />
            <span>{isPlayerOnline ? (playerDeviceName ? `TV: ${playerDeviceName}` : 'TV Online') : 'TV Offline'}</span>
          </span>

          {isPlayerOnline && (
            <button
              type="button"
              onClick={handleRemoteReloadPlayer}
              className="text-[10px] font-bold text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-600/50 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="Kirim sinyal muat ulang (reload) ke layar proyektor TV jika video macet"
            >
              <span>🔄</span>
              <span>Reload TV</span>
            </button>
          )}

          {hasCurrentSong && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              ON AIR
            </span>
          )}
        </div>
      </div>

      {/* 2. Bar Progres Durasi Lagu Realtime (Seekbar) */}
      <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/50 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Durasi Lagu:</span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {hasCurrentSong ? formatTime(progress.currentTime) : '--:--'}
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-xs text-slate-400">
              {hasCurrentSong ? formatTime(progress.duration) : '--:--'}
            </span>
          </div>

          {/* Navigasi Lompat Detik (-10s / +10s) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!hasCurrentSong || !onSeek}
              onClick={() => onSeek?.(-10)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Mundur 10 detik"
            >
              ⏪ -10s
            </button>
            <button
              type="button"
              disabled={!hasCurrentSong || !onSeek}
              onClick={() => onSeek?.(10)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white rounded-lg text-[10px] font-bold border border-slate-700 active:scale-95 transition-all cursor-pointer"
              title="Maju 10 detik (lewati intro)"
            >
              ⏩ +10s
            </button>
          </div>
        </div>

        {/* Progress Track / Slider */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={progress.duration || 100}
            value={progress.currentTime || 0}
            disabled={!hasCurrentSong || !progress.duration || !onSeekTo}
            onChange={(e) => onSeekTo?.(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* 3. Tombol Playback Utama: Putar, Replay, Lewati & Stop Standby */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onTogglePlay}
          disabled={!hasCurrentSong}
          className={`py-3 px-2 rounded-xl flex flex-col justify-center items-center gap-1 text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
            isPlaying
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-yellow-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20'
          }`}
          title={isPlaying ? 'Jeda pemutaran lagu' : 'Putar lagu'}
        >
          {isPlaying ? (
            <>
              <PauseIcon className="w-4 h-4" />
              <span>Jeda</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              <span>Putar</span>
            </>
          )}
        </button>

        <button
          onClick={onReplay}
          disabled={!hasCurrentSong}
          className="py-3 px-2 bg-slate-700/80 hover:bg-slate-700 active:scale-95 text-indigo-300 hover:text-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex flex-col justify-center items-center gap-1 text-xs font-bold transition-all border border-slate-600/60 shadow-md cursor-pointer"
          title="Putar ulang lagu dari awal (detik 0)"
        >
          <span className="text-sm">🔄</span>
          <span>Ulangi</span>
        </button>

        <button
          onClick={onSkip}
          disabled={!hasCurrentSong}
          className="py-3 px-2 bg-slate-700/80 hover:bg-slate-700 active:scale-95 text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex flex-col justify-center items-center gap-1 text-xs font-bold transition-all border border-slate-600/60 shadow-md cursor-pointer"
          title="Lewati ke lagu berikutnya di antrean"
        >
          <SkipIcon className="w-4 h-4" />
          <span>Lewati</span>
        </button>

        <button
          onClick={onStopToStandby}
          disabled={!hasCurrentSong}
          className="py-3 px-2 bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 text-rose-300 hover:text-rose-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex flex-col justify-center items-center gap-1 text-xs font-bold transition-all border border-rose-700/50 shadow-md cursor-pointer"
          title="Hentikan pemutaran darurat dan kembalikan layar ke screensaver standby"
        >
          <span className="text-sm">⏹️</span>
          <span>Standby</span>
        </button>
      </div>

      {/* 4. Slider Volume & Preset Cepat */}
      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2.5">
        <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              isMuted
                ? 'bg-red-500/20 text-red-400 font-bold'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title={isMuted ? 'Buka Mute Suara' : 'Mute Suara Proyektor'}
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

          {/* Preset Volume 1-Klik */}
          <div className="flex items-center gap-1">
            {[25, 60, 100].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onVolumeChange(preset)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  volume === preset && !isMuted
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
                title={`Set volume ke ${preset}%`}
              >
                {preset}%
              </button>
            ))}
            <span className="font-mono text-emerald-400 bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700 ml-1.5 text-xs font-bold shadow-inner">
              Vol: {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
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

      {/* 5. Quick Sound Effect Buttons */}
      <div className="pt-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Efek Suara Instan</span>
          <span className="text-[10px] text-slate-500">1-Klik</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onQuickSoundEffect('applause')}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-amber-300 hover:text-amber-200 border border-slate-700/70 hover:border-amber-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <span>👏</span> Tepuk
          </button>
          <button
            onClick={() => onQuickSoundEffect('airhorn')}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-rose-300 hover:text-rose-200 border border-slate-700/70 hover:border-rose-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <span>📯</span> Terompet
          </button>
          <button
            onClick={() => onQuickSoundEffect('cheer')}
            className="p-2 bg-slate-900/70 hover:bg-slate-900 text-emerald-300 hover:text-emerald-200 border border-slate-700/70 hover:border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <span>🎉</span> Hore
          </button>
        </div>
      </div>

      {/* 6. Pintasan Cepat Proyektor (Running Text & Soundboard) */}
      {(onOpenRunningText || onOpenSoundBoard) && (
        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
          {onOpenRunningText && (
            <button
              type="button"
              onClick={onOpenRunningText}
              className="flex-1 py-2 px-3 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
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
              className="flex-1 py-2 px-3 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-indigo-300 border border-slate-700/80 hover:border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
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
