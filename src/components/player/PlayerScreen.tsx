import React, { useRef, useState, useEffect } from 'react';
import { BackIcon, FullscreenIcon } from '../icons/Icons';
import { PlayerPlaceholder } from './PlayerPlaceholder';
import { PlayerLockedOverlay } from './PlayerLockedOverlay';
import { PlayerFloatingReactions, FloatingReaction } from './PlayerFloatingReactions';
import { PlayerStageBanners } from './PlayerStageBanners';
import { useKaraoke } from '../../hooks/useKaraoke';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';
import { useWakeLock } from '../../hooks/useWakeLock';
import { usePlayerSessionLock } from '../../hooks/usePlayerSessionLock';
import { AppRole, LiveReactionEvent } from '../../types';
import { initFirebaseDatabase, ref, set, onValue } from '../../config/firebase';
import { STORAGE_KEY } from '../../constants/karaoke';

interface PlayerScreenProps {
  setRole?: (role: AppRole) => void;
}

export const PlayerScreen: React.FC<PlayerScreenProps> = ({ setRole }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('cafeyou_player_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const lastProcessedReactionRef = useRef<string | null>(null);
  const lastProcessedCmdRef = useRef<number>(Date.now());
  const [isEmergencyStandby, setIsEmergencyStandby] = useState<boolean>(false);

  // Mencegah layar proyektor redup/mati otomatis
  useWakeLock(true);

  // Kunci Sesi Tunggal (Single Active Player Lock)
  const {
    isMaster,
    isLocked,
    isMirror,
    activeLockInfo,
    takeOver,
    enableMirrorMode,
  } = usePlayerSessionLock();

  const isMasterRef = useRef(isMaster);
  isMasterRef.current = isMaster;

  const { state, currentSong, nextSongs, nextSong } = useKaraoke();

  // Inisialisasi YouTube Player
  // CATATAN KRUSIAL: onSongEnd HANYA dipicu oleh layar Master
  const { player, errorNotice } = useYouTubePlayer({
    containerRef,
    appState: state,
    onSongEnd: () => {
      if (isMasterRef.current) {
        nextSong();
      }
    },
    onErrorFallback: () => {
      if (isMasterRef.current) {
        nextSong();
      }
    },
  });

  const playerRef = useRef(player);
  playerRef.current = player;

  // Jika dalam Mode Mirror, pastikan audio dinonaktifkan agar tidak tabrakan dengan Master
  useEffect(() => {
    if (isMirror && playerRef.current && typeof playerRef.current.mute === 'function') {
      try {
        playerRef.current.mute();
      } catch {}
    }
  }, [isMirror]);

  const handleUnlockAudio = () => {
    setAudioUnlocked(true);
    try {
      sessionStorage.setItem('cafeyou_player_unlocked', 'true');
    } catch {}

    // Buka kunci Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
    } catch {}

    // Buka kunci suara pada YouTube Player jika bukan mirror
    try {
      if (player && typeof player.unMute === 'function') {
        if (!isMirror) {
          player.unMute();
          player.setVolume(state?.volume ?? 100);
        }
        if (state?.playbackStatus === 'PLAYING' && typeof player.playVideo === 'function') {
          player.playVideo();
        }
      }
    } catch {}
  };

  // Dengarkan perintah remote dari Operator (reload, mute, unmute)
  useEffect(() => {
    const mountTime = Date.now();
    const db = initFirebaseDatabase();
    if (!db) return;

    try {
      const cmdRef = ref(db, `cafeyou/player_commands/${STORAGE_KEY}`);
      const unsub = onValue(cmdRef, (snap) => {
        const val = snap.val();
        if (val && val.timestamp > lastProcessedCmdRef.current) {
          lastProcessedCmdRef.current = val.timestamp;
          if (val.command === 'reload') {
            window.location.reload();
          } else if (val.command === 'mute') {
            playerRef.current?.mute?.();
          } else if (val.command === 'unmute' && !isMirror) {
            playerRef.current?.unMute?.();
          } else if (val.command === 'seek' && typeof val.seconds === 'number') {
            try {
              const current = playerRef.current?.getCurrentTime?.() || 0;
              const duration = playerRef.current?.getDuration?.() || 0;
              const target = Math.max(0, Math.min(duration || 9999, current + val.seconds));
              playerRef.current?.seekTo?.(target, true);
            } catch {}
          } else if (val.command === 'seekTo' && typeof val.targetTime === 'number') {
            try {
              playerRef.current?.seekTo?.(Math.max(0, val.targetTime), true);
            } catch {}
          } else if (val.command === 'stop_standby') {
            try {
              playerRef.current?.pauseVideo?.();
              setIsEmergencyStandby(true);
            } catch {}
          }
        }
      });
      return () => unsub();
    } catch {}
  }, [isMirror]);

  // Laporkan posisi durasi pemutaran lagu ke Firebase (Hanya Layar Master)
  useEffect(() => {
    if (!isMaster) return;
    const db = initFirebaseDatabase();
    if (!db) return;

    const progressRef = ref(db, `cafeyou/player_progress/${STORAGE_KEY}`);
    const interval = setInterval(() => {
      try {
        const p = playerRef.current;
        if (p && typeof p.getCurrentTime === 'function' && typeof p.getDuration === 'function') {
          const duration = Math.round(p.getDuration() || 0);
          if (duration > 0) {
            const currentTime = Math.round(p.getCurrentTime() || 0);
            const stateCode = typeof p.getPlayerState === 'function' ? p.getPlayerState() : -1;
            set(progressRef, {
              currentTime,
              duration,
              isPlaying: stateCode === 1,
              timestamp: Date.now(),
            }).catch(() => {});
          }
        }
      } catch {}
    }, 1200);

    return () => clearInterval(interval);
  }, [isMaster]);

  // Kirim sinyal detak jantung proyektor ke Firebase agar Operator tahu Proyektor online
  useEffect(() => {
    if (!isMaster) return;
    const db = initFirebaseDatabase();
    if (!db) return;
    const hbRef = ref(db, `cafeyou/player_heartbeat/${STORAGE_KEY}`);
    const sendHb = () => {
      set(hbRef, { timestamp: Date.now(), status: 'online' }).catch(() => {});
    };
    sendHb();
    const interval = setInterval(sendHb, 10000);
    return () => clearInterval(interval);
  }, [isMaster]);

  const nextSongItem = nextSongs[0] || null;

  // Tangkap liveReaction dari state sinkronisasi
  useEffect(() => {
    const rx: LiveReactionEvent | null | undefined = state?.liveReaction;
    if (rx && rx.id && rx.id !== lastProcessedReactionRef.current) {
      lastProcessedReactionRef.current = rx.id;
      const leftPercent = 20 + Math.random() * 60;
      const newReaction: FloatingReaction = {
        id: rx.id,
        emoji: rx.emoji,
        tableNumber: rx.tableNumber || 'Pelanggan',
        leftPercent,
      };

      setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((item) => item.id !== newReaction.id));
      }, 3500);
    }
  }, [state?.liveReaction]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerWrapperRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
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

  // Reset emergency standby saat tombol play ditekan atau lagu berganti
  useEffect(() => {
    if (state?.playbackStatus === 'PLAYING') {
      setIsEmergencyStandby(false);
    }
  }, [state?.playbackStatus, currentSong?.id]);

  const hasNoSongs = isEmergencyStandby || (!currentSong && (!state?.queue || state.queue.length === 0));

  return (
    <div
      ref={playerWrapperRef}
      className="w-full h-screen bg-black relative group flex items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* 1. OVERLAY PROTEKSI KUNCI SESI GANDA (Single Active Player Lock) */}
      {isLocked && (
        <PlayerLockedOverlay
          activeLockInfo={activeLockInfo}
          onTakeOver={takeOver}
          onEnableMirror={enableMirrorMode}
          onBackToHome={() => setRole?.('landing')}
        />
      )}

      {/* 2. Interactive Audio Unlock Gesture Banner (Mengatasi Autoplay Policy Browser) */}
      {!audioUnlocked && !isLocked && (
        <div
          onClick={handleUnlockAudio}
          className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 cursor-pointer text-center animate-fadeIn group/unlock select-none"
        >
          <div className="p-6 rounded-3xl bg-slate-900/95 border border-purple-500/50 shadow-2xl shadow-purple-500/30 max-w-sm flex flex-col items-center gap-3.5 transition-transform duration-300 group-hover/unlock:scale-105">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/40 animate-pulse">
              🔊
            </div>
            <h3 className="text-base font-extrabold text-white tracking-wide">
              Layar Proyektor TV Siap
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Klik di mana saja pada layar ini (atau tekan OK di remote TV) untuk membuka kunci suara & pemutaran otomatis YouTube.
            </p>
            <button
              type="button"
              className="mt-1.5 px-6 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95 cursor-pointer"
            >
              Aktifkan Audio Proyektor 🎤
            </button>
          </div>
        </div>
      )}

      {/* 3. Floating Header Controls (Muncul saat hover mouse) */}
      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
        <div className="flex items-center gap-2">
          {setRole && (
            <>
              <button
                onClick={() => setRole('landing')}
                className="bg-black/70 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-2xl border border-white/10 flex items-center gap-2 transition-all hover:scale-105"
                title="Kembali ke Menu Utama"
              >
                <BackIcon className="w-4 h-4" />
                <span>Beranda</span>
              </button>
              <button
                onClick={() => setRole('operator')}
                className="bg-black/70 hover:bg-black text-purple-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-md shadow-2xl border border-white/10 flex items-center gap-1.5 transition-all hover:scale-105"
                title="Buka Dasbor Operator Karaoke"
              >
                <span>🎤</span>
                <span>Operator</span>
              </button>
            </>
          )}

          <div className="bg-black/70 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-md border border-white/10 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isMirror ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span>{isMirror ? 'Layar Monitor (Mirror)' : 'Layar Proyektor Utama (Master)'}</span>
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

      {/* 4. Placeholder jika antrean kosong (Stage Screensaver) */}
      {hasNoSongs && (
        <PlayerPlaceholder
          cafeSettings={state?.cafeSettings}
          songLibrary={state?.songLibrary}
          audioUnlocked={audioUnlocked && isMaster}
        />
      )}

      {/* 5. OVERLAY: Banner Panggung (Sedang Bernyanyi & Lagu Berikutnya) */}
      <PlayerStageBanners currentSong={currentSong} nextSongItem={nextSongItem} />

      {/* 7. OVERLAY: Floating Live Crowd Reactions */}
      <PlayerFloatingReactions reactions={floatingReactions} />

      {/* 8. OVERLAY: Running Text Banner (Pengumuman Kafe) */}
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
            <div className="text-[10px] text-blue-300 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-full shrink-0 border border-blue-500/20">
              {state?.cafeSettings?.name || 'CAFEYOU'}
            </div>
          </div>
        </div>
      )}

      {/* 9. OVERLAY: Notifikasi Video Dibatasi Lisensi YouTube HUD */}
      {errorNotice && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-950/95 border border-amber-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-w-md w-[90vw] animate-scaleUp backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            ⚠️
          </div>
          <h4 className="text-lg font-black text-white mb-1">Lagu Tidak Dapat Diputar</h4>
          <p className="text-xs text-amber-300 font-medium leading-relaxed">{errorNotice}</p>
        </div>
      )}

      {/* 10. Wadah YouTube yang diisolasi */}
      <div
        ref={containerRef}
        className="w-full h-full pointer-events-none absolute inset-0 z-0"
      />
    </div>
  );
};
