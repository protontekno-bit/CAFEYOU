# 📖 PANDUAN LENGKAP SETUP & OPERASIONAL SERVER LOKAL CAFEYOU

Dokumen ini berisi panduan praktis untuk memindahkan atau menjalankan aplikasi **CAFEYOU Karaoke & Order System** di laptop kasir/komputer kafe manapun tanpa kendala teknis.

---

## ⚡ 1. Cara Paling Cepat Menjalankan Setiap Hari (1-Klik)

Cukup **klik 2x** file berikut di folder aplikasi:

👉 **`JALANKAN-SERVER-KAFE.bat`**

File ini akan otomatis:
1. Menemukan alamat IP Wi-Fi laptop secara otomatis (contoh: `192.168.1.15`).
2. Menyalakan server aplikasi di jaringan lokal kafe.
3. Membuka layar **Dasbor Kasir** (`#operator`) langsung di browser Chrome/Edge laptop Anda.

> **PENTING:** Biarkan jendela hitam (Command Prompt) tetap terbuka selama jam operasional kafe.

---

## 💻 2. Cara Memindahkan Aplikasi ke Laptop / Komputer Baru

Jika kafe mengganti laptop kasir atau ingin menjalankan di komputer lain:

1. **Copy seluruh folder `CAFEYOU`** ini ke laptop baru (bisa via flashdisk atau Google Drive / Git).
2. Di laptop baru, pastikan sudah terpasang **Node.js** (bisa download gratis dari [nodejs.org](https://nodejs.org) versi LTS).
3. **Klik 2x file `PASANG-PERTAMA-KALI.bat`**
   - Skrip ini akan menginstall semua kebutuhan dalam 1 menit.
4. Setelah selesai, tinggal jalankan **`JALANKAN-SERVER-KAFE.bat`**.

---

## 📱 3. Cara Koneksi Layar & Perangkat di Kafe

Semua perangkat (Laptop Kasir, TV/Proyektor, Smartphone Pelanggan) **harus terhubung ke Wi-Fi Kafe yang sama**.

| Perangkat | Cara Akses / Buka | URL yang Digunakan |
| :--- | :--- | :--- |
| **💻 Laptop Kasir** | Buka browser di laptop ini | `http://localhost:3000/#operator` |
| **📺 TV / Proyektor** | Buka browser di laptop/Smart TV | `http://localhost:3000/#player` *(atau via kabel HDMI extended)* |
| **📱 Meja Pelanggan** | Pelanggan scan QR Barcode Meja | `http://[IP-LAPTOP]:3000/#guest?table=Meja%201` |

---

## 🖨️ 4. Mencetak QR Code Barcode Meja Pelanggan

1. Di Dasbor Operator, klik tombol **"🪑 Barcode Meja"** di menu atas.
2. Jika laptop menggunakan Wi-Fi lokal, sistem akan otomatis mencantumkan IP Wi-Fi laptop.
3. Anda bisa:
   - Melihat tampilan per meja dan klik **"Cetak Meja Ini"**.
   - Beralih ke **"Lembar Cetak Semua Meja"** untuk mencetak seluruh stiker meja (Meja 1 - 20) sekaligus dalam 1 lembar kertas A4 / stiker.
4. Tempelkan stiker barcode di masing-masing meja kafe.

---

## ❓ 5. Tanya Jawab & Kendala Umum (FAQ)

### Q1: Kenapa HP pelanggan tidak bisa membuka barcode saat di-scan?
- **Penyebab 1:** HP pelanggan belum tersambung ke Wi-Fi Kafe yang sama dengan laptop kasir.
- **Penyebab 2:** IP laptop berubah karena router Wi-Fi me-restart. Cukup buka Dasbor Operator -> Barcode Meja -> periksa apakah IP sesuai dengan yang tertera di jendela hitam `JALANKAN-SERVER-KAFE.bat`.

### Q2: Apakah data pesanan dan voucher hilang jika laptop dimatikan?
- **Tidak.** Semua data antrean lagu, voucher, dan pesanan tersimpan secara real-time di Cloud Firebase. Saat server dinyalakan kembali besok hari, semua data langsung tersinkronisasi.

### Q3: Bagaimana jika kafe tidak ada internet?
- **Server lokal tetap berjalan** untuk memutar lagu yang di-input manual di dasbor kasir.
- Untuk pencarian lagu YouTube & sinkronisasi Cloud Firebase secara real-time, disarankan router kafe terhubung ke internet.
