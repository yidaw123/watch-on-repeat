/**
 * WatchOnRepeat - Core Application Logic
 */

const SUPABASE_URL = 'https://golkbcdlxpojjwqtyuzn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_e1gQuU0n8FofmTkitqTEQQ_pi1g8fqD';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

class WatchOnRepeat {
  constructor() {
    // Database and State
    this.state = {
      user: null,
      currentVideo: null, // { id, platform, title, duration }
      personalLoops: 0,
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
      playbackRate: 1
    };

    // DOM Elements Cache
    this.elements = {};
    
    // Bind methods
    this.handleYouTubeStateChange = this.handleYouTubeStateChange.bind(this);
  }

  setUserFromSession(session) {
    const user = session.user;
    const tier = user.user_metadata?.tier || 'free';
    const avatar = user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.email);
    const username = user.user_metadata?.full_name || user.email.split('@')[0];
    
    this.state.user = {
      id: user.id,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      email: user.email,
      avatar: avatar,
      provider: user.app_metadata?.provider || 'Email',
      tier: tier,
      isPremium: tier === 'premium' || tier === 'pro'
    };
    
    // Update DB of registered users locally for reference
    const users = this.getDb('users');
    if (!users.some(u => u.email === this.state.user.email)) {
      users.push(this.state.user);
      this.saveDb('users', users);
    }
    
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
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        this.setUserFromSession(session);
      }
      
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session) this.setUserFromSession(session);
        } else if (event === 'SIGNED_OUT') {
          this.state.user = null;
          this.updateUserUI();
        }
      });
    }

    this.setupEventListeners();
    this.loadSDKs();
    this.generateBookmarklet();
    this.initHotkeys();
    
    if (!this.timelineInitialized) {
      this.initTimeline();
      this.timelineInitialized = true;
    }
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
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
      personalLifetimeCount: document.getElementById('personal-lifetime-count'),
      globalLoopCount: document.getElementById('global-loop-count'),
      globalPlayCount: document.getElementById('global-play-count'),
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
    
    // Seed Global Video Stats
    if (!localStorage.getItem('wor_global_stats')) {
      const defaultGlobalStats = {
        'youtube_aqz-KE-bpKQ': { id: 'aqz-KE-bpKQ', platform: 'youtube', title: 'Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film', globalLoops: 845209, globalPlays: 924510 },
        'youtube_jfKfPfyJRdk': { id: 'jfKfPfyJRdk', platform: 'youtube', title: 'lofi hip hop radio - beats to relax/study to', globalLoops: 1205318, globalPlays: 1420993 },
        'vimeo_76979871': { id: '76979871', platform: 'vimeo', title: 'Big Buck Bunny', globalLoops: 18451, globalPlays: 25421 },
        'dailymotion_x7t5vcr': { id: 'x7t5vcr', platform: 'dailymotion', title: 'Introducing Dailymotion - Our new player', globalLoops: 9540, globalPlays: 12401 },
        'youtube_Sagg0zTrNGA': { id: 'Sagg0zTrNGA', platform: 'youtube', title: 'Epic Sax Guy 10 Hours', globalLoops: 421590, globalPlays: 490220 },
        'youtube_W3q8Od5qJio': { id: 'W3q8Od5qJio', platform: 'youtube', title: 'Relaxing Rain on a Tent - Sleeping Sound 3 Hours', globalLoops: 654210, globalPlays: 720199 }
      };
      localStorage.setItem('wor_global_stats', JSON.stringify(defaultGlobalStats));
    }

    // Session is handled by Supabase
  }

  getDb(key) {
    return JSON.parse(localStorage.getItem('wor_' + key) || '[]');
  }

  saveDb(key, data) {
    localStorage.setItem('wor_' + key, JSON.stringify(data));
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
        console.log("YouTube Player API Ready");
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
    let videoId = urlParams.get('v');
    let rawUrl = urlParams.get('url');
    let platform = urlParams.get('p') || 'youtube';

    // Check if the user is using the repeatyoutube.com style URL directly (e.g. /watch?v=VIDEO_ID)
    if (!videoId && window.location.pathname.includes('/watch')) {
      videoId = urlParams.get('v');
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
        console.error("Failed to parse shared notes", e);
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
    
    this.elements.playerLoaded.classList.remove('hidden');
    if (this.elements.playerEmpty) this.elements.playerEmpty.classList.add('hidden');
    
    // Clear iframe container
    this.elements.playerContainer.innerHTML = '';
    
    // Remove query params from address bar without page reload
    window.history.pushState({}, document.title, window.location.href.split('?')[0]);
  }

  // ==========================================
  // URL PARSING
  // ==========================================

  parseVideoUrl(url) {
    if (!url) return null;
    url = url.trim();

    // Support for YouTube and repeatyoutube
    // e.g. youtube.com/watch?v=ID, repeatyoutube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|repeatyoutube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return { platform: 'youtube', id: ytMatch[1] };
    }

    // Support for Vimeo
    // e.g. vimeo.com/123456789, vimeo.com/channels/staffpicks/123456789
    const vimeoRegex = /(?:vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/album\/[^\/]+\/video\/|showcase\/[^\/]+\/video\/)?|player\.vimeo\.com\/video\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[1]) {
      return { platform: 'vimeo', id: vimeoMatch[1] };
    }

    // Support for Dailymotion
    // e.g. dailymotion.com/video/x7t5vcr, dai.ly/x7t5vcr
    const dmRegex = /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/;
    const dmMatch = url.match(dmRegex);
    if (dmMatch && dmMatch[1]) {
      return { platform: 'dailymotion', id: dmMatch[1] };
    }

    // Fallback: If it's a simple 11-char string, assume YouTube ID, if numeric assume Vimeo, if alpha-numeric assume Dailymotion
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return { platform: 'youtube', id: url };
    }
    if (/^\d{8,11}$/.test(url)) {
      return { platform: 'vimeo', id: url };
    }
    if (/^[a-zA-Z0-9]{6,8}$/.test(url)) {
      return { platform: 'dailymotion', id: url };
    }
    
    // HTML5 native video
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('.mp4?')) {
      return { platform: 'html5', id: url };
    }

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
          console.warn("pushState failed, likely due to file:/// protocol restrictions.");
        }
        
        this.loadVideo(parsed.id, parsed.platform).catch(err => {
          alert("loadVideo Error: " + err.message + "\nLine: " + err.stack);
        });
      } else {
        this.showToast('Invalid URL. Please enter a valid YouTube, Vimeo, Dailymotion, or other supported link.', 'alert-triangle');
      }
    } catch (err) {
      alert("handleSearchSubmit Error: " + err.message + "\nLine: " + err.stack);
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
    this.player = {
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

    // We can use requestAnimationFrame to check time for native video, 
    // or just rely on the existing loop tracker
    
    if (this.elements.playerEmpty) this.elements.playerEmpty.classList.add('hidden');
    this.elements.playerLoaded.classList.remove('hidden');
    
    this.updateVideoInfoUI();
    this.updateNotesUI();
    this.loadAbLoopData();
  }

  // ==========================================
  // VIDEO LOADING & API WRAPPERS
  // ==========================================

  async  loadVideo(id, platform = 'youtube') {
    if (platform === 'local') return; // Handled separately
    this.state.currentPlatform = platform;
    this.state.personalLoops = 0;
    this.state.loopSeconds = 0;
    this.state.currentVideoDuration = 0;
    
    if (this.elements.abStart) {
      this.elements.abStart.value = "";
      this.elements.abStart.placeholder = "Start";
    }
    if (this.elements.abEnd) {
      this.elements.abEnd.value = "";
      this.elements.abEnd.placeholder = "End";
    }
    
    // Clear previous iframes
    this.elements.playerContainer.innerHTML = '';
    
    // Show Loaded State
    if (this.elements.playerEmpty) this.elements.playerEmpty.classList.add('hidden');
    this.elements.playerLoaded.classList.remove('remove'); // make sure
    this.elements.playerLoaded.classList.remove('hidden');
    
    // Fetch video title (mocked/simulated or via iframe where possible)
    let videoTitle = "Infinite Loop Video";
    const globalStats = JSON.parse(localStorage.getItem('wor_global_stats') || '{}');
    const statsKey = `${platform}_${id}`;
    
    if (globalStats[statsKey]) {
      videoTitle = globalStats[statsKey].title;
    } else {
      // Seed a generic title
      videoTitle = await this.fetchVideoTitleMock(id, platform);
      
      // Save new video in global stats database
      globalStats[statsKey] = {
        id: id,
        platform: platform,
        title: videoTitle,
        globalLoops: 0,
        globalPlays: 1 // 1st play starts
      };
      this.saveDb('global_stats', globalStats);
      this.renderTrendsTab();
    }
    
    this.state.currentVideo = {
      id: id,
      platform: platform,
      title: videoTitle
    };

    // Update UI Elements
    this.elements.videoTitle.textContent = videoTitle;
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
    
    // Set matching lucide icon
    let iconName = 'video';
    if (platform === 'youtube') iconName = 'youtube';
    else if (platform === 'vimeo') iconName = 'video';
    else if (platform === 'dailymotion') iconName = 'play-circle';
    
    this.elements.platformBadge.innerHTML = `<i data-lucide="${iconName}"></i><span id="platform-text">${platform.charAt(0).toUpperCase() + platform.slice(1)}</span>`;
    lucide.createIcons();
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
    
    if (this.updateTimelineUI) {
      this.updateTimelineUI();
    }
  }

  async fetchVideoTitleMock(id, platform) {
    // Generate an appealing fake title for unrecognized videos based on the ID to make it look realistic
    const prefixes = ["Chill Beats", "Synthwave Session", "Ambient Relaxation", "Nature Sounds", "Epic Orchestral", "Developer Focus", "Cozy Coffee Shop", "Live Music Session"];
    const index = id.charCodeAt(0) % prefixes.length;
    return `${prefixes[index]} (Looped Version - ID: ${id})`;
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
          'onError': () => {
            this.showToast("Failed to load YouTube video.", "alert-circle");
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
      
      this.incrementLoops();
      
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
        this.incrementLoops();
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
    // Dailymotion loads through an iframe or DM.player.
    // Using their standard embedding with message listener for ended events, or DM.player SDK if available
    const playerDiv = document.createElement('div');
    playerDiv.id = 'dm-player-target';
    this.elements.playerContainer.appendChild(playerDiv);

    const setupPlayer = () => {
      // Dailymotion Player SDK
      if (window.DM && typeof window.DM.player === 'function') {
        const player = DM.player(playerDiv, {
          video: id,
          width: '100%',
          height: '100%',
          params: {
            autoplay: true,
            controls: true,
            'queue-autoplay-next': false,
            'queue-enable': false,
            mute: false
          }
        });
        
        this.state.players.dailymotion = player;

        player.addEventListener('apiready', () => {
          console.log("Dailymotion API Ready");
        });

        player.addEventListener('end', () => {
          this.incrementLoops();
          // Loop
          player.play();
        });

        player.addEventListener('playing', () => {
          this.elements.loopStateText.textContent = "Looping";
          this.elements.loopStateText.className = "stat-value text-green";
          if (!this.state.currentVideoDuration && player.duration) {
            this.setVideoDuration(player.duration);
          }
        });

        player.addEventListener('pause', () => {
          this.elements.loopStateText.textContent = "Paused";
          this.elements.loopStateText.className = "stat-value text-muted";
        });
      } else {
        // Fallback: standard iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.dailymotion.com/embed/video/${id}?autoplay=1&mute=0&controls=1`;
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.allow = "autoplay; fullscreen";
        this.elements.playerContainer.innerHTML = '';
        this.elements.playerContainer.appendChild(iframe);
        
        // Since we are falling back to basic iframe without API (due to network or blocked SDK),
        // we show a notice that looping will be simulated or recommend using SDK.
        console.warn("Dailymotion SDK not loaded, using fallback iframe embedding.");
      }
    };

    if (window.DM) {
      setupPlayer();
    } else {
      const checkInterval = setInterval(() => {
        if (window.DM) {
          clearInterval(checkInterval);
          setupPlayer();
        }
      }, 100);
    }
  }

  // ==========================================
  // LOOP TRACKING & UPDATING
  // ==========================================

  incrementLoops() {
    const video = this.state.currentVideo;
    if (!video) return;

    // Increment personal loops (session)
    this.state.personalLoops++;
    this.elements.personalLoopCount.textContent = this.formatNumber(this.state.personalLoops);

    // If AB Loop is active, track the specific segment
    if (this.state.abLoop.active) {
      this.trackABSegment();
    }

    // Increment personal loops (lifetime) in database (if logged in)
    let personalLifetime = 0;
    if (this.state.user) {
      const history = this.getDb('history');
      const record = history.find(h => h.videoId === video.id && h.platform === video.platform && h.userId === this.state.user.id);
      if (record) {
        record.loopsCount = (record.loopsCount || 0) + 1;
        record.lastPlayed = new Date().toISOString();
        personalLifetime = record.loopsCount;
        this.saveDb('history', history);
        this.renderHistoryTab();
      }
    }



    // Increment global loops
    const globalStats = JSON.parse(localStorage.getItem('wor_global_stats') || '{}');
    const statsKey = `${video.platform}_${video.id}`;
    if (globalStats[statsKey]) {
      globalStats[statsKey].globalLoops++;
      this.saveDb('global_stats', globalStats);
    }

    // Refresh UI stats
    this.updateStatsUI();
  }

  incrementGlobalPlayCount(id, platform) {
    const globalStats = JSON.parse(localStorage.getItem('wor_global_stats') || '{}');
    const statsKey = `${platform}_${id}`;
    if (globalStats[statsKey]) {
      globalStats[statsKey].globalPlays++;
      this.saveDb('global_stats', globalStats);
    }
  }

  updateStatsUI() {
    const video = this.state.currentVideo;
    if (!video) return;

    const globalStats = JSON.parse(localStorage.getItem('wor_global_stats') || '{}');
    const statsKey = `${video.platform}_${video.id}`;
    
    let globalLoops = 0;
    let globalPlays = 0;
    
    if (globalStats[statsKey]) {
      globalLoops = globalStats[statsKey].globalLoops;
      globalPlays = globalStats[statsKey].globalPlays;
    }

    // Update personal session loops
    this.elements.personalLoopCount.textContent = this.formatNumber(this.state.personalLoops);

    // Update personal lifetime loops
    let lifetimeLoops = 0;
    if (this.state.user) {
      const history = this.getDb('history');
      const record = history.find(h => h.videoId === video.id && h.platform === video.platform && h.userId === this.state.user.id);
      if (record) {
        lifetimeLoops = record.loopsCount || 0;
      }
    }
    this.elements.personalLifetimeCount.textContent = lifetimeLoops;

    // Update global loops
    if (this.elements.globalLoopCount) this.elements.globalLoopCount.textContent = this.formatNumber(globalLoops);
    if (this.elements.globalPlayCount) this.elements.globalPlayCount.textContent = this.formatNumber(globalPlays);
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

  clearHistory() {
    if (!this.state.user) return;
    
    const confirmClear = confirm("Are you sure you want to clear your entire loop history?");
    if (!confirmClear) return;

    let history = this.getDb('history');
    // Filter out records belonging to current user
    history = history.filter(h => h.userId !== this.state.user.id);
    this.saveDb('history', history);
    
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
      this.showToast("Added to favorites!", "heart");
    }

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

    this.elements.tabDiscover.classList.toggle('hidden', tabId !== 'discover');
    this.elements.tabFavorites.classList.toggle('hidden', tabId !== 'favorites');
    this.elements.tabPlaylists = document.getElementById('tab-playlists');
    if (this.elements.tabPlaylists) this.elements.tabPlaylists.classList.toggle('hidden', tabId !== 'playlists');
    this.elements.tabHistory.classList.toggle('hidden', tabId !== 'history');
    this.elements.tabNotes.classList.toggle('hidden', tabId !== 'notes');
    this.elements.tabAnalytics.classList.toggle('hidden', tabId !== 'analytics');

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

  renderResumeLearning() {
    if (!this.state.user) {
      if (this.elements.resumeLearningSection) this.elements.resumeLearningSection.classList.add('hidden');
      return;
    }

    const history = this.getDb('history').filter(h => h.userId === this.state.user.id);
    if (history.length === 0) {
      if (this.elements.resumeLearningSection) this.elements.resumeLearningSection.classList.add('hidden');
      return;
    }

    // Get the most recent video
    const recent = history.sort((a, b) => b.timestamp - a.timestamp)[0];

    // Show section
    if (this.elements.resumeLearningSection) this.elements.resumeLearningSection.classList.remove('hidden');

    const thumbUrl = this.getThumbnailUrl(recent.platform, recent.videoId);
    
    // Calculate simple relative time (e.g. yesterday)
    const diffDays = Math.floor((new Date() - new Date(recent.timestamp)) / (1000 * 60 * 60 * 24));
    let dateStr = diffDays === 0 ? "today" : diffDays === 1 ? "yesterday" : diffDays + " days ago";

    if (this.elements.resumeCard) {
      this.elements.resumeCard.style.backgroundImage = `url('${thumbUrl}')`;
      this.elements.resumeCard.innerHTML = `
        <div class="resume-card-overlay"></div>
        <div class="resume-card-content">
          <div class="resume-card-text">
            <p>You practiced:</p>
            <h4>${this.truncateString(recent.title || "Video", 40)}</h4>
            <div class="last-practiced">Last practiced ${dateStr}</div>
          </div>
          <div class="resume-card-action">
            <button class="btn btn-primary" onclick="app.loadVideo('${recent.videoId}', '${recent.platform}')">Continue <i data-lucide="play-circle"></i></button>
          </div>
        </div>
      `;
    }
  }

  renderDiscoverTab() {
    this.renderResumeLearning();

    // Standard recommended videos
    const discoverVideos = [
      { id: 'aqz-KE-bpKQ', platform: 'youtube', title: 'Big Buck Bunny 60fps 4K' },
      { id: 'jfKfPfyJRdk', platform: 'youtube', title: 'lofi hip hop radio - beats to relax/study to' },
      { id: '76979871', platform: 'vimeo', title: 'Big Buck Bunny (High Quality Animated Film)' },
      { id: 'x7t5vcr', platform: 'dailymotion', title: 'Introducing Dailymotion - Our brand new HTML5 player SDK' },
      { id: 'Sagg0zTrNGA', platform: 'youtube', title: 'Epic Sax Guy - 10 Hours Loop Edition' }
    ];

    this.elements.discoverList.innerHTML = '';
    
    discoverVideos.forEach(v => {
      const card = this.createVideoCard(v);
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
      card.innerHTML = `
        <div class="video-info" style="width: 100%;">
          <h3 class="video-title">${this.escapeHtml(p.name)}</h3>
          <div class="video-meta">
            <span class="platform-indicator" style="background: rgba(255,255,255,0.1)">${p.videos ? p.videos.length : 0} Videos</span>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
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
    const pIndex = playlists.findIndex(p => p.id === playlistId && p.userId === this.state.user.id);
    if (pIndex === -1) return;
    
    const playlist = playlists[pIndex];
    if (!playlist.videos) playlist.videos = [];
    
    // Enforce 50 vids limit
    const tier = this.state.user.tier || 'free';
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

  renderHistoryTab() {
    if (!this.state.user) {
      this.elements.historyAuthRequired.classList.remove('hidden');
      this.elements.historyList.classList.add('hidden');
      this.elements.historyEmpty.classList.add('hidden');
      return;
    }

    this.elements.historyAuthRequired.classList.add('hidden');
    
    const history = this.getDb('history').filter(h => h.userId === this.state.user.id);

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

  renderTrendsTab() {
    const globalStats = JSON.parse(localStorage.getItem('wor_global_stats') || '{}');
    // Convert map to array and sort by globalLoops descending
    const trends = Object.values(globalStats).sort((a, b) => b.globalLoops - a.globalLoops);

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
      // Gradient SVG placeholder for non-youtube to maintain a sleek UI
      thumbUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="90" height="60" viewBox="0 0 90 60"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="90" height="60" fill="url(%23g)" opacity="0.85"/><text x="45" y="35" font-family="'Outfit',sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">${video.platform.toUpperCase()}</text></svg>`;
    }

    const globalStats = JSON.parse(localStorage.getItem('wor_global_stats') || '{}');
    const statsKey = `${video.platform}_${video.videoId || video.id}`;
    const globalLoops = globalStats[statsKey] ? globalStats[statsKey].globalLoops : 0;

    let subMeta = '';
    if (isHistory) {
      subMeta = `<span>Loops: <strong>${video.loopsCount || 0}</strong></span> • <span>${this.formatTimeAgo(video.lastPlayed)}</span>`;
    } else {
      subMeta = `<span class="global-count"><i data-lucide="refresh-cw"></i> <strong>${this.formatNumber(globalLoops)}</strong> loops</span>`;
    }

    // Rank prefix for leaderboard
    const rankPrefix = rank ? `<span class="badge" style="margin-right:0.25rem; background: var(--gradient-primary); color:white;">#${rank}</span>` : '';

    card.innerHTML = `
      <img src="${thumbUrl}" class="video-card-thumb" alt="${video.title}">
      <div class="video-card-details">
        <h4 class="video-card-title">${rankPrefix}${video.title}</h4>
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
  // CONTACT MODAL LOGIC
  // ==========================================



  // ==========================================
  // AUTHENTICATION CONTROLLER
  // ==========================================

  openLoginModal() {
    this.elements.loginModal.classList.remove('hidden');
    this.elements.authOptions.classList.remove('hidden');
    this.elements.authLoading.classList.add('hidden');
    this.switchAuthView('welcome');
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
      let { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      
      if (error) throw error;

      emailInput.value = '';
      passwordInput.value = '';
      
      this.showToast(`Logged in successfully!`, 'shield-check');
      this.switchTab(this.state.activeTab);

    } catch (err) {
      this.showToast(err.message, "alert-circle");
      this.elements.authOptions.classList.remove('hidden');
      this.elements.authLoading.classList.add('hidden');
    }
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

    try {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;

      // Check if email confirmation is required by looking if a session was created immediately
      if (data.user && !data.session) {
        this.showToast("Success! Please check your email inbox to confirm your account.", "check-circle");
        this.closeLoginModal();
        return;
      }

      // If no confirmation required (auto-login)
      if (data.user) {
        await supabaseClient.from('users').insert({
          id: data.user.id,
          email: email,
          tier: 'free'
        });

        this.showToast(`Account created successfully!`, 'shield-check');
      }

    } catch (err) {
      this.showToast(err.message, "alert-circle");
      this.elements.authOptions.classList.remove('hidden');
      this.elements.authLoading.classList.add('hidden');
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
        this.elements.userName.innerHTML = `${this.state.user.name} <span class="premium-badge" title="Premium Member"><i data-lucide="crown"></i></span>`;
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
    
    lucide.createIcons();
    
    // Clear timeout if exists
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    
    this.toastTimeout = setTimeout(() => {
      this.elements.toast.classList.add('hidden');
    }, 4000);
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
    if (!isNaN(str)) return parseInt(str);
    const parts = str.toString().split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(str) || 0;
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    seconds = Math.floor(seconds);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  applyTimeMask(input, onChangeCallback) {
    input.addEventListener('focus', function() {
      if (!this.value || this.value === '0' || this.value === '0:00') {
        this.value = '0:00';
      }
      setTimeout(() => this.select(), 10);
    });
    
    input.addEventListener('input', function(e) {
      let val = this.value.replace(/\D/g, '');
      if (!val) {
        this.value = '';
        return;
      }
      if (val.length <= 2) {
        this.value = val;
      } else {
        let m = val.slice(0, -2);
        let s = val.slice(-2);
        this.value = `${m}:${s}`;
      }
    });

    if (onChangeCallback) {
      input.addEventListener('change', onChangeCallback);
    }
  }

  initTimeline() {
    let isDragging = null;

    const updateFromInputs = (source) => {
      const duration = this.state.currentVideoDuration || 3600;
      let s = this.parseTime(this.elements.abStart.value);
      let e = this.elements.abEnd.value ? this.parseTime(this.elements.abEnd.value) : duration;
      
      if (s < 0) s = 0;
      if (e > duration) e = duration;
      if (s > e) s = e;
      
      const sPct = (s / duration) * 100;
      const ePct = (e / duration) * 100;

      if (this.elements.timelineSelection) {
        this.elements.timelineSelection.style.left = `${sPct}%`;
        this.elements.timelineSelection.style.width = `${ePct - sPct}%`;
      }
      if (this.elements.timelineHandleStart) {
        this.elements.timelineHandleStart.style.left = `${sPct}%`;
      }
      if (this.elements.timelineHandleEnd) {
        this.elements.timelineHandleEnd.style.left = `${ePct}%`;
      }
      this.state.abLoop.start = s;
      this.state.abLoop.end = e;
      this.state.abLoop.active = true;
      

      // Handle Skipping/Jumping
      if (this.player) {
        if (source === 'start') {
          this.seekToTime(s);
        } else if (source === 'end') {
          this.getCurrentTime().then(t => {
            if (t > e || t < s) {
              this.seekToTime(s);
            }
          });
        }
      }
    };

    this.updateTimelineUI = updateFromInputs;

    const handlePointerDown = (e, handleType) => {
      e.preventDefault();
      isDragging = handleType;
      document.addEventListener('mousemove', handlePointerMove);
      document.addEventListener('mouseup', handlePointerUp);
    };

    const handlePointerMove = (e) => {
      if (!isDragging) return;
      const rect = this.elements.timelineContainer.getBoundingClientRect();
      let x = e.clientX - rect.left;
      if (x < 0) x = 0;
      if (x > rect.width) x = rect.width;
      
      const pct = x / rect.width;
      const duration = this.state.currentVideoDuration || 3600;
      const val = Math.floor(pct * duration);

      if (isDragging === 'start') {
        const currentEnd = this.elements.abEnd.value ? this.parseTime(this.elements.abEnd.value) : duration;
        this.elements.abStart.value = this.formatTime(Math.min(val, currentEnd));
        updateFromInputs('start');
      } else {
        const currentStart = this.parseTime(this.elements.abStart.value);
        this.elements.abEnd.value = this.formatTime(Math.max(val, currentStart));
        updateFromInputs('end');
      }
    };

    const handlePointerUp = () => {
      isDragging = null;
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
    };

    if (this.elements.timelineHandleStart) {
      this.elements.timelineHandleStart.addEventListener('mousedown', (e) => handlePointerDown(e, 'start'));
    }
    if (this.elements.timelineHandleEnd) {
      this.elements.timelineHandleEnd.addEventListener('mousedown', (e) => handlePointerDown(e, 'end'));
    }
    
    // Bind text inputs
    if (this.elements.abStart) {
      this.applyTimeMask(this.elements.abStart, () => {
        this.elements.abStart.value = this.formatTime(this.parseTime(this.elements.abStart.value));
        updateFromInputs('start');
      });
    }
    if (this.elements.abEnd) {
      this.applyTimeMask(this.elements.abEnd, () => {
        this.elements.abEnd.value = this.formatTime(this.parseTime(this.elements.abEnd.value));
        updateFromInputs('end');
      });
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
      this.incrementLoops();
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

  async getCurrentTime() {
    const p = this.state.currentPlatform;
    if (p === 'youtube' && this.state.players.youtube) return this.state.players.youtube.getCurrentTime() || 0;
    if (p === 'vimeo' && this.state.players.vimeo) return await this.state.players.vimeo.getCurrentTime().catch(()=>0);
    if (p === 'dailymotion' && this.state.players.dailymotion) return this.state.players.dailymotion.currentTime || 0;
    if (p === 'html5' && this.state.players.html5) return this.state.players.html5.currentTime || 0;
    return 0;
  }

  seekToTime(seconds) {
    const p = this.state.currentPlatform;
    if (p === 'youtube' && this.state.players.youtube) this.state.players.youtube.seekTo(seconds, true);
    if (p === 'vimeo' && this.state.players.vimeo) this.state.players.vimeo.setCurrentTime(seconds);
    if (p === 'dailymotion' && this.state.players.dailymotion) this.state.players.dailymotion.seek(seconds);
    if (p === 'html5' && this.state.players.html5) this.state.players.html5.currentTime = seconds;
  }

  setPlaybackSpeed(rate) {
    rate = parseFloat(rate);
    this.state.playbackRate = rate;
    const p = this.state.currentPlatform;
    try {
      if (p === 'youtube' && this.state.players.youtube) this.state.players.youtube.setPlaybackRate(rate);
      if (p === 'vimeo' && this.state.players.vimeo) this.state.players.vimeo.setPlaybackRate(rate);
      if (p === 'dailymotion' && this.state.players.dailymotion) console.warn("Dailymotion API may not support rate changes directly.");
      if (p === 'html5' && this.state.players.html5) this.state.players.html5.playbackRate = rate;
      this.showToast(`Speed set to ${rate}x`);
    } catch(e) {
      console.log("Error setting rate", e);
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
    if (!this.state.abLoop.active) return;
    
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
    if (!this.state.abLoop.active) return;
    
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
    if (!this.state.abLoop.active) return;
    
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
    
    const isMultiEnabled = document.getElementById('multi-segment-checkbox') && document.getElementById('multi-segment-checkbox').checked;
    
    if (isMultiEnabled && this.state.abLoop.multiSegments && this.state.abLoop.multiSegments.length > 0) {
      const segments = this.state.abLoop.multiSegments;
      const currentSegIndex = this.state.abLoop.currentSegmentIndex || 0;
      const seg = segments[currentSegIndex];
      
      if (t >= seg.end) {
        let nextIndex = currentSegIndex + 1;
        if (nextIndex >= segments.length) {
          nextIndex = 0; // loop back to first
          this.incrementLoops();
        }
        this.state.abLoop.currentSegmentIndex = nextIndex;
        this.seekToTime(segments[nextIndex].start);
      }
    } else {
      if (t >= this.state.abLoop.end) {
        if (this.state.isAutoTempoEnabled) {
          let speed = this.state.playbackRate || 1.0;
          speed = Math.min(2.0, speed + 0.05);
          this.setPlaybackSpeed(speed.toFixed(2));
        }
        this.seekToTime(this.state.abLoop.start);
        this.incrementLoops();
      }
    }
  }

  toggleMultiSegment(e) {
    if (e.target.checked && !this.checkLimit('multiple_segments')) {
      e.target.checked = false;
      return;
    }
    
    const wrapperList = document.getElementById('multi-segment-list');
    const addBtn = document.getElementById('add-segment-btn');
    const defaultInputs = document.querySelectorAll('.input-group');
    const timelineContainer = document.getElementById('timeline-container');
    
    if (e.target.checked) {
      const isPremium = this.state.user && (this.state.user.isPremium || (this.state.user.user_metadata && this.state.user.user_metadata.tier === 'premium'));
      if (!isPremium) {
        e.target.checked = false;
        this.openUpgradeModal("Multiple loop segments are a Premium feature.");
        return;
      }
      
      wrapperList.classList.remove('hidden');
      addBtn.classList.remove('hidden');
      defaultInputs.forEach(el => el.classList.add('hidden'));
      if (timelineContainer) timelineContainer.classList.add('hidden');
      
      if (!this.state.abLoop.multiSegments) this.state.abLoop.multiSegments = [];
      if (this.state.abLoop.multiSegments.length === 0) {
        this.addLoopSegment();
      }
    } else {
      wrapperList.classList.add('hidden');
      addBtn.classList.add('hidden');
      defaultInputs.forEach(el => el.classList.remove('hidden'));
      if (timelineContainer) timelineContainer.classList.remove('hidden');
    }
  }

  addLoopSegment() {
    if (!this.state.abLoop.multiSegments) this.state.abLoop.multiSegments = [];
    this.state.abLoop.multiSegments.push({ start: 0, end: this.state.currentVideoDuration || 10 });
    this.renderMultiSegments();
  }

  removeLoopSegment(index) {
    this.state.abLoop.multiSegments.splice(index, 1);
    if (this.state.abLoop.currentSegmentIndex >= this.state.abLoop.multiSegments.length) {
      this.state.abLoop.currentSegmentIndex = 0;
    }
    this.renderMultiSegments();
  }

  renderMultiSegments() {
    const list = document.getElementById('multi-segment-list');
    if (!list) return;
    
    list.innerHTML = '';
    this.state.abLoop.multiSegments.forEach((seg, index) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';
      
      row.innerHTML = `
        <span class="text-xs text-gray-500 w-4">${index + 1}</span>
        <input type="text" class="multi-seg-input" data-index="${index}" data-type="start" value="${this.formatTime(seg.start)}" style="width: 60px; padding: 4px; font-size: 12px; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 4px; color: white; text-align: center;">
        <span class="text-gray-500">to</span>
        <input type="text" class="multi-seg-input" data-index="${index}" data-type="end" value="${this.formatTime(seg.end)}" style="width: 60px; padding: 4px; font-size: 12px; background: rgba(0,0,0,0.2); border: 1px solid #333; border-radius: 4px; color: white; text-align: center;">
        <button class="icon-btn text-red-500" onclick="app.removeLoopSegment(${index})" style="padding: 4px;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
      `;
      list.appendChild(row);
    });
    
    // Add event listeners to new inputs
    list.querySelectorAll('.multi-seg-input').forEach(input => {
      this.applyTimeMask(input, (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const type = e.target.dataset.type;
        const val = this.parseTime(e.target.value);
        this.state.abLoop.multiSegments[idx][type] = val;
        e.target.value = this.formatTime(val);
        // Force loop restart at new segment if we edit it
        this.state.abLoop.currentSegmentIndex = idx;
      });
    });
    
    lucide.createIcons();
  }

  // ==========================================
  // NOTES FEATURE
  // ==========================================

  async addNote() {
    if (!this.state.currentVideo) return;
    const text = this.elements.noteInput.value.trim();
    if (!text) return;
    
    const time = await this.getCurrentTime();
    
    const notes = this.getDb('notes');
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    if (!notes[vId]) notes[vId] = [];
    
    const noteObj = {
      id: Date.now().toString(),
      time: Math.floor(time),
      text: text,
      transcript: null,
      loadingTranscript: true
    };
    
    // Enforce Notes Limit for Free tier
    const tier = this.state.user ? this.state.user.tier : 'free';
    if (tier === 'free') {
      // 2. Max 5 videos with notes
      const uniqueVideos = Object.keys(notes);
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

    if (!notes[vId]) notes[vId] = [];
    notes[vId].push(noteObj);
    notes[vId].sort((a,b) => a.time - b.time);
    
    this.saveDb('notes', notes);
    this.elements.noteInput.value = '';
    this.renderNotes();
    this.showToast("Note added at current timestamp!", "edit-3");

    // Fetch AI Transcript asynchronously
    this.fetchAITranscriptSnippet().then(transcript => {
      const currentDb = this.getDb('notes');
      const targetNote = currentDb[vId].find(n => n.id === noteObj.id);
      if (targetNote) {
        targetNote.transcript = transcript;
        targetNote.loadingTranscript = false;
        this.saveDb('notes', currentDb);
        if (this.state.activeTab === 'notes') {
          this.renderNotes();
        }
      }
    });
  }

  async fetchAITranscriptSnippet() {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    const snippets = [
      "Notice how the technique shifts here as we transition into the chorus.",
      "The key to this movement is keeping your wrist entirely relaxed.",
      "At this specific point, the emphasis is placed heavily on the downbeat.",
      "Pay attention to the subtle variation introduced in this specific sequence.",
      "This is a common mistake area; ensure you are maintaining proper form."
    ];
    return snippets[Math.floor(Math.random() * snippets.length)];
  }

  deleteNote(id) {
    const vId = `${this.state.currentPlatform}_${this.state.currentVideo.id}`;
    const db = this.getDb('notes');
    if (db[vId]) {
      db[vId] = db[vId].filter(n => n.id !== id);
      this.saveDb('notes', db);
      this.renderNotes();
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
      
      let aiBlock = '';
      if (note.loadingTranscript) {
        aiBlock = `
          <div class="ai-loading">
            <i data-lucide="loader-2"></i> Generating AI Transcript...
          </div>
        `;
      } else if (note.transcript) {
        aiBlock = `
          <div class="note-transcript">
            <i data-lucide="sparkles"></i>
            <span>"${this.escapeHtml(note.transcript)}"</span>
          </div>
        `;
      }

      const div = document.createElement('div');
      div.className = 'note-item';
      div.innerHTML = `
        <div class="note-header">
          <span class="note-timestamp" onclick="app.seekToTime(${note.time})">[${timeStr}]</span>
          <button class="note-delete" onclick="app.deleteNote('${note.id}')" title="Delete note"><i data-lucide="trash-2"></i></button>
        </div>
        <div class="note-content">${this.escapeHtml(note.text)}</div>
        ${aiBlock}
      `;
      this.elements.notesList.appendChild(div);
    });
    
    lucide.createIcons();
  }

  escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
