/**
 * SANCTUARY AUTHENTICATION & LOCK SCREEN MODULE
 * Private security gate for Laru & Sid's Romantic Sanctuary
 * Validates hidden passcode based on the present date (today) and anniversary milestone
 */

const SanctuaryAuth = {
  SESSION_KEY: 'larusid_sanctuary_unlocked',
  isUnlocked: false,

  init() {
    this.checkSession();
    this.bindEvents();
  },

  /**
   * Check if user is already unlocked in current session
   */
  checkSession() {
    const lockScreen = document.getElementById('sanctuary-lock-screen');
    if (!lockScreen) return;

    const savedState = sessionStorage.getItem(this.SESSION_KEY);
    if (savedState === 'true') {
      this.isUnlocked = true;
      lockScreen.style.display = 'none';
    } else {
      this.isUnlocked = false;
      lockScreen.style.display = 'flex';
      lockScreen.classList.remove('unlocked');
      // Auto-focus input after a tiny tick
      setTimeout(() => {
        const input = document.getElementById('sanctuary-passcode-input');
        if (input) input.focus();
      }, 300);
    }
  },

  /**
   * Generate list of valid present date & milestone date formats
   * Allows flexible, natural entry (e.g. DDMMYYYY, YYYY-MM-DD, DD/MM/YYYY, etc.)
   */
  getValidPasscodes() {
    const validCodes = new Set();

    // 1. DYNAMIC PRESENT DATE (Current Date / Today)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const shortYear = year.slice(-2);

    // Formats for present date
    validCodes.add(`${day}${month}${year}`);         // e.g. 12092026
    validCodes.add(`${day}-${month}-${year}`);       // e.g. 12-09-2026
    validCodes.add(`${day}/${month}/${year}`);       // e.g. 12/09/2026
    validCodes.add(`${day}.${month}.${year}`);       // e.g. 12.09.2026
    validCodes.add(`${year}-${month}-${day}`);       // e.g. 2026-09-12
    validCodes.add(`${year}${month}${day}`);         // e.g. 20260912
    validCodes.add(`${day}${month}`);               // e.g. 1209
    validCodes.add(`${day}${month}${shortYear}`);    // e.g. 120926
    validCodes.add(`${month}${day}${year}`);         // e.g. 09122026 (US format)
    validCodes.add(`${month}/${day}/${year}`);       // e.g. 09/12/2026

    // Month names (e.g., "12 September 2026", "12 Sep 2026")
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december'];
    const shortMonthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                             'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const curMonthName = monthNames[now.getMonth()];
    const curShortMonth = shortMonthNames[now.getMonth()];

    validCodes.add(`${day} ${curMonthName} ${year}`.toLowerCase());
    validCodes.add(`${day} ${curShortMonth} ${year}`.toLowerCase());
    validCodes.add(`${curMonthName} ${day} ${year}`.toLowerCase());
    validCodes.add(`${curMonthName} ${day}`.toLowerCase());

    // 2. MILESTONE / ANNIVERSARY DATE (The date present in the app: April 14, 2023)
    let annivStr = Storage.getString(APP_CONFIG.STORAGE_KEYS.ANNIVERSARY, APP_CONFIG.defaultAnniversary);
    if (annivStr) {
      const aDate = new Date(annivStr);
      if (!isNaN(aDate.getTime())) {
        const aDay = String(aDate.getDate()).padStart(2, '0');
        const aMonth = String(aDate.getMonth() + 1).padStart(2, '0');
        const aYear = String(aDate.getFullYear());
        const aShortYear = aYear.slice(-2);

        validCodes.add(`${aDay}${aMonth}${aYear}`);       // 14042023
        validCodes.add(`${aDay}-${aMonth}-${aYear}`);     // 14-04-2023
        validCodes.add(`${aDay}/${aMonth}/${aYear}`);     // 14/04/2023
        validCodes.add(`${aDay}.${aMonth}.${aYear}`);     // 14.04.2023
        validCodes.add(`${aYear}-${aMonth}-${aDay}`);     // 2023-04-14
        validCodes.add(`${aYear}${aMonth}${aDay}`);       // 20230414
        validCodes.add(`${aDay}${aMonth}`);               // 1404
        validCodes.add(`${aDay}${aMonth}${aShortYear}`);  // 140423
        validCodes.add('14042023');
        validCodes.add('2023-04-14');
        validCodes.add('14-04-2023');
        validCodes.add('14/04/2023');
      }
    }

    // 3. HARDCODED SECRETS & LITERAL STRINGS
    validCodes.add('presentdate');
    validCodes.add('present date');
    validCodes.add('**********');
    validCodes.add('password');
    validCodes.add('larusid');
    validCodes.add('laru&sid');

    return validCodes;
  },

  /**
   * Normalize input to compare cleanly
   */
  normalizeInput(raw) {
    if (!raw) return '';
    return raw.trim().toLowerCase();
  },

  /**
   * Verify entered passcode
   */
  verifyPasscode(input) {
    const clean = this.normalizeInput(input);
    if (!clean) return false;

    // Check exact matches
    const validCodes = this.getValidPasscodes();
    if (validCodes.has(clean)) return true;

    // Also check digits-only match (e.g. user typed 12/09/2026 or 12-09-2026)
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly && validCodes.has(digitsOnly)) return true;

    // If input is literal string of 4 or more asterisks (e.g. **********)
    if (/^\*+$/.test(clean) && clean.length >= 4) return true;

    return false;
  },

  /**
   * Unlock with romantic visual animation
   */
  unlock() {
    this.isUnlocked = true;
    sessionStorage.setItem(this.SESSION_KEY, 'true');

    const lockScreen = document.getElementById('sanctuary-lock-screen');
    const input = document.getElementById('sanctuary-passcode-input');
    const errorEl = document.getElementById('lock-error-msg');
    
    if (errorEl) {
      errorEl.textContent = 'Credentials verified. Retrieving evaluation records...';
      errorEl.className = 'lock-feedback success';
    }

    if (input) {
      input.blur();
    }

    // Trigger romantic hearts burst if particles active
    if (window.RomanticParticles) {
      for (let i = 0; i < 20; i++) {
        RomanticParticles.particles.push(RomanticParticles.createHeart(
          window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          window.innerHeight / 2 + (Math.random() - 0.5) * 100
        ));
      }
    }

    if (lockScreen) {
      lockScreen.classList.add('unlocked');
      setTimeout(() => {
        lockScreen.style.display = 'none';
        lockScreen.classList.remove('unlocked');
      }, 700);
    }
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
      // Trigger reflow to restart animation
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 600);
    }

    if (input) {
      input.select();
      input.focus();
    }
  },

  /**
   * Re-lock sanctuary manually
   */
  lock() {
    this.isUnlocked = false;
    sessionStorage.removeItem(this.SESSION_KEY);

    const lockScreen = document.getElementById('sanctuary-lock-screen');
    const input = document.getElementById('sanctuary-passcode-input');
    const errorEl = document.getElementById('lock-error-msg');

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.className = 'lock-feedback';
    }

    if (input) {
      input.value = '';
    }

    if (lockScreen) {
      lockScreen.style.display = 'flex';
      lockScreen.style.opacity = '0';
      // Trigger smooth fade in
      requestAnimationFrame(() => {
        lockScreen.style.transition = 'opacity 0.4s ease';
        lockScreen.style.opacity = '1';
      });
      setTimeout(() => {
        if (input) input.focus();
      }, 300);
    }
  },

  /**
   * Bind DOM event listeners
   */
  bindEvents() {
    const unlockBtn = document.getElementById('sanctuary-unlock-btn');
    const input = document.getElementById('sanctuary-passcode-input');
    const eyeBtn = document.getElementById('lock-password-toggle-btn');
    const hintBtn = document.getElementById('lock-hint-btn');
    const hintBox = document.getElementById('lock-hint-box');
    const relockBtn = document.getElementById('lock-sanctuary-btn');

    // Unlock button click
    if (unlockBtn && input) {
      unlockBtn.addEventListener('click', () => {
        const val = input.value;
        if (this.verifyPasscode(val)) {
          this.unlock();
        } else {
          this.triggerError();
        }
      });
    }

    // Enter key press in input
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = input.value;
          if (this.verifyPasscode(val)) {
            this.unlock();
          } else {
            this.triggerError();
          }
        }
      });
    }

    // Toggle password visibility (show/hide **********)
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
        this.lock();
      });
    }
  }
};
