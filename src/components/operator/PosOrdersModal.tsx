import React, { useState } from 'react';
import { TableOrder, OrderStatus, CafeSettings } from '../../types';
import { ReceiptPrintView } from './ReceiptPrintView';

interface PosOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableOrders: Record<string, TableOrder>;
  cafeSettings: CafeSettings;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT',
    cancelReason?: string
  ) => Promise<void> | void;
  onClearFinishedOrders: () => Promise<void> | void;
}

type TabType = 'table_billing' | 'kitchen' | 'history';

export const PosOrdersModal: React.FC<PosOrdersModalProps> = ({
  isOpen,
  onClose,
  tableOrders,
  cafeSettings,
  onUpdateOrderStatus,
  onClearFinishedOrders,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('table_billing');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'pending' | 'cooking' | 'served'>('ALL');
  
  // Payment Modal State
  const [payingTable, setPayingTable] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<TableOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer' | 'debit'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);

  // Printing State
  const [printOrder, setPrintOrder] = useState<TableOrder | null>(null);
  const [printGroupedOrders, setPrintGroupedOrders] = useState<TableOrder[] | undefined>(undefined);

  if (!isOpen) return null;

  const ordersList: TableOrder[] = Object.values(tableOrders || {}).sort((a, b) => b.createdAt - a.createdAt);

  const activeOrders = ordersList.filter(o => {
    const s = o.status?.toLowerCase();
    return s !== 'paid' && s !== 'cancelled';
  });
  const historyOrders = ordersList.filter(o => {
    const s = o.status?.toLowerCase();
    return s === 'paid' || s === 'cancelled';
  });

  // Group active orders by tableNumber
  const ordersByTable = activeOrders.reduce<Record<string, TableOrder[]>>((acc, order) => {
    const table = order.tableNumber || 'Tanpa Meja';
    if (!acc[table]) acc[table] = [];
    acc[table].push(order);
    return acc;
  }, {});

  const formatRupiah = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
  };

  const getStatusBadge = (status: OrderStatus) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse font-medium">Pesanan Baru</span>;
      case 'cooking':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">Sedang Dimasak</span>;
      case 'served':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium">Tersaji</span>;
      case 'paid':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">Lunas</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">Dibatalkan</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-750 text-slate-400">{status}</span>;
    }
  };

  // Trigger Print
  const handlePrintReceipt = (singleOrder?: TableOrder, grouped?: TableOrder[]) => {
    if (singleOrder) {
      setPrintOrder(singleOrder);
      setPrintGroupedOrders(undefined);
    } else if (grouped) {
      setPrintOrder(null);
      setPrintGroupedOrders(grouped);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Open Payment Modal for Table
  const handleOpenTablePayment = (table: string, orders: TableOrder[]) => {
    setPayingTable(table);
    setPayingOrder(null);
    const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    setCashReceived(total);
    setPaymentMethod('cash');
  };

  // Open Payment Modal for Single Order
  const handleOpenSinglePayment = (order: TableOrder) => {
    setPayingOrder(order);
    setPayingTable(null);
    setCashReceived(order.totalAmount);
    setPaymentMethod('cash');
  };

  // Confirm Payment
  const handleConfirmPayment = async () => {
    if (payingOrder) {
      await onUpdateOrderStatus(payingOrder.id, 'paid', paymentMethod);
      handlePrintReceipt(payingOrder);
    } else if (payingTable) {
      const orders = ordersByTable[payingTable] || [];
      for (const ord of orders) {
        await onUpdateOrderStatus(ord.id, 'paid', paymentMethod);
      }
      handlePrintReceipt(undefined, orders);
    }
    setPayingOrder(null);
    setPayingTable(null);
  };

  // Compute Total Bill for Table Payment Modal
  const currentPayTotal = payingOrder 
    ? payingOrder.totalAmount 
    : (payingTable ? (ordersByTable[payingTable] || []).reduce((sum, o) => sum + o.totalAmount, 0) : 0);

  const kembalian = Math.max(0, cashReceived - currentPayTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Hidden Thermal Receipt Print Target */}
      <ReceiptPrintView
        cafeSettings={cafeSettings}
        order={printOrder}
        groupedOrders={printGroupedOrders}
      />

      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Kasir & POS Kafe (F&B)
                {activeOrders.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-amber-500 text-slate-950 font-black rounded-full animate-pulse">
                    {activeOrders.length} Aktif
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Kelola pemesanan menu tamu meja, dapur, dan cetak struk kasir</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('table_billing')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'table_billing'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋</span> Tagihan Meja ({Object.keys(ordersByTable).length})
          </button>
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'kitchen'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🍳</span> Dapur & Status Pesanan ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📜</span> Riwayat & Laporan ({historyOrders.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
          {/* TAB 1: TAGIHAN PER MEJA */}
          {activeTab === 'table_billing' && (
            <div className="space-y-4">
              {Object.keys(ordersByTable).length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="text-4xl mb-3">☕</div>
                  <p className="text-sm font-medium">Belum ada pesanan aktif dari meja manapun.</p>
                  <p className="text-xs text-slate-600 mt-1">Pesanan yang dibuat oleh tamu akan otomatis muncul di sini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(ordersByTable).map(([table, orders]) => {
                    const tableTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
                    const customerName = orders[0]?.customerName || 'Tamu';
                    const hasPending = orders.some(o => o.status?.toLowerCase() === 'pending');

                    return (
                      <div
                        key={table}
                        className={`bg-slate-800/80 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                          hasPending ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-slate-700'
                        }`}
                      >
                        <div>
                          {/* Header Card Meja */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
                            <div>
                              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Meja</span>
                              <h3 className="text-xl font-black text-white">{table}</h3>
                              <p className="text-xs text-slate-400 truncate max-w-[150px]">👤 {customerName}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-slate-400">{orders.length} order</span>
                              <div className="text-sm font-bold text-emerald-400 mt-0.5">
                                {formatRupiah(tableTotal)}
                              </div>
                            </div>
                          </div>

                          {/* Order Items Summary */}
                          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                            {orders.map((ord, idx) => (
                              <div key={ord.id} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-slate-400 font-mono">#{ord.id.slice(-4).toUpperCase()}</span>
                                  {getStatusBadge(ord.status)}
                                </div>
                                <div className="space-y-1">
                                  {ord.items.map((it, itIdx) => {
                                    const qty = it.quantity ?? it.qty ?? 1;
                                    return (
                                      <div key={itIdx} className="flex justify-between text-slate-300">
                                        <span>{qty}x {it.name}</span>
                                        <span className="text-slate-400">{formatRupiah(it.price * qty)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-slate-700/60">
                          <button
                            onClick={() => handleOpenTablePayment(table, orders)}
                            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>💰</span> Bayar Tagihan Meja ({formatRupiah(tableTotal)})
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePrintReceipt(undefined, orders)}
                              className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <span>🖨️</span> Cetak Tagihan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAPUR & STATUS PESANAN */}
          {activeTab === 'kitchen' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['ALL', 'pending', 'cooking', 'served'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterStatus === st
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'Semua' : st === 'pending' ? 'Pesanan Baru' : st === 'cooking' ? 'Sedang Dimasak' : 'Tersaji'}
                  </button>
                ))}
              </div>

              {activeOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <div className="text-4xl mb-3">🍳</div>
                  <p className="text-sm font-medium">Semua pesanan telah selesai disajikan!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrders
                    .filter(o => filterStatus === 'ALL' || o.status?.toLowerCase() === filterStatus)
                    .map(order => {
                      const stLower = order.status?.toLowerCase();
                      return (
                      <div
                        key={order.id}
                        className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-black">
                              Meja {order.tableNumber}
                            </span>
                            <span className="text-xs font-semibold text-white">👤 {order.customerName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                            {getStatusBadge(order.status)}
                          </div>

                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            {order.items.map((item, idx) => {
                              const qty = item.quantity ?? item.qty ?? 1;
                              return (
                                <div key={idx} className="flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-bold text-white">{qty}x</span>{' '}
                                    <span className="text-slate-200">{item.name}</span>
                                    {item.notes && <span className="ml-2 text-amber-400 italic text-[11px]">({item.notes})</span>}
                                  </div>
                                  <span className="text-slate-400 font-mono">{formatRupiah(item.price * qty)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Status Transition Buttons */}
                        <div className="flex flex-wrap md:flex-col items-end gap-2 justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400">Total Order</span>
                            <div className="text-sm font-bold text-emerald-400">{formatRupiah(order.totalAmount)}</div>
                          </div>

                          <div className="flex gap-1.5">
                            {stLower === 'pending' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'cooking')}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                👨‍🍳 Masak
                              </button>
                            )}
                            {stLower === 'cooking' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'served')}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                🍽️ Sajikan
                              </button>
                            )}
                            {stLower === 'served' && (
                              <button
                                onClick={() => handleOpenSinglePayment(order)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                💰 Kasir / Bayar
                              </button>
                            )}

                            <button
                              onClick={() => handlePrintReceipt(order)}
                              title="Cetak Tiket Dapur / Struk"
                              className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors"
                            >
                              🖨️
                            </button>

                            <button
                              onClick={() => {
                                const reason = prompt('Alasan pembatalan pesanan ini:', 'Tamu membatalkan');
                                if (reason !== null) {
                                  onUpdateOrderStatus(order.id, 'cancelled', undefined, reason);
                                }
                              }}
                              title="Batalkan Pesanan"
                              className="px-2.5 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RIWAYAT & LAPORAN TRANSAKSI */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400">Total Transaksi Lunas</span>
                  <div className="text-xl font-black text-emerald-400">
                    {historyOrders.filter(o => o.status?.toLowerCase() === 'paid').length} Pesanan
                  </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400">Pendapatan Terbayar</span>
                  <div className="text-xl font-black text-amber-400">
                    {formatRupiah(
                      historyOrders
                        .filter(o => o.status?.toLowerCase() === 'paid')
                        .reduce((sum, o) => sum + o.totalAmount, 0)
                    )}
                  </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Pesanan Dibatalkan</span>
                    <div className="text-lg font-bold text-red-400">
                      {historyOrders.filter(o => o.status?.toLowerCase() === 'cancelled').length}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Bersihkan riwayat pesanan yang sudah selesai/batal dari penyimpanan?')) {
                        onClearFinishedOrders();
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
                  >
                    🗑️ Bersihkan
                  </button>
                </div>
              </div>

              {/* Table of Orders */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-3">Waktu</th>
                        <th className="px-4 py-3">Meja / Tamu</th>
                        <th className="px-4 py-3">Menu</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Metode</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {historyOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            Belum ada riwayat transaksi selesai.
                          </td>
                        </tr>
                      ) : (
                        historyOrders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                              {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                              Meja {order.tableNumber} <span className="font-normal text-slate-400">({order.customerName})</span>
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {order.items.map(it => `${it.quantity ?? it.qty ?? 1}x ${it.name}`).join(', ')}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-400 whitespace-nowrap">
                              {formatRupiah(order.totalAmount)}
                            </td>
                            <td className="px-4 py-3 uppercase text-slate-400">
                              {order.paymentMethod || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {getStatusBadge(order.status)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {order.status?.toLowerCase() === 'paid' && (
                                <button
                                  onClick={() => handlePrintReceipt(order)}
                                  className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                                  title="Cetak Ulang Struk"
                                >
                                  🖨️
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PEMBAYARAN KASIR */}
      {(payingOrder || payingTable) && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Pembayaran: {payingTable ? `Meja ${payingTable}` : `Meja ${payingOrder?.tableNumber}`}
                </h3>
                <p className="text-xs text-slate-400">Selesaikan transaksi kasir dan cetak struk</p>
              </div>
              <button
                onClick={() => {
                  setPayingOrder(null);
                  setPayingTable(null);
                }}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Total Tagihan Banner */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Total Yang Harus Dibayar</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {formatRupiah(currentPayTotal)}
              </div>
            </div>

            {/* Pilih Metode Pembayaran */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Metode Pembayaran:</label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'cash', label: 'TUNAI' },
                    { id: 'qris', label: 'QRIS' },
                    { id: 'transfer', label: 'TRANSFER' },
                    { id: 'debit', label: 'DEBIT' },
                  ] as const
                ).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      paymentMethod === m.id
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculator Tunai */}
            {paymentMethod === 'cash' ? (
              <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Uang Diterima:</span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={e => setCashReceived(Number(e.target.value))}
                    className="w-32 bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-right text-white font-mono font-bold"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setCashReceived(currentPayTotal)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 whitespace-nowrap"
                  >
                    Uang Pas
                  </button>
                  <button
                    onClick={() => setCashReceived(50000)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 whitespace-nowrap"
                  >
                    50k
                  </button>
                  <button
                    onClick={() => setCashReceived(100000)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 whitespace-nowrap"
                  >
                    100k
                  </button>
                  <button
                    onClick={() => setCashReceived(200000)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded text-slate-300 whitespace-nowrap"
                  >
                    200k
                  </button>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Kembalian:</span>
                  <span className={`font-mono font-bold text-sm ${cashReceived >= currentPayTotal ? 'text-emerald-400' : 'text-red-400'}`}>
                    {cashReceived >= currentPayTotal ? formatRupiah(kembalian) : 'Kurang ' + formatRupiah(currentPayTotal - cashReceived)}
                  </span>
                </div>
              </div>
            ) : paymentMethod === 'qris' ? (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-300">Tunjukkan QRIS Statis Meja / EDC Kasir kepada tamu.</p>
                <div className="inline-block p-2 bg-white rounded-lg">
                  <div className="text-2xl">📱💳</div>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium">Pastikan dana telah masuk ke aplikasi rekening kafe.</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <p className="text-xs text-slate-300">Cek mutasi rekening / EDC bank sebelum konfirmasi lunas.</p>
              </div>
            )}

            {/* Tombol Konfirmasi */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setPayingOrder(null);
                  setPayingTable(null);
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={paymentMethod === 'cash' && cashReceived < currentPayTotal}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition-all"
              >
                <span>✓</span> Lunasi & Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
