import React, { useState, useEffect } from 'react';
import { SearchIcon, SparklesIcon } from '../icons/Icons';
import {
  extractYouTubeID,
  getYouTubeThumbnail,
  fetchYouTubeInfo,
  searchYouTubeVideos,
  DEFAULT_SONG_THUMBNAIL,
} from '../../utils/youtube';
import { YouTubeSearchResult } from '../../types';

interface AddSongYouTubeTabProps {
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  youtubeApiKey?: string;
  requesterName: string;
  onAddSong: (videoId: string, rawUrl: string, requester: string, customTitle?: string) => void;
  onClearQuery: () => void;
}

export const AddSongYouTubeTab: React.FC<AddSongYouTubeTabProps> = ({
  searchQuery,
  onSearchQueryChange,
  youtubeApiKey,
  requesterName,
  onAddSong,
  onClearQuery,
}) => {
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // State deteksi link YouTube otomatis
  const [detectedVideoId, setDetectedVideoId] = useState<string | null>(null);
  const [detectedTitle, setDetectedTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const currentVideoId = extractYouTubeID(searchQuery);

  // Otomatis fetch judul saat link YouTube terdeteksi di kolom pencarian
  useEffect(() => {
    if (currentVideoId) {
      setDetectedVideoId(currentVideoId);
      setIsLoadingPreview(true);
      fetchYouTubeInfo(currentVideoId)
        .then((info) => {
          if (info && info.title) {
            setDetectedTitle(info.title);
            setCustomTitle(info.title);
          } else {
            setDetectedTitle(`YouTube Video (${currentVideoId})`);
            setCustomTitle(`YouTube Video (${currentVideoId})`);
          }
        })
        .catch(() => {
          setDetectedTitle(`YouTube Video (${currentVideoId})`);
          setCustomTitle(`YouTube Video (${currentVideoId})`);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    } else {
      setDetectedVideoId(null);
      setDetectedTitle('');
      setCustomTitle('');
    }
  }, [currentVideoId]);

  // Handler Pencarian Live YouTube berdasarkan judul
  const handleLiveSearch = async (term?: string) => {
    const q = (term !== undefined ? term : searchQuery).trim();
    if (!q || extractYouTubeID(q)) return;

    if (!youtubeApiKey) {
      setYtError('Kunci API YouTube belum dikonfigurasi di Pengaturan Kafe.');
      return;
    }

    setIsSearching(true);
    setYtError(null);
    try {
      const targetQuery = q.toLowerCase().includes('karaoke') ? q : `${q} karaoke`;
      const res = await searchYouTubeVideos(targetQuery, youtubeApiKey, 8);
      if (res.success) {
        setYtResults(res.results);
      } else {
        setYtError(res.error || 'Gagal memuat video YouTube.');
      }
    } catch (err: any) {
      setYtError(err?.message || 'Terjadi kendala saat menghubungi YouTube.');
    } finally {
      setIsSearching(false);
    }
  };

  // Otomatis picu live search dengan debounce saat user mengetik judul
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed && !extractYouTubeID(trimmed) && youtubeApiKey) {
      const timer = setTimeout(() => {
        handleLiveSearch(trimmed);
      }, 500);
      return () => clearTimeout(timer);
    } else if (!trimmed) {
      setYtResults([]);
      setYtError(null);
    }
  }, [searchQuery, youtubeApiKey]);

  // Handler Tempel Cepat dari Clipboard
  const handleSmartPaste = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setPasteNotice('Clipboard tidak didukung.');
        setTimeout(() => setPasteNotice(null), 2500);
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setPasteNotice('Clipboard kosong.');
        setTimeout(() => setPasteNotice(null), 2500);
        return;
      }
      const trimmed = text.trim();
      onSearchQueryChange(trimmed);
      setPasteNotice(extractYouTubeID(trimmed) ? 'Link YouTube ditempel! ✓' : 'Teks pencarian ditempel! ✓');
      setTimeout(() => setPasteNotice(null), 2500);
    } catch {
      setPasteNotice('Izin clipboard ditolak.');
      setTimeout(() => setPasteNotice(null), 2500);
    }
  };

  // Handler Tambah dari Link Terdeteksi
  const handleQueueDetectedVideo = async () => {
    if (!detectedVideoId) return;
    setIsSubmitting(true);
    try {
      const req = requesterName.trim() || 'Kasir';
      const rawUrl = `https://www.youtube.com/watch?v=${detectedVideoId}`;
      const titleToUse = customTitle.trim() || detectedTitle || 'YouTube Video';
      await onAddSong(detectedVideoId, rawUrl, req, titleToUse);
      onClearQuery();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* 1. KOLOM PENCARIAN UTAMA YOUTUBE (BISA LANGSUNG DIKETIK ATAU DITEMPEL) */}
      <div className="space-y-1">
        <div className="flex justify-between items-center px-0.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="text-red-400">🔴</span>
            <span>Cari Judul / Tempel Tautan YouTube:</span>
          </label>
          <div className="flex items-center gap-2">
            {pasteNotice && (
              <span className="text-[10px] text-emerald-400 font-semibold animate-fadeIn">
                {pasteNotice}
              </span>
            )}
            {youtubeApiKey ? (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                Live Search Aktif ✓
              </span>
            ) : (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                Bantuan Web ↗
              </span>
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ketik judul lagu karaoke atau tempel link YouTube..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              autoFocus
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-red-500 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearQuery}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs p-0.5 rounded-full cursor-pointer"
                title="Hapus teks"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSmartPaste}
            className="px-3 py-2.5 bg-slate-900 hover:bg-slate-700 active:scale-95 text-red-300 border border-red-500/30 hover:border-red-500/60 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1 shrink-0 cursor-pointer"
            title="Tempel dari Clipboard"
          >
            <span>📋</span>
            <span className="hidden sm:inline">Tempel</span>
          </button>
        </div>
      </div>

      {/* 2. KARTU VIDEO TERDETEKSI (Jika yang dimasukkan adalah link URL) */}
      {detectedVideoId && (
        <div className="p-3.5 bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border border-red-500/50 rounded-2xl space-y-2.5 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Link Video YouTube Valid</span>
            </span>
            <span className="text-[10px] bg-red-500/20 text-red-300 font-mono px-2 py-0.5 rounded">
              ID: {detectedVideoId}
            </span>
          </div>

          <div className="flex gap-3 items-center">
            <img
              src={getYouTubeThumbnail(detectedVideoId, 'hqdefault')}
              alt="Thumbnail"
              className="w-16 h-12 object-cover rounded-xl shrink-0 bg-slate-800 border border-red-500/30 shadow"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
              }}
            />
            <div className="min-w-0 flex-1 space-y-1">
              {isLoadingPreview ? (
                <div className="text-xs text-red-300 animate-pulse">Mengambil data video...</div>
              ) : (
                <>
                  <label className="text-[10px] text-slate-400 block">Judul Lagu (Bisa Diedit):</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Judul lagu..."
                    className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleQueueDetectedVideo}
            disabled={isSubmitting || isLoadingPreview}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>▶</span>
            <span>{isSubmitting ? 'Memasukkan ke Antrean...' : 'Antrekan Video Ini Sekarang'}</span>
          </button>
        </div>
      )}

      {/* 3. HASIL PENCARIAN LIVE YOUTUBE (Jika yang dimasukkan adalah judul lagu) */}
      {!detectedVideoId && (
        <>
          {isSearching && (
            <div className="py-6 text-center text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse space-y-1">
              <div className="font-bold">Mencari video karaoke di YouTube...</div>
              <div className="text-[10px] text-slate-400">Menghubungkan ke Google Cloud Data API</div>
            </div>
          )}

          {ytError && (
            <div className="p-2.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{ytError}</span>
            </div>
          )}

          {/* List Hasil Video */}
          {!isSearching && ytResults.length > 0 && (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              <div className="flex justify-between items-center text-[11px] text-slate-400 px-1 mb-1">
                <span>Ditemukan: <strong className="text-red-400">{ytResults.length}</strong> video YouTube</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleLiveSearch()}
                    className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    🔄 Segarkan
                  </button>
                )}
              </div>
              {ytResults.map((video) => (
                <div
                  key={video.videoId}
                  className="flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-700/60 hover:border-red-500/40 transition-all group"
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
                      const req = requesterName.trim() || 'Kasir';
                      const url = `https://www.youtube.com/watch?v=${video.videoId}`;
                      onAddSong(video.videoId, url, req, video.title);
                      onClearQuery();
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 ml-2 shadow-sm active:scale-95 cursor-pointer"
                  >
                    + Antrekan
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Kondisi saat belum mengetik / belum ada hasil */}
          {!isSearching && ytResults.length === 0 && (
            <div className="py-4 px-3 text-center text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-700/40 space-y-2">
              {searchQuery ? (
                <div>
                  <p>Tidak ada video live ditemukan untuk <strong>"{searchQuery}"</strong>.</p>
                  <button
                    type="button"
                    onClick={() => handleLiveSearch()}
                    className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer"
                  >
                    🔍 Coba Cari Ulang
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Ketik judul lagu pada kolom di atas untuk mencari video YouTube secara live, atau tempelkan link video langsung.
                </p>
              )}

              {/* Bantuan Fallback Web jika tanpa API atau ingin cari di luar */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const q = searchQuery.trim()
                      ? (searchQuery.toLowerCase().includes('karaoke') ? searchQuery : `${searchQuery} karaoke`)
                      : 'karaoke indonesia';
                    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
                  }}
                  className="text-[11px] text-purple-300 hover:text-purple-200 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka YouTube di Tab Baru ↗</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
