import React, { useState, useMemo, useEffect } from 'react';
import { CloudIcon, SparklesIcon, SearchIcon } from '../icons/Icons';
import {
  extractYouTubeID,
  getYouTubeThumbnail,
  fetchYouTubeInfo,
  searchYouTubeVideos,
  POPULAR_KARAOKE_SONGS,
} from '../../utils/youtube';
import { QUICK_TABLES } from '../../constants/karaoke';
import { SavedLibrarySong, SongHistoryItem, YouTubeSearchResult } from '../../types';

interface AddSongFormProps {
  onAddSong: (videoId: string, rawUrl: string, requester: string, customTitle?: string) => void;
  onOpenPopularModal?: () => void;
  songLibrary?: Record<string, SavedLibrarySong>;
  history?: SongHistoryItem[];
  tables?: string[];
  youtubeApiKey?: string;
}

export const AddSongForm: React.FC<AddSongFormProps> = ({
  onAddSong,
  onOpenPopularModal,
  songLibrary = {},
  history = [],
  tables,
  youtubeApiKey,
}) => {
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;
  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');
  const [searchInput, setSearchInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [detectedVideoId, setDetectedVideoId] = useState<string | null>(null);

  // Live YouTube Search State
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);

  // Menggabungkan seluruh sumber data (Catalog Preset + History Pemutaran + Song Library)
  const allSavedSongs = useMemo(() => {
    const map = new Map<string, SavedLibrarySong>();

    // 1. Masukkan Katalog Lagu Populer Kafe
    POPULAR_KARAOKE_SONGS.forEach((song) => {
      map.set(song.videoId, {
        videoId: song.videoId,
        title: `${song.title} - ${song.artist}`,
        artist: song.artist,
        thumbnail: getYouTubeThumbnail(song.videoId, 'hqdefault'),
        url: `https://www.youtube.com/watch?v=${song.videoId}`,
        playCount: 0,
        lastPlayedAt: 0,
      });
    });

    // 2. Masukkan Riwayat Pemutaran
    (history || []).forEach((item) => {
      if (item && item.videoId) {
        const existing = map.get(item.videoId);
        map.set(item.videoId, {
          videoId: item.videoId,
          title: item.title,
          thumbnail: item.thumbnail || getYouTubeThumbnail(item.videoId, 'hqdefault'),
          url: item.url || `https://www.youtube.com/watch?v=${item.videoId}`,
          playCount: (existing?.playCount || 0) + 1,
          lastPlayedAt: item.playedAt,
        });
      }
    });

    // 3. Masukkan Database Song Library Kafe
    Object.values(songLibrary || {}).forEach((item) => {
      if (item && item.videoId) {
        const existing = map.get(item.videoId);
        map.set(item.videoId, {
          ...existing,
          ...item,
          thumbnail: item.thumbnail || getYouTubeThumbnail(item.videoId, 'hqdefault'),
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
  }, [songLibrary, history]);

  // Filter lagu berdasarkan kata kunci pencarian
  const searchResults = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) {
      return allSavedSongs.slice(0, 8); // Tampilkan 8 lagu teratas jika search kosong
    }
    return allSavedSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(term) ||
        (song.artist && song.artist.toLowerCase().includes(term)) ||
        song.videoId.toLowerCase().includes(term)
    );
  }, [searchInput, allSavedSongs]);

  // Otomatis fetch judul saat user menempel link YouTube di tab URL
  useEffect(() => {
    const videoId = extractYouTubeID(linkInput);
    setDetectedVideoId(videoId || null);

    if (videoId) {
      setIsFetchingInfo(true);
      fetchYouTubeInfo(videoId)
        .then((info) => {
          if (info && info.title) {
            setCustomTitleInput(info.title);
          }
        })
        .finally(() => {
          setIsFetchingInfo(false);
        });
    } else {
      setCustomTitleInput('');
    }
  }, [linkInput]);

  const handleSelectFromLibrary = (song: SavedLibrarySong) => {
    onAddSong(
      song.videoId,
      song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
      nameInput.trim(),
      song.title
    );
    setSearchInput('');
    setNameInput('');
  };

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!linkInput.trim()) {
      setErrorMsg('Tautan YouTube tidak boleh kosong');
      return;
    }

    const videoId = extractYouTubeID(linkInput);
    if (!videoId) {
      setErrorMsg('Tautan YouTube tidak valid. Gunakan format youtube.com/watch?v=... atau youtu.be/...');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSong(
        videoId,
        linkInput.trim(),
        nameInput.trim(),
        customTitleInput.trim() || undefined
      );
      setLinkInput('');
      setCustomTitleInput('');
      setNameInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>➕</span> Tambah Lagu
        </h2>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('search');
              setErrorMsg('');
            }}
            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Cari di Database ({allSavedSongs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setErrorMsg('');
            }}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>+ Link YouTube</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Nama Pemesan / Meja */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Nama Pemesan / Meja
          </label>
          <span className="text-[10px] text-slate-500">(Opsional)</span>
        </div>
        <input
          type="text"
          placeholder="Ketik nama tamu atau klik tombol meja di bawah"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
        />

        {/* Quick Table Chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {activeTables.map((table) => (
            <button
              key={table}
              type="button"
              onClick={() => setNameInput(table)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                nameInput === table
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 border border-slate-700/60'
              }`}
            >
              {table}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Cari dari Database Library Kafe */}
      {activeTab === 'search' && (
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
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

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
                    onClick={() => handleSelectFromLibrary(song)}
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
                    onClick={async () => {
                      if (!searchInput.trim()) return;
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
                        setYtSearchError(err?.message || 'Gangguan jaringan');
                      } finally {
                        setIsSearchingYt(false);
                      }
                    }}
                    disabled={isSearchingYt}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 mx-auto"
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
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-purple-300 font-semibold text-xs rounded-xl border border-purple-500/30 transition-all inline-flex items-center gap-1 mx-auto"
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
                    className="text-[10px] text-slate-500 hover:text-slate-300"
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
                        const requester = nameInput.trim() || 'Kasir';
                        const url = `https://www.youtube.com/watch?v=${video.videoId}`;
                        onAddSong(video.videoId, url, requester, video.title);
                        setSearchInput('');
                        setNameInput('');
                        setYtResults([]);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 ml-2 shadow-sm active:scale-95"
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
              className="w-full py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Buka Katalog Lengkap Lagu Populer Kafe (⭐)</span>
            </button>
          )}
        </div>
      )}

      {/* Mode 2: Tempel Link YouTube Baru */}
      {activeTab === 'url' && (
        <form onSubmit={handleSubmitUrl} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tautan YouTube
            </label>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... atau https://youtu.be/..."
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {/* Pratinjau Otomatis & Judul Lagu */}
          {detectedVideoId && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-3">
                <img
                  src={getYouTubeThumbnail(detectedVideoId, 'hqdefault')}
                  alt="Thumbnail"
                  className="w-16 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">
                    {isFetchingInfo ? 'Mengambil Judul Asli...' : 'Video Ditemukan ✓'}
                  </div>
                  <input
                    type="text"
                    value={customTitleInput}
                    onChange={(e) => setCustomTitleInput(e.target.value)}
                    placeholder="Nama Lagu / Artis (Bisa diedit)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 mt-1 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50 text-xs"
          >
            <CloudIcon className="w-4 h-4" />
            <span>{isSubmitting ? 'Memproses...' : 'Tambahkan ke Antrean'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
