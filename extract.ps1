param([int]$start, [int]$end, [string]$className, [string]$outFile)
$lines = Get-Content app.js
$chunk = $lines[($start-1)..($end-1)]
$out = "class $className {`n" + ($chunk -join "`n") + "`n}`nwindow.$className = $className;"
Set-Content $outFile $out
