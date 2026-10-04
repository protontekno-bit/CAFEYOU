/**
 * Credentials Utility — Operator Login Security
 * Hash password dengan Web Crypto API (SHA-256 + Salt) dan simpan/baca dari Firebase Cloud.
 * Mendukung migrasi transparan dari hash djb2 lama.
 */

import { initFirebaseDatabase, ref, get, set } from '../config/firebase';

const CREDENTIALS_LOCAL_KEY = 'cafeyou_op_credentials';
const FIREBASE_CREDENTIALS_PATH = 'system/operatorCredentials';
const CRYPTO_SALT = 'CAFEYOU_SALT_V2026_SECURE_';

/** Default password (KAFE1234) — hanya dipakai pertama kali jika belum ada kredensial */
const DEFAULT_PASSWORD_PLAIN = 'KAFE1234';

/**
 * djb2 hash legacy — untuk backward compatibility dengan hash lama di storage
 */
export function legacyDjb2Hash(plain: string): string {
  let hash = 5381;
  const str = plain.trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Hash password modern menggunakan Web Crypto API (SHA-256 + Salt).
 * Menghasilkan 64 karakter hex kriptografis yang aman dari rainbow table & brute force.
 */
export async function hashPassword(plain: string): Promise<string> {
  const str = `${CRYPTO_SALT}${plain.trim()}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  return legacyDjb2Hash(plain);
}

/**
 * Verifikasi password dengan dukungan migrasi transparan:
 * Jika storedHash memiliki panjang 64 (SHA-256), gunakan verifikasi SHA-256.
 * Jika storedHash panjangnya 8 (djb2 legacy), verifikasi dengan legacyDjb2Hash.
 */
export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  const trimmed = plain.trim();
  if (!storedHash) return false;

  if (storedHash.length === 64) {
    const computed = await hashPassword(trimmed);
    return computed === storedHash;
  }

  // Fallback hash djb2 lama
  return legacyDjb2Hash(trimmed) === storedHash;
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
  const defaultHash = await hashPassword(DEFAULT_PASSWORD_PLAIN);
  const defaultCreds: OperatorCredentials = {
    username: 'operator',
    passwordHash: defaultHash,
    updatedAt: Date.now(),
  };
  return defaultCreds;
}

/** Menyimpan kredensial baru ke Firebase dan localStorage dengan SHA-256 */
export async function saveOperatorCredentials(
  username: string,
  newPasswordPlain: string
): Promise<void> {
  const hash = await hashPassword(newPasswordPlain.trim());
  const creds: OperatorCredentials = {
    username: username.trim() || 'operator',
    passwordHash: hash,
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
