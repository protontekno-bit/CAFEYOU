import React, { useState } from 'react';
import { CafeSettings, Voucher, DailyPinConfig, SavedLibrarySong, MenuItem } from '../../types';
import { DEVELOPER_INFO } from '../../constants/developer';
import { SettingsCafeTab } from './settings/SettingsCafeTab';
import { SettingsDisplayTab } from './settings/SettingsDisplayTab';
import { SettingsTablesTab } from './settings/SettingsTablesTab';
import { SettingsVouchersTab } from './settings/SettingsVouchersTab';
import { SettingsMenuTab } from './settings/SettingsMenuTab';
import { SettingsLibraryTab } from './settings/SettingsLibraryTab';
import { SettingsCloudTab } from './settings/SettingsCloudTab';
import { SettingsSecurityTab } from './settings/SettingsSecurityTab';
import { SettingsHelpTab } from './settings/SettingsHelpTab';

type SettingsTab =
  | 'cafe'
  | 'display'
  | 'tables'
  | 'vouchers'
  | 'menu'
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
  onRevokeVoucher?: (code: string) => void;
  onSetDailyPin?: (enabled: boolean, code: string) => void;
  onOpenVoucherModal?: () => void;
  // Menu F&B (POS)
  menuItems?: MenuItem[];
  onAddMenuItem?: (item: Omit<MenuItem, 'id'>) => Promise<void> | void;
  onUpdateMenuItem?: (item: MenuItem) => Promise<void> | void;
  onDeleteMenuItem?: (id: string) => Promise<void> | void;
  onResetMenuToDefault?: () => Promise<void> | void;
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
  onRevokeVoucher,
  onSetDailyPin,
  onOpenVoucherModal,
  menuItems = [],
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onResetMenuToDefault,
  songLibrary = {},
  onDeleteFromLibrary,
  onClearLibrary,
  autoSaveLibrary = true,
  onToggleAutoSaveLibrary,
  isCloudConnected = false,
  onPasswordChangedLogout,
  onOpenDeveloperHelpModal,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('cafe');

  if (!isOpen) return null;

  const activeVouchersList = Object.values(vouchers)
    .filter((v) => v.status === 'active')
    .sort((a, b) => b.createdAt - a.createdAt);

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
                  id: 'menu',
                  icon: '🍽️',
                  label: 'Menu F&B (Kasir POS)',
                  badge: `${(menuItems || []).length}`,
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
                  label: 'Koneksi Cloud & API YouTube',
                  dot: isCloudConnected || Boolean(cafeSettings?.youtubeApiKey) ? 'bg-emerald-400' : 'bg-amber-400',
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
          {activeTab === 'cafe' && (
            <SettingsCafeTab
              cafeSettings={cafeSettings}
              onUpdateCafeSettings={onUpdateCafeSettings}
            />
          )}

          {activeTab === 'display' && (
            <SettingsDisplayTab
              runningText={runningText}
              onSaveRunningText={onSaveRunningText}
              onOpenProjectorTab={onOpenProjectorTab}
            />
          )}

          {activeTab === 'tables' && (
            <SettingsTablesTab
              tables={tables}
              cafeName={cafeSettings?.name}
              onAddTable={onAddTable}
              onRemoveTable={onRemoveTable}
              onResetTables={onResetTables}
              onOpenTableQrModal={onOpenTableQrModal}
            />
          )}

          {activeTab === 'vouchers' && (
            <SettingsVouchersTab
              vouchers={vouchers}
              dailyPin={dailyPin}
              onRevokeVoucher={onRevokeVoucher}
              onSetDailyPin={onSetDailyPin}
              onOpenVoucherModal={onOpenVoucherModal}
            />
          )}

          {activeTab === 'menu' && (
            <SettingsMenuTab
              menuItems={menuItems}
              onAddMenuItem={onAddMenuItem}
              onUpdateMenuItem={onUpdateMenuItem}
              onDeleteMenuItem={onDeleteMenuItem}
              onResetMenuToDefault={onResetMenuToDefault}
            />
          )}

          {activeTab === 'library' && (
            <SettingsLibraryTab
              songLibrary={songLibrary}
              onDeleteFromLibrary={onDeleteFromLibrary}
              onClearLibrary={onClearLibrary}
              autoSaveLibrary={autoSaveLibrary}
              onToggleAutoSaveLibrary={onToggleAutoSaveLibrary}
            />
          )}

          {activeTab === 'cloud' && (
            <SettingsCloudTab
              isCloudConnected={isCloudConnected}
              cafeSettings={cafeSettings}
              onUpdateCafeSettings={onUpdateCafeSettings}
            />
          )}

          {activeTab === 'security' && (
            <SettingsSecurityTab
              onClose={onClose}
              onPasswordChangedLogout={onPasswordChangedLogout}
            />
          )}

          {activeTab === 'help' && (
            <SettingsHelpTab
              onOpenDeveloperHelpModal={onOpenDeveloperHelpModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};
