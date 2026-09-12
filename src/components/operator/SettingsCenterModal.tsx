import React, { useState, useEffect } from 'react';
import { CafeSettings, Voucher, DailyPinConfig, SavedLibrarySong } from '../../types';
import { DEFAULT_CAFE_SETTINGS, QUICK_TABLES } from '../../constants/karaoke';
import { CheckIcon, TicketIcon, LockIcon } from '../icons/Icons';
import {
  loadOperatorCredentials,
  verifyPassword,
  saveOperatorCredentials,
} from '../../utils/credentials';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
} from '../../config/firebase';
import { DEVELOPER_INFO } from '../../constants/developer';

type SettingsTab =
  | 'cafe'
  | 'display'
  | 'tables'
  | 'vouchers'
  | 'library'
  | 'cloud'
  | 'security'
  | 'help';

interface SettingsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Cafe Settings
  cafeSettings: CafeSettings;
  onUpdateCafeSettings: (settings: CafeSettings) => void;
  // Running Text
  runningText?: string;
  onSaveRunningText: (text: string) => void;
  onOpenProjectorTab?: () => void;
  onOpenQrShare?: () => void;
  // Meja & Stiker
  tables?: string[];
  onAddTable?: (name: string) => void;
  onRemoveTable?: (name: string) => void;
  onResetTables?: () => void;
  onOpenTableQrModal?: () => void;
  // Voucher
  vouchers?: Record<string, Voucher>;
  dailyPin?: DailyPinConfig;
  onCreateVoucher?: (tableNumber: string, quota?: number) => Voucher;
  onRevokeVoucher?: (code: string) => void;
  onSetDailyPin?: (enabled: boolean, code: string) => void;
  onOpenVoucherModal?: () => void;
  // Library
  songLibrary?: Record<string, SavedLibrarySong>;
  onDeleteFromLibrary?: (videoId: string) => void;
  onClearLibrary?: () => void;
  autoSaveLibrary?: boolean;
  onToggleAutoSaveLibrary?: (enabled: boolean) => void;
  // Cloud
  isCloudConnected?: boolean;
  onOpenFirebaseConfig?: () => void;
  // Security
  onPasswordChangedLogout?: () => void;
  // Developer Help
  onOpenDeveloperHelpModal?: () => void;
}

