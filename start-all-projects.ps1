# Start All Projects for Screenshots
# Run in PowerShell as Administrator

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  STARTING ALL 7 PROJECTS FOR SCREENSHOTS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$projects = @(
    @{ Name = "ProLink Frontend (CV #1)"; Path = "C:\ProLink\prolink-frontend"; Cmd = "npm run dev"; Port = 3000 },
    @{ Name = "SchoolHub Frontend (CV #2)"; Path = "C:\New folder\School hub\frontend"; Cmd = "npm run dev"; Port = 3000 },
    @{ Name = "SchoolHub Backend (CV #2)"; Path = "C:\New folder\School hub\backend"; Cmd = "npm run dev"; Port = 4000 },
    @{ Name = "LykaFashion (CV #3)"; Path = "C:\New folder\LykaFashion"; Cmd = "npm run dev"; Port = 3000 },
    @{ Name = "HumanProof (CV #4)"; Path = "C:\New folder\AI humanizer"; Cmd = "npm run dev"; Port = 3000 },
    @{ Name = "VentureHub"; Path = "C:\New folder\venturehub\frontend"; Cmd = "npm run dev"; Port = 3000 },
    @{ Name = "Friendzy"; Path = "C:\New folder\Friendzy\frontend"; Cmd = "npm run dev"; Port = 5173 }
)

foreach ($proj in $projects) {
    Write-Host "Starting $($proj.Name)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($proj.Path)'; $($proj.Cmd)" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ALL 7 TERMINALS LAUNCHED" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:"
Write-Host "1. Wait for each terminal to show 'Local: http://localhost:PORT'"
Write-Host "2. Open Chrome and capture screenshots at 1080x1080"
Write-Host "3. Save to: C:\New folder\School hub\linkedin-posts\screenshots\"
Write-Host ""
Write-Host "URLS TO CAPTURE:"
$projects | ForEach-Object { Write-Host "  $($_.Name) -> http://localhost:$($_.Port)" }
Write-Host "  EduCore      -> Open file:///C:/New folder/School hub/educore.html directly"
Write-Host ""
Write-Host "SCREENSHOT NAMES:"
Write-Host "  slide2-prolink.png"
Write-Host "  slide3-schoolhub.png (already have)"
Write-Host "  slide4-lykafashion.png"
Write-Host "  slide5-humanproof.png"
Write-Host "  slide6-educore-login.png + slide6-educore-dash.png"
Write-Host "  slide7-venturehub.png"
Write-Host "  slide8-friendzy.png"
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")