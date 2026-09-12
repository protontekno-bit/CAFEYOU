import React from 'react';
import { Song } from '../../types';
import { getYouTubeThumbnail } from '../../utils/youtube';

interface NowPlayingCardProps {
  currentSong: Song | null;
  isSavedInLibrary?: boolean;
  onSaveToLibrary?: (song: Song) => void;
}

export const NowPlayingCard: React.FC<NowPlayingCardProps> = ({
  currentSong,
  isSavedInLibrary = false,
  onSaveToLibrary,
}) => {
  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>🎧</span> Sedang Diputar
        </h2>
        {currentSong && (
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
            Lagu Ke-1
          </span>
        )}
      </div>

      {currentSong ? (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 rounded-xl border border-blue-500/40 relative overflow-hidden shadow-inner">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 via-indigo-400 to-emerald-400 animate-pulse" />

          {/* Thumbnail */}
          <div className="relative shrink-0 self-center sm:self-start">
            <img
              src={currentSong.thumbnail || getYouTubeThumbnail(currentSong.videoId, 'hqdefault')}
              alt="Thumbnail"
              className="w-36 sm:w-32 h-20 sm:h-20 object-cover rounded-lg shadow-md border border-slate-700 bg-slate-800"
              loading="lazy"
            />
            <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded font-mono">
              ON AIR
            </div>
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3
              className="text-base font-bold text-white leading-snug truncate"
              title={currentSong.title}
            >
              {currentSong.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <span>👤</span>
                <span>Pemesan: {currentSong.requester}</span>
              </span>

              {onSaveToLibrary && (
                !isSavedInLibrary ? (
                  <button
                    type="button"
                    onClick={() => onSaveToLibrary(currentSong)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-sm"
                    title="Simpan lagu ini secara permanen ke Database Koleksi Kafe"
                  >
                    <span>⭐ Simpan ke Koleksi</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
                    <span>✓ Di Koleksi</span>
                  </span>
                )
              )}

              <a
                href={currentSong.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-blue-400 transition-colors underline"
              >
                Lihat di YouTube ↗
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-700/50 border-dashed">
          <div className="text-3xl mb-2">🎶</div>
          <div className="text-sm font-medium text-slate-300">Belum Ada Lagu yang Dimainkan</div>
          <p className="text-xs text-slate-500 mt-1">
            Pilih lagu dari Katalog Populer atau masukkan link YouTube di sebelah kiri.
          </p>
        </div>
      )}
    </div>
  );
};
