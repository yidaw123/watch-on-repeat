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
      currentPlatform: null,
      abLoop: {
        active: true,
        start: 0,
        end: 0,
        timer: null
      },
      playbackRate: 1,
      guestPromptShown: false
    };

    // DOM Elements Cache
    this.elements = {};
    
    // Bind methods
    this.handleYouTubeStateChange = this.handleYouTubeStateChange.bind(this);
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
    
    await this.syncFromSupabase();

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
    this.initDatabase();
    
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
    
    if (!this.timelineInitialized) {
      this.initTimeline();
      this.timelineInitialized = true;
    }
    
    // Check URL parameters for auto-loading
    this.handleRouting();
    
    // Initial Render
    this.renderDiscoverTab();
    this.updateUserUI();
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
      upgradeModal: document.getElementById('upgrade-modal'),
      upgradeMessage: document.getElementById('upgrade-message'),
      
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
  // LOCALSTORAGE DATABASE
  // ==========================================
  
  initDatabase() {
    if (!localStorage.getItem('wor_users')) {
      localStorage.setItem('wor_users', JSON.stringify([]));
    }
    if (!localStorage.getItem('wor_favorites')) {
      localStorage.setItem('wor_favorites', JSON.stringify([]));
    }
    if (!localStorage.getItem('wor_history')) {
      localStorage.setItem('wor_history', JSON.stringify([]));
    }
    if (!localStorage.getItem('wor_notes')) {
      localStorage.setItem('wor_notes', JSON.stringify({}));
    }
    if (!localStorage.getItem('wor_analytics')) {
      localStorage.setItem('wor_analytics', JSON.stringify({
        totalTime: 0,
        weeklyTime: {},
        segments: {}
      }));
    }
    
    // Global stats are now fetched exclusively from Supabase

    // Session is handled by Supabase
  }

  getDb(key) {
    const defaultVal = (key === 'shortcuts' || key === 'analytics' || key === 'notes') ? '{}' : '[]';
    let parsed = JSON.parse(localStorage.getItem('wor_' + key) || defaultVal);
    if ((key === 'shortcuts' || key === 'analytics' || key === 'notes') && Array.isArray(parsed)) {
      parsed = {};
    }
    return parsed;
  }

  saveDb(key, data) {
    localStorage.setItem('wor_' + key, JSON.stringify(data));
    this.pushToSupabase(key, data);
  }

  async syncFromSupabase() {
    if (!this.state.user || !window.supabaseClient) return;
    
    try {
      const { data: playlists } = await supabaseClient.from('playlists').select('*').eq('user_id', this.state.user.id);
      if (playlists) {
        const localPlaylists = playlists.map(p => ({
          id: p.id, userId: p.user_id, name: p.name, videos: p.videos, isPublic: p.is_public
        }));
        localStorage.setItem('wor_playlists', JSON.stringify(localPlaylists));
      }
      
      const { data: notes } = await supabaseClient.from('notes').select('*').eq('user_id', this.state.user.id);
      if (notes) {
        const localNotes = {};
        notes.forEach(n => {
          const vId = `${n.platform}_${n.video_id}`;
          if (!localNotes[vId]) localNotes[vId] = [];
          localNotes[vId].push({
            id: n.id, userId: n.user_id, text: n.text, transcript: n.transcript,
            timestamp: n.timestamp, timestampFormatted: n.timestamp_formatted
          });
        });
        localStorage.setItem('wor_notes', JSON.stringify(localNotes));
      }
      
      const { data: settings } = await supabaseClient.from('user_settings').select('*').eq('user_id', this.state.user.id).single();
      if (settings) {
        localStorage.setItem('wor_shortcuts', JSON.stringify(settings.shortcuts || {}));
        localStorage.setItem('wor_analytics', JSON.stringify(settings.analytics || {"totalTime":0,"segments":{}}));
      }

      const { data: history } = await supabaseClient.from('user_history').select('*').eq('user_id', this.state.user.id).eq('is_favorite', true);
      if (history) {
        const localFavs = history.map(h => ({
          id: 'fav_' + h.video_id, userId: h.user_id, videoId: h.video_id,
          platform: h.platform, title: h.title, timestamp: h.last_played
        }));
        localStorage.setItem('wor_favorites', JSON.stringify(localFavs));
      }
      
      if (this.state.activeTab === 'playlists') this.renderPlaylistsTab();
      if (this.state.activeTab === 'notes') this.renderNotes();
      this.updateFavoriteButtonUI();
    } catch (err) {
      console.error("Error syncing from Supabase:", err);
    }
  }

  async pushToSupabase(key, data) {
    if (!this.state.user || !window.supabaseClient) return;
    try {
      if (key === 'playlists') {
        const userPlaylists = data.filter(p => p.userId === this.state.user.id);
        for (const p of userPlaylists) {
          const { error } = await supabaseClient.from('playlists').upsert({
            id: p.id, user_id: p.userId, name: p.name, videos: p.videos, is_public: p.isPublic || false
          });
          if (error && error.message.includes('limited to 5')) {
             this.showToast("Free tier limit: Max 5 playlists. Please upgrade to Pro.", "alert-circle");
             await this.syncFromSupabase();
          }
        }
      } else if (key === 'notes') {
        const userNotes = [];
        for (const vId in data) {
           data[vId].forEach(n => {
             const parts = vId.split('_');
             if (!n.userId || n.userId === this.state.user.id) {
               userNotes.push({
                 id: n.id, user_id: this.state.user.id, video_id: parts.slice(1).join('_'), platform: parts[0],
                 text: n.text, transcript: n.transcript, timestamp: n.timestamp, timestamp_formatted: n.timestampFormatted || n.timestamp_formatted || '0:00'
               });
             }
           });
        }
        for (const note of userNotes) {
          await supabaseClient.from('notes').upsert(note);
        }
      } else if (key === 'shortcuts') {
        await supabaseClient.from('user_settings').upsert({ user_id: this.state.user.id, shortcuts: data });
      } else if (key === 'analytics') {
        await supabaseClient.from('user_settings').upsert({ user_id: this.state.user.id, analytics: data });
      }
    } catch (e) {
      console.error("Push error:", e);
    }
  }

  // ==========================================
  // EVENT LISTENERS & SDKs
  // ==========================================

  setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      if (this.elements.userMenu && !this.elements.userMenu.classList.contains('hidden')) {
        this.elements.userMenu.classList.add('hidden');
      }
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      this.handleRouting();
    });
  }

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
    let hasLimitedFeatures = false;
    const isPremium = this.state.user && this.state.user.isPremium;
    
    // 1. Process Segments
    if (segmentsParam) {
      const segPairs = segmentsParam.split(',').map(s => {
        const parts = s.split('-');
        return { start: parseFloat(parts[0]), end: parseFloat(parts[1]) };
      });
      
      let segmentsToLoad = segPairs;
      if (!isPremium && segPairs.length > 1) {
        hasLimitedFeatures = true;
        segmentsToLoad = [segPairs[0]];
      }
      
      this.state.abLoops = segmentsToLoad;
      this.state.isMultiSegment = true;
      if (this.elements.multiSegmentCheckbox) this.elements.multiSegmentCheckbox.checked = true;
    }

    // 2. Process Notes
    if (notesParam) {
      try {
        const decodedStr = decodeURIComponent(atob(notesParam));
        let notesArr = JSON.parse(decodedStr);
        
        if (!isPremium && notesArr.length > 3) {
          hasLimitedFeatures = true;
          notesArr = notesArr.slice(0, 3);
        }
        
        // Save to DB so when loadVideo renders it reads these
        const db = this.getDb('notes');
        db[`${platform}_${videoId}`] = notesArr;
        this.saveDb('notes', db);
      } catch (e) {
        if (DEBUG_MODE) console.error("Failed to parse shared notes", e);
      }
    }

    // 3. Notify Free Users
    if (hasLimitedFeatures) {
      // Delay toast slightly to appear after player load
      setTimeout(() => {
        this.showToast("Premium Shared Link: Showing only 1 segment and 3 notes. Upgrade to unlock all!", "crown");
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

    // YouTube
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|repeatyoutube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/;
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
    if (!this.state.user || !this.state.user.isPremium) {
      this.openUpgradeModal("Offline Local Video mode is an exclusive Premium feature!");
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
    if (this.elements.timelineContainer) this.elements.timelineContainer.innerHTML = '';

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
      this.onVideoReady();
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
        }).catch(() => {});
        
      this.fetchPlatformTotalLoops();
        
      if (this.state.user) {
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
          });
      }
    }
    
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
    if (this.elements.timelineContainer) this.elements.timelineContainer.innerHTML = '';
    
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

    // Update UI Elements immediately
    this.elements.videoTitle.textContent = videoTitle;
    
    // Always fetch fresh title in background
    this.fetchVideoTitleMock(id, platform).then(realTitle => {
      if (realTitle && !realTitle.includes("Cozy Coffee Shop")) {
        this.elements.videoTitle.textContent = realTitle;
        document.title = realTitle + " | Watch On Repeat";
        if (this.state.currentVideo) this.state.currentVideo.title = realTitle;
        
        this.renderTrendsTab();

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
      }
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
      enabled: this.state.abLoop.active
    };
    
    localStorage.setItem('wor_saved_loops', JSON.stringify(savedLoops));
  }

  loadLoopData(id) {
    if (!id) return;
    const savedLoops = JSON.parse(localStorage.getItem('wor_saved_loops') || '{}');
    const data = savedLoops[id];
    
    if (data) {
      this.state.abLoop.start = data.start || 0;
      this.state.abLoop.end = data.end || this.state.currentVideoDuration;
      if (this.state.abLoop.end > this.state.currentVideoDuration && this.state.currentVideoDuration > 0) {
        this.state.abLoop.end = this.state.currentVideoDuration;
      }
      
      const isPremium = this.state.user && (this.state.user.isPremium || (this.state.user.user_metadata && this.state.user.user_metadata.tier === 'premium'));
      this.state.abLoop.multiSegments = isPremium ? (data.multiSegments || []) : [];
      
      this.state.abLoop.active = data.enabled !== false;
      
      if (this.elements.abStart) this.elements.abStart.value = this.formatTime(this.state.abLoop.start);
      if (this.elements.abEnd) this.elements.abEnd.value = this.formatTime(this.state.abLoop.end);
      
      if (this.updateTimelineUI) {
        this.updateTimelineUI();
      }
      this.renderMultiSegments();
    }
  }

  setVideoDuration(duration) {
    this.state.currentVideoDuration = duration;
    
    if (this.elements.abStart && (!this.elements.abStart.value || this.elements.abStart.value === "")) {
      this.elements.abStart.value = "0:00";
    }
    if (this.elements.abEnd && (!this.elements.abEnd.value || this.elements.abEnd.value === "")) {
      if (duration && !isNaN(duration)) {
        this.elements.abEnd.value = this.formatTime(duration);
      } else {
        this.elements.abEnd.value = "End";
      }
    }
    
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
      
      if (this.incrementLoops()) return;
      
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
        this.setVideoDuration(this.state.players.youtube.getDuration());
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

    // If AB Loop is active, track the specific segment
    if (this.state.abLoop.active) {
      this.trackABSegment();
    }

    // Optimistic UI updates
    this.state.currentGlobalLoops++;
    if (this.state.user) {
      this.state.currentLifetimeLoops++;
    }
    this.updateStatsUI();

    // Fire and forget direct upserts to Supabase to completely bypass RPCs
    if (window.supabaseClient) {
      supabaseClient.from('global_stats').upsert({
        video_id: video.id,
        platform: video.platform,
        global_loops: this.state.currentGlobalLoops
      }, { onConflict: 'video_id, platform' }).then(({ error }) => {
        if (!error) this.fetchPlatformTotalLoops(); // Refresh the massive platform number
        if (error && DEBUG_MODE) console.error("Global Loops Upsert Error:", error);
      });

      if (this.state.user) {
        supabaseClient.from('user_history').upsert({
          user_id: this.state.user.id,
          video_id: video.id,
          platform: video.platform,
          title: video.title || '',
          loops_count: this.state.currentLifetimeLoops,
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
    if (!window.supabaseClient) return;
    try {
      await supabaseClient.rpc('increment_video_play', { p_video_id: id, p_platform: platform });
    } catch (e) {
      if (DEBUG_MODE) console.warn("Could not increment global play count", e);
    }
  }

  async fetchPlatformTotalLoops() {
    if (!window.supabaseClient || !this.elements.platformTotalLoops) return;
    try {
      const { data } = await supabaseClient.from('global_stats').select('global_loops');
      if (data) {
        const total = data.reduce((acc, row) => acc + (row.global_loops || 0), 0);
        this.elements.platformTotalLoops.textContent = this.formatNumber(total);
      }
    } catch (e) {}
  }

  updateStatsUI() {
    const video = this.state.currentVideo;
    if (!video) return;

    // Update personal session loops
    this.elements.personalLoopCount.textContent = this.formatNumber(this.state.personalLoops);

    // Update personal lifetime loops
    this.elements.personalLifetimeCount.textContent = this.formatNumber(this.state.currentLifetimeLoops);

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

    // High frequency check for A/B Looping
    this.state.abLoop.timer = setInterval(() => {
      this.checkABLoop();
    }, 100);
  }

  stopTimer() {
    if (this.state.loopTimer) {
      clearInterval(this.state.loopTimer);
      this.state.loopTimer = null;
    }
    if (this.state.abLoop.timer) {
      clearInterval(this.state.abLoop.timer);
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
    this.elements.tabNotesBtn.classList.toggle('active', tabId === 'notes');
    this.elements.tabAnalyticsBtn.classList.toggle('active', tabId === 'analytics');

    const panels = {
      'discover': this.elements.tabDiscover,
      'favorites': this.elements.tabFavorites,
      'playlists': this.elements.tabPlaylists || document.getElementById('tab-playlists'),
      'history': this.elements.tabHistory,
      'notes': this.elements.tabNotes,
      'analytics': this.elements.tabAnalytics || document.getElementById('tab-analytics')
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

  async renderDiscoverTab() {

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

    this.elements.discoverList.innerHTML = '';
    
    discoverVideos.forEach((v, index) => {
      const isTrending = !!v.globalLoops;
      const card = this.createVideoCard(v, false, isTrending ? index + 1 : null);
      this.elements.discoverList.appendChild(card);
    });
    
    lucide.createIcons();
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
      
      favorites.forEach(f => {
        const card = this.createVideoCard(f);
        this.elements.favoritesList.appendChild(card);
      });
      lucide.createIcons();
    }
  }

  renderPlaylistsTab() {
    const authRequired = document.getElementById('playlists-auth-required');
    const content = document.getElementById('playlists-content');
    const badge = document.getElementById('playlists-count-badge');
    const list = document.getElementById('playlists-list');

    // --- TRANSIENT SHARED PLAYLIST VIEW ---
    if (this.state.sharedPlaylist) {
      const playlist = this.state.sharedPlaylist;
      if (authRequired) authRequired.classList.add('hidden');
      if (content) content.classList.remove('hidden');
      if (badge) badge.textContent = playlist.videos ? playlist.videos.length : 0;

      const createRow = content.querySelector('div[style*="margin-bottom: 24px"]');
      if (createRow) createRow.style.display = 'none';

      list.innerHTML = `
        <div style="background: rgba(147, 51, 234, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid var(--primary-color);">
          <h3 style="color: var(--primary-color); margin-bottom: 4px; display:flex; align-items:center; gap:8px;">
            <i data-lucide="share-2"></i> Shared: ${this.escapeHtml(playlist.name)}
          </h3>
          <p style="font-size: 13px; color: var(--text-muted);">This is a read-only shared playlist. It is not saved to your account.</p>
          <button class="btn btn-sm btn-outline" style="margin-top: 12px;" onclick="app.exitSharedPlaylist()">Exit Shared View</button>
        </div>
      `;

      if (!playlist.videos || playlist.videos.length === 0) {
        list.innerHTML += '<div class="empty-state"><p>This shared playlist is empty.</p></div>';
        lucide.createIcons();
        return;
      }

      playlist.videos.forEach((v, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.cursor = 'pointer';
        card.onclick = () => {
          this.loadVideo(v.videoId || v.id, v.platform);
          this.showToast(`Playing: ${this.escapeHtml(v.title)}`, 'play');
        };

        const thumbUrl = v.thumbnail || this.getThumbnailUrl(v.platform, v.videoId || v.id);

        card.innerHTML = `
          <img src="${this.escapeHtml(thumbUrl)}" class="video-card-thumb" alt="${this.escapeHtml(v.title)}">
          <div class="video-card-details">
            <h4 class="video-card-title">${index + 1}. ${this.escapeHtml(v.title)}</h4>
            <div class="video-card-meta">
              <span class="badge">${v.platform}</span>
            </div>
          </div>
        `;
        list.appendChild(card);
      });
      lucide.createIcons();
      return;
    }
    // --- END TRANSIENT VIEW ---

    const createRow = content.querySelector('div[style*="margin-bottom: 24px"]');

    if (this.state.viewingPlaylistId) {
      const p = this.getDb('playlists').find(pl => pl.id === this.state.viewingPlaylistId && pl.userId === this.state.user.id);
      if (!p) {
        this.state.viewingPlaylistId = null;
        return this.renderPlaylistsTab();
      }
      if (createRow) createRow.style.display = 'none';
      list.innerHTML = `
        <div style="margin-bottom: 16px; display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="btn btn-sm btn-outline" onclick="app.backToPlaylists()"><i data-lucide="arrow-left"></i> Back</button>
            <button class="btn btn-primary btn-sm" onclick="app.playPlaylist('${p.id}')" style="white-space: nowrap;"><i data-lucide="play"></i> Play Through</button>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <select class="search-input" style="padding: 6px 10px; width: auto; font-size: 13px;" onchange="app.sortPlaylist('${p.id}', this.value)">
              <option value="">Sort By...</option>
              <option value="date">Date Added</option>
              <option value="alpha">Alphabetical</option>
            </select>
            <label style="display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer; user-select:none; font-weight: 500;">
              <input type="checkbox" id="playlist-loop-toggle" style="width: 18px; height: 18px; cursor: pointer; accent-color: #60a5fa;"> 
              <span>Loop Video</span>
            </label>
          </div>
        </div>
        <h2 style="margin-bottom:16px;">${this.escapeHtml(p.name)}</h2>
      `;
      
      if (!p.videos || p.videos.length === 0) {
        list.innerHTML += '<div class="empty-state"><p>This playlist is empty.</p></div>';
        lucide.createIcons();
        return;
      }

      p.videos.forEach((v, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.cursor = 'grab';
        card.draggable = true;
        
        card.ondragstart = (e) => {
          this.state.draggedIndex = index;
          e.dataTransfer.effectAllowed = 'move';
          card.style.opacity = '0.5';
        };
        card.ondragend = () => {
          card.style.opacity = '1';
          this.state.draggedIndex = null;
        };
        card.ondragover = (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        };
        card.ondrop = (e) => {
          e.preventDefault();
          if (this.state.draggedIndex === null || this.state.draggedIndex === index) return;
          const playlists = this.getDb('playlists');
          const pl = playlists.find(pll => pll.id === p.id && pll.userId === this.state.user.id);
          const moved = pl.videos.splice(this.state.draggedIndex, 1)[0];
          pl.videos.splice(index, 0, moved);
          this.saveDb('playlists', playlists);
          this.renderPlaylistsTab();
        };

        const thumbUrl = v.thumbnail || this.getThumbnailUrl(v.platform, v.videoId || v.id);
        card.innerHTML = `
          <img src="${this.escapeHtml(thumbUrl)}" class="video-card-thumb" alt="${this.escapeHtml(v.title)}" onclick="app.loadVideo('${v.videoId || v.id}', '${v.platform}')">
          <div class="video-card-details">
            <h4 class="video-card-title">${index + 1}. ${this.escapeHtml(v.title)}</h4>
            <div class="video-card-meta" style="display:flex; justify-content:space-between; align-items:center;">
              <span class="badge">${v.platform}</span>
              <button class="icon-btn text-red-500" onclick="app.removeVideoFromPlaylist('${p.id}', '${v.videoId || v.id}')" style="padding:0; margin-left:8px;"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
            </div>
          </div>
        `;
        list.appendChild(card);
      });
      lucide.createIcons();
      return;
    }

    if (createRow) createRow.style.display = 'flex'; // restore
    
    if (!this.state.user) {
      authRequired.classList.remove('hidden');
      content.classList.add('hidden');
      badge.textContent = '0';
      return;
    }

    authRequired.classList.add('hidden');
    content.classList.remove('hidden');
    
    const playlists = this.getDb('playlists').filter(p => p.userId === this.state.user.id);
    badge.textContent = playlists.length;
    
    list.innerHTML = '';
    if (playlists.length === 0) {
      list.innerHTML = '<div class="empty-state"><h3>No Playlists</h3><p>Create a playlist to organize your learning sessions.</p></div>';
      return;
    }

    playlists.forEach(p => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.style.cursor = 'pointer';
      card.onclick = (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('label')) return;
        app.viewPlaylist(p.id);
      };
      card.innerHTML = `
        <div class="video-info" style="width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3 class="video-title">${this.escapeHtml(p.name)}</h3>
            <button class="icon-btn text-red-500" onclick="app.deletePlaylist('${p.id}')" style="padding:0; margin-left:8px;"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>
          </div>
          <div class="video-meta" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
            <span class="platform-indicator" style="background: rgba(255,255,255,0.1)">${p.videos ? p.videos.length : 0} Videos</span>
            
            <div style="display:flex; gap:8px; align-items:center;">
              ${p.isPublic ? `<button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="app.copyPlaylistLink('${p.id}')"><i data-lucide="link" style="width:12px;height:12px;"></i> Copy Link</button>` : ''}
              <label style="display:flex; align-items:center; gap:4px; font-size:12px; cursor:pointer;">
                <input type="checkbox" ${p.isPublic ? 'checked' : ''} onchange="app.togglePlaylistPublic('${p.id}', this.checked)"> Public
              </label>
            </div>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  }

  viewPlaylist(id) {
    this.state.viewingPlaylistId = id;
    this.renderPlaylistsTab();
  }

  backToPlaylists() {
    this.state.viewingPlaylistId = null;
    this.renderPlaylistsTab();
  }

  sortPlaylist(id, criteria) {
    if (!criteria) return;
    const playlists = this.getDb('playlists');
    const p = playlists.find(pl => pl.id === id && pl.userId === this.state.user.id);
    if (!p || !p.videos) return;
    
    if (criteria === 'date') {
      p.videos.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    } else if (criteria === 'alpha') {
      p.videos.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    this.saveDb('playlists', playlists);
    this.renderPlaylistsTab();
  }

  playPlaylist(id) {
    const loopToggle = document.getElementById('playlist-loop-toggle');
    const isLooping = loopToggle ? loopToggle.checked : false;
    this.state.playlistMode = { active: true, id: id, currentIndex: 0, loopVideo: isLooping };
    const p = this.getDb('playlists').find(pl => pl.id === id);
    if (!p || !p.videos || p.videos.length === 0) {
      this.showToast("Playlist is empty", "alert-circle");
      return;
    }
    const v = p.videos[0];
    this.showToast(`Starting Playlist: ${this.escapeHtml(p.name)}`, 'play');
    this.loadVideo(v.videoId || v.id, v.platform);
  }

  removeVideoFromPlaylist(playlistId, videoId) {
    const playlists = this.getDb('playlists');
    const p = playlists.find(pl => pl.id === playlistId && pl.userId === this.state.user.id);
    if (!p || !p.videos) return;
    p.videos = p.videos.filter(v => (v.videoId || v.id) !== videoId);
    this.saveDb('playlists', playlists);
    this.renderPlaylistsTab();
    this.showToast("Video removed from playlist", "check");
  }

  togglePlaylistPublic(id, isPublic) {
    if (!this.state.user || !this.state.user.isPremium) {
      this.openUpgradeModal("Sharing public playlists is a Pro feature! Upgrade to share your playlists with the world.");
      this.renderPlaylistsTab(); // Reset checkbox UI
      return;
    }
    const playlists = this.getDb('playlists');
    const index = playlists.findIndex(p => p.id === id && p.userId === this.state.user.id);
    if (index !== -1) {
      playlists[index].isPublic = isPublic;
      this.saveDb('playlists', playlists);
      this.renderPlaylistsTab();
      if (isPublic) this.showToast("Playlist is now public!", "globe");
      else this.showToast("Playlist is now private", "lock");
    }
  }

  copyPlaylistLink(id) {
    const url = new URL(window.location.href);
    url.search = '?playlist=' + id;
    navigator.clipboard.writeText(url.toString());
    this.showToast("Copied share link!", "check");
  }

  async fetchSharedPlaylist(playlistId) {
    if (!window.supabaseClient) {
      this.showToast("Cannot load shared playlist without database connection.", "alert-triangle");
      this.loadHome();
      return;
    }

    try {
      this.showToast("Loading shared playlist...", "loader");
      const { data, error } = await supabaseClient.from('playlists').select('*').eq('id', playlistId).single();

      if (error || !data) {
        this.showToast("Playlist not found or is private.", "alert-triangle");
        this.loadHome();
        return;
      }

      this.state.sharedPlaylist = data;
      this.switchTab('playlists');
      
      // Auto-play the first video
      if (data.videos && data.videos.length > 0) {
        const firstVid = data.videos[0];
        this.loadVideo(firstVid.videoId || firstVid.id, firstVid.platform);
      }
    } catch (e) {
      if (DEBUG_MODE) console.error(e);
      this.loadHome();
    }
  }

  exitSharedPlaylist() {
    this.state.sharedPlaylist = null;
    const url = new URL(window.location);
    url.searchParams.delete('playlist');
    window.history.pushState({}, '', url);
    this.renderPlaylistsTab();
  }

  createPlaylist() {
    if (!this.state.user) {
      this.openLoginModal();
      return;
    }

    const input = document.getElementById('new-playlist-input');
    const name = input.value.trim();
    if (!name) return;

    const playlists = this.getDb('playlists');
    const userPlaylists = playlists.filter(p => p.userId === this.state.user.id);

    // Free limit: 5 playlists
    const tier = this.state.user.tier || 'free';
    if (tier === 'free' && userPlaylists.length >= 5) {
      this.openUpgradeModal("Free users can create up to 5 playlists. Upgrade to Premium for unlimited playlists!");
      return;
    }

    playlists.push({
      id: 'pl_' + Date.now(),
      userId: this.state.user.id,
      name: name,
      videos: []
    });

    this.saveDb('playlists', playlists);
    input.value = '';
    this.renderPlaylistsTab();
    this.showToast("Playlist created!", "check-circle");
  }

  openPlaylistModal() {
    if (!this.state.user) {
      this.openLoginModal();
      return;
    }
    if (!this.state.currentVideo) return;
    
    const modal = document.getElementById('playlist-modal');
    const list = document.getElementById('playlist-select-list');
    
    const form = document.getElementById('create-playlist-form');
    const createBtn = document.getElementById('show-create-playlist-btn');
    if (form && createBtn) {
      form.classList.add('hidden');
      createBtn.classList.remove('hidden');
    }
    if (!modal || !list) return;
    
    const playlists = this.getDb('playlists').filter(p => p.userId === this.state.user.id);
    
    list.innerHTML = '';
    if (playlists.length === 0) {
      list.innerHTML = '<p class="text-sm text-gray-400">You don\'t have any playlists yet. Create one in the Playlists tab.</p>';
    } else {
      playlists.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline';
        btn.style.justifyContent = 'flex-start';
        btn.innerHTML = `<i data-lucide="list"></i> <span style="flex: 1; text-align: left;">${this.escapeHtml(p.name)}</span> <span class="text-xs text-gray-500 ml-auto">${p.videos ? p.videos.length : 0} vids</span>`;
        btn.onclick = () => this.addVideoToPlaylist(p.id);
        list.appendChild(btn);
      });
    }
    
    lucide.createIcons();
    modal.classList.remove('hidden');
  }

  createNewPlaylistFromModal() {
    if (!this.state.user) {
      this.openLoginModal();
      return;
    }
    
    const input = document.getElementById('new-playlist-name');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;

    const playlists = this.getDb('playlists');
    const userPlaylists = playlists.filter(p => p.userId === this.state.user.id);

    // Free limit: 5 playlists
    const tier = this.state.user.tier || 'free';
    if (tier === 'free' && userPlaylists.length >= 5) {
      this.closePlaylistModal();
      this.openUpgradeModal("Free users can create up to 5 playlists. Upgrade to Premium for unlimited playlists!");
      return;
    }

    const newPlaylist = {
      id: 'pl_' + Date.now(),
      userId: this.state.user.id,
      name: name,
      videos: []
    };
    playlists.push(newPlaylist);

    this.saveDb('playlists', playlists);
    input.value = '';
    
    // Hide form, show button
    const form = document.getElementById('create-playlist-form');
    const btn = document.getElementById('show-create-playlist-btn');
    if (form) form.classList.add('hidden');
    if (btn) btn.classList.remove('hidden');

    this.addVideoToPlaylist(newPlaylist.id);
  }

  closePlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    if (modal) modal.classList.add('hidden');
  }

  addVideoToPlaylist(playlistId) {
    const playlists = this.getDb('playlists');
    const userPlaylists = playlists.filter(p => p.userId === this.state.user.id);
    const tier = this.state.user.tier || 'free';
    
    // Check for downgraded user freeze
    if (tier === 'free' && userPlaylists.length > 5) {
      this.closePlaylistModal();
      this.openUpgradeModal("Your account has exceeded the Free tier limit of 5 playlists. Please upgrade to Pro to modify your frozen playlists.");
      return;
    }

    const pIndex = playlists.findIndex(p => p.id === playlistId && p.userId === this.state.user.id);
    if (pIndex === -1) return;
    
    const playlist = playlists[pIndex];
    if (!playlist.videos) playlist.videos = [];
    
    // Enforce 50 vids limit
    if (tier === 'free' && playlist.videos.length >= 50) {
      this.closePlaylistModal();
      this.openUpgradeModal("Free users can only add up to 50 videos per playlist. Upgrade to Premium for unlimited videos!");
      return;
    }
    
    const videoObj = {
      videoId: this.state.currentVideo.id,
      platform: this.state.currentVideo.platform,
      title: this.state.currentVideo.title,
      addedAt: Date.now()
    };
    
    if (!playlist.videos.find(v => v.videoId === videoObj.videoId && v.platform === videoObj.platform)) {
      playlist.videos.push(videoObj);
      this.saveDb('playlists', playlists);
      this.showToast(`Added to ${this.escapeHtml(playlist.name)}!`, 'check');
    } else {
      this.showToast(`Already in ${this.escapeHtml(playlist.name)}!`, 'info');
    }
    
    this.closePlaylistModal();
    if (this.state.activeTab === 'playlists') this.renderPlaylistsTab();
  }

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
      const { data } = await supabaseClient.from('global_stats').select('*').order('global_loops', { ascending: false }).limit(10);
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
      thumbUrl = `https://img.youtube.com/vi/${video.videoId || video.id}/mqdefault.jpg`;
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

  openLoginModal() {
    this.elements.loginModal.classList.remove('hidden');
    this.elements.authOptions.classList.remove('hidden');
    this.elements.authLoading.classList.add('hidden');
    this.switchAuthView('welcome');
    
    // Try to render the Google button when modal opens
    this.renderGoogleButton();
  }

  renderGoogleButton() {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      // If script hasn't loaded yet, try again in 500ms
      setTimeout(() => this.renderGoogleButton(), 500);
      return;
    }
    
    // Initialize Google Identity Services
    google.accounts.id.initialize({
      client_id: "534274847026-mpjji7pf95nhdbn7o1963qjs2r3v6h26.apps.googleusercontent.com",
      callback: this.handleGoogleCredentialResponse.bind(this)
    });

    const btnContainer = document.getElementById('google-btn-container');
    if (btnContainer) {
      google.accounts.id.renderButton(
        btnContainer,
        { theme: "filled_black", size: "large", width: 320, text: "continue_with", shape: "rectangular" }
      );
    }
  }

  async handleGoogleCredentialResponse(response) {
    if (!supabaseClient) {
      this.showToast("Supabase not initialized", "alert-circle");
      return;
    }
    
    this.elements.authOptions.classList.add('hidden');
    this.elements.authLoading.classList.remove('hidden');
    this.elements.authLoadingText.textContent = `Signing in securely...`;

    const { data, error } = await supabaseClient.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential
    });

    if (error) {
      this.showToast(error.message, "alert-circle");
      this.elements.authOptions.classList.remove('hidden');
      this.elements.authLoading.classList.add('hidden');
    } else {
      this.closeLoginModal();
    }
  }

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const wrapper = input.parentElement;
    const isPassword = input.type === 'password';
    
    // Toggle input type
    input.type = isPassword ? 'text' : 'password';
    
    // Replace the Lucide icon safely
    const oldIcon = wrapper.querySelector('.password-toggle-icon');
    if (oldIcon) {
      const newIcon = document.createElement('i');
      newIcon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
      newIcon.className = 'password-toggle-icon';
      newIcon.onclick = () => this.togglePasswordVisibility(inputId);
      wrapper.replaceChild(newIcon, oldIcon);
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  }

  switchAuthView(viewName) {
    // Hide all views
    document.getElementById('auth-welcome-view').classList.add('hidden');
    document.getElementById('auth-login-view').classList.add('hidden');
    document.getElementById('auth-signup-view').classList.add('hidden');
    document.getElementById('auth-reset-view').classList.add('hidden');

    // Show the target view
    const target = document.getElementById(`auth-${viewName}-view`);
    if (target) target.classList.remove('hidden');

    // Reset Title/Subtitle
    const title = document.getElementById('auth-modal-title');
    const subtitle = document.getElementById('auth-modal-subtitle');
    
    if (viewName === 'welcome') {
      title.textContent = "Join WatchOnRepeat";
      subtitle.textContent = "Sync your loop counts, save favorites, and access your history anywhere.";
    } else if (viewName === 'login') {
      title.textContent = "Welcome Back";
      subtitle.textContent = "Log in to access your saved loops and history.";
    } else if (viewName === 'signup') {
      title.textContent = "Create an Account";
      subtitle.textContent = "Start tracking your practice completely free.";
    } else if (viewName === 'reset') {
      title.textContent = "Reset Password";
      subtitle.textContent = "We'll help you get back into your account.";
    }
  }

  closeLoginModal() {
    this.elements.loginModal.classList.add('hidden');
  }

  toggleUserMenu(e) {
    e.stopPropagation();
    this.elements.userMenu.classList.toggle('hidden');
  }

  async handleSocialLogin(provider) {
    if (!supabaseClient) {
      this.showToast("Supabase not initialized", "alert-circle");
      return;
    }

    this.elements.authOptions.classList.add('hidden');
    this.elements.authLoading.classList.remove('hidden');
    this.elements.authLoadingText.textContent = `Redirecting to ${provider}...`;
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider.toLowerCase(),
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      this.showToast(error.message, 'alert-circle');
      this.elements.authLoading.classList.add('hidden');
      this.elements.authOptions.classList.remove('hidden');
    }
  }

  async handleEmailLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) return;

    this.elements.authOptions.classList.add('hidden');
    this.elements.authLoading.classList.remove('hidden');
    this.elements.authLoadingText.textContent = "Authenticating with Supabase...";

    if (!supabaseClient) {
      this.showToast("Supabase not initialized", "alert-circle");
      return;
    }

    try {
      let { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
    } catch (err) {
      this.showToast(err.message, "alert-circle");
      this.elements.authOptions.classList.remove('hidden');
      this.elements.authLoading.classList.add('hidden');
      return;
    }

    emailInput.value = '';
    passwordInput.value = '';
    
    this.showToast(`Logged in successfully!`, 'shield-check');
    this.switchTab(this.state.activeTab);
  }

  async handleEmailSignUp(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm-password').value;

    if (!email || !password || !confirm) return;

    if (password !== confirm) {
      this.showToast("Passwords do not match.", "alert-circle");
      return;
    }

    if (password.length < 7 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      this.showToast("Password must be at least 7 characters and contain both letters and numbers.", "alert-circle");
      return;
    }

    this.elements.authOptions.classList.add('hidden');
    this.elements.authLoading.classList.remove('hidden');
    this.elements.authLoadingText.textContent = "Creating your account...";

    let signUpData = null;

    try {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      signUpData = data;
    } catch (err) {
      this.showToast(err.message, "alert-circle");
      this.elements.authOptions.classList.remove('hidden');
      this.elements.authLoading.classList.add('hidden');
      return;
    }

    // Safely execute UI updates and secondary calls outside try block
    if (signUpData.user && !signUpData.session) {
      this.showToast("Success! Please check your email inbox to confirm your account.", "check-circle");
      this.closeLoginModal();
      return;
    }

    if (signUpData.user) {
      try {
        await supabaseClient.from('users').insert({
          id: signUpData.user.id,
          email: email,
          tier: 'free'
        });
      } catch (insertErr) {
        if (DEBUG_MODE) console.warn("Could not insert user row:", insertErr);
      }
      this.showToast(`Account created successfully!`, 'shield-check');
    }
  }

  async handleResetPassword(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim();
    if (!email) return;

    if (!supabaseClient) {
      this.showToast("Supabase not initialized", "alert-circle");
      return;
    }

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href,
      });
      if (error) throw error;
      
      this.showToast("Password reset link sent! Check your email.", "mail");
      this.showLoginForm();
    } catch (err) {
      this.showToast(err.message, "alert-circle");
    }
  }

  showForgotPassword(e) {
    if (e) e.preventDefault();
    const emailForm = document.getElementById('auth-email-form');
    const resetForm = document.getElementById('auth-reset-form');
    if (emailForm) emailForm.classList.add('hidden');
    if (resetForm) resetForm.classList.remove('hidden');
  }

  showLoginForm(e) {
    if (e) e.preventDefault();
    const emailForm = document.getElementById('auth-email-form');
    const resetForm = document.getElementById('auth-reset-form');
    if (resetForm) resetForm.classList.add('hidden');
    if (emailForm) emailForm.classList.remove('hidden');
  }

  async handleLogout() {
    if (supabaseClient) await supabaseClient.auth.signOut();
    this.state.user = null;
    
    this.updateUserUI();
    this.showToast("Signed out successfully.");
    
    if (this.state.currentVideo) {
      this.updateFavoriteButtonUI();
      this.updateStatsUI();
    }
    
    this.switchTab('discover');
  }

  updateUserUI() {
    const isPremium = this.state.user && this.state.user.isPremium;
    this.updateAdsVisibility(isPremium);

    if (this.state.user) {
      this.elements.authLoggedOut.classList.add('hidden');
      this.elements.authLoggedIn.classList.remove('hidden');
      
      this.elements.userAvatar.src = this.state.user.avatar;
      if (isPremium) {
        this.elements.userName.innerHTML = `${this.escapeHtml(this.state.user.name)} <span class="premium-badge" title="Premium Member"><i data-lucide="crown"></i></span>`;
      } else {
        this.elements.userName.textContent = this.state.user.name;
      }
      this.elements.userEmail.textContent = this.state.user.email;
    } else {
      this.elements.authLoggedOut.classList.remove('hidden');
      this.elements.authLoggedIn.classList.add('hidden');
    }
    
    // Always sync shortcuts with tier privileges
    this.reloadShortcuts();
    lucide.createIcons();
  }

  updateAdsVisibility(isPremium) {
    const tier = this.state.user ? this.state.user.tier : 'free';
    const hasPremiumAds = tier === 'premium' || tier === 'pro' || isPremium;
    document.querySelectorAll('.ad-slot').forEach(slot => {
      slot.style.display = hasPremiumAds ? 'none' : 'block';
    });
  }

  openUpgradeModal(message = "You've hit a limit! Upgrade your account to continue.") {
    if (this.elements.upgradeMessage) this.elements.upgradeMessage.textContent = message;
    if (this.elements.upgradeModal) this.elements.upgradeModal.classList.remove('hidden');
  }

  closeUpgradeModal() {
    if (this.elements.upgradeModal) this.elements.upgradeModal.classList.add('hidden');
  }

  processUpgrade(tier) {
    if (!this.state.user) {
      this.closeUpgradeModal();
      this.openLoginModal();
      this.showToast("Please sign in to upgrade.", "alert-triangle");
      return;
    }
    
    this.state.user.tier = tier;
    this.state.user.isPremium = true;
    this.updateUserUI();
    this.closeUpgradeModal();
    this.showToast(`Upgraded to ${tier.toUpperCase()} successfully!`, 'crown');
    this.updateAdsVisibility(true);
    
    // Check if multiple segments should be visible now
    if (this.updateTimelineUI) this.updateTimelineUI();
  }

  checkLimit(type) {
    const tier = this.state.user ? this.state.user.tier : 'free';
    
    if (tier === 'pro' || tier === 'premium') return true;

    // Free limits
    if (type === 'analytics') {
      this.openUpgradeModal("Practice Analytics are only available for Premium and Pro users.");
      return false;
    }
    if (type === 'notes') {
      // Notes limit is checked manually during save, but this acts as an umbrella
      return false;
    }
    if (type === 'multiple_segments') {
      this.openUpgradeModal("Multiple loop segments are a Premium feature.");
      return false;
    }
    return true;
  }

  simulateBuyPremium() {
    this.openUpgradeModal("Remove ads instantly with Premium.");
  }

  // ==========================================
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
    this.elements.toast.classList.add('fade-in');
    
    lucide.createIcons();
    
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.elements.toast.classList.add('hidden');
      this.elements.toast.classList.remove('fade-in');
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
    const isPremium = this.state.user && this.state.user.isPremium;
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (isPremium) {
      const ms = Math.floor((seconds % 1) * 1000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    } else {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
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

  initTimeline() {
    let draggingHandle = null;

    const renderTimelineHandles = () => {
      const container = this.elements.timelineContainer;
      if (!container) return;
      
      const track = container.querySelector('.timeline-track');
      const markers = container.querySelector('.timeline-markers');
      container.innerHTML = '';
      if (track) container.appendChild(track);
      
      if (!this.state.abLoop.multiSegments || this.state.abLoop.multiSegments.length === 0) {
        this.state.abLoop.multiSegments = [{
          start: this.state.abLoop.start || 0,
          end: this.state.abLoop.end || this.state.currentVideoDuration || 10
        }];
      }
      
      const duration = this.state.currentVideoDuration || 3600;
      
      this.state.abLoop.multiSegments.forEach((seg, index) => {
        let sPct = (seg.start / duration) * 100;
        let ePct = (seg.end / duration) * 100;
        
        const sel = document.createElement('div');
        sel.className = 'timeline-selection';
        sel.style.left = `${sPct}%`;
        sel.style.width = `${ePct - sPct}%`;
        
        const hStart = document.createElement('div');
        hStart.className = `timeline-handle handle-start`;
        hStart.style.left = `${sPct}%`;
        hStart.dataset.index = index;
        hStart.dataset.type = 'start';
        
        const hEnd = document.createElement('div');
        hEnd.className = `timeline-handle handle-end`;
        hEnd.style.left = `${ePct}%`;
        hEnd.dataset.index = index;
        hEnd.dataset.type = 'end';
        
        hStart.addEventListener('mousedown', handlePointerDown);
        hStart.addEventListener('touchstart', handlePointerDown, {passive: false});
        
        hEnd.addEventListener('mousedown', handlePointerDown);
        hEnd.addEventListener('touchstart', handlePointerDown, {passive: false});
        
        container.appendChild(sel);
        container.appendChild(hStart);
        container.appendChild(hEnd);
      });
      
      if (markers) container.appendChild(markers);
      
      const activeIdx = this.state.abLoop.currentSegmentIndex || 0;
      if (this.state.abLoop.multiSegments[activeIdx]) {
        if (this.elements.abStart) this.elements.abStart.value = this.formatTime(this.state.abLoop.multiSegments[activeIdx].start);
        if (this.elements.abEnd) this.elements.abEnd.value = this.formatTime(this.state.abLoop.multiSegments[activeIdx].end);
        
        this.state.abLoop.start = this.state.abLoop.multiSegments[activeIdx].start;
        this.state.abLoop.end = this.state.abLoop.multiSegments[activeIdx].end;
      }
      
      this.renderMultiSegments();
    };

    this.updateTimelineUI = () => {
      this.state.abLoop.active = true;
      renderTimelineHandles();
      this.saveLoopData();
    };

    const handlePointerDown = (e) => {
      if (e.cancelable) e.preventDefault();
      draggingHandle = {
        index: parseInt(e.target.dataset.index),
        type: e.target.dataset.type
      };
      this.state.abLoop.currentSegmentIndex = draggingHandle.index;
      
      document.addEventListener('mousemove', handlePointerMove, {passive: false});
      document.addEventListener('mouseup', handlePointerUp);
      document.addEventListener('touchmove', handlePointerMove, {passive: false});
      document.addEventListener('touchend', handlePointerUp);
    };

    const handlePointerMove = (e) => {
      if (!draggingHandle) return;
      if (e.cancelable) e.preventDefault();
      
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const rect = this.elements.timelineContainer.getBoundingClientRect();
      let x = clientX - rect.left;
      if (x < 0) x = 0;
      if (x > rect.width) x = rect.width;
      
      const pct = x / rect.width;
      const duration = this.state.currentVideoDuration || 3600;
      let val = pct * duration;
      
      const idx = draggingHandle.index;
      const segs = this.state.abLoop.multiSegments;
      
      if (draggingHandle.type === 'start') {
        let minStart = idx > 0 ? segs[idx - 1].end : 0;
        let maxStart = segs[idx].end;
        segs[idx].start = Math.max(minStart, Math.min(val, maxStart));
      } else {
        let minEnd = segs[idx].start;
        let maxEnd = idx < segs.length - 1 ? segs[idx + 1].start : duration;
        segs[idx].end = Math.max(minEnd, Math.min(val, maxEnd));
      }
      
      renderTimelineHandles();
    };

    const handlePointerUp = () => {
      if (!draggingHandle) return;
      
      const idx = draggingHandle.index;
      const val = draggingHandle.type === 'start' ? this.state.abLoop.multiSegments[idx].start : this.state.abLoop.multiSegments[idx].end;
      
      if (this.state.currentPlatform) {
        this.seekToTime(draggingHandle.type === 'start' ? val : val - 0.5);
      }
      
      draggingHandle = null;
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('touchend', handlePointerUp);
      
      this.saveLoopData();
    };

    const updateActiveFromInputs = () => {
      const idx = this.state.abLoop.currentSegmentIndex || 0;
      if (!this.state.abLoop.multiSegments[idx]) return;
      const duration = this.state.currentVideoDuration || 3600;
      
      let s = this.parseTime(this.elements.abStart.value);
      let e = this.elements.abEnd.value ? this.parseTime(this.elements.abEnd.value) : duration;
      
      let minStart = idx > 0 ? this.state.abLoop.multiSegments[idx - 1].end : 0;
      let maxEnd = idx < this.state.abLoop.multiSegments.length - 1 ? this.state.abLoop.multiSegments[idx + 1].start : duration;
      
      s = Math.max(minStart, Math.min(s, e));
      e = Math.max(s, Math.min(e, maxEnd));
      
      this.state.abLoop.multiSegments[idx].start = s;
      this.state.abLoop.multiSegments[idx].end = e;
      this.updateTimelineUI();
    };

    if (this.elements.abStart) {
      this.applyTimeMask(this.elements.abStart, () => updateActiveFromInputs());
    }
    if (this.elements.abEnd) {
      this.applyTimeMask(this.elements.abEnd, () => updateActiveFromInputs());
    }
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
    const opts = { width: '100%', height: '100%', parent: [window.location.hostname || 'localhost'] };
    if (id.startsWith('video=')) opts.video = id.split('=')[1];
    else if (id.startsWith('clip=')) opts.collection = id.split('=')[1];
    else if (id.startsWith('channel=')) opts.channel = id.split('=')[1];
    else opts.video = id; // fallback

    const setupTwitch = () => {
      const player = new Twitch.Player("twitch-player-target", opts);
      this.state.players.twitch = player;

      player.addEventListener(Twitch.Player.READY, () => {
        this.setVideoDuration(player.getDuration() || 0);
        this.onVideoReady();
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
        this.onVideoReady();
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
      this.onVideoReady();
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
    if (p === 'local' && this.state.players.local) this.state.players.local.seekTo(seconds);
    if (p === 'twitch' && this.state.players.twitch && typeof this.state.players.twitch.seek === 'function') this.state.players.twitch.seek(seconds);
    if (p === 'soundcloud' && this.state.players.soundcloud && typeof this.state.players.soundcloud.seekTo === 'function') this.state.players.soundcloud.seekTo(seconds * 1000);
    if (p === 'wistia' && this.state.players.wistia && typeof this.state.players.wistia.time === 'function') this.state.players.wistia.time(seconds);
  }

  setPlaybackSpeed(rate) {
    rate = parseFloat(rate);
    this.state.playbackRate = rate;
    const p = this.state.currentPlatform;
    try {
      if (p === 'youtube' && this.state.players.youtube) this.state.players.youtube.setPlaybackRate(rate);
      if (p === 'vimeo' && this.state.players.vimeo) this.state.players.vimeo.setPlaybackRate(rate);
      if (p === 'dailymotion' && this.state.players.dailymotion) if (DEBUG_MODE) console.warn("Dailymotion API may not support rate changes directly.");
      if (p === 'html5' && this.state.players.html5) this.state.players.html5.playbackRate = rate;
      if (p === 'local' && this.state.players.local) this.state.players.local.setPlaybackRate(rate);
      this.showToast(`Speed set to ${rate}x`);
    } catch(e) {
      if (DEBUG_MODE) console.error("Error setting rate", e);
    }
  }

  // ==========================================
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
  // NOTES FEATURE
  // ==========================================

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
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
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
  }

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
  }

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
        <button class="icon-btn text-red-500" onclick="app.clearNotesForVideo('${id}')" title="Clear all notes for this video" style="padding: 4px; margin-left: 8px;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      `;
      listEl.appendChild(div);
    });
    
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
    if (this.state.abLoops && this.state.abLoops.length > 0) {
      // Format: start-end,start-end
      const segs = this.state.abLoops.map(l => `${Number(l.start).toFixed(2)}-${Number(l.end).toFixed(2)}`).join(',');
      urlParams.set('segments', segs);
      
      // Also set the basic start/end for backward compatibility or simple free users
      urlParams.set('start', this.state.abLoops[0].start);
      urlParams.set('end', this.state.abLoops[0].end);
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

    // Encode Notes (Limit payload size by truncating to ~1500 chars if necessary, but base64 compress)
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

    const shareUrl = `${window.location.href.split('?')[0]}?${urlParams.toString()}`;
    
    // Open Share Modal
    const modal = document.getElementById('share-modal');
    const input = document.getElementById('share-link-input');
    if (modal && input) {
      input.value = shareUrl;
      modal.classList.remove('hidden');
    } else {
      // Fallback
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast("Shareable Deep-Link copied to clipboard!", "clipboard-check");
      });
    }
  }

  closeShareModal() {
    const modal = document.getElementById('share-modal');
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
        loops: 0
      };
    } else {
      db.segments[key].name = name;
    }
    this.saveDb('analytics', db);
    this.elements.loopNameInput.value = '';
    this.showToast(`Loop saved as "${name}"`, "save");
    if (this.state.activeTab === 'analytics') this.renderAnalyticsTab();

    if (!this.state.user && !this.state.guestPromptShown) {
      this.state.guestPromptShown = true;
      setTimeout(() => {
        this.showToast("Loving the features? Create a free account to save your loops, notes, and playlists so you never lose them!", "heart");
      }, 2000);
    }
  }

  renderAnalyticsTab() {
    const db = this.getDb('analytics');
    
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
}

// Instantiate and initialize
const app = new WatchOnRepeat();
window.app = app; // Expose globally for inline onclick handlers

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

