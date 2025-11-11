# TVMaster VIP - Centralized SEO System

## Overview

This centralized SEO system streamlines metadata management, structured data, and multilingual content across all 8 language versions of TVMaster VIP.

## Directory Structure

```
thesitez2/
├── _config/
│   ├── languages.json          # Centralized language & SEO configuration
│   └── README.md               # This file
├── _includes/
│   ├── header.html             # Site header (existing)
│   ├── footer.html             # Site footer (existing)
│   ├── meta-tags.html          # Centralized meta tags partial
│   ├── schema-website.html     # WebSite schema
│   ├── schema-organization.html # Organization schema
│   ├── schema-article.html     # Article schema for blog posts
│   └── schema-breadcrumb.html  # Breadcrumb navigation schema
├── _templates/
│   └── blog-article-template.html  # Template for long-form blog articles
└── scripts/
    └── update-seo-metadata.py  # Automation script
```

## Quick Start

### 1. Update Metadata for All Pages

```bash
# Update all pages across all languages
python scripts/update-seo-metadata.py

# Preview changes without writing (dry run)
python scripts/update-seo-metadata.py --dry-run

# Update specific language
python scripts/update-seo-metadata.py --lang de

# Update specific page
python scripts/update-seo-metadata.py --page blog.html

# Update specific page in specific language
python scripts/update-seo-metadata.py --lang fr --page index.html
```

### 2. Create New Blog Article

```bash
# 1. Copy the template
cp _templates/blog-article-template.html blog/my-article.html

# 2. Replace placeholders with your content (see below)

# 3. Test the article locally

# 4. Translate and create versions for all 8 languages
```

## Configuration Guide

### languages.json Structure

The `_config/languages.json` file contains all language-specific metadata:

```json
{
  "languages": {
    "en": {
      "name": "English",
      "locale": "en_US",
      "hreflang": "en",
      "path": "",
      "seo": {
        "home": {
          "title": "Page title...",
          "description": "Page description...",
          "keywords": "keyword1, keyword2, keyword3",
          "og_title": "Open Graph title...",
          "og_description": "OG description..."
        },
        "blog": { ... },
        "faq": { ... }
      },
      "nav": { ... },
      "footer": { ... }
    },
    "de": { ... }
  }
}
```

### Adding New Page Type

1. Add page to `supported_pages` array in `languages.json`
2. Add SEO metadata for each language under `seo` key
3. Add page mapping to `PAGE_TYPE_MAP` in `update-seo-metadata.py`
4. Run update script

### Adding New Language

1. Add language object to `languages` in `languages.json`
2. Create directory for language (e.g., `/es/` for Spanish)
3. Copy all HTML files from English version
4. Run update script with new language code

## Blog Article Template

