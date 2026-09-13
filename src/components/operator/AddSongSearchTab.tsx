import React, { useState } from 'react';
import { SearchIcon, SparklesIcon } from '../icons/Icons';
import { SavedLibrarySong, YouTubeSearchResult } from '../../types';
import { getYouTubeThumbnail, searchYouTubeVideos, DEFAULT_SONG_THUMBNAIL } from '../../utils/youtube';

interface AddSongSearchTabProps {
  searchInput: string;
  onSearchInputChange: (term: string) => void;
  searchResults: SavedLibrarySong[];
  onSelectFromLibrary: (song: SavedLibrarySong) => void;
  onAddSong: (videoId: string, rawUrl: string, requester: string, customTitle?: string) => void;
  requesterName: string;
  onClearInputs: () => void;
  youtubeApiKey?: string;
  onOpenPopularModal?: () => void;
}

export const AddSongSearchTab: React.FC<AddSongSearchTabProps> = ({
  searchInput,
  onSearchInputChange,
  searchResults,
  onSelectFromLibrary,
  onAddSong,
  requesterName,
  onClearInputs,
  youtubeApiKey,
  onOpenPopularModal,
}) => {
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);

  const handleSearchYouTube = async () => {
    if (!searchInput.trim() || !youtubeApiKey) return;
    setIsSearchingYt(true);
    setYtSearchError(null);
    try {
      const target = searchInput.toLowerCase().includes('karaoke')
        ? searchInput.trim()
        : `${searchInput.trim()} karaoke`;
      const res = await searchYouTubeVideos(target, youtubeApiKey, 6);
      if (res.success) {
        setYtResults(res.results);
      } else {
        setYtSearchError(res.error || 'Gagal mencari di YouTube');
      }
    } catch (err: any) {
      setYtSearchError(err?.message || 'Gangguan koneksi YouTube');
    } finally {
      setIsSearchingYt(false);
    }
  };

  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-semibold text-slate-300">
            Pencarian Cepat Lagu Kafe
          </label>
          <span className="text-[11px] text-slate-400">
            Ditemukan: <strong className="text-emerald-400">{searchResults.length}</strong> lagu
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Ketik judul lagu, artis, atau kata kunci..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
          <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>
      </div>

      {ytSearchError && (
        <div className="p-2.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{ytSearchError}</span>
        </div>
      )}

      {/* Hasil Saran Pencarian */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {searchResults.length > 0 ? (
          searchResults.map((song) => (
            <div
              key={song.videoId}
              className="flex items-center justify-between p-2.5 bg-slate-900/75 hover:bg-slate-900 rounded-xl border border-slate-700/60 hover:border-blue-500/50 transition-all group"
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
                    <span className="text-slate-500">•</span>
                    <span>Diputar: <strong className="text-emerald-400 font-mono">{song.playCount}x</strong></span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectFromLibrary(song)}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition-all shrink-0 ml-2 border border-blue-500/30 active:scale-95"
              >
                + Antrekan
              </button>
            </div>
          ))
        ) : (
          <div className="py-5 px-3 text-center text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-700/40 space-y-2.5">
            <p>Tidak ada lagu di database kafe untuk <em>"{searchInput}"</em>.</p>
            {youtubeApiKey ? (
              <button
                type="button"
                onClick={handleSearchYouTube}
                disabled={isSearchingYt}
                className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 mx-auto active:scale-95 cursor-pointer"
              >
                <span>🔴</span>
                <span>{isSearchingYt ? 'Mencari di YouTube...' : `Cari "${searchInput}" di YouTube`}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const q = searchInput.toLowerCase().includes('karaoke') ? searchInput : `${searchInput} karaoke`;
                  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-purple-300 font-semibold text-xs rounded-xl border border-purple-500/30 transition-all inline-flex items-center gap-1 mx-auto cursor-pointer"
              >
                <span>Cari di YouTube ↗</span>
              </button>
            )}
          </div>
        )}

        {/* Hasil Pencarian YouTube Langsung (Jika ada) */}
        {ytResults.length > 0 && (
          <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-red-400 font-bold px-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Hasil YouTube Live:</span>
              </span>
              <button
                type="button"
                onClick={() => setYtResults([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Tutup ✕
              </button>
            </div>
            {ytResults.map((video) => (
              <div
                key={video.videoId}
                className="flex items-center justify-between p-2.5 bg-slate-900/90 hover:bg-slate-850 rounded-xl border border-red-500/30 transition-all group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={video.thumbnail}
                    alt="Thumbnail"
                    className="w-12 h-8 object-cover rounded bg-slate-800 border border-slate-700 shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate" title={video.title}>
                      {video.title}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {video.channelTitle || 'YouTube'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const requester = requesterName.trim() || 'Kasir';
                    const url = `https://www.youtube.com/watch?v=${video.videoId}`;
                    onAddSong(video.videoId, url, requester, video.title);
                    onClearInputs();
                    setYtResults([]);
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 ml-2 shadow-sm active:scale-95 cursor-pointer"
                >
                  + Antrekan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {onOpenPopularModal && (
        <button
          type="button"
          onClick={onOpenPopularModal}
          className="w-full py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Buka Katalog Lengkap Lagu Populer Kafe (⭐)</span>
        </button>
      )}
    </div>
  );
};
