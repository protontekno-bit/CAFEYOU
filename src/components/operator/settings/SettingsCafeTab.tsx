import React, { useState, useEffect } from 'react';
import { CafeSettings } from '../../../types';
import { DEFAULT_CAFE_SETTINGS } from '../../../constants/karaoke';
import { CheckIcon } from '../../icons/Icons';
import { searchYouTubeVideos } from '../../../utils/youtube';

interface SettingsCafeTabProps {
  cafeSettings: CafeSettings;
  onUpdateCafeSettings: (settings: CafeSettings) => void;
}

export const SettingsCafeTab: React.FC<SettingsCafeTabProps> = ({
  cafeSettings,
  onUpdateCafeSettings,
}) => {
  const [cafeName, setCafeName] = useState(cafeSettings?.name || DEFAULT_CAFE_SETTINGS.name);
  const [tagline, setTagline] = useState(cafeSettings?.tagline || '');
  const [welcomeMsg, setWelcomeMsg] = useState(cafeSettings?.welcomeMessage || '');
  const [wifiName, setWifiName] = useState(cafeSettings?.wifiName || '');
  const [wifiPassword, setWifiPassword] = useState(cafeSettings?.wifiPassword || '');
  const [posPin, setPosPin] = useState(cafeSettings?.posPassword || '1234');
  const [isCafeSaved, setIsCafeSaved] = useState(false);

  // State: YouTube Data API v3
  const [youtubeApiKey, setYoutubeApiKey] = useState(cafeSettings?.youtubeApiKey || '');
  const [isYtKeyTesting, setIsYtKeyTesting] = useState(false);
  const [ytKeyStatus, setYtKeyStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setCafeName(cafeSettings?.name || DEFAULT_CAFE_SETTINGS.name);
    setTagline(cafeSettings?.tagline || '');
    setWelcomeMsg(cafeSettings?.welcomeMessage || '');
    setWifiName(cafeSettings?.wifiName || '');
    setWifiPassword(cafeSettings?.wifiPassword || '');
    setPosPin(cafeSettings?.posPassword || '1234');
    setYoutubeApiKey(cafeSettings?.youtubeApiKey || '');
  }, [cafeSettings]);

  const handleSaveCafe = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCafeSettings({
      ...(cafeSettings || DEFAULT_CAFE_SETTINGS),
      name: cafeName.trim() || 'CAFEYOU',
      tagline: tagline.trim(),
      welcomeMessage: welcomeMsg.trim(),
      wifiName: wifiName.trim(),
      wifiPassword: wifiPassword.trim(),
      youtubeApiKey: youtubeApiKey.trim(),
      posPassword: posPin.trim() || '1234',
    });
    setIsCafeSaved(true);
    setTimeout(() => setIsCafeSaved(false), 2000);
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
          name: cafeName.trim() || 'CAFEYOU',
          tagline: tagline.trim(),
          welcomeMessage: welcomeMsg.trim(),
          wifiName: wifiName.trim(),
          wifiPassword: wifiPassword.trim(),
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
          <span>🏪 Profil & Identitas Kafe</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Pengaturan ini akan otomatis tampil di Layar Proyektor TV, Stiker Meja, dan Portal HP Tamu.
        </p>
      </div>

      <form onSubmit={handleSaveCafe} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nama Kafe / Lounge:</label>
            <input
              type="text"
              value={cafeName}
              onChange={(e) => setCafeName(e.target.value)}
              placeholder="CAFEYOU"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Slogan / Tagline:</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Coffee & Eatery"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Pesan Sambutan:</label>
          <input
            type="text"
            value={welcomeMsg}
            onChange={(e) => setWelcomeMsg(e.target.value)}
            placeholder="Selamat Datang di CAFEYOU Karaoke Lounge"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
            <span>📶 Informasi Wi-Fi untuk Pelanggan</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Nama Wi-Fi (SSID):</label>
              <input
                type="text"
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
                placeholder="CAFEYOU_Free_WiFi"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Password Wi-Fi:</label>
              <input
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="karaokecafeyou"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* PIN Kasir & POS */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <span>🍽️ Keamanan Workstation Kasir (POS)</span>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">PIN / Kata Sandi Kasir (Cloud):</label>
            <input
              type="password"
              value={posPin}
              onChange={(e) => setPosPin(e.target.value)}
              placeholder="1234"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest"
            />
            <p className="text-[10px] text-slate-500">
              PIN ini tersimpan di Firebase Cloud dan digunakan staf untuk membuka dasbor POS (<code>#/pos</code>) di komputer/tablet kasir.
            </p>
          </div>
        </div>

        {/* Integrasi YouTube Data API Key */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-base">🔴</span>
              <span className="text-xs font-bold text-white">
                YouTube Data API Key (Google Cloud)
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              youtubeApiKey
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {youtubeApiKey ? 'Aktif (Tamu Bisa Cari Langsung)' : 'Belum Ada (Mode Asisten)'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Masukkan API Key agar tamu kafe dapat mencari dan memilih lagu YouTube secara langsung di HP mereka tanpa perlu copy-paste link.
          </p>

          {ytKeyStatus && (
            <div
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                ytKeyStatus.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              <span>{ytKeyStatus.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{ytKeyStatus.message}</span>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <label className="font-semibold text-slate-300">Google YouTube Data API v3 Key:</label>
              <span className="text-emerald-400 font-medium">Gratis 10.000 kuota/hari</span>
            </div>
            <input
              type="password"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono tracking-wider focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestYoutubeApiKey}
              disabled={isYtKeyTesting || !youtubeApiKey.trim()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1"
            >
              <span>{isYtKeyTesting ? '🔄 Menguji...' : '⚡ Tes Koneksi Key'}</span>
            </button>
            {youtubeApiKey && (
              <button
                type="button"
                onClick={() => {
                  setYoutubeApiKey('');
                  setYtKeyStatus({ type: 'success', message: 'API Key dikosongkan. Klik Simpan Profil Kafe untuk menyimpan.' });
                }}
                className="px-3 py-1.5 text-slate-500 hover:text-red-400 text-xs font-semibold"
              >
                Hapus
              </button>
            )}
          </div>

          <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-300">💡 Cara Mendapatkan Kunci YouTube API Gratis:</div>
            <ol className="list-decimal pl-4 space-y-0.5 text-slate-400">
              <li>Buka <strong>console.cloud.google.com</strong> (gratis).</li>
              <li>Aktifkan <strong>YouTube Data API v3</strong> di menu Library.</li>
              <li>Buat <strong>Credentials ➔ API Key</strong> dan salin ke sini.</li>
            </ol>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
        >
          {isCafeSaved ? (
            <>
              <CheckIcon className="w-4 h-4 text-emerald-300" />
              <span>Berhasil Disimpan!</span>
            </>
          ) : (
            <span>Simpan Profil Kafe</span>
          )}
        </button>
      </form>
    </div>
  );
};
