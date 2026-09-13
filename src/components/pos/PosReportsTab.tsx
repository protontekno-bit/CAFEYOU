import React from 'react';
import { TableOrder } from '../../types';

export interface PosReportsTabProps {
  totalRevenue: number;
  paidOrders: TableOrder[];
  totalPb1Collected: number;
  cashDrawerExpected: number;
  revenueCash: number;
  totalExpenseCash: number;
  totalExpenseAll: number;
  expenseList: any[];
  netIncomeShift: number;
  revenueQris: number;
  revenueTransfer: number;
  revenueDebit: number;
  historyOrders: TableOrder[];
  formatRupiah: (amount: number) => string;
  onOpenExpenseModal: () => void;
  onClearFinishedOrders: () => void;
  onPrintReceipt: (order: TableOrder) => void;
}

export const PosReportsTab: React.FC<PosReportsTabProps> = ({
  totalRevenue,
  paidOrders,
  totalPb1Collected,
  cashDrawerExpected,
  revenueCash,
  totalExpenseCash,
  totalExpenseAll,
  expenseList,
  netIncomeShift,
  revenueQris,
  revenueTransfer,
  revenueDebit,
  historyOrders,
  formatRupiah,
  onOpenExpenseModal,
  onClearFinishedOrders,
  onPrintReceipt,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Laporan & Tutup Kasir */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>📊</span>
            <span>Rekapitulasi Shift Kasir & Audit Finansial</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pemantauan omzet, pajak PB1 daerah, pengeluaran kas kecil, dan rekonsiliasi saldo fisik laci kasir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenExpenseModal}
            className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>💸</span>
            <span>Catat Kas Keluar</span>
            {expenseList.length > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-mono">
                {expenseList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bersihkan semua data pesanan yang sudah berstatus Lunas/Batal?')) {
                onClearFinishedOrders();
              }
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all"
          >
            🧹 Tutup Shift
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan Omzet & Arus Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Omzet Kotor */}
        <div className="bg-slate-900/80 border border-emerald-500/30 p-5 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
            <span>TOTAL OMZET BRUTO</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatRupiah(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>{paidOrders.length} Pesanan Lunas</span>
            {totalPb1Collected > 0 && (
              <span className="text-amber-400">PB1: +{formatRupiah(totalPb1Collected)}</span>
            )}
          </div>
        </div>

        {/* 2. Uang Tunai yang Wajib Ada di Laci (Cash Drawer) */}
        <div className="bg-slate-900/80 border border-amber-500/40 p-5 rounded-3xl space-y-2 bg-gradient-to-b from-amber-500/5 to-transparent">
          <div className="flex justify-between items-center text-xs text-amber-300 font-black">
            <span>SALDO FISIK LACI KASIR</span>
            <span className="text-lg">💵</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {formatRupiah(cashDrawerExpected)}
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            Tunai masuk {formatRupiah(revenueCash)}
            {totalExpenseCash > 0 && (
              <span className="text-rose-400">
                {' '}
                - Kasbon/Beban {formatRupiah(totalExpenseCash)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Beban Kas Keluar (Petty Cash) */}
        <div
          onClick={onOpenExpenseModal}
          className="bg-slate-900/80 border border-rose-500/30 p-5 rounded-3xl space-y-2 cursor-pointer hover:border-rose-500/60 transition-all"
        >
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
            <span>BEBAN PENGELUARAN KAS</span>
            <span className="text-lg">💸</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatRupiah(totalExpenseAll)}
          </div>
          <div className="text-[11px] text-rose-300/80 flex items-center justify-between">
            <span>{expenseList.length} Nota Biaya</span>
            <span className="text-[10px] underline">Kelola ➔</span>
          </div>
        </div>

        {/* 4. Estimasi Laba Bersih Shift */}
        <div className="bg-slate-900/80 border border-blue-500/30 p-5 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
            <span>ESTIMASI LABA BERSIH</span>
            <span className="text-lg">📈</span>
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              netIncomeShift >= 0 ? 'text-blue-400' : 'text-red-400'
            }`}
          >
            {formatRupiah(netIncomeShift)}
          </div>
          <div className="text-[11px] text-slate-500">
            Omzet dikurangi pengeluaran operasional
          </div>
        </div>
      </div>

      {/* Rincian Tambahan: Non-Tunai QRIS & EDC Bank */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg font-black">
              📱
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">
                NON-TUNAI QRIS (REKENING KAFE)
              </span>
              <span className="text-base font-black text-purple-300 font-mono">
                {formatRupiah(revenueQris)}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Settle otomatis ke Bank</span>
        </div>

        <div className="bg-slate-900/60 border border-cyan-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-lg font-black">
              🏦
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block">
                TRANSFER BANK & MESIN EDC DEBIT
              </span>
              <span className="text-base font-black text-cyan-300 font-mono">
                {formatRupiah(revenueTransfer + revenueDebit)}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Bukti struk EDC / Mutasi</span>
        </div>
      </div>

      {/* Riwayat Transaksi Selesai */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">
          Daftar Transaksi Selesai ({historyOrders.length})
        </h3>

        {historyOrders.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            Belum ada riwayat transaksi pada sesi ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-black text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Meja</th>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{ord.tableNumber}</td>
                    <td className="py-3 px-3">{ord.customerName}</td>
                    <td className="py-3 px-3">
                      <span className="uppercase font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ord.paymentMethod || 'TUNAI'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                      {formatRupiah(ord.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onPrintReceipt(ord)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[11px] font-bold transition-all"
                      >
                        🖨️ Cetak Ulang
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
