$content = Get-Content index.html -Encoding UTF8
for ($i=0; $i -lt $content.Length; $i++) {
    if ($content[$i] -match 'tab-notes') {
        Write-Host "${i}: $($content[$i].Trim())"
    }
}
