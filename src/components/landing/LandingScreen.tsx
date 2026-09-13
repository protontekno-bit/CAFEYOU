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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center px-4 py-8 font-sans text-slate-200 relative overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[400px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[300px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Main Content Box */}
      <div className="max-w-6xl w-full my-auto flex flex-col items-center">
        {/* Header Hero */}
        <div className="text-center mb-10 max-w-2xl mx-auto animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full shadow-lg mb-4 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase">
              CAFEYOU • DUAL-SCREEN KARAOKE & POS LOUNGE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-300 mb-3 tracking-tight">
            Pusat Kendali Ekosistem Kafe
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            Pilih stasiun kerja untuk perangkat ini. Seluruh alur data lagu, kasir billing, dan pesanan dapur tersinkronisasi secara real-time.
          </p>
        </div>

        {/* SECTION 1: Operasional & Staf Kafe (3 Kolom Seimbang) */}
        <div className="w-full mb-5">
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>💼</span> Staf & Manajemen Operasional
            </span>
            <div className="h-px bg-slate-800/80 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 w-full">
            {/* 1. Dasbor Operator */}
            <RoleCard
              badge="Workstation Staf"
              title="Dasbor Operator"
              description="Kendali pemutar karaoke, antrean lagu adil (Fair Rotation), kontrol volume TV, dan penerbitan voucher meja."
              themeColor="blue"
              chips={['Antrean TV', 'Fair Rotation', 'Voucher PIN']}
              actionText="Masuk Dasbor"
              onClick={handleOperatorClick}
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              title="Kasir & Billing (POS)"
              description="Kelola tagihan meja, pelunasan tunai/QRIS, cetak struk thermal Bluetooth, serta pencatatan beban kas kecil."
              themeColor="emerald"
              chips={['Billing Meja', 'QRIS & Tunai', 'Struk Thermal']}
              actionText="Buka Kasir"
              onClick={handlePosClick}
              icon={<span className="text-3xl">💵</span>}
            />

            {/* 3. Layar Dapur (KDS) */}
            <RoleCard
              badge="Kitchen Display"
              title="Layar Dapur (KDS)"
              description="Workstation tablet koki dapur dan barista untuk memantau tiket pesanan masuk, proses masak, dan siap saji."
              themeColor="amber"
              chips={['Tiket Real-time', 'Dapur & Barista', 'Status Saji']}
              actionText="Buka Dapur"
              onClick={() => setRole('kitchen')}
              icon={<span className="text-3xl">🍳</span>}
            />
          </div>
        </div>

        {/* SECTION 2: Layar Publik & Pelanggan (2 Kolom Lebar & Proporsional) */}
        <div className="w-full">
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>📺</span> Display Publik & Pelanggan
            </span>
            <div className="h-px bg-slate-800/80 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 w-full">
            {/* 4. Layar TV / Proyektor */}
            <RoleCard
              badge="Monitor Proyektor"
              title="Layar TV / Player"
              description="Layar bersih khusus tayangan video YouTube HD, lirik, teks berjalan kafe, dan animasi reaksi penonton."
              themeColor="cyan"
              chips={['Layar Penuh (F11)', 'YouTube HD', 'Teks Berjalan']}
              actionText="Buka di Tab Baru"
              onClick={handleOpenPlayerInNewTab}
              icon={
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              badge="Smartphone Tamu"
              title="Portal Pelanggan"
              description="Pelanggan cukup scan QR meja untuk memesan makanan/minuman, request lagu karaoke YouTube, dan cek nota."
              themeColor="purple"
              chips={['Scan QR Meja', 'E-Menu F&B', 'Pilih Lagu HP']}
              actionText="Buka Portal Tamu"
              onClick={() => setRole('guest')}
              icon={<TicketIcon className="w-7 h-7 text-white" />}
            />
          </div>
        </div>
      </div>

      {/* Developer Footer Brand & WA Support */}
      <DeveloperFooter className="w-full max-w-6xl mt-8" />

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
