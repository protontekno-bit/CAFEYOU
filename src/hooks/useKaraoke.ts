import { useSyncState } from './useSyncState';
import { STORAGE_KEY, DEFAULT_KARAOKE_STATE, DEFAULT_CAFE_SETTINGS } from '../constants/karaoke';
import {
  Song,
  KaraokeState,
  SoundEffectType,
  SongHistoryItem,
  SavedLibrarySong,
  Voucher,
  LiveReactionEvent,
  CafeSettings,
} from '../types';
import { fetchYouTubeInfo, getYouTubeThumbnail } from '../utils/youtube';
import { playSoundEffect } from '../utils/soundfx';
import { rebalanceFairQueue } from '../utils/queue';

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

      const updatedLibrary: Record<string, SavedLibrarySong> = {
        ...currentLibrary,
        [videoId]: {
          videoId,
          title: customTitle || existingLibSong?.title || finalTitle,
          url: rawUrl,
          thumbnail: getYouTubeThumbnail(videoId, 'hqdefault'),
          playCount: (existingLibSong?.playCount || 0) + 1,
          lastPlayedAt: Date.now(),
        },
      };

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
              songLibrary: {
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
              },
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
    const updatedLibrary: Record<string, SavedLibrarySong> = {
      ...currentLibrary,
      [song.videoId]: {
        videoId: song.videoId,
        title: song.title,
        url: song.url,
        thumbnail: song.thumbnail || getYouTubeThumbnail(song.videoId, 'hqdefault'),
        playCount: (existingLib?.playCount || 0) + 1,
        lastPlayedAt: Date.now(),
      },
    };

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

  const validateVoucher = (
    code: string
  ): { valid: boolean; voucher?: Voucher; isDailyPin?: boolean; message?: string } => {
    const trimmed = code.trim();

    // 1. Cek Master Daily PIN
    if (appState?.dailyPin?.enabled && appState.dailyPin.code === trimmed) {
      return {
        valid: true,
        isDailyPin: true,
        voucher: {
          code: trimmed,
          tableNumber: 'Master PIN',
          quotaTotal: 999,
          quotaUsed: 0,
          createdAt: Date.now(),
          status: 'active',
        },
      };
    }

    // 2. Cek Voucher Spesifik
    const currentVouchers =
      appState?.vouchers && typeof appState.vouchers === 'object' ? appState.vouchers : {};
    const v = currentVouchers[trimmed];

    if (!v) {
      return { valid: false, message: 'Kode voucher tidak ditemukan atau salah.' };
    }

    if (v.status === 'exhausted' || v.quotaUsed >= v.quotaTotal) {
      return { valid: false, message: 'Kuota lagu untuk voucher ini sudah habis.' };
    }

    return { valid: true, voucher: v };
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
  };
}
