import React from 'react';
import { MenuItem } from '../../../types';

interface SettingsMenuTabProps {
  menuItems?: MenuItem[];
  onAddMenuItem?: (item: Omit<MenuItem, 'id'>) => Promise<void> | void;
  onUpdateMenuItem?: (item: MenuItem) => Promise<void> | void;
  onDeleteMenuItem?: (id: string) => Promise<void> | void;
  onResetMenuToDefault?: () => Promise<void> | void;
}

export const SettingsMenuTab: React.FC<SettingsMenuTabProps> = ({
  menuItems = [],
}) => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>🍽️ Katalog Menu F&B & Pengaturan Kasir</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Pengelolaan katalog makanan, minuman, harga, stok habis, serta tarif PB1 & PIN Kasir kini dikelola terpusat di Dasbor Kasir & Dapur (POS).
        </p>
      </div>

      {/* Handoff Gateway Card */}
      <div className="p-6 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-900 border border-amber-500/30 rounded-3xl space-y-5 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/25 shrink-0 text-slate-950 font-black">
            🍽️
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white">
              Workstation Kasir & Dapur (POS)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Untuk memastikan operasional berjalan akurat tanpa saling mengganggu, seluruh kontrol katalog menu F&B, stok habis (<em>Sold Out</em> 1-sentuhan), varian rasa/topping, pajak restoran (PB1), dan ubah PIN kasir dipusatkan pada layar POS.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚡</span> 1-Sentuhan Sold Out
            </div>
            <p className="text-[11px] text-slate-400">
              Staf kasir atau dapur dapat menandai menu habis seketika tanpa perlu membuka laptop operator karaoke.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>🧾</span> PB1 & PIN Kasir Mandiri
            </div>
            <p className="text-[11px] text-slate-400">
              Tarif pajak restoran (PB1) dan kata sandi shift kasir dapat diatur mandiri langsung dari meja kasir.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => window.open('#pos', '_blank')}
            className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Buka Dasbor Kasir & POS</span>
            <span>➔</span>
          </button>

          <div className="flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
            Total: {menuItems?.length || 0} Menu Terdaftar
          </div>
        </div>
      </div>
    </div>
  );
};
