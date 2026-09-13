import React, { useState } from 'react';
import { SongHistoryItem, SavedLibrarySong } from '../../types';
import { getYouTubeThumbnail, DEFAULT_SONG_THUMBNAIL } from '../../utils/youtube';

interface HistoryModalProps {
  isOpen: boolean;
  history?: SongHistoryItem[];
  songLibrary?: Record<string, SavedLibrarySong>;
  onClose: () => void;
  onRequeue: (videoId: string, rawUrl: string, title: string) => void;
  onClearHistory: () => void;
  onSaveToLibrary?: (song: SongHistoryItem) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history = [],
  songLibrary = {},
  onClose,
  onRequeue,
  onClearHistory,
  onSaveToLibrary,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [justSavedIds, setJustSavedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const safeHistory = Array.isArray(history) ? history : [];

  const filteredHistory = safeHistory.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item?.title || '').toLowerCase().includes(term) ||
      (item?.requester || '').toLowerCase().includes(term)
    );
  });

  const unsavedCount = safeHistory.filter(
    (item) => !songLibrary || (!songLibrary[item.videoId] && !justSavedIds[item.videoId])
  ).length;

  const handleSaveItem = (item: SongHistoryItem) => {
    if (onSaveToLibrary) {
      onSaveToLibrary(item);
      setJustSavedIds((prev) => ({ ...prev, [item.videoId]: true }));
    }
  };

  const handleSaveAllUnsaved = () => {
    if (onSaveToLibrary) {
      safeHistory.forEach((item) => {
        if (!songLibrary || (!songLibrary[item.videoId] && !justSavedIds[item.videoId])) {
          onSaveToLibrary(item);
        }
      });
      const newMap: Record<string, boolean> = {};
      safeHistory.forEach((s) => {
        newMap[s.videoId] = true;
      });
      setJustSavedIds((prev) => ({ ...prev, ...newMap }));
    }
  };

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
                Pilih lagu yang ingin disimpan ke database kafe atau diputar ulang
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
        <div className="py-3.5 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Cari judul lagu atau pemesan di riwayat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {unsavedCount > 0 && onSaveToLibrary && (
            <button
              type="button"
              onClick={handleSaveAllUnsaved}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Simpan semua lagu riwayat yang belum ada ke database koleksi"
            >
              <span>⭐</span>
              <span>+ Simpan Semua ke Database ({unsavedCount})</span>
            </button>
          )}
          {safeHistory.length > 0 && (
            <button
              type="button"
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
            filteredHistory.map((item) => {
              const isAlreadyInLib = Boolean((songLibrary && songLibrary[item.videoId]) || justSavedIds[item.videoId]);

              return (
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
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                      }}
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

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {onSaveToLibrary && (
                      isAlreadyInLib ? (
                        <span className="px-2.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1">
                          <span>✓</span>
                          <span className="hidden sm:inline">Di Database</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveItem(item)}
                          className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-lg text-xs font-bold transition-all border border-amber-500/40 flex items-center gap-1 active:scale-95 shadow-sm"
                          title="Masukkan lagu ini ke database koleksi kafe"
                        >
                          <span>⭐</span>
                          <span>+ Database</span>
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onRequeue(item.videoId, item.url, item.title);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition-all shadow-sm shrink-0 flex items-center gap-1 border border-blue-500/30 active:scale-95"
                      title="Tambahkan kembali ke antrean"
                    >
                      <span>🔄</span>
                      <span>Putar Lagi</span>
                    </button>
                  </div>
                </div>
              );
            })
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
