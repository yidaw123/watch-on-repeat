class DatabaseMixin {
  // LOCALSTORAGE DATABASE
  // ==========================================
  
  initDatabase() {
    if (!localStorage.getItem('wor_users')) {
      localStorage.setItem('wor_users', JSON.stringify([]));
    }
    if (!localStorage.getItem('wor_favorites')) {
      localStorage.setItem('wor_favorites', JSON.stringify([]));
    }
    if (!localStorage.getItem('wor_history')) {
      localStorage.setItem('wor_history', JSON.stringify([]));
    }
    if (!localStorage.getItem('wor_notes')) {
      localStorage.setItem('wor_notes', JSON.stringify({}));
    }
    if (!localStorage.getItem('wor_analytics')) {
      localStorage.setItem('wor_analytics', JSON.stringify({
        totalTime: 0,
        weeklyTime: {},
        segments: {}
      }));
    }
    if (!localStorage.getItem('wor_instances')) {
      localStorage.setItem('wor_instances', JSON.stringify({}));
    }
    
    // Global stats are now fetched exclusively from Supabase

    // Session is handled by Supabase
  }

  getDb(key) {
    const defaultVal = (key === 'shortcuts' || key === 'analytics' || key === 'notes') ? '{}' : '[]';
    let parsed = JSON.parse(localStorage.getItem('wor_' + key) || defaultVal);
    if ((key === 'shortcuts' || key === 'analytics' || key === 'notes') && Array.isArray(parsed)) {
      parsed = {};
    }
    return parsed;
  }

  saveDb(key, data) {
    localStorage.setItem('wor_' + key, JSON.stringify(data));
    this.pushToSupabase(key, data);
  }

  async syncFromSupabase() {
    if (!this.state.user || !window.supabaseClient) return;
    
    try {
      const { data: playlists } = await supabaseClient.from('playlists').select('*').eq('user_id', this.state.user.id);
      if (playlists) {
        const localPlaylists = playlists.map(p => ({
          id: p.id, userId: p.user_id, name: p.name, videos: p.videos, isPublic: p.is_public,
          createdAt: p.created_at, updatedAt: p.updated_at
        }));
        localStorage.setItem('wor_playlists', JSON.stringify(localPlaylists));
      }
      
      const { data: notes, error: notesError } = await supabaseClient.from('notes').select('*').eq('user_id', this.state.user.id);
      if (notesError) {
        console.error("Notes sync error:", notesError);
      } else if (notes) {
        const cloudNotes = {};
        notes.forEach(n => {
          const vId = `${n.platform}_${n.video_id}`;
          if (!cloudNotes[vId]) cloudNotes[vId] = [];
          cloudNotes[vId].push({
            id: n.id, userId: n.user_id, text: n.text, transcript: n.transcript || null,
            time: n.timestamp, timestamp: n.timestamp, timestampFormatted: n.timestamp_formatted
          });
        });
        // Merge: cloud notes take priority, but preserve local __titles
        const existingNotes = JSON.parse(localStorage.getItem('wor_notes') || '{}');
        if (existingNotes.__titles) cloudNotes.__titles = existingNotes.__titles;
        localStorage.setItem('wor_notes', JSON.stringify(cloudNotes));
      }
      // If notes is empty/null, do NOT overwrite local notes — they may just not have synced yet
      
      const { data: settings } = await supabaseClient.from('user_settings').select('*').eq('user_id', this.state.user.id).single();
      if (settings) {
        localStorage.setItem('wor_shortcuts', JSON.stringify(settings.shortcuts || {}));
        localStorage.setItem('wor_analytics', JSON.stringify(settings.analytics || {"totalTime":0,"segments":{}}));
      }

      const { data: instances } = await supabaseClient.from('video_instances').select('*').eq('user_id', this.state.user.id);
      if (instances) {
        const localInstances = JSON.parse(localStorage.getItem('wor_instances') || '{}');
        instances.forEach(inst => {
          localInstances[inst.id] = {
            id: inst.id,
            videoId: inst.video_id,
            platform: inst.platform,
            title: inst.title,
            settings: inst.settings,
            userId: inst.user_id,
            createdAt: inst.created_at,
            updatedAt: inst.updated_at
          };
        });
        localStorage.setItem('wor_instances', JSON.stringify(localInstances));
      }

      const { data: fullHistory } = await supabaseClient.from('user_history').select('*').eq('user_id', this.state.user.id);
      if (fullHistory) {
        const localHistory = fullHistory.map(h => ({
          videoId: h.video_id, platform: h.platform, title: h.title,
          userId: h.user_id, loopsCount: h.loops_count, lastPlayed: h.last_played,
          timestamp: new Date(h.last_played).getTime()
        }));
        
        const existingHistory = JSON.parse(localStorage.getItem('wor_history') || '[]');
        const otherUsersHistory = existingHistory.filter(h => h.userId !== this.state.user.id);
        localStorage.setItem('wor_history', JSON.stringify([...otherUsersHistory, ...localHistory]));
        
        // Also sync any saved_loop_data (A-B timestamps) attached to their history
        const savedLoops = JSON.parse(localStorage.getItem('wor_saved_loops') || '{}');
        let loopsUpdated = false;
        fullHistory.forEach(h => {
          if (h.saved_loop_data) {
            savedLoops[h.video_id] = h.saved_loop_data;
            loopsUpdated = true;
          }
        });
        if (loopsUpdated) {
          localStorage.setItem('wor_saved_loops', JSON.stringify(savedLoops));
          // If the currently playing video got synced, reload its timestamps!
          if (this.state.currentVideo && savedLoops[this.state.currentVideo.id]) {
            this.loadLoopData(this.state.currentVideo.id);
          }
        }

        const localFavs = fullHistory.filter(h => h.is_favorite).map(h => ({
          id: 'fav_' + h.video_id, userId: h.user_id, videoId: h.video_id,
          platform: h.platform, title: h.title, timestamp: h.last_played
        }));
        localStorage.setItem('wor_favorites', JSON.stringify(localFavs));
      }
      
      if (this.state.activeTab === 'playlists') this.renderPlaylistsTab();
      if (this.state.activeTab === 'notes') this.renderNotes();
      this.updateFavoriteButtonUI();
    } catch (err) {
      console.error("Error syncing from Supabase:", err);
    }
  }

  async pushToSupabase(key, data) {
    if (!this.state.user || !window.supabaseClient) return;
    try {
      if (key === 'playlists') {
        const userPlaylists = data.filter(p => p.userId === this.state.user.id);
        for (const p of userPlaylists) {
          const { error } = await supabaseClient.from('playlists').upsert({
            id: p.id, user_id: p.userId, name: p.name, videos: p.videos, is_public: p.isPublic || false,
            updated_at: p.updatedAt || new Date().toISOString()
          });
          if (error && (error.code === '42501' || error.message.includes('row-level security'))) {
             this.openUpgradeModal("Free tier limit: Max 5 playlists. Please upgrade to Pro for unlimited playlists.");
             await this.syncFromSupabase(); // Rollback local changes from server
          } else if (error) {
             console.error("Playlist upsert failed:", error);
          }
        }
      } else if (key === 'notes') {
          const userNotes = [];
          for (const vId in data) {
             if (vId === '__titles') continue;
             data[vId].forEach(n => {
               const parts = vId.split('_');
               if (!n.userId || n.userId === this.state.user.id) {
                 userNotes.push({
                   id: n.id, user_id: this.state.user.id, video_id: parts.slice(1).join('_'), platform: parts[0],
                   text: n.text, transcript: n.transcript || null, timestamp: n.time !== undefined ? n.time : (n.timestamp || 0), timestamp_formatted: n.timestampFormatted || n.timestamp_formatted || '0:00'
                 });
               }
             });
          }
          for (const note of userNotes) {
            const { error } = await supabaseClient.from('notes').upsert(note);
            if (error && (error.code === '42501' || error.message.includes('row-level security'))) {
               this.openUpgradeModal("Free tier limit: Notes can only be added to 5 videos. Please upgrade to Pro.");
               await this.syncFromSupabase(); // Rollback local changes from server
            } else if (error) {
               console.error("Note upsert failed:", error, "Note:", note);
            }
          }
      } else if (key === 'shortcuts') {
        await supabaseClient.from('user_settings').upsert({ user_id: this.state.user.id, shortcuts: data });
      } else if (key === 'analytics') {
        await supabaseClient.from('user_settings').upsert({ user_id: this.state.user.id, analytics: data });
      } else if (key === 'instances') {
        const instancesToPush = [];
        for (const uuid in data) {
          const inst = data[uuid];
          if (!inst.userId || inst.userId === this.state.user.id) {
            instancesToPush.push({
              id: inst.id,
              user_id: this.state.user.id,
              video_id: inst.videoId,
              platform: inst.platform,
              title: inst.title,
              settings: inst.settings,
              updated_at: inst.updatedAt || new Date().toISOString()
            });
          }
        }
        for (const inst of instancesToPush) {
          const { error } = await supabaseClient.from('video_instances').upsert(inst);
          if (error) console.error("Instance upsert failed:", error);
        }
      }
    } catch (e) {
      console.error("Push error:", e);
    }
  }

  // ==========================================
  // EVENT LISTENERS & SDKs
  // ==========================================

  setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (this.elements.userMenu && !this.elements.userMenu.classList.contains('hidden')) {
        this.elements.userMenu.classList.add('hidden');
      }
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      this.handleRouting();
    });
  }
}
window.DatabaseMixin = DatabaseMixin;
