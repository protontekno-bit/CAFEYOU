import React, { useState, useEffect } from 'react';
import { CafeSettings } from '../../types';
import { DEFAULT_CAFE_SETTINGS } from '../../constants/karaoke';

interface PlayerPlaceholderProps {
  cafeSettings?: CafeSettings;
}

export const PlayerPlaceholder: React.FC<PlayerPlaceholderProps> = ({ cafeSettings }) => {
  const currentSettings = cafeSettings || DEFAULT_CAFE_SETTINGS;
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const date = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      setTimeStr(`${time} WIB`);
      setDateStr(date);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // URL untuk QR Code Guest Portal yang ditampilkan di layar proyektor
  const baseUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const guestPortalUrl = `${baseUrl}#guest`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    guestPortalUrl
  )}&bgcolor=0f172a&color=ffffff&margin=8`;

  // 24 Bar Visualizer Bars dengan delay animasi unik
  const visualizerBars = Array.from({ length: 24 }, (_, i) => {
    const duration = 0.8 + (i % 6) * 0.15;
    const delay = (i * 0.08) % 0.9;
    return { id: i, duration, delay };
  });

  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center text-slate-100 z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 overflow-hidden select-none">
      {/* 1. Dynamic Floating Ambient Light Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[110px] pointer-events-none animate-floatOrb1" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-floatOrb2" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none animate-floatOrb3" />

      {/* 2. Top Bar: Live Digital Clock & Venue Status */}
      <div className="w-full max-w-6xl flex justify-between items-center relative z-20">
        {/* Kiri: Status Stage */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
            STAGE READY • STANDBY
          </span>
        </div>

        {/* Kanan: Live Date & Clock */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl text-right">
          <div className="hidden sm:block text-[11px] text-slate-400 font-medium">
            {dateStr}
          </div>
          <div className="text-xs sm:text-sm font-black text-cyan-300 font-mono tracking-wider">
            {timeStr}
          </div>
        </div>
      </div>

      {/* 3. Center Hero: Stage Screensaver & Cafe Brand Animation */}
      <div className="flex flex-col items-center justify-center text-center relative z-20 my-auto py-6 max-w-4xl w-full">
        {/* Animated Equalizer Wave Behind Brand */}
        <div className="flex items-end justify-center gap-1.5 h-16 sm:h-20 mb-4 opacity-50 pointer-events-none">
          {visualizerBars.map((bar) => (
            <div
              key={bar.id}
              className="w-1.5 sm:w-2 bg-gradient-to-t from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all"
              style={{
                animation: `waveBar ${bar.duration}s ease-in-out infinite alternate`,
                animationDelay: `${bar.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Icon & Brand Heading */}
        <div className="relative group">
          {/* Glowing Aura Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition duration-1000 animate-glowPulse pointer-events-none" />

          <div className="relative flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-black uppercase tracking-widest mb-3 shadow-lg backdrop-blur-md">
              <span>🎤 STAGE KARAOKE LOUNGE</span>
            </div>

            {/* Giant Cafe Name with Smooth Gradient */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-300 tracking-tight drop-shadow-[0_10px_35px_rgba(59,130,246,0.35)]">
              {currentSettings.name}
            </h1>

            {/* Tagline */}
            <p className="text-base sm:text-2xl font-bold text-slate-300 mt-2 tracking-wide flex items-center justify-center gap-2">
              <span>{currentSettings.tagline || 'Karaoke & Dining Experience'}</span>
            </p>
          </div>
        </div>

        {/* Action Callout & Quick QR Scan for Guests */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 bg-slate-900/70 backdrop-blur-lg border border-slate-700/70 rounded-3xl shadow-2xl">
          {/* Mini QR Card */}
          <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700 shrink-0 shadow-inner">
            <img
              src={qrImageUrl}
              alt="Scan untuk Request Lagu"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-xl"
            />
          </div>

          <div className="text-center sm:text-left space-y-1.5 max-w-sm">
            <div className="text-xs sm:text-sm font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>📱 Scan untuk Request Lagu dari HP</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              Arahkan kamera smartphone Anda ke QR code ini, pilih nomor meja Anda, dan pesan lagu langsung dari HP.
            </p>

            {/* Wi-Fi Info Badge jika disetting */}
            {currentSettings.wifiName && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300 font-semibold mt-1">
                <span>📶 Wi-Fi: <strong>{currentSettings.wifiName}</strong></span>
                {currentSettings.wifiPassword && (
                  <span>• Pass: <strong>{currentSettings.wifiPassword}</strong></span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Hint */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-500 relative z-20 pt-2 border-t border-slate-800/80">
        <div>
          Pilih lagu dari Dasbor Operator Kasir untuk memulai video karaoke di panggung ini.
        </div>
        <div className="text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
          💡 Klik 1x di mana saja pada layar ini untuk mengizinkan Autoplay Audio Browser
        </div>
      </div>
    </div>
  );
};
