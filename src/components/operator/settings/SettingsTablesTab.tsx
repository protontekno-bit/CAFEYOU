import React, { useState } from 'react';
import { QUICK_TABLES } from '../../../constants/karaoke';
import { CheckIcon } from '../../icons/Icons';

interface SettingsTablesTabProps {
  tables?: string[];
  cafeName?: string;
  onAddTable?: (name: string) => void;
  onRemoveTable?: (name: string) => void;
  onResetTables?: () => void;
  onOpenTableQrModal?: () => void;
}

export const SettingsTablesTab: React.FC<SettingsTablesTabProps> = ({
  tables,
  cafeName = 'CAFEYOU',
  onAddTable,
  onRemoveTable,
  onResetTables,
  onOpenTableQrModal,
}) => {
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;
  const [newTableName, setNewTableName] = useState('');
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableSuccess, setTableSuccess] = useState<string | null>(null);
  const [previewTable, setPreviewTable] = useState(() => activeTables[0] || 'Meja 1');

  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTableError(null);
    setTableSuccess(null);
    const trimmed = newTableName.trim();
    if (!trimmed) {
      setTableError('Nama meja tidak boleh kosong.');
      return;
    }
    if (activeTables.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTableError(`Meja "${trimmed}" sudah ada dalam daftar.`);
      return;
    }
    if (onAddTable) {
      onAddTable(trimmed);
      setTableSuccess(`Meja "${trimmed}" berhasil ditambahkan!`);
      setNewTableName('');
      setPreviewTable(trimmed);
      setTimeout(() => setTableSuccess(null), 2500);
    }
  };

  const handleRemoveTableClick = (tableToRemove: string) => {
    if (activeTables.length <= 1) {
      alert('Minimal harus ada 1 meja aktif dalam sistem.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus "${tableToRemove}" dari sistem kafe?`)) {
      if (onRemoveTable) {
        const res = onRemoveTable(tableToRemove) as any;
        if (res && res.success === false) {
          alert(`❌ Gagal Menghapus Meja:\n${res.reason}`);
          return;
        }
        const remaining = activeTables.filter((t) => t !== tableToRemove);
        if (previewTable === tableToRemove) {
          setPreviewTable(remaining[0] || 'Meja 1');
        }
        setTableSuccess(`Meja "${tableToRemove}" telah dihapus.`);
        setTimeout(() => setTableSuccess(null), 2500);
      }
    }
  };

  const handleResetTablesClick = () => {
    if (confirm('Kembalikan daftar meja ke bawaan standar (Meja 1 s/d Meja 9)?')) {
      if (onResetTables) {
        onResetTables();
        setPreviewTable('Meja 1');
        setTableSuccess('Daftar meja berhasil direset ke pengaturan bawaan!');
        setTimeout(() => setTableSuccess(null), 2500);
      }
    }
  };

  // Base URL untuk QR Preview
  const baseUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${baseUrl}#guest?table=${encodeURIComponent(previewTable)}`
  )}`;

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>🪑 Pengelolaan Meja & Stiker QR</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Kelola daftar meja kafe Anda, tambah atau hapus meja sesuai tata letak ruangan, serta cetak stiker barcode QR untuk smartphone pelanggan.
        </p>
      </div>

      {/* Status Alert */}
      {tableSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{tableSuccess}</span>
        </div>
      )}
      {tableError && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <span className="text-rose-400 font-bold shrink-0">⚠️</span>
          <span>{tableError}</span>
        </div>
      )}

      {/* SECTION A: FORM TAMBAH MEJA & DAFTAR MEJA */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>➕ Tambah Meja Baru</span>
          </div>
          <button
            type="button"
            onClick={handleResetTablesClick}
            className="text-[11px] text-slate-400 hover:text-amber-400 px-2.5 py-1 rounded-lg hover:bg-slate-850 transition-colors flex items-center gap-1 font-medium border border-transparent hover:border-slate-700"
            title="Kembalikan daftar meja ke bawaan (Meja 1 s/d Meja 9)"
          >
            <span>↺ Reset ke Default</span>
          </button>
        </div>

        <form onSubmit={handleAddTableSubmit} className="flex gap-2">
          <input
            type="text"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            placeholder="Contoh: Meja 10, VIP 1, Outdoor 2, Bar A..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>+ Tambah</span>
          </button>
        </form>

        {/* List Meja Aktif */}
        <div className="pt-2 border-t border-slate-850 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Daftar Meja Aktif ({activeTables.length} Meja):</span>
            <span className="text-[10px] text-slate-500">Klik meja untuk pratinjau stiker, tombol ✕ untuk hapus</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {activeTables.map((t) => {
              const isSelected = previewTable === t;
              return (
                <div
                  key={t}
                  className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-400 text-blue-200 shadow-sm'
                      : 'bg-slate-900 border-slate-750 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewTable(t)}
                    className="flex items-center gap-1 text-left focus:outline-none"
                    title={`Lihat pratinjau stiker ${t}`}
                  >
                    <span className="text-[11px]">🪑</span>
                    <span>{t}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveTableClick(t)}
                    className="w-5 h-5 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/20 transition-colors ml-1"
                    title={`Hapus ${t} dari sistem`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Banner Cetak Massal */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <div className="text-sm font-extrabold text-white">Lembar Stiker Semua Meja Siap Gunting</div>
          <div className="text-xs text-blue-300/80">Format lengkap ({activeTables.length} meja) untuk dicetak langsung ke printer.</div>
        </div>
        {onOpenTableQrModal && (
          <button
            onClick={onOpenTableQrModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>🖨️ Buka Lembar Cetak Stiker</span>
          </button>
        )}
      </div>

      {/* Preview Satu Meja */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
        <div className="text-xs font-bold text-slate-300">Pilih Meja untuk Pratinjau Stiker:</div>
        <div className="flex flex-wrap gap-2">
          {activeTables.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPreviewTable(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                previewTable === t
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
            <img src={previewQrUrl} alt={previewTable} className="w-28 h-28 object-contain" />
          </div>
          <div className="text-xs text-slate-400 space-y-1.5 text-center sm:text-left">
            <div className="font-extrabold text-white text-base">{previewTable}</div>
            <div className="text-[11px] text-slate-300">Arahkan kamera smartphone ke QR ini untuk memesan lagu atas nama <strong>{previewTable}</strong>.</div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  const w = window.open('', '_blank');
                  if (w) {
                    w.document.write(`
                      <html>
                        <head><title>Stiker ${previewTable} - ${cafeName}</title></head>
                        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;">
                          <div style="border:2px dashed #333;padding:24px;border-radius:16px;text-align:center;max-width:280px;">
                            <h2 style="margin:0 0 8px 0;font-size:20px;">${cafeName}</h2>
                            <h3 style="margin:0 0 12px 0;font-size:16px;color:#2563eb;">${previewTable}</h3>
                            <img src="${previewQrUrl}" style="width:200px;height:200px;margin-bottom:8px;" />
                            <p style="margin:0;font-size:12px;color:#666;">Scan untuk pilih & pesan lagu dari HP</p>
                          </div>
                          <script>window.onload = function(){ window.print(); };</script>
                        </body>
                      </html>
                    `);
                    w.document.close();
                  }
                }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold"
              >
                🖨️ Cetak Stiker {previewTable} Saja
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
