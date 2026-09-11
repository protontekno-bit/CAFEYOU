# Sistem Karaoke Kafe Dual Screen (CAFEYOU)

Aplikasi sistem karaoke modern dengan arsitektur dual-screen (Dasbor Operator di laptop/kasir dan Layar Proyektor untuk display pelanggan), disinkronkan secara real-time via `LocalStorage` dan `BroadcastChannel` API.

---

## 📁 Struktur Arsitektur Modular

```text
CAFEYOU/
├── index.html                   # HTML entry point dengan Tailwind CSS
├── package.json                 # Konfigurasi dependensi React + Vite
├── tsconfig.json                # TypeScript strict config
├── vite.config.ts               # Bundler configuration
├── karaoke_dual_screen_system.tsx # Facade entry point (backward-compatible)
│
└── src/
    ├── types/
    │   └── index.ts             # Definisi model & interface (Song, KaraokeState, dll)
    ├── constants/
    │   └── karaoke.ts           # Konstanta storage key, broadcast channel, default state
    ├── utils/
    │   └── youtube.ts           # Ekstraksi YouTube ID, thumbnail generator, IFrame API loader
    ├── hooks/
    │   ├── useSyncState.ts      # Sinkronisasi multi-tab browser secara real-time
    │   ├── useKaraoke.ts        # Business logic antrean lagu, play/pause, volume, skip
    │   └── useYouTubePlayer.ts  # Enkapsulasi player YouTube, autoplay, & auto-skip error
    ├── components/
    │   ├── icons/
    │   │   └── Icons.tsx        # Kumpulan Icon SVG modular
    │   ├── common/
    │   │   └── Header.tsx       # Header universal dengan indikator koneksi
    │   ├── operator/
    │   │   ├── PlaybackControls.tsx # Kontrol play/pause, skip, slider volume
    │   │   ├── AddSongForm.tsx      # Form input link YouTube & nama pemesan
    │   │   ├── NowPlayingCard.tsx   # Kartu lagu yang sedang aktif diputar
    │   │   ├── QueueList.tsx        # Daftar antrean lagu dengan tombol hapus
    │   │   └── OperatorScreen.tsx   # Halaman utama Dasbor Operator
    │   ├── player/
    │   │   ├── PlayerPlaceholder.tsx# Tampilan standby saat antrean kosong
    │   │   └── PlayerScreen.tsx     # Halaman Layar Proyektor (clean player)
    │   ├── landing/
    │   │   ├── RoleCard.tsx         # Kartu pemilihan peran
    │   │   └── LandingScreen.tsx    # Halaman utama pemilihan peran
    │   └── split/
    │       └── SplitScreen.tsx      # Simulator dual-screen berdampingan
    ├── App.tsx                  # Hash router (#operator, #player, #split)
    └── main.tsx                 # DOM mounting entry point
```

---

## 🚀 Cara Menjalankan

1. **Install Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Mode Development**:
   ```bash
   npm run dev
   ```

3. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

---

## 🎯 Cara Penggunaan Dual Screen

1. **Layar Kasir / Operator**:
   - Buka aplikasi dan pilih **Dasbor Operator** (atau akses URL dengan `#operator`).
   - Masukkan link YouTube (misal: `https://www.youtube.com/watch?v=...`) dan nama pemesan (opsional).
   - Lagu otomatis masuk antrean.

2. **Layar Proyektor / TV**:
   - Buka browser baru / tab baru, arahkan ke URL dengan hash `#player`.
   - Tarik window browser tersebut ke layar eksternal / proyektor dan tekan `F11` (Full Screen).
   - Klik 1 kali pada layar proyektor untuk mengizinkan izin autoplay browser.

3. **Simulator Split-Screen**:
   - Pilih **Uji Coba Simulator Split-Screen** (`#split`) untuk mengetes interaksi operator dan player dalam satu layar tanpa perlu 2 tab/layar terpisah.

---

## 🛠️ Panduan Maintenance & Pengembangan Lanjutan

- **Menambah Fitur Database Cloud (misal: Supabase / Firebase)**:
  Cukup ganti atau tambahkan adapter di dalam `src/hooks/useSyncState.ts` atau buat hook baru seperti `useCloudSyncState.ts`. Komponen UI tidak perlu diubah karena sudah terisolasi!
- **Menambah Fitur Pencarian Lagu YouTube API**:
  Tambahkan fungsi API search di `src/utils/youtube.ts` dan buat komponen baru `src/components/operator/SongSearchModal.tsx`.
- **Menambah Pengaturan Suara / Pitch / Key Transpose**:
  Perluas `KaraokeState` di `src/types/index.ts` dan tambahkan kontrolnya di `src/components/operator/PlaybackControls.tsx`.
