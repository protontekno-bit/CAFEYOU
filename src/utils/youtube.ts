import { PopularPresetSong } from '../types';

/**
 * Mengekstrak YouTube Video ID (11 karakter) dari berbagai format URL YouTube
 */
export const extractYouTubeID = (url: string): string | false => {
  if (!url || typeof url !== 'string') return false;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(shorts\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.trim().match(regExp);
  return match && match[8] && match[8].length === 11 ? match[8] : false;
};

/**
 * Mendapatkan URL thumbnail YouTube dengan kualitas terbaik
 */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: 'default' | 'hqdefault' | 'mqdefault' | 'maxresdefault' = 'hqdefault'
): string => {
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Daftar Katalog Lagu Karaoke Favorit Kafe (Preset siap 1-klik)
 */
export const POPULAR_KARAOKE_SONGS: PopularPresetSong[] = [
  // Pop Indonesia
  { title: 'Kemesraan', artist: 'Iwan Fals', videoId: 't6lO0dYt9_I', category: 'Pop Indo' },
  { title: 'Dan...', artist: 'Sheila On 7', videoId: 'e2B67Vw11eA', category: 'Pop Indo' },
  { title: 'Kangen', artist: 'Dewa 19', videoId: 'FfTzYjD4U_c', category: 'Pop Indo' },
  { title: 'Bento', artist: 'Iwan Fals', videoId: 'uJ9v2vJgWn0', category: 'Pop Indo' },
  { title: 'Komang', artist: 'Raim Laode', videoId: 'qN5eY7f9_18', category: 'Pop Indo' },
  { title: 'Hampa', artist: 'Ari Lasso', videoId: '6Y4zJ5g_17c', category: 'Pop Indo' },
  { title: 'Sial', artist: 'Mahalini', videoId: 'f0l6jU_29eQ', category: 'Pop Indo' },
  { title: 'Tak Ingin Usai', artist: 'Keisya Levronka', videoId: 'hLQl3WQQoQ0', category: 'Pop Indo' },
  { title: 'Akad', artist: 'Payung Teduh', videoId: '2Vv-BfVoq4g', category: 'Pop Indo' },

  // Dangdut
  { title: 'Kopi Dangdut', artist: 'Fahmi Shahab', videoId: 'M7sH7q2kLwA', category: 'Dangdut' },
  { title: 'Pamer Bojo (Cendol Dawet)', artist: 'Didi Kempot', videoId: '6T3F1kQz8oM', category: 'Dangdut' },
  { title: 'Rungkad', artist: 'Happy Asmara', videoId: '9K4f_p7JqZw', category: 'Dangdut' },
  { title: 'Secangkir Kopi', artist: 'Jhonny Iskandar', videoId: 'uG4J_89eK2M', category: 'Dangdut' },
  { title: 'Darah Muda', artist: 'Rhoma Irama', videoId: 'h7J6Kq9Lz2E', category: 'Dangdut' },
  { title: 'Los Dol', artist: 'Denny Caknan', videoId: '6T3F1kQz8oM', category: 'Dangdut' },

  // Barat / International
  { title: 'Perfect', artist: 'Ed Sheeran', videoId: '2Vv-BfVoq4g', category: 'Barat' },
  { title: 'Bohemian Rhapsody', artist: 'Queen', videoId: 'fJ9rUzIMcZQ', category: 'Barat' },
  { title: 'Someone Like You', artist: 'Adele', videoId: 'hLQl3WQQoQ0', category: 'Barat' },
  { title: 'Hotel California', artist: 'Eagles', videoId: '09839DpTctU', category: 'Barat' },
  { title: 'Until I Found You', artist: 'Stephen Sanchez', videoId: 'GxldQ9eX2wo', category: 'Barat' },
  { title: 'My Way', artist: 'Frank Sinatra', videoId: 'qQzdAsjWGPg', category: 'Barat' },
  { title: 'Always', artist: 'Bon Jovi', videoId: '7K2q1V8mNxQ', category: 'Barat' },

  // Nostalgia & Tembang Kenangan
  { title: 'Gereja Tua', artist: 'Panbers', videoId: '3n0F9q8JzWw', category: 'Nostalgia' },
  { title: 'Kisah Kasih di Sekolah', artist: 'Chrisye', videoId: 'hK9m1V8zPq0', category: 'Nostalgia' },
  { title: 'Jangan Pernah Berubah', artist: 'ST12', videoId: '7K2q1V8mNxQ', category: 'Nostalgia' },
  { title: 'Mungkin Nanti', artist: 'Peterpan', videoId: 'r4F9lKz8qRw', category: 'Nostalgia' },
];

/**
 * Mengambil metadata resmi YouTube (Judul Asli & Nama Author) dengan multi-tier fallback
 */
export const fetchYouTubeInfo = async (
  urlOrVideoId: string
): Promise<{ title: string; authorName?: string; thumbnail?: string } | null> => {
  let videoId = extractYouTubeID(urlOrVideoId);
  if (!videoId && urlOrVideoId.length === 11) {
    videoId = urlOrVideoId;
  }
  if (!videoId) return null;

  // 1. Cek dari katalog preset kafe terlebih dahulu (instant)
  const matchedPreset = POPULAR_KARAOKE_SONGS.find((s) => s.videoId === videoId);
  if (matchedPreset) {
    return {
      title: `${matchedPreset.title} - ${matchedPreset.artist}`,
      authorName: matchedPreset.artist,
      thumbnail: getYouTubeThumbnail(videoId, 'hqdefault'),
    };
  }

  // 2. Coba YouTube Official oEmbed
  try {
    const embedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const ytOembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(embedUrl)}&format=json`;
    const response = await fetch(ytOembed);
    if (response.ok) {
      const data = await response.json();
      if (data && data.title) {
        return {
          title: data.title,
          authorName: data.author_name,
          thumbnail: data.thumbnail_url || getYouTubeThumbnail(videoId, 'hqdefault'),
        };
      }
    }
  } catch (err) {
    // Continue to next fallback
  }

  // 3. Coba NoEmbed Fallback
  try {
    const embedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const noembed = `https://noembed.com/embed?url=${encodeURIComponent(embedUrl)}`;
    const response = await fetch(noembed);
    if (response.ok) {
      const data = await response.json();
      if (data && data.title && !data.error) {
        return {
          title: data.title,
          authorName: data.author_name,
          thumbnail: data.thumbnail_url || getYouTubeThumbnail(videoId, 'hqdefault'),
        };
      }
    }
  } catch (err) {}

  // 4. Default Fallback
  return {
    title: `YouTube Video (${videoId})`,
    thumbnail: getYouTubeThumbnail(videoId, 'hqdefault'),
  };
};

/**
 * Memuat skrip YouTube IFrame API secara aman dan idempotent
 */
export const loadYouTubeIframeAPI = (onReady: () => void): void => {
  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }

  const existingScript = document.getElementById('youtube-api-script');
  if (!existingScript) {
    const tag = document.createElement('script');
    tag.id = 'youtube-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }

  const prevCallback = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof prevCallback === 'function') {
      prevCallback();
    }
    onReady();
  };
};
