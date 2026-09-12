# 📋 STANDAR OPERASIONAL PROSEDUR (SOP) & PANDUAN PENGGUNAAN
## CAFEYOU KARAOKE: TABLET OPERATOR + SMART PROYEKTOR VIDAA (AVIEWLUX R6 PRO)

Dokumen ini adalah panduan lengkap bagi pemilik kafe, manajer, dan staf kasir/operator untuk menjalankan sistem karaoke nirkabel (*wireless*) menggunakan **Tablet** dan **Smart Proyektor AVIEWLUX R6 Pro (VIDAA System)** secara cloud real-time.

---

## 🏗️ 1. Skema Perangkat & Sambungan Fisik

```
[ Smartphone Pelanggan ] (Scan QR di Meja)
          │
          ▼ (Internet Cloud)
[ Tablet Kasir/Operator ] ──(Firebase Realtime)──► [ Proyektor AVIEWLUX R6 Pro ]
(Kontrol Antrean & Lagu)                                   │ (Kabel Aux 3.5mm)
                                                           ▼
                                                [ Sound System / Mixer Kafe ]
```

### Kebutuhan Perangkat:
1. **Layar Tayang**: Smart Proyektor **AVIEWLUX R6 Pro** (Sistem VIDAA) terhubung ke Wi-Fi Kafe.
2. **Audio**: Kabel jack audio **Aux 3.5mm** dari port *Audio Out* proyektor ke Mixer / Amplifier Sound System.
3. **Operator/Kasir**: **Tablet** (iPad / Android Tablet / HP Kasir) terhubung ke internet.
4. **Pelanggan**: Smartphone masing-masing tamu di setiap meja.

---

## 🌅 2. Prosedur Pembukaan Kafe (SOP Pagi Hari / Buka Shift)

### Langkah A: Nyalakan Proyektor & Layar Tayang
1. Nyalakan Proyektor **AVIEWLUX R6 Pro** dan Sound System Kafe.
2. Di layar utama (Home) VIDAA, buka aplikasi **Browser / Web Browser**.
3. Masuk ke alamat URL Player Anda:
   ```
   https://[domain-kafe-anda].vercel.app/#player
   ```
   *(Tips: Tekan tombol Menu di remote proyektor -> pilih **Tambah ke Favorit/Bookmark** agar esok hari tinggal klik 1x).*
4. Pada layar proyektor akan muncul tombol: **"🎤 Aktifkan Layar & Suara Karaoke"**.
5. **Tekan tombol [OK] pada Remote Proyektor** (atau klik mouse/layar 1x).
   - ✅ Layar proyektor otomatis masuk ke **Full Screen** dan suara YouTube aktif sepanjang hari.

### Langkah B: Buka Dasbor Tablet Kasir / Operator
1. Di Tablet Operator, buka Google Chrome atau Safari.
2. Buka alamat:
   ```
   https://[domain-kafe-anda].vercel.app/#operator
   ```
3. Masukkan PIN / Sandi Operator Anda.
4. *(Opsional - Sangat Direkomendasikan)*: Klik menu browser di Tablet -> pilih **"Tambahkan ke Layar Utama (Add to Home Screen)"**.
   - Ikon aplikasi **CAFEYOU** akan muncul di tablet Anda dan dapat dibuka fullscreen layaknya aplikasi kasir bawaan.

---

## ☕ 3. Prosedur Pelayanan Tamu & Meja (SOP Selama Kafe Beroperasi)

### Cara Tamu Memesan Lagu dari Meja:
1. Tamu mengarahkan kamera HP ke stiker **QR Barcode Meja** yang tertempel di meja mereka.
2. Portal Tamu CAFEYOU langsung terbuka di HP mereka.
3. Tamu memilih metode:
   - **Tab 1: Cari Lagu Populer** (Koleksi lagu kafe siap nyanyi, 1-klik tambah).
   - **Tab 2: Cari Judul di YouTube** (Ketik artis/judul lagu apa saja tanpa perlu copy-paste link teknis).
