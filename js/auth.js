class AuthMixin {
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

    const multiSegmentBadge = document.getElementById('multi-segment-upgrade-badge');
    if (multiSegmentBadge) {
      multiSegmentBadge.style.display = isPremium ? 'none' : 'inline-block';
    }

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
      this.openUpgradeModal("Advanced loop segments are a Premium feature.");
      return false;
    }
    return true;
  }

  simulateBuyPremium() {
    this.openUpgradeModal("Remove ads instantly with Premium.");
  }

  // ==========================================
}
window.AuthMixin = AuthMixin;
