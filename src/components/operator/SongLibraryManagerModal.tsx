import React, { useState, useMemo } from 'react';
import { SavedLibrarySong } from '../../types';

interface SongLibraryManagerModalProps {
  isOpen: boolean;
  songLibrary: Record<string, SavedLibrarySong>;
  onClose: () => void;
  onDeleteSong: (videoId: string) => void;
  onClearLibrary: () => void;
  onAddToQueue: (videoId: string, url: string, title: string) => void;
}

export const SongLibraryManagerModal: React.FC<SongLibraryManagerModalProps> = ({
  isOpen,
  songLibrary,
  onClose,
  onDeleteSong,
  onClearLibrary,
  onAddToQueue,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'playCount' | 'lastPlayed' | 'title'>('playCount');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ✅ Semua hooks HARUS dipanggil SEBELUM early return (Rules of Hooks)
  const songs = useMemo(() => {
    const list = Object.values(songLibrary || {});
    const filtered = searchTerm.trim()
      ? list.filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
      : list;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'playCount') return (b.playCount || 0) - (a.playCount || 0);
      if (sortBy === 'lastPlayed') return (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0);
      return a.title.localeCompare(b.title);
    });
  }, [songLibrary, searchTerm, sortBy]);

  const totalSongs = Object.keys(songLibrary || {}).length;
  const totalPlays = Object.values(songLibrary || {}).reduce(
    (acc, s) => acc + (s.playCount || 0),
    0
  );

  if (!isOpen) return null;

  const formatDate = (ts?: number) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteConfirmed = (videoId: string) => {
    onDeleteSong(videoId);
    setConfirmDeleteId(null);
  };

  const handleClearAllConfirmed = () => {
    onClearLibrary();
    setConfirmClearAll(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 flex items-center justify-center text-xl shadow-md shadow-purple-500/20">
              📚
            </div>
            <div>
              <h2 className="text-base font-black text-white">Kelola Koleksi Lagu Kafe</h2>
              <p className="text-xs text-slate-400">
                {totalSongs} lagu tersimpan · {totalPlays} kali diputar
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

        {/* Toolbar: Search + Sort + Clear All */}
        <div className="p-4 border-b border-slate-700/40 flex flex-wrap gap-2.5 items-center shrink-0">
          <input
            type="text"
            placeholder="Cari judul lagu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          {/* Sort Selector */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            {(['playCount', 'lastPlayed', 'title'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                  sortBy === s
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'playCount' ? '🔥 Terpopuler' : s === 'lastPlayed' ? '🕒 Terbaru' : '🔤 A–Z'}
              </button>
            ))}
          </div>

          {/* Hapus Semua */}
          {totalSongs > 0 && !confirmClearAll && (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="px-3 py-2 bg-red-900/40 hover:bg-red-800/50 text-red-400 hover:text-red-300 text-xs font-semibold rounded-xl border border-red-800/50 transition-all"
            >
              🗑️ Hapus Semua
            </button>
          )}
          {confirmClearAll && (
            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-700/60 rounded-xl px-3 py-1.5">
              <span className="text-xs text-red-300 font-semibold">Yakin hapus semua?</span>
              <button
                onClick={handleClearAllConfirmed}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg"
              >
                Ya
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-2.5 py-1 bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Song List */}
        <div className="overflow-y-auto flex-1 custom-scrollbar p-3 space-y-2">
          {songs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <span className="text-5xl">🎵</span>
              <p className="text-sm font-medium">
                {searchTerm ? 'Tidak ada lagu yang cocok.' : 'Koleksi lagu masih kosong.'}
              </p>
            </div>
          )}

          {songs.map((song) => (
            <div
              key={song.videoId}
              className="flex items-center gap-3 p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 rounded-xl transition-all group"
            >
              {/* Thumbnail */}
              <img
                src={song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`}
                alt={song.title}
                className="w-14 h-10 object-cover rounded-lg shrink-0 bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`;
                }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{song.title}</div>
                <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-slate-400">
                  <span className="text-amber-400 font-bold">🔥 {song.playCount || 0}x</span>
                  <span>·</span>
                  <span>Terakhir: {formatDate(song.lastPlayedAt)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Putar ke antrean */}
                <button
                  onClick={() =>
                    onAddToQueue(
                      song.videoId,
                      song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
                      song.title
                    )
                  }
                  className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all text-xs font-bold"
                  title="Tambah ke Antrean Sekarang"
                >
                  ▶
                </button>

                {/* Hapus */}
                {confirmDeleteId === song.videoId ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteConfirmed(song.videoId)}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1.5 bg-slate-700 text-slate-300 text-[11px] rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(song.videoId)}
                    className="p-2 bg-red-900/30 hover:bg-red-700/50 text-red-500 hover:text-red-300 rounded-lg transition-all text-xs"
                    title="Hapus dari Koleksi"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/60 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500">
            {songs.length} dari {totalSongs} lagu ditampilkan
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
