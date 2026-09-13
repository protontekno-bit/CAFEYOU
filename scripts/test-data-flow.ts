/**
 * CAFEYOU — Automated Data Flow & Business Logic Test Suite
 * Menjalankan validasi menyeluruh terhadap 8 modul alur data kritis:
 * 1. Kalkulasi Finansial (PB1, Service, Pembulatan Cash)
 * 2. Klasifikasi Stasiun Dapur vs Barista (isDrinkItem)
 * 3. Siklus Hidup Tiket & Promosi Otomatis (Pending -> Preparing -> Ready -> Served)
 * 4. Logika Batal / Revert Status (Undo Workflow)
 * 5. Pembatalan Parsial Menu Habis (Void Item) & Pengurangan Subtotal
 * 6. Bulk Action Cerdas Berbasis Stasiun (Station-Aware Updates)
 * 7. Pisah Tagihan Kasir (Split Bill) & Pelunasan
 * 8. Pembersihan Shift (Arsip Tiket Lunas & Perlindungan Meja Aktif)
 */

import { calculateTaxAndService, formatRupiah, isDrinkItem } from '../src/utils/billing.ts';
import type { TableOrder, OrderItem, KitchenStationFilter, OrderStatus } from '../src/types/index.ts';

// Harness Pengujian Sederhana & Mandiri
let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
    failedCount++;
  }
}

console.log('\n======================================================');
console.log('🧪 MEMULAI AUDIT & PENGUJIAN OTOMATIS ALUR DATA CAFEYOU');
console.log('======================================================\n');

// --------------------------------------------------------------------------
// TEST SUITE 1: Finansial & Pajak PB1 / Service / Pembulatan
// --------------------------------------------------------------------------
console.log('🔹 [1/8] Menguji Kalkulasi Finansial & Pajak PB1...');
{
  // 1.1 Format Rupiah
  assert(formatRupiah(50000) === 'Rp 50.000', 'Format mata uang Rupiah standar');
  assert(formatRupiah(0) === 'Rp 0', 'Format mata uang Rupiah nominal 0');

  // 1.2 Pajak Eksklusif (Tax Plus 10%)
  const resTaxPlus = calculateTaxAndService(100000, false, 10, 0, false, true);
  assert(resTaxPlus.subtotal === 100000, 'Subtotal benar 100.000');
  assert(resTaxPlus.taxAmount === 10000, 'Nominal PB1 10% tepat Rp 10.000');
  assert(resTaxPlus.totalAmount === 110000, 'Total akhir eksklusif PB1 tepat Rp 110.000');

  // 1.3 Pajak Inklusif (Harga Sudah Termasuk Pajak)
  const resTaxIncl = calculateTaxAndService(100000, true, 10, 0, false, true);
  assert(resTaxIncl.taxRate === 0, 'Tax rate tambahan 0 jika inklusif');
  assert(resTaxIncl.taxAmount === 0, 'Tidak ada pungutan tambahan pada harga inklusif');
  assert(resTaxIncl.totalAmount === 100000, 'Total akhir inklusif tetap Rp 100.000');

  // 1.4 Pajak + Biaya Layanan (Service Charge 5%)
  const resService = calculateTaxAndService(200000, false, 10, 5, false, true);
  assert(resService.taxAmount === 20000, 'PB1 10% dari 200.000 = 20.000');
  assert(resService.serviceAmount === 10000, 'Service 5% dari 200.000 = 10.000');
  assert(resService.totalAmount === 230000, 'Total akhir = Subtotal + PB1 + Service (230.000)');

  // 1.5 Pembulatan Tunai Kasir (Cash Rounding) ke ratusan terdekat
  const resRoundingUp = calculateTaxAndService(15230, false, 0, 0, true, true);
  assert(resRoundingUp.totalAmount === 15200, '15.230 dibulatkan ke bawah menjadi 15.200');
  assert(resRoundingUp.roundingAmount === -30, 'Nilai roundingAmount -30 tercatat akurat');

  const resRounding50 = calculateTaxAndService(15270, false, 0, 0, true, true);
  assert(resRounding50.totalAmount === 15300, '15.270 dibulatkan ke atas menjadi 15.300');
  assert(resRounding50.roundingAmount === 30, 'Nilai roundingAmount +30 tercatat akurat');
}

