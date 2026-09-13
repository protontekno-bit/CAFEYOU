import { useEffect } from 'react';
import { KaraokeState, Voucher, CafeSettings } from '../../types';
import { STORAGE_KEY, DEFAULT_CAFE_SETTINGS, DEFAULT_TABLES } from '../../constants/karaoke';
import { initFirebaseDatabase, ref, onValue, set, get } from '../../config/firebase';

import { normalizeTable, isSameTable } from '../../utils/table';
export { normalizeTable, isSameTable };

export function useVoucherAuth(
  appState: KaraokeState,
  updateAppState: (updater: (prev: KaraokeState) => KaraokeState) => void
) {
  // 1. Dedicated Real-time Listeners untuk vouchers dan tables dari Firebase RTDB
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) return;

    try {
      // Realtime listener untuk vouchers
      const vouchersRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers`);
      const unsubVouchers = onValue(vouchersRef, (snapshot) => {
        const cloudVouchers = snapshot.exists() ? snapshot.val() : {};
        if (cloudVouchers && typeof cloudVouchers === 'object') {
          updateAppState((prev) => {
            const current = prev?.vouchers || {};
            if (JSON.stringify(current) === JSON.stringify(cloudVouchers)) return prev;
            return {
              ...prev,
              vouchers: cloudVouchers,
            };
          });
        }
      });

      // Realtime listener untuk tables
      const tablesRef = ref(db, `cafeyou/${STORAGE_KEY}/tables`);
      const unsubTables = onValue(tablesRef, (snapshot) => {
        if (snapshot.exists()) {
          const cloudTables = snapshot.val();
          const list = Array.isArray(cloudTables)
            ? cloudTables
            : typeof cloudTables === 'object' && cloudTables !== null
            ? Object.values(cloudTables)
            : null;
          if (list && list.length > 0) {
            updateAppState((prev) => {
              const current = prev?.tables || [];
              if (JSON.stringify(current) === JSON.stringify(list)) return prev;
              return {
                ...prev,
                tables: list as string[],
              };
            });
          }
        }
      });

      return () => {
        unsubVouchers();
        unsubTables();
      };
    } catch (err) {
      console.warn('Gagal memasang realtime listener vouchers/tables:', err);
    }
  }, [updateAppState]);

  const vouchers =
    appState?.vouchers && typeof appState.vouchers === 'object' ? appState.vouchers : {};
  const dailyPin = appState?.dailyPin || { enabled: false, code: '1234' };
  const cafeSettings = appState?.cafeSettings || DEFAULT_CAFE_SETTINGS;
  const tables = Array.isArray(appState?.tables) && appState.tables.length > 0 ? appState.tables : DEFAULT_TABLES;

  const createVoucher = (tableNumber: string, quota: number = 3): Voucher => {
    // Generate unique 4-digit code that does not collide with existing vouchers
    const existingCodes = new Set(Object.keys(vouchers));
    let randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    while (existingCodes.has(randomCode)) {
      randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    }

    const normalizedTable = normalizeTable(tableNumber) || 'Meja Umum';
    const newVoucher: Voucher = {
      code: randomCode,
      tableNumber: normalizedTable,
      quotaTotal: quota,
      quotaUsed: 0,
      createdAt: Date.now(),
      status: 'active',
    };

    const cleanCode = randomCode.toUpperCase().trim();
    // 1. Tulis langsung ke Firebase RTDB secara atomik
    try {
      const db = initFirebaseDatabase();
      if (db) {
        const vRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers/${cleanCode}`);
        set(vRef, newVoucher).catch((err) => {
          console.warn('Gagal simpan voucher ke Firebase RTDB:', err);
        });
      }
    } catch (err) {}

    // 2. Pembaruan optimistik ke state lokal
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
    const trimmed = code.trim();
    // 1. Hapus dari Firebase RTDB secara atomik
    try {
      const db = initFirebaseDatabase();
      if (db) {
        const vRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers/${trimmed}`);
        set(vRef, null).catch((err) => {
          console.warn('Gagal hapus voucher di Firebase RTDB:', err);
        });
      }
    } catch (err) {}

    // 2. Hapus dari state lokal
    updateAppState((prev) => {
      const currentVouchers =
        prev?.vouchers && typeof prev.vouchers === 'object' ? { ...prev.vouchers } : {};
      delete currentVouchers[trimmed];
      return {
        ...prev,
        vouchers: currentVouchers,
      };
    });
  };

  const setDailyPin = (enabled: boolean, code: string) => {
    const cleanPin = {
      enabled,
      code: code.trim(),
    };

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const pinRef = ref(db, `cafeyou/${STORAGE_KEY}/dailyPin`);
        set(pinRef, cleanPin).catch((err) => {
          console.warn('Gagal simpan dailyPin ke Firebase:', err);
        });
      }
    } catch (err) {}

    updateAppState((prev) => ({
      ...prev,
      dailyPin: cleanPin,
    }));
  };

  const validateVoucher = async (
    code: string,
    targetTable?: string
  ): Promise<{
    valid: boolean;
    voucher?: Voucher;
    isDailyPin?: boolean;
    tableMismatch?: boolean;
    assignedTable?: string;
    message?: string;
  }> => {
    const trimmed = code.trim();
    if (!trimmed) {
      return { valid: false, message: 'Silakan masukkan 4-digit Kode Voucher atau PIN.' };
    }

    // 1. Cek Master Daily PIN
    if (
      appState?.dailyPin?.enabled &&
      (appState.dailyPin.code === trimmed ||
        appState.dailyPin.code.toLowerCase() === trimmed.toLowerCase())
    ) {
      const effTable = normalizeTable(targetTable) || 'Master PIN';
      return {
        valid: true,
        isDailyPin: true,
        assignedTable: effTable,
        voucher: {
          code: trimmed,
          tableNumber: effTable,
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
          // Direct lookup leaf node first (case-insensitive key)
          const singleRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers/${trimmed.toUpperCase()}`);
          const singleSnap = await get(singleRef);
          if (singleSnap.exists()) {
            foundVoucher = singleSnap.val() as Voucher;
          } else {
            // Fallback scan all vouchers
            const vouchersRef = ref(db, `cafeyou/${STORAGE_KEY}/vouchers`);
            const snap = await get(vouchersRef);
            if (snap.exists()) {
              const cloudVouchers = snap.val() as Record<string, Voucher>;
              foundVoucher = Object.values(cloudVouchers).find(
                (v) => v && v.code && v.code.trim().toUpperCase() === trimmed.toUpperCase()
              );
            }
          }

          if (foundVoucher) {
            updateAppState((prev) => ({
              ...prev,
              vouchers: {
                ...(prev?.vouchers || {}),
                [foundVoucher!.code]: foundVoucher!,
              },
            }));
          }
        } catch (err) {
          console.warn('Cloud voucher check error:', err);
        }
      }
    }

    if (!foundVoucher) {
      return {
        valid: false,
        message: `Kode voucher "${trimmed}" tidak ditemukan. Pastikan kode sudah benar atau minta ke kasir.`,
      };
    }

    if (
      foundVoucher.status === 'exhausted' ||
      (foundVoucher.quotaUsed >= foundVoucher.quotaTotal && foundVoucher.quotaTotal !== 999)
    ) {
      return {
        valid: false,
        message: `Kuota lagu untuk voucher ini sudah habis (${foundVoucher.quotaUsed}/${foundVoucher.quotaTotal} lagu terpakai).`,
      };
    }

    // 5. Validasi Kesesuaian Meja (Table Matching Accuracy)
    const voucherTable = normalizeTable(foundVoucher.tableNumber) || 'Meja Umum';
    const isGeneralVoucher =
      !voucherTable ||
      isSameTable(voucherTable, 'Meja Umum') ||
      voucherTable.toLowerCase().includes('semua');

    const hasTargetTable =
      targetTable &&
      targetTable.trim() &&
      !isSameTable(targetTable, 'Meja Umum');

    if (hasTargetTable && !isGeneralVoucher && !isSameTable(targetTable, voucherTable)) {
      return {
        valid: false,
        tableMismatch: true,
        assignedTable: voucherTable,
        voucher: foundVoucher,
        message: `Kode voucher ini terdaftar untuk ${voucherTable}, sedangkan Anda berada di ${targetTable}. Silakan beralih ke ${voucherTable} atau gunakan voucher yang sesuai.`,
      };
    }

    return {
      valid: true,
      voucher: {
        ...foundVoucher,
        tableNumber: voucherTable,
      },
      assignedTable: voucherTable,
    };
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
    const trimmed = normalizeTable(tableName);
    if (!trimmed) return;
    updateAppState((prev) => {
      const currentTables = Array.isArray(prev?.tables) && prev.tables.length > 0 ? prev.tables : DEFAULT_TABLES;
      if (currentTables.some((t) => isSameTable(t, trimmed))) {
        return prev;
      }
      const updated = [...currentTables, trimmed];

      try {
        const db = initFirebaseDatabase();
        if (db) {
          const tablesRef = ref(db, `cafeyou/${STORAGE_KEY}/tables`);
          set(tablesRef, updated).catch((err) => {
            console.warn('Gagal simpan tables ke Firebase:', err);
          });
        }
      } catch (err) {}

      return {
        ...prev,
        tables: updated,
      };
    });
  };

  const removeTable = (tableName: string): { success: boolean; reason?: string } => {
    const trimmed = normalizeTable(tableName);
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
      const nextTables = updated.length > 0 ? updated : ['Meja 1'];

      try {
        const db = initFirebaseDatabase();
        if (db) {
          const tablesRef = ref(db, `cafeyou/${STORAGE_KEY}/tables`);
          set(tablesRef, nextTables).catch((err) => {
            console.warn('Gagal hapus table di Firebase:', err);
          });
        }
      } catch (err) {}

      return {
        ...prev,
        tables: nextTables,
      };
    });

    return { success: true };
  };

  const resetTables = () => {
    try {
      const db = initFirebaseDatabase();
      if (db) {
        const tablesRef = ref(db, `cafeyou/${STORAGE_KEY}/tables`);
        set(tablesRef, DEFAULT_TABLES).catch((err) => {
          console.warn('Gagal reset tables di Firebase:', err);
        });
      }
    } catch (err) {}

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
