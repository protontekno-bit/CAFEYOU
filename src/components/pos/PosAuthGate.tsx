import React from 'react';
import { DeveloperFooter } from '../common/DeveloperFooter';

export interface PosAuthGateProps {
  authPin: string;
  setAuthPin: (pin: string) => void;
  authError: string | null;
  onSubmitLogin: (e: React.FormEvent) => void;
  onBackToLanding?: () => void;
}

export const PosAuthGate: React.FC<PosAuthGateProps> = ({
  authPin,
  setAuthPin,
  authError,
  onSubmitLogin,
  onBackToLanding,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-4 font-sans text-slate-200 selection:bg-amber-500 selection:text-slate-950">
      <div className="max-w-md w-full my-auto bg-slate-900/90 border border-amber-500/30 p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/10">
          🍽️
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Akses Kasir & Dapur (POS)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Masukkan PIN / Password Operator untuk membuka dashboard operasional kafe.
          </p>
        </div>

        <form onSubmit={onSubmitLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              PIN / Password Kasir:
            </label>
            <input
              type="password"
              value={authPin}
              onChange={(e) => setAuthPin(e.target.value)}
              placeholder="Masukkan PIN..."
              autoFocus
              className="w-full px-4 py-3 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white font-mono text-center tracking-widest text-lg outline-none transition-all shadow-inner"
            />
            {authError && (
              <p className="text-xs font-bold text-red-400 mt-2 text-center animate-shake">
                {authError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
          >
            Buka Dasbor Kasir ➔
          </button>

          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors text-center"
            >
              ← Kembali ke Menu Awal
            </button>
          )}
        </form>
      </div>
      <DeveloperFooter className="w-full" />
    </div>
  );
};
