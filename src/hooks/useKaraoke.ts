import { useSyncState } from './useSyncState';
import { STORAGE_KEY, DEFAULT_KARAOKE_STATE } from '../constants/karaoke';
import { Song, KaraokeState, SoundEffectType, SongHistoryItem, SavedLibrarySong } from '../types';
import { fetchYouTubeInfo, getYouTubeThumbnail } from '../utils/youtube';
import { playSoundEffect } from '../utils/soundfx';

export function useKaraoke() {
  const [appState, updateAppState, isCloudConnected] = useSyncState<KaraokeState>(
    STORAGE_KEY,
    DEFAULT_KARAOKE_STATE
  );

  const addSong = async (
    videoId: string,
    rawUrl: string,
    requester?: string,
    customTitle?: string
  ) => {
    const songId = Date.now().toString();
    const finalTitle = customTitle || 'Memuat data lagu...';

    const newSong: Song = {
      id: songId,
      videoId,
      requester: requester?.trim() || 'Hamba Allah',
      title: finalTitle,
      url: rawUrl,
      thumbnail: getYouTubeThumbnail(videoId, 'hqdefault'),
      addedAt: Date.now(),
    };

    // Tambahkan ke antrean dan simpan ke songLibrary
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

      return {
        ...prev,
        queue: [...currentQueue, newSong],
        songLibrary: updatedLibrary,
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
  const recordFinishedSong = (song: Song | undefined, state: KaraokeState): { history: SongHistoryItem[]; songLibrary: Record<string, SavedLibrarySong> } => {
    const existingHistory = Array.isArray(state?.history) ? state.history : [];
    const currentLibrary = state?.songLibrary && typeof state.songLibrary === 'object' ? state.songLibrary : {};

    if (!song) return { history: existingHistory, songLibrary: currentLibrary };

    const historyItem: SongHistoryItem = {
      id: `${song.id}-${Date.now()}`,
      videoId: song.videoId,
      requester: song.requester,
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

  const safeQueue = Array.isArray(appState?.queue) ? appState.queue : [];
  const currentSong = safeQueue[0] || null;
  const nextSongs = safeQueue.slice(1);
  const songLibrary = appState?.songLibrary && typeof appState.songLibrary === 'object' ? appState.songLibrary : {};
  const history = Array.isArray(appState?.history) ? appState.history : [];

  return {
    state: {
      ...appState,
      queue: safeQueue,
      history,
      songLibrary,
    },
    updateState: updateAppState,
    isCloudConnected,
    currentSong,
    nextSongs,
    songLibrary,
    history,
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
  };
}
