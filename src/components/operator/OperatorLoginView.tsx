import React, { useState } from 'react';
import { LockIcon, CheckIcon, BackIcon } from '../icons/Icons';

interface OperatorLoginViewProps {
  onLoginSuccess: (user: { username: string }) => void;
  onBack?: () => void;
}

export const OperatorLoginView: React.FC<OperatorLoginViewProps> = ({
  onLoginSuccess,
  onBack,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const p = password.trim();

    if (!u || !p) {
      setErrorMsg('Silakan isi Username dan Password / PIN.');
      return;
    }

    const validUsers = ['admin', 'operator', 'kasir', 'cafeyou', 'owner'];
    const isValidUser = validUsers.includes(u.toLowerCase()) || u.length >= 3;
    const isValidPass =
      p === '1234' || p === 'admin' || p === 'cafeyou' || p === 'kasir' || p.length >= 4;

    if (!isValidUser || !isValidPass) {
      setErrorMsg('Username atau Password tidak cocok.');
      return;
    }

    setIsSuccess(true);
    setErrorMsg(null);

    const authData = { username: u, loggedAt: Date.now() };
    try {
      sessionStorage.setItem('cafeyou_operator_auth', JSON.stringify(authData));
    } catch (err) {
      console.warn('SessionStorage error:', err);
    }

    setTimeout(() => {
      onLoginSuccess(authData);
    }, 900);
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
      <div className="relative w-[380px] h-[380px] max-w-[90vw] max-h-[90vw] rounded-full bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-700/60 shadow-[20px_20px_45px_rgba(0,0,0,0.85),-14px_-14px_30px_rgba(51,65,85,0.3)] flex flex-col items-center justify-center p-8 text-center transition-all z-10">
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
          <form onSubmit={handleLogin} className="w-[82%] flex flex-col gap-3 z-10">
            <div>
              <div className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center justify-center gap-1 mb-0.5">
                <LockIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>OPERATOR SYSTEM</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">SIGN IN</h2>
              <div className="text-xs font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Karaoke CAFEYOU
              </div>
            </div>

            <div className="relative w-full">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Username (admin / kasir)"
                className="w-full bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-500 shadow-inner outline-none focus:border-blue-500 transition-all font-medium text-center"
              />
            </div>

            <div className="relative w-full">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Password / PIN (1234)"
                className="w-full bg-slate-950 border border-slate-800 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-500 shadow-inner outline-none focus:border-blue-500 transition-all font-medium text-center"
              />
            </div>

            {errorMsg && (
              <div className="text-[10px] text-red-400 font-semibold bg-red-500/10 border border-red-500/30 py-1 px-2 rounded-lg -my-0.5 animate-shake">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-full shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Masuk ke Dasbor</span>
              <span>→</span>
            </button>
          </form>
        )}
      </div>

      {/* Info helper */}
      <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
        <div>Default Login: Username <strong>admin</strong> | Password <strong>1234</strong></div>
      </div>
    </div>
  );
};
