$code = @"
using System;
using System.IO;

public class Replayer {
    public static void Apply(string filePath, string target, string replacement, bool allowMultiple) {
        if (!File.Exists(filePath)) return;
        string content = File.ReadAllText(filePath);
        
        string targetNormalized = target.Replace("\r\n", "\n");
        string replacementNormalized = replacement.Replace("\r\n", "\n");
        string contentNormalized = content.Replace("\r\n", "\n");
        
        if (allowMultiple) {
            contentNormalized = contentNormalized.Replace(targetNormalized, replacementNormalized);
        } else {
            int pos = contentNormalized.IndexOf(targetNormalized);
            if (pos >= 0) {
                contentNormalized = contentNormalized.Substring(0, pos) + replacementNormalized + contentNormalized.Substring(pos + targetNormalized.Length);
            } else {
                Console.WriteLine("Could not find target in " + filePath);
            }
        }
        
        File.WriteAllText(filePath, contentNormalized);
    }
}
"@
Add-Type -TypeDefinition $code -Language CSharp

# Restore files to base first
git restore app.js index.html style.css

$logPath = "C:\Users\devil\.gemini\antigravity\brain\d0a7634a-7ddf-43af-9e89-19116262a21b\.system_generated\logs\transcript_full.jsonl"
$lines = Get-Content -Path $logPath

foreach ($line in $lines) {
    if ($line -match '"name":"(write_to_file|replace_file_content|multi_replace_file_content)"') {
        try {
            $json = $line | ConvertFrom-Json
            if ($json.step_index -ge 2910) { continue }
            
            if ($json.tool_calls) {
                foreach ($call in $json.tool_calls) {
                    $name = $call.name
                    $args = $call.args
                    $target = $null
                    if ($name -eq 'write_to_file') { $target = $args.TargetFile }
                    else { $target = $args.TargetFile }
                    
                    if ($target -match '(app\.js|index\.html|style\.css)$') {
                        Write-Host "Replaying Step $($json.step_index) $name on $target"
                        if ($name -eq 'write_to_file') {
                            Set-Content -Path $target -Value $args.CodeContent -Encoding UTF8
                        }
                        elseif ($name -eq 'replace_file_content') {
                            [Replayer]::Apply($target, $args.TargetContent, $args.ReplacementContent, $args.AllowMultiple)
                        }
                        elseif ($name -eq 'multi_replace_file_content') {
                            foreach ($chunk in $args.ReplacementChunks) {
                                [Replayer]::Apply($target, $chunk.TargetContent, $chunk.ReplacementContent, $chunk.AllowMultiple)
                            }
                        }
                    }
                }
            }
        } catch {
            Write-Host "Error parsing step: $_"
        }
    }
}
Write-Host "Replay complete!"
