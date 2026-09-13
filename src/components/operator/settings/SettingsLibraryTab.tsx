import React, { useState } from 'react';
import { SavedLibrarySong } from '../../../types';
import { DEFAULT_SONG_THUMBNAIL } from '../../../utils/youtube';

interface SettingsLibraryTabProps {
  songLibrary?: Record<string, SavedLibrarySong>;
  onDeleteFromLibrary?: (videoId: string) => void;
  onClearLibrary?: () => void;
  autoSaveLibrary?: boolean;
  onToggleAutoSaveLibrary?: (enabled: boolean) => void;
}

export const SettingsLibraryTab: React.FC<SettingsLibraryTabProps> = ({
  songLibrary = {},
  onDeleteFromLibrary,
  onClearLibrary,
  autoSaveLibrary = true,
  onToggleAutoSaveLibrary,
}) => {
  const [librarySearch, setLibrarySearch] = useState('');

  const filteredLibrary = Object.values(songLibrary).filter((s) => {
    if (!librarySearch.trim()) return true;
    const q = librarySearch.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>📚 Database Koleksi Lagu Kafe</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Kelola daftar lagu tersimpan ({Object.keys(songLibrary).length} judul lagu).
        </p>
      </div>

      {/* Card Pengaturan Auto-Save vs Temporary Session */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 shadow-inner">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>💾 Mode Penyimpanan Lagu ke Database</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                  autoSaveLibrary
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {autoSaveLibrary ? 'Simpan Otomatis (Cloud & Lokal)' : 'Mode Sesi Bersih (Sementara)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {autoSaveLibrary
                ? 'Setiap lagu yang dipesan dan diputar otomatis disimpan permanen ke koleksi kafe dan Cloud.'
                : 'Lagu pesanan tamu hanya diputar di antrean hari ini saja (tidak disimpan permanen ke database kafe dan akan bersih saat browser dibersihkan).'}
            </p>
          </div>
          {onToggleAutoSaveLibrary && (
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoSaveLibrary}
                onChange={(e) => onToggleAutoSaveLibrary(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={librarySearch}
          onChange={(e) => setLibrarySearch(e.target.value)}
          placeholder="Cari lagu di koleksi..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredLibrary.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">Tidak ada lagu yang cocok.</div>
        ) : (
          filteredLibrary.map((song) => (
            <div
              key={song.videoId}
              className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={song.thumbnail || DEFAULT_SONG_THUMBNAIL}
                  alt={song.title}
                  className="w-12 h-9 object-cover rounded-lg shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                  }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{song.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {song.artist || 'Artis Kafe'} • Diputar {song.playCount || 0}x
                  </div>
                </div>
              </div>

              {onDeleteFromLibrary && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Hapus "${song.title}" dari database kafe?`)) {
                      onDeleteFromLibrary(song.videoId);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs shrink-0"
                  title="Hapus dari koleksi"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {onClearLibrary && (
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH koleksi lagu kafe? Tindakan ini tidak dapat dibatalkan.'
                )
              ) {
                onClearLibrary();
              }
            }}
            className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>⚠️ Reset & Kosongkan Seluruh Database Lagu</span>
          </button>
        </div>
      )}
    </div>
  );
};
