# TVMaster VIP Website

Comprehensive marketing site for TVMaster VIP with multi-language landing pages, live sports hub, and SEO tooling. The repository contains the production HTML/CSS/JS plus automation scripts that keep metadata and sports schedules current across eight locales.

## Project structure
- `index.html` and language folders (`de/`, `fr/`, `it/`, `nl/`, `no/`, `sv/`, `th/`): localized landing pages and marketing content.
- `_includes/` and `_templates/`: shared partials and long-form blog templates used across languages.
- `_config/`: centralized language metadata and SEO configuration along with documentation for the SEO automation system.
- `assets/`: site-wide CSS, JavaScript, images, and generated data files like `assets/js/events.json` for the sports hub.
- `scripts/`: maintenance utilities including the SEO metadata updater and the sports events auto-fetcher.
- `channel-*.html`, `epg-*.html`, `blog/`, `country/`, `devices/`, `sports/`, `tv-guide.html`, etc.: supporting pages referenced throughout the site.

## Development workflow
1. Install Node.js dependencies for linting and formatting:
   ```bash
   npm install
   ```
2. Run quality checks before committing:
   ```bash
   npm run lint
   npm run format:check
   ```
3. Use the helper scripts when updating dynamic content:
   - **SEO metadata:** `python scripts/update-seo-metadata.py` (see `_config/README.md`).
   - **Sports events:** `python scripts/fetch-events.py` (see `scripts/README.md`).

## Key automation
- **Centralized SEO system:** `_config/languages.json` defines per-page metadata for each locale, applied via `_includes/meta-tags.html` and updated through `scripts/update-seo-metadata.py`.
- **Live sports hub feed:** `scripts/fetch-events.py` pulls upcoming events from TheSportsDB and refreshes `assets/js/events.json`, keeping the sports hub up to date.

## Testing and validation
- HTML/CSS/JS linting via `npm run lint`.
- Prettier formatting checks via `npm run format:check`.
- Link validation utilities `check_links.py` and `check_all_links.js` are available for broader site sweeps when needed.
