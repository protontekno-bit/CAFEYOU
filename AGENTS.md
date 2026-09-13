# 🤖 PANDUAN PENGEMBANGAN STANDAR AI (AI DEVELOPMENT GUIDELINES)
> **CAFEYOU — Dual-Screen Karaoke Lounge & F&B Point of Sale (POS) System**
> File ini adalah acuan standar wajib bagi setiap AI Agent dan Developer dalam membaca, merancang, memodifikasi, dan memelihara basis kode aplikasi CAFEYOU.

---

## 🎯 Filosofi & Prinsip Utama
Basis kode CAFEYOU dirancang dengan prinsip:
1. **AI-Friendly & Token Efficient**: Setiap file harus ringkas (<350-400 baris) agar AI dapat membaca, memahami, dan memodifikasinya dengan cepat tanpa menghabiskan konteks token secara berlebihan.
2. **Single Responsibility Principle (SRP)**: Setiap file dan sub-komponen hanya bertanggung jawab atas satu fitur atau domain tertentu.
3. **Zero Visual Regression**: Setiap perubahan kode wajib mempertahankan estetika antarmuka (*dark mode*, gradien warna, animasi mikro, interaksi touch, dan tata letak responsif).
4. **100% Backward Compatibility**: Perubahan pada hooks atau utilitas tidak boleh merusak komponen konsumen yang sudah berjalan.

---

## 📂 Struktur Direktori Standar

```
src/
├── components/
│   ├── guest/               # Portal Smartphone Tamu (Karaoke, E-Menu, Orders, Nota)
│   │   ├── GuestKaraokeTab.tsx
│   │   ├── GuestMenuTab.tsx
│   │   ├── GuestOrdersTab.tsx
│   │   ├── GuestCheckoutModal.tsx
│   │   ├── GuestReceiptModal.tsx
│   │   ├── GuestGroupedReceiptModal.tsx
│   │   └── GuestItemOptionsModal.tsx
│   ├── pos/                 # Dasbor Workstation Kasir & Dapur (POS & KDS)
│   │   ├── PosAuthGate.tsx
│   │   ├── PosHeader.tsx
│   │   ├── PosBillingTab.tsx
│   │   ├── PosKitchenTab.tsx
│   │   ├── PosReportsTab.tsx
│   │   ├── PosDirectOrderModal.tsx
│   │   ├── PosPaymentModal.tsx
│   │   ├── PosExpenseModal.tsx
│   │   ├── PosSettingsModal.tsx
│   │   ├── PosMoveTableModal.tsx
│   │   ├── PosVoidItemModal.tsx
│   │   └── PosQrisZoomModal.tsx
│   ├── operator/            # Layar Kontrol Operator Karaoke
│   │   ├── settings/        # 9 Sub-komponen tab Pusat Pengaturan
│   │   │   ├── SettingsCafeTab.tsx
│   │   │   ├── SettingsDisplayTab.tsx
│   │   │   ├── SettingsTablesTab.tsx
│   │   │   ├── SettingsVouchersTab.tsx
│   │   │   ├── SettingsMenuTab.tsx
│   │   │   ├── SettingsLibraryTab.tsx
│   │   │   ├── SettingsCloudTab.tsx
│   │   │   ├── SettingsSecurityTab.tsx
│   │   │   └── SettingsHelpTab.tsx
│   │   ├── SettingsCenterModal.tsx # Clean Modal Orchestrator
│   │   ├── OperatorScreen.tsx
│   │   ├── PlaybackControls.tsx
│   │   ├── NowPlayingCard.tsx
│   │   └── QueueList.tsx
│   ├── player/              # Layar Monitor TV / Proyektor (Dual Screen)
│   └── icons/               # Ikon SVG terisolasi
├── hooks/
│   ├── domains/             # Sub-hooks spesifik per domain bisnis
│   │   ├── useKaraokePlayer.ts  # Antrean lagu, playback TV, efek suara, rotasi adil
│   │   ├── useOrderBilling.ts   # Pesanan meja F&B, katalog menu, KDS dapur
│   │   ├── useCashExpenses.ts   # Beban operasional kas kecil (petty cash)
│   │   └── useVoucherAuth.ts    # Proteksi voucher, PIN harian, meja dinamis, cafe settings
│   ├── useKaraoke.ts        # Master Facade Hook (100% backward-compatible)
│   ├── useSyncState.ts      # Sinkronisasi multi-tab browser & Firebase
│   ├── useYouTubePlayer.ts  # YouTube IFrame API Player engine
│   └── useWakeLock.ts       # Pencegah layar tidur saat karaoke
├── utils/
│   ├── billing.ts           # Standar perhitungan finansial (formatRupiah, PB1, service charge)
│   ├── credentials.ts       # Hash password & otentikasi operator
│   ├── queue.ts             # Algoritma rotasi antrean adil (Fair Rotation)
│   ├── soundfx.ts           # Web Audio API sound effects
│   └── youtube.ts           # Integrasi YouTube oEmbed & Google Cloud Data API v3
├── types/
│   └── index.ts             # Definisi TypeScript interface & types
└── constants/               # Nilai default, menu awal, dan konfigurasi kafe
```

