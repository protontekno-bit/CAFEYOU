/**
 * Sistem Karaoke Kafe Dual Screen
 * Entry Point Facade
 * 
 * Arsitektur telah di-refactor menjadi modular di dalam direktori `src/`.
 * File ini bertindak sebagai main facade agar backward-compatible.
 */

import App from './src/App';

export * from './src/types';
export * from './src/config/firebase';
export * from './src/constants/karaoke';
export * from './src/utils/youtube';
export * from './src/utils/soundfx';
export * from './src/hooks/useSyncState';
export * from './src/hooks/useKaraoke';
export * from './src/hooks/useYouTubePlayer';
export * from './src/components/icons/Icons';
export * from './src/components/common/Header';
export * from './src/components/operator/OperatorScreen';
export * from './src/components/operator/PlaybackControls';
export * from './src/components/operator/AddSongForm';
export * from './src/components/operator/NowPlayingCard';
export * from './src/components/operator/QueueList';
export * from './src/components/operator/SoundBoardModal';
export * from './src/components/operator/PopularSongsModal';
export * from './src/components/operator/RunningTextModal';
export * from './src/components/operator/FirebaseConfigModal';
export * from './src/components/operator/QrShareModal';
export * from './src/components/operator/HistoryModal';
export * from './src/components/player/PlayerScreen';
export * from './src/components/player/PlayerPlaceholder';
export * from './src/components/landing/LandingScreen';
export * from './src/components/landing/RoleCard';
export * from './src/components/split/SplitScreen';

export default App;