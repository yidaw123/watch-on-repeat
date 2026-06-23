$port = 8080
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
Write-Host "Listening on http://127.0.0.1:$port/"
while ($true) {
    if (!$listener.Pending()) {
        Start-Sleep -Milliseconds 50
        continue
    }
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $writer = [System.IO.StreamWriter]::new($stream)
    
    $request = ""
    while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
        if ($request -eq "") { $request = $line }
    }
    
    if ($request -match "^GET\s+([^\s]+)\s+HTTP") {
        $fullUrl = $matches[1]
        $path = $fullUrl.Split('?')[0]
        $path = [uri]::UnescapeDataString($path)
        if ($path -eq "/") { $path = "/index.html" }
        $path = $path.Replace("/", "\")
        $fullPath = Join-Path $PWD $path
        
        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = "application/octet-stream"
            switch ($ext) {
                ".html" { $contentType = "text/html" }
                ".css"  { $contentType = "text/css" }
                ".js"   { $contentType = "application/javascript" }
                ".json" { $contentType = "application/json" }
                ".png"  { $contentType = "image/png" }
                ".svg"  { $contentType = "image/svg+xml" }
            }
            
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            
            $writer.WriteLine("HTTP/1.1 200 OK")
            $writer.WriteLine("Content-Type: $contentType")
            $writer.WriteLine("Content-Length: " + $bytes.Length)
            $writer.WriteLine("Connection: close")
            $writer.WriteLine("")
            $writer.Flush()
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $writer.WriteLine("HTTP/1.1 404 Not Found")
            $writer.WriteLine("Connection: close")
            $writer.WriteLine("")
            $writer.Flush()
        }
    }
    $client.Close()
}
