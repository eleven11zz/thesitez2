#!/usr/bin/env python3
"""
Generate sitemap.xml for TVMaster VIP website
Helps search engines discover and index all pages
"""

import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict

# Base URL
BASE_URL = "https://eleven11zz.github.io/thesitez2"

# Pages to include in sitemap with priority and change frequency
SITEMAP_PAGES = [
    # Main pages
    {"loc": "/", "priority": "1.0", "changefreq": "daily"},
    {"loc": "/index.html", "priority": "1.0", "changefreq": "daily"},

    # Product pages
    {"loc": "/iptv-products.html", "priority": "0.9", "changefreq": "weekly"},
    {"loc": "/tv-box-products.html", "priority": "0.9", "changefreq": "weekly"},

    # Channel lists
    {"loc": "/channel-lists.html", "priority": "0.8", "changefreq": "weekly"},
    {"loc": "/channel-lists/iptv/english.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/france.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/german.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/italy.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/latin.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/scandinavia.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/india.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/netherlands.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/channel-lists/iptv/world.html", "priority": "0.7", "changefreq": "monthly"},

    # Setup guides
    {"loc": "/setup.html", "priority": "0.8", "changefreq": "monthly"},
    {"loc": "/setup/smart-one-iptv.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/setup/iptv-extreme.html", "priority": "0.7", "changefreq": "monthly"},
    {"loc": "/setup/smart-iptv.html", "priority": "0.7", "changefreq": "monthly"},

    # Sports
    {"loc": "/sports/live.html", "priority": "0.8", "changefreq": "daily"},

    # Blog
    {"loc": "/blog.html", "priority": "0.7", "changefreq": "weekly"},

    # FAQ & Search
    {"loc": "/faq.html", "priority": "0.6", "changefreq": "monthly"},
    {"loc": "/search.html", "priority": "0.5", "changefreq": "yearly"},
]

def generate_sitemap() -> str:
    """Generate XML sitemap"""
    today = datetime.now().strftime("%Y-%m-%d")

    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]

    for page in SITEMAP_PAGES:
        xml_lines.append("  <url>")
        xml_lines.append(f'    <loc>{BASE_URL}{page["loc"]}</loc>')
        xml_lines.append(f'    <lastmod>{today}</lastmod>')
        xml_lines.append(f'    <changefreq>{page["changefreq"]}</changefreq>')
        xml_lines.append(f'    <priority>{page["priority"]}</priority>')
        xml_lines.append("  </url>")

    xml_lines.append('</urlset>')

    return '\n'.join(xml_lines)

def main():
    """Generate sitemap and save to file"""
    print("=" * 70)
    print("🗺️  Generating sitemap.xml")
    print("=" * 70)
    print()

    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)

    # Generate sitemap
    sitemap_xml = generate_sitemap()

    # Write to file
    sitemap_path = "sitemap.xml"
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sitemap_xml)

    print(f"✅ Generated sitemap with {len(SITEMAP_PAGES)} URLs")
    print(f"📄 File: {sitemap_path}")
    print()

    # Summary
    print("📊 SITEMAP SUMMARY")
    print("=" * 70)
    print(f"Total URLs: {len(SITEMAP_PAGES)}")
    print(f"Base URL: {BASE_URL}")
    print()

    # URLs by priority
    priorities = {}
    for page in SITEMAP_PAGES:
        priority = page["priority"]
        priorities[priority] = priorities.get(priority, 0) + 1

    print("URLs by priority:")
    for priority in sorted(priorities.keys(), reverse=True):
        count = priorities[priority]
        print(f"  • Priority {priority}: {count} URL(s)")

    print()
    print("=" * 70)
    print("🎯 NEXT STEPS:")
    print("=" * 70)
    print("1. Upload sitemap.xml to website root")
    print("2. Submit to Google Search Console:")
    print("   https://search.google.com/search-console")
    print("3. Add to robots.txt:")
    print(f"   Sitemap: {BASE_URL}/sitemap.xml")
    print("4. Verify with Google Sitemap Validator")
    print("=" * 70)

if __name__ == "__main__":
    main()
