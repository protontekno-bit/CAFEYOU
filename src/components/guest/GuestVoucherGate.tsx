import React, { useState } from 'react';
import { LockIcon, TicketIcon } from '../icons/Icons';
import { Voucher } from '../../types';

interface GuestVoucherGateProps {
  tableNumber: string;
  onSuccess: (voucher: Voucher) => void;
  validateVoucher: (code: string) => {
    valid: boolean;
    voucher?: Voucher;
    isDailyPin?: boolean;
    message?: string;
  };
  onBackToLanding?: () => void;
}

export const GuestVoucherGate: React.FC<GuestVoucherGateProps> = ({
  tableNumber,
  onSuccess,
  validateVoucher,
  onBackToLanding,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Silakan masukkan kode voucher atau PIN.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = validateVoucher(pin.trim());
    if (result.valid && result.voucher) {
      // Simpan voucher ke sessionStorage
      try {
        sessionStorage.setItem(
          `cafeyou_voucher_${tableNumber}`,
          JSON.stringify(result.voucher)
        );
      } catch (err) {
        console.warn('Cannot write to sessionStorage:', err);
      }
      onSuccess(result.voucher);
    } else {
      setErrorMsg(result.message || 'Kode voucher tidak valid. Hubungi kasir kafe.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Brand & Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
            <span>🎤 CAFEYOU KARAOKE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Portal Karaoke Pelanggan
          </h1>
          <div className="inline-block px-3 py-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl text-blue-300 font-bold text-sm">
            📍 {tableNumber || 'Meja Kafe'}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-4 bg-slate-850/60 rounded-2xl border border-slate-700/60 flex items-start gap-3 text-xs text-slate-300">
          <LockIcon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Sistem Proteksi Meja:</span>
            <p className="mt-0.5 text-slate-400 leading-relaxed">
              Masukkan 4-digit <strong>Kode Voucher</strong> yang diberikan oleh kasir/operator kafe untuk memesan lagu karaoke.
            </p>
          </div>
        </div>

        {/* Form PIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider text-center">
              Masukkan Kode Voucher / PIN
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Contoh: 4829"
                autoFocus
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-2xl py-3.5 px-4 text-center text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-white shadow-inner outline-none transition-all placeholder:text-slate-600 placeholder:text-lg placeholder:font-normal placeholder:tracking-normal"
              />
            </div>
            {errorMsg && (
              <div className="mt-2 text-xs text-red-400 text-center font-medium bg-red-500/10 border border-red-500/30 py-2 px-3 rounded-xl animate-shake">
                {errorMsg}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !pin.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TicketIcon className="w-5 h-5" />
            <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk & Mulai Pilih Lagu'}</span>
          </button>
        </form>

        {/* Back option */}
        {onBackToLanding && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLanding}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Kembali ke Menu Utama
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
