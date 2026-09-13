import React, { useState } from 'react';
import { POPULAR_KARAOKE_SONGS } from '../../utils/youtube';
import { PopularPresetSong } from '../../types';

interface PopularSongsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSong: (song: PopularPresetSong) => void;
}

type CategoryType = 'Semua' | 'Pop Indo' | 'Dangdut' | 'Barat' | 'Nostalgia';

export const PopularSongsModal: React.FC<PopularSongsModalProps> = ({
  isOpen,
  onClose,
  onSelectSong,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const categories: CategoryType[] = ['Semua', 'Pop Indo', 'Dangdut', 'Barat', 'Nostalgia'];

  const filteredSongs = POPULAR_KARAOKE_SONGS.filter((song) => {
    const matchesCategory =
      selectedCategory === 'Semua' || song.category === selectedCategory;
    const matchesSearch =
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <h2 className="text-lg font-bold text-white">Katalog Lagu Karaoke Kafe Populer</h2>
              <p className="text-xs text-slate-400">
                Pilih lagu siap putar tanpa perlu menyalin link YouTube
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter Kategori & Pencarian */}
        <div className="py-4 space-y-3">
          <input
            type="text"
            placeholder="Cari judul lagu atau nama artis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Lagu */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredSongs.length > 0 ? (
            filteredSongs.map((song, index) => (
              <div
                key={`${song.videoId}-${index}`}
                className="flex items-center justify-between p-3 bg-slate-900/70 hover:bg-slate-900 rounded-xl border border-slate-700/60 hover:border-blue-500/50 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">
                    🎵
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-sm truncate">
                      {song.title}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{song.artist}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {song.category}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectSong(song);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <span>+ Tambah</span>
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              Tidak ada lagu yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