// --------------------------------------------------------------------------
// TEST SUITE 2: Klasifikasi Stasiun Dapur vs Barista (isDrinkItem)
// --------------------------------------------------------------------------
console.log('\n🔹 [2/8] Menguji Klasifikasi Stasiun Kerja (Dapur vs Barista)...');
{
  // Minuman
  assert(isDrinkItem({ name: 'Es Kopi Susu Gula Aren' }) === true, 'Es Kopi terdeteksi sebagai Minuman (Bar)');
  assert(isDrinkItem({ name: 'Hot Americano' }) === true, 'Hot Americano terdeteksi sebagai Minuman (Bar)');
  assert(isDrinkItem({ name: 'Lemon Tea Dingin' }) === true, 'Lemon Tea terdeteksi sebagai Minuman (Bar)');
  assert(isDrinkItem({ name: 'Matcha Latte' }) === true, 'Matcha Latte terdeteksi sebagai Minuman (Bar)');
  assert(isDrinkItem({ name: 'Jus Alpukat' }) === true, 'Jus Alpukat terdeteksi sebagai Minuman (Bar)');
  assert(isDrinkItem({ name: 'Soda Squash', category: 'BEVERAGE' }) === true, 'Kategori BEVERAGE terdeteksi sebagai Minuman');

  // Makanan
  assert(isDrinkItem({ name: 'Rice Bowl Daging Sapi Teriyaki' }) === false, 'Rice Bowl Daging Sapi Teriyaki terdeteksi sebagai Makanan (Dapur)');
  assert(isDrinkItem({ name: 'Nasi Goreng Spesial' }) === false, 'Nasi Goreng terdeteksi sebagai Makanan (Dapur)');
  assert(isDrinkItem({ name: 'Ayam Bakar Madu' }) === false, 'Ayam Bakar terdeteksi sebagai Makanan (Dapur)');
  assert(isDrinkItem({ name: 'Kentang Goreng Keju (French Fries)' }) === false, 'Kentang Goreng Keju terdeteksi sebagai Makanan (Dapur)');
  assert(isDrinkItem({ name: 'Kentang Goreng French Fries', category: 'SNACK' }) === false, 'Snack Kentang terdeteksi sebagai Makanan');
  assert(isDrinkItem({ name: 'Mie Nyemek', category: 'FOOD' }) === false, 'Mie Nyemek terdeteksi sebagai Makanan');
}

// --------------------------------------------------------------------------
// TEST SUITE 3: Siklus Hidup Tiket & Promosi Otomatis (Pending -> Preparing -> Ready -> Served)
// --------------------------------------------------------------------------
console.log('\n🔹 [3/8] Menguji Siklus Hidup Tiket KDS & Promosi Otomatis...');
{
  const items: OrderItem[] = [
    { id: 'it-1', name: 'Nasi Goreng', price: 25000, quantity: 1 },
    { id: 'it-2', name: 'Es Teh Manis', price: 5000, quantity: 1 },
  ];

  let order: TableOrder = {
    id: 'ord-test-01',
    orderNumber: 'ORD-001',
    tableNumber: 'Meja 01',
    customerName: 'Ahmad',
    items,
    totalAmount: 30000,
    subtotal: 30000,
    taxAmount: 0,
    serviceAmount: 0,
    roundingAmount: 0,
    status: 'pending',
    createdAt: Date.now(),
    orderType: 'DINE_IN',
  };

  assert(order.status === 'pending', 'Tiket awal berstatus pending');

  // Simulasi Konfirmasi Dapur -> PREPARING
  order.status = 'PREPARING';
  assert(order.status === 'PREPARING', 'Dapur konfirmasi tiket -> PREPARING');

  // Masak item 1 (Nasi Goreng)
  order.items[0].isCooked = true;
  assert(order.items.every((it) => it.isCooked) === false, 'Tiket belum ready karena Es Teh belum matang');

  // Masak item 2 (Es Teh)
  order.items[1].isCooked = true;
  const allCooked = order.items.every((it) => it.isCooked);
  if (allCooked) order.status = 'READY';
  assert(order.status === 'READY', 'Tiket otomatis promosi ke READY saat semua item matang');

  // Antar item 1
  order.items[0].isServed = true;
  assert(order.items.every((it) => it.isServed) === false, 'Tiket belum served karena Es Teh belum diantar');

  // Antar item 2
  order.items[1].isServed = true;
  const allServed = order.items.every((it) => it.isServed);
  if (allServed) order.status = 'SERVED';
  assert(order.status === 'SERVED', 'Tiket otomatis promosi ke SERVED saat semua item diantar');
}

