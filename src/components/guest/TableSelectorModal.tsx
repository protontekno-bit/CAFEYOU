import React, { useState } from 'react';
import { QUICK_TABLES } from '../../constants/karaoke';

interface TableSelectorModalProps {
  isOpen: boolean;
  onSelectTable: (table: string) => void;
  onClose?: () => void;
  currentTable?: string;
  canClose?: boolean;
  cafeName?: string;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onSelectTable,
  onClose,
  currentTable,
  canClose = false,
  cafeName = 'CAFEYOU',
}) => {
  const [selected, setSelected] = useState<string>(currentTable || 'Meja 1');
  const [customInput, setCustomInput] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalTable = isCustom ? customInput.trim() : selected.trim();
    if (finalTable) {
      onSelectTable(finalTable);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-blue-500/10 relative overflow-hidden animate-scaleUp">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if canClose */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            title="Tutup"
          >
            ✕
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-2xl shadow-lg shadow-blue-500/30 mb-3">
            📍
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Pilih Nomor Meja Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Selamat datang di <strong className="text-blue-400">{cafeName}</strong>! Silakan tentukan tempat duduk Anda untuk memesan lagu.
          </p>
        </div>

        {/* Quick Tables Grid */}
        <div className="space-y-3 mb-6">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pilihan Meja Cepat:
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_TABLES.map((table) => {
              const isCurrent = !isCustom && selected === table;
              return (
                <button
                  key={table}
                  type="button"
                  onClick={() => {
                    setSelected(table);
                    setIsCustom(false);
                  }}
                  className={`py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-[1.02]'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:text-white hover:border-slate-600'
                  }`}
                >
                  {table}
                </button>
              );
            })}
          </div>

          {/* Opsi Ketik Nomor Meja Manual */}
          <div className="pt-2">
            {!isCustom ? (
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className="w-full py-2 text-center text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Nomor meja Anda tidak ada di atas? Ketik manual
              </button>
            ) : (
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                <label className="text-[11px] font-bold text-slate-300">
                  Tuliskan Nomor / Posisi Meja:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Contoh: Meja 10, Sofa 2, Outdoor"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustom(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-6 flex items-start gap-2.5">
          <span className="text-base leading-none">💡</span>
          <p className="text-[11px] text-blue-200/90 leading-relaxed">
            Pastikan nomor meja sesuai tempat duduk Anda agar operator kasir dapat memproses lagu pesanan Anda dengan benar.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isCustom && !customInput.trim()}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          <span>Konfirmasi & Mulai Pilih Lagu</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
