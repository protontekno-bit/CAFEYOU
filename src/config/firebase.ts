import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  Database,
  ref,
  onValue,
  set,
  get,
  push,
  update,
  onDisconnect,
  runTransaction,
} from 'firebase/database';

export interface FirebaseCustomConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const FIREBASE_STORAGE_CONFIG_KEY = 'cafeyou_firebase_custom_config';

/**
 * Konfigurasi Firebase Resmi CAFEYOU (Bawaan)
 */
export const DEFAULT_FIREBASE_CONFIG: FirebaseCustomConfig = {
  projectId: 'cafeyou-c7666',
  databaseURL: 'https://cafeyou-c7666-default-rtdb.asia-southeast1.firebasedatabase.app/',
  authDomain: 'cafeyou-c7666.firebaseapp.com',
  storageBucket: 'cafeyou-c7666.appspot.com',
};

/**
 * Memvalidasi apakah URL merupakan endpoint resmi Google Firebase Realtime Database
 */
export function isValidFirebaseDatabaseUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return host.endsWith('.firebaseio.com') || host.endsWith('.firebasedatabase.app');
  } catch {
    return false;
  }
}

/**
 * Memvalidasi apakah Project ID Firebase aman dan berformat valid
 */
export function isValidFirebaseProjectId(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$/i.test(id.trim());
}

/**
 * Mendapatkan konfigurasi Firebase aktif (URL query params, LocalStorage, atau Default)
 */
export function getStoredFirebaseConfig(): FirebaseCustomConfig {
  // 1. Coba baca dari URL parameter jika dibagikan via link QR (mendukung ?query dan #hash?query)
  try {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      let urlDb = searchParams.get('dbUrl');
      let urlProj = searchParams.get('projId');

      if (!urlDb && !urlProj && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          urlDb = hashParams.get('dbUrl');
          urlProj = hashParams.get('projId');
        }
      }

      // Sanitasi & Whitelist: Hanya izinkan domain resmi Firebase
      const safeDb = isValidFirebaseDatabaseUrl(urlDb) ? urlDb! : undefined;
      const safeProj = isValidFirebaseProjectId(urlProj) ? urlProj! : undefined;

      if (safeDb || safeProj) {
        const urlConfig: FirebaseCustomConfig = {
          databaseURL: safeDb,
          projectId: safeProj,
          authDomain: safeProj ? `${safeProj}.firebaseapp.com` : undefined,
        };
        return urlConfig;
      }
    }
  } catch {}

  // 2. Coba baca dari LocalStorage
  try {
    const raw = localStorage.getItem(FIREBASE_STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.databaseURL || parsed.projectId)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Gagal membaca konfigurasi Firebase dari localStorage:', err);
  }

  // 3. Fallback ke Default
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Menyimpan konfigurasi Firebase kustom ke LocalStorage
 */
export function saveFirebaseConfig(config: FirebaseCustomConfig): void {
  try {
    localStorage.setItem(FIREBASE_STORAGE_CONFIG_KEY, JSON.stringify(config));
    cachedDb = null; // Reset cache agar koneksi baru diinisialisasi
  } catch (err) {
    console.error('Gagal menyimpan konfigurasi Firebase:', err);
  }
}

/**
 * Menghapus konfigurasi Firebase kustom (kembali ke default CAFEYOU)
 */
export function clearFirebaseConfig(): void {
  try {
    localStorage.removeItem(FIREBASE_STORAGE_CONFIG_KEY);
    cachedDb = null;
  } catch (err) {}
}

let cachedDb: Database | null = null;

/**
 * Menginisialisasi Firebase App & Realtime Database secara aman
 */
export function initFirebaseDatabase(): Database | null {
  if (cachedDb) return cachedDb;

  const config = getStoredFirebaseConfig();
  if (!config || (!config.databaseURL && !config.projectId)) {
    return null;
  }

  try {
    let app: FirebaseApp;
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    cachedDb = getDatabase(app);
    return cachedDb;
  } catch (error) {
    console.warn('Inisialisasi Firebase gagal, menggunakan mode lokal:', error);
    return null;
  }
}

export { ref, onValue, set, get, push, update, onDisconnect, runTransaction };

