import { useEffect, useRef } from 'react';

/**
 * Custom hook untuk mencegah layar tablet / proyektor mati (sleep / lock) otomatis
 * selama jam operasional kafe menggunakan Screen WakeLock API standar browser.
 */
export function useWakeLock(enabled: boolean = true) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          if (wakeLockRef.current) {
            wakeLockRef.current.addEventListener('release', () => {
              // Lock released
            });
          }
        }
      } catch (err) {
        // Browser tidak mengizinkan atau tidak mendukung wake lock (misal battery saver mode)
        console.warn('Screen WakeLock tidak aktif:', err);
      }
    };

    // Minta wake lock saat halaman aktif
    requestWakeLock();

    // Minta ulang saat tab kembali dibuka / aktif setelah berpindah aplikasi
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {}
        wakeLockRef.current = null;
      }
    };
  }, [enabled]);
}
