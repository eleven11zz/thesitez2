#!/usr/bin/env python3
"""
Comprehensive Sitemap Generator for TVMaster VIP
Generates XML sitemap with all pages across 8 language versions.

Usage:
    python scripts/generate-comprehensive-sitemap.py
    python scripts/generate-comprehensive-sitemap.py --output sitemap.xml
    python scripts/generate-comprehensive-sitemap.py --pretty
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import argparse
import xml.etree.ElementTree as ET
from xml.dom import minidom

# Configuration
ROOT_DIR = Path(__file__).parent.parent
BASE_URL = "https://web.tvmaster.vip"

# Language configurations
LANGUAGES = ["en", "de", "fr", "it", "nl", "no", "sv", "th"]

# Page priority and change frequency settings
PAGE_SETTINGS = {
    "index.html": {"priority": "1.0", "changefreq": "daily"},
    "iptv-products.html": {"priority": "0.9", "changefreq": "weekly"},
    "tv-box-products.html": {"priority": "0.9", "changefreq": "weekly"},
    "channel-lists.html": {"priority": "0.8", "changefreq": "weekly"},
    "blog.html": {"priority": "0.8", "changefreq": "daily"},
    "faq.html": {"priority": "0.8", "changefreq": "monthly"},
    "epg.html": {"priority": "0.7", "changefreq": "daily"},
    "search.html": {"priority": "0.5", "changefreq": "monthly"},

    # Blog articles (high priority for fresh content)
    "blog/complete-iptv-guide-2025.html": {"priority": "0.9", "changefreq": "weekly"},
    "blog/best-iptv-service-2025.html": {"priority": "0.9", "changefreq": "weekly"},
    "blog/iptv-smart-tv-guide-2025.html": {"priority": "0.9", "changefreq": "weekly"},
    "blog/4k-iptv-streaming-guide-2025.html": {"priority": "0.9", "changefreq": "weekly"},
    "iptv-vs-cable.html": {"priority": "0.8", "changefreq": "monthly"},

    # Setup guides
    "setup/index.html": {"priority": "0.7", "changefreq": "monthly"},
    "setup/smart-tv.html": {"priority": "0.7", "changefreq": "monthly"},
    "setup/android-tv.html": {"priority": "0.7", "changefreq": "monthly"},
    "setup/fire-tv.html": {"priority": "0.7", "changefreq": "monthly"},
    "setup/mobile.html": {"priority": "0.7", "changefreq": "monthly"},
    "setup/desktop.html": {"priority": "0.7", "changefreq": "monthly"},
    "setup/mag-box.html": {"priority": "0.7", "changefreq": "monthly"},

    # Sports pages
    "sports/live.html": {"priority": "0.7", "changefreq": "daily"},
    "sports/index.html": {"priority": "0.6", "changefreq": "weekly"},

    # Other pages
    "devices/index.html": {"priority": "0.6", "changefreq": "monthly"},
    "country/index.html": {"priority": "0.6", "changefreq": "monthly"},
}

# Default settings for pages not explicitly configured
DEFAULT_SETTINGS = {"priority": "0.5", "changefreq": "monthly"}


def get_language_path(lang_code):
    """Get directory path for language."""
    if lang_code == "en":
        return ROOT_DIR
    return ROOT_DIR / lang_code


def get_url_for_page(lang_code, page_path):
    """Build full URL for a page."""
    if lang_code == "en":
        return f"{BASE_URL}/{page_path}"
    return f"{BASE_URL}/{lang_code}/{page_path}"


def get_page_settings(page_path):
    """Get priority and changefreq for a page."""
    # Normalize path
    page_path = page_path.replace("\\", "/")

    # Check exact match
    if page_path in PAGE_SETTINGS:
        return PAGE_SETTINGS[page_path]

    # Check if it's a blog article
    if page_path.startswith("blog/") and page_path.endswith(".html"):
        return {"priority": "0.8", "changefreq": "weekly"}

    # Check if it's a setup guide
    if page_path.startswith("setup/") and page_path.endswith(".html"):
        return {"priority": "0.7", "changefreq": "monthly"}

    # Check if it's a sports page
    if page_path.startswith("sports/") and page_path.endswith(".html"):
        return {"priority": "0.6", "changefreq": "weekly"}

    return DEFAULT_SETTINGS


def get_last_modified(file_path):
    """Get last modified date of file."""
    try:
        timestamp = os.path.getmtime(file_path)
        return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
    except:
        return datetime.now().strftime("%Y-%m-%d")


def find_html_files(directory, exclude_patterns=None):
    """Find all HTML files in directory recursively."""
    if exclude_patterns is None:
        exclude_patterns = ["404.html", "index.backup", ".backup."]

    html_files = []

    for root, dirs, files in os.walk(directory):
        # Skip hidden directories and node_modules
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

        for file in files:
            if file.endswith('.html'):
                # Skip excluded patterns
                if any(pattern in file for pattern in exclude_patterns):
                    continue

                file_path = Path(root) / file
                relative_path = file_path.relative_to(directory)
                html_files.append(str(relative_path))

    return html_files


def generate_sitemap(output_file="sitemap.xml", pretty_print=False):
    """Generate comprehensive sitemap XML."""
    print(f"\n{'='*70}")
    print(f"Generating Sitemap for TVMaster VIP")
    print(f"{'='*70}\n")

    # Create root element
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset.set("xmlns:xhtml", "http://www.w3.org/1999/xhtml")

    urls_added = 0

    # Process each language
    for lang_code in LANGUAGES:
        lang_dir = get_language_path(lang_code)

        if not lang_dir.exists():
            print(f"⚠️  Language directory not found: {lang_code} ({lang_dir})")
            continue

        print(f"📝 Processing language: {lang_code.upper()}")

        # Find all HTML files
        html_files = find_html_files(lang_dir)

        for html_file in html_files:
            # Create URL element
            url_elem = ET.SubElement(urlset, "url")

            # Full URL
            page_url = get_url_for_page(lang_code, html_file)
            loc = ET.SubElement(url_elem, "loc")
            loc.text = page_url

            # Last modified date
            file_path = lang_dir / html_file
            lastmod = ET.SubElement(url_elem, "lastmod")
            lastmod.text = get_last_modified(file_path)

            # Get page settings
            settings = get_page_settings(html_file)

            # Change frequency
            changefreq = ET.SubElement(url_elem, "changefreq")
            changefreq.text = settings["changefreq"]

            # Priority
            priority = ET.SubElement(url_elem, "priority")
            priority.text = settings["priority"]

            # Add alternate language links (hreflang)
            for alt_lang in LANGUAGES:
                if alt_lang != lang_code:
                    xhtml_link = ET.SubElement(url_elem, "{http://www.w3.org/1999/xhtml}link")
                    xhtml_link.set("rel", "alternate")
                    xhtml_link.set("hreflang", alt_lang)
                    xhtml_link.set("href", get_url_for_page(alt_lang, html_file))

            urls_added += 1

        print(f"   ✅ Added {len(html_files)} pages")

    # Create XML tree
    tree = ET.ElementTree(urlset)

    # Write to file
    output_path = ROOT_DIR / output_file

    if pretty_print:
        # Pretty print XML
        xml_str = ET.tostring(urlset, encoding='unicode')
        dom = minidom.parseString(xml_str)
        pretty_xml = dom.toprettyxml(indent="  ", encoding="UTF-8")

        with open(output_path, 'wb') as f:
            f.write(pretty_xml)
    else:
        # Standard output
        tree.write(output_path, encoding='UTF-8', xml_declaration=True)

    print(f"\n{'='*70}")
    print(f"✨ Sitemap generated successfully!")
    print(f"{'='*70}")
    print(f"📁 Output file: {output_path}")
    print(f"📊 Total URLs: {urls_added}")
    print(f"🌍 Languages: {len(LANGUAGES)}")
    print(f"💾 File size: {os.path.getsize(output_path):,} bytes")
    print(f"{'='*70}\n")

    return output_path


def validate_sitemap(sitemap_path):
    """Basic validation of generated sitemap."""
    print("\n🔍 Validating sitemap...\n")

    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()

        # Count URLs
        urls = root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}url")
        print(f"✅ Valid XML structure")
        print(f"✅ Total URLs: {len(urls)}")

        # Check file size (should be under 50MB)
        file_size = os.path.getsize(sitemap_path)
        if file_size > 50 * 1024 * 1024:
            print(f"⚠️  Warning: Sitemap size ({file_size:,} bytes) exceeds 50MB limit")
        else:
            print(f"✅ File size OK: {file_size:,} bytes")

        # Check URL count (should be under 50,000)
        if len(urls) > 50000:
            print(f"⚠️  Warning: URL count ({len(urls)}) exceeds 50,000 limit")
        else:
            print(f"✅ URL count OK: {len(urls)}")

        print(f"\n✨ Sitemap validation passed!\n")
        return True

    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return False


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Generate comprehensive sitemap for TVMaster VIP"
    )
    parser.add_argument(
        "--output",
        "-o",
        default="sitemap.xml",
        help="Output filename (default: sitemap.xml)"
    )
    parser.add_argument(
        "--pretty",
        "-p",
        action="store_true",
        help="Pretty print XML with indentation"
    )
    parser.add_argument(
        "--validate",
        "-v",
        action="store_true",
        help="Validate sitemap after generation"
    )

    args = parser.parse_args()

    # Generate sitemap
    sitemap_path = generate_sitemap(args.output, args.pretty)

    # Validate if requested
    if args.validate:
        validate_sitemap(sitemap_path)

    print(f"📤 Next steps:")
    print(f"   1. Review the generated sitemap: {sitemap_path}")
    print(f"   2. Submit to Google Search Console: https://search.google.com/search-console")
    print(f"   3. Update robots.txt with: Sitemap: {BASE_URL}/sitemap.xml")
    print(f"   4. Test with: https://www.xml-sitemaps.com/validate-xml-sitemap.html\n")


if __name__ == "__main__":
    main()
