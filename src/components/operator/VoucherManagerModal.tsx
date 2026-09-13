import React, { useState } from 'react';
import { Voucher, DailyPinConfig } from '../../types';
import { QUICK_TABLES } from '../../constants/karaoke';
import { TicketIcon, TrashIcon, LockIcon } from '../icons/Icons';

interface VoucherManagerModalProps {
  isOpen: boolean;
  vouchers: Record<string, Voucher>;
  dailyPin: DailyPinConfig;
  tables?: string[];
  onClose: () => void;
  onCreateVoucher: (tableNumber: string, quota: number) => Voucher;
  onRevokeVoucher: (code: string) => void;
  onSetDailyPin: (enabled: boolean, code: string) => void;
}

export const VoucherManagerModal: React.FC<VoucherManagerModalProps> = ({
  isOpen,
  vouchers = {},
  dailyPin,
  tables,
  onClose,
  onCreateVoucher,
  onRevokeVoucher,
  onSetDailyPin,
}) => {
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;
  const [selectedTable, setSelectedTable] = useState(() => activeTables[0] || 'Meja 1');
  const [quota, setQuota] = useState(3);
  const [lastCreatedVoucher, setLastCreatedVoucher] = useState<Voucher | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Daily PIN form state
  const [dailyPinEnabled, setDailyPinEnabled] = useState(dailyPin?.enabled || false);
  const [dailyPinCode, setDailyPinCode] = useState(dailyPin?.code || '1234');
  const [pinSavedMsg, setPinSavedMsg] = useState(false);

  if (!isOpen) return null;

  const voucherList = Object.values(vouchers || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const v = onCreateVoucher(selectedTable, quota);
    setLastCreatedVoucher(v);
    setIsCopied(false);
  };

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  const handleSaveDailyPin = (e: React.FormEvent) => {
    e.preventDefault();
    onSetDailyPin(dailyPinEnabled, dailyPinCode.trim() || '1234');
    setPinSavedMsg(true);
    setTimeout(() => setPinSavedMsg(false), 2500);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto transition-all">
        {/* Header Tetap (Fixed Header) */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎟️</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Manajemen Voucher & Akses Meja</span>
              </h2>
              <p className="text-xs text-slate-400">
                Terbitkan kode voucher kuota lagu per meja atau atur PIN harian kafe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body dengan scrollbar-gutter stabil */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
          {/* Section 1: Buat Voucher Baru */}
          <form
            onSubmit={handleCreate}
            className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-2xl border border-blue-500/30 space-y-4 shadow-inner"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <TicketIcon className="w-4 h-4 text-blue-400" />
              <span>Terbitkan Kode Voucher Meja Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Pilih Meja / Lokasi
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {activeTables.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Kuota Jumlah Lagu
                </label>
                <select
                  value={quota}
                  onChange={(e) => setQuota(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value={2}>2 Lagu</option>
                  <option value={3}>3 Lagu (Standar)</option>
                  <option value={5}>5 Lagu</option>
                  <option value={10}>10 Lagu (VIP)</option>
                  <option value={999}>Unlimited (Tanpa Batas)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>+ Terbitkan Kode Voucher</span>
            </button>

            {/* Banner Hasil Generate (Desain Stabil Tanpa Jitter) */}
            {lastCreatedVoucher && (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl space-y-3 text-xs transition-opacity duration-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-emerald-300 font-bold text-xs">
                      Voucher Siap Digunakan untuk <strong>{lastCreatedVoucher.tableNumber}</strong>:
                    </div>
                    <div className="text-slate-300 text-[11px] mt-0.5">
                      Kuota: <strong>{lastCreatedVoucher.quotaTotal === 999 ? 'Unlimited (∞)' : `${lastCreatedVoucher.quotaTotal} Lagu`}</strong>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 rounded-xl font-mono font-black text-xl tracking-widest shadow shrink-0">
                    {lastCreatedVoucher.code}
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-emerald-500/30">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(lastCreatedVoucher.code)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all text-center text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isCopied ? 'Tersalin! ✓' : '📋 Salin Kode'}</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Halo! Berikut adalah Kode Voucher Karaoke untuk ${lastCreatedVoucher.tableNumber}:\n\n🎟️ KODE: ${lastCreatedVoucher.code}\n📊 KUOTA: ${lastCreatedVoucher.quotaTotal === 999 ? 'Unlimited' : `${lastCreatedVoucher.quotaTotal} Lagu`}\n\nSilakan masukkan kode ini di portal karaoke meja Anda. Selamat bernyanyi! 🎤`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-center text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>📱 Kirim ke WA</span>
                  </a>
                </div>
              </div>
            )}
          </form>

          {/* Section 2: Master PIN Harian */}
          <form
            onSubmit={handleSaveDailyPin}
            className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <LockIcon className="w-4 h-4 text-amber-400" />
                <span>Mode Master PIN Harian (1 PIN untuk Semua Meja)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dailyPinEnabled}
                  onChange={(e) => setDailyPinEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            {dailyPinEnabled && (
              <div className="flex gap-2.5 items-center pt-1">
                <input
                  type="text"
                  maxLength={6}
                  value={dailyPinCode}
                  onChange={(e) => setDailyPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="PIN (contoh: 1234)"
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono font-bold tracking-wider outline-none focus:border-amber-500 w-44"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-xl transition-colors border border-amber-500/40 cursor-pointer"
                >
                  Simpan PIN
                </button>
                {pinSavedMsg && <span className="text-emerald-400 font-semibold text-xs">Tersimpan! ✓</span>}
              </div>
            )}
          </form>

          {/* Section 3: Daftar Voucher Aktif */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daftar Voucher Aktif ({voucherList.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar text-xs">
              {voucherList.length > 0 ? (
                voucherList.map((v) => {
                  const isExhausted = v.status === 'exhausted' || (v.quotaTotal !== 999 && v.quotaUsed >= v.quotaTotal);
                  return (
                    <div
                      key={v.code}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        isExhausted
                          ? 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                          : 'bg-slate-950/70 border-slate-800/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-white tracking-widest shrink-0">
                          {v.code}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{v.tableNumber}</div>
                          <div className="text-[10px] text-slate-400">
                            Dibuat: {formatTime(v.createdAt)} WIB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isExhausted
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isExhausted ? 'Habis' : `Terpakai ${v.quotaUsed}/${v.quotaTotal === 999 ? '∞' : v.quotaTotal}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Cabut voucher ${v.code} untuk ${v.tableNumber}?`)) {
                              onRevokeVoucher(v.code);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Hapus / Cabut Voucher"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800 text-xs">
                  Belum ada voucher aktif yang diterbitkan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Tetap */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
