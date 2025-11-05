/**
 * XMLTV EPG Parser
 * Fetches and parses XMLTV format EPG data
 */

class EPGParser {
  constructor(config) {
    this.config = config;
    this.channels = [];
    this.programmes = [];
    this.cache = null;
    this.cacheTime = null;
  }

  /**
   * Fetch EPG data from XMLTV source
   */
  async fetchEPG() {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        if (this.config.debug) console.log('Using cached EPG data');
        return { channels: this.channels, programmes: this.programmes };
      }

      if (this.config.debug) console.log('Fetching EPG from:', this.config.xmltvUrl);

      // Determine URL to fetch
      const fetchUrl = this.config.corsProxy
        ? this.config.corsProxy + this.config.xmltvUrl
        : this.config.xmltvUrl;

      // Fetch XML data
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();

      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error: ' + parserError.textContent);
      }

      // Parse channels and programmes
      this.channels = this.parseChannels(xmlDoc);
      this.programmes = this.parseProgrammes(xmlDoc);

      // Update cache
      if (this.config.cacheEnabled) {
        this.cacheTime = Date.now();
      }

      if (this.config.debug) {
        console.log(`Parsed ${this.channels.length} channels and ${this.programmes.length} programmes`);
      }

      return { channels: this.channels, programmes: this.programmes };

    } catch (error) {
      console.error('Error fetching EPG:', error);

      // If fetching fails, try to use fallback/sample data
      if (this.channels.length === 0) {
        if (this.config.debug) console.log('Using fallback sample data');
        return this.getSampleData();
      }

      throw error;
    }
  }

  /**
   * Parse channels from XMLTV
   */
  parseChannels(xmlDoc) {
    const channels = [];
    const channelElements = xmlDoc.querySelectorAll('channel');

    channelElements.forEach(channelEl => {
      const channel = {
        id: channelEl.getAttribute('id'),
        displayName: this.getElementText(channelEl, 'display-name'),
        icon: this.getElementAttribute(channelEl, 'icon', 'src'),
        category: this.determineCategory(channelEl)
      };

      channels.push(channel);
    });

    return channels;
  }

  /**
   * Parse programmes from XMLTV
   */
  parseProgrammes(xmlDoc) {
    const programmes = [];
    const programmeElements = xmlDoc.querySelectorAll('programme');

    programmeElements.forEach(progEl => {
      const programme = {
        channel: progEl.getAttribute('channel'),
        start: this.parseXMLTVTime(progEl.getAttribute('start')),
        stop: this.parseXMLTVTime(progEl.getAttribute('stop')),
        title: this.getElementText(progEl, 'title'),
        subTitle: this.getElementText(progEl, 'sub-title'),
        desc: this.getElementText(progEl, 'desc'),
        category: this.getElementText(progEl, 'category'),
        icon: this.getElementAttribute(progEl, 'icon', 'src'),
        rating: this.getElementText(progEl, 'rating'),
        starRating: this.getElementText(progEl, 'star-rating')
      };

      programmes.push(programme);
    });

    return programmes;
  }

  /**
   * Parse XMLTV time format (YYYYMMDDHHmmss +HHMM)
   */
  parseXMLTVTime(timeStr) {
    if (!timeStr) return null;

    try {
      // Format: 20250115120000 +0000
      const year = timeStr.substring(0, 4);
      const month = timeStr.substring(4, 6);
      const day = timeStr.substring(6, 8);
      const hour = timeStr.substring(8, 10);
      const minute = timeStr.substring(10, 12);
      const second = timeStr.substring(12, 14);

      const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      return new Date(dateStr);
    } catch (error) {
      console.error('Error parsing time:', timeStr, error);
      return null;
    }
  }

  /**
   * Get text content from XML element
   */
  getElementText(parent, tagName) {
    const element = parent.querySelector(tagName);
    return element ? element.textContent.trim() : '';
  }

  /**
   * Get attribute from XML element
   */
  getElementAttribute(parent, tagName, attrName) {
    const element = parent.querySelector(tagName);
    return element ? element.getAttribute(attrName) : '';
  }

  /**
   * Determine channel category based on name or genre
   */
  determineCategory(channelEl) {
    const displayName = this.getElementText(channelEl, 'display-name').toLowerCase();

    for (const [category, keywords] of Object.entries(this.config.categoryMap)) {
      for (const keyword of keywords) {
        if (displayName.includes(keyword)) {
          return category.toLowerCase();
        }
      }
    }

    return 'entertainment';
  }

  /**
   * Get programmes for a specific channel and time range
   */
  getProgrammesForChannel(channelId, startTime, endTime) {
    return this.programmes.filter(prog => {
      return prog.channel === channelId &&
             prog.start >= startTime &&
             prog.start < endTime;
    }).sort((a, b) => a.start - b.start);
  }

  /**
   * Get currently playing programme for a channel
   */
  getCurrentProgramme(channelId) {
    const now = new Date();
    return this.programmes.find(prog => {
      return prog.channel === channelId &&
             prog.start <= now &&
             prog.stop > now;
    });
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    if (!this.config.cacheEnabled || !this.cacheTime) return false;

    const age = (Date.now() - this.cacheTime) / 1000 / 60; // minutes
    return age < this.config.cacheDuration;
  }

  /**
   * Get sample/fallback data for demonstration
   */
  getSampleData() {
    const now = new Date();

    // Sample channels
    this.channels = [
      { id: 'bbc1', displayName: 'BBC One HD', icon: '', category: 'entertainment' },
      { id: 'skysports', displayName: 'Sky Sports Premier League', icon: '', category: 'sports' },
      { id: 'skymovies', displayName: 'Sky Cinema Premiere', icon: '', category: 'movies' },
      { id: 'discovery', displayName: 'Discovery Channel', icon: '', category: 'documentary' },
      { id: 'cartoonnet', displayName: 'Cartoon Network', icon: '', category: 'kids' },
      { id: 'bbcnews', displayName: 'BBC News HD', icon: '', category: 'news' },
      { id: 'espn', displayName: 'ESPN HD', icon: '', category: 'sports' },
      { id: 'hbo', displayName: 'HBO HD', icon: '', category: 'movies' }
    ];

    // Sample programmes
    this.programmes = [];

    this.channels.forEach(channel => {
      for (let hour = 0; hour < 24; hour++) {
        const startTime = new Date(now);
        startTime.setHours(hour, 0, 0, 0);

        const stopTime = new Date(startTime);
        stopTime.setHours(hour + 1);

        this.programmes.push({
          channel: channel.id,
          start: startTime,
          stop: stopTime,
          title: this.generateSampleTitle(channel.category, hour),
          subTitle: '',
          desc: this.generateSampleDescription(channel.category),
          category: channel.category,
          icon: '',
          rating: '',
          starRating: ''
        });
      }
    });

    if (this.config.debug) {
      console.log('Using sample data:', this.channels.length, 'channels,', this.programmes.length, 'programmes');
    }

    return { channels: this.channels, programmes: this.programmes };
  }

  /**
   * Generate sample programme title
   */
  generateSampleTitle(category, hour) {
    const titles = {
      sports: ['Premier League Live', 'NFL Game Day', 'NBA Tonight', 'Champions League', 'Tennis Masters'],
      movies: ['Action Thriller', 'Romantic Comedy', 'Sci-Fi Adventure', 'Drama Special', 'Horror Night'],
      entertainment: ['Talent Show', 'Reality TV', 'Game Show', 'Late Night Talk', 'Variety Special'],
      news: ['News at ' + hour + ':00', 'Breaking News', 'World News', 'Business Update', 'Weather Report'],
      kids: ['Cartoon Time', 'Kids Adventure', 'Animated Series', 'Family Fun', 'Junior Show'],
      documentary: ['Nature Documentary', 'History Special', 'Science Explained', 'Wild Life', 'Space Exploration']
    };

    const categoryTitles = titles[category] || titles.entertainment;
    return categoryTitles[hour % categoryTitles.length];
  }

  /**
   * Generate sample programme description
   */
  generateSampleDescription(category) {
    const descriptions = {
      sports: 'Live coverage of today\'s biggest sporting event with expert commentary and analysis.',
      movies: 'Award-winning feature film with incredible performances and stunning visuals.',
      entertainment: 'Join us for an evening of entertainment, laughter, and excitement.',
      news: 'The latest news, weather, and sports from around the world.',
      kids: 'Fun and educational programming for children of all ages.',
      documentary: 'Fascinating documentary exploring the wonders of our world.'
    };

    return descriptions[category] || descriptions.entertainment;
  }
}

// Export for use in main EPG script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EPGParser;
}
