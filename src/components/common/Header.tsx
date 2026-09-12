import React from 'react';
import {
  BackIcon,
  SparklesIcon,
  ExternalLinkIcon,
  SettingsIcon,
  HistoryIcon,
  LockIcon,
  TicketIcon,
} from '../icons/Icons';

interface HeaderProps {
  title: string;
  cafeName?: string;
  onBack?: () => void;
  statusText?: string;
  isCloudConnected?: boolean;
  historyCount?: number;
  activeVoucherCount?: number;
  isDailyPinActive?: boolean;
  onOpenSoundBoard?: () => void;
  onOpenPopularSongs?: () => void;
  onOpenProjectorTab?: () => void;
  onOpenHistory?: () => void;
  onOpenVoucherManager?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  cafeName = 'CAFEYOU',
  onBack,
  isCloudConnected = false,
  historyCount = 0,
  activeVoucherCount = 0,
  isDailyPinActive = false,
  onOpenSoundBoard,
  onOpenPopularSongs,
  onOpenProjectorTab,
  onOpenHistory,
  onOpenVoucherManager,
  onOpenSettings,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-lg px-4 py-3 shadow-xl sticky top-0 z-30 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3 select-none">
      {/* KIRI: Brand Logo, Judul & Venue Badge */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors border border-slate-750"
            title="Kembali"
          >
            <BackIcon className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 text-base font-extrabold">
            🎤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>{cafeName}</span>
                <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                  OPERATOR
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span className="text-slate-300 font-semibold">{title}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isCloudConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isCloudConnected ? 'Cloud Sync' : 'Lokal'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: Kontrol Operasional + Tombol Pusat Pengaturan */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* GRUP 1: ⚡ AKSI CEPAT OPERASIONAL KASIR */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/70 shadow-sm">
          {onOpenProjectorTab && (
            <button
              onClick={onOpenProjectorTab}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
              title="Buka Layar Proyektor di Tab Baru (Untuk Monitor Kedua / HDMI TV)"
            >
              <ExternalLinkIcon className="w-3.5 h-3.5" />
              <span>Proyektor ↗</span>
            </button>
          )}

          {onOpenPopularSongs && (
            <button
              onClick={onOpenPopularSongs}
              className="px-2.5 py-1.5 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Pilih Cepat dari Lagu Populer Kafe"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Populer</span>
            </button>
          )}

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="px-2.5 py-1.5 hover:bg-cyan-500/20 text-cyan-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Buka Riwayat Lagu yang Pernah Diputar"
            >
              <HistoryIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Riwayat</span>
              {historyCount > 0 && (
                <span className="text-[9px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {onOpenSoundBoard && (
            <button
              onClick={onOpenSoundBoard}
              className="px-2.5 py-1.5 hover:bg-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Buka Soundboard Efek Suara (Tepuk Tangan, Airhorn, Sorak)"
            >
              <span className="text-xs">🎛️</span>
              <span className="hidden sm:inline">Sound FX</span>
            </button>
          )}
        </div>

        {/* GRUP 2: ⚙️ PUSAT PENGATURAN & KONTROL SISTEM */}
        <div className="flex items-center gap-1.5">
          {/* Tombol Akses Cepat Voucher & PIN Tamu */}
          {onOpenVoucherManager && (
            <button
              onClick={onOpenVoucherManager}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                activeVoucherCount > 0 || isDailyPinActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/50 text-amber-200 shadow-amber-500/10'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Kelola Kode Voucher Meja & PIN Akses Harian Tamu"
            >
              <TicketIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-extrabold">Voucher & PIN</span>
              {activeVoucherCount > 0 ? (
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full shadow-sm">
                  {activeVoucherCount}
                </span>
              ) : isDailyPinActive ? (
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold px-1.5 py-0.2 rounded-full">
                  PIN
                </span>
              ) : null}
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                isCloudConnected
                  ? 'bg-slate-800 hover:bg-blue-600/20 border-slate-700 hover:border-blue-500/40 text-slate-200 hover:text-white'
                  : 'bg-slate-800 hover:bg-amber-500/20 border-slate-700 hover:border-amber-500/40 text-slate-300'
              }`}
              title="Buka Pusat Pengaturan Kafe (Profil, Meja, Voucher, TV, Keamanan)"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <SettingsIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-extrabold">Pengaturan ⚙️</span>
            </button>
          )}

          {/* Tombol Kunci / Keluar Operator */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Kunci Dasbor / Logout Kasir"
            >
              <LockIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
