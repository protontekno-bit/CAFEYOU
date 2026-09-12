import React, { useState, useEffect } from 'react';
import { CafeSettings } from '../../types';

interface PosSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeSettings: CafeSettings;
  onUpdateCafeSettings: (settings: CafeSettings) => void;
  onUpdatePosPassword?: (newPin: string) => Promise<{ success: boolean; message?: string }> | void;
}

export const PosSettingsModal: React.FC<PosSettingsModalProps> = ({
  isOpen,
  onClose,
  cafeSettings,
  onUpdateCafeSettings,
  onUpdatePosPassword,
}) => {
  // State: Pajak PB1 & Service
  const [taxPercentage, setTaxPercentage] = useState<number>(cafeSettings?.taxPercentage ?? 10);
  const [isTaxIncluded, setIsTaxIncluded] = useState<boolean>(cafeSettings?.isTaxIncluded ?? true);
  const [servicePercentage, setServicePercentage] = useState<number>(cafeSettings?.servicePercentage ?? 0);

  // State: PIN Kasir
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPinSaving, setIsPinSaving] = useState(false);

  // State: Feedback umum
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTaxPercentage(cafeSettings?.taxPercentage ?? 10);
      setIsTaxIncluded(cafeSettings?.isTaxIncluded ?? true);
      setServicePercentage(cafeSettings?.servicePercentage ?? 0);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setPinFeedback(null);
      setSaveSuccess(false);
    }
  }, [isOpen, cafeSettings]);

  if (!isOpen) return null;

  const handleSaveTaxSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCafeSettings({
      ...cafeSettings,
      taxPercentage: Number(taxPercentage) || 0,
      isTaxIncluded: Boolean(isTaxIncluded),
      servicePercentage: Number(servicePercentage) || 0,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFeedback(null);

    const actualExpectedPin = cafeSettings?.posPassword?.trim() || '1234';

    if (currentPin.trim() !== actualExpectedPin) {
      setPinFeedback({ type: 'error', text: 'PIN Lama tidak sesuai.' });
      return;
    }

    if (!newPin.trim() || newPin.trim().length < 4) {
      setPinFeedback({ type: 'error', text: 'PIN Baru minimal 4 karakter / angka.' });
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setPinFeedback({ type: 'error', text: 'Konfirmasi PIN Baru tidak cocok.' });
      return;
    }

    setIsPinSaving(true);
    try {
      if (onUpdatePosPassword) {
        const res = await onUpdatePosPassword(newPin.trim());
        if (res && res.success === false) {
          setPinFeedback({ type: 'error', text: res.message || 'Gagal mengubah PIN kasir.' });
          setIsPinSaving(false);
          return;
        }
      } else {
        onUpdateCafeSettings({
          ...cafeSettings,
          posPassword: newPin.trim(),
        });
      }

      setPinFeedback({ type: 'success', text: 'PIN Kasir berhasil diubah dan disinkronkan ke Cloud!' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinFeedback({ type: 'error', text: err?.message || 'Terjadi kesalahan sistem saat menyimpan PIN.' });
    } finally {
      setIsPinSaving(false);
      setTimeout(() => setPinFeedback(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scaleUp text-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header Modal */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-lg text-slate-950 font-black shadow-md shadow-amber-500/20">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-black text-white">Pengaturan Kasir & Billing</h3>
              <p className="text-xs text-slate-400">Konfigurasi operasional khusus workstation POS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-fadeIn">
            <span>✅</span>
            <span>Pengaturan pajak & kasir berhasil disimpan!</span>
          </div>
        )}

        {/* 1. Pengaturan Pajak Resto (PB1) & Service Charge */}
        <form onSubmit={handleSaveTaxSettings} className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
            <span>🧾</span>
            <span>Pajak Restoran (PB1) & Biaya Layanan</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Skema Pajak Restoran (PB1):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaxIncluded(true)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isTaxIncluded
                      ? 'bg-amber-500/20 border-amber-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span>{isTaxIncluded ? '🔘' : '⚪'}</span> Sudah Termasuk
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Harga menu sudah nett termasuk PB1 (tidak menambah tagihan akhir).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTaxIncluded(false)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    !isTaxIncluded
                      ? 'bg-amber-500/20 border-amber-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span>{!isTaxIncluded ? '🔘' : '⚪'}</span> Tambahan di Kasir
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PB1 dihitung otomatis sebagai baris tambahan saat struk kasir dicetak.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tarif PB1 (%):</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-500">Standar Pemda: 10%</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Service Charge (%):</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={servicePercentage}
                    onChange={(e) => setServicePercentage(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-500">Biaya layanan lounge (opsional)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-98"
            >
              Simpan Pengaturan Pajak & Billing
            </button>
          </div>
        </form>

        {/* 2. Pengaturan Keamanan PIN Kasir (Cloud Sync) */}
        <form onSubmit={handleSavePin} className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-wider">
            <span>🔒</span>
            <span>Ubah PIN Akses Kasir (POS Security)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            PIN ini tersimpan di Firebase Cloud dan digunakan staf untuk membuka dasbor POS (<code>#/pos</code>).
          </p>

          {pinFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                pinFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              <span>{pinFeedback.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{pinFeedback.text}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">PIN Kasir Saat Ini:</label>
              <input
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Masukkan PIN lama"
                required
                className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">PIN Baru:</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Min 4 angka"
                  required
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Ulangi PIN Baru:</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Konfirmasi PIN"
                  required
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPinSaving}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            >
              {isPinSaving ? 'Menyimpan ke Cloud...' : 'Ubah PIN Kasir ➔'}
            </button>
          </div>
        </form>

        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
