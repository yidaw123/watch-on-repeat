$code = @"
using System;
using System.IO;
using System.Collections.Generic;

public class Replayer {
    public static void ApplyChunks(string filePath, string[] targets, string[] replacements, bool[] allows) {
        if (!File.Exists(filePath)) return;
        string text = File.ReadAllText(filePath).Replace("\r\n", "\n");
        
        for (int i = 0; i < targets.Length; i++) {
            string target = targets[i].Replace("\r\n", "\n");
            string replacement = replacements[i].Replace("\r\n", "\n");
            bool allowMultiple = allows[i];
            
            // Try exact match first
            if (text.Contains(target)) {
                if (allowMultiple) {
                    text = text.Replace(target, replacement);
                } else {
                    int pos = text.IndexOf(target);
                    text = text.Substring(0, pos) + replacement + text.Substring(pos + target.Length);
                }
            } else {
                // If not found, try without trailing newlines
                string t2 = target.TrimEnd('\n');
                if (text.Contains(t2)) {
                    if (allowMultiple) {
                        text = text.Replace(t2, replacement);
                    } else {
                        int pos = text.IndexOf(t2);
                        text = text.Substring(0, pos) + replacement + text.Substring(pos + t2.Length);
                    }
                } else {
                    Console.WriteLine("[!] Failed to find target chunk: " + target.Substring(0, Math.Min(30, target.Length)));
                }
            }
        }
        File.WriteAllText(filePath, text);
    }
}
"@
Add-Type -TypeDefinition $code -Language CSharp

git restore index.html

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
                    
                    if (($target -match 'index\.html') -and ($target -match 'video loop site project')) {
                        if ($name -eq 'write_to_file') {
                            Set-Content -Path "index.html" -Value $args.CodeContent -Encoding UTF8
                        }
                        else {
                            $targets = @(); $replacements = @(); $allows = @()
                            if ($name -eq 'replace_file_content') {
                                $targets += [string]$args.TargetContent
                                $replacements += [string]$args.ReplacementContent
                                $allow = $false; if ($null -ne $args.AllowMultiple) { $allow = $args.AllowMultiple }
                                $allows += [bool]$allow
                            }
                            elseif ($name -eq 'multi_replace_file_content') {
                                foreach ($rc in $args.ReplacementChunks) {
                                    $targets += [string]$rc.TargetContent
                                    $replacements += [string]$rc.ReplacementContent
                                    $allow = $false; if ($null -ne $rc.AllowMultiple) { $allow = $rc.AllowMultiple }
                                    $allows += [bool]$allow
                                }
                            }
                            [Replayer]::ApplyChunks("index.html", $targets, $replacements, $allows)
                        }
                    }
                }
            }
        } catch {}
    }
}
Write-Host "Verification index.html size: $((Get-Item 'index.html').Length)"
