$text = Get-Content app.js -Raw
$parens = 0
$brackets = 0
$inString = $false
$stringChar = ""
$inLineComment = $false
$inMultiComment = $false

for ($i = 0; $i -lt $text.Length; $i++) {
    $c = $text[$i]
    $next = if ($i + 1 -lt $text.Length) { $text[$i+1] } else { "" }

    if ($inLineComment) {
        if ($c -eq "`n") { $inLineComment = $false }
        continue
    }
    if ($inMultiComment) {
        if ($c -eq "*" -and $next -eq "/") { $inMultiComment = $false; $i++ }
        continue
    }
    if ($inString) {
        if ($c -eq "\" -and ($next -eq $stringChar -or $next -eq "\")) { $i++; continue }
        if ($c -eq $stringChar) { $inString = $false }
        # Note: template literals `${}` might contain code, but for now we ignore nested complexity
        continue
    }

    if ($c -eq "/" -and $next -eq "/") { $inLineComment = $true; $i++; continue }
    if ($c -eq "/" -and $next -eq "*") { $inMultiComment = $true; $i++; continue }
    if ($c -eq "'" -or $c -eq '"' -or $c -eq '`') { $inString = $true; $stringChar = $c; continue }

    if ($c -eq "(") { $parens++ }
    if ($c -eq ")") { $parens-- }
    if ($c -eq "[") { $brackets++ }
    if ($c -eq "]") { $brackets-- }
}
Write-Host "Parens: $parens"
Write-Host "Brackets: $brackets"
