import React, { useState, useEffect, useMemo } from 'react';
import { useKaraoke, isSameTable } from '../../hooks/useKaraoke';
import { GuestVoucherGate } from './GuestVoucherGate';
import { TableSelectorModal } from './TableSelectorModal';
import { GuestKaraokeTab } from './GuestKaraokeTab';
import { GuestMenuTab } from './GuestMenuTab';
import { GuestOrdersTab } from './GuestOrdersTab';
import { GuestCheckoutModal } from './GuestCheckoutModal';
import { GuestReceiptModal } from './GuestReceiptModal';
import { GuestGroupedReceiptModal } from './GuestGroupedReceiptModal';
import { GuestItemOptionsModal } from './GuestItemOptionsModal';
import { AppRole, Voucher, YouTubeSearchResult, MenuItem, MenuCategory, OrderItem, TableOrder } from '../../types';
import {
  POPULAR_KARAOKE_SONGS,
  extractYouTubeID,
  fetchYouTubeInfo,
  getYouTubeThumbnail,
  searchYouTubeVideos,
} from '../../utils/youtube';
import { initFirebaseDatabase, ref, set, onValue } from '../../config/firebase';
import { STORAGE_KEY } from '../../constants/karaoke';
import {
  SparklesIcon,
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
    try {
      const saved = sessionStorage.getItem('cafeyou_guest_table');
      if (saved && saved.trim()) return saved.trim();
    } catch {}
    if (urlTable) return urlTable;
    return '';
  });

  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState<boolean>(
    !tableNumber
  );

  // Digital Receipt Modal for Guests (E-Billing)
  const [selectedDigitalReceipt, setSelectedDigitalReceipt] = useState<TableOrder | null>(null);
  const [isGroupedReceiptOpen, setIsGroupedReceiptOpen] = useState<boolean>(false);

  // QRIS & DANA Self-Payment View
  const [showGuestQris, setShowGuestQris] = useState<boolean>(false);
  const [guestCopiedDana, setGuestCopiedDana] = useState<boolean>(false);

  // Notifikasi Pindah Meja Otomatis dari Kasir
  const [relocationNotice, setRelocationNotice] = useState<string | null>(null);
  // Notifikasi Panggilan Bernyanyi dari Operator
  const [stageCueAlert, setStageCueAlert] = useState<{ message: string; songTitle?: string } | null>(null);

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
    const cleanTable = selected.trim();
    if (!cleanTable) return;

    setTableNumber(cleanTable);
    try {
      sessionStorage.setItem('cafeyou_guest_table', cleanTable);
    } catch {}

    // Update query parameter di URL hash / search jika ada agar tidak revert saat refresh
    try {
      const hash = window.location.hash;
      const qIdx = hash.indexOf('?');
      if (qIdx !== -1) {
        const baseHash = hash.substring(0, qIdx);
        const params = new URLSearchParams(hash.substring(qIdx));
        params.set('table', cleanTable);
        window.history.replaceState(null, '', `${baseHash}?${params.toString()}`);
      } else if (window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('table')) {
          searchParams.set('table', cleanTable);
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}?${searchParams.toString()}${window.location.hash}`
          );
        }
      }
    } catch {}

    setIsTableSelectorOpen(false);

    // Coba restore voucher untuk meja baru
    try {
      const saved = sessionStorage.getItem(`cafeyou_voucher_${cleanTable}`);
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
    // Jika voucher sudah direvoke operator (tidak ada di vouchers state),
    // jangan fallback ke activeVoucher lama — kembalikan null agar diblokir
    if (!found && Object.keys(vouchers || {}).length > 0) {
      // Vouchers state sudah dimuat tapi kode ini tidak ada → sudah direvoke
      return null;
    }
    // Jika found, update sessionStorage agar kuota sisa di header real-time
    if (found) {
      try {
        sessionStorage.setItem(`cafeyou_voucher_${tableNumber}`, JSON.stringify(found));
      } catch {}
    }
    return found || activeVoucher;
  }, [activeVoucher, vouchers, state?.dailyPin, tableNumber]);

  // Auto-sync jika kasir memindahkan pesanan meja dari POS
  useEffect(() => {
    if (!tableNumber) return;
    const orders = Object.values(tableOrders || {});
    for (const ord of orders) {
      if (ord.tableMoveHistory && ord.tableMoveHistory.length > 0) {
        const latestMove = ord.tableMoveHistory[ord.tableMoveHistory.length - 1];
        if (
          isSameTable(latestMove.from, tableNumber) &&
          !isSameTable(latestMove.to, tableNumber) &&
          Date.now() - latestMove.movedAt < 3600000
        ) {
          const newT = latestMove.to;
          setTableNumber(newT);
          try {
            sessionStorage.setItem('cafeyou_guest_table', newT);
            const oldV = sessionStorage.getItem(`cafeyou_voucher_${tableNumber}`);
            if (oldV) {
              sessionStorage.setItem(`cafeyou_voucher_${newT}`, oldV);
            }
          } catch {}

          setRelocationNotice(`Meja Anda telah dialihkan ke ${newT} oleh kasir.`);
          setTimeout(() => setRelocationNotice(null), 8000);
          break;
        }
      }
    }
  }, [tableOrders, tableNumber]);

  // Realtime Stage Cue Alert (Panggilan Operator saat giliran bernyanyi tiba)
  useEffect(() => {
    if (!tableNumber) return;
    const cleanT = tableNumber.trim();
    const db = initFirebaseDatabase();
    if (!db) return;

    try {
      const cueRef = ref(db, `cafeyou/${STORAGE_KEY}/stage_cues/${cleanT}`);
      const unsub = onValue(cueRef, (snap) => {
        const val = snap.val();
        if (val && val.timestamp && Date.now() - val.timestamp < 60000) {
          setStageCueAlert({
            message: val.message || 'Lagu Anda berikutnya! Silakan bersiap menuju panggung 🎤',
            songTitle: val.songTitle,
          });

          // Getar smartphone tamu (tactile feedback)
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([300, 150, 300]);
            }
          } catch {}

          // Otomatis tutup notifikasi setelah 12 detik
          const timer = setTimeout(() => {
            setStageCueAlert(null);
          }, 12000);
          return () => clearTimeout(timer);
        }
      });

      return () => unsub();
    } catch {}
  }, [tableNumber]);

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
            const targetT = res.voucher.tableNumber || tableNumber;
            if (res.voucher.tableNumber && !isSameTable(res.voucher.tableNumber, 'Meja Umum')) {
              setTableNumber(res.voucher.tableNumber);
              try {
                sessionStorage.setItem('cafeyou_guest_table', res.voucher.tableNumber);
              } catch {}
            }
            try {
              sessionStorage.setItem(`cafeyou_voucher_${targetT}`, JSON.stringify(res.voucher));
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

  const [cart, setCart] = useState<
    Record<
      string,
      {
        item: MenuItem;
        quantity: number;
        notes: string;
        selectedOptions?: string[];
        unitPrice?: number;
      }
    >
  >({});
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

  // Modal Pemilihan Varian (Hot/Ice, Gula, Topping)
  const [configuringMenuItem, setConfiguringMenuItem] = useState<MenuItem | null>(null);
  const [selectedSingleOptions, setSelectedSingleOptions] = useState<Record<string, string>>({});
  const [selectedMultipleOptions, setSelectedMultipleOptions] = useState<Record<string, string[]>>({});

  const handleOpenConfigureItem = (item: MenuItem) => {
    setConfiguringMenuItem(item);
    const initialSingles: Record<string, string> = {};
    const initialMultiples: Record<string, string[]> = {};

    item.optionGroups?.forEach((g) => {
      if (g.type === 'multiple') {
        initialMultiples[g.title] = [];
      } else {
        initialSingles[g.title] = g.options[0]?.name || '';
      }
    });

    setSelectedSingleOptions(initialSingles);
    setSelectedMultipleOptions(initialMultiples);
  };

  const handleConfirmOptionSelection = () => {
    if (!configuringMenuItem) return;
    let extraTotal = 0;
    const chosenOptions: string[] = [];

    configuringMenuItem.optionGroups?.forEach((g) => {
      if (g.type === 'multiple') {
        const selected = selectedMultipleOptions[g.title] || [];
        selected.forEach((optName) => {
          const found = g.options.find((o) => o.name === optName);
          if (found) {
            extraTotal += (found.extraPrice || 0);
            chosenOptions.push(found.extraPrice ? `${found.name} (+Rp ${found.extraPrice.toLocaleString('id-ID')})` : found.name);
          }
        });
      } else {
        const chosenName = selectedSingleOptions[g.title] || g.options[0]?.name;
        const found = g.options.find((o) => o.name === chosenName);
        if (found) {
          extraTotal += (found.extraPrice || 0);
          chosenOptions.push(found.extraPrice ? `${found.name} (+Rp ${found.extraPrice.toLocaleString('id-ID')})` : found.name);
        }
      }
    });

    const unitPrice = configuringMenuItem.price + extraTotal;
    const cartKey = chosenOptions.length > 0 ? `${configuringMenuItem.id}-${chosenOptions.join('_')}` : configuringMenuItem.id;

    setCart((prev) => {
      const existing = prev[cartKey];
      if (existing) {
        return {
          ...prev,
          [cartKey]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [cartKey]: {
          item: configuringMenuItem,
          quantity: 1,
          notes: '',
          selectedOptions: chosenOptions,
          unitPrice,
        },
      };
    });

    setConfiguringMenuItem(null);
  };

  // Cart Handlers
  const addToCart = (item: MenuItem) => {
    if (item.optionGroups && item.optionGroups.length > 0) {
      handleOpenConfigureItem(item);
      return;
    }

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
        [item.id]: { item, quantity: 1, notes: '', unitPrice: item.price },
      };
    });
  };

  const removeFromCart = (cartKey: string) => {
    setCart((prev) => {
      const existing = prev[cartKey];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[cartKey];
        return next;
      }
      return {
        ...prev,
        [cartKey]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const updateCartQuantity = (cartKey: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[cartKey];
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[cartKey];
        return next;
      }
      return {
        ...prev,
        [cartKey]: { ...existing, quantity: nextQty },
      };
    });
  };

  const updateCartNotes = (cartKey: string, notes: string) => {
    setCart((prev) => {
      if (!prev[cartKey]) return prev;
      return {
        ...prev,
        [cartKey]: { ...prev[cartKey], notes },
      };
    });
  };

  const cartItemsCount = Object.values(cart).reduce((sum, c) => sum + c.quantity, 0);
  const cartTotalPrice = Object.values(cart).reduce((sum, c) => sum + ((c.unitPrice || c.item.price) * c.quantity), 0);

  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);
  const [sessionStartTime] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('cafeyou_guest_session_start');
      if (saved) return Number(saved);
      const now = Date.now();
      sessionStorage.setItem('cafeyou_guest_session_start', String(now));
      return now;
    } catch {
      return Date.now();
    }
  });

  // Table Orders filter for this table with Table Turnover isolation
  const myTableOrders = useMemo(() => {
    if (!tableNumber) return [];
    return Object.values(tableOrders || {})
      .filter((o) => {
        if (!isSameTable(o.tableNumber, tableNumber)) return false;
        const s = o.status?.toLowerCase();
        // Selalu tampilkan pesanan aktif (belum lunas)
        if (s !== 'paid' && s !== 'cancelled') return true;
        // Jika lunas / batal, tampilkan jika dibuat pada sesi saat ini atau user klik tampilkan semua
        if (showAllHistory) return true;
        return o.createdAt >= sessionStartTime - 300000; // toleransi 5 menit sebelum scan QR
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [tableOrders, tableNumber, showAllHistory, sessionStartTime]);

  const activeTableOrdersCount = myTableOrders.filter((o) => {
    const s = o.status?.toLowerCase();
    return s !== 'paid' && s !== 'cancelled';
  }).length;

  // Tarif Pajak PB1 & Service Charge
  const isTaxEnabled = cafeSettings?.enableTax !== false && (cafeSettings?.taxPercentage || 0) > 0;
  const isTaxPlus = isTaxEnabled && cafeSettings?.isTaxIncluded === false;
  const guestTaxRate = isTaxPlus ? (cafeSettings?.taxPercentage || 0) : 0;
  const guestServiceRate = cafeSettings?.servicePercentage || 0;

  // Subtotal riil pesanan belum lunas (sebelum pajak tambahan)
  const tableUnpaidSubtotal = myTableOrders
    .filter((o) => {
      const s = o.status?.toLowerCase();
      return s !== 'paid' && s !== 'cancelled';
    })
    .reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0);

  // Estimasi Pajak & Layanan jika belum termasuk di harga menu
  const tableUnpaidEstimatedTax = Math.round((tableUnpaidSubtotal * guestTaxRate) / 100);
  const tableUnpaidEstimatedService = Math.round((tableUnpaidSubtotal * guestServiceRate) / 100);
  const tableUnpaidBill = tableUnpaidSubtotal + tableUnpaidEstimatedTax + tableUnpaidEstimatedService;

  // Total yang sudah pernah lunas
  const tablePaidTotal = myTableOrders
    .filter((o) => o.status?.toLowerCase() === 'paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Total akumulasi seluruh pesanan non-batal
  const tableAccumulatedBill = tablePaidTotal + tableUnpaidBill;

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
        price: c.unitPrice || c.item.price,
        quantity: c.quantity,
        notes: c.notes.trim() || undefined,
        selectedOptions: c.selectedOptions && c.selectedOptions.length > 0 ? c.selectedOptions : undefined,
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

  // Debounced Live YouTube Search — berjalan otomatis saat tamu mengetik (catalog & youtube mode)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    // Hanya jalankan jika ada query nyata (bukan URL YouTube) dan ada API key
    if (!trimmed || extractYouTubeID(trimmed) || !cafeSettings?.youtubeApiKey) {
      setYtSearchResults([]);
      setYtSearchError(null);
      return;
    }

    // Debounce 600ms agar tidak terlalu agresif saat tamu masih mengetik
    const timer = setTimeout(() => {
      performYouTubeSearch(trimmed);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery, cafeSettings?.youtubeApiKey]);

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

      // Setelah berhasil tambah lagu, sync activeVoucher dengan data terbaru
      // agar counter sisa kuota di header langsung terupdate
      if (activeVoucher?.code) {
        const updatedVoucher = Object.values(vouchers || {}).find(
          (v) => v?.code?.trim().toUpperCase() === activeVoucher.code.trim().toUpperCase()
        );
        if (updatedVoucher) {
          // Beri Firebase 300ms untuk propagate lalu ambil dari state
          setTimeout(() => {
            const latestVoucher = Object.values(vouchers || {}).find(
              (v) => v?.code?.trim().toUpperCase() === activeVoucher.code.trim().toUpperCase()
            );
            if (latestVoucher) {
              setActiveVoucher({ ...latestVoucher });
              try {
                sessionStorage.setItem(`cafeyou_voucher_${tableNumber}`, JSON.stringify(latestVoucher));
              } catch {}
            }
          }, 800);
        }
      }

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

  // Permintaan Tambah Kuota Lagu ke Kasir
  const [isTopUpRequested, setIsTopUpRequested] = useState<boolean>(false);

  const handleRequestQuotaTopUp = () => {
    if (!tableNumber || isTopUpRequested) return;
    setIsTopUpRequested(true);
    try {
      const db = initFirebaseDatabase();
      if (db) {
        const reqRef = ref(db, `cafeyou/assistance_requests/${tableNumber}`);
        set(reqRef, {
          tableNumber,
          voucherCode: activeVoucher?.code || '',
          type: 'quota_topup',
          requestedAt: Date.now(),
          status: 'pending',
        }).catch((err) => {
          console.warn('Gagal mengirim permintaan top-up kuota:', err);
        });
      }
    } catch {}

    setSuccessAddMsg('Permintaan tambah kuota lagu telah terkirim ke kasir! Mohon tunggu konfirmasi.');
    setTimeout(() => {
      setSuccessAddMsg(null);
    }, 4000);
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

  const totalQueueCount = nextSongs.length + (currentSong ? 1 : 0);

  const isMySongOnAir = Boolean(
    currentSong &&
    tableNumber &&
    (isSameTable(currentSong.tableNumber, tableNumber) || isSameTable(currentSong.requester, tableNumber))
  );

  const myQueuedSongsCount = useMemo(() => {
    if (!tableNumber) return 0;
    return nextSongs.filter(
      (s) => isSameTable(s.tableNumber, tableNumber) || isSameTable(s.requester, tableNumber)
    ).length;
  }, [nextSongs, tableNumber]);

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
            if (v.tableNumber && !isSameTable(v.tableNumber, 'Meja Umum')) {
              setTableNumber(v.tableNumber);
              try {
                sessionStorage.setItem('cafeyou_guest_table', v.tableNumber);
                sessionStorage.setItem(`cafeyou_voucher_${v.tableNumber}`, JSON.stringify(v));
              } catch {}
            }
            setIsBrowsingFnbWithoutVoucher(false);
          }}
          validateVoucher={validateVoucher}
          onBackToLanding={setRole ? () => setRole('landing') : undefined}
          onChangeTable={() => setIsTableSelectorOpen(true)}
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
              <button
                type="button"
                onClick={() => setIsTableSelectorOpen(true)}
                className="text-purple-300 hover:text-purple-200 underline underline-offset-2 flex items-center gap-1 font-bold group cursor-pointer"
                title="Klik untuk mengganti nomor meja"
              >
                <span>{tableNumber}</span>
                <span className="text-[8px] bg-purple-500/25 text-purple-300 px-1 py-0.2 rounded group-hover:bg-purple-500/40">Ganti</span>
              </button>
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

      {/* Real-time Status Banner: Lagu Meja Ini Sedang ON AIR atau Mengantre */}
      {isMySongOnAir && (
        <div className="bg-gradient-to-r from-emerald-600/30 via-teal-600/20 to-emerald-600/30 border-b border-emerald-500/40 px-4 py-2 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-300 font-extrabold truncate">
            <span className="text-sm animate-bounce">🎤</span>
            <span>Lagu Meja Anda Sedang Tayang di Layar TV!</span>
            <span className="text-[11px] text-white font-medium opacity-90 truncate max-w-[150px] sm:max-w-xs">
              ({currentSong?.title})
            </span>
          </div>
          <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full shrink-0 shadow-sm animate-pulse">
            ON AIR
          </span>
        </div>
      )}

      {!isMySongOnAir && myQueuedSongsCount > 0 && (
        <div className="bg-gradient-to-r from-blue-600/25 via-indigo-600/15 to-blue-600/25 border-b border-blue-500/30 px-4 py-1.5 flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-blue-200 font-semibold truncate">
            <span>⏳</span>
            <span>{myQueuedSongsCount} lagu dari meja Anda ada dalam antrean tunggu kafe</span>
          </div>
          <button
            onClick={() => {
              setMainTab('karaoke');
              setActiveTab('queue');
            }}
            className="text-[11px] font-bold text-blue-300 underline underline-offset-2 shrink-0 hover:text-white"
          >
            Lihat Urutan →
          </button>
        </div>
      )}

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
        {/* Banner Notifikasi Pindah Meja Otomatis dari Kasir */}
        {relocationNotice && (
          <div className="p-3.5 bg-blue-500/20 border border-blue-500/40 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-blue-200 animate-fadeIn shadow-lg shadow-blue-500/10">
            <span className="text-base">🔀</span>
            <span className="flex-1">{relocationNotice}</span>
            <button
              onClick={() => setRelocationNotice(null)}
              className="text-blue-300 hover:text-white text-xs px-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Banner Panggilan Panggung dari Operator */}
        {stageCueAlert && (
          <div className="p-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-white shadow-2xl shadow-amber-600/30 animate-bounceIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0 animate-pulse">
                🎤
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                  PANGGILAN PANGGUNG • {tableNumber}
                </div>
                <div className="text-xs sm:text-sm font-extrabold leading-tight">
                  {stageCueAlert.message}
                </div>
                {stageCueAlert.songTitle && (
                  <div className="text-[11px] text-amber-100 opacity-90 truncate mt-0.5">
                    Lagu: <strong>{stageCueAlert.songTitle}</strong>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setStageCueAlert(null)}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white text-xs font-bold shrink-0"
              title="Tutup Notifikasi"
            >
              ✕
            </button>
          </div>
        )}

        {orderSuccessBanner && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-fadeIn">
            <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{orderSuccessBanner}</span>
          </div>
        )}

        {/* TAB 1: 🎤 KARAOKE & ANTREAN LAGU */}
        {mainTab === 'karaoke' && (
          <GuestKaraokeTab
            fairRotationEnabled={fairRotationEnabled}
            successAddMsg={successAddMsg}
            isQuotaExhausted={isQuotaExhausted}
            requesterName={requesterName}
            setRequesterName={setRequesterName}
            tableNumber={tableNumber}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            totalQueueCount={totalQueueCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSmartPaste={handleSmartPaste}
            searchSource={searchSource}
            setSearchSource={setSearchSource}
            filteredCatalog={filteredCatalog}
            cafeSettings={cafeSettings}
            performYouTubeSearch={performYouTubeSearch}
            isLoadingYtPreview={isLoadingYtPreview}
            detectedYtVideo={detectedYtVideo}
            handleAddSong={handleAddSong}
            isSubmitting={isSubmitting}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isSearchingYt={isSearchingYt}
            ytSearchError={ytSearchError}
            ytSearchResults={ytSearchResults}
            handleOpenExternalYouTube={handleOpenExternalYouTube}
            currentSong={currentSong}
            nextSongs={nextSongs}
            onRequestQuotaTopUp={handleRequestQuotaTopUp}
            onSwitchToFnb={() => setMainTab('fnb')}
            isTopUpRequested={isTopUpRequested}
          />
        )}

        {/* TAB 2: 🍽️ MENU F&B (E-MENU PEMESANAN) */}
        {mainTab === 'fnb' && (
          <GuestMenuTab
            fnbSearch={fnbSearch}
            setFnbSearch={setFnbSearch}
            fnbCategory={fnbCategory}
            setFnbCategory={setFnbCategory}
            menuItems={menuItems}
            cart={cart}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            onOpenConfigureItem={handleOpenConfigureItem}
          />
        )}

        {/* TAB 3: 📋 PESANAN MEJA (STATUS DAPUR & BILLING) */}
        {mainTab === 'my_orders' && (
          <GuestOrdersTab
            tableNumber={tableNumber}
            myTableOrders={myTableOrders}
            tableUnpaidSubtotal={tableUnpaidSubtotal}
            tableUnpaidEstimatedTax={tableUnpaidEstimatedTax}
            tableUnpaidEstimatedService={tableUnpaidEstimatedService}
            tableUnpaidBill={tableUnpaidBill}
            tablePaidTotal={tablePaidTotal}
            guestTaxRate={guestTaxRate}
            guestServiceRate={guestServiceRate}
            cafeSettings={cafeSettings}
            showGuestQris={showGuestQris}
            setShowGuestQris={setShowGuestQris}
            guestCopiedDana={guestCopiedDana}
            setGuestCopiedDana={setGuestCopiedDana}
            showAllHistory={showAllHistory}
            setShowAllHistory={setShowAllHistory}
            onOpenGroupedReceipt={() => setIsGroupedReceiptOpen(true)}
            onOpenSingleReceipt={(ord) => setSelectedDigitalReceipt(ord)}
            onSwitchToFnbTab={() => setMainTab('fnb')}
          />
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
      <GuestCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        tableNumber={tableNumber}
        customerName={customerName}
        setCustomerName={setCustomerName}
        cart={cart}
        onRemoveFromCart={removeFromCart}
        onUpdateCartQuantity={updateCartQuantity}
        onUpdateCartNotes={updateCartNotes}
        cartTotalPrice={cartTotalPrice}
        guestTaxRate={guestTaxRate}
        guestServiceRate={guestServiceRate}
        isTaxPlus={isTaxPlus}
        cafeSettings={cafeSettings}
        orderSubmitting={orderSubmitting}
        onSubmitOrder={handleCheckoutSubmit}
      />

      {/* Modal Struk Digital Tamu (E-Billing Per Pesanan) */}
      <GuestReceiptModal
        order={selectedDigitalReceipt}
        onClose={() => setSelectedDigitalReceipt(null)}
        cafeSettings={cafeSettings}
      />

      {/* Modal E-Nota Konsolidasi Meja (Grouped Table Bill) */}
      <GuestGroupedReceiptModal
        isOpen={isGroupedReceiptOpen}
        onClose={() => setIsGroupedReceiptOpen(false)}
        tableNumber={tableNumber}
        customerName={customerName}
        myTableOrders={myTableOrders}
        tableUnpaidSubtotal={tableUnpaidSubtotal}
        tableUnpaidEstimatedTax={tableUnpaidEstimatedTax}
        tableUnpaidEstimatedService={tableUnpaidEstimatedService}
        tableUnpaidBill={tableUnpaidBill}
        tablePaidTotal={tablePaidTotal}
        tableAccumulatedBill={tableAccumulatedBill}
        guestTaxRate={guestTaxRate}
        guestServiceRate={guestServiceRate}
        cafeSettings={cafeSettings}
      />

      {/* Modal Opsi Menu (Modifiers / Addons) */}
      <GuestItemOptionsModal
        configuringMenuItem={configuringMenuItem}
        onClose={() => setConfiguringMenuItem(null)}
        selectedSingleOptions={selectedSingleOptions}
        setSelectedSingleOptions={setSelectedSingleOptions}
        selectedMultipleOptions={selectedMultipleOptions}
        setSelectedMultipleOptions={setSelectedMultipleOptions}
        onConfirmOptionSelection={handleConfirmOptionSelection}
      />

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
