import React from 'react';
import { PlayerLockInfo } from '../../hooks/usePlayerSessionLock';
import { BackIcon } from '../icons/Icons';

interface PlayerLockedOverlayProps {
  activeLockInfo: PlayerLockInfo | null;
  onTakeOver: () => void;
  onEnableMirror: () => void;
  onBackToHome?: () => void;
}

export const PlayerLockedOverlay: React.FC<PlayerLockedOverlayProps> = ({
  activeLockInfo,
  onTakeOver,
  onEnableMirror,
  onBackToHome,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 text-slate-100 select-none animate-fadeIn">
      <div className="relative max-w-lg w-full bg-slate-900/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center space-y-5">
        {/* Glow Halo */}
        <div className="absolute -top-12 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Status Icon */}
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600/30 to-rose-600/30 border border-amber-500/50 flex items-center justify-center text-4xl shadow-inner shadow-amber-500/20 animate-pulse">
          🔒
        </div>

        {/* Header & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Proteksi Sesi Aktif
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Layar Proyektor Sedang Digunakan
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
            Sistem mendeteksi layar proyektor utama sudah berjalan di perangkat lain. Untuk mencegah lagu terpotong dua kali dan suara bertabrakan, pemutar di layar ini dinonaktifkan sementara.
          </p>
        </div>

        {/* Active Device Info Card */}
        {activeLockInfo && (
          <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-left text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                📺
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Perangkat Utama Aktif
                </div>
                <div className="text-white font-bold truncate">
                  {activeLockInfo.deviceLabel || 'Layar Proyektor'}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
              ONLINE
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onTakeOver}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-600/30 border border-amber-400/40 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡ Ambil Alih Sebagai Layar Utama</span>
          </button>

          <button
            type="button"
            onClick={onEnableMirror}
            className="w-full py-3 px-5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white font-bold text-xs rounded-2xl border border-slate-700 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>👁️ Buka Sebagai Layar Monitor Saja (Mirror)</span>
          </button>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="w-full py-2.5 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BackIcon className="w-3.5 h-3.5" />
              <span>Kembali ke Menu Beranda</span>
            </button>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-[11px] text-slate-400 text-center">
          Mode Mirror hanya menampilkan lirik & video tanpa membunyikan audio atau memotong antrean lagu.
        </div>
      </div>
    </div>
  );
};
