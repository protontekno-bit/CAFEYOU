import React from 'react';
import { CafeSettings } from '../../types';

export type PosTab = 'kitchen' | 'billing' | 'reports' | 'menu';

export interface PosHeaderProps {
  cafeSettings?: CafeSettings;
  currentTime: string;
  isCloudConnected: boolean;
  activeTab: PosTab;
  setActiveTab: (tab: PosTab) => void;
  activeOrdersCount: number;
  pendingOrdersCount: number;
  onOpenDirectOrder: () => void;
  isSoundAlertEnabled: boolean;
  onToggleSoundAlert: () => void;
  onOpenSettings: () => void;
  onOpenOperator?: () => void;
  onLogout: () => void;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  cafeSettings,
  currentTime,
  isCloudConnected,
  activeTab,
  setActiveTab,
  activeOrdersCount,
  pendingOrdersCount,
  onOpenDirectOrder,
  isSoundAlertEnabled,
  onToggleSoundAlert,
  onOpenSettings,
  onOpenOperator,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 px-4 lg:px-6 py-3 sticky top-0 z-30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
      {/* Brand & Jam */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md shadow-amber-500/20 text-white font-black">
          🍽️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-white tracking-tight">
              {cafeSettings?.name || 'CAFEYOU'}
            </h1>
            <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              KASIR & DAPUR (POS)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="font-mono text-amber-400 font-bold">{currentTime}</span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className={isCloudConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isCloudConnected ? 'Cloud Sync Aktif' : 'Lokal'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Tab Navigasi Utama Kasir */}
      <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'billing'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🧾</span>
          <span>Tagihan Meja</span>
          {activeOrdersCount > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'billing'
                  ? 'bg-slate-950 text-amber-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {activeOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('kitchen')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'kitchen'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🍳</span>
          <span>Alur Dapur (KDS)</span>
          {pendingOrdersCount > 0 && (
            <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
              {pendingOrdersCount} Baru
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📊</span>
          <span>Rekap Shift & Omzet</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🍽️</span>
          <span>Katalog & Atur Menu</span>
        </button>
      </div>

      {/* Tombol Kontrol Kanan */}
      <div className="flex items-center gap-2">
        {/* Tombol Buat Pesanan Baru Kasir (Dine-in / Takeaway / Online Ojol) */}
        <button
          onClick={onOpenDirectOrder}
          className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
          title="Buat Pesanan Langsung di Kasir (Makan di Meja, Bawa Pulang, atau Driver Ojol)"
        >
          <span className="text-sm">➕</span>
          <span>Pesanan Kasir</span>
        </button>

        {/* Toggle Suara Bel */}
        <button
          onClick={onToggleSoundAlert}
          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
            isSoundAlertEnabled
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
          title={isSoundAlertEnabled ? 'Suara Bel Pesanan Aktif' : 'Suara Bel Dibisukan'}
        >
          {isSoundAlertEnabled ? '🔔' : '🔕'}
        </button>

        {/* Pengaturan Kasir (PB1, Service, PIN) */}
        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-500/60 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1.5 shadow-sm"
          title="Buka Pengaturan Pajak PB1 & PIN Kasir"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">Pengaturan Kasir</span>
        </button>

        {/* Buka Layar Dapur Mandiri (KDS) di Tab Baru */}
        <button
          onClick={() => {
            const currentUrl = window.location.href.split('#')[0];
            window.open(currentUrl + '#kitchen', '_blank');
          }}
          className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/40 hover:border-orange-500/60 rounded-xl text-xs font-bold text-orange-300 hover:text-orange-200 transition-all flex items-center gap-1.5 shadow-sm"
          title="Buka Layar Dapur Mandiri (KDS) di Tab / Monitor Baru"
        >
          <span>🍳</span>
          <span className="hidden lg:inline">Layar Dapur</span>
          <span className="text-[10px] opacity-75">↗</span>
        </button>

        {/* Navigasi Cepat ke Dasbor Karaoke */}
        {onOpenOperator && (
          <button
            onClick={onOpenOperator}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            title="Buka Layar Operator Karaoke"
          >
            <span>🎤</span>
            <span className="hidden sm:inline">Dasbor Karaoke</span>
          </button>
        )}

        {/* Kunci / Logout */}
        <button
          onClick={onLogout}
          className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all"
          title="Kunci / Keluar dari Sesi Kasir"
        >
          🔒
        </button>
      </div>
    </header>
  );
};
