import React from 'react';
import {
  BackIcon,
  SparklesIcon,
  MegaphoneIcon,
  ExternalLinkIcon,
  QrCodeIcon,
  SettingsIcon,
  HistoryIcon,
  TicketIcon,
} from '../icons/Icons';

interface HeaderProps {
  title: string;
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
}

export const Header: React.FC<HeaderProps> = ({
  title,
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
}) => {
  return (
    <header className="bg-slate-800/90 backdrop-blur-md p-3 sm:p-4 shadow-lg flex flex-wrap justify-between items-center sticky top-0 z-20 border-b border-slate-700/60 gap-3">
      {/* Kiri: Navigasi & Judul */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white"
            title="Kembali ke Menu Utama"
          >
            <BackIcon className="w-5 h-5" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎤</span>
            <h1 className="text-base sm:text-xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Tengah / Kanan: Aksi Cepat Operasional */}
      <div className="flex flex-wrap items-center gap-2">
        {onOpenPopularSongs && (
          <button
            onClick={onOpenPopularSongs}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Buka Katalog Lagu Populer Kafe"
          >
            <SparklesIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Katalog</span> Populer
          </button>
        )}

        {onOpenVouchers && (
          <button
            onClick={onOpenVouchers}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Manajemen Voucher & Keamanan Meja Pelanggan"
          >
            <TicketIcon className="w-4 h-4 text-blue-400" />
            <span>Voucher</span>
          </button>
        )}

        {onOpenTableQr && (
          <button
            onClick={onOpenTableQr}
            className="px-3 py-1.5 bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/70 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Cetak atau Tampilkan QR Code Meja Pelanggan"
          >
            <span>🪑</span>
            <span className="hidden sm:inline">QR</span> Meja
          </button>
        )}

        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/70 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Buka Riwayat Lagu yang Pernah Diputar"
          >
            <HistoryIcon className="w-4 h-4 text-cyan-400" />
            <span>Riwayat</span>
            {historyCount > 0 && (
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full font-mono border border-cyan-500/30">
                {historyCount}
              </span>
            )}
          </button>
        )}

        {onOpenSoundBoard && (
          <button
            onClick={onOpenSoundBoard}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Buka Soundboard Efek Suara"
          >
            <span>🎛️</span>
            <span className="hidden sm:inline">Sound</span> FX
          </button>
        )}

        {onOpenRunningText && (
          <button
            onClick={onOpenRunningText}
            className="px-3 py-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/60 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Atur Pesan Running Text Layar Proyektor"
          >
            <MegaphoneIcon className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Running Text</span>
          </button>
        )}

        {onOpenQrShare && (
          <button
            onClick={onOpenQrShare}
            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Tampilkan QR Code untuk scan dari HP / Smart TV"
          >
            <QrCodeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">QR</span> Share
          </button>
        )}

        {onOpenProjectorTab && (
          <button
            onClick={onOpenProjectorTab}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Buka Layar Proyektor di Tab/Window Baru"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            <span className="hidden lg:inline">Proyektor</span>
          </button>
        )}

        {/* Status Koneksi Firebase / Local & Settings */}
        {onOpenFirebaseConfig && (
          <button
            onClick={onOpenFirebaseConfig}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              isCloudConnected
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                : 'bg-slate-700/60 border-slate-600/60 text-slate-300 hover:bg-slate-700'
            }`}
            title="Klik untuk membuka Pengaturan Firebase Database"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isCloudConnected ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span>{isCloudConnected ? '🔥 Firebase Cloud' : '💻 Sinkron Lokal'}</span>
            <SettingsIcon className="w-3.5 h-3.5 opacity-70" />
          </button>
        )}
      </div>
    </header>
  );
};
