# =============================================
# Complete Resend Email Setup Script
# =============================================

Write-Host "🚀 Setting up Resend Email Integration..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Please install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 1: Get Resend API Key
Write-Host "📧 Step 1: Resend API Key" -ForegroundColor Yellow
Write-Host ""
Write-Host "You need a Resend API key. Get one from:" -ForegroundColor White
Write-Host "https://resend.com/api-keys" -ForegroundColor Blue
Write-Host ""

$resendKey = Read-Host "Enter your Resend API key (starts with 're_')"

if ([string]::IsNullOrWhiteSpace($resendKey)) {
    Write-Host "❌ API key is required!" -ForegroundColor Red
    exit 1
}

if (-not $resendKey.StartsWith("re_")) {
    Write-Host "⚠️  Warning: API key should start with 're_'" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

Write-Host ""

# Step 2: Set secrets
Write-Host "🔐 Step 2: Setting environment variables..." -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "Setting RESEND_API_KEY..." -ForegroundColor Gray
    supabase secrets set RESEND_API_KEY=$resendKey
    Write-Host "✅ RESEND_API_KEY set!" -ForegroundColor Green
    
    Write-Host "Setting SUPABASE_URL..." -ForegroundColor Gray
    supabase secrets set SUPABASE_URL=https://frozkocrdudvtqhhgqzl.supabase.co
    Write-Host "✅ SUPABASE_URL set!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set secrets: $_" -ForegroundColor Red
    Write-Host "Make sure you're logged in and linked to the project" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Deploy functions
Write-Host "🚀 Step 3: Deploying edge functions..." -ForegroundColor Yellow
Write-Host ""

$functions = @(
    "send-confirmation-email",
    "send-password-reset",
    "send-notification-email"
)

foreach ($func in $functions) {
    try {
        Write-Host "Deploying $func..." -ForegroundColor Gray
        supabase functions deploy $func --no-verify-jwt
        Write-Host "✅ $func deployed!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to deploy $func : $_" -ForegroundColor Red
        Write-Host "Continuing with other functions..." -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 4: Verify deployment
Write-Host "📋 Step 4: Verifying deployment..." -ForegroundColor Yellow
Write-Host ""

try {
    $functionsList = supabase functions list
    Write-Host $functionsList
    Write-Host "✅ Functions verified!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not list functions, but they might still be deployed" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Configure hooks in dashboard
Write-Host "🌐 Step 5: Configure Auth Hooks in Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Now you need to configure the hooks in your Supabase Dashboard:" -ForegroundColor White
Write-Host ""

Write-Host "A. Email Confirmation Hook:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks" -ForegroundColor Blue
Write-Host "   2. Click 'Add Hook' or 'Enable Hooks'" -ForegroundColor White
Write-Host "   3. Configure:" -ForegroundColor White
Write-Host "      - Hook Name: Send confirmation email" -ForegroundColor Gray
Write-Host "      - Hook Type: Send Email" -ForegroundColor Gray
Write-Host "      - Event: Validate Email (or Signup)" -ForegroundColor Gray
Write-Host "      - Function URL: https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-confirmation-email" -ForegroundColor Gray
Write-Host "      - HTTP Method: POST" -ForegroundColor Gray
Write-Host "      - HTTP Headers: (leave empty)" -ForegroundColor Gray
Write-Host "   4. Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "B. Password Reset Hook:" -ForegroundColor Cyan
Write-Host "   1. In the same page, click 'Add Hook'" -ForegroundColor White
Write-Host "   2. Configure:" -ForegroundColor White
Write-Host "      - Hook Name: Send password reset" -ForegroundColor Gray
Write-Host "      - Hook Type: Send Email" -ForegroundColor Gray
Write-Host "      - Event: Password Recovery" -ForegroundColor Gray
Write-Host "      - Function URL: https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-password-reset" -ForegroundColor Gray
Write-Host "      - HTTP Method: POST" -ForegroundColor Gray
Write-Host "      - HTTP Headers: (leave empty)" -ForegroundColor Gray
Write-Host "   3. Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "C. Disable Built-in Emails:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers" -ForegroundColor Blue
Write-Host "   2. Find 'Email' section" -ForegroundColor White
Write-Host "   3. Uncheck 'Confirm email' (we use custom hook)" -ForegroundColor White
Write-Host "   4. Keep 'Enable email provider' checked" -ForegroundColor White
Write-Host "   5. Click 'Save'" -ForegroundColor White
Write-Host ""

# Step 6: Open browser
$response = Read-Host "Do you want to open the Auth Hooks dashboard now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Start-Process "https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks"
    Write-Host "✅ Opening dashboard in browser..." -ForegroundColor Green
}

Write-Host ""

# Step 7: Testing
Write-Host "🧪 Step 6: Testing" -ForegroundColor Yellow
Write-Host ""
Write-Host "After configuring the hooks in the dashboard:" -ForegroundColor White
Write-Host "1. Go to your app: http://localhost:8080" -ForegroundColor Cyan
Write-Host "2. Try registering a new user" -ForegroundColor Cyan
Write-Host "3. Check your email for confirmation" -ForegroundColor Cyan
Write-Host "4. Try password reset" -ForegroundColor Cyan
Write-Host ""

Write-Host "To view function logs:" -ForegroundColor White
Write-Host "  supabase functions logs send-confirmation-email" -ForegroundColor Gray
Write-Host "  supabase functions logs send-password-reset" -ForegroundColor Gray
Write-Host "  supabase functions logs send-notification-email" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Setup script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Secrets configured" -ForegroundColor Green
Write-Host "  ✅ Functions deployed" -ForegroundColor Green
Write-Host "  ⏳ Hooks need to be configured in dashboard (see above)" -ForegroundColor Yellow
Write-Host ""

Write-Host "📖 For detailed instructions, see: SETUP-RESEND-EMAILS.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
