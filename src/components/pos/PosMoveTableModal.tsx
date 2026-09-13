import React from 'react';
import { TableOrder } from '../../types';

export interface PosMoveTableModalProps {
  movingOrder: TableOrder | null;
  targetNewTable: string;
  setTargetNewTable: (table: string) => void;
  tables?: string[];
  onConfirmMoveTable: () => void;
  onClose: () => void;
}

export const PosMoveTableModal: React.FC<PosMoveTableModalProps> = ({
  movingOrder,
  targetNewTable,
  setTargetNewTable,
  tables,
  onConfirmMoveTable,
  onClose,
}) => {
  if (!movingOrder) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-slate-200">
        <h3 className="text-base font-black text-white flex items-center gap-2">
          <span>🔀</span>
          <span>Pindah Meja Pesanan</span>
        </h3>
        <p className="text-xs text-slate-400">
          Pindahkan pesanan #{movingOrder.id.slice(-4)} ({movingOrder.customerName}) dari{' '}
          <strong className="text-white">{movingOrder.tableNumber}</strong> ke meja lain:
        </p>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Pilih Meja Tujuan Baru:
          </label>
          <select
            value={targetNewTable}
            onChange={(e) => setTargetNewTable(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white text-xs outline-none"
          >
            <option value="">-- Pilih Meja Baru --</option>
            {(tables || [])
              .filter((t) => t !== movingOrder.tableNumber)
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirmMoveTable}
            disabled={!targetNewTable}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
          >
            Konfirmasi Pindah ➔
          </button>
        </div>
      </div>
    </div>
  );
};
