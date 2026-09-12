import React, { useState } from 'react';
import {
  BackIcon,
  SparklesIcon,
  MegaphoneIcon,
  ExternalLinkIcon,
  QrCodeIcon,
  SettingsIcon,
  HistoryIcon,
  TicketIcon,
  LockIcon,
} from '../icons/Icons';

interface HeaderProps {
  title: string;
  cafeName?: string;
  onBack?: () => void;
  statusText?: string;
  isCloudConnected?: boolean;
  historyCount?: number;
  onOpenSoundBoard?: () => void;
  onOpenPopularSongs?: () => void;
  onOpenRunningText?: () => void;
  onOpenProjectorTab?: () => void;
  onOpenFirebaseConfig?: () => void;
  onOpenQrShare?: () => void;
  onOpenHistory?: () => void;
  onOpenVouchers?: () => void;
  onOpenTableQr?: () => void;
  onOpenCafeSettings?: () => void;
  onOpenDeveloperHelp?: () => void;
  onOpenLibraryManager?: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  cafeName = 'CAFEYOU',
  onBack,
  isCloudConnected = false,
  historyCount = 0,
  onOpenSoundBoard,
  onOpenPopularSongs,
  onOpenRunningText,
  onOpenProjectorTab,
  onOpenFirebaseConfig,
  onOpenQrShare,
  onOpenHistory,
  onOpenVouchers,
  onOpenTableQr,
  onOpenCafeSettings,
  onOpenDeveloperHelp,
  onOpenLibraryManager,
  onChangePassword,
  onLogout,
}) => {
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);

  return (
    <header className="bg-slate-900/95 backdrop-blur-lg px-4 py-3 shadow-xl sticky top-0 z-30 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3">
      {/* KIRI: Brand Logo, Judul & Venue Badge */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white border border-slate-700/60 shadow-sm"
            title="Kembali ke Menu Utama"
          >
            <BackIcon className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 text-lg font-black">
            🎤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent tracking-tight leading-none">
                {title}
              </h1>

              {/* Dynamic Venue Badge */}
              {onOpenCafeSettings && (
                <button
                  onClick={onOpenCafeSettings}
                  className="px-2 py-0.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Klik untuk mengubah Nama Kafe / Venue"
                >
                  <span>📍 {cafeName}</span>
                  <span className="opacity-60 text-[8px]">✎</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Dual-Screen Control Engine · Powered by AuraCore
            </p>
          </div>
        </div>
      </div>

      {/* KANAN: Menu Terstruktur Berdasarkan Kelompok Fungsi */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* KLUSTER 1: 🎵 Musik & Sound FX */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/70 shadow-sm">
          {onOpenPopularSongs && (
            <button
              onClick={onOpenPopularSongs}
              className="px-2.5 py-1.5 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Buka Katalog Lagu Populer Kafe"
            >
              <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Katalog</span>
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
              <span className="hidden lg:inline">FX</span>
            </button>
          )}

          {onOpenLibraryManager && (
            <button
              onClick={onOpenLibraryManager}
              className="px-2.5 py-1.5 hover:bg-violet-500/20 text-violet-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Kelola Koleksi Lagu Kafe (Hapus / Tambah ke Antrean)"
            >
              <span className="text-xs">📚</span>
              <span className="hidden lg:inline">Koleksi</span>
            </button>
          )}
        </div>

        {/* KLUSTER 2: 🪑 Meja & Pelanggan */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/70 shadow-sm">
          {onOpenVouchers && (
            <button
              onClick={onOpenVouchers}
              className="px-2.5 py-1.5 hover:bg-blue-500/20 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Manajemen Voucher & Keamanan Meja Pelanggan"
            >
              <TicketIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Voucher</span>
            </button>
          )}

          {onOpenTableQr && (
            <button
              onClick={onOpenTableQr}
              className="px-2.5 py-1.5 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Cetak atau Tampilkan QR Code Meja Pelanggan"
            >
              <span>🪑</span>
              <span className="hidden md:inline">QR Meja</span>
            </button>
          )}
        </div>

        {/* KLUSTER 3: 📺 Layar Proyektor & Running Text */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700/70 shadow-sm">
          {onOpenRunningText && (
            <button
              onClick={onOpenRunningText}
              className="px-2.5 py-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Atur Pesan Running Text Layar Proyektor"
            >
              <MegaphoneIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Running Text</span>
            </button>
          )}

          {onOpenQrShare && (
            <button
              onClick={onOpenQrShare}
              className="px-2.5 py-1.5 hover:bg-blue-600/30 text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Tampilkan QR Code untuk scan dari Smart TV atau Browser Lain"
            >
              <QrCodeIcon className="w-3.5 h-3.5" />
            </button>
          )}

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
        </div>

        {/* KLUSTER 4: ⚙️ Pengaturan Kafe & Sistem */}
        <div className="flex items-center gap-1.5">
          {/* Tombol Pengaturan Kafe */}
          {onOpenCafeSettings && (
            <button
              onClick={onOpenCafeSettings}
              className="p-2 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded-xl border border-slate-700/80 text-xs font-semibold transition-all shadow-sm"
              title="Pengaturan Identitas Kafe & Wi-Fi"
            >
              <span>🏪</span>
            </button>
          )}

          {/* Status Cloud Firebase */}
          {onOpenFirebaseConfig && (
            <button
              onClick={onOpenFirebaseConfig}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isCloudConnected
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title={
                isCloudConnected
                  ? 'Tersambung ke Firebase Cloud (Sinkronisasi Realtime Seluruh Meja)'
                  : 'Mode Sinkron Lokal'
              }
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isCloudConnected ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              <SettingsIcon className="w-3.5 h-3.5 opacity-70" />
            </button>
          )}

          {/* Tombol Bantuan WhatsApp AuraCore */}
          {onOpenDeveloperHelp && (
            <button
              onClick={onOpenDeveloperHelp}
              className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Bantuan Teknis & WhatsApp Support AuraCore Labs"
            >
              <span>💬</span>
            </button>
          )}

          {/* Tombol Ganti Password */}
          {onChangePassword && (
            <button
              onClick={onChangePassword}
              className="p-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Ganti Password Login Operator"
            >
              🔑
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
