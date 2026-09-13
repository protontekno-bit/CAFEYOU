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
    const currentUrl = window.location.href.split('#')[0];
    window.open(currentUrl + '#player', '_blank');
  };

  const handleOperatorClick = () => {
    try {
      const savedAuth = sessionStorage.getItem('cafeyou_operator_auth');
      if (savedAuth) {
        setRole('operator');
        return;
      }
    } catch {}
    setLoginTargetRole('operator');
    setIsLoginModalOpen(true);
  };

  const handlePosClick = () => {
    try {
      const savedAuth = sessionStorage.getItem('cafeyou_operator_auth');
      if (savedAuth) {
        setRole('pos');
        return;
      }
    } catch {}
    setLoginTargetRole('pos');
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between items-center px-3 sm:px-4 py-3 sm:py-4 font-sans text-slate-200 relative overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[400px] h-[250px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content Box */}
      <div className="max-w-[1440px] w-full my-auto flex flex-col items-center">
        {/* Header Hero */}
        <div className="text-center mb-3 sm:mb-4 max-w-xl mx-auto animate-fadeIn">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-full shadow-md mb-2 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">
              CAFEYOU • KARAOKE & POS SYSTEM
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-300 mb-1 tracking-tight">
            Pusat Kendali Ekosistem Kafe
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Pilih stasiun kerja untuk perangkat ini. Seluruh alur data lagu, kasir billing, dan dapur tersinkronisasi real-time.
          </p>
        </div>

        {/* 5 Kartu Stasiun Kerja (Satu Baris Responsif di Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-3.5 w-full">
          {/* 1. Dasbor Operator */}
          <RoleCard
            badge="Operator Staf"
            title="Dasbor Operator"
            description="Kendali pemutar karaoke, antrean Fair Rotation, volume TV, dan penerbitan voucher."
            themeColor="blue"
            chips={['Antrean TV', 'Fair Rotation']}
            actionText="Masuk Dasbor"
            onClick={handleOperatorClick}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            }
          />

          {/* 2. Kasir (POS) */}
          <RoleCard
            badge="Point of Sale"
            title="Kasir (POS)"
            description="Kelola tagihan meja, pelunasan tunai/QRIS, cetak struk thermal, dan rekap beban kas."
            themeColor="emerald"
            chips={['Billing Meja', 'Struk & QRIS']}
            actionText="Buka Kasir"
            onClick={handlePosClick}
            icon={<span className="text-2xl">💵</span>}
          />

          {/* 3. Layar Dapur (KDS) */}
          <RoleCard
            badge="Kitchen Board"
            title="Layar Dapur (KDS)"
            description="Workstation tablet koki & barista untuk pantau pesanan masuk, masak, dan siap saji."
            themeColor="amber"
            chips={['Tiket Masak', 'Dapur & Bar']}
            actionText="Buka Dapur"
            onClick={() => setRole('kitchen')}
            icon={<span className="text-2xl">🍳</span>}
          />

          {/* 4. Layar TV / Proyektor */}
          <RoleCard
            badge="Layar Proyektor"
            title="Layar TV / Player"
            description="Layar bersih khusus tayangan video YouTube HD, lirik, running text, dan reaksi tamu."
            themeColor="cyan"
            chips={['Full Screen', 'YouTube HD']}
            actionText="Buka di Tab Baru"
            onClick={handleOpenPlayerInNewTab}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            }
          />

          {/* 5. Portal Tamu HP */}
          <RoleCard
            badge="Self-Service HP"
            title="Portal Pelanggan"
            description="Scan QR meja untuk memesan menu F&B, request lagu karaoke HP, dan cek nota e-billing."
            themeColor="purple"
            chips={['Scan QR Meja', 'E-Menu & Lagu']}
            actionText="Buka Portal"
            onClick={() => setRole('guest')}
            icon={<TicketIcon className="w-6 h-6 text-white" />}
          />
        </div>
      </div>

      {/* Compact Developer Footer */}
      <DeveloperFooter compact className="w-full max-w-6xl mt-2 pb-1" />

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
