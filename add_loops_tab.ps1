$content = Get-Content app.js -Encoding UTF8 -Raw

# 1. Update saveNamedLoop
$saveLoopFind = 'if \(!db\.segments\[key\]\) \{\s*db\.segments\[key\] = \{\s*platform: this\.state\.currentPlatform,\s*videoId: this\.state\.currentVideo\.id,\s*videoTitle: this\.state\.currentVideo\.title,\s*start: start,\s*end: end,\s*name: name,\s*loops: 0\s*\};\s*\} else \{\s*db\.segments\[key\]\.name = name;\s*\}\s*this\.saveDb\(''analytics'', db\);\s*this\.elements\.loopNameInput\.value = '''';\s*this\.showToast\(`Loop saved as "\$\{name\}"`, "save"\);\s*if \(this\.state\.activeTab === ''analytics''\) this\.renderAnalyticsTab\(\);'

$saveLoopReplace = 'if (!db.segments[key]) {
        db.segments[key] = {
          platform: this.state.currentPlatform,
          videoId: this.state.currentVideo.id,
          videoTitle: this.state.currentVideo.title,
          start: start,
          end: end,
          name: name,
          loops: 0,
          savedAt: Date.now(),
          editedAt: Date.now()
        };
      } else {
        db.segments[key].name = name;
        db.segments[key].editedAt = Date.now();
      }
      this.saveDb(''analytics'', db);
      this.elements.loopNameInput.value = '''';
      this.showToast(`Loop saved as "${name}"`, "save");
      if (this.state.activeTab === ''analytics'') this.renderAnalyticsTab();
      if (this.state.activeTab === ''saved-loops'') this.renderSavedLoopsTab();'

$content = $content -replace $saveLoopFind, $saveLoopReplace

# 2. Add to elements
$elementsFind = 'tabNotesBtn: document.getElementById\(''tab-notes-btn''\),'
$elementsReplace = 'tabSavedLoopsBtn: document.getElementById(''tab-saved-loops-btn''),
      tabSavedLoops: document.getElementById(''tab-saved-loops''),
      savedLoopsList: document.getElementById(''saved-loops-list''),
      savedLoopsEmpty: document.getElementById(''saved-loops-empty''),
      tabNotesBtn: document.getElementById(''tab-notes-btn''),'

$content = $content -replace $elementsFind, $elementsReplace

# 3. Update switchTab active class
$switchTabClassFind = 'this\.elements\.tabHistoryBtn\.classList\.toggle\(''active'', tabId === ''history''\);'
$switchTabClassReplace = 'this.elements.tabHistoryBtn.classList.toggle(''active'', tabId === ''history'');
      if (this.elements.tabSavedLoopsBtn) this.elements.tabSavedLoopsBtn.classList.toggle(''active'', tabId === ''saved-loops'');'

$content = $content -replace $switchTabClassFind, $switchTabClassReplace

# 4. Update switchTab panels
$switchTabPanelsFind = '''history'': this\.elements\.tabHistory,\s*''notes'': this\.elements\.tabNotes,'
$switchTabPanelsReplace = '''history'': this.elements.tabHistory,
        ''saved-loops'': this.elements.tabSavedLoops,
        ''notes'': this.elements.tabNotes,'

$content = $content -replace $switchTabPanelsFind, $switchTabPanelsReplace

# 5. Add renderSavedLoopsTab before renderAnalyticsTab
$renderTabFind = 'renderAnalyticsTab\(\) \{'
$renderTabReplace = 'renderSavedLoopsTab() {
    const db = this.getDb(''analytics'');
    const segmentsArr = Object.values(db.segments || {});
    
    // Sort logic
    const sortSelect = document.getElementById(''saved-loops-sort'');
    const sortBy = sortSelect ? sortSelect.value : ''recent_add'';
    
    segmentsArr.sort((a, b) => {
      if (sortBy === ''recent_add'') return (b.savedAt || 0) - (a.savedAt || 0);
      if (sortBy === ''recent_edit'') return (b.editedAt || 0) - (a.editedAt || 0);
      if (sortBy === ''alpha'') return (a.name || '''').localeCompare(b.name || '''');
      return 0;
    });

    const listEl = this.elements.savedLoopsList;
    if (!listEl) return;
    listEl.innerHTML = '''';
    
    if (segmentsArr.length === 0) {
      if (this.elements.savedLoopsEmpty) this.elements.savedLoopsEmpty.classList.remove(''hidden'');
      return;
    }
    if (this.elements.savedLoopsEmpty) this.elements.savedLoopsEmpty.classList.add(''hidden'');

    // Group by video
    const grouped = {};
    segmentsArr.forEach(seg => {
      const vId = `${seg.platform}_${seg.videoId}`;
      if (!grouped[vId]) {
        grouped[vId] = {
          title: seg.videoTitle || `Video: ${seg.videoId}`,
          platform: seg.platform,
          videoId: seg.videoId,
          segments: []
        };
      }
      grouped[vId].segments.push(seg);
    });

    Object.values(grouped).forEach(videoGroup => {
      const div = document.createElement(''div'');
      div.className = ''note-item'';
      div.style = "display: flex; flex-direction: column; background: var(--surface-color); border: 1px solid #333; border-radius: 8px; overflow: hidden; margin-bottom: 8px;";
      
      const thumbUrl = this.getThumbnailUrl(videoGroup.platform, videoGroup.videoId);
      
      let headerHtml = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-bottom: 1px solid #333;">
          <img src="${thumbUrl}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; background: #000;" onerror="this.src=''data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=''">
          <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
            <span style="font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px;">
              ${this.escapeHtml(videoGroup.title)}
            </span>
            <span style="font-size: 11px; color: #888; text-transform: uppercase;">${videoGroup.platform}</span>
          </div>
        </div>
        <div style="padding: 8px 12px; display: flex; flex-direction: column; gap: 6px;">
      `;
      
      let segmentsHtml = '''';
      videoGroup.segments.forEach(seg => {
        const urlParams = `?url=${encodeURIComponent(seg.platform + ''_'' + seg.videoId)}&start=${seg.start}&end=${seg.end}`;
        segmentsHtml += `
          <a href="${urlParams}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; text-decoration: none; color: white; transition: background 0.2s;" onmouseover="this.style.background=''rgba(255,255,255,0.05)''" onmouseout="this.style.background=''rgba(0,0,0,0.2)''">
            <span style="font-weight: 500; font-size: 13px;">${this.escapeHtml(seg.name || ''Unnamed Loop'')}</span>
            <span style="font-size: 12px; color: #888; font-family: monospace;">${this.formatTime(seg.start)} - ${this.formatTime(seg.end)}</span>
          </a>
        `;
      });
      
      div.innerHTML = headerHtml + segmentsHtml + `</div>`;
      listEl.appendChild(div);
    });
  }

  renderAnalyticsTab() {`

$content = $content -replace $renderTabFind, $renderTabReplace

Set-Content app.js -Value $content -Encoding UTF8
Write-Host "Modified app.js"
