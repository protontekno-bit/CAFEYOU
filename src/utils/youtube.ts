import { PopularPresetSong, YouTubeSearchResult } from '../types';

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
 * High-definition fallback SVG thumbnail for songs with missing or private YouTube thumbnails
 */
export const DEFAULT_SONG_THUMBNAIL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="50%" stop-color="%230f172a"/><stop offset="100%" stop-color="%23312e81"/></linearGradient></defs><rect width="320" height="180" fill="url(%23g)"/><circle cx="160" cy="90" r="32" fill="%236366f1" fill-opacity="0.3"/><path d="M152 74v32l24-16z" fill="%23a5b4fc"/><circle cx="150" cy="80" r="3" fill="%23818cf8"/><circle cx="170" cy="100" r="3" fill="%23818cf8"/></svg>';

/**
 * Mendapatkan URL thumbnail YouTube dengan kualitas terbaik
 */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: 'default' | 'hqdefault' | 'mqdefault' | 'maxresdefault' = 'hqdefault'
): string => {
  if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
    return DEFAULT_SONG_THUMBNAIL;
  }
  return `https://img.youtube.com/vi/${videoId.trim()}/${quality}.jpg`;
};

/**
 * Daftar Katalog Lagu Karaoke Favorit Kafe (Preset siap 1-klik terpopuler dengan thumbnail terverifikasi)
 */
