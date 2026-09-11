import { Song } from '../types';

/**
 * Menyusun antrean secara adil (Smart Round-Robin berdasarkan nomor meja / pemesan)
 * Lagu index 0 (sedang diputar) selalu dipertahankan di posisi paling atas.
 */
export function rebalanceFairQueue(queue: Song[]): Song[] {
  if (!Array.isArray(queue) || queue.length <= 2) {
    return Array.isArray(queue) ? queue : [];
  }

  const currentPlaying = queue[0];
  const pendingSongs = queue.slice(1);

  // Kelompokkan lagu berdasarkan identitas meja (atau pemesan jika nomor meja tidak ada)
  const tableBuckets = new Map<string, Song[]>();
  const tableOrder: string[] = [];

  for (const song of pendingSongs) {
    const tableKey = song.tableNumber?.trim() || song.requester?.trim() || 'Umum';
    if (!tableBuckets.has(tableKey)) {
      tableBuckets.set(tableKey, []);
      tableOrder.push(tableKey);
    }
    tableBuckets.get(tableKey)!.push(song);
  }

  // Interleave round-robin per giliran
  const balancedRest: Song[] = [];
  let hasMore = true;
  let round = 0;

  while (hasMore) {
    hasMore = false;
    for (const tableKey of tableOrder) {
      const bucket = tableBuckets.get(tableKey)!;
      if (round < bucket.length) {
        balancedRest.push(bucket[round]);
        if (round + 1 < bucket.length) {
          hasMore = true;
        }
      }
    }
    round++;
  }

  return currentPlaying ? [currentPlaying, ...balancedRest] : balancedRest;
}

/**
 * Menghitung urutan giliran putaran (round) suatu lagu dalam antrean
 * Berguna untuk menampilkan badge: "Giliran #1", "Giliran #2"
 */
export function calculateTableRound(
  songId: string,
  queue: Song[]
): { roundNumber: number; totalInQueue: number } {
  if (!Array.isArray(queue)) return { roundNumber: 1, totalInQueue: 1 };

  const targetSong = queue.find((s) => s.id === songId);
  if (!targetSong) return { roundNumber: 1, totalInQueue: 1 };

  const tableKey = targetSong.tableNumber?.trim() || targetSong.requester?.trim() || 'Umum';
  let roundNumber = 0;
  let totalInQueue = 0;

  for (const song of queue) {
    const key = song.tableNumber?.trim() || song.requester?.trim() || 'Umum';
    if (key === tableKey) {
      totalInQueue++;
      if (song.id === songId) {
        roundNumber = totalInQueue;
      }
    }
  }

  return {
    roundNumber: roundNumber || 1,
    totalInQueue: totalInQueue || 1,
  };
}
