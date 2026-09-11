import React from 'react';
import { DEVELOPER_INFO } from '../../constants/developer';

interface DeveloperHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperHelpModal: React.FC<DeveloperHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dekorasi Aura Background */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Modal */}
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 text-xl font-black">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {DEVELOPER_INFO.name}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400">Digital Innovation Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Deskripsi & Visi */}
        <div className="space-y-4 text-xs text-slate-300 relative z-10 mb-6">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 leading-relaxed">
            <p className="font-medium text-slate-200 mb-1">
              🚀 Wadah inovasi digital untuk prototipe cerdas dan solusi berbasis data.
            </p>
            <p className="text-slate-400">
              Dikembangkan melalui kolaborasi kreativitas manusia dan kecerdasan buatan (AI) untuk memberikan performa operasional terbaik pada sistem karaoke kafe.
            </p>
          </div>

          {/* Kartu Bantuan WhatsApp */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span>💬 Layanan Bantuan & Support</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                Online
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
              Membutuhkan bantuan teknis, custom request fitur, setup dual screen, integrasi POS, atau kendala operasional kafe?
            </p>
            <a
              href={DEVELOPER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
            >
              <span>Hubungi via WhatsApp ({DEVELOPER_INFO.whatsappSupportNumber}) ↗</span>
            </a>
          </div>

          {/* Info Kontak & Web */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={DEVELOPER_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-[10px] text-slate-400">Website Resmi</div>
                <div className="font-semibold text-cyan-400 group-hover:underline">
                  auracore.my.id
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">↗</span>
            </a>

            <a
              href={DEVELOPER_INFO.emailMailto}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-between group"
            >
              <div>
                <div className="text-[10px] text-slate-400">Email Resmi</div>
                <div className="font-semibold text-blue-400 group-hover:underline">
                  Kirim Email
                </div>
              </div>
              <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">✉️</span>
            </a>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px] text-slate-400 relative z-10">
          <span>{DEVELOPER_INFO.copyright}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
