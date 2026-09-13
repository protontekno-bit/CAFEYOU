import React from 'react';
import { TableOrder, CafeSettings } from '../../types';

export interface PosPaymentModalProps {
  payingTable: string | null;
  payingOrders: TableOrder[];
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'debit';
  setPaymentMethod: (method: 'cash' | 'qris' | 'transfer' | 'debit') => void;
  cashReceived: number;
  setCashReceived: (amount: number) => void;
  copiedDana: boolean;
  setCopiedDana: (copied: boolean) => void;
  cafeSettings?: CafeSettings;
  formatRupiah: (amount: number) => string;
  onConfirmPayment: (
    taxRateVal?: number,
    serviceRateVal?: number,
    isCashRounding?: boolean,
    selectedOrdersToPay?: TableOrder[]
  ) => void;
  onPrintReceipt: (single?: TableOrder, grouped?: TableOrder[]) => void;
  onOpenQrisZoom: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export const PosPaymentModal: React.FC<PosPaymentModalProps> = ({
  payingTable,
  payingOrders,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  copiedDana,
  setCopiedDana,
  cafeSettings,
  formatRupiah,
  onConfirmPayment,
  onPrintReceipt,
  onOpenQrisZoom,
  onOpenSettings,
  onClose,
}) => {
  if (!payingTable || payingOrders.length === 0) return null;

  // State Pilihan Tiket yang Dibayar (Dukungan Split Bill)
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>(() =>
    payingOrders.map((o) => o.id)
  );

  React.useEffect(() => {
    setSelectedOrderIds(payingOrders.map((o) => o.id));
  }, [payingOrders]);

  const activePayingOrders = payingOrders.filter((o) => selectedOrderIds.includes(o.id));
  const effectiveOrders = activePayingOrders.length > 0 ? activePayingOrders : payingOrders;

  const subtotalDue = effectiveOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const isTaxEnabled = cafeSettings?.enableTax !== false && (cafeSettings?.taxPercentage || 0) > 0;
  const isTaxPlus = isTaxEnabled && cafeSettings?.isTaxIncluded === false;
  const taxRate = isTaxPlus ? (cafeSettings?.taxPercentage || 0) : 0;
  const taxAmount = Math.round((subtotalDue * taxRate) / 100);
  const totalDue = subtotalDue + taxAmount;
  const changeAmount = cashReceived > totalDue ? cashReceived - totalDue : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-slate-200">
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>💵</span>
              <span>Pembayaran Kasir: {payingTable}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {payingOrders.length > 1
                ? `${effectiveOrders.length} dari ${payingOrders.length} Pesanan Dipilih (Split Bill)`
                : `${payingOrders.length} Pesanan terdaftar untuk meja ini.`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl text-sm"
          >
            ✕
          </button>
        </div>

        {/* Pemilih Split Bill jika Meja Memiliki Lebih dari 1 Tiket */}
        {payingOrders.length > 1 && (
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <span>✂️</span> Pisah Tagihan (Split Bill):
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedOrderIds.length === payingOrders.length) {
                    setSelectedOrderIds([payingOrders[0].id]);
                  } else {
                    setSelectedOrderIds(payingOrders.map((o) => o.id));
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-white underline font-semibold"
              >
                {selectedOrderIds.length === payingOrders.length
                  ? 'Pilih 1 Tiket Saja'
                  : 'Pilih Seluruhnya'}
              </button>
            </div>
            <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar pr-1">
              {payingOrders.map((ord, oIdx) => {
                const isSelected = selectedOrderIds.includes(ord.id);
                return (
                  <label
                    key={ord.id}
                    className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            if (selectedOrderIds.length > 1) {
                              setSelectedOrderIds(selectedOrderIds.filter((id) => id !== ord.id));
                            }
                          } else {
                            setSelectedOrderIds([...selectedOrderIds, ord.id]);
                          }
                        }}
                        className="accent-amber-500 rounded"
                      />
                      <span>
                        Tiket #{oIdx + 1} ({ord.customerName || 'Tamu'})
                      </span>
                    </div>
                    <span className="font-mono font-bold">
                      {formatRupiah(ord.totalAmount || 0)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Rincian Tagihan */}
        <div className="space-y-4">
          {/* Total Tagihan Besar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
            {taxRate > 0 && (
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Subtotal Makanan & Minuman:</span>
                <span className="font-mono">{formatRupiah(subtotalDue)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-400">
                <span>Pajak Resto (PB1 {taxRate}%):</span>
                <span className="font-mono">+{formatRupiah(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300">
                {taxRate > 0 ? 'TOTAL AKHIR (+PB1):' : 'TOTAL TAGIHAN (NETT):'}
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatRupiah(totalDue)}
              </span>
            </div>
          </div>

          {/* Pilihan Metode Bayar */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['cash', 'qris', 'transfer', 'debit'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-black uppercase transition-all ${
                    paymentMethod === m
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'cash' && '💵 Tunai'}
                  {m === 'qris' && '📱 QRIS'}
                  {m === 'transfer' && '🏦 Transfer'}
                  {m === 'debit' && '💳 Debit'}
                </button>
              ))}
            </div>
          </div>

          {/* Jika TUNAI: Kalkulator & Kembalian */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-855">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nominal Uang Tunai Diterima (Rp):
                </label>
                <input
                  type="number"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-xl text-white font-mono font-bold text-lg outline-none text-right"
                />
              </div>

              {/* Tombol Cepat Pecahan */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashReceived(totalDue)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Uang Pas
                </button>
                {[10000, 20000, 50000, 100000, 200000].map((nom) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => setCashReceived(nom)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold font-mono"
                  >
                    {nom / 1000}k
                  </button>
                ))}
              </div>

              {/* Uang Kembalian */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400">UANG KEMBALIAN:</span>
                <span
                  className={`text-lg font-black font-mono ${
                    changeAmount > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {formatRupiah(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Jika QRIS: Tampilan Barcode & Merchant */}
          {paymentMethod === 'qris' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>📱</span> QRIS Pembayaran Kafe
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-300">
                  {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'CAFEYOU'}
                </span>
              </div>

              {cafeSettings?.qrisImageUrl ? (
                <div className="space-y-2.5">
                  <div
                    onClick={onOpenQrisZoom}
                    className="bg-white p-3 rounded-2xl inline-block shadow-xl mx-auto cursor-pointer hover:scale-102 transition-transform border-4 border-emerald-500/30 group relative"
                    title="Klik untuk memperbesar barcode"
                  >
                    <img
                      src={cafeSettings.qrisImageUrl}
                      alt="Barcode QRIS"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg mx-auto"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        🔍 Klik Perbesar
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-900/80 py-1.5 px-3 rounded-xl inline-block border border-slate-800">
                    <span className="text-xs text-slate-400">Total Tagihan: </span>
                    <span className="text-emerald-400 font-mono font-black text-sm">
                      {formatRupiah(totalDue)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Arahkan kamera smartphone atau aplikasi perbankan/e-wallet pelanggan ke barcode di atas.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/80 rounded-2xl border border-dashed border-amber-500/40 text-center space-y-2">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-xs text-amber-300 font-bold">
                    Barcode QRIS Kafe Belum Diunggah
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Silakan unggah gambar barcode QRIS Anda di menu Pengaturan Kasir agar tampil di layar ini.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 transition-all"
                  >
                    ⚙️ Buka Pengaturan Kasir
                  </button>
                </div>
              )}

              {/* Info Tambahan DANA jika ada */}
              {cafeSettings?.danaPhoneNumber && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-blue-400 font-bold">DANA:</span>
                    <span className="font-mono font-bold">{cafeSettings.danaPhoneNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (cafeSettings.danaPhoneNumber) {
                        navigator.clipboard.writeText(cafeSettings.danaPhoneNumber);
                        setCopiedDana(true);
                        setTimeout(() => setCopiedDana(false), 2000);
                      }
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors"
                  >
                    {copiedDana ? '✅ Tersalin' : '📋 Salin'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Jika TRANSFER: Tampilan Akun DANA & Bank */}
          {paymentMethod === 'transfer' && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/30 text-center space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <span>🏦</span> Transfer Dompet Digital / Bank
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-300">
                  {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'Kasir CAFEYOU'}
                </span>
              </div>

              {cafeSettings?.danaPhoneNumber ? (
                <div className="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Nomor Akun DANA:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (cafeSettings.danaPhoneNumber) {
                          navigator.clipboard.writeText(cafeSettings.danaPhoneNumber);
                          setCopiedDana(true);
                          setTimeout(() => setCopiedDana(false), 2000);
                        }
                      }}
                      className="text-[10px] font-bold px-2.5 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors"
                    >
                      {copiedDana ? '✅ Nomor Tersalin' : '📋 Salin Nomor'}
                    </button>
                  </div>
                  <p className="text-base font-black font-mono text-white tracking-wider">
                    {cafeSettings.danaPhoneNumber}
                  </p>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Atas Nama:</span>
                    <span className="font-bold text-slate-200">
                      {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'Kasir'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold pt-1 text-emerald-400">
                    <span>Nominal Transfer Pas:</span>
                    <span className="font-mono text-sm">{formatRupiah(totalDue)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400 space-y-1.5">
                  <p>Nomor akun DANA belum dikonfigurasi.</p>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs rounded-xl border border-blue-500/30"
                  >
                    ⚙️ Masukkan Nomor DANA di Pengaturan
                  </button>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Pastikan bukti transfer telah diperiksa kasir dan dana terverifikasi masuk.
              </p>
            </div>
          )}

          {/* Tombol Selesai & Cetak Struk Kertas */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                onConfirmPayment(
                  taxRate,
                  cafeSettings?.servicePercentage || 0,
                  true,
                  effectiveOrders
                )
              }
              disabled={
                paymentMethod === 'cash' && cashReceived > 0 && cashReceived < totalDue
              }
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
            >
              ✅ Selesaikan Pembayaran (Lunas)
            </button>

            <button
              type="button"
              onClick={() =>
                onPrintReceipt(
                  effectiveOrders.length === 1 ? effectiveOrders[0] : undefined,
                  effectiveOrders
                )
              }
              className="px-3 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-750 rounded-xl text-xs font-bold transition-all"
              title="Cetak Struk Kertas 58mm/80mm (Opsional)"
            >
              🖨️ Cetak
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
