import React, { useState, useMemo } from 'react';
import { Song } from '../../types';
import {
  TrashIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../icons/Icons';
import { getYouTubeThumbnail } from '../../utils/youtube';
import { calculateTableRound } from '../../utils/queue';

interface QueueListProps {
  queue?: Song[];
  fairRotationEnabled?: boolean;
  onRemoveSong: (id: string) => void;
  onMoveToTop: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onOpenPopularModal?: () => void;
  onToggleFairRotation?: () => void;
  onRebalanceFairly?: () => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  queue = [],
  fairRotationEnabled = false,
  onRemoveSong,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onOpenPopularModal,
  onToggleFairRotation,
  onRebalanceFairly,
}) => {
  const safeQueue = Array.isArray(queue) ? queue : [];
  const [filterSource, setFilterSource] = useState<'all' | 'guest' | 'operator'>('all');

  const guestCount = useMemo(() => {
    return safeQueue.filter((s) => s.source === 'guest' || s.tableNumber).length;
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
            Daftar Antrean Tunggu
          </h2>
          <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30 font-mono">
            {safeQueue.length} Lagu
          </span>
          {guestCount > 0 && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono animate-pulse">
              {guestCount} dari Meja Tamu
            </span>
          )}
        </div>

        {/* Smart Fair Rotation Controls */}
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

      {/* Song Queue List */}
      {filteredQueue.length > 0 ? (
        <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
          {filteredQueue.map((song, idx) => {
            const round = calculateTableRound(song.id, safeQueue);
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
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-3 bg-slate-900/40 rounded-xl border border-dashed border-slate-700/60">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl shadow-inner">
            🎵
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Antrean lagu sedang kosong</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih lagu dari katalog populer atau masukkan link video YouTube.
            </p>
          </div>
          {onOpenPopularModal && (
            <button
              onClick={onOpenPopularModal}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              + Buka Katalog Populer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

