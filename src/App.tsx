import React, { useState, useEffect } from 'react';
import { OperatorScreen } from './components/operator/OperatorScreen';
import { PlayerScreen } from './components/player/PlayerScreen';
import { SplitScreen } from './components/split/SplitScreen';
import { LandingScreen } from './components/landing/LandingScreen';
import { AppRole } from './types';

export default function App() {
  const [role, setRole] = useState<AppRole>(() => {
    // Membaca status dari Hash URL saat aplikasi pertama kali dimuat
    const hash = window.location.hash;
    if (hash === '#operator') return 'operator';
    if (hash === '#player') return 'player';
    if (hash === '#split') return 'split';
    return 'landing';
  });

  // Sinkronkan state jika user menggunakan tombol back/forward di browser
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#operator') setRole('operator');
      else if (hash === '#player') setRole('player');
      else if (hash === '#split') setRole('split');
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
      window.location.hash = role;
    }
  }, [role]);

  switch (role) {
    case 'operator':
      return <OperatorScreen setRole={setRole} />;
    case 'player':
      return <PlayerScreen setRole={setRole} />;
    case 'split':
      return <SplitScreen setRole={setRole} />;
    default:
      return <LandingScreen setRole={setRole} />;
  }
}
