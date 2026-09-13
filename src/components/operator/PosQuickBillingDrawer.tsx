import React, { useState, useMemo } from 'react';
import { TableOrder, CafeSettings } from '../../types';
import { formatRupiah, calculateTaxAndService } from '../../utils/billing';
import { ReceiptPrintView } from './ReceiptPrintView';

interface PosQuickBillingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableOrders: Record<string, TableOrder>;
  cafeSettings: CafeSettings;
  onConfirmOrder: (orderId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: any) => void;
  onOpenFullPos?: () => void;
}

export const PosQuickBillingDrawer: React.FC<PosQuickBillingDrawerProps> = ({
  isOpen,
  onClose,
  tableOrders,
  cafeSettings,
  onConfirmOrder,
  onUpdateOrderStatus,
  onOpenFullPos,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [searchTable, setSearchTable] = useState('');
  const [printOrder, setPrintOrder] = useState<TableOrder | null>(null);

  const ordersList = useMemo(() => {
    return Object.values(tableOrders || {}).filter((o) => Boolean(o && o.id));
  }, [tableOrders]);

  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      const matchSearch =
        !searchTable.trim() ||
        (order.tableNumber && order.tableNumber.toLowerCase().includes(searchTable.toLowerCase())) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchTable.toLowerCase()));

      if (!matchSearch) return false;

      const st = order.status?.toLowerCase() || '';
      if (filter === 'pending') {
        return st === 'pending';
      }
      if (filter === 'active') {
        return st !== 'completed' && st !== 'paid' && st !== 'cancelled';
      }
      return true;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [ordersList, filter, searchTable]);

  const pendingCount = useMemo(() => {
    return ordersList.filter((o) => o.status?.toLowerCase() === 'pending').length;
  }, [ordersList]);

  const activeCount = useMemo(() => {
    return ordersList.filter(
      (o) => o.status?.toLowerCase() !== 'completed' && o.status?.toLowerCase() !== 'paid' && o.status?.toLowerCase() !== 'cancelled'
    ).length;
  }, [ordersList]);

  const handlePrint = (order: TableOrder) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-slate-900/95 border-l border-slate-750 shadow-2xl flex flex-col h-full z-10 text-slate-100 animate-slideLeft font-sans">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
              🍽️
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Pesanan & Tagihan Meja</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono">
                  POS RINGKAS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pantau pesanan F&B dan selesaikan tagihan kasir secara instan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFullPos && (
              <button
                type="button"
                onClick={onOpenFullPos}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                title="Buka Dasbor Kasir POS Lengkap di Tab Baru"
              >
                <span>Layar Kasir Penuh</span>
                <span className="text-[10px]">↗</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari nomor meja atau nama tamu..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-750 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            {searchTable && (
              <button
                onClick={() => setSearchTable('')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({ordersList.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Perlu Konfirmasi</span>
              {pendingCount > 0 && (
                <span className="text-[9px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              Belum Lunas ({activeCount})
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const rawTotal = (order.items || []).reduce(
                (sum, it) => sum + (it.price || 0) * (it.quantity || it.qty || 1),
                0
              );
              const { taxAmount, serviceAmount, totalAmount } = calculateTaxAndService(
                rawTotal,
                cafeSettings?.isTaxIncluded || false,
                cafeSettings?.taxPercentage || 0,
                cafeSettings?.servicePercentage || 0,
                false,
                cafeSettings?.enableTax !== false
              );
              const isPending = order.status?.toLowerCase() === 'pending';
              const isCompleted = order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'paid';

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isPending
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
                      : isCompleted
                      ? 'bg-slate-900/50 border-slate-800 opacity-75'
                      : 'bg-slate-900/90 border-slate-750 hover:border-slate-700'
                  }`}
                >
                  {/* Meja & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs rounded-lg font-mono">
                        {order.tableNumber || 'Meja Umum'}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">
                        {order.customerName ? `${order.customerName}` : 'Tamu'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                          : isCompleted
                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                          : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      }`}
                    >
                      {order.status || 'Aktif'}
                    </span>
                  </div>

                  {/* Rincian Item */}
                  <div className="space-y-1.5 py-1 border-y border-slate-800/80 text-xs">
                    {(order.items || []).map((item, idx) => {
                      const qty = item.quantity || item.qty || 1;
                      return (
                        <div key={idx} className="flex justify-between items-center text-slate-300">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-emerald-400 font-mono font-bold">
                              {qty}x
                            </span>
                            <span className="truncate">{item.name}</span>
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <span className="text-[10px] text-slate-500">
                                ({item.selectedOptions.join(', ')})
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-400 shrink-0 ml-2">
                            {formatRupiah((item.price || 0) * qty)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Finansial */}
                  <div className="flex justify-between items-center text-xs pt-0.5">
                    <div className="text-[11px] text-slate-400">
                      {taxAmount > 0 || serviceAmount > 0 ? (
                        <span>Termasuk Pajak/Layanan</span>
                      ) : (
                        <span>Total Tagihan</span>
                      )}
                    </div>
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {formatRupiah(totalAmount)}
                    </div>
                  </div>

                  {/* Aksi Cepat Kasir */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrint(order)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Cetak struk pesanan ini"
                    >
                      <span>🖨️</span>
                      <span>Struk</span>
                    </button>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onConfirmOrder(order.id)}
                        className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <span>✓</span>
                        <span>Konfirmasi</span>
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Tandai pesanan ${order.tableNumber} lunas & selesai?`)) {
                            onUpdateOrderStatus(order.id, 'completed');
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        Tandai Lunas
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <div className="text-3xl">☕</div>
              <p className="text-sm font-bold text-slate-300">Tidak ada pesanan ditemukan</p>
              <p className="text-xs text-slate-500">
                {searchTable ? `Tidak ada data untuk "${searchTable}"` : 'Belum ada pesanan F&B dari meja tamu.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cetak Struk */}
      {printOrder && (
        <ReceiptPrintView
          order={printOrder}
          cafeSettings={cafeSettings}
        />
      )}
    </div>
  );
};