---

## 📐 6 Aturan Emas untuk AI & Developer (Golden Rules)

### 1. Batas Ukuran File & Pola Orchestrator
- **DILARANG** membuat file komponen yang membengkak melebihi **400 baris**.
- Layar utama (`GuestScreen`, `PosScreen`, `OperatorScreen`, `SettingsCenterModal`) harus bertindak sebagai **Orchestrator Murni**: hanya mengatur tata letak global, delegasi tab, dan pemicu modal. Seluruh konten tab dan modal wajib dipecah menjadi file subkomponen terpisah.

### 2. Pengelolaan State & Domain Hooks
- Jangan menambahkan logika bisnis besar langsung ke dalam `useKaraoke.ts`.
- Tambahkan logika baru ke dalam domain hook yang sesuai di `src/hooks/domains/`:
  - Fitur pemutar lagu / TV ➔ [`useKaraokePlayer.ts`](file:///c:/Users/cekce/Downloads/CAFEYOU/src/hooks/domains/useKaraokePlayer.ts)
  - Fitur F&B, pesanan, kasir, dapur ➔ [`useOrderBilling.ts`](file:///c:/Users/cekce/Downloads/CAFEYOU/src/hooks/domains/useOrderBilling.ts)
  - Fitur kas kecil / pengeluaran ➔ [`useCashExpenses.ts`](file:///c:/Users/cekce/Downloads/CAFEYOU/src/hooks/domains/useCashExpenses.ts)
  - Fitur voucher, meja, otentikasi ➔ [`useVoucherAuth.ts`](file:///c:/Users/cekce/Downloads/CAFEYOU/src/hooks/domains/useVoucherAuth.ts)
- Ekspor kembali fungsi tersebut melalui facade [`useKaraoke.ts`](file:///c:/Users/cekce/Downloads/CAFEYOU/src/hooks/useKaraoke.ts) agar komponen lama tidak mengalami *breaking changes*.

### 3. Standar Sinkronisasi Realtime Cloud (Firebase RTDB)
- **ATURAN KRUSIAL**: Jangan pernah menimpa (*overwrite*) seluruh pohon data root `cafeyou/karaoke_state_v2` untuk transaksi bisnis instan.
- Koleksi data pesanan (`tableOrders`) dan kas kecil (`expenses`) **WAJIB** menggunakan pembaruan atomik langsung ke node leaf:
  ```typescript
  const orderRef = ref(db, `cafeyou/${STORAGE_KEY}/tableOrders/${orderId}`);
  await set(orderRef, orderData);
  ```
- Ini menjamin pesanan dari smartphone tamu tidak akan tertimpa atau hilang saat operator sedang memutar lagu atau mengubah volume player.

### 4. Standar Perhitungan Finansial Terpusat
- **DILARANG** menulis ulang rumus persentase pajak PB1, service charge, atau format Rupiah secara manual di dalam komponen.
- **WAJIB** mengimpor utilitas resmi dari [`src/utils/billing.ts`](file:///c:/Users/cekce/Downloads/CAFEYOU/src/utils/billing.ts):
  ```typescript
  import { formatRupiah, calculateTaxAndService } from '../../utils/billing';
  
  const { subtotal, taxAmount, serviceAmount, finalTotal } = calculateTaxAndService(rawAmount, cafeSettings);
  ```

### 5. Estetika UI & Standar Desain
- Pertahankan tema *modern glassmorphism dark mode*:
  - Latar: `bg-slate-900`, `bg-slate-950/80` dengan border `border-slate-800` atau `border-slate-700/80`.
  - Aksen status: Biru (`blue-500/600`), Emerald (`emerald-500/600`), Amber (`amber-500/600`), Rose (`rose-500/600`).
  - Radius sudut: `rounded-xl`, `rounded-2xl`, `rounded-3xl`.
  - Selalu sertakan efek `active:scale-95` atau `active:scale-98` pada tombol interaktif untuk *tactile feedback* di layar sentuh HP.

### 6. Kebijakan Verifikasi Wajib (Zero TypeScript Errors)
- Setiap kali selesai melakukan refactor, penambahan fitur, atau perbaikan bug, AI **WAJIB** menjalankan verifikasi:
  ```powershell
  npm run build
  ```
- Perubahan dinyatakan selesai **hanya jika** build berhasil dengan `exit code 0` dan tidak ada satupun *TypeScript compiler error*.
