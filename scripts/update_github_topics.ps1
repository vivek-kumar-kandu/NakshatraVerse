# =====================================================================
#  NakshatraVerse — Update Repository Topics & Social Settings
# =====================================================================

$TOKEN = Read-Host "Paste your GitHub Personal Access Token (repo scope required)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($TOKEN)
$PlainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$OWNER = "vivek-kumar-kandu"
$REPO  = "NakshatraVerse"
$BASE  = "https://api.github.com"
$HEADERS = @{
    "Authorization"        = "Bearer $PlainToken"
    "Accept"               = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

Write-Host "`n🏷️  Updating GitHub Repository Topics..." -ForegroundColor Yellow

$topics = @(
    "react", "nodejs", "express", "mongodb", "google-gemini",
    "gemini-api", "ai", "astrology", "vedic-astrology", "docker",
    "jwt", "oauth", "multilingual", "i18n", "full-stack"
)

$uri = "$BASE/repos/$OWNER/$REPO/topics"
$body = @{ names = $topics } | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Method PUT -Uri $uri -Headers $HEADERS -ContentType "application/json" -Body $body
    Write-Host "✅ Successfully set GitHub Topics:" -ForegroundColor Green
    $res.names | ForEach-Object { Write-Host "   • $_" -ForegroundColor Cyan }
} catch {
    Write-Host "❌ Failed to update topics: $($_.Exception.Message)" -ForegroundColor Red
}
