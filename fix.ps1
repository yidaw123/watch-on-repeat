$content = Get-Content app.js -Raw -Encoding UTF8
$search = "(?s)(clearInterval\(checkDur\);\s*\}\s*\}\s*\}, 500\);\s*\})\s*\},(\s*'onStateChange': this\.handleYouTubeStateChange,)"
$replace = "`$1`n              this.onVideoReady();`n            },`$2"
$content = $content -replace $search, $replace
Set-Content app.js -Value $content -Encoding UTF8
