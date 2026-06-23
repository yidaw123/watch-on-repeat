/**
 * WatchOnRepeat - Core Application Logic
 */

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
        dailymotion: null
      },
      currentPlatform: null
    };

    // DOM Elements Cache
    this.elements = {};
    
    // Bind methods
    this.handleYouTubeStateChange = this.handleYouTubeStateChange.bind(this);
  }

  init() {
    this.cacheElements();
    this.initDatabase();
    this.setupEventListeners();
    this.loadSDKs();
    this.generateBookmarklet();
    
    // Check URL parameters for auto-loading
    this.handleRouting();
    
    // Initial Render
    this.renderDiscoverTab();
    this.renderTrendsTab();
    this.updateUserUI();

    // Start simulated global community loops
    this.startGlobalActivitySimulator();
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
      tabTrends: document.getElementById('tab-trends'),
      
      tabDiscoverBtn: document.getElementById('tab-discover-btn'),
      tabFavoritesBtn: document.getElementById('tab-favorites-btn'),
      tabHistoryBtn: document.getElementById('tab-history-btn'),
      tabTrendsBtn: document.getElementById('tab-trends-btn'),
      
      // Lists
      discoverList: document.getElementById('discover-list'),
      favoritesList: document.getElementById('favorites-list'),
      favoritesEmpty: document.getElementById('favorites-empty'),
      favoritesCountBadge: document.getElementById('favorites-count-badge'),
      favAuthRequired: document.getElementById('fav-auth-required'),
      
      historyList: document.getElementById('history-list'),
      historyEmpty: document.getElementById('history-empty'),
      historyAuthRequired: document.getElementById('history-auth-required'),
      
      trendsList: document.getElementById('trends-list'),
      
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
    
    // Seed Global Video Stats
    if (!localStorage.getItem('wor_global_stats')) {
      const defaultGlobalStats = {
        'youtube_-rKIx5Kf3_I': { id: '-rKIx5Kf3_I', platform: 'youtube', title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)', globalLoops: 845209, globalPlays: 924510 },
        'youtube_jfKfPfyJRdk': { id: 'jfKfPfyJRdk', platform: 'youtube', title: 'lofi hip hop radio - beats to relax/study to', globalLoops: 1205318, globalPlays: 1420993 },
        'vimeo_76979871': { id: '76979871', platform: 'vimeo', title: 'Big Buck Bunny', globalLoops: 18451, globalPlays: 25421 },
        'dailymotion_x7t5vcr': { id: 'x7t5vcr', platform: 'dailymotion', title: 'Introducing Dailymotion - Our new player', globalLoops: 9540, globalPlays: 12401 },
        'youtube_Sagg0zTrNGA': { id: 'Sagg0zTrNGA', platform: 'youtube', title: 'Epic Sax Guy 10 Hours', globalLoops: 421590, globalPlays: 490220 },
        'youtube_W3q8Od5qJio': { id: 'W3q8Od5qJio', platform: 'youtube', title: 'Relaxing Rain on a Tent - Sleeping Sound 3 Hours', globalLoops: 654210, globalPlays: 720199 }
      };
      localStorage.setItem('wor_global_stats', JSON.stringify(defaultGlobalStats));
    }

    // Check session
    const savedSession = localStorage.getItem('wor_session');
    if (savedSession) {
      this.state.user = JSON.parse(savedSession);
    }
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

    // Check if URL parameter contains a direct video link
    if (rawUrl) {
      const parsed = this.parseVideoUrl(rawUrl);
      if (parsed) {
        videoId = parsed.id;
        platform = parsed.platform;
      }
    }

    if (videoId) {
      this.loadVideo(videoId, platform);
    } else {
      this.loadHome();
    }
  }

  loadHome() {
    this.state.currentVideo = null;
    this.state.currentPlatform = null;
    this.stopTimer();
    
    this.elements.playerLoaded.classList.add('hidden');
    this.elements.playerEmpty.classList.remove('hidden');
    
    // Clear iframe container
    this.elements.playerContainer.innerHTML = '';
    
    // Remove query params from address bar without page reload
    window.history.pushState({}, document.title, window.location.pathname);
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

    return null;
  }

  handleSearchSubmit(e) {
    e.preventDefault();
    const url = this.elements.videoInput.value;
    const parsed = this.parseVideoUrl(url);

    if (parsed) {
      this.elements.videoInput.value = '';
      
      // Update browser URL
      const newUrl = `${window.location.pathname}?v=${parsed.id}&p=${parsed.platform}`;
      window.history.pushState({ v: parsed.id, p: parsed.platform }, '', newUrl);
      
      this.loadVideo(parsed.id, parsed.platform);
    } else {
      this.showToast('Invalid URL. Please enter a valid YouTube, Vimeo, or Dailymotion link.', 'alert-triangle');
    }
  }

  // ==========================================
  // VIDEO LOADING & PLAYERS
  // ==========================================

  async loadVideo(id, platform) {
    this.stopTimer();
    this.state.currentPlatform = platform;
    this.state.personalLoops = 0;
    this.state.loopSeconds = 0;
    
    // Clear previous iframes
    this.elements.playerContainer.innerHTML = '';
    
    // Show Loaded State
    this.elements.playerEmpty.classList.add('hidden');
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
    }

    // Add to loop history (if signed in)
    this.addToHistory(id, platform, videoTitle);
    
    // Increment global play count (but loops starts after 2nd play)
    this.incrementGlobalPlayCount(id, platform);
    
    this.startTimer();
    this.showToast(`Now looping: ${this.truncateString(videoTitle, 35)}`);
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
    this.elements.playerContainer.appendChild(playerDiv);

    const setupPlayer = () => {
      this.state.players.youtube = new YT.Player('yt-player-target', {
        height: '100%',
        width: '100%',
        videoId: id,
        playerVars: {
          'autoplay': 1,
          'loop': 0, // We control looping manually to track counts accurately
          'playlist': id,
          'controls': 1,
          'rel': 0,
          'modestbranding': 1,
          'origin': window.location.origin
        },
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
      this.renderTrendsTab();
    }

    // Refresh UI stats
    this.updateStatsUI();

    // Show looping toast
    this.showToast(`Loop count: ${this.state.personalLoops}!`, 'refresh-cw');
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
    this.elements.personalLoopCount.textContent = this.state.personalLoops;

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
    this.elements.globalLoopCount.textContent = this.formatNumber(globalLoops);
    this.elements.globalPlayCount.textContent = this.formatNumber(globalPlays);
  }

  // ==========================================
  // PLAYBACK TIMER
  // ==========================================

  startTimer() {
    this.stopTimer();
    this.state.loopSeconds = 0;
    this.elements.loopTimer.textContent = "Session time: 00:00";
    
    this.state.loopTimer = setInterval(() => {
      this.state.loopSeconds++;
      const mins = Math.floor(this.state.loopSeconds / 60).toString().padStart(2, '0');
      const secs = (this.state.loopSeconds % 60).toString().padStart(2, '0');
      this.elements.loopTimer.textContent = `Session time: ${mins}:${secs}`;
    }, 1000);
  }

  stopTimer() {
    if (this.state.loopTimer) {
      clearInterval(this.state.loopTimer);
      this.state.loopTimer = null;
    }
  }

  // ==========================================
  // USER HISTORY & FAVORITES
  // ==========================================

  addToHistory(videoId, platform, title) {
    if (!this.state.user) return; // History only tracked for logged in users

    const history = this.getDb('history');
    const recordIndex = history.findIndex(h => h.videoId === videoId && h.platform === platform && h.userId === this.state.user.id);
    
    if (recordIndex !== -1) {
      // Update existing record's last played date (keeps loop counts)
      history[recordIndex].lastPlayed = new Date().toISOString();
      // Move to top of history
      const record = history.splice(recordIndex, 1)[0];
      history.unshift(record);
    } else {
      // Create new record (starts with 0 loops, loop count increments when loop completes)
      history.unshift({
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId: this.state.user.id,
        videoId: videoId,
        platform: platform,
        title: title,
        loopsCount: 0,
        lastPlayed: new Date().toISOString()
      });
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
    this.state.activeTab = tabId;
    
    // Toggle active classes on tab buttons
    this.elements.tabDiscoverBtn.classList.toggle('active', tabId === 'discover');
    this.elements.tabFavoritesBtn.classList.toggle('active', tabId === 'favorites');
    this.elements.tabHistoryBtn.classList.toggle('active', tabId === 'history');
    this.elements.tabTrendsBtn.classList.toggle('active', tabId === 'trends');
    
    // Toggle active classes on panels
    this.elements.tabDiscover.classList.toggle('active', tabId === 'discover');
    this.elements.tabFavorites.classList.toggle('active', tabId === 'favorites');
    this.elements.tabHistory.classList.toggle('active', tabId === 'history');
    this.elements.tabTrends.classList.toggle('active', tabId === 'trends');
    
    // Update data if needed when switching
    if (tabId === 'favorites') this.renderFavoritesTab();
    if (tabId === 'history') this.renderHistoryTab();
  }

  showTab(tabId) {
    this.switchTab(tabId);
    // Open user dropdown if menu is open
    if (this.elements.userMenu) {
      this.elements.userMenu.classList.add('hidden');
    }
  }

  renderDiscoverTab() {
    // Standard recommended videos
    const discoverVideos = [
      { id: '-rKIx5Kf3_I', platform: 'youtube', title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)' },
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
  // MOCK AUTHENTICATION CONTROLLER
  // ==========================================

  openLoginModal() {
    this.elements.loginModal.classList.remove('hidden');
    this.elements.authOptions.classList.remove('hidden');
    this.elements.authLoading.classList.add('hidden');
  }

  closeLoginModal() {
    this.elements.loginModal.classList.add('hidden');
  }

  toggleUserMenu(e) {
    e.stopPropagation();
    this.elements.userMenu.classList.toggle('hidden');
  }

  handleSocialLogin(provider) {
    this.elements.authOptions.classList.add('hidden');
    this.elements.authLoading.classList.remove('hidden');
    this.elements.authLoadingText.textContent = `Connecting to ${provider}...`;
    
    // Simulate API calls
    setTimeout(() => {
      this.elements.authLoadingText.textContent = `Authenticating your account...`;
    }, 800);

    setTimeout(() => {
      // Mock user generation
      let mockName = "Guest User";
      let mockEmail = "guest@example.com";
      let avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80"; // sleek mock face
      
      if (provider === 'Google') {
        mockName = "Alex Mercer";
        mockEmail = "alex.mercer@gmail.com";
        avatar = "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=80";
      } else if (provider === 'Facebook') {
        mockName = "Sarah Jenkins";
        mockEmail = "sarah.j@facebook.com";
        avatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80";
      } else if (provider === 'GitHub') {
        mockName = "code_ninja";
        mockEmail = "ninja@github.com";
        avatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";
      }

      const mockUser = {
        id: 'usr_' + provider.toLowerCase() + '_' + Date.now(),
        name: mockName,
        email: mockEmail,
        avatar: avatar,
        provider: provider
      };

      this.state.user = mockUser;
      localStorage.setItem('wor_session', JSON.stringify(mockUser));
      
      // Update DB of registered users
      const users = this.getDb('users');
      if (!users.some(u => u.email === mockUser.email)) {
        users.push(mockUser);
        this.saveDb('users', users);
      }

      // Close modal & notify
      this.closeLoginModal();
      this.updateUserUI();
      this.showToast(`Logged in successfully via ${provider}! Welcome, ${mockName}.`, 'shield-check');
      
      // Reload video if loaded to sync favorite UI and create user record in history
      if (this.state.currentVideo) {
        this.addToHistory(this.state.currentVideo.id, this.state.currentVideo.platform, this.state.currentVideo.title);
        this.updateFavoriteButtonUI();
        this.updateStatsUI();
      }

      // Switch to discover
      this.switchTab(this.state.activeTab);

    }, 2000);
  }

  handleEmailLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) return;

    this.elements.authOptions.classList.add('hidden');
    this.elements.authLoading.classList.remove('hidden');
    this.elements.authLoadingText.textContent = "Verifying account credentials...";

    setTimeout(() => {
      this.elements.authLoadingText.textContent = "Syncing your loop data...";
    }, 800);

    setTimeout(() => {
      // Resolve nickname from email (e.g. alex from alex@gmail.com)
      let username = email.split('@')[0];
      // Capitalize first letter
      username = username.charAt(0).toUpperCase() + username.slice(1);

      // Check if user already exists in DB to restore Premium or other details
      const users = this.getDb('users');
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      let mockUser;
      if (existingUser) {
        mockUser = { ...existingUser };
      } else {
        // Create new user record
        mockUser = {
          id: 'usr_email_' + Date.now(),
          name: username,
          email: email,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
          provider: 'Email',
          isPremium: false
        };
        users.push(mockUser);
        this.saveDb('users', users);
      }

      this.state.user = mockUser;
      localStorage.setItem('wor_session', JSON.stringify(mockUser));

      // Reset form
      emailInput.value = '';
      passwordInput.value = '';

      // Close modal & notify
      this.closeLoginModal();
      this.updateUserUI();
      this.showToast(`Logged in successfully! Welcome, ${username}.`, 'shield-check');

      // Reload video if loaded to sync favorite UI and create user record in history
      if (this.state.currentVideo) {
        this.addToHistory(this.state.currentVideo.id, this.state.currentVideo.platform, this.state.currentVideo.title);
        this.updateFavoriteButtonUI();
        this.updateStatsUI();
      }

      // Switch to discover
      this.switchTab(this.state.activeTab);

    }, 2000);
  }

  handleLogout() {
    localStorage.removeItem('wor_session');
    this.state.user = null;
    
    this.updateUserUI();
    this.showToast("Signed out successfully.");
    
    if (this.state.currentVideo) {
      this.updateFavoriteButtonUI();
      this.updateStatsUI();
    }
    
    // Switch to discover tab to avoid displaying empty panels
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
    lucide.createIcons();
  }

  updateAdsVisibility(isPremium) {
    const ads = document.querySelectorAll('.ad-slot');
    ads.forEach(ad => {
      if (isPremium) {
        ad.classList.add('hidden');
      } else {
        ad.classList.remove('hidden');
      }
    });
  }

  simulateBuyPremium() {
    if (!this.state.user) {
      this.showToast("Please sign in first to upgrade to Premium!", "lock");
      this.openLoginModal();
      return;
    }

    const confirmUpgrade = confirm("Would you like to upgrade to WatchOnRepeat Premium for a mock fee of $2.99? This will disable all advertisements permanently.");
    if (!confirmUpgrade) return;

    this.state.user.isPremium = true;
    localStorage.setItem('wor_session', JSON.stringify(this.state.user));
    
    // Update in users db list
    const users = this.getDb('users');
    const dbUser = users.find(u => u.email === this.state.user.email);
    if (dbUser) {
      dbUser.isPremium = true;
      this.saveDb('users', users);
    }

    this.updateUserUI();
    this.showToast("Thank you for your support! Ads have been disabled.", "crown");
  }

  // ==========================================
  // SIMULATED COMMUNITY ACTIVITY
  // ==========================================

  startGlobalActivitySimulator() {
    // Every 12 seconds, simulate some global background activity
    setInterval(() => {
      const globalStats = JSON.parse(localStorage.getItem('wor_global_stats') || '{}');
      const keys = Object.keys(globalStats);
      if (keys.length === 0) return;

      // Pick a random video
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const stat = globalStats[randomKey];
      
      // Increment loops and plays
      const additionalLoops = Math.floor(Math.random() * 4) + 1; // 1 to 4 loops
      stat.globalLoops += additionalLoops;
      stat.globalPlays += additionalLoops + (Math.random() > 0.5 ? 1 : 0);
      
      this.saveDb('global_stats', globalStats);

      // If this video is currently loaded, update UI
      if (this.state.currentVideo && 
          this.state.currentVideo.id === stat.id && 
          this.state.currentVideo.platform === stat.platform) {
        this.updateStatsUI();
      }

      // Update Trends panel
      this.renderTrendsTab();

      // Occasionally trigger a community notification toast (15% chance)
      if (Math.random() < 0.15) {
        const mockNames = ["retro_runner", "lofi_girl", "dj_repeat", "mariah_fan", "john_d", "coding_music", "chill_out"];
        const randomUser = mockNames[Math.floor(Math.random() * mockNames.length)];
        this.showToast(`Community: '${randomUser}' just repeated '${this.truncateString(stat.title, 25)}' - ${stat.globalLoops} total loops!`, 'users');
      }

    }, 15000);
  }

  // ==========================================
  // SHARING
  // ==========================================

  shareVideo() {
    const video = this.state.currentVideo;
    if (!video) return;

    // Generate local share link
    const shareUrl = `${window.location.origin}${window.location.pathname}?v=${video.id}&p=${video.platform}`;
    
    // Write to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.showToast("Copied watch link to clipboard!", "clipboard-check");
    }).catch(err => {
      this.showToast("Could not copy link automatically.", "alert-circle");
    });
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
}

// Instantiate and initialize
const app = new WatchOnRepeat();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
