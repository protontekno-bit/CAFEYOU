import React from 'react';
import { TableOrder, OrderStatus, KitchenStationFilter } from '../../types';

interface KitchenOrderCardProps {
  order: TableOrder;
  statusColumn: 'PENDING' | 'PREPARING' | 'READY';
  stationFilter?: KitchenStationFilter;
  onConfirmOrder: (orderId: string) => void;
  onUpdateStatus: (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT',
    cancelReason?: string
  ) => void;
  onToggleItemStatus: (
    orderId: string,
    itemIndex: number,
    field: 'isCooked' | 'isServed'
  ) => void;
  onVoidItem: (orderId: string, itemIndex: number, reason: string) => void;
}

export const isDrinkItem = (item: { category?: string; name?: string }): boolean => {
  const cat = (item.category || '').toUpperCase();
  if (
    cat.includes('KOPI') ||
    cat.includes('MINUM') ||
    cat.includes('DRINK') ||
    cat.includes('BEVERAGE') ||
    cat === 'NON_KOPI'
  ) {
    return true;
  }
  const n = (item.name || '').toLowerCase();
  if (
    n.includes('kopi') ||
    n.includes('tea') ||
    n.includes('teh') ||
    n.includes('jus') ||
    n.includes('juice') ||
    n.includes('latte') ||
    n.includes('boba') ||
    n.includes('mocktail') ||
    n.includes('squash') ||
    n.includes('es ') ||
    n.includes('ice ') ||
    n.includes('susu') ||
    n.includes('matcha') ||
    n.includes('taro')
  ) {
    return true;
  }
  return false;
};

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  statusColumn,
  stationFilter = 'ALL',
  onConfirmOrder,
  onUpdateStatus,
  onToggleItemStatus,
  onVoidItem,
}) => {
  // Format Waktu Berlalu (Elapsed Timer)
  const renderElapsedBadge = (createdAt: number) => {
    const elapsedMinutes = Math.floor((Date.now() - createdAt) / 60000);
    if (elapsedMinutes < 5) {
      return (
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Baru ({elapsedMinutes} mnt)
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
        🚨 {elapsedMinutes} mnt
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
          🥡 BUNGKUS
        </span>
      );
    }
    if (isOnline) {
      return (
        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
          🛵 {order.platform || 'OJOL'}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
        🍽️ MEJA
      </span>
    );
  };

  // Border styling
  const cardBorderClass =
    statusColumn === 'PENDING'
      ? 'border-amber-500/40 hover:border-amber-400'
      : statusColumn === 'PREPARING'
      ? 'border-blue-500/40 hover:border-blue-400'
      : 'border-purple-500/40 hover:border-purple-400';

  // Hitung progres item matang & disajikan
  const nonVoidItems = order.items.filter((it) => !it.isVoided);
  const cookedCount = nonVoidItems.filter((it) => it.isCooked).length;
  const servedCount = nonVoidItems.filter((it) => it.isServed).length;

  const handleVoidClick = (idx: number, itemName: string) => {
    const reason = window.prompt(
      `Alasan stok menu "${itemName}" habis/dibatalkan:`,
      'Bahan baku habis di dapur'
    );
    if (reason !== null && reason.trim().length > 0) {
      onVoidItem(order.id, idx, reason.trim());
    }
  };

  return (
    <div
      className={`bg-slate-950/85 border ${cardBorderClass} rounded-2xl p-4 space-y-3 shadow-md transition-all`}
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
        <div className="flex flex-col items-end gap-1">
          {renderElapsedBadge(order.createdAt)}
          {nonVoidItems.length > 0 && statusColumn !== 'PENDING' && (
            <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-750 px-2 py-0.2 rounded-md text-slate-300">
              {statusColumn === 'PREPARING'
                ? `🍳 ${cookedCount}/${nonVoidItems.length}`
                : `✅ ${servedCount}/${nonVoidItems.length}`}
            </span>
          )}
        </div>
      </div>

      {/* Rincian Menu dengan Progres per-Item */}
      <div className="bg-slate-900/70 p-3 rounded-xl space-y-2.5 border border-slate-800">
        {order.items.map((it, idx) => {
          const isDrink = isDrinkItem(it);
          const isStationMatch =
            stationFilter === 'ALL' ||
            (stationFilter === 'BAR' && isDrink) ||
            (stationFilter === 'KITCHEN' && !isDrink);

          return (
            <div
              key={idx}
              className={`p-2 rounded-xl transition-all border ${
                it.isVoided
                  ? 'bg-red-950/20 border-red-500/20 opacity-60'
                  : isStationMatch
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-950/30 border-slate-850 opacity-40'
              }`}
            >
              <div className="flex justify-between items-start gap-2 text-xs">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-mono font-black ${
                        it.isVoided
                          ? 'text-slate-500'
                          : statusColumn === 'PENDING'
                          ? 'text-amber-400'
                          : statusColumn === 'PREPARING'
                          ? 'text-blue-400'
                          : 'text-purple-400'
                      }`}
                    >
                      {it.quantity ?? it.qty ?? 1}x
                    </span>
                    <span className={it.isVoided ? 'line-through text-slate-400' : 'text-white'}>
                      {it.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                        isDrink
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isDrink ? '☕ Bar' : '🍳 Dapur'}
                    </span>
                  </div>

                  {/* Varian Opsi */}
                  {it.selectedOptions && it.selectedOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {it.selectedOptions.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className="text-[9px] bg-slate-800 text-slate-300 border border-slate-750 px-1.5 py-0.2 rounded font-medium"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Catatan Khusus */}
                  {it.notes && (
                    <div className="text-[11px] text-amber-300 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/25">
                      📝 {it.notes}
                    </div>
                  )}

                  {/* Keterangan Void / Stok Habis */}
                  {it.isVoided && (
                    <div className="text-[10px] text-red-400 font-semibold italic">
                      🚫 Dibatalkan: {it.voidReason || 'Stok habis'}
                    </div>
                  )}
                </div>

                {/* Kontrol Cepat Per-Item (Centang Selesai / Void) */}
                {!it.isVoided && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Tombol Void / Stok Habis saat status PENDING atau PREPARING */}
                    {statusColumn !== 'READY' && (
                      <button
                        type="button"
                        onClick={() => handleVoidClick(idx, it.name)}
                        className="px-2 py-1 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-lg text-[10px] font-bold border border-slate-700 hover:border-red-500/30 transition-all"
                        title="Tandai menu ini habis (Kurangi dari tagihan kasir)"
                      >
                        ✕ Habis
                      </button>
                    )}

                    {/* Tombol Centang Matang / Siap Saji (Item Level Cooked) */}
                    {statusColumn === 'PREPARING' && (
                      <button
                        type="button"
                        onClick={() => onToggleItemStatus(order.id, idx, 'isCooked')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                          it.isCooked
                            ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                        }`}
                        title={it.isCooked ? 'Batalkan status matang' : 'Tandai menu ini sudah matang/siap'}
                      >
                        <span>{it.isCooked ? '✓' : '🍳'}</span>
                        <span>{it.isCooked ? 'Siap' : 'Masak'}</span>
                      </button>
                    )}

                    {/* Tombol Centang Sudah Diantar ke Meja (Item Level Served) */}
                    {statusColumn === 'READY' && (
                      <button
                        type="button"
                        onClick={() => onToggleItemStatus(order.id, idx, 'isServed')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                          it.isServed
                            ? 'bg-purple-500 text-white shadow-sm font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                        }`}
                        title={it.isServed ? 'Batalkan status antar' : 'Tandai menu ini sudah diantar ke meja tamu'}
                      >
                        <span>{it.isServed ? '✓' : '🚀'}</span>
                        <span>{it.isServed ? 'Terantar' : 'Antar'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol Aksi Global Sesuai Kolom Kanban */}
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
              onUpdateStatus(order.id, 'CANCELLED', undefined, 'Ditolak seluruhnya oleh Dapur')
            }
            className="px-3 py-3 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-750 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all"
            title="Tolak Seluruh Tiket Pesanan"
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
          <span>
            {cookedCount === nonVoidItems.length
              ? 'Semua Siap Saji ➔'
              : 'Tandai Seluruhnya Siap Saji ➔'}
          </span>
        </button>
      )}

      {statusColumn === 'READY' && (
        <button
          type="button"
          onClick={() => onUpdateStatus(order.id, 'SERVED')}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span>🚀</span>
          <span>Selesai Seluruhnya Diantar ke Meja</span>
        </button>
      )}
    </div>
  );
};
