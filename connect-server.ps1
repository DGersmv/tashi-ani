# PowerShell script for connecting to server
# Usage: .\connect-server.ps1

$server = "root@89.104.67.209"
$password = "RzOFp5upP4a6MyDi"

Write-Host "Connecting to server $server..." -ForegroundColor Cyan
Write-Host ""

# Remove old host key first
Write-Host "Removing old host key from known_hosts..." -ForegroundColor Yellow
ssh-keygen -R 89.104.67.209 -f "$env:USERPROFILE\.ssh\known_hosts" 2>$null
Write-Host ""

# Try to connect with password authentication
Write-Host "Attempting connection..." -ForegroundColor Yellow
Write-Host "If prompted for password, enter: $password" -ForegroundColor Yellow
Write-Host ""

# Connection with options for password authentication and skip host key check
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=accept-new $server

# Show message after connection
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Connection completed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Connection error. Try manually:" -ForegroundColor Red
    Write-Host "ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=accept-new $server" -ForegroundColor Yellow
    Write-Host "Password: $password" -ForegroundColor Yellow
}

