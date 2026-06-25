class LoopsMixin {
  // ADVANCED PRO LOOP CONTROLS
  // ==========================================
  enforcePremiumFeature(message) {
    if (!this.state.user || !this.state.user.isPremium) {
      this.openUpgradeModal(message || "This advanced feature is only available for Premium and Pro users!");
      return false;
    }
    return true;
  }

  fineTuneLoop(point, amount) {
    if (!this.enforcePremiumFeature()) return;
    if (!this.state.abLoop.active) {
      this.state.abLoop.active = true;
      this.state.abLoop.start = 0;
      this.state.abLoop.end = this.state.currentVideoDuration || 10;
    }
    
    let newStart = this.state.abLoop.start;
    let newEnd = this.state.abLoop.end;
    
    if (point === 'start') {
      newStart = Math.max(0, newStart + amount);
      if (newStart >= newEnd) newStart = newEnd - 0.1;
      this.state.abLoop.start = newStart;
      this.elements.abStart.value = this.formatTime(newStart);
      this.seekToTime(newStart);
    } else {
      let maxTime = this.state.currentVideoDuration || newEnd;
      newEnd = Math.min(maxTime, newEnd + amount);
      if (newEnd <= newStart) newEnd = newStart + 0.1;
      this.state.abLoop.end = newEnd;
      this.elements.abEnd.value = this.formatTime(newEnd);
      this.seekToTime(newEnd - 0.5);
    }
    
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  shiftLoop(direction) {
    if (!this.enforcePremiumFeature()) return;
    if (!this.state.abLoop.active) {
      this.state.abLoop.active = true;
      this.state.abLoop.start = 0;
      this.state.abLoop.end = this.state.currentVideoDuration || 10;
    }
    
    const duration = this.state.abLoop.end - this.state.abLoop.start;
    let newStart = this.state.abLoop.start + (duration * direction);
    let newEnd = this.state.abLoop.end + (duration * direction);
    
    const maxTime = this.state.currentVideoDuration || newEnd;
    
    if (newStart < 0) {
      newStart = 0;
      newEnd = duration;
    } else if (newEnd > maxTime) {
      newEnd = maxTime;
      newStart = maxTime - duration;
    }
    
    this.state.abLoop.start = newStart;
    this.state.abLoop.end = newEnd;
    
    this.elements.abStart.value = this.formatTime(newStart);
    this.elements.abEnd.value = this.formatTime(newEnd);
    if (this.updateTimelineUI) this.updateTimelineUI();
    this.seekToTime(newStart);
  }

  scaleLoop(multiplier) {
    if (!this.enforcePremiumFeature()) return;
    if (!this.state.abLoop.active) {
      this.state.abLoop.active = true;
      this.state.abLoop.start = 0;
      this.state.abLoop.end = this.state.currentVideoDuration || 10;
    }
    
    const duration = this.state.abLoop.end - this.state.abLoop.start;
    const newDuration = duration * multiplier;
    
    let newEnd = this.state.abLoop.start + newDuration;
    const maxTime = this.state.currentVideoDuration || newEnd;
    
    if (newEnd > maxTime) newEnd = maxTime;
    if (newEnd <= this.state.abLoop.start) newEnd = this.state.abLoop.start + 0.1;
    
    this.state.abLoop.end = newEnd;
    this.elements.abEnd.value = this.formatTime(newEnd);
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  toggleAutoTempo(e) {
    if (!this.enforcePremiumFeature("Gradual Tempo Increase is a Premium feature!")) {
      e.target.checked = false;
      return;
    }
    this.state.isAutoTempoEnabled = e.target.checked;
    if (this.state.isAutoTempoEnabled) {
      this.showToast("Gradual Tempo enabled! Speed increases slightly each loop.", "trending-up");
    }
  }

  // Removed toggleABLoop function

  async checkABLoop() {
    if (!this.state.abLoop.active) return;
    const t = await this.getCurrentTime();
    
    if (!this.state.abLoop.multiSegments || this.state.abLoop.multiSegments.length === 0) {
      this.state.abLoop.multiSegments = [{ start: this.state.abLoop.start || 0, end: this.state.abLoop.end || this.state.currentVideoDuration || 10 }];
    }
    
    const segments = this.state.abLoop.multiSegments;
    const currentSegIndex = this.state.abLoop.currentSegmentIndex || 0;
    
    // Safety fallback
    if (!segments[currentSegIndex]) {
      this.state.abLoop.currentSegmentIndex = 0;
      return;
    }
    
    const seg = segments[currentSegIndex];
    
    if (t >= seg.end && seg.end > 0) {
      let nextIndex = currentSegIndex + 1;
      
      if (nextIndex >= segments.length) {
        nextIndex = 0; // loop back to first
        
        // Auto Tempo applies when a full cycle completes
        if (this.state.isAutoTempoEnabled) {
          let speed = this.state.playbackRate || 1.0;
          speed = Math.min(2.0, speed + 0.05);
          this.setPlaybackSpeed(speed.toFixed(2));
        }
        
        if (this.incrementLoops()) return;
      }
      
      this.state.abLoop.currentSegmentIndex = nextIndex;
      
      // If the next segment starts exactly where this one ended, we don't even need to seek!
      // This allows contiguous segments to play seamlessly.
      if (segments[nextIndex].start !== seg.end) {
        this.seekToTime(segments[nextIndex].start);
      }
    } else if (t < seg.start - 0.5) {
      this.seekToTime(seg.start);
    }
  }

  toggleMultiSegment(e) {
    const list = document.getElementById('multi-segment-list');
    const addBtn = document.getElementById('add-segment-btn');
    
    if (e.target.checked) {
      if (!this.enforcePremiumFeature("Multiple loop segments are a Premium feature.")) {
        e.target.checked = false;
        return;
      }
      
      list.classList.remove('hidden');
      addBtn.classList.remove('hidden');
      
      if (!this.state.abLoop.multiSegments) this.state.abLoop.multiSegments = [];
      if (this.state.abLoop.multiSegments.length === 0) {
        this.addLoopSegment();
      }
    } else {
      list.classList.add('hidden');
      addBtn.classList.add('hidden');
      // Revert to single segment
      if (this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 1) {
        this.state.abLoop.multiSegments = [this.state.abLoop.multiSegments[0]];
        this.saveLoopData();
      }
    }
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  addLoopSegment() {
    if (!this.state.abLoop.multiSegments) this.state.abLoop.multiSegments = [];
    
    const tier = this.state.user ? this.state.user.tier : 'free';
    const limit = tier === 'pro' ? 10 : (tier === 'premium' ? 7 : 1);
    
    if (this.state.abLoop.multiSegments.length >= limit) {
      if (tier === 'premium' && limit === 7) {
        this.openUpgradeModal("Maximum 7 segments reached. Upgrade to Pro for 10 segments per video!");
      } else if (tier === 'free') {
        this.openUpgradeModal("Multiple loop segments are a Premium feature!");
      } else {
        this.showToast(`Maximum of ${limit} segments reached.`, "alert-circle");
      }
      return;
    }
    
    const duration = this.state.currentVideoDuration || 10;
    
    let newStart = 0;
    if (this.state.abLoop.multiSegments.length > 0) {
      const lastSeg = this.state.abLoop.multiSegments[this.state.abLoop.multiSegments.length - 1];
      newStart = lastSeg.end;
    }
    
    if (newStart >= duration) newStart = duration - 1;
    if (newStart < 0) newStart = 0;
    
    this.state.abLoop.multiSegments.push({ start: newStart, end: duration });
    this.state.abLoop.currentSegmentIndex = this.state.abLoop.multiSegments.length - 1;
    this.saveLoopData();
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  removeLoopSegment(index) {
    this.state.abLoop.multiSegments.splice(index, 1);
    if (this.state.abLoop.multiSegments.length === 0) {
      this.state.abLoop.multiSegments.push({ start: 0, end: this.state.currentVideoDuration || 10 });
    }
    if (this.state.abLoop.currentSegmentIndex >= this.state.abLoop.multiSegments.length) {
      this.state.abLoop.currentSegmentIndex = 0;
    }
    this.saveLoopData();
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  renderMultiSegments() {
    const list = document.getElementById('multi-segment-list');
    if (!list) return;
    
    const checkbox = document.getElementById('multi-segment-checkbox');
    const addBtn = document.getElementById('add-segment-btn');
    const isPremium = this.state.user && this.state.user.isPremium;

    if (this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 0) {
      if (checkbox) checkbox.checked = true;
      list.classList.remove('hidden');
      if (isPremium && addBtn) {
        addBtn.classList.remove('hidden');
        
        const tier = this.state.user ? this.state.user.tier : 'free';
        const limit = tier === 'pro' ? 10 : (tier === 'premium' ? 7 : 1);
        
        if (this.state.abLoop.multiSegments.length >= limit) {
          addBtn.disabled = true;
          addBtn.innerHTML = `<i data-lucide="alert-circle"></i> Max ${limit} Segments`;
          addBtn.style.opacity = '0.5';
          addBtn.style.cursor = 'not-allowed';
        } else {
          addBtn.disabled = false;
          addBtn.innerHTML = '<i data-lucide="plus"></i> Add Segment';
          addBtn.style.opacity = '1';
          addBtn.style.cursor = 'pointer';
        }
      } else if (addBtn) {
        addBtn.classList.add('hidden');
      }
    } else {
      if (checkbox && !checkbox.checked) {
        list.classList.add('hidden');
        if (addBtn) addBtn.classList.add('hidden');
      }
    }

    list.innerHTML = '';
    this.state.abLoop.multiSegments.forEach((seg, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      
      const isActive = index === (this.state.abLoop.currentSegmentIndex || 0);
      const activeStyle = isActive ? 'border-color: var(--color-primary); box-shadow: 0 0 5px var(--color-primary);' : 'border-color: #333;';
      
      row.innerHTML = `
        <span class="text-xs text-gray-500 w-4">${index + 1}</span>
        <input type="text" class="multi-seg-input" data-index="${index}" data-type="start" value="${this.formatTime(seg.start)}" style="width: 100px; padding: 4px; font-size: 12px; background: rgba(0,0,0,0.2); border: 1px solid; border-radius: 4px; color: white; text-align: center; ${activeStyle}">
        <span class="text-gray-500">to</span>
        <input type="text" class="multi-seg-input" data-index="${index}" data-type="end" value="${this.formatTime(seg.end)}" style="width: 100px; padding: 4px; font-size: 12px; background: rgba(0,0,0,0.2); border: 1px solid; border-radius: 4px; color: white; text-align: center; ${activeStyle}">
        <button class="icon-btn text-red-500" onclick="app.removeLoopSegment(${index})" style="padding: 4px;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
      `;
      list.appendChild(row);
    });
    
    list.querySelectorAll('.multi-seg-input').forEach(input => {
      this.applyTimeMask(input, (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const type = e.target.dataset.type;
        const val = this.parseTime(e.target.value);
        
        const duration = this.state.currentVideoDuration || 3600;
        const segs = this.state.abLoop.multiSegments;
        
        if (type === 'start') {
          let minStart = idx > 0 ? segs[idx - 1].end : 0;
          let maxStart = segs[idx].end;
          segs[idx].start = Math.max(minStart, Math.min(val, maxStart));
        } else {
          let minEnd = segs[idx].start;
          let maxEnd = idx < segs.length - 1 ? segs[idx + 1].start : duration;
          segs[idx].end = Math.max(minEnd, Math.min(val, maxEnd));
        }
        
        this.state.abLoop.currentSegmentIndex = idx;
        this.saveLoopData();
        if (this.updateTimelineUI) this.updateTimelineUI();
      });
    });
    
    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
}
window.LoopsMixin = LoopsMixin;
