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
import { OperatorLoginView } from './OperatorLoginView';
import { DeveloperHelpModal } from '../common/DeveloperHelpModal';
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
    clearHistory,
    togglePlayPause,
    setVolume,
    toggleMute,
    setRunningText,
    triggerSoundEffect,
    createVoucher,
    revokeVoucher,
    setDailyPin,
    fairRotationEnabled,
    toggleFairRotation,
    rebalanceQueueFairly,
    cafeSettings,
    updateCafeSettings,
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

  // Notifikasi Pesanan Meja Baru
  const [newOrderAlert, setNewOrderAlert] = useState<{
    table: string;
    requester: string;
    title: string;
  } | null>(null);
  const prevQueueLengthRef = React.useRef<number>(state.queue?.length || 0);

  // Pantau penambahan antrean dari Meja Tamu
  React.useEffect(() => {
    const currentLen = state.queue?.length || 0;
    if (currentLen > prevQueueLengthRef.current && currentLen > 0) {
      // Ambil lagu paling baru masuk
      const newestSong = state.queue[state.queue.length - 1];
      if (newestSong && (newestSong.source === 'guest' || newestSong.tableNumber)) {
        try {
          triggerSoundEffect('chime');
        } catch {}
        setNewOrderAlert({
          table: newestSong.tableNumber || 'Meja Tamu',
          requester: newestSong.requester || 'Pelanggan',
          title: newestSong.title,
        });
        setTimeout(() => {
          setNewOrderAlert(null);
        }, 6000);
      }
    }
    prevQueueLengthRef.current = currentLen;
  }, [state.queue, triggerSoundEffect]);

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
          onOpenSoundBoard={() => setIsSoundBoardOpen(true)}
          onOpenPopularSongs={() => setIsPopularOpen(true)}
          onOpenRunningText={() => setIsRunningTextOpen(true)}
          onOpenProjectorTab={handleOpenProjector}
          onOpenFirebaseConfig={() => setIsFirebaseOpen(true)}
          onOpenQrShare={() => setIsQrShareOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenVouchers={() => setIsVoucherOpen(true)}
          onOpenTableQr={() => setIsTableQrOpen(true)}
          onOpenCafeSettings={() => setIsCafeSettingsOpen(true)}
          onOpenDeveloperHelp={() => setIsDeveloperHelpOpen(true)}
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
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
            onQuickSoundEffect={triggerSoundEffect}
          />

          <AddSongForm
            onAddSong={(videoId, rawUrl, requester, customTitle) => {
              addSong(videoId, rawUrl, requester, customTitle);
            }}
            onOpenPopularModal={() => setIsPopularOpen(true)}
            songLibrary={songLibrary}
            history={history}
          />
        </div>

        {/* Kolom Kanan: Sedang Diputar & Daftar Antrean */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          <NowPlayingCard currentSong={currentSong} />

          <QueueList
            queue={nextSongs}
            fairRotationEnabled={fairRotationEnabled}
            onRemoveSong={removeSong}
            onMoveToTop={moveToTop}
            onMoveUp={moveSongUp}
            onMoveDown={moveSongDown}
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
        onClose={() => setIsQrShareOpen(false)}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onRequeue={(videoId, rawUrl, title) => {
          addSong(videoId, rawUrl, 'Diputar Ulang', title);
        }}
        onClearHistory={clearHistory}
      />

      <VoucherManagerModal
        isOpen={isVoucherOpen}
        vouchers={vouchers}
        dailyPin={dailyPin}
        onClose={() => setIsVoucherOpen(false)}
        onCreateVoucher={createVoucher}
        onRevokeVoucher={revokeVoucher}
        onSetDailyPin={setDailyPin}
      />

      <TableQrGeneratorModal
        isOpen={isTableQrOpen}
        cafeName={cafeSettings?.name}
        onClose={() => setIsTableQrOpen(false)}
        onOpenVoucherManager={() => setIsVoucherOpen(true)}
      />

      <CafeSettingsModal
        isOpen={isCafeSettingsOpen}
        settings={cafeSettings}
        onClose={() => setIsCafeSettingsOpen(false)}
        onSave={updateCafeSettings}
      />

      {/* Developer Help Modal & Footer */}
      <DeveloperHelpModal
        isOpen={isDeveloperHelpOpen}
        onClose={() => setIsDeveloperHelpOpen(false)}
      />

      </div>

      <DeveloperFooter className="px-4" />
    </div>
  );
};
