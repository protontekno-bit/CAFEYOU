import React from 'react';
import { MenuItem, CafeSettings } from '../../types';

export interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  customerName: string;
  setCustomerName: (name: string) => void;
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
  onRemoveFromCart: (cartKey: string) => void;
  onUpdateCartQuantity: (cartKey: string, delta: number) => void;
  onUpdateCartNotes: (cartKey: string, notes: string) => void;
  cartTotalPrice: number;
  guestTaxRate: number;
  guestServiceRate: number;
  isTaxPlus: boolean;
  cafeSettings?: CafeSettings;
  orderSubmitting: boolean;
  onSubmitOrder: (e: React.FormEvent) => void;
}

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  customerName,
  setCustomerName,
  cart,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onUpdateCartNotes,
  cartTotalPrice,
  guestTaxRate,
  guestServiceRate,
  isTaxPlus,
  cafeSettings,
  orderSubmitting,
  onSubmitOrder,
}) => {
  if (!isOpen) return null;

  const estTax = Math.round((cartTotalPrice * guestTaxRate) / 100);
  const estServ = Math.round((cartTotalPrice * guestServiceRate) / 100);
  const estTotal = cartTotalPrice + estTax + estServ;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🛒 Konfirmasi Pesanan</span>
              <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-black">
                {tableNumber}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pesanan akan langsung diteruskan ke kasir & dapur
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Customer Name Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300">
            Nama Pemesan (opsional):
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={`Contoh: Budi (${tableNumber})`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* List of items in cart */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {Object.entries(cart).map(([cartKey, { item, quantity, notes, unitPrice, selectedOptions }]) => {
            const effectivePrice = unitPrice || item.price;
            return (
              <div
                key={cartKey}
                className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-bold text-white">{item.name}</h5>
                    <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                      Rp {effectivePrice.toLocaleString('id-ID')}
                    </div>
                    {selectedOptions && selectedOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedOptions.map((opt, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] rounded font-medium"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1 shrink-0">
                    <button
                      onClick={() => onRemoveFromCart(cartKey)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold text-white px-1">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateCartQuantity(cartKey, 1)}
                      className="w-5 h-5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Notes input */}
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => onUpdateCartNotes(cartKey, e.target.value)}
                  placeholder="Catatan (misal: pedas sedang, es sedikit)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                />
              </div>
            );
          })}
        </div>

        {/* Total & Submit Button */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="space-y-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            {isTaxPlus && (
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Subtotal Makanan & Minuman:</span>
                <span className="font-mono text-slate-300">
                  Rp {cartTotalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {estTax > 0 && (
              <div className="flex justify-between items-center text-[11px] text-amber-400">
                <span>Pajak Restoran (PB1 {guestTaxRate}%):</span>
                <span className="font-mono">+Rp {estTax.toLocaleString('id-ID')}</span>
              </div>
            )}
            {estServ > 0 && (
              <div className="flex justify-between items-center text-[11px] text-blue-400">
                <span>Biaya Layanan ({guestServiceRate}%):</span>
                <span className="font-mono">+Rp {estServ.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
              <div>
                <span className="text-slate-300 font-bold block">
                  {isTaxPlus ? 'Estimasi Total Pembayaran:' : 'Total Pembayaran Meja (Nett):'}
                </span>
                {cafeSettings?.enableTax !== false && (cafeSettings?.taxPercentage || 0) > 0 && cafeSettings?.isTaxIncluded && (
                  <span className="text-[10px] text-emerald-400 font-medium">
                    ✓ Termasuk PB1 ({cafeSettings.taxPercentage}%)
                  </span>
                )}
              </div>
              <span className="text-base font-black text-amber-400 font-mono">
                Rp {estTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
            >
              Kembali
            </button>
            <button
              type="button"
              disabled={orderSubmitting || Object.keys(cart).length === 0}
              onClick={onSubmitOrder}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{orderSubmitting ? 'Mengirim...' : 'Kirim ke Dapur ➔'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
