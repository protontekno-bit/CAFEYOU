import React, { useState, useEffect, useRef } from 'react';
import { Song, TableOrder } from '../../types';
import { playSoundEffect } from '../../utils/soundfx';

interface OperatorAlertsProps {
  queue?: Song[];
  tableOrders?: Record<string, TableOrder>;
  onOpenPosDrawer: () => void;
}

export const OperatorAlerts: React.FC<OperatorAlertsProps> = ({
  queue = [],
  tableOrders = {},
  onOpenPosDrawer,
}) => {
  // 1. Notifikasi Pesanan Lagu Baru dari Meja Tamu
  const [songAlert, setSongAlert] = useState<{
    table: string;
    requester: string;
    title: string;
  } | null>(null);

  const prevQueueLengthRef = useRef<number>(queue.length);
  const lastAlertedSongIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentLen = queue.length;
    if (currentLen > prevQueueLengthRef.current && currentLen > 0) {
      const guestSongs = queue.filter((s) => s && (s.source === 'guest' || s.tableNumber));
      const newestSong = guestSongs.reduce<any>((latest, s) => {
        if (!latest || (s.addedAt || 0) > (latest.addedAt || 0)) return s;
        return latest;
      }, null);

      // Hanya bunyikan lonceng jika lagu ini benar-benar baru masuk (<20 detik) dan belum pernah dibunyikan
      const isRecentlyAdded = newestSong && Date.now() - (newestSong.addedAt || 0) < 20000;
      const isNewAlert = newestSong && newestSong.id !== lastAlertedSongIdRef.current;

      if (isRecentlyAdded && isNewAlert && (newestSong.source === 'guest' || newestSong.tableNumber)) {
        lastAlertedSongIdRef.current = newestSong.id;
        try {
          playSoundEffect('chime');
        } catch {}
        setSongAlert({
          table: newestSong.tableNumber || 'Meja Tamu',
          requester: newestSong.requester || 'Pelanggan',
          title: `Lagu: ${newestSong.title}`,
        });
        setTimeout(() => {
          setSongAlert(null);
        }, 6000);
      }
    }
    prevQueueLengthRef.current = currentLen;
  }, [queue.length]);

  // 2. Jumlah Pesanan F&B Pending
  const pendingOrdersCount = Object.values(tableOrders || {}).filter(
    (o) => o && o.status?.toLowerCase() === 'pending'
  ).length;
  const prevPendingCountRef = useRef<number>(pendingOrdersCount);

  useEffect(() => {
    if (pendingOrdersCount > prevPendingCountRef.current) {
      try {
        playSoundEffect('chime');
      } catch {}
    }
    prevPendingCountRef.current = pendingOrdersCount;
  }, [pendingOrdersCount]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 space-y-2 select-none">
      {/* Alert Lagu Baru Masuk */}
      {songAlert && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-600/95 via-emerald-700 to-teal-800 border border-emerald-400/50 rounded-2xl shadow-xl flex items-center justify-between text-white animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0">🔔</span>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-200">
                Pesanan Lagu Baru Masuk dari {songAlert.table}!
              </div>
              <div className="text-sm font-extrabold text-white truncate">
                {songAlert.title} <span className="text-xs font-normal text-emerald-100">(oleh {songAlert.requester})</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSongAlert(null)}
            className="px-3 py-1 bg-black/30 hover:bg-black/50 text-xs font-bold rounded-xl transition-all shrink-0 ml-3 cursor-pointer"
          >
            Tutup ✕
          </button>
        </div>
      )}

      {/* Persistent Banner Pesanan F&B Masuk (Tidak hilang sebelum ditinjau) */}
      {pendingOrdersCount > 0 && (
        <div className="p-3 bg-gradient-to-r from-amber-600/90 via-orange-600 to-rose-700 border border-amber-400/50 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-white animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg animate-bounce shrink-0">
              🍽️
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-100 flex items-center gap-2">
                <span>Perlu Tindakan Kasir / Dapur</span>
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.2 rounded-full shadow-sm">
                  {pendingOrdersCount} Pesanan Baru
                </span>
              </div>
              <div className="text-xs text-white/90">
                Ada pesanan makanan/minuman dari smartphone tamu yang menunggu konfirmasi.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPosDrawer}
            className="px-3.5 py-1.5 bg-white text-slate-950 hover:bg-amber-100 text-xs font-black rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Tinjau Pesanan</span>
            <span className="text-xs">→</span>
          </button>
        </div>
      )}
    </div>
  );
};
