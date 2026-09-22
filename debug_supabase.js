const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `if (!this.state.discoverData || this.state.discoverData.length === 0) {
      list.innerHTML = \`<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; display: flex; flex-direction: column; gap: 8px; align-items: center;"><i data-lucide="loader" class="spin"></i><span>Loading popular loops...</span></div>\`;
      if (window.lucide) window.lucide.createIcons();
      await this.fetchDiscoverData();
    }`;

const replacement = `if (!this.state.discoverData || this.state.discoverData.length === 0) {
      list.innerHTML = \`<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; display: flex; flex-direction: column; gap: 8px; align-items: center;"><i data-lucide="loader" class="spin"></i><span>Loading popular loops...</span></div>\`;
      if (window.lucide) window.lucide.createIcons();
      await this.fetchDiscoverData();
      
      // DIAGNOSTIC CHECK
      if (this.state.lastDiscoverError) {
        list.innerHTML = \`<div style="padding: 24px; text-align: center; color: #ef4444; font-size: 13px; font-family: monospace; word-break: break-all;">DB Error: \${this.state.lastDiscoverError}</div>\`;
        return;
      }
    }`;

content = content.replace(target, replacement);

const fetchTarget = `const { data, error } = await supabaseClient.from('global_stats')
          .select('*')
          .neq('platform', 'local')
          .order('global_loops', { ascending: false })
          .limit(20);
          
        if (!error && data && data.length > 0) {`;

const fetchReplacement = `const { data, error } = await supabaseClient.from('global_stats')
          .select('*')
          .neq('platform', 'local')
          .order('global_loops', { ascending: false })
          .limit(20);
          
        if (error) {
          this.state.lastDiscoverError = error.message || JSON.stringify(error);
          console.error("Supabase global_stats error:", error);
        } else if (data && data.length === 0) {
          this.state.lastDiscoverError = "Table exists but returned 0 rows. (Check RLS policies or if table is empty)";
        } else {
          this.state.lastDiscoverError = null;
        }
          
        if (!error && data && data.length > 0) {`;

content = content.replace(fetchTarget, fetchReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Added diagnostic UI.");
