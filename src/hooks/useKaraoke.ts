import { useEffect } from 'react';
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
  OrderType,
  DeliveryPlatform,
  ExpenseItem,
  ExpenseCategory,
} from '../types';
import { DEFAULT_MENU_ITEMS } from '../constants/menu';
import { fetchYouTubeInfo, getYouTubeThumbnail } from '../utils/youtube';
import { playSoundEffect } from '../utils/soundfx';
import { rebalanceFairQueue } from '../utils/queue';
import { initFirebaseDatabase, ref, get, onValue, set, update } from '../config/firebase';


export const isSameTable = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
};

export function useKaraoke() {
  const [appState, updateAppState, isCloudConnected] = useSyncState<KaraokeState>(
    STORAGE_KEY,
    DEFAULT_KARAOKE_STATE
  );

  // Dedicated Real-time Listener untuk tableOrders langsung dari Firebase RTDB
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) return;

    try {
      const ordersRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders`);
      const unsubOrders = onValue(ordersRef, (snapshot) => {
        const cloudOrders = snapshot.exists() ? snapshot.val() : {};
        if (cloudOrders && typeof cloudOrders === 'object') {
          updateAppState((prev) => {
            const currentOrders = prev?.tableOrders || {};
            const prevStr = JSON.stringify(currentOrders);
            const cloudStr = JSON.stringify(cloudOrders);
            if (prevStr === cloudStr) return prev;
            return {
              ...prev,
              tableOrders: cloudOrders,
            };
          });
        }
      });

      // Dedicated Real-time Listener untuk expenses (kas keluar)
      const expensesRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses`);
      const unsubExpenses = onValue(expensesRef, (snapshot) => {
        const cloudExpenses = snapshot.exists() ? snapshot.val() : {};
        if (cloudExpenses && typeof cloudExpenses === 'object') {
          updateAppState((prev) => {
            const currentExpenses = prev?.expenses || {};
            const prevStr = JSON.stringify(currentExpenses);
            const cloudStr = JSON.stringify(cloudExpenses);
            if (prevStr === cloudStr) return prev;
            return {
              ...prev,
              expenses: cloudExpenses,
            };
          });
        }
      });

      return () => {
        unsubOrders();
        unsubExpenses();
      };
    } catch (err) {
      console.warn('Gagal memasang realtime listener tableOrders/expenses:', err);
    }
  }, [updateAppState]);

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
      if (currentTables.some((t) => isSameTable(t, trimmed))) {
        return prev;
      }
      return {
        ...prev,
        tables: [...currentTables, trimmed],
      };
    });
  };

  const removeTable = (tableName: string): { success: boolean; reason?: string } => {
    const trimmed = tableName.trim();
    // Cek apakah ada pesanan belum lunas di meja ini
    const currentOrders = Object.values(appState?.tableOrders || {});
    const hasUnpaidOrders = currentOrders.some((o) => {
      const s = o.status?.toLowerCase();
      return isSameTable(o.tableNumber, trimmed) && s !== 'paid' && s !== 'cancelled';
    });

    if (hasUnpaidOrders) {
      return {
        success: false,
        reason: `Meja "${trimmed}" tidak dapat dihapus karena masih memiliki pesanan F&B aktif di kasir.`,
      };
    }

    // Cek apakah ada voucher aktif
    const currentVouchers = Object.values(appState?.vouchers || {});
    const hasActiveVouchers = currentVouchers.some(
      (v) => isSameTable(v.tableNumber, trimmed) && v.status === 'active' && v.quotaUsed < v.quotaTotal
    );

    if (hasActiveVouchers) {
      return {
        success: false,
        reason: `Meja "${trimmed}" masih memiliki kuota voucher karaoke aktif.`,
      };
    }

    updateAppState((prev) => {
      const currentTables = Array.isArray(prev?.tables) && prev.tables.length > 0 ? prev.tables : DEFAULT_TABLES;
      const updated = currentTables.filter((t) => !isSameTable(t, trimmed));
      return {
        ...prev,
        tables: updated.length > 0 ? updated : ['Meja 1'],
      };
    });

    return { success: true };
  };

  const updateLocalServerIp = (ip: string) => {
    const cleanIp = ip.trim();
    updateAppState((prev) => ({
      ...prev,
      cafeSettings: {
        ...(prev?.cafeSettings || DEFAULT_CAFE_SETTINGS),
        localServerIp: cleanIp,
      },
    }));
  };

  const updateRolePasswords = (operatorPass?: string, posPass?: string) => {
    updateAppState((prev) => {
      const current = prev?.cafeSettings || DEFAULT_CAFE_SETTINGS;
      return {
        ...prev,
        cafeSettings: {
          ...current,
          ...(operatorPass !== undefined ? { operatorPassword: operatorPass.trim() } : {}),
          ...(posPass !== undefined ? { posPassword: posPass.trim() } : {}),
        },
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

  const createTableOrder = async (
    tableNumber: string,
    customerName: string,
    items: OrderItem[],
    orderType: OrderType = 'DINE_IN',
    platform?: DeliveryPlatform,
    initialStatus: OrderStatus = 'pending',
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'ONLINE_MERCHANT' | 'online_merchant',
    financials?: {
      subtotal?: number;
      taxAmount?: number;
      serviceAmount?: number;
      roundingAmount?: number;
      finalTotal?: number;
    }
  ): Promise<TableOrder | null> => {
    if (!items || items.length === 0) return null;

    const effectiveTable =
      (tableNumber && tableNumber.trim()) ||
      (orderType === 'TAKEAWAY' ? 'TAKEAWAY' : orderType === 'ONLINE_DELIVERY' ? (platform || 'ONLINE') : 'Meja Umum');

    const timestamp = Date.now();
    const orderSeq = (Object.keys(tableOrders).length + 1).toString().padStart(3, '0');
    const orderPrefix = orderType === 'TAKEAWAY' ? 'TKW' : orderType === 'ONLINE_DELIVERY' ? 'ONL' : 'ORD';
    const orderNumber = `${orderPrefix}-${orderSeq}`;

    const calculatedTotal = items.reduce((sum, item) => sum + item.price * (item.quantity ?? item.qty ?? 1), 0);
    const finalAmount = financials?.finalTotal !== undefined ? financials.finalTotal : calculatedTotal;

    const isPaid = initialStatus === 'paid' || (initialStatus as string).toLowerCase() === 'paid';

    const newOrder: TableOrder = {
      id: `order-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      tableNumber: effectiveTable,
      customerName: customerName.trim() || effectiveTable,
      items,
      totalAmount: finalAmount,
      subtotal: financials?.subtotal !== undefined ? financials.subtotal : calculatedTotal,
      taxAmount: financials?.taxAmount || 0,
      serviceAmount: financials?.serviceAmount || 0,
      roundingAmount: financials?.roundingAmount || 0,
      status: initialStatus,
      createdAt: timestamp,
      orderType,
      platform,
      ...(isPaid
        ? {
            paidAt: timestamp,
            paymentMethod: paymentMethod || (orderType === 'ONLINE_DELIVERY' ? 'ONLINE_MERCHANT' : 'cash'),
          }
        : {}),
    };

    // 1. Update state lokal segera
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

    // 2. Tulis langsung secara atomik ke node Firebase RTDB agar instan terkirim ke POS & Operator
    try {
      const db = initFirebaseDatabase();
      if (db) {
        const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${newOrder.id}`);
        await set(orderRef, newOrder);
      }
    } catch (err) {
      console.warn('Gagal menyimpan pesanan langsung ke Firebase:', err);
    }

    return newOrder;
  };

  const updateTableOrderStatus = (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT',
    cancelReason?: string,
    financials?: {
      finalTotal?: number;
      subtotal?: number;
      taxAmount?: number;
      serviceAmount?: number;
      roundingAmount?: number;
    }
  ) => {
    let updatedTarget: TableOrder | null = null;
    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? { ...prev.tableOrders } : {};
      const target = currentOrders[orderId];
      if (!target) return prev;

      updatedTarget = {
        ...target,
        status,
        ...(status === 'paid' || (status as string).toLowerCase() === 'paid'
          ? {
              paidAt: Date.now(),
              paymentMethod: paymentMethod || 'cash',
              totalAmount: financials?.finalTotal !== undefined ? financials.finalTotal : target.totalAmount,
              subtotal: financials?.subtotal !== undefined ? financials.subtotal : target.totalAmount,
              taxAmount: financials?.taxAmount || 0,
              serviceAmount: financials?.serviceAmount || 0,
              roundingAmount: financials?.roundingAmount || 0,
            }
          : {}),
        ...((status === 'cancelled' || (status as string).toLowerCase() === 'cancelled') ? { cancelReason: cancelReason || 'Dibatalkan oleh Kasir' } : {}),
      };

      currentOrders[orderId] = updatedTarget;

      return {
        ...prev,
        tableOrders: currentOrders,
      };
    });

    // Tulis update langsung ke node Firebase RTDB
    if (updatedTarget) {
      try {
        const db = initFirebaseDatabase();
        if (db) {
          const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${orderId}`);
          set(orderRef, updatedTarget).catch((err) => {
            console.warn('Gagal update status pesanan di Firebase:', err);
          });
        }
      } catch (err) {}
    }
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

  const toggleMenuItemAvailability = (id: string) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? { ...prev.menuItems } : { ...DEFAULT_MENU_ITEMS };
      const item = currentMenu[id];
      if (!item) return prev;

      currentMenu[id] = {
        ...item,
        isAvailable: !item.isAvailable,
      };

      return {
        ...prev,
        menuItems: currentMenu,
      };
    });
  };

  const quickUpdateMenuPrice = (id: string, newPrice: number) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? { ...prev.menuItems } : { ...DEFAULT_MENU_ITEMS };
      const item = currentMenu[id];
      if (!item) return prev;

      currentMenu[id] = {
        ...item,
        price: Math.max(0, newPrice),
      };

      return {
        ...prev,
        menuItems: currentMenu,
      };
    });
  };

  const moveTableOrder = (orderId: string, newTableNumber: string) => {
    let updatedTarget: TableOrder | null = null;
    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? { ...prev.tableOrders } : {};
      const target = currentOrders[orderId];
      if (!target) return prev;

      const oldTable = target.tableNumber;
      const history = target.tableMoveHistory || [];

      updatedTarget = {
        ...target,
        tableNumber: newTableNumber,
        tableMoveHistory: [
          ...history,
          { from: oldTable, to: newTableNumber, movedAt: Date.now() },
        ],
      };

      currentOrders[orderId] = updatedTarget;

      return {
        ...prev,
        tableOrders: currentOrders,
      };
    });

    if (updatedTarget) {
      try {
        const db = initFirebaseDatabase();
        if (db) {
          const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${orderId}`);
          set(orderRef, updatedTarget).catch((err) => {
            console.warn('Gagal update perpindahan meja di Firebase:', err);
          });
        }
      } catch (err) {}
    }
  };

  const voidOrderItem = (orderId: string, itemIndex: number, reason?: string) => {
    let updatedTarget: TableOrder | null = null;
    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? { ...prev.tableOrders } : {};
      const target = currentOrders[orderId];
      if (!target || !target.items || !target.items[itemIndex]) return prev;

      const updatedItems = target.items.map((it, idx) => {
        if (idx === itemIndex) {
          return {
            ...it,
            isVoided: true,
            voidReason: reason || 'Stok dapur habis / Dibatalkan kasir',
          };
        }
        return it;
      });

      const newTotal = updatedItems.reduce((acc, it) => {
        if (it.isVoided) return acc;
        const count = it.quantity ?? it.qty ?? 1;
        return acc + it.price * count;
      }, 0);

      updatedTarget = {
        ...target,
        items: updatedItems,
        totalAmount: newTotal,
      };

      currentOrders[orderId] = updatedTarget;

      return {
        ...prev,
        tableOrders: currentOrders,
      };
    });

    if (updatedTarget) {
      try {
        const db = initFirebaseDatabase();
        if (db) {
          const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${orderId}`);
          set(orderRef, updatedTarget).catch((err) => {
            console.warn('Gagal void item di Firebase:', err);
          });
        }
      } catch (err) {}
    }
  };

  const confirmTableOrder = (orderId: string) => {
    updateTableOrderStatus(orderId, 'PREPARING');
  };

  const clearFinishedOrders = () => {
    let activeOnly: Record<string, TableOrder> = {};
    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? { ...prev.tableOrders } : {};
      activeOnly = {};
      Object.entries(currentOrders).forEach(([id, ord]) => {
        const s = ord.status?.toLowerCase();
        if (s === 'pending' || s === 'confirmed' || s === 'preparing' || s === 'cooking' || s === 'ready' || s === 'served') {
          activeOnly[id] = ord;
        }
      });
      return {
        ...prev,
        tableOrders: activeOnly,
      };
    });

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const ordersRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders`);
        set(ordersRef, activeOnly).catch((err) => {
          console.warn('Gagal sinkronisasi pembersihan pesanan selesai di Firebase:', err);
        });
      }
    } catch (err) {}
  };

  // ─── Modul Beban Pengeluaran / Kas Kecil (Petty Cash & Expenses) ───────────
  const addExpense = (
    category: ExpenseCategory,
    title: string,
    amount: number,
    notes?: string,
    recordedBy?: string,
    paymentSource: 'CASH_DRAWER' | 'BANK_TRANSFER' = 'CASH_DRAWER'
  ): ExpenseItem => {
    const timestamp = Date.now();
    const id = `exp-${timestamp}-${Math.random().toString(36).substring(2, 6)}`;
    const newExpense: ExpenseItem = {
      id,
      category,
      title: title.trim() || 'Pengeluaran Operasional',
      amount: Math.max(0, Number(amount) || 0),
      notes: notes?.trim() || '',
      recordedBy: recordedBy?.trim() || 'Staf Kasir',
      createdAt: timestamp,
      paymentSource,
    };

    updateAppState((prev) => {
      const currentExpenses =
        prev?.expenses && typeof prev.expenses === 'object' ? { ...prev.expenses } : {};
      return {
        ...prev,
        expenses: {
          ...currentExpenses,
          [id]: newExpense,
        },
      };
    });

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const expRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses/${id}`);
        set(expRef, newExpense).catch((err) => {
          console.warn('Gagal menyimpan pengeluaran langsung ke Firebase:', err);
        });
      }
    } catch (err) {}

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    updateAppState((prev) => {
      const currentExpenses =
        prev?.expenses && typeof prev.expenses === 'object' ? { ...prev.expenses } : {};
      delete currentExpenses[id];
      return {
        ...prev,
        expenses: currentExpenses,
      };
    });

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const expRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses/${id}`);
        set(expRef, null).catch((err) => {
          console.warn('Gagal hapus pengeluaran di Firebase:', err);
        });
      }
    } catch (err) {}
  };

  const clearExpenses = () => {
    updateAppState((prev) => ({
      ...prev,
      expenses: {},
    }));

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const expRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses`);
        set(expRef, {}).catch((err) => {
          console.warn('Gagal reset pengeluaran di Firebase:', err);
        });
      }
    } catch (err) {}
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
  const expenses: Record<string, ExpenseItem> =
    appState?.expenses && typeof appState.expenses === 'object' ? appState.expenses : {};

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
      expenses,
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
    moveTableOrder,
    voidOrderItem,
    confirmTableOrder,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetMenuToDefault,
    toggleMenuItemAvailability,
    quickUpdateMenuPrice,
    clearFinishedOrders,
    updateLocalServerIp,
    updateRolePasswords,
    expenses,
    addExpense,
    deleteExpense,
    clearExpenses,
  };
}
