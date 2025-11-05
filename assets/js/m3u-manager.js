/**
 * M3U Manager - Parses M3U playlist files and manages channel data
 *
 * Features:
 * - Parse M3U8/M3U playlist files
 * - Extract channel metadata (name, logo, group, stream URL)
 * - localStorage caching with 24-hour expiry
 * - Auto-refresh on cache invalidation
 * - Support for EPG data (tvg-id, tvg-name, tvg-logo)
 */

class M3UManager {
  constructor(config = {}) {
    this.config = {
      cacheExpiry: config.cacheExpiry || 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      basePath: config.basePath || './assets/data/m3u-sources/',
      enableCache: config.enableCache !== false, // Cache enabled by default
      debug: config.debug || false
    };

    this.cache = this.loadCacheFromStorage();
    this.packageMapping = {
      'english': { file: 'english.m3u', products: ['English TV (IPTV)', 'English TV Box'] },
      'france': { file: 'france.m3u', products: ['France TV', 'France TV Box'] },
      'german': { file: 'german.m3u', products: ['German TV', 'German TV Box'] },
      'italy': { file: 'italy.m3u', products: ['Italy TV', 'Italy TV Box'] },
      'latin': { file: 'latin.m3u', products: ['Latin TV', 'Latin TV Box'] },
      'scandinavia': { file: 'scandinavia.m3u', products: ['Scandinavia TV', 'Scandinavia TV Box'] },
      'india': { file: 'india.m3u', products: ['India TV', 'India TV Box'] },
      'netherlands': { file: 'netherlands.m3u', products: ['Netherlands TV', 'Netherlands TV Box'] },
      'world': { file: 'world.m3u', products: ['World TV', 'World TV Box'] }
    };

    this.log('M3U Manager initialized', this.config);
  }

  /**
   * Main method to get channels for a package
   * @param {string} packageName - Package identifier (e.g., 'english', 'france')
   * @param {boolean} forceRefresh - Force refresh from M3U file
   * @returns {Promise<Array>} Array of channel objects
   */
  async getChannels(packageName, forceRefresh = false) {
    this.log(`Getting channels for package: ${packageName}`);

    // Normalize package name
    packageName = packageName.toLowerCase();

    // Check if package exists
    if (!this.packageMapping[packageName]) {
      throw new Error(`Unknown package: ${packageName}`);
    }

    // Check cache first
    if (!forceRefresh && this.config.enableCache) {
      const cached = this.getFromCache(packageName);
      if (cached) {
        this.log(`Returning cached data for ${packageName}`, cached);
        return cached;
      }
    }

    // Fetch and parse M3U file
    const m3uFile = this.packageMapping[packageName].file;
    const channels = await this.fetchAndParse(m3uFile);

    // Save to cache
    if (this.config.enableCache) {
      this.saveToCache(packageName, channels);
    }

    return channels;
  }