export const SettingsCenterModal: React.FC<SettingsCenterModalProps> = ({
  isOpen,
  onClose,
  cafeSettings,
  onUpdateCafeSettings,
  runningText = '',
  onSaveRunningText,
  onOpenProjectorTab,
  tables,
  onAddTable,
  onRemoveTable,
  onResetTables,
  onOpenTableQrModal,
  vouchers = {},
  dailyPin,
  onCreateVoucher,
  onRevokeVoucher,
  onSetDailyPin,
  onOpenVoucherModal,
  songLibrary = {},
  onDeleteFromLibrary,
  onClearLibrary,
  autoSaveLibrary = true,
  onToggleAutoSaveLibrary,
  isCloudConnected = false,
  onPasswordChangedLogout,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('cafe');

  // State: Profil Kafe
  const [cafeName, setCafeName] = useState(cafeSettings?.name || DEFAULT_CAFE_SETTINGS.name);
  const [tagline, setTagline] = useState(cafeSettings?.tagline || '');
  const [welcomeMsg, setWelcomeMsg] = useState(cafeSettings?.welcomeMessage || '');
  const [wifiName, setWifiName] = useState(cafeSettings?.wifiName || '');
  const [wifiPassword, setWifiPassword] = useState(cafeSettings?.wifiPassword || '');
  const [isCafeSaved, setIsCafeSaved] = useState(false);

  // State: Running Text
  const [rtInput, setRtInput] = useState(runningText);
  const [isRtSaved, setIsRtSaved] = useState(false);

  // Dynamic Tables
  const activeTables = tables && tables.length > 0 ? tables : QUICK_TABLES;
  const [newTableName, setNewTableName] = useState('');
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableSuccess, setTableSuccess] = useState<string | null>(null);

  // State: Ganti Password
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [newUsername, setNewUsername] = useState('operator');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isPassLoading, setIsPassLoading] = useState(false);

  // State: Meja Preview
  const [previewTable, setPreviewTable] = useState(() => activeTables[0] || 'Meja 1');

  // State: Library Search
  const [librarySearch, setLibrarySearch] = useState('');

  // State: Daily Pin
  const [isDailyPinActive, setIsDailyPinActive] = useState(dailyPin?.enabled || false);
  const [dailyPinCode, setDailyPinCode] = useState(dailyPin?.code || '1234');
  const [isPinSaved, setIsPinSaved] = useState(false);

  // State: In-line Voucher Creator
  const [voucherTable, setVoucherTable] = useState(() => activeTables[0] || 'Meja 1');
  const [voucherQuota, setVoucherQuota] = useState(3);
  const [lastCreatedVoucher, setLastCreatedVoucher] = useState<Voucher | null>(null);

  // State: In-line Firebase Config
  const [fbApiKey, setFbApiKey] = useState('');
  const [fbDbUrl, setFbDbUrl] = useState('');
  const [fbProjectId, setFbProjectId] = useState('');
  const [fbAuthDomain, setFbAuthDomain] = useState('');
  const [fbStorageBucket, setFbStorageBucket] = useState('');
  const [fbAppId, setFbAppId] = useState('');
  const [fbStatusMsg, setFbStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCafeName(cafeSettings?.name || DEFAULT_CAFE_SETTINGS.name);
      setTagline(cafeSettings?.tagline || '');
      setWelcomeMsg(cafeSettings?.welcomeMessage || '');
      setWifiName(cafeSettings?.wifiName || '');
      setWifiPassword(cafeSettings?.wifiPassword || '');
      setIsCafeSaved(false);

      setRtInput(runningText);
      setIsRtSaved(false);

      setIsDailyPinActive(dailyPin?.enabled || false);
      setDailyPinCode(dailyPin?.code || '1234');

      loadOperatorCredentials().then((creds) => {
        if (creds?.username) setNewUsername(creds.username);
      });

      const storedFb = getStoredFirebaseConfig();
      if (storedFb) {
        setFbApiKey(storedFb.apiKey || '');
        setFbDbUrl(storedFb.databaseURL || '');
        setFbProjectId(storedFb.projectId || '');
        setFbAuthDomain(storedFb.authDomain || '');
        setFbStorageBucket(storedFb.storageBucket || '');
        setFbAppId(storedFb.appId || '');
      }
    }
  }, [isOpen, cafeSettings, runningText, dailyPin]);

  if (!isOpen) return null;

  // Handlers
  const handleSaveCafe = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCafeSettings({
      name: cafeName.trim() || 'CAFEYOU',
      tagline: tagline.trim(),
      welcomeMessage: welcomeMsg.trim(),
      wifiName: wifiName.trim(),
      wifiPassword: wifiPassword.trim(),
    });
    setIsCafeSaved(true);
    setTimeout(() => setIsCafeSaved(false), 2000);
  };

  const handleSaveRt = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRunningText(rtInput.trim());
    setIsRtSaved(true);
    setTimeout(() => setIsRtSaved(false), 2000);
  };

  // Handlers Pengelolaan Meja
  const handleAddTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTableError(null);
    setTableSuccess(null);
    const trimmed = newTableName.trim();
    if (!trimmed) {
      setTableError('Nama meja tidak boleh kosong.');
      return;
    }
    if (activeTables.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTableError(`Meja "${trimmed}" sudah ada dalam daftar.`);
      return;
    }
    if (onAddTable) {
      onAddTable(trimmed);
      setTableSuccess(`Meja "${trimmed}" berhasil ditambahkan!`);
      setNewTableName('');
      setPreviewTable(trimmed);
      setTimeout(() => setTableSuccess(null), 2500);
    }
  };

  const handleRemoveTableClick = (tableToRemove: string) => {
    if (activeTables.length <= 1) {
      alert('Minimal harus ada 1 meja aktif dalam sistem.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus "${tableToRemove}" dari sistem kafe?`)) {
      if (onRemoveTable) {
        onRemoveTable(tableToRemove);
        const remaining = activeTables.filter((t) => t !== tableToRemove);
        if (previewTable === tableToRemove) {
          setPreviewTable(remaining[0] || 'Meja 1');
        }
        if (voucherTable === tableToRemove) {
          setVoucherTable(remaining[0] || 'Meja 1');
        }
        setTableSuccess(`Meja "${tableToRemove}" telah dihapus.`);
        setTimeout(() => setTableSuccess(null), 2500);
      }
    }
  };

  const handleResetTablesClick = () => {
    if (confirm('Kembalikan daftar meja ke bawaan standar (Meja 1 s/d Meja 9)?')) {
      if (onResetTables) {
        onResetTables();
        setPreviewTable('Meja 1');
        setVoucherTable('Meja 1');
        setTableSuccess('Daftar meja berhasil direset ke pengaturan bawaan!');
        setTimeout(() => setTableSuccess(null), 2500);
      }
    }
  };

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

  const handleSavePin = () => {
    if (onSetDailyPin) {
      onSetDailyPin(isDailyPinActive, dailyPinCode.trim() || '1234');
      setIsPinSaved(true);
      setTimeout(() => setIsPinSaved(false), 2000);
    }
  };

  const handleCreateVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreateVoucher) {
      const v = onCreateVoucher(voucherTable, voucherQuota);
      setLastCreatedVoucher(v);
    }
  };

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbApiKey.trim() || !fbDbUrl.trim() || !fbProjectId.trim()) {
      setFbStatusMsg({ type: 'error', text: 'API Key, Database URL, dan Project ID wajib diisi.' });
      return;
    }
    saveFirebaseConfig({
      apiKey: fbApiKey.trim(),
      databaseURL: fbDbUrl.trim(),
      projectId: fbProjectId.trim(),
      authDomain: fbAuthDomain.trim(),
      storageBucket: fbStorageBucket.trim(),
      appId: fbAppId.trim(),
    });
    setFbStatusMsg({ type: 'success', text: 'Konfigurasi Firebase berhasil disimpan! Memuat ulang dalam 1 detik...' });
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleClearFirebase = () => {
    if (confirm('Apakah Anda yakin ingin menghapus konfigurasi Firebase dan beralih ke mode sinkron lokal?')) {
      clearFirebaseConfig();
      setFbApiKey('');
      setFbDbUrl('');
      setFbProjectId('');
      setFbAuthDomain('');
      setFbStorageBucket('');
      setFbAppId('');
      setFbStatusMsg({ type: 'info', text: 'Konfigurasi dibersihkan. Memuat ulang...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const filteredLibrary = Object.values(songLibrary).filter((s) => {
    if (!librarySearch.trim()) return true;
    const q = librarySearch.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q);
  });

  const activeVouchersList = Object.values(vouchers)
    .filter((v) => v.status === 'active')
    .sort((a, b) => b.createdAt - a.createdAt);

  // Base URL untuk QR Preview
  const baseUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `${baseUrl}#guest?table=${encodeURIComponent(previewTable)}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl h-[90vh] max-h-[820px] shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-scaleUp">
        {/* Tombol Tutup Silang */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm"
          title="Tutup Pengaturan"
        >
          ✕
        </button>

        {/* ============================================================ */}
        {/* SIDEBAR PANEL (KIRI)                                         */}
        {/* ============================================================ */}
        <div className="w-full md:w-64 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0 p-4">
          <div>
            {/* Header Sidebar */}
            <div className="flex items-center gap-3 px-2 py-3 mb-3 border-b border-slate-800/80">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 text-lg font-bold">
                ⚙️
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  PENGATURAN
                </h2>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <span>Pusat Kontrol Kafe</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
              </div>
            </div>

            {/* Menu List */}
            <nav className="space-y-1 overflow-x-auto md:overflow-x-visible flex md:flex-col pb-2 md:pb-0 custom-scrollbar">
              {[
                { id: 'cafe', icon: '🏪', label: 'Profil Kafe & Wi-Fi' },
                { id: 'display', icon: '📢', label: 'Layar TV & Running Text' },
                { id: 'tables', icon: '🪑', label: 'Meja & Stiker Barcode' },
                {
                  id: 'vouchers',
                  icon: '🎟️',
                  label: 'Voucher & PIN Tamu',
                  badge: activeVouchersList.length > 0 ? `${activeVouchersList.length}` : undefined,
                },
                {
                  id: 'library',
                  icon: '📚',
                  label: 'Database Koleksi Lagu',
                  badge: `${Object.keys(songLibrary).length}`,
                },
                {
                  id: 'cloud',
                  icon: '☁️',
                  label: 'Koneksi Cloud Firebase',
                  dot: isCloudConnected ? 'bg-emerald-400' : 'bg-amber-400',
                },
                { id: 'security', icon: '🔑', label: 'Keamanan Akun Operator' },
                { id: 'help', icon: '💬', label: 'Bantuan Pengembang' },
              ].map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as SettingsTab)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between gap-2.5 transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-blue-800/80 text-blue-200'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {item.dot && (
                      <span className={`w-2 h-2 rounded-full ${item.dot} ${isCloudConnected ? 'animate-pulse' : ''}`} />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer Sidebar */}
          <div className="hidden md:block pt-3 border-t border-slate-800/80 px-2 text-[10px] text-slate-500">
            <div className="flex items-center justify-between mb-1 font-semibold">
              <span>Status Sistem:</span>
              <span className={isCloudConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isCloudConnected ? 'Cloud Online' : 'Mode Lokal'}
              </span>
            </div>
            <div className="text-[9px] text-slate-600 truncate">
              {DEVELOPER_INFO.brandName} • v2.0
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTENT PANEL (KANAN)                                        */}
        {/* ============================================================ */}
        <div className="flex-1 bg-slate-900 p-5 sm:p-8 overflow-y-auto custom-scrollbar">
          {/* 1. TAB: PROFIL KAFE & WI-FI */}
          {activeTab === 'cafe' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>🏪 Profil & Identitas Kafe</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Pengaturan ini akan otomatis tampil di Layar Proyektor TV, Stiker Meja, dan Portal HP Tamu.
                </p>
              </div>

              <form onSubmit={handleSaveCafe} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Nama Kafe / Lounge:</label>
                    <input
                      type="text"
                      value={cafeName}
                      onChange={(e) => setCafeName(e.target.value)}
                      placeholder="CAFEYOU"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Slogan / Tagline:</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="Coffee & Eatery"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Pesan Sambutan:</label>
                  <input
                    type="text"
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    placeholder="Selamat Datang di CAFEYOU Karaoke Lounge"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <span>📶 Informasi Wi-Fi untuk Pelanggan</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Nama Wi-Fi (SSID):</label>
                      <input
                        type="text"
                        value={wifiName}
                        onChange={(e) => setWifiName(e.target.value)}
                        placeholder="CAFEYOU_Free_WiFi"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Password Wi-Fi:</label>
                      <input
                        type="text"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="karaokecafeyou"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  {isCafeSaved ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-emerald-300" />
                      <span>Berhasil Disimpan!</span>
                    </>
                  ) : (
                    <span>Simpan Profil Kafe</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 2. TAB: LAYAR TV & RUNNING TEXT */}
          {activeTab === 'display' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>📢 Layar TV & Running Text</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Atur teks pesan berjalan yang tayang di bagian bawah layar proyektor atau TV kafe.
                </p>
              </div>

              <form onSubmit={handleSaveRt} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Pesan Running Text:</label>
                  <textarea
                    rows={3}
                    value={rtInput}
                    onChange={(e) => setRtInput(e.target.value)}
                    placeholder="Tuliskan promo atau pesan untuk pelanggan..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                </div>

                {/* Preset Cepat */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400">Template Pesan Cepat:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Selamat Datang di CAFEYOU! • Pesan Makanan & Minuman di Kasir • Selamat Bernyanyi!',
                      '🎤 Promo Happy Hour Karaoke! Nikmati Diskon Menu Spesial Hari Ini!',
                      'Perhatian: Pesanan lagu ditutup 30 menit sebelum kafe tutup.',
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRtInput(preset)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-left transition-colors"
                      >
                        {preset.substring(0, 45)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                  >
                    {isRtSaved ? (
                      <>
                        <CheckIcon className="w-4 h-4 text-white" />
                        <span>Running Text Diperbarui!</span>
                      </>
                    ) : (
                      <span>Terapkan ke Layar TV</span>
                    )}
                  </button>

                  {onOpenProjectorTab && (
                    <button
                      type="button"
                      onClick={onOpenProjectorTab}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <span>Buka Tab Proyektor ↗</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* 3. TAB: MEJA & STIKER BARCODE */}
          {activeTab === 'tables' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>🪑 Pengelolaan Meja & Stiker QR</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Kelola daftar meja kafe Anda, tambah atau hapus meja sesuai tata letak ruangan, serta cetak stiker barcode QR untuk smartphone pelanggan.
                </p>
              </div>

              {/* Status Alert */}
              {tableSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <CheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{tableSuccess}</span>
                </div>
              )}
              {tableError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                  <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                  <span>{tableError}</span>
                </div>
              )}

              {/* SECTION A: FORM TAMBAH MEJA & DAFTAR MEJA */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>➕ Tambah Meja Baru</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetTablesClick}
                    className="text-[11px] text-slate-400 hover:text-amber-400 px-2.5 py-1 rounded-lg hover:bg-slate-850 transition-colors flex items-center gap-1 font-medium border border-transparent hover:border-slate-700"
                    title="Kembalikan daftar meja ke bawaan (Meja 1 s/d Meja 9)"
                  >
                    <span>↺ Reset ke Default</span>
                  </button>
                </div>

                <form onSubmit={handleAddTableSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Contoh: Meja 10, VIP 1, Outdoor 2, Bar A..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <span>+ Tambah</span>
                  </button>
                </form>

                {/* List Meja Aktif */}
                <div className="pt-2 border-t border-slate-850 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Daftar Meja Aktif ({activeTables.length} Meja):</span>
                    <span className="text-[10px] text-slate-500">Klik meja untuk pratinjau stiker, tombol ✕ untuk hapus</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {activeTables.map((t) => {
                      const isSelected = previewTable === t;
                      return (
                        <div
                          key={t}
                          className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-blue-600/30 border-blue-400 text-blue-200 shadow-sm'
                              : 'bg-slate-900 border-slate-750 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setPreviewTable(t)}
                            className="flex items-center gap-1 text-left focus:outline-none"
                            title={`Lihat pratinjau stiker ${t}`}
                          >
                            <span className="text-[11px]">🪑</span>
                            <span>{t}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTableClick(t)}
                            className="w-5 h-5 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/20 transition-colors ml-1"
                            title={`Hapus ${t} dari sistem`}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Banner Cetak Massal */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <div className="text-sm font-extrabold text-white">Lembar Stiker Semua Meja Siap Gunting</div>
                  <div className="text-xs text-blue-300/80">Format lengkap ({activeTables.length} meja) untuk dicetak langsung ke printer.</div>
                </div>
                {onOpenTableQrModal && (
                  <button
                    onClick={onOpenTableQrModal}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <span>🖨️ Buka Lembar Cetak Stiker</span>
                  </button>
                )}
              </div>

              {/* Preview Satu Meja */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-300">Pilih Meja untuk Pratinjau Stiker:</div>
                <div className="flex flex-wrap gap-2">
                  {activeTables.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPreviewTable(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        previewTable === t
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
                    <img src={previewQrUrl} alt={previewTable} className="w-28 h-28 object-contain" />
                  </div>
                  <div className="text-xs text-slate-400 space-y-1.5 text-center sm:text-left">
                    <div className="font-extrabold text-white text-base">{previewTable}</div>
                    <div className="text-[11px] text-slate-300">Arahkan kamera smartphone ke QR ini untuk memesan lagu atas nama <strong>{previewTable}</strong>.</div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const w = window.open('', '_blank');
                          if (w) {
                            w.document.write(`
                              <html>
                                <head><title>Stiker ${previewTable} - ${cafeSettings?.name || 'CAFEYOU'}</title></head>
                                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;">
                                  <div style="border:2px dashed #333;padding:24px;border-radius:16px;text-align:center;max-width:280px;">
                                    <h2 style="margin:0 0 8px 0;font-size:20px;">${cafeSettings?.name || 'CAFEYOU'}</h2>
                                    <h3 style="margin:0 0 12px 0;font-size:16px;color:#2563eb;">${previewTable}</h3>
                                    <img src="${previewQrUrl}" style="width:200px;height:200px;margin-bottom:8px;" />
                                    <p style="margin:0;font-size:12px;color:#666;">Scan untuk pilih & pesan lagu dari HP</p>
                                  </div>
                                  <script>window.onload = function(){ window.print(); };</script>
                                </body>
                              </html>
                            `);
                            w.document.close();
                          }
                        }}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold"
                      >
                        🖨️ Cetak Stiker {previewTable} Saja
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TAB: VOUCHER & PIN TAMU (FULL INLINE INTERACTIVE) */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>🎟️ Voucher & PIN Akses Tamu</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Proteksi anti-sabotase: Pelanggan wajib memasukkan kode voucher atau PIN untuk memesan lagu.
                </p>
              </div>

              {/* SECTION A: Mode PIN Harian */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>🔑 Mode PIN Harian (Daily PIN)</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          isDailyPinActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isDailyPinActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Jika aktif, semua tamu kafe cukup memasukkan PIN 4-digit yang sama hari ini.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDailyPinActive}
                      onChange={(e) => setIsDailyPinActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                {isDailyPinActive && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={dailyPinCode}
                      onChange={(e) => setDailyPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="1234"
                      className="w-32 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSavePin}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      {isPinSaved ? 'Tersimpan!' : 'Simpan PIN'}
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION B: Buat Voucher Baru Langsung (Inline Form) */}
              <form
                onSubmit={handleCreateVoucherSubmit}
                className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-2xl border border-blue-500/30 space-y-3"
              >
                <div className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TicketIcon className="w-4 h-4 text-blue-400" />
                  <span>Terbitkan Kode Voucher Baru</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Pilih Meja / Pelanggan:
                    </label>
                    <select
                      value={voucherTable}
                      onChange={(e) => setVoucherTable(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {activeTables.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Batas Kuota Lagu:
                    </label>
                    <select
                      value={voucherQuota}
                      onChange={(e) => setVoucherQuota(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={1}>1 Lagu</option>
                      <option value={2}>2 Lagu</option>
                      <option value={3}>3 Lagu (Standar)</option>
                      <option value={5}>5 Lagu</option>
                      <option value={10}>10 Lagu</option>
                      <option value={20}>20 Lagu (VIP)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
                  >
                    <span>🎟️ Terbitkan Voucher {voucherTable}</span>
                  </button>

                  {onOpenVoucherModal && (
                    <button
                      type="button"
                      onClick={onOpenVoucherModal}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Buka Layout Cetak Voucher
                    </button>
                  )}
                </div>
              </form>

              {/* Card Voucher Terbit Baru */}
              {lastCreatedVoucher && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border border-amber-500/40 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-300">VOUCHER BERHASIL DITERBITKAN:</span>
                    <span className="text-[10px] font-bold text-white bg-amber-600/60 px-2.5 py-0.5 rounded-full">
                      {lastCreatedVoucher.tableNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">
                      {lastCreatedVoucher.code}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(lastCreatedVoucher.code);
                        alert(`Kode voucher ${lastCreatedVoucher.code} berhasil disalin!`);
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
                    >
                      Salin Kode
                    </button>
                  </div>
                  <div className="text-[11px] text-amber-200/80">
                    Kuota: <strong>{lastCreatedVoucher.quotaTotal} Lagu</strong> • Berikan kode ini kepada tamu di {lastCreatedVoucher.tableNumber}.
                  </div>
                </div>
              )}

              {/* SECTION C: Daftar Voucher Aktif */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Daftar Voucher Aktif ({activeVouchersList.length}):</span>
                </div>
                {activeVouchersList.length === 0 ? (
                  <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
                    Belum ada voucher aktif saat ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                    {activeVouchersList.map((v) => (
                      <div
                        key={v.code}
                        className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-xl border border-blue-500/20">
                            {v.code}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white">{v.tableNumber}</div>
                            <div className="text-[10px] text-slate-400">
                              Terpakai: <strong>{v.quotaUsed}</strong> / {v.quotaTotal} Lagu
                            </div>
                          </div>
                        </div>

                        {onRevokeVoucher && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Cabut voucher ${v.code} untuk ${v.tableNumber}?`)) {
                                onRevokeVoucher(v.code);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs"
                            title="Cabut voucher ini"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. TAB: DATABASE KOLEKSI LAGU */}
          {activeTab === 'library' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>📚 Database Koleksi Lagu Kafe</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Kelola daftar lagu tersimpan ({Object.keys(songLibrary).length} judul lagu).
                </p>
              </div>

              {/* Card Pengaturan Auto-Save vs Temporary Session */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>💾 Mode Penyimpanan Lagu ke Database</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          autoSaveLibrary
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {autoSaveLibrary ? 'Simpan Otomatis (Cloud & Lokal)' : 'Mode Sesi Bersih (Sementara)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {autoSaveLibrary
                        ? 'Setiap lagu yang dipesan dan diputar otomatis disimpan permanen ke koleksi kafe dan Cloud.'
                        : 'Lagu pesanan tamu hanya diputar di antrean hari ini saja (tidak disimpan permanen ke database kafe dan akan bersih saat browser dibersihkan).'}
                    </p>
                  </div>
                  {onToggleAutoSaveLibrary && (
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={autoSaveLibrary}
                        onChange={(e) => onToggleAutoSaveLibrary(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Cari lagu di koleksi..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredLibrary.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">Tidak ada lagu yang cocok.</div>
                ) : (
                  filteredLibrary.map((song) => (
                    <div
                      key={song.videoId}
                      className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-12 h-9 object-cover rounded-lg shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{song.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {song.artist || 'Artis Kafe'} • Diputar {song.playCount || 0}x
                          </div>
                        </div>
                      </div>

                      {onDeleteFromLibrary && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus "${song.title}" dari database kafe?`)) {
                              onDeleteFromLibrary(song.videoId);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs shrink-0"
                          title="Hapus dari koleksi"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {onClearLibrary && (
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          'PERINGATAN: Apakah Anda yakin ingin menghapus SELURUH koleksi lagu kafe? Tindakan ini tidak dapat dibatalkan.'
                        )
                      ) {
                        onClearLibrary();
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>⚠️ Reset & Kosongkan Seluruh Database Lagu</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. TAB: KONEKSI CLOUD FIREBASE (FULL INLINE FORM) */}
          {activeTab === 'cloud' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>☁️ Koneksi Cloud Firebase</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sinkronisasi realtime antara layar kasir, monitor TV proyektor, dan seluruh smartphone meja tamu.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isCloudConnected
                        ? 'Tersambung ke Firebase Realtime Database'
                        : 'Mode Sinkron Lokal (Tanpa Cloud)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isCloudConnected
                        ? 'Antrean lagu dan reaksi tamu tersinkronisasi otomatis dalam hitungan milidetik.'
                        : 'Aplikasi berjalan menggunakan sinkronisasi tab lokal browser.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Konfigurasi Firebase Langsung Inline */}
              <form onSubmit={handleSaveFirebase} className="space-y-3.5">
                {fbStatusMsg && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold ${
                      fbStatusMsg.type === 'error'
                        ? 'bg-red-500/15 border-red-500/30 text-red-300'
                        : fbStatusMsg.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    {fbStatusMsg.text}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">API Key:</label>
                    <input
                      type="text"
                      value={fbApiKey}
                      onChange={(e) => setFbApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Project ID:</label>
                    <input
                      type="text"
                      value={fbProjectId}
                      onChange={(e) => setFbProjectId(e.target.value)}
                      placeholder="cafeyou-karaoke"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Database URL:</label>
                  <input
                    type="text"
                    value={fbDbUrl}
                    onChange={(e) => setFbDbUrl(e.target.value)}
                    placeholder="https://cafeyou-default-rtdb.firebaseio.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Auth Domain (opsional):</label>
                    <input
                      type="text"
                      value={fbAuthDomain}
                      onChange={(e) => setFbAuthDomain(e.target.value)}
                      placeholder="cafeyou.firebaseapp.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">App ID (opsional):</label>
                    <input
                      type="text"
                      value={fbAppId}
                      onChange={(e) => setFbAppId(e.target.value)}
                      placeholder="1:123456789:web:abcdef"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all"
                  >
                    Simpan & Sambungkan Cloud
                  </button>

                  <button
                    type="button"
                    onClick={handleClearFirebase}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reset ke Mode Lokal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 7. TAB: KEAMANAN AKUN OPERATOR */}
          {activeTab === 'security' && (
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
          )}

          {/* 8. TAB: BANTUAN PENGEMBANG */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>💬 Bantuan Pengembang & Layanan Teknis</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Kontak resmi dan panduan operasional dari tim AuraCore Labs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-emerald-500/20">
                    ⚡
                  </div>
                  <div>
                    <div className="text-base font-black text-white">{DEVELOPER_INFO.name}</div>
                    <div className="text-xs text-emerald-400 font-semibold">
                      {DEVELOPER_INFO.brandName} • {DEVELOPER_INFO.tagline}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed space-y-2 pt-2 border-t border-slate-800">
                  <p>
                    Aplikasi ini dirancang khusus untuk operasional karaoke kafe dual-screen tanpa ketergantungan koneksi internet publik berbayar.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Jika Anda membutuhkan bantuan setup Wi-Fi lokal, konfigurasi monitor kedua proyektor, atau kustomisasi fitur kafe, silakan hubungi tim kami via WhatsApp.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={DEVELOPER_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <span>💬 Hubungi WhatsApp AuraCore ({DEVELOPER_INFO.whatsappSupportDisplay})</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
