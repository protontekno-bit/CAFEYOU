import React, { useState } from 'react';
import { RoleCard } from './RoleCard';
import { OperatorLoginModal } from './OperatorLoginModal';
import { TicketIcon } from '../icons/Icons';
import { AppRole } from '../../types';

import { DeveloperFooter } from '../common/DeveloperFooter';

interface LandingScreenProps {
  setRole: (role: AppRole) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ setRole }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [loginTargetRole, setLoginTargetRole] = useState<'operator' | 'pos'>('operator');

  const handleOpenPlayerInNewTab = () => {
    // Membuka tab baru dengan menyisipkan hash #player untuk menghindari error 404
    const currentUrl = window.location.href.split('#')[0];
    window.open(currentUrl + '#player', '_blank');
  };

  const handleOperatorClick = () => {
    // Periksa apakah kasir sudah login sebelumnya di sesi ini
    try {
      const savedAuth = sessionStorage.getItem('cafeyou_operator_auth');
      if (savedAuth) {
        setRole('operator');
        return;
      }
    } catch {
      // ignore
    }
    setLoginTargetRole('operator');
    setIsLoginModalOpen(true);
  };

  const handlePosClick = () => {
    // Periksa apakah kasir sudah login sebelumnya di sesi ini
    try {
      const savedAuth = sessionStorage.getItem('cafeyou_operator_auth');
      if (savedAuth) {
        setRole('pos');
        return;
      }
    } catch {
      // ignore
    }
    setLoginTargetRole('pos');
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-4 font-sans text-slate-200 selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl w-full py-6 my-auto">
        {/* Header Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
            <span>🎤 CAFEYOU KARAOKE & POS SYSTEM</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 mb-3 tracking-tight">
            Sistem Karaoke & POS Kafe Dual Screen
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Pilih peran perangkat ini dalam ekosistem kafe dan karaoke Anda.
          </p>
        </div>

        {/* Pilihan Peran Utama (5 Kartu Lengkap Ekosistem Kafe) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-w-6xl w-full mx-auto mb-6">
          <RoleCard
            title="Dasbor Operator"
            description="Kelola antrean lagu, kontrol volume player, dan kelola voucher karaoke."
            themeColor="blue"
            onClick={handleOperatorClick}
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
            title="Kasir (POS)"
            description="Kelola tagihan meja, pembayaran tunai/QRIS, cetak struk thermal, dan rekap omzet."
            themeColor="amber"
            onClick={handlePosClick}
            icon={<span className="text-3xl">💵</span>}
          />

          <RoleCard
            title="Layar Dapur (KDS)"
            description="Layar tablet / Smart TV koki & barista untuk pantau pesanan masuk, masak, dan siap saji."
            themeColor="orange"
            onClick={() => setRole('kitchen')}
            icon={<span className="text-3xl">🍳</span>}
          />

          <RoleCard
            title="Layar TV / Player"
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
            description="Scan QR meja untuk pesan makanan/minuman, pilih lagu HP, dan cek antrean."
            themeColor="purple"
            onClick={() => setRole('guest')}
            icon={<TicketIcon className="w-8 h-8 text-purple-400" />}
          />
        </div>
      </div>

      {/* Developer Footer Brand & WA Support */}
      <DeveloperFooter className="w-full" />

      {/* Operator Login Modal */}
      <OperatorLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          setRole(loginTargetRole);
        }}
      />
    </div>
  );
};