  /**
   * Fetch M3U file and parse its contents
   * @param {string} filename - M3U filename
   * @returns {Promise<Array>} Parsed channels
   */
  async fetchAndParse(filename) {
    try {
      const url = `${this.config.basePath}${filename}`;
      this.log(`Fetching M3U from: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const content = await response.text();
      return this.parseM3U(content);
    } catch (error) {
      console.error(`Error fetching M3U file ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Parse M3U playlist content
   * @param {string} content - M3U file content
   * @returns {Array} Array of channel objects
   */
  parseM3U(content) {
    this.log('Parsing M3U content');

    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    const channels = [];
    let currentChannel = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines and comments (except EXTINF)
      if (!line || (line.startsWith('#') && !line.startsWith('#EXTINF'))) {
        continue;
      }

      if (line.startsWith('#EXTINF')) {
        // Parse channel metadata
        currentChannel = this.parseEXTINF(line);
      } else if (currentChannel && (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp'))) {
        // This is the stream URL
        currentChannel.url = line;
        currentChannel.id = this.generateChannelId(currentChannel);
        channels.push(currentChannel);
        currentChannel = null; // Reset for next channel
      }
    }

    this.log(`Parsed ${channels.length} channels`);
    return channels;
  }

  /**
   * Parse EXTINF line to extract channel metadata
   * @param {string} line - EXTINF line from M3U
   * @returns {Object} Channel metadata object
   */
  parseEXTINF(line) {
    const channel = {
      duration: -1,
      tvgId: '',
      tvgName: '',
      tvgLogo: '',
      groupTitle: 'Uncategorized',
      name: 'Unknown Channel'
    };

    // Extract attributes using regex
    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
    const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
    const groupTitleMatch = line.match(/group-title="([^"]*)"/);

    // Extract channel name (everything after the last comma)
    const nameMatch = line.match(/,(.+)$/);

    if (tvgIdMatch) channel.tvgId = tvgIdMatch[1];
    if (tvgNameMatch) channel.tvgName = tvgNameMatch[1];
    if (tvgLogoMatch) channel.tvgLogo = tvgLogoMatch[1];
    if (groupTitleMatch) channel.groupTitle = groupTitleMatch[1];
    if (nameMatch) channel.name = nameMatch[1].trim();

    return channel;
  }

  /**
   * Generate a unique ID for a channel
   * @param {Object} channel - Channel object
   * @returns {string} Unique channel ID
   */
  generateChannelId(channel) {
    if (channel.tvgId) {
      return channel.tvgId;
    }
    // Fallback: create ID from name
    return channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Get channels from cache
   * @param {string} packageName - Package identifier
   * @returns {Array|null} Cached channels or null
   */
  getFromCache(packageName) {
    const cacheKey = `m3u_${packageName}`;
    const cached = this.cache[cacheKey];

    if (!cached) {
      this.log(`No cache found for ${packageName}`);
      return null;
    }

    // Check if cache has expired
    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheExpiry) {
      this.log(`Cache expired for ${packageName}`);
      delete this.cache[cacheKey];
      this.saveCacheToStorage();
      return null;
    }

    this.log(`Cache hit for ${packageName}, age: ${Math.round((now - cached.timestamp) / 1000 / 60)} minutes`);
    return cached.data;
  }

  /**
   * Save channels to cache
   * @param {string} packageName - Package identifier
   * @param {Array} channels - Channel data
   */
  saveToCache(packageName, channels) {
    const cacheKey = `m3u_${packageName}`;
    this.cache[cacheKey] = {
      timestamp: Date.now(),
      data: channels
    };
    this.saveCacheToStorage();
    this.log(`Saved ${channels.length} channels to cache for ${packageName}`);
  }

  /**
   * Load cache from localStorage
   * @returns {Object} Cache object
   */
  loadCacheFromStorage() {
    if (typeof localStorage === 'undefined') {
      return {};
    }

    try {
      const stored = localStorage.getItem('m3u_cache');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading cache from localStorage:', error);
      return {};
    }
  }

  /**
   * Save cache to localStorage
   */
  saveCacheToStorage() {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('m3u_cache', JSON.stringify(this.cache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  }

  /**
   * Clear cache for a specific package or all packages
   * @param {string} packageName - Package identifier (optional)
   */
  clearCache(packageName = null) {
    if (packageName) {
      const cacheKey = `m3u_${packageName}`;
      delete this.cache[cacheKey];
      this.log(`Cleared cache for ${packageName}`);
    } else {
      this.cache = {};
      this.log('Cleared all cache');
    }
    this.saveCacheToStorage();
  }

  /**
   * Get channels grouped by category
   * @param {string} packageName - Package identifier
   * @returns {Promise<Object>} Channels grouped by category
   */
  async getChannelsByCategory(packageName) {
    const channels = await this.getChannels(packageName);
    const grouped = {};

    channels.forEach(channel => {
      const category = channel.groupTitle || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(channel);
    });

    return grouped;
  }

  /**
   * Get channel count for a package
   * @param {string} packageName - Package identifier
   * @returns {Promise<number>} Number of channels
   */
  async getChannelCount(packageName) {
    const channels = await this.getChannels(packageName);
    return channels.length;
  }

  /**
   * Search channels by name
   * @param {string} packageName - Package identifier
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching channels
   */
  async searchChannels(packageName, query) {
    const channels = await this.getChannels(packageName);
    const lowerQuery = query.toLowerCase();

    return channels.filter(channel =>
      channel.name.toLowerCase().includes(lowerQuery) ||
      channel.tvgName.toLowerCase().includes(lowerQuery) ||
      channel.groupTitle.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    const stats = {
      totalPackages: 0,
      cachedPackages: [],
      totalSize: 0,
      oldestCache: null,
      newestCache: null
    };

    Object.keys(this.cache).forEach(key => {
      if (key.startsWith('m3u_')) {
        stats.totalPackages++;
        const packageName = key.replace('m3u_', '');
        const cached = this.cache[key];

        stats.cachedPackages.push({
          package: packageName,
          channels: cached.data.length,
          timestamp: cached.timestamp,
          age: Math.round((Date.now() - cached.timestamp) / 1000 / 60) // age in minutes
        });

        if (!stats.oldestCache || cached.timestamp < stats.oldestCache) {
          stats.oldestCache = cached.timestamp;
        }
        if (!stats.newestCache || cached.timestamp > stats.newestCache) {
          stats.newestCache = cached.timestamp;
        }
      }
    });

    // Calculate approximate size
    try {
      stats.totalSize = new Blob([JSON.stringify(this.cache)]).size;
    } catch (e) {
      stats.totalSize = JSON.stringify(this.cache).length;
    }

    return stats;
  }

  /**
   * Log debug messages
   * @param {string} message - Log message
   * @param {*} data - Additional data
   */
  log(message, data = null) {
    if (this.config.debug) {
      console.log(`[M3U Manager] ${message}`, data || '');
    }
  }

  /**
   * Get list of available packages
   * @returns {Array} Package information
   */
  getAvailablePackages() {
    return Object.keys(this.packageMapping).map(key => ({
      id: key,
      file: this.packageMapping[key].file,
      products: this.packageMapping[key].products
    }));
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = M3UManager;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.M3UManager = M3UManager;
}
