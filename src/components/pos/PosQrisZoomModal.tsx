import React from 'react';
import { CafeSettings } from '../../types';

export interface PosQrisZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSettings?: CafeSettings;
  payingTable: string | null;
}

export const PosQrisZoomModal: React.FC<PosQrisZoomModalProps> = ({
  isOpen,
  onClose,
  cafeSettings,
  payingTable,
}) => {
  if (!isOpen || !cafeSettings?.qrisImageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-750 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-scaleUp cursor-default"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
            📱 SCAN UNTUK BAYAR (QRIS)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base font-bold p-1"
          >
            ✕
          </button>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-2xl inline-block border-4 border-slate-200">
          <img
            src={cafeSettings.qrisImageUrl}
            alt="QRIS Zoom"
            className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
          />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white">
            {cafeSettings.qrisMerchantName || cafeSettings.name || 'CAFEYOU'}
          </h4>
          {payingTable && (
            <p className="text-xs text-slate-400">
              Meja: <span className="font-bold text-slate-200">{payingTable}</span>
            </p>
          )}
          {cafeSettings.danaPhoneNumber && (
            <p className="text-xs text-blue-400 font-mono font-semibold">
              DANA: {cafeSettings.danaPhoneNumber}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition-all"
        >
          Tutup Pratinjau
        </button>
      </div>
    </div>
  );
};
