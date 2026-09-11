import React, { useState, useEffect } from 'react';
import { CafeSettings } from '../../types';
import { DEFAULT_CAFE_SETTINGS } from '../../constants/karaoke';
import { CheckIcon } from '../icons/Icons';

interface CafeSettingsModalProps {
  isOpen: boolean;
  settings: CafeSettings;
  onClose: () => void;
  onSave: (newSettings: CafeSettings) => void;
}

export const CafeSettingsModal: React.FC<CafeSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(settings?.name || DEFAULT_CAFE_SETTINGS.name);
  const [tagline, setTagline] = useState(settings?.tagline || DEFAULT_CAFE_SETTINGS.tagline || '');
  const [welcomeMessage, setWelcomeMessage] = useState(
    settings?.welcomeMessage || DEFAULT_CAFE_SETTINGS.welcomeMessage || ''
  );
  const [wifiName, setWifiName] = useState(settings?.wifiName || '');
  const [wifiPassword, setWifiPassword] = useState(settings?.wifiPassword || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(settings?.name || DEFAULT_CAFE_SETTINGS.name);
      setTagline(settings?.tagline || DEFAULT_CAFE_SETTINGS.tagline || '');
      setWelcomeMessage(settings?.welcomeMessage || DEFAULT_CAFE_SETTINGS.welcomeMessage || '');
      setWifiName(settings?.wifiName || '');
      setWifiPassword(settings?.wifiPassword || '');
      setIsSaved(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'CAFEYOU';
    onSave({
      name: finalName,
      tagline: tagline.trim(),
      welcomeMessage: welcomeMessage.trim(),
      wifiName: wifiName.trim(),
      wifiPassword: wifiPassword.trim(),
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  const handleResetToDefault = () => {
    setName(DEFAULT_CAFE_SETTINGS.name);
    setTagline(DEFAULT_CAFE_SETTINGS.tagline || '');
    setWelcomeMessage(DEFAULT_CAFE_SETTINGS.welcomeMessage || '');
    setWifiName(DEFAULT_CAFE_SETTINGS.wifiName || '');
    setWifiPassword(DEFAULT_CAFE_SETTINGS.wifiPassword || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 text-xl font-bold">
              🏪
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Pengaturan Identitas Kafe / Venue</span>
              </h2>
              <p className="text-xs text-slate-400">
                Sesuaikan nama dan identitas kafe tempat sistem karaoke ini diterapkan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-inner space-y-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Pratinjau Tampilan Branding Venue</span>
            <span className="text-amber-400 font-mono">LIVE PREVIEW</span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <div className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                {name.trim() || 'CAFEYOU'}
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {tagline.trim() || 'Karaoke Lounge & Cafe'}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
                Sistem Karaoke Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Form Pengaturan */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nama Kafe */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-200">
              Nama Kafe / Venue <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: CAFEYOU, Kopi Kenangan, Bintang Lounge"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-semibold transition-all text-xs"
            />
            <p className="text-[11px] text-slate-400">
              Nama ini akan otomatis tampil di Layar TV Proyektor, Stiker QR Meja, dan Portal HP Tamu.
            </p>
          </div>

          {/* Sub-judul / Tagline */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-200">
              Tagline / Jenis Kafe (Opsional)
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Contoh: Coffee & Eatery, Premium Karaoke & Resto"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all text-xs"
            />
          </div>

          {/* Pesan Selamat Datang Default */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-200">
              Pesan Sambutan Default di Running Text
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
              placeholder="Contoh: Selamat Datang di CAFEYOU Karaoke! Scan QR Meja untuk Pilih Lagu."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all text-xs resize-none"
            />
          </div>

          {/* Info Wi-Fi Kafe */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <span>📶 Info Wi-Fi Kafe untuk Tamu (Opsional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Nama Wi-Fi (SSID)</label>
                <input
                  type="text"
                  value={wifiName}
                  onChange={(e) => setWifiName(e.target.value)}
                  placeholder="Contoh: CAFEYOU_GUEST"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Password Wi-Fi</label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Contoh: kopienak123"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Aksi Modal */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
            >
              Reset ke Default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
              >
                {isSaved ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-emerald-300" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