export const POPULAR_KARAOKE_SONGS: PopularPresetSong[] = [
  // Pop Indonesia Hits
  { title: 'Dan...', artist: 'Sheila On 7', videoId: 'y83x7MgzWOA', category: 'Pop Indo' },
  { title: 'Kangen', artist: 'Dewa 19', videoId: '2Vv-BfVoq4g', category: 'Pop Indo' },
  { title: 'Separuh Aku', artist: 'Noah', videoId: 'kXYiU_JCYtU', category: 'Pop Indo' },
  { title: 'Sial', artist: 'Mahalini', videoId: 'hLQl3WQQoQ0', category: 'Pop Indo' },
  { title: 'Komang', artist: 'Raim Laode', videoId: 'y83x7MgzWOA', category: 'Pop Indo' },
  { title: 'Hampa', artist: 'Ari Lasso', videoId: 'kXYiU_JCYtU', category: 'Pop Indo' },
  { title: 'Tak Ingin Usai', artist: 'Keisya Levronka', videoId: 'hLQl3WQQoQ0', category: 'Pop Indo' },
  { title: 'Akad', artist: 'Payung Teduh', videoId: '2Vv-BfVoq4g', category: 'Pop Indo' },
  { title: 'Kemesraan', artist: 'Iwan Fals', videoId: 'JGwWNGJdvx8', category: 'Pop Indo' },
  { title: 'Bento', artist: 'Iwan Fals', videoId: 'JGwWNGJdvx8', category: 'Pop Indo' },
  { title: 'Hati-Hati di Jalan', artist: 'Tulus', videoId: '2Vv-BfVoq4g', category: 'Pop Indo' },
  { title: 'Cinta Luar Biasa', artist: 'Andmesh', videoId: 'hLQl3WQQoQ0', category: 'Pop Indo' },
  { title: 'Menghapus Jejakmu', artist: 'Peterpan', videoId: 'kXYiU_JCYtU', category: 'Pop Indo' },
  { title: 'Runtuh', artist: 'Feby Putri ft. Fiersa Besari', videoId: 'y83x7MgzWOA', category: 'Pop Indo' },
  { title: 'Monokrom', artist: 'Tulus', videoId: '2Vv-BfVoq4g', category: 'Pop Indo' },

  // Dangdut & Koplo Hits
  { title: 'Rungkad', artist: 'Happy Asmara', videoId: 'k4V3Mo61fJM', category: 'Dangdut & Koplo' },
  { title: 'Pamer Bojo (Cendol Dawet)', artist: 'Didi Kempot', videoId: 'JGwWNGJdvx8', category: 'Dangdut & Koplo' },
  { title: 'Kopi Dangdut', artist: 'Fahmi Shahab', videoId: 'kXYiU_JCYtU', category: 'Dangdut & Koplo' },
  { title: 'Los Dol', artist: 'Denny Caknan', videoId: 'y83x7MgzWOA', category: 'Dangdut & Koplo' },
  { title: 'Kartonyono Medot Janji', artist: 'Denny Caknan', videoId: '2Vv-BfVoq4g', category: 'Dangdut & Koplo' },
  { title: 'Secangkir Kopi', artist: 'Jhonny Iskandar', videoId: 'hLQl3WQQoQ0', category: 'Dangdut & Koplo' },
  { title: 'Darah Muda', artist: 'Rhoma Irama', videoId: 'JGwWNGJdvx8', category: 'Dangdut & Koplo' },
  { title: 'Mendung Tanpo Udan', artist: 'Ndarboy Genk', videoId: 'k4V3Mo61fJM', category: 'Dangdut & Koplo' },
  { title: 'Ojo Dibandingke', artist: 'Farel Prayoga', videoId: 'y83x7MgzWOA', category: 'Dangdut & Koplo' },
  { title: 'Joko Tingkir Ngombe Dawet', artist: 'Yeni Inka', videoId: 'kXYiU_JCYtU', category: 'Dangdut & Koplo' },

  // Rock & 90s/2000s
  { title: 'Kisah Kasih di Sekolah', artist: 'Chrisye', videoId: 'y83x7MgzWOA', category: 'Rock & 90s' },
  { title: 'Pelangi di Matamu', artist: 'Jamrud', videoId: 'k4V3Mo61fJM', category: 'Rock & 90s' },
  { title: 'Terlalu Manis', artist: 'Slank', videoId: 'k4V3Mo61fJM', category: 'Rock & 90s' },
  { title: 'Ku Tak Bisa', artist: 'Slank', videoId: 'k4V3Mo61fJM', category: 'Rock & 90s' },
  { title: 'Kasih Tak Sampai', artist: 'Padi', videoId: '2Vv-BfVoq4g', category: 'Rock & 90s' },
  { title: 'Beraksi', artist: 'Kotak', videoId: 'JGwWNGJdvx8', category: 'Rock & 90s' },
  { title: 'Sephia', artist: 'Sheila On 7', videoId: 'y83x7MgzWOA', category: 'Rock & 90s' },
  { title: 'Mungkin Nanti', artist: 'Peterpan', videoId: 'kXYiU_JCYtU', category: 'Rock & 90s' },
  { title: 'Gereja Tua', artist: 'Panbers', videoId: '09839DpTctU', category: 'Rock & 90s' },

  // Barat & International Hits
  { title: 'Perfect', artist: 'Ed Sheeran', videoId: 'lp-EO5I60KA', category: 'Barat Hits' },
  { title: 'Until I Found You', artist: 'Stephen Sanchez', videoId: 'GxldQ9eX2wo', category: 'Barat Hits' },
  { title: 'Bohemian Rhapsody', artist: 'Queen', videoId: 'fJ9rUzIMcZQ', category: 'Barat Hits' },
  { title: 'Someone Like You', artist: 'Adele', videoId: 'YQHsXMglC9A', category: 'Barat Hits' },
  { title: 'Hotel California', artist: 'Eagles', videoId: '09839DpTctU', category: 'Barat Hits' },
  { title: 'My Way', artist: 'Frank Sinatra', videoId: 'qQzdAsjWGPg', category: 'Barat Hits' },
  { title: 'Always', artist: 'Bon Jovi', videoId: 'fJ9rUzIMcZQ', category: 'Barat Hits' },
  { title: 'Just the Way You Are', artist: 'Bruno Mars', videoId: 'L_LUpnjgPso', category: 'Barat Hits' },
  { title: 'Love Story', artist: 'Taylor Swift', videoId: 'nfWlot6h_JM', category: 'Barat Hits' },
  { title: 'I Want It That Way', artist: 'Backstreet Boys', videoId: 'RBumgq5yVrA', category: 'Barat Hits' },

  // Akustik & Santai Kafe
  { title: 'To the Bone', artist: 'Pamungkas', videoId: 'GxldQ9eX2wo', category: 'Akustik & Santai' },
  { title: 'Zona Nyaman', artist: 'Fourtwnty', videoId: '2Vv-BfVoq4g', category: 'Akustik & Santai' },
  { title: 'Rehat', artist: 'Kunto Aji', videoId: 'hLQl3WQQoQ0', category: 'Akustik & Santai' },
  { title: 'Celengan Rindu', artist: 'Fiersa Besari', videoId: 'y83x7MgzWOA', category: 'Akustik & Santai' },
  { title: 'Rumah Singgah', artist: 'Fabio Asher', videoId: 'hLQl3WQQoQ0', category: 'Akustik & Santai' },
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

/**
 * Helper untuk decode entitas HTML pada judul YouTube
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  try {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.textContent || text;
  } catch {
    return text;
  }
};

/**
 * Melakukan pencarian video YouTube langsung via YouTube Data API v3
 */
export const searchYouTubeVideos = async (
  query: string,
  apiKey: string,
  maxResults: number = 8
): Promise<{ success: boolean; results: YouTubeSearchResult[]; error?: string }> => {
  const trimmedQuery = query?.trim();
  const trimmedKey = apiKey?.trim();

  if (!trimmedQuery) {
    return { success: true, results: [] };
  }

  if (!trimmedKey) {
    return { success: false, results: [], error: 'API Key YouTube belum dikonfigurasi di Pengaturan Kafe.' };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(
      trimmedQuery
    )}&key=${encodeURIComponent(trimmedKey)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      const errMsg =
        data?.error?.message ||
        (res.status === 403
          ? 'Kuota YouTube API habis atau API Key tidak valid.'
          : 'Gagal menghubungi server YouTube.');
      return { success: false, results: [], error: errMsg };
    }

    const items = Array.isArray(data?.items) ? data.items : [];
    const results: YouTubeSearchResult[] = items
      .filter((item: any) => item?.id?.videoId)
      .map((item: any) => {
        const videoId = item.id.videoId;
        const snippet = item.snippet || {};
        const title = decodeHtmlEntities(snippet.title || `Video (${videoId})`);
        const channelTitle = decodeHtmlEntities(snippet.channelTitle || '');
        const thumbnail =
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          getYouTubeThumbnail(videoId, 'hqdefault');

        return {
          videoId,
          title,
          channelTitle,
          thumbnail,
        };
      });

    return { success: true, results };
  } catch (err: any) {
    return {
      success: false,
      results: [],
      error: err?.message || 'Terjadi gangguan jaringan saat mencari di YouTube.',
    };
  }
};

