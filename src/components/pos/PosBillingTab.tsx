import React from 'react';
import { TableOrder, OrderStatus } from '../../types';

export interface PosBillingTabProps {
  ordersByTable: Record<string, TableOrder[]>;
  billingSearch: string;
  setBillingSearch: (query: string) => void;
  formatRupiah: (amount: number) => string;
  renderOrderBadge: (ord: TableOrder) => React.ReactNode;
  renderStatusBadge: (status: OrderStatus) => React.ReactNode;
  onOpenPayment: (table: string, orders: TableOrder[]) => void;
  onPrintReceipt: (single?: TableOrder, grouped?: TableOrder[]) => void;
  onOpenMoveTable: (ord: TableOrder) => void;
  onOpenVoidItem: (data: {
    orderId: string;
    itemIndex: number;
    itemName: string;
    reason: string;
  }) => void;
}

export const PosBillingTab: React.FC<PosBillingTabProps> = ({
  ordersByTable,
  billingSearch,
  setBillingSearch,
  formatRupiah,
  renderOrderBadge: _renderOrderBadge,
  renderStatusBadge,
  onOpenPayment,
  onPrintReceipt,
  onOpenMoveTable,
  onOpenVoidItem,
}) => {
  return (
    <div className="space-y-6">
      {/* Header & Filter Search Meja */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>🧾</span>
            <span>Tagihan Meja Berjalan (*Table Billing*)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pesanan berulang dari meja yang sama otomatis diakumulasi dalam satu tagihan kasir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={billingSearch}
            onChange={(e) => setBillingSearch(e.target.value)}
            placeholder="Cari meja atau nama tamu..."
            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-all w-52"
          />
        </div>
      </div>

      {/* Grid Tagihan Meja */}
      {Object.keys(ordersByTable).length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-12 text-center">
          <span className="text-5xl">☕</span>
          <h3 className="text-base font-bold text-white mt-3">Tidak Ada Tagihan Meja Aktif</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Semua pesanan meja telah selesai dibayar atau belum ada tamu yang mengirim pesanan F&B.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(ordersByTable)
            .filter(([table, orders]) => {
              if (!billingSearch.trim()) return true;
              const q = billingSearch.toLowerCase();
              return (
                table.toLowerCase().includes(q) ||
                orders.some((o) => o.customerName?.toLowerCase().includes(q))
              );
            })
            .map(([table, orders]) => {
              const totalTableBill = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
              const oldestCreatedAt = Math.min(...orders.map((o) => o.createdAt));
              const hasPending = orders.some((o) => o.status?.toLowerCase() === 'pending');

              return (
                <div
                  key={table}
                  className={`bg-slate-900/90 rounded-3xl border p-5 flex flex-col justify-between transition-all shadow-xl ${
                    hasPending
                      ? 'border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header Meja */}
                    <div className="flex justify-between items-start mb-3 border-b border-slate-800/80 pb-3">
                      <div>
                        {(() => {
                          const isTakeaway =
                            table.toUpperCase().includes('BUNGKUS') ||
                            table.toUpperCase().includes('TAKEAWAY') ||
                            orders.some((o) => o.orderType === 'TAKEAWAY');
                          const isOnline =
                            table.toUpperCase().includes('GOFOOD') ||
                            table.toUpperCase().includes('GRAB') ||
                            table.toUpperCase().includes('SHOPEE') ||
                            orders.some((o) => o.orderType === 'ONLINE_DELIVERY');
                          const tableIcon = isTakeaway ? '🥡' : isOnline ? '🛵' : '🪑';
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-lg">{tableIcon}</span>
                              <h3 className="text-lg font-black text-white">{table}</h3>
                              {isTakeaway && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  🥡 TAKEAWAY
                                </span>
                              )}
                              {isOnline && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  🛵 ONLINE OJOL
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        <span className="text-[11px] text-slate-400">
                          {orders.length} Pesanan terdaftar •{' '}
                          {new Date(oldestCreatedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400 block">
                          Total Meja:
                        </span>
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          {formatRupiah(totalTableBill)}
                        </span>
                      </div>
                    </div>

                    {/* Rincian Pesanan per-Order */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {orders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-slate-950/70 p-3 rounded-2xl border border-slate-850 space-y-2 text-xs"
                        >
                          <div className="flex justify-between items-center text-slate-400">
                            <span className="font-bold text-slate-200">
                              {ord.customerName || 'Tamu'}
                              <span className="text-[10px] font-normal text-slate-500 ml-1.5 font-mono">
                                #{ord.id.slice(-4)}
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              {renderStatusBadge(ord.status)}
                              {/* Tombol Pindah Meja */}
                              <button
                                onClick={() => onOpenMoveTable(ord)}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-lg transition-colors"
                                title="Pindah Meja"
                              >
                                🔀
                              </button>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="space-y-1 pt-1 border-t border-slate-900">
                            {ord.items.map((it, idx) => {
                              const count = it.quantity ?? it.qty ?? 1;
                              return (
                                <div
                                  key={idx}
                                  className={`flex justify-between items-center ${
                                    it.isVoided
                                      ? 'line-through opacity-40 text-red-400'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  <div className="flex-1 pr-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold">
                                        {count}x {it.name}
                                      </span>
                                      {it.notes && (
                                        <span className="text-amber-400 text-[10px] italic">
                                          ({it.notes})
                                        </span>
                                      )}
                                    </div>
                                    {it.selectedOptions && it.selectedOptions.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-0.5">
                                        {it.selectedOptions.map((opt, oIdx) => (
                                          <span
                                            key={oIdx}
                                            className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-medium"
                                          >
                                            {opt}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 font-mono shrink-0">
                                    <span>{formatRupiah(it.price * count)}</span>
                                    {!it.isVoided && (
                                      <button
                                        onClick={() =>
                                          onOpenVoidItem({
                                            orderId: ord.id,
                                            itemIndex: idx,
                                            itemName: it.name,
                                            reason: 'Stok dapur habis / dibatalkan kasir',
                                          })
                                        }
                                        className="text-[10px] text-red-400 hover:text-red-300 font-bold px-1 rounded hover:bg-red-500/20"
                                        title="Batalkan Item (Void)"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tombol Aksi Meja: Bayar & Cetak Struk */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={() => onOpenPayment(table, orders)}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>💵</span>
                      <span>Proses Bayar Meja</span>
                    </button>

                    {/* Tombol Cetak Fisik Opsional */}
                    <button
                      onClick={() => onPrintReceipt(undefined, orders)}
                      className="px-3 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      title="Cetak Struk Kertas (Opsional)"
                    >
                      <span>🖨️</span>
                      <span className="hidden sm:inline">Struk</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
