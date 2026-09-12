import { useState, useEffect, useRef } from 'react';
import { BROADCAST_CHANNEL_NAME } from '../constants/karaoke';
import { SyncMessage } from '../types';
import { initFirebaseDatabase, ref, onValue, set } from '../config/firebase';

/**
 * Memastikan struktur state selalu aman dari nilai null/undefined (terutama dari Firebase RTDB)
 */
function sanitizeState<T>(val: any, fallback: T): T {
  if (!val || typeof val !== 'object') {
    return fallback;
  }
  const merged: any = { ...fallback, ...val };
  if ('queue' in (fallback as any)) {
    merged.queue = Array.isArray(val.queue) ? val.queue : [];
  }
  if ('history' in (fallback as any)) {
    merged.history = Array.isArray(val.history) ? val.history : [];
  }
  if ('songLibrary' in (fallback as any)) {
    merged.songLibrary =
      val.songLibrary && typeof val.songLibrary === 'object'
        ? val.songLibrary
        : (fallback as any).songLibrary || {};
  }
  if ('vouchers' in (fallback as any)) {
    merged.vouchers =
      val.vouchers && typeof val.vouchers === 'object'
        ? val.vouchers
        : (fallback as any).vouchers || {};
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
    merged.tableOrders =
      val.tableOrders && typeof val.tableOrders === 'object'
        ? val.tableOrders
        : (fallback as any).tableOrders || {};
  }
  if ('expenses' in (fallback as any)) {
    merged.expenses =
      val.expenses && typeof val.expenses === 'object'
        ? val.expenses
        : (fallback as any).expenses || {};
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
            const safeVal = sanitizeState<T>(cloudVal, initialState);
            isSettingFromCloudRef.current = true;
            setState(safeVal);

            // Simpan juga ke cache lokal
            try {
              window.localStorage.setItem(key, JSON.stringify(safeVal));
            } catch (e) {}

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
          setState(sanitizeState<T>(event.data.value, initialState));
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

  // 3. Fungsi Pembaruan State (Multi-target: Local State + LocalStorage + Broadcast + Firebase)
  const updateState = (newValueOrFunction: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const computed =
        typeof newValueOrFunction === 'function'
          ? (newValueOrFunction as (prev: T) => T)(prevState)
          : newValueOrFunction;

      const newValue = sanitizeState<T>(computed, initialState);

      // Update LocalStorage
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {}

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
              set(dbRef, newValue).catch((err) => {
                console.warn('Gagal menulis ke Firebase Cloud:', err);
              });
            } catch (err) {}
          }
        }, 120);
      }

      return newValue;
    });
  };

  return [state, updateState, isCloudConnected];
}

