const fs = require('fs');

// Update app.js
let appJs = fs.readFileSync('app.js', 'utf8');

appJs = appJs.replace(
  `    if (!this.state.user || this.state.user.tier !== 'pro') {\n      this.openUpgradeModal("Offline Local Video mode is an exclusive Pro feature!");\n      return;\n    }`,
  `    if (!this.state.user || !this.state.user.isPremium) {\n      this.openUpgradeModal("Offline Local Video mode is a Premium feature!");\n      return;\n    }`
);

appJs = appJs.replace(
  `  async shareSavedSession(id) {\n    const url = new URL(window.location);\n    url.search = \`?instance=\${id}\`;`,
  `  async shareSavedSession(id) {\n    if (!this.state.user || this.state.user.tier !== 'pro') {\n      this.openUpgradeModal("Sharing packaged sessions is an exclusive Pro feature!");\n      return;\n    }\n    const url = new URL(window.location);\n    url.search = \`?instance=\${id}\`;`
);

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Updated app.js');

// Update listenonrepeat-alternative.html
let html = fs.readFileSync('listenonrepeat-alternative.html', 'utf8');

const tableBlockRegex = /<tr style="border-bottom: 1px solid var\(--border-color\);">\s*<td style="padding: 12px;">Customizable Hotkeys<\/td>[\s\S]*?<tr style="border-bottom: 1px solid var\(--border-color\);">\s*<td style="padding: 12px;">Advanced Hotkeys \(Shift\/Halve\/Double\)<\/td>[\s\S]*?<\/tr>/;

const newTableBlock = `<tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">Upload local video/audio files</td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="minus" style="width:16px; opacity:0.3;"></i></td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="check" class="check-icon" style="color:var(--premium-color, #fbbf24);"></i></td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="check" class="check-icon" style="color:var(--pro-color, #8b5cf6);"></i></td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">Hotkeys Access</td>
                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: #aaa;">Basic</td>
                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--premium-color, #fbbf24);">Advanced + Customizable</td>
                <td style="padding: 12px; text-align: center; font-size: 0.9em; color: var(--pro-color, #8b5cf6);">Advanced + Customizable</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">Share packaged session (including timestamp loops, playback settings, and notes all saved)</td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="minus" style="width:16px; opacity:0.3;"></i></td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="minus" style="width:16px; opacity:0.3;"></i></td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="check" class="check-icon" style="color:var(--pro-color, #8b5cf6);"></i></td>
              </tr>`;

html = html.replace(tableBlockRegex, newTableBlock);

fs.writeFileSync('listenonrepeat-alternative.html', html, 'utf8');
console.log('Updated html');
