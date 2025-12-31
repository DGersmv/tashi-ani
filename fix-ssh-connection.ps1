# PowerShell script to fix SSH connection issues
# This script removes old host keys and connects to the server

$server = "root@89.104.67.209"
$password = "RzOFp5upP4a6MyDi"
$knownHostsPath = "$env:USERPROFILE\.ssh\known_hosts"

Write-Host "=== Fixing SSH Connection ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove old host key
Write-Host "Step 1: Removing old host key..." -ForegroundColor Yellow
try {
    ssh-keygen -R 89.104.67.209 -f $knownHostsPath 2>&1 | Out-Null
    Write-Host "Old host key removed successfully" -ForegroundColor Green
} catch {
    Write-Host "Note: Could not remove old key (may not exist)" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Connect to server
Write-Host "Step 2: Connecting to server..." -ForegroundColor Yellow
Write-Host "Server: $server" -ForegroundColor Cyan
Write-Host "Password: $password" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connecting now..." -ForegroundColor Yellow
Write-Host ""

# Connect with options to accept new host key and use password
ssh -o PreferredAuthentications=password `
    -o PubkeyAuthentication=no `
    -o StrictHostKeyChecking=accept-new `
    -o UserKnownHostsFile=$knownHostsPath `
    $server

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "=== Connection Successful ===" -ForegroundColor Green
} else {
    Write-Host "=== Connection Failed ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try manually:" -ForegroundColor Yellow
    Write-Host "ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=accept-new root@89.104.67.209" -ForegroundColor White
}

