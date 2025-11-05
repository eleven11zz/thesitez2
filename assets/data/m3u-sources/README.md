# M3U Sources Directory

This directory contains M3U playlist files for all 9 regional IPTV packages.

## 📁 File Structure

```
m3u-sources/
├── english.m3u          → Used by: English TV (IPTV), English TV Box
├── france.m3u           → Used by: France TV, France TV Box
├── german.m3u           → Used by: German TV, German TV Box
├── italy.m3u            → Used by: Italy TV, Italy TV Box
├── latin.m3u            → Used by: Latin TV, Latin TV Box
├── scandinavia.m3u      → Used by: Scandinavia TV, Scandinavia TV Box
├── india.m3u            → Used by: India TV, India TV Box
├── netherlands.m3u      → Used by: Netherlands TV, Netherlands TV Box
└── world.m3u            → Used by: World TV, World TV Box
```

## 🔄 How It Works

1. **Single Source of Truth**: Each M3U file serves 2 products (IPTV-only + TV Box bundle)
2. **Auto-Update**: When you replace an M3U file, both products automatically reflect changes
3. **Smart Caching**: Channel lists cached for 24 hours, then auto-refreshed
4. **No Manual Updates**: Channel list pages pull data directly from M3U files

## 🚀 Quick Start

### Step 1: Replace Sample M3U Files

The current M3U files contain **sample/placeholder data**. Replace them with your actual playlist URLs:

```bash
# Upload your real M3U files
cp /path/to/your/english.m3u ./english.m3u
cp /path/to/your/france.m3u ./france.m3u
# ... repeat for all 9 files
```

### Step 2: M3U File Format

Your M3U files should follow this format:

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="SkyPremierLeague.uk" tvg-name="Sky Sports Premier League" tvg-logo="https://example.com/logo.png" group-title="Sports",Sky Sports Premier League
http://your-stream-server.com/live/sky-premier-league/playlist.m3u8
#EXTINF:-1 tvg-id="BBCOne.uk" tvg-name="BBC One" tvg-logo="https://example.com/bbc-one.png" group-title="Entertainment",BBC One
http://your-stream-server.com/live/bbc-one/playlist.m3u8
```

**Required Fields:**
- `#EXTINF:-1` - Channel entry marker
- `tvg-name` - Channel display name
- `group-title` - Category (Sports, Entertainment, Movies, Kids, etc.)
- Stream URL - Must be on next line after EXTINF

**Optional Fields:**
- `tvg-id` - EPG identifier
- `tvg-logo` - Channel logo URL

### Step 3: Clear Cache (Optional)

After uploading new M3U files, clear the cache to see changes immediately:

```javascript
// Open browser console on your website and run:
const manager = new M3UManager({ debug: true });
manager.clearCache(); // Clear all package cache
// OR
manager.clearCache('english'); // Clear specific package
```

## 🔧 Using the M3U Manager

### Initialize

```javascript
const m3uManager = new M3UManager({
  basePath: './assets/data/m3u-sources/', // Path to M3U files
  cacheExpiry: 24 * 60 * 60 * 1000,       // 24 hours
  enableCache: true,                       // Enable caching
  debug: false                             // Debug logging
});
```

### Get Channels

```javascript
// Get all channels for a package
const channels = await m3uManager.getChannels('english');

// Force refresh (bypass cache)
const freshChannels = await m3uManager.getChannels('english', true);

// Get channels grouped by category
const grouped = await m3uManager.getChannelsByCategory('english');
// Returns: { "Sports": [...], "Entertainment": [...], "Movies": [...] }

// Get channel count
const count = await m3uManager.getChannelCount('english');

// Search channels
const results = await m3uManager.searchChannels('english', 'premier league');
```

### Channel Object Structure

```javascript
{
  id: "skysports-premier-league",
  name: "Sky Sports Premier League",
  tvgId: "SkyPremierLeague.uk",
  tvgName: "Sky Sports Premier League",
  tvgLogo: "https://example.com/logo.png",
  groupTitle: "Sports",
  url: "http://your-stream-server.com/live/sky-premier-league/playlist.m3u8",
  duration: -1
}
```

### Display Channels on Page

```javascript
// Example: Display channel list
const displayChannels = async () => {
  const manager = new M3UManager();
  const channels = await manager.getChannelsByCategory('english');

  Object.keys(channels).forEach(category => {
    console.log(`\n${category}:`);
    channels[category].forEach(ch => {
      console.log(`  - ${ch.name}`);
    });
  });
};

displayChannels();
```

