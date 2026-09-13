import React, { useState, useEffect } from 'react';
import { CafeSettings } from '../../../types';
import { DEFAULT_CAFE_SETTINGS } from '../../../constants/karaoke';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
} from '../../../config/firebase';
import { searchYouTubeVideos } from '../../../utils/youtube';

interface SettingsCloudTabProps {
  isCloudConnected?: boolean;
  cafeSettings: CafeSettings;
  onUpdateCafeSettings: (settings: CafeSettings) => void;
}

export const SettingsCloudTab: React.FC<SettingsCloudTabProps> = ({
  isCloudConnected = false,
  cafeSettings,
  onUpdateCafeSettings,
}) => {
  // State: In-line Firebase Config
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbDbUrl, setFbDbUrl] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbStorageBucket, setFbStorageBucket] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbStatusMsg, setFbStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // State: YouTube Data API v3
  const [youtubeApiKey, setYoutubeApiKey] = useState(cafeSettings?.youtubeApiKey || '');
  const [isYtKeyTesting, setIsYtKeyTesting] = useState(false);
  const [ytKeyStatus, setYtKeyStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isYtKeySaved, setIsYtKeySaved] = useState(false);

  useEffect(() => {
    setYoutubeApiKey(cafeSettings?.youtubeApiKey || '');
    const storedFb = getStoredFirebaseConfig();
    if (storedFb) {
      setFbApiKey(storedFb.apiKey || '');
      setFbDbUrl(storedFb.databaseURL || '');
      setFbProjectId(storedFb.projectId || '');
      setFbAuthDomain(storedFb.authDomain || '');
      setFbStorageBucket(storedFb.storageBucket || '');
      setFbAppId(storedFb.appId || '');
    }
  }, [cafeSettings]);

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey.trim() || !fbDbUrl.trim() || !fbProjectId.trim()) {
      setFbStatusMsg({ type: 'error', text: 'API Key, Database URL, dan Project ID wajib diisi.' });
      return;
    }
    saveFirebaseConfig({
      apiKey: fbApiKey.trim(),
      databaseURL: fbDbUrl.trim(),
      projectId: fbProjectId.trim(),
      authDomain: fbAuthDomain.trim(),
      storageBucket: fbStorageBucket.trim(),
      appId: fbAppId.trim(),
    });
    setFbStatusMsg({ type: 'success', text: 'Konfigurasi Firebase berhasil disimpan! Memuat ulang dalam 1 detik...' });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleClearFirebase = () => {
    if (confirm('Apakah Anda yakin ingin menghapus konfigurasi Firebase dan beralih ke mode sinkron lokal?')) {
      clearFirebaseConfig();
      setFbApiKey('');
      setFbDbUrl('');
      setFbProjectId('');
      setFbAuthDomain('');
      setFbStorageBucket('');
      setFbAppId('');
      setFbStatusMsg({ type: 'info', text: 'Konfigurasi dibersihkan. Memuat ulang...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleSaveYoutubeApiKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateCafeSettings({
      ...(cafeSettings || DEFAULT_CAFE_SETTINGS),
      youtubeApiKey: youtubeApiKey.trim(),
    });
    setIsYtKeySaved(true);
    setYtKeyStatus({ type: 'success', message: 'Kunci YouTube Data API v3 berhasil disimpan dan disinkronkan.' });
    setTimeout(() => setIsYtKeySaved(false), 2500);
  };

  const handleTestYoutubeApiKey = async () => {
    const key = youtubeApiKey.trim();
    if (!key) {
      setYtKeyStatus({ type: 'error', message: 'Ketik atau tempel API Key terlebih dahulu.' });
      return;
    }
    setIsYtKeyTesting(true);
    setYtKeyStatus(null);
    try {
      const res = await searchYouTubeVideos('karaoke indonesia', key, 1);
      if (res.success && res.results.length > 0) {
        setYtKeyStatus({
          type: 'success',
          message: `Koneksi Berhasil! Ditemukan: "${res.results[0].title}". API Key valid dan siap digunakan seluruh HP tamu.`,
        });
        onUpdateCafeSettings({
          ...(cafeSettings || DEFAULT_CAFE_SETTINGS),
          youtubeApiKey: key,
        });
      } else {
        setYtKeyStatus({
          type: 'error',
          message: res.error || 'Kunci API tidak valid atau kuota Google Cloud telah habis.',
        });
      }
    } catch (err: any) {
      setYtKeyStatus({
        type: 'error',
        message: err?.message || 'Gagal menghubungi server YouTube.',
      });
    } finally {
      setIsYtKeyTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>☁️ Koneksi Cloud Firebase</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Sinkronisasi realtime antara layar kasir, monitor TV proyektor, dan seluruh smartphone meja tamu.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="text-xs font-bold text-white">
              {isCloudConnected
                ? 'Tersambung ke Firebase Realtime Database'
                : 'Mode Sinkron Lokal (Tanpa Cloud)'}
            </div>
            <div className="text-[10px] text-slate-400">
              {isCloudConnected
                ? 'Antrean lagu dan reaksi tamu tersinkronisasi otomatis dalam hitungan milidetik.'
                : 'Aplikasi berjalan menggunakan sinkronisasi tab lokal browser.'}
            </div>
          </div>
        </div>
      </div>

      {/* Form Konfigurasi Firebase Langsung Inline */}
      <form onSubmit={handleSaveFirebase} className="space-y-3.5">
        {fbStatusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold ${
              fbStatusMsg.type === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                : fbStatusMsg.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
            }`}
          >
            {fbStatusMsg.text}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">API Key:</label>
            <input
              type="text"
              value={fbApiKey}
              onChange={(e) => setFbApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Project ID:</label>
            <input
              type="text"
              value={fbProjectId}
              onChange={(e) => setFbProjectId(e.target.value)}
              placeholder="cafeyou-karaoke"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300">Database URL:</label>
          <input
            type="text"
            value={fbDbUrl}
            onChange={(e) => setFbDbUrl(e.target.value)}
            placeholder="https://cafeyou-default-rtdb.firebaseio.com"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Auth Domain (opsional):</label>
            <input
              type="text"
              value={fbAuthDomain}
              onChange={(e) => setFbAuthDomain(e.target.value)}
              placeholder="cafeyou.firebaseapp.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">App ID (opsional):</label>
            <input
              type="text"
              value={fbAppId}
              onChange={(e) => setFbAppId(e.target.value)}
              placeholder="1:123456789:web:abcdef"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all"
          >
            Simpan & Sambungkan Cloud
          </button>

          <button
            type="button"
            onClick={handleClearFirebase}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Reset ke Mode Lokal
          </button>
        </div>
      </form>

      {/* Seksi Konfigurasi YouTube Data API v3 */}
      <div className="pt-6 border-t border-slate-800 space-y-4">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-red-500 text-lg">🔴</span>
            <span>Pencarian Lagu YouTube Langsung (Live In-App Search)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Memungkinkan tamu kafe mencari dan memutar lagu YouTube apa pun langsung dari layar HP mereka tanpa perlu membuka aplikasi YouTube dan salin link secara manual.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${cafeSettings?.youtubeApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-xs font-bold text-slate-200">
                Status API YouTube:{' '}
                <span className={cafeSettings?.youtubeApiKey ? 'text-emerald-400' : 'text-slate-400'}>
                  {cafeSettings?.youtubeApiKey ? 'Aktif (Siap Digunakan Tamu)' : 'Belum Dikonfigurasi (Mode Asisten)'}
                </span>
              </span>
            </div>
            {cafeSettings?.youtubeApiKey && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Tersinkron ke Seluruh HP Tamu
              </span>
            )}
          </div>

          {ytKeyStatus && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                ytKeyStatus.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              <span>{ytKeyStatus.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{ytKeyStatus.message}</span>
            </div>
          )}

          {isYtKeySaved && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-2">
              <span>✓ Kunci YouTube Data API v3 berhasil disimpan!</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Google YouTube Data API v3 Key:</span>
              <span className="text-[10px] text-slate-500">Gratis 10.000 kuota/hari</span>
            </label>
            <input
              type="password"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono tracking-wider"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestYoutubeApiKey}
              disabled={isYtKeyTesting || !youtubeApiKey.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>{isYtKeyTesting ? '🔄 Menguji...' : '⚡ Tes Koneksi Key'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveYoutubeApiKey}
              disabled={!youtubeApiKey.trim()}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all flex items-center gap-1"
            >
              <span>💾 Simpan API Key</span>
            </button>

            {youtubeApiKey && (
              <button
                type="button"
                onClick={() => {
                  setYoutubeApiKey('');
                  onUpdateCafeSettings({
                    ...(cafeSettings || DEFAULT_CAFE_SETTINGS),
                    youtubeApiKey: '',
                  });
                  setYtKeyStatus({ type: 'success', message: 'API Key YouTube dihapus. Sistem kembali ke mode asisten.' });
                }}
                className="px-3 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-colors"
              >
                Hapus Key
              </button>
            )}
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300">💡 Cara Mendapatkan Kunci YouTube API Gratis:</div>
            <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-slate-400">
              <li>Buka <strong>console.cloud.google.com</strong> dan buat project baru gratis.</li>
              <li>Aktifkan <strong>YouTube Data API v3</strong> di menu APIs & Services ➔ Library.</li>
              <li>Buka menu <strong>Credentials ➔ Create Credentials ➔ API Key</strong>.</li>
              <li>Salin API Key ke kolom di atas lalu klik <strong>Tes Koneksi Key</strong>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
