import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useKaraoke } from '../../hooks/useKaraoke';
import { AppRole, TableOrder } from '../../types';
import { DeveloperFooter } from '../common/DeveloperFooter';
import { KitchenOrderCard } from './KitchenOrderCard';
import { PosDirectOrderModal } from '../pos/PosDirectOrderModal';

interface KitchenScreenProps {
  setRole?: (role: AppRole) => void;
}

export const KitchenScreen: React.FC<KitchenScreenProps> = ({ setRole }) => {
  const {
    tableOrders,
    tables,
    menuItems,
    cafeSettings,
    isCloudConnected,
    confirmTableOrder,
    updateTableOrderStatus,
    createTableOrder,
    triggerSoundEffect,
  } = useKaraoke();

  const [isDirectOrderOpen, setIsDirectOrderOpen] = useState(false);

  // Jam Digital Berjalan
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // State Filter Meja & Jenis Pesanan
  const [filterTable, setFilterTable] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'ONLINE'>('ALL');
  const [isSoundAlertEnabled, setIsSoundAlertEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Bel Notifikasi Suara saat pesanan baru masuk
  const ordersList: TableOrder[] = useMemo(() => {
    return Object.values(tableOrders || {}).sort((a, b) => a.createdAt - b.createdAt); // FIFO untuk koki
  }, [tableOrders]);

  const pendingOrders = ordersList.filter((o) => o.status?.toLowerCase() === 'pending');
  const pendingOrdersCount = pendingOrders.length;
  const prevPendingRef = useRef<number>(pendingOrdersCount);

  useEffect(() => {
    if (pendingOrdersCount > prevPendingRef.current && isSoundAlertEnabled) {
      try {
        triggerSoundEffect('chime');
      } catch {}
    }
    prevPendingRef.current = pendingOrdersCount;
  }, [pendingOrdersCount, isSoundAlertEnabled, triggerSoundEffect]);

  // Fullscreen Handler untuk Smart TV Dapur
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Filter Pesanan
  const filteredOrders = ordersList.filter((o) => {
    if (filterTable !== 'ALL' && o.tableNumber !== filterTable) return false;

    const isTakeaway =
      o.orderType === 'TAKEAWAY' ||
      o.tableNumber?.toUpperCase().includes('BUNGKUS') ||
      o.tableNumber?.toUpperCase().includes('TAKEAWAY');
    const isOnline =
      o.orderType === 'ONLINE_DELIVERY' ||
      o.tableNumber?.toUpperCase().includes('GOFOOD') ||
      o.tableNumber?.toUpperCase().includes('GRAB') ||
      o.tableNumber?.toUpperCase().includes('SHOPEE');

    if (filterType === 'DINE_IN' && (isTakeaway || isOnline)) return false;
    if (filterType === 'TAKEAWAY' && !isTakeaway) return false;
    if (filterType === 'ONLINE' && !isOnline) return false;

    return true;
  });

  // Kelompok 3 Kolom Alur Dapur
  const pendingList = filteredOrders.filter((o) => o.status?.toLowerCase() === 'pending');
  const preparingList = filteredOrders.filter((o) => {
    const s = o.status?.toLowerCase();
    return s === 'confirmed' || s === 'preparing' || s === 'cooking';
  });
  const readyList = filteredOrders.filter((o) => o.status?.toLowerCase() === 'ready');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none selection:bg-amber-500 selection:text-black">
      {/* 1. HEADER KDS KHUSUS DAPUR */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-4 lg:px-6 py-3 sticky top-0 z-30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
            🍳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                {cafeSettings?.name || 'CAFEYOU'}
              </h1>
              <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                LAYAR DAPUR & BARISTA (KDS)
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
                <span className={isCloudConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {isCloudConnected ? 'Cloud Sync Aktif' : 'Mode Lokal'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Kontrol Kanan: Input Pesanan Langsung, Bel Suara, Fullscreen, Navigasi */}
        <div className="flex items-center gap-2">
          {/* Tombol Input Pesanan Manual / Walk-in Dapur */}
          <button
            type="button"
            onClick={() => setIsDirectOrderOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
            title="Input Pesanan Baru Manual (Tamu Langsung Pesan ke Bar / Dapur)"
          >
            <span>➕</span>
            <span className="hidden sm:inline">Input Pesanan Dapur</span>
          </button>

          {/* Toggle Bel Suara */}
          <button
            type="button"
            onClick={() => setIsSoundAlertEnabled(!isSoundAlertEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              isSoundAlertEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
            title="Bunyikan bel saat ada pesanan baru"
          >
            <span>{isSoundAlertEnabled ? '🔔' : '🔕'}</span>
            <span className="hidden sm:inline">{isSoundAlertEnabled ? 'Bel Aktif' : 'Bel Bisu'}</span>
          </button>

          {/* Toggle Layar Penuh (Cocok untuk Smart TV Meja Dapur) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-750 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="Layar Penuh / Smart TV Display"
          >
            <span>{isFullscreen ? '🗗' : '⛶'}</span>
            <span className="hidden sm:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}</span>
          </button>

          {/* Navigasi Beranda / Kasir / Operator */}
          {setRole && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
              <button
                type="button"
                onClick={() => setRole('pos')}
                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-all"
                title="Buka Dasbor Kasir POS"
              >
                💵 Buka POS
              </button>
              <button
                type="button"
                onClick={() => setRole('operator')}
                className="px-2.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all"
                title="Buka Dasbor Operator Karaoke"
              >
                🎤 <span className="hidden xl:inline">Operator</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('landing')}
                className="px-2.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-750 rounded-xl text-xs transition-all"
                title="Kembali ke Beranda"
              >
                🏠
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. SUB-BAR: FILTER MEJA & TIPE PESANAN */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <span>🔍</span> Filter:
          </span>

          {/* Filter Tipe */}
          <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl">
            {[
              { id: 'ALL', label: 'Semua Tiket' },
              { id: 'DINE_IN', label: '🍽️ Meja' },
              { id: 'TAKEAWAY', label: '🥡 Bungkus' },
              { id: 'ONLINE', label: '🛵 Ojol' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === t.id
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter Meja */}
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-medium"
          >
            <option value="ALL">Semua Meja</option>
            {(tables || []).map((tbl) => (
              <option key={tbl} value={tbl}>
                {tbl}
              </option>
            ))}
          </select>
        </div>

        {/* Ringkasan Tiket */}
        <div className="flex items-center gap-3 text-xs font-bold font-mono">
          <span className="text-amber-400">⏳ {pendingList.length} Menunggu</span>
          <span className="text-blue-400">🍳 {preparingList.length} Dimasak</span>
          <span className="text-purple-400">✅ {readyList.length} Siap</span>
        </div>
      </div>

      {/* 3. TIGA KOLOM KANBAN KDS */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* KOLOM 1: PESANAN MASUK (PENDING) */}
        <div className="bg-slate-900/60 border border-amber-500/30 rounded-3xl p-4 flex flex-col h-full shadow-lg">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-amber-500/20 shrink-0">
            <h2 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>⏳</span>
              <span>1. Menunggu Konfirmasi</span>
            </h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-black px-2.5 py-0.5 rounded-full font-mono">
              {pendingList.length} Tiket
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {pendingList.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span className="text-3xl mb-1 opacity-50">✨</span>
                <span>Belum ada pesanan baru masuk</span>
              </div>
            ) : (
              pendingList.map((ord) => (
                <KitchenOrderCard
                  key={ord.id}
                  order={ord}
                  statusColumn="PENDING"
                  onConfirmOrder={confirmTableOrder}
                  onUpdateStatus={updateTableOrderStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* KOLOM 2: SEDANG DIMASAK (PREPARING) */}
        <div className="bg-slate-900/60 border border-blue-500/30 rounded-3xl p-4 flex flex-col h-full shadow-lg">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-blue-500/20 shrink-0">
            <h2 className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🍳</span>
              <span>2. Sedang Dimasak</span>
            </h2>
            <span className="text-xs bg-blue-500/20 text-blue-300 font-black px-2.5 py-0.5 rounded-full font-mono">
              {preparingList.length} Tiket
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {preparingList.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span className="text-3xl mb-1 opacity-50">👨‍🍳</span>
                <span>Tidak ada masakan yang sedang diproses</span>
              </div>
            ) : (
              preparingList.map((ord) => (
                <KitchenOrderCard
                  key={ord.id}
                  order={ord}
                  statusColumn="PREPARING"
                  onConfirmOrder={confirmTableOrder}
                  onUpdateStatus={updateTableOrderStatus}
                />
              ))
            )}
          </div>
        </div>

        {/* KOLOM 3: SIAP DISAJIKAN (READY) */}
        <div className="bg-slate-900/60 border border-purple-500/30 rounded-3xl p-4 flex flex-col h-full shadow-lg">
          <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-purple-500/20 shrink-0">
            <h2 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🍽️</span>
              <span>3. Siap Disajikan</span>
            </h2>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-black px-2.5 py-0.5 rounded-full font-mono">
              {readyList.length} Tiket
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {readyList.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <span className="text-3xl mb-1 opacity-50">🍱</span>
                <span>Semua pesanan telah diantar</span>
              </div>
            ) : (
              readyList.map((ord) => (
                <KitchenOrderCard
                  key={ord.id}
                  order={ord}
                  statusColumn="READY"
                  onConfirmOrder={confirmTableOrder}
                  onUpdateStatus={updateTableOrderStatus}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal Input Pesanan Langsung di Dapur (Walk-in / Barista Counter) */}
      <PosDirectOrderModal
        isOpen={isDirectOrderOpen}
        onClose={() => setIsDirectOrderOpen(false)}
        menuItems={menuItems || {}}
        tables={tables || []}
        cafeSettings={cafeSettings}
        onCreateOrder={createTableOrder}
        existingOrdersCount={ordersList.length}
      />

      {/* Footer Branding */}
      <DeveloperFooter className="w-full border-t border-slate-900 bg-slate-950/80" />
    </div>
  );
};
