import { KaraokeState, SavedLibrarySong, CafeSettings } from '../types';
import { POPULAR_KARAOKE_SONGS, getYouTubeThumbnail } from '../utils/youtube';
import { DEFAULT_MENU_ITEMS } from './menu';

export const STORAGE_KEY = 'karaoke_state_v2';
export const BROADCAST_CHANNEL_NAME = 'karaoke_sync_channel';

export const DEFAULT_CAFE_SETTINGS: CafeSettings = {
  name: 'CAFEYOU',
  tagline: 'Coffee & Eatery',
  welcomeMessage: 'Selamat Datang di CAFEYOU Karaoke Lounge • Pesan Lagu Favorit Anda di Kasir!',
  wifiName: 'CAFEYOU_Free_WiFi',
  wifiPassword: 'karaokecafeyou',
  youtubeApiKey: '',
  enableTax: false,
  taxPercentage: 0,
  isTaxIncluded: false,
  servicePercentage: 0,
  posPassword: '1234',
  operatorPassword: '1234',
  localServerIp: '',
};

// Inisialisasi library awal dari katalog lagu populer
const INITIAL_SONG_LIBRARY: Record<string, SavedLibrarySong> = {};
POPULAR_KARAOKE_SONGS.forEach((song) => {
  INITIAL_SONG_LIBRARY[song.videoId] = {
    videoId: song.videoId,
    title: `${song.title} - ${song.artist}`,
    artist: song.artist,
    thumbnail: getYouTubeThumbnail(song.videoId, 'hqdefault'),
    url: `https://www.youtube.com/watch?v=${song.videoId}`,
    playCount: 0,
    lastPlayedAt: 0,
  };
});

export const DEFAULT_KARAOKE_STATE: KaraokeState = {
  queue: [],
  playbackStatus: 'PLAYING',
  volume: 100,
  isMuted: false,
  forceSkip: 0,
  forceReplay: 0,
  runningText: 'Selamat Datang di CAFEYOU Karaoke Lounge • Pesan Lagu Favorit Anda di Kasir!',
  soundEffect: null,
  history: [],
  songLibrary: INITIAL_SONG_LIBRARY,
  vouchers: {},
  dailyPin: {
    enabled: false,
    code: '1234',
  },
  liveReaction: null,
  fairRotationEnabled: false,
  cafeSettings: DEFAULT_CAFE_SETTINGS,
  tables: [
    'Meja 1',
    'Meja 2',
    'Meja 3',
    'Meja 4',
    'Meja 5',
    'Meja 6',
    'VIP 1',
    'VIP 2',
    'Bar Area',
  ],
  autoSaveLibrary: true,
  menuItems: DEFAULT_MENU_ITEMS,
  tableOrders: {},
};

export const DEFAULT_TABLES = [
  'Meja 1',
  'Meja 2',
  'Meja 3',
  'Meja 4',
  'Meja 5',
  'Meja 6',
  'VIP 1',
  'VIP 2',
  'Bar Area',
];

export const QUICK_TABLES = DEFAULT_TABLES;
