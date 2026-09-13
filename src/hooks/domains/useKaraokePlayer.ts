import {
  Song,
  KaraokeState,
  SoundEffectType,
  SongHistoryItem,
  SavedLibrarySong,
  Voucher,
} from '../../types';
import { STORAGE_KEY } from '../../constants/karaoke';
import { initFirebaseDatabase, ref, set } from '../../config/firebase';
import { fetchYouTubeInfo, getYouTubeThumbnail } from '../../utils/youtube';
import { playSoundEffect } from '../../utils/soundfx';
import { rebalanceFairQueue } from '../../utils/queue';

export function useKaraokePlayer(
  appState: KaraokeState,
  updateAppState: (updater: (prev: KaraokeState) => KaraokeState) => void
) {
  const safeQueue = Array.isArray(appState?.queue) ? appState.queue : [];
  const currentSong = safeQueue[0] || null;
  const nextSongs = safeQueue.slice(1);
  const songLibrary =
    appState?.songLibrary && typeof appState.songLibrary === 'object' ? appState.songLibrary : {};
  const history = Array.isArray(appState?.history) ? appState.history : [];
  const liveReaction = appState?.liveReaction || null;
  const fairRotationEnabled = !!appState?.fairRotationEnabled;
  const autoSaveLibrary = appState?.autoSaveLibrary !== false;

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

    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      const currentLibrary = prev?.songLibrary && typeof prev.songLibrary === 'object' ? prev.songLibrary : {};
      const existingLibSong = currentLibrary[videoId];

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

      const currentVouchers = prev?.vouchers && typeof prev.vouchers === 'object' ? { ...prev.vouchers } : {};
      if (options?.voucherCode && currentVouchers[options.voucherCode]) {
        const v = currentVouchers[options.voucherCode];
        const newUsed = v.quotaUsed + 1;
        const updatedV: Voucher = {
          ...v,
          quotaUsed: newUsed,
          status: newUsed >= v.quotaTotal && v.quotaTotal !== 999 ? 'exhausted' : 'active',
        };
        currentVouchers[options.voucherCode] = updatedV;

        try {
          const db = initFirebaseDatabase();
          if (db) {
            const vRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers/${options.voucherCode}`);
            set(vRef, updatedV).catch((err) => {
              console.warn('Gagal sinkronisasi kuota voucher ke Firebase:', err);
            });
          }
        } catch (err) {}
      }

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

  const replayCurrentSong = () => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      if (currentQueue.length === 0) return prev;
      return {
        ...prev,
        forceReplay: Date.now(),
        playbackStatus: 'PLAYING',
      };
    });
  };

  const clearQueue = (keepCurrentSong: boolean = true) => {
    updateAppState((prev) => {
      const currentQueue = Array.isArray(prev?.queue) ? prev.queue : [];
      if (keepCurrentSong && currentQueue.length > 0) {
        return {
          ...prev,
          queue: [currentQueue[0]],
        };
      }
      return {
        ...prev,
        queue: [],
      };
    });
  };

  const clearHistory = () => {
    updateAppState((prev) => ({
      ...prev,
      history: [],
    }));
  };

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

  const sendLiveReaction = (emoji: string, tableNumber: string) => {
    updateAppState((prev) => ({
      ...prev,
      liveReaction: {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emoji,
        tableNumber,
        timestamp: Date.now(),
      },
    }));
  };

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

  return {
    state: {
      queue: safeQueue,
      history,
      songLibrary,
      liveReaction,
      fairRotationEnabled,
      autoSaveLibrary,
    },
    currentSong,
    nextSongs,
    songLibrary,
    history,
    liveReaction,
    fairRotationEnabled,
    autoSaveLibrary,
    addSong,
    removeSong,
    moveToTop,
    moveSongUp,
    moveSongDown,
    skipSong,
    nextSong,
    replayCurrentSong,
    clearQueue,
    clearHistory,
    togglePlayPause,
    setVolume,
    toggleMute,
    setRunningText,
    triggerSoundEffect,
    sendLiveReaction,
    toggleFairRotation,
    rebalanceQueueFairly,
    deleteFromLibrary,
    clearLibrary,
    toggleAutoSaveLibrary,
    saveSongToLibrary,
  };
}
