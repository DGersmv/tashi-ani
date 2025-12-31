# PowerShell script to help access server via reg.ru
# This script provides instructions and checks

Write-Host "=== Reg.ru Server Access Helper ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Server IP: 89.104.67.209" -ForegroundColor Yellow
Write-Host "Found SSH Fingerprint: 2a:82:f3:dd:6e:e2:50:e2:45:58:75:7d:14:60:26:e1" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== Access Methods ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Method 1: Web Console (RECOMMENDED)" -ForegroundColor Green
Write-Host "1. Go to https://www.reg.ru/" -ForegroundColor White
Write-Host "2. Login to your account" -ForegroundColor White
Write-Host "3. Find your VPS server (89.104.67.209)" -ForegroundColor White
Write-Host "4. Click 'Console' or 'Web SSH' button" -ForegroundColor White
Write-Host "5. You will get browser-based terminal access" -ForegroundColor White
Write-Host ""

Write-Host "Method 2: Reset Password" -ForegroundColor Green
Write-Host "1. In reg.ru panel, find your VPS" -ForegroundColor White
Write-Host "2. Go to 'Management' -> 'Passwords'" -ForegroundColor White
Write-Host "3. Click 'Reset root password'" -ForegroundColor White
Write-Host "4. Set new password" -ForegroundColor White
Write-Host "5. Connect: ssh root@89.104.67.209" -ForegroundColor White
Write-Host ""

Write-Host "Method 3: Download SSH Key from reg.ru" -ForegroundColor Green
Write-Host "1. In reg.ru panel, find 'SSH Keys' section" -ForegroundColor White
Write-Host "2. Download private key file" -ForegroundColor White
Write-Host "3. Save to: $env:USERPROFILE\.ssh\regru_key" -ForegroundColor White
Write-Host "4. Connect: ssh -i `"$env:USERPROFILE\.ssh\regru_key`" root@89.104.67.209" -ForegroundColor White
Write-Host ""

Write-Host "=== After Getting Access ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands on the server:" -ForegroundColor Yellow
Write-Host "cd /var/www/tashi-ani" -ForegroundColor White
Write-Host "pm2 status" -ForegroundColor White
Write-Host "pm2 restart tashi-ani" -ForegroundColor White
Write-Host "pm2 logs tashi-ani --lines 50" -ForegroundColor White
Write-Host ""

Write-Host "=== Current SSH Key Status ===" -ForegroundColor Cyan

# Check if we have SSH keys
$sshDir = "$env:USERPROFILE\.ssh"
if (Test-Path $sshDir) {
    Write-Host "SSH directory exists: $sshDir" -ForegroundColor Green
    
    $pubKey = "$sshDir\id_rsa.pub"
    if (Test-Path $pubKey) {
        Write-Host "Public key found: $pubKey" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your public key (copy this to add to server):" -ForegroundColor Yellow
        Get-Content $pubKey
    } else {
        Write-Host "No public key found. Create one with: ssh-keygen -t rsa" -ForegroundColor Yellow
    }
} else {
    Write-Host "SSH directory does not exist" -ForegroundColor Yellow
    Write-Host "Create one with: ssh-keygen -t rsa" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Try web console access first (easiest)" -ForegroundColor White
Write-Host "2. If that doesn't work, reset password in reg.ru panel" -ForegroundColor White
Write-Host "3. Or download SSH key from reg.ru panel" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: REG_RU_ACCESS.md" -ForegroundColor Cyan

