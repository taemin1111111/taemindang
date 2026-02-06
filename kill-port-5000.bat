@echo off
echo 5000번 포트 사용 중인 프로세스 확인 중...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
  taskkill /F /PID %%a 2>nul
  echo PID %%a 종료함.
)
echo 완료. 백엔드를 다시 실행하세요.
pause