4. Tamu menekan tombol **"🎤 Masukkan ke Antrean Lagu"**.

### Cara Operator Mengatur Antrean di Tablet:
1. Setiap ada lagu baru dari tamu, tablet operator akan berbunyi **denting notifikasi**.
2. Operator cukup menekan:
   - **Tombol Hijau (Setujui)**: Lagu langsung masuk ke giliran putar di proyektor.
   - **Tombol Merah (Tolak)**: Jika lagu mengandung unsur tidak pantas / tidak sesuai tema kafe.
3. Sistem **Fair Rotation** akan otomatis memutar lagu secara adil bergantian antar meja tanpa ada meja yang memonopoli antrean.

### Interaksi Efek Suara (Soundboard):
- Operator dapat menekan tombol **Tepuk Tangan 👏**, **Sorakan 🎉**, atau **Airhorn 📢** di tablet.
- Suara efek akan **otomatis berbunyi menggelegar dari Sound System proyektor**, menyemarakkan suasana kafe!

---

## 🎫 4. Manajemen Kuota Lagu & Kode Voucher (Opsional)

Jika kafe Anda menerapkan sistem voucher (contoh: *1x order minuman berhak request 3 lagu*):

1. Di Tablet Operator, klik tombol **"🎫 Kelola Voucher"**.
2. Klik **"+ Buat Voucher Baru"** (pilih meja dan jumlah kuota lagu, misal: `MEJA5` = 3 lagu).
3. Berikan struk/kode voucher ke tamu.
4. Tamu memasukkan kode tersebut di HP mereka sebelum request lagu.
5. Setelah kuota habis, tamu tidak bisa spam lagu lagi kecuali memesan menu tambahan.

---

## 🌙 5. Prosedur Penutupan Kafe (SOP Malam Hari / Tutup Shift)

1. Di Tablet Operator, klik tombol **"Riwayat & Log"** untuk melihat total lagu yang dinyanyikan hari ini.
2. Matikan mixer / sound system kafe.
3. Matikan proyektor AVIEWLUX R6 Pro dengan remote (tekan tombol Power).
4. Kunci tablet kasir.
   - *Catatan:* Semua riwayat dan pengaturan tersimpan aman di Cloud Firebase untuk operasional esok hari.

---

## 🔧 6. Panduan Mengatasi Kendala (Troubleshooting FAQ)

### Q1: Lagu di proyektor berputar tapi tidak ada suaranya?
* **Penyebab:** Belum menekan tombol aktivasi pertama kali di proyektor, atau kabel jack belum tercolok rapat.
* **Solusi:** Arahkan remote proyektor dan tekan **OK** pada layar, serta periksa volume di Mixer Sound System dan volume di tablet operator (pastikan tidak dalam posisi *Mute*).

### Q2: Layar proyektor mati sendiri setelah kafe sepi 20 menit?
* **Penyebab:** Fitur *Auto Sleep / Eco Timer* bawaan VIDAA OS aktif.
* **Solusi:** Di remote proyektor, tekan tombol **Settings (Gerigi)** -> pilih **System / Power** -> ubah **Auto Sleep / Sleep Timer** ke posisi **OFF (Tidak Pernah)**.

### Q3: Tablet operator terkunci / layar mati saat ditinggal membuat kopi?
* **Solusi:** Aplikasi CAFEYOU sudah dilengkapi fitur **Auto WakeLock** otomatis. Pastikan browser tablet tidak dalam mode *Hemat Baterai Ekstrem (Ultra Battery Saver)*. Begitu layar tablet dibuka kembali, antrean akan langsung tersinkronisasi dalam 1 detik.

### Q4: Tamu tidak bisa scan barcode meja?
* **Solusi:** Pastikan stiker barcode meja dicetak dari menu **"🪑 Barcode Meja"** di dasbor operator. Barcode sudah disesuaikan agar bisa dibuka oleh pengguna internet Wi-Fi maupun paket data seluler (4G/5G).
