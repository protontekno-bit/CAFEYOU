import { useState, useEffect, lazy, Suspense } from 'react';
import { AppRole } from './types';

// Code-splitting & Lazy loading per layar peran
const OperatorScreen = lazy(() =>
  import('./components/operator/OperatorScreen').then((m) => ({ default: m.OperatorScreen }))
);
const PlayerScreen = lazy(() =>
  import('./components/player/PlayerScreen').then((m) => ({ default: m.PlayerScreen }))
);
const SplitScreen = lazy(() =>
  import('./components/split/SplitScreen').then((m) => ({ default: m.SplitScreen }))
);
const LandingScreen = lazy(() =>
  import('./components/landing/LandingScreen').then((m) => ({ default: m.LandingScreen }))
);
const GuestScreen = lazy(() =>
  import('./components/guest/GuestScreen').then((m) => ({ default: m.GuestScreen }))
);
const PosScreen = lazy(() =>
  import('./components/pos/PosScreen').then((m) => ({ default: m.PosScreen }))
);

// Fallback spinner elegan bertema gelap
const ScreenFallback = () => (
  <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none z-50 animate-fadeIn">
    <div className="relative flex items-center justify-center mb-4">
      <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <div className="absolute text-xl">🎤</div>
    </div>
    <div className="text-sm font-extrabold tracking-wider uppercase text-blue-400">
      CAFEYOU KARAOKE
    </div>
    <div className="text-xs text-slate-500 mt-1 font-medium animate-pulse">
      Memuat modul sistem...
    </div>
  </div>
);

export default function App() {
  const [role, setRole] = useState<AppRole>(() => {
    // Membaca status dari Hash URL saat aplikasi pertama kali dimuat
    const hash = window.location.hash;
    if (hash.startsWith('#operator')) return 'operator';
    if (hash.startsWith('#player')) return 'player';
    if (hash.startsWith('#split')) return 'split';
    if (hash.startsWith('#guest')) return 'guest';
    if (hash.startsWith('#pos')) return 'pos';
    return 'landing';
  });

  // Sinkronkan state jika user menggunakan tombol back/forward di browser
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#operator')) setRole('operator');
      else if (hash.startsWith('#player')) setRole('player');
      else if (hash.startsWith('#split')) setRole('split');
      else if (hash.startsWith('#guest')) setRole('guest');
      else if (hash.startsWith('#pos')) setRole('pos');
      else setRole('landing');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Memperbarui URL Hash ketika role berubah
  useEffect(() => {
    if (role === 'landing') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      if (!window.location.hash.startsWith(`#${role}`)) {
        window.location.hash = role;
      }
    }
  }, [role]);

  const renderScreen = () => {
    switch (role) {
      case 'operator':
        return <OperatorScreen setRole={setRole} />;
      case 'player':
        return <PlayerScreen setRole={setRole} />;
      case 'split':
        return <SplitScreen setRole={setRole} />;
      case 'guest':
        return <GuestScreen setRole={setRole} />;
      case 'pos':
        return <PosScreen setRole={setRole} />;
      default:
        return <LandingScreen setRole={setRole} />;
    }
  };

  return <Suspense fallback={<ScreenFallback />}>{renderScreen()}</Suspense>;
}
