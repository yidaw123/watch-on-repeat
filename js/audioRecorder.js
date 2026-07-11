class AudioRecorderMixin {
  initAudioRecorder() {
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
        recordings: [] // For the Recorded Audio tab
      };
    }
  }

  async toggleRecording() {
    this.initAudioRecorder();
    
    if (this.state.audio.isRecording) {
      this.stopRecording();
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.startRecording(stream);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      this.showToast("Microphone access required to record.", "alert-circle");
    }
  }

  startRecording(stream) {
    this.state.audio.isRecording = true;
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
    
    this.state.audio.recorder.onstop = () => {
      const blob = new Blob(this.state.audio.chunks, { type: 'audio/webm' });
      this.state.audio.blobUrl = URL.createObjectURL(blob);
      
      if (this.state.audio.audioEl) {
        this.state.audio.audioEl.src = this.state.audio.blobUrl;
      } else {
        this.state.audio.audioEl = new Audio(this.state.audio.blobUrl);
        this.state.audio.audioEl.volume = this.state.audio.volume;
      }
      
      // Save to recordings list
      const timestamp = new Date().toLocaleTimeString();
      const newRec = {
        id: Date.now().toString(),
        name: `Recording at ${timestamp}`,
        blobUrl: this.state.audio.blobUrl,
        duration: this.state.audio.duration
      };
      
      const isPremiumUser = this.state.user && (this.state.user.isPremium || (this.state.user.user_metadata && this.state.user.user_metadata.tier === 'premium'));
      if (!isPremiumUser) {
        this.state.audio.recordings = [newRec];
      } else {
        this.state.audio.recordings.push(newRec);
      }
      
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
    const isPremium = this.state.user && (this.state.user.isPremium || (this.state.user.user_metadata && this.state.user.user_metadata.tier === 'premium'));
    const maxDuration = isPremium ? 3600 : 30; // 1 hr vs 30s
    
    this.state.audio.timerId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.state.audio.startTime) / 1000);
      this.state.audio.duration = elapsed;
      
      const display = document.getElementById('recording-time-display');
      if (display) {
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        display.textContent = `${mins}:${secs} ${isPremium ? '' : '/ 00:30'}`;
      }
      
      if (!isPremium && elapsed >= 30) {
        this.stopRecording();
        this.openUpgradeModal("Recording longer than 30 seconds requires a Premium account.");
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
    
    const isPremium = this.state.user && (this.state.user.isPremium || (this.state.user.user_metadata && this.state.user.user_metadata.tier === 'premium'));
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      recordBtn.innerHTML = isPremium ? '<i data-lucide="mic"></i> Record (1hr)' : '<i data-lucide="mic"></i> Record (30s Free)';
      recordBtn.classList.remove('btn-secondary');
      recordBtn.classList.add('btn-error');
      if (window.lucide) window.lucide.createIcons();
    }
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
      this.state.audio.audioEl.play();
      document.getElementById('play-recording-btn').innerHTML = '<i data-lucide="pause"></i> Pause';
    } else {
      this.state.audio.audioEl.pause();
      document.getElementById('play-recording-btn').innerHTML = '<i data-lucide="play"></i> Play';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  deleteCurrentRecording() {
    if (!this.state.audio) return;
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

  setRecordingVolume(val) {
    if (!this.state.audio) return;
    this.state.audio.volume = parseFloat(val);
    if (this.state.audio.audioEl) {
      this.state.audio.audioEl.volume = this.state.audio.volume;
    }
  }

  syncRecordingWithVideo() {
    if (this.state.audio && this.state.audio.audioEl && this.state.audio.blobUrl) {
      this.state.audio.audioEl.currentTime = 0;
      this.state.audio.audioEl.play().catch(e => console.warn("Audio sync play failed:", e));
      const playBtn = document.getElementById('play-recording-btn');
      if (playBtn) playBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  renderRecordedAudioTab() {
    // Will be implemented when the sidebar is created
    const container = document.getElementById('recorded-audio-list');
    if (!container) return;
    
    if (!this.state.audio || this.state.audio.recordings.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-400 p-4">No audio recorded this session.</p>';
      return;
    }
    
    let html = '';
    this.state.audio.recordings.forEach(rec => {
      const mins = Math.floor(rec.duration / 60).toString().padStart(2, '0');
      const secs = (rec.duration % 60).toString().padStart(2, '0');
      html += `
        <div class="p-3 mb-2 rounded bg-[rgba(255,255,255,0.02)] border border-[var(--border-color)] flex justify-between items-center">
          <div>
            <div class="text-sm font-medium text-white">${rec.name}</div>
            <div class="text-xs text-gray-400">Duration: ${mins}:${secs}</div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" onclick="app.playSpecificRecording('${rec.blobUrl}')"><i data-lucide="play" style="width:14px;height:14px;"></i></button>
            <a href="${rec.blobUrl}" download="${rec.name}.webm" class="btn btn-primary btn-sm"><i data-lucide="download" style="width:14px;height:14px;"></i></a>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  playSpecificRecording(blobUrl) {
    if (!this.state.audio) return;
    if (this.state.audio.audioEl) {
      this.state.audio.audioEl.pause();
    }
    this.state.audio.audioEl = new Audio(blobUrl);
    this.state.audio.audioEl.volume = this.state.audio.volume;
    this.state.audio.blobUrl = blobUrl; // Set as current
    this.state.audio.audioEl.play();
    
    document.getElementById('play-recording-btn')?.classList.remove('hidden');
    const playBtn = document.getElementById('play-recording-btn');
    if (playBtn) playBtn.innerHTML = '<i data-lucide="pause"></i> Pause';
    if (window.lucide) window.lucide.createIcons();
  }
}

window.AudioRecorderMixin = AudioRecorderMixin;
