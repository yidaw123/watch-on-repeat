$content = Get-Content app.js
for ($i=0; $i -lt $content.Length; $i++) { 
  if ($content[$i] -match "onStateChange.*handleYouTubeStateChange") { 
    Write-Host ($i+1) 
  } 
}
