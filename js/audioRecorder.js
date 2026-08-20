class AudioRecorderMixin {
  async initAudioRecorder() {
    if (!this.state.audio) {
      this.state.audio = {
        recorder: null,
        chunks: [],
        blobUrl: null,
        audioEl: null,
        isRecording: false,
        audioContext: null,
        analyser: null,
        dataArray: null,
        animationId: null,
        startTime: 0,
        timerId: null,
        duration: 0,
        volume: 1.0,
        recordings: [] // In-memory cache of DB recordings
      };
      
      try {
        if (window.AudioDB) {
          const recs = await window.AudioDB.getAllRecordings();
          this.state.audio.recordings = recs;
          this.renderRecordedAudioTab();
        }
      } catch (err) {
        console.error("Failed to load recordings from IndexedDB:", err);
      }
    }
  }

  async toggleRecording() {
    await this.initAudioRecorder();
    
    if (this.state.audio.isRecording) {
      this.stopRecording();
      return;
    }
    
    const tier = this.getUserTier();
    const maxRecsPerVideo = tier === 'free' ? 5 : 15;
    const maxVideos = tier === 'free' ? 2 : 15;
    
    const recs = this.state.audio.recordings || [];
    const currentVideoId = this.state.currentVideo ? this.state.currentVideo.id : null;
    const currentPlatform = this.state.currentPlatform;
    
    if (!currentVideoId || !currentPlatform) {
      if (typeof this.showToast === 'function') this.showToast("Please load a video first before recording.", "alert-circle");
      return;
    }
    
    const recsForThisVideo = recs.filter(r => r.videoId === currentVideoId && r.platform === currentPlatform);
    
    if (recsForThisVideo.length >= maxRecsPerVideo) {
      const msg = `You can only have up to ${maxRecsPerVideo} recording${maxRecsPerVideo > 1 ? 's' : ''} per video on the ${tier} tier.`;
      if (tier === 'pro' || tier === 'premium') this.showToast(msg, "alert-circle");
      else this.openUpgradeModal(msg);
      return;
    }
    
    const uniqueVideos = new Set(recs.map(r => r.platform + ":" + r.videoId));
    if (!uniqueVideos.has(currentPlatform + ":" + currentVideoId) && uniqueVideos.size >= maxVideos) {
      const msg = `You have reached the maximum limit of ${maxVideos} videos with recordings for the ${tier} tier.`;
      if (tier === 'pro' || tier === 'premium') this.showToast(msg, "alert-circle");
      else this.openUpgradeModal(msg);
      return;
    }
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported in this context (requires HTTPS).");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.startRecording(stream);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      if (typeof this.showToast === 'function') this.showToast("Microphone access denied or not supported (requires HTTPS).", "alert-circle");
    }
  }

  startRecording(stream) {
    this.state.audio.isRecording = true;
    this.state.audio.wantsSync = false;
    this.state.audio.chunks = [];
    this.state.audio.startTime = Date.now();
    this.state.audio.duration = 0;
    
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      recordBtn.innerHTML = '<i data-lucide="square"></i> Stop Recording';
      recordBtn.classList.remove('btn-error');
      recordBtn.classList.add('btn-secondary');
      if (window.lucide) window.lucide.createIcons();
    }
    
    document.getElementById('play-recording-btn')?.classList.add('hidden');
    document.getElementById('delete-recording-btn')?.classList.add('hidden');
    document.getElementById('recording-volume')?.classList.add('hidden');
    
    this.state.audio.recorder = new MediaRecorder(stream);
    
    this.state.audio.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.state.audio.chunks.push(e.data);
    };
    
    this.state.audio.recorder.onstop = async () => {
      const blob = new Blob(this.state.audio.chunks, { type: this.state.audio.recorder.mimeType || 'audio/webm' });
      
      // Removed revokeObjectURL to prevent breaking previous recordings
      
      this.state.audio.blobUrl = URL.createObjectURL(blob);
      
      if (this.state.audio.audioEl) {
        this.state.audio.audioEl.src = this.state.audio.blobUrl;
      } else {
        this.state.audio.audioEl = new Audio(this.state.audio.blobUrl);
        this.setupAudioListeners(this.state.audio.audioEl);
        this.state.audio.audioEl.volume = this.state.audio.volume;
      }
      
      // Save to recordings list and IndexedDB
      const timestamp = new Date().toLocaleTimeString();
      const name = `Recording at ${timestamp}`;
      const videoId = this.state.currentVideo ? this.state.currentVideo.id : null;
      const platform = this.state.currentPlatform;
      const videoTitle = (this.state.currentVideo && this.state.currentVideo.title) ? this.state.currentVideo.title : "Unknown Video";
      const thumbnail = this.getThumbnailUrl(platform, videoId);
      
      let dbId = Date.now().toString(); // fallback
      if (window.AudioDB) {
        try {
          dbId = await window.AudioDB.saveRecording(videoId, platform, blob, this.state.audio.duration, name, videoTitle, thumbnail);
        } catch (err) {
          console.error("Failed to save to AudioDB:", err);
        }
      }
      
      const newRec = {
        id: dbId,
        videoId,
        platform,
        name,
        blobUrl: this.state.audio.blobUrl,
        duration: this.state.audio.duration,
        blob: blob, // Store blob for consistency
        videoTitle,
        thumbnail,
        createdAt: Date.now()
      };
      
      if (!this.state.audio.recordings) this.state.audio.recordings = [];
      this.state.audio.recordings.push(newRec);
      
      this.renderRecordedAudioTab();
      
      document.getElementById('play-recording-btn')?.classList.remove('hidden');
      const dlBtn = document.getElementById('download-recording-btn');
      if (dlBtn) {
        dlBtn.href = this.state.audio.blobUrl;
        dlBtn.classList.remove('hidden');
      }
      document.getElementById('delete-recording-btn')?.classList.remove('hidden');
      document.getElementById('recording-volume')?.classList.remove('hidden');
    };
    
    this.state.audio.recorder.start();
    
    // Set up visualizer
    this.setupVisualizer(stream);
    
    // Timer
    const tier = this.getUserTier();
    const maxDuration = tier === 'pro' ? 600 : (tier === 'premium' ? 300 : 30);
    
    this.state.audio.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.state.audio.startTime) / 1000);
      this.state.audio.duration = elapsed;
      
      const display = document.getElementById('recording-time-display');
      if (display) {
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        display.textContent = `${mins}:${secs} ${tier === 'pro' ? '/ 10:00' : (tier === 'premium' ? '/ 05:00' : '/ 00:30')}`;
      }
      
      if (elapsed >= maxDuration) {
        this.stopRecording();
        if (tier === 'pro') {
          if (typeof this.showToast === 'function') this.showToast("You have reached the maximum recording limit of 10 minutes.", "alert-circle");
          else alert("You have reached the maximum recording limit of 10 minutes.");
        } else {
          this.openUpgradeModal(tier === 'free' ? "Recording longer than 30 seconds requires a Premium account." : "Recording longer than 5 minutes requires a Pro account.");
        }
      }
    }, 1000);
  }

  stopRecording() {
    if (!this.state.audio.isRecording) return;
    this.state.audio.isRecording = false;
    
    if (this.state.audio.recorder && this.state.audio.recorder.state !== 'inactive') {
      this.state.audio.recorder.stop();
      this.state.audio.recorder.stream.getTracks().forEach(t => t.stop());
    }
    
    if (this.state.audio.timerId) {
      clearInterval(this.state.audio.timerId);
      this.state.audio.timerId = null;
    }
    if (this.state.audio.animationId) {
      cancelAnimationFrame(this.state.audio.animationId);
      this.state.audio.animationId = null;
    }
    
    // Reset visualizer canvas
    const canvas = document.getElementById('recording-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    this.updateRecordButtonUI();
  }

  updateRecordButtonUI() {
    const tier = this.getUserTier();
    const recordBtn = document.getElementById('record-btn');
    const display = document.getElementById('recording-time-display');
    
    if (recordBtn) {
      // Don't overwrite if it's currently recording (saying "Stop Recording")
      if (this.state.audio && this.state.audio.isRecording) return;
      
      if (tier === 'pro') {
        recordBtn.innerHTML = '<i data-lucide="mic"></i> Record (10min)';
        if (display) display.textContent = '00:00 / 10:00';
      } else if (tier === 'premium') {
        recordBtn.innerHTML = '<i data-lucide="mic"></i> Record (5min)';
        if (display) display.textContent = '00:00 / 05:00';
      } else {
        recordBtn.innerHTML = '<i data-lucide="mic"></i> Record (30s Free)';
        if (display) display.textContent = '00:00 / 00:30';
      }
      recordBtn.classList.remove('btn-secondary');
      recordBtn.classList.add('btn-error');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  setupAudioListeners(audioEl) {
    audioEl.addEventListener('timeupdate', () => {
      // Don't update display if currently recording
      if (this.state.audio && this.state.audio.isRecording) return;
      
      const display = document.getElementById('recording-time-display');
      let rawDur = audioEl.duration;
      if (!rawDur || rawDur === Infinity) rawDur = this.state.audio.duration || 0;
      
      if (display) {
        const cur = Math.floor(audioEl.currentTime || 0);
        const dur = Math.floor(rawDur);
        
        const curMins = Math.floor(cur / 60).toString().padStart(2, '0');
        const curSecs = (cur % 60).toString().padStart(2, '0');
        
        const durMins = Math.floor(dur / 60).toString().padStart(2, '0');
        const durSecs = (dur % 60).toString().padStart(2, '0');
        
        display.textContent = `${curMins}:${curSecs} / ${durMins}:${durSecs}`;
      }
      
      // WebM blobs from MediaRecorder often have Infinity duration, meaning 'ended' never fires natively.
      // So we manually check if we've reached the true recorded duration.
      if (audioEl.duration === Infinity && this.state.audio.duration && audioEl.currentTime >= this.state.audio.duration) {
        audioEl.pause();
        audioEl.currentTime = 0;
        if (this.state.audio) this.state.audio.wantsSync = false;
        const playBtn = document.getElementById('play-recording-btn');
        if (playBtn) {
          playBtn.innerHTML = '<i data-lucide="play"></i> Play';
          if (window.lucide) window.lucide.createIcons();
        }
      }
    });

    audioEl.addEventListener('ended', () => {
      if (this.state.audio) this.state.audio.wantsSync = false;
      const playBtn = document.getElementById('play-recording-btn');
      if (playBtn) {
        playBtn.innerHTML = '<i data-lucide="play"></i> Play';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  setupVisualizer(stream) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.state.audio.audioContext = new AudioContext();
    this.state.audio.analyser = this.state.audio.audioContext.createAnalyser();
    const source = this.state.audio.audioContext.createMediaStreamSource(stream);
    source.connect(this.state.audio.analyser);
    
    this.state.audio.analyser.fftSize = 256;
    const bufferLength = this.state.audio.analyser.frequencyBinCount;
    this.state.audio.dataArray = new Uint8Array(bufferLength);
    
    const canvas = document.getElementById('recording-canvas');
    if (!canvas) return; // Added null guard
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const draw = () => {
      if (!this.state.audio.isRecording) return;
      this.state.audio.animationId = requestAnimationFrame(draw);
      
      this.state.audio.analyser.getByteTimeDomainData(this.state.audio.dataArray);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'var(--color-primary)';
      ctx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = this.state.audio.dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    
    draw();
  }

  toggleRecordingPlayback() {
    if (!this.state.audio || !this.state.audio.audioEl) return;
    
    if (this.state.audio.audioEl.paused) {
      this.state.audio.wantsSync = true;
      this.state.audio.audioEl.play();
      document.getElementById('play-recording-btn').innerHTML = '<i data-lucide="pause"></i> Pause';
    } else {
      this.state.audio.wantsSync = false;
      this.state.audio.audioEl.pause();
      document.getElementById('play-recording-btn').innerHTML = '<i data-lucide="play"></i> Play';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  async deleteCurrentRecording(forceDeleteUrl = null) {
    if (!this.state.audio) return;
    this.state.audio.wantsSync = false;
    
    // We can pass a specific blobUrl to delete, otherwise it deletes the current one
    const targetUrl = forceDeleteUrl || this.state.audio.blobUrl;
    if (!targetUrl) return;
    
    const recToDelete = this.state.audio.recordings.find(r => r.blobUrl === targetUrl);
    
    if (this.state.audio.blobUrl === targetUrl) {
      this.state.audio.blobUrl = null;
      if (this.state.audio.audioEl) {
        this.state.audio.audioEl.pause();
        this.state.audio.audioEl.removeAttribute('src');
        this.state.audio.audioEl.load();
        this.state.audio.audioEl = null;
      }
      document.getElementById('play-recording-btn')?.classList.add('hidden');
      document.getElementById('download-recording-btn')?.classList.add('hidden');
      document.getElementById('delete-recording-btn')?.classList.add('hidden');
      document.getElementById('recording-volume')?.classList.add('hidden');
      
      const display = document.getElementById('recording-time-display');
      if (display) display.textContent = '00:00 / 00:30';
    }
    
    if (targetUrl && targetUrl.startsWith('blob:')) {
      URL.revokeObjectURL(targetUrl);
    }
    if (recToDelete) {
      this.state.audio.recordings = this.state.audio.recordings.filter(r => r.id !== recToDelete.id);
      this.renderRecordedAudioTab();
      if (window.AudioDB && recToDelete.id) {
        try {
          await window.AudioDB.deleteRecording(recToDelete.id);
        } catch (err) {
          console.error("Failed to delete from AudioDB", err);
        }
      }
    }
  }

  setRecordingVolume(val) {
    if (!this.state.audio) return;
    this.state.audio.volume = parseFloat(val);
    if (this.state.audio.audioEl) {
      this.state.audio.audioEl.volume = this.state.audio.volume;
    }
  }

  async renameRecordedAudio(id) {
    if (!window.AudioDB || !this.state.audio) return;
    const rec = this.state.audio.recordings.find(r => r.id === id);
    if (!rec) return;
    
    const newName = prompt("Enter new name for this recording:", rec.name);
    if (!newName || newName.trim() === '' || newName === rec.name) return;
    
    try {
      await window.AudioDB.renameRecording(id, newName.trim());
      rec.name = newName.trim();
      this.renderRecordedAudioTab();
    } catch (err) {
      console.error("Failed to rename recording", err);
      alert("Failed to rename recording.");
    }
  }

  async deleteAllRecordingsForVideo(videoId, platform) {
    if (!window.AudioDB || !this.state.audio || !this.state.audio.recordings) return;
    
    if (!confirm("Are you sure you want to delete all recordings for this video?")) return;
    
    const recsToDelete = this.state.audio.recordings.filter(r => r.videoId === videoId && r.platform === platform);
    if (recsToDelete.length === 0) return;
    
    try {
      for (const rec of recsToDelete) {
        if (rec.blobUrl && rec.blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(rec.blobUrl);
        }
        await window.AudioDB.deleteRecording(rec.id);
      }
      this.state.audio.recordings = this.state.audio.recordings.filter(r => !(r.videoId === videoId && r.platform === platform));
      this.renderRecordedAudioTab();
    } catch (err) {
      console.error("Failed to delete recordings", err);
      alert("Failed to delete recordings.");
    }
  }

  syncRecordingWithVideo() {
    if (this.state.audio && this.state.audio.audioEl && this.state.audio.blobUrl && this.state.audio.wantsSync) {
      this.state.audio.audioEl.currentTime = 0;
      this.state.audio.audioEl.play().catch(e => console.warn("Audio sync play failed:", e));
      const playBtn = document.getElementById('play-recording-btn');
      if (playBtn) playBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  renderRecordedAudioTab() {
    const container = document.getElementById('recorded-audio-list');
    const emptyState = document.getElementById('recorded-audio-empty');
    const badge = document.getElementById('recorded-audio-count');
    if (!container) return;
    
    if (!this.state.audio) {
      this.initAudioRecorder();
      return;
    }
    
    if (!this.state.audio.recordings || this.state.audio.recordings.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (badge) badge.textContent = '0';
      return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    if (badge) badge.textContent = this.state.audio.recordings.length;
    
    // Group recordings by platform:videoId
    const grouped = {};
    this.state.audio.recordings.forEach(rec => {
      // Re-hydrate blobUrl if missing (loaded from IndexedDB)
      if (!rec.blobUrl && rec.blob) {
        rec.blobUrl = URL.createObjectURL(rec.blob);
      }
      
      const key = `${rec.platform}:${rec.videoId}`;
      if (!grouped[key]) {
        grouped[key] = {
          videoId: rec.videoId,
          platform: rec.platform,
          videoTitle: rec.videoTitle || "Unknown Video",
          thumbnail: rec.thumbnail || "",
          recordings: []
        };
      }
      grouped[key].recordings.push(rec);
    });
    
    let html = '';
    Object.values(grouped).forEach(group => {
      html += `
        <div style="display: flex; flex-direction: column; background: var(--surface-color); border: 1px solid #333; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
          <a href="${window.location.pathname}?v=${encodeURIComponent(group.videoId)}&p=${encodeURIComponent(group.platform)}" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-bottom: 1px solid #333; cursor: pointer; text-decoration: none; color: inherit;" onclick="if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); app.loadVideo('${group.videoId}', '${group.platform}'); }">
            ${group.thumbnail ? `<img src="${group.thumbnail}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; background: #000;" alt="Thumbnail">` : `<div style="width: 80px; height: 45px; background: #222; border-radius: 4px; display: flex; align-items: center; justify-content: center;"><i data-lucide="video" style="color: #666;"></i></div>`}
            <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
              <span style="font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: white;" title="${group.videoTitle}">${group.videoTitle}</span>
              <span style="font-size: 11px; color: #888; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <i data-lucide="${group.platform === 'youtube' ? 'youtube' : group.platform === 'twitch' ? 'twitch' : group.platform === 'vimeo' ? 'video' : 'play-circle'}" style="width: 12px; height: 12px;"></i>
                ${group.platform}
              </span>
            </div>
            <button type="button" class="btn-icon-delete" style="color: #ef4444;" onclick="event.preventDefault(); event.stopPropagation(); app.deleteAllRecordingsForVideo('${group.videoId}', '${group.platform}')" title="Delete all recordings for this video">
              <i data-lucide="trash-2"></i>
            </button>
          </a>
          <div style="padding: 8px 12px; display: flex; flex-direction: column; gap: 6px;">
      `;
      
      group.recordings.forEach(rec => {
        const mins = Math.floor(rec.duration / 60).toString().padStart(2, '0');
        const secs = (rec.duration % 60).toString().padStart(2, '0');
        const dateStr = rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
            <div style="display: flex; flex-direction: column; flex: 1;">
              <span style="font-weight: 500; font-size: 13px; color: white;">${rec.name}</span>
              <span style="font-size: 12px; color: #888; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                <i data-lucide="clock" style="width: 12px; height: 12px;"></i>${mins}:${secs}
                ${dateStr ? `<span style="margin-left: 6px; padding-left: 6px; border-left: 1px solid #444;">${dateStr}</span>` : ''}
              </span>
            </div>
            <div style="display: flex; gap: 4px;">
              <button type="button" class="btn-icon-delete" style="color: var(--text-primary);" onclick="app.playSpecificRecording('${rec.blobUrl}', '${group.videoId}', '${group.platform}')" title="Play">
                <i data-lucide="play"></i>
              </button>
              <button type="button" class="btn-icon-delete" style="color: var(--text-muted);" onclick="app.renameRecordedAudio(${rec.id})" title="Rename">
                <i data-lucide="edit-3"></i>
              </button>
              <a href="${rec.blobUrl}" download="${rec.name}.webm" class="btn-icon-delete" style="color: var(--text-primary);" title="Download">
                <i data-lucide="download"></i>
              </a>
              <button type="button" class="btn-icon-delete" onclick="app.deleteCurrentRecording('${rec.blobUrl}')" title="Delete">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  playSpecificRecording(blobUrl, videoId = null, platform = null) {
    if (!this.state.audio) return;
    if (!this.state.audio.audioEl) {
      this.state.audio.audioEl = new Audio();
      this.setupAudioListeners(this.state.audio.audioEl);
    }
    this.state.audio.audioEl.pause();
    this.state.audio.audioEl.src = blobUrl;
    this.state.audio.audioEl.volume = this.state.audio.volume;
    this.state.audio.blobUrl = blobUrl; // Set as current
    this.state.audio.wantsSync = false;
    this.state.audio.audioEl.play();
    
    document.getElementById('play-recording-btn')?.classList.remove('hidden');
    document.getElementById('download-recording-btn')?.classList.remove('hidden');
    document.getElementById('delete-recording-btn')?.classList.remove('hidden');
    document.getElementById('recording-volume')?.classList.remove('hidden');
    
    const playBtn = document.getElementById('play-recording-btn');
    if (playBtn) playBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
    if (window.lucide) window.lucide.createIcons();
    
    // Switch to the video tab (Audio Recorder Studio)
    if (typeof this.switchTab === 'function') this.switchTab('main-view');
    
    // If a different video is currently loaded, load the corresponding one
    const currentVideoId = this.state.currentVideo ? this.state.currentVideo.id : null;
    if (videoId && platform && (currentVideoId !== videoId || this.state.currentPlatform !== platform)) {
      if (typeof this.loadVideo === 'function') {
        this.loadVideo(videoId, platform);
      }
    }
  }
}

window.AudioRecorderMixin = AudioRecorderMixin;
