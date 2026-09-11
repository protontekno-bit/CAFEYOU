import { KaraokeState, SavedLibrarySong } from '../types';
import { POPULAR_KARAOKE_SONGS, getYouTubeThumbnail } from '../utils/youtube';

export const STORAGE_KEY = 'karaoke_state_v2';
export const BROADCAST_CHANNEL_NAME = 'karaoke_sync_channel';

// Inisialisasi library awal dari katalog lagu populer
const INITIAL_SONG_LIBRARY: Record<string, SavedLibrarySong> = {};
POPULAR_KARAOKE_SONGS.forEach((song) => {
  INITIAL_SONG_LIBRARY[song.videoId] = {
    videoId: song.videoId,
    title: `${song.title} - ${song.artist}`,
    artist: song.artist,
    thumbnail: getYouTubeThumbnail(song.videoId, 'hqdefault'),
    url: `https://www.youtube.com/watch?v=${song.videoId}`,
    playCount: 1,
    lastPlayedAt: Date.now(),
  };
});

export const DEFAULT_KARAOKE_STATE: KaraokeState = {
  queue: [],
  playbackStatus: 'PLAYING',
  volume: 100,
  isMuted: false,
  forceSkip: 0,
  runningText: 'Selamat Datang di CAFEYOU Karaoke Lounge • Pesan Lagu Favorit Anda di Kasir!',
  soundEffect: null,
  history: [],
  songLibrary: INITIAL_SONG_LIBRARY,
};

export const QUICK_TABLES = [
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
