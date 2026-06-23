$searchPaths = @(
    "C:\Users\devil\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data",
    "C:\Users\devil\AppData\Local\Microsoft\Edge\User Data\Default\Cache\Cache_Data",
    "C:\Users\devil\AppData\Local\Mozilla\Firefox\Profiles\*\cache2\entries"
)

$foundAppJs = $null
$foundIndexHtml = $null

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "Searching in $path"
        
        $files = Get-ChildItem -Path $path -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($file.Length -gt 30000 -and $file.Length -lt 200000) {
                # Read first few KB to check for keywords
                try {
                    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                    if ($content -match "initDailymotionPlayer" -and $content -match "Premium") {
                        Write-Host "FOUND POTENTIAL APP.JS: $($file.FullName) Size: $($file.Length)"
                        $foundAppJs = $file.FullName
                    }
                    if ($content -match "user-menu" -and $content -match "Premium" -and $content -match "<!DOCTYPE html>") {
                        Write-Host "FOUND POTENTIAL INDEX.HTML: $($file.FullName) Size: $($file.Length)"
                        $foundIndexHtml = $file.FullName
                    }
                } catch {}
            }
        }
    }
}

if ($foundAppJs) {
    Copy-Item $foundAppJs "C:\Users\devil\Documents\video loop site project\app_recovered_cache.js"
    Write-Host "Copied app.js to app_recovered_cache.js"
}
if ($foundIndexHtml) {
    Copy-Item $foundIndexHtml "C:\Users\devil\Documents\video loop site project\index_recovered_cache.html"
    Write-Host "Copied index.html to index_recovered_cache.html"
}
