import React from 'react';
import { Song, YouTubeSearchResult, CafeSettings } from '../../types';
import { SearchIcon, SparklesIcon, PlayIcon, CheckIcon } from '../icons/Icons';
import { getYouTubeThumbnail, DEFAULT_SONG_THUMBNAIL } from '../../utils/youtube';

export interface GuestKaraokeTabProps {
  fairRotationEnabled: boolean;
  successAddMsg: string | null;
  isQuotaExhausted: boolean;
  requesterName: string;
  setRequesterName: (name: string) => void;
  tableNumber: string;
  activeTab: 'catalog' | 'queue';
  setActiveTab: (tab: 'catalog' | 'queue') => void;
  totalQueueCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSmartPaste: () => void;
  searchSource: 'catalog' | 'youtube';
  setSearchSource: (src: 'catalog' | 'youtube') => void;
  filteredCatalog: Array<{ videoId: string; title: string; artist?: string; thumbnail?: string; category?: string }>;
  cafeSettings?: CafeSettings;
  performYouTubeSearch: (queryText?: string) => Promise<void>;
  isLoadingYtPreview: boolean;
  detectedYtVideo: { videoId: string; title: string; thumbnail: string } | null;
  handleAddSong: (videoId: string, title: string, rawUrl?: string) => Promise<void>;
  isSubmitting: boolean;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isSearchingYt: boolean;
  ytSearchError: string | null;
  ytSearchResults: YouTubeSearchResult[];
  handleOpenExternalYouTube: (queryText?: string) => void;
  currentSong: Song | null;
  nextSongs: Song[];
  onRequestQuotaTopUp?: () => void;
  onSwitchToFnb?: () => void;
  isTopUpRequested?: boolean;
}

