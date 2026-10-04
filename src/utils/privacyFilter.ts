/**
 * Privacy Filter Utility — Proteksi Data Pribadi & Rahasia Kasir
 * Memastikan data kredensial, password kasir/operator, dan API key
 * tidak pernah bocor ke portal smartphone tamu (Guest Screen).
 */

import type { CafeSettings, DailyPinConfig, Voucher } from '../types';

/**
 * Membersihkan CafeSettings sebelum diberikan ke antarmuka Tamu (GuestScreen).
 * Menghapus rahasia administratif: posPassword, operatorPassword, youtubeApiKey.
 * Mempertahankan nama kafe, info pajak, QRIS, dan nomor pembayaran DANA kafe.
 */
export function sanitizeSettingsForGuest(settings?: CafeSettings): CafeSettings {
  if (!settings) {
    return { name: 'CAFEYOU' };
  }

  // Buat salinan aman tanpa properti rahasia kasir & operator
  const sanitized: CafeSettings = {
    ...settings,
    posPassword: '',
    kitchenPassword: '',
    operatorPassword: '',
    youtubeApiKey: '',
  };

  return sanitized;
}

/**
 * Menyembunyikan kode PIN harian dari perangkat tamu.
 * Tamu hanya mengetahui apakah fitur Daily PIN diaktifkan oleh kafe atau tidak.
 */
export function sanitizeDailyPinForGuest(dailyPin?: DailyPinConfig): DailyPinConfig {
  return {
    enabled: Boolean(dailyPin?.enabled),
    code: '', // Kosongkan plaintext code agar tidak bisa di-inspect
  };
}

/**
 * Memfilter daftar voucher agar hanya menampilkan voucher milik meja pengguna
 */
export function filterVouchersForTable(
  vouchers: Record<string, Voucher> | undefined,
  tableNumber: string
): Record<string, Voucher> {
  if (!vouchers || !tableNumber) return {};
  const cleanTable = tableNumber.trim().toLowerCase();

  const result: Record<string, Voucher> = {};
  for (const [code, v] of Object.entries(vouchers)) {
    if (v && v.tableNumber && v.tableNumber.trim().toLowerCase() === cleanTable) {
      result[code] = v;
    }
  }
  return result;
}
