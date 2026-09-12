import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Mendengarkan di semua antarmuka jaringan Wi-Fi lokal
    port: 3000,
    open: false,
  },
});

