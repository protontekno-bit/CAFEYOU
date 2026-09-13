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
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const lastSoundTimestampRef = useRef<number>(0);
  const lastPlayedSongIdRef = useRef<string | null>(null);
  const lastReplayTimestampRef = useRef<number>(appState?.forceReplay || 0);

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
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            if (appStateRef.current?.isMuted) {
              if (typeof event.target.mute === 'function') event.target.mute();
              event.target.setVolume(0);
            } else {
              if (typeof event.target.unMute === 'function') event.target.unMute();
              const currentVolume = appStateRef.current?.volume ?? 100;
              event.target.setVolume(currentVolume);
            }

            const queue = Array.isArray(appStateRef.current?.queue)
              ? appStateRef.current.queue
              : [];
            const currentSong = queue[0];
            if (currentSong) {
              lastPlayedSongIdRef.current = currentSong.id;
              event.target.loadVideoById({
                videoId: currentSong.videoId,
                suggestedQuality: 'hd720',
              });
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              onSongEnd();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              if (typeof event.target.setPlaybackQuality === 'function') {
                event.target.setPlaybackQuality('hd720');
              }
            }
          },
          onError: (event: any) => {
            // Auto skip if video is restricted/copyright blocked (Error 150/101/2)
            if (event.data === 150 || event.data === 101 || event.data === 2) {
              console.warn('YouTube error encountered, skipping track:', event.data);
              setErrorNotice('Video dibatasi oleh lisensi YouTube. Memutar lagu berikutnya...');
              setTimeout(() => {
                setErrorNotice(null);
                onErrorFallback();
              }, 2500);
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
      // 1. Mute / Unmute & Volume sync
      if (appState?.isMuted) {
        if (typeof player.mute === 'function') player.mute();
        if (typeof player.setVolume === 'function') player.setVolume(0);
      } else {
        if (typeof player.unMute === 'function') player.unMute();
        if (typeof player.setVolume === 'function') {
          player.setVolume(appState?.volume ?? 100);
        }
      }

      if (currentSong) {
        // 2. Track switching sync (Uses unique song.id to guarantee reload on duplicate video IDs)
        const isNewSongInstance = lastPlayedSongIdRef.current !== currentSong.id;
        const videoData = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
        const playingId = videoData ? videoData.video_id : null;

        if (isNewSongInstance || (playingId && playingId !== currentSong.videoId)) {
          lastPlayedSongIdRef.current = currentSong.id;
          setErrorNotice(null);
          player.loadVideoById({
            videoId: currentSong.videoId,
            suggestedQuality: 'hd720',
          });
        }

        // 3. Play / Pause flexibility
        const state = typeof player.getPlayerState === 'function' ? player.getPlayerState() : null;
        if (appState?.playbackStatus === 'PAUSED') {
          if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) {
            player.pauseVideo();
          }
        } else if (appState?.playbackStatus === 'PLAYING') {
          if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
            player.playVideo();
          }
        }

        // 4. Force Replay signal from Operator
        if (
          appState?.forceReplay &&
          appState.forceReplay > lastReplayTimestampRef.current
        ) {
          lastReplayTimestampRef.current = appState.forceReplay;
          if (typeof player.seekTo === 'function') {
            player.seekTo(0, true);
          }
          if (typeof player.playVideo === 'function') {
            player.playVideo();
          }
        }
      } else {
        lastPlayedSongIdRef.current = null;
        try {
          if (typeof player.stopVideo === 'function') {
            player.stopVideo();
          }
        } catch {}
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
    appState?.forceReplay,
  ]);

  return {
    player: playerRef.current,
    isApiReady,
    errorNotice,
  };
}
