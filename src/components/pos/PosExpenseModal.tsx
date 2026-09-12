import React, { useState } from 'react';
import { ExpenseCategory, ExpenseItem } from '../../types';

interface PosExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Record<string, ExpenseItem>;
  onAddExpense: (
    category: ExpenseCategory,
    title: string,
    amount: number,
    notes?: string,
    recordedBy?: string,
    paymentSource?: 'CASH_DRAWER' | 'BANK_TRANSFER'
  ) => void;
  onDeleteExpense: (id: string) => void;
}

const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; icon: string }> = {
  BAHAN_BAKU: { label: 'Bahan Baku & Dapur', icon: '🥩' },
  OPERASIONAL: { label: 'Operasional, Listrik & Gas', icon: '⚡' },
  GAJI_KASBON: { label: 'Kasbon / Insentif Staf', icon: '👤' },
  MAINTENANCE: { label: 'Perawatan & Kebersihan', icon: '🧹' },
  LAINNYA: { label: 'Lain-lain / Mendesak', icon: '📦' },
};

export const PosExpenseModal: React.FC<PosExpenseModalProps> = ({
  isOpen,
  onClose,
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('BAHAN_BAKU');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [paymentSource, setPaymentSource] = useState<'CASH_DRAWER' | 'BANK_TRANSFER'>('CASH_DRAWER');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const expenseList = Object.values(expenses || {}).sort((a, b) => b.createdAt - a.createdAt);
  const filteredList = expenseList.filter(
    (e) => filterCategory === 'ALL' || e.category === filterCategory
  );

  const totalExpenseAll = expenseList.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenseCash = expenseList
    .filter((e) => e.paymentSource === 'CASH_DRAWER')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!title.trim() || numAmount <= 0) return;

    onAddExpense(
      category,
      title.trim(),
      numAmount,
      notes.trim() || undefined,
      recordedBy.trim() || undefined,
      paymentSource
    );

    setTitle('');
    setAmount('');
    setNotes('');
    setFeedback('Pengeluaran berhasil dicatat!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const formatRupiah = (val: number) => 'Rp ' + (val || 0).toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-scaleUp text-slate-200 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-lg text-white font-black shadow-md shadow-rose-500/20">
              💸
            </div>
            <div>
              <h3 className="text-base font-black text-white">Kas Keluar & Pengeluaran Operasional</h3>
              <p className="text-xs text-slate-400">Pencatatan kas kecil (Petty Cash) agar uang fisik laci kasir tidak tekor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Ringkasan Beban Shift */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-slate-950/80 border border-rose-500/30 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Beban Kas Keluar
            </span>
            <div className="text-xl font-black text-rose-400 font-mono">
              {formatRupiah(totalExpenseAll)}
            </div>
            <span className="text-[10px] text-slate-500">{expenseList.length} Transaksi Tercatat</span>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Uang Diambil dari Laci (Cash)
            </span>
            <div className="text-xl font-black text-amber-300 font-mono">
              {formatRupiah(totalExpenseCash)}
            </div>
            <span className="text-[10px] text-slate-500">Mengurangi saldo tunai fisik laci</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <span>✅</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* Form Tambah Pengeluaran Baru */}
        <form onSubmit={handleSubmit} className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <span>➕</span>
            <span>Catat Pengeluaran Baru</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Kategori Biaya:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sumber Dana:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentSource('CASH_DRAWER')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    paymentSource === 'CASH_DRAWER'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-slate-900 border-slate-750 text-slate-400'
                  }`}
                >
                  💵 Laci Kasir
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSource('BANK_TRANSFER')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    paymentSource === 'BANK_TRANSFER'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-black'
                      : 'bg-slate-900 border-slate-750 text-slate-400'
                  }`}
                >
                  🏦 Transfer Rekening
                </button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Keperluan / Keterangan:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="misal: Beli Es Batu Kristal 2 Bal, Gas LPG"
                required
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Nominal Pengeluaran (Rp):</label>
              <input
                type="number"
                min={500}
                step={500}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                required
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Staf Penanggung Jawab:</label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="Nama staf kasir / barista"
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Catatan Tambahan / No. Bon (Opsional):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="misal: Bon toko terlampir di laci"
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-md shadow-rose-500/20 active:scale-98 transition-all"
          >
            💾 Simpan Pengeluaran Kas
          </button>
        </form>

        {/* Riwayat Pengeluaran Shift */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Daftar Pengeluaran Sesi Ini ({filteredList.length})
            </h4>

            {/* Filter Kategori */}
            <div className="flex gap-1 overflow-x-auto pb-1 max-w-full custom-scrollbar">
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterCategory === 'ALL'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Semua
              </button>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilterCategory(k as ExpenseCategory)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                    filterCategory === k
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-slate-500 text-xs">
              Belum ada pengeluaran kas tercatat pada sesi ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Keperluan</th>
                    <th className="py-2.5 px-3">Sumber</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {new Date(exp.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-semibold">
                          {CATEGORY_LABELS[exp.category]?.icon} {CATEGORY_LABELS[exp.category]?.label || exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{exp.title}</div>
                        {exp.notes && <div className="text-[10px] text-slate-400">({exp.notes})</div>}
                        <div className="text-[9px] text-slate-500">Oleh: {exp.recordedBy}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            exp.paymentSource === 'CASH_DRAWER'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {exp.paymentSource === 'CASH_DRAWER' ? 'Laci Tunai' : 'Transfer'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-400">
                        {formatRupiah(exp.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus pencatatan pengeluaran "${exp.title}" (${formatRupiah(exp.amount)})?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs transition-colors"
                          title="Hapus pencatatan"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
