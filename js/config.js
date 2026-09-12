/**
 * CONFIGURATION & SAMPLE DATA
 * Couple Gallery - Laru & Sid
 */

const APP_CONFIG = {
  // Provided Google Drive API Key & Folder ID
  defaultApiKey: 'AIzaSyAhTmpcWpBIs-i_Wlke6RHon_l2oPIvP_Y',
  defaultFolderId: '148a0nRp4lMvXrERneAZiKtxtRt8Q2Gzb',

  // Couple Profile Defaults
  defaultPartner1: 'Laru',
  defaultPartner2: 'Sid',
  defaultAnniversary: '2023-04-14T00:00:00', // Default anniversary date (April 14, 2023)
  
  // Storage Keys
  STORAGE_KEYS: {
    API_KEY: 'larusid_gdrive_api_key',
    FOLDER_ID: 'larusid_gdrive_folder_id',
    PARTNER1: 'larusid_partner1',
    PARTNER2: 'larusid_partner2',
    ANNIVERSARY: 'larusid_anniversary',
    FAVORITES: 'larusid_favorites',
    NOTES: 'larusid_photo_notes',
    THEME: 'larusid_theme',
    PARTICLES_ENABLED: 'larusid_particles',
    CACHED_PHOTOS: 'larusid_cached_photos'
  },

  // Romantic Love Quotes to inspire
  romanticQuotes: [
    "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
    "Whatever our souls are made of, yours and mine are the same.",
    "I have found the one whom my soul loves.",
    "Every love story is beautiful, but ours is my favorite.",
    "Together is our favorite place to be.",
    "You are my today and all of my tomorrows.",
    "If I know what love is, it is because of you."
  ],

  // Aesthetic starter romantic memories (high-res photography of loving moments)
  starterMemories: [
    {
      id: 'starter-1',
      name: 'Golden Hour by the Ocean',
      caption: 'Walking hand in hand into the sunset',
      date: '2024-07-22',
      yearMonth: 'July 2024',
      tag: 'Vacation',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 1067,
      isStarter: true
    },
    {
      id: 'starter-2',
      name: 'Coffee & Morning Whispers',
      caption: 'Lazy Sunday mornings and endless laughter',
      date: '2024-09-08',
      yearMonth: 'September 2024',
      tag: 'Everyday Joy',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 1067,
      isStarter: true
    },
    {
      id: 'starter-3',
      name: 'Under the Starlit Sky',
      caption: 'Dancing under string lights till midnight',
      date: '2024-10-14',
      yearMonth: 'October 2024',
      tag: 'Date Night',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 2400,
      isStarter: true
    },
    {
      id: 'starter-4',
      name: 'Paris Rooftops in Autumn',
      caption: 'When we promised each other forever in France',
      date: '2024-11-03',
      yearMonth: 'November 2024',
      tag: 'Travel',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 2000,
      isStarter: true
    },
    {
      id: 'starter-5',
      name: 'Warm Sweaters & First Snow',
      caption: 'Warm hot chocolate and cold rosy cheeks',
      date: '2024-12-24',
      yearMonth: 'December 2024',
      tag: 'Winter',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 1067,
      isStarter: true
    },
    {
      id: 'starter-6',
      name: 'Secret Picnic in the Meadow',
      caption: 'Strawberries, acoustic tunes, and your smile',
      date: '2025-02-14',
      yearMonth: 'February 2025',
      tag: "Valentine's",
      url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 1067,
      isStarter: true
    },
    {
      id: 'starter-7',
      name: 'Roadtrip Playlist & Wildflowers',
      caption: 'Singing off-key with the windows rolled down',
      date: '2025-04-18',
      yearMonth: 'April 2025',
      tag: 'Adventure',
      url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 2400,
      isStarter: true
    },
    {
      id: 'starter-8',
      name: 'Candlelight & Anniversary Wine',
      caption: 'Celebrating our anniversary with heartfelt toasts',
      date: '2025-04-14',
      yearMonth: 'April 2025',
      tag: 'Anniversary',
      url: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1600&auto=format&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=600&auto=format&fit=crop',
      width: 1600,
      height: 1067,
      isStarter: true
    }
  ]
};

// Storage Helpers
const Storage = {
  get(key, defaultVal = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage quota or error:', e);
    }
  },
  getString(key, defaultVal = '') {
    return localStorage.getItem(key) || defaultVal;
  },
  setString(key, val) {
    localStorage.setItem(key, val);
  }
};
