export type PlaybackStatus = 'PLAYING' | 'PAUSED';

export type AppRole = 'landing' | 'operator' | 'player' | 'split' | 'guest';

export interface Song {
  id: string;
  videoId: string;
  requester: string;
  tableNumber?: string;
  source?: 'guest' | 'operator';
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
  tableNumber?: string;
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

export interface Voucher {
  code: string;
  tableNumber: string;
  quotaTotal: number;
  quotaUsed: number;
  createdAt: number;
  status: 'active' | 'exhausted' | 'expired';
}

export interface DailyPinConfig {
  enabled: boolean;
  code: string;
}

export interface LiveReactionEvent {
  id: string;
  emoji: string;
  tableNumber: string;
  timestamp: number;
}

export type SoundEffectType = 'applause' | 'airhorn' | 'cheer' | 'drumroll' | 'chime';

export interface SoundEffectEvent {
  type: SoundEffectType;
  timestamp: number;
}

export interface CafeSettings {
  name: string;
  tagline?: string;
  welcomeMessage?: string;
  wifiName?: string;
  wifiPassword?: string;
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
  vouchers?: Record<string, Voucher>;
  dailyPin?: DailyPinConfig;
  liveReaction?: LiveReactionEvent | null;
  fairRotationEnabled?: boolean;
  cafeSettings?: CafeSettings;
  tables?: string[];
  autoSaveLibrary?: boolean;
}

export interface SyncMessage<T> {
  key: string;
  value: T;
}

export interface PopularPresetSong {
  title: string;
  artist: string;
  videoId: string;
  category: string;
}


// Global declaration for YouTube Iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
