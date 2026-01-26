# LogiTrack Mobile App - IP Update Script
# This script automatically updates the API URL with your current network IP

Write-Host "🔍 Detecting network IP address..." -ForegroundColor Cyan

# Get the active network IP (usually the first IPv4 that's not 127.0.0.1)
$ip = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "172.*" } | 
    Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "❌ Could not detect network IP address!" -ForegroundColor Red
    Write-Host "Please check your network connection." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Detected IP: $ip" -ForegroundColor Green

# Update constants.ts
$constantsFile = "utils\constants.ts"
$content = Get-Content $constantsFile -Raw

# Replace API_URL
$newApiUrl = "http://${ip}:4000/api"
$newWsUrl = "http://${ip}:4000"

$content = $content -replace "export const API_URL = 'http://[^']+';", "export const API_URL = '$newApiUrl';"
$content = $content -replace "export const WS_URL = 'http://[^']+';", "export const WS_URL = '$newWsUrl';"

Set-Content $constantsFile -Value $content -NoNewline

Write-Host "✅ Updated constants.ts" -ForegroundColor Green
Write-Host "   API_URL: $newApiUrl" -ForegroundColor White
Write-Host "   WS_URL: $newWsUrl" -ForegroundColor White
Write-Host ""
Write-Host "🚀 You can now start the app with: npx expo start" -ForegroundColor Cyan
