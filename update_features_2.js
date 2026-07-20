const fs = require('fs');

// Update app.js for sharing logic (allow Premium)
let appJs = fs.readFileSync('app.js', 'utf8');

appJs = appJs.replace(
  `  async shareSavedSession(id) {\n    if (!this.state.user || this.state.user.tier !== 'pro') {\n      this.openUpgradeModal("Sharing packaged sessions is an exclusive Pro feature!");\n      return;\n    }`,
  `  async shareSavedSession(id) {\n    if (!this.state.user || !this.state.user.isPremium) {\n      this.openUpgradeModal("Sharing packaged sessions is a Premium feature!");\n      return;\n    }`
);

fs.writeFileSync('app.js', appJs, 'utf8');
console.log('Updated app.js');

// Update listenonrepeat-alternative.html to give Premium a checkmark for sharing
let html = fs.readFileSync('listenonrepeat-alternative.html', 'utf8');

const shareRowRegex = /<tr style="border-bottom: 1px solid var\(--border-color\);">\s*<td style="padding: 12px;">Share packaged session \(including timestamp loops, playback settings, and notes all saved\)<\/td>\s*<td style="padding: 12px; text-align: center;"><i data-lucide="minus" style="width:16px; opacity:0.3;"><\/i><\/td>\s*<td style="padding: 12px; text-align: center;"><i data-lucide="minus" style="width:16px; opacity:0.3;"><\/i><\/td>\s*<td style="padding: 12px; text-align: center;"><i data-lucide="check" class="check-icon" style="color:var\(--pro-color, #8b5cf6\);"><\/i><\/td>\s*<\/tr>/;

const newShareRow = `<tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 12px;">Share packaged session (including timestamp loops, playback settings, and notes all saved)</td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="minus" style="width:16px; opacity:0.3;"></i></td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="check" class="check-icon" style="color:var(--premium-color, #fbbf24);"></i></td>
                <td style="padding: 12px; text-align: center;"><i data-lucide="check" class="check-icon" style="color:var(--pro-color, #8b5cf6);"></i></td>
              </tr>`;

html = html.replace(shareRowRegex, newShareRow);

fs.writeFileSync('listenonrepeat-alternative.html', html, 'utf8');
console.log('Updated html');
