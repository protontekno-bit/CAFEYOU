import { useState, useEffect, useRef, useCallback } from 'react';
import { initFirebaseDatabase, ref, set, onValue, onDisconnect } from '../config/firebase';
import { STORAGE_KEY } from '../constants/karaoke';

export interface PlayerLockInfo {
  activeSessionId: string;
  deviceLabel: string;
  lastHeartbeat: number;
  startedAt: number;
}

const HEARTBEAT_INTERVAL_MS = 6000;
const SESSION_TIMEOUT_MS = 16000;

function generateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  try {
    const existing = sessionStorage.getItem('cafeyou_player_session_id');
    if (existing) return existing;
    const newId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('cafeyou_player_session_id', newId);
    return newId;
  } catch {
    return `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Perangkat Proyektor';
  const ua = navigator.userAgent;
  if (/smart-tv|vidaa|tizen|webos|android tv/i.test(ua)) return 'Smart TV / Proyektor';
  if (/windows/i.test(ua)) return 'PC / Laptop (Windows)';
  if (/macintosh|mac os/i.test(ua)) return 'Laptop Mac';
  if (/android/i.test(ua)) return 'Perangkat Android';
  if (/iphone|ipad/i.test(ua)) return 'Perangkat Apple';
  return 'Layar Proyektor';
}

export function usePlayerSessionLock() {
  const [sessionId] = useState<string>(generateSessionId);
  const [isMaster, setIsMaster] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isMirror, setIsMirror] = useState<boolean>(false);
  const [activeLockInfo, setActiveLockInfo] = useState<PlayerLockInfo | null>(null);

  const isMasterRef = useRef(false);
  isMasterRef.current = isMaster;

  const isMirrorRef = useRef(false);
  isMirrorRef.current = isMirror;

  // Klaim atau ambil alih status Master
  const claimMaster = useCallback(async () => {
    const db = initFirebaseDatabase();
    if (!db) {
      // Fallback offline: langsung izinkan master
      setIsMaster(true);
      setIsLocked(false);
      return;
    }

    const lockRef = ref(db, `cafeyou/player_session_lock/${STORAGE_KEY}`);
    const lockData: PlayerLockInfo = {
      activeSessionId: sessionId,
      deviceLabel: getDeviceLabel(),
      lastHeartbeat: Date.now(),
      startedAt: Date.now(),
    };

    try {
      await set(lockRef, lockData);
      // Daftarkan penghapusan otomatis jika tab ditutup / koneksi terputus
      onDisconnect(lockRef).remove().catch(() => {});
      setIsMaster(true);
      setIsLocked(false);
      setIsMirror(false);
    } catch (err) {
      console.warn('Gagal mengklaim master proyektor:', err);
    }
  }, [sessionId]);

  // Pantau status sesi dari Firebase
  useEffect(() => {
    const db = initFirebaseDatabase();
    if (!db) {
      setIsMaster(true);
      setIsLocked(false);
      return;
    }

    const lockRef = ref(db, `cafeyou/player_session_lock/${STORAGE_KEY}`);
    const unsub = onValue(lockRef, (snap) => {
      const data: PlayerLockInfo | null = snap.val();
      setActiveLockInfo(data);

      const now = Date.now();
      const isExpired = !data || (now - (data.lastHeartbeat || 0) > SESSION_TIMEOUT_MS);

      if (isExpired) {
        // Sesi kosong atau kedaluwarsa: ambil alih secara otomatis jika bukan mirror
        if (!isMirrorRef.current) {
          claimMaster();
        }
      } else if (data.activeSessionId === sessionId) {
        // Sesi ini adalah master aktif
        setIsMaster(true);
        setIsLocked(false);
      } else {
        // Ada sesi lain yang aktif dan valid
        setIsMaster(false);
        if (isMirrorRef.current) {
          setIsLocked(false);
        } else {
          setIsLocked(true);
        }
      }
    });

    return () => unsub();
  }, [sessionId, claimMaster]);

  // Pengiriman Heartbeat berkala saat berstatus Master
  useEffect(() => {
    if (!isMaster) return;

    const db = initFirebaseDatabase();
    if (!db) return;

    const hbRef = ref(db, `cafeyou/player_session_lock/${STORAGE_KEY}/lastHeartbeat`);
    const interval = setInterval(() => {
      set(hbRef, Date.now()).catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isMaster]);

  // Opsi aktifkan Mirror Mode (Layar penonton tanpa kontrol & tanpa audio)
  const enableMirrorMode = useCallback(() => {
    setIsMirror(true);
    setIsLocked(false);
  }, []);

  // Kembali ke status lock dari mirror
  const disableMirrorMode = useCallback(() => {
    setIsMirror(false);
    if (!isMaster) {
      setIsLocked(true);
    }
  }, [isMaster]);

  return {
    sessionId,
    isMaster,
    isLocked,
    isMirror,
    activeLockInfo,
    takeOver: claimMaster,
    enableMirrorMode,
    disableMirrorMode,
  };
}
