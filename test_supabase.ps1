$key = "sb_publishable_e1gQuU0n8FofmTkitqTEQQ_pi1g8fqD"
$url = "https://golkbcdlxpojjwqtyuzn.supabase.co"

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$body = '{"video_id":"test123","platform":"youtube","global_loops":5,"global_plays":1}'

Write-Host "=== Testing INSERT into global_stats ==="
try {
    $response = Invoke-RestMethod -Uri "$url/rest/v1/global_stats" -Method Post -Headers $headers -Body $body
    Write-Host "SUCCESS:" ($response | ConvertTo-Json)
} catch {
    Write-Host "FAILED:" $_.Exception.Message
    Write-Host "Response:" $_.ErrorDetails.Message
}

Write-Host ""
Write-Host "=== Reading global_stats ==="
try {
    $response = Invoke-RestMethod -Uri "$url/rest/v1/global_stats?select=*" -Headers @{ "apikey" = $key; "Authorization" = "Bearer $key" }
    Write-Host "DATA:" ($response | ConvertTo-Json)
} catch {
    Write-Host "FAILED:" $_.Exception.Message
}
