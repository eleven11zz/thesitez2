#!/usr/bin/env python3
"""
SEO Metadata Update Script
Automatically updates meta tags, hreflang tags, canonical URLs, and structured data
across all language versions of TVMaster VIP site.

Usage:
    python scripts/update-seo-metadata.py
    python scripts/update-seo-metadata.py --page index.html
    python scripts/update-seo-metadata.py --lang de
    python scripts/update-seo-metadata.py --dry-run
"""

import json
import os
import sys
import re
from pathlib import Path
from typing import Dict, List, Optional
import argparse

# Configuration
ROOT_DIR = Path(__file__).parent.parent
CONFIG_FILE = ROOT_DIR / "_config" / "languages.json"
INCLUDES_DIR = ROOT_DIR / "_includes"

# Page type mapping (filename -> config key)
PAGE_TYPE_MAP = {
    "index.html": "home",
    "blog.html": "blog",
    "faq.html": "faq",
    "iptv-products.html": "products",
    "tv-box-products.html": "products",
    "channel-lists.html": "channels",
    "epg.html": "channels",
}


def load_config() -> Dict:
    """Load language configuration from JSON."""
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_page_type(filename: str) -> str:
    """Determine page type from filename."""
    return PAGE_TYPE_MAP.get(filename, "home")


def get_language_path(lang_code: str) -> Path:
    """Get the directory path for a language."""
    if lang_code == "en":
        return ROOT_DIR
    return ROOT_DIR / lang_code


def build_placeholders(config: Dict, lang_code: str, page_type: str, page_filename: str) -> Dict[str, str]:
    """Build dictionary of placeholder replacements for a specific page and language."""
    lang_config = config["languages"][lang_code]
    seo_config = lang_config["seo"].get(page_type, lang_config["seo"]["home"])

    # Determine URL paths
    lang_path = lang_config["path"]
    if lang_path:
        page_path = page_filename
        canonical_url = f"{config['base_url']}/{lang_path}/{page_filename}"
        css_path_prefix = "../"
    else:
        page_path = page_filename
        canonical_url = f"{config['base_url']}/{page_filename}"
        css_path_prefix = "./"

    # Build placeholders dictionary
    placeholders = {
        # Meta tags
        "{{PAGE_TITLE}}": seo_config["title"],
        "{{PAGE_DESCRIPTION}}": seo_config["description"],
        "{{PAGE_KEYWORDS}}": seo_config["keywords"],
        "{{CANONICAL_URL}}": canonical_url,

        # Open Graph
        "{{OG_TITLE}}": seo_config.get("og_title", seo_config["title"]),
        "{{OG_DESCRIPTION}}": seo_config.get("og_description", seo_config["description"]),
        "{{OG_LOCALE}}": lang_config["locale"],

        # Twitter
        "{{TWITTER_TITLE}}": seo_config.get("og_title", seo_config["title"]),
        "{{TWITTER_DESCRIPTION}}": seo_config.get("og_description", seo_config["description"]),

        # Language & paths
        "{{LANGUAGE_NAME}}": lang_config["name"],
        "{{LANG_CODE}}": lang_code,
        "{{PAGE_PATH}}": page_path,
        "{{CSS_PATH_PREFIX}}": css_path_prefix,

        # Site info
        "{{SITE_URL}}": lang_config["site"]["url"],
        "{{SITE_DESCRIPTION}}": lang_config["site"]["description"],
    }

    return placeholders


def replace_placeholders(content: str, placeholders: Dict[str, str]) -> str:
    """Replace all placeholders in content with their values."""
    for placeholder, value in placeholders.items():
        content = content.replace(placeholder, value)
    return content


