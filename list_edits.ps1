$logPath = "C:\Users\devil\.gemini\antigravity\brain\d0a7634a-7ddf-43af-9e89-19116262a21b\.system_generated\logs\transcript_full.jsonl"
$lines = Get-Content -Path $logPath

$edits = @()

foreach ($line in $lines) {
    if ($line -match '"name":"(write_to_file|replace_file_content|multi_replace_file_content)"') {
        try {
            $json = $line | ConvertFrom-Json
            if ($json.tool_calls) {
                foreach ($call in $json.tool_calls) {
                    $target = $null
                    if ($call.name -eq 'write_to_file') { $target = $call.args.TargetFile }
                    if ($call.name -eq 'replace_file_content') { $target = $call.args.TargetFile }
                    if ($call.name -eq 'multi_replace_file_content') { $target = $call.args.TargetFile }
                    
                    if ($target -match '(app\.js|index\.html|style\.css)') {
                        $edits += [PSCustomObject]@{
                            Step = $json.step_index
                            Tool = $call.name
                            Target = $target
                            Code = if ($call.name -eq 'write_to_file') { $call.args.CodeContent } else { $null }
                        }
                    }
                }
            }
        } catch {}
    }
}

$edits | Sort-Object Step | ForEach-Object {
    Write-Host "Step: $($_.Step) - Tool: $($_.Tool) - Target: $($_.Target)"
}
