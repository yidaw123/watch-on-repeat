$htmlContent = @"
<!DOCTYPE html>
<html>
<head></head>
<body>
<script>
window.onerror = function(msg, url, line, col, error) {
  document.body.innerHTML += '<div id="my-error">DOM_TEST_ERROR: ' + msg + ' LINE: ' + line + '</div>';
};
</script>
<script src="js/database.js"></script>
<script src="js/auth.js"></script>
<script src="js/notes.js"></script>
<script src="js/playlists.js"></script>
<script src="js/loops.js"></script>
<script src="app.js"></script>
<script>
  setTimeout(() => {
    document.body.innerHTML += '<div id="finished">FINISHED</div>';
  }, 1000);
</script>
</body>
</html>
"@

Set-Content -Path "test_error_temp.html" -Value $htmlContent -Encoding UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$cwd = (Get-Location).Path
$fileUrl = "file:///$($cwd.Replace('\', '/'))/test_error_temp.html"

# Run Edge headless to dump DOM
$output = & $edgePath --headless=new --dump-dom "$fileUrl" 2>&1

Remove-Item -Path "test_error_temp.html" -Force

if ($output -match "DOM_TEST_ERROR:") {
    Write-Host "[FAIL] Found syntax or runtime errors during initialization:"
    $output | Select-String "DOM_TEST_ERROR:"
    exit 1
} else {
    Write-Host "[PASS] No DOM initialization errors detected."
    exit 0
}
