window.NotesMixin = {
  syncNotesToCloud(vId, notesArray) {
    if (!this.state.user || !window.supabaseClient || !this.state.currentVideo) return;
    
    // vId is formatted as platform_videoId, but we need raw videoId and platform for user_history
    const platform = this.state.currentPlatform;
    const videoId = this.state.currentVideo.id;
    
    supabaseClient.from('user_history').upsert({
      user_id: this.state.user.id,
      video_id: videoId,
      platform: platform,
      title: this.state.currentVideo.title || '',
      notes_data: notesArray,
      last_played: new Date().toISOString()
    }, { onConflict: 'user_id, video_id, platform' }).then(({ error }) => {
      if (error && DEBUG_MODE) console.error("Notes Data Sync Error:", error);
    });
  },

  async addNote(isManual = false) {
    if (!this.state.currentVideo) return;
    let text = this.elements.noteInput.value.trim();
    if (!text) {
      text = "Bookmark"; // Allow empty notes as bookmarks
    }
    
    let time = 0;
    if (isManual) {
      const manualInput = document.getElementById('manual-note-time');
      if (manualInput && manualInput._cascadingTime) {
        time = manualInput._cascadingTime.getValue();
        if (time === 0 && manualInput.value.includes('H')) {
          this.showToast("Please enter a valid timestamp", "alert-circle");
          return;
        }
      } else if (manualInput && manualInput.value.trim() !== '') {
        time = this.parseTime(manualInput.value.trim());
      } else {
        this.showToast("Please enter a valid timestamp", "alert-circle");
        return;
      }
    } else {
      time = await this.getCurrentTime();
    }
    
    const notes = this.getDb('notes');
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    if (!notes[vId]) notes[vId] = [];
    
    const noteObj = {
      id: Date.now().toString(),
      time: Math.floor(time),
      text: text
    };
    
    // Enforce Notes Limit for Free tier
    const tier = this.state.user ? this.state.user.tier : 'free';
    if (tier === 'free') {
      // 2. Max 5 videos with notes
      const uniqueVideos = Object.keys(notes).filter(k => k !== '__titles');
      if (!notes[vId] && uniqueVideos.length >= 5) {
        this.openUpgradeModal("Free accounts can only add notes to 5 videos total. Upgrade to keep adding notes!");
        return;
      }
      
      // 1. Max 3 notes per video
      const currentVideoNotes = notes[vId] || [];
      if (currentVideoNotes.length >= 3) {
        this.openUpgradeModal("Free accounts are limited to 3 notes per video. Upgrade for unlimited notes!");
        return;
      }
    }

    if (!notes.__titles) notes.__titles = {};
    notes.__titles[vId] = this.state.currentVideo.title;

    if (!notes[vId]) notes[vId] = [];
    notes[vId].push(noteObj);
    notes[vId].sort((a,b) => a.time - b.time);
    
    this.saveDb('notes', notes);
    this.syncNotesToCloud(vId, notes[vId]);
    this.elements.noteInput.value = ''; // Clear input for the next note
    this.renderNotes();
    this.showToast(`Note added at ${this.formatTime(Math.floor(time))}!`, "edit-3");

    if (!this.state.user && !this.state.guestPromptShown) {
      this.state.guestPromptShown = true;
      setTimeout(() => {
        this.showToast("Loving the features? Create a free account to save your loops, notes, and playlists so you never lose them!", "heart");
      }, 2000);
    }
  },

  deleteNote(noteId) {
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    if (db[vId]) {
      const index = db[vId].findIndex(n => n.id && n.id.toString() === noteId.toString());
      if (index !== -1) {
        db[vId].splice(index, 1);
        this.saveDb('notes', db);
        this.syncNotesToCloud(vId, db[vId]);
        this.renderNotes();
        this.showToast("Note deleted", "trash-2");
      }
    }
  },

  deleteAllNotes() {
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    if (db[vId] && db[vId].length > 0) {
      if (!confirm("Are you sure you want to delete all notes for this video?")) return;
      db[vId] = [];
      this.saveDb('notes', db);
      this.syncNotesToCloud(vId, db[vId]);
      this.renderNotes();
      if (this.showToast) this.showToast("All notes deleted", "trash-2");
    }
  },

  renderNotes() {
    if (!this.state.currentVideo) return;
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    const notes = db[vId] || [];
    
    const isReadOnly = this.state.isReadOnlyShared;
    const noteInput = document.getElementById('note-input');
    const addNoteBtn = document.querySelector('button[onclick="app.addNote()"]');
    const clearNotesBtn = document.querySelector('button[onclick="app.clearVideoNotes()"]');
    
    if (noteInput) {
      if (isReadOnly) {
        noteInput.disabled = false;
        noteInput.readOnly = true;
        noteInput.placeholder = "Viewing Shared Link (Read-Only)";
        noteInput.onclick = () => app.openUpgradeModal("Upgrade to add or edit notes on shared links!");
      } else {
        noteInput.disabled = false;
        noteInput.readOnly = false;
        noteInput.placeholder = "Type a note here...";
        noteInput.onclick = null;
      }
    }
    if (addNoteBtn) {
       addNoteBtn.disabled = isReadOnly;
       addNoteBtn.style.opacity = isReadOnly ? '0.5' : '1';
       addNoteBtn.style.cursor = isReadOnly ? 'not-allowed' : 'pointer';
    }
    if (clearNotesBtn) {
       clearNotesBtn.disabled = isReadOnly;
       clearNotesBtn.style.opacity = isReadOnly ? '0.5' : '1';
       clearNotesBtn.style.cursor = isReadOnly ? 'not-allowed' : 'pointer';
    }
    
    this.elements.notesList.innerHTML = '';
    
    const deleteAllNotesBtn = document.getElementById('delete-all-notes-btn');
    if (notes.length === 0) {
      this.elements.notesList.appendChild(this.elements.notesEmpty);
      this.elements.notesEmpty.classList.remove('hidden');
      if (deleteAllNotesBtn) deleteAllNotesBtn.classList.add('hidden');
    } else {
      this.elements.notesEmpty.classList.add('hidden');
      if (deleteAllNotesBtn) {
        if (isReadOnly) deleteAllNotesBtn.classList.add('hidden');
        else deleteAllNotesBtn.classList.remove('hidden');
      }
    }
    
    notes.forEach(note => {
      const m = Math.floor(note.time / 60).toString().padStart(2, '0');
      const s = (note.time % 60).toString().padStart(2, '0');
      const timeStr = `${m}:${s}`;
      const div = document.createElement('div');
      div.className = 'note-item';
      const isReadOnly = this.state.isReadOnlyShared;
      div.innerHTML = `
        <div class="note-header">
          <span class="note-timestamp" onclick="app.seekToTime(${note.time})">[${timeStr}]</span>
          ${isReadOnly ? '' : `<button class="note-delete" onclick="app.deleteNote('${note.id}')" title="Delete note"><i data-lucide="trash-2"></i></button>`}
        </div>
        <div class="note-content">${this.escapeHtml(note.text)}</div>
      `;
      this.elements.notesList.appendChild(div);
    });
    
    this.renderNoteMarkers();
    this.renderActiveNotesSummary(db, vId);
  },

  renderActiveNotesSummary(db, currentVId) {
    const listEl = document.getElementById('active-notes-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    const uniqueVideos = Object.keys(db).filter(k => k !== '__titles');
    if (uniqueVideos.length === 0) {
      listEl.innerHTML = '<div class="empty-state-list"><i data-lucide="file-text"></i><p>No active notes for any videos.</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    uniqueVideos.forEach(id => {
      let title = (db.__titles && db.__titles[id]) ? db.__titles[id] : 'Unknown Video';
      const noteCount = db[id].length;
      
      const parts = id.split('_');
      const platform = parts[0];
      const videoId = parts.slice(1).join('_');
      
      if (title === 'Unknown Video' || title === 'Loading title...' || title.startsWith('Video: ')) {
        const history = this.getDb('history') || [];
        const hItem = history.find(h => h.videoId === videoId && h.platform === platform);
        if (hItem && hItem.title && hItem.title !== 'Loading title...') {
          title = hItem.title;
          // Optionally save it back to notes db so we don't have to look it up next time
          if (!db.__titles) db.__titles = {};
          db.__titles[id] = title;
          this.saveDb('notes', db);
        } else {
          title = `Video: ${videoId}`; // Fallback to showing ID so it's not totally unknown
        }
      }

      const div = document.createElement('div');
      div.className = 'note-item';
      div.style = "display: flex; justify-content: space-between; align-items: center; padding: 12px; transition: background 0.2s;";
      
      div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.05)';
      div.onmouseout = () => div.style.background = 'var(--surface-color)';
      
      const thumbUrl = this.getThumbnailUrl(platform, videoId);
      
      let appUrl = '?url=';
      if (platform === 'youtube') appUrl += encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
      else if (platform === 'vimeo') appUrl += encodeURIComponent(`https://vimeo.com/${videoId}`);
      else if (platform === 'dailymotion') appUrl += encodeURIComponent(`https://www.dailymotion.com/video/${videoId}`);
      else if (platform === 'soundcloud') appUrl += encodeURIComponent(`https://soundcloud.com/${videoId}`);

      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; overflow: hidden;">
          <img src="${thumbUrl}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; flex-shrink: 0; cursor: pointer;" alt="thumbnail" onclick="app.loadVideo('${videoId}', '${platform}'); window.scrollTo({top: 0, behavior: 'smooth'});">
          <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <a href="${appUrl}" onclick="event.preventDefault(); app.loadVideo('${videoId}', '${platform}'); window.scrollTo({top: 0, behavior: 'smooth'});" style="color: var(--primary-color); display: block; overflow: hidden; text-overflow: ellipsis; font-weight: 500; text-decoration: none;">${this.escapeHtml(title)}</a>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${noteCount} saved note${noteCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <button class="icon-btn text-red-500" onclick="app.clearNotesForVideo('${id}')" title="Clear all notes for this video" style="padding: 4px; margin-left: 8px; flex-shrink: 0;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      `;
      listEl.appendChild(div);
    });
    
    if (window.lucide) window.lucide.createIcons();
  },

  clearNotesForVideo(vId) {
    const db = this.getDb('notes');
    if (db[vId]) {
      delete db[vId];
      if (db.__titles && db.__titles[vId]) delete db.__titles[vId];
      this.saveDb('notes', db);
      this.renderNotes();
      this.showToast("Notes cleared for video", "trash-2");
    }
  },

  toggleNoteMarkers(e) {
    this.state.showNoteMarkers = e.target.checked;
    this.renderNoteMarkers();
  },

  renderNoteMarkers() {
    const container = document.getElementById('timeline-markers');
    if (!container) return;
    
    container.innerHTML = '';
    
    // If toggled off or no duration, don't show markers
    if (this.state.showNoteMarkers === false || !this.state.currentVideoDuration) {
      return;
    }
    
    const vId = this.state.currentVideo ? `${this.state.currentPlatform}_${this.state.currentVideo.id}` : null;
    if (!vId) return;
    
    const db = this.getDb('notes');
    const notes = db[vId] || [];
    
    notes.forEach(note => {
      const pct = (note.time / this.state.currentVideoDuration) * 100;
      if (pct >= 0 && pct <= 100) {
        const marker = document.createElement('div');
        marker.className = 'timeline-marker tooltip';
        marker.style.left = `${pct}%`;
        marker.setAttribute('data-tip', note.text);
        
        // Clicking marker seeks to note
        marker.onclick = (e) => {
          e.stopPropagation(); // prevent dragging timeline
          this.seekToTime(note.time);
        };
        
        container.appendChild(marker);
      }
    });
  }
};
