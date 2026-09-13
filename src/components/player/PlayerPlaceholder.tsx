import React, { useState, useEffect, useMemo } from 'react';
import { CafeSettings, SavedLibrarySong } from '../../types';
import { DEFAULT_CAFE_SETTINGS } from '../../constants/karaoke';
import { POPULAR_KARAOKE_SONGS } from '../../utils/youtube';
import { startAmbientBgm, stopAmbientBgm, isAmbientBgmPlaying } from '../../utils/ambientBgm';

interface PlayerPlaceholderProps {
  cafeSettings?: CafeSettings;
  songLibrary?: Record<string, SavedLibrarySong>;
  audioUnlocked?: boolean;
}

export const PlayerPlaceholder: React.FC<PlayerPlaceholderProps> = ({
  cafeSettings,
  songLibrary,
  audioUnlocked = false,
}) => {
  const currentSettings = cafeSettings || DEFAULT_CAFE_SETTINGS;
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isBgmMuted, setIsBgmMuted] = useState<boolean>(false);

  // Live Digital Clock (WIB)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotasi Slide Otomatis (Setiap 9 Detik)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  // Manajemen Ambient BGM saat antrean kosong
  useEffect(() => {
    if (audioUnlocked && !isBgmMuted) {
      // Jeda 2 detik sebelum BGM mulai agar transisi halus
      const startTimer = setTimeout(() => {
        startAmbientBgm(0.18);
      }, 2000);
      return () => {
        clearTimeout(startTimer);
        stopAmbientBgm();
      };
    } else {
      stopAmbientBgm();
    }
    return () => {
      stopAmbientBgm();
    };
  }, [audioUnlocked, isBgmMuted]);

  // URL QR Code Guest Portal
  const baseUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const guestPortalUrl = `${baseUrl}#guest`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    guestPortalUrl
  )}&bgcolor=0f172a&color=38bdf8&margin=6`;

  // Rekomendasi 6 Lagu Hits Pilihan untuk Slide 2
  const featuredSongs = useMemo(() => {
    const fromLib = Object.values(songLibrary || {}).filter((s) => s && s.title);
    if (fromLib.length >= 6) {
      return fromLib
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 6)
        .map((s) => ({
          title: s.title,
          artist: s.artist || 'Favorit Kafe',
          category: 'Paling Sering Diputar',
        }));
    }
    return POPULAR_KARAOKE_SONGS.slice(0, 6);
  }, [songLibrary]);

  // 20 Bar Visualizer Bars
  const visualizerBars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    duration: 0.7 + (i % 5) * 0.15,
    delay: (i * 0.08) % 0.8,
  }));

  const handleToggleBgm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBgmMuted) {
      setIsBgmMuted(false);
      startAmbientBgm(0.18);
    } else {
      setIsBgmMuted(true);
      stopAmbientBgm();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center text-slate-100 z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-10 overflow-hidden select-none">
      {/* 1. Dynamic Ambient Light Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[110px] pointer-events-none animate-floatOrb1" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-floatOrb2" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none animate-floatOrb3" />

      {/* 2. Top Bar: Live Digital Clock & Venue Status */}
      <div className="w-full max-w-6xl flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
            STAGE READY • STANDBY
          </span>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl text-right">
          <div className="hidden sm:block text-[11px] text-slate-400 font-medium">
            {dateStr}
          </div>
          <div className="text-xs sm:text-sm font-black text-cyan-300 font-mono tracking-wider">
            {timeStr}
          </div>
        </div>
      </div>

      {/* 3. Center Interactive Slideshow (3 Slide Bergantian) */}
      <div className="flex flex-col items-center justify-center text-center relative z-20 my-auto py-4 max-w-5xl w-full">
        {/* SLIDE 0: Panggung Siap & Scan QR */}
        {activeSlide === 0 && (
          <div className="flex flex-col items-center animate-fadeIn w-full">
            {/* Equalizer Visualizer */}
            <div className="flex items-end justify-center gap-1.5 h-12 mb-3 opacity-60 pointer-events-none">
              {visualizerBars.map((bar) => (
                <div
                  key={bar.id}
                  className="w-1.5 bg-gradient-to-t from-blue-500 via-indigo-400 to-emerald-400 rounded-full"
                  style={{
                    animation: `waveBar ${bar.duration}s ease-in-out infinite alternate`,
                    animationDelay: `${bar.delay}s`,
                  }}
                />
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-widest mb-2 shadow-lg backdrop-blur-md">
              <span>🎤 PANGGUNG TERSEDIA</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-300 tracking-tight drop-shadow-[0_10px_35px_rgba(59,130,246,0.35)]">
              {currentSettings.name}
            </h1>

            <p className="text-sm sm:text-lg font-semibold text-slate-300 mt-1 tracking-wide">
              {currentSettings.tagline || 'Karaoke & Dining Experience'}
            </p>

            {/* QR Code Card & 3 Langkah Mudah */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-900/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl">
              <div className="bg-slate-950 p-2.5 rounded-2xl border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20 shrink-0 relative group">
                <img
                  src={qrImageUrl}
                  alt="Scan untuk Request Lagu"
                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-xl"
                />
                <div className="absolute inset-0 rounded-xl border border-cyan-400/30 pointer-events-none animate-pulse" />
              </div>

              <div className="text-left space-y-2.5 max-w-md">
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span className="text-cyan-400">📱</span>
                  <span>Jadilah Bintang Berikutnya!</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] border border-blue-500/30">1</span>
                    <span>Scan QR dengan kamera smartphone Anda</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-[10px] border border-purple-500/30">2</span>
                    <span>Pilih nomor meja atau masukkan kode voucher</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/30">3</span>
                    <span>Pilih lagu YouTube favorit Anda untuk dinyanyikan!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 1: Hits Populer & Inspirasi Lagu */}
        {activeSlide === 1 && (
          <div className="flex flex-col items-center animate-fadeIn w-full max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-3 shadow-lg backdrop-blur-md">
              <span>🔥 INSPIRASI LAGU MALAM INI</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
              Lagu Terpopuler di {currentSettings.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-5">
              Bingung mau nyanyi apa? Coba salah satu lagu favorit pengunjung berikut:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              {featuredSongs.map((song, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 flex items-center gap-3 text-left hover:border-amber-500/40 transition-colors shadow-lg"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {song.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {song.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 text-xs text-cyan-300 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full">
              💡 Scan QR di meja Anda untuk memesan lagu-lagu di atas secara instan
            </div>
          </div>
        )}

        {/* SLIDE 2: Info Wi-Fi & Fasilitas Kafe */}
        {activeSlide === 2 && (
          <div className="flex flex-col items-center animate-fadeIn w-full max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest mb-3 shadow-lg backdrop-blur-md">
              <span>☕ FASILITAS & KENIKMATAN KAFE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
              Nikmati Suasana & Menu Terbaik
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Santai sejenak dengan kopi hangat, minuman segar, dan camilan lezat kami.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {/* Card Wi-Fi */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-700/70 shadow-xl flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-300 text-2xl flex items-center justify-center border border-cyan-500/30">
                  📶
                </div>
                <div className="text-sm font-extrabold text-white">Koneksi Wi-Fi Cepat</div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>SSID: <strong className="text-cyan-300">{currentSettings.wifiName || 'CAFEYOU_WIFI'}</strong></div>
                  {currentSettings.wifiPassword && (
                    <div>Password: <strong className="text-emerald-300">{currentSettings.wifiPassword}</strong></div>
                  )}
                </div>
              </div>

              {/* Card E-Menu */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-700/70 shadow-xl flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 text-2xl flex items-center justify-center border border-amber-500/30">
                  🍟
                </div>
                <div className="text-sm font-extrabold text-white">E-Menu & Dining</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Pesan makanan & minuman langsung dari smartphone Anda tanpa beranjak dari tempat duduk.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide Indicators (Dots) */}
        <div className="flex items-center gap-2 mt-6">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeSlide === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Buka Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 4. Bottom Bar: BGM Status & Hint */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-400 relative z-20 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <span>Pilih lagu dari Dasbor Operator atau Smartphone Meja untuk memulai video karaoke.</span>
        </div>

        {/* Ambient BGM Audio Toggle Badge */}
        <div className="flex items-center gap-2">
          {audioUnlocked && (
            <button
              onClick={handleToggleBgm}
              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                !isBgmMuted && isAmbientBgmPlaying()
                  ? 'bg-purple-900/40 border-purple-500/40 text-purple-300 hover:bg-purple-800/40'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title="Aktifkan/Matikan Musik Latar Standby"
            >
              <span>{!isBgmMuted && isAmbientBgmPlaying() ? '🎵 Musik Latar: Aktif' : '🔇 Musik Latar: Senyap'}</span>
            </button>
          )}
          <span className="text-slate-500 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
            Panggung Siap • Layar Proyektor
          </span>
        </div>
      </div>
    </div>
  );
};
