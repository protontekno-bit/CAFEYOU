import { useSyncState } from './useSyncState';
import { STORAGE_KEY, DEFAULT_KARAOKE_STATE } from '../constants/karaoke';
import { KaraokeState } from '../types';
import { useKaraokePlayer } from './domains/useKaraokePlayer';
import { useOrderBilling } from './domains/useOrderBilling';
import { useCashExpenses } from './domains/useCashExpenses';
import { useVoucherAuth, isSameTable } from './domains/useVoucherAuth';

// Re-export domain hooks and helpers for fine-grained imports
export { isSameTable };
export { useKaraokePlayer } from './domains/useKaraokePlayer';
export { useOrderBilling } from './domains/useOrderBilling';
export { useCashExpenses } from './domains/useCashExpenses';
export { useVoucherAuth } from './domains/useVoucherAuth';

/**
 * useKaraoke Master Facade Hook
 * Orchestrates domain sub-hooks while providing 100% backward compatibility
 * for all existing views, modals, and screen components.
 */
export function useKaraoke() {
  const [appState, updateAppState, isCloudConnected] = useSyncState<KaraokeState>(
    STORAGE_KEY,
    DEFAULT_KARAOKE_STATE
  );

  const player = useKaraokePlayer(appState, updateAppState);
  const billing = useOrderBilling(appState, updateAppState);
  const expenses = useCashExpenses(appState, updateAppState);
  const auth = useVoucherAuth(appState, updateAppState);

  return {
    state: {
      ...appState,
      queue: player.state.queue,
      history: player.state.history,
      songLibrary: player.state.songLibrary,
      vouchers: auth.state.vouchers,
      dailyPin: auth.state.dailyPin,
      liveReaction: player.state.liveReaction,
      fairRotationEnabled: player.state.fairRotationEnabled,
      cafeSettings: auth.state.cafeSettings,
      tables: auth.state.tables,
      autoSaveLibrary: player.state.autoSaveLibrary,
      expenses: expenses.state.expenses,
    },
    updateState: updateAppState,
    isCloudConnected,
    // Player & Queue domain
    currentSong: player.currentSong,
    nextSongs: player.nextSongs,
    songLibrary: player.songLibrary,
    history: player.history,
    liveReaction: player.liveReaction,
    fairRotationEnabled: player.fairRotationEnabled,
    autoSaveLibrary: player.autoSaveLibrary,
    addSong: player.addSong,
    removeSong: player.removeSong,
    moveToTop: player.moveToTop,
    moveSongUp: player.moveSongUp,
    moveSongDown: player.moveSongDown,
    skipSong: player.skipSong,
    nextSong: player.nextSong,
    clearHistory: player.clearHistory,
    togglePlayPause: player.togglePlayPause,
    setVolume: player.setVolume,
    toggleMute: player.toggleMute,
    setRunningText: player.setRunningText,
    triggerSoundEffect: player.triggerSoundEffect,
    sendLiveReaction: player.sendLiveReaction,
    toggleFairRotation: player.toggleFairRotation,
    rebalanceQueueFairly: player.rebalanceQueueFairly,
    deleteFromLibrary: player.deleteFromLibrary,
    clearLibrary: player.clearLibrary,
    toggleAutoSaveLibrary: player.toggleAutoSaveLibrary,
    saveSongToLibrary: player.saveSongToLibrary,
    // Order & Billing domain
    menuItems: billing.menuItems,
    tableOrders: billing.tableOrders,
    createTableOrder: billing.createTableOrder,
    updateTableOrderStatus: billing.updateTableOrderStatus,
    moveTableOrder: billing.moveTableOrder,
    voidOrderItem: billing.voidOrderItem,
    toggleOrderItemStatus: billing.toggleOrderItemStatus,
    confirmTableOrder: billing.confirmTableOrder,
    addMenuItem: billing.addMenuItem,
    updateMenuItem: billing.updateMenuItem,
    deleteMenuItem: billing.deleteMenuItem,
    resetMenuToDefault: billing.resetMenuToDefault,
    toggleMenuItemAvailability: billing.toggleMenuItemAvailability,
    quickUpdateMenuPrice: billing.quickUpdateMenuPrice,
    clearFinishedOrders: billing.clearFinishedOrders,
    // Cash expenses domain
    expenses: expenses.expenses,
    addExpense: expenses.addExpense,
    deleteExpense: expenses.deleteExpense,
    clearExpenses: expenses.clearExpenses,
    // Voucher & Auth domain
    vouchers: auth.vouchers,
    dailyPin: auth.dailyPin,
    cafeSettings: auth.cafeSettings,
    tables: auth.tables,
    createVoucher: auth.createVoucher,
    revokeVoucher: auth.revokeVoucher,
    setDailyPin: auth.setDailyPin,
    validateVoucher: auth.validateVoucher,
    updateCafeSettings: auth.updateCafeSettings,
    addTable: auth.addTable,
    removeTable: auth.removeTable,
    resetTables: auth.resetTables,
    updateLocalServerIp: auth.updateLocalServerIp,
    updateRolePasswords: auth.updateRolePasswords,
  };
}
