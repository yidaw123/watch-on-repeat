$searchPaths = @(
    "C:\Users\devil\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data",
    "C:\Users\devil\AppData\Local\Microsoft\Edge\User Data\Default\Cache\Cache_Data"
)

$foundStyleCss = $null
$latestTime = 0

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            # style.css should be between 20KB and 40KB
            if ($file.Length -gt 20000 -and $file.Length -lt 40000) {
                try {
                    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                    if ($content -match "\.premium-badge" -and $content -match "\.lucide") {
                        Write-Host "FOUND POTENTIAL CSS: $($file.FullName) Size: $($file.Length) Modified: $($file.LastWriteTime)"
                        if ($file.LastWriteTime.Ticks -gt $latestTime) {
                            $latestTime = $file.LastWriteTime.Ticks
                            $foundStyleCss = $file.FullName
                        }
                    }
                } catch {}
            }
        }
    }
}

if ($foundStyleCss) {
    Copy-Item $foundStyleCss "C:\Users\devil\Documents\video loop site project\style.css"
    Write-Host "Restored style.css from cache!"
} else {
    Write-Host "Could not find style.css in cache."
}