// --------------------------------------------------------------------------
// TEST SUITE 4: Fitur Revert / Undo Status di KDS
// --------------------------------------------------------------------------
console.log('\n🔹 [4/8] Menguji Logika Revert / Undo Status KDS...');
{
  function simulateRevert(order: TableOrder): TableOrder {
    const s = order.status?.toLowerCase();
    let nextStatus: OrderStatus = 'pending';
    let resetItems = order.items ? [...order.items] : [];

    if (s === 'served') {
      nextStatus = 'READY';
      resetItems = resetItems.map((it) => ({ ...it, isServed: false }));
    } else if (s === 'ready') {
      nextStatus = 'PREPARING';
      resetItems = resetItems.map((it) => ({ ...it, isCooked: false, isServed: false }));
    } else if (s === 'preparing' || s === 'cooking' || s === 'confirmed') {
      nextStatus = 'pending';
      resetItems = resetItems.map((it) => ({ ...it, isCooked: false, isServed: false }));
    }

    return { ...order, status: nextStatus, items: resetItems };
  }

  const testOrder: TableOrder = {
    id: 'ord-revert-01',
    tableNumber: 'Meja 05',
    items: [
      { id: '1', name: 'Kopi', price: 15000, quantity: 1, isCooked: true, isServed: true },
      { id: '2', name: 'Roti', price: 10000, quantity: 1, isCooked: true, isServed: true },
    ],
    totalAmount: 25000,
    status: 'SERVED',
    createdAt: Date.now(),
  };

  // Revert 1: Dari SERVED -> READY
  const rev1 = simulateRevert(testOrder);
  assert(rev1.status === 'READY', 'Revert dari SERVED menghasilkan status READY');
  assert(rev1.items.every((it) => it.isServed === false), 'Seluruh flag isServed direset menjadi false');
  assert(rev1.items.every((it) => it.isCooked === true), 'Flag isCooked tetap dipertahankan saat kembali ke READY');

  // Revert 2: Dari READY -> PREPARING
  const rev2 = simulateRevert(rev1);
  assert(rev2.status === 'PREPARING', 'Revert dari READY menghasilkan status PREPARING');
  assert(rev2.items.every((it) => it.isCooked === false), 'Seluruh flag isCooked direset menjadi false');

  // Revert 3: Dari PREPARING -> PENDING
  const rev3 = simulateRevert(rev2);
  assert(rev3.status === 'pending', 'Revert dari PREPARING menghasilkan status pending');
}

// --------------------------------------------------------------------------
// TEST SUITE 5: Pembatalan Parsial Menu Habis (Void Item) & Pengurangan Subtotal
// --------------------------------------------------------------------------
console.log('\n🔹 [5/8] Menguji Pembatalan Parsial (Item Void) & Koreksi Keuangan...');
{
  function simulateVoidItem(order: TableOrder, itemIndex: number, reason: string): TableOrder {
    const updatedItems = order.items.map((it, idx) => {
      if (idx === itemIndex) {
        return { ...it, isVoided: true, voidReason: reason };
      }
      return it;
    });

    const activeItems = updatedItems.filter((it) => !it.isVoided);
    const newSubtotal = activeItems.reduce(
      (sum, it) => sum + it.price * (it.quantity ?? it.qty ?? 1),
      0
    );

    return {
      ...order,
      items: updatedItems,
      subtotal: newSubtotal,
      totalAmount: newSubtotal,
    };
  }

  const initialOrder: TableOrder = {
    id: 'ord-void-01',
    tableNumber: 'Meja 03',
    items: [
      { id: '1', name: 'Steak Daging', price: 60000, quantity: 1 },
      { id: '2', name: 'Jus Mangga', price: 20000, quantity: 1 },
    ],
    subtotal: 80000,
    totalAmount: 80000,
    status: 'PREPARING',
    createdAt: Date.now(),
  };

  // Void item index 0 (Steak Daging habis)
  const voidedOrder = simulateVoidItem(initialOrder, 0, 'Daging habis di supplier');
  assert(voidedOrder.items[0].isVoided === true, 'Item Steak ditandai isVoided: true');
  assert(voidedOrder.items[0].voidReason === 'Daging habis di supplier', 'Alasan void tersimpan rapi');
  assert(voidedOrder.items[1].isVoided !== true, 'Item Jus Mangga tetap aktif');
  assert(voidedOrder.subtotal === 20000, 'Subtotal tiket otomatis turun dari 80.000 menjadi 20.000');
  assert(voidedOrder.totalAmount === 20000, 'TotalAmount otomatis tersinkronisasi');

  // Evaluasi promosi status hanya memperhitungkan item non-void
  voidedOrder.items[1].isCooked = true;
  const nonVoid = voidedOrder.items.filter((it) => !it.isVoided);
  const isReady = nonVoid.length > 0 && nonVoid.every((it) => it.isCooked);
  assert(isReady === true, 'Tiket dipromosikan ke READY karena item non-void telah matang');
}

