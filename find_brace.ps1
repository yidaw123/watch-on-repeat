$lines = Get-Content app.js
$balance = 0
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    # Rough strip of string literals and comments to avoid false positives
    $line = $line -replace '"[^"]*"','' -replace "'[^']*'",'' -replace '`[^`]*`','' -replace '\/\/.*',''
    $open = ($line -replace '[^{]','').Length
    $close = ($line -replace '[^}]','').Length
    $balance += $open - $close
    if ($balance -lt 0) {
        Write-Host "Balance went negative ($balance) at line $($i + 1)"
        break
    }
}
Write-Host "Final Balance: $balance"
