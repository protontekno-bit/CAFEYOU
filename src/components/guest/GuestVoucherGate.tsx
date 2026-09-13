import React, { useState } from 'react';
import { LockIcon, TicketIcon, CheckIcon, BackIcon } from '../icons/Icons';
import { Voucher } from '../../types';

interface GuestVoucherGateProps {
  tableNumber: string;
  onSuccess: (voucher: Voucher) => void;
  validateVoucher: (
    code: string,
    targetTable?: string
  ) => Promise<{
    valid: boolean;
    voucher?: Voucher;
    isDailyPin?: boolean;
    tableMismatch?: boolean;
    assignedTable?: string;
    message?: string;
  }>;
  onBackToLanding?: () => void;
  onChangeTable?: () => void;
  onSkipToMenu?: () => void;
}

export const GuestVoucherGate: React.FC<GuestVoucherGateProps> = ({
  tableNumber,
  onSuccess,
  validateVoucher,
  onBackToLanding,
  onChangeTable,
  onSkipToMenu,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mismatchData, setMismatchData] = useState<{ assignedTable: string; voucher: Voucher } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Silakan masukkan 4-digit Kode Voucher / PIN.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setMismatchData(null);

    try {
      const result = await validateVoucher(pin.trim(), tableNumber);
      if (result.valid && result.voucher) {
        setIsSuccess(true);
        const finalTable = result.assignedTable || result.voucher.tableNumber || tableNumber;
        try {
          sessionStorage.setItem('cafeyou_guest_table', finalTable);
          sessionStorage.setItem(
            `cafeyou_voucher_${finalTable}`,
            JSON.stringify(result.voucher)
          );
        } catch (err) {
          console.warn('Cannot write to sessionStorage:', err);
        }

        setTimeout(() => {
          onSuccess(result.voucher!);
        }, 900);
      } else if (result.tableMismatch && result.assignedTable && result.voucher) {
        setMismatchData({ assignedTable: result.assignedTable, voucher: result.voucher });
        setErrorMsg(result.message || null);
        setIsSubmitting(false);
      } else {
        setMismatchData(null);
        setErrorMsg(result.message || 'Kode voucher tidak valid. Hubungi kasir kafe.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat memeriksa voucher. Coba lagi.');
      setIsSubmitting(false);
    }
  };

  const handleSwitchTableAndProceed = () => {
    if (!mismatchData) return;
    setIsSuccess(true);
    try {
      sessionStorage.setItem('cafeyou_guest_table', mismatchData.assignedTable);
      sessionStorage.setItem(
        `cafeyou_voucher_${mismatchData.assignedTable}`,
        JSON.stringify(mismatchData.voucher)
      );
    } catch {}

    setTimeout(() => {
      onSuccess(mismatchData.voucher);
    }, 700);
  };


  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden select-none selection:bg-purple-500 selection:text-white">
      {/* Floating Animated Musical Background Icons */}
      <div className="absolute top-[10%] left-[14%] text-purple-500/15 text-6xl pointer-events-none animate-pulse">
        🎵
      </div>
      <div className="absolute top-[70%] right-[12%] text-pink-500/15 text-5xl pointer-events-none animate-bounce">
        🎤
      </div>
      <div className="absolute bottom-[10%] left-[18%] text-blue-500/15 text-5xl pointer-events-none animate-pulse">
        🎶
      </div>
      <div className="absolute top-[22%] right-[18%] text-amber-500/15 text-4xl pointer-events-none animate-bounce">
        ✨
      </div>

      {/* Top Back Navigation */}
      {onBackToLanding && (
        <div className="absolute top-6 left-6 z-30">
          <button
            onClick={onBackToLanding}
            className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 backdrop-blur-md flex items-center gap-2 transition-all shadow-lg"
          >
            <BackIcon className="w-4 h-4" />
            <span>Menu Utama</span>
          </button>
        </div>
      )}

      {/* 3D Neumorphism Circle Container */}
      <div className="relative w-[440px] h-[440px] max-w-[92vw] max-h-[92vw] rounded-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-700/60 shadow-[22px_22px_50px_rgba(0,0,0,0.85),-18px_-18px_44px_rgba(51,65,85,0.3)] flex flex-col items-center justify-center p-8 text-center transition-all z-10">
        {isSuccess ? (
          /* Success Animation */
          <div className="flex flex-col items-center justify-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/30 to-indigo-900/40 border border-purple-500/40 text-purple-400 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/20">
              <CheckIcon className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-black text-purple-300">Voucher Terverifikasi!</h3>
            <p className="text-xs text-slate-400 font-medium">Membuka Portal Lagu {tableNumber}...</p>
          </div>
        ) : (
          /* Voucher Form Content */
          <form onSubmit={handleSubmit} className="w-[76%] max-w-[290px] flex flex-col gap-3 z-10 -mt-1">
            <div>
              {onChangeTable ? (
                <button
                  type="button"
                  onClick={onChangeTable}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-full text-purple-300 text-[10px] font-extrabold uppercase tracking-wider mb-1 transition-colors group cursor-pointer"
                  title="Klik untuk mengganti nomor meja"
                >
                  <span>📍 {tableNumber || 'Pilih Meja'}</span>
                  <span className="text-[9px] text-purple-400 group-hover:text-purple-200 underline">Ganti</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-500/15 border border-purple-500/30 rounded-full text-purple-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <span>📍 {tableNumber || 'Meja Kafe'}</span>
                </div>
              )}
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                PORTAL TAMU
              </h2>
              <div className="text-xs font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Karaoke CAFEYOU
              </div>
            </div>

            <div className="relative w-full">
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/[^a-zA-Z0-9]/g, ''));
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="PIN Voucher (4 Digit)"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-full py-2.5 px-4 text-center text-lg font-mono font-extrabold tracking-widest text-white placeholder:text-slate-600 placeholder:text-xs placeholder:font-sans placeholder:tracking-normal shadow-inner outline-none focus:border-purple-500 transition-all"
              />
            </div>

            {errorMsg && (
              <div className="text-[10px] text-red-400 font-semibold bg-red-500/10 border border-red-500/30 py-1.5 px-2.5 rounded-xl -my-0.5 animate-shake leading-snug">
                {errorMsg}
              </div>
            )}

            {mismatchData && (
              <button
                type="button"
                onClick={handleSwitchTableAndProceed}
                className="w-full max-w-[240px] mx-auto py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>🪑</span>
                <span>Beralih ke {mismatchData.assignedTable} & Masuk</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !pin.trim()}
              className="w-full max-w-[240px] mx-auto mt-1 py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-full shadow-lg shadow-purple-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <TicketIcon className="w-4 h-4" />
              <span>{isSubmitting ? 'Memeriksa...' : 'Buka Katalog Lagu'}</span>
            </button>

            {onSkipToMenu && (
              <button
                type="button"
                onClick={onSkipToMenu}
                className="w-full max-w-[240px] mx-auto py-2 px-4 bg-slate-800/80 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-full border border-amber-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>🍽️</span>
                <span>Pesan Makanan & Minuman Saja</span>
              </button>
            )}
          </form>
        )}
      </div>

      {/* Info helper */}
      <div className="mt-6 text-center text-xs text-slate-400 max-w-xs leading-relaxed space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-semibold text-[11px]">
          <LockIcon className="w-3.5 h-3.5" />
          <span>Proteksi Anti-Sabotase Meja</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Minta 4-digit Kode Voucher / PIN pada kasir kafe untuk memesan lagu karaoke dari meja ini.
        </p>
      </div>
    </div>
  );
};
