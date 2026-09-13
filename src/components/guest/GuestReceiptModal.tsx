import React from 'react';
import { TableOrder, CafeSettings } from '../../types';

export interface GuestReceiptModalProps {
  order: TableOrder | null;
  onClose: () => void;
  cafeSettings?: CafeSettings;
}

export const GuestReceiptModal: React.FC<GuestReceiptModalProps> = ({
  order,
  onClose,
  cafeSettings,
}) => {
  if (!order) return null;

  const isPaid = order.status?.toLowerCase() === 'paid';
  const rawSubtotal = order.items.reduce(
    (sum, it) => sum + (it.isVoided ? 0 : it.price * (it.quantity ?? it.qty ?? 1)),
    0
  );
  const subtotal = order.subtotal || rawSubtotal;
  const isTaxEnabled = cafeSettings?.enableTax !== false && (cafeSettings?.taxPercentage || 0) > 0;
  const isTaxPlus = isTaxEnabled && cafeSettings?.isTaxIncluded === false;
  const taxRate = isTaxPlus ? (cafeSettings?.taxPercentage || 0) : 0;
  const serviceRate = cafeSettings?.servicePercentage || 0;

  const taxAmount =
    order.taxAmount !== undefined
      ? order.taxAmount
      : isTaxPlus
      ? Math.round((subtotal * taxRate) / 100)
      : 0;

  const serviceAmount =
    order.serviceAmount !== undefined
      ? order.serviceAmount
      : Math.round((subtotal * serviceRate) / 100);

  const roundingAmount = order.roundingAmount || 0;
  const finalTotal =
    order.totalAmount || subtotal + taxAmount + serviceAmount + roundingAmount;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp text-slate-200 text-left">
          {/* Header Nota */}
          <div className="text-center border-b border-dashed border-slate-750 pb-4 space-y-1">
            <span className="text-2xl">☕</span>
            <h3 className="text-base font-black text-white tracking-wide uppercase">
              {cafeSettings?.name || 'CAFEYOU'}
            </h3>
            {cafeSettings?.tagline && (
              <p className="text-[11px] text-slate-400 italic">{cafeSettings.tagline}</p>
            )}
            <div className="pt-2 text-[10px] text-slate-400 font-mono space-y-0.5">
              <div>No. Order: #{order.id.slice(-8).toUpperCase()}</div>
              <div>
                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                •{' '}
                {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div>
                Meja: <strong className="text-white">{order.tableNumber}</strong> ({order.customerName})
              </div>
            </div>
          </div>

          {/* List Item */}
          <div className="space-y-2 max-h-48 overflow-y-auto py-1 text-xs custom-scrollbar">
            {order.items.map((it, idx) => {
              const count = it.quantity ?? it.qty ?? 1;
              return (
                <div
                  key={idx}
                  className={`flex justify-between items-start ${
                    it.isVoided ? 'line-through text-red-400 opacity-50' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-semibold">
                      {count}x {it.name}
                    </span>
                    {it.selectedOptions && it.selectedOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {it.selectedOptions.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1 py-0.2 rounded"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {it.notes && (
                      <span className="block text-[10px] text-amber-400/90 italic">
                        ({it.notes})
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-400">
                    Rp {(it.price * count).toLocaleString('id-ID')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rincian Finansial & Stempel */}
          <div className="border-t border-dashed border-slate-750 pt-3 space-y-2 text-xs">
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Menu:</span>
                <span className="font-mono text-slate-300">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-amber-400/90">
                  <span>Pajak Restoran (PB1 {taxRate > 0 ? `${taxRate}%` : ''}):</span>
                  <span className="font-mono">+Rp {taxAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {serviceAmount > 0 && (
                <div className="flex justify-between text-blue-400/90">
                  <span>Biaya Layanan ({serviceRate > 0 ? `${serviceRate}%` : ''}):</span>
                  <span className="font-mono">+Rp {serviceAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {roundingAmount !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Pembulatan:</span>
                  <span className="font-mono">Rp {roundingAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {cafeSettings?.enableTax !== false && (cafeSettings?.taxPercentage || 0) > 0 && cafeSettings?.isTaxIncluded && (
                <div className="text-[10px] text-slate-500 italic">
                  *Harga menu sudah termasuk PB1 ({cafeSettings.taxPercentage}%)
                </div>
              )}
            </div>

            <div className="flex justify-between items-center font-bold pt-1.5 border-t border-slate-800">
              <span className="text-slate-300 text-xs">TOTAL:</span>
              <span className="text-emerald-400 font-mono text-base font-black">
                Rp {finalTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {isPaid ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 text-center space-y-0.5">
                <span className="text-xs font-black text-emerald-300 tracking-widest uppercase block">
                  [ ✅ LUNAS / PAID ]
                </span>
                <div className="flex justify-center gap-2 text-[10px] text-slate-400">
                  <span>
                    Metode:{' '}
                    <strong className="text-slate-200 uppercase">
                      {order.paymentMethod || 'TUNAI'}
                    </strong>
                  </span>
                  {order.paidAt && (
                    <span>
                      •{' '}
                      {new Date(order.paidAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 text-center text-xs font-bold text-amber-300 space-y-0.5">
                <div>⏳ Menunggu Pembayaran di Kasir</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Bisa bayar langsung via QRIS / DANA atau di kasir
                </div>
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 border border-slate-700"
            >
              <span>🖨️</span>
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all"
            >
              Tutup ✕
            </button>
          </div>
        </div>
      </div>

      {/* Komponen Cetak Struk Terisolasi untuk Tamu (Print View 58mm/80mm) */}
      <div
        id="guest-print-receipt-area"
        className="hidden print:block text-black bg-white font-mono text-xs w-[58mm] sm:w-[80mm] mx-auto p-2"
      >
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #guest-print-receipt-area, #guest-print-receipt-area * {
              visibility: visible !important;
            }
            #guest-print-receipt-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 8px !important;
              background: white !important;
              color: black !important;
            }
            @page {
              margin: 0;
              size: auto;
            }
          }
        `}</style>

        {/* Header Thermal Struk */}
        <div className="text-center pb-2 border-b border-dashed border-gray-400 mb-2">
          <h2 className="font-bold text-sm uppercase tracking-wide">
            {cafeSettings?.name || 'CAFEYOU KARAOKE & CAFE'}
          </h2>
          {cafeSettings?.tagline && (
            <p className="text-[10px] text-gray-600 line-clamp-1">{cafeSettings.tagline}</p>
          )}
          <p className="text-[10px] text-gray-500 mt-0.5">STRUK PEMESANAN F&B (E-RECEIPT)</p>
        </div>

        {/* Info Meja & Waktu */}
        <div className="text-[11px] mb-2 space-y-0.5 border-b border-dashed border-gray-400 pb-2">
          <div className="flex justify-between">
            <span>
              Meja: <strong className="text-xs">{order.tableNumber}</strong>
            </span>
            <span>{order.customerName || `Tamu ${order.tableNumber}`}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Waktu:</span>
            <span>{new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>No. Order:</span>
            <span>#{order.id.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        {/* Item yang Dicetak */}
        <div className="space-y-1.5 mb-2 border-b border-dashed border-gray-400 pb-2">
          {order.items.map((item, idx) => {
            const qty = item.quantity ?? item.qty ?? 1;
            return (
              <div key={idx} className={item.isVoided ? 'line-through opacity-50' : ''}>
                <div className="flex justify-between font-semibold">
                  <span className="truncate pr-1">{item.name}</span>
                  <span>Rp {(item.price * qty).toLocaleString('id-ID')}</span>
                </div>
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <div className="text-[9px] text-gray-600 pl-2">
                    • {item.selectedOptions.join(', ')}
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-gray-600 pl-2">
                  <span>{qty} x Rp {item.price.toLocaleString('id-ID')}</span>
                  {item.notes && (
                    <span className="italic truncate max-w-[120px]">({item.notes})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ringkasan Finansial Thermal */}
        <div className="space-y-1 mb-3 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          {taxAmount > 0 && (
            <div className="flex justify-between">
              <span>PB1 Resto:</span>
              <span>+Rp {taxAmount.toLocaleString('id-ID')}</span>
            </div>
          )}
          {serviceAmount > 0 && (
            <div className="flex justify-between">
              <span>Layanan:</span>
              <span>+Rp {serviceAmount.toLocaleString('id-ID')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
            <span>TOTAL:</span>
            <span>Rp {finalTotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="font-semibold">{isPaid ? 'LUNAS' : 'BELUM LUNAS'}</span>
          </div>
          {isPaid && (
            <div className="flex justify-between">
              <span>Metode:</span>
              <span className="font-semibold uppercase">{order.paymentMethod || 'TUNAI'}</span>
            </div>
          )}
        </div>

        {/* Footer Thermal Struk */}
        <div className="text-center pt-2 border-t border-dashed border-gray-400 text-[10px] text-gray-500 space-y-0.5">
          <p>Terima kasih atas kunjungannya!</p>
          <p>Simpan e-struk ini sebagai bukti pembayaran sah.</p>
          <p className="text-[8px] text-gray-400 pt-1">Powered by CAFEYOU Smart Lounge</p>
        </div>
      </div>
    </>
  );
};
