# Elite Placement Hub - Start script (Windows)
Write-Host "=== Elite Placement Hub ===" -ForegroundColor Cyan

# Free port 5000 if stuck
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($port5000) {
  Write-Host "Port 5000 in use - stopping old process..." -ForegroundColor Yellow
  $port5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "1) Start BACKEND (new terminal):" -ForegroundColor Green
Write-Host "   cd backend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "2) Start FRONTEND (new terminal):" -ForegroundColor Green
Write-Host "   cd frontend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "3) Open: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "MongoDB must be running on mongodb://127.0.0.1:27017" -ForegroundColor Yellow
