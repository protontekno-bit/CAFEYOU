import { useEffect } from 'react';
import {
  KaraokeState,
  MenuItem,
  OrderItem,
  OrderStatus,
  TableOrder,
  OrderType,
  DeliveryPlatform,
  KitchenStationFilter,
} from '../../types';
import { DEFAULT_MENU_ITEMS } from '../../constants/menu';
import { STORAGE_KEY } from '../../constants/karaoke';
import { initFirebaseDatabase, ref, onValue, set } from '../../config/firebase';
import { isDrinkItem } from '../../utils/billing';

export function useOrderBilling(
  appState: KaraokeState,
  updateAppState: (updater: (prev: KaraokeState) => KaraokeState) => void
) {
  // Dedicated Real-time Listener untuk tableOrders langsung dari Firebase RTDB
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) return;

    try {
      const ordersRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders`);
      const unsubOrders = onValue(ordersRef, (snapshot) => {
        const cloudOrders = snapshot.exists() ? snapshot.val() : {};
        if (cloudOrders && typeof cloudOrders === 'object') {
          updateAppState((prev) => {
            const currentOrders = prev?.tableOrders || {};
            const prevStr = JSON.stringify(currentOrders);
            const cloudStr = JSON.stringify(cloudOrders);
            if (prevStr === cloudStr) return prev;
            return {
              ...prev,
              tableOrders: cloudOrders,
            };
          });
        }
      });

      return () => {
        unsubOrders();
      };
    } catch (err) {
      console.warn('Gagal memasang realtime listener tableOrders:', err);
    }
  }, [updateAppState]);

  const menuItems: Record<string, MenuItem> =
    appState?.menuItems && typeof appState.menuItems === 'object'
      ? appState.menuItems
      : DEFAULT_MENU_ITEMS;

  const tableOrders: Record<string, TableOrder> =
    appState?.tableOrders && typeof appState.tableOrders === 'object'
      ? appState.tableOrders
      : {};

  // Helper untuk mencari order berdasarkan ID baik dari key map ataupun id property
  const findOrder = (orderId: string): TableOrder | null => {
    if (tableOrders && tableOrders[orderId]) return tableOrders[orderId];
    if (tableOrders) {
      const found = Object.values(tableOrders).find((o) => o && o.id === orderId);
      if (found) return found;
    }
    return null;
  };

  // Helper mutasi atomik langsung ke node Firebase RTDB dan state lokal
  const mutateAndSyncOrder = (
    orderId: string,
    transform: (currentOrder: TableOrder) => TableOrder | null
  ) => {
    let orderToSync: TableOrder | null = null;
    let targetKey = orderId;

    const target = findOrder(orderId);
    if (target) {
      targetKey = target.id || orderId;
      orderToSync = transform(target);
    }

    if (orderToSync) {
      try {
        const db = initFirebaseDatabase();
        if (db) {
          const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${targetKey}`);
          set(orderRef, JSON.parse(JSON.stringify(orderToSync))).catch((err) => {
            console.warn('Gagal sinkronisasi pesanan ke Firebase RTDB:', err);
          });
        }
      } catch (err) {
        console.warn('Error Firebase RTDB:', err);
      }
    }

    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? { ...prev.tableOrders } : {};

      const localTarget =
        currentOrders[orderId] || Object.values(currentOrders).find((o) => o && o.id === orderId);
      if (!localTarget && !orderToSync) return prev;

      const finalUpdated = orderToSync || (localTarget ? transform(localTarget) : null);
      if (!finalUpdated) return prev;

      const finalKey = finalUpdated.id || targetKey;

      if (!orderToSync) {
        try {
          const db = initFirebaseDatabase();
          if (db) {
            const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${finalKey}`);
            set(orderRef, JSON.parse(JSON.stringify(finalUpdated))).catch((err) => {
              console.warn('Gagal sinkronisasi fallback ke Firebase RTDB:', err);
            });
          }
        } catch (err) {}
      }

      return {
        ...prev,
        tableOrders: {
          ...currentOrders,
          [finalKey]: finalUpdated,
        },
      };
    });
  };

  const createTableOrder = async (
    tableNumber: string,
    customerName: string,
    items: OrderItem[],
    orderType: OrderType = 'DINE_IN',
    platform?: DeliveryPlatform,
    initialStatus: OrderStatus = 'pending',
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'ONLINE_MERCHANT' | 'online_merchant',
    financials?: {
      subtotal?: number;
      taxAmount?: number;
      serviceAmount?: number;
      roundingAmount?: number;
      finalTotal?: number;
    }
  ): Promise<TableOrder | null> => {
    if (!items || items.length === 0) return null;

    const effectiveTable =
      (tableNumber && tableNumber.trim()) ||
      (orderType === 'TAKEAWAY' ? 'TAKEAWAY' : orderType === 'ONLINE_DELIVERY' ? (platform || 'ONLINE') : 'Meja Umum');

    const timestamp = Date.now();
    const orderSeq = (Object.keys(tableOrders).length + 1).toString().padStart(3, '0');
    const orderPrefix = orderType === 'TAKEAWAY' ? 'TKW' : orderType === 'ONLINE_DELIVERY' ? 'ONL' : 'ORD';
    const orderNumber = `${orderPrefix}-${orderSeq}`;

    const calculatedTotal = items.reduce((sum, item) => sum + item.price * (item.quantity ?? item.qty ?? 1), 0);
    const finalAmount = financials?.finalTotal !== undefined ? financials.finalTotal : calculatedTotal;

    const isPaid = initialStatus === 'paid' || (initialStatus as string).toLowerCase() === 'paid';

    const newOrder: TableOrder = {
      id: `order-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      tableNumber: effectiveTable,
      customerName: customerName.trim() || effectiveTable,
      items,
      totalAmount: finalAmount,
      subtotal: financials?.subtotal !== undefined ? financials.subtotal : calculatedTotal,
      taxAmount: financials?.taxAmount || 0,
      serviceAmount: financials?.serviceAmount || 0,
      roundingAmount: financials?.roundingAmount || 0,
      status: initialStatus,
      createdAt: timestamp,
      orderType,
      platform,
      ...(isPaid
        ? {
            paidAt: timestamp,
            paymentMethod: paymentMethod || (orderType === 'ONLINE_DELIVERY' ? 'ONLINE_MERCHANT' : 'cash'),
          }
        : {}),
    };

    // Sanitasi bersih agar tidak memuat properti bernilai undefined yang ditolak oleh Firebase RTDB
    const cleanOrder: TableOrder = JSON.parse(JSON.stringify(newOrder));

    // 1. Update state lokal segera
    updateAppState((prev) => {
      const currentOrders =
        prev?.tableOrders && typeof prev.tableOrders === 'object' ? prev.tableOrders : {};
      return {
        ...prev,
        tableOrders: {
          ...currentOrders,
          [cleanOrder.id]: cleanOrder,
        },
      };
    });

    // 2. Tulis langsung secara atomik ke node Firebase RTDB agar instan terkirim ke POS & Operator
    const db = initFirebaseDatabase();
    if (db) {
      try {
        const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${cleanOrder.id}`);
        await set(orderRef, cleanOrder);
      } catch (err: any) {
        console.error('Gagal menyimpan pesanan langsung ke Firebase:', err);
        throw new Error('Gagal mengirim pesanan ke cloud kasir. Periksa koneksi internet kafe.');
      }
    }

    return cleanOrder;
  };

  const updateTableOrderStatus = (
    orderId: string,
    status: OrderStatus,
    paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT',
    cancelReason?: string,
    financials?: {
      finalTotal?: number;
      subtotal?: number;
      taxAmount?: number;
      serviceAmount?: number;
      roundingAmount?: number;
    }
  ) => {
    mutateAndSyncOrder(orderId, (target) => {
      const isPaid = status === 'paid' || (status as string).toLowerCase() === 'paid';
      const isCancelled = status === 'cancelled' || (status as string).toLowerCase() === 'cancelled';

      return {
        ...target,
        status,
        ...(isPaid
          ? {
              paidAt: Date.now(),
              paymentMethod: paymentMethod || 'cash',
              totalAmount: financials?.finalTotal !== undefined ? financials.finalTotal : target.totalAmount,
              subtotal: financials?.subtotal !== undefined ? financials.subtotal : target.totalAmount,
              taxAmount: financials?.taxAmount || 0,
              serviceAmount: financials?.serviceAmount || 0,
              roundingAmount: financials?.roundingAmount || 0,
            }
          : {}),
        ...(isCancelled ? { cancelReason: cancelReason || 'Dibatalkan oleh Kasir' } : {}),
      };
    });
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const id = `menu-${Date.now()}`;
    const newItem: MenuItem = { ...item, id };
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? prev.menuItems : DEFAULT_MENU_ITEMS;
      return {
        ...prev,
        menuItems: {
          ...currentMenu,
          [id]: newItem,
        },
      };
    });
  };

  const updateMenuItem = (item: MenuItem) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? prev.menuItems : DEFAULT_MENU_ITEMS;
      return {
        ...prev,
        menuItems: {
          ...currentMenu,
          [item.id]: item,
        },
      };
    });
  };

  const deleteMenuItem = (id: string) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? { ...prev.menuItems } : {};
      delete currentMenu[id];
      return {
        ...prev,
        menuItems: currentMenu,
      };
    });
  };

  const resetMenuToDefault = () => {
    updateAppState((prev) => ({
      ...prev,
      menuItems: DEFAULT_MENU_ITEMS,
    }));
  };

  const toggleMenuItemAvailability = (id: string) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? { ...prev.menuItems } : { ...DEFAULT_MENU_ITEMS };
      const item = currentMenu[id];
      if (!item) return prev;

      currentMenu[id] = {
        ...item,
        isAvailable: !item.isAvailable,
      };

      return {
        ...prev,
        menuItems: currentMenu,
      };
    });
  };

  const quickUpdateMenuPrice = (id: string, newPrice: number) => {
    updateAppState((prev) => {
      const currentMenu =
        prev?.menuItems && typeof prev.menuItems === 'object' ? { ...prev.menuItems } : { ...DEFAULT_MENU_ITEMS };
      const item = currentMenu[id];
      if (!item) return prev;

      currentMenu[id] = {
        ...item,
        price: Math.max(0, newPrice),
      };

      return {
        ...prev,
        menuItems: currentMenu,
      };
    });
  };

  const moveTableOrder = (orderId: string, newTableNumber: string) => {
    mutateAndSyncOrder(orderId, (target) => {
      const oldTable = target.tableNumber;
      const history = target.tableMoveHistory || [];

      return {
        ...target,
        tableNumber: newTableNumber,
        tableMoveHistory: [
          ...history,
          { from: oldTable, to: newTableNumber, movedAt: Date.now() },
        ],
      };
    });
  };

  const voidOrderItem = (orderId: string, itemIndex: number, reason?: string) => {
    mutateAndSyncOrder(orderId, (target) => {
      if (!target.items || !target.items[itemIndex]) return target;

      const updatedItems = target.items.map((it, idx) => {
        if (idx === itemIndex) {
          return {
            ...it,
            isVoided: true,
            voidReason: reason || 'Stok dapur habis / Dibatalkan kasir',
          };
        }
        return it;
      });

      const newTotal = updatedItems.reduce((acc, it) => {
        if (it.isVoided) return acc;
        const count = it.quantity ?? it.qty ?? 1;
        return acc + it.price * count;
      }, 0);

      return {
        ...target,
        items: updatedItems,
        totalAmount: newTotal,
      };
    });
  };

  const toggleOrderItemStatus = (
    orderId: string,
    itemIndex: number,
    field: 'isCooked' | 'isServed'
  ) => {
    mutateAndSyncOrder(orderId, (target) => {
      if (!target.items || !target.items[itemIndex]) return target;

      const updatedItems = target.items.map((it, idx) => {
        if (idx === itemIndex) {
          const currentVal = !!it[field];
          return {
            ...it,
            [field]: !currentVal,
            ...(field === 'isCooked' && !currentVal ? { cookedAt: Date.now() } : {}),
          };
        }
        return it;
      });

      const nonVoidItems = updatedItems.filter((it) => !it.isVoided);
      const allCooked = nonVoidItems.length > 0 && nonVoidItems.every((it) => it.isCooked);
      const allServed = nonVoidItems.length > 0 && nonVoidItems.every((it) => it.isServed);

      let nextStatus = target.status;
      if (allServed) {
        nextStatus = 'SERVED';
      } else if (allCooked && target.status?.toLowerCase() !== 'served') {
        nextStatus = 'READY';
      }

      return {
        ...target,
        items: updatedItems,
        status: nextStatus,
      };
    });
  };

  const updateOrderItemsBulkStatus = (
    orderId: string,
    field: 'isCooked' | 'isServed',
    value: boolean,
    station: KitchenStationFilter = 'ALL'
  ) => {
    mutateAndSyncOrder(orderId, (target) => {
      if (!target.items) return target;

      const updatedItems = target.items.map((it) => {
        if (it.isVoided) return it;
        const isDrink = isDrinkItem(it);
        const matchesStation =
          station === 'ALL' ||
          (station === 'BAR' && isDrink) ||
          (station === 'KITCHEN' && !isDrink);

        if (matchesStation) {
          return {
            ...it,
            [field]: value,
            ...(field === 'isCooked' && value ? { cookedAt: it.cookedAt || Date.now() } : {}),
            ...(field === 'isServed' && value ? { isCooked: true, cookedAt: it.cookedAt || Date.now() } : {}),
            ...(field === 'isServed' && !value ? { isServed: false } : {}),
            ...(field === 'isCooked' && !value ? { isCooked: false, isServed: false } : {}),
          };
        }
        return it;
      });

      const nonVoidItems = updatedItems.filter((it) => !it.isVoided);
      const allCooked = nonVoidItems.length > 0 && nonVoidItems.every((it) => it.isCooked);
      const allServed = nonVoidItems.length > 0 && nonVoidItems.every((it) => it.isServed);

      let nextStatus = target.status;
      if (allServed) {
        nextStatus = 'SERVED';
      } else if (allCooked && target.status?.toLowerCase() !== 'served') {
        nextStatus = 'READY';
      } else if (field === 'isCooked' && value && nextStatus?.toLowerCase() === 'pending') {
        nextStatus = 'PREPARING';
      } else if (!value) {
        if (field === 'isServed' && target.status?.toLowerCase() === 'served') {
          nextStatus = allCooked ? 'READY' : 'PREPARING';
        } else if (field === 'isCooked' && target.status?.toLowerCase() === 'ready') {
          nextStatus = 'PREPARING';
        }
      }

      return {
        ...target,
        items: updatedItems,
        status: nextStatus,
      };
    });
  };

  const revertTableOrderStatus = (orderId: string) => {
    mutateAndSyncOrder(orderId, (target) => {
      const s = target.status?.toLowerCase();
      let nextStatus: OrderStatus = 'pending';
      let resetItems = target.items ? [...target.items] : [];

      if (s === 'served') {
        nextStatus = 'READY';
        resetItems = resetItems.map((it) => ({ ...it, isServed: false }));
      } else if (s === 'ready') {
        nextStatus = 'PREPARING';
        resetItems = resetItems.map((it) => ({ ...it, isCooked: false, isServed: false }));
      } else if (s === 'preparing' || s === 'cooking' || s === 'confirmed') {
        nextStatus = 'pending';
        resetItems = resetItems.map((it) => ({ ...it, isCooked: false, isServed: false }));
      } else {
        return target;
      }

      return {
        ...target,
        status: nextStatus,
        items: resetItems,
      };
    });
  };

  const confirmTableOrder = (orderId: string) => {
    updateTableOrderStatus(orderId, 'PREPARING');
  };

  const clearFinishedOrders = () => {
    const currentOrders =
      tableOrders && typeof tableOrders === 'object' ? { ...tableOrders } : {};
    const activeOnly: Record<string, TableOrder> = {};
    Object.entries(currentOrders).forEach(([id, ord]) => {
      const s = ord.status?.toLowerCase();
      if (
        s === 'pending' ||
        s === 'confirmed' ||
        s === 'preparing' ||
        s === 'cooking' ||
        s === 'ready' ||
        s === 'served'
      ) {
        activeOnly[id] = ord;
      }
    });

    try {
      const db = initFirebaseDatabase();
      if (db) {
        const ordersRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders`);
        set(ordersRef, JSON.parse(JSON.stringify(activeOnly))).catch((err) => {
          console.warn('Gagal sinkronisasi pembersihan pesanan selesai di Firebase:', err);
        });
      }
    } catch (err) {}

    updateAppState((prev) => ({
      ...prev,
      tableOrders: activeOnly,
    }));
  };

  return {
    menuItems,
    tableOrders,
    createTableOrder,
    updateTableOrderStatus,
    moveTableOrder,
    voidOrderItem,
    toggleOrderItemStatus,
    updateOrderItemsBulkStatus,
    revertTableOrderStatus,
    confirmTableOrder,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetMenuToDefault,
    toggleMenuItemAvailability,
    quickUpdateMenuPrice,
    clearFinishedOrders,
  };
}
