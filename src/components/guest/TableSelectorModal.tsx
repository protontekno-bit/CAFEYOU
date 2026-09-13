import React, { useState, useEffect, useRef } from 'react';
import { QUICK_TABLES } from '../../constants/karaoke';

interface TableSelectorModalProps {
  isOpen: boolean;
  onSelectTable: (table: string) => void;
  onClose?: () => void;
  currentTable?: string;
  canClose?: boolean;
  cafeName?: string;
  tables?: string[];
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onSelectTable,
  onClose,
  currentTable,
  canClose = false,
  cafeName = 'CAFEYOU',
  tables,
}) => {
  const availableTables = tables && tables.length > 0 ? tables : QUICK_TABLES;
  const [selected, setSelected] = useState<string>(currentTable || availableTables[0] || 'Meja 1');
  const [customInput, setCustomInput] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const wasOpenRef = useRef<boolean>(false);

  // Inisialisasi HANYA saat modal pertama kali dibuka (transisi isOpen: false -> true)
  // Jangan reset pilihan user saat re-render berikutnya ketika isOpen masih true!
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (currentTable) {
        if (availableTables.includes(currentTable)) {
          setSelected(currentTable);
          setIsCustom(false);
          setCustomInput('');
        } else {
          setSelected(currentTable);
          setIsCustom(true);
          setCustomInput(currentTable);
        }
      } else {
        setSelected(availableTables[0] || 'Meja 1');
        setIsCustom(false);
        setCustomInput('');
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, currentTable, availableTables]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalTable = isCustom ? customInput.trim() : selected.trim();
    if (finalTable) {
      onSelectTable(finalTable);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl shadow-blue-500/10 relative overflow-hidden max-h-[92vh] flex flex-col animate-scaleUp">
        {/* Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if canClose */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors z-10"
            title="Tutup"
          >
            ✕
          </button>
        )}

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 custom-scrollbar space-y-4 sm:space-y-5 flex-1">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-xl sm:text-2xl shadow-lg shadow-blue-500/30 mb-2 sm:mb-3">
              📍
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Pilih Nomor Meja Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Selamat datang di <strong className="text-blue-400">{cafeName}</strong>! Silakan tentukan tempat duduk Anda.
            </p>
          </div>

          {/* Quick Tables Grid */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pilihan Meja Cepat:
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {availableTables.map((table) => {
                const isCurrent = !isCustom && selected === table;
                return (
                  <button
                    key={table}
                    type="button"
                    onClick={() => {
                      setSelected(table);
                      setIsCustom(false);
                    }}
                    className={`py-2.5 sm:py-3 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all border active:scale-95 ${
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
            <div className="pt-1">
              {!isCustom ? (
                <button
                  type="button"
                  onClick={() => setIsCustom(true)}
                  className="w-full py-1.5 text-center text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirm();
                        }
                      }}
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
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-2.5">
            <span className="text-base leading-none">💡</span>
            <p className="text-[11px] text-blue-200/90 leading-relaxed">
              Pastikan nomor meja sesuai tempat duduk Anda agar operator kasir dapat memproses pesanan Anda dengan benar.
            </p>
          </div>
        </div>

        {/* Submit Button (Fixed at Bottom of Modal) */}
        <div className="pt-3 sm:pt-4 border-t border-slate-800/80 mt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isCustom && !customInput.trim()}
            className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Konfirmasi {isCustom ? (customInput.trim() || 'Meja') : selected}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
