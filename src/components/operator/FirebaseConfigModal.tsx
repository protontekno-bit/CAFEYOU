import React, { useState, useEffect } from 'react';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  FirebaseCustomConfig,
} from '../../config/firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  isConnected: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  isConnected,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [databaseURL, setDatabaseURL] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [appId, setAppId] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredFirebaseConfig();
      if (stored) {
        setApiKey(stored.apiKey || '');
        setDatabaseURL(stored.databaseURL || '');
        setProjectId(stored.projectId || '');
        setAuthDomain(stored.authDomain || '');
        setStorageBucket(stored.storageBucket || '');
        setAppId(stored.appId || '');
      }
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!databaseURL.trim() && !projectId.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Database URL atau Project ID wajib diisi!',
      });
      return;
    }

    const config: FirebaseCustomConfig = {
      apiKey: apiKey.trim(),
      databaseURL: databaseURL.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      appId: appId.trim(),
    };

    saveFirebaseConfig(config);
    setStatusMsg({
      type: 'success',
      text: 'Konfigurasi Firebase berhasil disimpan! Memuat ulang sinkronisasi...',
    });

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleResetToLocal = () => {
    if (window.confirm('Yakin ingin kembali ke mode sinkronisasi lokal tanpa Firebase?')) {
      clearFirebaseConfig();
      setStatusMsg({
        type: 'info',
        text: 'Konfigurasi Firebase dihapus. Berpindah ke mode lokal...',
      });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Pengaturan Firebase Realtime Database</span>
              </h2>
              <p className="text-xs text-slate-400">
                Hubungkan cloud database agar bisa kontrol nirkabel dari HP kasir & TV terpisah
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

        {/* Status Koneksi */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            isConnected
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>
              {isConnected
                ? 'Status: Terhubung ke Firebase Cloud Realtime Database'
                : 'Status: Mode Lokal (LocalStorage & BroadcastChannel)'}
            </span>
          </div>
          {getStoredFirebaseConfig() && (
            <button
              onClick={handleResetToLocal}
              className="text-[11px] underline hover:text-white"
            >
              Reset ke Lokal
            </button>
          )}
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : statusMsg.type === 'error'
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Form Pengisian */}
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Database URL (Wajib untuk Realtime Database)
            </label>
            <input
              type="text"
              placeholder="https://proyek-anda-default-rtdb.firebaseio.com"
              value={databaseURL}
              onChange={(e) => setDatabaseURL(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Project ID (Wajib)
              </label>
              <input
                type="text"
                placeholder="contoh: cafeyou-karaoke-123"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                API Key (Opsional)
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Panduan Singkat */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
            <div className="font-bold text-slate-200">📖 Panduan 2 Menit Buat Firebase Gratis:</div>
            <div>1. Buka <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">console.firebase.google.com</a> dan buat project baru gratis.</div>
            <div>2. Pilih menu <strong>Realtime Database</strong> &gt; Buat Database.</div>
            <div>3. Pada tab <strong>Rules</strong>, set read/write ke <code className="text-emerald-400 font-mono">true</code> untuk mode kafe.</div>
            <div>4. Salin <strong>Database URL</strong> dan masukkan ke form di atas lalu Simpan.</div>
          </div>

          <div className="pt-3 border-t border-slate-700/60 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
            >
              Simpan & Hubungkan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
