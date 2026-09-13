import React from 'react';
import { TableOrder, OrderStatus } from '../../types';

export interface PosKitchenTabProps {
  activeOrders: TableOrder[];
  tables?: string[];
  kdsFilterTable: string;
  setKdsFilterTable: (table: string) => void;
  formatRupiah: (amount: number) => string;
  renderOrderBadge: (ord: TableOrder) => React.ReactNode;
  onConfirmOrder: (orderId: string) => void;
  onUpdateStatus: (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: any,
    cancelReason?: string
  ) => void;
  onOpenPaymentFromKds: (tableNumber: string, order: TableOrder) => void;
}

export const PosKitchenTab: React.FC<PosKitchenTabProps> = ({
  activeOrders,
  tables,
  kdsFilterTable,
  setKdsFilterTable,
  formatRupiah,
  renderOrderBadge,
  onConfirmOrder,
  onUpdateStatus,
  onOpenPaymentFromKds,
}) => {
  return (
    <div className="space-y-6">
      {/* Header KDS & Filter Meja */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>🍳</span>
            <span>Kitchen Display System (KDS) — Layar Dapur & Barista</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pesanan masuk wajib dikonfirmasi terlebih dahulu sebelum diteruskan ke proses memasak.
          </p>
        </div>

        {/* Filter Nomor Meja */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Filter Meja:</span>
          <select
            value={kdsFilterTable}
            onChange={(e) => setKdsFilterTable(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500"
          >
            <option value="ALL">Semua Meja</option>
            {(tables || []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Kolom Kanban Alur Dapur */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KOLOM 1: PESANAN MASUK (PENDING) */}
        <div className="bg-slate-900/70 border border-amber-500/30 rounded-3xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-amber-500/20">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>⏳</span>
              <span>1. Menunggu Konfirmasi</span>
            </h3>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full">
              {
                activeOrders.filter(
                  (o) =>
                    o.status?.toLowerCase() === 'pending' &&
                    (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                ).length
              }
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {activeOrders
              .filter(
                (o) =>
                  o.status?.toLowerCase() === 'pending' &&
                  (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
              )
              .map((ord) => (
                <div
                  key={ord.id}
                  className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{ord.tableNumber}</span>
                        {renderOrderBadge(ord)}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {ord.customerName} •{' '}
                        {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {formatRupiah(ord.totalAmount)}
                    </span>
                  </div>

                  {/* List Items */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-slate-200">
                            {it.quantity ?? it.qty ?? 1}x {it.name}
                          </span>
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
                          {it.notes && (
                            <span className="block text-amber-400 text-[10px]">
                              Catatan: {it.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tombol Konfirmasi (Anti Pesanan Fiktif) */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onConfirmOrder(ord.id)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      ✅ Konfirmasi & Masak ➔
                    </button>
                    <button
                      onClick={() =>
                        onUpdateStatus(
                          ord.id,
                          'CANCELLED',
                          undefined,
                          'Dibatalkan oleh Kasir'
                        )
                      }
                      className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all"
                      title="Tolak Pesanan"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* KOLOM 2: SEDANG DIMASAK (PREPARING) */}
        <div className="bg-slate-900/70 border border-blue-500/30 rounded-3xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-blue-500/20">
            <h3 className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🍳</span>
              <span>2. Sedang Dimasak</span>
            </h3>
            <span className="text-xs bg-blue-500/20 text-blue-300 font-black px-2 py-0.5 rounded-full">
              {
                activeOrders.filter((o) => {
                  const s = o.status?.toLowerCase();
                  return (
                    (s === 'confirmed' || s === 'preparing' || s === 'cooking') &&
                    (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                  );
                }).length
              }
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {activeOrders
              .filter((o) => {
                const s = o.status?.toLowerCase();
                return (
                  (s === 'confirmed' || s === 'preparing' || s === 'cooking') &&
                  (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                );
              })
              .map((ord) => (
                <div
                  key={ord.id}
                  className="bg-slate-950/80 border border-blue-500/40 rounded-2xl p-4 space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{ord.tableNumber}</span>
                        {renderOrderBadge(ord)}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {ord.customerName} •{' '}
                        {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-300">
                      {formatRupiah(ord.totalAmount)}
                    </span>
                  </div>

                  {/* List Items */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-slate-200">
                            {it.quantity ?? it.qty ?? 1}x {it.name}
                          </span>
                          {it.selectedOptions && it.selectedOptions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {it.selectedOptions.map((opt, oIdx) => (
                                <span
                                  key={oIdx}
                                  className="text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1 py-0.2 rounded font-medium"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                          {it.notes && (
                            <span className="block text-amber-400 text-[10px]">
                              Catatan: {it.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tombol Siap Saji */}
                  <button
                    onClick={() => onUpdateStatus(ord.id, 'READY')}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                  >
                    🍽️ Makanan Siap Disajikan ➔
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* KOLOM 3: SIAP DISAJIKAN / SELESAI */}
        <div className="bg-slate-900/70 border border-purple-500/30 rounded-3xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-purple-500/20">
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>🍽️</span>
              <span>3. Siap Disajikan</span>
            </h3>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-black px-2 py-0.5 rounded-full">
              {
                activeOrders.filter((o) => {
                  const s = o.status?.toLowerCase();
                  return (
                    (s === 'ready' || s === 'served') &&
                    (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                  );
                }).length
              }
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {activeOrders
              .filter((o) => {
                const s = o.status?.toLowerCase();
                return (
                  (s === 'ready' || s === 'served') &&
                  (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                );
              })
              .map((ord) => (
                <div
                  key={ord.id}
                  className="bg-slate-950/80 border border-purple-500/40 rounded-2xl p-4 space-y-3 shadow-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white">{ord.tableNumber}</span>
                        {renderOrderBadge(ord)}
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {ord.customerName} •{' '}
                        {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {formatRupiah(ord.totalAmount)}
                    </span>
                  </div>

                  {/* List Items */}
                  <div className="bg-slate-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-slate-200">
                            {it.quantity ?? it.qty ?? 1}x {it.name}
                          </span>
                          {it.selectedOptions && it.selectedOptions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {it.selectedOptions.map((opt, oIdx) => (
                                <span
                                  key={oIdx}
                                  className="text-[9px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1 py-0.2 rounded font-medium"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                          {it.notes && (
                            <span className="block text-amber-400 text-[10px]">
                              Catatan: {it.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tombol Terantar / Siap Bayar */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenPaymentFromKds(ord.tableNumber, ord)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
                    >
                      💵 Bayar di Kasir ➔
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
