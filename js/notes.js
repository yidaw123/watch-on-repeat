class NotesMixin {
  syncNotesToCloud(vId, notesArray) {
    if (!this.state.user || !window.supabaseClient || !this.state.currentVideo) return;
    
    // Check if vId is a base video (e.g. youtube_abc123) or a session UUID
    const isBaseVideo = vId.includes('_') && ['youtube', 'vimeo', 'dailymotion', 'soundcloud', 'twitch', 'facebook', 'mixcloud', 'wistia'].includes(vId.split('_')[0]);
    
    if (isBaseVideo) {
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
        if (error && typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.error("Notes Data Sync Error:", error);
      });
    } else {
      // It's a session UUID! We need to update the session in wor_instances and trigger a cloud sync for instances.
      try {
        const localInstances = JSON.parse(localStorage.getItem('wor_instances') || '{}');
        if (localInstances[vId]) {
          if (!localInstances[vId].settings) localInstances[vId].settings = {};
          localInstances[vId].settings.notes = notesArray;
          localInstances[vId].updatedAt = new Date().toISOString();
          localStorage.setItem('wor_instances', JSON.stringify(localInstances));
          
          if (typeof app !== 'undefined' && app.syncToSupabase) {
            app.syncToSupabase('instances'); // Pushes the updated instance to the video_instances table
          }
        }
      } catch (e) {
        if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.error("Failed to sync session notes:", e);
      }
    }
  }

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
    
    // Clamp time to video duration to prevent UI markers flying off the timeline
    if (this.state.currentVideoDuration > 0 && time > this.state.currentVideoDuration) {
      time = this.state.currentVideoDuration;
      
      if (typeof this.showCustomConfirm === 'function') {
        await this.showCustomConfirm({
          title: 'Time Adjusted',
          message: 'Your notes is outside of video play time and was adjusted to the ending time.',
          okText: 'OK',
          hideCancel: true
        });
      } else {
        alert("Your notes is outside of video play time and was adjusted to the ending time.");
      }
      
      
      // Visually update the input field so the user sees it got clamped
      if (isManual) {
        const manualInput = document.getElementById('manual-note-time');
        if (manualInput && manualInput._cascadingTime) {
          manualInput._cascadingTime.setValue(time);
        } else if (manualInput) {
          manualInput.value = this.formatTime(time);
        }
      }
    }
    
    const notes = this.getDb('notes');
    const vId = this.state.currentInstanceId || `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    
    // Enforce Notes Limit based on tier
    const tier = this.getUserTier();
    
    // Limits [max videos, max notes per video]
    let maxVideos = 5;
    let maxNotes = 3;
    if (tier === 'premium') {
      maxVideos = 15;
      maxNotes = 10;
    } else if (tier === 'pro') {
      maxVideos = 20;
      maxNotes = 15;
    }
    
    const uniqueVideos = Object.keys(notes).filter(k => k !== '__titles' && Array.isArray(notes[k]) && notes[k].length > 0);
    const isNewVideo = !notes[vId] || notes[vId].length === 0;
    
    if (isNewVideo && uniqueVideos.length >= maxVideos) {
      if (tier === 'pro') {
        this.showToast(`Pro limit reached: You can add notes to a maximum of ${maxVideos} videos.`, 'alert-circle');
      } else {
        this.openUpgradeModal(`${tier.charAt(0).toUpperCase() + tier.slice(1)} accounts can only add notes to ${maxVideos} videos total. Upgrade to keep adding notes!`);
      }
      return;
    }
    
    const currentVideoNotes = notes[vId] || [];
    if (currentVideoNotes.length >= maxNotes) {
      if (tier === 'pro') {
        this.showToast(`Pro limit reached: You can add a maximum of ${maxNotes} notes per video.`, 'alert-circle');
      } else {
        this.openUpgradeModal(`${tier.charAt(0).toUpperCase() + tier.slice(1)} accounts are limited to ${maxNotes} notes per video. Upgrade to keep adding notes!`);
      }
      return;
    }

    if (!notes[vId]) notes[vId] = [];
    
    const noteObj = {
      id: Date.now().toString(),
      time: Math.floor(time),
      text: text
    };

    if (!notes.__titles) notes.__titles = {};
    notes.__titles[vId] = this.state.currentVideo.title;

    if (!notes[vId]) notes[vId] = [];
    notes[vId].push(noteObj);
    notes[vId].sort((a,b) => a.time - b.time);
    
    this.saveDb('notes', notes);
    this.syncNotesToCloud(vId, notes[vId]);
    this.elements.noteInput.value = '';
    if (typeof this.updateNoteCharCount === 'function') this.updateNoteCharCount(this.elements.noteInput); // Clear input for the next note
    this.renderNotes();
    this.showToast(`Note added at ${this.formatTime(Math.floor(time))}!`, "edit-3");

    if (!this.state.user && !this.state.guestPromptShown) {
      this.state.guestPromptShown = true;
      setTimeout(() => {
        this.showToast("Loving the features? Create a free account to save your loops, notes, and playlists so you never lose them!", "heart");
      }, 2000);
    }
  }

  updateNoteCharCount(textarea) {
    const max = 200;
    if (textarea.value.length > max) {
      textarea.value = textarea.value.substring(0, max);
    }
    const countDisplay = document.getElementById('note-char-count');
    if (countDisplay) {
      countDisplay.textContent = `${textarea.value.length} / ${max}`;
      if (textarea.value.length >= max) {
        countDisplay.style.color = '#ef4444'; // Red
      } else {
        countDisplay.style.color = 'var(--text-muted)';
      }
    }
  }

  deleteNote(noteId) {
    const vId = this.state.currentInstanceId || `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    if (db[vId]) {
      const index = db[vId].findIndex(n => n.id && n.id.toString() === noteId.toString());
      if (index !== -1) {
        db[vId].splice(index, 1);
        this.saveDb('notes', db);
        this.syncNotesToCloud(vId, db[vId]);
        
        if (window.supabaseClient && this.state.user) {
          window.supabaseClient.from('notes').delete()
            .eq('id', noteId)
            .eq('user_id', this.state.user.id)
            .then(({ error }) => {
              if (error && typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.error("Failed to delete note from cloud:", error);
            });
        }
        
        this.renderNotes();
        this.showToast("Note deleted", "trash-2");
      }
    }
  }

  async editNote(id) {
    if (this.state.isReadOnlyShared) return;
    
    const db = this.getDb('notes');
    let targetVid = null;
    let targetNoteIndex = -1;
    
    for (const vId in db) {
      if (vId === '__titles') continue;
      const idx = db[vId].findIndex(n => n.id && n.id.toString() === id.toString());
      if (idx !== -1) {
        targetVid = vId;
        targetNoteIndex = idx;
        break;
      }
    }
    
    if (!targetVid) return;
    
    const note = db[targetVid][targetNoteIndex];
    
    // Custom edit note modal
    const modal = document.getElementById('edit-note-modal');
    const timeInput = document.getElementById('edit-note-time');
    const textInput = document.getElementById('edit-note-text');
    const cancelBtn = document.getElementById('edit-note-cancel');
    const okBtn = document.getElementById('edit-note-ok');
    
    if (!modal) {
      // Fallback
      const newText = await app.showCustomPrompt({
        title: 'Edit Note',
        message: 'Update your note:',
        defaultValue: note.text,
        isTextArea: true,
        okText: 'Save'
      });
      if (newText !== null && newText.trim() !== '') {
        note.text = newText.trim();
        note.editedAt = Date.now();
        this.saveDb('notes', db);
        this.syncNotesToCloud(targetVid, db[targetVid]);
        this.renderNotes();
        this.showToast("Note updated", "check-circle");
      }
      return;
    }
    
    timeInput.value = this.formatTime(note.time);
    textInput.value = note.text;
    
    modal.classList.remove('hidden');
    
    const result = await new Promise((resolve) => {
      const handleCancel = () => { cleanup(); resolve(null); };
      const handleOk = () => { cleanup(); resolve({ time: timeInput.value, text: textInput.value }); };
      
      const cleanup = () => {
        cancelBtn.removeEventListener('click', handleCancel);
        okBtn.removeEventListener('click', handleOk);
        modal.classList.add('hidden');
      };
      
      cancelBtn.addEventListener('click', handleCancel);
      okBtn.addEventListener('click', handleOk);
    });
    
    if (result && result.text.trim() !== '') {
      note.text = result.text.trim();
      note.editedAt = Date.now();
      
      // Parse time
      let newTime = note.time;
      const tStr = result.time.trim();
      if (tStr) {
        if (tStr.includes(':')) {
          const parts = tStr.split(':').map(Number);
          if (parts.length === 2) newTime = parts[0] * 60 + parts[1];
          else if (parts.length === 3) newTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (!isNaN(tStr)) {
          newTime = parseFloat(tStr);
        }
      }
      
      if (!isNaN(newTime) && newTime >= 0) {
        note.time = Math.max(0, newTime); // ensure non-negative
      }
      
      // Resort notes by time after edit
      db[targetVid].sort((a, b) => a.time - b.time);
      
      this.saveDb('notes', db);
      this.syncNotesToCloud(targetVid, db[targetVid]);
      
      this.renderNotes();
      this.showToast("Note updated", "check-circle");
    }
  }

  async deleteAllNotes() {
    const vId = this.state.currentInstanceId || `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    if (db[vId] && db[vId].length > 0) {
      const confirmResult = await this.showCustomConfirm({
        title: "Delete All Notes",
        message: "Are you sure you want to delete all notes for this video?",
        isDestructive: true,
        okText: "Delete All"
      });
      if (!confirmResult) return;
      
      const notesToDelete = [...db[vId]];
      db[vId] = [];
      this.saveDb('notes', db);
      this.syncNotesToCloud(vId, db[vId]);
      
      if (window.supabaseClient && this.state.user) {
        const noteIds = notesToDelete.map(n => n.id);
        window.supabaseClient.from('notes').delete()
          .in('id', noteIds)
          .eq('user_id', this.state.user.id)
          .then(({ error }) => {
            if (error && typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.error("Failed to delete all notes from cloud:", error);
          });
      }
      
      this.renderNotes();
      if (this.showToast) this.showToast("All notes deleted", "trash-2");
    }
  }

  renderNotes() {
    if (!this.state.currentVideo) return;
    const vId = this.state.currentInstanceId || `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    let notes = db[vId] || [];

    if (this.state.sharedNotesToLoad) {
      notes = this.state.sharedNotesToLoad;
    }
    
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
    
    if (this.state.sharedNotesToLoad) {
      const saveBtnContainer = document.createElement('div');
      saveBtnContainer.style.marginBottom = '12px';
      saveBtnContainer.innerHTML = `
        <div style="background: rgba(147, 51, 234, 0.1); padding: 12px; border-radius: 8px; border: 1px solid var(--primary-color); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="color: var(--primary-color); font-weight: 500; font-size: 14px;">Viewing Shared Notes</div>
            <div style="color: var(--text-muted); font-size: 12px;">This is a temporary view.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="app.saveSharedNotes()">Save & Override</button>
        </div>
      `;
      this.elements.notesList.appendChild(saveBtnContainer);
    }
    
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
          ${isReadOnly ? '' : `<div style="display: flex; gap: 4px;">
            <button class="btn-icon-delete" style="color: var(--text-muted);" aria-label="Edit note" title="Edit Note" onclick="app.editNote('${this.escapeHtml(note.id)}')"><i data-lucide="edit-3"></i></button>
            <button class="btn-icon-delete" aria-label="Delete note" title="Delete Note" onclick="app.deleteNote('${this.escapeHtml(note.id)}')"><i data-lucide="trash-2"></i></button>
          </div>`}
        </div>
        <div class="note-content">${this.escapeHtml(note.text)}${note.editedAt ? ' <span style="font-size: 0.8em; color: var(--text-muted); font-style: italic;">(edited)</span>' : ''}</div>
      `;
      this.elements.notesList.appendChild(div);
    });
    
    this.renderNoteMarkers();
    this.renderActiveNotesSummary(db, vId);
  }

  renderActiveNotesSummary(db, currentVId) {
    const listEl = document.getElementById('active-notes-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    const localInstances = JSON.parse(localStorage.getItem('wor_instances') || '{}');
    const validPlatforms = ['youtube', 'vimeo', 'dailymotion', 'soundcloud', 'twitch', 'facebook', 'mixcloud', 'wistia'];
    
    const videoGroups = {};
    
    for (const key of Object.keys(db)) {
      if (key === '__titles' || !Array.isArray(db[key]) || db[key].length === 0) continue;
      
      let platform, videoId, baseKey, sessionName, isBase;
      const parts = key.split('_');
      
      if (validPlatforms.includes(parts[0])) {
        platform = parts[0];
        videoId = parts.slice(1).join('_');
        baseKey = key;
        sessionName = "No Session";
        isBase = true;
      } else {
        const instance = localInstances[key];
        if (!instance || !instance.platform || !instance.videoId) {
           continue; // orphaned session notes, hide them for now
        }
        platform = instance.platform;
        videoId = instance.videoId;
        baseKey = `${platform}_${videoId}`;
        sessionName = instance.title || "Unnamed Session";
        isBase = false;
      }
      
      if (!videoGroups[baseKey]) {
        videoGroups[baseKey] = {
          baseKey, platform, videoId,
          title: 'Unknown Video',
          maxAdd: 0, maxEdit: 0,
          sessions: []
        };
        
        let title = (db.__titles && db.__titles[baseKey]) ? db.__titles[baseKey] : 'Unknown Video';
        if (title === 'Unknown Video' || title === 'Loading title...' || title.startsWith('Video: ')) {
          const history = this.getDb('history') || [];
          const hItem = history.find(h => h.videoId === videoId && h.platform === platform);
          if (hItem && hItem.title && hItem.title !== 'Loading title...') {
            title = hItem.title;
            if (!db.__titles) db.__titles = {};
            db.__titles[baseKey] = title;
            this.saveDb('notes', db);
          } else if (localInstances[key] && localInstances[key].videoTitle) {
            title = localInstances[key].videoTitle;
          } else {
            title = `Video: ${videoId}`;
          }
        }
        videoGroups[baseKey].title = title;
      }
      
      const notes = db[key];
      const sMaxAdd = Math.max(...notes.map(n => n.timestamp || 0));
      const sMaxEdit = Math.max(...notes.map(n => n.editedAt || n.timestamp || 0));
      
      videoGroups[baseKey].sessions.push({
        key,
        name: sessionName,
        count: notes.length,
        maxAdd: sMaxAdd,
        maxEdit: sMaxEdit,
        isBase
      });
      
      videoGroups[baseKey].maxAdd = Math.max(videoGroups[baseKey].maxAdd, sMaxAdd);
      videoGroups[baseKey].maxEdit = Math.max(videoGroups[baseKey].maxEdit, sMaxEdit);
    }
    
    let videosData = Object.values(videoGroups);
    if (videosData.length === 0) {
      listEl.innerHTML = '<div class="empty-state-list"><i data-lucide="file-text"></i><p>No active notes for any videos.</p></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    
    const sortVal = document.getElementById('notes-sort') ? document.getElementById('notes-sort').value : 'recent_add';
    videosData.sort((a, b) => {
      if (sortVal === 'alpha') return a.title.localeCompare(b.title);
      if (sortVal === 'recent_edit') return b.maxEdit - a.maxEdit;
      return b.maxAdd - a.maxAdd; // recent_add
    });
    
    const itemsPerPage = 5;
    let currentPage = app.state.pagination.savedNotes || 1;
    const totalPages = Math.ceil(videosData.length / itemsPerPage) || 1;
    if (currentPage > totalPages) {
      currentPage = totalPages;
      app.state.pagination.savedNotes = currentPage;
    }
    
    const paginatedVideos = videosData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    paginatedVideos.forEach(vData => {
      const div = document.createElement('div');
      div.className = 'note-item';
      div.style = "padding: 12px; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px;";
      
      div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.02)';
      div.onmouseout = () => div.style.background = 'transparent';
      
      const thumbUrl = this.getThumbnailUrl(vData.platform, vData.videoId);
      
      let appUrl = '?url=';
      if (vData.platform === 'youtube') appUrl += encodeURIComponent(`https://www.youtube.com/watch?v=${vData.videoId}`);
      else if (vData.platform === 'vimeo') appUrl += encodeURIComponent(`https://vimeo.com/${vData.videoId}`);
      else if (vData.platform === 'dailymotion') appUrl += encodeURIComponent(`https://www.dailymotion.com/video/${vData.videoId}`);
      else if (vData.platform === 'soundcloud') appUrl += encodeURIComponent(`https://soundcloud.com/${vData.videoId}`);
      
      let sessionsHtml = '';
      vData.sessions.sort((a, b) => {
        if (a.isBase && !b.isBase) return -1;
        if (!a.isBase && b.isBase) return 1;
        return b.maxEdit - a.maxEdit;
      });
      
      vData.sessions.forEach(sess => {
        const loadCall = sess.isBase ? `app.loadVideo('${this.escapeHtml(vData.videoId)}', '${this.escapeHtml(vData.platform)}')` : `app.loadInstance('${this.escapeHtml(sess.key)}')`;
        
        sessionsHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; margin-top: 4px; background: rgba(255,255,255,0.05); border-radius: 4px;">
            <div style="flex: 1; display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); ${loadCall}; window.scrollTo({top: 0, behavior: 'smooth'}); }">
              <i data-lucide="${sess.isBase ? 'video' : 'layers'}" style="width: 14px; height: 14px; color: var(--primary-color);"></i>
              <span style="font-size: 13px; color: #ddd; font-weight: 500;">${this.escapeHtml(sess.name)}</span>
              <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">(${sess.count} note${sess.count !== 1 ? 's' : ''})</span>
            </div>
            <button class="btn-icon-delete" style="padding: 4px;" aria-label="Clear notes" onclick="app.clearNotesForVideo('${this.escapeHtml(sess.key)}')" title="Clear notes for this version">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        `;
      });
      
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; overflow: hidden; margin-bottom: 8px;">
          <a href="${appUrl}" onclick="if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); app.loadVideo('${this.escapeHtml(vData.videoId)}', '${this.escapeHtml(vData.platform)}'); window.scrollTo({top: 0, behavior: 'smooth'}); }"><img src="${thumbUrl}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; flex-shrink: 0; cursor: pointer;" alt="thumbnail"></a>
          <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <a href="${appUrl}" onclick="if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); app.loadVideo('${this.escapeHtml(vData.videoId)}', '${this.escapeHtml(vData.platform)}'); window.scrollTo({top: 0, behavior: 'smooth'}); }" style="color: white; display: block; overflow: hidden; text-overflow: ellipsis; font-weight: 600; text-decoration: none; font-size: 14px;">${this.escapeHtml(vData.title)}</a>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; text-transform: uppercase;">${this.escapeHtml(vData.platform)}</div>
          </div>
        </div>
        <div class="note-sessions-list" style="margin-left: 2px;">
          ${sessionsHtml}
        </div>
      `;
      listEl.appendChild(div);
    });
    
    const paginationControls = app.renderPaginationControls('savedNotes', videosData.length, itemsPerPage, currentPage, () => this.renderActiveNotesSummary(db, currentVId));
    if (paginationControls) {
      listEl.appendChild(paginationControls);
    }
    
    if (window.lucide) window.lucide.createIcons();
  }

  clearNotesForVideo(vId) {
    const db = this.getDb('notes');
    if (db[vId]) {
      delete db[vId];
      if (db.__titles && db.__titles[vId]) delete db.__titles[vId];
      this.saveDb('notes', db);
      this.renderNotes();
      this.showToast("Notes cleared for video", "trash-2");
    }
  }

  toggleNoteMarkers(e) {
    this.state.showNoteMarkers = e.target.checked;
    this.renderNoteMarkers();
  }

  renderNoteMarkers() {
    const container = document.getElementById('timeline-markers');
    if (!container) return;
    
    container.innerHTML = '';
    
    // If toggled off or no duration, don't show markers
    if (this.state.showNoteMarkers === false || !this.state.currentVideoDuration) {
      return;
    }
    
    const vId = this.state.currentInstanceId || (this.state.currentVideo ? `${this.state.currentPlatform}_${this.state.currentVideo.id}` : null);
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

  saveSharedNotes() {
    if (!this.state.sharedNotesToLoad || !this.state.currentVideo) return;
    const vId = this.state.currentInstanceId || `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    db[vId] = this.state.sharedNotesToLoad;
    this.saveDb('notes', db);
    this.state.sharedNotesToLoad = null;
    this.showToast("Shared notes saved to your session!", "check");
    this.renderNotes();
  }
}

window.NotesMixin = NotesMixin;
