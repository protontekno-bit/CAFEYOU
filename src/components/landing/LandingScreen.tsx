import React from 'react';
import { RoleCard } from './RoleCard';
import { SplitIcon, TicketIcon } from '../icons/Icons';
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-200 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl w-full py-8">
        {/* Header Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
            <span>🎤 CAFEYOU KARAOKE SYSTEM</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 mb-3 tracking-tight">
            Sistem Karaoke Kafe Dual Screen
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Pilih peran perangkat ini dalam ekosistem karaoke kafe Anda.
          </p>
        </div>

        {/* Pilihan Peran Utama (3 Kartu) */}
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-6">
          <RoleCard
            title="Dasbor Operator"
            description="Kelola antrean lagu, kontrol volume, dan cetak voucher dari layar laptop kasir."
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
            title="Layar Proyektor / TV"
            description="Layar bersih khusus tayangan video YouTube, running text, dan reaksi penonton."
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

          <RoleCard
            title="Portal Pelanggan"
            description="Scan QR meja untuk pilih lagu dari HP, cek antrean, dan kirim reaksi live ke TV."
            themeColor="purple"
            onClick={() => setRole('guest')}
            icon={<TicketIcon className="w-8 h-8 text-purple-400" />}
          />
        </div>

        {/* Simulator Split Screen */}
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setRole('split')}
            className="w-full relative bg-slate-900/80 p-3.5 rounded-2xl border border-cyan-500/40 hover:bg-slate-850 transition-all flex items-center justify-center gap-2.5 text-cyan-300 font-semibold hover:border-cyan-400 shadow-lg shadow-cyan-500/5 text-xs sm:text-sm"
          >
            <SplitIcon className="w-4 h-4" />
            <span>Mode Uji Coba: Simulator Split-Screen Operator & Proyektor 1 Layar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
