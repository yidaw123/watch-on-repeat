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

  fineTuneLoop(point, amount, segIndex = null) {
    if (!this.enforcePremiumFeature()) return;
    
    let target = this.state.abLoop;
    let isMulti = false;
    if (segIndex !== null && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments[segIndex]) {
      const startEl = document.getElementById(`multi-start-${segIndex}`);
      const endEl = document.getElementById(`multi-end-${segIndex}`);
      if (startEl && startEl._cascadingTime && endEl && endEl._cascadingTime) {
         let currentStart = startEl._cascadingTime.getValue();
         let currentEnd = endEl._cascadingTime.getValue();
         if (isNaN(currentStart)) currentStart = 0;
         if (isNaN(currentEnd) || currentEnd === 0) currentEnd = this.state.currentVideoDuration || 3600;
         
         let newStart = currentStart;
         let newEnd = currentEnd;
         
         if (point === 'start') {
           newStart = Math.max(0, newStart + amount);
           if (newStart > newEnd) newStart = newEnd;
           startEl._cascadingTime.setValue(newStart);
           if (startEl._cascadingTime.onChange) startEl._cascadingTime.onChange(newStart, startEl);
         } else {
           newEnd = Math.min(this.state.currentVideoDuration || 3600, newEnd + amount);
           if (newEnd < newStart) newEnd = newStart;
           endEl._cascadingTime.setValue(newEnd);
           if (endEl._cascadingTime.onChange) endEl._cascadingTime.onChange(newEnd, endEl);
         }
      }
      return;
    } else {
      if (!this.state.abLoop.active) {
        this.state.abLoop.active = true;
        this.state.abLoop.start = 0;
        this.state.abLoop.end = this.state.currentVideoDuration || 0;
      }
    }
    
    let newStart = target.start;
    let newEnd = target.end;
    
    if (point === 'start') {
      newStart = Math.max(0, newStart + amount);
      if (newStart >= newEnd) newStart = newEnd - 0.1;
      target.start = newStart;
      if (!isMulti) {
        this.elements.abStart.value = this.formatTime(newStart);
        this.seekToTime(newStart);
      }
    } else {
      let maxTime = this.state.currentVideoDuration || newEnd;
      newEnd = Math.min(maxTime, newEnd + amount);
      if (newEnd <= newStart) newEnd = newStart + 0.1;
      target.end = newEnd;
      if (!isMulti) {
        this.elements.abEnd.value = this.formatTime(newEnd);
        this.seekToTime(newEnd - 0.5);
      }
    }
    
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  shiftLoop(direction, segIndex = null) {
    if (!this.enforcePremiumFeature()) return;
    
    let target = this.state.abLoop;
    let isMulti = false;
    if (segIndex !== null && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments[segIndex]) {
      const startEl = document.getElementById(`multi-start-${segIndex}`);
      const endEl = document.getElementById(`multi-end-${segIndex}`);
      if (startEl && startEl._cascadingTime && endEl && endEl._cascadingTime) {
         let currentStart = startEl._cascadingTime.getValue();
         let currentEnd = endEl._cascadingTime.getValue();
         if (isNaN(currentStart)) currentStart = 0;
         if (isNaN(currentEnd) || currentEnd === 0) currentEnd = this.state.currentVideoDuration || 3600;
         
         const duration = currentEnd - currentStart;
         let newStart = currentStart + (duration * direction);
         let newEnd = currentEnd + (duration * direction);
         
         const maxTime = this.state.currentVideoDuration || newEnd;
         if (newStart < 0) {
           newStart = 0;
           newEnd = duration;
         } else if (newEnd > maxTime) {
           newEnd = maxTime;
           newStart = maxTime - duration;
           if (newStart < 0) newStart = 0;
         }
         
         startEl._cascadingTime.setValue(newStart);
         endEl._cascadingTime.setValue(newEnd);
         if (startEl._cascadingTime.onChange) startEl._cascadingTime.onChange(newStart, startEl);
         if (endEl._cascadingTime.onChange) endEl._cascadingTime.onChange(newEnd, endEl);
      }
      return;
    } else {
      if (!this.state.abLoop.active) {
        this.state.abLoop.active = true;
        this.state.abLoop.start = 0;
        this.state.abLoop.end = this.state.currentVideoDuration || 0;
      }
    }
    
    const duration = target.end - target.start;
    let newStart = target.start + (duration * direction);
    let newEnd = target.end + (duration * direction);
    
    const maxTime = this.state.currentVideoDuration || newEnd;
    
    if (newStart < 0) {
      newStart = 0;
      newEnd = duration;
    } else if (newEnd > maxTime) {
      newEnd = maxTime;
      newStart = maxTime - duration;
    }
    
    target.start = newStart;
    target.end = newEnd;
    
    if (isMulti) {
      this.renderMultiSegments();
    } else {
      this.elements.abStart.value = this.formatTime(newStart);
      this.elements.abEnd.value = this.formatTime(newEnd);
      this.seekToTime(newStart);
    }
    
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  scaleLoop(multiplier, segIndex = null) {
    if (!this.enforcePremiumFeature()) return;
    
    let target = this.state.abLoop;
    let isMulti = false;
    if (segIndex !== null && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments[segIndex]) {
      const startEl = document.getElementById(`multi-start-${segIndex}`);
      const endEl = document.getElementById(`multi-end-${segIndex}`);
      if (startEl && startEl._cascadingTime && endEl && endEl._cascadingTime) {
         let currentStart = startEl._cascadingTime.getValue();
         let currentEnd = endEl._cascadingTime.getValue();
         if (isNaN(currentStart)) currentStart = 0;
         if (isNaN(currentEnd) || currentEnd === 0) currentEnd = this.state.currentVideoDuration || 3600;
         
         const duration = currentEnd - currentStart;
         const newDuration = duration * multiplier;
         
         let newEnd = currentStart + newDuration;
         const maxTime = this.state.currentVideoDuration || newEnd;
         
         if (newEnd > maxTime) newEnd = maxTime;
         if (newEnd < currentStart + 0.1) newEnd = currentStart + 0.1;
         
         endEl._cascadingTime.setValue(newEnd);
         if (endEl._cascadingTime.onChange) endEl._cascadingTime.onChange(newEnd, endEl);
      }
      return;
    } else {
      if (!this.state.abLoop.active) {
        this.state.abLoop.active = true;
        this.state.abLoop.start = 0;
        this.state.abLoop.end = this.state.currentVideoDuration || 0;
      }
    }
    
    const duration = target.end - target.start;
    const newDuration = duration * multiplier;
    
    let newEnd = target.start + newDuration;
    const maxTime = this.state.currentVideoDuration || newEnd;
    
    if (newEnd > maxTime) newEnd = maxTime;
    if (newEnd <= target.start) newEnd = target.start + 0.1;
    
    target.end = newEnd;
    
    if (isMulti) {
      this.renderMultiSegments();
    } else {
      this.elements.abEnd.value = this.formatTime(newEnd);
    }
    
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  toggleAutoTempo(e) {
    if (!this.enforcePremiumFeature("Gradual Tempo Increase is a Premium feature!")) {
      e.target.checked = false;
      return;
    }
    this.state.isAutoTempoEnabled = e.target.checked;
    
    const speedSelect = document.getElementById('playback-speed');
    if (speedSelect) {
      if (this.state.isAutoTempoEnabled) {
        if (this.state.playbackRate !== 1) {
          this.setPlaybackSpeed(1);
        }
      } else {
        // Remove all temporary Auto options when disabling
        Array.from(speedSelect.options).forEach(opt => {
          if (opt.text.includes('(Auto)')) speedSelect.removeChild(opt);
        });
        if (this.state.playbackRate !== 1) {
          this.setPlaybackSpeed(1);
        }
      }
    }
    
    if (this.state.isAutoTempoEnabled) {
      this.showToast("Gradual Tempo enabled! Speed increases slightly each loop.", "trending-up");
    }
  }

  // Removed toggleABLoop function

  async checkABLoop() {
    if (!this.state.abLoop.active) return;
    if (this.state.abLoop.isChecking) return;
    
    this.state.abLoop.isChecking = true;
    
    try {
      await Promise.race([
        this._doCheckABLoop(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
      ]);
    } catch (e) {
      if (typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.warn("checkABLoop timeout/error:", e);
    } finally {
      this.state.abLoop.isChecking = false;
      if (this.state.abLoop.active) {
        this.state.abLoop.timer = setTimeout(() => this.checkABLoop(), 15);
      }
    }
  }

  async _doCheckABLoop() {
    const t = await this.getCurrentTime();
    const prevT = this.state.abLoop.lastTime || 0;
    this.state.abLoop.lastTime = t;
    
    if (!this.state.abLoop.multiSegments || this.state.abLoop.multiSegments.length === 0) {
      this.state.abLoop.multiSegments = [{ start: null, end: null }];
    }
    const segments = this.state.isMultiSegment ? this.state.abLoop.multiSegments : [{ start: this.state.abLoop.start !== null ? this.state.abLoop.start : 0, end: this.state.abLoop.end !== null ? this.state.abLoop.end : (this.state.currentVideoDuration || 0) }];
    const validSegmentsCount = segments.filter(seg => seg.start !== null && seg.end !== null).length;
    
    if (validSegmentsCount === 0) {
      const start = this.state.abLoop.start || 0;
      const end = this.state.abLoop.end || this.state.currentVideoDuration || 0;
      if (end > 0 && t >= end) {
        this.seekToTime(start);
        this.incrementLoops();
      } else if (t < start - 0.5) {
        this.seekToTime(start);
      }
      return;
    }
    
    let currentSegIndex = this.state.abLoop.currentSegmentIndex || 0;
    
    if (!segments[currentSegIndex] || segments[currentSegIndex].start === null || segments[currentSegIndex].end === null) {
      // The user is currently focused on an uninitialized segment (e.g. they just clicked Add Segment).
      // Let the video play normally so they can find their timestamps. Do not force a seek.
      return;
    }
    
    const seg = segments[currentSegIndex];
    
    const now = Date.now();
    if (this.state.abLoop.lastLoopAdvance && now - this.state.abLoop.lastLoopAdvance < 500) {
      return;
    }
    
    // NEW LOGIC
    // 1. Is 't' inside ANY valid segment?
    const activeSegIndex = segments.findIndex(s => s.start !== null && s.end !== null && t >= s.start && t < s.end);
    
    if (activeSegIndex !== -1) {
      if (activeSegIndex !== currentSegIndex) {
        // User manually seeked into a different segment
        this.state.abLoop.currentSegmentIndex = activeSegIndex;
        
        // Update speed for new segment
        const newSegSpeed = segments[activeSegIndex].speed || 1.0;
        if (this.state.playbackRate !== newSegSpeed) {
          this.setPlaybackSpeed(newSegSpeed, true);
        }
        if (this.updateTimelineUI) this.updateTimelineUI();
      }
      return; // All good, playing inside a valid segment
    }
    
    // 2. Not in any segment. Did we just naturally finish the current segment?
    if (t >= seg.end && t < seg.end + 1.5) {
      this.state.abLoop.lastLoopAdvance = now;
      this.advanceLoopSegment();
      return;
    }
    
    // 2.5. Natural loop jump (YouTube's native loop=1 skipped the t >= seg.end check)
    if (prevT > seg.end - 2.0 && t < (seg.start !== null ? seg.start : 0) + 2.0) {
      this.state.abLoop.lastLoopAdvance = now;
      this.advanceLoopSegment();
      return;
    }
    
    // 3. User manually seeked outside of any valid segment (into a gap, or out of bounds)
    this.state.abLoop.lastLoopAdvance = now;
    let nextIdx = segments.findIndex(s => s.start !== null && s.start >= t);
    if (nextIdx !== -1) {
      this.state.abLoop.currentSegmentIndex = nextIdx;
      this.seekToTime(segments[nextIdx].start);
      const newSegSpeed = segments[nextIdx].speed || 1.0;
      if (this.state.playbackRate !== newSegSpeed) {
        this.setPlaybackSpeed(newSegSpeed, true);
      }
      if (this.updateTimelineUI) this.updateTimelineUI();
    } else {
      // Seeked past the last segment. Wrap around to the first valid segment.
      let firstIdx = segments.findIndex(s => s.start !== null && s.end !== null);
      if (firstIdx === -1) firstIdx = 0;
      this.state.abLoop.currentSegmentIndex = firstIdx;
      this.seekToTime(segments[firstIdx].start);
      
      const newSegSpeed = segments[firstIdx].speed || 1.0;
      if (this.state.playbackRate !== newSegSpeed) {
        this.setPlaybackSpeed(newSegSpeed, true);
      }
      if (this.updateTimelineUI) this.updateTimelineUI();
    }
  }

  advanceLoopSegment() {
    if (!this.state.isMultiSegment || !this.state.abLoop.multiSegments || this.state.abLoop.multiSegments.length === 0) {
      if (this.incrementLoops()) return;
      this.seekToTime(this.state.abLoop.start || 0);
      return;
    }
    
    const segments = this.state.abLoop.multiSegments;
    let currentSegIndex = this.state.abLoop.currentSegmentIndex || 0;
    let nextIndex = currentSegIndex + 1;
    
    while (nextIndex < segments.length && (segments[nextIndex].start === null || segments[nextIndex].end === null)) {
      nextIndex++;
    }
    
    if (nextIndex >= segments.length) {
      nextIndex = segments.findIndex(s => s.start !== null && s.end !== null);
      
      if (this.incrementLoops()) return;
    }
    
    this.state.abLoop.currentSegmentIndex = nextIndex;
    
    this.seekToTime(segments[nextIndex].start);
    
    const newSegSpeed = segments[nextIndex].speed || 1.0;
    if (this.state.playbackRate !== newSegSpeed) {
      this.setPlaybackSpeed(newSegSpeed, true);
    }
    
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  jumpToLoopSegment(direction) {
    if (!this.state.isMultiSegment || !this.state.abLoop.multiSegments || this.state.abLoop.multiSegments.length === 0) return;
    
    const segments = this.state.abLoop.multiSegments;
    let currentSegIndex = this.state.abLoop.currentSegmentIndex || 0;
    
    // Find the next/prev valid segment
    let nextIndex = currentSegIndex + direction;
    while (nextIndex >= 0 && nextIndex < segments.length && (segments[nextIndex].start === null || segments[nextIndex].end === null)) {
      nextIndex += direction;
    }
    
    // Wrap around
    if (nextIndex >= segments.length) {
      nextIndex = segments.findIndex(s => s.start !== null && s.end !== null);
    } else if (nextIndex < 0) {
      // findLastIndex not widely supported in older browsers, use a loop
      for (let i = segments.length - 1; i >= 0; i--) {
        if (segments[i].start !== null && segments[i].end !== null) {
          nextIndex = i;
          break;
        }
      }
    }
    
    if (nextIndex === -1 || nextIndex === currentSegIndex) return; // No other valid segments to jump to
    
    this.state.abLoop.currentSegmentIndex = nextIndex;
    
    this.seekToTime(segments[nextIndex].start);
    
    const newSegSpeed = segments[nextIndex].speed || 1.0;
    if (this.state.playbackRate !== newSegSpeed) {
      this.setPlaybackSpeed(newSegSpeed, true);
    }
    
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  toggleMultiSegment(e) {
    const list = document.getElementById('multi-segment-list');
    const addBtn = document.getElementById('add-segment-btn');
    
    if (e.target.checked) {
      if (!this.enforcePremiumFeature("Advanced loop segments are a Premium feature.")) {
        e.target.checked = false;
        return;
      }
      
      this.state.isMultiSegment = true;

      // Force disable Gradual Tempo to prevent conflicts
      if (this.state.isAutoTempoEnabled) {
        this.state.isAutoTempoEnabled = false;
        const tempoCb = document.getElementById('auto-tempo-checkbox');
        if (tempoCb) tempoCb.checked = false;
      }
      const delBtn = document.getElementById('delete-all-segments-btn');
      const proControls = document.getElementById('main-pro-controls');
      
      list.classList.remove('hidden');
      addBtn.classList.remove('hidden');
      if (delBtn) delBtn.classList.remove('hidden');
      
      if (proControls) {
        proControls.style.opacity = '0.4';
        proControls.style.pointerEvents = 'none';
      }
      if (this.elements && this.elements.abStart) {
        this.elements.abStart.disabled = true;
        this.elements.abStart.style.opacity = '0.4';
        this.elements.abStart.style.pointerEvents = 'none';
      }
      if (this.elements && this.elements.abEnd) {
        this.elements.abEnd.disabled = true;
        this.elements.abEnd.style.opacity = '0.4';
        this.elements.abEnd.style.pointerEvents = 'none';
      }
      
      if (!this.state.abLoop.multiSegments) this.state.abLoop.multiSegments = [];
      if (this.state.abLoop.multiSegments.length === 0) {
        this.addLoopSegment();
      }
    } else {
      this.state.isMultiSegment = false;
      list.classList.add('hidden');
      addBtn.classList.add('hidden');
      const delBtn = document.getElementById('delete-all-segments-btn');
      if (delBtn) delBtn.classList.add('hidden');
      
      const proControls = document.getElementById('main-pro-controls');
      if (proControls) {
        proControls.style.opacity = '1';
        proControls.style.pointerEvents = 'auto';
      }
      if (this.elements && this.elements.abStart) {
        this.elements.abStart.disabled = false;
        this.elements.abStart.style.opacity = '1';
        this.elements.abStart.style.pointerEvents = 'auto';
      }
      if (this.elements && this.elements.abEnd) {
        this.elements.abEnd.disabled = false;
        this.elements.abEnd.style.opacity = '1';
        this.elements.abEnd.style.pointerEvents = 'auto';
      }
    }
    
    this.saveLoopData(); // Save the toggle state immediately
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
        this.openUpgradeModal("Advanced loop segments are a Premium feature!");
      } else {
        this.showToast(`Maximum of ${limit} segments reached.`, "alert-circle");
      }
      return;
    }
    
    this.state.abLoop.multiSegments.push({ start: null, end: null });
    this.state.abLoop.currentSegmentIndex = this.state.abLoop.multiSegments.length - 1;
    this.saveLoopData();
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  removeLoopSegment(index) {
    this.state.abLoop.multiSegments.splice(index, 1);
    if (this.state.abLoop.multiSegments.length === 0) {
      const dur = this.state.currentVideoDuration || 0;
      this.state.abLoop.multiSegments.push({ start: 0, end: dur, speed: 1.0 });
    }
    if (this.state.abLoop.currentSegmentIndex >= this.state.abLoop.multiSegments.length) {
      this.state.abLoop.currentSegmentIndex = 0;
    }
    this.saveLoopData();
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  async deleteAllSegments() {
    const confirmed = await window.app.showCustomConfirm({
      title: 'Delete All Segments',
      message: 'Are you sure you want to delete all segments?',
      isDestructive: true,
      okText: 'Delete All'
    });
    if (!confirmed) return;
    const dur = this.state.currentVideoDuration || 0;
    this.state.abLoop.multiSegments = [];
    this.state.abLoop.multiSegments.push({ start: 0, end: dur, speed: 1.0 });
    this.state.abLoop.currentSegmentIndex = 0;
    this.saveLoopData();
    if (this.updateTimelineUI) this.updateTimelineUI();
    if (this.showToast) this.showToast("All segments deleted.", "trash-2");
  }

  setSegmentSpeed(speed, index) {
    if (!this.state.abLoop.multiSegments[index]) return;
    const rate = parseFloat(speed) || 1.0;
    this.state.abLoop.multiSegments[index].speed = rate;
    
    // If this is the active segment, apply immediately
    if (this.state.abLoop.currentSegmentIndex === index) {
       this.setPlaybackSpeed(rate, true); 
    }
    this.saveLoopData();
  }

  saveMultiSegment(index) {
    if (!this.state.abLoop.multiSegments[index]) return;
    
    const startEl = document.getElementById(`multi-start-${index}`);
    const endEl = document.getElementById(`multi-end-${index}`);
    const speedEl = document.getElementById(`multi-speed-${index}`);
    
    let s = this.state.abLoop.multiSegments[index].start;
    let e = this.state.abLoop.multiSegments[index].end;
    let speed = this.state.abLoop.multiSegments[index].speed;
    
    if (startEl && startEl._cascadingTime) s = startEl._cascadingTime.getValue();
    if (endEl && endEl._cascadingTime) e = endEl._cascadingTime.getValue();
    if (speedEl) speed = parseFloat(speedEl.value) || 1.0;
    
    const duration = this.state.currentVideoDuration || 3600;
    
    s = Math.max(0, Math.min(s, duration));
    e = Math.max(0, Math.min(e, duration));
    if (s > e) s = e;
    if (isNaN(s)) s = 0;
    if (isNaN(e) || e === 0) e = duration;
    
    this.state.abLoop.multiSegments[index].start = s;
    this.state.abLoop.multiSegments[index].end = e;
    this.state.abLoop.multiSegments[index].speed = speed;
    
    this.state.abLoop.currentSegmentIndex = index;
    this.saveLoopData();
    if (this.updateTimelineUI) this.updateTimelineUI();
    this.renderMultiSegments();
    
    if (this.showToast) this.showToast("Segment saved!", "check-circle");
  }

  renderMultiSegments() {
    const list = document.getElementById('multi-segment-list');
    if (!list) return;
    
    const checkbox = document.getElementById('multi-segment-checkbox');
    const addBtn = document.getElementById('add-segment-btn');
    const isPremium = this.state.user && this.state.user.isPremium;

    const isMultiActive = this.state.isMultiSegment;
    if (checkbox) checkbox.checked = !!isMultiActive;

    if (isMultiActive && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 0) {
      list.classList.remove('hidden');
      
      if (this.elements && this.elements.abStart) {
        this.elements.abStart.disabled = true;
        this.elements.abStart.style.opacity = '0.4';
        this.elements.abStart.style.cursor = 'not-allowed';
        this.elements.abStart.style.pointerEvents = 'none';
      }
      if (this.elements && this.elements.abEnd) {
        this.elements.abEnd.disabled = true;
        this.elements.abEnd.style.opacity = '0.4';
        this.elements.abEnd.style.cursor = 'not-allowed';
        this.elements.abEnd.style.pointerEvents = 'none';
      }
      const proControls = document.getElementById('main-pro-controls');
      if (proControls) {
        proControls.style.opacity = '0.4';
        proControls.style.pointerEvents = 'none';
      }

      const isReadOnly = this.state.isReadOnlyShared;
      const delBtn = document.getElementById('delete-all-segments-btn');
      
      if (isReadOnly && addBtn) {
        addBtn.classList.add('hidden');
        if (delBtn) delBtn.classList.add('hidden');
      } else if (isPremium && addBtn) {
        addBtn.classList.remove('hidden');
        if (delBtn) delBtn.classList.remove('hidden');
        
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
        if (delBtn) delBtn.classList.add('hidden');
      }
    } else {
      if (checkbox && !checkbox.checked) {
        list.classList.add('hidden');
        if (addBtn) addBtn.classList.add('hidden');
        const delBtn = document.getElementById('delete-all-segments-btn');
        if (delBtn) delBtn.classList.add('hidden');
        
        const isReadOnly = this.state.isReadOnlyShared;
        
        if (this.elements && this.elements.abStart) {
          this.elements.abStart.disabled = false;
          this.elements.abStart.readOnly = isReadOnly;
          this.elements.abStart.style.opacity = isReadOnly ? '0.5' : '1';
          this.elements.abStart.style.cursor = isReadOnly ? 'not-allowed' : 'text';
          this.elements.abStart.onclick = isReadOnly ? () => app.openUpgradeModal('Upgrade to edit timestamps on shared links!') : null;
        }
        if (this.elements && this.elements.abEnd) {
          this.elements.abEnd.disabled = false;
          this.elements.abEnd.readOnly = isReadOnly;
          this.elements.abEnd.style.opacity = isReadOnly ? '0.5' : '1';
          this.elements.abEnd.style.cursor = isReadOnly ? 'not-allowed' : 'text';
          this.elements.abEnd.onclick = isReadOnly ? () => app.openUpgradeModal('Upgrade to edit timestamps on shared links!') : null;
        }
      }
    }

    const mainControls = document.getElementById('main-pro-controls');
    if (mainControls) {
      if (isMultiActive && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 0) {
        mainControls.style.opacity = '0.3';
        mainControls.style.pointerEvents = 'none';
      } else {
        mainControls.style.opacity = '1';
        mainControls.style.pointerEvents = 'auto';
      }
    }

    list.innerHTML = `
      <div class="text-xs text-yellow-500 mb-2" style="opacity: 0.8;">
        <i data-lucide="alert-triangle" style="width: 12px; height: 12px; display: inline;"></i> 
        Overlapping segments may cause playback issues.
      </div>
    `;
    
    this.state.abLoop.multiSegments.forEach((seg, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      
      const isActive = index === (this.state.abLoop.currentSegmentIndex || 0);
      const activeStyle = isActive ? 'border-color: var(--color-purple); box-shadow: 0 0 8px var(--color-purple-glow);' : 'border-color: #333;';
      
      const isReadOnly = this.state.isReadOnlyShared;
      const inputAttr = isReadOnly ? 'readonly style="opacity: 0.6; cursor: not-allowed;" onclick="app.openUpgradeModal(\'Upgrade to edit Advanced Loop Segments on shared links!\')"' : '';
      
      row.innerHTML = `
        <span class="text-xs text-gray-500 w-4" style="${isActive ? 'color: var(--color-purple); font-weight: bold;' : ''}">${index + 1}</span>
        <div style="flex: 1;">
          <input type="text" id="multi-start-${index}" data-index="${index}" data-type="start" class="time-input multi-seg-input" value="HH:MM:SS.sss" style="width: 100%; text-align: center; color: white; background-color: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 4px; font-family: monospace; font-size: 13px; cursor: text; ${activeStyle}" ${inputAttr}>
        </div>
        <span class="text-gray-500" style="margin: 0 4px;">to</span>
        <div style="flex: 1;">
          <input type="text" id="multi-end-${index}" data-index="${index}" data-type="end" class="time-input multi-seg-input" value="HH:MM:SS.sss" style="width: 100%; text-align: center; color: white; background-color: rgba(255,255,255,0.1); border: 1px solid #333; border-radius: 4px; font-family: monospace; font-size: 13px; cursor: text; ${activeStyle}" ${inputAttr}>
        </div>
        ${isReadOnly ? '' : `
          <button class="btn btn-secondary btn-sm delete-segment-btn tooltip" data-tip="Delete Segment" style="padding: 0 8px; height: 28px; min-height: 28px;"><i data-lucide="trash-2" style="width: 14px; height: 14px; color: #EF4444;"></i></button>
        `}
      `;
      const deleteBtn = row.querySelector('.delete-segment-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.removeLoopSegment(index);
        });
      }
      
      const speedValue = seg.speed || 1.0;
      
      const controlsRow = document.createElement('div');
      controlsRow.style.display = 'flex';
      controlsRow.style.gap = '4px';
      controlsRow.style.paddingLeft = '24px';
      controlsRow.style.marginTop = '4px';
      controlsRow.innerHTML = `
        <div style="display:flex; gap:2px;" class="tooltip" data-tip="Fine-tune Start">
          <button class="btn btn-secondary btn-sm" style="padding: 0 6px; height:24px; min-height:24px;" onclick="app.fineTuneLoop('start', -0.05, ${index})"><i data-lucide="minus" style="width:12px;height:12px;"></i></button>
          <button class="btn btn-secondary btn-sm" style="padding: 0 6px; height:24px; min-height:24px;" onclick="app.fineTuneLoop('start', 0.05, ${index})"><i data-lucide="plus" style="width:12px;height:12px;"></i></button>
        </div>
        <div style="display:flex; gap:2px;">
          <button class="btn btn-secondary btn-sm tooltip" data-tip="Shift Left" style="padding: 0 6px; height:24px; min-height:24px;" onclick="app.shiftLoop(-1, ${index})"><i data-lucide="arrow-left" style="width:12px;height:12px;"></i></button>
          <button class="btn btn-secondary btn-sm tooltip" data-tip="Shift Right" style="padding: 0 6px; height:24px; min-height:24px;" onclick="app.shiftLoop(1, ${index})"><i data-lucide="arrow-right" style="width:12px;height:12px;"></i></button>
        </div>
        <div style="display:flex; gap:2px;">
          <button class="btn btn-secondary btn-sm tooltip" data-tip="Halve Duration" style="padding: 0 6px; height:24px; min-height:24px; font-size:11px;" onclick="app.scaleLoop(0.5, ${index})">½x</button>
          <button class="btn btn-secondary btn-sm tooltip" data-tip="Double Duration" style="padding: 0 6px; height:24px; min-height:24px; font-size:11px;" onclick="app.scaleLoop(2, ${index})">2x</button>
        </div>
        <div style="display:flex; gap:2px;" class="tooltip" data-tip="Fine-tune End">
          <button class="btn btn-secondary btn-sm" style="padding: 0 6px; height:24px; min-height:24px;" onclick="app.fineTuneLoop('end', -0.05, ${index})"><i data-lucide="minus" style="width:12px;height:12px;"></i></button>
          <button class="btn btn-secondary btn-sm" style="padding: 0 6px; height:24px; min-height:24px;" onclick="app.fineTuneLoop('end', 0.05, ${index})"><i data-lucide="plus" style="width:12px;height:12px;"></i></button>
        </div>
        <div style="display:flex; gap:2px; margin-left: 4px;" class="tooltip" data-tip="Segment Speed">
          <select id="multi-speed-${index}" class="select-input" style="height:24px; min-height:24px; font-size:11px; padding: 0 4px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: #fff;" onchange="app.setSegmentSpeed(this.value, ${index})">
            <option style="color: #000; background: #fff;" value="0.25" ${speedValue == 0.25 ? 'selected' : ''}>0.25x</option>
            <option style="color: #000; background: #fff;" value="0.5" ${speedValue == 0.5 ? 'selected' : ''}>0.5x</option>
            <option style="color: #000; background: #fff;" value="0.75" ${speedValue == 0.75 ? 'selected' : ''}>0.75x</option>
            <option style="color: #000; background: #fff;" value="1" ${speedValue == 1 ? 'selected' : ''}>1x Normal</option>
            <option style="color: #000; background: #fff;" value="1.25" ${speedValue == 1.25 ? 'selected' : ''}>1.25x</option>
            <option style="color: #000; background: #fff;" value="1.5" ${speedValue == 1.5 ? 'selected' : ''}>1.5x</option>
            <option style="color: #000; background: #fff;" value="1.75" ${speedValue == 1.75 ? 'selected' : ''}>1.75x</option>
            <option style="color: #000; background: #fff;" value="2" ${speedValue == 2 ? 'selected' : ''}>2x</option>
          </select>
        </div>
      `;
      if (isReadOnly) {
        controlsRow.style.opacity = '0.4';
        controlsRow.style.pointerEvents = 'none';
      }
      
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.background = isActive ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)';
      container.style.borderRadius = '6px';
      container.style.padding = '8px';
      container.style.border = isActive ? '1px solid var(--color-purple)' : '1px solid var(--border-color)';
      container.style.transition = 'all 0.3s ease';
      
      container.appendChild(row);
      container.appendChild(controlsRow);
      
      list.appendChild(container);
    });
    
    let errorContainer = document.getElementById('multi-segment-error');
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'multi-segment-error';
      errorContainer.className = 'text-xs text-red-500 mt-1 hidden';
      list.appendChild(errorContainer);
    }
    
    if (window.CascadingTimeInput) {
      this.state.abLoop.multiSegments.forEach((seg, idx) => {
        const startEl = document.getElementById(`multi-start-${idx}`);
        const endEl = document.getElementById(`multi-end-${idx}`);
        
        const handleChange = (val, type, groupEl) => {
          const duration = this.state.currentVideoDuration || 3600;
          const segs = this.state.abLoop.multiSegments;
          
          if (val === null || isNaN(val)) {
            if (type === 'start') segs[idx].start = null;
            else segs[idx].end = null;
            
            this.state.abLoop.currentSegmentIndex = idx;
            this.saveLoopData();
            if (this.updateTimelineUI) this.updateTimelineUI();
            this.renderMultiSegments();
            return;
          }

          let boundedVal = Math.max(0, Math.min(val, duration));

          let maxPriorEnd = 0;
          for (let i = 0; i < idx; i++) {
            if (segs[i].start !== null && segs[i].end !== null) {
              maxPriorEnd = Math.max(maxPriorEnd, segs[i].end);
            }
          }

          let minNextStart = duration;
          for (let i = idx + 1; i < segs.length; i++) {
            if (segs[i].start !== null && segs[i].end !== null) {
              minNextStart = Math.min(minNextStart, segs[i].start);
            }
          }

          if (type === 'start') {
            boundedVal = Math.max(maxPriorEnd, boundedVal);
            if (segs[idx].end !== null) boundedVal = Math.min(boundedVal, segs[idx].end);
            segs[idx].start = boundedVal;
          } else {
            boundedVal = Math.min(minNextStart, boundedVal);
            if (segs[idx].start !== null) boundedVal = Math.max(boundedVal, segs[idx].start);
            segs[idx].end = boundedVal;
          }

          if (boundedVal !== val) {
             groupEl._cascadingTime.setValue(boundedVal);
          }

          if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.classList.add('hidden');
          }
          
          this.state.abLoop.currentSegmentIndex = idx;
          this.saveLoopData();
          if (this.updateTimelineUI) this.updateTimelineUI(true);
        };

        if (startEl) {
          const ciStart = new CascadingTimeInput(startEl, true, (val, el) => handleChange(val, 'start', el));
          ciStart.setValue(seg.start);
        }
        if (endEl) {
          const ciEnd = new CascadingTimeInput(endEl, true, (val, el) => handleChange(val, 'end', el));
          ciEnd.setValue(seg.end);
        }
      });
    }
    
    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
}
window.LoopsMixin = LoopsMixin;
