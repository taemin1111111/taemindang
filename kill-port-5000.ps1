# 5000번 포트 사용 중인 프로세스 종료 (EADDRINUSE 해결)
$conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($conn) {
  $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Write-Host "5000번 포트를 사용하던 프로세스를 종료했습니다. 이제 백엔드를 다시 실행하세요."
} else {
  Write-Host "5000번 포트를 사용 중인 프로세스가 없습니다."
}
pause
