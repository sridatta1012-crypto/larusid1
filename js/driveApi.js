/**
 * GOOGLE DRIVE API v3 SERVICE
 * Fetches and streams photos & videos directly from Google Drive Folders and all Subfolders
 */

const DriveAPI = {
  /**
   * Extract clean folder ID from direct ID or any Google Drive URL format
   */
  extractFolderId(input) {
    if (!input) return '';
    input = input.trim();
    
    // Check if input is a URL containing /folders/
    const folderMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) {
      return folderMatch[1];
    }

    // Check query param id=
    const idMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }

    // Otherwise if it looks like a clean alphanumeric drive ID
    if (/^[a-zA-Z0-9_-]{15,}$/.test(input)) {
      return input;
    }

    return input;
  },

  /**
   * Get active API Key from storage or default
   */
  getApiKey() {
    return Storage.getString(APP_CONFIG.STORAGE_KEYS.API_KEY, APP_CONFIG.defaultApiKey);
  },

  /**
   * Get active Folder ID from storage or default
   */
  getFolderId() {
    return Storage.getString(APP_CONFIG.STORAGE_KEYS.FOLDER_ID, APP_CONFIG.defaultFolderId);
  },

  /**
   * Builds high-res, video embed, and thumbnail CDN links for a Google Drive file ID
   */
  getImageUrls(fileId, isVideo, originalThumbnail) {
    const highRes = `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
    const medium = `https://lh3.googleusercontent.com/d/${fileId}=w800`;
    
    // For images, lh3 /d/ link provides high-speed CDN without token expiry.
    // For videos, Google Drive provides an authentic generated video snapshot in originalThumbnail.
    let thumb = isVideo 
      ? (originalThumbnail || `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`)
      : `https://lh3.googleusercontent.com/d/${fileId}=w600`;

    const download = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const videoEmbed = `https://drive.google.com/file/d/${fileId}/preview`;

    return {
      highRes: isVideo ? thumb : highRes,
      medium,
      thumb,
      fallbackThumb: originalThumbnail || `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
      download,
      videoEmbed
    };
  },

  /**
   * Smartly extracts the authentic capture date from metadata or filename patterns
   * (e.g. IMG-20260823-WA..., Screenshot_2025-10-31..., IMG20251110151907...)
   */
  extractBestDate(file) {
    if (!file) return new Date().toISOString();

    // 1. Try camera EXIF metadata
    if (file.imageMediaMetadata?.time) {
      return file.imageMediaMetadata.time;
    }
    if (file.videoMediaMetadata?.time) {
      return file.videoMediaMetadata.time;
    }

    const name = file.name || '';

    // 2. Try WhatsApp format: IMG-20260823-WA... or VID-20260111-WA...
    const waMatch = name.match(/(?:IMG|VID)[-_](\d{4})(\d{2})(\d{2})[-_]/i);
    if (waMatch) {
      return `${waMatch[1]}-${waMatch[2]}-${waMatch[3]}T12:00:00Z`;
    }

    // 3. Try Screenshot format: Screenshot_2025-10-31-00-08-12-84...
    const ssMatch = name.match(/Screenshot[-_](\d{4})[-_](\d{2})[-_](\d{2})[-_](\d{2})[-_](\d{2})[-_](\d{2})/i);
    if (ssMatch) {
      return `${ssMatch[1]}-${ssMatch[2]}-${ssMatch[3]}T${ssMatch[4]}:${ssMatch[5]}:${ssMatch[6]}Z`;
    }
    const ssSimple = name.match(/Screenshot[-_](\d{4})[-_](\d{2})[-_](\d{2})/i);
    if (ssSimple) {
      return `${ssSimple[1]}-${ssSimple[2]}-${ssSimple[3]}T12:00:00Z`;
    }

    // 4. Try Camera/InShot timestamp: IMG_20251115_210518 or VID20251112132309 or InShot_20251209_211919
    const camMatch = name.match(/(\d{4})(\d{2})(\d{2})[-_]?(\d{2})(\d{2})(\d{2})/);
    if (camMatch) {
      return `${camMatch[1]}-${camMatch[2]}-${camMatch[3]}T${camMatch[4]}:${camMatch[5]}:${camMatch[6]}Z`;
    }

    // 5. Try any YYYY-MM-DD
    const dateMatch = name.match(/(\d{4})[-_.](\d{2})[-_.](\d{2})/);
    if (dateMatch) {
      return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T12:00:00Z`;
    }

    // 6. Fallback to Drive createdTime
    return file.createdTime || file.modifiedTime || new Date().toISOString();
  },

  /**
   * Format ISO date string into readable romantic date (e.g. "April 14, 2024")
   */
  formatDate(dateStr) {
    if (!dateStr) return 'A beautiful day';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * Format Year & Month (e.g. "April 2024")
   */
  formatYearMonth(dateStr) {
    if (!dateStr) return 'Timeless Memories';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Timeless';
    }
  },

  /**
   * Validate connection to Google Drive folder
   */
  async testConnection(folderId, apiKey) {
    const cleanFolderId = this.extractFolderId(folderId);
    const key = apiKey || this.getApiKey();

    if (!cleanFolderId) {
      throw new Error('Please enter a Google Drive Folder ID or URL.');
    }
    if (!key) {
      throw new Error('Google Drive API Key is required.');
    }

    const query = encodeURIComponent(`'${cleanFolderId}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=10&fields=files(id,name,mimeType)&key=${key}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      const message = data.error ? data.error.message : 'Failed to connect to Google Drive';
      if (response.status === 404) {
        throw new Error('Folder not found or API key is invalid.');
      } else if (response.status === 403) {
        throw new Error(`Access Denied: Please make sure your Google Drive folder is shared with "Anyone with the link can view". (${message})`);
      }
      throw new Error(message);
    }

    const files = data.files || [];
    const mediaCount = files.filter(f => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/')).length;
    const subfolderCount = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder').length;

    return {
      success: true,
      fileCount: mediaCount,
      subfolderCount: subfolderCount,
      folderId: cleanFolderId
    };
  },

  /**
   * Recursively fetch all photos, videos, and subfolders from Google Drive
   */
  async fetchPhotos(options = {}) {
    const folderId = options.folderId || this.getFolderId();
    const apiKey = options.apiKey || this.getApiKey();

    if (!folderId) {
      console.log('No Google Drive folder configured. Loading starter memories.');
      return null;
    }

    const rootFolderId = this.extractFolderId(folderId);
    const discoveredMedia = [];
    const discoveredAlbums = new Map(); // id -> { id, name }
    
    // Folder queue to traverse: [{ id, name, path }]
    const folderQueue = [{ id: rootFolderId, name: 'Main Album', path: '' }];
    const visitedFolders = new Set();
    const maxFoldersToCrawl = 25; // safety boundary

    try {
      while (folderQueue.length > 0 && visitedFolders.size < maxFoldersToCrawl) {
        const currentFolder = folderQueue.shift();
        if (visitedFolders.has(currentFolder.id)) continue;
        visitedFolders.add(currentFolder.id);

        let pageToken = '';
        const pageSize = 100;

        do {
          const query = encodeURIComponent(`'${currentFolder.id}' in parents and trashed = false`);
          let url = `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=${pageSize}&orderBy=createdTime%20desc&fields=nextPageToken,files(id,name,mimeType,thumbnailLink,webContentLink,createdTime,description,imageMediaMetadata,videoMediaMetadata,size)&key=${apiKey}`;
          
          if (pageToken) {
            url += `&pageToken=${pageToken}`;
          }

          const res = await fetch(url);
          const data = await res.json();

          if (!res.ok) {
            console.warn(`Error scanning folder ${currentFolder.name} (${currentFolder.id}):`, data.error);
            break;
          }

          const files = data.files || [];

          for (const file of files) {
            // Check if file is a subfolder
            if (file.mimeType === 'application/vnd.google-apps.folder') {
              if (!visitedFolders.has(file.id)) {
                folderQueue.push({
                  id: file.id,
                  name: file.name,
                  path: currentFolder.path ? `${currentFolder.path} / ${file.name}` : file.name
                });
                discoveredAlbums.set(file.id, { id: file.id, name: file.name });
              }
            } 
            // Check if file is an image or video
            else if (file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/')) {
              const isVideo = file.mimeType.startsWith('video/');
              const urls = this.getImageUrls(file.id, isVideo, file.thumbnailLink);
              const dateTaken = this.extractBestDate(file);
              const timestamp = new Date(dateTaken).getTime() || 0;

              const cleanName = (file.name || 'Cherished Memory')
                .replace(/\.(jpg|jpeg|png|webp|gif|heic|mp4|mov|avi|mkv|3gp)$/i, '')
                .replace(/[-_]/g, ' ');

              discoveredMedia.push({
                id: file.id,
                name: cleanName,
                caption: file.description || cleanName,
                mimeType: file.mimeType,
                isVideo: isVideo,
                date: dateTaken ? dateTaken.split('T')[0] : '',
                dateTimestamp: timestamp,
                formattedDate: this.formatDate(dateTaken),
                yearMonth: this.formatYearMonth(dateTaken),
                albumId: currentFolder.id,
                albumName: currentFolder.name,
                tag: isVideo ? 'Video' : (currentFolder.name !== 'Main Album' ? currentFolder.name : 'Photo'),
                url: isVideo ? urls.videoEmbed : urls.highRes,
                directPreview: isVideo ? urls.videoEmbed : urls.highRes,
                thumbnail: urls.thumb,
                fallbackThumbnail: urls.fallbackThumb,
                downloadUrl: urls.download,
                raw: file,
                isStarter: false
              });
            }
          }

          pageToken = data.nextPageToken || '';
        } while (pageToken && discoveredMedia.length < 500);
      }

      // Sort ALL media newest on top (newest date first)
      discoveredMedia.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));

      console.log(`Drive scan complete: Loaded ${discoveredMedia.length} media items across ${visitedFolders.size} folders, sorted newest on top.`);

      // Cache results in storage for instant subsequent reloads
      if (discoveredMedia.length > 0) {
        Storage.set(APP_CONFIG.STORAGE_KEYS.CACHED_PHOTOS, discoveredMedia);
      }

      return {
        media: discoveredMedia,
        albums: Array.from(discoveredAlbums.values())
      };
    } catch (err) {
      console.error('Error fetching Google Drive media recursively:', err);
      throw err;
    }
  }
};
