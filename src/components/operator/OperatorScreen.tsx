import React, { useState } from 'react';
import { Header } from '../common/Header';
import { PlaybackControls } from './PlaybackControls';
import { AddSongForm } from './AddSongForm';
import { NowPlayingCard } from './NowPlayingCard';
import { QueueList } from './QueueList';
import { SoundBoardModal } from './SoundBoardModal';
import { PopularSongsModal } from './PopularSongsModal';
import { RunningTextModal } from './RunningTextModal';
import { FirebaseConfigModal } from './FirebaseConfigModal';
import { QrShareModal } from './QrShareModal';
import { HistoryModal } from './HistoryModal';
import { VoucherManagerModal } from './VoucherManagerModal';
import { TableQrGeneratorModal } from './TableQrGeneratorModal';
import { CafeSettingsModal } from './CafeSettingsModal';
import { SongLibraryManagerModal } from './SongLibraryManagerModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { SettingsCenterModal } from './SettingsCenterModal';
import { OperatorLoginView } from './OperatorLoginView';
import { DeveloperHelpModal } from '../common/DeveloperHelpModal';
import { DeveloperFooter } from '../common/DeveloperFooter';
import { useKaraoke } from '../../hooks/useKaraoke';
import { useWakeLock } from '../../hooks/useWakeLock';
import { AppRole, PopularPresetSong } from '../../types';
import { initFirebaseDatabase, ref, onValue, set } from '../../config/firebase';
import { STORAGE_KEY } from '../../constants/karaoke';

interface OperatorScreenProps {
  setRole?: (role: AppRole) => void;
}

