import React from 'react';
import { SparklesIcon } from '../icons/Icons';
import { SavedLibrarySong } from '../../types';
import { getYouTubeThumbnail, DEFAULT_SONG_THUMBNAIL } from '../../utils/youtube';

interface AddSongSearchTabProps {
  searchQuery: string;
  searchResults: SavedLibrarySong[];
  totalSavedCount: number;
  onSelectFromLibrary: (song: SavedLibrarySong) => void;
  onOpenPopularModal?: () => void;
  onSwitchToYouTube: () => void;
}

export const AddSongSearchTab: React.FC<AddSongSearchTabProps> = ({
  searchQuery,
  searchResults,
  totalSavedCount,
  onSelectFromLibrary,
  onOpenPopularModal,
  onSwitchToYouTube,
}) => {
  return (
    <div className="space-y-2.5 font-sans">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-xs font-semibold text-slate-300">
          {searchQuery ? 'Hasil Pencarian Koleksi Kafe:' : 'Lagu Tersedia & Riwayat Kafe:'}
        </span>
        <span className="text-[11px] text-slate-400">
          Ditemukan: <strong className="text-emerald-400">{searchResults.length}</strong>{' '}
          {searchQuery ? `dari ${totalSavedCount}` : 'lagu'}
        </span>
      </div>

      {/* Hasil Daftar Lagu Koleksi Kafe */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {searchResults.length > 0 ? (
          searchResults.map((song) => (
            <div
              key={song.videoId}
              className="flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-700/60 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={song.thumbnail || getYouTubeThumbnail(song.videoId, 'default')}
                  alt="Thumbnail"
                  className="w-12 h-8 object-cover rounded bg-slate-800 border border-slate-700 shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-100 truncate" title={song.title}>
                    {song.title}
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                    {song.artist && <span className="text-slate-300">{song.artist}</span>}
                    {song.playCount !== undefined && song.playCount > 0 && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span>
                          Diputar: <strong className="text-emerald-400 font-mono">{song.playCount}x</strong>
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectFromLibrary(song)}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-bold transition-all shrink-0 ml-2 border border-purple-500/30 active:scale-95 cursor-pointer"
              >
                + Antrekan
              </button>
            </div>
          ))
        ) : (
          <div className="py-6 px-3 text-center text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-700/40 space-y-3">
            <p className="text-slate-300">
              Lagu <strong>"{searchQuery}"</strong> belum tersimpan di koleksi kafe.
            </p>
            <button
              type="button"
              onClick={onSwitchToYouTube}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 mx-auto active:scale-95 cursor-pointer"
            >
              <span>🔴</span>
              <span>Cari "{searchQuery}" di YouTube ➔</span>
            </button>
          </div>
        )}
      </div>

      {onOpenPopularModal && (
        <button
          type="button"
          onClick={onOpenPopularModal}
          className="w-full py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Buka Katalog Lengkap Lagu Populer Kafe (⭐)</span>
        </button>
      )}
    </div>
  );
};
