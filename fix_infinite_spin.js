const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `  async fetchDiscoverData() {
    if (this.state.discoverData && this.state.discoverData.length > 0) return true;
    if (this._isFetchingDiscover) {
      while (this._isFetchingDiscover) await new Promise(r => setTimeout(r, 100));
      return this.state.discoverData !== null && this.state.discoverData.length > 0;
    }
    
    this._isFetchingDiscover = true;
    let success = false;
    
    if (window.supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('global_stats')
          .select('*')
          .neq('platform', 'local')
          .order('global_loops', { ascending: false })
          .limit(20);
          
        if (!error && data && data.length > 0) {
          let shuffledData = data.sort(() => 0.5 - Math.random());
          this.state.discoverData = shuffledData.slice(0, 15).map((d) => {
            let title = d.video_title;
            if (!title || title.includes('(Private or Unavailable)') || (d.platform && title === \`\${d.platform.charAt(0).toUpperCase() + d.platform.slice(1)} Video\`)) {
              title = \`Trending \${d.platform || 'video'}\`;
            }
            return {
              videoId: d.video_id,
              platform: d.platform,
              title: title,
              globalLoops: d.global_loops
            };
          });
          success = true;
        }
      } catch (e) {
        if (DEBUG_MODE) console.error("Error fetching discover data", e);
      }
    }
    
    this._isFetchingDiscover = false;
    
    if (!success) {
      this.state.discoverData = [];
      if (this._retryDiscoverTimer) clearTimeout(this._retryDiscoverTimer);
      this._retryDiscoverTimer = setTimeout(() => {
        this.state.discoverData = null;
        this.fetchDiscoverData().then(ok => {
          if (ok) {
            // Always re-render the sidebar (even on home screen where currentVideo is null)
            const vidId = this.state.currentVideo ? this.state.currentVideo.id : null;
            this.renderUpNextQueue(vidId);
            this.renderDiscoverTab();
          }
        });
      }, 3000);
    }
    return success;
  }`;

const replacement = `  async fetchDiscoverData() {
    // If it's already an array (even empty), we successfully fetched it
    if (this.state.discoverData !== null) return true;
    
    if (this._isFetchingDiscover) {
      while (this._isFetchingDiscover) await new Promise(r => setTimeout(r, 100));
      return this.state.discoverData !== null;
    }
    
    this._isFetchingDiscover = true;
    
    if (window.supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('global_stats')
          .select('*')
          .neq('platform', 'local')
          .order('global_loops', { ascending: false })
          .limit(20);
          
        if (error) {
          this.state.discoverError = error.message;
          if (DEBUG_MODE) console.error("Supabase Error:", error);
        } else if (data) {
          this.state.discoverError = null;
          let shuffledData = data.sort(() => 0.5 - Math.random());
          this.state.discoverData = shuffledData.slice(0, 15).map((d) => {
            let title = d.video_title;
            if (!title || title.includes('(Private or Unavailable)') || (d.platform && title === \`\${d.platform.charAt(0).toUpperCase() + d.platform.slice(1)} Video\`)) {
              title = \`Trending \${d.platform || 'video'}\`;
            }
            return {
              videoId: d.video_id,
              platform: d.platform,
              title: title,
              globalLoops: d.global_loops
            };
          });
        }
      } catch (e) {
        this.state.discoverError = e.message || "Unknown error";
        if (DEBUG_MODE) console.error("Error fetching discover data", e);
      }
    } else {
      this.state.discoverError = "Supabase client not initialized";
    }
    
    this._isFetchingDiscover = false;
    
    // If we failed to set discoverData due to an error, we mark it empty to stop infinite retries,
    // and rely on discoverError to show the fallback UI.
    if (this.state.discoverData === null) {
      this.state.discoverData = [];
    }
    
    return true;
  }`;
  
content = content.replace(target, replacement);

const target2 = `    // If still no data after fetch (e.g. Supabase was slow or errored), keep the spinner visible.
    // The retry timer inside fetchDiscoverData will re-call renderUpNextQueue when data arrives.
    if (!this.state.discoverData || this.state.discoverData.length === 0) {
      return;
    }`;

const replacement2 = `    // If we hit an error, show the error state
    if (this.state.discoverError) {
      list.innerHTML = \`<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px;">\${this.escapeHtml(this.state.discoverError) === "Supabase client not initialized" ? "Connecting to database..." : "No popular loops available right now."}</div>\`;
      return;
    }

    if (!this.state.discoverData || this.state.discoverData.length === 0) {
      list.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px;">No popular loops available right now.</div>';
      return;
    }`;

content = content.replace(target2, replacement2);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed infinite spinner");
