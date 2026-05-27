@echo off
REM ===========================================
REM Laravel Backend Setup Script for XAMPP
REM ===========================================

echo.
echo ====================================
echo Laravel Backend Setup
echo ====================================
echo.

REM Step 1: Generate Application Key (if needed)
echo [1/6] Checking application key...
C:\xampp\php\php.exe artisan key:generate --show
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate key
    pause
    exit /b 1
)

REM Step 2: Clear config cache
echo.
echo [2/6] Clearing configuration cache...
C:\xampp\php\php.exe artisan config:clear

REM Step 3: Clear all caches
echo.
echo [3/6] Clearing application caches...
C:\xampp\php\php.exe artisan cache:clear
C:\xampp\php\php.exe artisan route:clear
C:\xampp\php\php.exe artisan view:clear

REM Step 4: Run migrations
echo.
echo [4/6] Running database migrations...
echo NOTE: Make sure MySQL is running in XAMPP Control Panel
echo NOTE: Create database 'hi_card' in phpMyAdmin before continuing
pause
C:\xampp\php\php.exe artisan migrate
if %errorlevel% neq 0 (
    echo ERROR: Migration failed. Please check database configuration.
    pause
    exit /b 1
)

REM Step 5: Run seeders (optional)
echo.
echo [5/6] Running database seeders...
C:\xampp\php\php.exe artisan db:seed
if %errorlevel% neq 0 (
    echo WARNING: Seeding failed or no seeders available
)

REM Step 6: Create storage link
echo.
echo [6/6] Creating storage link...
C:\xampp\php\php.exe artisan storage:link

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo You can now start the server with:
echo   start-backend.bat
echo.
pause
