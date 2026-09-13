import React from 'react';
import { TableOrder, OrderStatus } from '../../types';

interface KitchenOrderCardProps {
  order: TableOrder;
  statusColumn: 'PENDING' | 'PREPARING' | 'READY';
  onConfirmOrder: (orderId: string) => void;
  onUpdateStatus: (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT',
    cancelReason?: string
  ) => void;
}

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  statusColumn,
  onConfirmOrder,
  onUpdateStatus,
}) => {
  // Format Waktu Berlalu (Elapsed Timer)
  const renderElapsedBadge = (createdAt: number) => {
    const elapsedMinutes = Math.floor((Date.now() - createdAt) / 60000);
    if (elapsedMinutes < 5) {
      return (
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Baru saja ({elapsedMinutes} mnt)
        </span>
      );
    }
    if (elapsedMinutes < 15) {
      return (
        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
          ⏱️ {elapsedMinutes} mnt
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-black text-rose-400 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full animate-pulse">
        🚨 {elapsedMinutes} mnt (Prioritas)
      </span>
    );
  };

  // Lencana Jenis Pesanan (Makan di Meja / Bungkus / Ojol)
  const renderOrderTypeBadge = () => {
    const isTakeaway =
      order.orderType === 'TAKEAWAY' ||
      order.tableNumber?.toUpperCase().includes('BUNGKUS') ||
      order.tableNumber?.toUpperCase().includes('TAKEAWAY');
    const isOnline =
      order.orderType === 'ONLINE_DELIVERY' ||
      order.tableNumber?.toUpperCase().includes('GOFOOD') ||
      order.tableNumber?.toUpperCase().includes('GRAB') ||
      order.tableNumber?.toUpperCase().includes('SHOPEE');

    if (isTakeaway) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 shrink-0">
          🥡 BUNGKUS / TAKEAWAY
        </span>
      );
    }
    if (isOnline) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
          🛵 {order.platform || 'OJOL ONLINE'}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
        🍽️ MAKAN DI MEJA
      </span>
    );
  };

  // Border & Glow styling per kolom
  const cardBorderClass =
    statusColumn === 'PENDING'
      ? 'border-amber-500/40 hover:border-amber-400'
      : statusColumn === 'PREPARING'
      ? 'border-blue-500/40 hover:border-blue-400'
      : 'border-purple-500/40 hover:border-purple-400';

  return (
    <div
      className={`bg-slate-950/80 border ${cardBorderClass} rounded-2xl p-4 space-y-3 shadow-md transition-all`}
    >
      {/* Header Tiket */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-black text-white">{order.tableNumber}</span>
            {renderOrderTypeBadge()}
          </div>
          <span className="text-xs text-slate-400 block mt-0.5">
            Pemesan: <strong className="text-slate-200">{order.customerName}</strong>
          </span>
        </div>
        {renderElapsedBadge(order.createdAt)}
      </div>

      {/* Rincian Menu & Catatan Koki */}
      <div className="bg-slate-900/70 p-3 rounded-xl space-y-2 border border-slate-800">
        {order.items.map((it, idx) => (
          <div key={idx} className="flex justify-between items-start text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                <span
                  className={`font-mono font-black ${
                    statusColumn === 'PENDING'
                      ? 'text-amber-400'
                      : statusColumn === 'PREPARING'
                      ? 'text-blue-400'
                      : 'text-purple-400'
                  }`}
                >
                  {it.quantity ?? it.qty ?? 1}x
                </span>
                <span>{it.name}</span>
              </div>

              {/* Varian Opsi Rasa / Topping */}
              {it.selectedOptions && it.selectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {it.selectedOptions.map((opt, oIdx) => (
                    <span
                      key={oIdx}
                      className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded font-medium"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              )}

              {/* Catatan Khusus Dapur (Contoh: Pedas, Tanpa Bawang, Es Sedikit) */}
              {it.notes && (
                <div className="text-[11px] text-amber-300 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/25">
                  📝 Catatan: {it.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tombol Aksi Sesuai Kolom Kanban */}
      {statusColumn === 'PENDING' && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onConfirmOrder(order.id)}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>🔥</span>
            <span>Mulai Masak ➔</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateStatus(order.id, 'CANCELLED', undefined, 'Ditolak oleh Dapur (Stok Habis)')
            }
            className="px-3 py-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-750 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all"
            title="Tolak Pesanan (Stok Habis)"
          >
            ✕
          </button>
        </div>
      )}

      {statusColumn === 'PREPARING' && (
        <button
          type="button"
          onClick={() => onUpdateStatus(order.id, 'READY')}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>🍽️</span>
          <span>Masakan Selesai / Siap Saji ➔</span>
        </button>
      )}

      {statusColumn === 'READY' && (
        <button
          type="button"
          onClick={() => onUpdateStatus(order.id, 'SERVED')}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>🚀</span>
          <span>Selesai Diantar ke Meja</span>
        </button>
      )}
    </div>
  );
};
