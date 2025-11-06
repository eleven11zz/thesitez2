/**
 * EPG Configuration
 * Configure your XMLTV feed URL and settings here
 */

const EPG_CONFIG = {
  // Your XMLTV feed URL
  // Replace with your actual credentials
  xmltvUrl: 'http://prov000014.rusher.cc/xmltv.php?username=jvT9D6gXuG56&password=rfcovP1ekdjh',

  // CORS proxy (if needed)
  // Use this if you get CORS errors when fetching directly
  // Option 1: Use a public CORS proxy (NOT recommended for production)
  corsProxy: 'https://corsproxy.io/?',  // Public CORS proxy

  // Option 2: Create your own proxy endpoint
  // proxyUrl: '/api/epg-proxy.php',

  // Refresh interval (in minutes) - increased to reduce re-fetching
  refreshInterval: 60,

  // Number of hours to show in timeline
  hoursToShow: 4, // Reduced from 6 to 4 for faster rendering

  // Time slot duration (in minutes)
  timeSlotDuration: 30,

  // Limit initial channels to render (performance optimization)
  maxChannelsToRender: 50, // Only render 50 channels initially

  // Enable virtual scrolling
  virtualScrolling: true,

  // Category mappings (map genres to categories)
  categoryMap: {
    'Sports': ['sports', 'football', 'soccer', 'basketball', 'baseball', 'hockey', 'tennis', 'golf', 'rugby', 'cricket', 'motorsport', 'f1'],
    'Movies': ['movie', 'film', 'cinema'],
    'Entertainment': ['entertainment', 'variety', 'game show', 'reality', 'talk show'],
    'News': ['news', 'current affairs', 'weather'],
    'Kids': ['kids', 'children', 'cartoon', 'animation', 'family'],
    'Music': ['music', 'concert', 'mtv'],
    'Documentary': ['documentary', 'nature', 'history', 'science', 'educational']
  },

  // Default channel logos (if not provided in XMLTV)
  defaultLogo: './assets/images/channel-placeholder.svg',

  // Enable debug logging
  debug: false, // Disabled for production performance

  // Cache settings - increased cache duration
  cacheEnabled: true,
  cacheDuration: 60 // Increased from 15 to 60 minutes
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EPG_CONFIG;
}
