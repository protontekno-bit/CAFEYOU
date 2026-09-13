import React from 'react';
import { TableOrder, CafeSettings } from '../../types';

export interface GuestOrdersTabProps {
  tableNumber: string;
  myTableOrders: TableOrder[];
  tableUnpaidSubtotal: number;
  tableUnpaidEstimatedTax: number;
  tableUnpaidEstimatedService: number;
  tableUnpaidBill: number;
  tablePaidTotal: number;
  guestTaxRate: number;
  guestServiceRate: number;
  cafeSettings?: CafeSettings;
  showGuestQris: boolean;
  setShowGuestQris: React.Dispatch<React.SetStateAction<boolean>>;
  guestCopiedDana: boolean;
  setGuestCopiedDana: React.Dispatch<React.SetStateAction<boolean>>;
  showAllHistory: boolean;
  setShowAllHistory: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenGroupedReceipt: () => void;
  onOpenSingleReceipt: (ord: TableOrder) => void;
  onSwitchToFnbTab: () => void;
}

export const GuestOrdersTab: React.FC<GuestOrdersTabProps> = ({
  tableNumber,
  myTableOrders,
  tableUnpaidSubtotal,
  tableUnpaidEstimatedTax,
  tableUnpaidEstimatedService,
  tableUnpaidBill,
  tablePaidTotal,
  guestTaxRate,
  guestServiceRate,
  cafeSettings,
  showGuestQris,
  setShowGuestQris,
  guestCopiedDana,
  setGuestCopiedDana,
  showAllHistory,
  setShowAllHistory,
  onOpenGroupedReceipt,
  onOpenSingleReceipt,
  onSwitchToFnbTab,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Table Bill Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <span>🧾</span>
            <span>Rincian Tagihan Meja ({tableNumber})</span>
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
            {myTableOrders.length} Pesanan
          </span>
        </div>

        {/* Rincian Subtotal & Pajak jika PB1 belum termasuk */}
        {tableUnpaidSubtotal > 0 && (guestTaxRate > 0 || guestServiceRate > 0) && (
          <div className="space-y-1 text-xs pt-1 border-t border-slate-800/80">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Subtotal Makanan & Minuman:</span>
              <span className="font-mono text-slate-300">
                Rp {tableUnpaidSubtotal.toLocaleString('id-ID')}
              </span>
            </div>
            {guestTaxRate > 0 && (
              <div className="flex justify-between text-amber-400 text-[11px]">
                <span>Pajak Restoran (PB1 {guestTaxRate}%):</span>
                <span className="font-mono">
                  +Rp {tableUnpaidEstimatedTax.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            {guestServiceRate > 0 && (
              <div className="flex justify-between text-blue-400 text-[11px]">
                <span>Biaya Layanan ({guestServiceRate}%):</span>
                <span className="font-mono">
                  +Rp {tableUnpaidEstimatedService.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-baseline pt-1 border-t border-slate-800/60">
          <div>
            <span className="text-xs text-slate-300 block font-bold">
              {guestTaxRate > 0 ? 'Total Belum Lunas (+PB1):' : 'Total Tagihan Belum Lunas:'}
            </span>
            {cafeSettings?.enableTax !== false && (cafeSettings?.taxPercentage || 0) > 0 && cafeSettings?.isTaxIncluded && (
              <span className="text-[10px] text-emerald-400 font-medium">
                ✓ Termasuk PB1 ({cafeSettings.taxPercentage}%)
              </span>
            )}
          </div>
          <span className="text-xl font-black text-amber-400 font-mono">
            Rp {tableUnpaidBill.toLocaleString('id-ID')}
          </span>
        </div>

        {tablePaidTotal > 0 && (
          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
            <span>Total Sudah Pernah Lunas:</span>
            <span className="text-emerald-400 font-mono font-bold">
              Rp {tablePaidTotal.toLocaleString('id-ID')}
            </span>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenGroupedReceipt}
            className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
          >
            <span>🧾</span>
            <span>Lihat E-Nota Konsolidasi Meja</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-500 pt-0.5 text-center">
          💡 Silakan minta tagihan / bayar ke kasir atau scan QRIS di bawah saat selesai menikmati pesanan di kafe.
        </p>
      </div>

      {/* Tombol & Panel Pembayaran Mandiri QRIS / DANA */}
      {(cafeSettings?.qrisImageUrl || cafeSettings?.danaPhoneNumber) && (
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-lg transition-all">
          <button
            type="button"
            onClick={() => setShowGuestQris((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between bg-slate-900 hover:bg-slate-850 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black text-sm">
                📱
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Bayar via QRIS / DANA</span>
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">
                    {showGuestQris ? '▲ Tutup' : '▼ Buka Barcode'}
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Scan QRIS atau transfer DANA langsung dari tempat duduk Anda
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              Rp {tableUnpaidBill.toLocaleString('id-ID')}
            </span>
          </button>

          {showGuestQris && (
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 space-y-3.5 text-center animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                <span className="text-slate-400">Merchant QRIS:</span>
                <span className="font-bold text-white">
                  {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'CAFEYOU LOUNGE'}
                </span>
              </div>

              {cafeSettings?.qrisImageUrl && (
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl mx-auto border-4 border-emerald-500/30">
                    <img
                      src={cafeSettings.qrisImageUrl}
                      alt="QRIS Barcode"
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg mx-auto"
                    />
                  </div>
                  <div className="bg-slate-900 py-1 px-3 rounded-xl inline-block border border-slate-800 text-xs">
                    <span className="text-slate-400">Total Tagihan: </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      Rp {tableUnpaidBill.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              {cafeSettings?.danaPhoneNumber && (
                <div className="bg-slate-900/90 p-3 rounded-xl border border-blue-500/30 text-left space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Transfer ke Dompet DANA:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (cafeSettings.danaPhoneNumber) {
                          navigator.clipboard.writeText(cafeSettings.danaPhoneNumber);
                          setGuestCopiedDana(true);
                          setTimeout(() => setGuestCopiedDana(false), 2000);
                        }
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors"
                    >
                      {guestCopiedDana ? '✅ Nomor Tersalin' : '📋 Salin Nomor'}
                    </button>
                  </div>
                  <p className="text-sm font-black font-mono text-white tracking-wider">
                    {cafeSettings.danaPhoneNumber}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    a/n {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'Kasir CAFEYOU'}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                ℹ️ <strong className="text-slate-200">Penting:</strong> Setelah melakukan pembayaran, harap konfirmasikan bukti transfer kepada waiter atau kasir kami agar status tagihan meja {tableNumber} dapat diperbarui menjadi <strong className="text-emerald-400">LUNAS</strong>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* List of orders */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Rincian Pesanan Meja Ini:
          </h4>
          <button
            type="button"
            onClick={() => setShowAllHistory((prev) => !prev)}
            className="text-[10px] text-slate-400 hover:text-amber-400 font-medium underline transition-colors"
          >
            {showAllHistory ? 'Sembunyikan Riwayat Lama' : 'Lihat Riwayat Sebelumnya'}
          </button>
        </div>

        {myTableOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-xs font-semibold text-slate-400">Belum ada pesanan dari meja ini.</p>
            <button
              onClick={onSwitchToFnbTab}
              className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Buka Menu Makanan & Minuman
            </button>
          </div>
        ) : (
          myTableOrders.map((ord) => {
            const s = ord.status?.toLowerCase();
            const isPaid = s === 'paid';
            const isCancelled = s === 'cancelled';
            const isPending = s === 'pending';
            const isCooking = s === 'confirmed' || s === 'preparing' || s === 'cooking';
            const isReady = s === 'ready' || s === 'served';

            return (
              <div
                key={ord.id}
                className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all ${
                  isPaid
                    ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Tiket */}
                <div className="flex justify-between items-start border-b border-slate-800/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-300">
                        #{ord.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      {ord.customerName || `Tamu ${ord.tableNumber}`}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {isPending && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold animate-pulse">
                        🟡 Menunggu Kasir
                      </span>
                    )}
                    {isCooking && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                        👨‍🍳 Sedang Dimasak
                      </span>
                    )}
                    {isReady && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        🍽️ Siap / Disajikan
                      </span>
                    )}
                    {isPaid && (
                      <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black flex items-center gap-1">
                        <span>✅</span> LUNAS
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                        ✕ Dibatalkan
                      </span>
                    )}
                  </div>
                </div>

                {/* Order items */}
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 space-y-1.5">
                  {ord.items.map((it, idx) => {
                    const count = it.quantity ?? it.qty ?? 1;
                    return (
                      <div
                        key={idx}
                        className={`flex justify-between items-start text-xs ${
                          it.isVoided ? 'line-through text-red-400 opacity-50' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium">
                            {count}x {it.name}
                          </div>
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
                            <span className="block text-amber-400/80 italic text-[10px]">
                              ({it.notes})
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-400 shrink-0 ml-2">
                          Rp {(it.price * count).toLocaleString('id-ID')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Stempel Digital Lunas jika sudah dibayar */}
                {isPaid && (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🧾</span>
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                          PEMBAYARAN TERVERIFIKASI
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Metode: {ord.paymentMethod?.toUpperCase() || 'TUNAI'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs rounded-lg tracking-widest uppercase">
                      LUNAS
                    </span>
                  </div>
                )}

                {/* Footer Total & Tombol Struk Digital */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Total Pesanan:</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">
                      Rp {ord.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Tombol Buka Struk Digital */}
                  <button
                    onClick={() => onOpenSingleReceipt(ord)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>Struk Digital</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
