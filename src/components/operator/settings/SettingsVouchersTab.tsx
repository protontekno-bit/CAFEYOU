import React, { useState, useEffect } from 'react';
import { Voucher, DailyPinConfig } from '../../../types';
import { QUICK_TABLES } from '../../../constants/karaoke';
import { TicketIcon } from '../../icons/Icons';

interface SettingsVouchersTabProps {
  vouchers?: Record<string, Voucher>;
  dailyPin?: DailyPinConfig;
  tables?: string[];
  onCreateVoucher?: (tableNumber: string, quota?: number) => Voucher;
  onRevokeVoucher?: (code: string) => void;
  onSetDailyPin?: (enabled: boolean, code: string) => void;
  onOpenVoucherModal?: () => void;
}

export const SettingsVouchersTab: React.FC<SettingsVouchersTabProps> = ({
  vouchers = {},
  dailyPin,
  tables,
  onCreateVoucher,
  onRevokeVoucher,
  onSetDailyPin,
  onOpenVoucherModal,
}) => {
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;

  const [isDailyPinActive, setIsDailyPinActive] = useState(dailyPin?.enabled || false);
  const [dailyPinCode, setDailyPinCode] = useState(dailyPin?.code || '1234');
  const [isPinSaved, setIsPinSaved] = useState(false);

  const [voucherTable, setVoucherTable] = useState(() => activeTables[0] || 'Meja 1');
  const [voucherQuota, setVoucherQuota] = useState(3);
  const [lastCreatedVoucher, setLastCreatedVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    setIsDailyPinActive(dailyPin?.enabled || false);
    setDailyPinCode(dailyPin?.code || '1234');
  }, [dailyPin]);

  const handleSavePin = () => {
    if (onSetDailyPin) {
      onSetDailyPin(isDailyPinActive, dailyPinCode.trim() || '1234');
      setIsPinSaved(true);
      setTimeout(() => setIsPinSaved(false), 2000);
    }
  };

  const handleCreateVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateVoucher) {
      const v = onCreateVoucher(voucherTable, voucherQuota);
      setLastCreatedVoucher(v);
    }
  };

  const activeVouchersList = Object.values(vouchers)
    .filter((v) => v.status === 'active')
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>🎟️ Voucher & PIN Akses Tamu</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Proteksi anti-sabotase: Pelanggan wajib memasukkan kode voucher atau PIN untuk memesan lagu.
        </p>
      </div>

      {/* SECTION A: Mode PIN Harian */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>🔑 Mode PIN Harian (Daily PIN)</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  isDailyPinActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isDailyPinActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Jika aktif, semua tamu kafe cukup memasukkan PIN 4-digit yang sama hari ini.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDailyPinActive}
              onChange={(e) => setIsDailyPinActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {isDailyPinActive && (
          <div className="flex items-center gap-3 pt-2">
            <input
              type="text"
              maxLength={6}
              value={dailyPinCode}
              onChange={(e) => setDailyPinCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="1234"
              className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSavePin}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              {isPinSaved ? 'Tersimpan!' : 'Simpan PIN'}
            </button>
          </div>
        )}
      </div>

      {/* SECTION B: Buat Voucher Baru Langsung (Inline Form) */}
      <form
        onSubmit={handleCreateVoucherSubmit}
        className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-2xl border border-blue-500/30 space-y-3"
      >
        <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
          <TicketIcon className="w-4 h-4 text-blue-400" />
          <span>Terbitkan Kode Voucher Baru</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Pilih Meja / Pelanggan:
            </label>
            <select
              value={voucherTable}
              onChange={(e) => setVoucherTable(e.target.value)}
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
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Batas Kuota Lagu:
            </label>
            <select
              value={voucherQuota}
              onChange={(e) => setVoucherQuota(parseInt(e.target.value, 10))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value={1}>1 Lagu</option>
              <option value={2}>2 Lagu</option>
              <option value={3}>3 Lagu (Standar)</option>
              <option value={5}>5 Lagu</option>
              <option value={10}>10 Lagu</option>
              <option value={20}>20 Lagu (VIP)</option>
            </select>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            <span>🎟️ Terbitkan Voucher {voucherTable}</span>
          </button>

          {onOpenVoucherModal && (
            <button
              type="button"
              onClick={onOpenVoucherModal}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Buka Layout Cetak Voucher
            </button>
          )}
        </div>
      </form>

      {/* Card Voucher Terbit Baru */}
      {lastCreatedVoucher && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border border-amber-500/40 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-300">VOUCHER BERHASIL DITERBITKAN:</span>
            <span className="text-[10px] font-bold text-white bg-amber-600/60 px-2.5 py-0.5 rounded-full">
              {lastCreatedVoucher.tableNumber}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">
              {lastCreatedVoucher.code}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(lastCreatedVoucher.code);
                alert(`Kode voucher ${lastCreatedVoucher.code} berhasil disalin!`);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
            >
              Salin Kode
            </button>
          </div>
          <div className="text-[11px] text-amber-200/80">
            Kuota: <strong>{lastCreatedVoucher.quotaTotal} Lagu</strong> • Berikan kode ini kepada tamu di {lastCreatedVoucher.tableNumber}.
          </div>
        </div>
      )}

      {/* SECTION C: Daftar Voucher Aktif */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Daftar Voucher Aktif ({activeVouchersList.length}):</span>
        </div>
        {activeVouchersList.length === 0 ? (
          <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
            Belum ada voucher aktif saat ini.
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {activeVouchersList.map((v) => (
              <div
                key={v.code}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
                    {v.code}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">{v.tableNumber}</div>
                    <div className="text-[10px] text-slate-400">
                      Terpakai: <strong>{v.quotaUsed}</strong> / {v.quotaTotal} Lagu
                    </div>
                  </div>
                </div>

                {onRevokeVoucher && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Cabut voucher ${v.code} untuk ${v.tableNumber}?`)) {
                        onRevokeVoucher(v.code);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs"
                    title="Cabut voucher ini"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
