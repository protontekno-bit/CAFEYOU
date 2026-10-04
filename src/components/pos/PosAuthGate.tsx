import React, { useState, useEffect, useRef } from 'react';
import { DeveloperFooter } from '../common/DeveloperFooter';

export interface PosAuthGateProps {
  authPin: string;
  setAuthPin: (pin: string) => void;
  authError: string | null;
  onSubmitLogin: (e?: React.FormEvent) => void;
  onBackToLanding?: () => void;
  cafeName?: string;
  currentTime?: string;
  isCloudConnected?: boolean;
  title?: string;
  description?: string;
  icon?: string;
  submitLabel?: string;
  roleName?: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export const PosAuthGate: React.FC<PosAuthGateProps> = ({
  authPin,
  setAuthPin,
  authError,
  onSubmitLogin,
  onBackToLanding,
  cafeName,
  currentTime,
  isCloudConnected,
  title = 'Akses Kasir (POS)',
  description = 'Masukkan PIN Kasir untuk membuka dasbor operasional kafe.',
  icon = '💵',
  submitLabel = 'Buka Dasbor Kasir ➔',
  roleName = 'Kasir',
}) => {
  const [showPin, setShowPin] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lockoutKey = `cafeyou_lockout_${roleName.toLowerCase()}`;

  // Keyboard shortcut: Escape untuk kembali ke beranda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBackToLanding) {
        onBackToLanding();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBackToLanding]);

  // State Lockout Anti-Brute Force
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(lockoutKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.until && Date.now() < parsed.until) return parsed.attempts || 0;
      }
    } catch {}
    return 0;
  });

  const [lockoutUntil, setLockoutUntil] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(lockoutKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.until && Date.now() < parsed.until) return parsed.until;
      }
    } catch {}
    return null;
  });

  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Pantau Timer Penguncian
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setFailedAttempts(0);
        try {
          localStorage.removeItem(lockoutKey);
        } catch {}
      }
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil, lockoutKey]);

  // Pantau authError dari parent untuk tracking gagal login
  const prevErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (authError && authError !== prevErrorRef.current) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockoutUntil(until);
        try {
          localStorage.setItem(lockoutKey, JSON.stringify({ attempts: newAttempts, until }));
        } catch {}
      } else {
        try {
          localStorage.setItem(lockoutKey, JSON.stringify({ attempts: newAttempts, until: null }));
        } catch {}
      }
      setAuthPin('');
    }
    prevErrorRef.current = authError;
  }, [authError, failedAttempts, lockoutKey, setAuthPin]);

  const isLocked = lockoutRemaining > 0;

  // Handler Numpad Virtual
  const handleKeypadPress = (val: string) => {
    if (isLocked) return;
    if (authPin.length < 8) {
      setAuthPin(authPin + val);
    }
    inputRef.current?.focus();
  };

  const handleClear = () => {
    if (isLocked) return;
    setAuthPin('');
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    if (isLocked) return;
    setAuthPin(authPin.slice(0, -1));
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked) return;
    if (!authPin.trim()) return;
    onSubmitLogin(e);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-3 sm:p-4 font-sans text-slate-200 selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP STATUS & NAVIGATION BAR */}
      <header className="w-full max-w-4xl flex items-center justify-between gap-3 px-2 py-1.5 z-10">
        {/* Tombol Kembali ke Beranda */}
        {onBackToLanding ? (
          <button
            type="button"
            onClick={onBackToLanding}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Kembali ke Beranda Utama (Esc)"
          >
            <span>←</span>
            <span>Beranda</span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">[Esc]</span>
          </button>
        ) : (
          <div />
        )}

        {/* Info Konteks Kafe, Jam & Cloud */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1 rounded-xl">
          <span className="text-white font-black">{cafeName || 'CAFEYOU'}</span>
          {currentTime && (
            <>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-amber-400 font-bold">{currentTime}</span>
            </>
          )}
          {typeof isCloudConnected === 'boolean' && (
            <>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isCloudConnected ? 'text-emerald-400' : 'text-amber-400 font-mono'}>
                  {isCloudConnected ? 'Sync' : 'Lokal'}
                </span>
              </span>
            </>
          )}
        </div>

        <div />
      </header>

      {/* 2. CARD MODAL UTAMA */}
      <div className="max-w-sm w-full my-auto bg-slate-900/90 border border-slate-800 p-6 sm:p-7 rounded-3xl shadow-2xl backdrop-blur-xl text-center space-y-4 animate-scaleUp">
        {/* Header Icon & Title */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/10">
          {icon}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        </div>

        {/* Input PIN Display */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={authPin}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setAuthPin(numericOnly);
              }}
              disabled={isLocked}
              placeholder="••••"
              autoFocus
              className="w-full px-4 py-3 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-2xl text-white font-mono text-center tracking-[0.4em] text-2xl outline-none transition-all shadow-inner disabled:opacity-50"
            />
            {/* Toggle Show/Hide PIN */}
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              tabIndex={-1}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors text-sm"
              title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
            >
              {showPin ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Feedback Error / Lockout Banner */}
          {isLocked ? (
            <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded-xl text-xs font-bold text-red-300 animate-fadeIn">
              🔒 Terlalu banyak percobaan. Terkunci {lockoutRemaining} detik.
            </div>
          ) : authError ? (
            <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 text-center animate-shake">
              {authError} {failedAttempts > 0 && `(${MAX_ATTEMPTS - failedAttempts} kesempatan tersisa)`}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">Masukkan 4–6 digit angka akses {roleName}</p>
          )}

          {/* Virtual Numpad 0-9 untuk Layar Sentuh Tablet / POS */}
          <div className="grid grid-cols-3 gap-2 pt-1 select-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isLocked}
                onClick={() => handleKeypadPress(num.toString())}
                className="py-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 active:scale-95 text-white font-mono font-bold text-lg rounded-2xl shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={isLocked || !authPin}
              onClick={handleClear}
              className="py-3 bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 active:scale-95 text-red-300 font-bold text-xs rounded-2xl shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              CLEAR
            </button>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleKeypadPress('0')}
              className="py-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 active:scale-95 text-white font-mono font-bold text-lg rounded-2xl shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              type="button"
              disabled={isLocked || !authPin}
              onClick={handleBackspace}
              className="py-3 bg-slate-850 hover:bg-slate-800 border border-slate-800 active:scale-95 text-amber-400 font-bold text-lg rounded-2xl shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ⌫
            </button>
          </div>

          {/* Tombol Submit Utama */}
          <button
            type="submit"
            disabled={isLocked || !authPin.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLocked ? `🔒 Terkunci (${lockoutRemaining}s)` : submitLabel}
          </button>


          {/* Catatan Bantuan Lupa PIN */}
          <div className="pt-1 text-[10px] text-slate-500 leading-relaxed">
            ℹ️ Lupa PIN {roleName}? Hubungi Pemilik / Operator Kafe untuk mereset PIN melalui Dasbor Operator.
          </div>
        </form>
      </div>

      <DeveloperFooter compact className="w-full max-w-sm" />
    </div>
  );
};
