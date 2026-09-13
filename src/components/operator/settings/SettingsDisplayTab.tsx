import React, { useState, useEffect } from 'react';
import { CheckIcon } from '../../icons/Icons';

interface SettingsDisplayTabProps {
  runningText?: string;
  onSaveRunningText: (text: string) => void;
  onOpenProjectorTab?: () => void;
}

export const SettingsDisplayTab: React.FC<SettingsDisplayTabProps> = ({
  runningText = '',
  onSaveRunningText,
  onOpenProjectorTab,
}) => {
  const [rtInput, setRtInput] = useState(runningText);
  const [isRtSaved, setIsRtSaved] = useState(false);

  useEffect(() => {
    setRtInput(runningText);
  }, [runningText]);

  const handleSaveRt = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRunningText(rtInput.trim());
    setIsRtSaved(true);
    setTimeout(() => setIsRtSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>📢 Layar TV & Running Text</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Atur teks pesan berjalan yang tayang di bagian bawah layar proyektor atau TV kafe.
        </p>
      </div>

      <form onSubmit={handleSaveRt} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Pesan Running Text:</label>
          <textarea
            rows={3}
            value={rtInput}
            onChange={(e) => setRtInput(e.target.value)}
            placeholder="Tuliskan promo atau pesan untuk pelanggan..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* Preset Cepat */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400">Template Pesan Cepat:</div>
          <div className="flex flex-wrap gap-2">
            {[
              'Selamat Datang di CAFEYOU! • Pesan Makanan & Minuman di Kasir • Selamat Bernyanyi!',
              '🎤 Promo Happy Hour Karaoke! Nikmati Diskon Menu Spesial Hari Ini!',
              'Perhatian: Pesanan lagu ditutup 30 menit sebelum kafe tutup.',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setRtInput(preset)}
                className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-left transition-colors"
              >
                {preset.substring(0, 45)}...
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            {isRtSaved ? (
              <>
                <CheckIcon className="w-4 h-4 text-white" />
                <span>Running Text Diperbarui!</span>
              </>
            ) : (
              <span>Terapkan ke Layar TV</span>
            )}
          </button>

          {onOpenProjectorTab && (
            <button
              type="button"
              onClick={onOpenProjectorTab}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>Buka Tab Proyektor ↗</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
