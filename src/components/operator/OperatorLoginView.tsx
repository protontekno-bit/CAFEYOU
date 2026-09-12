import React, { useState, useEffect } from 'react';
import { LockIcon, CheckIcon, BackIcon } from '../icons/Icons';
import { DeveloperFooter } from '../common/DeveloperFooter';
import {
  loadOperatorCredentials,
  verifyPassword,
  DEFAULT_PASSWORD_PLAIN,
} from '../../utils/credentials';

interface OperatorLoginViewProps {
  onLoginSuccess: (user: { username: string }) => void;
  onBack?: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export const OperatorLoginView: React.FC<OperatorLoginViewProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Countdown timer untuk lockout
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutUntil(null);
        setCountdown(0);
        setFailedAttempts(0);
        setErrorMsg(null);
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Cek apakah ini login pertama (belum ada credentials tersimpan)
  useEffect(() => {
    const raw = localStorage.getItem('cafeyou_op_credentials');
    if (!raw) setIsFirstLogin(true);
  }, []);

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;

    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setErrorMsg('Silakan isi Username dan Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const creds = await loadOperatorCredentials();
      const isValid = verifyPassword(p, creds.passwordHash);

      if (!isValid) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_SECONDS * 1000;
          setLockoutUntil(until);
          setCountdown(LOCKOUT_SECONDS);
          setErrorMsg(`Terlalu banyak percobaan gagal. Coba lagi dalam ${LOCKOUT_SECONDS} detik.`);
        } else {
          setErrorMsg(
            `Password salah. ${MAX_ATTEMPTS - newAttempts} percobaan tersisa sebelum terkunci.`
          );
        }
        setIsLoading(false);
        return;
      }

      // Login berhasil
      setIsSuccess(true);
      setErrorMsg(null);
      setFailedAttempts(0);

      const authData = { username: u, loggedAt: Date.now() };
      try {
        sessionStorage.setItem('cafeyou_operator_auth', JSON.stringify(authData));
        localStorage.setItem('cafeyou_operator_auth', JSON.stringify(authData));
      } catch {}

      setTimeout(() => {
        onLoginSuccess(authData);
      }, 900);
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat memverifikasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden select-none">
      {/* Floating Animated Musical Background Notes */}
      <div className="absolute top-[12%] left-[15%] text-pink-500/10 text-6xl pointer-events-none animate-pulse">
        🎵
      </div>
      <div className="absolute top-[68%] right-[12%] text-blue-500/10 text-5xl pointer-events-none animate-bounce">
        🎤
      </div>
      <div className="absolute bottom-[12%] left-[18%] text-emerald-500/10 text-5xl pointer-events-none animate-pulse">
        💿
      </div>
      <div className="absolute top-[25%] right-[20%] text-amber-500/10 text-4xl pointer-events-none animate-bounce">
        🎧
      </div>

      {/* Top Back Button */}
      {onBack && (
        <div className="absolute top-6 left-6 z-30">
          <button
            onClick={onBack}
            className="px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 backdrop-blur-md flex items-center gap-2 transition-all shadow-lg"
          >
            <BackIcon className="w-4 h-4" />
            <span>Menu Utama</span>
          </button>
        </div>
      )}

      {/* 3D Neumorphism Circle Login Card */}
      <div className="relative w-[440px] h-[440px] max-w-[92vw] max-h-[92vw] rounded-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-700/60 shadow-[22px_22px_50px_rgba(0,0,0,0.85),-18px_-18px_44px_rgba(51,65,85,0.3)] flex flex-col items-center justify-center p-8 text-center transition-all z-10">
        {isSuccess ? (
          /* Success Screen */
          <div className="flex flex-col items-center justify-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600/30 to-teal-900/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/20">
              <CheckIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-emerald-300">Akses Diberikan!</h3>
            <p className="text-xs text-slate-400 font-medium">Membuka Dasbor Operator...</p>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleLogin} className="w-[76%] max-w-[290px] flex flex-col gap-3 z-10 -mt-1">
            <div>
              <div className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-0.5">
                <LockIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>OPERATOR SYSTEM</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">SIGN IN</h2>
              <div className="text-xs font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Karaoke CAFEYOU
              </div>
            </div>

            {/* Username */}
            <div className={`flex items-center w-full bg-slate-950/90 border rounded-full px-3.5 py-2 shadow-inner transition-all ${isLocked ? 'border-red-800/60' : 'border-slate-800 focus-within:border-blue-500'}`}>
              <span className="text-slate-500 text-xs mr-2">👤</span>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (errorMsg) setErrorMsg(null); }}
                placeholder="Username"
                disabled={isLocked || isLoading}
                autoComplete="username"
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-600 font-medium disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className={`flex items-center w-full bg-slate-950/90 border rounded-full px-3.5 py-2 shadow-inner transition-all ${isLocked ? 'border-red-800/60' : 'border-slate-800 focus-within:border-blue-500'}`}>
              <span className="text-slate-500 text-xs mr-2">🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
                placeholder="Password / PIN"
                disabled={isLocked || isLoading}
                autoComplete="current-password"
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-600 font-medium disabled:opacity-50"
              />
            </div>

            {/* Error / Lockout Message */}
            {errorMsg && (
              <div className={`text-[10px] font-semibold py-1.5 px-2.5 rounded-lg -my-0.5 text-center ${isLocked ? 'bg-red-900/40 border border-red-700/50 text-red-300' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {isLocked ? `🔒 Terkunci — Coba lagi dalam ${countdown}s` : errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLocked || isLoading}
              className="w-full max-w-[240px] mx-auto mt-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Memverifikasi...</span>
              ) : isLocked ? (
                <span>🔒 Terkunci ({countdown}s)</span>
              ) : (
                <>
                  <span>Masuk ke Dasbor</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Info login pertama kali */}
      {isFirstLogin && !isSuccess && (
        <div className="mt-5 text-center text-[11px] text-amber-400/80 bg-amber-950/30 border border-amber-700/30 rounded-xl px-4 py-2 z-10 max-w-xs">
          🔑 Login pertama: Password default <strong className="text-amber-300">{DEFAULT_PASSWORD_PLAIN}</strong>
          <br />
          <span className="text-slate-400">Segera ganti password setelah masuk.</span>
        </div>
      )}

      <DeveloperFooter compact className="mt-4" />
    </div>
  );
};