### Placeholder Reference

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{ARTICLE_TITLE}}` | Full article title | "Best IPTV Service 2025: Complete Guide" |
| `{{ARTICLE_META_DESCRIPTION}}` | SEO meta description (150-160 chars) | "Discover the best IPTV services..." |
| `{{ARTICLE_KEYWORDS}}` | Comma-separated keywords | "best IPTV 2025, IPTV service, streaming" |
| `{{ARTICLE_CANONICAL_URL}}` | Full canonical URL | "https://web.tvmaster.vip/blog/..." |
| `{{ARTICLE_SLUG}}` | URL slug | "best-iptv-2025" |
| `{{ARTICLE_EXCERPT}}` | Brief summary (1-2 sentences) | "Compare top IPTV providers..." |
| `{{ARTICLE_CATEGORY}}` | Category badge | "Guide" / "Tutorial" / "Comparison" |
| `{{ARTICLE_DATE_PUBLISHED}}` | ISO 8601 date | "2025-01-15T10:00:00+00:00" |
| `{{ARTICLE_DATE_MODIFIED}}` | ISO 8601 date | "2025-01-20T14:30:00+00:00" |
| `{{ARTICLE_DATE_DISPLAY}}` | Human-readable date | "Jan 15, 2025" |
| `{{ARTICLE_READ_TIME}}` | Estimated read time | "8" (minutes) |
| `{{ARTICLE_AUTHOR_NAME}}` | Author full name | "Sarah Mitchell" |
| `{{ARTICLE_AUTHOR_TITLE}}` | Author job title | "Senior IPTV Specialist" |
| `{{ARTICLE_AUTHOR_BIO}}` | Author bio (1-2 sentences) | "Sarah has 10 years..." |
| `{{ARTICLE_WORD_COUNT}}` | Total word count | 2150 |
| `{{ARTICLE_IMAGE_URL}}` | Featured image URL | "https://web.tvmaster.vip/assets/..." |
| `{{ARTICLE_TOPIC}}` | Main topic | "IPTV Services" |
| `{{ARTICLE_TAGS}}` | Comma-separated tags | "IPTV, streaming, guide" |
| `{{TABLE_OF_CONTENTS}}` | TOC HTML (li items) | See template example |
| `{{ARTICLE_CONTENT}}` | Full article HTML | See template example |
| `{{RELATED_ARTICLES}}` | Related articles HTML | See template example |
| `{{LANG_CODE}}` | Language code | "en" / "de" / "fr" |
| `{{CSS_PREFIX}}` | Path to assets | "./" or "../" |

### Creating Long-Form Article

Follow these guidelines for SEO-optimized articles:

**Length**: 1,500 - 2,500 words

**Structure**:
1. Compelling headline (60-70 characters)
2. Meta description (150-160 characters)
3. Brief introduction (150-200 words)
4. Table of contents (4-8 sections)
5. Main content with H2/H3 headings
6. Key takeaways boxes
7. Internal links (5-10 per article)
8. CTA sections (2-3 per article)
9. Author bio
10. Related articles (3-5)

**SEO Best Practices**:
- Use primary keyword in title, first paragraph, and one H2
- Include LSI keywords naturally throughout
- Add descriptive alt text to images
- Link to 5-10 internal pages with descriptive anchor text
- Include "Key Takeaways" box with bullet points
- Add schema markup (Article + Breadcrumb)
- Optimize images (WebP, lazy loading, proper dimensions)

**Internal Linking Strategy**:
```html
<!-- Link to relevant pages with descriptive anchor text -->
<a href="../iptv-products.html">explore our IPTV subscription packages</a>
<a href="../setup/smart-tv.html">Smart TV setup guide</a>
<a href="../channel-lists.html">browse our complete channel lineup</a>
<a href="../faq.html#pricing">IPTV pricing and plans FAQ</a>
```

### Example Article Structure

```html
<h2 id="introduction">What is IPTV and How Does It Work?</h2>
<p>Internet Protocol Television (IPTV) is a digital television broadcasting protocol...</p>

<h3>IPTV vs Traditional Cable</h3>
<p>Unlike traditional cable TV, IPTV delivers content through your internet connection...</p>

<div class="key-takeaways">
  <h3>🎯 Key Takeaways</h3>
  <ul>
    <li>IPTV streams over internet, not cable infrastructure</li>
    <li>Offers better flexibility and on-demand content</li>
    <li>More cost-effective than traditional subscriptions</li>
  </ul>
</div>

<h2 id="benefits">Top 10 Benefits of IPTV in 2025</h2>
<p>IPTV technology offers numerous advantages...</p>

<h3>1. Cost Savings</h3>
<p>IPTV subscriptions typically cost 60-80% less than cable TV...</p>
<p>For example, <a href="../iptv-products.html">our premium IPTV packages</a> start at just...</p>

<div class="article-cta">
  <h3>Ready to Cut the Cable?</h3>
  <p>Join 50,000+ satisfied customers streaming 30,000+ channels in 4K</p>
  <a href="../iptv-products.html" class="cta-button">View IPTV Packages</a>
</div>
```

## Schema Markup Guide

### Article Schema (Automatic)

The blog template automatically includes:
- Article type
- Headline, description, image
- Author information
- Publisher (TVMaster VIP)
- Publication/modification dates
- Word count
- Keywords and category

### Breadcrumb Schema (Automatic)

Navigation path: Home → Blog → Article Title

### Custom Schemas

For FAQ pages, add FAQPage schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is IPTV?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "IPTV stands for Internet Protocol Television..."
      }
    }
  ]
}
</script>
```

