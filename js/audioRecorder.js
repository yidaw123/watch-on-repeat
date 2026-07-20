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
    
    const tier = this.state.user ? (this.state.user.tier || (this.state.user.user_metadata && this.state.user.user_metadata.tier) || (this.state.user.isPremium ? 'premium' : 'free')) : 'free';
    const maxRecsPerVideo = tier === 'free' ? 1 : 3;
    const maxVideos = tier === 'free' ? 2 : 5;
    
    const recs = this.state.audio.recordings || [];
    const currentVideoId = this.state.currentVideoId;
    const currentPlatform = this.state.currentPlatform;
    
    if (!currentVideoId || !currentPlatform) {
      if (typeof this.showToast === 'function') this.showToast("Please load a video first before recording.", "alert-circle");
      return;
    }
    
    const recsForThisVideo = recs.filter(r => r.videoId === currentVideoId && r.platform === currentPlatform);
    
    if (recsForThisVideo.length >= maxRecsPerVideo) {
      const msg = `You can only have up to ${maxRecsPerVideo} recording${maxRecsPerVideo > 1 ? 's' : ''} per video on the ${tier} tier.`;
      if (tier === 'pro') this.showToast(msg, "alert-circle");
      else this.openUpgradeModal(msg);
      return;
    }
    
    const uniqueVideos = new Set(recs.map(r => r.platform + ":" + r.videoId));
    if (!uniqueVideos.has(currentPlatform + ":" + currentVideoId) && uniqueVideos.size >= maxVideos) {
      const msg = `You have reached the maximum limit of ${maxVideos} videos with recordings for the ${tier} tier.`;
      if (tier === 'pro') this.showToast(msg, "alert-circle");
      else this.openUpgradeModal(msg);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.startRecording(stream);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      if (typeof this.showToast === 'function') this.showToast("Microphone access required to record.", "alert-circle");
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
      const blob = new Blob(this.state.audio.chunks, { type: 'audio/webm' });
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
      const videoId = this.state.currentVideoId;
      const platform = this.state.currentPlatform;
      const videoTitle = this.state.videoTitle || "Unknown Video";
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
    const tier = this.state.user ? (this.state.user.tier || (this.state.user.user_metadata && this.state.user.user_metadata.tier) || (this.state.user.isPremium ? 'premium' : 'free')) : 'free';
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
        this.openUpgradeModal(tier === 'free' ? "Recording longer than 30 seconds requires a Premium account." : (tier === 'premium' ? "Recording longer than 5 minutes requires a Pro account." : "You have reached the maximum recording limit of 10 minutes."));
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
    const tier = this.state.user ? (this.state.user.tier || (this.state.user.user_metadata && this.state.user.user_metadata.tier) || (this.state.user.isPremium ? 'premium' : 'free')) : 'free';
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      // Don't overwrite if it's currently recording (saying "Stop Recording")
      if (this.state.audio && this.state.audio.isRecording) return;
      
      if (tier === 'pro') {
        recordBtn.innerHTML = '<i data-lucide="mic"></i> Record (10min)';
      } else if (tier === 'premium') {
        recordBtn.innerHTML = '<i data-lucide="mic"></i> Record (5min)';
      } else {
        recordBtn.innerHTML = '<i data-lucide="mic"></i> Record (30s Free)';
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
        this.state.audio.audioEl = null;
      }
      document.getElementById('play-recording-btn')?.classList.add('hidden');
      document.getElementById('download-recording-btn')?.classList.add('hidden');
      document.getElementById('delete-recording-btn')?.classList.add('hidden');
      document.getElementById('recording-volume')?.classList.add('hidden');
      
      const display = document.getElementById('recording-time-display');
      if (display) display.textContent = '00:00 / 00:30';
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
    
    if (!this.state.audio || !this.state.audio.recordings || this.state.audio.recordings.length === 0) {
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
        <div class="mb-4 bg-[#1a1f2e] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <div class="flex items-center gap-3 p-3 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors border-b border-[var(--border-color)]" onclick="app.loadVideo('${group.videoId}', '${group.platform}')">
            ${group.thumbnail ? `<img src="${group.thumbnail}" class="w-16 h-10 object-cover rounded shadow-sm" alt="Thumbnail">` : `<div class="w-16 h-10 bg-gray-800 rounded flex items-center justify-center"><i data-lucide="video" class="text-gray-500 w-5 h-5"></i></div>`}
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-white truncate" title="${group.videoTitle}">${group.videoTitle}</div>
              <div class="text-xs text-gray-400 mt-0.5 capitalize flex items-center gap-1">
                <i data-lucide="${group.platform === 'youtube' ? 'youtube' : group.platform === 'twitch' ? 'twitch' : group.platform === 'vimeo' ? 'video' : 'play-circle'}" class="w-3 h-3"></i>
                ${group.platform}
              </div>
            </div>
          </div>
          <div class="p-2 flex flex-col gap-2">
      `;
      
      group.recordings.forEach(rec => {
        const mins = Math.floor(rec.duration / 60).toString().padStart(2, '0');
        const secs = (rec.duration % 60).toString().padStart(2, '0');
        html += `
          <div class="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex justify-between items-center group/item hover:border-[rgba(255,255,255,0.1)] transition-colors">
            <div>
              <div class="text-sm font-medium text-gray-200">${rec.name}</div>
              <div class="text-xs text-gray-400 mt-0.5"><i data-lucide="clock" class="inline w-3 h-3 mr-1 mb-0.5"></i>${mins}:${secs}</div>
            </div>
            <div class="flex gap-1.5 opacity-80 group-hover/item:opacity-100 transition-opacity">
              <button class="btn btn-secondary btn-sm h-8 px-2" onclick="app.playSpecificRecording('${rec.blobUrl}', '${group.videoId}', '${group.platform}')" title="Play">
                <i data-lucide="play" class="w-3.5 h-3.5"></i>
              </button>
              <a href="${rec.blobUrl}" download="${rec.name}.webm" class="btn btn-primary btn-sm h-8 px-2" title="Download">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
              </a>
              <button class="btn btn-error btn-sm h-8 px-2" onclick="app.deleteCurrentRecording('${rec.blobUrl}')" title="Delete">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
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
    if (this.state.audio.audioEl) {
      this.state.audio.audioEl.pause();
    }
    this.state.audio.audioEl = new Audio(blobUrl);
    this.setupAudioListeners(this.state.audio.audioEl);
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
    if (videoId && platform && (this.state.currentVideoId !== videoId || this.state.currentPlatform !== platform)) {
      if (typeof this.loadVideo === 'function') {
        this.loadVideo(videoId, platform);
      }
    }
  }
}

window.AudioRecorderMixin = AudioRecorderMixin;
