/**
 * CINEMA LIGHTBOX & SLIDESHOW VIEWER
 * Immersive viewing with photo zoom, full video playback, auto-advancing slideshow, notes, and favorite hearts
 */

const CinemaLightbox = {
  isOpen: false,
  currentIndex: 0,
  photos: [],
  isSlideshowActive: false,
  slideshowTimer: null,
  slideshowDuration: 4500,
  progressInterval: null,
  progressValue: 0,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const backdrop = document.getElementById('lightbox-modal');
    const closeBtn = document.getElementById('lightbox-close-btn');
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');
    const slideshowBtn = document.getElementById('lightbox-slideshow-btn');
    const favBtn = document.getElementById('lightbox-favorite-btn');
    const saveNoteBtn = document.getElementById('lightbox-save-note-btn');
    const noteInput = document.getElementById('lightbox-note-input');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());
    if (slideshowBtn) slideshowBtn.addEventListener('click', () => this.toggleSlideshow());
    if (favBtn) favBtn.addEventListener('click', () => this.toggleFavorite());
    
    if (saveNoteBtn && noteInput) {
      saveNoteBtn.addEventListener('click', () => this.saveCurrentNote());
      noteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.saveCurrentNote();
      });
    }

    // Backdrop click close (if clicking outside image/controls)
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop || e.target.id === 'lightbox-body-area') {
          this.close();
        }
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowRight') {
        this.next();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
      } else if (e.key === ' ') {
        // Prevent pause toggle if typing in note input
        if (document.activeElement === noteInput) return;
        e.preventDefault();
        this.toggleSlideshow();
      }
    });
  },

  open(photosList, startIndex = 0) {
    if (!photosList || photosList.length === 0) return;
    this.photos = photosList;
    this.currentIndex = Math.max(0, Math.min(startIndex, photosList.length - 1));
    this.isOpen = true;

    const modal = document.getElementById('lightbox-modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    this.renderCurrentItem();
  },

  close() {
    this.stopSlideshow();
    this.isOpen = false;

    // Reset video iframe src to stop audio playback
    const videoFrame = document.getElementById('lightbox-video-frame');
    if (videoFrame) videoFrame.src = '';

    const modal = document.getElementById('lightbox-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  renderCurrentItem() {
    if (!this.photos[this.currentIndex]) return;
    const item = this.photos[this.currentIndex];

    const imgEl = document.getElementById('lightbox-active-img');
    const videoContainer = document.getElementById('lightbox-video-container');
    const videoFrame = document.getElementById('lightbox-video-frame');
    const counterEl = document.getElementById('lightbox-counter');
    const titleEl = document.getElementById('lightbox-title');
    const dateEl = document.getElementById('lightbox-date');
    const noteInput = document.getElementById('lightbox-note-input');
    const favBtn = document.getElementById('lightbox-favorite-btn');
    const downloadBtn = document.getElementById('lightbox-download-btn');

    // Handle Photo vs Video
    if (item.isVideo) {
      if (imgEl) imgEl.style.display = 'none';
      if (videoContainer) videoContainer.style.display = 'block';
      if (videoFrame) {
        videoFrame.src = `https://drive.google.com/file/d/${item.id}/preview`;
      }
      // If slideshow is running and user reaches a video, pause slideshow
      if (this.isSlideshowActive) {
        this.stopSlideshow();
      }
    } else {
      if (videoContainer) {
        videoContainer.style.display = 'none';
      }
      if (videoFrame) {
        videoFrame.src = '';
      }
      if (imgEl) {
        imgEl.style.display = 'block';
        imgEl.referrerPolicy = 'no-referrer';
        imgEl.onerror = () => {
          imgEl.onerror = null;
          imgEl.src = item.thumbnail || `https://lh3.googleusercontent.com/d/${item.id}=w1200`;
        };
        imgEl.src = item.url;
        imgEl.alt = item.name || 'Memory photo';
      }
    }

    if (counterEl) {
      counterEl.textContent = `${this.currentIndex + 1} of ${this.photos.length} memories`;
    }

    if (titleEl) {
      titleEl.innerHTML = `${item.name || 'Cherished Memory'} ${item.isVideo ? '<span class="card-tag" style="margin-left: 8px;">Video</span>' : ''}`;
    }

    if (dateEl) {
      const albumInfo = item.albumName && item.albumName !== 'Main Album' ? ` • ${item.albumName}` : '';
      dateEl.textContent = `${item.formattedDate || item.date || 'Sweet moment'}${albumInfo}`;
    }

    // Load custom lover's note for this photo
    const notesMap = Storage.get(APP_CONFIG.STORAGE_KEYS.NOTES, {});
    if (noteInput) {
      noteInput.value = notesMap[item.id] || '';
    }

    // Check favorite status
    const favorites = Storage.get(APP_CONFIG.STORAGE_KEYS.FAVORITES, []);
    const isFav = favorites.includes(item.id);
    if (favBtn) {
      favBtn.classList.toggle('active', isFav);
      favBtn.innerHTML = isFav 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    }

    // Download link
    if (downloadBtn) {
      downloadBtn.href = item.downloadUrl || item.url;
      downloadBtn.download = `${item.name || 'memory'}.${item.isVideo ? 'mp4' : 'jpg'}`;
      downloadBtn.target = '_blank';
    }
  },

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.renderCurrentItem();
    if (this.isSlideshowActive) {
      this.resetSlideshowTimer();
    }
  },

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    this.renderCurrentItem();
    if (this.isSlideshowActive) {
      this.resetSlideshowTimer();
    }
  },

  toggleSlideshow() {
    if (this.isSlideshowActive) {
      this.stopSlideshow();
    } else {
      this.startSlideshow();
    }
  },

  startSlideshow() {
    this.isSlideshowActive = true;
    const btn = document.getElementById('lightbox-slideshow-btn');
    if (btn) {
      btn.classList.add('active');
      btn.title = 'Pause Slideshow (Space)';
    }
    this.resetSlideshowTimer();
  },

  resetSlideshowTimer() {
    if (this.slideshowTimer) clearTimeout(this.slideshowTimer);
    if (this.progressInterval) clearInterval(this.progressInterval);

    const progressBar = document.getElementById('slideshow-progress');
    this.progressValue = 0;
    if (progressBar) progressBar.style.width = '0%';

    const stepMs = 50;
    const increment = (stepMs / this.slideshowDuration) * 100;

    this.progressInterval = setInterval(() => {
      this.progressValue += increment;
      if (progressBar) {
        progressBar.style.width = `${Math.min(100, this.progressValue)}%`;
      }
    }, stepMs);

    this.slideshowTimer = setTimeout(() => {
      this.next();
    }, this.slideshowDuration);
  },

  stopSlideshow() {
    this.isSlideshowActive = false;
    if (this.slideshowTimer) clearTimeout(this.slideshowTimer);
    if (this.progressInterval) clearInterval(this.progressInterval);

    const btn = document.getElementById('lightbox-slideshow-btn');
    if (btn) {
      btn.classList.remove('active');
      btn.title = 'Start Slideshow (Space)';
    }

    const progressBar = document.getElementById('slideshow-progress');
    if (progressBar) progressBar.style.width = '0%';
  },

  toggleFavorite() {
    const item = this.photos[this.currentIndex];
    if (!item) return;

    let favorites = Storage.get(APP_CONFIG.STORAGE_KEYS.FAVORITES, []);
    const isFav = favorites.includes(item.id);

    if (isFav) {
      favorites = favorites.filter(id => id !== item.id);
    } else {
      favorites.push(item.id);
      this.showHeartBurst();
    }

    Storage.set(APP_CONFIG.STORAGE_KEYS.FAVORITES, favorites);

    const favBtn = document.getElementById('lightbox-favorite-btn');
    if (favBtn) {
      favBtn.classList.toggle('active', !isFav);
      favBtn.innerHTML = !isFav 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    }

    // Notify gallery to update heart status on cards
    if (window.PhotoGallery) {
      window.PhotoGallery.updateFavoritesUI();
    }
  },

  showHeartBurst() {
    const container = document.getElementById('lightbox-image-container');
    if (!container) return;

    const heart = document.createElement('div');
    heart.className = 'heart-burst';
    heart.innerHTML = `<svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    container.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 850);
  },

  saveCurrentNote() {
    const item = this.photos[this.currentIndex];
    const input = document.getElementById('lightbox-note-input');
    if (!item || !input) return;

    const note = input.value.trim();
    const notesMap = Storage.get(APP_CONFIG.STORAGE_KEYS.NOTES, {});

    if (note) {
      notesMap[item.id] = note;
    } else {
      delete notesMap[item.id];
    }

    Storage.set(APP_CONFIG.STORAGE_KEYS.NOTES, notesMap);

    // Subtle feedback
    const btn = document.getElementById('lightbox-save-note-btn');
    if (btn) {
      const origText = btn.textContent;
      btn.textContent = 'Saved!';
      setTimeout(() => { btn.textContent = origText; }, 1400);
    }
  }
};
