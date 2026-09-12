/**
 * GALLERY CONTROLLER & VIEW RENDERERS
 * Handles Masonry, Polaroid Scrapbook, and Timeline Views
 * Supports Photos, Videos, and Subfolder/Album filtering
 */

const ICONS = {
  heartFilled: `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  heartOutline: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  play: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  folder: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>`
};

const PhotoGallery = {
  currentView: 'masonry', // 'masonry' | 'polaroid' | 'timeline'
  allPhotos: [],
  filteredPhotos: [],
  albums: [],
  activeFilter: 'all', // 'all' | 'photos' | 'videos' | 'favorites'
  activeAlbumId: 'all',
  sortOrder: 'newest', // 'newest' (new on top) | 'oldest'
  searchQuery: '',

  init() {
    this.bindControls();
    this.updateSortBtnUI();
  },

  bindControls() {
    // Sort Order Button (Newest First on top)
    const sortBtn = document.getElementById('sort-order-btn');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        this.sortOrder = this.sortOrder === 'newest' ? 'oldest' : 'newest';
        this.updateSortBtnUI();
        this.applyFilters();
      });
    }

    // View Switcher Buttons
    const viewButtons = document.querySelectorAll('.view-tab-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
      });
    });

    // Filter Buttons (All / Photos / Videos / Favorites)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.applyFilters();
      });
    });

    // Album Dropdown Filter
    const albumSelect = document.getElementById('album-select-filter');
    if (albumSelect) {
      albumSelect.addEventListener('change', (e) => {
        this.activeAlbumId = e.target.value;
        this.applyFilters();
      });
    }

    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilters();
      });
    }
  },

  setPhotos(photos, albums = []) {
    this.allPhotos = photos || [];
    this.albums = albums || [];
    this.updateAlbumFilterUI();
    this.applyFilters();
  },

  updateAlbumFilterUI() {
    const albumSelect = document.getElementById('album-select-filter');
    if (!albumSelect) return;

    if (!this.albums || this.albums.length === 0) {
      albumSelect.style.display = 'none';
      return;
    }

    albumSelect.style.display = 'inline-block';
    let optionsHtml = '<option value="all">All Folders</option>';
    this.albums.forEach(album => {
      optionsHtml += `<option value="${album.id}">${album.name}</option>`;
    });
    albumSelect.innerHTML = optionsHtml;
  },

  switchView(view) {
    if (this.currentView === view) return;
    this.currentView = view;

    const viewButtons = document.querySelectorAll('.view-tab-btn');
    viewButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    this.render();
  },

  applyFilters() {
    const favorites = Storage.get(APP_CONFIG.STORAGE_KEYS.FAVORITES, []);
    const notesMap = Storage.get(APP_CONFIG.STORAGE_KEYS.NOTES, {});

    this.filteredPhotos = this.allPhotos.filter(photo => {
      // Favorites filter
      if (this.activeFilter === 'favorites' && !favorites.includes(photo.id)) {
        return false;
      }

      // Media Type filter
      if (this.activeFilter === 'photos' && photo.isVideo) {
        return false;
      }
      if (this.activeFilter === 'videos' && !photo.isVideo) {
        return false;
      }

      // Album / Subfolder filter
      if (this.activeAlbumId !== 'all' && photo.albumId !== this.activeAlbumId) {
        return false;
      }

      // Search Query filter
      if (this.searchQuery) {
        const titleMatch = (photo.name || '').toLowerCase().includes(this.searchQuery);
        const captionMatch = (photo.caption || '').toLowerCase().includes(this.searchQuery);
        const albumMatch = (photo.albumName || '').toLowerCase().includes(this.searchQuery);
        const noteMatch = (notesMap[photo.id] || '').toLowerCase().includes(this.searchQuery);
        const dateMatch = (photo.formattedDate || photo.date || '').toLowerCase().includes(this.searchQuery);
        return titleMatch || captionMatch || albumMatch || noteMatch || dateMatch;
      }

      return true;
    });

    // Sort: Newest on top (or oldest if toggled)
    this.filteredPhotos.sort((a, b) => {
      const tA = a.dateTimestamp || (a.date ? new Date(a.date).getTime() : 0) || 0;
      const tB = b.dateTimestamp || (b.date ? new Date(b.date).getTime() : 0) || 0;
      return this.sortOrder === 'newest' ? (tB - tA) : (tA - tB);
    });

    // Update memory count label
    const countEl = document.getElementById('memory-count-label');
    if (countEl) {
      countEl.textContent = `${this.filteredPhotos.length} Items`;
    }

    this.render();
  },

  updateSortBtnUI() {
    const sortLabel = document.getElementById('sort-order-label');
    const sortBtn = document.getElementById('sort-order-btn');
    if (sortLabel) {
      sortLabel.textContent = this.sortOrder === 'newest' ? 'Newest First' : 'Oldest First';
    }
    if (sortBtn) {
      sortBtn.title = `Currently sorted by ${this.sortOrder === 'newest' ? 'newest' : 'oldest'} items on top (Click to toggle)`;
      sortBtn.classList.toggle('active', this.sortOrder === 'newest');
    }
  },

  render() {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    if (this.filteredPhotos.length === 0) {
      this.renderEmptyState(container);
      return;
    }

    switch (this.currentView) {
      case 'polaroid':
        this.renderPolaroidView(container);
        break;
      case 'timeline':
        this.renderTimelineView(container);
        break;
      case 'masonry':
      default:
        this.renderMasonryView(container);
        break;
    }
  },

  renderMasonryView(container) {
    const favorites = Storage.get(APP_CONFIG.STORAGE_KEYS.FAVORITES, []);
    let html = '<div class="masonry-grid">';

    this.filteredPhotos.forEach((photo, index) => {
      const isFav = favorites.includes(photo.id);
      const isEager = index < 12;
      const fallbackUrl = photo.fallbackThumbnail || `https://lh3.googleusercontent.com/d/${photo.id}=w600`;
      html += `
        <div class="masonry-item ${photo.isVideo ? 'is-video-card' : ''}" data-index="${index}">
          <div class="masonry-img-wrapper">
            <img 
              class="masonry-img" 
              src="${photo.thumbnail || photo.url}" 
              alt="${photo.name}" 
              loading="${isEager ? 'eager' : 'lazy'}" 
              decoding="async" 
              referrerpolicy="no-referrer" 
              data-id="${photo.id}" 
              onerror="if (!this.dataset.fallback) { this.dataset.fallback = '1'; this.src = '${fallbackUrl}'; }"
            />
            
            ${photo.isVideo ? `
              <div class="video-play-badge">
                ${ICONS.play}
                <span class="video-text">Video</span>
              </div>
            ` : ''}

            <button class="card-favorite-btn ${isFav ? 'active' : ''}" data-id="${photo.id}" title="Love this memory">
              ${isFav ? ICONS.heartFilled : ICONS.heartOutline}
            </button>
            <div class="masonry-overlay">
              <div class="card-title">${photo.name}</div>
              <div class="card-meta">
                <span>${photo.formattedDate || photo.date || 'Sweet Moment'}</span>
                ${photo.albumName && photo.albumName !== 'Main Album' ? `<span class="card-tag album-tag">${photo.albumName}</span>` : ''}
                ${photo.tag && !photo.isVideo ? `<span class="card-tag">${photo.tag}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
    this.attachCardEventListeners(container);
  },

  renderPolaroidView(container) {
    const favorites = Storage.get(APP_CONFIG.STORAGE_KEYS.FAVORITES, []);
    const notesMap = Storage.get(APP_CONFIG.STORAGE_KEYS.NOTES, {});
    let html = '<div class="polaroid-grid">';

    this.filteredPhotos.forEach((photo, index) => {
      const isFav = favorites.includes(photo.id);
      const isEager = index < 12;
      const fallbackUrl = photo.fallbackThumbnail || `https://lh3.googleusercontent.com/d/${photo.id}=w600`;
      const note = notesMap[photo.id] || photo.caption || photo.name;

      html += `
        <div class="polaroid-card ${photo.isVideo ? 'is-video-card' : ''}" data-index="${index}">
          <button class="card-favorite-btn ${isFav ? 'active' : ''}" data-id="${photo.id}" title="Love this memory">
            ${isFav ? ICONS.heartFilled : ICONS.heartOutline}
          </button>
          <div class="polaroid-img-frame">
            <img 
              class="polaroid-img" 
              src="${photo.thumbnail || photo.url}" 
              alt="${photo.name}" 
              loading="${isEager ? 'eager' : 'lazy'}" 
              decoding="async" 
              referrerpolicy="no-referrer" 
              data-id="${photo.id}" 
              onerror="if (!this.dataset.fallback) { this.dataset.fallback = '1'; this.src = '${fallbackUrl}'; }"
            />
            ${photo.isVideo ? `
              <div class="video-play-badge">
                ${ICONS.play}
              </div>
            ` : ''}
          </div>
          <div class="polaroid-caption-area">
            <div class="polaroid-caption">${note}</div>
            <div class="polaroid-date">
              ${photo.formattedDate || photo.date || 'Sweet moment'}
              ${photo.albumName && photo.albumName !== 'Main Album' ? ` • ${photo.albumName}` : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
    this.attachCardEventListeners(container);
  },

  renderTimelineView(container) {
    let html = '<div class="timeline-view">';

    this.filteredPhotos.forEach((photo, index) => {
      const isEager = index < 8;
      const fallbackUrl = photo.fallbackThumbnail || `https://lh3.googleusercontent.com/d/${photo.id}=w600`;
      html += `
        <div class="timeline-milestone">
          <div class="timeline-card" data-index="${index}">
            <div class="timeline-img-wrap" style="position: relative;">
              <img 
                src="${photo.thumbnail || photo.url}" 
                alt="${photo.name}" 
                loading="${isEager ? 'eager' : 'lazy'}" 
                decoding="async" 
                referrerpolicy="no-referrer" 
                data-id="${photo.id}" 
                onerror="if (!this.dataset.fallback) { this.dataset.fallback = '1'; this.src = '${fallbackUrl}'; }"
              />
              ${photo.isVideo ? `
                <div class="video-play-badge" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                  ${ICONS.play}
                  <span class="video-text">Video</span>
                </div>
              ` : ''}
            </div>
            <span class="timeline-date-badge">${photo.formattedDate || photo.date || 'Cherished Moment'}</span>
            <div class="timeline-title">${photo.name}</div>
            <p class="timeline-desc">
              ${photo.caption || 'A precious chapter in our love story.'}
              ${photo.albumName && photo.albumName !== 'Main Album' ? `<br/><small style="color: var(--color-accent-gold);">${photo.albumName}</small>` : ''}
            </p>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
    this.attachCardEventListeners(container);
  },

  attachCardEventListeners(container) {
    // Open Lightbox when card is clicked
    const cards = container.querySelectorAll('.masonry-item, .polaroid-card, .timeline-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-favorite-btn')) return;
        const index = parseInt(card.dataset.index, 10);
        CinemaLightbox.open(this.filteredPhotos, index);
      });
    });

    // Favorite heart button toggle on cards
    const favButtons = container.querySelectorAll('.card-favorite-btn');
    favButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const photoId = btn.dataset.id;
        this.toggleFavorite(photoId, btn);
      });
    });
  },

  toggleFavorite(photoId, buttonEl) {
    let favorites = Storage.get(APP_CONFIG.STORAGE_KEYS.FAVORITES, []);
    const isFav = favorites.includes(photoId);

    if (isFav) {
      favorites = favorites.filter(id => id !== photoId);
    } else {
      favorites.push(photoId);
    }

    Storage.set(APP_CONFIG.STORAGE_KEYS.FAVORITES, favorites);

    if (buttonEl) {
      buttonEl.classList.toggle('active', !isFav);
      buttonEl.innerHTML = !isFav ? ICONS.heartFilled : ICONS.heartOutline;
    }

    if (this.activeFilter === 'favorites') {
      this.applyFilters();
    }
  },

  updateFavoritesUI() {
    const favorites = Storage.get(APP_CONFIG.STORAGE_KEYS.FAVORITES, []);
    const favButtons = document.querySelectorAll('.card-favorite-btn');
    favButtons.forEach(btn => {
      const isFav = favorites.includes(btn.dataset.id);
      btn.classList.toggle('active', isFav);
      btn.innerHTML = isFav ? ICONS.heartFilled : ICONS.heartOutline;
    });

    if (this.activeFilter === 'favorites') {
      this.applyFilters();
    }
  },

  renderLoadingSkeleton(count = 8) {
    const container = document.getElementById('gallery-container');
    if (!container) return;

    let html = '<div class="masonry-grid">';
    for (let i = 0; i < count; i++) {
      html += '<div class="skeleton-card"></div>';
    }
    html += '</div>';
    container.innerHTML = html;
  },

  renderEmptyState(container) {
    container.innerHTML = `
      <div class="gallery-empty-state">
        <div class="empty-icon">${ICONS.heartOutline}</div>
        <div class="empty-title">No Memories Found</div>
        <p class="empty-subtitle">
          ${this.activeFilter === 'favorites' 
            ? "You haven't added any favorite photos or videos yet. Click the heart on any memory to save it here!" 
            : this.activeFilter === 'videos'
            ? "No videos found matching your search. Try another keyword!"
            : "No items matched your search. Try another romantic memory keyword!"}
        </p>
        ${this.activeFilter !== 'all' ? `
          <button class="btn-primary" onclick="PhotoGallery.resetFilters()">Show All Items</button>
        ` : ''}
      </div>
    `;
  },

  resetFilters() {
    this.activeFilter = 'all';
    this.activeAlbumId = 'all';
    this.searchQuery = '';
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const albumSelect = document.getElementById('album-select-filter');
    if (albumSelect) albumSelect.value = 'all';

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));

    this.applyFilters();
  }
};

window.PhotoGallery = PhotoGallery;
