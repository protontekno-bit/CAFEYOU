import React from 'react';
import { CloudIcon } from '../icons/Icons';
import { getYouTubeThumbnail, DEFAULT_SONG_THUMBNAIL } from '../../utils/youtube';

interface AddSongUrlTabProps {
  linkInput: string;
  onLinkInputChange: (val: string) => void;
  detectedVideoId: string | null;
  customTitleInput: string;
  onCustomTitleChange: (val: string) => void;
  isFetchingInfo: boolean;
  isSubmitting: boolean;
  onSubmitUrl: (e: React.FormEvent) => void;
}

export const AddSongUrlTab: React.FC<AddSongUrlTabProps> = ({
  linkInput,
  onLinkInputChange,
  detectedVideoId,
  customTitleInput,
  onCustomTitleChange,
  isFetchingInfo,
  isSubmitting,
  onSubmitUrl,
}) => {
  return (
    <form onSubmit={onSubmitUrl} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Tautan YouTube
        </label>
        <input
          type="text"
          placeholder="https://youtube.com/watch?v=... atau https://youtu.be/..."
          value={linkInput}
          onChange={(e) => onLinkInputChange(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
        />
      </div>

      {/* Pratinjau Otomatis & Judul Lagu */}
      {detectedVideoId && (
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-3">
            <img
              src={getYouTubeThumbnail(detectedVideoId, 'hqdefault')}
              alt="Thumbnail"
              className="w-16 h-10 object-cover rounded-lg bg-slate-800 border border-slate-700 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_SONG_THUMBNAIL;
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-bold text-emerald-400">
                {isFetchingInfo ? 'Mengambil Judul Asli...' : 'Video Ditemukan ✓'}
              </div>
              <input
                type="text"
                value={customTitleInput}
                onChange={(e) => onCustomTitleChange(e.target.value)}
                placeholder="Nama Lagu / Artis (Bisa diedit)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 mt-1 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50 text-xs cursor-pointer"
      >
        <CloudIcon className="w-4 h-4" />
        <span>{isSubmitting ? 'Memproses...' : 'Tambahkan ke Antrean'}</span>
      </button>
    </form>
  );
};
