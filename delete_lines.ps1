param([int]$start, [int]$end, [string]$replacement, [string]$file)
$lines = Get-Content $file
$before = $lines[0..($start-2)]
$after = $lines[$end..($lines.Length-1)]
$out = $before + $replacement + $after
Set-Content $file $out
