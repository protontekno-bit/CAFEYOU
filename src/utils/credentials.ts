/**
 * Credentials Utility — Operator Login Security
 * Hash password (djb2) dan simpan/baca dari Firebase Cloud.
 * Tidak membutuhkan library tambahan.
 */

import { initFirebaseDatabase, ref, get, set } from '../config/firebase';

const CREDENTIALS_LOCAL_KEY = 'cafeyou_op_credentials';
const FIREBASE_CREDENTIALS_PATH = 'system/operatorCredentials';

/** Default password hash (KAFE1234) — hanya dipakai pertama kali jika belum ada kredensial */
const DEFAULT_PASSWORD_PLAIN = 'KAFE1234';

/**
 * djb2 hash — simple, fast, no dependencies.
 * Mengembalikan string hex 8 karakter.
 */
export function hashPassword(plain: string): string {
  let hash = 5381;
  const str = plain.trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to unsigned hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  return hashPassword(plain.trim()) === storedHash;
}

export interface OperatorCredentials {
  username: string;
  passwordHash: string;
  updatedAt?: number;
}

/** Membaca kredensial dari Firebase, fallback ke localStorage */
export async function loadOperatorCredentials(): Promise<OperatorCredentials> {
  // 1. Coba dari Firebase
  try {
    const db = initFirebaseDatabase();
    if (db) {
      const snap = await get(ref(db, FIREBASE_CREDENTIALS_PATH));
      if (snap.exists()) {
        const data = snap.val() as OperatorCredentials;
        if (data && data.passwordHash) {
          // Sinkronisasi ke localStorage sebagai cache offline
          try {
            localStorage.setItem(CREDENTIALS_LOCAL_KEY, JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    }
  } catch (err) {
    console.warn('Gagal membaca kredensial dari Firebase:', err);
  }

  // 2. Fallback ke localStorage
  try {
    const raw = localStorage.getItem(CREDENTIALS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OperatorCredentials;
      if (parsed && parsed.passwordHash) return parsed;
    }
  } catch {}

  // 3. Gunakan default pertama kali
  const defaultCreds: OperatorCredentials = {
    username: 'operator',
    passwordHash: hashPassword(DEFAULT_PASSWORD_PLAIN),
    updatedAt: Date.now(),
  };
  return defaultCreds;
}

/** Menyimpan kredensial baru ke Firebase dan localStorage */
export async function saveOperatorCredentials(
  username: string,
  newPasswordPlain: string
): Promise<void> {
  const creds: OperatorCredentials = {
    username: username.trim() || 'operator',
    passwordHash: hashPassword(newPasswordPlain.trim()),
    updatedAt: Date.now(),
  };

  // Simpan ke localStorage segera
  try {
    localStorage.setItem(CREDENTIALS_LOCAL_KEY, JSON.stringify(creds));
  } catch {}

  // Simpan ke Firebase
  try {
    const db = initFirebaseDatabase();
    if (db) {
      await set(ref(db, FIREBASE_CREDENTIALS_PATH), creds);
    }
  } catch (err) {
    console.warn('Gagal menyimpan kredensial ke Firebase (tersimpan lokal):', err);
  }
}

export { DEFAULT_PASSWORD_PLAIN };
