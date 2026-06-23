$code = @"
using System;
using System.IO;
using System.Collections.Generic;

public class Replayer {
    public static void ApplyChunks(string filePath, string[] targets, string[] replacements, int[] starts, int[] ends, bool[] allows) {
        if (!File.Exists(filePath)) return;
        
        string text = File.ReadAllText(filePath).Replace("\r\n", "\n");
        List<string> lines = new List<string>(text.Split('\n'));
        
        var chunks = new List<Tuple<int, int, string, string, bool>>();
        for (int i = 0; i < targets.Length; i++) {
            chunks.Add(Tuple.Create(starts[i], ends[i], targets[i], replacements[i], allows[i]));
        }
        
        chunks.Sort((a, b) => b.Item1.CompareTo(a.Item1));
        
        foreach (var chunk in chunks) {
            int startLine = chunk.Item1;
            int endLine = chunk.Item2;
            string target = chunk.Item3.Replace("\r\n", "\n");
            string replacement = chunk.Item4.Replace("\r\n", "\n");
            bool allowMultiple = chunk.Item5;
            
            int startIdx = Math.Max(0, startLine - 1);
            int endIdx = Math.Min(lines.Count - 1, endLine - 1);
            
            if (startIdx > endIdx) {
                Console.WriteLine(string.Format("[!] Invalid range {0}-{1} in {2}", startLine, endLine, filePath));
                continue;
            }

            List<string> regionLines = new List<string>();
            for (int i = startIdx; i <= endIdx; i++) {
                regionLines.Add(lines[i]);
            }
            
            string regionText = string.Join("\n", regionLines);
            bool matched = false;
            
            if (regionText.Contains(target)) {
                matched = true;
            } else if ((regionText + "\n").Contains(target)) {
                regionText += "\n";
                matched = true;
            } else {
                int globalIdx = string.Join("\n", lines).IndexOf(target);
                if (globalIdx >= 0) {
                    Console.WriteLine(string.Format("[*] Target globally found for {0}-{1}", startLine, endLine));
                    string allText = string.Join("\n", lines);
                    if (allowMultiple) allText = allText.Replace(target, replacement);
                    else {
                        int pos = allText.IndexOf(target);
                        allText = allText.Substring(0, pos) + replacement + allText.Substring(pos + target.Length);
                    }
                    lines = new List<string>(allText.Split('\n'));
                    continue;
                }
            }

            if (!matched) {
                Console.WriteLine(string.Format("[!] Target content not found in {0} at {1}-{2}", filePath, startLine, endLine));
                continue;
            }
            
            string newRegionText = "";
            if (allowMultiple) {
                newRegionText = regionText.Replace(target, replacement);
            } else {
                int pos = regionText.IndexOf(target);
                newRegionText = regionText.Substring(0, pos) + replacement + regionText.Substring(pos + target.Length);
            }
            
            if (newRegionText.EndsWith("\n") && !string.Join("\n", regionLines).EndsWith("\n")) {
                newRegionText = newRegionText.Substring(0, newRegionText.Length - 1);
            }
            
            string[] newLines = newRegionText.Split('\n');
            lines.RemoveRange(startIdx, endIdx - startIdx + 1);
            lines.InsertRange(startIdx, newLines);
        }
        
        File.WriteAllText(filePath, string.Join("\n", lines));
    }
}
"@
Add-Type -TypeDefinition $code -Language CSharp

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
                    $target = if ($name -eq 'write_to_file') { $args.TargetFile } else { $args.TargetFile }
                    
                    if (($target -match 'app\.js' -or $target -match 'index\.html' -or $target -match 'style\.css') -and ($target -match 'video loop site project')) {
                        Write-Host "Replaying Step $($json.step_index) $name on $target"
                        if ($name -eq 'write_to_file') {
                            Set-Content -Path $target -Value $args.CodeContent -Encoding UTF8
                        }
                        else {
                            $targets = @(); $replacements = @(); $starts = @(); $ends = @(); $allows = @()
                            
                            if ($name -eq 'replace_file_content') {
                                $targets += [string]$args.TargetContent
                                $replacements += [string]$args.ReplacementContent
                                $starts += [int]$args.StartLine
                                $ends += [int]$args.EndLine
                                $allow = $false; if ($null -ne $args.AllowMultiple) { $allow = $args.AllowMultiple }
                                $allows += [bool]$allow
                            }
                            elseif ($name -eq 'multi_replace_file_content') {
                                foreach ($rc in $args.ReplacementChunks) {
                                    $targets += [string]$rc.TargetContent
                                    $replacements += [string]$rc.ReplacementContent
                                    $starts += [int]$rc.StartLine
                                    $ends += [int]$rc.EndLine
                                    $allow = $false; if ($null -ne $rc.AllowMultiple) { $allow = $rc.AllowMultiple }
                                    $allows += [bool]$allow
                                }
                            }
                            
                            [Replayer]::ApplyChunks($target, $targets, $replacements, $starts, $ends, $allows)
                        }
                    }
                }
            }
        } catch {
            Write-Host "Error parsing step: $_"
        }
    }
}
Write-Host "Verification:"
Write-Host "app.js size: $((Get-Item 'C:\Users\devil\Documents\video loop site project\app.js').Length)"
Write-Host "index.html size: $((Get-Item 'C:\Users\devil\Documents\video loop site project\index.html').Length)"
Write-Host "style.css size: $((Get-Item 'C:\Users\devil\Documents\video loop site project\style.css').Length)"