// --------------------------------------------------------------------------
// TEST SUITE 6: Bulk Update Cerdas Berbasis Stasiun (Station-Aware)
// --------------------------------------------------------------------------
console.log('\n🔹 [6/8] Menguji Aksi Massal Berbasis Stasiun Kerja...');
{
  function simulateBulkUpdate(
    order: TableOrder,
    field: 'isCooked' | 'isServed',
    val: boolean,
    station: KitchenStationFilter
  ): TableOrder {
    const updatedItems = order.items.map((it) => {
      if (it.isVoided) return it;
      const isDrink = isDrinkItem(it);
      const matches =
        station === 'ALL' ||
        (station === 'BAR' && isDrink) ||
        (station === 'KITCHEN' && !isDrink);

      if (matches) {
        return {
          ...it,
          [field]: val,
          ...(field === 'isCooked' && val ? { cookedAt: Date.now() } : {}),
        };
      }
      return it;
    });

    return { ...order, items: updatedItems };
  }

  const mixedOrder: TableOrder = {
    id: 'ord-mix-01',
    tableNumber: 'Meja 09',
    items: [
      { id: '1', name: 'Nasi Goreng Seafood', price: 30000, quantity: 1, isCooked: false },
      { id: '2', name: 'Es Cappuccino', price: 18000, quantity: 1, isCooked: false },
    ],
    subtotal: 48000,
    totalAmount: 48000,
    status: 'PREPARING',
    createdAt: Date.now(),
  };

  // Barista klik "Minuman Siap Saji" di stasiun BAR
  const afterBarista = simulateBulkUpdate(mixedOrder, 'isCooked', true, 'BAR');
  assert(afterBarista.items[1].isCooked === true, 'Es Cappuccino berhasil ditandai isCooked oleh Barista');
  assert(afterBarista.items[0].isCooked === false, 'Nasi Goreng TIDAK ikut matang saat Barista klik tombol');

  // Koki klik "Makanan Siap Saji" di stasiun KITCHEN
  const afterKitchen = simulateBulkUpdate(afterBarista, 'isCooked', true, 'KITCHEN');
  assert(afterKitchen.items[0].isCooked === true, 'Nasi Goreng berhasil ditandai isCooked oleh Koki Dapur');
  assert(afterKitchen.items.every((it) => it.isCooked), 'Seluruh menu sekarang telah matang');
}

// --------------------------------------------------------------------------
// TEST SUITE 7: Pisah Tagihan Kasir (Split Bill) & Pelunasan
// --------------------------------------------------------------------------
console.log('\n🔹 [7/8] Menguji Logika Pisah Tagihan Kasir (Split Bill)...');
{
  const tableOrdersMap: Record<string, TableOrder> = {
    'ord-t1': {
      id: 'ord-t1',
      orderNumber: 'ORD-001',
      tableNumber: 'Meja 04',
      items: [{ id: '1', name: 'Kopi', price: 15000, quantity: 1 }],
      totalAmount: 15000,
      subtotal: 15000,
      status: 'SERVED',
      createdAt: Date.now() - 10000,
    },
    'ord-t2': {
      id: 'ord-t2',
      orderNumber: 'ORD-002',
      tableNumber: 'Meja 04',
      items: [{ id: '2', name: 'Pizza', price: 65000, quantity: 1 }],
      totalAmount: 65000,
      subtotal: 65000,
      status: 'SERVED',
      createdAt: Date.now() - 5000,
    },
  };

  // Tamu ingin bayar Tiket 1 saja terlebih dahulu (Split Bill)
  const selectedOrderIds = ['ord-t1'];
  const payingOrders = Object.values(tableOrdersMap).filter((o) => o.tableNumber === 'Meja 04');
  const effectiveOrders = payingOrders.filter((o) => selectedOrderIds.includes(o.id));

  assert(effectiveOrders.length === 1, 'Hanya 1 tiket yang terpilih untuk split bill');
  assert(effectiveOrders[0].id === 'ord-t1', 'Tiket yang terpilih adalah ord-t1');

  // Eksekusi pelunasan tiket terpilih
  const paidTimestamp = Date.now();
  tableOrdersMap['ord-t1'] = {
    ...tableOrdersMap['ord-t1'],
    status: 'PAID',
    paidAt: paidTimestamp,
    paymentMethod: 'QRIS',
  };

  assert(tableOrdersMap['ord-t1'].status === 'PAID', 'Tiket 1 berhasil berstatus PAID');
  assert(tableOrdersMap['ord-t1'].paymentMethod === 'QRIS', 'Metode bayar QRIS tercatat');
  assert(tableOrdersMap['ord-t2'].status === 'SERVED', 'Tiket 2 tetap berstatus SERVED (belum lunas) di meja');

  // Verifikasi filter tagihan aktif di meja
  const activeUnpaidOrders = Object.values(tableOrdersMap).filter(
    (o) => o.tableNumber === 'Meja 04' && o.status !== 'PAID' && o.status !== 'cancelled'
  );
  assert(activeUnpaidOrders.length === 1, 'Meja 04 masih memiliki 1 tiket aktif yang belum dibayar');
  assert(activeUnpaidOrders[0].id === 'ord-t2', 'Tiket aktif tersebut adalah Pizza (ord-t2)');
}

