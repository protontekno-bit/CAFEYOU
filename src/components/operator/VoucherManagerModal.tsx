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

  // Daily PIN form state
  const [dailyPinEnabled, setDailyPinEnabled] = useState(dailyPin?.enabled || false);
  const [dailyPinCode, setDailyPinCode] = useState(dailyPin?.code || '1234');
  const [pinSavedMsg, setPinSavedMsg] = useState(false);

  if (!isOpen) return null;

  const voucherList = Object.values(vouchers || {}).sort((a, b) => b.createdAt - a.createdAt);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const v = onCreateVoucher(selectedTable, quota);
    setLastCreatedVoucher(v);
  };

  const handleSaveDailyPin = (e: React.FormEvent) => {
    e.preventDefault();
    onSetDailyPin(dailyPinEnabled, dailyPinCode);
    setPinSavedMsg(true);
    setTimeout(() => setPinSavedMsg(false), 2500);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎟️</span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Manajemen Voucher & Keamanan Meja</span>
              </h2>
              <p className="text-xs text-slate-400">
                Proteksi anti-sabotase: Pelanggan wajib memasukkan kode voucher untuk request lagu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Buat Voucher Baru */}
        <form
          onSubmit={handleCreate}
          className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950/40 rounded-xl border border-blue-500/40 space-y-3 shadow-inner"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <TicketIcon className="w-4 h-4 text-blue-400" />
              <span>Buat Kode Voucher Meja Baru</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Pilih Meja / Lokasi
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {activeTables.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Kuota Jumlah Lagu
              </label>
              <select
                value={quota}
                onChange={(e) => setQuota(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
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
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>+ Terbitkan Kode Voucher</span>
          </button>

          {/* Banner Hasil Generate */}
          {lastCreatedVoucher && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl space-y-2.5 text-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-emerald-300 font-bold">
                    Voucher Berhasil Dibuat untuk <strong>{lastCreatedVoucher.tableNumber}</strong>:
                  </div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Kuota: {lastCreatedVoucher.quotaTotal === 999 ? 'Unlimited' : `${lastCreatedVoucher.quotaTotal} Lagu`}
                  </div>
                </div>
                <div className="px-3.5 py-1.5 bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 rounded-lg font-mono font-black text-lg tracking-widest shadow">
                  {lastCreatedVoucher.code}
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-emerald-500/30">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(lastCreatedVoucher.code);
                    alert(`Kode voucher ${lastCreatedVoucher.code} berhasil disalin!`);
                  }}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition-all text-center"
                >
                  📋 Salin Kode
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo! Berikut adalah Kode Voucher Karaoke untuk ${lastCreatedVoucher.tableNumber}:\n\n🎟️ KODE: ${lastCreatedVoucher.code}\n📊 KUOTA: ${lastCreatedVoucher.quotaTotal} Lagu\n\nSilakan masukkan kode ini di portal karaoke meja Anda. Selamat bernyanyi! 🎤`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all text-center"
                >
                  📱 Kirim ke WA
                </a>
              </div>
            </div>
          )}
        </form>


        {/* Section 2: Master PIN Harian (Opsional Cepat) */}
        <form
          onSubmit={handleSaveDailyPin}
          className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-2.5 text-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <LockIcon className="w-4 h-4 text-amber-400" />
              <span>Opsi: Master PIN Harian (1 PIN untuk Semua Meja)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dailyPinEnabled}
                onChange={(e) => setDailyPinEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {dailyPinEnabled && (
            <div className="flex gap-2 items-center pt-1 animate-fadeIn">
              <input
                type="text"
                maxLength={6}
                value={dailyPinCode}
                onChange={(e) => setDailyPinCode(e.target.value)}
                placeholder="PIN 4 Digit (contoh: 1234)"
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono font-bold tracking-wider outline-none focus:border-amber-500 w-44"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-lg transition-colors border border-amber-500/40"
              >
                Simpan PIN
              </button>
              {pinSavedMsg && <span className="text-emerald-400 font-semibold">Tersimpan! ✓</span>}
            </div>
          )}
        </form>

        {/* Section 3: Daftar Voucher Aktif */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Daftar Voucher Aktif ({voucherList.length})
            </h3>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar text-xs">
            {voucherList.length > 0 ? (
              voucherList.map((v) => {
                const isExhausted = v.status === 'exhausted' || v.quotaUsed >= v.quotaTotal;
                return (
                  <div
                    key={v.code}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isExhausted
                        ? 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                        : 'bg-slate-900/80 border-slate-700/70 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white tracking-widest">
                        {v.code}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{v.tableNumber}</div>
                        <div className="text-[10px] text-slate-400">
                          Dibuat: {formatTime(v.createdAt)} WIB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isExhausted
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isExhausted ? 'Habis' : `Terpakai ${v.quotaUsed}/${v.quotaTotal} Lagu`}
                        </span>
                      </div>
                      <button
                        onClick={() => onRevokeVoucher(v.code)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus / Cabut Voucher"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-700/40">
                Belum ada voucher aktif yang diterbitkan.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
