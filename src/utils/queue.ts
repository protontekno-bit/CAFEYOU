import type { Song } from '../types/index.ts';

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

  // Pisahkan lagu berstatus prioritas VIP agar tetap berada di urutan teratas
  const prioritySongs = pendingSongs.filter((s) => s.isPrioritized);
  const normalSongs = pendingSongs.filter((s) => !s.isPrioritized);

  if (normalSongs.length <= 1) {
    const combined = [...prioritySongs, ...normalSongs];
    return currentPlaying ? [currentPlaying, ...combined] : combined;
  }

  // Kelompokkan lagu reguler berdasarkan identitas meja (atau pemesan jika nomor meja tidak ada)
  const tableBuckets = new Map<string, Song[]>();
  const tableOrder: string[] = [];

  for (const song of normalSongs) {
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

  const finalPending = [...prioritySongs, ...balancedRest];
  return currentPlaying ? [currentPlaying, ...finalPending] : finalPending;
}

/**
 * Menghitung urutan giliran putaran (round) semua lagu dalam antrean secara batch O(N).
 * Menghindari loop kuadratik O(N^2) saat render daftar antrean yang panjang.
 */
export function calculateAllTableRounds(
  queue: Song[]
): Map<string, { roundNumber: number; totalInQueue: number }> {
  const result = new Map<string, { roundNumber: number; totalInQueue: number }>();
  if (!Array.isArray(queue) || queue.length === 0) return result;

  // 1. Hitung total lagu per meja O(N)
  const tableTotals = new Map<string, number>();
  for (const song of queue) {
    const key = song.tableNumber?.trim() || song.requester?.trim() || 'Umum';
    tableTotals.set(key, (tableTotals.get(key) || 0) + 1);
  }

  // 2. Hitung urutan ke-N (roundNumber) per meja O(N)
  const currentCounts = new Map<string, number>();
  for (const song of queue) {
    const key = song.tableNumber?.trim() || song.requester?.trim() || 'Umum';
    const current = (currentCounts.get(key) || 0) + 1;
    currentCounts.set(key, current);
    result.set(song.id, {
      roundNumber: current,
      totalInQueue: tableTotals.get(key) || 1,
    });
  }

  return result;
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
