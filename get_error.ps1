$ie = New-Object -COMObject InternetExplorer.Application
$ie.Visible = $false
$ie.Navigate("file:///C:/Users/devil/Documents/video loop site project/error_catcher.html")
Start-Sleep -Seconds 3
Write-Host $ie.Document.body.innerHTML
$ie.Quit()
