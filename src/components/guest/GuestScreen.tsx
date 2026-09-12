import React, { useState, useEffect, useMemo } from 'react';
import { useKaraoke } from '../../hooks/useKaraoke';
import { GuestVoucherGate } from './GuestVoucherGate';
import { AppRole, Voucher } from '../../types';
import { POPULAR_KARAOKE_SONGS, extractYouTubeID, fetchYouTubeInfo, getYouTubeThumbnail } from '../../utils/youtube';
import {
  SearchIcon,
  SparklesIcon,
  PlayIcon,
  CheckIcon,
  LockIcon,
  TicketIcon,
} from '../icons/Icons';
import { DeveloperFooter } from '../common/DeveloperFooter';

interface GuestScreenProps {
  setRole?: (role: AppRole) => void;
  defaultTable?: string;
}

export const GuestScreen: React.FC<GuestScreenProps> = ({ setRole, defaultTable }) => {
  const {
    state,
    isCloudConnected,
    currentSong,
    nextSongs,
    songLibrary,
    vouchers,
    addSong,
    validateVoucher,
    sendLiveReaction,
    fairRotationEnabled,
    cafeSettings,
  } = useKaraoke();

  // 1. Ambil nomor meja dari props atau URL hash/search query
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

  // 2. Status autentikasi voucher (Per-Meja)
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(() => {
    try {
      const saved = sessionStorage.getItem(`cafeyou_voucher_${tableNumber}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Re-sync voucher data dari state jika berubah (dengan case-insensitive lookup)
  const currentVoucherData = useMemo(() => {
    if (!activeVoucher) return null;
    if (activeVoucher.code === state?.dailyPin?.code) {
      return {
        ...activeVoucher,
        quotaTotal: 999,
        quotaUsed: 0,
      };
    }
    const found = Object.values(vouchers || {}).find(
      (v) => v && v.code && v.code.trim().toUpperCase() === activeVoucher.code.trim().toUpperCase()
    );
    return found || activeVoucher;
  }, [activeVoucher, vouchers, state?.dailyPin]);

  // Auto-login jika URL membawa parameter voucher/pin (misal: #guest?table=Meja%201&voucher=1234)
  useEffect(() => {
    if (activeVoucher) return;
    try {
      const hash = window.location.hash;
      const queryIdx = hash.indexOf('?');
      let vCode: string | null = null;
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.substring(queryIdx));
        vCode = params.get('voucher') || params.get('pin') || params.get('code');
      }
      if (!vCode) {
        const searchParams = new URLSearchParams(window.location.search);
        vCode = searchParams.get('voucher') || searchParams.get('pin') || searchParams.get('code');
      }

      if (vCode) {
        validateVoucher(vCode.trim(), tableNumber).then((res) => {
          if (res.valid && res.voucher) {
            setActiveVoucher(res.voucher);
            try {
              sessionStorage.setItem(`cafeyou_voucher_${tableNumber}`, JSON.stringify(res.voucher));
            } catch {}
          }
        });
      }
    } catch {}
  }, [activeVoucher, tableNumber, validateVoucher]);

  // 3. Tab State (2 Tab Bersih: 'catalog' & 'queue')
  const [activeTab, setActiveTab] = useState<'catalog' | 'queue'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [requesterName, setRequesterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link YouTube Auto-Detection Preview
  const [detectedYtVideo, setDetectedYtVideo] = useState<{
    videoId: string;
    title: string;
    thumbnail: string;
  } | null>(null);
  const [isLoadingYtPreview, setIsLoadingYtPreview] = useState(false);

  // Reaction feedback animation & toast
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
    const list: Array<{ videoId: string; title: string; artist?: string; thumbnail?: string; category?: string }> =
      [];

    // 1. Library tersimpan kafe
    Object.values(songLibrary || {}).forEach((lib) => {
      list.push({
        videoId: lib.videoId,
        title: lib.title,
        thumbnail: lib.thumbnail,
        category: 'Favorit Kafe',
      });
    });

    // 2. Preset Populer
    POPULAR_KARAOKE_SONGS.forEach((p) => {
      if (!list.some((s) => s.videoId === p.videoId)) {
        list.push({
          videoId: p.videoId,
          title: p.title,
          artist: p.artist,
          category: p.category,
          thumbnail: getYouTubeThumbnail(p.videoId, 'hqdefault'),
        });
      }
    });

    return list;
  }, [songLibrary]);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    POPULAR_KARAOKE_SONGS.forEach((s) => cats.add(s.category));
    return ['Semua', ...Array.from(cats)];
  }, []);

  // Deteksi Otomatis Jika Input Pencarian adalah URL YouTube
  useEffect(() => {
    const trimmed = searchQuery.trim();
    const ytId = extractYouTubeID(trimmed);

    if (ytId) {
      setIsLoadingYtPreview(true);
      fetchYouTubeInfo(ytId)
        .then((info) => {
          setDetectedYtVideo({
            videoId: ytId,
            title: info?.title || `Lagu YouTube (${ytId})`,
            thumbnail: info?.thumbnail || getYouTubeThumbnail(ytId, 'hqdefault'),
          });
        })
        .catch(() => {
          setDetectedYtVideo({
            videoId: ytId,
            title: `Lagu YouTube (${ytId})`,
            thumbnail: getYouTubeThumbnail(ytId, 'hqdefault'),
          });
        })
        .finally(() => {
          setIsLoadingYtPreview(false);
        });
    } else {
      setDetectedYtVideo(null);
      setIsLoadingYtPreview(false);
    }
  }, [searchQuery]);

  // Filter pencarian
  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) {
      if (selectedCategory === 'Semua') return catalogList;
      return catalogList.filter((s) => s.category === selectedCategory);
    }

    const q = searchQuery.toLowerCase().trim();
    return catalogList.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q))
    );
  }, [catalogList, searchQuery, selectedCategory]);

  const handleAddSong = async (videoId: string, title: string, rawUrl?: string) => {
    if (isQuotaExhausted || isSubmitting) return;

    setIsSubmitting(true);
    const nickname = requesterName.trim() || `${tableNumber}`;
    const url = rawUrl || `https://www.youtube.com/watch?v=${videoId}`;

    try {
      await addSong(videoId, url, nickname, title, {
        tableNumber,
        source: 'guest',
        voucherCode: activeVoucher?.code,
      });

      setSuccessAddMsg(`"${title}" berhasil dimasukkan ke antrean kafe! 🎤`);
      setSearchQuery('');
      setDetectedYtVideo(null);
      setTimeout(() => setSuccessAddMsg(null), 3500);
    } catch (err) {
      console.warn('Gagal menambahkan lagu:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fitur 1-Tap Paste dari Clipboard
  const handleSmartPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setSearchQuery(text.trim());
        }
      } else {
        const manual = prompt('Tempel link YouTube atau ketik judul lagu:');
        if (manual) setSearchQuery(manual.trim());
      }
    } catch {
      const manual = prompt('Tempel link YouTube atau ketik judul lagu:');
      if (manual) setSearchQuery(manual.trim());
    }
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

  const totalQueueCount = nextSongs.length + (currentSong ? 1 : 0);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white pb-28">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 p-3 sticky top-0 z-30 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-lg shadow-md shadow-purple-500/20">
            🎤
          </div>
          <div>
            <div className="font-extrabold text-sm bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 bg-clip-text text-transparent truncate max-w-[170px] sm:max-w-xs">
              {cafeSettings?.name || 'CAFEYOU'} Portal
            </div>
            <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
              <span className="text-purple-300 font-bold">{tableNumber}</span>
              <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                isCloudConnected
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                  : 'text-amber-400 bg-amber-500/15 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isCloudConnected ? 'Tersambung' : 'Lokal'}</span>
              </span>
              {cafeSettings?.wifiName && (
                <span className="text-[9px] text-cyan-400/80 font-normal">
                  • Wi-Fi: {cafeSettings.wifiName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Voucher Quota Pill & Lock */}
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
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

            {/* Song Results List */}
            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
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
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-800/60 p-4 space-y-2">
                  <div>Lagu &quot;{searchQuery}&quot; tidak ada di daftar populer.</div>
                  <div className="text-[11px] text-slate-400">
                    💡 <strong>Tips:</strong> Buka YouTube, salin link lagu yang Anda inginkan, lalu klik tombol <strong>📋 Tempel</strong> di atas!
                  </div>
                </div>
              )}
            </div>
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

        {/* Developer Footer Brand */}
        <div className="pt-4 pb-2">
          <DeveloperFooter compact />
        </div>
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
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 active:scale-125 border border-slate-700 hover:border-purple-500/50 rounded-2xl text-base sm:text-lg flex items-center gap-1 transition-all shadow-md active:bg-purple-600/30"
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

