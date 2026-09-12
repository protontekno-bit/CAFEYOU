import React from 'react';
import { CafeSettings, TableOrder } from '../../types';

interface ReceiptPrintViewProps {
  cafeSettings: CafeSettings;
  order: TableOrder | null;
  groupedOrders?: TableOrder[]; // If printing combined table bill
}

export const ReceiptPrintView: React.FC<ReceiptPrintViewProps> = ({
  cafeSettings,
  order,
  groupedOrders,
}) => {
  if (!order && (!groupedOrders || groupedOrders.length === 0)) {
    return null;
  }

  // Determine items to print
  const ordersToPrint = groupedOrders && groupedOrders.length > 0 ? groupedOrders : (order ? [order] : []);
  const firstOrder = ordersToPrint[0];
  const tableNumber = firstOrder?.tableNumber || '-';
  const customerName = firstOrder?.customerName || 'Pelanggan';

  // Calculate totals
  const allItems = ordersToPrint.flatMap(o => o.items);
  const totalAmount = ordersToPrint.reduce((acc, o) => acc + o.totalAmount, 0);
  const paymentMethod = ordersToPrint[ordersToPrint.length - 1]?.paymentMethod || 'TUNAI';

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div id="receipt-print-area" className="hidden print:block text-black bg-white font-mono text-xs w-[58mm] sm:w-[80mm] mx-auto p-2">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8px;
            background: white !important;
            color: black !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      {/* Header Nota */}
      <div className="text-center pb-2 border-b border-dashed border-gray-400 mb-2">
        <h2 className="font-bold text-sm uppercase tracking-wide">{cafeSettings.name || 'CAFEYOU KARAOKE & CAFE'}</h2>
        {cafeSettings.tagline && (
          <p className="text-[10px] text-gray-600 line-clamp-1">{cafeSettings.tagline}</p>
        )}
        <p className="text-[10px] text-gray-500 mt-0.5">STRUK PEMESANAN F&B</p>
      </div>

      {/* Info Meja & Waktu */}
      <div className="text-[11px] mb-2 space-y-0.5 border-b border-dashed border-gray-400 pb-2">
        <div className="flex justify-between">
          <span>Meja: <strong className="text-xs">{tableNumber}</strong></span>
          <span>{customerName}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>Waktu:</span>
          <span>{formatDate(firstOrder.createdAt)}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>No. Order:</span>
          <span>#{firstOrder.id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      {/* Daftar Pesanan */}
      <div className="space-y-1.5 mb-2 border-b border-dashed border-gray-400 pb-2">
        {allItems.map((item, idx) => {
          const qty = item.quantity ?? item.qty ?? 1;
          return (
            <div key={`${item.menuItemId || item.menuId || idx}-${idx}`}>
              <div className="flex justify-between font-semibold">
                <span className="truncate pr-1">{item.name}</span>
                <span>{formatRupiah(item.price * qty)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 pl-2">
                <span>{qty} x {formatRupiah(item.price)}</span>
                {item.notes && <span className="italic truncate max-w-[120px]">({item.notes})</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ringkasan Pembayaran */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span>{formatRupiah(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Metode Bayar:</span>
          <span className="font-semibold uppercase">{paymentMethod}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Status:</span>
          <span className="font-semibold">LUNAS</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-2 border-t border-dashed border-gray-400 text-[10px] text-gray-500 space-y-0.5">
        <p>Terima kasih atas kunjungannya!</p>
        <p>Selamat bernyanyi & menikmati hidangan.</p>
        <p className="text-[8px] text-gray-400 pt-1">Powered by CAFEYOU POS</p>
      </div>
    </div>
  );
};
