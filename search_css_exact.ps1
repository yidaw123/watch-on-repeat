$searchPaths = @(
    "C:\Users\devil\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data"
)

$foundStyleCss = $null

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($file.Length -lt 500000) {
                try {
                    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                    # Look for the URL in the cache headers
                    if ($content -match "127\.0\.0\.1:8080/style\.css" -or $content -match "localhost:8080/style\.css") {
                        Write-Host "FOUND EXACT CSS CACHE: $($file.FullName) Size: $($file.Length)"
                        $foundStyleCss = $file.FullName
                    }
                } catch {}
            }
        }
    }
}

if ($foundStyleCss) {
    Copy-Item $foundStyleCss "C:\Users\devil\Documents\video loop site project\style_cache_exact.css"
    Write-Host "Restored exact style.css from cache headers!"
} else {
    Write-Host "Could not find exact style.css in cache."
}
