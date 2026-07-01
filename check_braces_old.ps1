$content = git show HEAD~1:app.js
$count = 0
for ($i = 0; $i -lt $content.Length; $i++) {
    foreach ($c in $content[$i].ToCharArray()) {
        if ($c -eq "{") { $count++ }
        if ($c -eq "}") { $count-- }
    }
}
Write-Host "Old count: $count"
