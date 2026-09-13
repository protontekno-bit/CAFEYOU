import React from 'react';
import { DEVELOPER_INFO } from '../../../constants/developer';

interface SettingsHelpTabProps {
  onOpenDeveloperHelpModal?: () => void;
}

export const SettingsHelpTab: React.FC<SettingsHelpTabProps> = () => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>💬 Bantuan Pengembang & Layanan Teknis</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Kontak resmi dan panduan operasional dari tim AuraCore Labs.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/30 space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-500/20">
            ⚡
          </div>
          <div>
            <div className="text-base font-black text-white">{DEVELOPER_INFO.name}</div>
            <div className="text-xs text-emerald-400 font-semibold">
              {DEVELOPER_INFO.brandName} • {DEVELOPER_INFO.tagline}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed space-y-2 pt-2 border-t border-slate-800">
          <p>
            Aplikasi ini dirancang khusus untuk operasional karaoke kafe dual-screen tanpa ketergantungan koneksi internet publik berbayar.
          </p>
          <p className="text-slate-400 text-[11px]">
            Jika Anda membutuhkan bantuan setup Wi-Fi lokal, konfigurasi monitor kedua proyektor, atau kustomisasi fitur kafe, silakan hubungi tim kami via WhatsApp.
          </p>
        </div>

        <div className="pt-2">
          <a
            href={DEVELOPER_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <span>💬 Hubungi WhatsApp AuraCore ({DEVELOPER_INFO.whatsappSupportDisplay})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
