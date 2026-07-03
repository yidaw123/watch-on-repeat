$content = Get-Content app.js -Raw -Encoding UTF8

# The inserted block starts with "class CascadingTimeInput {" and ends with "window.CascadingTimeInput = CascadingTimeInput;\r\n\r\n  showToast"
$regex = '(?s)class CascadingTimeInput \{.*window\.CascadingTimeInput = CascadingTimeInput;\r?\n\r?\n'

if ($content -match $regex) {
    $classBlock = $matches[0]
    
    # Remove it from the current location
    $content = $content -replace $regex, ''
    
    # Place it at the very top of the file
    $content = $classBlock + "`r`n" + $content
    
    Set-Content app.js $content -Encoding UTF8
    Write-Host "Successfully moved CascadingTimeInput to the top."
} else {
    Write-Host "Could not find CascadingTimeInput in app.js"
}
