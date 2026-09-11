import { useState, useEffect } from 'react';
import { OperatorScreen } from './components/operator/OperatorScreen';
import { PlayerScreen } from './components/player/PlayerScreen';
import { SplitScreen } from './components/split/SplitScreen';
import { LandingScreen } from './components/landing/LandingScreen';
import { GuestScreen } from './components/guest/GuestScreen';
import { AppRole } from './types';

export default function App() {
  const [role, setRole] = useState<AppRole>(() => {
    // Membaca status dari Hash URL saat aplikasi pertama kali dimuat
    const hash = window.location.hash;
    if (hash.startsWith('#operator')) return 'operator';
    if (hash.startsWith('#player')) return 'player';
    if (hash.startsWith('#split')) return 'split';
    if (hash.startsWith('#guest')) return 'guest';
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

  switch (role) {
    case 'operator':
      return <OperatorScreen setRole={setRole} />;
    case 'player':
      return <PlayerScreen setRole={setRole} />;
    case 'split':
      return <SplitScreen setRole={setRole} />;
    case 'guest':
      return <GuestScreen setRole={setRole} />;
    default:
      return <LandingScreen setRole={setRole} />;
  }
}
