class CascadingTimeInput {
  constructor(inputEl, withMillis = false, onChange = null) {
    this.inputEl = inputEl;
    this.withMillis = withMillis;
    this.onChange = onChange;
    
    this.defaultChars = this.withMillis ? ['H','H','M','M','S','S','s','s','s'] : ['H','H','M','M','S','S'];
    this.chars = [...this.defaultChars];
    
    this.inputEl.value = this.format();
    
    this.inputEl.addEventListener('keydown', this.handleKeydown.bind(this));
    this.inputEl.addEventListener('click', this.handleClick.bind(this));
    this.inputEl.addEventListener('focus', this.handleClick.bind(this));
    this.inputEl.addEventListener('blur', () => {
      if (this.onChange) this.onChange(this.getValue(), this.inputEl);
    });
    this.inputEl.addEventListener('select', (e) => {
      if (this._programmaticSelect) return;
      if (this._handlingSelect) return;
      this._handlingSelect = true;
      this.handleClick(e);
      setTimeout(() => this._handlingSelect = false, 10);
    });
    
    this.inputEl._cascadingTime = this;
  }

  getActiveEndIndex() {
    const pos = this.inputEl.selectionStart;
    if (pos <= 2) return 1;
    if (pos <= 5) return 3;
    if (this.withMillis && pos > 8) return 8;
    return 5;
  }
  
  selectBlock(endIndex) {
    if (endIndex === 1) this.inputEl.setSelectionRange(0, 2);
    else if (endIndex === 3) this.inputEl.setSelectionRange(3, 5);
    else if (endIndex === 5) this.inputEl.setSelectionRange(6, 8);
    else if (endIndex === 8) this.inputEl.setSelectionRange(9, 13);
  }

  handleClick(e) {
    const endIndex = this.getActiveEndIndex();
    if (this._lastEndIndex !== endIndex) {
      this._blockFresh = true;
      this._lastEndIndex = endIndex;
    }
    this.selectBlock(endIndex);
  }

  handleKeydown(e) {
    if (e.key === 'Enter') {
      this.inputEl.blur();
      return;
    }
    if (e.key === 'Tab' || e.ctrlKey || e.metaKey) return;
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const endIndex = this.getActiveEndIndex();
      let nextEnd = endIndex;
      if (e.key === 'ArrowRight') {
        if (endIndex === 1) nextEnd = 3;
        else if (endIndex === 3) nextEnd = 5;
        else if (endIndex === 5 && this.withMillis) nextEnd = 8;
      } else {
        if (endIndex === 8) nextEnd = 5;
        else if (endIndex === 5) nextEnd = 3;
        else if (endIndex === 3) nextEnd = 1;
      }
      this._blockFresh = true;
      this._lastEndIndex = nextEnd;
      this.selectBlock(nextEnd);
      return;
    }
    
    const endIndex = this.getActiveEndIndex();
    const startIndex = endIndex === 1 ? 0 : (endIndex === 3 ? 2 : (endIndex === 5 ? 4 : 6));
    const blockLength = endIndex - startIndex + 1;
    
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      
      if (this._blockFresh) {
        for (let i = startIndex; i < endIndex; i++) {
          this.chars[i] = '0';
        }
        this.chars[endIndex] = e.key;
        this._blockFresh = false;
        this._typedCount = 1;
      } else {
        for (let i = startIndex; i < endIndex; i++) {
          this.chars[i] = this.chars[i + 1];
        }
        this.chars[endIndex] = e.key;
        this._typedCount = (this._typedCount || 0) + 1;
      }
      
      let targetEnd = endIndex;
      if (this._typedCount >= blockLength) {
        if (endIndex === 1) targetEnd = 3;
        else if (endIndex === 3) targetEnd = 5;
        else if (endIndex === 5 && this.withMillis) targetEnd = 8;
        
        if (targetEnd !== endIndex) {
          this._blockFresh = true;
        }
      }
      this.updateUI(targetEnd);
      
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      
      for (let i = endIndex; i > startIndex; i--) {
        this.chars[i] = this.chars[i - 1];
      }
      this.chars[startIndex] = '0';
      this._typedCount = Math.max(0, (this._typedCount || 0) - 1);
      
      this.updateUI(endIndex);
    } else if (e.key.length === 1) {
      e.preventDefault();
    }
  }

  updateUI(endIndex) {
    this._lastEndIndex = endIndex;
    this.inputEl.value = this.format();
    this._programmaticSelect = true;
    this.selectBlock(endIndex);
    this._programmaticSelect = false;
  }

  format() {
    let str = `${this.chars[0]}${this.chars[1]}:${this.chars[2]}${this.chars[3]}:${this.chars[4]}${this.chars[5]}`;
    if (this.withMillis) {
      str += `.${this.chars[6]}${this.chars[7]}${this.chars[8]}`;
    }
    return str;
  }
  
  getValue() {
    let hStr = this.chars[0] + this.chars[1];
    let mStr = this.chars[2] + this.chars[3];
    let sStr = this.chars[4] + this.chars[5];
    let h = parseInt(hStr.replace(/[a-zA-Z]/g, '')) || 0;
    let m = parseInt(mStr.replace(/[a-zA-Z]/g, '')) || 0;
    let s = parseInt(sStr.replace(/[a-zA-Z]/g, '')) || 0;
    let total = (h * 3600) + (m * 60) + s;
    if (this.withMillis) {
       let msStr = this.chars[6] + this.chars[7] + this.chars[8];
       let ms = parseInt(msStr.replace(/[a-zA-Z]/g, '')) || 0;
       total += (ms / 1000);
    }
    return total;
  }

  setValue(seconds) {
    if (document.activeElement === this.inputEl) return;
    
    if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
      this.chars = [...this.defaultChars];
      this.inputEl.value = this.format();
      return;
    }
    let h = Math.floor(seconds / 3600);
    let m = Math.floor((seconds % 3600) / 60);
    let s = Math.floor(seconds % 60);
    let ms = Math.floor((seconds % 1) * 1000);
    
    let hStr = h.toString().padStart(2, '0');
    let mStr = m.toString().padStart(2, '0');
    let sStr = s.toString().padStart(2, '0');
    let msStr = ms.toString().padStart(3, '0');
    
    this.chars[0] = hStr[0]; this.chars[1] = hStr[1];
    this.chars[2] = mStr[0]; this.chars[3] = mStr[1];
    this.chars[4] = sStr[0]; this.chars[5] = sStr[1];
    if (this.withMillis) {
      this.chars[6] = msStr[0]; this.chars[7] = msStr[1]; this.chars[8] = msStr[2];
    }
    this.inputEl.value = this.format();
  }
}
window.CascadingTimeInput = CascadingTimeInput;


/**
 * WatchOnRepeat - Core Application Logic
 */

const SUPABASE_URL = 'https://golkbcdlxpojjwqtyuzn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_e1gQuU0n8FofmTkitqTEQQ_pi1g8fqD';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
window.supabaseClient = supabaseClient;

const DEBUG_MODE = false;

if (typeof lucide === 'undefined') {
  window.lucide = { createIcons: () => {} };
}



window.addEventListener('error', function(e) {
  console.error("Global Error Caught:", e.error);
  if (window.app && typeof window.app.showToast === 'function') {
    window.app.showToast("An unexpected error occurred. " + (e.message || ""), "alert-circle");
  }
});
window.addEventListener('unhandledrejection', function(e) {
  console.error("Unhandled Promise Rejection:", e.reason);
  if (window.app && typeof window.app.showToast === 'function') {
    window.app.showToast("An unexpected error occurred. " + (e.reason?.message || "Promise failed"), "alert-circle");
  }
});



