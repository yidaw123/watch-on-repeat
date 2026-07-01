$content = Get-Content app.js -Raw
$content = $content -replace '"[^"]*"','' -replace "'[^']*'",'' -replace '`[^`]*`','' -replace '\/\*[\s\S]*?\*\/','' -replace '\/\/.*',''
$open = ($content -replace '[^{]','').Length
$close = ($content -replace '[^}]','').Length
Write-Host "Open: $open, Close: $close"
