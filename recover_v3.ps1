$code = @"
using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;

public class Chunk {
    public int StartLine;
    public int EndLine;
    public string TargetContent;
    public string ReplacementContent;
    public bool AllowMultiple;
}

public class Replayer {
    public static void ApplyChunks(string filePath, List<Chunk> chunks) {
        if (!File.Exists(filePath)) return;
        
        // Read lines (preserving empty lines, stripping \r)
        string text = File.ReadAllText(filePath).Replace("\r\n", "\n");
        List<string> lines = new List<string>(text.Split('\n'));
        
        // Sort chunks descending by StartLine so line number shifts don't affect earlier chunks
        chunks.Sort((a, b) => b.StartLine.CompareTo(a.StartLine));
        
        foreach (var chunk in chunks) {
            int startIdx = Math.Max(0, chunk.StartLine - 1);
            int endIdx = Math.Min(lines.Count - 1, chunk.EndLine - 1);
            
            if (startIdx > endIdx) {
                Console.WriteLine($"[!] Invalid range {chunk.StartLine}-{chunk.EndLine} in {filePath}");
                continue;
            }

            // Extract region
            List<string> regionLines = new List<string>();
            for (int i = startIdx; i <= endIdx; i++) {
                regionLines.Add(lines[i]);
            }
            
            // Try matching
            string regionText = string.Join("\n", regionLines);
            string target = chunk.TargetContent.Replace("\r\n", "\n");
            string replacement = chunk.ReplacementContent.Replace("\r\n", "\n");
            
            bool matched = false;
            
            // The agent framework usually searches within regionText
            if (regionText.Contains(target)) {
                matched = true;
            } else if ((regionText + "\n").Contains(target)) {
                regionText += "\n";
                matched = true;
            } else {
                // Try fuzzy matching or finding it globally if region is slightly off
                int globalIdx = string.Join("\n", lines).IndexOf(target);
                if (globalIdx >= 0) {
                    Console.WriteLine($"[*] Target not in range {chunk.StartLine}-{chunk.EndLine}, but found globally. Ignoring range.");
                    string allText = string.Join("\n", lines);
                    if (chunk.AllowMultiple) allText = allText.Replace(target, replacement);
                    else {
                        int pos = allText.IndexOf(target);
                        allText = allText.Substring(0, pos) + replacement + allText.Substring(pos + target.Length);
                    }
                    lines = new List<string>(allText.Split('\n'));
                    continue;
                }
            }

            if (!matched) {
                Console.WriteLine($"[!] Target content not found in {filePath} at lines {chunk.StartLine}-{chunk.EndLine}");
                continue;
            }
            
            string newRegionText = "";
            if (chunk.AllowMultiple) {
                newRegionText = regionText.Replace(target, replacement);
            } else {
                int pos = regionText.IndexOf(target);
                newRegionText = regionText.Substring(0, pos) + replacement + regionText.Substring(pos + target.Length);
            }
            
            // Remove trailing newline if we added it for matching and it's still there
            if (newRegionText.EndsWith("\n") && !string.Join("\n", regionLines).EndsWith("\n")) {
                newRegionText = newRegionText.Substring(0, newRegionText.Length - 1);
            }
            
            string[] newLines = newRegionText.Split('\n');
            
            // Splice
            lines.RemoveRange(startIdx, endIdx - startIdx + 1);
            lines.InsertRange(startIdx, newLines);
        }
        
        File.WriteAllText(filePath, string.Join("\n", lines));
    }
}
"@
Add-Type -TypeDefinition $code -Language CSharp

Write-Host "Resetting files to base commit..."
git restore app.js index.html style.css

$logPath = "C:\Users\devil\.gemini\antigravity\brain\d0a7634a-7ddf-43af-9e89-19116262a21b\.system_generated\logs\transcript_full.jsonl"
$lines = Get-Content -Path $logPath

Write-Host "Replaying transcript edits..."
foreach ($line in $lines) {
    if ($line -match '"name":"(write_to_file|replace_file_content|multi_replace_file_content)"') {
        try {
            $json = $line | ConvertFrom-Json
            if ($json.step_index -ge 2910) { continue }
            
            if ($json.tool_calls) {
                foreach ($call in $json.tool_calls) {
                    $name = $call.name
                    $args = $call.args
                    $target = if ($name -eq 'write_to_file') { $args.TargetFile } else { $args.TargetFile }
                    
                    if ($target -match '(app\.js|index\.html|style\.css)$') {
                        Write-Host "Step $($json.step_index): $name on $target"
                        
                        if ($name -eq 'write_to_file') {
                            Set-Content -Path $target -Value $args.CodeContent -Encoding UTF8
                        }
                        else {
                            $chunks = New-Object System.Collections.Generic.List[Chunk]
                            if ($name -eq 'replace_file_content') {
                                $c = New-Object Chunk
                                $c.StartLine = $args.StartLine; $c.EndLine = $args.EndLine
                                $c.TargetContent = $args.TargetContent; $c.ReplacementContent = $args.ReplacementContent
                                $c.AllowMultiple = if ($null -ne $args.AllowMultiple) { $args.AllowMultiple } else { $false }
                                $chunks.Add($c)
                            }
                            elseif ($name -eq 'multi_replace_file_content') {
                                foreach ($rc in $args.ReplacementChunks) {
                                    $c = New-Object Chunk
                                    $c.StartLine = $rc.StartLine; $c.EndLine = $rc.EndLine
                                    $c.TargetContent = $rc.TargetContent; $c.ReplacementContent = $rc.ReplacementContent
                                    $c.AllowMultiple = if ($null -ne $rc.AllowMultiple) { $rc.AllowMultiple } else { $false }
                                    $chunks.Add($c)
                                }
                            }
                            [Replayer]::ApplyChunks($target, $chunks)
                        }
                    }
                }
            }
        } catch {
            Write-Host "Error parsing step: $_"
        }
    }
}
Write-Host "Replay complete! Verification:"
Write-Host "app.js size: $((Get-Item 'app.js').Length)"
Write-Host "index.html size: $((Get-Item 'index.html').Length)"
Write-Host "style.css size: $((Get-Item 'style.css').Length)"
