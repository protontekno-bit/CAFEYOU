import React from 'react';
import { ScreenIcon } from '../icons/Icons';

export const PlayerPlaceholder: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 bg-black">
      <ScreenIcon className="w-12 h-12 text-slate-500 mb-2" />
      <p className="text-xl mt-2 text-white font-medium">Layar Utama Proyektor</p>
      <p className="text-sm mt-2 text-slate-400">Pilih lagu dari Dasbor Operator</p>
      <p className="text-xs text-yellow-500 mt-8 opacity-70 border border-yellow-500/30 p-3 bg-yellow-500/5 rounded-lg max-w-xs text-center">
        Untuk mengizinkan Autoplay Browser, klik 1x di mana saja pada layar ini terlebih dahulu.
      </p>
    </div>
  );
};
