import React, { useRef, useState, useEffect } from 'react';
import { BackIcon, FullscreenIcon } from '../icons/Icons';
import { PlayerPlaceholder } from './PlayerPlaceholder';
import { useKaraoke } from '../../hooks/useKaraoke';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';
import { useWakeLock } from '../../hooks/useWakeLock';
import { AppRole, LiveReactionEvent } from '../../types';
import { initFirebaseDatabase, ref, set, onValue } from '../../config/firebase';
import { STORAGE_KEY } from '../../constants/karaoke';

interface PlayerScreenProps {
  setRole?: (role: AppRole) => void;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  tableNumber: string;
  leftPercent: number;
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

  // Mencegah layar proyektor redup/mati otomatis
  useWakeLock(true);

  const { state, currentSong, nextSongs, nextSong } = useKaraoke();

  const { player, errorNotice } = useYouTubePlayer({
    containerRef,
    appState: state,
    onSongEnd: () => {
      nextSong();
    },
    onErrorFallback: () => {
      nextSong();
    },
  });

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

    // Buka kunci suara pada instance YouTube Player
    try {
      if (player && typeof player.unMute === 'function') {
        player.unMute();
        player.setVolume(state?.volume ?? 100);
        if (state?.playbackStatus === 'PLAYING' && typeof player.playVideo === 'function') {
          player.playVideo();
        }
      }
    } catch {}
  };

  // Dengarkan perintah remote dari Operator (misal: reload layar proyektor)
  useEffect(() => {
    const mountTime = Date.now();
    const db = initFirebaseDatabase();
    if (!db) return;

    try {
      const cmdRef = ref(db, `cafeyou/player_commands/${STORAGE_KEY}`);
      const unsub = onValue(cmdRef, (snap) => {
        const val = snap.val();
        if (val && val.command === 'reload' && val.timestamp > mountTime) {
          console.log('Menerima perintah muat ulang remote dari operator...');
          window.location.reload();
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  // Kirim sinyal detak jantung (heartbeat) ke Firebase agar Operator tahu Proyektor online
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) return;
    const hbRef = ref(db, `cafeyou/player_heartbeat/${STORAGE_KEY}`);
    const sendHb = () => {
      set(hbRef, { timestamp: Date.now(), status: 'online' }).catch(() => {});
    };
    sendHb();
    const interval = setInterval(sendHb, 10000);
    return () => clearInterval(interval);
  }, []);

  const nextSongItem = nextSongs[0] || null;

  // Tangkap liveReaction dari state sinkronisasi
  useEffect(() => {
    const rx: LiveReactionEvent | null | undefined = state?.liveReaction;
    if (rx && rx.id && rx.id !== lastProcessedReactionRef.current) {
      lastProcessedReactionRef.current = rx.id;

      // Buat posisi acak di bagian bawah layar (antara 20% - 80% lebar layar)
      const leftPercent = 20 + Math.random() * 60;
      const newReaction: FloatingReaction = {
        id: rx.id,
        emoji: rx.emoji,
        tableNumber: rx.tableNumber || 'Pelanggan',
        leftPercent,
      };

      setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);

      // Hapus setelah animasi selesai (3.5 detik)
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((item) => item.id !== newReaction.id));
      }, 3500);
    }
  }, [state?.liveReaction]);

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
      {/* Interactive Audio Unlock Gesture Banner (Mengatasi Autoplay Policy Browser) */}
      {!audioUnlocked && (
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
              Klik di mana saja pada layar ini untuk membuka kunci suara & pemutaran otomatis YouTube.
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

      {/* Floating Header Controls (Muncul saat hover mouse) */}
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

      {/* Placeholder jika antrean kosong (Stage Screensaver) */}
      {hasNoSongs && (
        <PlayerPlaceholder
          cafeSettings={state?.cafeSettings}
          songLibrary={state?.songLibrary}
          audioUnlocked={audioUnlocked}
        />
      )}

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

      {/* OVERLAY: Floating Live Crowd Reactions (Animasi Gelembung Emoji Naik dari Bawah) */}
      <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
        {floatingReactions.map((rx) => (
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
            <div className="text-[10px] text-blue-300 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-full shrink-0 border border-blue-500/20">
              {state?.cafeSettings?.name || 'CAFEYOU'}
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Notifikasi Video Dibatasi Lisensi YouTube HUD */}
      {errorNotice && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-950/95 border border-amber-500/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-w-md w-[90vw] animate-scaleUp backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            ⚠️
          </div>
          <h4 className="text-lg font-black text-white mb-1">Lagu Tidak Dapat Diputar</h4>
          <p className="text-xs text-amber-300 font-medium leading-relaxed">{errorNotice}</p>
        </div>
      )}

      {/* OVERLAY: Audio & Fullscreen Unlock Banner (Khusus Smart Proyektor VIDAA / TV) */}
      {!audioUnlocked && (
        <div
          onClick={() => {
            setAudioUnlocked(true);
            toggleFullScreen();
          }}
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 cursor-pointer animate-fadeIn"
        >
          <div className="bg-slate-900/95 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-4 shadow-2xl shadow-emerald-500/20 transform hover:scale-105 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-3xl flex items-center justify-center mx-auto shadow-inner animate-bounce">
              🎤
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Aktifkan Layar & Suara Karaoke
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tekan <strong className="text-emerald-400 font-bold">OK di Remote Proyektor</strong> atau <strong>Klik Layar</strong> ini sekali untuk mengaktifkan audio otomatis & mode layar penuh.
              </p>
            </div>
            <button
              type="button"
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/40 border border-emerald-400/50 uppercase tracking-wider inline-flex items-center gap-2"
            >
              <span>🚀 Mulai Sekarang</span>
            </button>
            <div className="text-[11px] text-slate-400 font-mono">
              AVIEWLUX VIDAA & Cloud Mode Ready
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
