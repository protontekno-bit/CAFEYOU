import { useEffect, useRef } from 'react';
import { KaraokeState, ExpenseItem, ExpenseCategory } from '../../types';
import { STORAGE_KEY } from '../../constants/karaoke';
import { initFirebaseDatabase, ref, onValue, set } from '../../config/firebase';

export function useCashExpenses(
  appState: KaraokeState,
  updateAppState: (updater: (prev: KaraokeState) => KaraokeState) => void
) {
  const updateAppStateRef = useRef(updateAppState);
  updateAppStateRef.current = updateAppState;

  // Dedicated Real-time Listener untuk expenses (kas keluar) langsung dari Firebase RTDB
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) return;

    try {
      const expensesRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses`);
      const unsubExpenses = onValue(expensesRef, (snapshot) => {
        const cloudExpenses = snapshot.exists() ? snapshot.val() : {};
        if (cloudExpenses && typeof cloudExpenses === 'object') {
          updateAppStateRef.current((prev) => {
            const currentExpenses = prev?.expenses || {};
            const prevStr = JSON.stringify(currentExpenses);
            const cloudStr = JSON.stringify(cloudExpenses);
            if (prevStr === cloudStr) return prev;
            return {
              ...prev,
              expenses: cloudExpenses,
            };
          });
        }
      });

      return () => {
        unsubExpenses();
      };
    } catch (err) {
      console.warn('Gagal memasang realtime listener expenses:', err);
    }
  }, []);

  const expenses: Record<string, ExpenseItem> =
    appState?.expenses && typeof appState.expenses === 'object' ? appState.expenses : {};

  const addExpense = (
    category: ExpenseCategory,
    title: string,
    amount: number,
    notes?: string,
    recordedBy?: string,
    paymentSource: 'CASH_DRAWER' | 'BANK_TRANSFER' = 'CASH_DRAWER'
  ): ExpenseItem => {
    const timestamp = Date.now();
    const id = `exp-${timestamp}-${Math.random().toString(36).substring(2, 6)}`;
    const newExpense: ExpenseItem = {
      id,
      category,
      title: title.trim() || 'Pengeluaran Operasional',
      amount: Math.max(0, Number(amount) || 0),
      notes: notes?.trim() || '',
      recordedBy: recordedBy?.trim() || 'Staf Kasir',
      createdAt: timestamp,
      paymentSource,
    };

    updateAppState((prev) => {
      const currentExpenses =
        prev?.expenses && typeof prev.expenses === 'object' ? { ...prev.expenses } : {};
      return {
        ...prev,
        expenses: {
          ...currentExpenses,
          [id]: newExpense,
        },
      };
    });

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const expRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses/${id}`);
        set(expRef, JSON.parse(JSON.stringify(newExpense))).catch((err) => {
          console.warn('Gagal menyimpan pengeluaran langsung ke Firebase:', err);
        });
      }
    } catch (err) {}

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    updateAppState((prev) => {
      const currentExpenses =
        prev?.expenses && typeof prev.expenses === 'object' ? { ...prev.expenses } : {};
      delete currentExpenses[id];
      return {
        ...prev,
        expenses: currentExpenses,
      };
    });

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const expRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses/${id}`);
        set(expRef, null).catch((err) => {
          console.warn('Gagal hapus pengeluaran di Firebase:', err);
        });
      }
    } catch (err) {}
  };

  const clearExpenses = () => {
    updateAppState((prev) => ({
      ...prev,
      expenses: {},
    }));

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const expRef = ref(db, `cafeyou/${STORAGE_KEY}/expenses`);
        set(expRef, {}).catch((err) => {
          console.warn('Gagal reset pengeluaran di Firebase:', err);
        });
      }
    } catch (err) {}
  };

  return {
    state: {
      expenses,
    },
    expenses,
    addExpense,
    deleteExpense,
    clearExpenses,
  };
}
