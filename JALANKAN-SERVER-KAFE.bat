@echo off
title CAFEYOU - SERVER KAFE & KARAOKE LOKAL
chcp 65001 >nul
cd /d "%~dp0"

cls
echo =====================================================================
echo           CAFEYOU KARAOKE ^& CAFE - PELUNCUR SERVER LOKAL
echo =====================================================================
echo.

:: 1. Cek apakah Node.js terpasang
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] PERINGATAN: Node.js belum terinstall di laptop / komputer ini!
    echo     Silakan unduh dan install Node.js (LTS) dari https://nodejs.org
    echo     Atau jalankan file 'PASANG-PERTAMA-KALI.bat'
    echo.
    pause
    exit /b
)

:: 2. Cek apakah folder node_modules sudah ada
if not exist "node_modules\" (
    echo [!] Folder dependensi belum terpasang.
    echo     Menyiapkan dan memasang dependensi secara otomatis, mohon tunggu...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [X] Gagal memasang dependensi. Pastikan laptop terhubung ke internet saat setup awal.
        pause
        exit /b
    )
)

:: 3. Deteksi IP Address Wi-Fi Lokal Laptop
set "LOCAL_IP="
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi*','Ethernet*','Local Area Connection*' -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress"') do (
    set "LOCAL_IP=%%a"
)

if "%LOCAL_IP%"=="" (
    for /f "tokens=*" %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -First 1).IPAddress"') do (
        set "LOCAL_IP=%%a"
    )
)

if "%LOCAL_IP%"=="" (
    set "LOCAL_IP=192.168.1.xxx"
)

cls
echo =====================================================================
echo           CAFEYOU KARAOKE ^& CAFE - SERVER SIAP DIGUNAKAN
echo =====================================================================
echo.
echo  [*] STATUS SERVER          : AKTIF DI JARINGAN LOKAL
echo  [*] IP WI-FI LAPTOP INI    : http://%LOCAL_IP%:3000
echo.
echo  -------------------------------------------------------------------
echo   PANDUAN AKSES CEPAT:
echo  -------------------------------------------------------------------
echo   1. Layar Kasir / Operator  : http://localhost:3000/#operator
echo   2. Layar TV / Proyektor    : http://localhost:3000/#player
echo   3. Portal Tamu / Meja (HP) : http://%LOCAL_IP%:3000/#guest
echo  -------------------------------------------------------------------
echo.
echo  [i] Membuka Layar Operator di Browser Anda...
echo  [i] JANGAN TUTUP JENDELA HITAM INI SELAMA KAFE BUKA!
echo.
echo =====================================================================

:: Buka browser ke dasbor operator setelah 2 detik
start "" "http://localhost:3000/#operator"

:: Jalankan Vite Server dengan host 0.0.0.0
npm run dev -- --host 0.0.0.0 --port 3000
