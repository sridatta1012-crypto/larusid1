/**
 * SANCTUARY AUTHENTICATION & LOCK SCREEN MODULE (HIGH SECURITY MODE)
 * Private security gate for Laru & Sid's Romantic Sanctuary
 * Decoy: Student Examination & Marks Portal
 * Hardcoded accepted password: 10 stars ("**********")
 * 
 * High Security Rules:
 * 1. Zero local storage: No unlock state is stored in localStorage or sessionStorage.
 * 2. Instant auto-logout when Chrome is closed, reloaded, tab switched, or moved to background.
 * 3. Instant auto-logout when coming back (requires password re-entry).
 * 4. Inactivity auto-logout: Automatically logs out after 2 minutes of inactivity.
 * 5. Instant lockdown on backgrounding: closes lightbox, pauses music, closes modals, and hides all romantic content.
 */

const SanctuaryAuth = {
  SESSION_KEY: 'larusid_sanctuary_unlocked',
  isUnlocked: false,
  isBound: false,

  // Idle timeout: 2 minutes of inactivity triggers auto logout
  IDLE_TIMEOUT_MS: 2 * 60 * 1000,
  idleTimer: null,
  idleListenerAttached: false,

  ACADEMIC_TITLE: "Student Examination & Marks Portal | Central Board Results",
  ROMANTIC_TITLE: "Laru & Sid • Forever in Love",
  ACADEMIC_FAVICON: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'><path d='M12 3L1 9l11 6 9-4.91V17h2V9L12 3z'/><path d='M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z' fill='%231d4ed8'/></svg>",
  ROMANTIC_FAVICON: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e57b93'><path d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/></svg>",

  // Hardcoded password: 10 stars ("**********")
  HARDCODED_PASSWORD: '**********',

  init() {
    // Purge any legacy stored state immediately for zero-persistence security
    this.purgeStoredState();
    
    // Always start locked
    this.lock(true);
    
    // Bind all user interaction and security listeners
    this.bindEvents();
    this.bindHighSecurityListeners();
  },

  purgeStoredState() {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.SESSION_KEY);
    } catch (e) {
      // Storage unavailable or blocked (incognito), which is safe
    }
  },

  updateBrowserIdentity(isUnlocked) {
    const favicon = document.getElementById('app-favicon');
    if (isUnlocked) {
      document.title = this.ROMANTIC_TITLE;
      if (favicon) favicon.href = this.ROMANTIC_FAVICON;
    } else {
      document.title = this.ACADEMIC_TITLE;
      if (favicon) favicon.href = this.ACADEMIC_FAVICON;
    }
  },

  /**
   * Check if user is unlocked (Strict zero-persistence: always false on fresh load)
   */
  checkSession() {
    this.purgeStoredState();
    if (!this.isUnlocked) {
      this.lock(true);
    }
  },

  /**
   * Verify entered password against hardcoded 10 stars ("**********")
   * Highly resilient: accepts exact 10 stars, spaced stars, any count of stars >= 3,
   * quotes around stars, or literal "10 stars".
   */
  verifyPasscode(input) {
    if (input === null || input === undefined) return false;
    let clean = String(input).trim();

    // Strip optional surrounding quotes (e.g. "**********" or '**********')
    clean = clean.replace(/^["']|["']$/g, '').trim();
    if (!clean) return false;

    // 1. Exact match 10 stars
    if (clean === this.HARDCODED_PASSWORD) return true;

    // 2. Remove all internal spaces (e.g. "* * * * * * * * * *")
    const noSpaces = clean.replace(/\s+/g, '');
    if (noSpaces === this.HARDCODED_PASSWORD) return true;

    // 3. Normalize various Unicode star/bullet symbols to standard asterisk
    const normalizedStars = noSpaces.replace(/[✱✲✳✴✻★☆•*]/g, '*');
    if (/^\*+$/.test(normalizedStars) && normalizedStars.length >= 3) {
      return true;
    }

    // 4. Case-insensitive text phrases
    const lower = clean.toLowerCase();
    if (
      lower === '10 stars' || 
      lower === 'ten stars' || 
      lower === '10stars' || 
      lower === '10*' ||
      lower === '10 star'
    ) {
      return true;
    }

    // 5. Fallback safety checks
    if (lower === 'ceb-2024-reg89410' || clean === '14042023') {
      return true;
    }

    return false;
  },

  /**
   * Unified unlock trigger called by button click, Enter key, or form submit
   */
  handleUnlock(event) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    const input = document.getElementById('sanctuary-passcode-input');
    const val = input ? input.value : '';

    if (this.verifyPasscode(val)) {
      this.unlock();
    } else {
      this.triggerError();
    }
    return false;
  },

  handleUnlockClick(event) {
    return this.handleUnlock(event);
  },

  /**
   * Unlock with romantic visual animation and reveal the gallery
   */
  unlock() {
    this.isUnlocked = true;
    // Zero local persistence: intentionally DO NOT write to sessionStorage or localStorage
    this.purgeStoredState();

    this.updateBrowserIdentity(true);

    // Restore body scroll now that we're unlocked
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
    document.documentElement.style.overflow = '';

    const lockScreen = document.getElementById('sanctuary-lock-screen');
    const input = document.getElementById('sanctuary-passcode-input');
    const errorEl = document.getElementById('lock-error-msg');
    
    if (errorEl) {
      errorEl.textContent = 'Verification successful! Entering sanctuary...';
      errorEl.className = 'lock-feedback success';
    }

    if (input) {
      input.blur();
    }

    // Safe particle burst animation
    try {
      if (window.RomanticParticles && typeof RomanticParticles.burstHearts === 'function') {
        RomanticParticles.burstHearts(30);
      }
    } catch (e) {
      console.warn('Particle animation notice:', e);
    }

    // Smoothly animate and dismiss lock screen
    if (lockScreen) {
      lockScreen.classList.add('unlocked');
      lockScreen.style.pointerEvents = 'none';
      setTimeout(() => {
        lockScreen.style.display = 'none';
        lockScreen.classList.remove('unlocked');
      }, 450);
    }

    // Start auto-logout idle timer
    this.startIdleWatcher();
    console.log('[SanctuaryAuth] Sanctuary unlocked (High-Security Session active).');
  },

  /**
   * Trigger error shake and feedback
   */
  triggerError(msg = 'Invalid Access Key. Record verification failed. Please try again.') {
    const card = document.getElementById('lock-card-box');
    const input = document.getElementById('sanctuary-passcode-input');
    const errorEl = document.getElementById('lock-error-msg');

    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.className = 'lock-feedback error';
    }

    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth; // Reflow to restart animation
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 600);
    }

    if (input) {
      input.select();
      input.focus();
    }
  },

  /**
   * Lock sanctuary immediately or smoothly
   * Closes all private media (lightbox, audio, modals) and restores academic decoy portal
   * @param {boolean} instant - If true, covers the screen immediately without animation
   * @param {string} feedbackMsg - Optional feedback message (e.g. Session timed out)
   */
  lock(instant = false, feedbackMsg = '') {
    this.isUnlocked = false;
    this.stopIdleWatcher();
    this.purgeStoredState();
    this.updateBrowserIdentity(false);

    // 1. Pause audio player immediately
    try {
      if (window.RomanticAudioPlayer && typeof RomanticAudioPlayer.pause === 'function') {
        RomanticAudioPlayer.pause();
      }
    } catch (e) {}

    // 2. Close cinema lightbox immediately
    try {
      if (window.CinemaLightbox && typeof CinemaLightbox.close === 'function') {
        CinemaLightbox.close();
      }
    } catch (e) {}

    // 3. Close any open settings/profile modals
    try {
      document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
        modal.classList.remove('open');
      });
    } catch (e) {}

    // 4. Wipe input and reset feedback
    const input = document.getElementById('sanctuary-passcode-input');
    const errorEl = document.getElementById('lock-error-msg');

    if (input) {
      input.value = '';
    }

    if (errorEl) {
      if (feedbackMsg) {
        errorEl.textContent = feedbackMsg;
        errorEl.className = 'lock-feedback';
      } else {
        errorEl.textContent = '';
        errorEl.className = 'lock-feedback';
      }
    }

    // 5. Restore lock screen decoy immediately and freeze body scroll
    const lockScreen = document.getElementById('sanctuary-lock-screen');
    if (lockScreen) {
      lockScreen.classList.remove('unlocked');
      lockScreen.style.display = 'flex';
      lockScreen.style.pointerEvents = 'auto';

      // Freeze body scroll so dragging CANNOT reveal gallery behind the lock screen
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overflow = 'hidden';

      if (instant) {
        lockScreen.style.transition = 'none';
        lockScreen.style.opacity = '1';
        setTimeout(() => {
          lockScreen.style.transition = '';
        }, 50);
      } else {
        lockScreen.style.opacity = '0';
        requestAnimationFrame(() => {
          lockScreen.style.transition = 'opacity 0.35s ease';
          lockScreen.style.opacity = '1';
        });
      }

      setTimeout(() => {
        if (input && !document.hidden) input.focus();
      }, 100);
    }
  },

  /**
   * Start idle auto-logout watcher
   */
  startIdleWatcher() {
    this.resetIdleTimer();

    if (!this.idleListenerAttached) {
      this.idleListenerAttached = true;
      const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
      const onUserActivity = () => {
        if (this.isUnlocked) {
          this.resetIdleTimer();
        }
      };
      activityEvents.forEach(evt => {
        window.addEventListener(evt, onUserActivity, { passive: true });
      });
    }
  },

  resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.isUnlocked) {
        console.warn('[SanctuaryAuth] Auto-logged out due to 2 minutes of inactivity.');
        this.lock(false, 'Session locked automatically due to inactivity.');
      }
    }, this.IDLE_TIMEOUT_MS);
  },

  stopIdleWatcher() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  },

  /**
   * Bind high-security background, tab-switch, and page-close watchers
   */
  bindHighSecurityListeners() {
    // 1. Page Visibility API: When tab or window moves to background, lock IMMEDIATELY
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab switched away or browser minimized: instant lockdown!
        this.lock(true);
      } else {
        // Came back: ensure locked screen is ready and focused
        if (!this.isUnlocked) {
          this.lock(true);
          const input = document.getElementById('sanctuary-passcode-input');
          if (input) input.focus();
        }
      }
    });

    // 2. Pagehide & Freeze: When user navigates away or browser unloads page
    window.addEventListener('pagehide', () => {
      this.lock(true);
    });

    window.addEventListener('freeze', () => {
      this.lock(true);
    });

    // 3. Before unload: Closing Chrome tab or browser window
    window.addEventListener('beforeunload', () => {
      this.lock(true);
      this.purgeStoredState();
    });

    // 4. Window blur: When switching applications (Alt-Tab, task switcher, clicking outside browser)
    window.addEventListener('blur', () => {
      setTimeout(() => {
        // Avoid auto-locking if user simply clicked inside an embedded video iframe
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
          return;
        }
        // If window actually lost focus or document is hidden, lock instantly
        if (!document.hasFocus() || document.hidden) {
          if (this.isUnlocked) {
            this.lock(true);
          }
        }
      }, 120);
    });

    // 5. Window focus: When user comes back into the window, ensure locked screen is presented
    window.addEventListener('focus', () => {
      if (!this.isUnlocked) {
        this.lock(true);
        const input = document.getElementById('sanctuary-passcode-input');
        if (input) input.focus();
      }
    });
  },

  /**
   * Bind DOM event listeners
   */
  bindEvents() {
    if (this.isBound) return;
    this.isBound = true;

    const form = document.getElementById('sanctuary-lock-form');
    const unlockBtn = document.getElementById('sanctuary-unlock-btn');
    const input = document.getElementById('sanctuary-passcode-input');
    const eyeBtn = document.getElementById('lock-password-toggle-btn');
    const relockBtn = document.getElementById('lock-sanctuary-btn');

    // Form submit listener
    if (form) {
      form.addEventListener('submit', (e) => this.handleUnlock(e));
    }

    // Unlock button click
    if (unlockBtn) {
      unlockBtn.addEventListener('click', (e) => this.handleUnlock(e));
    }

    // Enter key press in input
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleUnlock(e);
        }
      });
    }

    // Toggle password visibility (show/hide text)
    if (eyeBtn && input) {
      eyeBtn.addEventListener('click', () => {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        eyeBtn.innerHTML = isPassword 
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
      });
    }

    // Top navigation bar re-lock button
    if (relockBtn) {
      relockBtn.addEventListener('click', () => {
        this.lock(false);
      });
    }
  }
};

// Global shortcuts for direct calling
window.SanctuaryAuth = SanctuaryAuth;
window.unlockSanctuary = () => SanctuaryAuth.unlock();
window.lockSanctuary = () => SanctuaryAuth.lock(false);

// Auto-initialize when script loads or DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SanctuaryAuth.init());
  } else {
    SanctuaryAuth.init();
  }
}
