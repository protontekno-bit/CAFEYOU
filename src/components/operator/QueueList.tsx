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
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
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
  const totalCount = (currentSong ? 1 : 0) + safeQueue.length;

  const handleConfirmClearQueue = () => {
    if (!onClearQueue) return;
    if (window.confirm(`Kosongkan seluruh ${safeQueue.length} antrean lagu tunggu?`)) {
      onClearQueue();
    }
  };

  const guestCount = useMemo(() => {
    const fromWaitlist = safeQueue.filter((s) => s.source === 'guest' || s.tableNumber).length;
    const fromActive = currentSong && (currentSong.source === 'guest' || currentSong.tableNumber) ? 1 : 0;
    return fromWaitlist + fromActive;
  }, [safeQueue, currentSong]);

  // Prekalkulasi urutan giliran meja sekali jalan O(N) untuk seluruh antrean
  const roundsMap = useMemo(() => {
    return calculateAllTableRounds(safeQueue);
  }, [safeQueue]);

  const filteredQueue = useMemo(() => {
    if (filterSource === 'guest') {
      return safeQueue.filter((s) => s.source === 'guest' || s.tableNumber);
    }
    if (filterSource === 'operator') {
      return safeQueue.filter((s) => s.source !== 'guest' && !s.tableNumber);
    }
    return safeQueue;
  }, [safeQueue, filterSource]);

  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60 flex-1 flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Daftar Antrean Lagu
          </h2>
          <span
            className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono"
            title={hasCurrentSong ? `1 Sedang Diputar + ${safeQueue.length} Antrean Tunggu` : `${safeQueue.length} Lagu dalam antrean`}
          >
            {totalCount} Lagu
          </span>
          {guestCount > 0 && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
              {guestCount} dari Meja Tamu
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

      {/* Filter Tabs & Fair Rotation Banner */}
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
            <span>📱 Meja Tamu ({guestCount})</span>
          </button>
          <button
            onClick={() => setFilterSource('operator')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterSource === 'operator'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kasir/Operator ({safeQueue.length - guestCount})
          </button>
        </div>
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

      {/* Kartu Status Lagu Aktif (Sedang Diputar) */}
      {currentSong && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-950/60 via-slate-900 to-emerald-950/40 rounded-xl border border-blue-500/30 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>SEDANG DIPUTAR SEKARANG</span>
                {currentSong.tableNumber && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded text-[9px] font-bold">
                    {currentSong.tableNumber}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white truncate" title={currentSong.title}>
                {currentSong.title}
              </p>
              <div className="text-[11px] text-slate-400 truncate">
                Oleh: <strong className="text-slate-200">{currentSong.requester}</strong>
                {currentSong.source === 'guest' && <span className="ml-1.5 text-emerald-400 font-semibold">• Meja Tamu</span>}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full shrink-0">
            ON AIR #1
          </span>
        </div>
      )}

      {/* Song Queue List */}
      {filteredQueue.length > 0 ? (
        <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
          {filteredQueue.map((song, idx) => {
            const round = roundsMap.get(song.id) || { roundNumber: 1, totalInQueue: 1 };
            const isGuest = song.source === 'guest' || song.tableNumber;
            return (
              <div
                key={song.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
                  isGuest
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
                    className="p-1.5 text-amber-400/70 hover:text-amber-300 hover:bg-amber-400/10 rounded-lg transition-colors"
                    title="Jadikan Prioritas VIP (Putar Berikutnya)"
                  >
                    <StarIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMoveUp(song.id)}
                    disabled={idx === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                    title="Geser Naik"
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMoveDown(song.id)}
                    disabled={idx === filteredQueue.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                    title="Geser Turun"
                  >
                    <ArrowDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveSong(song.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
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
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60 p-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${
            hasCurrentSong
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 text-slate-300'
          }`}>
            {hasCurrentSong ? '🎤' : '🎵'}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">
              {hasCurrentSong
                ? 'Lagu #1 Sedang Diputar (ON AIR) di Atas'
                : 'Daftar Antrean Lagu Sedang Kosong'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              {hasCurrentSong ? (
                <>
                  Belum ada antrean lagu berikutnya di ruang tunggu. Lagu berikutnya yang dipesan oleh{' '}
                  <strong className="text-emerald-400">tamu</strong> atau{' '}
                  <strong className="text-blue-400">operator</strong> akan muncul di sini.
                </>
              ) : (
                'Pilih lagu dari katalog populer atau masukkan tautan video YouTube untuk mulai bernyanyi.'
              )}
            </p>
          </div>
          {onOpenPopularModal && (
            <button
              onClick={onOpenPopularModal}
              className="mt-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              + Buka Katalog Populer Kafe
            </button>
          )}
        </div>
      )}
    </div>
  );
};

