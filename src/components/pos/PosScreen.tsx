import React, { useState, useEffect, useRef } from 'react';
import { TableOrder, OrderStatus, AppRole } from '../../types';
import { useKaraoke, isSameTable } from '../../hooks/useKaraoke';
import { useWakeLock } from '../../hooks/useWakeLock';
import { ReceiptPrintView } from '../operator/ReceiptPrintView';
import { DeveloperFooter } from '../common/DeveloperFooter';
import { PosMenuManager } from './PosMenuManager';
import { PosSettingsModal } from './PosSettingsModal';
import { PosExpenseModal } from './PosExpenseModal';
import { PosDirectOrderModal } from './PosDirectOrderModal';
import { PosAuthGate } from './PosAuthGate';
import { PosHeader, PosTab } from './PosHeader';
import { PosBillingTab } from './PosBillingTab';
import { PosKitchenTab } from './PosKitchenTab';
import { PosReportsTab } from './PosReportsTab';
import { PosPaymentModal } from './PosPaymentModal';
import { PosMoveTableModal } from './PosMoveTableModal';
import { PosVoidItemModal } from './PosVoidItemModal';
import { PosQrisZoomModal } from './PosQrisZoomModal';

interface PosScreenProps {
  setRole?: (role: AppRole) => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({ setRole }) => {
  // Mencegah layar tablet kasir redup/mati sendiri saat beroperasi
  useWakeLock(true);

  const {
    tableOrders,
    menuItems,
    cafeSettings,
    tables,
    createTableOrder,
    updateTableOrderStatus,
    moveTableOrder,
    voidOrderItem,
    confirmTableOrder,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    resetMenuToDefault,
    toggleMenuItemAvailability,
    quickUpdateMenuPrice,
    clearFinishedOrders,
    isCloudConnected,
    triggerSoundEffect,
    updateCafeSettings,
    updateRolePasswords,
    expenses,
    addExpense,
    deleteExpense,
  } = useKaraoke();

  // 1. Status Autentikasi Kasir / Staff Security Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return Boolean(sessionStorage.getItem('cafeyou_pos_auth'));
    } catch {
      return false;
    }
  });
  const [authPin, setAuthPin] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Modal Pengaturan Kasir (PB1, Service Charge, Ganti PIN)
  const [isPosSettingsOpen, setIsPosSettingsOpen] = useState(false);

  // Modal Kas Keluar / Pengeluaran (Petty Cash)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Modal Buat Pesanan Baru Kasir (Dine-in / Takeaway / Online Ojol)
  const [isDirectOrderOpen, setIsDirectOrderOpen] = useState(false);

  // 2. Tab Aktif & Jam Digital
  const [activeTab, setActiveTab] = useState<PosTab>('billing');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isSoundAlertEnabled, setIsSoundAlertEnabled] = useState<boolean>(true);

  // 3. Status Filter & Pencarian
  const [kdsFilterTable, setKdsFilterTable] = useState<string>('ALL');
  const [billingSearch, setBillingSearch] = useState<string>('');

  // 4. Modal Pembayaran
  const [payingTable, setPayingTable] = useState<string | null>(null);
  const [payingOrders, setPayingOrders] = useState<TableOrder[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer' | 'debit'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [copiedDana, setCopiedDana] = useState<boolean>(false);
  const [isQrisZoomed, setIsQrisZoomed] = useState<boolean>(false);

  // 5. Modal Pindah Meja (Move Table)
  const [movingOrder, setMovingOrder] = useState<TableOrder | null>(null);
  const [targetNewTable, setTargetNewTable] = useState<string>('');

  // 6. Modal Void Item
  const [voidingData, setVoidingData] = useState<{
    orderId: string;
    itemIndex: number;
    itemName: string;
    reason: string;
  } | null>(null);

  // 7. Cetak Struk Kertas (Opsional / On-Demand)
  const [printOrder, setPrintOrder] = useState<TableOrder | null>(null);
  const [printGroupedOrders, setPrintGroupedOrders] = useState<TableOrder[] | undefined>(undefined);

  // Jam Digital Berjalan
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Notifikasi Suara Bel saat ada pesanan baru masuk
  const ordersList: TableOrder[] = Object.values(tableOrders || {}).sort((a, b) => b.createdAt - a.createdAt);
  const pendingOrders = ordersList.filter((o) => {
    const s = o.status?.toLowerCase();
    return s === 'pending';
  });
  const pendingOrdersCount = pendingOrders.length;
  const latestPendingOrder = pendingOrders[0] || null;
  const prevPendingRef = useRef<number>(pendingOrdersCount);

  useEffect(() => {
    if (pendingOrdersCount > prevPendingRef.current && isSoundAlertEnabled) {
      try {
        triggerSoundEffect('chime');
      } catch {}
    }
    prevPendingRef.current = pendingOrdersCount;
  }, [pendingOrdersCount, isSoundAlertEnabled, triggerSoundEffect]);

  // Handle Login Sesi Kasir
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPassword =
      cafeSettings?.posPassword?.trim() ||
      cafeSettings?.operatorPassword?.trim() ||
      '1234';

    if (authPin.trim() === expectedPassword) {
      try {
        sessionStorage.setItem('cafeyou_pos_auth', 'true');
      } catch {}
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('PIN/Password kasir salah. Coba lagi.');
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('cafeyou_pos_auth');
    } catch {}
    setIsAuthenticated(false);
  };

  // Format Angka Rupiah
  const formatRupiah = (amount: number) => {
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
  };

  const renderOrderBadge = (ord: TableOrder) => {
    const isTakeaway =
      ord.orderType === 'TAKEAWAY' ||
      ord.tableNumber?.toUpperCase().includes('BUNGKUS') ||
      ord.tableNumber?.toUpperCase().includes('TAKEAWAY');
    const isOnline =
      ord.orderType === 'ONLINE_DELIVERY' ||
      ord.tableNumber?.toUpperCase().includes('GOFOOD') ||
      ord.tableNumber?.toUpperCase().includes('GRAB') ||
      ord.tableNumber?.toUpperCase().includes('SHOPEE');

    if (isTakeaway) {
      return (
        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 shrink-0">
          🥡 BUNGKUS
        </span>
      );
    }
    if (isOnline) {
      return (
        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
          🛵 {ord.platform || 'OJOL'}
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
        🍽️ MEJA
      </span>
    );
  };

  // Trigger Print Struk Fisik (Opsional)
  const triggerPrintReceipt = (single?: TableOrder, grouped?: TableOrder[]) => {
    if (single) {
      setPrintOrder(single);
      setPrintGroupedOrders(undefined);
    } else if (grouped) {
      setPrintOrder(null);
      setPrintGroupedOrders(grouped);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Eksekusi Pembayaran Kasir (Dengan Sinkronisasi Pajak PB1 & Service Charge)
  const handleConfirmPayment = (
    taxRateVal: number = 0,
    serviceRateVal: number = 0,
    isCashRounding: boolean = false
  ) => {
    if (payingOrders.length === 0) return;

    const totalSubtotal = payingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    payingOrders.forEach((ord) => {
      const ordSub = ord.subtotal || ord.totalAmount;
      const taxAmt = Math.round((ordSub * taxRateVal) / 100);
      const servAmt = Math.round((ordSub * serviceRateVal) / 100);
      let finalAmt = ordSub + taxAmt + servAmt;

      let roundAmt = 0;
      if (isCashRounding && paymentMethod === 'cash') {
        const rounded = Math.round(finalAmt / 100) * 100;
        roundAmt = rounded - finalAmt;
        finalAmt = rounded;
      }

      updateTableOrderStatus(ord.id, 'PAID', paymentMethod, undefined, {
        finalTotal: finalAmt,
        subtotal: ordSub,
        taxAmount: taxAmt,
        serviceAmount: servAmt,
        roundingAmount: roundAmt,
      });
    });

    setPayingTable(null);
    setPayingOrders([]);
    setCashReceived(0);
  };

  // Eksekusi Pindah Meja
  const handleConfirmMoveTable = () => {
    if (!movingOrder || !targetNewTable) return;
    moveTableOrder(movingOrder.id, targetNewTable);
    setMovingOrder(null);
    setTargetNewTable('');
  };

  // Eksekusi Void Item
  const handleConfirmVoid = () => {
    if (!voidingData) return;
    voidOrderItem(voidingData.orderId, voidingData.itemIndex, voidingData.reason);
    setVoidingData(null);
  };

  // Filter Data
  const activeOrders = ordersList.filter((o) => {
    const s = o.status?.toLowerCase();
    return s !== 'paid' && s !== 'cancelled';
  });

  const historyOrders = ordersList.filter((o) => {
    const s = o.status?.toLowerCase();
    return s === 'paid' || s === 'cancelled';
  });

  // Group active orders by tableNumber with normalized master table matching
  const ordersByTable = activeOrders.reduce<Record<string, TableOrder[]>>((acc, order) => {
    const matchedMasterTable = tables?.find((t) => isSameTable(t, order.tableNumber));
    const table = matchedMasterTable || (order.tableNumber ? order.tableNumber.trim() : 'Tanpa Meja');
    if (!acc[table]) acc[table] = [];
    acc[table].push(order);
    return acc;
  }, {});

  // Perhitungan Rekap Omzet Shift & Audit Finansial
  const paidOrders = ordersList.filter((o) => o.status?.toLowerCase() === 'paid');
  const revenueCash = paidOrders
    .filter((o) => o.paymentMethod?.toLowerCase() === 'cash' || o.paymentMethod === 'TUNAI')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const revenueQris = paidOrders
    .filter((o) => o.paymentMethod?.toLowerCase() === 'qris' || o.paymentMethod === 'QRIS')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const revenueTransfer = paidOrders
    .filter((o) => o.paymentMethod?.toLowerCase() === 'transfer' || o.paymentMethod === 'TRANSFER')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const revenueDebit = paidOrders
    .filter((o) => o.paymentMethod?.toLowerCase() === 'debit' || o.paymentMethod === 'DEBIT')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalRevenue = revenueCash + revenueQris + revenueTransfer + revenueDebit;

  // Rincian Pajak Resto (PB1) & Service Terkumpul
  const totalPb1Collected = paidOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);

  // Perhitungan Beban Kas Keluar (Petty Cash Expenses)
  const expenseList = Object.values(expenses || {});
  const totalExpenseAll = expenseList.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpenseCash = expenseList
    .filter((e) => e.paymentSource === 'CASH_DRAWER')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Uang Fisik yang Wajib Ada di Laci Kasir (Cash Drawer Real Balance)
  const cashDrawerExpected = Math.max(0, revenueCash - totalExpenseCash);

  // Estimasi Laba Bersih Shift (Net Income)
  const netIncomeShift = totalRevenue - totalExpenseAll;

  // Lencana Status Pesanan
  const renderStatusBadge = (status: OrderStatus) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black animate-pulse flex items-center gap-1">
            <span>⏳</span> Pesanan Masuk
          </span>
        );
      case 'confirmed':
      case 'preparing':
      case 'cooking':
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1">
            <span>🍳</span> Sedang Dimasak
          </span>
        );
      case 'ready':
      case 'served':
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
            <span>🍽️</span> Siap Disajikan
          </span>
        );
      case 'completed':
      case 'paid':
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
            <span>✅</span> Lunas
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold flex items-center gap-1">
            <span>❌</span> Batal
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  // JIKA BELUM TERAUTENTIKASI: TAMPILKAN SECURITY GATE
  if (!isAuthenticated) {
    return (
      <PosAuthGate
        authPin={authPin}
        setAuthPin={setAuthPin}
        authError={authError}
        onSubmitLogin={handleLoginSubmit}
        onBackToLanding={setRole ? () => setRole('landing') : undefined}
      />
    );
  }

  // TAMPILAN PENUH DASBOR KASIR & DAPUR (POS SCREEN)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP HEADER WORKSTATION */}
      <PosHeader
        cafeSettings={cafeSettings}
        currentTime={currentTime}
        isCloudConnected={isCloudConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeOrdersCount={activeOrders.length}
        pendingOrdersCount={pendingOrdersCount}
        onOpenDirectOrder={() => setIsDirectOrderOpen(true)}
        isSoundAlertEnabled={isSoundAlertEnabled}
        onToggleSoundAlert={() => setIsSoundAlertEnabled(!isSoundAlertEnabled)}
        onOpenSettings={() => setIsPosSettingsOpen(true)}
        onOpenOperator={setRole ? () => setRole('operator') : undefined}
        onBack={setRole ? () => setRole('landing') : undefined}
        onLogout={handleLogout}
      />

      {/* 2. KONTEN UTAMA SESUAI TAB */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {/* BANNER NOTIFIKASI PESANAN BARU MASUK (REAL-TIME ALERT) */}
        {pendingOrdersCount > 0 && (
          <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-amber-500/70 rounded-2xl shadow-xl shadow-amber-500/10 flex flex-wrap items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {pendingOrdersCount} Pesanan Baru Menunggu Konfirmasi!
                  </h3>
                  <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full uppercase tracking-wider">
                    Pesanan Masuk
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  {latestPendingOrder
                    ? `Pesanan dari ${latestPendingOrder.tableNumber} (${latestPendingOrder.customerName}) senilai Rp ${latestPendingOrder.totalAmount.toLocaleString('id-ID')} (${latestPendingOrder.items.length} menu)`
                    : 'Segera periksa dan konfirmasi di Alur Dapur (KDS) untuk mulai diproses.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  try {
                    triggerSoundEffect('chime');
                  } catch {}
                }}
                className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                title="Bunyikan Ulang Bel Peringatan"
              >
                <span>🔔</span>
                <span className="hidden sm:inline">Bunyikan Bel</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('kitchen')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>🍳</span>
                <span>Buka Alur Dapur (KDS)</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: TAGIHAN MEJA & KASIR (BILLING) */}
        {activeTab === 'billing' && (
          <PosBillingTab
            ordersByTable={ordersByTable}
            billingSearch={billingSearch}
            setBillingSearch={setBillingSearch}
            formatRupiah={formatRupiah}
            renderOrderBadge={renderOrderBadge}
            renderStatusBadge={renderStatusBadge}
            onOpenPayment={(table, orders) => {
              setPayingTable(table);
              setPayingOrders(orders);
              setCashReceived(0);
            }}
            onPrintReceipt={(single, grouped) => triggerPrintReceipt(single, grouped)}
            onOpenMoveTable={(ord) => {
              setMovingOrder(ord);
              setTargetNewTable('');
            }}
            onOpenVoidItem={(data) => setVoidingData(data)}
          />
        )}

        {/* TAB 2: ALUR DAPUR / KITCHEN DISPLAY SYSTEM (KDS) */}
        {activeTab === 'kitchen' && (
          <PosKitchenTab
            activeOrders={activeOrders}
            tables={tables}
            kdsFilterTable={kdsFilterTable}
            setKdsFilterTable={setKdsFilterTable}
            formatRupiah={formatRupiah}
            renderOrderBadge={renderOrderBadge}
            onConfirmOrder={(orderId) => confirmTableOrder(orderId)}
            onUpdateStatus={(orderId, status, paymentMethod, cancelReason) =>
              updateTableOrderStatus(orderId, status, paymentMethod, cancelReason)
            }
            onOpenPaymentFromKds={(tableNumber, order) => {
              setPayingTable(tableNumber);
              setPayingOrders([order]);
              setCashReceived(0);
              setActiveTab('billing');
            }}
          />
        )}

        {/* TAB 3: REKAP SHIFT & OMZET KASIR (REPORTS) */}
        {activeTab === 'reports' && (
          <PosReportsTab
            totalRevenue={totalRevenue}
            paidOrders={paidOrders}
            totalPb1Collected={totalPb1Collected}
            cashDrawerExpected={cashDrawerExpected}
            revenueCash={revenueCash}
            totalExpenseCash={totalExpenseCash}
            totalExpenseAll={totalExpenseAll}
            expenseList={expenseList}
            netIncomeShift={netIncomeShift}
            revenueQris={revenueQris}
            revenueTransfer={revenueTransfer}
            revenueDebit={revenueDebit}
            historyOrders={historyOrders}
            formatRupiah={formatRupiah}
            onOpenExpenseModal={() => setIsExpenseModalOpen(true)}
            onClearFinishedOrders={clearFinishedOrders}
            onPrintReceipt={(ord) => triggerPrintReceipt(ord)}
          />
        )}

        {/* TAB 4: PENGELOLAAN KATALOG MENU POS */}
        {activeTab === 'menu' && (
          <PosMenuManager
            menuItems={menuItems || {}}
            onToggleAvailability={toggleMenuItemAvailability}
            onQuickUpdatePrice={quickUpdateMenuPrice}
            onAddMenuItem={addMenuItem}
            onUpdateMenuItem={updateMenuItem}
            onDeleteMenuItem={deleteMenuItem}
            onResetToDefault={resetMenuToDefault}
          />
        )}
      </main>

      {/* 3. MODAL PEMBAYARAN KASIR (CASH CALCULATOR & QRIS) */}
      <PosPaymentModal
        payingTable={payingTable}
        payingOrders={payingOrders}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        copiedDana={copiedDana}
        setCopiedDana={setCopiedDana}
        cafeSettings={cafeSettings}
        formatRupiah={formatRupiah}
        onConfirmPayment={handleConfirmPayment}
        onPrintReceipt={(single, grouped) => triggerPrintReceipt(single, grouped)}
        onOpenQrisZoom={() => setIsQrisZoomed(true)}
        onOpenSettings={() => setIsPosSettingsOpen(true)}
        onClose={() => setPayingTable(null)}
      />

      {/* 4. MODAL PINDAH MEJA (MOVE TABLE) */}
      <PosMoveTableModal
        movingOrder={movingOrder}
        targetNewTable={targetNewTable}
        setTargetNewTable={setTargetNewTable}
        tables={tables}
        onConfirmMoveTable={handleConfirmMoveTable}
        onClose={() => setMovingOrder(null)}
      />

      {/* 5. MODAL VOID ITEM */}
      <PosVoidItemModal
        voidingData={voidingData}
        setVoidingData={setVoidingData}
        onConfirmVoid={handleConfirmVoid}
        onClose={() => setVoidingData(null)}
      />

      {/* 6. KOMPONEN CETAK STRUK THERMAL TERISOLASI (PRINT VIEW) */}
      <ReceiptPrintView
        order={printOrder}
        groupedOrders={printGroupedOrders}
        cafeSettings={cafeSettings}
      />

      {/* 7. MODAL PENGATURAN KASIR (PB1, SERVICE, PIN KASIR) */}
      <PosSettingsModal
        isOpen={isPosSettingsOpen}
        onClose={() => setIsPosSettingsOpen(false)}
        cafeSettings={cafeSettings}
        onUpdateCafeSettings={updateCafeSettings}
        onUpdatePosPassword={(newPin) => updateRolePasswords(undefined, newPin)}
      />

      {/* 8. MODAL KAS KELUAR & PENGELUARAN (PETTY CASH) */}
      <PosExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        expenses={expenses || {}}
        onAddExpense={addExpense}
        onDeleteExpense={deleteExpense}
      />

      {/* 9. MODAL BUAT PESANAN KASIR LANGSUNG (DINE-IN, TAKEAWAY, ONLINE OJOL) */}
      <PosDirectOrderModal
        isOpen={isDirectOrderOpen}
        onClose={() => setIsDirectOrderOpen(false)}
        menuItems={menuItems || {}}
        tables={tables || []}
        cafeSettings={cafeSettings}
        onCreateOrder={createTableOrder}
        existingOrdersCount={ordersList.length}
      />

      {/* 10. MODAL ZOOM BARCODE QRIS (FULLSCREEN HIGH-RES DISPLAY) */}
      <PosQrisZoomModal
        isOpen={isQrisZoomed}
        onClose={() => setIsQrisZoomed(false)}
        cafeSettings={cafeSettings}
        payingTable={payingTable}
      />

      <DeveloperFooter className="px-4 mt-auto" />
    </div>
  );
};
