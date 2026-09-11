import React, { useState } from 'react';
import { DEVELOPER_INFO } from '../../constants/developer';
import { DeveloperHelpModal } from './DeveloperHelpModal';

interface DeveloperFooterProps {
  compact?: boolean;
  className?: string;
}

export const DeveloperFooter: React.FC<DeveloperFooterProps> = ({
  compact = false,
  className = '',
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  if (compact) {
    return (
      <>
        <div
          className={`flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 ${className}`}
        >
          <span>
            Dikembangkan oleh{' '}
            <a
              href={DEVELOPER_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 hover:underline"
            >
              {DEVELOPER_INFO.name}
            </a>
          </span>
          <span>•</span>
          <a
            href={DEVELOPER_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
          >
            <span>💬 WA Support: {DEVELOPER_INFO.whatsappSupportNumber}</span>
          </a>
        </div>

        <DeveloperHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </>
    );
  }

  return (
    <>
      <footer
        className={`w-full max-w-4xl mx-auto pt-8 pb-4 border-t border-slate-800/80 mt-12 text-slate-400 text-xs ${className}`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Sisi Kiri: Brand & Tagline */}
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <a
                href={DEVELOPER_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-sm text-slate-100 hover:text-cyan-300 transition-colors tracking-wide flex items-center gap-1.5"
              >
                <span>{DEVELOPER_INFO.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Digital Innovation Hub
                </span>
              </a>
            </div>
            <p className="text-slate-400 text-[11px] max-w-md leading-relaxed">
              {DEVELOPER_INFO.tagline}
            </p>
          </div>

          {/* Sisi Kanan: Tombol WhatsApp Support & Website */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={DEVELOPER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shadow-sm hover:scale-[1.02]"
              title="Chat WhatsApp Developer Support"
            >
              <span className="text-base leading-none">💬</span>
              <span>WA Support: {DEVELOPER_INFO.whatsappSupportNumber}</span>
            </a>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            >
              <span>ℹ️ Tentang Pengembang</span>
            </button>

            <a
              href={DEVELOPER_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-medium transition-all"
            >
              <span>🌐 Web Portofolio ↗</span>
            </a>
          </div>
        </div>

        {/* Baris Bawah: Copyright & Links */}
        <div className="mt-4 pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>{DEVELOPER_INFO.copyright}</div>
          <div className="flex items-center gap-3">
            <a
              href={DEVELOPER_INFO.emailMailto}
              className="hover:text-slate-300 transition-colors"
            >
              {DEVELOPER_INFO.email}
            </a>
            <span>•</span>
            <a
              href={DEVELOPER_INFO.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition-colors"
            >
              Instagram
            </a>
            <span>•</span>
            <a
              href={DEVELOPER_INFO.socials.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 transition-colors"
            >
              TikTok
            </a>
            <span>•</span>
            <a
              href={DEVELOPER_INFO.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      <DeveloperHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
