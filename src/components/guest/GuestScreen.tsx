import React, { useState, useEffect, useMemo } from 'react';
import { useKaraoke } from '../../hooks/useKaraoke';
import { GuestVoucherGate } from './GuestVoucherGate';
import { TableSelectorModal } from './TableSelectorModal';
import { AppRole, Voucher, YouTubeSearchResult, MenuItem, MenuCategory, OrderItem, TableOrder } from '../../types';
import {
  POPULAR_KARAOKE_SONGS,
  extractYouTubeID,
  fetchYouTubeInfo,
  getYouTubeThumbnail,
  searchYouTubeVideos,
} from '../../utils/youtube';
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
    tables,
    menuItems,
    tableOrders,
    createTableOrder,
  } = useKaraoke();

  // 1. Deteksi Meja dari URL atau Session
  const urlTable = useMemo(() => {
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
    return null;
  }, [defaultTable]);

  const isDirectQr = Boolean(urlTable);

  const [tableNumber, setTableNumber] = useState<string>(() => {
    if (urlTable) return urlTable;
    try {
      const saved = sessionStorage.getItem('cafeyou_guest_table');
      if (saved) return saved;
    } catch {}
    return '';
  });

  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState<boolean>(
    !isDirectQr && !tableNumber
  );

  // 2. Status autentikasi voucher (Per-Meja)
  const [activeVoucher, setActiveVoucher] = useState<Voucher | null>(() => {
    if (!tableNumber) return null;
    try {
      const saved = sessionStorage.getItem(`cafeyou_voucher_${tableNumber}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const handleSelectTable = (selected: string) => {
    setTableNumber(selected);
    try {
      sessionStorage.setItem('cafeyou_guest_table', selected);
    } catch {}
    setIsTableSelectorOpen(false);

    // Coba restore voucher untuk meja baru
    try {
      const saved = sessionStorage.getItem(`cafeyou_voucher_${selected}`);
      if (saved) {
        setActiveVoucher(JSON.parse(saved));
      } else {
        setActiveVoucher(null);
      }
    } catch {}
  };

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

  // 3. Tab State
  const [mainTab, setMainTab] = useState<'karaoke' | 'fnb' | 'my_orders'>('karaoke');
  const [isBrowsingFnbWithoutVoucher, setIsBrowsingFnbWithoutVoucher] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'queue'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // 4. State POS F&B & Keranjang Pesanan Meja
  const [cart, setCart] = useState<Record<string, { item: MenuItem; quantity: number; notes: string }>>({});
  const [fnbCategory, setFnbCategory] = useState<MenuCategory | 'ALL'>('ALL');
  const [fnbSearch, setFnbSearch] = useState('');
  const [customerName, setCustomerName] = useState(() => {
    try {
      return sessionStorage.getItem('cafeyou_customer_name') || '';
    } catch {
      return '';
    }
  });
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessBanner, setOrderSuccessBanner] = useState<string | null>(null);

  // Cart Handlers
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      if (existing) {
        return {
          ...prev,
          [item.id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [item.id]: { item, quantity: 1, notes: '' },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const updateCartNotes = (itemId: string, notes: string) => {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], notes },
      };
    });
  };

  const cartItemsCount = Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);
  const cartTotalPrice = Object.values(cart).reduce((sum, c) => sum + (c.item.price * c.quantity), 0);

  // Table Orders filter for this table
  const myTableOrders = useMemo(() => {
    if (!tableNumber) return [];
    return Object.values(tableOrders || {})
      .filter((o) => o.tableNumber === tableNumber)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tableOrders, tableNumber]);

  const activeTableOrdersCount = myTableOrders.filter(
    (o) => o.status !== 'PAID' && o.status !== 'CANCELLED'
  ).length;

  const tableAccumulatedBill = myTableOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const tableUnpaidBill = myTableOrders
    .filter((o) => o.status !== 'PAID' && o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Checkout Handler
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(cart).length === 0) return;
    setOrderSubmitting(true);
    try {
      const cName = customerName.trim() || `Tamu ${tableNumber}`;
      try {
        sessionStorage.setItem('cafeyou_customer_name', cName);
      } catch {}

      const items: OrderItem[] = Object.values(cart).map((c) => ({
        menuItemId: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        notes: c.notes.trim() || undefined,
      }));

      await createTableOrder(tableNumber, cName, items);
      setCart({});
      setIsCheckoutOpen(false);
      setOrderSuccessBanner('Pesanan berhasil dikirim ke dapur & kasir!');
      setMainTab('my_orders');
      setTimeout(() => setOrderSuccessBanner(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Gagal mengirim pesanan');
    } finally {
      setOrderSubmitting(false);
    }
  };
  const [requesterName, setRequesterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Link YouTube Auto-Detection Preview
  const [detectedYtVideo, setDetectedYtVideo] = useState<{
    videoId: string;
    title: string;
    thumbnail: string;
  } | null>(null);
  const [isLoadingYtPreview, setIsLoadingYtPreview] = useState(false);

  // In-App YouTube Search State
  const [searchSource, setSearchSource] = useState<'catalog' | 'youtube'>('catalog');
  const [ytSearchResults, setYtSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytSearchError, setYtSearchError] = useState<string | null>(null);

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

  // Filter pencarian katalog lokal
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

  // Handler Pencarian YouTube Langsung
  const performYouTubeSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) {
      setYtSearchResults([]);
      setYtSearchError(null);
      return;
    }

    const apiKey = cafeSettings?.youtubeApiKey?.trim();
    if (!apiKey) {
      setYtSearchResults([]);
      setYtSearchError(null);
      return;
    }

    setIsSearchingYt(true);
    setYtSearchError(null);
    try {
      const searchTarget = q.toLowerCase().includes('karaoke') ? q : `${q} karaoke`;
      const res = await searchYouTubeVideos(searchTarget, apiKey, 10);
      if (res.success) {
        setYtSearchResults(res.results);
      } else {
        setYtSearchError(res.error || 'Gagal mencari video YouTube.');
      }
    } catch (err: any) {
      setYtSearchError(err?.message || 'Terjadi gangguan jaringan saat mencari di YouTube.');
    } finally {
      setIsSearchingYt(false);
    }
  };

  // Debounced Live YouTube Search saat berada di tab YouTube
  useEffect(() => {
    if (searchSource !== 'youtube') return;
    const trimmed = searchQuery.trim();
    if (!trimmed || extractYouTubeID(trimmed)) {
      setYtSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performYouTubeSearch(trimmed);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, searchSource, cafeSettings?.youtubeApiKey]);

  const handleOpenExternalYouTube = (queryText?: string) => {
    const q = (queryText || searchQuery || 'karaoke').trim();
    const targetQuery = q.toLowerCase().includes('karaoke') ? q : `${q} karaoke`;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(targetQuery)}`, '_blank');
  };

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

  // Jika nomor meja belum ada sama sekali, wajibkan pilih meja terlebih dahulu
  if (!tableNumber) {
    return (
      <TableSelectorModal
        isOpen={true}
        tables={tables}
        onSelectTable={handleSelectTable}
        cafeName={cafeSettings?.name || 'CAFEYOU'}
        canClose={false}
      />
    );
  }

  // Jika belum login voucher dan tidak sedang dalam mode pesan menu saja, tampilkan Voucher Gate
  if (!activeVoucher && !isBrowsingFnbWithoutVoucher) {
    return (
      <>
        <GuestVoucherGate
          tableNumber={tableNumber}
          onSuccess={(v) => {
            setActiveVoucher(v);
            setIsBrowsingFnbWithoutVoucher(false);
          }}
          validateVoucher={validateVoucher}
          onBackToLanding={setRole ? () => setRole('landing') : undefined}
          onChangeTable={!isDirectQr ? () => setIsTableSelectorOpen(true) : undefined}
          onSkipToMenu={() => {
            setIsBrowsingFnbWithoutVoucher(true);
            setMainTab('fnb');
          }}
        />
        <TableSelectorModal
          isOpen={isTableSelectorOpen}
          tables={tables}
          onSelectTable={handleSelectTable}
          onClose={() => setIsTableSelectorOpen(false)}
          currentTable={tableNumber}
          canClose={Boolean(tableNumber)}
          cafeName={cafeSettings?.name || 'CAFEYOU'}
        />
      </>
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
              {!isDirectQr ? (
                <button
                  type="button"
                  onClick={() => setIsTableSelectorOpen(true)}
                  className="text-purple-300 hover:text-purple-200 underline underline-offset-2 flex items-center gap-1 font-bold group cursor-pointer"
                  title="Klik untuk mengganti nomor meja"
                >
                  <span>{tableNumber}</span>
                  <span className="text-[8px] bg-purple-500/25 text-purple-300 px-1 py-0.2 rounded group-hover:bg-purple-500/40">Ganti</span>
                </button>
              ) : (
                <span className="text-purple-300 font-bold">{tableNumber}</span>
              )}
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

        {/* Voucher Quota Pill & Lock OR Login Voucher Button */}
        <div className="flex items-center gap-2">
          {activeVoucher ? (
            <>
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
            </>
          ) : (
            <button
              onClick={() => {
                setIsBrowsingFnbWithoutVoucher(false);
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
              title="Masukkan Voucher untuk karaoke"
            >
              <TicketIcon className="w-3.5 h-3.5" />
              <span>Voucher Karaoke</span>
            </button>
          )}
        </div>
      </header>

      {/* 3 Main Segmented Tabs: 🎤 Karaoke | 🍽️ Pesan Makanan & Minuman | 📋 Pesanan Meja */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 sticky top-[57px] z-20 backdrop-blur-md">
        <div className="max-w-lg mx-auto flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
          <button
            onClick={() => {
              if (!activeVoucher) {
                setIsBrowsingFnbWithoutVoucher(false);
              } else {
                setMainTab('karaoke');
              }
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'karaoke'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎤</span>
            <span>Karaoke</span>
          </button>

          <button
            onClick={() => setMainTab('fnb')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'fnb'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🍽️</span>
            <span>Menu F&B</span>
            {cartItemsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {cartItemsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('my_orders')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'my_orders'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋</span>
            <span>Pesanan Meja</span>
            {activeTableOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                {activeTableOrdersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
        {orderSuccessBanner && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-fadeIn">
            <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{orderSuccessBanner}</span>
          </div>
        )}

        {/* =================================================== */}
        {/* TAB 1: 🎤 KARAOKE & ANTREAN LAGU                    */}
        {/* =================================================== */}
        {mainTab === 'karaoke' && (
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
                    <div className="py-8 text-center text-slate-400 text-xs bg-slate-900/40 rounded-2xl border border-slate-800 p-4 space-y-3">
                      <div>Lagu &quot;{searchQuery}&quot; tidak ada di daftar koleksi lokal kafe.</div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSource('youtube');
                          if (cafeSettings?.youtubeApiKey) {
                            performYouTubeSearch(searchQuery.trim());
                          }
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center gap-2 mx-auto"
                      >
                        <span className="text-sm">🔴</span>
                        <span>Cari &quot;{searchQuery}&quot; di YouTube Langsung ➔</span>
                      </button>
                      <div className="text-[10px] text-slate-500">
                        Atau salin link video dari aplikasi YouTube lalu klik tombol <strong>📋 Tempel</strong> di atas.
                      </div>
                    </div>
                  )}
                </div>
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
                      <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs text-red-300 space-y-2">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>{ytSearchError}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenExternalYouTube(searchQuery)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-[11px] font-semibold"
                          >
                            Buka di YouTube ↗
                          </button>
                          <button
                            type="button"
                            onClick={handleSmartPaste}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-semibold"
                          >
                            Tempel Link
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
        )}

        {/* =================================================== */}
        {/* TAB 2: 🍽️ MENU F&B (E-MENU PEMESANAN)              */}
        {/* =================================================== */}
        {mainTab === 'fnb' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header / Search */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={fnbSearch}
                  onChange={(e) => setFnbSearch(e.target.value)}
                  placeholder="Cari makanan atau minuman..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500 shadow-inner"
                />
                <span className="absolute left-3 top-2.5 text-sm text-slate-500">🔍</span>
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(
                  [
                    { id: 'ALL', label: 'Semua', icon: '🍽️' },
                    { id: 'KOPI', label: 'Kopi', icon: '☕' },
                    { id: 'NON_KOPI', label: 'Minuman Segar', icon: '🥤' },
                    { id: 'MAKANAN', label: 'Makanan Utama', icon: '🍜' },
                    { id: 'SNACK', label: 'Camilan', icon: '🍟' },
                    { id: 'PAKET', label: 'Paket Hemat', icon: '🍱' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFnbCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      fnbCategory === cat.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="space-y-2.5">
              {Object.values(menuItems || {})
                .filter((item) => {
                  if (fnbCategory !== 'ALL' && item.category !== fnbCategory) return false;
                  if (fnbSearch.trim()) {
                    const q = fnbSearch.toLowerCase();
                    return item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
                  }
                  return true;
                })
                .map((item) => {
                  const cartItem = cart[item.id];
                  const inCartQty = cartItem?.quantity || 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 bg-slate-900/80 border rounded-2xl flex items-center justify-between gap-3 transition-all ${
                        item.isAvailable ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                          {item.imageUrl && item.imageUrl.startsWith('http') ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            item.imageUrl || '🍽️'
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{item.description}</p>
                          )}
                          <div className="text-xs font-black text-amber-400 mt-1">
                            Rp {item.price.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>

                      {/* Add to Cart or Stepper */}
                      <div className="shrink-0">
                        {!item.isAvailable ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                            Habis
                          </span>
                        ) : inCartQty > 0 ? (
                          <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl p-1">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-amber-400 px-1">
                              {inCartQty}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1 active:scale-95"
                          >
                            <span>+</span>
                            <span>Pesan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =================================================== */}
        {/* TAB 3: 📋 PESANAN MEJA (STATUS DAPUR & BILLING)    */}
        {/* =================================================== */}
        {mainTab === 'my_orders' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Table Bill Summary Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Tagihan Meja ({tableNumber})</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  {myTableOrders.length} Pesanan
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300">Total Belum Lunas:</span>
                <span className="text-xl font-black text-amber-400">
                  Rp {tableUnpaidBill.toLocaleString('id-ID')}
                </span>
              </div>
              {tableAccumulatedBill > tableUnpaidBill && (
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Total Sudah Pernah Lunas:</span>
                  <span>Rp {(tableAccumulatedBill - tableUnpaidBill).toLocaleString('id-ID')}</span>
                </div>
              )}
              <p className="text-[10px] text-slate-500 pt-1">
                💡 Silakan minta tagihan / bayar ke kasir saat selesai menikmati pesanan di kafe.
              </p>
            </div>

            {/* List of orders */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Rincian Pesanan Meja Ini:
              </h4>

              {myTableOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <div className="text-3xl mb-2">🍽️</div>
                  <p className="text-xs font-semibold text-slate-400">Belum ada pesanan dari meja ini.</p>
                  <button
                    onClick={() => setMainTab('fnb')}
                    className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                  >
                    Buka Menu Makanan & Minuman
                  </button>
                </div>
              ) : (
                myTableOrders.map((ord) => (
                  <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{ord.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ord.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Status Badges */}
                      {ord.status === 'PENDING' && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold animate-pulse">
                          🟡 Diterima Kasir / Menunggu
                        </span>
                      )}
                      {ord.status === 'COOKING' && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                          👨‍🍳 Sedang Dimasak
                        </span>
                      )}
                      {ord.status === 'SERVED' && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                          🍽️ Telah Disajikan
                        </span>
                      )}
                      {ord.status === 'PAID' && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          ✅ Lunas
                        </span>
                      )}
                      {ord.status === 'CANCELLED' && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                          ✕ Dibatalkan
                        </span>
                      )}
                    </div>

                    {/* Order items */}
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 space-y-1">
                      {ord.items.map((it, idx) => {
                        const count = it.quantity ?? it.qty ?? 1;
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-medium">
                              {count}x {it.name}
                              {it.notes && <span className="ml-1.5 text-amber-400/80 italic text-[10px]">({it.notes})</span>}
                            </span>
                            <span className="text-slate-400 font-mono">
                              Rp {(it.price * count).toLocaleString('id-ID')}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-xs font-bold">
                      <span className="text-slate-400">Total Tagihan Pesanan:</span>
                      <span className="text-emerald-400">Rp {ord.totalAmount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Developer Footer Brand */}
        <div className="pt-4 pb-2">
          <DeveloperFooter compact />
        </div>
      </main>

      {/* Floating Bottom Bar: Cart Bar on F&B tab when items exist, else Live Crowd Reactions */}
      {mainTab === 'fnb' && cartItemsCount > 0 ? (
        <footer className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 p-3 z-30 shadow-2xl">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">{cartItemsCount} Item Dipilih</div>
              <div className="text-sm font-black text-amber-400">
                Rp {cartTotalPrice.toLocaleString('id-ID')}
              </div>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95"
            >
              <span>🛒</span>
              <span>Lihat Pesanan & Kirim ➔</span>
            </button>
          </div>
        </footer>
      ) : (
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
      )}

      {/* Modal Checkout Pesanan F&B */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🛒 Konfirmasi Pesanan</span>
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-black">
                    {tableNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Pesanan akan langsung diteruskan ke kasir & dapur</p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Customer Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Nama Pemesan (opsional):</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={`Contoh: Budi (${tableNumber})`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* List of items in cart */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {Object.values(cart).map(({ item, quantity, notes }) => (
                <div key={item.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-xs font-bold text-white">{item.name}</h5>
                      <span className="text-[11px] text-amber-400 font-mono">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-xs font-mono font-bold text-white px-1">{quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-5 h-5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Notes input */}
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => updateCartNotes(item.id, e.target.value)}
                    placeholder="Catatan (misal: pedas sedang, es sedikit)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                  />
                </div>
              ))}
            </div>

            {/* Total & Submit Button */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Total Pembayaran Meja:</span>
                <span className="text-base font-black text-amber-400">
                  Rp {cartTotalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={orderSubmitting || Object.keys(cart).length === 0}
                  onClick={handleCheckoutSubmit}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>{orderSubmitting ? 'Mengirim...' : 'Kirim ke Dapur ➔'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pemilihan / Penggantian Meja */}
      <TableSelectorModal
        isOpen={isTableSelectorOpen}
        tables={tables}
        onSelectTable={handleSelectTable}
        onClose={() => setIsTableSelectorOpen(false)}
        currentTable={tableNumber}
        canClose={Boolean(tableNumber)}
        cafeName={cafeSettings?.name || 'CAFEYOU'}
      />
    </div>
  );
};

