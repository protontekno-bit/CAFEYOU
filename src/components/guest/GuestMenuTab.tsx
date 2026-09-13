import React from 'react';
import { MenuItem, MenuCategory } from '../../types';

export interface GuestMenuTabProps {
  fnbSearch: string;
  setFnbSearch: (search: string) => void;
  fnbCategory: MenuCategory | 'ALL';
  setFnbCategory: (category: MenuCategory | 'ALL') => void;
  menuItems?: Record<string, MenuItem>;
  cart: Record<
    string,
    {
      item: MenuItem;
      quantity: number;
      notes: string;
      selectedOptions?: string[];
      unitPrice?: number;
    }
  >;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (cartKey: string) => void;
  onOpenConfigureItem: (item: MenuItem) => void;
}

export const GuestMenuTab: React.FC<GuestMenuTabProps> = ({
  fnbSearch,
  setFnbSearch,
  fnbCategory,
  setFnbCategory,
  menuItems,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenConfigureItem,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header / Search */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={fnbSearch}
            onChange={(e) => setFnbSearch(e.target.value)}
            placeholder="Cari makanan atau minuman..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500 shadow-inner"
          />
          <span className="absolute left-3 top-2.5 text-sm text-slate-500">🔍</span>
        </div>

        {/* Category Pills (Selaras dengan Katalog POS) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: 'ALL', label: 'Semua', icon: '📋' },
              { id: 'Minuman', label: 'Kopi & Minuman', icon: '☕' },
              { id: 'Makanan', label: 'Makanan Utama', icon: '🍛' },
              { id: 'Snack', label: 'Snack & Camilan', icon: '🍟' },
              { id: 'Paket', label: 'Paket Combo', icon: '🍱' },
            ] as const
          ).map((cat) => {
            const isSelected =
              fnbCategory === cat.id ||
              (cat.id === 'ALL' && fnbCategory === 'ALL') ||
              (cat.id === 'Minuman' && (fnbCategory === 'KOPI' || fnbCategory === 'NON_KOPI' || fnbCategory === 'Kopi' || fnbCategory === 'Minuman')) ||
              (cat.id === 'Makanan' && (fnbCategory === 'MAKANAN' || fnbCategory === 'Makanan')) ||
              (cat.id === 'Snack' && (fnbCategory === 'SNACK' || fnbCategory === 'Snack')) ||
              (cat.id === 'Paket' && (fnbCategory === 'PAKET' || fnbCategory === 'Paket'));

            return (
              <button
                key={cat.id}
                onClick={() => setFnbCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="space-y-2.5">
        {Object.values(menuItems || {})
          .filter((item) => {
            if (fnbCategory !== 'ALL') {
              const itemCat = (item.category || '').toUpperCase();
              const selCat = (fnbCategory || '').toUpperCase();
              if (itemCat !== selCat) {
                const isDrinkMatch = (selCat === 'MINUMAN' || selCat === 'KOPI' || selCat === 'NON_KOPI') && (itemCat === 'MINUMAN' || itemCat === 'KOPI' || itemCat === 'NON_KOPI');
                const isFoodMatch = (selCat === 'MAKANAN') && (itemCat === 'MAKANAN');
                const isSnackMatch = (selCat === 'SNACK') && (itemCat === 'SNACK');
                const isComboMatch = (selCat === 'PAKET') && (itemCat === 'PAKET');
                if (!isDrinkMatch && !isFoodMatch && !isSnackMatch && !isComboMatch) {
                  return false;
                }
              }
            }
            if (fnbSearch.trim()) {
              const q = fnbSearch.toLowerCase();
              return (
                item.name.toLowerCase().includes(q) ||
                (item.description && item.description.toLowerCase().includes(q))
              );
            }
            return true;
          })
          .map((item) => {
            const inCartQty = Object.values(cart)
              .filter((c) => c.item.id === item.id)
              .reduce((sum, c) => sum + c.quantity, 0);
            const hasOptions = Boolean(item.optionGroups && item.optionGroups.length > 0);

            return (
              <div
                key={item.id}
                className={`p-3.5 bg-slate-900/80 border rounded-2xl flex items-center justify-between gap-3 transition-all ${
                  item.isAvailable
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/40 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl shrink-0 overflow-hidden shadow-inner">
                    {item.imageUrl && (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('data:')) ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{item.image || item.imageUrl || '☕'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                      {item.isBestSeller && (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ⭐ Best Seller
                        </span>
                      )}
                      {item.isPromo && (
                        <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          🎉 Promo
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <div className="text-xs font-black text-amber-400 mt-1">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Add to Cart or Stepper */}
                <div className="shrink-0">
                  {!item.isAvailable ? (
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                      Habis
                    </span>
                  ) : hasOptions ? (
                    <button
                      onClick={() => onOpenConfigureItem(item)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <span>+</span>
                      <span>{inCartQty > 0 ? `Opsi (${inCartQty})` : 'Pilih Opsi'}</span>
                    </button>
                  ) : inCartQty > 0 ? (
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl p-1">
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-amber-400 px-1">
                        {inCartQty}
                      </span>
                      <button
                        onClick={() => onAddToCart(item)}
                        className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(item)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span>+</span>
                      <span>Pesan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