export const GuestKaraokeTab: React.FC<GuestKaraokeTabProps> = ({
  fairRotationEnabled,
  successAddMsg,
  isQuotaExhausted,
  requesterName,
  setRequesterName,
  tableNumber,
  activeTab,
  setActiveTab,
  totalQueueCount,
  searchQuery,
  setSearchQuery,
  handleSmartPaste,
  searchSource,
  setSearchSource,
  filteredCatalog,
  cafeSettings,
  performYouTubeSearch,
  isLoadingYtPreview,
  detectedYtVideo,
  handleAddSong,
  isSubmitting,
  categories,
  selectedCategory,
  setSelectedCategory,
  isSearchingYt,
  ytSearchError,
  ytSearchResults,
  handleOpenExternalYouTube,
  currentSong,
  nextSongs,
  onRequestQuotaTopUp,
  onSwitchToFnb,
  isTopUpRequested = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Banner Smart Fair Rotation */}
      {fairRotationEnabled && (
        <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-purple-300 animate-fadeIn">
          <span className="text-base shrink-0">⚖️</span>
          <span className="text-[11px] leading-relaxed">
            <strong>Sistem Antrean Adil Aktif:</strong> Lagu setiap meja diputar bergantian secara merata.
          </span>
        </div>
      )}

      {/* Banner Notifikasi Berhasil */}
      {successAddMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-fadeIn">
          <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successAddMsg}</span>
        </div>
      )}

      {/* Banner & Aksi Solutif Jika Kuota Habis */}
      {isQuotaExhausted && (
        <div className="p-4 bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-900 border border-red-500/40 rounded-2xl text-xs space-y-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-lg shrink-0">
              🎤
            </div>
            <div>
              <div className="font-extrabold text-sm text-red-300">Kuota Lagu Meja Anda Telah Habis</div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Ingin bernyanyi lagu lagi? Minta kasir untuk menambah kuota lagu meja ini.
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-800/80">
            {onRequestQuotaTopUp && (
              <button
                type="button"
                onClick={onRequestQuotaTopUp}
                disabled={isTopUpRequested}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isTopUpRequested
                    ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                }`}
              >
                <span>{isTopUpRequested ? '✓' : '🛎️'}</span>
                <span>{isTopUpRequested ? 'Permintaan Terkirim ke Kasir' : 'Minta Tambah Lagu ke Kasir'}</span>
              </button>
            )}

            {onSwitchToFnb && (
              <button
                type="button"
                onClick={onSwitchToFnb}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <span>🍽️</span>
                <span>Pesan Menu Kafe</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Nama Penyanyi (Compact) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 shadow-sm flex items-center gap-2.5">
        <span className="text-xs font-bold text-slate-400 shrink-0">👤 Nama Kamu:</span>
        <input
          type="text"
          value={requesterName}
          onChange={(e) => setRequesterName(e.target.value)}
          placeholder={`Contoh: Rian (${tableNumber})`}
          className="flex-1 bg-slate-950 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-purple-500 font-medium"
        />
      </div>

      {/* Tab Navigation (2 Tab Utama Saja) */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎵</span>
          <span>Pilih Lagu</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'queue'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📋</span>
          <span>Antrean Kafe ({totalQueueCount})</span>
        </button>
      </div>

      {/* TAB 1: PILIH LAGU (Universal Search + Categories + List) */}
      {activeTab === 'catalog' && (
        <div className="space-y-3.5">
          {/* Universal Smart Search Box */}
          <div className="relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik judul lagu / artis / tempel link..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500 shadow-sm"
              />
              <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs p-0.5 rounded-full"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tombol Tempel Cepat (Smart Paste) */}
            <button
              type="button"
              onClick={handleSmartPaste}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-purple-300 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl text-xs font-bold transition-all shadow flex items-center gap-1 shrink-0"
              title="Tempel link dari clipboard HP"
            >
              <span>📋</span>
              <span className="hidden sm:inline">Tempel</span>
            </button>
          </div>

          {/* Sub-pills: Sumber Lagu (Koleksi Kafe vs Pencarian Langsung YouTube) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSearchSource('catalog')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                searchSource === 'catalog'
                  ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>🎵</span>
              <span>Koleksi Kafe ({filteredCatalog.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchSource('youtube');
                if (searchQuery.trim() && cafeSettings?.youtubeApiKey) {
                  performYouTubeSearch(searchQuery.trim());
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                searchSource === 'youtube'
                  ? 'bg-red-600/30 border-red-500 text-white shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-red-400">🔴</span>
              <span>Cari di YouTube</span>
              {cafeSettings?.youtubeApiKey ? (
                <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-mono">LIVE</span>
              ) : (
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">BANTUAN</span>
              )}
            </button>
          </div>

          {/* HASIL DETEKSI LINK YOUTUBE (Jika input adalah link YouTube) */}
          {isLoadingYtPreview && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-xs text-purple-300 animate-pulse flex items-center gap-2">
              <span>🔄</span>
              <span>Mengambil info video YouTube...</span>
            </div>
          )}

          {detectedYtVideo && !isLoadingYtPreview && (
            <div className="p-3 bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/40 rounded-2xl space-y-2.5 animate-fadeIn shadow-lg">
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Video YouTube Terdeteksi:</span>
              </div>

              <div className="flex gap-3 items-center">
                <img
                  src={detectedYtVideo.thumbnail}
                  alt={detectedYtVideo.title}
                  className="w-16 h-12 object-cover rounded-xl shrink-0 border border-purple-500/30"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white line-clamp-2">
                    {detectedYtVideo.title}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddSong(detectedYtVideo.videoId, detectedYtVideo.title, searchQuery)}
                disabled={isQuotaExhausted || isSubmitting}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Memasukkan...' : '+ Putar Video Ini Sekarang'}</span>
              </button>
            </div>
          )}

          {/* KONTEN SUMBER 1: KOLEKSI KAFE */}
          {searchSource === 'catalog' && (
            <>
              {/* Category Pills (Hanya saat tidak sedang mengetik query pencarian) */}
              {!searchQuery && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-[11px] font-bold transition-all border ${
                        selectedCategory === cat
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-sm scale-105'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Song Results List — Katalog Lokal Kafe */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 custom-scrollbar">
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map((song) => (
                    <div
                      key={song.videoId}
                      className="p-2.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={song.thumbnail || getYouTubeThumbnail(song.videoId, 'hqdefault')}
                          alt={song.title}
                          className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-800"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{song.title}</div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {song.artist || 'Karaoke Version'}
                          </div>
                          {song.category && (
                            <span className="inline-block mt-0.5 text-[9px] bg-slate-800 text-purple-300 border border-purple-500/20 px-1.5 py-0.2 rounded font-medium">
                              {song.category}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddSong(song.videoId, `${song.title} - ${song.artist || ''}`)}
                        disabled={isQuotaExhausted || isSubmitting}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 shadow-md shadow-purple-500/20 flex items-center gap-1"
                      >
                        <span>+ Putar</span>
                      </button>
                    </div>
                  ))
                ) : searchQuery && !cafeSettings?.youtubeApiKey ? (
                  <div className="py-6 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-4 space-y-3">
                    <div>Lagu &quot;{searchQuery}&quot; tidak ada di daftar koleksi lokal kafe.</div>
                    <div className="text-[10px] text-slate-500">
                      Salin link video dari aplikasi YouTube lalu klik tombol <strong>📋 Tempel</strong> di atas.
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ===== HASIL YOUTUBE OTOMATIS (muncul saat mengetik + ada API key) ===== */}
              {searchQuery.trim().length >= 2 && cafeSettings?.youtubeApiKey && (
                <div className="space-y-2 mt-1">
                  {/* Header Divider YouTube */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                    <span className="flex-1 h-px bg-slate-800" />
                    <span className="flex items-center gap-1.5">
                      {isSearchingYt ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          <span className="text-red-400">Mencari di YouTube...</span>
                        </>
                      ) : ytSearchResults.length > 0 ? (
                        <>
                          <span className="text-red-400">🔴</span>
                          <span>Hasil YouTube ({ytSearchResults.length})</span>
                        </>
                      ) : ytSearchError ? (
                        <>
                          <span>⚠️</span>
                          <span className="text-amber-400">YouTube tidak tersedia</span>
                        </>
                      ) : null}
                    </span>
                    <span className="flex-1 h-px bg-slate-800" />
                  </div>

                  {/* Error YouTube */}
                  {ytSearchError && !isSearchingYt && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-200 text-center">
                      Pencarian YouTube penuh. Tempel link dari YouTube atau pilih dari koleksi kafe.
                    </div>
                  )}

                  {/* Daftar Hasil YouTube */}
                  {!isSearchingYt && !ytSearchError && ytSearchResults.length > 0 && (
                    <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1 custom-scrollbar">
                      {ytSearchResults.map((video) => (
                        <div
                          key={video.videoId}
                          className="p-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-red-500/40 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-12 h-9 object-cover rounded-xl shrink-0 border border-slate-800 bg-slate-950"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white line-clamp-2 leading-tight">
                                {video.title}
                              </div>
                              {video.channelTitle && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  📺 {video.channelTitle}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddSong(video.videoId, video.title, `https://www.youtube.com/watch?v=${video.videoId}`)}
                            disabled={isQuotaExhausted || isSubmitting}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 shadow-md shadow-red-600/20 flex items-center gap-1"
                          >
                            <span>+ Putar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* KONTEN SUMBER 2: PENCARIAN YOUTUBE LANGSUNG */}
          {searchSource === 'youtube' && (
            <div className="space-y-3">
              {cafeSettings?.youtubeApiKey ? (
                // KONDISI A: YouTube API Key Terkonfigurasi (LIVE SEARCH)
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="flex items-center gap-1.5 font-bold text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>Hasil Pencarian YouTube Langsung:</span>
                    </span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => performYouTubeSearch()}
                        className="text-[10px] text-purple-300 hover:underline flex items-center gap-1"
                      >
                        <span>🔄 Muat Ulang</span>
                      </button>
                    )}
                  </div>

                  {isSearchingYt && (
                    <div className="py-10 text-center text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse space-y-2">
                      <div className="text-xl">🔍</div>
                      <div className="font-bold">Mencari video karaoke di YouTube...</div>
                      <div className="text-[10px] text-slate-400">Menghubungkan ke server YouTube</div>
                    </div>
                  )}

                  {ytSearchError && !isSearchingYt && (
                    <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-200 space-y-2.5">
                      <div className="font-bold flex items-center gap-1.5 text-red-300">
                        <span>⚠️</span>
                        <span>
                          {ytSearchError.toLowerCase().includes('quota') || ytSearchError.toLowerCase().includes('403')
                            ? 'Batas Pencarian Langsung Harian YouTube Penuh'
                            : ytSearchError}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Anda tetap bisa bernyanyi dengan menyalin tautan video dari YouTube lalu menempelkannya di sini, atau memilih lagu dari{' '}
                        <button
                          type="button"
                          onClick={() => setSearchSource('catalog')}
                          className="text-amber-400 font-bold underline inline"
                        >
                          Koleksi Kafe ⭐
                        </button>.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenExternalYouTube(searchQuery)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1"
                        >
                          <span>Buka Aplikasi YouTube ↗</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSmartPaste}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          <span>📋 Tempel Link Video</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!isSearchingYt && !ytSearchError && ytSearchResults.length > 0 && (
                    <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
                      {ytSearchResults.map((video) => (
                        <div
                          key={video.videoId}
                          className="p-2.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-red-500/40 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-14 h-10 object-cover rounded-xl shrink-0 border border-slate-800 bg-slate-950"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white line-clamp-2 leading-tight">
                                {video.title}
                              </div>
                              {video.channelTitle && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  📺 {video.channelTitle}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddSong(video.videoId, video.title, `https://www.youtube.com/watch?v=${video.videoId}`)}
                            disabled={isQuotaExhausted || isSubmitting}
                            className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 shadow-md shadow-red-600/20 flex items-center gap-1"
                          >
                            <span>+ Putar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isSearchingYt && !ytSearchError && ytSearchResults.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-4 space-y-3">
                      <div className="text-2xl">🎬</div>
                      {searchQuery ? (
                        <>
                          <div className="font-bold text-slate-200">Tidak ada hasil dari YouTube untuk &quot;{searchQuery}&quot;</div>
                          <button
                            type="button"
                            onClick={() => handleOpenExternalYouTube(searchQuery)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 transition-all inline-flex items-center gap-1.5"
                          >
                            <span>Cari di Aplikasi YouTube ↗</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-slate-400 text-[11px]">
                          Ketik judul lagu yang Anda cari pada kolom di atas (misal: <em>&quot;Tiara karaoke&quot;</em> atau <em>&quot;Dewa 19 kangen&quot;</em>).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // KONDISI B: YouTube API Key Belum Ada (SMART 1-TAP ASSISTANT)
                <div className="p-4 bg-gradient-to-br from-slate-900 to-purple-950/40 border border-slate-800 rounded-2xl space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-white">
                    <span className="text-red-500 text-base">🔴</span>
                    <span>Pilih Lagu Langsung dari YouTube</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {searchQuery
                      ? `Ingin memutar lagu "${searchQuery}"? Buka YouTube dengan 1-klik di bawah, salin link videonya, lalu klik Tempel.`
                      : 'Buka aplikasi YouTube untuk mencari versi karaoke apa pun, salin link videonya, lalu tempel di sini.'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenExternalYouTube(searchQuery)}
                      className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>🎬 Buka YouTube {searchQuery ? `"${searchQuery.slice(0, 15)}..."` : ''} ↗</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSmartPaste}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-purple-500/40 text-purple-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>📋 Tempel Link Disalin</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    💡 <strong>Petunjuk:</strong> Di YouTube, klik tombol <strong>Bagikan ➔ Salin Link</strong>, lalu kembali ke layar ini dan klik <strong>Tempel Link</strong>.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANTREAN KAFE SAAT INI */}
      {activeTab === 'queue' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Sedang Diputar (Now Playing on Stage) */}
          {currentSong ? (
            <div className="p-3.5 bg-gradient-to-br from-purple-950/80 via-indigo-950/60 to-slate-900 border border-purple-500/40 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center text-lg shrink-0">
                🎤
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sedang Diputar di Layar Kafe</span>
                </div>
                <div className="text-xs font-extrabold text-white truncate">
                  {currentSong.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Oleh: {currentSong.requester}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-5 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
              Belum ada lagu yang sedang diputar di layar panggung.
            </div>
          )}

          {/* Daftar Menunggu */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Daftar Antrean Berikutnya ({nextSongs.length})</span>
            </div>

            {nextSongs.length > 0 ? (
              nextSongs.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                      <span>Pemesan: {s.requester}</span>
                      {s.tableNumber && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 rounded">
                          {s.tableNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                Antrean sedang kosong. Jadilah yang pertama bernyanyi! 🎵
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
