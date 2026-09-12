/**
 * LOVE COUNTER & COUPLE PROFILE MODULE
 * Tracks live duration of love and updates anniversary countdown / milestones
 */

const LoveCounter = {
  timerInterval: null,

  init() {
    this.updateCoupleNames();
    this.startTicker();
    this.renderRandomQuote();
  },

  getPartner1() {
    return Storage.getString(APP_CONFIG.STORAGE_KEYS.PARTNER1, APP_CONFIG.defaultPartner1);
  },

  getPartner2() {
    return Storage.getString(APP_CONFIG.STORAGE_KEYS.PARTNER2, APP_CONFIG.defaultPartner2);
  },

  getAnniversary() {
    return Storage.getString(APP_CONFIG.STORAGE_KEYS.ANNIVERSARY, APP_CONFIG.defaultAnniversary);
  },

  updateCoupleNames() {
    const p1 = this.getPartner1();
    const p2 = this.getPartner2();
    
    // Update brand monogram with SVG heart
    const monogramEl = document.getElementById('brand-monogram');
    if (monogramEl) {
      monogramEl.innerHTML = `<span>${p1.charAt(0)}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin: 0 2px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg><span>${p2.charAt(0)}</span>`;
    }

    // Update nav brand
    const navNamesEl = document.getElementById('nav-names');
    if (navNamesEl) {
      navNamesEl.innerHTML = `${p1} <span>&</span> ${p2}`;
    }

    // Update Hero Title
    const heroNamesEl = document.getElementById('hero-couple-names');
    if (heroNamesEl) {
      heroNamesEl.textContent = `${p1} & ${p2}`;
    }

    // Update page title
    document.title = `${p1} & ${p2} • Forever in Love`;
  },

  startTicker() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.tick();
    this.timerInterval = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const annivStr = this.getAnniversary();
    const startDate = new Date(annivStr);
    const now = new Date();

    if (isNaN(startDate.getTime())) return;

    let diffMs = now - startDate;
    if (diffMs < 0) diffMs = 0; // if anniversary is in the future

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;

    const daysEl = document.getElementById('counter-days');
    const hoursEl = document.getElementById('counter-hours');
    const minutesEl = document.getElementById('counter-minutes');
    const secondsEl = document.getElementById('counter-seconds');

    if (daysEl) daysEl.textContent = totalDays.toLocaleString();
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

    // Human readable date below
    const annivDisplay = document.getElementById('anniversary-display');
    if (annivDisplay) {
      annivDisplay.textContent = startDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  },

  renderRandomQuote() {
    const quoteEl = document.getElementById('hero-quote-text');
    if (!quoteEl) return;
    const quotes = APP_CONFIG.romanticQuotes;
    const randomIdx = Math.floor(Math.random() * quotes.length);
    quoteEl.textContent = quotes[randomIdx];
  },

  saveProfile(p1, p2, anniversaryDate) {
    if (p1) Storage.setString(APP_CONFIG.STORAGE_KEYS.PARTNER1, p1.trim());
    if (p2) Storage.setString(APP_CONFIG.STORAGE_KEYS.PARTNER2, p2.trim());
    if (anniversaryDate) Storage.setString(APP_CONFIG.STORAGE_KEYS.ANNIVERSARY, anniversaryDate);

    this.updateCoupleNames();
    this.tick();
  }
};
