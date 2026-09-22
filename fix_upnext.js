const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix fetchDiscoverData
const fetchTarget = `  async fetchDiscoverData() {
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

const fetchReplacement = `  async fetchDiscoverData() {
    if (this.state.discoverData !== null) return true; // Already fetched (even if empty)
    
    if (this._isFetchingDiscover) {
      while (this._isFetchingDiscover) await new Promise(r => setTimeout(r, 100));
      return this.state.discoverData !== null;
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
          
        if (error) {
          if (DEBUG_MODE) console.error("Supabase error:", error);
          this.state.discoverError = error.message;
        } else if (data) {
          if (data.length === 0) {
            this.state.discoverData = []; // Successfully fetched 0 rows
          } else {
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
          success = true;
          this.state.discoverError = null;
        }
      } catch (e) {
        if (DEBUG_MODE) console.error("Error fetching discover data", e);
        this.state.discoverError = e.message;
      }
    }
    
    this._isFetchingDiscover = false;
    
    if (!success) {
      // Don't loop infinitely. Just mark as empty to prevent infinite spinners.
      this.state.discoverData = [];
    }
    return true; // We resolve so the UI can update
  }`;

content = content.replace(fetchTarget, fetchReplacement);

// 2. Fix renderUpNextQueue
const renderTarget = `    if (!this.state.discoverData || this.state.discoverData.length === 0) {
      list.innerHTML = \`<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; display: flex; flex-direction: column; gap: 8px; align-items: center;"><i data-lucide="loader" class="spin"></i><span>Loading popular loops...</span></div>\`;
      if (window.lucide) window.lucide.createIcons();
      await this.fetchDiscoverData();
    }

    // If still no data after fetch (e.g. Supabase was slow or errored), keep the spinner visible.
    // The retry timer inside fetchDiscoverData will re-call renderUpNextQueue when data arrives.
    if (!this.state.discoverData || this.state.discoverData.length === 0) {
      return;
    }`;

const renderReplacement = `    if (this.state.discoverData === null) {
      list.innerHTML = \`<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; display: flex; flex-direction: column; gap: 8px; align-items: center;"><i data-lucide="loader" class="spin"></i><span>Loading popular loops...</span></div>\`;
      if (window.lucide) window.lucide.createIcons();
      await this.fetchDiscoverData();
    }
    
    // If there was an error fetching (like missing RLS policies), display a clear fallback
    if (this.state.discoverError) {
      list.innerHTML = \`<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px;">Cannot load popular loops right now.</div>\`;
      return;
    }`;

content = content.replace(renderTarget, renderReplacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed fetch and render bugs.");
