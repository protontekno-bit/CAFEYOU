import React, { useState, useMemo } from 'react';
import { MenuItem } from '../../types';

interface KitchenStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: Record<string, MenuItem>;
  onToggleAvailability: (itemId: string) => void;
}

export const KitchenStockModal: React.FC<KitchenStockModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onToggleAvailability,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'FOOD' | 'DRINK'>('ALL');

  const menuList = useMemo(() => {
    return Object.values(menuItems || {}).filter((it) => {
      const cat = (it.category || '').toUpperCase();
      const isDrink =
        cat.includes('KOPI') ||
        cat.includes('MINUM') ||
        cat.includes('DRINK') ||
        cat === 'NON_KOPI';

      if (activeCategory === 'FOOD' && isDrink) return false;
      if (activeCategory === 'DRINK' && !isDrink) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          it.name.toLowerCase().includes(q) ||
          (it.description && it.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-2xl h-[85vh] max-h-[700px] shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header Modal */}
        <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xl font-bold">
              📦
            </div>
            <div>
              <h2 className="text-base font-black text-white">Kontrol Cepat Stok Menu Dapur</h2>
              <p className="text-xs text-slate-400">
                1-Sentuhan tandai menu yang habis (langsung aktif di HP seluruh tamu)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs Filter */}
          <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeCategory === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveCategory('FOOD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeCategory === 'FOOD'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🍳 Dapur Makanan
            </button>
            <button
              onClick={() => setActiveCategory('DRINK')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeCategory === 'DRINK'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ☕ Bar Minuman
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu makanan / minuman..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List Menu & Toggle Sakelar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {menuList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <span>Tidak ada menu yang cocok dengan pencarian</span>
            </div>
          ) : (
            menuList.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  item.isAvailable !== false
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-red-950/20 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                    {item.image || '🍽️'}
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`text-xs font-black truncate ${
                        item.isAvailable !== false ? 'text-white' : 'line-through text-red-300'
                      }`}
                    >
                      {item.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Tombol Sakelar Status Stok */}
                <button
                  type="button"
                  onClick={() => onToggleAvailability(item.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 active:scale-95 ${
                    item.isAvailable !== false
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  }`}
                >
                  <span>{item.isAvailable !== false ? '🟢' : '🔴'}</span>
                  <span>{item.isAvailable !== false ? 'Tersedia' : 'HABIS (Sold Out)'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
