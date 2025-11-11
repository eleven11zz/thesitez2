#!/usr/bin/env python3
"""
Blog Article Translation Helper for TVMaster VIP
Prepares articles for translation and validates translated versions.

Usage:
    python scripts/translate-blog-article.py --article complete-iptv-guide-2025.html --lang de
    python scripts/translate-blog-article.py --extract-text complete-iptv-guide-2025.html
    python scripts/translate-blog-article.py --validate-links de/blog/complete-iptv-guide-2025.html
"""

import re
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Tuple

ROOT_DIR = Path(__file__).parent.parent

# Language configuration
LANG_CONFIG = {
    "de": {"name": "German", "locale": "de_DE", "og_locale": "de_DE"},
    "fr": {"name": "French", "locale": "fr_FR", "og_locale": "fr_FR"},
    "it": {"name": "Italian", "locale": "it_IT", "og_locale": "it_IT"},
    "nl": {"name": "Dutch", "locale": "nl_NL", "og_locale": "nl_NL"},
    "no": {"name": "Norwegian", "locale": "no_NO", "og_locale": "no_NO"},
    "sv": {"name": "Swedish", "locale": "sv_SE", "og_locale": "sv_SE"},
    "th": {"name": "Thai", "locale": "th_TH", "og_locale": "th_TH"},
}


def extract_translatable_text(html_content):
    """Extract text that needs translation, preserving HTML structure."""
    # Patterns for content to translate
    patterns = {
        "title": r'<title>(.*?)</title>',
        "meta_description": r'<meta name="description" content="(.*?)"/>',
        "meta_keywords": r'<meta name="keywords" content="(.*?)"/>',
        "og_title": r'<meta property="og:title" content="(.*?)"/>',
        "og_description": r'<meta property="og:description" content="(.*?)"/>',
        "article_title": r'<h1 class="article-title">(.*?)</h1>',
        "article_excerpt": r'<p class="article-excerpt">(.*?)</p>',
        "headings_h2": r'<h2[^>]*>(.*?)</h2>',
        "headings_h3": r'<h3[^>]*>(.*?)</h3>',
        "paragraphs": r'<p>(.*?)</p>',
        "list_items": r'<li>(.*?)</li>',
    }

    extracted = {}

    for key, pattern in patterns.items():
        matches = re.findall(pattern, html_content, re.DOTALL)
        extracted[key] = matches

    return extracted


def update_article_for_language(html_content, lang_code, translations=None):
    """Update article HTML for specific language."""
    lang_config = LANG_CONFIG[lang_code]

    # Update html lang attribute
    html_content = re.sub(
        r'<html lang="en">',
        f'<html lang="{lang_code}">',
        html_content
    )

    # Update og:locale
    html_content = re.sub(
        r'<meta property="og:locale" content="en_US"/>',
        f'<meta property="og:locale" content="{lang_config["og_locale"]}"/>',
        html_content
    )

    # Update language name in meta
    html_content = re.sub(
        r'<meta name="language" content="English"/>',
        f'<meta name="language" content="{lang_config["name"]}"/>',
        html_content
    )

    # Update canonical URL
    html_content = re.sub(
        r'href="https://web.tvmaster.vip/blog/',
        f'href="https://web.tvmaster.vip/{lang_code}/blog/',
        html_content,
        count=1  # Only first occurrence (canonical)
    )

    # Update schema inLanguage
    html_content = re.sub(
        r'"inLanguage": "en"',
        f'"inLanguage": "{lang_code}"',
        html_content
    )

    # Update relative links to parent directory (../ becomes ../../)
    # This is needed because translated articles are in /lang/blog/
    html_content = re.sub(
        r'href="\.\./',
        'href="../../',
        html_content
    )

    html_content = re.sub(
        r'src="\.\./',
        'src="../../',
        html_content
    )

    return html_content


def validate_links(html_content, lang_code):
    """Validate all internal links are correct for language version."""
    issues = []

    # Check for incorrect relative paths
    if re.search(r'href="\.\./', html_content):
        issues.append("Found ../ links (should be ../../ for translated versions)")

    # Check canonical URL
    if not re.search(rf'href="https://web.tvmaster.vip/{lang_code}/blog/', html_content):
        issues.append(f"Canonical URL not updated for language {lang_code}")

    # Check html lang attribute
    if not re.search(rf'<html lang="{lang_code}">', html_content):
        issues.append(f"HTML lang attribute not set to {lang_code}")

    return issues


def main():
    parser = argparse.ArgumentParser(description="Blog article translation helper")
    parser.add_argument("--article", help="Article filename")
    parser.add_argument("--lang", help="Target language code")
    parser.add_argument("--extract-text", help="Extract translatable text from article")
    parser.add_argument("--validate-links", help="Validate links in translated article")

    args = parser.parse_args()

    if args.extract_text:
        article_path = ROOT_DIR / "blog" / args.extract_text
        with open(article_path, 'r', encoding='utf-8') as f:
            content = f.read()

        extracted = extract_translatable_text(content)
        print(f"\nExtracted translatable content from {args.extract_text}:\n")
        for key, values in extracted.items():
            print(f"\n{key.upper()}:")
            for i, value in enumerate(values[:5], 1):  # Show first 5
                print(f"  {i}. {value[:100]}...")

    elif args.validate_links:
        article_path = ROOT_DIR / args.validate_links
        with open(article_path, 'r', encoding='utf-8') as f:
            content = f.read()

        lang_code = args.validate_links.split('/')[0]
        issues = validate_links(content, lang_code)

        if issues:
            print(f"\n⚠️ Link validation issues found:")
            for issue in issues:
                print(f"  • {issue}")
        else:
            print(f"\n✅ All links validated successfully!")

    elif args.article and args.lang:
        print(f"\nTranslating {args.article} to {args.lang}...")
        print(f"\n📝 Manual translation workflow:")
        print(f"1. Open blog/{args.article} in English")
        print(f"2. Translate all visible text content")
        print(f"3. Keep HTML tags and attributes unchanged")
        print(f"4. Update meta tags (title, description, keywords)")
        print(f"5. Translate headings, paragraphs, lists")
        print(f"6. Save to {args.lang}/blog/{args.article}")
        print(f"7. Run: python scripts/translate-blog-article.py --validate-links {args.lang}/blog/{args.article}")


if __name__ == "__main__":
    main()
