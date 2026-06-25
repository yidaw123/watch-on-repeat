window.NotesMixin = {
  async addNote(isManual = false) {
    if (!this.state.currentVideo) return;
    const text = this.elements.noteInput.value.trim();
    if (!text) return;
    
    let time = 0;
    if (isManual) {
      const manualInput = document.getElementById('manual-note-time');
      if (manualInput && manualInput.value.trim() !== '') {
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
      const index = db[vId].findIndex(n => n.id === noteId);
      if (index !== -1) {
        db[vId].splice(index, 1);
        this.saveDb('notes', db);
        if (this.state.user && window.supabaseClient) {
            supabaseClient.from('notes').delete().eq('id', noteId).then();
        }
        this.renderNotes();
        this.showToast("Note deleted", "trash-2");
      }
    }
  },

  renderNotes() {
    if (!this.state.currentVideo) return;
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    const notes = db[vId] || [];
    
    this.elements.notesList.innerHTML = '';
    
    if (notes.length === 0) {
      this.elements.notesList.appendChild(this.elements.notesEmpty);
      this.elements.notesEmpty.classList.remove('hidden');
      return;
    }
    
    this.elements.notesEmpty.classList.add('hidden');
    
    notes.forEach(note => {
      const m = Math.floor(note.time / 60).toString().padStart(2, '0');
      const s = (note.time % 60).toString().padStart(2, '0');
      const timeStr = `${m}:${s}`;
      const div = document.createElement('div');
      div.className = 'note-item';
      div.innerHTML = `
        <div class="note-header">
          <span class="note-timestamp" onclick="app.seekToTime(${note.time})">[${timeStr}]</span>
          <button class="note-delete" onclick="app.deleteNote('${note.id}')" title="Delete note"><i data-lucide="trash-2"></i></button>
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
      
      if (title === 'Unknown Video' || title === 'Loading title...') {
        title = `Video: ${videoId}`; // Fallback to showing ID so it's not totally unknown
      }

      const div = document.createElement('div');
      div.className = 'note-item';
      div.style = "display: flex; justify-content: space-between; align-items: center; padding: 12px; cursor: pointer; transition: background 0.2s;";
      
      div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.05)';
      div.onmouseout = () => div.style.background = 'var(--surface-color)';
      
      div.onclick = (e) => {
        if (e.target.closest('button')) return;
        app.loadVideo(videoId, platform);
        // Scroll to top to see the player if on mobile
        window.scrollTo({top: 0, behavior: 'smooth'});
      };

      const thumbUrl = this.getThumbnailUrl(platform, videoId);

      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; overflow: hidden;">
          <img src="${thumbUrl}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" alt="thumbnail">
          <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <strong style="color: var(--primary-color); display: block; overflow: hidden; text-overflow: ellipsis;">${this.escapeHtml(title)}</strong>
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
