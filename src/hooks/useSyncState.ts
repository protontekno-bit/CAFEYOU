import { useState, useEffect, useRef } from 'react';
import { BROADCAST_CHANNEL_NAME } from '../constants/karaoke';
import { SyncMessage } from '../types';
import { initFirebaseDatabase, ref, onValue, set, update } from '../config/firebase';

/**
 * Memastikan struktur state selalu aman dari nilai null/undefined (terutama dari Firebase RTDB)
 */
function sanitizeState<T>(val: any, fallback: T, currentState?: any): T {
  if (!val || typeof val !== 'object') {
    return fallback;
  }
  const merged: any = { ...fallback, ...val };
  if ('queue' in (fallback as any)) {
    // Firebase RTDB menyimpan array sebagai object {0: item, 1: item, ...}
    // Harus handle kedua kasus: native array JS dan object Firebase
    if (Array.isArray(val.queue)) {
      merged.queue = val.queue;
    } else if (val.queue && typeof val.queue === 'object') {
      merged.queue = Object.values(val.queue);
    } else {
      merged.queue = [];
    }
  }
  if ('history' in (fallback as any)) {
    // Firebase RTDB menyimpan array sebagai object {0: item, 1: item, ...}
    if (Array.isArray(val.history)) {
      merged.history = val.history;
    } else if (val.history && typeof val.history === 'object') {
      merged.history = Object.values(val.history);
    } else {
      merged.history = [];
    }
  }
  if ('songLibrary' in (fallback as any)) {
    merged.songLibrary =
      val.songLibrary && typeof val.songLibrary === 'object'
        ? val.songLibrary
        : (fallback as any).songLibrary || {};
  }
  if ('vouchers' in (fallback as any)) {
    if (val.vouchers && typeof val.vouchers === 'object' && Object.keys(val.vouchers).length > 0) {
      merged.vouchers = val.vouchers;
    } else if (
      currentState &&
      currentState.vouchers &&
      typeof currentState.vouchers === 'object' &&
      Object.keys(currentState.vouchers).length > 0
    ) {
      merged.vouchers = currentState.vouchers;
    } else {
      merged.vouchers = (fallback as any).vouchers || {};
    }
  }
  if ('dailyPin' in (fallback as any)) {
    merged.dailyPin =
      val.dailyPin && typeof val.dailyPin === 'object'
        ? val.dailyPin
        : (fallback as any).dailyPin || { enabled: false, code: '1234' };
  }
  if ('fairRotationEnabled' in (fallback as any)) {
    merged.fairRotationEnabled =
      typeof val.fairRotationEnabled === 'boolean'
        ? val.fairRotationEnabled
        : (fallback as any).fairRotationEnabled || false;
  }
  if ('cafeSettings' in (fallback as any)) {
    merged.cafeSettings =
      val.cafeSettings && typeof val.cafeSettings === 'object'
        ? { ...(fallback as any).cafeSettings, ...val.cafeSettings }
        : (fallback as any).cafeSettings;
  }
  if ('tables' in (fallback as any)) {
    merged.tables =
      Array.isArray(val.tables) && val.tables.length > 0
        ? val.tables
        : typeof val.tables === 'object' && val.tables !== null
        ? Object.values(val.tables)
        : (fallback as any).tables || [];
  }
  if ('autoSaveLibrary' in (fallback as any)) {
    merged.autoSaveLibrary =
      typeof val.autoSaveLibrary === 'boolean'
        ? val.autoSaveLibrary
        : (fallback as any).autoSaveLibrary ?? true;
  }
  if ('menuItems' in (fallback as any)) {
    merged.menuItems =
      val.menuItems && typeof val.menuItems === 'object'
        ? val.menuItems
        : (fallback as any).menuItems || {};
  }
  if ('tableOrders' in (fallback as any)) {
    // Jika cloudVal memuat tableOrders, gunakan itu.
    // Jika cloudVal tidak memuatnya (karena update dipisah), PERTAHANKAN tableOrders dari currentState/fallback.
    if (val.tableOrders && typeof val.tableOrders === 'object') {
      merged.tableOrders = val.tableOrders;
    } else if (
      currentState &&
      currentState.tableOrders &&
      typeof currentState.tableOrders === 'object' &&
      Object.keys(currentState.tableOrders).length > 0
    ) {
      merged.tableOrders = currentState.tableOrders;
    } else {
      merged.tableOrders = (fallback as any).tableOrders || {};
    }
  }
  if ('expenses' in (fallback as any)) {
    // Jika cloudVal memuat expenses, gunakan itu.
    // Jika cloudVal tidak memuatnya (karena update dipisah), PERTAHANKAN expenses dari currentState/fallback.
    if (val.expenses && typeof val.expenses === 'object') {
      merged.expenses = val.expenses;
    } else if (
      currentState &&
      currentState.expenses &&
      typeof currentState.expenses === 'object' &&
      Object.keys(currentState.expenses).length > 0
    ) {
      merged.expenses = currentState.expenses;
    } else {
      merged.expenses = (fallback as any).expenses || {};
    }
  }
  return merged as T;
}

