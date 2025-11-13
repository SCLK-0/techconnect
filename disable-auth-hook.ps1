# =============================================
# Disable Auth Hook - Quick Fix Script
# Run this to disable the problematic auth hook
# =============================================

Write-Host "🔧 Disabling Auth Hook..." -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANT: This script will guide you through disabling the auth hook" -ForegroundColor Yellow
Write-Host ""

Write-Host "The auth hook is causing the 'Hook requires authorization token' error." -ForegroundColor White
Write-Host "We'll disable it and use Supabase's built-in email confirmation instead." -ForegroundColor White
Write-Host ""

Write-Host "📋 Steps to follow:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Open your browser to the Auth Hooks page:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks" -ForegroundColor Blue
Write-Host ""

Write-Host "2. Find the 'Send confirmation email' hook (or any hook listed)" -ForegroundColor Yellow
Write-Host ""

Write-Host "3. Click the three dots (...) or settings icon next to it" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. Select 'Delete' or 'Disable'" -ForegroundColor Yellow
Write-Host ""

Write-Host "5. Confirm the deletion/disable" -ForegroundColor Yellow
Write-Host ""

Write-Host "6. Go to Email Provider settings:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers" -ForegroundColor Blue
Write-Host ""

Write-Host "7. Make sure 'Confirm email' is ENABLED under Email provider" -ForegroundColor Yellow
Write-Host ""

Write-Host "8. Save changes" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ After completing these steps:" -ForegroundColor Green
Write-Host "   - Registration will work without errors" -ForegroundColor White
Write-Host "   - Users will receive Supabase's built-in confirmation emails" -ForegroundColor White
Write-Host "   - No custom edge function needed" -ForegroundColor White
Write-Host ""

$response = Read-Host "Do you want to open the Auth Hooks dashboard now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks"
    Write-Host "✅ Opening dashboard in browser..." -ForegroundColor Green
    Write-Host ""
    Start-Sleep -Seconds 2
    
    $response2 = Read-Host "Do you also want to open the Email Provider settings? (y/n)"
    if ($response2 -eq "y" -or $response2 -eq "Y") {
        Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers"
        Write-Host "✅ Opening email provider settings..." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📝 After disabling the hook, test registration at:" -ForegroundColor Cyan
Write-Host "   http://localhost:8080/register/learner" -ForegroundColor Blue
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
