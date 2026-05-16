@echo off
echo ========================================
echo   Password Strength Analyzer Pro
echo ========================================
echo.

echo [1/3] Compiling Java backend...
javac -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java not found! Please install JDK.
    pause
    exit /b 1
)

javac PasswordServer.java PasswordAnalyzer.java FileStorage.java

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Compilation failed!
    echo Make sure all .java files are in the same folder.
    pause
    exit /b 1
)

echo [OK] Compilation successful!
echo.

echo [2/3] Starting server...
echo ========================================
echo Server running at: http://localhost:8080
echo Open index.html in your browser
echo Press Ctrl+C to stop the server
echo ========================================
echo.

echo [3/3] Server is ready!
echo.

java PasswordServer

pause