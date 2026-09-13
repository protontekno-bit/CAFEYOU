import React from 'react';

export interface PosVoidItemModalProps {
  voidingData: {
    orderId: string;
    itemIndex: number;
    itemName: string;
    reason: string;
  } | null;
  setVoidingData: React.Dispatch<
    React.SetStateAction<{
      orderId: string;
      itemIndex: number;
      itemName: string;
      reason: string;
    } | null>
  >;
  onConfirmVoid: () => void;
  onClose: () => void;
}

export const PosVoidItemModal: React.FC<PosVoidItemModalProps> = ({
  voidingData,
  setVoidingData,
  onConfirmVoid,
  onClose,
}) => {
  if (!voidingData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-slate-200">
        <h3 className="text-base font-black text-red-400 flex items-center gap-2">
          <span>⚠️</span>
          <span>Batalkan Item (Void)</span>
        </h3>
        <p className="text-xs text-slate-300">
          Apakah Anda yakin ingin membatalkan menu{' '}
          <strong className="text-white">{voidingData.itemName}</strong> dari pesanan ini?
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Alasan Pembatalan:
          </label>
          <input
            type="text"
            value={voidingData.reason}
            onChange={(e) => setVoidingData({ ...voidingData, reason: e.target.value })}
            placeholder="Misal: Stok dapur habis"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white text-xs outline-none focus:border-red-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={onConfirmVoid}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-md transition-all"
          >
            Ya, Batalkan Item
          </button>
        </div>
      </div>
    </div>
  );
};
