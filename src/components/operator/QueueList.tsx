import React from 'react';
import { Song } from '../../types';
import {
  TrashIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../icons/Icons';
import { getYouTubeThumbnail } from '../../utils/youtube';

interface QueueListProps {
  queue?: Song[];
  onRemoveSong: (id: string) => void;
  onMoveToTop: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onOpenPopularModal?: () => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  queue = [],
  onRemoveSong,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onOpenPopularModal,
}) => {
  const safeQueue = Array.isArray(queue) ? queue : [];

  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60 flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Daftar Antrean Tunggu
          </h2>
          <span className="text-xs font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
            {safeQueue.length} Lagu
          </span>
        </div>
        {safeQueue.length > 0 && (
          <span className="text-[11px] text-slate-400">
            Gunakan tombol <span className="text-amber-400 font-bold">★</span> untuk Prioritas VIP
          </span>
        )}
      </div>

      {safeQueue.length > 0 ? (
        <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
          {safeQueue.map((song, idx) => (
            <div
              key={song.id}
              className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700/70 hover:border-slate-600 transition-all group"
            >
              {/* Nomor Urut */}
              <div className="w-6 text-center font-bold text-xs text-slate-400">
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
                <p className="text-xs text-emerald-400 truncate mt-0.5 flex items-center gap-1">
                  <span>👤</span>
                  <span>{song.requester}</span>
                </p>
              </div>

              {/* Tombol Reorder & Aksi */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Prioritas VIP (Paling Atas) */}
                <button
                  onClick={() => onMoveToTop(song.id)}
                  className="p-1.5 text-amber-400/70 hover:text-amber-300 hover:bg-amber-400/10 rounded-lg transition-colors"
                  title="Prioritas VIP (Pindahkan ke urutan pertama)"
                >
                  <StarIcon className="w-4 h-4" />
                </button>

                {/* Geser Naik */}
                <button
                  onClick={() => onMoveUp(song.id)}
                  disabled={idx === 0}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent rounded-lg transition-colors"
                  title="Geser Naik"
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </button>

                {/* Geser Turun */}
                <button
                  onClick={() => onMoveDown(song.id)}
                  disabled={idx === safeQueue.length - 1}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent rounded-lg transition-colors"
                  title="Geser Turun"
                >
                  <ArrowDownIcon className="w-4 h-4" />
                </button>

                {/* Hapus */}
                <button
                  onClick={() => onRemoveSong(song.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                  title="Hapus dari antrean"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-700/40 border-dashed flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">📋</span>
          <p className="text-sm font-medium text-slate-400">Antrean lagu sedang kosong</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Pelanggan bisa memesan lagu atau kasir dapat memilih dari katalog populer.
          </p>
          {onOpenPopularModal && (
            <button
              onClick={onOpenPopularModal}
              className="mt-3 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition-all border border-blue-500/30"
            >
              + Buka Katalog Populer
            </button>
          )}
        </div>
      )}
    </div>
  );
};
