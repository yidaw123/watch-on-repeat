class PlaylistsMixin {
  renderPlaylistsTab() {
    const authRequired = document.getElementById('playlists-auth-required');
    const content = document.getElementById('playlists-content');
    const badge = document.getElementById('playlists-count-badge');
    const list = document.getElementById('playlists-list');

    // --- TRANSIENT SHARED PLAYLIST VIEW ---
    if (this.state.sharedPlaylist) {
      const playlist = this.state.sharedPlaylist;
      if (authRequired) authRequired.classList.add('hidden');
      if (content) content.classList.remove('hidden');
      if (badge) badge.textContent = playlist.videos ? playlist.videos.length : 0;

      const createRow = content.querySelector('div[style*="margin-bottom: 24px"]');
      if (createRow) createRow.style.display = 'none';

      list.innerHTML = `
        <div style="background: rgba(147, 51, 234, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--primary-color);">
          <h3 style="color: var(--primary-color); margin-bottom: 4px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="share-2"></i> Shared: ${this.escapeHtml(playlist.name)}
          </h3>
          <p style="font-size: 13px; color: var(--text-muted);">This is a read-only shared playlist. It is not saved to your account.</p>
          <button class="btn btn-sm btn-outline" style="margin-top: 12px;" onclick="app.exitSharedPlaylist()">Exit Shared View</button>
        </div>
      `;

      if (!playlist.videos || playlist.videos.length === 0) {
        list.innerHTML += '<div class="empty-state"><p>This shared playlist is empty.</p></div>';
        lucide.createIcons();
        return;
      }

      playlist.videos.forEach((v, index) => {
        const card = document.createElement('div');
        card.className = 'yt-playlist-row';
        card.style.cursor = 'pointer';
        card.onclick = () => {
          this.loadVideo(v.videoId || v.id, v.platform);
          this.showToast(`Playing: ${this.escapeHtml(v.title)}`, 'play');
        };

        const thumbUrl = v.thumbnail || this.getThumbnailUrl(v.platform, v.videoId || v.id);
        const isActive = this.state.currentVideo && (this.state.currentVideo.id === (v.videoId || v.id));
        if (isActive) card.classList.add('active');

        card.innerHTML = `
          <div class="yt-playlist-index">
            ${isActive ? '<i data-lucide="play" style="width:14px;height:14px;color:var(--color-primary)"></i>' : (index + 1)}
          </div>
          <div class="yt-playlist-thumb-wrapper">
            <img src="${this.escapeHtml(thumbUrl)}" class="yt-playlist-thumb" alt="${this.escapeHtml(v.title)}">
          </div>
          <div class="yt-playlist-info">
            <div class="yt-playlist-title">${this.escapeHtml(v.title)}</div>
            <div class="yt-playlist-channel">${this.escapeHtml(v.platform)}</div>
          </div>
        `;
        list.appendChild(card);
      });
      lucide.createIcons();
      return;
    }
    // --- END TRANSIENT VIEW ---

    const createRow = content.querySelector('div[style*="margin-bottom: 24px"]');

    if (this.state.viewingPlaylistId) {
      const p = this.getDb('playlists').find(pl => pl.id === this.state.viewingPlaylistId && pl.userId === this.state.user.id);
      if (!p) {
        this.state.viewingPlaylistId = null;
        return this.renderPlaylistsTab();
      }
      if (createRow) createRow.style.display = 'none';
      list.innerHTML = `
        <div class="playlist-header-container">
          <div style="margin-bottom: 16px; display:flex; flex-direction:column; gap:12px; min-width: 0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <button class="btn btn-sm btn-outline" onclick="app.backToPlaylists()"><i data-lucide="arrow-left"></i> Back</button>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary btn-sm" onclick="app.playPlaylist('${this.escapeHtml(p.id)}')" style="white-space: nowrap;"><i data-lucide="play"></i> Play Through</button>
                <button class="btn-icon-delete" onclick="app.deletePlaylist('${this.escapeHtml(p.id)}')" title="Delete Playlist"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; gap: 8px; align-items: center; flex: 1; min-width: 150px;">
                <input type="text" class="search-input" data-target="playlist-videos-container" placeholder="Search videos..." style="flex: 1; min-width: 0;" onkeyup="app.filterTabList(this)">
                <select class="search-input" style="padding: 6px 10px; width: auto; font-size: 13px;" onchange="app.sortPlaylist('${this.escapeHtml(p.id)}', this.value)">
                  <option value="">Sort By...</option>
                  <option value="date">Date Added</option>
                  <option value="alpha">Alphabetical</option>
                </select>
              </div>
              <label style="display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer; user-select:none; font-weight: 500;">
                <input type="checkbox" id="playlist-loop-toggle" style="width: 18px; height: 18px; cursor: pointer; accent-color: #60a5fa;"> 
                <span>Loop Video</span>
              </label>
            </div>
          </div>
          <h2 style="margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            ${this.escapeHtml(p.name)}
            <button class="btn-icon-delete" style="color: var(--text-muted);" title="Rename Playlist" onclick="app.renamePlaylist('${this.escapeHtml(p.id)}')"><i data-lucide="edit-3"></i></button>
          </h2>
        </div>
        <div id="playlist-videos-container" style="display: flex; flex-direction: column; min-width: 0;"></div>
      `;
      
      const vidsContainer = list.querySelector('#playlist-videos-container');
      
      if (!p.videos || p.videos.length === 0) {
        vidsContainer.innerHTML = '<div class="empty-state"><p>This playlist is empty.</p></div>';
        lucide.createIcons();
        return;
      }

      p.videos.forEach((v, index) => {
        const card = document.createElement('div');
        card.className = 'yt-playlist-row';
        card.style.cursor = 'grab';
        card.draggable = true;
        
        card.ondragstart = (e) => {
          this.state.draggedIndex = index;
          e.dataTransfer.effectAllowed = 'move';
          card.style.opacity = '0.5';
        };
        card.ondragend = () => {
          card.style.opacity = '1';
          this.state.draggedIndex = null;
        };
        card.ondragover = (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        };
        card.ondrop = (e) => {
          e.preventDefault();
          if (this.state.draggedIndex === null || this.state.draggedIndex === index) return;
          const playlists = this.getDb('playlists');
          const pl = playlists.find(pll => pll.id === p.id && pll.userId === this.state.user.id);
          const moved = pl.videos.splice(this.state.draggedIndex, 1)[0];
          pl.videos.splice(index, 0, moved);
          pl.updatedAt = new Date().toISOString();
          this.saveDb('playlists', playlists);
          this.renderPlaylistsTab();
        };

        const thumbUrl = v.thumbnail || this.getThumbnailUrl(v.platform, v.videoId || v.id);
        const isActive = this.state.currentVideo && (this.state.currentVideo.id === (v.videoId || v.id));
        if (isActive) card.classList.add('active');

        card.innerHTML = `
          <div class="yt-playlist-index">
            ${isActive ? '<i data-lucide="play" style="width:14px;height:14px;color:var(--color-primary)"></i>' : (index + 1)}
          </div>
          <div class="yt-playlist-thumb-wrapper" onclick="app.loadVideo('${this.escapeHtml(v.videoId || v.id)}', '${this.escapeHtml(v.platform)}')" style="cursor:pointer;">
            <img src="${this.escapeHtml(thumbUrl)}" class="yt-playlist-thumb" alt="${this.escapeHtml(v.title)}">
          </div>
          <div class="yt-playlist-info" onclick="app.loadVideo('${this.escapeHtml(v.videoId || v.id)}', '${this.escapeHtml(v.platform)}')" style="cursor:pointer;">
            <div class="yt-playlist-title">${this.escapeHtml(v.title)}</div>
            <div class="yt-playlist-channel">${this.escapeHtml(v.platform)}</div>
          </div>
          <button class="btn-icon-delete" onclick="app.removeVideoFromPlaylist('${this.escapeHtml(p.id)}', '${this.escapeHtml(v.videoId || v.id)}')" title="Remove Video"><i data-lucide="trash-2"></i></button>
        `;
        vidsContainer.appendChild(card);
      });
      lucide.createIcons();
      return;
    }

    if (createRow) createRow.style.display = 'flex'; // restore
    
    if (!this.state.user) {
      authRequired.classList.remove('hidden');
      content.classList.add('hidden');
      badge.textContent = '0';
      return;
    }

    authRequired.classList.add('hidden');
    content.classList.remove('hidden');
    
    const playlists = this.getDb('playlists').filter(p => p.userId === this.state.user.id);
    
    const sortSelect = document.getElementById('playlist-sort-select');
    const sortVal = sortSelect ? sortSelect.value : 'newest';
    playlists.sort((a, b) => {
      if (sortVal === 'alpha') return (a.name || '').localeCompare(b.name || '');
      if (sortVal === 'recent') return (new Date(b.updatedAt || 0).getTime()) - (new Date(a.updatedAt || 0).getTime());
      // default: newest
      return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
    });

    badge.textContent = playlists.length;
    
    list.className = 'playlist-grid';
    list.innerHTML = '';
    if (playlists.length === 0) {
      list.className = '';
      list.innerHTML = '<div class="empty-state"><h3>No Playlists</h3><p>Create a playlist to organize your learning sessions.</p></div>';
      return;
    }

    const itemsPerPage = 3;
    let currentPage = app.state.pagination.playlists || 1;
    const totalPages = Math.ceil(playlists.length / itemsPerPage) || 1;
    if (currentPage > totalPages) {
      currentPage = totalPages;
      app.state.pagination.playlists = currentPage;
    }
    
    const paginatedPlaylists = playlists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    paginatedPlaylists.forEach(p => {
      const card = document.createElement('div');
      card.className = 'playlist-card-modern';
      card.onclick = (e) => {
        // Prevent clicks on inputs/buttons from doing anything weird
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('label')) return;
      };
      
      const vidsCount = p.videos ? p.videos.length : 0;
      
      let thumbContent = '';
      if (vidsCount > 0) {
        const v = p.videos[0];
        const firstThumb = this.escapeHtml(v.thumbnail || this.getThumbnailUrl(v.platform, v.videoId || v.id));
        thumbContent = `<img class="playlist-thumb-img" src="${firstThumb}" alt="${this.escapeHtml(p.name)}">`;
      } else {
        thumbContent = `
          <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); color:var(--text-muted); gap:8px;">
            <i data-lucide="folder-open" style="width:24px; height:24px; opacity:0.6;"></i>
            <span style="font-size:12px; font-weight:500; opacity:0.6; letter-spacing:0.5px;">Empty</span>
          </div>
        `;
      }

      const isStacked = vidsCount > 1 ? ' stacked' : '';

      card.innerHTML = `
        <div class="playlist-thumb-wrapper${isStacked}" onclick="app.viewPlaylist('${this.escapeHtml(p.id)}')">
          <div class="playlist-thumb-container">
            ${thumbContent}
          </div>
        </div>
        <div class="playlist-card-modern-info">
          <div class="playlist-card-modern-title" onclick="app.viewPlaylist('${this.escapeHtml(p.id)}')">${this.escapeHtml(p.name)}</div>
          <div class="playlist-card-modern-meta">
            ${p.isPublic ? 'Public' : 'Private'} • ${vidsCount} video${vidsCount !== 1 ? 's' : ''}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
            <div style="display:flex; gap:8px;">
              ${p.isPublic ? `<button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="app.copyPlaylistLink('${this.escapeHtml(p.id)}')"><i data-lucide="link" style="width:12px;height:12px;"></i> Share</button>` : ''}
              <label style="display:flex; align-items:center; gap:4px; font-size:12px; cursor:pointer;">
                <input type="checkbox" ${p.isPublic ? 'checked' : ''} onchange="app.togglePlaylistPublic('${this.escapeHtml(p.id)}', this.checked)"> Public
              </label>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn-icon-delete" style="color: var(--text-muted);" onclick="app.renamePlaylist('${this.escapeHtml(p.id)}')" title="Rename Playlist"><i data-lucide="edit-3"></i></button>
              <button class="btn-icon-delete" onclick="app.deletePlaylist('${this.escapeHtml(p.id)}')" title="Delete Playlist"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
    
    // Create a container for the grid and pagination to avoid pagination stretching like a grid item
    const paginationControls = app.renderPaginationControls('playlists', playlists.length, itemsPerPage, currentPage, () => this.renderPlaylistsTab());
    if (paginationControls) {
      // Need to place pagination OUTSIDE the grid, so we append it to the parent (content) after list
      // Or we can just append it to 'list' and make it span full width
      paginationControls.style.gridColumn = "1 / -1";
      list.appendChild(paginationControls);
    }
    
    if (window.lucide) window.lucide.createIcons();
  }

  viewPlaylist(id) {
    this.state.viewingPlaylistId = id;
    this.renderPlaylistsTab();
  }

  backToPlaylists() {
    this.state.viewingPlaylistId = null;
    this.renderPlaylistsTab();
  }

  sortPlaylist(id, criteria) {
    if (!criteria) return;
    const playlists = this.getDb('playlists');
    const p = playlists.find(pl => pl.id === id && pl.userId === this.state.user.id);
    if (!p || !p.videos) return;
    
    if (criteria === 'date') {
      p.videos.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    } else if (criteria === 'alpha') {
      p.videos.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    p.updatedAt = new Date().toISOString();
    this.saveDb('playlists', playlists);
    this.renderPlaylistsTab();
  }

  playPlaylist(id) {
    const loopToggle = document.getElementById('playlist-loop-toggle');
    const isLooping = loopToggle ? loopToggle.checked : false;
    this.state.playlistMode = { active: true, id: id, currentIndex: 0, loopVideo: isLooping };
    const p = this.getDb('playlists').find(pl => pl.id === id);
    if (!p || !p.videos || p.videos.length === 0) {
      this.showToast("Playlist is empty", "alert-circle");
      return;
    }
    const v = p.videos[0];
    this.showToast(`Starting Playlist: ${this.escapeHtml(p.name)}`, 'play');
    this.loadVideo(v.videoId || v.id, v.platform);
  }

  async renamePlaylist(id) {
    const playlists = this.getDb('playlists');
    const p = playlists.find(pl => pl.id === id && pl.userId === this.state.user.id);
    if (!p) return;
    
    const newName = await window.app.showCustomPrompt({
      title: 'Rename Playlist',
      message: 'Enter a new name for the playlist:',
      defaultValue: p.name,
      okText: 'Rename'
    });
    
    if (newName !== null && newName.trim() !== '') {
      p.name = newName.trim();
      p.updatedAt = new Date().toISOString();
      this.saveDb('playlists', playlists);
      
      if (window.supabaseClient && this.state.user) {
        window.supabaseClient.from('playlists').update({ name: p.name })
          .eq('id', id)
          .eq('user_id', this.state.user.id)
          .then(({ error }) => {
            if (error && typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.error("Failed to rename playlist in cloud:", error);
          });
      }
      
      this.renderPlaylistsTab();
      this.showToast("Playlist renamed", "check-circle");
    }
  }

  async deletePlaylist(id) {
    const confirmed = await window.app.showCustomConfirm({
      title: 'Delete Playlist',
      message: 'Are you sure you want to delete this playlist?',
      isDestructive: true,
      okText: 'Delete'
    });
    if (!confirmed) return;
    const playlists = this.getDb('playlists');
    const filtered = playlists.filter(p => !(p.id === id && p.userId === this.state.user.id));
    this.saveDb('playlists', filtered);
    
    // Explicitly delete from Supabase so it's not orphaned
    if (window.supabaseClient && this.state.user) {
      window.supabaseClient.from('playlists').delete()
        .eq('id', id)
        .eq('user_id', this.state.user.id)
        .then(({ error }) => {
          if (error && typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) {
            console.error("Failed to wipe playlist from cloud:", error);
          }
        });
    }

    this.renderPlaylistsTab();
    this.showToast("Playlist deleted", "trash-2");
  }

  removeVideoFromPlaylist(playlistId, videoId) {
    const playlists = this.getDb('playlists');
    const p = playlists.find(pl => pl.id === playlistId && pl.userId === this.state.user.id);
    if (!p || !p.videos) return;
    p.videos = p.videos.filter(v => (v.videoId || v.id) !== videoId);
    p.updatedAt = new Date().toISOString();
    this.saveDb('playlists', playlists);
    this.renderPlaylistsTab();
    this.showToast("Video removed from playlist", "check");
  }

  togglePlaylistPublic(id, isPublic) {
    if (!this.state.user || !this.state.user.isPremium) {
      this.openUpgradeModal("Sharing public playlists is a Pro feature! Upgrade to share your playlists with the world.");
      this.renderPlaylistsTab(); // Reset checkbox UI
      return;
    }
    const playlists = this.getDb('playlists');
    const index = playlists.findIndex(p => p.id === id && p.userId === this.state.user.id);
    if (index !== -1) {
      playlists[index].isPublic = isPublic;
      playlists[index].updatedAt = new Date().toISOString();
      this.saveDb('playlists', playlists);
      this.renderPlaylistsTab();
      if (isPublic) this.showToast("Playlist is now public!", "globe");
      else this.showToast("Playlist is now private", "lock");
    }
  }

  copyPlaylistLink(id) {
    const url = new URL(window.location.href);
    url.search = '?playlist=' + id;
    navigator.clipboard.writeText(url.toString());
    this.showToast("Copied share link!", "check");
  }

  async fetchSharedPlaylist(playlistId) {
    if (!window.supabaseClient) {
      this.showToast("Cannot load shared playlist without database connection.", "alert-triangle");
      this.loadHome();
      return;
    }

    try {
      this.showToast("Loading shared playlist...", "loader");
      const { data, error } = await supabaseClient.from('playlists').select('*').eq('id', playlistId).single();

      if (error || !data) {
        this.showToast("Playlist not found or is private.", "alert-triangle");
        this.loadHome();
        return;
      }

      this.state.sharedPlaylist = data;
      this.switchTab('playlists');
      
      // Auto-play the first video
      if (data.videos && data.videos.length > 0) {
        const firstVid = data.videos[0];
        this.loadVideo(firstVid.videoId || firstVid.id, firstVid.platform);
      }
    } catch (e) {
      if (DEBUG_MODE) console.error(e);
      this.loadHome();
    }
  }

  exitSharedPlaylist() {
    this.state.sharedPlaylist = null;
    const url = new URL(window.location);
    url.searchParams.delete('playlist');
    window.history.pushState({}, '', url);
    this.renderPlaylistsTab();
  }

  createPlaylist() {
    if (!this.state.user) {
      this.openLoginModal();
      return;
    }

    const input = document.getElementById('new-playlist-input');
    const name = input.value.trim();
    if (!name) return;

    const playlists = this.getDb('playlists');
    const userPlaylists = playlists.filter(p => p.userId === this.state.user.id);

    // Free limit: 5 playlists
    const tier = this.state.user.tier || 'free';
    if (tier === 'free' && userPlaylists.length >= 5) {
      this.openUpgradeModal("Free users can create up to 5 playlists. Upgrade to Premium for unlimited playlists!");
      return;
    }

    playlists.push({
      id: 'pl_' + Date.now(),
      userId: this.state.user.id,
      name: name,
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.saveDb('playlists', playlists);
    input.value = '';
    this.renderPlaylistsTab();
    this.showToast("Playlist created!", "check-circle");
  }

  openPlaylistModal() {
    if (!this.state.user) {
      this.openLoginModal();
      return;
    }
    if (!this.state.currentVideo) return;
    
    const modal = document.getElementById('playlist-modal');
    const list = document.getElementById('playlist-select-list');
    
    const form = document.getElementById('create-playlist-form');
    const createBtn = document.getElementById('show-create-playlist-btn');
    if (form && createBtn) {
      form.classList.add('hidden');
      createBtn.classList.remove('hidden');
    }
    if (!modal || !list) return;
    
    const playlists = this.getDb('playlists').filter(p => p.userId === this.state.user.id);
    
    list.innerHTML = '';
    if (playlists.length === 0) {
      list.innerHTML = '<p class="text-sm text-gray-400">You don\'t have any playlists yet. Create one in the Playlists tab.</p>';
    } else {
      playlists.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline';
        btn.style.justifyContent = 'flex-start';
        btn.innerHTML = `<i data-lucide="list"></i> <span style="flex: 1; text-align: left;">${this.escapeHtml(p.name)}</span> <span class="text-xs text-gray-500 ml-auto">${p.videos ? p.videos.length : 0} vids</span>`;
        btn.onclick = () => this.addVideoToPlaylist(p.id);
        list.appendChild(btn);
      });
    }
    
    lucide.createIcons();
    modal.classList.remove('hidden');
  }

  createNewPlaylistFromModal() {
    if (!this.state.user) {
      this.openLoginModal();
      return;
    }
    
    const input = document.getElementById('new-playlist-name');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    const playlists = this.getDb('playlists');
    const userPlaylists = playlists.filter(p => p.userId === this.state.user.id);

    // Free limit: 5 playlists
    const tier = this.state.user.tier || 'free';
    if (tier === 'free' && userPlaylists.length >= 5) {
      this.closePlaylistModal();
      this.openUpgradeModal("Free users can create up to 5 playlists. Upgrade to Premium for unlimited playlists!");
      return;
    }

    const newPlaylist = {
      id: 'pl_' + Date.now(),
      userId: this.state.user.id,
      name: name,
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    playlists.push(newPlaylist);

    this.saveDb('playlists', playlists);
    input.value = '';
    
    // Hide form, show button
    const form = document.getElementById('create-playlist-form');
    const btn = document.getElementById('show-create-playlist-btn');
    if (form) form.classList.add('hidden');
    if (btn) btn.classList.remove('hidden');

    this.addVideoToPlaylist(newPlaylist.id);
  }

  closePlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    if (modal) modal.classList.add('hidden');
  }

  addVideoToPlaylist(playlistId) {
    const playlists = this.getDb('playlists');
    const userPlaylists = playlists.filter(p => p.userId === this.state.user.id);
    const tier = this.state.user.tier || 'free';
    
    // Check for downgraded user freeze
    if (tier === 'free' && userPlaylists.length > 5) {
      this.closePlaylistModal();
      this.openUpgradeModal("Your account has exceeded the Free tier limit of 5 playlists. Please upgrade to Pro to modify your frozen playlists.");
      return;
    }

    const pIndex = playlists.findIndex(p => p.id === playlistId && p.userId === this.state.user.id);
    if (pIndex === -1) return;
    
    const playlist = playlists[pIndex];
    if (!playlist.videos) playlist.videos = [];
    
    // Enforce 50 vids limit
    if (tier === 'free' && playlist.videos.length >= 50) {
      this.closePlaylistModal();
      this.openUpgradeModal("Free users can only add up to 50 videos per playlist. Upgrade to Premium for unlimited videos!");
      return;
    }
    
    const videoObj = {
      videoId: this.state.currentVideo.id,
      platform: this.state.currentVideo.platform,
      title: this.state.currentVideo.title,
      addedAt: Date.now()
    };
    
    if (!playlist.videos.find(v => v.videoId === videoObj.videoId && v.platform === videoObj.platform)) {
      playlist.videos.push(videoObj);
      playlist.updatedAt = new Date().toISOString();
      this.saveDb('playlists', playlists);
      this.showToast(`Added to ${this.escapeHtml(playlist.name)}!`, 'check');
    } else {
      this.showToast(`Already in ${this.escapeHtml(playlist.name)}!`, 'info');
    }
    
    this.closePlaylistModal();
    if (this.state.activeTab === 'playlists') this.renderPlaylistsTab();
  }

}
window.PlaylistsMixin = PlaylistsMixin;
