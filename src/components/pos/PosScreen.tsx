import React, { useState, useEffect, useRef } from 'react';
import { TableOrder, OrderStatus, AppRole } from '../../types';
import { useKaraoke, isSameTable } from '../../hooks/useKaraoke';
import { useWakeLock } from '../../hooks/useWakeLock';
import { ReceiptPrintView } from '../operator/ReceiptPrintView';
import { DeveloperFooter } from '../common/DeveloperFooter';
import { PosMenuManager } from './PosMenuManager';
import { PosSettingsModal } from './PosSettingsModal';
import { PosExpenseModal } from './PosExpenseModal';

interface PosScreenProps {
  setRole?: (role: AppRole) => void;
}

type PosTab = 'kitchen' | 'billing' | 'reports' | 'menu';

export const PosScreen: React.FC<PosScreenProps> = ({ setRole }) => {
  // Mencegah layar tablet kasir redup/mati sendiri saat beroperasi
  useWakeLock(true);

  const {
    tableOrders,
    menuItems,
    cafeSettings,
    tables,
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
      const proportion = totalSubtotal > 0 ? ordSub / totalSubtotal : 1 / payingOrders.length;
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

  // Rincian Pajak Resto (PB1) Terkumpul
  const totalPb1Collected = paidOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
  const totalServiceCollected = paidOrders.reduce((sum, o) => sum + (o.serviceAmount || 0), 0);

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

  // JIKA BELUM TERAUTENTIKASI: TAMPILKAN SECURITY GATE MODAL
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-4 font-sans text-slate-200 selection:bg-amber-500 selection:text-slate-950">
        <div className="max-w-md w-full my-auto bg-slate-900/90 border border-amber-500/30 p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-amber-500/10">
            🍽️
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Akses Kasir & Dapur (POS)
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan PIN / Password Operator untuk membuka dashboard operasional kafe.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                PIN / Password Kasir:
              </label>
              <input
                type="password"
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                placeholder="Masukkan PIN..."
                autoFocus
                className="w-full px-4 py-3 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white font-mono text-center tracking-widest text-lg outline-none transition-all shadow-inner"
              />
              {authError && (
                <p className="text-xs font-bold text-red-400 mt-2 text-center animate-shake">
                  {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              Buka Dasbor Kasir ➔
            </button>

            {setRole && (
              <button
                type="button"
                onClick={() => setRole('landing')}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors text-center"
              >
                ← Kembali ke Menu Awal
              </button>
            )}
          </form>
        </div>
        <DeveloperFooter className="w-full" />
      </div>
    );
  }

  // TAMPILAN PENUH DASBOR KASIR & DAPUR (POS SCREEN)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP HEADER WORKSTATION */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-4 lg:px-6 py-3 sticky top-0 z-30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Brand & Jam */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md shadow-amber-500/20 text-white font-black">
            🍽️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight">
                {cafeSettings?.name || 'CAFEYOU'}
              </h1>
              <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                KASIR & DAPUR (POS)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="font-mono text-amber-400 font-bold">{currentTime}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className={isCloudConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isCloudConnected ? 'Cloud Sync Aktif' : 'Lokal'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 3 Tab Navigasi Utama Kasir */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'billing'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🧾</span>
            <span>Tagihan Meja</span>
            {activeOrders.length > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'billing' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('kitchen')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'kitchen'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🍳</span>
            <span>Alur Dapur (KDS)</span>
            {pendingOrdersCount > 0 && (
              <span className="text-[10px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                {pendingOrdersCount} Baru
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📊</span>
            <span>Rekap Shift & Omzet</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🍽️</span>
            <span>Katalog & Atur Menu</span>
          </button>
        </div>

        {/* Tombol Kontrol Kanan */}
        <div className="flex items-center gap-2">
          {/* Toggle Suara Bel */}
          <button
            onClick={() => setIsSoundAlertEnabled(!isSoundAlertEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              isSoundAlertEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={isSoundAlertEnabled ? 'Suara Bel Pesanan Aktif' : 'Suara Bel Dibisukan'}
          >
            {isSoundAlertEnabled ? '🔔' : '🔕'}
          </button>

          {/* Pengaturan Kasir (PB1, Service, PIN) */}
          <button
            onClick={() => setIsPosSettingsOpen(true)}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-500/60 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1.5 shadow-sm"
            title="Buka Pengaturan Pajak PB1 & PIN Kasir"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Pengaturan Kasir</span>
          </button>

          {/* Navigasi Cepat ke Dasbor Karaoke */}
          {setRole && (
            <button
              onClick={() => setRole('operator')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
              title="Buka Layar Operator Karaoke"
            >
              <span>🎤</span>
              <span className="hidden sm:inline">Dasbor Karaoke</span>
            </button>
          )}

          {/* Kunci / Logout */}
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all"
            title="Kunci / Keluar dari Sesi Kasir"
          >
            🔒
          </button>
        </div>
      </header>

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

        {/* ========================================================================= */}
        {/* TAB 1: TAGIHAN MEJA & KASIR (BILLING) */}
        {/* ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Header & Filter Search Meja */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🧾</span>
                  <span>Tagihan Meja Berjalan (*Table Billing*)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pesanan berulang dari meja yang sama otomatis diakumulasi dalam satu tagihan kasir.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={billingSearch}
                  onChange={(e) => setBillingSearch(e.target.value)}
                  placeholder="Cari meja atau nama tamu..."
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500 transition-all w-52"
                />
              </div>
            </div>

            {/* Grid Tagihan Meja */}
            {Object.keys(ordersByTable).length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-12 text-center">
                <span className="text-5xl">☕</span>
                <h3 className="text-base font-bold text-white mt-3">Tidak Ada Tagihan Meja Aktif</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Semua pesanan meja telah selesai dibayar atau belum ada tamu yang mengirim pesanan F&B.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(ordersByTable)
                  .filter(([table, orders]) => {
                    if (!billingSearch.trim()) return true;
                    const q = billingSearch.toLowerCase();
                    return (
                      table.toLowerCase().includes(q) ||
                      orders.some((o) => o.customerName?.toLowerCase().includes(q))
                    );
                  })
                  .map(([table, orders]) => {
                    const totalTableBill = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                    const oldestCreatedAt = Math.min(...orders.map((o) => o.createdAt));
                    const hasPending = orders.some((o) => o.status?.toLowerCase() === 'pending');

                    return (
                      <div
                        key={table}
                        className={`bg-slate-900/90 rounded-3xl border p-5 flex flex-col justify-between transition-all shadow-xl ${
                          hasPending
                            ? 'border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          {/* Header Meja */}
                          <div className="flex justify-between items-start mb-3 border-b border-slate-800/80 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🪑</span>
                                <h3 className="text-lg font-black text-white">{table}</h3>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {orders.length} Pesanan terdaftar •{' '}
                                {new Date(oldestCreatedAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-slate-400 block">Total Meja:</span>
                              <span className="text-lg font-black text-emerald-400 font-mono">
                                {formatRupiah(totalTableBill)}
                              </span>
                            </div>
                          </div>

                          {/* Rincian Pesanan per-Order */}
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {orders.map((ord) => (
                              <div
                                key={ord.id}
                                className="bg-slate-950/70 p-3 rounded-2xl border border-slate-850 space-y-2 text-xs"
                              >
                                <div className="flex justify-between items-center text-slate-400">
                                  <span className="font-bold text-slate-200">
                                    {ord.customerName || 'Tamu'}
                                    <span className="text-[10px] font-normal text-slate-500 ml-1.5 font-mono">
                                      #{ord.id.slice(-4)}
                                    </span>
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {renderStatusBadge(ord.status)}
                                    {/* Tombol Pindah Meja */}
                                    <button
                                      onClick={() => {
                                        setMovingOrder(ord);
                                        setTargetNewTable('');
                                      }}
                                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-lg transition-colors"
                                      title="Pindah Meja"
                                    >
                                      🔀
                                    </button>
                                  </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-1 pt-1 border-t border-slate-900">
                                  {ord.items.map((it, idx) => {
                                    const count = it.quantity ?? it.qty ?? 1;
                                    return (
                                      <div
                                        key={idx}
                                        className={`flex justify-between items-center ${
                                          it.isVoided ? 'line-through opacity-40 text-red-400' : 'text-slate-300'
                                        }`}
                                      >
                                        <div className="flex-1 pr-2">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold">
                                              {count}x {it.name}
                                            </span>
                                            {it.notes && (
                                              <span className="text-amber-400 text-[10px] italic">
                                                ({it.notes})
                                              </span>
                                            )}
                                          </div>
                                          {it.selectedOptions && it.selectedOptions.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {it.selectedOptions.map((opt, oIdx) => (
                                                <span key={oIdx} className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-medium">
                                                  {opt}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 font-mono shrink-0">
                                          <span>{formatRupiah(it.price * count)}</span>
                                          {!it.isVoided && (
                                            <button
                                              onClick={() =>
                                                setVoidingData({
                                                  orderId: ord.id,
                                                  itemIndex: idx,
                                                  itemName: it.name,
                                                  reason: 'Stok dapur habis / dibatalkan kasir',
                                                })
                                              }
                                              className="text-[10px] text-red-400 hover:text-red-300 font-bold px-1 rounded hover:bg-red-500/20"
                                              title="Batalkan Item (Void)"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tombol Aksi Meja: Bayar & Cetak Struk */}
                        <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
                          <button
                            onClick={() => {
                              setPayingTable(table);
                              setPayingOrders(orders);
                              setCashReceived(0);
                            }}
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>💵</span>
                            <span>Proses Bayar Meja</span>
                          </button>

                          {/* Tombol Cetak Fisik Opsional */}
                          <button
                            onClick={() => triggerPrintReceipt(undefined, orders)}
                            className="px-3 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            title="Cetak Struk Kertas (Opsional)"
                          >
                            <span>🖨️</span>
                            <span className="hidden sm:inline">Struk</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALUR DAPUR / KITCHEN DISPLAY SYSTEM (KDS) */}
        {/* ========================================================================= */}
        {activeTab === 'kitchen' && (
          <div className="space-y-6">
            {/* Header KDS & Filter Meja */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🍳</span>
                  <span>Kitchen Display System (KDS) — Layar Dapur & Barista</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pesanan masuk wajib dikonfirmasi terlebih dahulu sebelum diteruskan ke proses memasak.
                </p>
              </div>

              {/* Filter Nomor Meja */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Filter Meja:</span>
                <select
                  value={kdsFilterTable}
                  onChange={(e) => setKdsFilterTable(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="ALL">Semua Meja</option>
                  {(tables || []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3 Kolom Kanban Alur Dapur */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* KOLOM 1: PESANAN MASUK (PENDING) */}
              <div className="bg-slate-900/70 border border-amber-500/30 rounded-3xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-amber-500/20">
                  <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⏳</span>
                    <span>1. Menunggu Konfirmasi</span>
                  </h3>
                  <span className="text-xs bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full">
                    {
                      activeOrders.filter(
                        (o) =>
                          o.status?.toLowerCase() === 'pending' &&
                          (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                      ).length
                    }
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {activeOrders
                    .filter(
                      (o) =>
                        o.status?.toLowerCase() === 'pending' &&
                        (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                    )
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-black text-white">{ord.tableNumber}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {ord.customerName} • {new Date(ord.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {formatRupiah(ord.totalAmount)}
                          </span>
                        </div>

                        {/* List Items */}
                        <div className="bg-slate-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-slate-200">
                                  {it.quantity ?? it.qty ?? 1}x {it.name}
                                </span>
                                {it.selectedOptions && it.selectedOptions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {it.selectedOptions.map((opt, oIdx) => (
                                      <span key={oIdx} className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-medium">
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {it.notes && <span className="block text-amber-400 text-[10px]">Catatan: {it.notes}</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tombol Konfirmasi (Anti Pesanan Fiktif) */}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => confirmTableOrder(ord.id)}
                            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                          >
                            ✅ Konfirmasi & Masak ➔
                          </button>
                          <button
                            onClick={() => updateTableOrderStatus(ord.id, 'CANCELLED', undefined, 'Dibatalkan oleh Kasir')}
                            className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all"
                            title="Tolak Pesanan"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* KOLOM 2: SEDANG DIMASAK (PREPARING) */}
              <div className="bg-slate-900/70 border border-blue-500/30 rounded-3xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-blue-500/20">
                  <h3 className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🍳</span>
                    <span>2. Sedang Dimasak</span>
                  </h3>
                  <span className="text-xs bg-blue-500/20 text-blue-300 font-black px-2 py-0.5 rounded-full">
                    {
                      activeOrders.filter((o) => {
                        const s = o.status?.toLowerCase();
                        return (
                          (s === 'confirmed' || s === 'preparing' || s === 'cooking') &&
                          (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                        );
                      }).length
                    }
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {activeOrders
                    .filter((o) => {
                      const s = o.status?.toLowerCase();
                      return (
                        (s === 'confirmed' || s === 'preparing' || s === 'cooking') &&
                        (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                      );
                    })
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-slate-950/80 border border-blue-500/40 rounded-2xl p-4 space-y-3 shadow-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-black text-white">{ord.tableNumber}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {ord.customerName} • {new Date(ord.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-blue-300">
                            {formatRupiah(ord.totalAmount)}
                          </span>
                        </div>

                        {/* List Items */}
                        <div className="bg-slate-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-slate-200">
                                  {it.quantity ?? it.qty ?? 1}x {it.name}
                                </span>
                                {it.selectedOptions && it.selectedOptions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {it.selectedOptions.map((opt, oIdx) => (
                                      <span key={oIdx} className="text-[9px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-1 py-0.2 rounded font-medium">
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {it.notes && <span className="block text-amber-400 text-[10px]">Catatan: {it.notes}</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tombol Siap Saji */}
                        <button
                          onClick={() => updateTableOrderStatus(ord.id, 'READY')}
                          className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                        >
                          🍽️ Makanan Siap Disajikan ➔
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* KOLOM 3: SIAP DISAJIKAN / SELESAI */}
              <div className="bg-slate-900/70 border border-purple-500/30 rounded-3xl p-4 flex flex-col">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-purple-500/20">
                  <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🍽️</span>
                    <span>3. Siap Disajikan</span>
                  </h3>
                  <span className="text-xs bg-purple-500/20 text-purple-300 font-black px-2 py-0.5 rounded-full">
                    {
                      activeOrders.filter((o) => {
                        const s = o.status?.toLowerCase();
                        return (
                          (s === 'ready' || s === 'served') &&
                          (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                        );
                      }).length
                    }
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {activeOrders
                    .filter((o) => {
                      const s = o.status?.toLowerCase();
                      return (
                        (s === 'ready' || s === 'served') &&
                        (kdsFilterTable === 'ALL' || o.tableNumber === kdsFilterTable)
                      );
                    })
                    .map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-slate-950/80 border border-purple-500/40 rounded-2xl p-4 space-y-3 shadow-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-black text-white">{ord.tableNumber}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {ord.customerName} • {new Date(ord.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-purple-300">
                            {formatRupiah(ord.totalAmount)}
                          </span>
                        </div>

                        {/* List Items */}
                        <div className="bg-slate-900/60 p-2.5 rounded-xl space-y-1.5 text-xs">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-slate-200">
                                  {it.quantity ?? it.qty ?? 1}x {it.name}
                                </span>
                                {it.selectedOptions && it.selectedOptions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {it.selectedOptions.map((opt, oIdx) => (
                                      <span key={oIdx} className="text-[9px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1 py-0.2 rounded font-medium">
                                        {opt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {it.notes && <span className="block text-amber-400 text-[10px]">Catatan: {it.notes}</span>}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tombol Terantar / Siap Bayar */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setPayingTable(ord.tableNumber);
                              setPayingOrders([ord]);
                              setCashReceived(0);
                              setActiveTab('billing');
                            }}
                            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
                          >
                            💵 Bayar di Kasir ➔
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: REKAP SHIFT & OMZET KASIR (REPORTS) */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Header Laporan & Tutup Kasir */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span>📊</span>
                  <span>Rekapitulasi Shift Kasir & Audit Finansial</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pemantauan omzet, pajak PB1 daerah, pengeluaran kas kecil, dan rekonsiliasi saldo fisik laci kasir.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span>💸</span>
                  <span>Catat Kas Keluar</span>
                  {expenseList.length > 0 && (
                    <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-mono">
                      {expenseList.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bersihkan semua data pesanan yang sudah berstatus Lunas/Batal?')) {
                      clearFinishedOrders();
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/30 rounded-xl text-xs font-bold transition-all"
                >
                  🧹 Tutup Shift
                </button>
              </div>
            </div>

            {/* Kartu Ringkasan Omzet & Arus Kas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Total Omzet Kotor */}
              <div className="bg-slate-900/80 border border-emerald-500/30 p-5 rounded-3xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                  <span>TOTAL OMZET BRUTO</span>
                  <span className="text-lg">💰</span>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {formatRupiah(totalRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>{paidOrders.length} Pesanan Lunas</span>
                  {totalPb1Collected > 0 && (
                    <span className="text-amber-400">PB1: +{formatRupiah(totalPb1Collected)}</span>
                  )}
                </div>
              </div>

              {/* 2. Uang Tunai yang Wajib Ada di Laci (Cash Drawer) */}
              <div className="bg-slate-900/80 border border-amber-500/40 p-5 rounded-3xl space-y-2 bg-gradient-to-b from-amber-500/5 to-transparent">
                <div className="flex justify-between items-center text-xs text-amber-300 font-black">
                  <span>SALDO FISIK LACI KASIR</span>
                  <span className="text-lg">💵</span>
                </div>
                <div className="text-2xl font-black text-amber-300 font-mono">
                  {formatRupiah(cashDrawerExpected)}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Tunai masuk {formatRupiah(revenueCash)}
                  {totalExpenseCash > 0 && (
                    <span className="text-rose-400"> - Kasbon/Beban {formatRupiah(totalExpenseCash)}</span>
                  )}
                </div>
              </div>

              {/* 3. Beban Kas Keluar (Petty Cash) */}
              <div
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-slate-900/80 border border-rose-500/30 p-5 rounded-3xl space-y-2 cursor-pointer hover:border-rose-500/60 transition-all"
              >
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                  <span>BEBAN PENGELUARAN KAS</span>
                  <span className="text-lg">💸</span>
                </div>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {formatRupiah(totalExpenseAll)}
                </div>
                <div className="text-[11px] text-rose-300/80 flex items-center justify-between">
                  <span>{expenseList.length} Nota Biaya</span>
                  <span className="text-[10px] underline">Kelola ➔</span>
                </div>
              </div>

              {/* 4. Estimasi Laba Bersih Shift */}
              <div className="bg-slate-900/80 border border-blue-500/30 p-5 rounded-3xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold">
                  <span>ESTIMASI LABA BERSIH</span>
                  <span className="text-lg">📈</span>
                </div>
                <div className={`text-2xl font-black font-mono ${netIncomeShift >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {formatRupiah(netIncomeShift)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Omzet dikurangi pengeluaran operasional
                </div>
              </div>
            </div>

            {/* Rincian Tambahan: Non-Tunai QRIS & EDC Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg font-black">
                    📱
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">NON-TUNAI QRIS (REKENING KAFE)</span>
                    <span className="text-base font-black text-purple-300 font-mono">
                      {formatRupiah(revenueQris)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">Settle otomatis ke Bank</span>
              </div>

              <div className="bg-slate-900/60 border border-cyan-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-lg font-black">
                    🏦
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">TRANSFER BANK & MESIN EDC DEBIT</span>
                    <span className="text-base font-black text-cyan-300 font-mono">
                      {formatRupiah(revenueTransfer + revenueDebit)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">Bukti struk EDC / Mutasi</span>
              </div>
            </div>

            {/* Riwayat Transaksi Selesai */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Daftar Transaksi Selesai ({historyOrders.length})
              </h3>

              {historyOrders.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Belum ada riwayat transaksi pada sesi ini.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-slate-800 text-slate-400 uppercase font-black text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Meja</th>
                        <th className="py-2.5 px-3">Pelanggan</th>
                        <th className="py-2.5 px-3">Metode</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {historyOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-400">
                            {new Date(ord.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">{ord.tableNumber}</td>
                          <td className="py-3 px-3">{ord.customerName}</td>
                          <td className="py-3 px-3">
                            <span className="uppercase font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {ord.paymentMethod || 'TUNAI'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                            {formatRupiah(ord.totalAmount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => triggerPrintReceipt(ord)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-[11px] font-bold transition-all"
                            >
                              🖨️ Cetak Ulang
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PENGELOLAAN KATALOG MENU POS */}
        {/* ========================================================================= */}
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
      {payingTable && payingOrders.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp text-slate-200">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>💵</span>
                  <span>Pembayaran Kasir: {payingTable}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {payingOrders.length} Pesanan terdaftar untuk meja ini.
                </span>
              </div>
              <button
                onClick={() => setPayingTable(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl text-sm"
              >
                ✕
              </button>
            </div>

            {/* Rincian Tagihan */}
            {(() => {
              const subtotalDue = payingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
              const isTaxPlus = cafeSettings?.isTaxIncluded === false && (cafeSettings?.taxPercentage || 0) > 0;
              const taxRate = isTaxPlus ? (cafeSettings?.taxPercentage || 0) : 0;
              const taxAmount = Math.round((subtotalDue * taxRate) / 100);
              const totalDue = subtotalDue + taxAmount;
              const changeAmount = cashReceived > totalDue ? cashReceived - totalDue : 0;

              return (
                <div className="space-y-4">
                  {/* Total Tagihan Besar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                    {taxRate > 0 && (
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Subtotal Makanan & Minuman:</span>
                        <span className="font-mono">{formatRupiah(subtotalDue)}</span>
                      </div>
                    )}
                    {taxRate > 0 && (
                      <div className="flex justify-between items-center text-xs text-amber-400">
                        <span>Pajak Resto (PB1 {taxRate}%):</span>
                        <span className="font-mono">+{formatRupiah(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-xs font-bold text-slate-300">
                        {taxRate > 0 ? 'TOTAL AKHIR (+PB1):' : 'TOTAL TAGIHAN (NETT):'}
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {formatRupiah(totalDue)}
                      </span>
                    </div>
                  </div>

                  {/* Pilihan Metode Bayar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Pilih Metode Pembayaran:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['cash', 'qris', 'transfer', 'debit'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-black uppercase transition-all ${
                            paymentMethod === m
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {m === 'cash' && '💵 Tunai'}
                          {m === 'qris' && '📱 QRIS'}
                          {m === 'transfer' && '🏦 Transfer'}
                          {m === 'debit' && '💳 Debit'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jika TUNAI: Kalkulator & Kembalian */}
                  {paymentMethod === 'cash' && (
                    <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-850">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Nominal Uang Tunai Diterima (Rp):
                        </label>
                        <input
                          type="number"
                          value={cashReceived || ''}
                          onChange={(e) => setCashReceived(Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-750 focus:border-amber-500 rounded-xl text-white font-mono font-bold text-lg outline-none text-right"
                        />
                      </div>

                      {/* Tombol Cepat Pecahan */}
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCashReceived(totalDue)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold"
                        >
                          Uang Pas
                        </button>
                        {[10000, 20000, 50000, 100000, 200000].map((nom) => (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => setCashReceived(nom)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-bold font-mono"
                          >
                            {nom / 1000}k
                          </button>
                        ))}
                      </div>

                      {/* Uang Kembalian */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                        <span className="text-xs font-bold text-slate-400">UANG KEMBALIAN:</span>
                        <span
                          className={`text-lg font-black font-mono ${
                            changeAmount > 0 ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {formatRupiah(changeAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Jika QRIS: Tampilan Barcode & Merchant */}
                  {paymentMethod === 'qris' && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <span>📱</span> QRIS Pembayaran Kafe
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-300">
                          {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'CAFEYOU'}
                        </span>
                      </div>

                      {cafeSettings?.qrisImageUrl ? (
                        <div className="space-y-2.5">
                          <div
                            onClick={() => setIsQrisZoomed(true)}
                            className="bg-white p-3 rounded-2xl inline-block shadow-xl mx-auto cursor-pointer hover:scale-102 transition-transform border-4 border-emerald-500/30 group relative"
                            title="Klik untuk memperbesar barcode"
                          >
                            <img
                              src={cafeSettings.qrisImageUrl}
                              alt="Barcode QRIS"
                              className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg mx-auto"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                🔍 Klik Perbesar
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-900/80 py-1.5 px-3 rounded-xl inline-block border border-slate-800">
                            <span className="text-xs text-slate-400">Total Tagihan: </span>
                            <span className="text-emerald-400 font-mono font-black text-sm">{formatRupiah(totalDue)}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Arahkan kamera smartphone atau aplikasi perbankan/e-wallet pelanggan ke barcode di atas.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-900/80 rounded-2xl border border-dashed border-amber-500/40 text-center space-y-2">
                          <span className="text-2xl">⚠️</span>
                          <p className="text-xs text-amber-300 font-bold">
                            Barcode QRIS Kafe Belum Diunggah
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Silakan unggah gambar barcode QRIS Anda di menu Pengaturan Kasir agar tampil di layar ini.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsPosSettingsOpen(true)}
                            className="px-3 py-1.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-400 transition-all"
                          >
                            ⚙️ Buka Pengaturan Kasir
                          </button>
                        </div>
                      )}

                      {/* Info Tambahan DANA jika ada */}
                      {cafeSettings?.danaPhoneNumber && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-xl">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <span className="text-blue-400 font-bold">DANA:</span>
                            <span className="font-mono font-bold">{cafeSettings.danaPhoneNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (cafeSettings.danaPhoneNumber) {
                                navigator.clipboard.writeText(cafeSettings.danaPhoneNumber);
                                setCopiedDana(true);
                                setTimeout(() => setCopiedDana(false), 2000);
                              }
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors"
                          >
                            {copiedDana ? '✅ Tersalin' : '📋 Salin'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Jika TRANSFER: Tampilan Akun DANA & Bank */}
                  {paymentMethod === 'transfer' && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/30 text-center space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                        <span className="font-bold text-blue-400 flex items-center gap-1.5">
                          <span>🏦</span> Transfer Dompet Digital / Bank
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-300">
                          {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'Kasir CAFEYOU'}
                        </span>
                      </div>

                      {cafeSettings?.danaPhoneNumber ? (
                        <div className="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-medium">Nomor Akun DANA:</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (cafeSettings.danaPhoneNumber) {
                                  navigator.clipboard.writeText(cafeSettings.danaPhoneNumber);
                                  setCopiedDana(true);
                                  setTimeout(() => setCopiedDana(false), 2000);
                                }
                              }}
                              className="text-[10px] font-bold px-2.5 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-lg border border-blue-500/30 transition-colors"
                            >
                              {copiedDana ? '✅ Nomor Tersalin' : '📋 Salin Nomor'}
                            </button>
                          </div>
                          <p className="text-base font-black font-mono text-white tracking-wider">
                            {cafeSettings.danaPhoneNumber}
                          </p>
                          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                            <span>Atas Nama:</span>
                            <span className="font-bold text-slate-200">
                              {cafeSettings?.qrisMerchantName || cafeSettings?.name || 'Kasir'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold pt-1 text-emerald-400">
                            <span>Nominal Transfer Pas:</span>
                            <span className="font-mono text-sm">{formatRupiah(totalDue)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400 space-y-1.5">
                          <p>Nomor akun DANA belum dikonfigurasi.</p>
                          <button
                            type="button"
                            onClick={() => setIsPosSettingsOpen(true)}
                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs rounded-xl border border-blue-500/30"
                          >
                            ⚙️ Masukkan Nomor DANA di Pengaturan
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400">
                        Pastikan bukti transfer telah diperiksa kasir dan dana terverifikasi masuk.
                      </p>
                    </div>
                  )}

                  {/* Tombol Selesai & Cetak Struk Kertas */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmPayment(taxRate, cafeSettings?.servicePercentage || 0, true)}
                      disabled={paymentMethod === 'cash' && cashReceived > 0 && cashReceived < totalDue}
                      className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
                    >
                      ✅ Selesaikan Pembayaran (Lunas)
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerPrintReceipt(undefined, payingOrders)}
                      className="px-3 py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all"
                      title="Cetak Struk Kertas 58mm/80mm (Opsional)"
                    >
                      🖨️ Cetak
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 4. MODAL PINDAH MEJA (MOVE TABLE) */}
      {movingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-slate-200">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>🔀</span>
              <span>Pindah Meja Pesanan</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pindahkan pesanan #{movingOrder.id.slice(-4)} ({movingOrder.customerName}) dari{' '}
              <strong className="text-white">{movingOrder.tableNumber}</strong> ke meja lain:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Pilih Meja Tujuan Baru:
              </label>
              <select
                value={targetNewTable}
                onChange={(e) => setTargetNewTable(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl text-white text-xs outline-none"
              >
                <option value="">-- Pilih Meja Baru --</option>
                {(tables || [])
                  .filter((t) => t !== movingOrder.tableNumber)
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMovingOrder(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveTable}
                disabled={!targetNewTable}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
              >
                Konfirmasi Pindah ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL VOID ITEM (BATALKAN MENU KARENA STOK HABIS) */}
      {voidingData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-slate-200">
            <h3 className="text-base font-black text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>Batalkan Item (Void)</span>
            </h3>
            <p className="text-xs text-slate-300">
              Apakah Anda yakin ingin membatalkan menu{' '}
              <strong className="text-white">{voidingData.itemName}</strong> dari pesanan ini?
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Alasan Pembatalan:
              </label>
              <input
                type="text"
                value={voidingData.reason}
                onChange={(e) => setVoidingData({ ...voidingData, reason: e.target.value })}
                placeholder="Misal: Stok dapur habis"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white text-xs outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidingData(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl shadow-md transition-all"
              >
                Ya, Batalkan Item
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* 9. MODAL ZOOM BARCODE QRIS (FULLSCREEN HIGH-RES DISPLAY) */}
      {isQrisZoomed && cafeSettings?.qrisImageUrl && (
        <div
          onClick={() => setIsQrisZoomed(false)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-750 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl animate-scaleUp cursor-default"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                📱 SCAN UNTUK BAYAR (QRIS)
              </span>
              <button
                type="button"
                onClick={() => setIsQrisZoomed(false)}
                className="text-slate-400 hover:text-white text-base font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="bg-white p-3 rounded-2xl shadow-2xl inline-block border-4 border-slate-200">
              <img
                src={cafeSettings.qrisImageUrl}
                alt="QRIS Zoom"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto"
              />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-white">
                {cafeSettings.qrisMerchantName || cafeSettings.name || 'CAFEYOU'}
              </h4>
              {payingTable && (
                <p className="text-xs text-slate-400">
                  Meja: <span className="font-bold text-slate-200">{payingTable}</span>
                </p>
              )}
              {cafeSettings.danaPhoneNumber && (
                <p className="text-xs text-blue-400 font-mono font-semibold">
                  DANA: {cafeSettings.danaPhoneNumber}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsQrisZoomed(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      <DeveloperFooter className="px-4 mt-auto" />
    </div>
  );
};
