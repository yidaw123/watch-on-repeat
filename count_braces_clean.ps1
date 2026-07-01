$text = Get-Content app.js -Raw
# Remove strings
$text = $text -replace "'.*?'", ""
$text = $text -replace '".*?"', ""
$text = $text -replace "(?s)`.*?`", ""
# Remove single line comments
$text = $text -replace "//.*", ""
# Remove multiline comments
$text = $text -replace "(?s)/\*.*?\*/", ""

$count = 0
$lines = $text.Split("`n")
for ($i = 0; $i -lt $lines.Length; $i++) {
    foreach ($c in $lines[$i].ToCharArray()) {
        if ($c -eq "{") { $count++ }
        if ($c -eq "}") { $count-- }
    }
}
Write-Host "Real count: $count"
