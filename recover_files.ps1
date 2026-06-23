$code = @"
using System;
using System.IO;
using System.Text.RegularExpressions;
using System.Collections.Generic;

public class Replayer {
    public static void Apply(string filePath, string target, string replacement, int startLine, int endLine, bool allowMultiple) {
        if (!File.Exists(filePath)) return;
        string[] lines = File.ReadAllLines(filePath);
        
        // 1-based to 0-based
        int startIdx = Math.Max(0, startLine - 1);
        int endIdx = Math.Min(lines.Length - 1, endLine - 1);
        
        // Extract the lines we are searching in
        List<string> searchRegion = new List<string>();
        for (int i = startIdx; i <= endIdx; i++) {
            searchRegion.Add(lines[i]);
        }
        string searchString = string.Join("\n", searchRegion) + "\n";
        
        // Replace
        string resultString = searchString;
        
        // If TargetContent is purely \n separated, we need to handle Windows \r\n if present, 
        // but TargetContent from JSON is \n. We standardize searchRegion to \n.
        string targetNormalized = target.Replace("\r\n", "\n");
        string replacementNormalized = replacement.Replace("\r\n", "\n");
        
        if (allowMultiple) {
            resultString = resultString.Replace(targetNormalized, replacementNormalized);
        } else {
            int pos = resultString.IndexOf(targetNormalized);
            if (pos >= 0) {
                resultString = resultString.Substring(0, pos) + replacementNormalized + resultString.Substring(pos + targetNormalized.Length);
            }
        }
        
        // Now splice it back. The tricky part is resultString might have a different number of lines.
        // We can just reconstruct the whole file string.
        
        List<string> prefix = new List<string>();
        for (int i = 0; i < startIdx; i++) prefix.Add(lines[i]);
        
        List<string> suffix = new List<string>();
        for (int i = endIdx + 1; i < lines.Length; i++) suffix.Add(lines[i]);
        
        string fullContent = string.Join("\n", prefix) + (prefix.Count > 0 ? "\n" : "") + 
                             resultString + 
                             (resultString.EndsWith("\n") ? "" : "\n") + 
                             string.Join("\n", suffix);
                             
        // Normalize newlines back to what OS expects or just keep \n
        File.WriteAllText(filePath, fullContent);
    }
}
"@
Add-Type -TypeDefinition $code -Language CSharp

$logPath = "C:\Users\devil\.gemini\antigravity\brain\d0a7634a-7ddf-43af-9e89-19116262a21b\.system_generated\logs\transcript_full.jsonl"
$lines = Get-Content -Path $logPath

foreach ($line in $lines) {
    if ($line -match '"name":"(write_to_file|replace_file_content|multi_replace_file_content)"') {
        try {
            $json = $line | ConvertFrom-Json
            if ($json.step_index -ge 2910) { continue } # Stop before the disaster
            
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
                            [Replayer]::Apply($target, $args.TargetContent, $args.ReplacementContent, $args.StartLine, $args.EndLine, $args.AllowMultiple)
                        }
                        elseif ($name -eq 'multi_replace_file_content') {
                            foreach ($chunk in $args.ReplacementChunks) {
                                [Replayer]::Apply($target, $chunk.TargetContent, $chunk.ReplacementContent, $chunk.StartLine, $chunk.EndLine, $chunk.AllowMultiple)
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
