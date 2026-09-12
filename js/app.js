/**
 * APP INITIALIZATION & MODAL MANAGERS
 * Orchestrates Drive sync, couple settings, surprise memories, and themes
 */

const App = {
  activeMedia: [],
  activeAlbums: [],

  async init() {
    // 1. Initialize Subsystems & Security Gate
    if (window.SanctuaryAuth) {
      SanctuaryAuth.init();
    }
    LoveCounter.init();
    RomanticParticles.init();
    RomanticAudioPlayer.init();
    CinemaLightbox.init();
    PhotoGallery.init();

    // 2. Setup Theme & Particles Toggles
    this.initTheme();
    this.bindModals();
    this.bindHeroActions();

    // 3. Load Photos (from Drive or Starter Collection)
    await this.loadGallery();
  },

  initTheme() {
    const savedTheme = Storage.getString(APP_CONFIG.STORAGE_KEYS.THEME, 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = savedTheme === 'light' ? moonSvg : sunSvg;
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        Storage.setString(APP_CONFIG.STORAGE_KEYS.THEME, next);
        themeToggleBtn.innerHTML = next === 'light' ? moonSvg : sunSvg;
      });
    }

    const particlesToggleBtn = document.getElementById('particles-toggle-btn');
    if (particlesToggleBtn) {
      particlesToggleBtn.addEventListener('click', () => {
        const isEnabled = RomanticParticles.toggle();
        particlesToggleBtn.style.opacity = isEnabled ? '1' : '0.5';
      });
    }
  },

  async loadGallery() {
    PhotoGallery.renderLoadingSkeleton(8);

    const folderId = DriveAPI.getFolderId();
    const statusDot = document.getElementById('nav-status-dot');
    const statusText = document.getElementById('nav-status-text');

    if (folderId) {
      // Load and self-repair cached photos for instantaneous display
      const cached = Storage.get(APP_CONFIG.STORAGE_KEYS.CACHED_PHOTOS, null);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        this.activeMedia = cached.map(item => {
          // Self-heal any broken HMAC or legacy URLs from previous cache
          if (!item.fallbackThumbnail || (item.thumbnail && item.thumbnail.includes('=s600'))) {
            const urls = DriveAPI.getImageUrls(item.id, item.isVideo, item.raw?.thumbnailLink);
            item.thumbnail = urls.thumb;
            item.fallbackThumbnail = urls.fallbackThumb;
            item.url = item.isVideo ? urls.videoEmbed : urls.highRes;
          }
          // Ensure authentic date from filename or metadata is extracted
          if (!item.dateTimestamp) {
            const dateTaken = DriveAPI.extractBestDate(item.raw || { name: item.name, createdTime: item.date });
            item.dateTimestamp = new Date(dateTaken).getTime() || 0;
            item.formattedDate = DriveAPI.formatDate(dateTaken);
          }
          return item;
        });
        // Sort newest on top
        this.activeMedia.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));
        PhotoGallery.setPhotos(this.activeMedia, []);
      }

      // Fetch fresh photos & videos recursively from Google Drive API
      try {
        if (statusText) statusText.textContent = 'Syncing Drive & Subfolders...';
        const driveResult = await DriveAPI.fetchPhotos({ folderId });
        
        if (driveResult && driveResult.media && driveResult.media.length > 0) {
          this.activeMedia = driveResult.media;
          this.activeAlbums = driveResult.albums || [];
          PhotoGallery.setPhotos(this.activeMedia, this.activeAlbums);
          
          if (statusDot) {
            statusDot.className = 'status-dot';
          }
          if (statusText) {
            statusText.textContent = `Drive Connected (${this.activeMedia.length} items)`;
          }
        } else {
          this.fallbackToStarter('No images or videos found');
        }
      } catch (err) {
        console.warn('Could not load from Google Drive:', err);
        if (!this.activeMedia || this.activeMedia.length === 0) {
          this.fallbackToStarter(err.message);
        } else {
          if (statusText) statusText.textContent = 'Drive (Offline Cache)';
        }
      }
    } else {
      this.fallbackToStarter();
    }
  },

  fallbackToStarter(reason = '') {
    const statusDot = document.getElementById('nav-status-dot');
    const statusText = document.getElementById('nav-status-text');

    if (statusDot) {
      statusDot.className = 'status-dot demo';
    }
    if (statusText) {
      statusText.textContent = reason ? 'Demo Mode (Click to Connect)' : 'Demo Gallery (Connect Drive)';
    }

    this.activeMedia = APP_CONFIG.starterMemories;
    PhotoGallery.setPhotos(this.activeMedia, []);
  },

  bindModals() {
    // 1. Google Drive Settings Modal
    const openDriveBtn = document.getElementById('open-drive-modal-btn');
    const navStatusPill = document.getElementById('nav-status-pill');
    const driveModal = document.getElementById('drive-modal');
    const closeDriveBtn = document.getElementById('close-drive-modal-btn');
    const testDriveBtn = document.getElementById('test-drive-btn');
    const saveDriveBtn = document.getElementById('save-drive-btn');
    const disconnectDriveBtn = document.getElementById('disconnect-drive-btn');

    const folderInput = document.getElementById('drive-folder-input');
    const apiKeyInput = document.getElementById('drive-api-key-input');
    const driveStatusMsg = document.getElementById('drive-status-msg');

    const openDriveModal = () => {
      if (folderInput) folderInput.value = DriveAPI.getFolderId();
      if (apiKeyInput) apiKeyInput.value = DriveAPI.getApiKey();
      if (driveStatusMsg) {
        driveStatusMsg.textContent = '';
        driveStatusMsg.className = 'form-hint';
      }
      if (driveModal) driveModal.classList.add('open');
    };

    if (openDriveBtn) openDriveBtn.addEventListener('click', openDriveModal);
    if (navStatusPill) navStatusPill.addEventListener('click', openDriveModal);
    if (closeDriveBtn) closeDriveBtn.addEventListener('click', () => driveModal.classList.remove('open'));

    // Test Connection Button
    if (testDriveBtn) {
      testDriveBtn.addEventListener('click', async () => {
        const folderVal = folderInput.value.trim();
        const keyVal = apiKeyInput.value.trim();

        driveStatusMsg.textContent = 'Checking Google Drive folder and subfolders...';
        driveStatusMsg.style.color = 'var(--color-accent-gold)';

        try {
          const result = await DriveAPI.testConnection(folderVal, keyVal);
          driveStatusMsg.textContent = `Connection successful! Found ${result.fileCount} media items & ${result.subfolderCount} subfolders.`;
          driveStatusMsg.style.color = '#10b981';
        } catch (err) {
          driveStatusMsg.textContent = `Error: ${err.message}`;
          driveStatusMsg.style.color = '#ef4444';
        }
      });
    }

    // Save Drive Settings Button
    if (saveDriveBtn) {
      saveDriveBtn.addEventListener('click', async () => {
        const rawFolder = folderInput.value.trim();
        const rawKey = apiKeyInput.value.trim();

        const cleanFolderId = DriveAPI.extractFolderId(rawFolder);
        Storage.setString(APP_CONFIG.STORAGE_KEYS.FOLDER_ID, cleanFolderId);
        if (rawKey) {
          Storage.setString(APP_CONFIG.STORAGE_KEYS.API_KEY, rawKey);
        }

        driveModal.classList.remove('open');
        await this.loadGallery();
      });
    }

    // Disconnect Drive Button
    if (disconnectDriveBtn) {
      disconnectDriveBtn.addEventListener('click', () => {
        Storage.setString(APP_CONFIG.STORAGE_KEYS.FOLDER_ID, '');
        Storage.set(APP_CONFIG.STORAGE_KEYS.CACHED_PHOTOS, null);
        if (folderInput) folderInput.value = '';
        driveModal.classList.remove('open');
        this.fallbackToStarter();
      });
    }

    // 2. Couple Profile Modal
    const openProfileBtn = document.getElementById('open-profile-btn');
    const editDateBtn = document.getElementById('edit-date-btn');
    const profileModal = document.getElementById('profile-modal');
    const closeProfileBtn = document.getElementById('close-profile-modal-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');

    const partner1Input = document.getElementById('partner1-input');
    const partner2Input = document.getElementById('partner2-input');
    const anniversaryInput = document.getElementById('anniversary-input');

    const openProfileModal = () => {
      if (partner1Input) partner1Input.value = LoveCounter.getPartner1();
      if (partner2Input) partner2Input.value = LoveCounter.getPartner2();
      if (anniversaryInput) {
        const cur = LoveCounter.getAnniversary();
        anniversaryInput.value = cur ? cur.split('T')[0] : '2023-04-14';
      }
      if (profileModal) profileModal.classList.add('open');
    };

    if (openProfileBtn) openProfileBtn.addEventListener('click', openProfileModal);
    if (editDateBtn) editDateBtn.addEventListener('click', openProfileModal);
    if (closeProfileBtn) closeProfileBtn.addEventListener('click', () => profileModal.classList.remove('open'));

    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const p1 = partner1Input.value.trim() || APP_CONFIG.defaultPartner1;
        const p2 = partner2Input.value.trim() || APP_CONFIG.defaultPartner2;
        const date = anniversaryInput.value ? `${anniversaryInput.value}T00:00:00` : APP_CONFIG.defaultAnniversary;

        LoveCounter.saveProfile(p1, p2, date);
        profileModal.classList.remove('open');
      });
    }

    // 3. Surprise Memory Modal
    const surpriseModal = document.getElementById('surprise-modal');
    const closeSurpriseBtn = document.getElementById('close-surprise-modal-btn');
    if (closeSurpriseBtn) {
      closeSurpriseBtn.addEventListener('click', () => surpriseModal.classList.remove('open'));
    }

    // Close any modal on backdrop click
    [driveModal, profileModal, surpriseModal].forEach(modal => {
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });
  },

  bindHeroActions() {
    // Slideshow Button in Hero
    const heroSlideshowBtn = document.getElementById('hero-start-slideshow');
    if (heroSlideshowBtn) {
      heroSlideshowBtn.addEventListener('click', () => {
        if (this.activeMedia.length > 0) {
          CinemaLightbox.open(this.activeMedia, 0);
          CinemaLightbox.startSlideshow();
        }
      });
    }

    // Surprise Memory Button in Hero
    const surpriseBtn = document.getElementById('hero-surprise-btn');
    if (surpriseBtn) {
      surpriseBtn.addEventListener('click', () => this.showSurpriseMemory());
    }

    // Explore Memories button (scroll down)
    const exploreBtn = document.getElementById('hero-explore-btn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        const toolbar = document.getElementById('gallery-toolbar-section');
        if (toolbar) {
          toolbar.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  },

  showSurpriseMemory() {
    if (!this.activeMedia || this.activeMedia.length === 0) return;
    const randomIdx = Math.floor(Math.random() * this.activeMedia.length);
    const item = this.activeMedia[randomIdx];

    const modal = document.getElementById('surprise-modal');
    const imgEl = document.getElementById('surprise-img');
    const captionEl = document.getElementById('surprise-caption');
    const dateEl = document.getElementById('surprise-date');
    const openLightboxBtn = document.getElementById('surprise-open-lightbox-btn');

    if (imgEl) imgEl.src = item.thumbnail || item.url;
    if (captionEl) captionEl.textContent = item.caption || item.name;
    if (dateEl) {
      const albumInfo = item.albumName && item.albumName !== 'Main Album' ? ` • ${item.albumName}` : '';
      dateEl.textContent = `${item.formattedDate || item.date || 'A timeless moment'}${albumInfo}`;
    }

    if (openLightboxBtn) {
      openLightboxBtn.onclick = () => {
        modal.classList.remove('open');
        CinemaLightbox.open(this.activeMedia, randomIdx);
      };
    }

    if (modal) modal.classList.add('open');
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
