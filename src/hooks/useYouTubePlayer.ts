import { useState, useEffect, useRef, RefObject } from 'react';
import { loadYouTubeIframeAPI } from '../utils/youtube';
import { KaraokeState } from '../types';
import { playSoundEffect } from '../utils/soundfx';

interface UseYouTubePlayerOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  appState: KaraokeState;
  onSongEnd: () => void;
  onErrorFallback: () => void;
}

export function useYouTubePlayer({
  containerRef,
  appState,
  onSongEnd,
  onErrorFallback,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const lastSoundTimestampRef = useRef<number>(0);

  // appStateRef to access latest state inside callbacks
  const appStateRef = useRef(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  // Handle sound effect playback on projector screen
  useEffect(() => {
    if (
      appState?.soundEffect &&
      appState.soundEffect.timestamp > lastSoundTimestampRef.current
    ) {
      lastSoundTimestampRef.current = appState.soundEffect.timestamp;
      playSoundEffect(appState.soundEffect.type);
    }
  }, [appState?.soundEffect]);

  // Load YouTube IFrame API
  useEffect(() => {
    loadYouTubeIframeAPI(() => setIsApiReady(true));
  }, []);

  // Initialize Player once API is ready and container exists
  useEffect(() => {
    if (!isApiReady || !containerRef.current) return;

    if (containerRef.current.innerHTML === '') {
      const el = document.createElement('div');
      containerRef.current.appendChild(el);

      playerRef.current = new window.YT.Player(el, {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event: any) => {
            const currentVolume = appStateRef.current?.isMuted
              ? 0
              : appStateRef.current?.volume ?? 100;
            event.target.setVolume(currentVolume);

            const queue = Array.isArray(appStateRef.current?.queue)
              ? appStateRef.current.queue
              : [];
            const currentSong = queue[0];
            if (currentSong) {
              event.target.loadVideoById(currentSong.videoId);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onSongEnd();
            }
          },
          onError: (event: any) => {
            // Auto skip if video is restricted/copyright blocked (Error 150/101/2)
            if (event.data === 150 || event.data === 101 || event.data === 2) {
              console.warn('YouTube error encountered, skipping track:', event.data);
              onErrorFallback();
            }
          },
        },
      });
    }
  }, [isApiReady, containerRef, onSongEnd, onErrorFallback]);

  // Real-time synchronization to player
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') return;

    const player = playerRef.current;
    const queue = Array.isArray(appState?.queue) ? appState.queue : [];
    const currentSong = queue[0];

    try {
      if (typeof player.setVolume === 'function') {
        player.setVolume(appState?.isMuted ? 0 : (appState?.volume ?? 100));
      }

      const state = player.getPlayerState();
      if (appState?.playbackStatus === 'PAUSED' && state === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
      } else if (appState?.playbackStatus === 'PLAYING' && state === window.YT.PlayerState.PAUSED) {
        player.playVideo();
      }

      // Track switching sync
      if (currentSong) {
        const videoData = player.getVideoData ? player.getVideoData() : null;
        const playingId = videoData ? videoData.video_id : null;

        if (playingId !== currentSong.videoId) {
          player.loadVideoById(currentSong.videoId);
        }
      } else {
        if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.PAUSED) {
          player.stopVideo();
        }
      }
    } catch (error) {
      console.warn('Syncing player state...', error);
    }
  }, [
    appState?.queue,
    appState?.playbackStatus,
    appState?.volume,
    appState?.isMuted,
    appState?.forceSkip,
  ]);

  return {
    player: playerRef.current,
    isApiReady,
  };
}