class WatchOnRepeat {
  constructor() {
    // Database and State
    this.state = {
      user: null,
      currentVideo: null, // { id, platform, title, duration }
      personalLoops: 0,
      sessionTotalLoops: 0,
      currentGlobalLoops: 0,
      currentGlobalPlays: 0,
      currentLifetimeLoops: 0,
      loopTimer: null,
      loopSeconds: 0,
      activeTab: 'discover',
      players: {
        youtube: null,
        vimeo: null,
        dailymotion: null,
        html5: null
      },
      searchQuery: '',
      showNoteMarkers: true,
      currentPlatform: null,
      abLoop: {
        active: true,
        start: 0,
        end: 0,
        timer: null
      },
      playbackRate: 1,
      guestPromptShown: false,
      analyticsSession: {
        videoId: null,
        platform: null,
        title: null,
        loops: 0,
        startTime: null
      }
    };

    // DOM Elements Cache
    this.elements = {};
    
    // Bind methods
    this.handleYouTubeStateChange = this.handleYouTubeStateChange.bind(this);
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.state.isOffline = false;
      this.showToast('Back online! Reconnecting...', 'wifi');
    });
    window.addEventListener('offline', () => {
      this.state.isOffline = true;
      this.showToast('You are offline. Only Local Video is available.', 'wifi-off');
    });
    window.addEventListener('beforeunload', () => {
      this.flushAnalytics();
    });
  }

  // ==========================================
  // EVENT TRACKING (SUPABASE)
  // ==========================================

  getOrCreateSessionId() {
    let sid = localStorage.getItem('wor_session_id');
    if (!sid) {
      sid = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('wor_session_id', sid);
    }
    return sid;
  }

  flushAnalytics() {
    if (!window.supabaseClient) return;
    const session = this.state.analyticsSession;
    if (session.loops === 0 || !session.videoId || session.platform === 'local') return;

    const userId = this.state.user ? this.state.user.id : this.getOrCreateSessionId();
    const duration = Math.floor((Date.now() - session.startTime) / 1000);

    supabaseClient.from('events').insert({
      event_name: 'batched_session',
      user_id: userId,
      metadata: {
        video_id: session.videoId,
        video_title: session.title,
        platform: session.platform,
        loops: session.loops,
        watch_time_seconds: duration
      },
      created_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error && typeof DEBUG_MODE !== 'undefined' && DEBUG_MODE) console.error("Error logging batched session:", error);
    });

    // Reset loop count but keep the session active
    this.state.analyticsSession.loops = 0;
    this.state.analyticsSession.startTime = Date.now();
  }

  async syncUserDataFromCloud() {
    if (!this.state.user || !window.supabaseClient) return;

    try {
      const { data, error } = await supabaseClient
        .from('user_history')
        .select('video_id, platform, saved_loop_data, notes_data')
        .eq('user_id', this.state.user.id);
        
      if (error) {
        console.error("Failed to sync user data from cloud:", error);
        return;
      }
      
      if (data && data.length > 0) {
        let localSavedLoops = JSON.parse(localStorage.getItem('wor_saved_loops') || '{}');
        let localNotes = this.getDb('notes');
        
        data.forEach(row => {
          if (row.saved_loop_data) {
            localSavedLoops[row.video_id] = row.saved_loop_data;
          }
          if (row.notes_data) {
            const vId = `${row.platform}_${row.video_id}`;
            localNotes[vId] = row.notes_data;
          }
        });
        
        localStorage.setItem('wor_saved_loops', JSON.stringify(localSavedLoops));
        this.saveDb('notes', localNotes);
      }
    } catch(err) {
      console.error("Sync error:", err);
    }
  }

  async setUserFromSession(session) {
    const user = session.user;
    let tier = 'free';
    let subscriptionEndDate = null;
    let cancelAtPeriodEnd = false;
    let loginCount = 1;

    const avatar = user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.email || 'user');
    const username = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
    const provider = user.app_metadata?.provider || 'Email';

    if (window.supabaseClient) {
      const { data } = await supabaseClient.from('users').select('*').eq('id', user.id).single();
      if (data) {
        tier = data.tier;
        subscriptionEndDate = data.subscription_end_date;
        cancelAtPeriodEnd = data.cancel_at_period_end;
        loginCount = (data.login_count || 0) + 1;
        
        const { error: updateError } = await supabaseClient.from('users').update({
          last_active_date: new Date().toISOString(),
          login_count: loginCount,
          full_name: username,
          provider: provider
        }).eq('id', user.id);
        if (updateError) {
          console.error("Failed to update user tracking:", updateError);
          this.showToast("DB Update Error: " + updateError.message, "alert-circle");
        }
      } else {
        const { error: insertError } = await supabaseClient.from('users').insert({ 
          id: user.id, 
          email: user.email, 
          tier: 'free',
          full_name: username,
          provider: provider,
          last_active_date: new Date().toISOString(),
          login_count: 1
        });
        if (insertError) {
          if (insertError.code === '23505') {
            // Race condition: another tab already inserted the user. Safe to ignore.
            if (DEBUG_MODE) console.log("User already exists (race condition handled).");
          } else {
            console.error("Failed to insert new user:", insertError);
            this.showToast("DB Insert Error: " + insertError.message, "alert-circle");
          }
        } else {
          this.showToast("Account successfully synced to Database!", "check-circle");
        }
      }
    } else {
      tier = user.user_metadata?.tier || 'free';
    }
    
    this.state.user = {
      id: user.id,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      email: user.email,
      avatar: avatar,
      provider: provider,
      tier: tier,
      isPremium: tier === 'premium' || tier === 'pro',
      subscriptionEndDate: subscriptionEndDate,
      cancelAtPeriodEnd: cancelAtPeriodEnd
    };
    
    // Update DB of registered users locally for reference
    const users = this.getDb('users');
    if (!users.some(u => u.email === this.state.user.email)) {
      users.push(this.state.user);
      this.saveDb('users', users);
    }
    
    await this.syncUserDataFromCloud();

    this.updateUserUI();
    this.closeLoginModal();
    
    if (this.state.currentVideo) {
      this.addToHistory(this.state.currentVideo.id, this.state.currentVideo.platform, this.state.currentVideo.title);
      this.updateFavoriteButtonUI();
      this.updateStatsUI();
    }
  }

  async init() {
    this.cacheElements();
    

    // Initialize Supabase Auth Session
    if (supabaseClient) {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) console.warn("Supabase session error:", error);
        if (session) {
          await this.setUserFromSession(session);
        }
        
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            if (session) await this.setUserFromSession(session);
          } else if (event === 'SIGNED_OUT') {
            this.state.user = null;
            this.updateUserUI();
          }
        });
      } catch (err) {
        console.warn("Failed to initialize Supabase auth:", err);
      }
    }

    this.setupEventListeners();
    this.loadSDKs();
    this.generateBookmarklet();
    this.initHotkeys();
    this.initMobileLayout();
    
    // One-time cleanup of corrupted loop saves from the old || 10 bug.
    // This runs once and sets a flag so it never runs again.
    if (!localStorage.getItem('wor_loops_cleaned_v1')) {
      try {
        const savedLoops = JSON.parse(localStorage.getItem('wor_saved_loops') || '{}');
        let cleaned = false;
        for (const videoId in savedLoops) {
          const loop = savedLoops[videoId];
          if (loop.start === 0 && loop.end > 0 && loop.end <= 10.5) {
            delete savedLoops[videoId]; // Remove corrupted entry entirely
            cleaned = true;
          }
          // Also clean corrupted multiSegments
          if (loop.multiSegments && loop.multiSegments.length > 0) {
            loop.multiSegments.forEach(seg => {
              if (seg.start === 0 && seg.end > 0 && seg.end <= 10.5) {
                seg.end = 0; // Will be corrected to duration when video loads
                cleaned = true;
              }
            });
          }
        }
        if (cleaned) {
          localStorage.setItem('wor_saved_loops', JSON.stringify(savedLoops));
        }
        localStorage.setItem('wor_loops_cleaned_v1', '1');
      } catch(e) { /* ignore */ }
    }
    
    if (!this.timelineInitialized) {
      this.initTimeline();
      this.timelineInitialized = true;
    }
    
    // Check URL parameters for auto-loading
    this.handleRouting();
    
    // Initial Render
    this.renderDiscoverTab();
    this.updateUserUI();
    this.updateStatsUI();
    
    // Check Privacy Consent
    if (!localStorage.getItem('wor_privacy_consent')) {
      const banner = document.getElementById('privacy-consent-banner');
      if (banner) banner.classList.remove('hidden');
    }
  }

  acceptPrivacyConsent() {
    localStorage.setItem('wor_privacy_consent', 'accepted');
    const banner = document.getElementById('privacy-consent-banner');
    if (banner) banner.classList.add('hidden');
  }

  cacheElements() {
    this.elements = {
      searchForm: document.getElementById('search-form'),
      videoInput: document.getElementById('video-url-input'),
      authLoggedOut: document.getElementById('auth-logged-out'),
      authLoggedIn: document.getElementById('auth-logged-in'),
      userAvatar: document.getElementById('user-avatar'),
      userName: document.getElementById('user-name'),
      userEmail: document.getElementById('user-email'),
      userMenu: document.getElementById('user-menu'),
      upgradeModal: document.getElementById('premium-unlock-modal'),
      upgradeMessage: document.getElementById('premium-unlock-message'),
      
      // States
      playerEmpty: document.getElementById('player-empty-state'),
      playerLoaded: document.getElementById('player-loaded-state'),
      playerContainer: document.getElementById('player-iframe-container'),
      
      // Video details
      platformBadge: document.getElementById('platform-badge'),
      platformText: document.getElementById('platform-text'),
      videoTitle: document.getElementById('video-title'),
      favoriteBtn: document.getElementById('favorite-btn'),
      
      // Stats
      personalLoopCount: document.getElementById('personal-loop-count'),
      sessionTotalLoopCount: document.getElementById('session-total-loop-count'),
      personalLifetimeCount: document.getElementById('personal-lifetime-count'),
      allTimeTotalCount: document.getElementById('all-time-total-count'),
      globalLoopCount: document.getElementById('global-loop-count'),
      platformTotalLoops: document.getElementById('platform-total-loops'),
      loopStateText: document.getElementById('loop-state-text'),
      loopTimer: document.getElementById('loop-timer'),
      
      // Tabs
      tabDiscover: document.getElementById('tab-discover'),
      tabFavorites: document.getElementById('tab-favorites'),
      tabHistory: document.getElementById('tab-history'),
      
      tabDiscoverBtn: document.getElementById('tab-discover-btn'),
      tabFavoritesBtn: document.getElementById('tab-favorites-btn'),
      tabHistoryBtn: document.getElementById('tab-history-btn'),
      tabSavedLoopsBtn: document.getElementById('tab-saved-loops-btn'),
      tabSavedLoops: document.getElementById('tab-saved-loops'),
      savedLoopsList: document.getElementById('saved-loops-list'),
      savedLoopsEmpty: document.getElementById('saved-loops-empty'),
      tabNotesBtn: document.getElementById('tab-notes-btn'),
      
      // Lists and Notes
      discoverList: document.getElementById('discover-list'),
      favoritesList: document.getElementById('favorites-list'),
      favoritesEmpty: document.getElementById('favorites-empty'),
      favoritesCountBadge: document.getElementById('favorites-count-badge'),
      favAuthRequired: document.getElementById('fav-auth-required'),
      
      historyList: document.getElementById('history-list'),
      historyEmpty: document.getElementById('history-empty'),
      historyAuthRequired: document.getElementById('history-auth-required'),
      // Resume Learning
      resumeLearningSection: document.getElementById('resume-learning-section'),
      resumeCard: document.getElementById('resume-card'),
      
      // Timeline Controls
      timelineContainer: document.getElementById('timeline-container'),
      timelineSelection: document.getElementById('timeline-selection'),
      timelineHandleStart: document.getElementById('timeline-handle-start'),
      timelineHandleEnd: document.getElementById('timeline-handle-end'),
      
      tabNotes: document.getElementById('tab-notes'),
      noteInput: document.getElementById('note-input'),
      notesList: document.getElementById('notes-list'),
      notesEmpty: document.getElementById('notes-empty'),
      
      tabAnalyticsBtn: document.getElementById('tab-analytics-btn'),
      tabAnalytics: document.getElementById('tab-analytics'),
      analyticsTotalTime: document.getElementById('analytics-total-time'),
      analyticsWeeklyTime: document.getElementById('analytics-weekly-time'),
      analyticsSegmentsList: document.getElementById('analytics-segments-list'),
      analyticsEmpty: document.getElementById('analytics-empty'),
      
      // Advanced Controls
      abStart: document.getElementById('ab-start'),
      abEnd: document.getElementById('ab-end'),
      playbackSpeed: document.getElementById('playback-speed'),
      saveLoopGroup: document.getElementById('save-loop-group'),
      loopNameInput: document.getElementById('loop-name-input'),
      
      // Modals
      loginModal: document.getElementById('login-modal'),
      authOptions: document.getElementById('modal-auth-options'),
      authLoading: document.getElementById('modal-auth-loading'),
      authLoadingText: document.getElementById('auth-loading-text'),
      
      // Draggable Bookmarklet
      bookmarkletBtn: document.getElementById('bookmarklet-btn'),
      
      // Toast
      toast: document.getElementById('toast'),
      toastIcon: document.getElementById('toast-icon'),
      toastMessage: document.getElementById('toast-message')
    };
  }

  // ==========================================
  // Database methods modularized to js/database.js

  loadSDKs() {
    // 1. YouTube Iframe API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      // Global callback for YT
      window.onYouTubeIframeAPIReady = () => {
        if (DEBUG_MODE) console.log("YouTube Player API Ready");
      };
    }

    // 2. Vimeo Player API
    if (!window.Vimeo) {
      const tag = document.createElement('script');
      tag.src = "https://player.vimeo.com/api/player.js";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // 3. Dailymotion API
    if (!window.DM) {
      const tag = document.createElement('script');
      tag.src = "https://api.dmcdn.net/all.js";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }

  generateBookmarklet() {
    let origin = window.location.origin;
    if (origin === 'null' || !origin || origin.startsWith('file:')) {
      origin = 'http://localhost:8000'; // Default local development fallback
    }
    // Bookmark code that takes current page's URL and opens the WatchOnRepeat app with ?url=
    const jsCode = `javascript:(function(){var url=window.location.href;if(url.indexOf('youtube.com')!==-1||url.indexOf('youtu.be')!==-1||url.indexOf('vimeo.com')!==-1||url.indexOf('dailymotion.com')!==-1){window.open('${origin}/?url='+encodeURIComponent(url),'_blank');}else{alert('Please click this bookmark shortcut while watching a YouTube, Vimeo, or Dailymotion video!');}})();`;
    this.elements.bookmarkletBtn.setAttribute('href', jsCode);
  }

  // ==========================================
  // ROUTING & NAVIGATION
  // ==========================================

  handleRouting() {
    // Handle OAuth Cancellation or errors gracefully
    if (window.location.hash.includes('error=access_denied')) {
      window.location.hash = '';
      this.showToast("Login cancelled.", "info");
      this.closeLoginModal();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const playlistId = urlParams.get('playlist');
    if (playlistId) {
      this.fetchSharedPlaylist(playlistId);
      return;
    }

    let videoId = urlParams.get('v');
    let rawUrl = urlParams.get('url');
    let platform = urlParams.get('p') || 'youtube';

    // Parse custom URL shortcuts (e.g. watchonrepeat.com/123456789 or watchonrepeat.com/video/x7abcde)
    const path = window.location.pathname;
    if (!videoId && path.length > 1 && path !== '/index.html') {
      const parts = path.split('/').filter(Boolean);
      
      if (parts.length === 1) {
        // Handle /watch?v=... where v is missed, or bare IDs
        if (parts[0] !== 'watch') {
          const id = parts[0];
          videoId = id;
          if (id.length === 11 && !/^\d+$/.test(id)) {
            platform = 'youtube';
          } else if (/^\d+$/.test(id)) {
            platform = 'vimeo'; // Vimeo usually uses numeric IDs
          } else {
            platform = 'youtube'; // Default fallback
          }
        }
      } else if (parts.length >= 2) {
        const type = parts[0].toLowerCase();
        const id = parts[1];
        
        if (type === 'video') {
          videoId = id;
          if (id.startsWith('x')) {
            platform = 'dailymotion';
          } else {
            platform = 'vimeo'; // fallback for /video/123456
          }
        } else if (type === 'videos') {
          videoId = id;
          platform = 'twitch';
        }
      }
    }

    // Parse deep-linked clip params
    const start = parseFloat(urlParams.get('start'));
    const end = parseFloat(urlParams.get('end'));
    const rate = parseFloat(urlParams.get('rate'));
    const segmentsParam = urlParams.get('segments');
    const notesParam = urlParams.get('n');

    if (!isNaN(start)) {
      this.state.abLoop.start = start;
      if (this.elements.abStart) this.elements.abStart.value = start;
    }
    if (!isNaN(end)) {
      this.state.abLoop.end = end;
      if (this.elements.abEnd) this.elements.abEnd.value = end;
    }
    if (!isNaN(start) && !isNaN(end) && end > start) {
      this.state.abLoop.active = true;
    }
    if (!isNaN(rate)) {
      this.state.playbackRate = rate;
      if (this.elements.playbackSpeed) this.elements.playbackSpeed.value = rate;
    }

    // Check if URL parameter contains a direct video link
    if (rawUrl) {
      const parsed = this.parseVideoUrl(rawUrl);
      if (parsed) {
        videoId = parsed.id;
        platform = parsed.platform;
      }
    }

    if (videoId) {
      if (segmentsParam || notesParam) {
        this.handleSharedPayload(videoId, platform, segmentsParam, notesParam);
      }
      this.loadVideo(videoId, platform);
    } else {
      this.loadHome();
    }
  }

  handleSharedPayload(videoId, platform, segmentsParam, notesParam) {
    const isPremium = this.state.user && this.state.user.isPremium;
    this.state.isReadOnlyShared = false;
    let hasProFeatures = false;
    
    // 1. Process Segments
    if (segmentsParam) {
      const segPairs = segmentsParam.split(',').map(s => {
        const hasSpeed = s.includes('@');
        let speed = 1;
        let timePart = s;
        if (hasSpeed) {
          const parts = s.split('@');
          timePart = parts[0];
          speed = parseFloat(parts[1]) || 1;
        }
        const parts = timePart.split('-');
        return { start: parseFloat(parts[0]), end: parseFloat(parts[1]), speed: speed };
      });
      
      if (segPairs.length > 1) {
        hasProFeatures = true;
      }
      
      this.state.sharedSegmentsToLoad = segPairs;
      this.state.isMultiSegment = true;
      if (this.elements.multiSegmentCheckbox) this.elements.multiSegmentCheckbox.checked = true;
    }

    // 2. Process Notes
    if (notesParam) {
      try {
        const decodedStr = decodeURIComponent(atob(notesParam));
        let notesArr = JSON.parse(decodedStr);
        
        if (notesArr.length > 3) {
          hasProFeatures = true;
        }
        
        // Save to DB so when loadVideo renders it reads these
        const db = this.getDb('notes');
        db[`${platform}_${videoId}`] = notesArr;
        this.saveDb('notes', db);
      } catch (e) {
        if (DEBUG_MODE) console.error("Failed to parse shared notes", e);
      }
    }

    // 3. Enable Read-Only Mode for Free Users viewing Pro content
    if (!isPremium && hasProFeatures) {
      this.state.isReadOnlyShared = true;
      setTimeout(() => {
        this.showToast("Viewing a Shared Pro Link (Read-Only Mode). Upgrade to unlock editing!", "lock");
      }, 1500);
    }
  }

  loadHome() {
    this.state.currentVideo = null;
    this.state.currentPlatform = null;
    this.stopTimer();
    
    document.title = "Watch On Repeat | Loop YouTube Videos & Practice Tool";

    // Show the player UI but leave the video area blank
    if (this.elements.playerEmpty) this.elements.playerEmpty.classList.add('hidden');
    this.elements.playerLoaded.classList.remove('hidden');
    
    // Clear iframe container to keep it completely blank
    this.elements.playerContainer.innerHTML = '';
    
    // Reset title and stats for empty state
    if (this.elements.videoTitle) this.elements.videoTitle.textContent = "Ready to Loop";
    const loopDisplay = document.getElementById('personal-loop-count');
    const sessionDisplay = document.getElementById('session-duration');
    if (loopDisplay) loopDisplay.textContent = '0';
    if (sessionDisplay) sessionDisplay.textContent = '00:00:00';
    
    // Ensure the URL remains clean (without ?v=...) for the home state
    try {
      window.history.pushState({}, document.title, window.location.href.split('?')[0]);
    } catch (e) {}
  }

  // ==========================================
  // URL PARSING
  // ==========================================

  parseVideoUrl(url) {
    if (!url) return null;
    url = url.trim();

    // YouTube (Including Shorts and Music)
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/.*[?&]v=|repeatyoutube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return { platform: 'youtube', id: ytMatch[1] };
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/album\/[^\/]+\/video\/|showcase\/[^\/]+\/video\/)?|player\.vimeo\.com\/video\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return { platform: 'vimeo', id: vimeoMatch[1] };
    }

    // Dailymotion
    const dmRegex = /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const dmMatch = url.match(dmRegex);
    if (dmMatch && dmMatch[1]) {
      return { platform: 'dailymotion', id: dmMatch[1] };
    }

    // Twitch (VODs, Clips, Channels)
    const twitchRegex = /twitch\.tv\/(?:videos\/(\d+)|([a-zA-Z0-9_]+)\/clip\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_]+))/;
    const twitchMatch = url.match(twitchRegex);
    if (twitchMatch) {
      if (twitchMatch[1]) return { platform: 'twitch', id: 'video=' + twitchMatch[1] };
      if (twitchMatch[3]) return { platform: 'twitch', id: 'clip=' + twitchMatch[3] };
      if (twitchMatch[4]) return { platform: 'twitch', id: 'channel=' + twitchMatch[4] };
    }

    // SoundCloud
    const scRegex = /soundcloud\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/;
    const scMatch = url.match(scRegex);
    if (scMatch && scMatch[1]) {
      return { platform: 'soundcloud', id: scMatch[1] };
    }

    // Wistia
    const wistiaRegex = /(?:wistia\.com\/medias\/|fast\.wistia\.net\/embed\/iframe\/)([a-zA-Z0-9]+)/;
    const wistiaMatch = url.match(wistiaRegex);
    if (wistiaMatch && wistiaMatch[1]) {
      return { platform: 'wistia', id: wistiaMatch[1] };
    }

    // HTML5 native video
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('.mp4?')) {
      return { platform: 'html5', id: url };
    }
    
    // Fallbacks
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return { platform: 'youtube', id: url };
    if (/^\d{8,11}$/.test(url)) return { platform: 'vimeo', id: url };
    if (/^[a-zA-Z0-9]{6,8}$/.test(url)) return { platform: 'dailymotion', id: url };

    return null;
  }

  handleSearchSubmit(e) {
    e.preventDefault();
    try {
      const url = this.elements.videoInput.value;
      const parsed = this.parseVideoUrl(url);

      if (parsed) {
        this.elements.videoInput.value = '';
        
        // Update browser URL safely (fails on file:/// protocol)
        try {
          const newUrl = `${window.location.href.split('?')[0]}?v=${parsed.id}&p=${parsed.platform}`;
          window.history.pushState({ v: parsed.id, p: parsed.platform }, '', newUrl);
        } catch (err) {
          if (DEBUG_MODE) console.warn("pushState failed, likely due to file:/// protocol restrictions.");
        }
        
        this.loadVideo(parsed.id, parsed.platform).catch(err => {
          if (DEBUG_MODE) console.error("loadVideo Error:", err);
          this.showToast("Failed to load video: " + err.message, "alert-circle");
        });
      } else {
        this.showToast('Invalid URL. Please enter a valid YouTube, Vimeo, Dailymotion, or other supported link.', 'alert-triangle');
      }
    } catch (err) {
      if (DEBUG_MODE) console.error("handleSearchSubmit Error:", err);
      this.showToast("An error occurred: " + err.message, "alert-circle");
    }
  }



  // ==========================================
  // LOCAL VIDEO (OFFLINE MODE)
  // ==========================================
  triggerLocalVideo() {
    if (!this.state.user || this.state.user.tier !== 'pro') {
      this.openUpgradeModal("Offline Local Video mode is an exclusive Pro feature!");
      return;
    }
    const input = document.getElementById('local-video-input');
    if (input) input.click();
  }

  loadLocalVideo(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.state.currentPlatform = 'local';
    this.state.currentVideo = {
      id: file.name.replace(/[^a-zA-Z0-9]/g, '_'),
      title: file.name,
      platform: 'local'
    };

    // Initialize the analytics session for this local video
    this.state.analyticsSession.videoId = this.state.currentVideo.id;
    this.state.analyticsSession.platform = 'local';
    this.state.analyticsSession.title = file.name;
    this.state.analyticsSession.loops = 0;
    this.state.analyticsSession.startTime = Date.now();

    if (this.elements.abStart) {
      this.elements.abStart.value = "";
      this.elements.abStart.placeholder = "Start";
    }
    if (this.elements.abEnd) {
      this.elements.abEnd.value = "";
      this.elements.abEnd.placeholder = "End";
    }
    
    // Reset loop state completely for the new video
    this.state.abLoop.start = 0;
    this.state.abLoop.end = 0;
    this.state.abLoop.currentSegmentIndex = 0;
    this.state.abLoop.multiSegments = [];
    if (typeof this.renderMultiSegments === 'function') this.renderMultiSegments();
    if (this.elements.timelineContainer) {
      this.updateTimelineUI();
    }

    // Create object URL
    const videoUrl = URL.createObjectURL(file);
    
    // Clear container
    this.elements.playerContainer.innerHTML = '';
    
    // Create native HTML5 video element
    const videoEl = document.createElement('video');
    videoEl.id = 'native-video-player';
    videoEl.src = videoUrl;
    videoEl.controls = true;
    videoEl.autoplay = true;
    videoEl.style.width = '100%';
    videoEl.style.height = '100%';
    videoEl.style.objectFit = 'contain';
    
    this.elements.playerContainer.appendChild(videoEl);
    
    // Create Mock Player API Adapter
    this.state.players.local = {
      seekTo: (time) => { videoEl.currentTime = time; },
      getDuration: () => videoEl.duration || 0,
      getCurrentTime: () => Promise.resolve(videoEl.currentTime),
      setPlaybackRate: (rate) => { videoEl.playbackRate = rate; },
      playVideo: () => { videoEl.play(); },
      pauseVideo: () => { videoEl.pause(); }
    };

    // Simulate ready
    videoEl.onloadedmetadata = () => {
      this.setVideoDuration(videoEl.duration);

    };

    if (this.elements.playerEmpty) this.elements.playerEmpty.classList.add('hidden');
    this.elements.playerLoaded.classList.remove('hidden');
    
    // Update the UI with file name instead of crashing
    if (this.elements.videoTitle) this.elements.videoTitle.textContent = file.name;
    document.title = file.name + " | Watch On Repeat";
    this.updatePlatformBadge('local');
    
    this.updateNotesUI();
    if (this.state.currentVideo) {
      this.loadLoopData(this.state.currentVideo.id);
    }
  }

  // ==========================================
  // VIDEO LOADING & API WRAPPERS
  // ==========================================

  async  loadVideo(id, platform = 'youtube') {
    this.flushAnalytics();
    
    // Clean up any stray Dailymotion message listeners when switching platforms
    if (this.state.players.dailymotion && this.state.players.dailymotion.cleanup) {
      this.state.players.dailymotion.cleanup();
    }

    if (this.state.currentVideo && (this.state.currentVideo.id !== id || this.state.currentVideo.platform !== platform)) {
      this.state.isReadOnlyShared = false;
    }
    
    if (platform === 'local') {
      this.showToast("For security, please re-select your local file to continue.", "folder");
      const input = document.getElementById('local-video-input');
      if (input) input.click();
      return;
    }
    this.state.currentPlatform = platform;
    this.state.personalLoops = 0;
    this.state.currentGlobalLoops = 0;
    this.state.currentGlobalPlays = 0;
    this.state.currentLifetimeLoops = 0;
    this.state.loopSeconds = 0;
    this.state.currentVideoDuration = 0;

    if (window.supabaseClient) {
      const promises = [
        supabaseClient.from('global_stats')
          .select('global_loops')
          .eq('video_id', id)
          .eq('platform', platform)
          .single()
          .then(({ data }) => {
            if (data) {
              this.state.currentGlobalLoops = data.global_loops || 0;
              if (this.elements.globalLoopCount) this.elements.globalLoopCount.textContent = this.formatNumber(this.state.currentGlobalLoops);
            }
          }).catch(() => {}),
        
        this.fetchPlatformTotalLoops()
      ];

      if (this.state.user) {
        promises.push(
          supabaseClient.from('user_history')
            .select('loops_count')
            .eq('user_id', this.state.user.id)
            .eq('video_id', id)
            .eq('platform', platform)
            .single()
            .then(({ data }) => {
              if (data) {
                this.state.currentLifetimeLoops = data.loops_count;
                this.updateStatsUI();
              }
            })
        );
      }

      Promise.all(promises);
    }
    
    // Only disable inputs if there's no valid video ID being loaded
    const shouldDisable = !id;
    if (this.elements.abStart) {
      this.elements.abStart.value = "START TIME";
      this.elements.abStart.disabled = shouldDisable;
      this.elements.abStart.style.pointerEvents = shouldDisable ? 'none' : 'auto';
      this.elements.abStart.style.opacity = shouldDisable ? '0.8' : '1';
    }
    if (this.elements.abEnd) {
      this.elements.abEnd.value = "END TIME";
      this.elements.abEnd.disabled = shouldDisable;
      this.elements.abEnd.style.pointerEvents = shouldDisable ? 'none' : 'auto';
      this.elements.abEnd.style.opacity = shouldDisable ? '0.8' : '1';
    }
    if (this.elements.timelineContainer) {
      this.elements.timelineContainer.style.pointerEvents = shouldDisable ? 'none' : 'auto';
      this.elements.timelineContainer.style.opacity = shouldDisable ? '0.5' : '1';
    }
    
    // Reset loop state completely for the new video
    this.state.abLoop.start = 0;
    this.state.abLoop.end = 0;
    this.state.abLoop.currentSegmentIndex = 0;
    this.state.abLoop.multiSegments = [];
    if (typeof this.renderMultiSegments === 'function') this.renderMultiSegments();
    if (this.elements.timelineContainer) {
      this.updateTimelineUI();
    }
    
    // Clear previous iframes
    this.elements.playerContainer.innerHTML = '';
    
    // Show Loaded State
    if (this.elements.playerEmpty) this.elements.playerEmpty.classList.add('hidden');
    this.elements.playerLoaded.classList.remove('remove'); // make sure
    this.elements.playerLoaded.classList.remove('hidden');
    
    // Fetch video title (mocked/simulated or via iframe where possible)
    let videoTitle = "Loading title...";
    
    this.state.currentVideo = {
      id: id,
      platform: platform,
      title: videoTitle
    };

    // Initialize the analytics session for this video
    this.state.analyticsSession.videoId = id;
    this.state.analyticsSession.platform = platform;
    this.state.analyticsSession.title = videoTitle;
    this.state.analyticsSession.loops = 0;
    this.state.analyticsSession.startTime = Date.now();

    // Update UI Elements immediately
    this.elements.videoTitle.textContent = videoTitle;
    
    // Always fetch fresh title in background
    this.fetchVideoTitleMock(id, platform).then(realTitle => {
      if (realTitle && !realTitle.includes("Cozy Coffee Shop")) {
        this.elements.videoTitle.textContent = realTitle;
        document.title = realTitle + " | Watch On Repeat";
        if (this.state.currentVideo) this.state.currentVideo.title = realTitle;
        
        // Removed redundant this.renderTrendsTab() to prevent DB spam on video load
        // Update history cache if needed
        const history = this.getDb('history');
        if (history && history.length > 0) {
           let updated = false;
           history.forEach(h => {
             if (h.videoId === id && h.platform === platform) {
               h.title = realTitle;
               updated = true;
             }
           });
           if (updated) this.saveDb('history', history);
        }
        
        // Update notes cache if needed
        const notes = this.getDb('notes');
        if (notes && notes.__titles) {
          const vId = `${platform}_${id}`;
          if (notes[vId]) {
            notes.__titles[vId] = realTitle;
            this.saveDb('notes', notes);
          }
        }
      }
      this.updateMediaSession(realTitle || videoTitle, platform, id);
    });
    this.updatePlatformBadge(platform);
    this.updateStatsUI();
    this.updateFavoriteButtonUI();
    
    // Load Player based on Platform
    if (platform === 'youtube') {
      this.initYouTubePlayer(id);
    } else if (platform === 'vimeo') {
      this.initVimeoPlayer(id);
    } else if (platform === 'dailymotion') {
      this.initDailymotionPlayer(id);
    } else if (platform === 'html5') {
      this.initHTML5Player(id);
    } else if (platform === 'twitch') {
      this.initTwitchPlayer(id);
    } else if (platform === 'soundcloud') {
      this.initSoundCloudPlayer(id);
    } else if (platform === 'wistia') {
      this.initWistiaPlayer(id);
    }

    // Apply speed if passed via URL
    setTimeout(() => {
      if (this.state.playbackRate !== 1) {
        this.setPlaybackSpeed(this.state.playbackRate);
      }
    }, 1500);

    // Setup Timeline UI
    if (!this.timelineInitialized) {
      this.initTimeline();
      this.timelineInitialized = true;
    }

    // Render notes
    this.renderNotes();
    
    // Render Up Next
    this.renderUpNextQueue(id);

    // Add to loop history (if signed in)
    this.addToHistory(id, platform, videoTitle);
    
    // Increment global play count (but loops starts after 2nd play)
    this.incrementGlobalPlayCount(id, platform);
    
    this.startTimer();
  }

  updatePlatformBadge(platform) {
    this.elements.platformBadge.className = `platform-indicator ${platform}`;
    this.elements.platformText.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
    
    let iconName = 'video';
    if (platform === 'youtube') iconName = 'youtube';
    else if (platform === 'twitch') iconName = 'twitch';
    else if (platform === 'vimeo') iconName = 'video';
    else if (platform === 'dailymotion') iconName = 'play-circle';
    else if (platform === 'soundcloud') iconName = 'music';
    else if (platform === 'wistia') iconName = 'film';
    else if (platform === 'html5') iconName = 'monitor-play';
    else if (platform === 'local') iconName = 'hard-drive';
    
    this.elements.platformBadge.innerHTML = `<i data-lucide="${iconName}"></i><span id="platform-text">${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>`;
    setTimeout(() => {
      if (window.lucide) window.lucide.createIcons();
    }, 10);
  }

  saveLoopData() {
    if (!this.state.currentVideo || !this.state.currentVideo.id) return;
    const id = this.state.currentVideo.id;
    const savedLoops = JSON.parse(localStorage.getItem('wor_saved_loops') || '{}');
    
    savedLoops[id] = {
      start: this.state.abLoop.start,
      end: this.state.abLoop.end,
      multiSegments: this.state.abLoop.multiSegments || [],
      enabled: this.state.abLoop.active,
      isMultiSegment: this.state.isMultiSegment || false
    };
    
    localStorage.setItem('wor_saved_loops', JSON.stringify(savedLoops));

    if (this.state.user && window.supabaseClient) {
      supabaseClient.from('user_history').upsert({
        user_id: this.state.user.id,
        video_id: id,
        platform: this.state.currentVideo.platform || this.state.currentPlatform,
        title: this.state.currentVideo.title || '',
        loops_count: this.state.currentLifetimeLoops || 0,
        saved_loop_data: savedLoops[id],
        last_played: new Date().toISOString()
      }, { onConflict: 'user_id, video_id, platform' }).then(({ error }) => {
        if (error && DEBUG_MODE) console.error("Loop Data Sync Error:", error);
      });
    }
  }

  loadLoopData(id) {
    if (!id) return;
    const savedLoops = JSON.parse(localStorage.getItem('wor_saved_loops') || '{}');
    const data = savedLoops[id];
    const dur = this.state.currentVideoDuration || 0;
    
    // First apply base data if available
    if (data) {
      this.state.abLoop.start = data.start || 0;
      this.state.abLoop.end = data.end || dur;
      
      // If saved end is 0 or nonsensically small (corrupted save), use full duration
      if (dur > 0 && (this.state.abLoop.end <= 0 || 
          (this.state.abLoop.start === 0 && this.state.abLoop.end <= 10.5 && dur > 20))) {
        this.state.abLoop.end = dur;
      }
      
      // Clamp end to video duration if it exceeds it
      if (dur > 0 && this.state.abLoop.end > dur) {
        this.state.abLoop.end = dur;
      }
      
      this.state.abLoop.active = data.enabled !== false;
    }

    // Handle Multi-Segments (prioritize shared link over local save)
    if (this.state.sharedSegmentsToLoad && this.state.sharedSegmentsToLoad.length > 0) {
      this.state.abLoop.multiSegments = this.state.sharedSegmentsToLoad;
      this.state.isMultiSegment = true;
      // Update base loop to match the first segment
      if (this.state.sharedSegmentsToLoad[0]) {
         this.state.abLoop.start = this.state.sharedSegmentsToLoad[0].start || 0;
         this.state.abLoop.end = this.state.sharedSegmentsToLoad[0].end || dur;
         const initialSpeed = this.state.sharedSegmentsToLoad[0].speed || 1.0;
         if (this.state.playbackRate !== initialSpeed) {
           this.setPlaybackSpeed(initialSpeed, true);
         }
      }
      // Clear to prevent leaking to other videos
      this.state.sharedSegmentsToLoad = null; 
    } else if (data) {
      const isPremium = this.state.user && (this.state.user.isPremium || (this.state.user.user_metadata && this.state.user.user_metadata.tier === 'premium'));
      this.state.abLoop.multiSegments = isPremium ? (data.multiSegments || []) : [];
      this.state.isMultiSegment = data.isMultiSegment || false;
    }

    // Heal any corrupted segments
    if (this.state.abLoop.multiSegments.length > 0 && dur > 0) {
      this.state.abLoop.multiSegments.forEach((seg, index) => {
        if (seg.start === null && seg.end === null) return; // Leave placeholders alone
        
        if (index === 0 && seg.start === null) {
          seg.start = 0;
        }
        if (seg.end === null || seg.end <= 0) {
          // Only heal null end if start is not null
          seg.end = dur;
        }
        if (seg.end > dur) {
          seg.end = dur;
        }
      });
    }

    if (this.elements.multiSegmentCheckbox) {
      this.elements.multiSegmentCheckbox.checked = this.state.isMultiSegment;
    }
    
    if (this.elements.abStart) this.elements.abStart.value = this.formatTime(this.state.abLoop.start);
    if (this.elements.abEnd) this.elements.abEnd.value = this.formatTime(this.state.abLoop.end);
    
    if (this.updateTimelineUI) {
      this.updateTimelineUI();
    }
    if (typeof this.renderMultiSegments === 'function') {
      this.renderMultiSegments();
    }
    
    // Re-save to clean up any corrupted data in localStorage ONLY if we aren't viewing a shared read-only link
    if (!this.state.isReadOnlyShared && (data || this.state.abLoop.multiSegments.length > 0)) {
      this.saveLoopData();
    }
  }

  onVideoReady() {
    if (this.elements.playerEmpty) this.elements.playerEmpty.classList.add('hidden');
    if (this.elements.playerLoaded) {
      this.elements.playerLoaded.classList.remove('remove');
      this.elements.playerLoaded.classList.remove('hidden');
    }
  }

  setVideoDuration(duration) {
    if (!duration || isNaN(duration) || duration <= 0) return;
    
    this.state.currentVideoDuration = duration;
    
    // ALWAYS set end to full video duration. No conditions. No checks.
    // This is the default — loadLoopData below will override if the user
    // previously saved a custom range.
    this.state.abLoop.end = duration;
    
    // Set the input fields
    if (this.elements.abStart) {
      this.elements.abStart.value = this.formatTime(this.state.abLoop.start || 0);
      this.elements.abStart.disabled = false;
      this.elements.abStart.style.pointerEvents = 'auto';
      this.elements.abStart.style.opacity = '1';
    }
    if (this.elements.abEnd) {
      this.elements.abEnd.value = this.formatTime(duration);
      this.elements.abEnd.disabled = false;
      this.elements.abEnd.style.pointerEvents = 'auto';
      this.elements.abEnd.style.opacity = '1';
    }
    if (this.elements.timelineContainer) {
      this.elements.timelineContainer.style.pointerEvents = 'auto';
      this.elements.timelineContainer.style.opacity = '1';
    }
    
    // Fix multiSegments — if there's a default segment with end=0 or end=10, fix it
    if (this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 0) {
      const firstSeg = this.state.abLoop.multiSegments[0];
      if (firstSeg.start === 0 && firstSeg.end < duration) {
        // Only auto-fix if it looks like the default segment (not user-customized)
        if (firstSeg.end <= 10.5 || firstSeg.end <= 0) {
          firstSeg.end = duration;
        }
      }
    } else {
      // No segments exist yet — create the default full-video segment
      this.state.abLoop.multiSegments = [{ start: 0, end: duration }];
    }
    
    // Now load saved data — this may override everything above with
    // the user's real custom range, if they saved one previously.
    if (this.state.currentVideo && this.state.currentVideo.id) {
      this.loadLoopData(this.state.currentVideo.id);
    }
    
    // Once duration is known, we can accurately plot the note markers
    if (this.renderNoteMarkers) {
      this.renderNoteMarkers();
    }
    
    if (this.updateTimelineUI) {
      this.updateTimelineUI();
    }
  }

  async fetchVideoTitleMock(id, platform) {
    try {
      let videoUrl = '';
      if (platform === 'youtube') {
        videoUrl = `https://www.youtube.com/watch?v=${id}`;
      } else if (platform === 'vimeo') {
        videoUrl = `https://vimeo.com/${id}`;
      } else if (platform === 'dailymotion') {
        videoUrl = `https://www.dailymotion.com/video/${id}`;
      } else if (platform === 'soundcloud') {
        videoUrl = `https://soundcloud.com/${id}`;
      }

      if (videoUrl) {
        const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.title) {
            return data.title;
          }
        }
      }
    } catch (err) {
      if (DEBUG_MODE) console.warn("noembed proxy failed", err);
    }
    
    // Generate an appealing fake title for unrecognized videos based on the ID to make it look realistic
    let baseId = id;
    if (platform === 'twitch') {
      const parts = id.split('=');
      baseId = parts[1] || id;
      return `Twitch Stream: ${baseId}`;
    }
    if (platform === 'wistia') return `Wistia Video`;

    const prefixes = ["Chill Beats", "Synthwave Session", "Ambient Relaxation", "Nature Sounds", "Epic Orchestral", "Developer Focus", "Cozy Coffee Shop", "Live Music Session"];
    const index = String(baseId).charCodeAt(0) % prefixes.length;
    return `${prefixes[index]}`;
  }

  // --- YouTube Iframe Controller ---
  initYouTubePlayer(id) {
    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-target';
    playerDiv.style.width = '100%';
    playerDiv.style.height = '100%';
    this.elements.playerContainer.appendChild(playerDiv);

    // YouTube Iframe API origin fix and fallback
    if (window.location.protocol === 'file:') {
      // Native iframe fallback for local file execution (bypasses Error 153)
      document.getElementById('yt-player-target').innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&rel=0&modestbranding=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
      
      // Mock the YT.Player API to prevent crashes elsewhere in the app
      this.state.players.youtube = {
        playVideo: () => {},
        pauseVideo: () => {},
        seekTo: () => {},
        setPlaybackRate: () => {},
        getCurrentTime: () => 0,
        getDuration: () => 0
      };
      
      // Force UI to recognize it's playing
      setTimeout(() => {
        if (this.handleYouTubeStateChange) {
          this.handleYouTubeStateChange({ data: YT.PlayerState.PLAYING });
        }
      }, 1000);
      
      return; // Exit immediately, DO NOT wait for window.YT
    }

    const setupPlayer = () => {
        let pVars = {
          'autoplay': 1,
          'controls': 1,
          'rel': 0,
          'modestbranding': 1,
          'enablejsapi': 1,
          'playsinline': 1
        };
        
        pVars.origin = window.location.origin;

        this.state.players.youtube = new YT.Player('yt-player-target', {
          height: '100%',
          width: '100%',
          videoId: id,
          playerVars: pVars,
        events: {
          'onReady': (event) => {
            const dur = event.target.getDuration();
            if (dur > 0) {
              this.setVideoDuration(dur);
            } else {
              // YouTube sometimes returns 0 initially. Poll for it.
              const checkDur = setInterval(() => {
                if (event.target && event.target.getDuration) {
                  const d = event.target.getDuration();
                  if (d > 0) {
                    this.setVideoDuration(d);
                    clearInterval(checkDur);
                  }
                }
              }, 500);
            }
              this.onVideoReady();
            },
          'onStateChange': this.handleYouTubeStateChange,
          'onError': (event) => {
            let reason = "An unknown error occurred.";
            if (event.data === 2) reason = "The video ID provided is invalid.";
            else if (event.data === 5) reason = "This video cannot be played in an HTML5 player.";
            else if (event.data === 100) reason = "This video was deleted by the uploader, made private, or is geographically restricted.";
            else if (event.data === 101 || event.data === 150) reason = "The creator of this video has disabled embedding on external websites.";

            this.showToast("Failed to load YouTube video.", "alert-circle");
            
            const container = document.getElementById('youtube-container');
            if (container) {
              container.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; background:var(--bg-card); color:var(--text-secondary); padding:2rem; text-align:center; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
                  <i data-lucide="tv-2" style="width:64px; height:64px; margin-bottom:1rem; opacity:0.5;"></i>
                  <h3 style="font-size:1.5rem; color:var(--text-primary); margin-bottom:0.5rem; font-weight:bold;">Video Unavailable</h3>
                  <p style="max-width:400px; line-height:1.5; margin-bottom:1.5rem;">${reason}</p>
                  <button class="btn btn-primary" onclick="app.loadHome()">Return Home</button>
                </div>
              `;
              lucide.createIcons();
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      // API script is loaded but not ready yet. Wait for callback.
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          setupPlayer();
        }
      }, 100);
    }
  }

  handleYouTubeStateChange(event) {
    // YT.PlayerState.ENDED is 0
    if (event.data === YT.PlayerState.ENDED) {
      this.elements.loopStateText.textContent = "Restarting...";
      this.elements.loopStateText.className = "stat-value text-muted";
      
      if (typeof this.advanceLoopSegment === 'function') {
        this.advanceLoopSegment();
      } else {
        if (this.incrementLoops()) return;
        this.seekToTime(this.state.abLoop.start || 0);
      }
      
      // Re-play video
      this.state.players.youtube.playVideo();
      
      setTimeout(() => {
        this.elements.loopStateText.textContent = "Looping";
        this.elements.loopStateText.className = "stat-value text-green";
      }, 1000);
    } else if (event.data === YT.PlayerState.PLAYING) {
      this.elements.loopStateText.textContent = "Looping";
      this.elements.loopStateText.className = "stat-value text-green";

      if (!this.state.currentVideoDuration && this.state.players.youtube) {
        const dur = this.state.players.youtube.getDuration();
        if (dur > 0) {
          this.setVideoDuration(dur);
        } else {
          // YouTube sometimes returns 0 duration immediately after PLAYING event. Poll until it's ready.
          const checkDur = setInterval(() => {
            if (this.state.players.youtube && this.state.players.youtube.getDuration) {
              const d = this.state.players.youtube.getDuration();
              if (d > 0) {
                this.setVideoDuration(d);
                clearInterval(checkDur);
              }
            } else {
              clearInterval(checkDur);
            }
          }, 200);
        }
      }
    } else if (event.data === YT.PlayerState.PAUSED) {
      this.elements.loopStateText.textContent = "Paused";
      this.elements.loopStateText.className = "stat-value text-muted";
    }
  }

  // --- Vimeo Player Controller ---
  initVimeoPlayer(id) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&loop=0&api=1`;
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.allow = "autoplay; fullscreen";
    this.elements.playerContainer.appendChild(iframe);

    const setupPlayer = () => {
      const player = new Vimeo.Player(iframe);
      this.state.players.vimeo = player;

      player.on('ended', () => {
        if (this.incrementLoops()) return;
        player.play();
      });

      player.on('play', () => {
        player.getDuration().then((duration) => {
          if (!this.state.currentVideoDuration) {
            this.setVideoDuration(duration);
          }
        });
      });
    };

    if (window.Vimeo) {
      setupPlayer();
    } else {
      const checkInterval = setInterval(() => {
        if (window.Vimeo) {
          clearInterval(checkInterval);
          setupPlayer();
        }
      }, 100);
    }
  }

  // --- Dailymotion Player Controller ---
  initDailymotionPlayer(id) {
    this.elements.playerContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.id = "dm-player-target";
    // We use api=1 to enable the postMessage API
    iframe.src = `https://www.dailymotion.com/embed/video/${id}?autoplay=1&mute=0&controls=1&api=1`;
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.allow = "autoplay; fullscreen";
    this.elements.playerContainer.appendChild(iframe);

    // Clean up previous event listener if exists
    if (this.state.players.dailymotion && this.state.players.dailymotion.cleanup) {
      this.state.players.dailymotion.cleanup();
    }

    this.state.players.dailymotion = {
      iframe: iframe,
      currentTime: 0,
      seek: function(seconds) {
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({command: 'seek', parameters: [seconds]}), '*');
          iframe.contentWindow.postMessage(`command=seek&parameters[]=${seconds}`, '*');
          iframe.contentWindow.postMessage(`seek=${seconds}`, '*');
        }
      },
      play: function() {
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({command: 'play'}), '*');
          iframe.contentWindow.postMessage('command=play', '*');
        }
      },
      pause: function() {
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(JSON.stringify({command: 'pause'}), '*');
          iframe.contentWindow.postMessage('command=pause', '*');
        }
      }
    };

    const messageHandler = (event) => {
      // Dailymotion postMessage events
      if (event.origin !== 'https://www.dailymotion.com') return;
      
      let data = {};
      try {
        if (typeof event.data === 'string') {
          if (event.data.trim().startsWith('{')) {
            data = JSON.parse(event.data);
          } else {
            const params = new URLSearchParams(event.data);
            data = {
              event: params.get('event'),
              time: parseFloat(params.get('time')),
              duration: parseFloat(params.get('duration'))
            };
          }
        } else {
          data = event.data || {};
        }
      } catch(e) {}
      
      if (data && data.event === 'timeupdate') {
         this.state.players.dailymotion.currentTime = data.time || 0;
      } else if (data && data.event === 'durationchange') {
         this.setVideoDuration(data.duration || 0);
      } else if (data && data.event === 'video_end') {
         this.elements.loopStateText.textContent = "Restarting...";
         if (this.incrementLoops()) return;
         this.seekToTime(this.state.abLoop.start || 0);
         this.state.players.dailymotion.play();
      } else if (data && data.event === 'playing') {
         this.elements.loopStateText.textContent = "Looping";
         this.elements.loopStateText.className = "stat-value text-green";
      } else if (data && data.event === 'pause') {
         this.elements.loopStateText.textContent = "Paused";
         this.elements.loopStateText.className = "stat-value text-muted";
      }
    };

    window.addEventListener('message', messageHandler);
    this.state.players.dailymotion.cleanup = () => {
       window.removeEventListener('message', messageHandler);
    };

    // Fetch the correct video duration immediately from Dailymotion API
    // so the timeline bar and loop boundaries are correctly sized.
    fetch(`https://api.dailymotion.com/video/${id}?fields=duration`)
      .then(res => res.json())
      .then(data => {
        if (data && data.duration) {
          this.setVideoDuration(data.duration);
        }
      }).catch(err => { if (DEBUG_MODE) console.warn("Failed to fetch DM duration", err); });
  }

  // ==========================================
  // LOOP TRACKING & UPDATING
  // ==========================================

  incrementLoops() {
    const video = this.state.currentVideo;
    if (!video) return;

    const now = Date.now();
    if (this.lastLoopIncrementTime && now - this.lastLoopIncrementTime < 1000) {
      return; // Debounce to prevent rapid firing while buffering
    }
    this.lastLoopIncrementTime = now;

    // Increment personal loops (this video)
    this.state.personalLoops++;
    this.elements.personalLoopCount.textContent = this.formatNumber(this.state.personalLoops);
    
    // Increment session total loops (all videos)
    this.state.sessionTotalLoops++;
    if (this.elements.sessionTotalLoopCount) {
      this.elements.sessionTotalLoopCount.textContent = this.formatNumber(this.state.sessionTotalLoops);
    }

    // Remind free/guest users to sign up every 50 loops
    if (!this.state.user && this.state.sessionTotalLoops > 0 && this.state.sessionTotalLoops % 50 === 0) {
      this.showToast("Loving the features? Create a free account to save your loops, notes, and playlists so you never lose them!", "heart");
    }

    // Batch analytics locally
    this.state.analyticsSession.loops++;

    // Optimistic UI updates
    this.state.currentGlobalLoops++;
    if (this.state.user) {
      this.state.currentLifetimeLoops++;
    }
    this.updateStatsUI();

    // Fire and forget direct upserts to Supabase to completely bypass RPCs
    if (window.supabaseClient && video.platform !== 'local') {
      supabaseClient.rpc('increment_global_loops', {
        p_video_id: video.id,
        p_platform: video.platform,
        p_video_title: video.title || ''
      }).then(({ error }) => {
        if (!error) this.fetchPlatformTotalLoops(); // Refresh the massive platform number
        if (error && DEBUG_MODE) console.error("Global Loops RPC Error:", error);
      });

      if (this.state.user) {
        const savedLoops = JSON.parse(localStorage.getItem('wor_saved_loops') || '{}');
        supabaseClient.from('user_history').upsert({
          user_id: this.state.user.id,
          video_id: video.id,
          platform: video.platform,
          title: video.title || '',
          loops_count: this.state.currentLifetimeLoops,
          saved_loop_data: savedLoops[video.id],
          last_played: new Date().toISOString()
        }, { onConflict: 'user_id, video_id, platform' }).then(({ error }) => {
          if (error && DEBUG_MODE) console.error("User History Upsert Error:", error);
          this.renderHistoryTab();
        });
      }
    }

    if (this.state.playlistMode && this.state.playlistMode.active) {
      if (this.state.playlistMode.loopVideo) return false;
      const p = this.getDb('playlists').find(pl => pl.id === this.state.playlistMode.id);
      if (p && p.videos && p.videos.length > 0) {
        this.state.playlistMode.currentIndex++;
        if (this.state.playlistMode.currentIndex < p.videos.length) {
          const nextV = p.videos[this.state.playlistMode.currentIndex];
          this.showToast(`Up next: ${this.escapeHtml(nextV.title)}`, 'play');
          this.loadVideo(nextV.videoId || nextV.id, nextV.platform);
          return true;
        } else {
          this.state.playlistMode.active = false;
          this.showToast("Playlist finished playing", "check");
        }
      }
    }
    return false;
  }

  async incrementGlobalPlayCount(id, platform) {
    if (!window.supabaseClient || platform === 'local') return;
    try {
      await supabaseClient.rpc('increment_video_play', { p_video_id: id, p_platform: platform });
    } catch (e) {
      if (DEBUG_MODE) console.warn("Could not increment global play count", e);
    }
  }

  async fetchPlatformTotalLoops() {
    if (!window.supabaseClient || !this.elements.platformTotalLoops) return;
    try {
      const { data, error } = await supabaseClient.rpc('get_total_platform_loops');
      if (!error && data !== null) {
        this.elements.platformTotalLoops.textContent = this.formatNumber(data);
      }
    } catch (e) {}
  }

  updateStatsUI() {
    const video = this.state.currentVideo;

    // Update personal session loops
    if (this.elements.personalLoopCount) {
      this.elements.personalLoopCount.textContent = this.formatNumber(this.state.personalLoops || 0);
    }

    // Update personal lifetime loops
    if (this.elements.personalLifetimeCount) {
      this.elements.personalLifetimeCount.textContent = this.formatNumber(this.state.currentLifetimeLoops || 0);
    }

    // Update all-time loops for all videos
    if (this.elements.allTimeTotalCount) {
      let historyLoops = 0;
      if (this.state.user) {
        const history = this.getDb('history');
        const userHistory = history.filter(h => h.userId === this.state.user.id && (!video || h.videoId !== video.id));
        historyLoops = userHistory.reduce((sum, h) => sum + (h.loopsCount || 0), 0);
        this.elements.allTimeTotalCount.textContent = this.formatNumber(historyLoops + (this.state.currentLifetimeLoops || 0));
      } else {
        this.elements.allTimeTotalCount.textContent = this.formatNumber(this.state.sessionTotalLoops || 0);
      }
    }

    if (!video) {
      this.fetchPlatformTotalLoops();
      return;
    }

    // Update global loops
    if (this.elements.globalLoopCount) this.elements.globalLoopCount.textContent = this.formatNumber(this.state.currentGlobalLoops);
    if (this.elements.globalPlayCount) this.elements.globalPlayCount.textContent = this.formatNumber(this.state.currentGlobalPlays);
  }

  // ==========================================
  // PLAYBACK TIMER
  // ==========================================

  startTimer() {
    this.stopTimer();
    this.state.loopSeconds = 0;
    this.state.loopTimer = setInterval(() => {
      this.state.loopSeconds++;
      const mins = Math.floor(this.state.loopSeconds / 60).toString().padStart(2, '0');
      const secs = (this.state.loopSeconds % 60).toString().padStart(2, '0');
      this.elements.loopTimer.textContent = `Session time: ${mins}:${secs}`;
      this.updateAnalyticsTime();
    }, 1000);

    // Start the A/B Looping recursive check
    if (this.state.abLoop.timer) clearTimeout(this.state.abLoop.timer);
    this.state.abLoop.isChecking = false;
    this.checkABLoop();
  }

  stopTimer() {
    if (this.state.loopTimer) {
      clearInterval(this.state.loopTimer);
      this.state.loopTimer = null;
    }
    if (this.state.abLoop.timer) {
      clearTimeout(this.state.abLoop.timer);
      this.state.abLoop.timer = null;
    }
  }

  // ==========================================
  // USER HISTORY & FAVORITES
  // ==========================================

  addToHistory(videoId, platform, title) {
    if (!this.state.user) return; // History only tracked for logged in users

    const history = this.getDb('history');
    const existingIdx = history.findIndex(h => 
      h.videoId === videoId && h.platform === platform && h.userId === this.state.user.id
    );

    if (existingIdx !== -1) {
      history[existingIdx].timestamp = Date.now();
      history[existingIdx].lastPlayed = new Date().toISOString();
    } else {
      history.push({
        videoId,
        platform,
        title,
        userId: this.state.user.id,
        loopsCount: 0,
        lastPlayed: new Date().toISOString(),
        timestamp: Date.now()
      });
    }

    // Sort history newest first
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    // Enforce History Limit for Free tier
    const tier = this.state.user.tier || 'free';
    if (tier === 'free') {
      const userHistory = history.filter(h => h.userId === this.state.user.id);
      if (userHistory.length > 50) {
        // Find the oldest record for this user and remove it
        const oldestUserRecord = userHistory[userHistory.length - 1];
        const deleteIdx = history.findIndex(h => h.videoId === oldestUserRecord.videoId && h.userId === oldestUserRecord.userId);
        if (deleteIdx !== -1) history.splice(deleteIdx, 1);
      }
    }

    this.saveDb('history', history);
    this.renderHistoryTab();
  }

  async clearHistory() {
    if (!this.state.user) return;
    
    const confirmClear = await this.showConfirmDialog("Clear History", "Are you sure you want to clear your entire loop history?");
    if (!confirmClear) return;

    const btnEl = document.getElementById('clear-history-btn');
    this.setButtonLoading(btnEl, true);

    let history = this.getDb('history');
    // Filter out records belonging to current user
    history = history.filter(h => h.userId !== this.state.user.id);
    this.saveDb('history', history);
    
    // Also delete from Supabase if online
    if (window.supabaseClient) {
      await supabaseClient.from('user_history').delete().eq('user_id', this.state.user.id);
    }

    this.setButtonLoading(btnEl, false);
    this.renderHistoryTab();
    this.showToast("Your history has been cleared.");
  }

  toggleFavorite() {
    if (!this.state.user) {
      this.showToast("Please sign in to favorite videos!", "lock");
      this.openLoginModal();
      return;
    }

    const video = this.state.currentVideo;
    if (!video) return;

    const favorites = this.getDb('favorites');
    const index = favorites.findIndex(f => f.videoId === video.id && f.platform === video.platform && f.userId === this.state.user.id);

    if (index !== -1) {
      // Remove from favorites
      favorites.splice(index, 1);
      if (this.state.user && window.supabaseClient) {
          supabaseClient.from('user_history').update({ is_favorite: false })
            .eq('user_id', this.state.user.id)
            .eq('video_id', video.id)
            .eq('platform', video.platform).then();
      }
      this.showToast("Removed from favorites", "heart");
    } else {
      // Add to favorites
      favorites.unshift({
        id: 'fav_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId: this.state.user.id,
        videoId: video.id,
        platform: video.platform,
        title: video.title,
        timestamp: new Date().toISOString()
      });
      if (this.state.user && window.supabaseClient) {
          supabaseClient.from('user_history').update({ is_favorite: true })
            .eq('user_id', this.state.user.id)
            .eq('video_id', video.id)
            .eq('platform', video.platform).then();
      }
      this.showToast("Added to favorites!", "heart");
    }

    this.saveDb('favorites', favorites);
    this.updateFavoriteButtonUI();
    if (this.state.activeTab === 'favorites') this.renderFavoritesTab();

    this.saveDb('favorites', favorites);
    this.updateFavoriteButtonUI();
    this.renderFavoritesTab();
  }

  updateFavoriteButtonUI() {
    const video = this.state.currentVideo;
    if (!video) return;

    let isFavorite = false;
    if (this.state.user) {
      const favorites = this.getDb('favorites');
      isFavorite = favorites.some(f => f.videoId === video.id && f.platform === video.platform && f.userId === this.state.user.id);
    }

    if (isFavorite) {
      this.elements.favoriteBtn.classList.add('active');
      this.elements.favoriteBtn.innerHTML = '<i data-lucide="heart" fill="currentColor"></i>';
    } else {
      this.elements.favoriteBtn.classList.remove('active');
      this.elements.favoriteBtn.innerHTML = '<i data-lucide="heart"></i>';
    }
    lucide.createIcons();
  }

  // ==========================================
  // TABS RENDERING
  // ==========================================

  
  

  switchTab(tabId) {
    if (tabId === 'analytics' && !this.checkLimit('analytics')) return;
    this.state.activeTab = tabId;
    
    this.elements.tabDiscoverBtn.classList.toggle('active', tabId === 'discover');
    this.elements.tabFavoritesBtn.classList.toggle('active', tabId === 'favorites');
    this.elements.tabPlaylistsBtn = document.getElementById('tab-playlists-btn');
    if (this.elements.tabPlaylistsBtn) this.elements.tabPlaylistsBtn.classList.toggle('active', tabId === 'playlists');
    this.elements.tabHistoryBtn.classList.toggle('active', tabId === 'history');
    if (this.elements.tabSavedLoopsBtn) this.elements.tabSavedLoopsBtn.classList.toggle('active', tabId === 'saved-loops');
    this.elements.tabNotesBtn.classList.toggle('active', tabId === 'notes');
    this.elements.tabAnalyticsBtn.classList.toggle('active', tabId === 'analytics');
    const tabRecordedAudioBtn = document.getElementById('tab-recorded-audio-btn');
    if (tabRecordedAudioBtn) tabRecordedAudioBtn.classList.toggle('active', tabId === 'recorded-audio');

    const panels = {
      'discover': this.elements.tabDiscover,
      'favorites': this.elements.tabFavorites,
      'playlists': this.elements.tabPlaylists || document.getElementById('tab-playlists'),
      'history': this.elements.tabHistory,
      'saved-loops': this.elements.tabSavedLoops || document.getElementById('tab-saved-loops'),
      'notes': this.elements.tabNotes,
      'analytics': this.elements.tabAnalytics || document.getElementById('tab-analytics'),
      'recorded-audio': document.getElementById('tab-recorded-audio')
    };

    for (const [id, panel] of Object.entries(panels)) {
      if (panel) {
        panel.classList.toggle('active', tabId === id);
        panel.classList.toggle('hidden', tabId !== id);
      }
    }

    if (tabId === 'discover') {
      this.renderDiscoverTab();
    } else if (tabId === 'favorites') {
      this.renderFavoritesTab();
    } else if (tabId === 'playlists') {
      this.renderPlaylistsTab();
    } else if (tabId === 'history') {
      this.renderHistoryTab();
    } else if (tabId === 'saved-loops') {
      this.renderSavedLoopsTab();
    } else if (tabId === 'trends') {
      this.renderTrendsTab();
    } else if (tabId === 'analytics') {
      this.renderAnalyticsTab();
    }
  }

  showTab(tabId) {
    this.switchTab(tabId);
    // Open user dropdown if menu is open
    if (this.elements.userMenu) {
      this.elements.userMenu.classList.add('hidden');
    }
  }

  getThumbnailUrl(platform, id) {
    if (platform === 'youtube') return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    if (platform === 'vimeo') return `https://vumbnail.com/${id}.jpg`;
    if (platform === 'dailymotion') return `https://www.dailymotion.com/thumbnail/video/${id}`;
    return '';
  }

  async renderUpNextQueue(currentVideoId) {
    const section = document.getElementById('up-next-section');
    const list = document.getElementById('up-next-list');
    if (!section || !list) return;

    if (!this.state.discoverData) {
      let discoverVideos = [
        { id: 'aqz-KE-bpKQ', platform: 'youtube', title: 'Big Buck Bunny 60fps 4K' },
        { id: 'jfKfPfyJRdk', platform: 'youtube', title: 'lofi hip hop radio - beats to relax/study to' },
        { id: '76979871', platform: 'vimeo', title: 'Big Buck Bunny (High Quality Animated Film)' },
        { id: 'Sagg0zTrNGA', platform: 'youtube', title: 'Epic Sax Guy - 10 Hours Loop Edition' }
      ];

      if (window.supabaseClient) {
        try {
          const { data } = await supabaseClient.from('global_stats')
            .select('*')
            .neq('platform', 'local')
            .order('global_loops', { ascending: false })
            .limit(20);
          
          if (data && data.length > 0) {
            discoverVideos = data.map(d => ({
              videoId: d.video_id,
              platform: d.platform,
              title: `Trending ${d.platform} video`,
              globalLoops: d.global_loops
            }));
          }
        } catch(e) {}
      }
      this.state.discoverData = discoverVideos;
    }

    let suggestions = this.state.discoverData.filter(v => (v.videoId || v.id) !== currentVideoId);
    suggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 6);

    if (suggestions.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = '';
    
    suggestions.forEach(v => {
      const card = this.createVideoCard(v, false, null);
      list.appendChild(card);
    });
  }

  async renderDiscoverTab(page = 1) {

    if (!this.state.discoverData) {
      let discoverVideos = [
        { id: 'aqz-KE-bpKQ', platform: 'youtube', title: 'Big Buck Bunny 60fps 4K' },
        { id: 'jfKfPfyJRdk', platform: 'youtube', title: 'lofi hip hop radio - beats to relax/study to' },
        { id: '76979871', platform: 'vimeo', title: 'Big Buck Bunny (High Quality Animated Film)' },
        { id: 'x7t5vcr', platform: 'dailymotion', title: 'Introducing Dailymotion - Our brand new HTML5 player SDK' },
        { id: 'Sagg0zTrNGA', platform: 'youtube', title: 'Epic Sax Guy - 10 Hours Loop Edition' }
      ];

      if (window.supabaseClient) {
        const { data } = await supabaseClient.from('global_stats')
          .select('*')
          .neq('platform', 'local')
          .order('global_loops', { ascending: false })
          .limit(10);
        
        if (data && data.length > 0) {
          discoverVideos = data.map(d => ({
            videoId: d.video_id,
            platform: d.platform,
            title: `Trending ${d.platform} video`,
            globalLoops: d.global_loops
          }));
        }
      }
      this.state.discoverData = discoverVideos;
    }

    this.elements.discoverList.innerHTML = '';
    
    const isMobile = window.innerWidth <= 768;
    const itemsPerPage = isMobile ? 5 : 10;
    const totalPages = Math.ceil(this.state.discoverData.length / itemsPerPage);
    const startIdx = (page - 1) * itemsPerPage;
    const pageData = this.state.discoverData.slice(startIdx, startIdx + itemsPerPage);
    
    pageData.forEach((v, index) => {
      const globalIndex = startIdx + index;
      const isTrending = !!v.globalLoops;
      const card = this.createVideoCard(v, false, isTrending ? globalIndex + 1 : null);
      this.elements.discoverList.appendChild(card);
    });
    
    if (totalPages > 1) {
      const paginationDiv = document.createElement('div');
      paginationDiv.style.display = 'flex';
      paginationDiv.style.justifyContent = 'space-between';
      paginationDiv.style.marginTop = '16px';
      paginationDiv.style.padding = '0 10px';
      
      const prevBtn = document.createElement('button');
      prevBtn.className = 'btn btn-secondary btn-sm';
      prevBtn.innerHTML = '<i data-lucide="chevron-left"></i> Prev';
      prevBtn.disabled = page === 1;
      prevBtn.style.opacity = page === 1 ? '0.5' : '1';
      prevBtn.onclick = () => this.renderDiscoverTab(page - 1);
      
      const pageInfo = document.createElement('span');
      pageInfo.style.fontSize = '12px';
      pageInfo.style.color = 'var(--text-muted)';
      pageInfo.style.display = 'flex';
      pageInfo.style.alignItems = 'center';
      pageInfo.textContent = `Page ${page} of ${totalPages}`;
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-secondary btn-sm';
      nextBtn.innerHTML = 'Next <i data-lucide="chevron-right"></i>';
      nextBtn.disabled = page === totalPages;
      nextBtn.style.opacity = page === totalPages ? '0.5' : '1';
      nextBtn.onclick = () => this.renderDiscoverTab(page + 1);
      
      paginationDiv.appendChild(prevBtn);
      paginationDiv.appendChild(pageInfo);
      paginationDiv.appendChild(nextBtn);
      this.elements.discoverList.appendChild(paginationDiv);
    }
    
    if (window.lucide) lucide.createIcons();
  }

  renderFavoritesTab() {
    if (!this.state.user) {
      this.elements.favAuthRequired.classList.remove('hidden');
      this.elements.favoritesList.classList.add('hidden');
      this.elements.favoritesEmpty.classList.add('hidden');
      this.elements.favoritesCountBadge.textContent = '0';
      return;
    }

    this.elements.favAuthRequired.classList.add('hidden');
    
    const favorites = this.getDb('favorites').filter(f => f.userId === this.state.user.id);
    this.elements.favoritesCountBadge.textContent = favorites.length;

    if (favorites.length === 0) {
      this.elements.favoritesList.classList.add('hidden');
      this.elements.favoritesEmpty.classList.remove('hidden');
    } else {
      this.elements.favoritesEmpty.classList.add('hidden');
      this.elements.favoritesList.innerHTML = '';
      this.elements.favoritesList.classList.remove('hidden');
      
      const historyDb = this.getDb('history').filter(h => h.userId === this.state.user.id);
      
      favorites.forEach(f => {
        const historyItem = historyDb.find(h => h.videoId === f.videoId && h.platform === f.platform);
        f.loopsCount = historyItem ? historyItem.loopsCount : 0;
        const card = this.createVideoCard(f, true); // true to show loopsCount instead of global
        this.elements.favoritesList.appendChild(card);
      });
      lucide.createIcons();
    }
  }

  // Playlists methods modularized to js/playlists.js
  async renderHistoryTab() {
    if (!this.state.user) {
      this.elements.historyAuthRequired.classList.remove('hidden');
      this.elements.historyList.classList.add('hidden');
      this.elements.historyEmpty.classList.add('hidden');
      return;
    }

    this.elements.historyAuthRequired.classList.add('hidden');
    
    let history = [];
    if (window.supabaseClient) {
      const { data } = await supabaseClient.from('user_history').select('*').eq('user_id', this.state.user.id).order('last_played', { ascending: false });
      if (data) {
        history = data.map(d => ({ videoId: d.video_id, platform: d.platform, title: d.title, loopsCount: d.loops_count, lastPlayed: d.last_played }));
      }
    } else {
      history = this.getDb('history').filter(h => h.userId === this.state.user.id);
    }

    if (history.length === 0) {
      this.elements.historyList.classList.add('hidden');
      this.elements.historyEmpty.classList.remove('hidden');
    } else {
      this.elements.historyEmpty.classList.add('hidden');
      this.elements.historyList.innerHTML = '';
      this.elements.historyList.classList.remove('hidden');
      
      history.forEach(h => {
        const card = this.createVideoCard(h, true); // true indicates history item
        this.elements.historyList.appendChild(card);
      });
      lucide.createIcons();
    }
  }

  async renderTrendsTab() {
    let trends = [];
    if (window.supabaseClient) {
      const { data } = await supabaseClient.from('global_stats').select('*').neq('platform', 'local').order('global_loops', { ascending: false }).limit(10);
      if (data) {
        trends = data.map(d => ({ videoId: d.video_id, platform: d.platform, globalLoops: d.global_loops, globalPlays: d.global_plays, title: `Trending ${d.platform} video` }));
      }
    }

    if (!this.elements.trendsList) return;

    this.elements.trendsList.innerHTML = '';
    
    trends.slice(0, 10).forEach((t, index) => {
      const card = this.createVideoCard(t, false, index + 1);
      this.elements.trendsList.appendChild(card);
    });
    
    lucide.createIcons();
  }

  createVideoCard(video, isHistory = false, rank = null) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    // Resolve thumbnail
    let thumbUrl = '';
    if (video.platform === 'youtube') {
      thumbUrl = `https://img.youtube.com/vi/${video.videoId || video.id}/hqdefault.jpg`;
    } else {
      // Gradient SVG placeholder for non-youtube to maintain a sleek UI (using single quotes to prevent HTML attribute breaking)
      thumbUrl = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='60' viewBox='0 0 90 60'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%238b5cf6'/><stop offset='100%' stop-color='%23ec4899'/></linearGradient></defs><rect width='90' height='60' fill='url(%23g)' opacity='0.85'/><text x='45' y='35' font-family='Outfit,sans-serif' font-size='10' font-weight='bold' fill='white' text-anchor='middle'>${video.platform.toUpperCase()}</text></svg>`;
    }

    const globalLoops = video.globalLoops !== undefined ? video.globalLoops : 0;

    let subMeta = '';
    if (isHistory) {
      subMeta = `<span>Loops: <strong>${video.loopsCount || 0}</strong></span> • <span>${this.formatTimeAgo(video.lastPlayed || video.timestamp)}</span>`;
    } else {
      subMeta = `<span class="global-count"><i data-lucide="refresh-cw"></i> <strong>${this.formatNumber(globalLoops)}</strong> loops</span>`;
    }

    // Rank prefix for leaderboard
    const rankPrefix = rank ? `<span class="badge" style="margin-right:0.25rem; background: var(--gradient-primary); color:white;">#${rank}</span>` : '';

    card.innerHTML = `
      <img src="${this.escapeHtml(thumbUrl)}" class="video-card-thumb" alt="${this.escapeHtml(video.title)}">
      <div class="video-card-details">
        <h4 class="video-card-title">${rankPrefix}${this.escapeHtml(video.title)}</h4>
        <div class="video-card-meta">
          <span class="badge">${video.platform}</span>
          ${subMeta}
        </div>
      </div>
    `;

    if (video.platform === 'youtube') {
      const img = card.querySelector('.video-card-thumb');
      if (img) {
        const checkDead = () => {
          if (img.naturalWidth === 120) {
            card.style.display = 'none';
            if (window.supabaseClient && !isHistory) {
              window.supabaseClient.from('global_stats')
                .delete()
                .eq('video_id', video.videoId || video.id)
                .then(({ error }) => {
                  if (error) console.warn('Failed to clean up dead video', error);
                });
            }
          }
        };
        if (img.complete) {
          checkDead();
        } else {
          img.onload = checkDead;
        }
      }
    }

    card.addEventListener('click', () => {
      const vidId = video.videoId || video.id;
      
      // Update URL
      const newUrl = `${window.location.pathname}?v=${vidId}&p=${video.platform}`;
      window.history.pushState({ v: vidId, p: video.platform }, '', newUrl);
      
      this.loadVideo(vidId, video.platform);
    });

    return card;
  }

  // ==========================================
  // AUTHENTICATION CONTROLLER
  // ==========================================

  // Auth methods modularized to js/auth.js
  // SHARING
  // ==========================================

  shareVideo() {
    this.generateShareableClip();
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  showToast(message, iconName = 'info') {
    this.elements.toastIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
    this.elements.toastMessage.textContent = message;
    this.elements.toast.classList.remove('hidden');
    
    // Force browser reflow to ensure the CSS transition triggers
    void this.elements.toast.offsetWidth;
    
    this.elements.toast.classList.add('show');
    
    lucide.createIcons();
    
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.elements.toast.classList.remove('show');
      setTimeout(() => {
        if (!this.elements.toast.classList.contains('show')) {
          this.elements.toast.classList.add('hidden');
        }
      }, 300);
    }, 3000);
  }

  showConfirmDialog(title, message, isPrompt = false) {
    return new Promise((resolve) => {
      const modal = document.getElementById('custom-confirm-modal');
      const titleEl = document.getElementById('confirm-modal-title');
      const msgEl = document.getElementById('confirm-modal-message');
      const inputEl = document.getElementById('confirm-modal-input');
      const cancelBtn = document.getElementById('confirm-modal-cancel');
      const okBtn = document.getElementById('confirm-modal-ok');

      titleEl.textContent = title;
      msgEl.textContent = message;
      
      if (isPrompt) {
        inputEl.classList.remove('hidden');
        inputEl.value = '';
        inputEl.focus();
        okBtn.textContent = 'Delete Account';
        okBtn.style.background = '#ef4444'; // Red for destructive
      } else {
        inputEl.classList.add('hidden');
        okBtn.textContent = 'Confirm';
        okBtn.style.background = ''; // Default primary
      }

      modal.classList.remove('hidden');

      const cleanup = () => {
        modal.classList.add('hidden');
        cancelBtn.removeEventListener('click', onCancel);
        okBtn.removeEventListener('click', onOk);
      };

      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      const onOk = () => {
        cleanup();
        if (isPrompt) resolve(inputEl.value);
        else resolve(true);
      };

      cancelBtn.addEventListener('click', onCancel);
      okBtn.addEventListener('click', onOk);
    });
  }

  setButtonLoading(btnEl, isLoading, originalHTML = '') {
    if (!btnEl) return;
    if (isLoading) {
      // Store original content on the element if not provided
      if (!originalHTML && !btnEl.hasAttribute('data-original-html')) {
        btnEl.setAttribute('data-original-html', btnEl.innerHTML);
      }
      btnEl.disabled = true;
      btnEl.innerHTML = `<i data-lucide="loader-2" class="spinning-icon" style="animation: spin 1s linear infinite;"></i> Processing...`;
      lucide.createIcons();
    } else {
      btnEl.disabled = false;
      if (originalHTML) {
        btnEl.innerHTML = originalHTML;
      } else if (btnEl.hasAttribute('data-original-html')) {
        btnEl.innerHTML = btnEl.getAttribute('data-original-html');
        btnEl.removeAttribute('data-original-html');
      }
      lucide.createIcons();
    }
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  truncateString(str, num) {
    if (str.length <= num) return str;
    return str.slice(0, num) + '...';
  }

  parseTime(str) {
    if (!str) return 0;
    if (!isNaN(str)) return parseFloat(str);
    const parts = str.toString().split(':');
    if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return parseFloat(str) || 0;
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "00:00:00";
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  applyTimeMask(input, onChangeCallback) {
    input.addEventListener('focus', function() {
      setTimeout(() => this.select(), 10);
    });
    
    input.addEventListener('input', function(e) {
      this.value = this.value.replace(/[^\d:.]/g, '');
    });

    if (onChangeCallback) {
      input.addEventListener('change', onChangeCallback);
      input.addEventListener('blur', () => {
        const parsed = this.parseTime(input.value);
        input.value = this.formatTime(parsed);
      });
    }
  }

  getSplitTimeValue(group) {
    if (!group) return 0;
    const hStr = group.querySelector('.ts-h').value;
    const mStr = group.querySelector('.ts-m').value;
    const sStr = group.querySelector('.ts-s').value;
    const msStr = group.querySelector('.ts-ms').value;
    if (!hStr && !mStr && !sStr && !msStr) return null;
    return (parseInt(hStr)||0) * 3600 + (parseInt(mStr)||0) * 60 + (parseInt(sStr)||0) + ((parseInt(msStr)||0) / 1000);
  }

  setSplitTimeValue(group, seconds) {
    if (!group) return;
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      group.querySelector('.ts-h').value = '';
      group.querySelector('.ts-m').value = '';
      group.querySelector('.ts-s').value = '';
      group.querySelector('.ts-ms').value = '';
      return;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    group.querySelector('.ts-h').value = h > 0 ? h.toString().padStart(2, '0') : '';
    group.querySelector('.ts-m').value = m > 0 || h > 0 ? m.toString().padStart(2, '0') : '';
    group.querySelector('.ts-s').value = s.toString().padStart(2, '0');
    group.querySelector('.ts-ms').value = ms > 0 ? ms.toString().padStart(3, '0') : '';
  }

  setSplitTimeDisabled(group, disabled) {
    if (!group) return;
    if (disabled) {
      group.classList.add('disabled');
      group.classList.remove('enabled');
    } else {
      group.classList.remove('disabled');
      group.classList.add('enabled');
    }
    group.querySelectorAll('input').forEach(i => i.disabled = disabled);
  }

  bindSplitTimeGroup(group, onChangeCallback) {
    if (!group) return;
    const inputs = group.querySelectorAll('input');
    inputs.forEach((input, index) => {
      input.addEventListener('focus', function() {
        setTimeout(() => this.select(), 10);
      });
      
      input.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^\d]/g, '');
        if (this.value.length >= this.maxLength && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      
      if (onChangeCallback) {
        input.addEventListener('blur', onChangeCallback);
      }
    });
  }

  initTimeline() {
    let draggingHandle = null;

    const renderTimelineHandles = (skipMultiRender = false) => {
      const container = this.elements.timelineContainer;
      if (!container) return;
      
      const track = container.querySelector('.timeline-track');
      const markers = container.querySelector('.timeline-markers');
      container.innerHTML = '';
      if (track) container.appendChild(track);
      
      if (!this.state.abLoop.multiSegments || this.state.abLoop.multiSegments.length === 0) {
        const segEnd = this.state.abLoop.end || this.state.currentVideoDuration || 0;
        this.state.abLoop.multiSegments = [{
          start: this.state.abLoop.start || 0,
          end: segEnd
        }];
        // Sync back so abLoop.end is never left as 0 when duration is available
        if (segEnd > 0) {
          this.state.abLoop.end = segEnd;
        }
      }
      
      const duration = this.state.currentVideoDuration || 3600;
      const safeDuration = duration || 1;
      
      const segmentsToRender = this.state.isMultiSegment ? this.state.abLoop.multiSegments : [{ start: this.state.abLoop.start !== null ? this.state.abLoop.start : 0, end: this.state.abLoop.end !== null ? this.state.abLoop.end : duration }];

      segmentsToRender.forEach((seg, index) => {
        if (seg.start === null || seg.end === null) return;
        let sPct = Math.max(0, Math.min(100, (seg.start / safeDuration) * 100));
        let ePct = Math.max(0, Math.min(100, (seg.end / safeDuration) * 100));
        
        const sel = document.createElement('div');
        sel.className = 'timeline-selection';
        sel.style.left = `${sPct}%`;
        sel.style.width = `${ePct - sPct}%`;
        
        const hStart = document.createElement('div');
        hStart.className = `timeline-handle handle-start`;
        hStart.style.left = `${sPct}%`;
        hStart.dataset.index = index;
        hStart.dataset.type = 'start';
        hStart.tabIndex = 0;
        hStart.setAttribute('aria-label', 'Adjust loop start time');
        
        const hEnd = document.createElement('div');
        hEnd.className = `timeline-handle handle-end`;
        hEnd.style.left = `${ePct}%`;
        hEnd.dataset.index = index;
        hEnd.dataset.type = 'end';
        hEnd.tabIndex = 0;
        hEnd.setAttribute('aria-label', 'Adjust loop end time');
        
        hStart.addEventListener('pointerdown', handlePointerDown);
        hEnd.addEventListener('pointerdown', handlePointerDown);

        const handleKeyDown = (e, handleType, segIndex) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const step = 0.1; // 100ms
            const duration = this.state.currentVideoDuration || 3600;
            
            if (this.state.isMultiSegment) {
              const segs = this.state.abLoop.multiSegments;
              const s = segs[segIndex];
              if (handleType === 'start') {
                let minStart = (segIndex > 0 && segs[segIndex - 1].end !== null) ? segs[segIndex - 1].end : 0;
                let maxStart = (s.end !== null) ? s.end : duration;
                s.start += (e.key === 'ArrowLeft' ? -step : step);
                s.start = Math.max(minStart, Math.min(s.start, maxStart));
              } else {
                let minEnd = (s.start !== null) ? s.start : 0;
                let maxEnd = (segIndex < segs.length - 1 && segs[segIndex + 1].start !== null) ? segs[segIndex + 1].start : duration;
                s.end += (e.key === 'ArrowLeft' ? -step : step);
                s.end = Math.max(minEnd, Math.min(s.end, maxEnd));
              }
            } else {
              if (handleType === 'start') {
                let maxStart = (this.state.abLoop.end !== null && this.state.abLoop.end > 0) ? this.state.abLoop.end : duration;
                this.state.abLoop.start += (e.key === 'ArrowLeft' ? -step : step);
                this.state.abLoop.start = Math.max(0, Math.min(this.state.abLoop.start, maxStart));
              } else {
                let minEnd = (this.state.abLoop.start !== null) ? this.state.abLoop.start : 0;
                this.state.abLoop.end += (e.key === 'ArrowLeft' ? -step : step);
                this.state.abLoop.end = Math.max(minEnd, Math.min(this.state.abLoop.end, duration));
              }
            }
            
            renderTimelineHandles();
            
            // Restore focus after render
            const handles = container.querySelectorAll('.timeline-handle');
            for (let h of handles) {
              if (parseInt(h.dataset.index) === segIndex && h.dataset.type === handleType) {
                h.focus();
                break;
              }
            }
            
            this.saveABLoop();
          }
        };

        hStart.addEventListener('keydown', (e) => handleKeyDown(e, 'start', index));
        hEnd.addEventListener('keydown', (e) => handleKeyDown(e, 'end', index));
        
        container.appendChild(sel);
        container.appendChild(hStart);
        container.appendChild(hEnd);
      });
      
      if (markers) container.appendChild(markers);
      
      if (this.state.isMultiSegment) {
        if (this.state.abLoop.multiSegments) {
          this.state.abLoop.multiSegments.forEach((s, idx) => {
            const msStart = document.getElementById(`multi-start-${idx}`);
            const msEnd = document.getElementById(`multi-end-${idx}`);
            if (msStart && msStart._cascadingTime && s.start !== null) msStart._cascadingTime.setValue(s.start);
            if (msEnd && msEnd._cascadingTime && s.end !== null) msEnd._cascadingTime.setValue(s.end);
          });
        }
        const activeIdx = this.state.abLoop.currentSegmentIndex || 0;
        if (this.state.abLoop.multiSegments[activeIdx]) {
          const activeSeg = this.state.abLoop.multiSegments[activeIdx];
          
          if (activeSeg.end > 0) {
            if (this.elements.abStart) {
              if (this.elements.abStart._cascadingTime) this.elements.abStart._cascadingTime.setValue(activeSeg.start);
              else this.elements.abStart.value = this.formatTime(activeSeg.start);
            }
            if (this.elements.abEnd) {
              if (this.elements.abEnd._cascadingTime) this.elements.abEnd._cascadingTime.setValue(activeSeg.end);
              else this.elements.abEnd.value = this.formatTime(activeSeg.end);
            }
          } else {
            if (this.elements.abStart && this.elements.abStart._cascadingTime) this.elements.abStart._cascadingTime.setValue(null);
            if (this.elements.abEnd && this.elements.abEnd._cascadingTime) this.elements.abEnd._cascadingTime.setValue(null);
          }
          
          this.state.abLoop.start = activeSeg.start;
          this.state.abLoop.end = activeSeg.end;
        }
      } else {
        if (this.state.abLoop.end > 0) {
          if (this.elements.abStart) {
            if (this.elements.abStart._cascadingTime) this.elements.abStart._cascadingTime.setValue(this.state.abLoop.start);
            else this.elements.abStart.value = this.formatTime(this.state.abLoop.start);
          }
          if (this.elements.abEnd) {
            if (this.elements.abEnd._cascadingTime) this.elements.abEnd._cascadingTime.setValue(this.state.abLoop.end);
            else this.elements.abEnd.value = this.formatTime(this.state.abLoop.end);
          }
        }
      }
      if (!skipMultiRender) this.renderMultiSegments();
    };

    this.updateTimelineUI = (skipMultiRender = false) => {
      // Only mark the loop as active if we have a meaningful end time.
      // Setting active=true with end=0 causes the video to loop at 0 seconds.
      if (this.state.abLoop.end > 0 || this.state.currentVideoDuration > 0) {
        this.state.abLoop.active = true;
      }
      renderTimelineHandles(skipMultiRender);
    };

    const handlePointerDown = (e) => {
      if (this.state.isReadOnlyShared) {
        this.openUpgradeModal("Viewing a Shared Pro Link (Read-Only Mode). Upgrade to unlock editing!");
        return;
      }
      if (e.cancelable) e.preventDefault();
      draggingHandle = {
        index: parseInt(e.target.dataset.index),
        type: e.target.dataset.type
      };
      this.state.abLoop.currentSegmentIndex = draggingHandle.index;
      
      document.addEventListener('pointermove', handlePointerMove, {passive: false});
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
    };

    const handlePointerMove = (e) => {
      if (!draggingHandle) return;
      if (e.cancelable) e.preventDefault();
      
      const clientX = e.clientX;
      const rect = this.elements.timelineContainer.getBoundingClientRect();
      let x = clientX - rect.left;
      if (x < 0) x = 0;
      if (x > rect.width) x = rect.width;
      
      const pct = x / rect.width;
      const duration = this.state.currentVideoDuration || 3600;
      let val = pct * duration;
      
      const idx = draggingHandle.index;
      
      if (this.state.isMultiSegment) {
        const segs = this.state.abLoop.multiSegments;
        if (draggingHandle.type === 'start') {
          let minStart = (idx > 0 && segs[idx - 1].end !== null) ? segs[idx - 1].end : 0;
          let maxStart = (segs[idx].end !== null) ? segs[idx].end : duration;
          minStart = Math.max(0, minStart);
          maxStart = Math.min(maxStart, duration);
          segs[idx].start = Math.max(minStart, Math.min(val, maxStart));
        } else {
          let minEnd = (segs[idx].start !== null) ? segs[idx].start : 0;
          let maxEnd = (idx < segs.length - 1 && segs[idx + 1].start !== null) ? segs[idx + 1].start : duration;
          minEnd = Math.max(0, minEnd);
          maxEnd = Math.min(maxEnd, duration);
          segs[idx].end = Math.max(minEnd, Math.min(val, maxEnd));
        }
      } else {
        if (draggingHandle.type === 'start') {
          let maxStart = (this.state.abLoop.end !== null && this.state.abLoop.end > 0) ? this.state.abLoop.end : duration;
          this.state.abLoop.start = Math.max(0, Math.min(val, maxStart));
        } else {
          let minEnd = (this.state.abLoop.start !== null) ? this.state.abLoop.start : 0;
          this.state.abLoop.end = Math.max(minEnd, Math.min(val, duration));
        }
      }
      
      renderTimelineHandles();
    };

    const handlePointerUp = async () => {
      if (!draggingHandle) return;
      
      const idx = draggingHandle.index;
      let val;
      if (this.state.isMultiSegment) {
        val = draggingHandle.type === 'start' ? this.state.abLoop.multiSegments[idx].start : this.state.abLoop.multiSegments[idx].end;
      } else {
        val = draggingHandle.type === 'start' ? this.state.abLoop.start : this.state.abLoop.end;
      }
      
      if (this.state.currentPlatform) {
        if (draggingHandle.type === 'start') {
          const currentTime = await this.getCurrentTime();
          if (val > currentTime) {
            this.seekToTime(val);
          }
        }
        // We no longer seek when dragging the end handle to avoid interrupting playback.
        // The checkLoop function will automatically handle looping if the new end time is passed.
      }
      
      draggingHandle = null;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      
      this.saveLoopData();
    };

    const updateActiveFromInputs = (type) => {
      const valStr = type === 'start' ? this.elements.abStart.value : this.elements.abEnd.value;
      const v = this.parseTime(valStr);
      if (isNaN(v)) return;
      
      const duration = this.state.currentVideoDuration || 3600;
      
      if (this.state.isMultiSegment) {
        const idx = this.state.abLoop.currentSegmentIndex || 0;
        if (!this.state.abLoop.multiSegments[idx]) return;
        
        let s = type === 'start' ? v : this.state.abLoop.multiSegments[idx].start;
        let e = type === 'end' ? v : this.state.abLoop.multiSegments[idx].end;
        
        if (e === 0) e = duration;
        
        let minStart = (idx > 0 && this.state.abLoop.multiSegments[idx - 1].end !== null) ? this.state.abLoop.multiSegments[idx - 1].end : 0;
        let nextStart = (idx < this.state.abLoop.multiSegments.length - 1 && this.state.abLoop.multiSegments[idx + 1].start !== null) ? this.state.abLoop.multiSegments[idx + 1].start : duration;
        
        minStart = Math.max(0, minStart);
        let maxEnd = Math.min(nextStart, duration);
        
        if (s !== null) s = Math.max(minStart, Math.min(s, duration));
        if (e !== null) e = Math.min(e, maxEnd);
        
        if (s !== null && e !== null) {
          if (type === 'start' && s > e) {
            e = Math.min(s, duration);
          } else if (type === 'end' && e < s) {
            s = Math.max(e, 0);
          } else if (s > e) {
            s = e;
          }
        }
        
        this.state.abLoop.multiSegments[idx].start = s;
        this.state.abLoop.multiSegments[idx].end = e;
      } else {
        let s = type === 'start' ? v : this.state.abLoop.start;
        let e = type === 'end' ? v : this.state.abLoop.end;
        
        if (e === 0) e = duration;
        
        s = Math.max(0, Math.min(s, duration));
        e = Math.max(0, Math.min(e, duration));
        
        if (type === 'start' && s > e) {
          e = Math.min(s, duration);
        } else if (type === 'end' && e < s) {
          s = Math.max(e, 0);
        } else if (s > e) {
          s = e;
        }
        
        this.state.abLoop.start = s;
        this.state.abLoop.end = e;
      }
      this.updateTimelineUI();
    };

    if (this.elements.abStart) {
      this.applyTimeMask(this.elements.abStart, () => updateActiveFromInputs('start'));
    }
    if (this.elements.abEnd) {
      this.applyTimeMask(this.elements.abEnd, () => updateActiveFromInputs('end'));
    }
    
    // Explicitly update the timeline UI on load so it's not blank
    this.updateTimelineUI();
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // ==========================================
  // ADVANCED PLAYBACK CONTROLS
  // ==========================================

  initHTML5Player(url) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.style.backgroundColor = 'black';
    
    this.elements.playerContainer.appendChild(video);
    this.state.players.html5 = video;

    video.addEventListener('ended', () => {
      if (this.incrementLoops()) return;
      video.play();
    });

    video.addEventListener('playing', () => {
      this.elements.loopStateText.textContent = "Looping";
      this.elements.loopStateText.className = "stat-value text-green";
    });

    video.addEventListener('pause', () => {
      this.elements.loopStateText.textContent = "Paused";
      this.elements.loopStateText.className = "stat-value text-muted";
    });
  }

  initTwitchPlayer(id) {
    this.elements.playerContainer.innerHTML = '<div id="twitch-player-target" style="width:100%;height:100%;"></div>';
    
    // Parse the id we packed earlier
    const opts = { width: '100%', height: '100%', parent: ['watchonrepeat.com', 'www.watchonrepeat.com', 'app.watchonrepeat.com', window.location.hostname || 'localhost'] };
    if (id.startsWith('video=')) opts.video = id.split('=')[1];
    else if (id.startsWith('clip=')) opts.collection = id.split('=')[1];
    else if (id.startsWith('channel=')) opts.channel = id.split('=')[1];
    else opts.video = id; // fallback

    const setupTwitch = () => {
      const player = new Twitch.Player("twitch-player-target", opts);
      this.state.players.twitch = player;

      player.addEventListener(Twitch.Player.READY, () => {
        this.setVideoDuration(player.getDuration() || 0);

        player.play();
      });
      player.addEventListener(Twitch.Player.PLAYING, () => {
        const duration = player.getDuration();
        if (duration > 0 && (!this.state.currentVideoDuration || this.state.currentVideoDuration <= 0)) {
          this.setVideoDuration(duration);
        }
        this.elements.loopStateText.textContent = "Looping";
        this.elements.loopStateText.className = "stat-value text-green";
      });
      player.addEventListener(Twitch.Player.PAUSE, () => {
        this.elements.loopStateText.textContent = "Paused";
        this.elements.loopStateText.className = "stat-value text-muted";
      });
      player.addEventListener(Twitch.Player.ENDED, () => {
        if (this.incrementLoops()) return;
        this.seekToTime(this.state.abLoop.start || 0);
        player.play();
      });
    };

    if (window.Twitch) setupTwitch();
    else setTimeout(setupTwitch, 1000);
  }

  initSoundCloudPlayer(id) {
    this.elements.playerContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = `https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/${id}&auto_play=true&show_artwork=true&visual=true`;
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.allow = "autoplay";
    this.elements.playerContainer.appendChild(iframe);

    const setupSC = () => {
      const widget = SC.Widget(iframe);
      this.state.players.soundcloud = widget;

      widget.bind(SC.Widget.Events.READY, () => {
        widget.getDuration((duration) => {
          this.setVideoDuration(duration / 1000);
        });

      });
      widget.bind(SC.Widget.Events.PLAY, () => {
        this.elements.loopStateText.textContent = "Looping";
        this.elements.loopStateText.className = "stat-value text-green";
      });
      widget.bind(SC.Widget.Events.PAUSE, () => {
        this.elements.loopStateText.textContent = "Paused";
        this.elements.loopStateText.className = "stat-value text-muted";
      });
      widget.bind(SC.Widget.Events.FINISH, () => {
        if (this.incrementLoops()) return;
        this.seekToTime(this.state.abLoop.start || 0);
        widget.play();
      });
    };

    if (window.SC) setupSC();
    else setTimeout(setupSC, 1000);
  }

  initWistiaPlayer(id) {
    this.elements.playerContainer.innerHTML = `<div class="wistia_embed wistia_async_${id}" style="width:100%;height:100%;"></div>`;
    
    window._wq = window._wq || [];
    window._wq.push({ id: id, onReady: (video) => {
      this.state.players.wistia = video;
      this.setVideoDuration(video.duration());

      video.play();

      video.bind('play', () => {
        this.elements.loopStateText.textContent = "Looping";
        this.elements.loopStateText.className = "stat-value text-green";
      });
      video.bind('pause', () => {
        this.elements.loopStateText.textContent = "Paused";
        this.elements.loopStateText.className = "stat-value text-muted";
      });
      video.bind('end', () => {
        if (this.incrementLoops()) return;
        this.seekToTime(this.state.abLoop.start || 0);
        video.play();
      });
    }});
  }

  async getCurrentTime() {
    const p = this.state.currentPlatform;
    if (p === 'youtube' && this.state.players.youtube) return (typeof this.state.players.youtube.getCurrentTime === 'function' ? this.state.players.youtube.getCurrentTime() : 0);
    if (p === 'vimeo' && this.state.players.vimeo) return await this.state.players.vimeo.getCurrentTime().catch(()=>0);
    if (p === 'dailymotion' && this.state.players.dailymotion) return this.state.players.dailymotion.currentTime || 0;
    if (p === 'html5' && this.state.players.html5) return this.state.players.html5.currentTime || 0;
    if (p === 'local' && this.state.players.local) return await this.state.players.local.getCurrentTime();
    if (p === 'twitch' && this.state.players.twitch) return (typeof this.state.players.twitch.getCurrentTime === 'function' ? this.state.players.twitch.getCurrentTime() : 0);
    if (p === 'soundcloud' && this.state.players.soundcloud) {
      const ms = await new Promise(r => this.state.players.soundcloud.getPosition(r));
      return (ms || 0) / 1000;
    }
    if (p === 'wistia' && this.state.players.wistia) return this.state.players.wistia.time() || 0;
    return 0;
  }

  seekToTime(seconds) {
    const p = this.state.currentPlatform;
    if (p === 'youtube' && this.state.players.youtube && typeof this.state.players.youtube.seekTo === 'function') this.state.players.youtube.seekTo(seconds, true);
    if (p === 'vimeo' && this.state.players.vimeo && typeof this.state.players.vimeo.setCurrentTime === 'function') this.state.players.vimeo.setCurrentTime(seconds);
    if (p === 'dailymotion' && this.state.players.dailymotion && typeof this.state.players.dailymotion.seek === 'function') this.state.players.dailymotion.seek(seconds);
    if (p === 'html5' && this.state.players.html5) this.state.players.html5.currentTime = seconds;
    
    if (typeof this.syncRecordingWithVideo === 'function') {
      this.syncRecordingWithVideo();
    }
    if (p === 'local' && this.state.players.local) this.state.players.local.seekTo(seconds);
    if (p === 'twitch' && this.state.players.twitch && typeof this.state.players.twitch.seek === 'function') this.state.players.twitch.seek(seconds);
    if (p === 'soundcloud' && this.state.players.soundcloud && typeof this.state.players.soundcloud.seekTo === 'function') this.state.players.soundcloud.seekTo(seconds * 1000);
    if (p === 'wistia' && this.state.players.wistia && typeof this.state.players.wistia.time === 'function') this.state.players.wistia.time(seconds);
  }

  playVideo() {
    const p = this.state.currentPlatform;
    if (p === 'youtube' && this.state.players.youtube) this.state.players.youtube.playVideo();
    if (p === 'vimeo' && this.state.players.vimeo) this.state.players.vimeo.play();
    if (p === 'dailymotion' && this.state.players.dailymotion) this.state.players.dailymotion.play();
    if (p === 'html5' && this.state.players.html5) this.state.players.html5.play();
    if (p === 'twitch' && this.state.players.twitch) this.state.players.twitch.play();
    if (p === 'soundcloud' && this.state.players.soundcloud) this.state.players.soundcloud.play();
    if (p === 'wistia' && this.state.players.wistia) this.state.players.wistia.play();
  }
  
  pauseVideo() {
    const p = this.state.currentPlatform;
    if (p === 'youtube' && this.state.players.youtube) this.state.players.youtube.pauseVideo();
    if (p === 'vimeo' && this.state.players.vimeo) this.state.players.vimeo.pause();
    if (p === 'dailymotion' && this.state.players.dailymotion) this.state.players.dailymotion.pause();
    if (p === 'html5' && this.state.players.html5) this.state.players.html5.pause();
    if (p === 'twitch' && this.state.players.twitch) this.state.players.twitch.pause();
    if (p === 'soundcloud' && this.state.players.soundcloud) this.state.players.soundcloud.pause();
    if (p === 'wistia' && this.state.players.wistia) this.state.players.wistia.pause();
  }

  updateMediaSession(title, platform, id) {
    if ('mediaSession' in navigator) {
      const artworkUrl = this.getThumbnailUrl(platform, id);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'Unknown Title',
        artist: 'WatchOnRepeat',
        album: 'Video Loop',
        artwork: [
          { src: artworkUrl || 'logo.svg', sizes: '96x96', type: 'image/jpeg' },
          { src: artworkUrl || 'logo.svg', sizes: '128x128', type: 'image/jpeg' },
          { src: artworkUrl || 'logo.svg', sizes: '192x192', type: 'image/jpeg' },
          { src: artworkUrl || 'logo.svg', sizes: '256x256', type: 'image/jpeg' },
          { src: artworkUrl || 'logo.svg', sizes: '384x384', type: 'image/jpeg' },
          { src: artworkUrl || 'logo.svg', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        this.playVideo();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        this.pauseVideo();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (this.state.isMultiSegment && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 1) {
           let idx = this.state.abLoop.currentSegmentIndex - 1;
           if (idx < 0) idx = this.state.abLoop.multiSegments.length - 1;
           this.state.abLoop.currentSegmentIndex = idx;
           this.seekToTime(this.state.abLoop.multiSegments[idx].start);
           this.updateTimelineUI();
        } else {
           this.seekToTime(this.state.abLoop.start !== null ? this.state.abLoop.start : 0);
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.state.isMultiSegment && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 1) {
           let idx = this.state.abLoop.currentSegmentIndex + 1;
           if (idx >= this.state.abLoop.multiSegments.length) idx = 0;
           this.state.abLoop.currentSegmentIndex = idx;
           this.seekToTime(this.state.abLoop.multiSegments[idx].start);
           this.updateTimelineUI();
        } else {
           this.seekToTime(this.state.abLoop.end !== null && this.state.abLoop.end > 0 ? this.state.abLoop.end : (this.state.currentVideoDuration || 0));
        }
      });
    }
  }

  setPlaybackSpeed(rate, hideToast = false, fromAutoTempo = false) {
    rate = parseFloat(rate);
    this.state.playbackRate = rate;
    
    // Freeze gradual tempo if speed is manually changed
    if (!fromAutoTempo) {
      const tempoCheckbox = document.getElementById('auto-tempo-checkbox');
      if (tempoCheckbox) {
        if (rate !== 1) {
          tempoCheckbox.disabled = true;
          tempoCheckbox.checked = false;
          this.state.isAutoTempoEnabled = false;
          tempoCheckbox.parentElement.style.opacity = '0.4';
          tempoCheckbox.parentElement.title = "Gradual Tempo requires 1x Master Speed";
        } else {
          tempoCheckbox.disabled = false;
          tempoCheckbox.parentElement.style.opacity = '1';
          tempoCheckbox.parentElement.title = "";
        }
      }
    }
    
    if (this.elements && this.elements.playbackSpeed) {
      let optionExists = Array.from(this.elements.playbackSpeed.options).some(opt => parseFloat(opt.value) === rate);
      if (!optionExists) {
        const newOpt = document.createElement('option');
        newOpt.value = rate;
        newOpt.text = rate.toFixed(2) + 'x (Auto)';
        this.elements.playbackSpeed.appendChild(newOpt);
      }
      this.elements.playbackSpeed.value = rate;
    }
    
    const p = this.state.currentPlatform;
    try {
      if (p === 'youtube' && this.state.players.youtube) this.state.players.youtube.setPlaybackRate(rate);
      if (p === 'vimeo' && this.state.players.vimeo) this.state.players.vimeo.setPlaybackRate(rate);
      if (p === 'dailymotion' && this.state.players.dailymotion) if (DEBUG_MODE) console.warn("Dailymotion API may not support rate changes directly.");
      if (p === 'html5' && this.state.players.html5) this.state.players.html5.playbackRate = rate;
      if (p === 'local' && this.state.players.local) this.state.players.local.setPlaybackRate(rate);
      if (!hideToast) this.showToast(`Speed set to ${rate}x`);
    } catch(e) {
      if (DEBUG_MODE) console.error("Error setting rate", e);
    }
  }

  // ==========================================
  // Loops methods modularized to js/loops.js
  // NOTES FEATURE
  // ==========================================

  // Notes methods have been modularized to js/notes.js

  escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  async generateShareableClip() {
    const video = this.state.currentVideo;
    if (!video) {
      this.showToast("Load a video first!", "alert-circle");
      return;
    }

    let urlParams = new URLSearchParams();
    urlParams.set('v', video.id);
    urlParams.set('p', video.platform);
    
    // Encode Segments
    const includeSegmentsCheckbox = document.getElementById('share-include-segments');
    const includeSegments = includeSegmentsCheckbox ? includeSegmentsCheckbox.checked : true;
    
    if (includeSegments) {
      if (this.state.isMultiSegment && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 0) {
        // Format: start-end,start-end
        const segs = this.state.abLoop.multiSegments.map(l => {
          let str = `${Number(l.start).toFixed(2)}-${Number(l.end).toFixed(2)}`;
          if (l.speed && Number(l.speed) !== 1) {
            str += `@${l.speed}`;
          }
          return str;
        }).join(',');
        urlParams.set('segments', segs);
        
        // Also set the basic start/end for backward compatibility or simple free users
        urlParams.set('start', this.state.abLoop.multiSegments[0].start);
        urlParams.set('end', this.state.abLoop.multiSegments[0].end);
      } else if (this.state.abLoop.active) {
        urlParams.set('start', this.state.abLoop.start);
        urlParams.set('end', this.state.abLoop.end);
      } else {
        try {
          const currentTime = await this.getCurrentTime();
          if (currentTime > 0) {
            urlParams.set('start', Math.floor(currentTime));
          }
        } catch (err) {
          console.error("Could not get current time for share link", err);
        }
      }
      
      if (this.state.playbackRate !== 1) {
        urlParams.set('rate', this.state.playbackRate);
      }
    }

    // Encode Notes (Limit payload size by truncating to ~1500 chars if necessary, but base64 compress)
    const includeNotesCheckbox = document.getElementById('share-include-notes');
    const includeNotes = includeNotesCheckbox ? includeNotesCheckbox.checked : true;
    
    if (includeNotes) {
      const notesDb = this.getDb('notes');
      const videoNotes = notesDb[`${video.platform}_${video.id}`];
      if (videoNotes && videoNotes.length > 0) {
        try {
          const notesJson = JSON.stringify(videoNotes);
          const base64Notes = btoa(encodeURIComponent(notesJson));
          urlParams.set('n', base64Notes);
        } catch (e) {
          console.error("Notes payload too large to encode", e);
        }
      }
    }

    const shareUrl = `${window.location.href.split('?')[0]}?${urlParams.toString()}`;
    // Open Inline Share Menu
    const menu = document.getElementById('inline-share-menu');
    const input = document.getElementById('share-link-input');
    if (menu && input) {
      input.value = shareUrl;
      if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
      } else {
        menu.classList.remove('hidden');
      }
    } else {
      // Fallback
      app.showToast("Link copied to clipboard!", "check-circle");
      navigator.clipboard.writeText(shareUrl).catch(err => {
        console.error("Could not copy link", err);
      });
    }
  }

  toggleInlineShare() {
    const menu = document.getElementById('inline-share-menu');
    if (menu) {
      if (menu.classList.contains('hidden')) {
        this.generateShareableClip();
      } else {
        menu.classList.add('hidden');
      }
    }
  }

  closeShareModal() {
    const menu = document.getElementById('inline-share-menu');
    if (menu) menu.classList.add('hidden');
  }

  openProControlsModal() {
    const modal = document.getElementById('pro-controls-modal');
    if (modal) {
      modal.classList.remove('hidden');
      lucide.createIcons();
    }
  }
  
  closeProControlsModal() {
    const modal = document.getElementById('pro-controls-modal');
    if (modal) modal.classList.add('hidden');
  }

  copyShareLink() {
    const input = document.getElementById('share-link-input');
    if (input) {
      input.select();
      navigator.clipboard.writeText(input.value).then(() => {
        this.showToast("Link copied to clipboard!", "clipboard-check");
      });
    }
  }

  shareToSocial(platform) {
    const input = document.getElementById('share-link-input');
    if (!input || !input.value) return;
    
    const url = encodeURIComponent(input.value);
    const text = encodeURIComponent("Check out this practice loop with my notes!");
    let shareUrl = "";
    
    switch(platform) {
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`; break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  initHotkeys() {
    this.defaultShortcuts = {
      'setStart': 'a',
      'setEnd': 'o',
      'toggleLoop': 'l',
      'focusSpeed': '/',
      'openNotes': 'n',
      'shiftLeft': 'arrowleft',
      'shiftRight': 'arrowright',
      'halfScale': '[',
      'doubleScale': ']'
    };
    
    this.state.shortcuts = { ...this.defaultShortcuts };
    
    // Load custom shortcuts if premium
    if (this.state.user && this.state.user.isPremium) {
      const saved = this.getDb('shortcuts');
      if (saved && Object.keys(saved).length > 0) {
        this.state.shortcuts = { ...this.defaultShortcuts, ...saved };
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        // Exception for recording a new shortcut
        if (this.state.isRecordingShortcut && e.target.id === 'shortcut-recorder') {
          e.preventDefault();
          this.handleShortcutRecord(e);
        }
        return;
      }
      
      const key = e.key.toLowerCase();
      const s = this.state.shortcuts;
      const isPremium = this.state.user && this.state.user.isPremium;
      
      if (key === s.setStart) {
        e.preventDefault();
        this.getCurrentTime().then(t => {
          if (this.elements.abStart) {
            this.elements.abStart.value = this.formatTime(t);
            if (this.updateTimelineUI) this.updateTimelineUI();
          }
          this.showToast("Timestamp Start marked at " + this.formatTime(t), "flag");
        });
      } else if (key === s.setEnd) {
        e.preventDefault();
        this.getCurrentTime().then(t => {
          if (this.elements.abEnd) {
            this.elements.abEnd.value = this.formatTime(t);
            if (this.updateTimelineUI) this.updateTimelineUI();
          }
          this.showToast("Timestamp End marked at " + this.formatTime(t), "flag");
        });
      } else if (key === s.toggleLoop) {
        e.preventDefault();
        // Removed explicit toggle

      } else if (key === s.focusSpeed) {
        e.preventDefault();
        if (this.elements.playbackSpeed) this.elements.playbackSpeed.focus();
      } else if (key === s.openNotes) {
        e.preventDefault();
        this.switchTab('notes');
        if (this.elements.noteInput) this.elements.noteInput.focus();
      } 
      // Premium shortcuts
      else if (isPremium && key === s.shiftLeft) {
        e.preventDefault();
        this.shiftLoop(-1);
      } else if (isPremium && key === s.shiftRight) {
        e.preventDefault();
        this.shiftLoop(1);
      } else if (isPremium && key === s.halfScale) {
        e.preventDefault();
        this.scaleLoop(0.5);
      } else if (isPremium && key === s.doubleScale) {
        e.preventDefault();
        this.scaleLoop(2);
      }
    });
  }

  // Reload shortcuts when tier changes or app starts
  reloadShortcuts() {
    this.state.shortcuts = { ...this.defaultShortcuts };
    if (this.state.user && this.state.user.isPremium) {
      const saved = this.getDb('shortcuts');
      if (saved && Object.keys(saved).length > 0) {
        this.state.shortcuts = { ...this.defaultShortcuts, ...saved };
      }
    }
  }

  // ==========================================
  // SETTINGS MODAL
  // ==========================================
  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    
    // Close user menu
    if (this.elements.userMenu) this.elements.userMenu.classList.add('hidden');
    
    // Populate modal data
    const planBadge = document.getElementById('settings-plan-badge');
    const planDate = document.getElementById('settings-plan-date');
    const cancelBtn = document.getElementById('settings-cancel-sub-btn');
    const emailInput = document.getElementById('settings-email-input');
    
    if (this.state.user) {
      emailInput.value = this.state.user.email;
      
      const tier = this.state.user.tier;
      planBadge.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
      if (tier === 'pro') planBadge.style.background = 'var(--accent)';
      else if (tier === 'premium') planBadge.style.background = 'var(--primary)';
      else planBadge.style.background = 'var(--surface-light)';
      
      if (this.state.user.subscriptionEndDate) {
        const d = new Date(this.state.user.subscriptionEndDate);
        planDate.textContent = d.toLocaleDateString();
        
        if (this.state.user.cancelAtPeriodEnd) {
          planDate.textContent += " (Canceling)";
          cancelBtn.style.display = 'none';
        } else {
          cancelBtn.style.display = 'block';
        }
      } else {
        planDate.textContent = "N/A";
        cancelBtn.style.display = 'none';
      }
    }
    
    modal.classList.remove('hidden');
  }

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  }

  async updateAccountEmail() {
    if (!window.supabaseClient) return;
    const email = document.getElementById('settings-email-input').value;
    if (!email) return;
    
    const { data, error } = await supabaseClient.auth.updateUser({ email });
    if (error) {
      this.showToast(error.message, "alert-circle");
    } else {
      this.showToast("Confirmation link sent to your new email!", "check-circle");
    }
  }

  async updateAccountPassword() {
    if (!window.supabaseClient) return;
    const password = document.getElementById('settings-password-input').value;
    const confirm = document.getElementById('settings-password-confirm').value;
    if (!password) return;
    
    if (password.length < 6) {
      this.showToast("Password must be at least 6 characters.", "alert-circle");
      return;
    }
    
    if (password !== confirm) {
      this.showToast("Passwords do not match.", "alert-circle");
      return;
    }
    
    const { data, error } = await supabaseClient.auth.updateUser({ password });
    if (error) {
      this.showToast(error.message, "alert-circle");
    } else {
      this.showToast("Password updated successfully!", "check-circle");
      document.getElementById('settings-password-input').value = '';
      document.getElementById('settings-password-confirm').value = '';
    }
  }

  async clearLocalCache() {
    const confirmClear = await this.showConfirmDialog("Clear Local Cache", "Are you sure you want to clear your local application cache? This will NOT delete your cloud data.");
    if (confirmClear) {
      const btnEl = document.querySelector('button[onclick="app.clearLocalCache()"]');
      this.setButtonLoading(btnEl, true);
      localStorage.clear();
      this.showToast("Cache cleared! Reloading...", "check-circle");
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  async deleteAccount() {
    if (!window.supabaseClient) return;
    const confirmation = await this.showConfirmDialog("Delete Account", "Are you absolutely sure? This will permanently delete your account, history, and playlists. Type 'DELETE' to confirm.", true);
    if (confirmation === 'DELETE') {
      const btnEl = document.querySelector('button[onclick="app.deleteAccount()"]');
      this.setButtonLoading(btnEl, true);
      try {
        const { error } = await supabaseClient.rpc('delete_user_account');
        if (error) throw error;
        
        await supabaseClient.auth.signOut();
        this.setButtonLoading(btnEl, false);
        this.showToast("Your account has been completely deleted.", "check-circle");
        setTimeout(() => window.location.reload(), 2000);
      } catch (e) {
        this.setButtonLoading(btnEl, false);
        this.showToast("Failed to delete account: " + e.message, "alert-circle");
      }
    }
  }

  async cancelSubscription() {
    if (!window.supabaseClient) return;
    const confirmCancel = await this.showConfirmDialog("Cancel Subscription", "Are you sure you want to cancel your subscription? You will retain access until the end of your billing cycle.");
    if (confirmCancel) {
      const btnEl = document.getElementById('settings-cancel-sub-btn');
      this.setButtonLoading(btnEl, true);
      const { error } = await supabaseClient.from('users').update({ cancel_at_period_end: true }).eq('id', this.state.user.id);
      this.setButtonLoading(btnEl, false);
      
      if (error) {
        this.showToast("Failed to cancel: " + error.message, "alert-circle");
      } else {
        this.state.user.cancelAtPeriodEnd = true;
        this.showToast("Subscription canceled. Access remains until end of cycle.", "check-circle");
        this.openSettingsModal(); 
      }
    }
  }

  // SHORTCUTS SETTINGS MODAL
  // ==========================================
  openShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    if (!modal) return;
    
    // Close user menu
    if (this.elements.userMenu) this.elements.userMenu.classList.add('hidden');
    
    this.renderShortcutsList();
    modal.classList.remove('hidden');
  }

  closeShortcutsModal() {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) modal.classList.add('hidden');
  }

  renderShortcutsList() {
    const list = document.getElementById('shortcuts-list');
    const warning = document.getElementById('shortcuts-free-warning');
    if (!list) return;
    
    const isPremium = this.state.user && this.state.user.isPremium;
    if (warning) warning.classList.toggle('hidden', isPremium);
    
    list.innerHTML = '';
    
    const s = this.state.shortcuts;
    const actions = [
      { id: 'setStart', name: 'Mark Loop Start' },
      { id: 'setEnd', name: 'Mark Loop End' },
      { id: 'toggleLoop', name: 'Toggle Timestamp Loop' },
      { id: 'focusSpeed', name: 'Focus Speed Control' },
      { id: 'openNotes', name: 'Open Notes Tab' },
      { id: 'shiftLeft', name: 'Shift Loop Left', premium: true },
      { id: 'shiftRight', name: 'Shift Loop Right', premium: true },
      { id: 'halfScale', name: 'Halve Duration (1/2x)', premium: true },
      { id: 'doubleScale', name: 'Double Duration (2x)', premium: true }
    ];
    
    actions.forEach(action => {
      const item = document.createElement('div');
      item.className = 'shortcut-item flex justify-between items-center p-3 rounded bg-gray-800/50 border border-gray-700';
      
      const titleDiv = document.createElement('div');
      titleDiv.innerHTML = `<span class="text-white font-medium">${action.name}</span> ${action.premium ? '<span class="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded ml-1">PRO</span>' : ''}`;
      
      const keyBtn = document.createElement('button');
      keyBtn.className = 'btn btn-outline btn-sm font-mono';
      keyBtn.textContent = s[action.id] === ' ' ? 'Space' : s[action.id].toUpperCase();
      
      if (!isPremium) {
        keyBtn.disabled = true;
        keyBtn.title = "Upgrade to Premium to change shortcuts";
        keyBtn.style.opacity = '0.5';
        keyBtn.style.cursor = 'not-allowed';
      } else {
        keyBtn.onclick = () => this.startRecordingShortcut(action.id, action.name);
      }
      
      item.appendChild(titleDiv);
      item.appendChild(keyBtn);
      list.appendChild(item);
    });
  }

  startRecordingShortcut(actionId, actionName) {
    this.state.isRecordingShortcut = true;
    this.state.recordingActionId = actionId;
    
    const modal = document.getElementById('shortcut-recorder-modal');
    const nameSpan = document.getElementById('recording-action-name');
    const input = document.getElementById('shortcut-recorder');
    
    nameSpan.textContent = actionName;
    modal.classList.remove('hidden');
    input.focus();
  }

  cancelShortcutRecord() {
    this.state.isRecordingShortcut = false;
    this.state.recordingActionId = null;
    const modal = document.getElementById('shortcut-recorder-modal');
    if (modal) modal.classList.add('hidden');
  }

  handleShortcutRecord(e) {
    e.preventDefault();
    const key = e.key.toLowerCase();
    
    // Ignore meta keys alone
    if (['control', 'shift', 'alt', 'meta'].includes(key)) return;
    
    const actionId = this.state.recordingActionId;
    if (actionId && this.state.user && this.state.user.isPremium) {
      let saved = this.getDb('shortcuts') || {};
      saved[actionId] = key;
      this.saveDb('shortcuts', saved);
      
      this.reloadShortcuts();
      this.renderShortcutsList();
      this.showToast(`Shortcut for updated to ${key.toUpperCase()}`, "keyboard");
    }
    
    this.cancelShortcutRecord();
  }

  updateAnalyticsTime() {
    const db = this.getDb('analytics');
    db.totalTime = (db.totalTime || 0) + 1;
    if (!db.weeklyTime) db.weeklyTime = {};
    if (!db.segments) db.segments = {};
    
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    const weekStr = `${d.getUTCFullYear()}-W${weekNo}`;
    
    db.weeklyTime[weekStr] = (db.weeklyTime[weekStr] || 0) + 1;
    this.saveDb('analytics', db);
  }

  trackABSegment() {
    const db = this.getDb('analytics');
    if (!db.segments) db.segments = {};
    
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const start = this.state.abLoop.start;
    const end = this.state.abLoop.end;
    const key = `${vId}_${start}_${end}`;
    
    if (!db.segments[key]) {
      db.segments[key] = {
        platform: this.state.currentPlatform,
        videoId: this.state.currentVideo.id,
        videoTitle: this.state.currentVideo.title,
        start: start,
        end: end,
        name: null,
        loops: 0
      };
    }
    db.segments[key].loops += 1;
    this.saveDb('analytics', db);
  }

  saveNamedLoop() {
    const name = this.elements.loopNameInput.value.trim();
    if (!name) return;
    if (!this.state.abLoop.active || !this.state.currentVideo) {
      this.showToast("A/B Loop must be active", "alert-circle");
      return;
    }
    
    const db = this.getDb('analytics');
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const start = this.state.abLoop.start;
    const end = this.state.abLoop.end;
    const key = `${vId}_${start}_${end}`;
    
    if (!db.segments[key]) {
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
    this.saveDb('analytics', db);
    this.elements.loopNameInput.value = '';
    this.showToast(`Loop saved as "${name}"`, "save");
    if (this.state.activeTab === 'analytics') this.renderAnalyticsTab();
    if (this.state.activeTab === 'saved-loops') this.renderSavedLoopsTab();

    if (!this.state.user && !this.state.guestPromptShown) {
      this.state.guestPromptShown = true;
      setTimeout(() => {
        this.showToast("Loving the features? Create a free account to save your loops, notes, and playlists so you never lose them!", "heart");
      }, 2000);
    }
  }

  renderSavedLoopsTab() {
    const db = this.getDb('analytics');
    const segmentsArr = Object.values(db.segments || {}).filter(seg => seg.name && seg.name.trim() !== '');
    
    // Sort logic
    const sortSelect = document.getElementById('saved-loops-sort');
    const sortBy = sortSelect ? sortSelect.value : 'recent_add';
    
    segmentsArr.sort((a, b) => {
      if (sortBy === 'recent_add') return (b.savedAt || 0) - (a.savedAt || 0);
      if (sortBy === 'recent_edit') return (b.editedAt || 0) - (a.editedAt || 0);
      if (sortBy === 'alpha') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

    const listEl = this.elements.savedLoopsList;
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (segmentsArr.length === 0) {
      if (this.elements.savedLoopsEmpty) this.elements.savedLoopsEmpty.classList.remove('hidden');
      return;
    }
    if (this.elements.savedLoopsEmpty) this.elements.savedLoopsEmpty.classList.add('hidden');

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
      const div = document.createElement('div');
      div.className = 'note-item';
      div.style = "display: flex; flex-direction: column; background: var(--surface-color); border: 1px solid #333; border-radius: 8px; overflow: hidden; margin-bottom: 8px;";
      
      const thumbUrl = this.getThumbnailUrl(videoGroup.platform, videoGroup.videoId);
      
      let headerHtml = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-bottom: 1px solid #333;">
          <img src="${thumbUrl}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; background: #000;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4='">
          <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
            <span style="font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px;">
              ${this.escapeHtml(videoGroup.title)}
            </span>
            <span style="font-size: 11px; color: #888; text-transform: uppercase;">${videoGroup.platform}</span>
          </div>
        </div>
        <div style="padding: 8px 12px; display: flex; flex-direction: column; gap: 6px;">
      `;
      
      let segmentsHtml = '';
      videoGroup.segments.forEach(seg => {
        const urlParams = `?url=${encodeURIComponent(seg.platform + '_' + seg.videoId)}&start=${seg.start}&end=${seg.end}`;
        segmentsHtml += `
          <a href="${urlParams}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; text-decoration: none; color: white; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
            <span style="font-weight: 500; font-size: 13px;">${this.escapeHtml(seg.name || 'Unnamed Loop')}</span>
            <span style="font-size: 12px; color: #888; font-family: monospace;">${this.formatTime(seg.start)} - ${this.formatTime(seg.end)}</span>
          </a>
        `;
      });
      
      div.innerHTML = headerHtml + segmentsHtml + `</div>`;
      listEl.appendChild(div);
    });
  }

  renderAnalyticsTab() {
    const db = this.getDb('analytics');
    if (!db.weeklyTime) db.weeklyTime = {};
    if (!db.segments) db.segments = {};
    
    const formatH = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return `${h}h ${m}m`;
    };
    
    this.elements.analyticsTotalTime.textContent = formatH(db.totalTime || 0);
    
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    const weekStr = `${d.getUTCFullYear()}-W${weekNo}`;
    
    this.elements.analyticsWeeklyTime.textContent = formatH(db.weeklyTime[weekStr] || 0);
    
    const segments = Object.values(db.segments || {});
    segments.sort((a,b) => b.loops - a.loops);
    
    this.elements.analyticsSegmentsList.innerHTML = '';
    
    if (segments.length === 0) {
      this.elements.analyticsEmpty.classList.remove('hidden');
      return;
    }
    this.elements.analyticsEmpty.classList.add('hidden');
    
    segments.slice(0, 10).forEach(seg => {
      const mStart = Math.floor(seg.start / 60).toString().padStart(2, '0');
      const sStart = (seg.start % 60).toString().padStart(2, '0');
      const mEnd = Math.floor(seg.end / 60).toString().padStart(2, '0');
      const sEnd = (seg.end % 60).toString().padStart(2, '0');
      
      const displayName = seg.name || this.truncateString(seg.videoTitle, 30);
      const timeStr = `[${mStart}:${sStart} - ${mEnd}:${sEnd}]`;
      
      const div = document.createElement('div');
      div.className = 'segment-item';
      div.onclick = () => {
        window.location.href = `/?v=${seg.videoId}&p=${seg.platform}&start=${seg.start}&end=${seg.end}`;
      };
      
      div.innerHTML = `
        <div class="segment-info">
          <span class="segment-name">${this.escapeHtml(displayName)}</span>
          <span class="segment-time">${timeStr}</span>
        </div>
        <div class="segment-loops">
          ${seg.loops} <span style="font-size:0.7rem; color:var(--text-muted); font-weight:normal;">loops</span>
        </div>
      `;
      this.elements.analyticsSegmentsList.appendChild(div);
    });
  }

  initMobileLayout() {
    const updateMobileLayout = () => {
      const stats = document.querySelector('.stats-dashboard');
      const sidebarTabs = document.querySelector('.sidebar-tabs');
      const mainCol = document.querySelector('.main-column');
      
      if (!stats || !sidebarTabs || !mainCol) return;
      
      if (window.innerWidth <= 768) {
        if (stats.parentElement === mainCol) {
          const sidebarCol = document.querySelector('.sidebar-column');
          if (sidebarCol) sidebarCol.appendChild(stats);
        }
      } else {
        if (stats.parentElement !== mainCol) {
          mainCol.appendChild(stats);
        }
      }
    };
    
    window.addEventListener('resize', updateMobileLayout);
    updateMobileLayout();
  }
}

