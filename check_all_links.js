#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// All language pages to check
const languagePages = [
  // English (root)
  'index.html',
  'blog.html',
  'channel-lists.html',
  'epg.html',
  'faq.html',
  'iptv-products.html',
  'tv-box-products.html',
  'sports/live.html',

  // German
  'de/blog.html',
  'de/channel-lists.html',
  'de/epg.html',
  'de/faq.html',
  'de/iptv-products.html',
  'de/tv-box-products.html',
  'de/sports/live.html',

  // French
  'fr/blog.html',
  'fr/channel-lists.html',
  'fr/epg.html',
  'fr/faq.html',
  'fr/iptv-products.html',
  'fr/tv-box-products.html',
  'fr/sports/live.html',

  // Italian
  'it/blog.html',
  'it/channel-lists.html',
  'it/epg.html',
  'it/faq.html',
  'it/iptv-products.html',
  'it/tv-box-products.html',
  'it/sports/live.html',

  // Dutch
  'nl/blog.html',
  'nl/channel-lists.html',
  'nl/epg.html',
  'nl/faq.html',
  'nl/iptv-products.html',
  'nl/tv-box-products.html',
  'nl/sports/live.html',

  // Norwegian
  'no/blog.html',
  'no/channel-lists.html',
  'no/epg.html',
  'no/faq.html',
  'no/iptv-products.html',
  'no/tv-box-products.html',
  'no/sports/live.html',

  // Swedish
  'sv/blog.html',
  'sv/channel-lists.html',
  'sv/epg.html',
  'sv/faq.html',
  'sv/iptv-products.html',
  'sv/tv-box-products.html',
  'sv/sports/live.html',

  // Thai
  'th/index.html',
  'th/blog.html',
  'th/channel-lists.html',
  'th/epg.html',
  'th/faq.html',
  'th/iptv-products.html',
  'th/tv-box-products.html',
  'th/sports/live.html',
];

const results = {
  totalPages: 0,
  totalLinks: 0,
  brokenLinks: [],
  missingFiles: [],
  warnings: [],
  success: []
};

function extractLinks(html) {
  const links = [];

  // Extract href from <a> tags
  const aTagRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = aTagRegex.exec(html)) !== null) {
    links.push({ type: 'HTML link', url: match[1] });
  }

  // Extract stylesheets
  const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = cssRegex.exec(html)) !== null) {
    links.push({ type: 'CSS', url: match[1] });
  }

  // Extract alternate version
  const altCssRegex = /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
  while ((match = altCssRegex.exec(html)) !== null) {
    links.push({ type: 'CSS', url: match[1] });
  }

  // Extract scripts
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = scriptRegex.exec(html)) !== null) {
    links.push({ type: 'JavaScript', url: match[1] });
  }

  // Extract images (sample only)
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgCount = 0;
  while ((match = imgRegex.exec(html)) !== null && imgCount < 20) {
    links.push({ type: 'Image', url: match[1] });
    imgCount++;
  }

  return links;
}

function normalizePath(link, currentFile) {
  // Skip external links, anchors, mailto, tel, javascript, data URIs
  if (link.startsWith('http://') || link.startsWith('https://') ||
      link.startsWith('#') || link.startsWith('mailto:') ||
      link.startsWith('tel:') || link.startsWith('javascript:') ||
      link.startsWith('data:')) {
    return null;
  }

  // Remove query strings and anchors
  link = link.split('?')[0].split('#')[0];
  if (!link) return null;

  // Get directory of current file
  const currentDir = path.dirname(currentFile);

  // Resolve relative path
  let resolvedPath = path.join(currentDir, link);

  // Normalize
  resolvedPath = path.normalize(resolvedPath);

  return resolvedPath;
}

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    results.missingFiles.push({
      file: filePath,
      error: 'File does not exist'
    });
    return false;
  }

  console.log(`${colors.cyan}Checking:${colors.reset} ${filePath}`);

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const links = extractLinks(content);

    let pageLinks = 0;
    let pageBroken = 0;

    links.forEach(item => {
      const { type, url } = item;

      results.totalLinks++;

      const normalized = normalizePath(url, filePath);
      if (normalized) {
        const targetPath = path.join(__dirname, normalized);
        if (!fs.existsSync(targetPath)) {
          results.brokenLinks.push({
            file: filePath,
            link: url,
            resolvedPath: normalized,
            type: type
          });
          pageBroken++;
        }
        pageLinks++;
      }
    });

    if (pageBroken > 0) {
      console.log(`  ${colors.red}✗ Found ${pageBroken} broken links${colors.reset}`);
    } else {
      console.log(`  ${colors.green}✓ All ${pageLinks} local links OK${colors.reset}`);
      results.success.push(filePath);
    }

    results.totalPages++;
    return true;

  } catch (error) {
    results.warnings.push({
      file: filePath,
      error: error.message
    });
    console.log(`  ${colors.yellow}⚠ Error parsing: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main execution
console.log(`${colors.blue}========================================${colors.reset}`);
console.log(`${colors.blue}Language Pages Link Checker${colors.reset}`);
console.log(`${colors.blue}========================================${colors.reset}\n`);

languagePages.forEach(page => {
  checkFile(page);
});

// Print summary
console.log(`\n${colors.blue}========================================${colors.reset}`);
console.log(`${colors.blue}Summary${colors.reset}`);
console.log(`${colors.blue}========================================${colors.reset}`);
console.log(`Total pages checked: ${results.totalPages}`);
console.log(`Total links checked: ${results.totalLinks}`);
console.log(`${colors.green}Pages with all links OK: ${results.success.length}${colors.reset}`);
console.log(`${colors.red}Broken links found: ${results.brokenLinks.length}${colors.reset}`);
console.log(`${colors.yellow}Missing files: ${results.missingFiles.length}${colors.reset}`);
console.log(`${colors.yellow}Parse warnings: ${results.warnings.length}${colors.reset}`);

if (results.missingFiles.length > 0) {
  console.log(`\n${colors.red}Missing Page Files:${colors.reset}`);
  results.missingFiles.forEach(item => {
    console.log(`  ${colors.red}✗${colors.reset} ${item.file}`);
  });
}

if (results.brokenLinks.length > 0) {
  console.log(`\n${colors.red}Broken Links by Type:${colors.reset}`);

  const byType = {};
  results.brokenLinks.forEach(item => {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item);
  });

  Object.keys(byType).sort().forEach(type => {
    console.log(`\n${colors.yellow}${type} (${byType[type].length}):${colors.reset}`);

    // Group by target for easier reading
    const byTarget = {};
    byType[type].forEach(item => {
      if (!byTarget[item.resolvedPath]) byTarget[item.resolvedPath] = [];
      byTarget[item.resolvedPath].push(item.file);
    });

    Object.keys(byTarget).forEach(target => {
      console.log(`  ${colors.red}✗${colors.reset} Missing: ${target}`);
      console.log(`    Referenced in ${byTarget[target].length} file(s):`);
      byTarget[target].slice(0, 5).forEach(file => {
        console.log(`      - ${file}`);
      });
      if (byTarget[target].length > 5) {
        console.log(`      ... and ${byTarget[target].length - 5} more`);
      }
    });
  });
}

if (results.warnings.length > 0) {
  console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
  results.warnings.forEach(item => {
    console.log(`  ${colors.yellow}⚠${colors.reset} ${item.file}: ${item.error}`);
  });
}

// Exit with error code if broken links found
if (results.brokenLinks.length > 0 || results.missingFiles.length > 0) {
  console.log(`\n${colors.red}Link check FAILED${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}All links OK!${colors.reset}`);
  process.exit(0);
}
