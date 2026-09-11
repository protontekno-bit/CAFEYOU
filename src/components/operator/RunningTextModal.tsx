import React, { useState } from 'react';

interface RunningTextModalProps {
  isOpen: boolean;
  currentText?: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

const PRESET_ANNOUNCEMENTS = [
  'Selamat Datang di CAFEYOU Karaoke Lounge • Nikmati Suasana & Lagu Terbaik!',
  '🎉 Selamat Ulang Tahun untuk Tamu di Meja VIP! Semoga Panjang Umur & Sukses Selalu! 🎂',
  '☕ Promo Happy Hour: Beli 2 Minuman Gratis 1 Snack mulai pukul 19:00 - 22:00 WIB!',
  '🎤 Silakan Pesan Lagu Favorit Anda di Meja Kasir atau via Waiter kami.',
];

export const RunningTextModal: React.FC<RunningTextModalProps> = ({
  isOpen,
  currentText = '',
  onClose,
  onSave,
}) => {
  const [text, setText] = useState(currentText);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(text.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <div>
              <h2 className="text-lg font-bold text-white">Pengumuman Running Text</h2>
              <p className="text-xs text-slate-400">
                Teks berjalan yang ditampilkan di bawah layar proyektor
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Isi Teks Berjalan
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik pengumuman, ucapan ulang tahun, atau info promo di sini..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">
              Template Cepat:
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {PRESET_ANNOUNCEMENTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(preset)}
                  className="w-full text-left text-xs p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-300 border border-slate-700/50 hover:border-slate-600 truncate transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setText('');
                onSave('');
                onClose();
              }}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors"
            >
              Hapus Running Text
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              Simpan & Tampilkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
