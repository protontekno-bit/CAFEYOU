import React, { useState, useMemo, useEffect } from 'react';
import { SearchIcon } from '../icons/Icons';
import {
  extractYouTubeID,
  getYouTubeThumbnail,
  fetchYouTubeInfo,
  POPULAR_KARAOKE_SONGS,
} from '../../utils/youtube';
import { QUICK_TABLES } from '../../constants/karaoke';
import { SavedLibrarySong, SongHistoryItem } from '../../types';
import { AddSongSearchTab } from './AddSongSearchTab';
import { AddSongUrlTab } from './AddSongUrlTab';

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
  const [activeTab, setActiveTab] = useState<'search' | 'url'>('search');
  const [searchInput, setSearchInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [detectedVideoId, setDetectedVideoId] = useState<string | null>(null);

  // Menggabungkan seluruh sumber data (Catalog Preset + History Pemutaran + Song Library)
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

  // Filter lagu berdasarkan kata kunci pencarian
  const searchResults = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term) {
      return allSavedSongs.slice(0, 8);
    }
    return allSavedSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(term) ||
        (song.artist && song.artist.toLowerCase().includes(term)) ||
        song.videoId.toLowerCase().includes(term)
    );
  }, [searchInput, allSavedSongs]);

  // Otomatis fetch judul saat user menempel link YouTube di tab URL
  useEffect(() => {
    const videoId = extractYouTubeID(linkInput);
    setDetectedVideoId(videoId || null);

    if (videoId) {
      setIsFetchingInfo(true);
      fetchYouTubeInfo(videoId)
        .then((info) => {
          if (info && info.title) {
            setCustomTitleInput(info.title);
          }
        })
        .finally(() => {
          setIsFetchingInfo(false);
        });
    } else {
      setCustomTitleInput('');
    }
  }, [linkInput]);

  const handleSelectFromLibrary = (song: SavedLibrarySong) => {
    onAddSong(
      song.videoId,
      song.url || `https://www.youtube.com/watch?v=${song.videoId}`,
      nameInput.trim(),
      song.title
    );
    setSearchInput('');
    setNameInput('');
  };

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!linkInput.trim()) {
      setErrorMsg('Tautan YouTube tidak boleh kosong');
      return;
    }

    const videoId = extractYouTubeID(linkInput);
    if (!videoId) {
      setErrorMsg('Tautan YouTube tidak valid. Gunakan format youtube.com/watch?v=... atau youtu.be/...');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSong(
        videoId,
        linkInput.trim(),
        nameInput.trim(),
        customTitleInput.trim() || undefined
      );
      setLinkInput('');
      setCustomTitleInput('');
      setNameInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/95 rounded-2xl p-5 shadow-xl border border-slate-700/60 space-y-4 font-sans">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>➕</span> Tambah Lagu
        </h2>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('search');
              setErrorMsg('');
            }}
            className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Cari di Database ({allSavedSongs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setErrorMsg('');
            }}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>+ Link YouTube</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Nama Pemesan / Meja */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Nama Pemesan / Meja
          </label>
          <span className="text-[10px] text-slate-500">(Opsional)</span>
        </div>
        <input
          type="text"
          placeholder="Ketik nama tamu atau klik tombol meja di bawah"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
        />

        {/* Quick Table Chips */}
        <div className="flex flex-wrap gap-1.5 mt-2">
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
        </div>
      </div>

      {/* Mode 1: Cari dari Database Library Kafe */}
      {activeTab === 'search' && (
        <AddSongSearchTab
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          searchResults={searchResults}
          onSelectFromLibrary={handleSelectFromLibrary}
          onAddSong={onAddSong}
          requesterName={nameInput}
          onClearInputs={() => {
            setSearchInput('');
            setNameInput('');
          }}
          youtubeApiKey={youtubeApiKey}
          onOpenPopularModal={onOpenPopularModal}
        />
      )}

      {/* Mode 2: Tempel Link YouTube Baru */}
      {activeTab === 'url' && (
        <AddSongUrlTab
          linkInput={linkInput}
          onLinkInputChange={(val) => {
            setLinkInput(val);
            if (errorMsg) setErrorMsg('');
          }}
          detectedVideoId={detectedVideoId}
          customTitleInput={customTitleInput}
          onCustomTitleChange={setCustomTitleInput}
          isFetchingInfo={isFetchingInfo}
          isSubmitting={isSubmitting}
          onSubmitUrl={handleSubmitUrl}
        />
      )}
    </div>
  );
};
