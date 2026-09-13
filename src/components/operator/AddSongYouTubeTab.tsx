import React, { useState, useEffect } from 'react';
import { SparklesIcon, CloudIcon } from '../icons/Icons';
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
  // State untuk Pilihan 1: Live Search
  const [ytResults, setYtResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // State untuk Pilihan 2: Deteksi & Input Link YouTube
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [detectedVideoId, setDetectedVideoId] = useState<string | null>(null);
  const [detectedTitle, setDetectedTitle] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cek apakah searchQuery utama atau manualUrlInput adalah link YouTube
  const activeUrlCandidate = extractYouTubeID(searchQuery)
    ? searchQuery
    : manualUrlInput;
  const currentVideoId = extractYouTubeID(activeUrlCandidate);

  // Otomatis fetch judul saat link terdeteksi
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

  // Handler Pencarian Live YouTube (Pilihan 1)
  const handleLiveSearch = async (term?: string) => {
    const q = (term !== undefined ? term : searchQuery).trim();
    if (!q) return;

    if (!youtubeApiKey) {
      setYtError('API Key YouTube belum dikonfigurasi di Pengaturan Kafe.');
      return;
    }

    setIsSearching(true);
    setYtError(null);
    try {
      const targetQuery = q.toLowerCase().includes('karaoke') ? q : `${q} karaoke`;
      const res = await searchYouTubeVideos(targetQuery, youtubeApiKey, 6);
      if (res.success) {
        setYtResults(res.results);
      } else {
        setYtError(res.error || 'Gagal mencari video di YouTube.');
      }
    } catch (err: any) {
      setYtError(err?.message || 'Terjadi gangguan jaringan saat menghubungi YouTube.');
    } finally {
      setIsSearching(false);
    }
  };

  // Otomatis picu live search jika tab dibuka dan ada kata kunci teks (bukan URL)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed && !extractYouTubeID(trimmed) && youtubeApiKey) {
      const timer = setTimeout(() => {
        handleLiveSearch(trimmed);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, youtubeApiKey]);

  // Handler Tambah dari Deteksi Link (Pilihan 2)
  const handleQueueDetectedVideo = async () => {
    if (!detectedVideoId) return;
    setIsSubmitting(true);
    try {
      const req = requesterName.trim() || 'Kasir';
      const rawUrl = `https://www.youtube.com/watch?v=${detectedVideoId}`;
      const titleToUse = customTitle.trim() || detectedTitle || 'YouTube Video';
      await onAddSong(detectedVideoId, rawUrl, req, titleToUse);
      setManualUrlInput('');
      onClearQuery();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* ========================================================
          KARTU DETEKSI LINK YOUTUBE OTOMATIS (Jika URL Terdeteksi)
          ======================================================== */}
      {detectedVideoId && (
        <div className="p-3.5 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 border border-red-500/50 rounded-2xl space-y-2.5 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Link YouTube Terdeteksi</span>
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
                  <label className="text-[10px] text-slate-400 block">Judul Lagu (Dapat Diedit):</label>
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

      {/* ========================================================
          PILIHAN 1: PENCARIAN LIVE YOUTUBE BERDASARKAN JUDUL
          ======================================================== */}
      <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-700/60 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <span className="text-red-400">🔴</span>
            <span>Pilihan 1: Pencarian Live YouTube</span>
          </span>
          {youtubeApiKey ? (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
              API Aktif ✓
            </span>
          ) : (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
              Mode Bantuan ↗
            </span>
          )}
        </div>

        {/* Kondisi Jika API Key Tersedia */}
        {youtubeApiKey ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Hasil pencarian video karaoke YouTube secara realtime:</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleLiveSearch()}
                  disabled={isSearching}
                  className="text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                >
                  {isSearching ? 'Mencari...' : '🔄 Segarkan'}
                </button>
              )}
            </div>

            {/* Error Message */}
            {ytError && (
              <div className="p-2.5 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{ytError}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {isSearching && (
              <div className="py-6 text-center text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl animate-pulse space-y-1">
                <div className="font-bold">Mencari video karaoke di YouTube...</div>
                <div className="text-[10px] text-slate-400">Menghubungkan ke Google Cloud Data API</div>
              </div>
            )}

            {/* List Hasil Pencarian Live */}
            {!isSearching && ytResults.length > 0 && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {ytResults.map((video) => (
                  <div
                    key={video.videoId}
                    className="flex items-center justify-between p-2.5 bg-slate-950/80 hover:bg-slate-900 rounded-xl border border-slate-700/60 hover:border-red-500/40 transition-all group"
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

            {!isSearching && ytResults.length === 0 && searchQuery && (
              <div className="py-4 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                Tekan tombol di bawah untuk mencari <strong>"{searchQuery}"</strong> di YouTube:
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => handleLiveSearch()}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer active:scale-95"
                  >
                    🔍 Cari "{searchQuery}" Sekarang
                  </button>
                </div>
              </div>
            )}

            {!isSearching && !searchQuery && ytResults.length === 0 && (
              <div className="py-4 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                Ketik judul lagu di kotak pencarian di atas untuk memunculkan video karaoke live.
              </div>
            )}
          </div>
        ) : (
          /* Kondisi Jika API Key Belum Dikonfigurasi (Fallback Bantuan) */
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-2">
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Kunci API YouTube belum diisi di Pengaturan Kafe. Anda dapat mencari video langsung di situs YouTube, lalu salin tautan video dan tempelkan ke aplikasi.
            </p>
            <button
              type="button"
              onClick={() => {
                const q = searchQuery.trim()
                  ? (searchQuery.toLowerCase().includes('karaoke') ? searchQuery : `${searchQuery} karaoke`)
                  : 'karaoke indonesia';
                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full"
            >
              <span>Buka YouTube Web ↗</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          PILIHAN 2: INPUT TAUTAN YOUTUBE MANUAL (OPSIONAL)
          ======================================================== */}
      <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <CloudIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Pilihan 2: Tempel Link YouTube Manual (Opsional)</span>
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="https://www.youtube.com/watch?v=... atau youtu.be/..."
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          {manualUrlInput && (
            <button
              type="button"
              onClick={() => setManualUrlInput('')}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs"
              title="Bersihkan"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-500">
          Tip: Anda juga bisa langsung menempel tautan URL di Kotak Pencarian Utama di atas.
        </p>
      </div>
    </div>
  );
};
