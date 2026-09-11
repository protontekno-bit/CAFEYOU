import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database, ref, onValue, set, get } from 'firebase/database';

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
 * Konfigurasi Firebase Resmi CAFEYOU
 */
export const DEFAULT_FIREBASE_CONFIG: FirebaseCustomConfig = {
  projectId: 'cafeyou-c7666',
  databaseURL: 'https://cafeyou-c7666-default-rtdb.asia-southeast1.firebasedatabase.app/',
  authDomain: 'cafeyou-c7666.firebaseapp.com',
  storageBucket: 'cafeyou-c7666.appspot.com',
};

/**
 * Mendapatkan konfigurasi Firebase aktif (dari LocalStorage atau Default)
 */
export function getStoredFirebaseConfig(): FirebaseCustomConfig {
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
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Menyimpan konfigurasi Firebase kustom ke LocalStorage
 */
export function saveFirebaseConfig(config: FirebaseCustomConfig): void {
  try {
    localStorage.setItem(FIREBASE_STORAGE_CONFIG_KEY, JSON.stringify(config));
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

export { ref, onValue, set, get };
