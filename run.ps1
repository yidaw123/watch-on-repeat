Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"C:\Users\devil\Documents\video loop site project\server.ps1`"" -WindowStyle Hidden
Start-Sleep -Seconds 2
Start-Process msedge.exe "file:///C:/Users/devil/Documents/video loop site project/error_catcher.html"
