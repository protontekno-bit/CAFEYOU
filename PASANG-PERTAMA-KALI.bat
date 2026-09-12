@echo off
title CAFEYOU - INSTALASI AWAL LAPTOP BARU
chcp 65001 >nul
cd /d "%~dp0"

cls
echo =====================================================================
echo           CAFEYOU KARAOKE ^& CAFE - INSTALASI AWAL LAPTOP BARU
echo =====================================================================
echo.
echo  Skrip ini akan memeriksa dan menyiapkan semua kebutuhan aplikasi
echo  agar CAFEYOU siap dijalankan secara lokal di laptop kafe ini.
echo.

:: 1. Periksa Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Node.js TIDAK DITEMUKAN di laptop ini!
    echo.
    echo     Langkah mudah instalasi Node.js:
    echo     1. Buka situs resmi: https://nodejs.org
    echo     2. Unduh versi "LTS (Recommended for Most Users)"
    echo     3. Install sampai selesai (klik Next sampai Finish)
    echo     4. Setelah selesai, jalankan kembali file ini.
    echo.
    pause
    exit /b
)

for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo [OK] Node.js terdeteksi (%NODE_VER%)

:: 2. Install dependensi NPM
echo.
echo [*] Mengunduh dan memasang paket aplikasi (npm install)...
echo     (Proses ini butuh koneksi internet dan memakan waktu sekitar 1-2 menit)
echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [X] Terjadi kendala saat npm install. Pastikan koneksi internet aktif.
    pause
    exit /b
)

echo.
echo =====================================================================
echo  [V] INSTALASI BERHASIL ^& SELESAI!
echo =====================================================================
echo.
echo  Aplikasi sudah siap digunakan setiap hari.
echo  Mulai sekarang, Anda cukup klik 2x file:
echo.
echo      👉 "JALANKAN-SERVER-KAFE.bat"
echo.
echo  untuk langsung menyalakan server dan membuka kasir.
echo.
pause
