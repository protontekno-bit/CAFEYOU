import React from 'react';
import { TableOrder, CafeSettings } from '../../types';

export interface GuestGroupedReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  customerName?: string;
  myTableOrders: TableOrder[];
  tableUnpaidSubtotal: number;
  tableUnpaidEstimatedTax: number;
  tableUnpaidEstimatedService: number;
  tableUnpaidBill: number;
  tablePaidTotal: number;
  tableAccumulatedBill: number;
  guestTaxRate: number;
  guestServiceRate: number;
  cafeSettings?: CafeSettings;
}

export const GuestGroupedReceiptModal: React.FC<GuestGroupedReceiptModalProps> = ({
  isOpen,
  onClose,
  tableNumber,
  customerName,
  myTableOrders,
  tableUnpaidSubtotal: _tableUnpaidSubtotal,
  tableUnpaidEstimatedTax,
  tableUnpaidEstimatedService,
  tableUnpaidBill,
  tablePaidTotal,
  tableAccumulatedBill,
  guestTaxRate,
  guestServiceRate,
  cafeSettings,
}) => {
  if (!isOpen) return null;

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
            <p className="text-[11px] text-emerald-400 font-bold tracking-wider uppercase">
              E-NOTA GABUNGAN MEJA ({tableNumber})
            </p>
            {cafeSettings?.tagline && (
              <p className="text-[10px] text-slate-400 italic">{cafeSettings.tagline}</p>
            )}
            <div className="pt-2 text-[10px] text-slate-400 font-mono space-y-0.5">
              <div>
                Total Tiket: {myTableOrders.filter((o) => o.status?.toLowerCase() !== 'cancelled').length} Pesanan
              </div>
              <div>
                Waktu Cetak: {new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
              <div>
                Status Meja:{' '}
                <strong className="text-white">
                  {tableUnpaidBill > 0 ? 'Sebagian Belum Lunas' : 'Seluruhnya LUNAS'}
                </strong>
              </div>
            </div>
          </div>

          {/* List Gabungan Seluruh Menu */}
          <div className="space-y-2 max-h-48 overflow-y-auto py-1 text-xs custom-scrollbar">
            {myTableOrders
              .filter((o) => o.status?.toLowerCase() !== 'cancelled')
              .map((ord) => (
                <div
                  key={ord.id}
                  className="pb-2 border-b border-slate-800/60 last:border-0 last:pb-0 space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-mono font-bold">
                      #{ord.id.slice(-6).toUpperCase()} (
                      {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      )
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold ${
                        ord.status?.toLowerCase() === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ord.status?.toLowerCase() === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                    </span>
                  </div>
                  {ord.items.map((it, idx) => {
                    const count = it.quantity ?? it.qty ?? 1;
                    return (
                      <div
                        key={idx}
                        className={`flex justify-between items-start text-[11px] pl-1.5 ${
                          it.isVoided ? 'line-through text-red-400 opacity-50' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <span>
                            {count}x {it.name}
                          </span>
                          {it.selectedOptions && it.selectedOptions.length > 0 && (
                            <span className="text-[9px] text-amber-400 ml-1">
                              ({it.selectedOptions.join(', ')})
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
              ))}
          </div>

          {/* Rincian Finansial Gabungan */}
          <div className="border-t border-dashed border-slate-750 pt-3 space-y-2 text-xs">
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Seluruh Pesanan:</span>
                <span className="font-mono text-slate-300">
                  Rp{' '}
                  {myTableOrders
                    .filter((o) => o.status?.toLowerCase() !== 'cancelled')
                    .reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0)
                    .toLocaleString('id-ID')}
                </span>
              </div>
              {tableUnpaidEstimatedTax > 0 && (
                <div className="flex justify-between text-amber-400/90">
                  <span>Estimasi Pajak Restoran (PB1 {guestTaxRate}%):</span>
                  <span className="font-mono">+Rp {tableUnpaidEstimatedTax.toLocaleString('id-ID')}</span>
                </div>
              )}
              {tableUnpaidEstimatedService > 0 && (
                <div className="flex justify-between text-blue-400/90">
                  <span>Estimasi Biaya Layanan ({guestServiceRate}%):</span>
                  <span className="font-mono">+Rp {tableUnpaidEstimatedService.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300 font-bold pt-1 border-t border-slate-800">
                <span>TOTAL AKUMULASI MEJA:</span>
                <span className="font-mono text-emerald-400 text-sm font-black">
                  Rp {tableAccumulatedBill.toLocaleString('id-ID')}
                </span>
              </div>
              {tablePaidTotal > 0 && (
                <div className="flex justify-between text-emerald-400 text-[11px]">
                  <span>Sudah Pernah Lunas:</span>
                  <span className="font-mono">Rp {tablePaidTotal.toLocaleString('id-ID')}</span>
                </div>
              )}
              {tableUnpaidBill > 0 && (
                <div className="flex justify-between text-amber-400 text-xs font-bold pt-0.5">
                  <span>SISA TAGIHAN BELUM LUNAS:</span>
                  <span className="font-mono text-sm">Rp {tableUnpaidBill.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            {tableUnpaidBill === 0 ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 text-center">
                <span className="text-xs font-black text-emerald-300 tracking-widest uppercase block">
                  [ ✅ SELURUH TAGIHAN LUNAS ]
                </span>
                <span className="text-[10px] text-slate-400">
                  Terima kasih telah berkunjung di {cafeSettings?.name || 'CAFEYOU'}!
                </span>
              </div>
            ) : (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 text-center text-xs font-bold text-amber-300 space-y-0.5">
                <div>⏳ Ada Tagihan Menunggu Pembayaran</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Silakan selesaikan di kasir atau scan QRIS di meja.
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
          <p className="text-[10px] text-gray-500 mt-0.5">E-NOTA KONSOLIDASI MEJA</p>
        </div>

        {/* Info Meja & Waktu */}
        <div className="text-[11px] mb-2 space-y-0.5 border-b border-dashed border-gray-400 pb-2">
          <div className="flex justify-between">
            <span>
              Meja: <strong className="text-xs">{tableNumber}</strong>
            </span>
            <span>{customerName || `Tamu ${tableNumber}`}</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-600">
            <span>Waktu:</span>
            <span>{new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        </div>

        {/* Item yang Dicetak */}
        <div className="space-y-1.5 mb-2 border-b border-dashed border-gray-400 pb-2">
          {myTableOrders
            .filter((o) => o.status?.toLowerCase() !== 'cancelled')
            .flatMap((o) => o.items)
            .map((item, idx) => {
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
        {(() => {
          const subtotal = myTableOrders
            .filter((o) => o.status?.toLowerCase() !== 'cancelled')
            .reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0);
          return (
            <div className="space-y-1 mb-3 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {tableUnpaidEstimatedTax > 0 && (
                <div className="flex justify-between">
                  <span>PB1 Resto ({guestTaxRate}%):</span>
                  <span>+Rp {tableUnpaidEstimatedTax.toLocaleString('id-ID')}</span>
                </div>
              )}
              {tableUnpaidEstimatedService > 0 && (
                <div className="flex justify-between">
                  <span>Layanan ({guestServiceRate}%):</span>
                  <span>+Rp {tableUnpaidEstimatedService.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                <span>TOTAL AKHIR:</span>
                <span>Rp {tableAccumulatedBill.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Meja:</span>
                <span className="font-semibold">
                  {tableUnpaidBill === 0 ? 'LUNAS' : 'SEBAGIAN BELUM LUNAS'}
                </span>
              </div>
            </div>
          );
        })()}

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
