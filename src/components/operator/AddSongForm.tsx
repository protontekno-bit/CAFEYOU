import React, { useState, useMemo } from 'react';
import {
  extractYouTubeID,
  getYouTubeThumbnail,
  POPULAR_KARAOKE_SONGS,
} from '../../utils/youtube';
import { QUICK_TABLES } from '../../constants/karaoke';
import { SavedLibrarySong, SongHistoryItem } from '../../types';
import { AddSongSearchTab } from './AddSongSearchTab';
import { AddSongYouTubeTab } from './AddSongYouTubeTab';

interface AddSongFormProps {
  onAddSong: (videoId: string, rawUrl: string, requester: string, customTitle?: string) => void;
  onOpenPopularModal?: () => void;
  songLibrary?: Record<string, SavedLibrarySong>;
  history?: SongHistoryItem[];
  tables?: string[];
  youtubeApiKey?: string;
}

export const AddSongForm: React.FC<AddSongFormProps> = ({
  onAddSong,
  onOpenPopularModal,
  songLibrary = {},
  history = [],
  tables,
  youtubeApiKey,
}) => {
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;
  const [activeTab, setActiveTab] = useState<'catalog' | 'youtube'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Menggabungkan seluruh sumber data lokal (Catalog Preset + History Pemutaran + Song Library)
  const allSavedSongs = useMemo(() => {
    const map = new Map<string, SavedLibrarySong>();

    // 1. Masukkan Katalog Lagu Populer Kafe
    POPULAR_KARAOKE_SONGS.forEach((song) => {
      map.set(song.videoId, {
        videoId: song.videoId,
        title: `${song.title} - ${song.artist}`,
        artist: song.artist,
        thumbnail: getYouTubeThumbnail(song.videoId, 'hqdefault'),
        url: `https://www.youtube.com/watch?v=${song.videoId}`,
        playCount: 0,
        lastPlayedAt: 0,
      });
    });

    // 2. Masukkan Riwayat Pemutaran
    (history || []).forEach((item) => {
      if (item && item.videoId) {
        const existing = map.get(item.videoId);
        map.set(item.videoId, {
          videoId: item.videoId,
          title: item.title,
          thumbnail: item.thumbnail || getYouTubeThumbnail(item.videoId, 'hqdefault'),
          url: item.url || `https://www.youtube.com/watch?v=${item.videoId}`,
          playCount: (existing?.playCount || 0) + 1,
          lastPlayedAt: item.playedAt,
        });
      }
    });

    // 3. Masukkan Database Song Library Kafe
    Object.values(songLibrary || {}).forEach((item) => {
      if (item && item.videoId) {
        const existing = map.get(item.videoId);
        map.set(item.videoId, {
          ...existing,
          ...item,
          thumbnail: item.thumbnail || getYouTubeThumbnail(item.videoId, 'hqdefault'),
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
  }, [songLibrary, history]);

  // Filter lagu berdasarkan kata kunci pencarian lokal
  const searchResults = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) {
      return allSavedSongs.slice(0, 8);
    }
    return allSavedSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(term) ||
        (song.artist && song.artist.toLowerCase().includes(term)) ||
        song.videoId.toLowerCase().includes(term)
    );
  }, [searchQuery, allSavedSongs]);

  const handleSelectFromLibrary = (song: SavedLibrarySong) => {
    const requester = nameInput.trim() || 'Kasir';
    onAddSong(
      song.videoId,
      song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
      requester,
      song.title
    );
    setSearchQuery('');
  };

  return (
    <div className="bg-slate-800/95 rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-700/60 space-y-4 font-sans">
      {/* Header & Judul */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>➕</span>
          <span>Tambah Lagu</span>
        </h2>
        <span className="text-[10px] bg-slate-900/80 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">
          Koleksi Lokal: <strong className="text-emerald-400 font-mono">{allSavedSongs.length}</strong>
        </span>
      </div>

      {/* Bagian 1: Input Nama Pemesan / Meja */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-slate-300">
            Nama Pemesan / Meja
          </label>
          <span className="text-[10px] text-slate-500">(Opsional)</span>
        </div>
        <input
          type="text"
          placeholder="Ketik nama tamu atau klik tombol meja di bawah..."
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
        />

        {/* Quick Table Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {activeTables.map((table) => (
            <button
              key={table}
              type="button"
              onClick={() => setNameInput(table)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                nameInput === table
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 border border-slate-700/60'
              }`}
            >
              {table}
            </button>
          ))}
          {nameInput && (
            <button
              type="button"
              onClick={() => setNameInput('')}
              className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-rose-300 bg-slate-900/70 border border-slate-700/60 cursor-pointer"
              title="Reset nama/meja"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Bagian 2: Tab Pilihan Sumber Lagu Langsung */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setActiveTab('catalog');
            // Jika sebelumnya ada link YouTube di query, bersihkan agar tab koleksi bersih
            if (extractYouTubeID(searchQuery)) {
              setSearchQuery('');
            }
          }}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎵</span>
          <span>Koleksi Kafe ({allSavedSongs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('youtube')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'youtube'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="text-red-400">🔴</span>
          <span>Cari di YouTube</span>
          {youtubeApiKey ? (
            <span className="text-[9px] bg-red-500/20 text-red-200 px-1.5 py-0.2 rounded font-mono">
              LIVE
            </span>
          ) : (
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
              BANTUAN
            </span>
          )}
        </button>
      </div>

      {/* Bagian 3: Konten Tab Sesuai Pilihan */}
      {activeTab === 'catalog' ? (
        <AddSongSearchTab
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onClearQuery={() => setSearchQuery('')}
          searchResults={searchResults}
          totalSavedCount={allSavedSongs.length}
          onSelectFromLibrary={handleSelectFromLibrary}
          onOpenPopularModal={onOpenPopularModal}
          onSwitchToYouTube={() => setActiveTab('youtube')}
        />
      ) : (
        <AddSongYouTubeTab
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          youtubeApiKey={youtubeApiKey}
          requesterName={nameInput}
          onAddSong={onAddSong}
          onClearQuery={() => setSearchQuery('')}
        />
      )}
    </div>
  );
};
