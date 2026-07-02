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
      target = this.state.abLoop.multiSegments[segIndex];
      isMulti = true;
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
      this.state.abLoop.end = newEnd;
      this.elements.abEnd.value = this.formatTime(newEnd);
      this.seekToTime(newEnd - 0.5);
    }
    
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  shiftLoop(direction, segIndex = null) {
    if (!this.enforcePremiumFeature()) return;
    
    let target = this.state.abLoop;
    let isMulti = false;
    if (segIndex !== null && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments[segIndex]) {
      target = this.state.abLoop.multiSegments[segIndex];
      isMulti = true;
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
      target = this.state.abLoop.multiSegments[segIndex];
      isMulti = true;
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
    
    // Freeze playback speed dropdown to prevent conflicts
    const speedSelect = document.getElementById('playback-speed');
    if (speedSelect) {
      if (this.state.isAutoTempoEnabled) {
        speedSelect.disabled = true;
        speedSelect.parentElement.style.opacity = '0.4';
        speedSelect.parentElement.title = "Playback Speed is frozen while Gradual Tempo is active";
      } else {
        speedSelect.disabled = false;
        speedSelect.parentElement.style.opacity = '1';
        speedSelect.parentElement.title = "";
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
        this.state.abLoop.timer = setTimeout(() => this.checkABLoop(), 100);
      }
    }
  }

  async _doCheckABLoop() {
    const t = await this.getCurrentTime();
    
    if (!this.state.abLoop.multiSegments || this.state.abLoop.multiSegments.length === 0) {
      this.state.abLoop.multiSegments = [{ start: null, end: null }];
    }
    const segments = this.state.isMultiSegment ? this.state.abLoop.multiSegments : [this.state.abLoop.multiSegments[0] || { start: this.state.abLoop.start || 0, end: this.state.abLoop.end || this.state.currentVideoDuration || 0 }];
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
      currentSegIndex = segments.findIndex(seg => seg.start !== null && seg.end !== null);
      if (currentSegIndex === -1) return;
      this.state.abLoop.currentSegmentIndex = currentSegIndex;
      this.seekToTime(segments[currentSegIndex].start);
      return;
    }
    
    const seg = segments[currentSegIndex];
    
    if (t >= seg.end && seg.end > 0) {
      let nextIndex = currentSegIndex + 1;
      
      while (nextIndex < segments.length && (segments[nextIndex].start === null || segments[nextIndex].end === null)) {
        nextIndex++;
      }
      
      if (nextIndex >= segments.length) {
        nextIndex = segments.findIndex(s => s.start !== null && s.end !== null);
        
        if (this.state.isAutoTempoEnabled) {
          let speed = this.state.playbackRate || 1.0;
          speed = Math.min(2.0, speed + 0.05);
          this.setPlaybackSpeed(speed.toFixed(2));
        }
        
        if (this.incrementLoops()) return;
      }
      
      this.state.abLoop.currentSegmentIndex = nextIndex;
      
      const newSegSpeed = segments[nextIndex].speed || 1.0;
      if (this.state.playbackRate !== newSegSpeed) {
        this.setPlaybackSpeed(newSegSpeed, true);
      }
      
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
      
      list.classList.remove('hidden');
      addBtn.classList.remove('hidden');
      
      if (!this.state.abLoop.multiSegments) this.state.abLoop.multiSegments = [];
      if (this.state.abLoop.multiSegments.length === 0) {
        this.addLoopSegment();
      }
    } else {
      this.state.isMultiSegment = false;
      list.classList.add('hidden');
      addBtn.classList.add('hidden');
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
      this.state.abLoop.multiSegments.push({ start: null, end: null, speed: 1.0 });
    }
    if (this.state.abLoop.currentSegmentIndex >= this.state.abLoop.multiSegments.length) {
      this.state.abLoop.currentSegmentIndex = 0;
    }
    this.saveLoopData();
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  setSegmentSpeed(index, speed) {
    if (!this.state.abLoop.multiSegments[index]) return;
    this.state.abLoop.multiSegments[index].speed = parseFloat(speed);
    this.saveLoopData();
    // If it's the currently active segment, apply it immediately
    if (this.state.abLoop.currentSegmentIndex === index) {
      this.setPlaybackSpeed(parseFloat(speed), true);
    }
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
        this.elements.abStart.style.opacity = '0.5';
        this.elements.abStart.style.cursor = 'not-allowed';
      }
      if (this.elements && this.elements.abEnd) {
        this.elements.abEnd.disabled = true;
        this.elements.abEnd.style.opacity = '0.5';
        this.elements.abEnd.style.cursor = 'not-allowed';
      }

      const isReadOnly = this.state.isReadOnlyShared;
      
      if (isReadOnly && addBtn) {
        addBtn.classList.add('hidden');
      } else if (isPremium && addBtn) {
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
      const activeStyle = isActive ? 'border-color: var(--color-primary); box-shadow: 0 0 5px var(--color-primary);' : 'border-color: #333;';
      
      const isReadOnly = this.state.isReadOnlyShared;
      const groupClass = isReadOnly ? 'time-split-group disabled multi-seg-group' : 'time-split-group enabled multi-seg-group';
      const inputAttr = isReadOnly ? 'readonly style="opacity: 0.6; cursor: not-allowed;" onclick="app.openUpgradeModal(\'Upgrade to edit Advanced Loop Segments on shared links!\')"' : '';
      
      row.innerHTML = `
        <span class="text-xs text-gray-500 w-4">${index + 1}</span>
        <div class="${groupClass}" data-index="${index}" data-type="start" style="${activeStyle}">
          <input type="text" class="ts-h" placeholder="HH" maxlength="2" ${inputAttr}><span class="ts-sep">:</span>
          <input type="text" class="ts-m" placeholder="MM" maxlength="2" ${inputAttr}><span class="ts-sep">:</span>
          <input type="text" class="ts-s" placeholder="SS" maxlength="2" ${inputAttr}><span class="ts-sep">.</span>
          <input type="text" class="ts-ms" placeholder="sss" maxlength="3" ${inputAttr}>
        </div>
        <span class="text-gray-500" style="margin: 0 4px;">to</span>
        <div class="${groupClass}" data-index="${index}" data-type="end" style="${activeStyle}">
          <input type="text" class="ts-h" placeholder="HH" maxlength="2" ${inputAttr}><span class="ts-sep">:</span>
          <input type="text" class="ts-m" placeholder="MM" maxlength="2" ${inputAttr}><span class="ts-sep">:</span>
          <input type="text" class="ts-s" placeholder="SS" maxlength="2" ${inputAttr}><span class="ts-sep">.</span>
          <input type="text" class="ts-ms" placeholder="sss" maxlength="3" ${inputAttr}>
        </div>
        ${isReadOnly ? '' : '<button class="icon-btn text-red-500 delete-segment-btn" style="padding: 4px;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>'}
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
      if (!isReadOnly) {
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
            <select class="select-input" style="height:24px; min-height:24px; font-size:11px; padding: 0 4px; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: #fff;" onchange="app.setSegmentSpeed(${index}, this.value)">
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
      }
      
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.background = 'rgba(255,255,255,0.02)';
      container.style.borderRadius = '6px';
      container.style.padding = '8px';
      container.style.border = '1px solid var(--border-color)';
      
      container.appendChild(row);
      if (!isReadOnly) {
        container.appendChild(controlsRow);
      }
      
      list.appendChild(container);
    });
    
    let errorContainer = document.createElement('div');
    errorContainer.id = 'multi-segment-error';
    errorContainer.className = 'text-xs text-red-500 mt-1 hidden';
    list.appendChild(errorContainer);
    
    list.querySelectorAll('.multi-seg-group').forEach(group => {
      const idx = parseInt(group.dataset.index, 10);
      const type = group.dataset.type;
      const seg = this.state.abLoop.multiSegments[idx];
      this.setSplitTimeValue(group, seg[type]);
      
      this.bindSplitTimeGroup(group, () => {
        const val = this.getSplitTimeValue(group);
        const duration = this.state.currentVideoDuration || 3600;
        const segs = this.state.abLoop.multiSegments;
        
        if (val === null) {
          if (type === 'start') segs[idx].start = null;
          else segs[idx].end = null;
          
          this.state.abLoop.currentSegmentIndex = idx;
          this.saveLoopData();
          if (this.updateTimelineUI) this.updateTimelineUI();
          this.renderMultiSegments();
          return;
        }

        const proposedStart = type === 'start' ? val : segs[idx].start;
        const proposedEnd = type === 'end' ? val : segs[idx].end;

        if (proposedStart !== null && proposedEnd !== null && proposedStart >= proposedEnd) {
          this.showToast("Start time must be before End time. Input rejected.", "alert-triangle");
          this.setSplitTimeValue(group, segs[idx][type]);
          return;
        }

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

        if (proposedStart !== null && proposedStart < maxPriorEnd) {
          this.showToast("Overlapping segments detected. Input rejected.", "alert-triangle");
          this.setSplitTimeValue(group, segs[idx][type]);
          return;
        }

        if (proposedEnd !== null && proposedEnd > minNextStart) {
          this.showToast("Overlapping segments detected. Input rejected.", "alert-triangle");
          this.setSplitTimeValue(group, segs[idx][type]);
          return;
        }

        if (type === 'start') segs[idx].start = val;
        else segs[idx].end = val;

        group.style.borderColor = '';
        const errorEl = document.getElementById('multi-segment-error');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.add('hidden');
        }
        
        this.state.abLoop.currentSegmentIndex = idx;
        this.saveLoopData();
        if (this.updateTimelineUI) this.updateTimelineUI();
        this.renderMultiSegments();
      });
    });
    
    if (window.lucide) window.lucide.createIcons();
  }

  // ==========================================
}
window.LoopsMixin = LoopsMixin;
