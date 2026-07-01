$text = Get-Content app.js -Raw
$text = $text -replace "'.*?'", ""
$text = $text -replace '".*?"', ""
$text = $text -replace "(?s)`.*?`", ""
$text = $text -replace "//.*", ""
$text = $text -replace "(?s)/\*.*?\*/", ""

$count = 0
foreach ($c in $text.ToCharArray()) {
    if ($c -eq '(') { $count++ }
    if ($c -eq ')') { $count-- }
}
Write-Host "Parens count: $count"
