# Apply Session Storage and Realtime Fixes
# This script executes the SQL fix using Supabase CLI

Write-Host "Applying session storage and realtime fixes..." -ForegroundColor Cyan

# Check if SUPABASE_DB_URL is set
if (-not $env:SUPABASE_DB_URL) {
    Write-Host "ERROR: SUPABASE_DB_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set it first with:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_DB_URL = "your-database-url"' -ForegroundColor Yellow
    exit 1
}

# Read the SQL file
$sqlContent = Get-Content -Path "fix-session-storage-and-realtime.sql" -Raw

# Execute using supabase CLI
Write-Host "Executing SQL fixes..." -ForegroundColor Yellow
$sqlContent | supabase db execute --db-url $env:SUPABASE_DB_URL

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Fixes applied successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Test file upload in a session" -ForegroundColor White
    Write-Host "2. Test whiteboard drawing" -ForegroundColor White
    Write-Host "3. Check browser console for errors" -ForegroundColor White
} else {
    Write-Host "`n❌ Failed to apply fixes" -ForegroundColor Red
    Write-Host "Please run the SQL manually in Supabase Dashboard" -ForegroundColor Yellow
}
