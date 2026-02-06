@echo off
cd /d "%~dp0"
start "Backend" powershell -NoExit -Command "Set-Location '%~dp0backend'; npm run dev"
timeout /t 2 /nobreak >nul
start "Frontend" powershell -NoExit -Command "Set-Location '%~dp0frontend'; npm run dev"
echo Backend, Frontend 창이 열렸습니다. 작업 표시줄에서 PowerShell 창 2개를 확인하세요.
pause
