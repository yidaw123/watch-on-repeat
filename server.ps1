$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8081/")
$listener.Start()
$context = $listener.GetContext()
$request = $context.Request
$reader = New-Object System.IO.StreamReader($request.InputStream)
$errorMsg = $reader.ReadToEnd()
$errorMsg | Out-File "C:\Users\devil\Documents\video loop site project\js_error.txt"
$response = $context.Response
$response.StatusCode = 200
$response.Close()
$listener.Stop()
