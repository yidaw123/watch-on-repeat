$searchPaths = @("C:\Users\devil\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

$foundStyleCss = $null

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($file.Length -lt 150000) {
                try {
                    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                    if ($content -match "\.auth-divider" -and $content -match "\.ad-gutter") {
                        Write-Host "FOUND POTENTIAL CSS: $($file.FullName) Size: $($file.Length)"
                        $foundStyleCss = $file.FullName
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
