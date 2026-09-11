export type PlaybackStatus = 'PLAYING' | 'PAUSED';

export type AppRole = 'landing' | 'operator' | 'player' | 'split';

export interface Song {
  id: string;
  videoId: string;
  requester: string;
  title: string;
  url: string;
  duration?: string;
  thumbnail?: string;
  addedAt?: number;
}

export interface SongHistoryItem {
  id: string;
  videoId: string;
  requester: string;
  title: string;
  url: string;
  playedAt: number;
  thumbnail?: string;
}

export interface SavedLibrarySong {
  videoId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  url: string;
  playCount: number;
  lastPlayedAt: number;
}

export type SoundEffectType = 'applause' | 'airhorn' | 'cheer' | 'drumroll' | 'chime';

export interface SoundEffectEvent {
  type: SoundEffectType;
  timestamp: number;
}

export interface KaraokeState {
  queue: Song[];
  playbackStatus: PlaybackStatus;
  volume: number;
  isMuted?: boolean;
  forceSkip: number;
  runningText?: string;
  soundEffect?: SoundEffectEvent | null;
  history?: SongHistoryItem[];
  songLibrary?: Record<string, SavedLibrarySong>;
}

export interface SyncMessage<T> {
  key: string;
  value: T;
}

export interface PopularPresetSong {
  title: string;
  artist: string;
  videoId: string;
  category: 'Pop Indo' | 'Dangdut' | 'Barat' | 'Nostalgia' | 'Rock';
}

// Global declaration for YouTube Iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