/**
 * Custom Hook Hybrid Real-time State Synchronization:
 * 1. Menghubungkan ke Firebase Realtime Database secara bidirectional.
 * 2. Memantau `.info/connected` untuk status online/offline nirkabel akurat.
 * 3. Menyinkronkan ke BroadcastChannel (untuk instan multi-tab di perangkat yang sama).
 * 4. Menyimpan ke LocalStorage (sebagai offline cache & fallback anti-hilang saat reload).
 */
export function useSyncState<T>(
  key: string,
  initialState: T
): [T, (valueOrFn: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? sanitizeState<T>(JSON.parse(item), initialState) : initialState;
    } catch (error) {
      return initialState;
    }
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isSettingFromCloudRef = useRef<boolean>(false);
  const firebaseWriteTimerRef = useRef<any>(null);
  const stateRef = useRef<T>(state);
  stateRef.current = state;

  // Cleanup pending debounce timer saat unmount
  useEffect(() => {
    return () => {
      if (firebaseWriteTimerRef.current) {
        clearTimeout(firebaseWriteTimerRef.current);
      }
    };
  }, []);

  // 1. Inisialisasi Firebase Listener & Connection Status
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) {
      setIsCloudConnected(false);
      return;
    }

    try {
      // Pantau status koneksi socket real-time Firebase
      const connectedRef = ref(db, '.info/connected');
      const unsubConnected = onValue(connectedRef, (snap) => {
        setIsCloudConnected(snap.val() === true);
      });

      // Pantau data state kafe
      const dbRef = ref(db, `cafeyou/${key}`);
      const unsubData = onValue(
        dbRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const cloudVal = snapshot.val();
            isSettingFromCloudRef.current = true;

            setState((prevState) => {
              const safeVal = sanitizeState<T>(cloudVal, initialState, prevState);

              // Hindari re-render jika data identik
              try {
                if (JSON.stringify(safeVal) === JSON.stringify(prevState)) {
                  return prevState;
                }
              } catch {}

              // Simpan juga ke cache lokal tanpa menimpa tableOrders & expenses yang ada
              try {
                window.localStorage.setItem(key, JSON.stringify(safeVal));
              } catch (e) {}

              return safeVal;
            });

            setTimeout(() => {
              isSettingFromCloudRef.current = false;
            }, 60);
          }
        },
        (error) => {
          console.warn('Firebase onValue error, beralih ke sinkronisasi lokal:', error);
          setIsCloudConnected(false);
        }
      );

      return () => {
        unsubConnected();
        unsubData();
      };
    } catch (err) {
      console.warn('Gagal memasang Firebase listener:', err);
      setIsCloudConnected(false);
    }
  }, [key]);


  // 2. BroadcastChannel Listener (untuk sinkronisasi multi-tab lokal pada perangkat yang sama)
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event: MessageEvent<SyncMessage<T>>) => {
        if (event.data && event.data.key === key) {
          // Gunakan setState callback agar prevState tersedia sebagai currentState
          // Ini mencegah vouchers/tableOrders/expenses terhapus saat sync antar-tab
          setState((prevState) => {
            const safeVal = sanitizeState<T>(event.data.value, initialState, prevState);
            try {
              if (JSON.stringify(safeVal) === JSON.stringify(prevState)) {
                return prevState;
              }
            } catch {}
            return safeVal;
          });
        }
      };

      return () => {
        channel.close();
        channelRef.current = null;
      };
    } catch (error) {
      console.warn('BroadcastChannel tidak didukung:', error);
    }
  }, [key]);

