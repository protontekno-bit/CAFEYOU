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
import { SettingsCenterModal } from './SettingsCenterModal';
import { OperatorLoginView } from './OperatorLoginView';
import { PosQuickBillingDrawer } from './PosQuickBillingDrawer';
import { OperatorAlerts } from './OperatorAlerts';
import { OperatorTopUpBanner } from './OperatorTopUpBanner';
import { DeveloperFooter } from '../common/DeveloperFooter';
import { useKaraoke } from '../../hooks/useKaraoke';
import { useWakeLock } from '../../hooks/useWakeLock';
import { AppRole, PopularPresetSong } from '../../types';

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
    removeHistoryItem,
    togglePlayPause,
    setVolume,
    toggleMute,
    setRunningText,
    triggerSoundEffect,
    createVoucher,
    revokeVoucher,
    topUpVoucherQuota,
    clearExhaustedVouchers,
    approveTopUpRequest,
    dismissTopUpRequest,
    assistanceRequests,
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
    sendPlayerCommand,
    sendStageCue,
    menuItems,
    tableOrders,
    confirmTableOrder,
    updateTableOrderStatus,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetMenuToDefault,
    updateLocalServerIp,
  } = useKaraoke();

  // Modals & Drawers State
  const [isSoundBoardOpen, setIsSoundBoardOpen] = useState(false);
  const [isPopularOpen, setIsPopularOpen] = useState(false);
  const [isRunningTextOpen, setIsRunningTextOpen] = useState(false);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [isQrShareOpen, setIsQrShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [isTableQrOpen, setIsTableQrOpen] = useState(false);
  const [isSettingsCenterOpen, setIsSettingsCenterOpen] = useState(false);
  const [isPosBillingDrawerOpen, setIsPosBillingDrawerOpen] = useState(false);

  // Hitung jumlah pesanan F&B pending untuk badge header
  const pendingOrdersCount = Object.values(tableOrders || {}).filter(
    (o) => o && o.status?.toLowerCase() === 'pending'
  ).length;

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
    } catch {}
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
          onOpenPosOrders={() => setIsPosBillingDrawerOpen(true)}
          onOpenKitchenTab={() => window.open('#kitchen', '_blank')}
          onOpenVoucherManager={() => setIsVoucherOpen(true)}
          onOpenProjectorTab={handleOpenProjector}
          onRemotePlayerCommand={sendPlayerCommand}
          onOpenPopularSongs={() => setIsPopularOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSoundBoard={() => setIsSoundBoardOpen(true)}
          onOpenSettings={() => setIsSettingsCenterOpen(true)}
          onLogout={handleLogout}
        />

        {/* Notifikasi Cerdas Pesanan Lagu & F&B Terintegrasi */}
        <OperatorAlerts
          queue={state.queue}
          tableOrders={tableOrders}
          onOpenPosDrawer={() => setIsPosBillingDrawerOpen(true)}
        />

        {/* Banner Permintaan Tambah Kuota Lagu dari Meja Tamu */}
        <OperatorTopUpBanner
          requests={assistanceRequests}
          onApproveTopUp={(table, code, quota) => approveTopUpRequest(table, code, quota || 1)}
          onDismissTopUp={dismissTopUpRequest}
        />

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
              currentSong={currentSong}
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
              onSendStageCue={sendStageCue}
            />
          </div>
        </main>

        {/* Drawer Tagihan POS Kasir Cepat */}
        <PosQuickBillingDrawer
          isOpen={isPosBillingDrawerOpen}
          onClose={() => setIsPosBillingDrawerOpen(false)}
          tableOrders={tableOrders}
          cafeSettings={cafeSettings}
          onConfirmOrder={confirmTableOrder}
          onUpdateOrderStatus={updateTableOrderStatus}
          onOpenFullPos={() => window.open('#pos', '_blank')}
        />

        {/* Modals Terisolasi */}
        <SoundBoardModal
          isOpen={isSoundBoardOpen}
          onClose={() => setIsSoundBoardOpen(false)}
          onTriggerSound={triggerSoundEffect}
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
          onRemoveHistoryItem={removeHistoryItem}
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
          onTopUpVoucher={topUpVoucherQuota}
          onClearExhaustedVouchers={clearExhaustedVouchers}
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
