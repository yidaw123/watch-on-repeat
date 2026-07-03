$text = Get-Content app.js -Raw
$text = $text -replace '`"[^`"]*`"', ''
$text = $text -replace "'[^']*'", ''
$text = $text -replace '``[^``]*``', ''
$text = $text -replace '//.*', ''
$text = $text -replace '/\*.*?\*/', ''

$open = ($text -replace '[^\(]', '').Length
$close = ($text -replace '[^\)]', '').Length
Write-Host "app.js Parens: Open=$open, Close=$close"

$open = ($text -replace '[^\[]', '').Length
$close = ($text -replace '[^\]]', '').Length
Write-Host "app.js Brackets: Open=$open, Close=$close"

$open = ($text -replace '[^\{]', '').Length
$close = ($text -replace '[^\}]', '').Length
Write-Host "app.js Braces: Open=$open, Close=$close"

$text = Get-Content js/loops.js -Raw
$text = $text -replace '`"[^`"]*`"', ''
$text = $text -replace "'[^']*'", ''
$text = $text -replace '``[^``]*``', ''
$text = $text -replace '//.*', ''
$text = $text -replace '/\*.*?\*/', ''

$open = ($text -replace '[^\(]', '').Length
$close = ($text -replace '[^\)]', '').Length
Write-Host "loops.js Parens: Open=$open, Close=$close"

$open = ($text -replace '[^\[]', '').Length
$close = ($text -replace '[^\]]', '').Length
Write-Host "loops.js Brackets: Open=$open, Close=$close"

$open = ($text -replace '[^\{]', '').Length
$close = ($text -replace '[^\}]', '').Length
Write-Host "loops.js Braces: Open=$open, Close=$close"