function safeSaveLocalStorage(key: string, data: any) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err: any) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      try {
        // Pangkas riwayat lagu lama ke 20 item untuk membebaskan kuota LocalStorage
        const pruned = { ...data };
        if (Array.isArray(pruned.history)) {
          pruned.history = pruned.history.slice(0, 20);
        }
        window.localStorage.setItem(key, JSON.stringify(pruned));
      } catch (retryErr) {
        console.warn('Kapasitas LocalStorage penuh setelah pemangkasan:', retryErr);
      }
    }
  }
}

  // 3. Fungsi Pembaruan State (Multi-target: Local State + LocalStorage + Broadcast + Firebase)
  const updateState = (newValueOrFunction: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const computed =
        typeof newValueOrFunction === 'function'
          ? (newValueOrFunction as (prev: T) => T)(prevState)
          : newValueOrFunction;

      const newValue = sanitizeState<T>(computed, initialState, prevState);

      // Cek apakah mutasi ini benar-benar mengubah antrean atau riwayat
      const prevQueue = (prevState as any)?.queue;
      const nextQueue = (newValue as any)?.queue;
      const isQueueChanged =
        prevQueue !== nextQueue &&
        (Array.isArray(prevQueue) !== Array.isArray(nextQueue) ||
          (Array.isArray(nextQueue) &&
            (prevQueue?.length !== nextQueue.length ||
              JSON.stringify(prevQueue) !== JSON.stringify(nextQueue))));

      const prevHistory = (prevState as any)?.history;
      const nextHistory = (newValue as any)?.history;
      const isHistoryChanged =
        prevHistory !== nextHistory &&
        Array.isArray(nextHistory) &&
        (prevHistory?.length !== nextHistory.length ||
          JSON.stringify(prevHistory) !== JSON.stringify(nextHistory));

      // Update LocalStorage dengan proteksi kuota
      safeSaveLocalStorage(key, newValue);

      // Update BroadcastChannel (Lokal)
      if (channelRef.current) {
        try {
          channelRef.current.postMessage({ key, value: newValue });
        } catch (error) {}
      }

      // Update Firebase Cloud (Nirkabel ke semua perangkat - Debounced 120ms)
      if (!isSettingFromCloudRef.current) {
        if (firebaseWriteTimerRef.current) {
          clearTimeout(firebaseWriteTimerRef.current);
        }
        firebaseWriteTimerRef.current = setTimeout(() => {
          const db = initFirebaseDatabase();
          if (db) {
            try {
              const dbRef = ref(db, `cafeyou/${key}`);
              // Pisahkan tableOrders, expenses, dan vouchers agar TIDAK terhapus/tertimpa
              // Pisahkan juga queue & history agar tidak tertimpa kecuali benar-benar diubah
              const {
                tableOrders: _to,
                expenses: _exp,
                vouchers: _vouch,
                queue: _q,
                history: _hist,
                ...cleanState
              } = newValue as any;
              const sanitizedPayload = JSON.parse(JSON.stringify(cleanState));

              // Tulis field non-array (lagu aktif, settings, volume, dll) dengan update()
              update(dbRef, sanitizedPayload).catch((err) => {
                console.warn('Gagal menulis state ke Firebase Cloud:', err);
              });

              // HANYA tulis queue jika pembaruan ini memang mengubah susunan/isi antrean
              // (Mencegah slider volume / setting kafe menimpa lagu baru dari meja tamu)
              if (isQueueChanged) {
                const queueRef = ref(db, `cafeyou/${key}/queue`);
                set(queueRef, Array.isArray(_q) ? _q : []).catch((err) => {
                  console.warn('Gagal menulis queue ke Firebase Cloud:', err);
                });
              }

              // HANYA tulis history jika riwayat lagu bertambah
              if (isHistoryChanged) {
                const historyRef = ref(db, `cafeyou/${key}/history`);
                set(historyRef, Array.isArray(_hist) ? _hist : []).catch((err) => {
                  console.warn('Gagal menulis history ke Firebase Cloud:', err);
                });
              }
            } catch (err) {}
          }
        }, 120);
      }

      return newValue;
    });
  };

  return [state, updateState, isCloudConnected];
}