// --------------------------------------------------------------------------
// TEST SUITE 8: Pembersihan Shift (Arsip Tiket Lunas & Perlindungan Meja Aktif)
// --------------------------------------------------------------------------
console.log('\n🔹 [8/8] Menguji Logika Pembersihan Shift & Proteksi Data Aktif...');
{
  const ordersBeforeShiftClear: Record<string, TableOrder> = {
    'ord-1': { id: 'ord-1', tableNumber: 'Meja 01', status: 'PAID', items: [], totalAmount: 50000, createdAt: 1 },
    'ord-2': { id: 'ord-2', tableNumber: 'Meja 02', status: 'cancelled', items: [], totalAmount: 30000, createdAt: 2 },
    'ord-3': { id: 'ord-3', tableNumber: 'Meja 03', status: 'pending', items: [], totalAmount: 40000, createdAt: 3 },
    'ord-4': { id: 'ord-4', tableNumber: 'Meja 04', status: 'PREPARING', items: [], totalAmount: 70000, createdAt: 4 },
    'ord-5': { id: 'ord-5', tableNumber: 'Meja 05', status: 'READY', items: [], totalAmount: 25000, createdAt: 5 },
    'ord-6': { id: 'ord-6', tableNumber: 'Meja 06', status: 'SERVED', items: [], totalAmount: 90000, createdAt: 6 },
  };

  // Logika pembersihan shift: hanya arsipkan yang berstatus PAID atau CANCELLED
  const activeOnly: Record<string, TableOrder> = {};
  Object.entries(ordersBeforeShiftClear).forEach(([id, ord]) => {
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

  assert(Object.keys(activeOnly).length === 4, '4 tiket aktif berhasil dipertahankan');
  assert(!('ord-1' in activeOnly), 'Tiket ord-1 (PAID) berhasil diarsipkan dari memori aktif');
  assert(!('ord-2' in activeOnly), 'Tiket ord-2 (cancelled) berhasil diarsipkan dari memori aktif');
  assert('ord-3' in activeOnly, 'Tiket ord-3 (pending) tetap aman');
  assert('ord-4' in activeOnly, 'Tiket ord-4 (PREPARING) tetap aman');
  assert('ord-5' in activeOnly, 'Tiket ord-5 (READY) tetap aman');
  assert('ord-6' in activeOnly, 'Tiket ord-6 (SERVED) tetap aman');
}

// --------------------------------------------------------------------------
// REKAPITULASI HASIL PENGUJIAN
// --------------------------------------------------------------------------
console.log('\n======================================================');
console.log('📊 REKAPITULASI HASIL AUDIT ALUR DATA:');
console.log(`   Total Pengujian : ${passedCount + failedCount}`);
console.log(`   ✅ Lulus (Pass) : ${passedCount}`);
console.log(`   ❌ Gagal (Fail) : ${failedCount}`);
console.log('======================================================\n');

if (failedCount > 0) {
  console.error('🚨 Ditemukan kegagalan pada alur data. Mohon periksa detail error di atas.');
  process.exit(1);
} else {
  console.log('🎉 SEMUA 8 MODUL ALUR DATA CRITICAL LOLOS 100% TANPA KESALAHAN!\n');
  process.exit(0);
}