For product pages, add Product schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "TVMaster VIP Premium IPTV",
  "description": "30,000+ channels, 4K streaming",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "9.99",
    "highPrice": "29.99"
  }
}
</script>
```

## Hreflang Tags

Hreflang tags are automatically added to all pages for proper language/region targeting:

```html
<link rel="alternate" hreflang="en" href="https://web.tvmaster.vip/index.html"/>
<link rel="alternate" hreflang="de" href="https://web.tvmaster.vip/de/index.html"/>
<link rel="alternate" hreflang="fr" href="https://web.tvmaster.vip/fr/index.html"/>
<!-- ... other languages ... -->
<link rel="alternate" hreflang="x-default" href="https://web.tvmaster.vip/index.html"/>
```

## Internal Linking Strategy

### Topic Clusters

Create pillar pages (2,000-3,000 words) and link related content:

**Pillar Page**: "Complete IPTV Streaming Guide 2025"
- Links to: Setup guides, device guides, FAQ, products, channel lists

**Cluster Pages** (link back to pillar):
- "Best IPTV for Smart TV"
- "4K IPTV Streaming Guide"
- "IPTV vs Cable Comparison"
- "How to Choose IPTV Provider"

### Anchor Text Best Practices

❌ Bad: "click here", "read more", "this page"
✅ Good: "IPTV setup guide for Smart TV", "compare IPTV subscription plans", "browse 30,000+ live channels"

### Link Distribution

Per 1,500-word article:
- 5-10 internal links to relevant pages
- 1-2 links to products/services
- 2-3 links to related blog posts
- 1-2 links to setup/how-to guides
- 1 link to FAQ

## Maintenance

### Regular Updates

**Weekly**:
- Add new blog articles (1-2 per week)
- Update featured articles on blog.html

**Monthly**:
- Review and update SEO keywords
- Check Google Search Console for issues
- Update top-performing articles with fresh content
- Add new internal links to recent content

**Quarterly**:
- Update statistics and data in articles
- Refresh pillar pages with new sections
- Review and improve meta descriptions
- Audit structured data with Google Rich Results Test

### Performance Monitoring

Use Google Search Console to track:
- Click-through rates (CTR)
- Average position for target keywords
- Impressions and clicks
- Core Web Vitals
- Mobile usability
- Structured data errors

## Translation Workflow

### For New Blog Articles

1. Write full article in English (1,500-2,500 words)
2. Use AI translation for initial drafts:
   ```bash
   # Use ChatGPT/Claude with this prompt:
   "Translate the following IPTV article to [German/French/etc.],
   maintaining technical accuracy and SEO optimization.
   Keep HTML structure and placeholders unchanged."
   ```
3. Review translations for accuracy
4. Update language-specific keywords in each version
5. Ensure proper hreflang tags across all versions
6. Create directory structure: `/blog/article-slug.html` → `/de/blog/article-slug.html`

### Translation Checklist

- [ ] Title translated and optimized for target language
- [ ] Meta description translated (150-160 chars)
- [ ] Keywords localized for target market
- [ ] All content paragraphs translated
- [ ] Headings (H2, H3) translated
- [ ] Image alt text translated
- [ ] Internal links point to correct language version
- [ ] Author bio translated
- [ ] CTA buttons translated
- [ ] Hreflang tags point to all language versions

## Troubleshooting

### Common Issues

**Placeholders not replaced**:
- Ensure placeholder syntax matches exactly: `{{PLACEHOLDER}}`
- Check script is reading correct config file
- Verify page type mapping in script

**Hreflang errors**:
- All language versions must exist
- URLs must be absolute (not relative)
- Include x-default for fallback

**Schema validation errors**:
- Test with Google Rich Results Test
- Ensure all required properties are included
- Check JSON syntax (commas, quotes, brackets)

**Broken internal links**:
- Use relative paths with proper prefix
- Test all links after translation
- Update blog.html with new article cards

## Support

For questions or issues:
1. Check this README
2. Review example articles in `/blog/`
3. Test with `--dry-run` flag before applying changes
4. Validate structured data with Google tools

## Resources

- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Documentation](https://schema.org/)
- [Hreflang Tags Guide](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Google Search Console](https://search.google.com/search-console)
