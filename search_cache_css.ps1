$searchPaths = @("C:\Users\devil\AppData\Local\Google\Chrome\User Data\Default\Cache\Cache_Data")

$foundStyleCss = $null

foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -File -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            if ($file.Length -gt 25000 -and $file.Length -lt 35000) {
                try {
                    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
                    if ($content -match "var\(--surface-color\)" -and $content -match "ad-gutter") {
                        Write-Host "FOUND POTENTIAL STYLE.CSS: $($file.FullName) Size: $($file.Length)"
                        $foundStyleCss = $file.FullName
                    }
                } catch {}
            }
        }
    }
}

if ($foundStyleCss) {
    Copy-Item $foundStyleCss "C:\Users\devil\Documents\video loop site project\style_recovered_cache.css"
    Write-Host "Copied style.css to style_recovered_cache.css"
}
