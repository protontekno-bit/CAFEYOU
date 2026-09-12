import React, { useState } from 'react';
import { LockIcon, CheckIcon } from '../icons/Icons';
import { loadOperatorCredentials, verifyPassword } from '../../utils/credentials';

interface OperatorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export const OperatorLoginModal: React.FC<OperatorLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  if (!isOpen) return null;

  const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;
  const lockoutRemaining = isLocked
    ? Math.ceil((lockoutUntil! - Date.now()) / 1000)
    : 0;

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
          setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
          setErrorMsg(`Terlalu banyak percobaan. Coba lagi dalam ${LOCKOUT_SECONDS} detik.`);
        } else {
          setErrorMsg(
            `Password salah. ${MAX_ATTEMPTS - newAttempts} percobaan tersisa.`
          );
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setErrorMsg(null);
      setFailedAttempts(0);

      try {
        sessionStorage.setItem(
          'cafeyou_operator_auth',
          JSON.stringify({ username: u, loggedAt: Date.now() })
        );
      } catch {}

      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 1000);
    } catch {
      setErrorMsg('Terjadi kesalahan, silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* 3D Neumorphic Circle Card */}
      <div className="relative w-96 h-96 max-w-[92vw] max-h-[92vw] rounded-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-700/60 shadow-[20px_20px_40px_rgba(0,0,0,0.8),-12px_-12px_28px_rgba(51,65,85,0.3)] flex flex-col items-center justify-center p-6 text-center transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-8 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors z-20 text-sm"
        >
          ✕
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
              <CheckIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-emerald-300">Akses Diberikan!</h3>
            <p className="text-xs text-slate-400">Membuka Dasbor Operator...</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="w-4/5 flex flex-col gap-2.5 z-10">
            <div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-wider flex items-center justify-center gap-1 mb-0.5">
                <LockIcon className="w-3 h-3 text-blue-400" />
                <span>OPERATOR GATE</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">SIGN IN</h2>
              <div className="text-xs font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Karaoke CAFEYOU
              </div>
            </div>

            <div className="flex items-center w-full bg-slate-950/90 border border-slate-800 rounded-full px-4 py-2.5 shadow-inner focus-within:border-blue-500 transition-all">
              <span className="text-slate-500 text-xs mr-2.5">👤</span>
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

            <div className="flex items-center w-full bg-slate-950/90 border border-slate-800 rounded-full px-4 py-2.5 shadow-inner focus-within:border-blue-500 transition-all">
              <span className="text-slate-500 text-xs mr-2.5">🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
                placeholder="Password"
                disabled={isLocked || isLoading}
                autoComplete="current-password"
                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-600 font-medium disabled:opacity-50"
              />
            </div>

            {errorMsg && (
              <div className={`text-[10px] font-semibold py-1 px-2 rounded-lg -my-1 text-center ${isLocked ? 'bg-red-900/40 border border-red-700/50 text-red-300' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {isLocked ? `🔒 Terkunci ${lockoutRemaining}s` : errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked || isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memverifikasi...' : isLocked ? `🔒 Terkunci (${lockoutRemaining}s)` : 'Masuk ke Dasbor'}
            </button>

            <a
              href="https://wa.me/6282256657700?text=Halo%20AuraCore%20Support,%20saya%20membutuhkan%20bantuan%20mengenai%20Login%20Operator%20CAFEYOU%20Karaoke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center justify-center gap-1 -mt-0.5 hover:underline"
            >
              <span>💬 Butuh Bantuan? WA: 082256657700</span>
            </a>
          </form>
        )}
      </div>
    </div>
  );
};