def update_html_file(file_path: Path, placeholders: Dict[str, str], dry_run: bool = False) -> bool:
    """Update a single HTML file with SEO metadata."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace placeholders
        updated_content = replace_placeholders(content, placeholders)

        # Check if anything changed
        if content == updated_content:
            print(f"  ⏭️  No changes needed: {file_path.relative_to(ROOT_DIR)}")
            return False

        if not dry_run:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"  ✅ Updated: {file_path.relative_to(ROOT_DIR)}")
        else:
            print(f"  🔍 Would update: {file_path.relative_to(ROOT_DIR)}")

        return True
    except Exception as e:
        print(f"  ❌ Error updating {file_path.relative_to(ROOT_DIR)}: {e}")
        return False


def update_all_pages(config: Dict, target_lang: Optional[str] = None,
                     target_page: Optional[str] = None, dry_run: bool = False):
    """Update all pages across all languages."""
    languages = config["languages"]
    supported_pages = config["supported_pages"]

    # Filter languages if target specified
    if target_lang:
        if target_lang not in languages:
            print(f"❌ Language '{target_lang}' not found in configuration")
            return
        languages = {target_lang: languages[target_lang]}

    # Filter pages if target specified
    if target_page:
        page_filename = target_page if target_page.endswith('.html') else f"{target_page}.html"
        supported_pages = [page_filename.replace('.html', '')]

    total_updated = 0
    total_processed = 0

    print(f"\n{'='*70}")
    print(f"SEO Metadata Update - {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*70}\n")

    for lang_code, lang_config in languages.items():
        print(f"📝 Processing language: {lang_config['name']} ({lang_code})")
        lang_dir = get_language_path(lang_code)

        if not lang_dir.exists():
            print(f"  ⚠️  Directory not found: {lang_dir}")
            continue

        for page_name in supported_pages:
            page_filename = f"{page_name}.html"
            page_path = lang_dir / page_filename

            if not page_path.exists():
                print(f"  ⏭️  Page not found: {page_filename}")
                continue

            page_type = get_page_type(page_filename)
            placeholders = build_placeholders(config, lang_code, page_type, page_filename)

            total_processed += 1
            if update_html_file(page_path, placeholders, dry_run):
                total_updated += 1

        print()  # Blank line between languages

    print(f"{'='*70}")
    print(f"✨ Summary: {total_updated} files updated out of {total_processed} processed")
    if dry_run:
        print(f"   Run without --dry-run to apply changes")
    print(f"{'='*70}\n")


def inject_includes_to_pages(config: Dict, dry_run: bool = False):
    """
    Add include comments to pages for future template processing.
    This prepares pages to use the centralized includes.
    """
    print(f"\n{'='*70}")
    print(f"Injecting Include References - {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"{'='*70}\n")

    # This is a preparation step - we'll add comments showing where includes should go
    # In a real template system, these would be replaced during build

    include_comment = """
<!-- SEO Meta Tags - Centralized Configuration -->
<!-- To use: Replace <head> content with: {%% include '_includes/meta-tags.html' %%} -->
<!-- Configuration file: _config/languages.json -->
""".strip()

    print("ℹ️  Include injection is a manual step for static HTML")
    print("   Use the update-seo-metadata.py script to apply centralized metadata")
    print("   Or migrate to a static site generator (Jekyll, Hugo, 11ty) for automatic includes\n")


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Update SEO metadata across all TVMaster VIP pages and languages"
    )
    parser.add_argument(
        "--lang",
        help="Target specific language (en, de, fr, it, nl, no, sv, th)",
        type=str
    )
    parser.add_argument(
        "--page",
        help="Target specific page (e.g., index.html, blog.html)",
        type=str
    )
    parser.add_argument(
        "--dry-run",
        help="Preview changes without writing files",
        action="store_true"
    )
    parser.add_argument(
        "--inject-includes",
        help="Add include comments to pages",
        action="store_true"
    )

    args = parser.parse_args()

    # Load configuration
    if not CONFIG_FILE.exists():
        print(f"❌ Configuration file not found: {CONFIG_FILE}")
        print(f"   Please create _config/languages.json first")
        sys.exit(1)

    config = load_config()

    # Execute requested action
    if args.inject_includes:
        inject_includes_to_pages(config, args.dry_run)
    else:
        update_all_pages(config, args.lang, args.page, args.dry_run)


if __name__ == "__main__":
    main()
