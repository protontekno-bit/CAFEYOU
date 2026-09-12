import React, { useState } from 'react';
import {
  loadOperatorCredentials,
  verifyPassword,
  saveOperatorCredentials,
} from '../../utils/credentials';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // logout setelah ganti password
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const curr = currentPassword.trim();
    const newPass = newPassword.trim();
    const confirm = confirmPassword.trim();

    if (!curr || !newPass || !confirm) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }
    if (newPass.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (newPass !== confirm) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }
    if (newPass === curr) {
      setErrorMsg('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setIsLoading(true);
    try {
      const creds = await loadOperatorCredentials();
      if (!verifyPassword(curr, creds.passwordHash)) {
        setErrorMsg('Password saat ini salah.');
        setIsLoading(false);
        return;
      }

      await saveOperatorCredentials(creds.username, newPass);
      setSuccessMsg('✅ Password berhasil diperbarui! Anda akan di-logout otomatis...');

      setTimeout(() => {
        reset();
        onSuccess(); // trigger logout
      }, 2000);
    } catch (err) {
      setErrorMsg('Gagal menyimpan password baru. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
              🔑
            </div>
            <div>
              <h2 className="text-base font-black text-white">Ganti Password Operator</h2>
              <p className="text-xs text-slate-400">Perubahan berlaku segera & tersinkronisasi ke cloud</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Password Saat Ini */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
              🔒 Password Saat Ini
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setErrorMsg(null); }}
              placeholder="Masukkan password saat ini"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Password Baru */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
              🆕 Password Baru <span className="text-slate-500 font-normal">(min. 6 karakter)</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(null); }}
              placeholder="Password baru (min. 6 karakter)"
              autoComplete="new-password"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Konfirmasi */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">
              ✅ Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(null); }}
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              className={`w-full px-4 py-2.5 bg-slate-900 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                confirmPassword && confirmPassword !== newPassword
                  ? 'border-red-600 focus:ring-red-500'
                  : 'border-slate-700 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-red-400 mt-1">Password tidak cocok</p>
            )}
          </div>

          {/* Error / Success */}
          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-900/30 border border-red-700/50 rounded-xl px-3.5 py-2.5 font-medium">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-700/50 rounded-xl px-3.5 py-2.5 font-medium">
              {successMsg}
            </div>
          )}

          {/* Info */}
          <div className="text-[11px] text-slate-500 bg-slate-900/50 rounded-xl px-3 py-2 leading-relaxed">
            🔄 Setelah berhasil, Anda akan otomatis logout dan perlu login dengan password baru.
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Menyimpan...' : '🔑 Simpan Password Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
