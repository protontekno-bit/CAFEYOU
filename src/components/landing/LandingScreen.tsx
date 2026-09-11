import React from 'react';
import { RoleCard } from './RoleCard';
import { SplitIcon } from '../icons/Icons';
import { AppRole } from '../../types';

interface LandingScreenProps {
  setRole: (role: AppRole) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ setRole }) => {
  const handleOpenPlayerInNewTab = () => {
    // Membuka tab baru dengan menyisipkan hash #player untuk menghindari error 404
    const currentUrl = window.location.href.split('#')[0];
    window.open(currentUrl + '#player', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-200">
      <div className="max-w-3xl w-full">
        {/* Header Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4 tracking-tight">
            Sistem Karaoke Kafe
          </h1>
          <p className="text-slate-400 text-lg">
            Pilih peran perangkat ini dalam jaringan operasional.
          </p>
        </div>

        {/* Pilihan Peran Utama */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
          <RoleCard
            title="Dasbor Operator"
            description="Kelola antrean lagu, kontrol volume, dan putar lagu untuk pelanggan dari layar laptop kasir."
            themeColor="blue"
            onClick={() => setRole('operator')}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            }
          />

          <RoleCard
            title="Layar Proyektor"
            description="Buka layar ini dan geser (drag) ke proyektor. Layar bersih dari antarmuka, hanya video."
            themeColor="emerald"
            onClick={handleOpenPlayerInNewTab}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            }
          />
        </div>

        {/* Simulator Split Screen */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setRole('split')}
            className="w-full relative bg-slate-800 p-4 rounded-xl border border-green-500/50 hover:bg-slate-700 transition-all flex items-center justify-center gap-3 text-green-400 font-medium hover:border-green-400 shadow-lg shadow-green-500/5"
          >
            <SplitIcon className="w-5 h-5" />
            <span>Uji Coba Simulator Split-Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
