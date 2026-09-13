import React, { useState, useEffect } from 'react';
import { LockIcon } from '../../icons/Icons';
import {
  loadOperatorCredentials,
  verifyPassword,
  saveOperatorCredentials,
} from '../../../utils/credentials';

interface SettingsSecurityTabProps {
  onClose: () => void;
  onPasswordChangedLogout?: () => void;
}

export const SettingsSecurityTab: React.FC<SettingsSecurityTabProps> = ({
  onClose,
  onPasswordChangedLogout,
}) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [newUsername, setNewUsername] = useState('operator');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isPassLoading, setIsPassLoading] = useState(false);

  useEffect(() => {
    loadOperatorCredentials().then((creds) => {
      if (creds?.username) setNewUsername(creds.username);
    });
  }, []);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    const oldP = oldPass.trim();
    const newP = newPass.trim();
    const confP = confirmPass.trim();
    const u = newUsername.trim() || 'operator';

    if (!oldP || !newP || !confP) {
      setPassError('Semua kolom password wajib diisi.');
      return;
    }
    if (newP.length < 6) {
      setPassError('Password baru minimal 6 karakter.');
      return;
    }
    if (newP !== confP) {
      setPassError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsPassLoading(true);
    try {
      const currentCreds = await loadOperatorCredentials();
      const isValid = verifyPassword(oldP, currentCreds.passwordHash);
      if (!isValid) {
        setPassError('Password lama tidak sesuai.');
        setIsPassLoading(false);
        return;
      }

      await saveOperatorCredentials(u, newP);
      setPassSuccess('Password berhasil diubah! Sistem akan logout dalam 2 detik...');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');

      setTimeout(() => {
        onClose();
        if (onPasswordChangedLogout) onPasswordChangedLogout();
      }, 2000);
    } catch {
      setPassError('Gagal menyimpan password. Silakan coba lagi.');
    } finally {
      setIsPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>🔑 Keamanan & Password Operator</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Ganti username dan password login dasbor operator untuk mencegah sabotase atau akses tidak sah.
        </p>
      </div>

      <form onSubmit={handleSavePassword} className="space-y-4">
        {passError && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-semibold flex items-center gap-2">
            <span>⚠️ {passError}</span>
          </div>
        )}
        {passSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <span>✅ {passSuccess}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Username Operator:</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="operator"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Password Lama saat ini:</label>
          <input
            type="password"
            value={oldPass}
            onChange={(e) => setOldPass(e.target.value)}
            placeholder="Masukkan password lama"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Password Baru:</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Konfirmasi Password Baru:</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 leading-relaxed">
          💡 <strong>Catatan Keamanan:</strong> Setelah password berhasil diubah, sistem akan otomatis logout dan mewajibkan login ulang dengan password baru.
        </div>

        <button
          type="submit"
          disabled={isPassLoading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <LockIcon className="w-3.5 h-3.5" />
          <span>{isPassLoading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
        </button>
      </form>
    </div>
  );
};
