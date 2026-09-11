import React, { useState, useEffect, useMemo } from 'react';
import { useKaraoke } from '../../hooks/useKaraoke';
import { GuestVoucherGate } from './GuestVoucherGate';
import { AppRole, Voucher } from '../../types';
import { POPULAR_KARAOKE_SONGS } from '../../utils/youtube';
import { extractYouTubeID, fetchYouTubeInfo, getYouTubeThumbnail } from '../../utils/youtube';
import {
  SearchIcon,
  SparklesIcon,
  PlayIcon,
  CheckIcon,
  LockIcon,
  TicketIcon,
} from '../icons/Icons';

interface GuestScreenProps {
  setRole?: (role: AppRole) => void;
  defaultTable?: string;
}

export const GuestScreen: React.FC<GuestScreenProps> = ({ setRole, defaultTable }) => {
  const {
    state,
    currentSong,
    nextSongs,
    songLibrary,
    vouchers,
    addSong,
    validateVoucher,
    sendLiveReaction,
    fairRotationEnabled,
  } = useKaraoke();

  // Ambil nomor meja dari props atau URL hash/search query
  const tableNumber = useMemo(() => {
    if (defaultTable) return defaultTable;
    try {
      const hash = window.location.hash;
      const queryIdx = hash.indexOf('?');
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.substring(queryIdx));
        const t = params.get('table');
        if (t) return decodeURIComponent(t);
      }
      const searchParams = new URLSearchParams(window.location.search);
      const st = searchParams.get('table');
      if (st) return decodeURIComponent(st);
    } catch {
      // ignore
    }
    return 'Meja 1';
  }, [defaultTable]);

  // Status autentikasi voucher
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(() => {
    try {
      const saved = sessionStorage.getItem(`cafeyou_voucher_${tableNumber}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Re-sync voucher data dari state jika berubah
  const currentVoucherData = useMemo(() => {
    if (!activeVoucher) return null;
    if (activeVoucher.code === state?.dailyPin?.code) {
      return {
        ...activeVoucher,
        quotaTotal: 999,
        quotaUsed: 0,
      };
    }
    return vouchers[activeVoucher.code] || activeVoucher;
  }, [activeVoucher, vouchers, state?.dailyPin]);

  const [activeTab, setActiveTab] = useState<'search' | 'url' | 'queue'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [requesterName, setRequesterName] = useState('');

  // YouTube Link Form
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState<{
    videoId: string;
    title: string;
    thumbnail: string;
  } | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Reaction feedback animation
  const [lastSentReaction, setLastSentReaction] = useState<string | null>(null);
  const [successAddMsg, setSuccessAddMsg] = useState<string | null>(null);

  // Cek apakah kuota habis
  const isQuotaExhausted = Boolean(
    currentVoucherData &&
      currentVoucherData.quotaTotal !== 999 &&
      currentVoucherData.quotaUsed >= currentVoucherData.quotaTotal
  );

  const remainingQuota = currentVoucherData
    ? currentVoucherData.quotaTotal === 999
      ? 'Unlimited'
      : Math.max(0, currentVoucherData.quotaTotal - currentVoucherData.quotaUsed)
    : 0;

  // Daftar gabungan katalog lagu
  const catalogList = useMemo(() => {
    const list: Array<{ videoId: string; title: string; artist?: string; thumbnail?: string }> =
      [];

    // 1. Library tersimpan
    Object.values(songLibrary || {}).forEach((lib) => {
      list.push({
        videoId: lib.videoId,
        title: lib.title,
        thumbnail: lib.thumbnail,
      });
    });

    // 2. Preset Populer
    POPULAR_KARAOKE_SONGS.forEach((p) => {
      if (!list.some((s) => s.videoId === p.videoId)) {
        list.push({
          videoId: p.videoId,
          title: p.title,
          artist: p.artist,
          thumbnail: getYouTubeThumbnail(p.videoId, 'hqdefault'),
        });
      }
    });

    return list;
  }, [songLibrary]);

  // Filter pencarian
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) {
      if (selectedCategory === 'Semua') return catalogList;
      const catSongs = POPULAR_KARAOKE_SONGS.filter((s) => s.category === selectedCategory);
      return catSongs.map((c) => ({
        videoId: c.videoId,
        title: c.title,
        artist: c.artist,
        thumbnail: getYouTubeThumbnail(c.videoId, 'hqdefault'),
      }));
    }

    const q = searchQuery.toLowerCase().trim();
    return catalogList.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q))
    );
  }, [catalogList, searchQuery, selectedCategory]);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    POPULAR_KARAOKE_SONGS.forEach((s) => cats.add(s.category));
    return ['Semua', ...Array.from(cats)];
  }, []);

  // Handle URL Change
  useEffect(() => {
    if (!youtubeUrl.trim()) {
      setUrlPreview(null);
      setUrlError(null);
      return;
    }

    const id = extractYouTubeID(youtubeUrl);
    if (!id) {
      setUrlError('Link YouTube tidak valid.');
      setUrlPreview(null);
      return;
    }

    setUrlError(null);
    setIsLoadingInfo(true);

    fetchYouTubeInfo(id)
      .then((info) => {
        setUrlPreview({
          videoId: id,
          title: info?.title || `Lagu YouTube (${id})`,
          thumbnail: info?.thumbnail || getYouTubeThumbnail(id, 'hqdefault'),
        });
      })
      .catch(() => {
        setUrlPreview({
          videoId: id,
          title: `Lagu YouTube (${id})`,
          thumbnail: getYouTubeThumbnail(id, 'hqdefault'),
        });
      })
      .finally(() => {
        setIsLoadingInfo(false);
      });
  }, [youtubeUrl]);

  const handleAddSong = async (videoId: string, title: string, rawUrl?: string) => {
    if (isQuotaExhausted) return;

    const nickname = requesterName.trim() || `${tableNumber}`;
    const url = rawUrl || `https://www.youtube.com/watch?v=${videoId}`;

    await addSong(videoId, url, nickname, title, {
      tableNumber,
      source: 'guest',
      voucherCode: activeVoucher?.code,
    });

    setSuccessAddMsg(`"${title}" berhasil dimasukkan ke antrean!`);
    setTimeout(() => setSuccessAddMsg(null), 3000);
  };

  const handleReactionClick = (emoji: string) => {
    sendLiveReaction(emoji, tableNumber);
    setLastSentReaction(emoji);
    setTimeout(() => setLastSentReaction(null), 1500);
  };

  const handleLogoutVoucher = () => {
    try {
      sessionStorage.removeItem(`cafeyou_voucher_${tableNumber}`);
    } catch {
      // ignore
    }
    setActiveVoucher(null);
  };

  // Jika belum login voucher, tampilkan Voucher Gate
  if (!activeVoucher) {
    return (
      <GuestVoucherGate
        tableNumber={tableNumber}
        onSuccess={(v) => setActiveVoucher(v)}
        validateVoucher={validateVoucher}
        onBackToLanding={setRole ? () => setRole('landing') : undefined}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white pb-24">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3 sticky top-0 z-30 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎤</span>
          <div>
            <div className="font-extrabold text-sm bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              CAFEYOU Portal
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">{tableNumber}</div>
          </div>
        </div>

        {/* Voucher Quota Pill */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              isQuotaExhausted
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <TicketIcon className="w-3.5 h-3.5" />
            <span>
              {isQuotaExhausted ? 'Kuota Habis' : `Sisa: ${remainingQuota} Lagu`}
            </span>
          </div>

          <button
            onClick={handleLogoutVoucher}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors text-xs"
            title="Keluar / Ganti Kode Voucher"
          >
            <LockIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
        {/* Banner Smart Fair Rotation */}
        {fairRotationEnabled && (
          <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-purple-300 animate-fadeIn">
            <span className="text-base shrink-0">⚖️</span>
            <span className="text-[11px] leading-relaxed">
              <strong>Sistem Antrean Adil Aktif:</strong> Lagu setiap meja akan diputar bergantian secara merata.
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

        {/* Banner Jika Kuota Habis */}
        {isQuotaExhausted && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center gap-3 text-xs text-red-300">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-bold">Kuota Lagu Meja Anda Telah Habis</div>
              <div className="text-[11px] text-red-300/80">
                Silakan hubungi kasir atau pelayan untuk menambah kuota lagu baru.
              </div>
            </div>
          </div>
        )}

        {/* Input Nama Peminta (Nickname) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 shadow-sm flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-400 shrink-0">Nama Kamu:</span>
          <input
            type="text"
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder={`Contoh: Rian (${tableNumber})`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Katalog & Cari</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔗</span>
            <span>Link YouTube</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋</span>
            <span>Antrean ({nextSongs.length + (currentSong ? 1 : 0)})</span>
          </button>
        </div>

        {/* TAB 1: Cari Lagu & Katalog */}
        {activeTab === 'search' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul lagu atau nama penyanyi..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />
              <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>

            {/* Category Pills (Hanya saat tidak sedang mengetik query) */}
            {!searchQuery && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap text-[11px] font-semibold transition-all border ${
                      selectedCategory === cat
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Song Results List */}
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCatalog.length > 0 ? (
                filteredCatalog.map((song) => (
                  <div
                    key={song.videoId}
                    className="p-2.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={song.thumbnail || getYouTubeThumbnail(song.videoId, 'hqdefault')}
                        alt={song.title}
                        className="w-12 h-12 object-cover rounded-xl shrink-0 border border-slate-800"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{song.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {song.artist || 'Karaoke Version'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddSong(song.videoId, song.title)}
                      disabled={isQuotaExhausted}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 shadow-md shadow-blue-500/20"
                    >
                      + Putar
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Tidak ada lagu yang sesuai dengan kata kunci &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Masukkan Link YouTube */}
        {activeTab === 'url' && (
          <div className="space-y-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tempel (Paste) Link YouTube:
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 font-mono"
              />
              {urlError && <div className="text-[11px] text-red-400 mt-1">{urlError}</div>}
              {isLoadingInfo && (
                <div className="text-[11px] text-blue-400 mt-1 animate-pulse">
                  Mengambil metadata lagu dari YouTube...
                </div>
              )}
            </div>

            {/* Video Preview Card */}
            {urlPreview && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-700/60 space-y-3 animate-fadeIn">
                <div className="flex gap-3">
                  <img
                    src={urlPreview.thumbnail}
                    alt={urlPreview.title}
                    className="w-20 h-14 object-cover rounded-lg shrink-0 border border-slate-800"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white line-clamp-2">
                      {urlPreview.title}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-semibold">
                      ✓ Siap dimasukkan
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleAddSong(urlPreview.videoId, urlPreview.title, youtubeUrl);
                    setYoutubeUrl('');
                    setUrlPreview(null);
                  }}
                  disabled={isQuotaExhausted}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <PlayIcon className="w-3.5 h-3.5" />
                  <span>Tambahkan ke Antrean Lagu</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Antrean Lagu Saat Ini */}
        {activeTab === 'queue' && (
          <div className="space-y-3">
            {/* Sedang Diputar (Now Playing) */}
            {currentSong ? (
              <div className="p-3.5 bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-500/40 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center text-lg shrink-0">
                  🎤
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Sedang Diputar di Layar
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
              <div className="py-4 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                Belum ada lagu yang sedang diputar di layar kafe.
              </div>
            )}

            {/* Daftar Menunggu */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daftar Antrean Berikutnya ({nextSongs.length})
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
                      <div className="text-[10px] text-slate-400 truncate">
                        Pemesan: {s.requester}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
                  Antrean sedang kosong. Jadilah yang pertama bernyanyi!
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Bar: Live Crowd Reactions */}
      <footer className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-2.5 z-30 shadow-2xl flex flex-col items-center gap-1.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <SparklesIcon className="w-3 h-3 text-amber-400" />
          <span>Kirim Reaksi Live ke Layar TV Proyektor:</span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          {[
            { emoji: '👏', label: 'Tepuk' },
            { emoji: '🔥', label: 'Membara' },
            { emoji: '❤️', label: 'Keren' },
            { emoji: '🎤', label: 'Sing' },
            { emoji: '🎉', label: 'Seru' },
          ].map((r) => (
            <button
              key={r.emoji}
              onClick={() => handleReactionClick(r.emoji)}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 active:scale-125 border border-slate-700 hover:border-blue-500/50 rounded-2xl text-base sm:text-lg flex items-center gap-1 transition-all shadow-md active:bg-blue-600/30"
              title={`Kirim ${r.label}`}
            >
              <span>{r.emoji}</span>
            </button>
          ))}
        </div>
        {lastSentReaction && (
          <div className="text-[10px] text-emerald-400 font-bold animate-fadeIn">
            Reaksi {lastSentReaction} terkirim ke layar proyektor! ✨
          </div>
        )}
      </footer>
    </div>
  );
};
