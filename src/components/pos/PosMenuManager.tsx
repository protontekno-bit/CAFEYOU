import React, { useState } from 'react';
import { MenuItem, MenuCategory, MenuItemOptionGroup } from '../../types';

interface PosMenuManagerProps {
  menuItems: Record<string, MenuItem>;
  onToggleAvailability: (id: string) => void;
  onQuickUpdatePrice: (id: string, newPrice: number) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onResetToDefault: () => void;
}

const CATEGORIES: { id: MenuCategory | 'ALL'; label: string; icon: string }[] = [
  { id: 'ALL', label: 'Semua Kategori', icon: '📋' },
  { id: 'Minuman', label: 'Kopi & Minuman', icon: '☕' },
  { id: 'Makanan', label: 'Makanan Utama', icon: '🍛' },
  { id: 'Snack', label: 'Snack & Camilan', icon: '🍟' },
  { id: 'Paket', label: 'Paket Combo', icon: '🍱' },
];

export const PosMenuManager: React.FC<PosMenuManagerProps> = ({
  menuItems,
  onToggleAvailability,
  onQuickUpdatePrice,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onResetToDefault,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'ALL'>('ALL');

  // Modal State untuk Tambah / Edit Menu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<MenuCategory>('Minuman');
  const [formPrice, setFormPrice] = useState<number>(15000);
  const [formEmoji, setFormEmoji] = useState('☕');
  const [formDescription, setFormDescription] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsPromo, setFormIsPromo] = useState(false);
  const [formOptionGroups, setFormOptionGroups] = useState<MenuItemOptionGroup[]>([]);

  // Quick Price Edit inline state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceVal, setEditingPriceVal] = useState<number>(0);

  const menuList = Object.values(menuItems || {});

  const filteredItems = menuList.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Minuman');
    setFormPrice(15000);
    setFormEmoji('☕');
    setFormDescription('');
    setFormIsAvailable(true);
    setFormIsBestSeller(false);
    setFormIsPromo(false);
    setFormOptionGroups([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormEmoji(item.image || '☕');
    setFormDescription(item.description || '');
    setFormIsAvailable(item.isAvailable);
    setFormIsBestSeller(!!item.isBestSeller);
    setFormIsPromo(!!item.isPromo);
    setFormOptionGroups(item.optionGroups ? JSON.parse(JSON.stringify(item.optionGroups)) : []);
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingItem) {
      onUpdateMenuItem({
        ...editingItem,
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        image: formEmoji.trim() || '☕',
        description: formDescription.trim(),
        isAvailable: formIsAvailable,
        isBestSeller: formIsBestSeller,
        isPromo: formIsPromo,
        optionGroups: formOptionGroups.length > 0 ? formOptionGroups : undefined,
      });
    } else {
      onAddMenuItem({
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice) || 0,
        image: formEmoji.trim() || '☕',
        description: formDescription.trim(),
        isAvailable: formIsAvailable,
        isBestSeller: formIsBestSeller,
        isPromo: formIsPromo,
        optionGroups: formOptionGroups.length > 0 ? formOptionGroups : undefined,
      });
    }
    setIsModalOpen(false);
  };

  // Preset Option Template Applier
  const applyOptionPreset = (preset: 'coffee' | 'food' | 'spicy') => {
    if (preset === 'coffee') {
      setFormOptionGroups([
        {
          title: 'Suhu',
          type: 'single',
          options: [{ name: 'Dingin (Ice)' }, { name: 'Panas (Hot)' }],
        },
        {
          title: 'Level Gula',
          type: 'single',
          options: [{ name: 'Normal' }, { name: 'Less Sugar' }, { name: 'Tanpa Gula' }],
        },
        {
          title: 'Ekstra Topping',
          type: 'multiple',
          options: [
            { name: 'Extra Shot Espresso', extraPrice: 5000 },
            { name: 'Sirup Karamel', extraPrice: 4000 },
          ],
        },
      ]);
    } else if (preset === 'food') {
      setFormOptionGroups([
        {
          title: 'Level Pedas',
          type: 'single',
          options: [{ name: 'Tidak Pedas' }, { name: 'Sedang' }, { name: 'Ekstra Pedas' }],
        },
        {
          title: 'Tambahan Lauk',
          type: 'multiple',
          options: [
            { name: 'Telur Ceplok', extraPrice: 4000 },
            { name: 'Kerupuk Ekstra', extraPrice: 2000 },
          ],
        },
      ]);
    } else if (preset === 'spicy') {
      setFormOptionGroups([
        {
          title: 'Level Pedas',
          type: 'single',
          options: [{ name: 'Sedang' }, { name: 'Pedas Gila' }],
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar Kontrol Menu */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800/80">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>🍽️</span>
            <span>Katalog & Pengelolaan Menu POS</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Atur ketersediaan menu (1-sentuhan), ubah harga, atau tambahkan varian kopi & makanan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>Tambah Menu Baru</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset seluruh daftar menu ke 15 menu standar bawaan CAFEYOU?')) {
                onResetToDefault();
              }
            }}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Kembalikan ke Menu Bawaan"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Filter Kategori & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Kategori Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Input Pencarian */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama menu..."
          className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 w-56"
        />
      </div>

      {/* Grid Kartu Menu */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-12 text-center text-slate-500">
          <span className="text-4xl">🔍</span>
          <p className="text-xs font-bold text-slate-400 mt-2">Menu tidak ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isEditingPrice = editingPriceId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-slate-900/90 rounded-3xl border p-4 flex flex-col justify-between transition-all shadow-lg ${
                  item.isAvailable
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-red-500/30 bg-slate-900/50 opacity-75'
                }`}
              >
                <div>
                  {/* Baris Atas: Emoji + Badge Best Seller + 1-Tap Toggle */}
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{item.image || '☕'}</span>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          {item.category}
                        </span>
                        {item.isBestSeller && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black rounded-full uppercase inline-block">
                            ⭐ Best Seller
                          </span>
                        )}
                        {item.isPromo && (
                          <span className="px-1.5 py-0.2 bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-black rounded-full uppercase inline-block ml-1">
                            🎉 Promo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SAKELAR CEPAT 1-SENTUHAN (HABIS / TERSEDIA) */}
                    <button
                      onClick={() => onToggleAvailability(item.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all border flex items-center gap-1 shadow-sm active:scale-95 ${
                        item.isAvailable
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                      }`}
                      title={item.isAvailable ? 'Klik untuk tandai HABIS' : 'Klik untuk tandai TERSEDIA'}
                    >
                      <span>{item.isAvailable ? '🟢' : '🔴'}</span>
                      <span>{item.isAvailable ? 'Tersedia' : 'Habis'}</span>
                    </button>
                  </div>

                  {/* Judul & Deskripsi */}
                  <h3 className="text-sm font-black text-white">{item.name}</h3>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Indikator Varian yang Terpasang */}
                  {item.optionGroups && item.optionGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.optionGroups.map((g, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded text-[9px] font-mono"
                        >
                          {g.title} ({g.options.length})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Kartu: Quick Price & Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center">
                  {/* Quick Edit Price */}
                  {isEditingPrice ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editingPriceVal}
                        onChange={(e) => setEditingPriceVal(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-slate-950 border border-amber-500 rounded-lg text-xs font-mono font-bold text-white outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          onQuickUpdatePrice(item.id, editingPriceVal);
                          setEditingPriceId(null);
                        }}
                        className="p-1 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingPriceId(null)}
                        className="p-1 bg-slate-800 text-slate-400 rounded-lg text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingPriceId(item.id);
                        setEditingPriceVal(item.price);
                      }}
                      className="cursor-pointer group flex items-center gap-1"
                      title="Klik untuk ubah harga cepat"
                    >
                      <span className="text-sm font-black font-mono text-amber-400 group-hover:text-amber-300">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-300">✏️</span>
                    </div>
                  )}

                  {/* Tombol Aksi Edit & Hapus */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                      title="Edit Menu & Varian"
                    >
                      ⚙️
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Hapus menu "${item.name}"?`)) {
                          onDeleteMenuItem(item.id);
                        }
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-lg text-xs font-bold transition-all"
                      title="Hapus Menu"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT MENU LENGKAP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>{editingItem ? '⚙️ Edit Menu F&B' : '➕ Tambah Menu Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Nama & Emoji */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block font-bold text-slate-300 mb-1">Nama Menu:</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Kopi Susu Creamy"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Ikon / Emoji:</label>
                  <input
                    type="text"
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    placeholder="☕"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white text-center text-base outline-none"
                  />
                </div>
              </div>

              {/* Kategori & Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kategori:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MenuCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white outline-none"
                  >
                    <option value="Minuman">Kopi & Minuman</option>
                    <option value="Makanan">Makanan Utama</option>
                    <option value="Snack">Snack & Camilan</option>
                    <option value="Paket">Paket Hemat</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Harga Satuan (Rp):</label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white font-mono font-bold outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Deskripsi Singkat (Opsional):</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ceritakan racikan rasa atau komposisi menu..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white outline-none resize-none"
                />
              </div>

              {/* Checkboxes: Best Seller & Promo */}
              <div className="flex flex-wrap gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsBestSeller}
                    onChange={(e) => setFormIsBestSeller(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="font-bold text-amber-300">⭐ Tandai Best Seller (Rekomendasi)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPromo}
                    onChange={(e) => setFormIsPromo(e.target.checked)}
                    className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span className="font-bold text-red-300">🎉 Tandai Promo Spesial</span>
                </label>
              </div>

              {/* TEMPLATE OPSI VARIAN CEPAT */}
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Opsi Varian Tamu ({formOptionGroups.length} Grup):
                  </span>
                  {formOptionGroups.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormOptionGroups([])}
                      className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                    >
                      Hapus Semua Varian
                    </button>
                  )}
                </div>

                {/* Tombol Pasang Template Cepat */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyOptionPreset('coffee')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700"
                  >
                    + Template Kopi (Suhu, Gula, Extra Shot)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyOptionPreset('food')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700"
                  >
                    + Template Makanan (Pedas, Telur)
                  </button>
                </div>

                {/* Pratinjau Grup Varian */}
                {formOptionGroups.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    {formOptionGroups.map((g, gIdx) => (
                      <div key={gIdx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-amber-400">{g.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {g.type === 'multiple' ? 'Pilih Banyak (Checkbox)' : 'Pilih Satu (Radio)'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {g.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className="px-2 py-0.5 bg-slate-950 rounded border border-slate-750 text-slate-300"
                            >
                              {opt.name}
                              {opt.extraPrice ? ` (+Rp ${opt.extraPrice.toLocaleString('id-ID')})` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol Simpan */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  Simpan Menu ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
