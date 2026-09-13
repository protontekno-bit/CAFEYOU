import React from 'react';
import { MenuItem } from '../../types';

export interface GuestItemOptionsModalProps {
  configuringMenuItem: MenuItem | null;
  onClose: () => void;
  selectedSingleOptions: Record<string, string>;
  setSelectedSingleOptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  selectedMultipleOptions: Record<string, string[]>;
  setSelectedMultipleOptions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  onConfirmOptionSelection: () => void;
}

export const GuestItemOptionsModal: React.FC<GuestItemOptionsModalProps> = ({
  configuringMenuItem,
  onClose,
  selectedSingleOptions,
  setSelectedSingleOptions,
  selectedMultipleOptions,
  setSelectedMultipleOptions,
  onConfirmOptionSelection,
}) => {
  if (!configuringMenuItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl overflow-hidden shrink-0">
              {configuringMenuItem.imageUrl && configuringMenuItem.imageUrl.startsWith('http') ? (
                <img
                  src={configuringMenuItem.imageUrl}
                  alt={configuringMenuItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                configuringMenuItem.imageUrl || '🍽️'
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-black text-white">{configuringMenuItem.name}</h3>
                {configuringMenuItem.isBestSeller && (
                  <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⭐ Best Seller
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-amber-400 mt-0.5">
                Dasar: Rp {configuringMenuItem.price.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Option Groups List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar">
          {configuringMenuItem.optionGroups?.map((group) => {
            const isMulti = group.type === 'multiple';
            const currentSingle = selectedSingleOptions[group.title];
            const currentMulti = selectedMultipleOptions[group.title] || [];

            return (
              <div
                key={group.title}
                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-white">{group.title}</span>
                    {group.required && (
                      <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                        Wajib
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {isMulti ? 'Bisa pilih lebih dari satu' : 'Pilih salah satu'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.options.map((opt) => {
                    const isSelected = isMulti
                      ? currentMulti.includes(opt.name)
                      : currentSingle === opt.name;

                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => {
                          if (isMulti) {
                            setSelectedMultipleOptions((prev) => {
                              const list = prev[group.title] || [];
                              const nextList = list.includes(opt.name)
                                ? list.filter((n) => n !== opt.name)
                                : [...list, opt.name];
                              return { ...prev, [group.title]: nextList };
                            });
                          } else {
                            setSelectedSingleOptions((prev) => ({
                              ...prev,
                              [group.title]: opt.name,
                            }));
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-4 h-4 rounded-${isMulti ? 'md' : 'full'} border flex items-center justify-center text-[10px] ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                                : 'border-slate-700 bg-slate-950'
                            }`}
                          >
                            {isSelected ? (isMulti ? '✓' : '•') : ''}
                          </span>
                          <span>{opt.name}</span>
                        </div>
                        {opt.extraPrice && opt.extraPrice > 0 ? (
                          <span className="font-mono text-amber-400 font-bold text-[11px]">
                            +Rp {opt.extraPrice.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Gratis</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with calculated price & Add to Cart button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Total Porsi
            </span>
            <span className="text-base font-black text-amber-400">
              Rp{' '}
              {(() => {
                let total = configuringMenuItem.price;
                configuringMenuItem.optionGroups?.forEach((g) => {
                  if (g.type === 'multiple') {
                    const selected = selectedMultipleOptions[g.title] || [];
                    selected.forEach((name) => {
                      const o = g.options.find((x) => x.name === name);
                      if (o?.extraPrice) total += o.extraPrice;
                    });
                  } else {
                    const name = selectedSingleOptions[g.title];
                    const o = g.options.find((x) => x.name === name);
                    if (o?.extraPrice) total += o.extraPrice;
                  }
                });
                return total.toLocaleString('id-ID');
              })()}
            </span>
          </div>
          <button
            onClick={onConfirmOptionSelection}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <span>🛒</span>
            <span>Tambahkan ke Pesanan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
