import React, { useState, useEffect } from 'react';
import { LockIcon } from '../../icons/Icons';
import { CafeSettings } from '../../../types';
import { DEFAULT_CAFE_SETTINGS } from '../../../constants/karaoke';
import {
  loadOperatorCredentials,
  verifyPassword,
  saveOperatorCredentials,
} from '../../../utils/credentials';

interface SettingsSecurityTabProps {
  onClose: () => void;
  onPasswordChangedLogout?: () => void;
  cafeSettings?: CafeSettings;
  onUpdateCafeSettings?: (settings: CafeSettings) => void;
}

export const SettingsSecurityTab: React.FC<SettingsSecurityTabProps> = ({
  onClose,
  onPasswordChangedLogout,
  cafeSettings,
  onUpdateCafeSettings,
}) => {
  /* ── 1. State: Password Master Operator ── */
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [newUsername, setNewUsername] = useState('operator');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isPassLoading, setIsPassLoading] = useState(false);

  /* ── 2. State: PIN Kasir (POS) ── */
  const [posPin, setPosPin] = useState(cafeSettings?.posPassword || '1234');
  const [posSavedMsg, setPosSavedMsg] = useState(false);

  /* ── 3. State: PIN Dapur (Kitchen KDS) ── */
  const [kitchenPin, setKitchenPin] = useState(
    cafeSettings?.kitchenPassword || cafeSettings?.posPassword || '1234'
  );
  const [kitchenSavedMsg, setKitchenSavedMsg] = useState(false);

  useEffect(() => {
    loadOperatorCredentials().then((creds) => {
      if (creds?.username) setNewUsername(creds.username);
    });
  }, []);

  useEffect(() => {
    if (cafeSettings) {
      setPosPin(cafeSettings.posPassword || '1234');
      setKitchenPin(cafeSettings.kitchenPassword || cafeSettings.posPassword || '1234');
    }
  }, [cafeSettings]);

  /* ── Handler: Simpan Password Master Operator ── */
  const handleSaveOperatorPassword = async (e: React.FormEvent) => {
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
      const isValid = await verifyPassword(oldP, currentCreds.passwordHash);
      if (!isValid) {
        setPassError('Password lama tidak sesuai.');
        setIsPassLoading(false);
        return;
      }

      await saveOperatorCredentials(u, newP);
      setPassSuccess('Password Operator berhasil diubah! Sistem akan logout dalam 2 detik...');
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

  /* ── Handler: Simpan PIN Kasir (POS) ── */
  const handleSavePosPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCafeSettings) return;
    const cleanPin = posPin.trim() || '1234';
    try {
      const raw = localStorage.getItem('cafeyou_role_passwords');
      const cur = raw ? JSON.parse(raw) : {};
      cur.posPassword = cleanPin;
      localStorage.setItem('cafeyou_role_passwords', JSON.stringify(cur));
      sessionStorage.removeItem('cafeyou_pos_auth');
      sessionStorage.removeItem('cafeyou_pos_auth_token');
    } catch {}
    onUpdateCafeSettings({
      ...(cafeSettings || DEFAULT_CAFE_SETTINGS),
      posPassword: cleanPin,
    });
    setPosSavedMsg(true);
    setTimeout(() => setPosSavedMsg(false), 2500);
  };

  /* ── Handler: Simpan PIN Dapur (Kitchen KDS) ── */
  const handleSaveKitchenPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCafeSettings) return;
    const cleanPin = kitchenPin.trim() || '1234';
    try {
      const raw = localStorage.getItem('cafeyou_role_passwords');
      const cur = raw ? JSON.parse(raw) : {};
      cur.kitchenPassword = cleanPin;
      localStorage.setItem('cafeyou_role_passwords', JSON.stringify(cur));
      sessionStorage.removeItem('cafeyou_kitchen_auth_token');
    } catch {}
    onUpdateCafeSettings({
      ...(cafeSettings || DEFAULT_CAFE_SETTINGS),
      kitchenPassword: cleanPin,
    });
    setKitchenSavedMsg(true);
    setTimeout(() => setKitchenSavedMsg(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div>
        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
          <span>🔑 Pusat Keamanan & Hak Akses Akun</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Kelola seluruh kredensial login peran kafe (Operator, Kasir, dan Dapur) dalam satu pintu terpusat demi ketertiban dan pencegahan manipulasi staf.
        </p>
      </div>

      {/* Banner Kebijakan Keamanan */}
      <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
        <span className="text-base shrink-0">🛡️</span>
        <p className="text-[11px] text-indigo-200 leading-relaxed">
          <strong>Kebijakan Hak Akses Terpusat:</strong> Pegawai kasir dan staf dapur tidak diizinkan mengubah password login mereka sendiri. Semua pergantian akses wajib diatur melalui dasbor operator ini.
        </p>
      </div>

      {/* SEKSI 1: Akun Master Operator Karaoke */}
      <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
          <span>👑</span>
          <span>1. Akun Master Operator (Kontrol Utama)</span>
        </div>

        <form onSubmit={handleSaveOperatorPassword} className="space-y-3.5">
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

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Username Operator:</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="operator"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Password Lama saat ini:</label>
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Masukkan password lama"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Password Baru:</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Konfirmasi Password Baru:</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPassLoading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <LockIcon className="w-3.5 h-3.5" />
            <span>{isPassLoading ? 'Menyimpan...' : 'Perbarui Password Operator'}</span>
          </button>
        </form>
      </div>

      {/* SEKSI 2: PIN Workstation Kasir (POS) */}
      <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <span>🍽️</span>
          <span>2. PIN Akses Workstation Kasir (POS)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Digunakan staf kasir untuk membuka dasbor pembayaran, billing meja, dan laporan uang (<code>#/pos</code>).
        </p>

        <form onSubmit={handleSavePosPin} className="flex items-center gap-3 pt-1">
          <input
            type="text"
            value={posPin}
            onChange={(e) => setPosPin(e.target.value)}
            placeholder="1234"
            className="w-40 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-center text-sm font-mono tracking-widest text-amber-300 font-bold focus:outline-none focus:border-amber-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs rounded-xl border border-amber-500/40 transition-all active:scale-95 cursor-pointer"
          >
            Simpan PIN Kasir
          </button>
          {posSavedMsg && (
            <span className="text-xs text-emerald-400 font-bold animate-fadeIn">Tersimpan ke Cloud! ✓</span>
          )}
        </form>
      </div>

      {/* SEKSI 3: PIN Workstation Dapur & Bar (Kitchen KDS) */}
      <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <span>👨‍🍳</span>
          <span>3. PIN Akses Workstation Dapur (Kitchen & Bar KDS)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Digunakan koki dan barista untuk memantau tiket pesanan masuk (<code>#/kitchen</code>) tanpa memiliki hak melihat laporan keuangan kasir.
        </p>

        <form onSubmit={handleSaveKitchenPin} className="flex items-center gap-3 pt-1">
          <input
            type="text"
            value={kitchenPin}
            onChange={(e) => setKitchenPin(e.target.value)}
            placeholder="1234"
            className="w-40 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-center text-sm font-mono tracking-widest text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs rounded-xl border border-emerald-500/40 transition-all active:scale-95 cursor-pointer"
          >
            Simpan PIN Dapur
          </button>
          {kitchenSavedMsg && (
            <span className="text-xs text-emerald-400 font-bold animate-fadeIn">Tersimpan ke Cloud! ✓</span>
          )}
        </form>
      </div>
    </div>
  );
};
