import React, { useState } from 'react';
import { SongHistoryItem } from '../../types';
import { getYouTubeThumbnail } from '../../utils/youtube';

interface HistoryModalProps {
  isOpen: boolean;
  history?: SongHistoryItem[];
  onClose: () => void;
  onRequeue: (videoId: string, rawUrl: string, title: string) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history = [],
  onClose,
  onRequeue,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const safeHistory = Array.isArray(history) ? history : [];

  const filteredHistory = safeHistory.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item?.title || '').toLowerCase().includes(term) ||
      (item?.requester || '').toLowerCase().includes(term)
    );
  });

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} WIB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🕒</span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Riwayat Lagu yang Sudah Diputar</span>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                  {safeHistory.length} Lagu
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lagu otomatis tersimpan di database kafe untuk pencarian cepat berikutnya
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

        {/* Search & Actions Bar */}
        <div className="py-3.5 flex gap-2">
          <input
            type="text"
            placeholder="Cari judul lagu atau pemesan di riwayat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {safeHistory.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin mengosongkan log riwayat lagu?')) {
                  onClearHistory();
                }
              }}
              className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-xl text-xs font-semibold transition-colors border border-red-500/30"
            >
              Hapus Riwayat
            </button>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.thumbnail || getYouTubeThumbnail(item.videoId, 'default')}
                    alt="Thumbnail"
                    className="w-14 h-9 object-cover rounded-lg bg-slate-800 border border-slate-700 shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs sm:text-sm truncate" title={item.title}>
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-emerald-400 font-medium">👤 {item.requester}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 font-mono">🕒 {formatTime(item.playedAt)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRequeue(item.videoId, item.url, item.title);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition-all shadow-sm shrink-0 flex items-center gap-1 border border-blue-500/30 ml-2"
                  title="Tambahkan kembali ke antrean"
                >
                  <span>🔄</span>
                  <span>Putar Lagi</span>
                </button>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              <span className="text-3xl block mb-2">📜</span>
              {searchTerm
                ? 'Tidak ada riwayat yang cocok dengan pencarian Anda.'
                : 'Belum ada riwayat lagu yang selesai diputar hari ini.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-700/60 flex justify-end">
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
