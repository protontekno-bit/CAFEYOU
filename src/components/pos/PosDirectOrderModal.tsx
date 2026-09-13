import React, { useState, useMemo } from 'react';
import { MenuItem, OrderItem, OrderType, DeliveryPlatform, CafeSettings, TableOrder } from '../../types';

interface PosDirectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: Record<string, MenuItem>;
  tables: string[];
  cafeSettings?: CafeSettings;
  onCreateOrder: (
    tableNumber: string,
    customerName: string,
    items: OrderItem[],
    orderType: OrderType,
    platform?: DeliveryPlatform,
    initialStatus?: 'pending' | 'paid' | 'PREPARING',
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'ONLINE_MERCHANT',
    financials?: {
      subtotal?: number;
      taxAmount?: number;
      serviceAmount?: number;
      roundingAmount?: number;
      finalTotal?: number;
    }
  ) => Promise<TableOrder | null>;
  existingOrdersCount: number;
}

interface CartItemEntry {
  item: MenuItem;
  quantity: number;
  notes: string;
  unitPrice: number;
  selectedOptions?: string[];
}

export const PosDirectOrderModal: React.FC<PosDirectOrderModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  tables,
  cafeSettings,
  onCreateOrder,
  existingOrdersCount,
}) => {
  if (!isOpen) return null;

  // 1. Tipe Pesanan
  const [orderType, setOrderType] = useState<OrderType>('TAKEAWAY');
  const [selectedTable, setSelectedTable] = useState<string>(tables[0] || 'Meja 1');
  const [customTable, setCustomTable] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [deliveryPlatform, setDeliveryPlatform] = useState<DeliveryPlatform>('GOFOOD');
  const [driverOrderRef, setDriverOrderRef] = useState<string>('');

  // 2. Filter & Cari Menu
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // 3. Keranjang Pesanan (Cart)
  const [cart, setCart] = useState<Record<string, CartItemEntry>>({});
  const [configuringItem, setConfiguringItem] = useState<MenuItem | null>(null);
  const [selectedItemOptions, setSelectedItemOptions] = useState<string[]>([]);
  const [itemConfigNotes, setItemConfigNotes] = useState<string>('');

  // 4. Modal Bayar Cepat (Direct Pay)
  const [isQuickPayOpen, setIsQuickPayOpen] = useState<boolean>(false);
  const [quickPayMethod, setQuickPayMethod] = useState<'cash' | 'qris' | 'transfer' | 'ONLINE_MERCHANT'>('cash');
  const [cashAmountReceived, setCashAmountReceived] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Perhitungan Keuangan
  const cartList = Object.values(cart);
  const rawSubtotal = cartList.reduce((sum, c) => sum + (c.unitPrice * c.quantity), 0);

  const isTaxEnabled = cafeSettings?.enableTax !== false && (cafeSettings?.taxPercentage || 0) > 0;
  const taxPercentage = isTaxEnabled ? (cafeSettings?.taxPercentage || 0) : 0;
  const isTaxIncluded = isTaxEnabled && (cafeSettings?.isTaxIncluded ?? false);
  const servicePercentage = cafeSettings?.servicePercentage || 0;

  const estimatedTax = isTaxEnabled && !isTaxIncluded && taxPercentage > 0
    ? Math.round(rawSubtotal * (taxPercentage / 100))
    : 0;

  const estimatedService = servicePercentage > 0
    ? Math.round(rawSubtotal * (servicePercentage / 100))
    : 0;

  const finalTotalAmount = rawSubtotal + estimatedTax + estimatedService;

  // Tambah item ke keranjang
  const handleAddToCart = (item: MenuItem) => {
    if (item.optionGroups && item.optionGroups.length > 0) {
      setConfiguringItem(item);
      setSelectedItemOptions([]);
      setItemConfigNotes('');
      return;
    }

    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [item.id]: { item, quantity: 1, notes: '', unitPrice: item.price },
      };
    });
  };

  const handleSaveConfiguredItem = () => {
    if (!configuringItem) return;
    const cartKey = `${configuringItem.id}-${selectedItemOptions.sort().join('-')}`;

    setCart((prev) => {
      const existing = prev[cartKey];
      if (existing) {
        return {
          ...prev,
          [cartKey]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [cartKey]: {
          item: configuringItem,
          quantity: 1,
          notes: itemConfigNotes.trim(),
          unitPrice: configuringItem.price,
          selectedOptions: selectedItemOptions,
        },
      };
    });

    setConfiguringItem(null);
  };

  const handleDecreaseItem = (cartKey: string) => {
    setCart((prev) => {
      const existing = prev[cartKey];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[cartKey];
        return next;
      }
      return {
        ...prev,
        [cartKey]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const handleIncreaseItem = (cartKey: string) => {
    setCart((prev) => {
      const existing = prev[cartKey];
      if (!existing) return prev;
      return {
        ...prev,
        [cartKey]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  };

  // Submit pesanan
  const handleProcessOrder = async (payNow: boolean) => {
    if (cartList.length === 0) {
      alert('Keranjang pesanan masih kosong. Pilih minimal satu menu.');
      return;
    }

    let finalTableNumber = '';
    let finalCustomerName = '';

    const seq = (existingOrdersCount + 1).toString().padStart(2, '0');

    if (orderType === 'DINE_IN') {
      finalTableNumber = customTable.trim() || selectedTable || 'Meja 1';
      finalCustomerName = customerName.trim() || `Tamu ${finalTableNumber}`;
    } else if (orderType === 'TAKEAWAY') {
      finalTableNumber = `BUNGKUS #${seq}`;
      finalCustomerName = customerName.trim() || `Bawa Pulang (${seq})`;
    } else {
      // ONLINE_DELIVERY
      finalTableNumber = `${deliveryPlatform} #${driverOrderRef.trim() || seq}`;
      finalCustomerName = customerName.trim() ? `${customerName.trim()} (Driver)` : `Driver ${deliveryPlatform}`;
    }

    const orderItems: OrderItem[] = cartList.map((c) => ({
      menuItemId: c.item.id,
      name: c.item.name,
      price: c.unitPrice,
      quantity: c.quantity,
      notes: c.notes || undefined,
      selectedOptions: c.selectedOptions && c.selectedOptions.length > 0 ? c.selectedOptions : undefined,
    }));

    setIsSubmitting(true);
    try {
      const initialStatus = payNow ? 'paid' : 'pending';
      const pMethod = payNow ? quickPayMethod : undefined;

      await onCreateOrder(
        finalTableNumber,
        finalCustomerName,
        orderItems,
        orderType,
        orderType === 'ONLINE_DELIVERY' ? deliveryPlatform : undefined,
        initialStatus,
        pMethod,
        {
          subtotal: rawSubtotal,
          taxAmount: estimatedTax,
          serviceAmount: estimatedService,
          roundingAmount: 0,
          finalTotal: finalTotalAmount,
        }
      );

      onClose();
    } catch (err: any) {
      alert(err?.message || 'Gagal membuat pesanan kasir');
    } finally {
      setIsSubmitting(false);
    }
  };

  // List Menu yang Difilter
  const filteredMenuList = useMemo(() => {
    return Object.values(menuItems || {}).filter((item) => {
      if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-white">
        {/* 1. HEADER MODAL */}
        <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              ➕
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Buat Pesanan Kasir Langsung</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  POS Direct Order
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Input pesanan cepat untuk Makan di Meja, Bawa Pulang (Takeaway), atau Driver Ojol Online.
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

        {/* 2. BODY CONTENT (2 KOLOM: KIRI KATALOG MENU, KANAN RINGKASAN TIKET) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* KOLOM KIRI: PILIH TIPE PESANAN & KATALOG MENU */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800/80 p-4 sm:p-5 overflow-y-auto custom-scrollbar">
            {/* TABS TIPE PESANAN */}
            <div className="space-y-3 mb-4">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                1. Pilih Tipe Layanan Pesanan:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    orderType === 'DINE_IN'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl">🍽️</span>
                  <span className="text-xs font-black">Makan di Meja</span>
                  <span className="text-[10px] text-slate-400">Dine-In</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-md shadow-orange-500/10'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl">🥡</span>
                  <span className="text-xs font-black">Bawa Pulang</span>
                  <span className="text-[10px] text-slate-400">Takeaway / Walk-in</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('ONLINE_DELIVERY')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    orderType === 'ONLINE_DELIVERY'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl">🛵</span>
                  <span className="text-xs font-black">Online Delivery</span>
                  <span className="text-[10px] text-slate-400">GoFood/Grab/Shopee</span>
                </button>
              </div>
            </div>

            {/* FORM IDENTITAS SESUAI TIPE */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl mb-4 space-y-3">
              {orderType === 'DINE_IN' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Nomor Meja:</label>
                    <select
                      value={selectedTable}
                      onChange={(e) => setSelectedTable(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      {tables.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Nama Tamu / Pelanggan:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {orderType === 'TAKEAWAY' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Label Antrean Bawa Pulang:</label>
                    <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-orange-400">
                      BUNGKUS / TAKEAWAY
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Nama Pelanggan / Panggilan:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Mas Joko (Bungkus)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {orderType === 'ONLINE_DELIVERY' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Platform Ojol:</label>
                    <select
                      value={deliveryPlatform}
                      onChange={(e) => setDeliveryPlatform(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    >
                      <option value="GOFOOD">🟢 GoFood</option>
                      <option value="GRABFOOD">🟢 GrabFood</option>
                      <option value="SHOPEEFOOD">🟠 ShopeeFood</option>
                      <option value="WA_DELIVERY">📱 Kurir WA / Internal</option>
                      <option value="OTHER">🛵 Lain-lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">No. Resi / ID Pesanan:</label>
                    <input
                      type="text"
                      value={driverOrderRef}
                      onChange={(e) => setDriverOrderRef(e.target.value)}
                      placeholder="Contoh: GF-8812"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Nama Driver / Pemesan:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Contoh: Pak Herman"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SEARCH & KATEGORI MENU */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari makanan atau minuman..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  />
                  <span className="absolute left-2.5 top-2 text-xs text-slate-500">🔍</span>
                </div>
              </div>

              {/* Pill Kategori */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'KOPI', label: 'Kopi' },
                  { id: 'NON_KOPI', label: 'Minuman Segar' },
                  { id: 'MAKANAN', label: 'Makanan Utama' },
                  { id: 'SNACK', label: 'Camilan' },
                  { id: 'PAKET', label: 'Paket' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      activeCategory === c.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DAFTAR ITEM MENU */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {filteredMenuList.map((item) => {
                const inCartTotal = cartList
                  .filter((c) => c.item.id === item.id)
                  .reduce((sum, c) => sum + c.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                        {item.imageUrl && item.imageUrl.startsWith('http') ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          item.imageUrl || '🍽️'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                        <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                          Rp {item.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {inCartTotal > 0 && (
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                          {inCartTotal}x
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow transition-all active:scale-95"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KOLOM KANAN: RINGKASAN TIKET PESANAN & CHECKOUT */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-950/95 flex flex-col justify-between p-4 sm:p-5">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>🧾</span>
                  <span>Keranjang Kasir ({cartList.reduce((s, c) => s + c.quantity, 0)} Item)</span>
                </span>
                {cartList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart({})}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* LIST ITEMS DALAM KERANJANG */}
              <div className="mt-3 space-y-2 max-h-64 md:max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {cartList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    Belum ada menu yang dipilih. Klik tombol <strong className="text-amber-400">+ Tambah</strong> pada menu di sebelah kiri.
                  </div>
                ) : (
                  cartList.map((entry, idx) => {
                    const cartKey = Object.keys(cart)[idx];
                    return (
                      <div
                        key={cartKey}
                        className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5"
                      >
                        <div className="flex justify-between items-start text-xs">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold text-slate-200 block truncate">{entry.item.name}</span>
                            {entry.selectedOptions && entry.selectedOptions.length > 0 && (
                              <span className="text-[10px] text-amber-300/80 block">
                                Opsi: {entry.selectedOptions.join(', ')}
                              </span>
                            )}
                            {entry.notes && (
                              <span className="text-[10px] text-slate-400 italic block">
                                Catatan: {entry.notes}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-amber-400 font-bold shrink-0">
                            Rp {(entry.unitPrice * entry.quantity).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Stepper Jumlah */}
                        <div className="flex justify-end items-center gap-2 pt-1 border-t border-slate-800/60">
                          <button
                            type="button"
                            onClick={() => handleDecreaseItem(cartKey)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-bold text-white px-1">
                            {entry.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncreaseItem(cartKey)}
                            className="w-5 h-5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RINCIAN SUB-TOTAL & TOMBOL AKSI */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Menu:</span>
                  <span className="font-mono text-slate-300">Rp {rawSubtotal.toLocaleString('id-ID')}</span>
                </div>
                {estimatedTax > 0 && (
                  <div className="flex justify-between text-amber-400/90 text-[11px]">
                    <span>Pajak Resto (PB1 {taxPercentage}%):</span>
                    <span className="font-mono">+Rp {estimatedTax.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {estimatedService > 0 && (
                  <div className="flex justify-between text-blue-400/90 text-[11px]">
                    <span>Biaya Layanan ({servicePercentage}%):</span>
                    <span className="font-mono">+Rp {estimatedService.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-black text-sm pt-1.5 border-t border-slate-800">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-amber-400 text-base">
                    Rp {finalTotalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* 2 TOMBOL AKSI UTAMA */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={cartList.length === 0 || isSubmitting}
                  onClick={() => handleProcessOrder(false)}
                  className="py-2.5 px-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all text-center"
                  title="Pesanan dikirim ke dapur dan dibayar saat makanan siap / selesai"
                >
                  🍳 Kirim Dapur (Bayar Nanti)
                </button>

                <button
                  type="button"
                  disabled={cartList.length === 0 || isSubmitting}
                  onClick={() => setIsQuickPayOpen(true)}
                  className="py-2.5 px-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all text-center active:scale-95"
                  title="Bayar lunas di muka (cocok untuk Takeaway & Ojol)"
                >
                  💰 Bayar Langsung
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MODAL BAYAR LANGSUNG (QUICK PAY) */}
        {isQuickPayOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>💰</span>
                  <span>Pilih Metode Pembayaran Langsung</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQuickPayOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl text-center border border-slate-800">
                <span className="text-xs text-slate-400 block">Total yang Harus Dibayar:</span>
                <span className="text-2xl font-black font-mono text-amber-400">
                  Rp {finalTotalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Opsi Metode Bayar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickPayMethod('cash')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    quickPayMethod === 'cash'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  💵 Tunai / Cash
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPayMethod('qris')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    quickPayMethod === 'qris'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  📱 QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPayMethod('transfer')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    quickPayMethod === 'transfer'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🏦 Transfer / DANA
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPayMethod('ONLINE_MERCHANT')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    quickPayMethod === 'ONLINE_MERCHANT'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  🛵 Online Merchant (Ojol)
                </button>
              </div>

              {/* Input Uang Tunai jika Cash */}
              {quickPayMethod === 'cash' && (
                <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-[11px] font-bold text-slate-400 block">Uang Diterima dari Pelanggan:</label>
                  <input
                    type="number"
                    value={cashAmountReceived || ''}
                    onChange={(e) => setCashAmountReceived(Number(e.target.value))}
                    placeholder={`Contoh: ${finalTotalAmount}`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-emerald-500"
                  />
                  {cashAmountReceived > 0 && (
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-slate-400">Kembalian:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        Rp {Math.max(0, cashAmountReceived - finalTotalAmount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProcessOrder(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
              >
                {isSubmitting ? 'Memproses...' : '✅ Konfirmasi Pembayaran & Kirim ke Dapur'}
              </button>
            </div>
          </div>
        )}

        {/* 4. MODAL KONFIGURASI OPSI ITEM */}
        {configuringItem && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-sm font-black text-white">Pilih Varian: {configuringItem.name}</h3>
              {configuringItem.optionGroups?.map((grp, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">{grp.title || 'Varian'}:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {grp.options.map((opt) => {
                      const isSelected = selectedItemOptions.includes(opt.name);
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedItemOptions((prev) => prev.filter((o) => o !== opt.name));
                            } else {
                              setSelectedItemOptions((prev) => [...prev, opt.name]);
                            }
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Catatan Khusus:</label>
                <input
                  type="text"
                  value={itemConfigNotes}
                  onChange={(e) => setItemConfigNotes(e.target.value)}
                  placeholder="Misal: Kurang manis, ekstra es"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveConfiguredItem}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl"
              >
                Simpan & Tambah ke Keranjang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
