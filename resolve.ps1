$lines = Get-Content app.js -Encoding UTF8
$outLines = @()
$inConflict = $false
$keep = $false

foreach ($line in $lines) {
    if ($line -match "^<<<<<<<") {
        $inConflict = $true
        $keep = $true
        continue
    }
    if ($line -match "^=======") {
        $keep = $false
        continue
    }
    if ($line -match "^>>>>>>>") {
        $inConflict = $false
        $keep = $true
        continue
    }
    
    if (!$inConflict) {
        $outLines += $line
    } elseif ($keep) {
        $outLines += $line
    }
}

Set-Content app.js -Value $outLines -Encoding UTF8
