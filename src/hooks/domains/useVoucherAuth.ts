import { KaraokeState, Voucher, CafeSettings } from '../../types';
import { STORAGE_KEY, DEFAULT_CAFE_SETTINGS, DEFAULT_TABLES } from '../../constants/karaoke';
import { initFirebaseDatabase, ref, get } from '../../config/firebase';

export const isSameTable = (a?: string | null, b?: string | null): boolean => {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
};

export function useVoucherAuth(
  appState: KaraokeState,
  updateAppState: (updater: (prev: KaraokeState) => KaraokeState) => void
) {
  const vouchers =
    appState?.vouchers && typeof appState.vouchers === 'object' ? appState.vouchers : {};
  const dailyPin = appState?.dailyPin || { enabled: false, code: '1234' };
  const cafeSettings = appState?.cafeSettings || DEFAULT_CAFE_SETTINGS;
  const tables = Array.isArray(appState?.tables) && appState.tables.length > 0 ? appState.tables : DEFAULT_TABLES;

  const createVoucher = (tableNumber: string, quota: number = 3): Voucher => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newVoucher: Voucher = {
      code: randomCode,
      tableNumber: tableNumber.trim() || 'Meja Umum',
      quotaTotal: quota,
      quotaUsed: 0,
      createdAt: Date.now(),
      status: 'active',
    };

    updateAppState((prev) => {
      const currentVouchers =
        prev?.vouchers && typeof prev.vouchers === 'object' ? { ...prev.vouchers } : {};
      return {
        ...prev,
        vouchers: {
          ...currentVouchers,
          [randomCode]: newVoucher,
        },
      };
    });

    return newVoucher;
  };

  const revokeVoucher = (code: string) => {
    updateAppState((prev) => {
      const currentVouchers =
        prev?.vouchers && typeof prev.vouchers === 'object' ? { ...prev.vouchers } : {};
      delete currentVouchers[code];
      return {
        ...prev,
        vouchers: currentVouchers,
      };
    });
  };

  const setDailyPin = (enabled: boolean, code: string) => {
    updateAppState((prev) => ({
      ...prev,
      dailyPin: {
        enabled,
        code: code.trim(),
      },
    }));
  };

  const validateVoucher = async (
    code: string,
    targetTable?: string
  ): Promise<{ valid: boolean; voucher?: Voucher; isDailyPin?: boolean; message?: string }> => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { valid: false, message: 'Kode voucher tidak boleh kosong.' };
    }

    // 1. Cek Master Daily PIN
    if (
      appState?.dailyPin?.enabled &&
      (appState.dailyPin.code === trimmed ||
        appState.dailyPin.code.toLowerCase() === trimmed.toLowerCase())
    ) {
      return {
        valid: true,
        isDailyPin: true,
        voucher: {
          code: trimmed,
          tableNumber: targetTable || 'Master PIN',
          quotaTotal: 999,
          quotaUsed: 0,
          createdAt: Date.now(),
          status: 'active',
        },
      };
    }

    // 2. Cek Voucher di Local React State
    const currentVouchers: Record<string, Voucher> =
      appState?.vouchers && typeof appState.vouchers === 'object' ? { ...appState.vouchers } : {};

    let foundVoucher = Object.values(currentVouchers).find(
      (v) => v && v.code && v.code.trim().toUpperCase() === trimmed.toUpperCase()
    );

    // 3. Fallback: Jika belum ada di state, cek LocalStorage
    if (!foundVoucher) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.vouchers) {
            foundVoucher = Object.values(parsed.vouchers as Record<string, Voucher>).find(
              (v) => v && v.code && v.code.trim().toUpperCase() === trimmed.toUpperCase()
            );
          }
        }
      } catch {}
    }

    // 4. Fallback Cloud: Jika belum tersinkron di HP tamu, fetch live langsung ke Firebase Realtime Database
    if (!foundVoucher) {
      const db = initFirebaseDatabase();
      if (db) {
        try {
          const vouchersRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers`);
          const snap = await get(vouchersRef);
          if (snap.exists()) {
            const cloudVouchers = snap.val() as Record<string, Voucher>;
            foundVoucher = Object.values(cloudVouchers).find(
              (v) => v && v.code && v.code.trim().toUpperCase() === trimmed.toUpperCase()
            );
            if (foundVoucher) {
              updateAppState((prev) => ({
                ...prev,
                vouchers: {
                  ...(prev?.vouchers || {}),
                  ...cloudVouchers,
                },
              }));
            }
          }
        } catch (err) {
          console.warn('Cloud voucher check error:', err);
        }
      }
    }

    if (!foundVoucher) {
      return {
        valid: false,
        message: `Kode voucher "${trimmed}" tidak ditemukan. Pastikan kode sudah benar atau dibuat oleh kasir.`,
      };
    }

    if (foundVoucher.status === 'exhausted' || foundVoucher.quotaUsed >= foundVoucher.quotaTotal) {
      return { valid: false, message: 'Kuota lagu untuk voucher ini sudah habis.' };
    }

    return { valid: true, voucher: foundVoucher };
  };

  const updateCafeSettings = (newSettings: Partial<CafeSettings>) => {
    updateAppState((prev) => {
      const current = prev?.cafeSettings || DEFAULT_CAFE_SETTINGS;
      const merged: CafeSettings = {
        ...current,
        ...newSettings,
      };
      return {
        ...prev,
        cafeSettings: merged,
        runningText:
          prev.runningText && (prev.runningText === current.welcomeMessage || prev.runningText.includes(current.name))
            ? prev.runningText.replace(new RegExp(current.name, 'g'), merged.name)
            : prev.runningText,
      };
    });
  };

  const addTable = (tableName: string) => {
    const trimmed = tableName.trim();
    if (!trimmed) return;
    updateAppState((prev) => {
      const currentTables = Array.isArray(prev?.tables) && prev.tables.length > 0 ? prev.tables : DEFAULT_TABLES;
      if (currentTables.some((t) => isSameTable(t, trimmed))) {
        return prev;
      }
      return {
        ...prev,
        tables: [...currentTables, trimmed],
      };
    });
  };

  const removeTable = (tableName: string): { success: boolean; reason?: string } => {
    const trimmed = tableName.trim();
    const currentOrders = Object.values(appState?.tableOrders || {});
    const hasUnpaidOrders = currentOrders.some((o) => {
      const s = o.status?.toLowerCase();
      return isSameTable(o.tableNumber, trimmed) && s !== 'paid' && s !== 'cancelled';
    });

    if (hasUnpaidOrders) {
      return {
        success: false,
        reason: `Meja "${trimmed}" tidak dapat dihapus karena masih memiliki pesanan F&B aktif di kasir.`,
      };
    }

    const currentVouchers = Object.values(appState?.vouchers || {});
    const hasActiveVouchers = currentVouchers.some(
      (v) => isSameTable(v.tableNumber, trimmed) && v.status === 'active' && v.quotaUsed < v.quotaTotal
    );

    if (hasActiveVouchers) {
      return {
        success: false,
        reason: `Meja "${trimmed}" masih memiliki kuota voucher karaoke aktif.`,
      };
    }

    updateAppState((prev) => {
      const currentTables = Array.isArray(prev?.tables) && prev.tables.length > 0 ? prev.tables : DEFAULT_TABLES;
      const updated = currentTables.filter((t) => !isSameTable(t, trimmed));
      return {
        ...prev,
        tables: updated.length > 0 ? updated : ['Meja 1'],
      };
    });

    return { success: true };
  };

  const resetTables = () => {
    updateAppState((prev) => ({
      ...prev,
      tables: DEFAULT_TABLES,
    }));
  };

  const updateLocalServerIp = (ip: string) => {
    const cleanIp = ip.trim();
    updateAppState((prev) => ({
      ...prev,
      cafeSettings: {
        ...(prev?.cafeSettings || DEFAULT_CAFE_SETTINGS),
        localServerIp: cleanIp,
      },
    }));
  };

  const updateRolePasswords = (operatorPass?: string, posPass?: string) => {
    updateAppState((prev) => {
      const current = prev?.cafeSettings || DEFAULT_CAFE_SETTINGS;
      return {
        ...prev,
        cafeSettings: {
          ...current,
          ...(operatorPass !== undefined ? { operatorPassword: operatorPass.trim() } : {}),
          ...(posPass !== undefined ? { posPassword: posPass.trim() } : {}),
        },
      };
    });
  };

  return {
    state: {
      vouchers,
      dailyPin,
      cafeSettings,
      tables,
    },
    vouchers,
    dailyPin,
    cafeSettings,
    tables,
    createVoucher,
    revokeVoucher,
    setDailyPin,
    validateVoucher,
    updateCafeSettings,
    addTable,
    removeTable,
    resetTables,
    updateLocalServerIp,
    updateRolePasswords,
  };
}
