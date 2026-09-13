import React, { useState, useMemo } from 'react';
import { Song } from '../../types';
import {
  TrashIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../icons/Icons';
import { getYouTubeThumbnail, DEFAULT_SONG_THUMBNAIL } from '../../utils/youtube';
import { calculateAllTableRounds } from '../../utils/queue';

interface QueueListProps {
  queue?: Song[];
  fairRotationEnabled?: boolean;
  hasCurrentSong?: boolean;
  currentSongTitle?: string;
  currentSong?: Song | null;
  onRemoveSong: (id: string) => void;
  onMoveToTop: (id: string) => void;
  onMoveUp: (id: string, swapWithId?: string) => void;
  onMoveDown: (id: string, swapWithId?: string) => void;
  onClearQueue?: () => void;
  onOpenPopularModal?: () => void;
  onToggleFairRotation?: () => void;
  onRebalanceFairly?: () => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  queue = [],
  fairRotationEnabled = false,
  hasCurrentSong = false,
  currentSongTitle,
  currentSong,
  onRemoveSong,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onClearQueue,
  onOpenPopularModal,
  onToggleFairRotation,
  onRebalanceFairly,
}) => {
  const safeQueue = Array.isArray(queue) ? queue : [];
  const [filterSource, setFilterSource] = useState<'all' | 'guest' | 'operator'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalCount = (currentSong ? 1 : 0) + safeQueue.length;

  // Hitung jumlah di antrean tunggu (waitlist) secara presisi untuk tab
  const waitlistGuestCount = useMemo(() => {
    return safeQueue.filter((s) => s.source === 'guest' || s.tableNumber).length;
  }, [safeQueue]);

  const waitlistOperatorCount = Math.max(0, safeQueue.length - waitlistGuestCount);

  // Total lagu dari meja tamu (lagu aktif + tunggu) untuk statistik header
  const totalGuestCount =
    waitlistGuestCount +
    (currentSong && (currentSong.source === 'guest' || currentSong.tableNumber) ? 1 : 0);

  // Estimasi durasi antrean: asumsi rata-rata 4 menit per lagu
  const estimatedWaitMinutes = safeQueue.length * 4;

  // Gabungkan currentSong + safeQueue agar giliran meja (rounds) akurat secara global
  const fullQueue = useMemo(() => {
    return currentSong ? [currentSong, ...safeQueue] : safeQueue;
  }, [currentSong, safeQueue]);

  const roundsMap = useMemo(() => {
    return calculateAllTableRounds(fullQueue);
  }, [fullQueue]);

  const filteredQueue = useMemo(() => {
    let list = safeQueue;
    if (filterSource === 'guest') {
      list = list.filter((s) => s.source === 'guest' || s.tableNumber);
    } else if (filterSource === 'operator') {
      list = list.filter((s) => s.source !== 'guest' && !s.tableNumber);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.requester.toLowerCase().includes(q) ||
          (s.tableNumber && s.tableNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }, [safeQueue, filterSource, searchQuery]);

  const handleConfirmClearQueue = () => {
    if (!onClearQueue) return;
    if (window.confirm(`Kosongkan seluruh ${safeQueue.length} antrean lagu tunggu?`)) {
      onClearQueue();
    }
  };

  const handleMoveUp = (songId: string, idxInFiltered: number) => {
    if (idxInFiltered <= 0) return;
    const prevSong = filteredQueue[idxInFiltered - 1];
    onMoveUp(songId, filterSource !== 'all' || searchQuery ? prevSong?.id : undefined);
  };

  const handleMoveDown = (songId: string, idxInFiltered: number) => {
    if (idxInFiltered >= filteredQueue.length - 1) return;
    const nextSong = filteredQueue[idxInFiltered + 1];
    onMoveDown(songId, filterSource !== 'all' || searchQuery ? nextSong?.id : undefined);
  };

  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60 flex-1 flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Daftar Antrean Lagu
          </h2>
          <span
            className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono"
            title={hasCurrentSong ? `1 Sedang Diputar + ${safeQueue.length} Antrean Tunggu` : `${safeQueue.length} Lagu dalam antrean`}
          >
            {totalCount} Lagu
          </span>
          {totalGuestCount > 0 && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
              {totalGuestCount} dari Tamu
            </span>
          )}
          {safeQueue.length > 0 && (
            <span
              className="text-[11px] font-semibold text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono flex items-center gap-1"
              title={`Total estimasi antrean sekitar ~${estimatedWaitMinutes} menit`}
            >
              <span>⏱️</span>
              <span>~{estimatedWaitMinutes} mnt antrean</span>
            </span>
          )}
        </div>

        {/* Smart Fair Rotation & Queue Management Controls */}
        <div className="flex items-center gap-2">
          {onToggleFairRotation && (
            <button
              onClick={onToggleFairRotation}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${
                fairRotationEnabled
                  ? 'bg-purple-500/25 border-purple-500/40 text-purple-300 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Aktifkan/Nonaktifkan Anti-Monopoli Antrean (Rotasi Adil Bergiliran per Meja)"
            >
              <span>⚖️</span>
              <span>Mode Adil: <strong className={fairRotationEnabled ? 'text-emerald-400' : 'text-slate-400'}>{fairRotationEnabled ? 'ON' : 'OFF'}</strong></span>
            </button>
          )}

          {onRebalanceFairly && safeQueue.length > 1 && (
            <button
              onClick={onRebalanceFairly}
              className="px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-600 transition-all flex items-center gap-1 shadow-sm"
              title="Susun ulang antrean agar bergiliran per meja secara otomatis"
            >
              <span>🔄</span>
              <span className="hidden sm:inline">Ratakan Giliran</span>
            </button>
          )}

          {onClearQueue && safeQueue.length > 0 && (
            <button
              onClick={handleConfirmClearQueue}
              className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-red-300 hover:text-red-200 rounded-xl text-xs font-semibold border border-red-500/30 transition-all flex items-center gap-1 shadow-sm"
              title="Hapus seluruh antrean lagu tunggu"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Kosongkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Quick Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            onClick={() => setFilterSource('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterSource === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({safeQueue.length})
          </button>
          <button
            onClick={() => setFilterSource('guest')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
              filterSource === 'guest'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📱 Meja Tamu ({waitlistGuestCount})</span>
          </button>
          <button
            onClick={() => setFilterSource('operator')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterSource === 'operator'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kasir/Operator ({waitlistOperatorCount})
          </button>
        </div>

        {/* Input Pencarian Antrean Cepat */}
        {safeQueue.length > 2 && (
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cari lagu / pemesan / meja..."
              className="w-full bg-slate-900/90 text-xs text-slate-200 placeholder-slate-500 rounded-xl px-2.5 py-1 border border-slate-700/70 focus:outline-none focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Banner when Fair Rotation is ON */}
      {fairRotationEnabled && safeQueue.length > 0 && (
        <div className="mb-2.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/25 rounded-xl flex items-center gap-2 text-[11px] text-purple-300">
          <span>⚖️</span>
          <span>
            <strong>Smart Fair Rotation Aktif:</strong> Setiap meja mendapat giliran bernyanyi berselang-seling secara adil.
          </span>
        </div>
      )}

      {/* Song Queue List */}
      {filteredQueue.length > 0 ? (
        <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
          {filteredQueue.map((song, idx) => {
            const round = roundsMap.get(song.id) || { roundNumber: 1, totalInQueue: 1 };
            const isGuest = song.source === 'guest' || song.tableNumber;
            const estimatedMinutes = (idx + 1) * 4;

            return (
              <div
                key={song.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
                  song.isPrioritized
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70 shadow-sm'
                    : isGuest
                    ? 'bg-slate-900/90 border-emerald-500/30 hover:border-emerald-500/60 shadow-sm'
                    : 'bg-slate-900/80 border-slate-700/70 hover:border-slate-600'
                }`}
              >
                {/* Nomor Urut */}
                <div className="w-6 text-center font-bold text-xs text-slate-400 font-mono">
                  #{idx + 1}
                </div>

                {/* Thumbnail */}
                <img
                  src={song.thumbnail || getYouTubeThumbnail(song.videoId, 'default')}
                  alt="Thumbnail"
                  className="w-14 h-9 object-cover rounded-md bg-slate-800 border border-slate-700/80 shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
                  }}
                />

                {/* Judul & Pemesan */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate" title={song.title}>
                    {song.title}
                  </p>
                  <div className="text-xs text-emerald-400 truncate mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 font-medium">
                      <span>{isGuest ? '📱' : '👤'}</span>
                      <span>{song.requester}</span>
                    </span>

                    {song.tableNumber && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded-md font-bold">
                        {song.tableNumber}
                      </span>
                    )}

                    {/* Badge Prioritas VIP */}
                    {song.isPrioritized && (
                      <span className="text-[10px] bg-amber-500/25 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-md font-bold flex items-center gap-0.5">
                        <span>⭐</span>
                        <span>VIP</span>
                      </span>
                    )}

                    {/* Estimasi Menit Tunggu */}
                    <span
                      className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/60 font-mono"
                      title={`Estimasi giliran diputar dalam ~${estimatedMinutes} menit`}
                    >
                      ±{estimatedMinutes}m
                    </span>

                    {/* Badge Giliran Meja jika pemesan memiliki lebih dari 1 lagu */}
                    {round.totalInQueue > 1 && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-md font-mono">
                        Lagu ke-{round.roundNumber} dari {round.totalInQueue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tombol Reorder & Aksi */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onMoveToTop(song.id)}
                    className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                      song.isPrioritized
                        ? 'text-amber-300 bg-amber-500/25 border border-amber-500/40 shadow-sm'
                        : 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-400/10'
                    }`}
                    title={song.isPrioritized ? 'Lagu ini sedang berstatus Prioritas VIP' : 'Jadikan Prioritas VIP (Putar Berikutnya)'}
                  >
                    <StarIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveUp(song.id, idx)}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors active:scale-95"
                    title="Geser Naik"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(song.id, idx)}
                    disabled={idx === filteredQueue.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors active:scale-95"
                    title="Geser Turun"
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveSong(song.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1 active:scale-95"
                    title="Hapus dari Antrean"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-slate-400 space-y-2 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60 p-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-800 text-slate-300 shadow-inner">
            {searchQuery ? '🔍' : '🎵'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">
              {searchQuery ? 'Tidak ada lagu yang cocok dengan pencarian' : 'Daftar Antrean Lagu Sedang Kosong'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
              {searchQuery ? 'Coba gunakan kata kunci judul lagu, nama pemesan, atau meja lain.' : 'Lagu baru yang ditambahkan tamu atau operator akan muncul di sini.'}
            </p>
          </div>
          {searchQuery ? (
            <button onClick={() => setSearchQuery('')} className="mt-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-all active:scale-95">
              Reset Pencarian
            </button>
          ) : onOpenPopularModal ? (
            <button onClick={onOpenPopularModal} className="mt-1 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              + Buka Katalog Populer Kafe
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

