$text = Get-Content app.js -Raw
$lines = $text -split "`n"
$stack = @()

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    # Remove strings and comments for this line only (approximate, doesn't handle multi-line strings/comments perfectly, but good enough for simple JS)
    $cleanLine = $line -replace '`"[^`"]*`"', '' -replace "'[^']*'", '' -replace '``[^``]*``', '' -replace '//.*', ''
    
    # We will just do a simple char iteration
    foreach ($c in $cleanLine.ToCharArray()) {
        if ($c -eq '(') { $stack += [PSCustomObject]@{ type='('; line=$i+1 } }
        elseif ($c -eq '[') { $stack += [PSCustomObject]@{ type='['; line=$i+1 } }
        elseif ($c -eq '{') { $stack += [PSCustomObject]@{ type='{'; line=$i+1 } }
        elseif ($c -eq ')') {
            if ($stack.Length -eq 0) { Write-Host "Unexpected ) at line $($i+1)"; continue }
            $last = $stack[-1]
            if ($last.type -ne '(') { Write-Host "Mismatched ) at line $($i+1). Expected closing for $($last.type) from line $($last.line)" }
            $stack = $stack[0..($stack.Length-2)]
        }
        elseif ($c -eq ']') {
            if ($stack.Length -eq 0) { Write-Host "Unexpected ] at line $($i+1)"; continue }
            $last = $stack[-1]
            if ($last.type -ne '[') { Write-Host "Mismatched ] at line $($i+1). Expected closing for $($last.type) from line $($last.line)" }
            $stack = $stack[0..($stack.Length-2)]
        }
        elseif ($c -eq '}') {
            if ($stack.Length -eq 0) { Write-Host "Unexpected } at line $($i+1)"; continue }
            $last = $stack[-1]
            if ($last.type -ne '{') { Write-Host "Mismatched } at line $($i+1). Expected closing for $($last.type) from line $($last.line)" }
            $stack = $stack[0..($stack.Length-2)]
        }
    }
}

foreach ($item in $stack) {
    Write-Host "Unclosed $($item.type) at line $($item.line)"
}
