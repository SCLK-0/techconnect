# =============================================
# Setup Auth Hooks - Automated Script
# Run this to fix the "Hook requires authorization token" error
# =============================================

Write-Host "🚀 Setting up Auth Hooks..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Set the hook secret
Write-Host "📝 Step 1: Setting hook secret..." -ForegroundColor Yellow
$secret = "techconnect_hook_secret_$(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "Generated secret: $secret" -ForegroundColor Gray

try {
    supabase secrets set SEND_EMAIL_HOOK_SECRET=$secret
    Write-Host "✅ Hook secret set successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set hook secret: $_" -ForegroundColor Red
    Write-Host "Make sure you're in the project directory and logged in to Supabase CLI" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Verify secrets
Write-Host "📋 Step 2: Verifying secrets..." -ForegroundColor Yellow
try {
    $secrets = supabase secrets list
    Write-Host $secrets
    Write-Host "✅ Secrets verified!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not list secrets, but secret might still be set" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Instructions for dashboard configuration
Write-Host "🌐 Step 3: Configure Auth Hook in Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Now you need to configure the hook in your Supabase Dashboard:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open this URL in your browser:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Click 'Enable Hooks' or 'Create Hook'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Fill in these details:" -ForegroundColor Cyan
Write-Host "   - Hook Name: Send confirmation email" -ForegroundColor White
Write-Host "   - Hook Type: Send Email" -ForegroundColor White
Write-Host "   - Function URL: https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email" -ForegroundColor White
Write-Host "   - Events: Check 'Signup'" -ForegroundColor White
Write-Host "   - HTTP Method: POST" -ForegroundColor White
Write-Host ""
Write-Host "4. Click 'Create' or 'Save'" -ForegroundColor Cyan
Write-Host ""

# Step 4: Test
Write-Host "🧪 Step 4: Test Registration" -ForegroundColor Yellow
Write-Host ""
Write-Host "After configuring the hook in the dashboard:" -ForegroundColor White
Write-Host "1. Go to your app: http://localhost:8080" -ForegroundColor Cyan
Write-Host "2. Try registering a new user" -ForegroundColor Cyan
Write-Host "3. Check your email for confirmation" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Setup script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️ IMPORTANT: You still need to configure the hook in the dashboard (Step 3 above)" -ForegroundColor Yellow
Write-Host ""

# Optional: Open browser automatically
$response = Read-Host "Do you want to open the Auth Hooks dashboard now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks"
    Write-Host "✅ Opening dashboard in browser..." -ForegroundColor Green
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