### Cache Management

```javascript
// Get cache statistics
const stats = m3uManager.getCacheStats();
console.log(stats);
// Returns:
// {
//   totalPackages: 3,
//   cachedPackages: [
//     { package: 'english', channels: 120, timestamp: 1699..., age: 45 },
//     { package: 'france', channels: 95, timestamp: 1699..., age: 120 }
//   ],
//   totalSize: 45820,
//   oldestCache: 1699...,
//   newestCache: 1699...
// }

// Clear cache
m3uManager.clearCache();           // Clear all
m3uManager.clearCache('english');  // Clear specific package
```

## 📊 Integration with Channel List Pages

Your channel list pages (`/channel-lists/iptv/*.html`) automatically use the M3U Manager:

```html
<script src="/assets/js/m3u-manager.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const manager = new M3UManager({ debug: true });
    const packageName = 'english'; // Detected from page URL

    try {
      const channels = await manager.getChannelsByCategory(packageName);
      renderChannelList(channels);
    } catch (error) {
      console.error('Error loading channels:', error);
      showErrorMessage('Unable to load channel list');
    }
  });
</script>
```

## 🔒 Security Considerations

**Important**: The M3U files contain stream URLs. Consider:

1. **Access Control**: Restrict access to M3U directory via `.htaccess` or server config
2. **Token-Based URLs**: Use time-limited tokens in stream URLs
3. **Referrer Checking**: Validate requests come from your domain
4. **Rate Limiting**: Prevent abuse/scraping of M3U files

Example `.htaccess` for Apache:

```apache
# Block direct access to M3U files
<FilesMatch "\.(m3u|m3u8)$">
  Order Allow,Deny
  Deny from all
</FilesMatch>

# Allow access only from your domain
SetEnvIf Referer "^https://web\.tvmaster\.vip" allow_m3u
Order Deny,Allow
Deny from all
Allow from env=allow_m3u
```

## 🐛 Troubleshooting

### Issue: Channels not loading

**Solution:**
1. Check browser console for errors
2. Verify M3U file exists and is accessible
3. Check M3U file format is correct
4. Clear cache: `m3uManager.clearCache()`

### Issue: Old channels still showing

**Solution:**
- Cache hasn't expired yet (24h default)
- Force refresh: `m3uManager.getChannels('english', true)`
- Or clear cache: `m3uManager.clearCache('english')`

### Issue: Performance slow

**Solution:**
- Large M3U files (1000+ channels) may take time to parse
- Cache is working correctly to speed up subsequent loads
- Consider splitting into smaller regional files

## 📈 Performance Tips

1. **Optimize M3U Files**: Remove unnecessary metadata
2. **Use CDN**: Host logos on CDN for faster loading
3. **Enable Caching**: Keep 24-hour cache enabled
4. **Preload**: Load popular packages on homepage
5. **Lazy Load**: Load channel details on-demand

## 🔄 Update Workflow

```bash
# 1. Backup current M3U files
cp english.m3u english.m3u.backup

# 2. Upload new M3U file
# (Use FTP, Git, or your deployment tool)

# 3. Clear cache via browser console
# m3uManager.clearCache('english');

# 4. Verify changes on website
# Visit: /channel-lists/iptv/english.html
```

## 📝 Package Mapping

| Package ID    | M3U File           | Products                           |
|---------------|--------------------|------------------------------------|
| english       | english.m3u        | English TV (IPTV), English TV Box  |
| france        | france.m3u         | France TV, France TV Box           |
| german        | german.m3u         | German TV, German TV Box           |
| italy         | italy.m3u          | Italy TV, Italy TV Box             |
| latin         | latin.m3u          | Latin TV, Latin TV Box             |
| scandinavia   | scandinavia.m3u    | Scandinavia TV, Scandinavia TV Box |
| india         | india.m3u          | India TV, India TV Box             |
| netherlands   | netherlands.m3u    | Netherlands TV, Netherlands TV Box |
| world         | world.m3u          | World TV, World TV Box             |

## 🆘 Support

For issues or questions:
- Check browser console for error messages
- Enable debug mode: `new M3UManager({ debug: true })`
- Review M3U file format
- Contact: support@tvmaster.vip
