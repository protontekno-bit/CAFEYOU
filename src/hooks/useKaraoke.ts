import { useSyncState } from './useSyncState';
import { STORAGE_KEY, DEFAULT_KARAOKE_STATE, DEFAULT_CAFE_SETTINGS, DEFAULT_TABLES } from '../constants/karaoke';
import {
  Song,
  KaraokeState,
  SoundEffectType,
  SongHistoryItem,
  SavedLibrarySong,
  Voucher,
  LiveReactionEvent,
  CafeSettings,
  MenuItem,
  OrderItem,
  OrderStatus,
  TableOrder,
} from '../types';
import { DEFAULT_MENU_ITEMS } from '../constants/menu';
import { fetchYouTubeInfo, getYouTubeThumbnail } from '../utils/youtube';
import { playSoundEffect } from '../utils/soundfx';
import { rebalanceFairQueue } from '../utils/queue';
import { initFirebaseDatabase, ref, get } from '../config/firebase';


export function useKaraoke() {
  const [appState, updateAppState, isCloudConnected] = useSyncState<KaraokeState>(
    STORAGE_KEY,
    DEFAULT_KARAOKE_STATE
  );

  const addSong = async (
    videoId: string,
    rawUrl: string,
    requester?: string,
    customTitle?: string,
    options?: { tableNumber?: string; source?: 'guest' | 'operator'; voucherCode?: string }
  ) => {
    const songId = Date.now().toString();
    const finalTitle = customTitle || 'Memuat data lagu...';

    const newSong: Song = {
      id: songId,
      videoId,
      requester: requester?.trim() || options?.tableNumber || 'Hamba Allah',
      tableNumber: options?.tableNumber,
      source: options?.source || 'operator',
      title: finalTitle,
      url: rawUrl,
      thumbnail: getYouTubeThumbnail(videoId, 'hqdefault'),
      addedAt: Date.now(),
    };

    // Tambahkan ke antrean, simpan ke songLibrary, dan kurangi kuota voucher jika dari guest
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      const currentLibrary = prev?.songLibrary && typeof prev.songLibrary === 'object' ? prev.songLibrary : {};
      const existingLibSong = currentLibrary[videoId];

      // Simpan ke songLibrary hanya jika autoSaveLibrary aktif atau lagu sudah terdaftar di library
      const shouldSaveToLib = prev?.autoSaveLibrary !== false || !!existingLibSong;
      const updatedLibrary: Record<string, SavedLibrarySong> = shouldSaveToLib
        ? {
            ...currentLibrary,
            [videoId]: {
              videoId,
              title: customTitle || existingLibSong?.title || finalTitle,
              url: rawUrl,
              thumbnail: getYouTubeThumbnail(videoId, 'hqdefault'),
              playCount: (existingLibSong?.playCount || 0) + 1,
              lastPlayedAt: Date.now(),
            },
          }
        : currentLibrary;

      // Jika ada voucherCode, kurangi kuota
      const currentVouchers = prev?.vouchers && typeof prev.vouchers === 'object' ? { ...prev.vouchers } : {};
      if (options?.voucherCode && currentVouchers[options.voucherCode]) {
        const v = currentVouchers[options.voucherCode];
        const newUsed = v.quotaUsed + 1;
        currentVouchers[options.voucherCode] = {
          ...v,
          quotaUsed: newUsed,
          status: newUsed >= v.quotaTotal ? 'exhausted' : 'active',
        };
      }

      // Susun antrean dengan aturan Fair Rotation jika aktif
      const rawNewQueue = [...currentQueue, newSong];
      const updatedQueue = prev?.fairRotationEnabled
        ? rebalanceFairQueue(rawNewQueue)
        : rawNewQueue;

      return {
        ...prev,
        queue: updatedQueue,
        songLibrary: updatedLibrary,
        vouchers: currentVouchers,
      };
    });

    // Jika custom title belum ada, ambil judul resmi via oEmbed
    if (!customTitle) {
      try {
        const info = await fetchYouTubeInfo(videoId);
        if (info && info.title) {
          updateAppState((prev) => {
            const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
            const currentLibrary = prev?.songLibrary && typeof prev.songLibrary === 'object' ? prev.songLibrary : {};
            const libSong = currentLibrary[videoId];
            const shouldSaveToLib = prev?.autoSaveLibrary !== false || !!libSong;

            return {
              ...prev,
              queue: currentQueue.map((song) =>
                song.id === songId
                  ? {
                      ...song,
                      title: info.title,
                      thumbnail: info.thumbnail || song.thumbnail,
                    }
                  : song
              ),
              songLibrary: shouldSaveToLib
                ? {
                    ...currentLibrary,
                    [videoId]: {
                      ...(libSong || {
                        videoId,
                        url: rawUrl,
                        playCount: 1,
                        lastPlayedAt: Date.now(),
                      }),
                      title: info.title,
                      thumbnail: info.thumbnail || getYouTubeThumbnail(videoId, 'hqdefault'),
                    },
                  }
                : currentLibrary,
            };
          });
        }
      } catch (err) {
        console.warn('Error fetching song info:', err);
      }
    }

    return newSong;
  };

  const removeSong = (id: string) => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      return {
        ...prev,
        queue: currentQueue.filter((song) => song.id !== id),
      };
    });
  };

  // Geser lagu ke urutan paling atas di antrean (Prioritas VIP)
  const moveToTop = (id: string) => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      const current = currentQueue[0];
      const rest = currentQueue.slice(1);
      const targetIndex = rest.findIndex((s) => s.id === id);
      if (targetIndex === -1) return prev;

      const targetSong = rest[targetIndex];
      const newRest = rest.filter((s) => s.id !== id);
      newRest.unshift(targetSong);

      return {
        ...prev,
        queue: current ? [current, ...newRest] : newRest,
      };
    });
  };

  // Geser lagu naik 1 posisi dalam antrean
  const moveSongUp = (id: string) => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      const current = currentQueue[0];
      const rest = [...currentQueue.slice(1)];
      const idx = rest.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;

      const temp = rest[idx - 1];
      rest[idx - 1] = rest[idx];
      rest[idx] = temp;

      return {
        ...prev,
        queue: current ? [current, ...rest] : rest,
      };
    });
  };

  // Geser lagu turun 1 posisi dalam antrean
  const moveSongDown = (id: string) => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      const current = currentQueue[0];
      const rest = [...currentQueue.slice(1)];
      const idx = rest.findIndex((s) => s.id === id);
      if (idx === -1 || idx >= rest.length - 1) return prev;

      const temp = rest[idx + 1];
      rest[idx + 1] = rest[idx];
      rest[idx] = temp;

      return {
        ...prev,
        queue: current ? [current, ...rest] : rest,
      };
    });
  };

  // Helper internal untuk mencatat lagu selesai ke history & update library
  const recordFinishedSong = (
    song: Song | undefined,
    state: KaraokeState
  ): { history: SongHistoryItem[]; songLibrary: Record<string, SavedLibrarySong> } => {
    const existingHistory = Array.isArray(state?.history) ? state.history : [];
    const currentLibrary =
      state?.songLibrary && typeof state.songLibrary === 'object' ? state.songLibrary : {};

    if (!song) return { history: existingHistory, songLibrary: currentLibrary };

    const historyItem: SongHistoryItem = {
      id: `${song.id}-${Date.now()}`,
      videoId: song.videoId,
      requester: song.requester,
      tableNumber: song.tableNumber,
      title: song.title,
      url: song.url,
      playedAt: Date.now(),
      thumbnail: song.thumbnail,
    };

    const newHistory = [historyItem, ...existingHistory].slice(0, 100);
    const existingLib = currentLibrary[song.videoId];
    const shouldSaveToLib = state?.autoSaveLibrary !== false || !!existingLib;
    const updatedLibrary: Record<string, SavedLibrarySong> = shouldSaveToLib
      ? {
          ...currentLibrary,
          [song.videoId]: {
            videoId: song.videoId,
            title: song.title,
            url: song.url,
            thumbnail: song.thumbnail || getYouTubeThumbnail(song.videoId, 'hqdefault'),
            playCount: (existingLib?.playCount || 0) + 1,
            lastPlayedAt: Date.now(),
          },
        }
      : currentLibrary;

    return {
      history: newHistory,
      songLibrary: updatedLibrary,
    };
  };

  const skipSong = () => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      const current = currentQueue[0];
      const { history, songLibrary } = recordFinishedSong(current, prev);

      return {
        ...prev,
        forceSkip: Date.now(),
        queue: currentQueue.slice(1),
        history,
        songLibrary,
      };
    });
  };

  const nextSong = () => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      const current = currentQueue[0];
      const { history, songLibrary } = recordFinishedSong(current, prev);

      return {
        ...prev,
        queue: currentQueue.slice(1),
        history,
        songLibrary,
      };
    });
  };

  const clearHistory = () => {
    updateAppState((prev) => ({
      ...prev,
      history: [],
    }));
  };

  // ─── Song Library Manager (Khusus Operator) ────────────────────────────────
  const deleteFromLibrary = (videoId: string) => {
    updateAppState((prev) => {
      const currentLibrary =
        prev?.songLibrary && typeof prev.songLibrary === 'object' ? { ...prev.songLibrary } : {};
      delete currentLibrary[videoId];
      return {
        ...prev,
        songLibrary: currentLibrary,
      };
    });
  };

  const clearLibrary = () => {
    updateAppState((prev) => ({
      ...prev,
      songLibrary: {},
    }));
  };

  const togglePlayPause = () => {
    updateAppState((prev) => ({
      ...prev,
      playbackStatus: prev?.playbackStatus === 'PLAYING' ? 'PAUSED' : 'PLAYING',
    }));
  };

  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    updateAppState((prev) => ({
      ...prev,
      volume: clampedVolume,
      isMuted: false,
    }));
  };

  const toggleMute = () => {
    updateAppState((prev) => ({
      ...prev,
      isMuted: !prev?.isMuted,
    }));
  };

  const setRunningText = (text: string) => {
    updateAppState((prev) => ({
      ...prev,
      runningText: text,
    }));
  };

  const triggerSoundEffect = (type: SoundEffectType) => {
    playSoundEffect(type);
    updateAppState((prev) => ({
      ...prev,
      soundEffect: {
        type,
        timestamp: Date.now(),
      },
    }));
  };

  // --- VOUCHER & SECURITY MANAGEMENT ---

  const createVoucher = (tableNumber: string, quota: number = 3): Voucher => {
    // Generate 4-digit random PIN
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newVoucher: Voucher = {
      code: randomCode,
      tableNumber: tableNumber.trim() || 'Meja Umum',
      quotaTotal: quota,
      quotaUsed: 0,
      createdAt: Date.now(),
      status: 'active',
    };

    updateAppState((prev) => {
      const currentVouchers =
        prev?.vouchers && typeof prev.vouchers === 'object' ? { ...prev.vouchers } : {};
      return {
        ...prev,
        vouchers: {
          ...currentVouchers,
          [randomCode]: newVoucher,
        },
      };
    });

    return newVoucher;
  };

  const revokeVoucher = (code: string) => {
    updateAppState((prev) => {
      const currentVouchers =
        prev?.vouchers && typeof prev.vouchers === 'object' ? { ...prev.vouchers } : {};
      delete currentVouchers[code];
      return {
        ...prev,
        vouchers: currentVouchers,
      };
    });
  };

  const setDailyPin = (enabled: boolean, code: string) => {
    updateAppState((prev) => ({
      ...prev,
      dailyPin: {
        enabled,
        code: code.trim(),
      },
    }));
  };

  const validateVoucher = async (
    code: string,
    targetTable?: string
  ): Promise<{ valid: boolean; voucher?: Voucher; isDailyPin?: boolean; message?: string }> => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { valid: false, message: 'Kode voucher tidak boleh kosong.' };
    }

    // 1. Cek Master Daily PIN
    if (
      appState?.dailyPin?.enabled &&
      (appState.dailyPin.code === trimmed ||
        appState.dailyPin.code.toLowerCase() === trimmed.toLowerCase())
    ) {
      return {
        valid: true,
        isDailyPin: true,
        voucher: {
          code: trimmed,
          tableNumber: targetTable || 'Master PIN',
          quotaTotal: 999,
          quotaUsed: 0,
          createdAt: Date.now(),
          status: 'active',
        },
      };
    }

    // 2. Cek Voucher di Local React State (Case-Insensitive & Trimmed)
    const currentVouchers: Record<string, Voucher> =
      appState?.vouchers && typeof appState.vouchers === 'object' ? { ...appState.vouchers } : {};

    let foundVoucher = Object.values(currentVouchers).find(
      (v) => v && v.code && v.code.trim().toUpperCase() === trimmed.toUpperCase()
    );

    // 3. Fallback: Jika belum ada di state, cek LocalStorage
    if (!foundVoucher) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.vouchers) {
            foundVoucher = Object.values(parsed.vouchers as Record<string, Voucher>).find(
              (v) => v && v.code && v.code.trim().toUpperCase() === trimmed.toUpperCase()
            );
          }
        }
      } catch {}
    }

    // 4. Fallback Cloud: Jika belum tersinkron di HP tamu, fetch live langsung ke Firebase Realtime Database
    if (!foundVoucher) {
      const db = initFirebaseDatabase();
      if (db) {
        try {
          const vouchersRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers`);
          const snap = await get(vouchersRef);
          if (snap.exists()) {
            const cloudVouchers = snap.val() as Record<string, Voucher>;
            foundVoucher = Object.values(cloudVouchers).find(
              (v) => v && v.code && v.code.trim().toUpperCase() === trimmed.toUpperCase()
            );
            // Sinkronkan ke local state agar tersimpan
            if (foundVoucher) {
              updateAppState((prev) => ({
                ...prev,
                vouchers: {
                  ...(prev?.vouchers || {}),
                  ...cloudVouchers,
                },
              }));
            }
          }
        } catch (err) {
          console.warn('Cloud voucher check error:', err);
        }
      }
    }

    if (!foundVoucher) {
      return {
        valid: false,
        message: `Kode voucher "${trimmed}" tidak ditemukan. Pastikan kode sudah benar atau dibuat oleh kasir.`,
      };
    }

    if (foundVoucher.status === 'exhausted' || foundVoucher.quotaUsed >= foundVoucher.quotaTotal) {
      return { valid: false, message: 'Kuota lagu untuk voucher ini sudah habis.' };
    }

    return { valid: true, voucher: foundVoucher };
  };


  const sendLiveReaction = (emoji: string, tableNumber: string) => {
    const event: LiveReactionEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      tableNumber,
      timestamp: Date.now(),
    };

    updateAppState((prev) => ({
      ...prev,
      liveReaction: event,
    }));
  };

  // --- SMART FAIR ROTATION (ANTI-MONOPOLI ANTREAN) ---

  const toggleFairRotation = (enabled?: boolean) => {
    updateAppState((prev) => {
      const newEnabled =
        enabled !== undefined ? enabled : !prev?.fairRotationEnabled;
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      return {
        ...prev,
        fairRotationEnabled: newEnabled,
        queue: newEnabled ? rebalanceFairQueue(currentQueue) : currentQueue,
      };
    });
  };

  const rebalanceQueueFairly = () => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      return {
        ...prev,
        queue: rebalanceFairQueue(currentQueue),
      };
    });
  };

  const updateCafeSettings = (newSettings: Partial<CafeSettings>) => {
    updateAppState((prev) => {
      const current = prev?.cafeSettings || DEFAULT_CAFE_SETTINGS;
      const merged: CafeSettings = {
        ...current,
        ...newSettings,
      };
      return {
        ...prev,
        cafeSettings: merged,
        // Jika nama kafe berubah dan running text masih default, sinkronkan running text
        runningText:
          prev.runningText && (prev.runningText === current.welcomeMessage || prev.runningText.includes(current.name))
            ? prev.runningText.replace(new RegExp(current.name, 'g'), merged.name)
            : prev.runningText,
      };
    });
  };

  const addTable = (tableName: string) => {
    const trimmed = tableName.trim();
    if (!trimmed) return;
    updateAppState((prev) => {
      const currentTables = Array.isArray(prev?.tables) && prev.tables.length > 0 ? prev.tables : DEFAULT_TABLES;
      if (currentTables.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        tables: [...currentTables, trimmed],
      };
    });
  };

  const removeTable = (tableName: string) => {
    updateAppState((prev) => {
      const currentTables = Array.isArray(prev?.tables) && prev.tables.length > 0 ? prev.tables : DEFAULT_TABLES;
      const updated = currentTables.filter((t) => t.toLowerCase() !== tableName.toLowerCase());
      return {
        ...prev,
        tables: updated.length > 0 ? updated : ['Meja 1'],
      };
    });
  };

  const resetTables = () => {
    updateAppState((prev) => ({
      ...prev,
      tables: DEFAULT_TABLES,
    }));
  };

  const toggleAutoSaveLibrary = (enabled?: boolean) => {
    updateAppState((prev) => ({
      ...prev,
      autoSaveLibrary: enabled !== undefined ? enabled : !(prev?.autoSaveLibrary ?? true),
    }));
  };

  const saveSongToLibrary = (song: Song | SongHistoryItem) => {
    if (!song || !song.videoId) return;
    updateAppState((prev) => {
      const currentLibrary =
        prev?.songLibrary && typeof prev.songLibrary === 'object' ? prev.songLibrary : {};
      const existing = currentLibrary[song.videoId];
      return {
        ...prev,
        songLibrary: {
          ...currentLibrary,
          [song.videoId]: {
            videoId: song.videoId,
            title: song.title,
            url: song.url,
            thumbnail: song.thumbnail || getYouTubeThumbnail(song.videoId, 'hqdefault'),
            playCount: existing ? (existing.playCount || 1) : 1,
            lastPlayedAt: Date.now(),
          },
        },
      };
    });
  };

  // ─── Modul POS F&B & Pesanan Meja ──────────────────────────────────────
  const menuItems: Record<string, MenuItem> =
    appState?.menuItems && typeof appState.menuItems === 'object'
      ? appState.menuItems
      : DEFAULT_MENU_ITEMS;

  const tableOrders: Record<string, TableOrder> =
    appState?.tableOrders && typeof appState.tableOrders === 'object'
      ? appState.tableOrders
      : {};

  const createTableOrder = (
    tableNumber: string,
    customerName: string,
    items: OrderItem[]
  ): TableOrder | null => {
    if (!tableNumber || !items || items.length === 0) return null;

    const timestamp = Date.now();
    const orderSeq = (Object.keys(tableOrders).length + 1).toString().padStart(3, '0');
    const orderNumber = `ORD-${orderSeq}`;
    const totalAmount = items.reduce((sum, item) => sum + item.price * (item.quantity ?? item.qty ?? 1), 0);

    const newOrder: TableOrder = {
      id: `order-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      tableNumber,
      customerName: customerName.trim() || tableNumber,
      items,
      totalAmount,
      status: 'pending',
      createdAt: timestamp,
    };

    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? prev.tableOrders : {};
      return {
        ...prev,
        tableOrders: {
          ...currentOrders,
          [newOrder.id]: newOrder,
        },
      };
    });

    return newOrder;
  };

  const updateTableOrderStatus = (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT',
    cancelReason?: string
  ) => {
    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? { ...prev.tableOrders } : {};
      const target = currentOrders[orderId];
      if (!target) return prev;

      currentOrders[orderId] = {
        ...target,
        status,
        ...(status === 'paid' ? { paidAt: Date.now(), paymentMethod: paymentMethod || 'cash' } : {}),
        ...(status === 'cancelled' ? { cancelReason: cancelReason || 'Dibatalkan oleh Kasir' } : {}),
      };

      return {
        ...prev,
        tableOrders: currentOrders,
      };
    });
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const id = `menu-${Date.now()}`;
    const newItem: MenuItem = { ...item, id };
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? prev.menuItems : DEFAULT_MENU_ITEMS;
      return {
        ...prev,
        menuItems: {
          ...currentMenu,
          [id]: newItem,
        },
      };
    });
  };

  const updateMenuItem = (item: MenuItem) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? prev.menuItems : DEFAULT_MENU_ITEMS;
      return {
        ...prev,
        menuItems: {
          ...currentMenu,
          [item.id]: item,
        },
      };
    });
  };

  const deleteMenuItem = (id: string) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? { ...prev.menuItems } : {};
      delete currentMenu[id];
      return {
        ...prev,
        menuItems: currentMenu,
      };
    });
  };

  const resetMenuToDefault = () => {
    updateAppState((prev) => ({
      ...prev,
      menuItems: DEFAULT_MENU_ITEMS,
    }));
  };

  const clearFinishedOrders = () => {
    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? { ...prev.tableOrders } : {};
      const activeOnly: Record<string, TableOrder> = {};
      Object.entries(currentOrders).forEach(([id, ord]) => {
        if (ord.status === 'pending' || ord.status === 'cooking' || ord.status === 'served') {
          activeOnly[id] = ord;
        }
      });
      return {
        ...prev,
        tableOrders: activeOnly,
      };
    });
  };

  const safeQueue = Array.isArray(appState?.queue) ? appState.queue : [];
  const currentSong = safeQueue[0] || null;
  const nextSongs = safeQueue.slice(1);
  const songLibrary =
    appState?.songLibrary && typeof appState.songLibrary === 'object' ? appState.songLibrary : {};
  const history = Array.isArray(appState?.history) ? appState.history : [];
  const vouchers =
    appState?.vouchers && typeof appState.vouchers === 'object' ? appState.vouchers : {};
  const dailyPin = appState?.dailyPin || { enabled: false, code: '1234' };
  const liveReaction = appState?.liveReaction || null;
  const fairRotationEnabled = !!appState?.fairRotationEnabled;
  const cafeSettings = appState?.cafeSettings || DEFAULT_CAFE_SETTINGS;
  const tables = Array.isArray(appState?.tables) && appState.tables.length > 0 ? appState.tables : DEFAULT_TABLES;
  const autoSaveLibrary = appState?.autoSaveLibrary !== false;

  return {
    state: {
      ...appState,
      queue: safeQueue,
      history,
      songLibrary,
      vouchers,
      dailyPin,
      liveReaction,
      fairRotationEnabled,
      cafeSettings,
      tables,
      autoSaveLibrary,
    },
    updateState: updateAppState,
    isCloudConnected,
    currentSong,
    nextSongs,
    songLibrary,
    history,
    vouchers,
    dailyPin,
    liveReaction,
    fairRotationEnabled,
    cafeSettings,
    addSong,
    removeSong,
    moveToTop,
    moveSongUp,
    moveSongDown,
    skipSong,
    nextSong,
    clearHistory,
    togglePlayPause,
    setVolume,
    toggleMute,
    setRunningText,
    triggerSoundEffect,
    createVoucher,
    revokeVoucher,
    setDailyPin,
    validateVoucher,
    sendLiveReaction,
    toggleFairRotation,
    rebalanceQueueFairly,
    updateCafeSettings,
    deleteFromLibrary,
    clearLibrary,
    tables,
    addTable,
    removeTable,
    resetTables,
    autoSaveLibrary,
    toggleAutoSaveLibrary,
    saveSongToLibrary,
    menuItems,
    tableOrders,
    createTableOrder,
    updateTableOrderStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetMenuToDefault,
    clearFinishedOrders,
  };
}
