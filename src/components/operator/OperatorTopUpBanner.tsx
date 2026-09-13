import React from 'react';
import { AssistanceRequest } from '../../types';

interface OperatorTopUpBannerProps {
  requests: Record<string, AssistanceRequest>;
  onApproveTopUp: (tableNumber: string, voucherCode?: string, songsToAdd?: number) => void;
  onDismissTopUp: (tableNumber: string) => void;
}

export const OperatorTopUpBanner: React.FC<OperatorTopUpBannerProps> = ({
  requests,
  onApproveTopUp,
  onDismissTopUp,
}) => {
  const pendingTopUpList = Object.values(requests || {}).filter(
    (r) => r && r.status === 'pending'
  );

  if (pendingTopUpList.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 space-y-2 select-none">
      {pendingTopUpList.map((req) => (
        <div
          key={req.tableNumber}
          className="p-3.5 bg-gradient-to-r from-amber-600/90 via-amber-700 to-orange-800 border border-amber-400/50 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-200">
                Permintaan Tambah Kuota Lagu • Meja {req.tableNumber}
              </div>
              <div className="text-sm font-semibold text-white">
                Voucher: <span className="font-mono font-bold">{req.voucherCode || '-'}</span> • Tamu kehabisan kuota lagu dan ingin memesan lagu lagi.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onApproveTopUp(req.tableNumber, req.voucherCode, 1)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>+1 Lagu</span>
            </button>
            <button
              type="button"
              onClick={() => onApproveTopUp(req.tableNumber, req.voucherCode, 3)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>+3 Lagu</span>
            </button>
            <button
              type="button"
              onClick={() => onDismissTopUp(req.tableNumber)}
              className="px-2.5 py-1.5 bg-black/40 hover:bg-black/60 text-xs font-bold rounded-xl transition-all text-slate-300 cursor-pointer"
            >
              Tutup ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