export const OperatorScreen: React.FC<OperatorScreenProps> = ({ setRole }) => {
  // Mencegah layar tablet kasir redup/terkunci otomatis saat beroperasi
  useWakeLock(true);

  // Cek autentikasi sesi operator
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return !!(
        sessionStorage.getItem('cafeyou_operator_auth') ||
        localStorage.getItem('cafeyou_operator_auth')
      );
    } catch {
      return false;
    }
  });

  const {
    state,
    isCloudConnected,
    currentSong,
    nextSongs,
    songLibrary,
    history,
    vouchers,
    dailyPin,
    addSong,
    removeSong,
    moveToTop,
    moveSongUp,
    moveSongDown,
    skipSong,
    replayCurrentSong,
    clearQueue,
    clearHistory,
    togglePlayPause,
    setVolume,
    toggleMute,
    setRunningText,
    triggerSoundEffect,
    createVoucher,
    revokeVoucher,
    topUpVoucherQuota,
    setDailyPin,
    fairRotationEnabled,
    toggleFairRotation,
    rebalanceQueueFairly,
    cafeSettings,
    updateCafeSettings,
    tables,
    addTable,
    removeTable,
    resetTables,
    deleteFromLibrary,
    clearLibrary,
    autoSaveLibrary,
    toggleAutoSaveLibrary,
    saveSongToLibrary,
    menuItems,
    tableOrders,
    updateTableOrderStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetMenuToDefault,
    clearFinishedOrders,
    updateLocalServerIp,
  } = useKaraoke();

  const [isSoundBoardOpen, setIsSoundBoardOpen] = useState(false);
  const [isPopularOpen, setIsPopularOpen] = useState(false);
  const [isRunningTextOpen, setIsRunningTextOpen] = useState(false);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [isQrShareOpen, setIsQrShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isTableQrOpen, setIsTableQrOpen] = useState(false);
  const [isCafeSettingsOpen, setIsCafeSettingsOpen] = useState(false);
  const [isDeveloperHelpOpen, setIsDeveloperHelpOpen] = useState(false);
  const [isLibraryManagerOpen, setIsLibraryManagerOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSettingsCenterOpen, setIsSettingsCenterOpen] = useState(false);

  // Notifikasi Pesanan Meja Baru (Lagu & F&B)
  const [newOrderAlert, setNewOrderAlert] = useState<{
    table: string;
    requester: string;
    title: string;
  } | null>(null);
  const prevQueueLengthRef = React.useRef<number>(state.queue?.length || 0);

  // Pantau penambahan antrean lagu dari Meja Tamu
  React.useEffect(() => {
    const currentLen = state.queue?.length || 0;
    if (currentLen > prevQueueLengthRef.current && currentLen > 0) {
      const newestSong = state.queue[state.queue.length - 1];
      if (newestSong && (newestSong.source === 'guest' || newestSong.tableNumber)) {
        try {
          triggerSoundEffect('chime');
        } catch {}
        setNewOrderAlert({
          table: newestSong.tableNumber || 'Meja Tamu',
          requester: newestSong.requester || 'Pelanggan',
          title: `Lagu: ${newestSong.title}`,
        });
        setTimeout(() => {
          setNewOrderAlert(null);
        }, 6000);
      }
    }
    prevQueueLengthRef.current = currentLen;
  }, [state.queue, triggerSoundEffect]);

  // Pantau penambahan pesanan makanan/minuman (F&B) baru dari Tamu
  const pendingOrdersCount = Object.values(tableOrders || {}).filter(
    (o) => o && o.status?.toLowerCase() === 'pending'
  ).length;
  const prevPendingCountRef = React.useRef<number>(pendingOrdersCount);

  React.useEffect(() => {
    if (pendingOrdersCount > prevPendingCountRef.current) {
      try {
        triggerSoundEffect('chime');
      } catch {}
      setNewOrderAlert({
        table: 'Pesanan F&B',
        requester: 'Meja Tamu',
        title: `${pendingOrdersCount} Pesanan menu makanan/minuman baru masuk!`,
      });
      setTimeout(() => {
        setNewOrderAlert(null);
      }, 7000);
    }
    prevPendingCountRef.current = pendingOrdersCount;
  }, [pendingOrdersCount, triggerSoundEffect]);

  // Pantau Permintaan Top-Up Kuota Lagu dari Meja Tamu
  const [assistanceRequests, setAssistanceRequests] = useState<
    Record<
      string,
      {
        tableNumber: string;
        voucherCode?: string;
        type: string;
        requestedAt: number;
        status: string;
      }
    >
  >({});

  React.useEffect(() => {
    try {
      const db = initFirebaseDatabase();
      if (!db) return;
      const reqRef = ref(db, `cafeyou/${STORAGE_KEY}/assistanceRequests`);
      const unsub = onValue(reqRef, (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          setAssistanceRequests(val);
        } else {
          setAssistanceRequests({});
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  const pendingTopUpList = Object.values(assistanceRequests).filter(
    (r) => r && r.status === 'pending'
  );

  const handleApproveTopUp = (req: { tableNumber: string; voucherCode?: string }, songsToAdd: number) => {
    if (req.voucherCode) {
      topUpVoucherQuota(req.voucherCode, songsToAdd);
    }
    try {
      const db = initFirebaseDatabase();
      if (db) {
        const rRef = ref(db, `cafeyou/${STORAGE_KEY}/assistanceRequests/${req.tableNumber}`);
        set(rRef, null).catch(() => {});
      }
    } catch {}
  };

  const handleDismissTopUp = (tableNumber: string) => {
    try {
      const db = initFirebaseDatabase();
      if (db) {
        const rRef = ref(db, `cafeyou/${STORAGE_KEY}/assistanceRequests/${tableNumber}`);
        set(rRef, null).catch(() => {});
      }
    } catch {}
  };

  // Jika belum login, tampilkan OperatorLoginView Neumorphism
  if (!isLoggedIn) {
    return (
      <OperatorLoginView
        onLoginSuccess={() => setIsLoggedIn(true)}
        onBack={setRole ? () => setRole('landing') : undefined}
      />
    );
  }

  const handleOpenProjector = () => {
    const currentUrl = window.location.href.split('#')[0];
    window.open(currentUrl + '#player', '_blank');
  };

  const handleSelectPopularSong = (song: PopularPresetSong) => {
    addSong(
      song.videoId,
      `https://www.youtube.com/watch?v=${song.videoId}`,
      'Pilihan Kafe',
      `${song.title} - ${song.artist}`
    );
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('cafeyou_operator_auth');
      localStorage.removeItem('cafeyou_operator_auth');
    } catch {
      // ignore
    }
    setIsLoggedIn(false);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-white">
      <div>
        <Header
          title="Dasbor Operator Kafe"
          cafeName={cafeSettings?.name}
          onBack={setRole ? () => setRole('landing') : undefined}
          isCloudConnected={isCloudConnected}
          historyCount={history.length}
          activeVoucherCount={Object.values(vouchers || {}).filter((v) => v?.status === 'active').length}
          isDailyPinActive={dailyPin?.enabled}
          pendingOrdersCount={pendingOrdersCount}
          onOpenPosOrders={() => window.open('#pos', '_blank')}
          onOpenKitchenTab={() => window.open('#kitchen', '_blank')}
          onOpenVoucherManager={() => setIsVoucherOpen(true)}
          onOpenProjectorTab={handleOpenProjector}
          onOpenPopularSongs={() => setIsPopularOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSoundBoard={() => setIsSoundBoardOpen(true)}
          onOpenSettings={() => setIsSettingsCenterOpen(true)}
          onLogout={handleLogout}
        />

        {/* Floating Toast Alert Pesanan Meja Baru */}
        {newOrderAlert && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3">
            <div className="p-3.5 bg-gradient-to-r from-emerald-600/90 via-emerald-700 to-teal-800 border border-emerald-400/50 rounded-2xl shadow-xl flex items-center justify-between text-white animate-bounce">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-200">
                    Pesanan Lagu Baru Masuk dari {newOrderAlert.table}!
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {newOrderAlert.title} <span className="text-xs font-normal text-emerald-100">(oleh {newOrderAlert.requester})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="px-3 py-1 bg-black/30 hover:bg-black/50 text-xs font-bold rounded-xl transition-all"
              >
                Tutup ✕
              </button>
            </div>
          </div>
        )}

        {/* Banner Permintaan Tambah Kuota Lagu dari Meja Tamu */}
        {pendingTopUpList.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 space-y-2">
            {pendingTopUpList.map((req) => (
              <div
                key={req.tableNumber}
                className="p-3.5 bg-gradient-to-r from-amber-600/90 via-amber-700 to-orange-800 border border-amber-400/50 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-200">
                      Permintaan Tambah Kuota Lagu • Meja {req.tableNumber}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Voucher: <span className="font-mono font-bold">{req.voucherCode || '-'}</span> • Tamu kehabisan kuota lagu dan ingin memesan lagu lagi.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleApproveTopUp(req, 1)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow active:scale-95 flex items-center gap-1"
                  >
                    <span>+1 Lagu</span>
                  </button>
                  <button
                    onClick={() => handleApproveTopUp(req, 3)}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow active:scale-95 flex items-center gap-1"
                  >
                    <span>+3 Lagu</span>
                  </button>
                  <button
                    onClick={() => handleDismissTopUp(req.tableNumber)}
                    className="px-2.5 py-1.5 bg-black/40 hover:bg-black/60 text-xs font-bold rounded-xl transition-all text-slate-300"
                  >
                    Tutup ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Dek Kendali & Tambah Lagu */}
        <div className="lg:col-span-5 space-y-6">

          <PlaybackControls
            playbackStatus={state.playbackStatus}
            volume={state.volume}
            isMuted={state.isMuted}
            hasCurrentSong={!!currentSong}
            onTogglePlay={togglePlayPause}
            onSkip={skipSong}
            onReplay={replayCurrentSong}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
            onQuickSoundEffect={triggerSoundEffect}
            onOpenRunningText={() => setIsRunningTextOpen(true)}
            onOpenSoundBoard={() => setIsSoundBoardOpen(true)}
          />

          <AddSongForm
            onAddSong={(videoId, rawUrl, requester, customTitle) => {
              addSong(videoId, rawUrl, requester, customTitle);
            }}
            onOpenPopularModal={() => setIsPopularOpen(true)}
            songLibrary={songLibrary}
            history={history}
            tables={tables}
            youtubeApiKey={cafeSettings?.youtubeApiKey}
          />
        </div>

        {/* Kolom Kanan: Sedang Diputar & Daftar Antrean */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          <NowPlayingCard
            currentSong={currentSong}
            isSavedInLibrary={Boolean(currentSong && songLibrary && songLibrary[currentSong.videoId])}
            onSaveToLibrary={saveSongToLibrary}
          />

          <QueueList
            queue={nextSongs}
            hasCurrentSong={Boolean(currentSong)}
            currentSongTitle={currentSong?.title}
            fairRotationEnabled={fairRotationEnabled}
            onRemoveSong={removeSong}
            onMoveToTop={moveToTop}
            onMoveUp={moveSongUp}
            onMoveDown={moveSongDown}
            onClearQueue={() => clearQueue(true)}
            onOpenPopularModal={() => setIsPopularOpen(true)}
            onToggleFairRotation={toggleFairRotation}
            onRebalanceFairly={rebalanceQueueFairly}
          />
        </div>
      </main>

      {/* Modals */}
      <SoundBoardModal
        isOpen={isSoundBoardOpen}
        onClose={() => setIsSoundBoardOpen(false)}
        onTriggerSound={(type) => {
          triggerSoundEffect(type);
        }}
      />

      <PopularSongsModal
        isOpen={isPopularOpen}
        onClose={() => setIsPopularOpen(false)}
        onSelectSong={handleSelectPopularSong}
      />

      <RunningTextModal
        isOpen={isRunningTextOpen}
        currentText={state.runningText}
        onClose={() => setIsRunningTextOpen(false)}
        onSave={setRunningText}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseOpen}
        isConnected={isCloudConnected}
        onClose={() => setIsFirebaseOpen(false)}
      />

      <QrShareModal
        isOpen={isQrShareOpen}
        initialIp={cafeSettings?.localServerIp}
        onSaveIp={updateLocalServerIp}
        onClose={() => setIsQrShareOpen(false)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        songLibrary={songLibrary}
        onClose={() => setIsHistoryOpen(false)}
        onRequeue={(videoId, rawUrl, title) => {
          addSong(videoId, rawUrl, 'Diputar Ulang', title);
        }}
        onClearHistory={clearHistory}
        onSaveToLibrary={saveSongToLibrary}
      />

      <VoucherManagerModal
        isOpen={isVoucherOpen}
        vouchers={vouchers}
        dailyPin={dailyPin}
        tables={tables}
        onClose={() => setIsVoucherOpen(false)}
        onCreateVoucher={createVoucher}
        onRevokeVoucher={revokeVoucher}
        onSetDailyPin={setDailyPin}
      />

      <TableQrGeneratorModal
        isOpen={isTableQrOpen}
        cafeName={cafeSettings?.name}
        tables={tables}
        initialIp={cafeSettings?.localServerIp}
        onSaveIp={updateLocalServerIp}
        onClose={() => setIsTableQrOpen(false)}
        onOpenVoucherManager={() => setIsVoucherOpen(true)}
      />

      <CafeSettingsModal
        isOpen={isCafeSettingsOpen}
        settings={cafeSettings}
        onClose={() => setIsCafeSettingsOpen(false)}
        onSave={updateCafeSettings}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={handleLogout}
      />

      <SongLibraryManagerModal
        isOpen={isLibraryManagerOpen}
        songLibrary={songLibrary}
        onClose={() => setIsLibraryManagerOpen(false)}
        onDeleteSong={deleteFromLibrary}
        onClearLibrary={clearLibrary}
        onAddToQueue={(videoId, url, title) => addSong(videoId, url, 'Diputar Ulang', title)}
      />

      {/* Developer Help Modal & Footer */}
      <DeveloperHelpModal
        isOpen={isDeveloperHelpOpen}
        onClose={() => setIsDeveloperHelpOpen(false)}
      />

      {/* Pusat Pengaturan Kafe (Sidebar Layout) */}
      <SettingsCenterModal
        isOpen={isSettingsCenterOpen}
        onClose={() => setIsSettingsCenterOpen(false)}
        cafeSettings={cafeSettings}
        onUpdateCafeSettings={updateCafeSettings}
        runningText={state.runningText || ''}
        onSaveRunningText={setRunningText}
        onOpenProjectorTab={handleOpenProjector}
        onOpenQrShare={() => setIsQrShareOpen(true)}
        tables={tables}
        onAddTable={addTable}
        onRemoveTable={removeTable}
        onResetTables={resetTables}
        onOpenTableQrModal={() => setIsTableQrOpen(true)}
        vouchers={vouchers}
        dailyPin={dailyPin}
        onCreateVoucher={createVoucher}
        onRevokeVoucher={revokeVoucher}
        onSetDailyPin={setDailyPin}
        onOpenVoucherModal={() => setIsVoucherOpen(true)}
        menuItems={Object.values(menuItems || {})}
        onAddMenuItem={addMenuItem}
        onUpdateMenuItem={updateMenuItem}
        onDeleteMenuItem={deleteMenuItem}
        onResetMenuToDefault={resetMenuToDefault}
        songLibrary={songLibrary}
        onDeleteFromLibrary={deleteFromLibrary}
        onClearLibrary={clearLibrary}
        autoSaveLibrary={autoSaveLibrary}
        onToggleAutoSaveLibrary={toggleAutoSaveLibrary}
        isCloudConnected={isCloudConnected}
        onOpenFirebaseConfig={() => setIsFirebaseOpen(true)}
        onPasswordChangedLogout={handleLogout}
      />

      </div>

      <DeveloperFooter className="px-4" />
    </div>
  );
};
