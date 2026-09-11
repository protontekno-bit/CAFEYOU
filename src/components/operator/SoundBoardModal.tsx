import React from 'react';
import { SoundEffectType } from '../../types';

interface SoundBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSound: (type: SoundEffectType) => void;
}

interface SoundItem {
  type: SoundEffectType;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

const SOUND_ITEMS: SoundItem[] = [
  {
    type: 'applause',
    label: 'Tepuk Tangan',
    emoji: '👏',
    description: 'Apresiasi tepuk tangan penonton',
    color: 'from-amber-500/20 to-orange-500/20 hover:border-amber-400 border-amber-500/40 text-amber-300',
  },
  {
    type: 'airhorn',
    label: 'Terompet Airhorn',
    emoji: '📯',
    description: 'Suara seru pesta / pembukaan lagu',
    color: 'from-rose-500/20 to-red-500/20 hover:border-rose-400 border-rose-500/40 text-rose-300',
  },
  {
    type: 'cheer',
    label: 'Sorak Hore',
    emoji: '🎉',
    description: 'Suara gembira & perayaan',
    color: 'from-emerald-500/20 to-teal-500/20 hover:border-emerald-400 border-emerald-500/40 text-emerald-300',
  },
  {
    type: 'drumroll',
    label: 'Drumroll & Crash',
    emoji: '🥁',
    description: 'Ketegangan sebelum pengumuman / skor',
    color: 'from-indigo-500/20 to-blue-500/20 hover:border-indigo-400 border-indigo-500/40 text-indigo-300',
  },
  {
    type: 'chime',
    label: 'Ting Ting (Chime)',
    emoji: '🔔',
    description: 'Panggilan perhatian pelanggan',
    color: 'from-cyan-500/20 to-sky-500/20 hover:border-cyan-400 border-cyan-500/40 text-cyan-300',
  },
];

export const SoundBoardModal: React.FC<SoundBoardModalProps> = ({
  isOpen,
  onClose,
  onTriggerSound,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎛️</span>
            <div>
              <h2 className="text-lg font-bold text-white">Soundboard FX Kafe</h2>
              <p className="text-xs text-slate-400">
                Suara otomatis terdengar di Dasbor dan Layar Proyektor
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOUND_ITEMS.map((item) => (
            <button
              key={item.type}
              onClick={() => onTriggerSound(item.type)}
              className={`p-4 rounded-xl border bg-gradient-to-br text-left transition-all active:scale-95 flex items-start gap-3 shadow-md ${item.color}`}
            >
              <span className="text-3xl">{item.emoji}</span>
              <div>
                <div className="font-bold text-sm text-white">{item.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
