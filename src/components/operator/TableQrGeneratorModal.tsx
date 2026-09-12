import React, { useState } from 'react';
import { QUICK_TABLES } from '../../constants/karaoke';
import { PrinterIcon, TicketIcon } from '../icons/Icons';

interface TableQrGeneratorModalProps {
  isOpen: boolean;
  cafeName?: string;
  tables?: string[];
  onClose: () => void;
  onOpenVoucherManager?: () => void;
}

export const TableQrGeneratorModal: React.FC<TableQrGeneratorModalProps> = ({
  isOpen,
  cafeName = 'CAFEYOU',
  tables,
  onClose,
  onOpenVoucherManager,
}) => {
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;
  const [selectedTable, setSelectedTable] = useState(() => activeTables[0] || 'Meja 1');
  const [printMode, setPrintMode] = useState(false);

  // Deteksi dan Override IP Wi-Fi Lokal untuk QR Code
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [customLocalIp, setCustomLocalIp] = useState(() => {
    try {
      return (
        localStorage.getItem('cafeyou_server_local_ip') ||
        (isLocalhost ? '192.168.1.50:3000' : '')
      );
    } catch {
      return '192.168.1.50:3000';
    }
  });

  const [showIpEditor, setShowIpEditor] = useState(false);

  if (!isOpen) return null;

  // Hitung Base URL yang aman untuk di-scan HP tamu
  let effectiveBaseUrl = window.location.href.split('#')[0];
  if (isLocalhost && customLocalIp.trim()) {
    effectiveBaseUrl = `http://${customLocalIp.trim().replace(/^https?:\/\//, '')}/`;
  }

  const getGuestUrl = (table: string) =>
    `${effectiveBaseUrl}#guest?table=${encodeURIComponent(table)}`;

  const currentQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    getGuestUrl(selectedTable)
  )}`;

  const handleSaveIp = (ip: string) => {
    setCustomLocalIp(ip);
    try {
      localStorage.setItem('cafeyou_server_local_ip', ip);
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🪑</span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Stiker QR Barcode Meja Pelanggan</span>
              </h2>
              <p className="text-xs text-slate-400">
                Cetak atau tampilkan barcode di meja agar tamu bisa scan dan request lagu dari smartphone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/60 text-xs">
          <button
            onClick={() => setPrintMode(false)}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
              !printMode
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔍 Tampilan Meja Tunggal
          </button>
          <button
            onClick={() => setPrintMode(true)}
            className={`flex-1 py-1.5 px-3 rounded-lg font-semibold transition-all ${
              printMode
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🖨️ Lembar Cetak Semua Meja
          </button>
        </div>

        {/* IP Wi-Fi Server Warning / Configurator */}
        {isLocalhost && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <span>📶</span>
                <span>Mode Server Wi-Fi Kafe (Localhost Terdeteksi)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIpEditor(!showIpEditor)}
                className="text-[11px] px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg border border-amber-500/30 transition-colors"
              >
                {showIpEditor ? 'Tutup Pengaturan IP' : '⚙️ Sesuaikan IP Laptop'}
              </button>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              QR code akan menggunakan IP Wi-Fi laptop ini (bukan <em>localhost</em>) agar HP tamu dapat membuka menu dari meja.
            </p>
            {showIpEditor && (
              <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <span className="text-slate-400 text-[11px] whitespace-nowrap">IP & Port Laptop:</span>
                <input
                  type="text"
                  value={customLocalIp}
                  onChange={(e) => handleSaveIp(e.target.value)}
                  placeholder="Contoh: 192.168.1.15:3000"
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-amber-500/50 rounded-lg text-amber-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowIpEditor(false)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Simpan
                </button>
              </div>
            )}
          </div>
        )}

        {!printMode ? (
          /* Tampilan Per Meja */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Meja untuk Ditampilkan:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {activeTables.map((table) => (
                  <button
                    key={table}
                    type="button"
                    onClick={() => setSelectedTable(table)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedTable === table
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20 scale-105'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {table}
                  </button>
                ))}
              </div>
            </div>

            {/* Kartu Stiker Meja */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl border border-blue-500/30 shadow-inner">
              <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 shrink-0">
                <img
                  src={currentQrUrl}
                  alt={`QR Code ${selectedTable}`}
                  className="w-44 h-44 object-contain rounded-lg"
                />
              </div>

              <div className="space-y-2.5 text-center sm:text-left flex-1">
                <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full text-xs font-extrabold tracking-wider uppercase">
                  🎤 {cafeName} KARAOKE
                </div>
                <h3 className="text-2xl font-black text-white">{selectedTable}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Scan barcode ini dengan kamera smartphone Anda untuk membuka portal pilih lagu langsung dari meja.
                </p>

                <div className="text-[11px] font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-cyan-300 break-all select-all">
                  {getGuestUrl(selectedTable)}
                </div>

                <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                  <a
                    href={getGuestUrl(selectedTable)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Buka Portal Tamu</span>
                    <span>↗</span>
                  </a>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Halo! Silakan scan atau klik link ini untuk request lagu karaoke dari ${selectedTable} di ${cafeName}:\n${getGuestUrl(
                        selectedTable
                      )}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>📱 Kirim WA</span>
                  </a>

                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <PrinterIcon className="w-3.5 h-3.5" />
                    <span>Cetak Meja Ini</span>
                  </button>

                  {onOpenVoucherManager && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenVoucherManager();
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-semibold rounded-xl border border-amber-500/40 transition-colors inline-flex items-center gap-1.5"
                    >
                      <TicketIcon className="w-3.5 h-3.5" />
                      <span>Atur Voucher Meja Ini</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Lembar Cetak Semua Meja (Print Sheet Preview) */
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Pratinjau lembar stiker untuk seluruh meja kafe:</span>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center gap-2 transition-all active:scale-95"
              >
                <PrinterIcon className="w-4 h-4" />
                <span>Cetak Lembar Stiker</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-slate-700/60 custom-scrollbar print:max-h-none print:overflow-visible">
              {activeTables.map((table) => {
                const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  getGuestUrl(table)
                )}`;
                return (
                  <div
                    key={table}
                    className="bg-white text-slate-950 p-3 rounded-xl border border-slate-300 flex flex-col items-center text-center space-y-1.5 shadow-sm"
                  >
                    <div className="text-[10px] font-extrabold uppercase text-blue-800 tracking-wider">
                      🎤 {cafeName} KARAOKE
                    </div>
                    <div className="font-extrabold text-sm text-slate-900">{table}</div>
                    <img src={qr} alt={table} className="w-24 h-24 object-contain rounded" />
                    <div className="text-[9px] text-slate-600 font-medium">
                      Scan untuk Request Lagu
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
