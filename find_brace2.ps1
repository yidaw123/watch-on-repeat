$lines = Get-Content app.js
$count = 0
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    # We shouldn't count braces inside strings or comments ideally, but let's see what this outputs.
    # It might be good enough.
    foreach ($c in $line.ToCharArray()) {
        if ($c -eq "{") { $count++ }
        if ($c -eq "}") { $count-- }
    }
    if ($count -eq 1 -and $line -match "^\s+([a-zA-Z0-9_]+)\(") {
        # Write-Host "Normal method at $($i+1)"
    }
    if ($count -ge 2 -and $line -match "^\s+([a-zA-Z0-9_]+)\(") {
        Write-Host "Possible missing brace before line $($i+1): $line (Count is $count)"
    }
}