function applyMixin(targetClass, mixinClass) {
  Object.getOwnPropertyNames(mixinClass.prototype).forEach(name => {
    if (name !== 'constructor') {
      targetClass.prototype[name] = mixinClass.prototype[name];
    }
  });
}

// Apply Mixins
if (window.DatabaseMixin) applyMixin(WatchOnRepeat, window.DatabaseMixin);
if (window.AuthMixin) applyMixin(WatchOnRepeat, window.AuthMixin);
if (window.NotesMixin) Object.assign(WatchOnRepeat.prototype, window.NotesMixin);
if (window.PlaylistsMixin) applyMixin(WatchOnRepeat, window.PlaylistsMixin);
if (window.LoopsMixin) applyMixin(WatchOnRepeat, window.LoopsMixin);
if (window.AudioRecorderMixin) applyMixin(WatchOnRepeat, window.AudioRecorderMixin);

// Instantiate and initialize
const app = new WatchOnRepeat();
window.app = app; // Expose globally for inline onclick handlers

document.addEventListener('DOMContentLoaded', () => {
  app.init();
  
  if (window.CascadingTimeInput) {
    const manualNoteEl = document.getElementById('manual-note-time');
    if (manualNoteEl) new CascadingTimeInput(manualNoteEl, false);
    
    const abStartEl = document.getElementById('ab-start');
    if (abStartEl) {
      new CascadingTimeInput(abStartEl, false, (seconds) => {
        if (app.state && app.state.abLoop) {
          app.state.abLoop.start = seconds;
          app.state.abLoop.active = true;
          app.updateTimelineUI();
          app.saveLoopData();
        }
      });
    }
    
    const abEndEl = document.getElementById('ab-end');
    if (abEndEl) {
      new CascadingTimeInput(abEndEl, false, (seconds) => {
        if (app.state && app.state.abLoop) {
          app.state.abLoop.end = seconds;
          app.state.abLoop.active = true;
          app.updateTimelineUI();
          app.saveLoopData();
        }
      });
    }
  }
});




// PWA Installation Logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.classList.remove('hidden');
    installBtn.onclick = async () => {
      installBtn.classList.add('hidden');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA Install Outcome:', outcome);
      deferredPrompt = null;
    };
  }
});
