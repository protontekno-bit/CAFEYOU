import React, { useState, useEffect } from 'react';
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
  onTopUpVoucher?: (code: string, additionalQuota: number) => void;
  onClearExhaustedVouchers?: () => void;
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
  onTopUpVoucher,
  onClearExhaustedVouchers,
  onSetDailyPin,
}) => {
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;

  /* ── Form state: Buat Voucher ── */
  const [selectedTable, setSelectedTable] = useState(() => activeTables[0] || 'Meja 1');
  const [quota, setQuota] = useState(3);
  const [lastCreatedVoucher, setLastCreatedVoucher] = useState<Voucher | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  /* ── Form state: Daily PIN ── */
  const [dailyPinEnabled, setDailyPinEnabled] = useState(dailyPin?.enabled || false);
  const [dailyPinCode, setDailyPinCode] = useState(dailyPin?.code || '1234');
  const [pinSavedMsg, setPinSavedMsg] = useState(false);

  /* Sync dailyPin dari Firebase ke local state */
  useEffect(() => {
    setDailyPinEnabled(dailyPin?.enabled || false);
    setDailyPinCode(dailyPin?.code || '1234');
  }, [dailyPin?.enabled, dailyPin?.code]);

  /* Reset semua state saat modal ditutup */
  useEffect(() => {
    if (!isOpen) {
      setLastCreatedVoucher(null);
      setIsCopied(false);
      setPinSavedMsg(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const voucherList = Object.values(vouchers || {}).sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

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

  /* Teks WA dibuat di luar JSX agar tidak jitter saat re-render */
  const waText = lastCreatedVoucher
    ? encodeURIComponent(
        `Halo! Berikut adalah Kode Voucher Karaoke untuk ${lastCreatedVoucher.tableNumber}:\n\n` +
          `🎟️ KODE: ${lastCreatedVoucher.code}\n` +
          `📊 KUOTA: ${lastCreatedVoucher.quotaTotal === 999 ? 'Unlimited' : `${lastCreatedVoucher.quotaTotal} Lagu`}\n\n` +
          `Silakan masukkan kode ini di portal karaoke meja Anda. Selamat bernyanyi! 🎤`
      )
    : '';

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto">

        {/* ── Header (shrink-0) ── */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎟️</span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Manajemen Voucher &amp; Akses Meja
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

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">

          {/* SECTION 1 — Form buat voucher */}
          <form
            onSubmit={handleCreate}
            className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-2xl border border-blue-500/30 shadow-inner"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5 mb-4">
              <TicketIcon className="w-4 h-4 text-blue-400" />
              <span>Terbitkan Kode Voucher Meja Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
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
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] mb-4"
            >
              <span>+ Terbitkan Kode Voucher</span>
            </button>

            {/*
              Area hasil: SELALU ada di DOM dengan minHeight tetap.
              Hanya opacity & border/bg yang berubah → ZERO layout shift.
            */}
            <div
              className="rounded-2xl border overflow-hidden transition-opacity duration-300"
              style={{
                minHeight: '88px',
                opacity: lastCreatedVoucher ? 1 : 0,
                pointerEvents: lastCreatedVoucher ? 'auto' : 'none',
                borderColor: lastCreatedVoucher ? 'rgba(16,185,129,0.4)' : 'rgba(71,85,105,0.3)',
                background: lastCreatedVoucher
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(2,6,23,0.3)',
              }}
            >
              {lastCreatedVoucher && (
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-emerald-300 font-bold">
                        Voucher siap untuk <strong>{lastCreatedVoucher.tableNumber}</strong>:
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        Kuota:{' '}
                        <strong>
                          {lastCreatedVoucher.quotaTotal === 999
                            ? 'Unlimited (∞)'
                            : `${lastCreatedVoucher.quotaTotal} Lagu`}
                        </strong>
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
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isCopied ? 'Tersalin! ✓' : '📋 Salin Kode'}
                    </button>
                    <a
                      href={`https://wa.me/?text=${waText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      📱 Kirim ke WA
                    </a>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* SECTION 2 — Master PIN Harian */}
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
                <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
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
                {pinSavedMsg && (
                  <span className="text-emerald-400 font-semibold">Tersimpan! ✓</span>
                )}
              </div>
            )}
          </form>

          {/* SECTION 3 — Daftar Voucher Aktif */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daftar Voucher ({voucherList.length})
              </h3>
              {onClearExhaustedVouchers && voucherList.some((v) => v.status === 'exhausted' || (v.quotaTotal !== 999 && v.quotaUsed >= v.quotaTotal)) && (
                <button
                  type="button"
                  onClick={() => {
                    const exhaustedCount = voucherList.filter(
                      (v) => v.status === 'exhausted' || (v.quotaTotal !== 999 && v.quotaUsed >= v.quotaTotal)
                    ).length;
                    if (confirm(`Bersihkan ${exhaustedCount} voucher yang sudah habis dari daftar?`)) {
                      onClearExhaustedVouchers();
                    }
                  }}
                  className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Hapus semua voucher yang kuotanya sudah habis"
                >
                  <span>🧹 Bersihkan Voucher Habis</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar text-xs">
              {voucherList.length > 0 ? (
                voucherList.map((v) => {
                  const isExhausted =
                    v.status === 'exhausted' ||
                    (v.quotaTotal !== 999 && v.quotaUsed >= v.quotaTotal);
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
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isExhausted
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isExhausted
                            ? 'Habis'
                            : `Terpakai ${v.quotaUsed}/${v.quotaTotal === 999 ? '∞' : v.quotaTotal}`}
                        </span>

                        {/* Tombol Cepat Tambah Kuota (Top Up Tanpa Ganti Kode) */}
                        {onTopUpVoucher && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onTopUpVoucher(v.code, 1)}
                              className="px-2 py-0.5 bg-blue-500/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer"
                              title="Tambah 1 Lagu ke Meja Ini"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => onTopUpVoucher(v.code, 3)}
                              className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer"
                              title="Tambah 3 Lagu ke Meja Ini"
                            >
                              +3
                            </button>
                          </div>
                        )}

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

        {/* ── Footer (shrink-0) ── */}
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
