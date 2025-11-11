#!/usr/bin/env python3
"""
Structured Data Validator for TVMaster VIP
Extracts and validates JSON-LD schema markup from HTML pages.

Usage:
    python scripts/validate-structured-data.py
    python scripts/validate-structured-data.py --page blog/complete-iptv-guide-2025.html
    python scripts/validate-structured-data.py --lang de
    python scripts/validate-structured-data.py --report validation-report.txt
"""

import os
import sys
import json
import re
from pathlib import Path
import argparse
from typing import List, Dict, Tuple

# Configuration
ROOT_DIR = Path(__file__).parent.parent
LANGUAGES = ["en", "de", "fr", "it", "nl", "no", "sv", "th"]

# Required schema types for different page types
REQUIRED_SCHEMAS = {
    "index.html": ["WebSite", "Organization"],
    "blog.html": ["Blog"],
    "faq.html": ["FAQPage"],
    "iptv-products.html": ["Product"],
    "blog/*.html": ["Article"],
}

# Schema.org required properties
SCHEMA_REQUIREMENTS = {
    "Article": ["headline", "author", "datePublished", "publisher"],
    "Organization": ["name", "url"],
    "WebSite": ["name", "url"],
    "Product": ["name", "description"],
    "FAQPage": ["mainEntity"],
    "BreadcrumbList": ["itemListElement"],
}


def get_language_path(lang_code):
    """Get directory path for language."""
    if lang_code == "en":
        return ROOT_DIR
    return ROOT_DIR / lang_code


def extract_json_ld(html_content):
    """Extract all JSON-LD script blocks from HTML."""
    pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
    matches = re.findall(pattern, html_content, re.DOTALL | re.IGNORECASE)

    schemas = []
    for match in matches:
        try:
            schema = json.loads(match.strip())
            schemas.append(schema)
        except json.JSONDecodeError as e:
            print(f"   ⚠️  JSON parsing error: {e}")
            continue

    return schemas


def validate_schema_structure(schema, schema_type=None):
    """Validate schema structure and required properties."""
    issues = []

    # Detect schema type
    if "@type" not in schema:
        issues.append("Missing '@type' property")
        return issues

    detected_type = schema["@type"]

    # Check context
    if "@context" not in schema:
        issues.append(f"Missing '@context' for {detected_type}")
    elif schema["@context"] != "https://schema.org":
        issues.append(f"Invalid @context: {schema['@context']}")

    # Validate required properties for this type
    if detected_type in SCHEMA_REQUIREMENTS:
        required_props = SCHEMA_REQUIREMENTS[detected_type]
        for prop in required_props:
            if prop not in schema:
                issues.append(f"Missing required property '{prop}' for {detected_type}")

    # Type-specific validations
    if detected_type == "Article":
        # Validate author
        if "author" in schema:
            if not isinstance(schema["author"], dict) or "@type" not in schema["author"]:
                issues.append("Article author should be a Person or Organization object")

        # Validate publisher
        if "publisher" in schema:
            if not isinstance(schema["publisher"], dict):
                issues.append("Publisher should be an Organization object")
            elif "logo" in schema["publisher"]:
                logo = schema["publisher"]["logo"]
                if not isinstance(logo, dict) or "@type" not in logo:
                    issues.append("Publisher logo should be an ImageObject")

    elif detected_type == "BreadcrumbList":
        if "itemListElement" in schema:
            items = schema["itemListElement"]
            if not isinstance(items, list):
                issues.append("itemListElement should be an array")
            else:
                for i, item in enumerate(items):
                    if "position" not in item:
                        issues.append(f"Breadcrumb item {i} missing 'position'")
                    if "name" not in item:
                        issues.append(f"Breadcrumb item {i} missing 'name'")

    elif detected_type == "FAQPage":
        if "mainEntity" in schema:
            entities = schema["mainEntity"]
            if not isinstance(entities, list):
                issues.append("mainEntity should be an array")
            else:
                for i, entity in enumerate(entities):
                    if entity.get("@type") != "Question":
                        issues.append(f"FAQ item {i} should be type 'Question'")
                    if "acceptedAnswer" not in entity:
                        issues.append(f"FAQ question {i} missing 'acceptedAnswer'")

    return issues


def validate_page(file_path, relative_path):
    """Validate structured data for a single page."""
    print(f"\n📄 Validating: {relative_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    except Exception as e:
        print(f"   ❌ Error reading file: {e}")
        return []

    # Extract schemas
    schemas = extract_json_ld(html_content)

    if not schemas:
        print(f"   ⚠️  No structured data found")
        return []

    print(f"   ✅ Found {len(schemas)} schema(s)")

    all_issues = []

    # Validate each schema
    for i, schema in enumerate(schemas, 1):
        schema_type = schema.get("@type", "Unknown")
        print(f"   📋 Schema {i}: {schema_type}")

        issues = validate_schema_structure(schema)

        if issues:
            print(f"      ⚠️  {len(issues)} issue(s) found:")
            for issue in issues:
                print(f"         • {issue}")
                all_issues.append((relative_path, schema_type, issue))
        else:
            print(f"      ✅ Valid")

    return all_issues


def validate_all_pages(lang_code=None, specific_page=None):
    """Validate all pages or specific pages."""
    print(f"\n{'='*70}")
    print(f"Structured Data Validation")
    print(f"{'='*70}")

    all_issues = []
    pages_validated = 0
    pages_with_issues = 0

    # Determine which languages to process
    languages = [lang_code] if lang_code else LANGUAGES

    for lang in languages:
        lang_dir = get_language_path(lang)

        if not lang_dir.exists():
            print(f"\n⚠️  Language directory not found: {lang}")
            continue

        print(f"\n🌍 Language: {lang.upper()}")

        # Determine which pages to validate
        if specific_page:
            pages = [specific_page]
        else:
            # Find all HTML files
            pages = []
            for root, dirs, files in os.walk(lang_dir):
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                for file in files:
                    if file.endswith('.html') and 'backup' not in file.lower():
                        file_path = Path(root) / file
                        relative_path = file_path.relative_to(lang_dir)
                        pages.append(str(relative_path))

        # Validate pages
        for page in pages:
            file_path = lang_dir / page
            if not file_path.exists():
                print(f"\n⚠️  File not found: {page}")
                continue

            issues = validate_page(file_path, page)
            pages_validated += 1

            if issues:
                pages_with_issues += 1
                all_issues.extend(issues)

    # Summary
    print(f"\n{'='*70}")
    print(f"Validation Summary")
    print(f"{'='*70}")
    print(f"📊 Pages validated: {pages_validated}")
    print(f"⚠️  Pages with issues: {pages_with_issues}")
    print(f"❌ Total issues: {len(all_issues)}")

    if all_issues:
        print(f"\n📋 Issues by page:")
        current_page = None
        for page, schema_type, issue in all_issues:
            if page != current_page:
                print(f"\n   {page}")
                current_page = page
            print(f"      [{schema_type}] {issue}")
    else:
        print(f"\n✨ All structured data is valid!")

    print(f"\n{'='*70}\n")

    return all_issues


def generate_test_urls(output_file="schema-test-urls.txt"):
    """Generate list of URLs to test with Google Rich Results Test."""
    print(f"\n📝 Generating test URLs for Google Rich Results Test...\n")

    test_pages = [
        "index.html",
        "blog.html",
        "faq.html",
        "iptv-products.html",
        "blog/complete-iptv-guide-2025.html",
        "blog/best-iptv-service-2025.html",
        "blog/iptv-smart-tv-guide-2025.html",
        "blog/4k-iptv-streaming-guide-2025.html",
    ]

    urls = []
    for page in test_pages:
        url = f"https://web.tvmaster.vip/{page}"
        urls.append(url)

    output_path = ROOT_DIR / output_file

    with open(output_path, 'w') as f:
        f.write("# TVMaster VIP - Structured Data Test URLs\n")
        f.write("# Test these URLs at: https://search.google.com/test/rich-results\n\n")
        for url in urls:
            f.write(f"{url}\n")

    print(f"✅ Test URLs saved to: {output_path}")
    print(f"📊 Total URLs: {len(urls)}\n")
    print(f"🔗 Google Rich Results Test: https://search.google.com/test/rich-results")
    print(f"🔗 Schema Markup Validator: https://validator.schema.org/\n")

    return urls


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(
        description="Validate structured data for TVMaster VIP"
    )
    parser.add_argument(
        "--page",
        "-p",
        help="Validate specific page (e.g., blog/complete-iptv-guide-2025.html)"
    )
    parser.add_argument(
        "--lang",
        "-l",
        choices=LANGUAGES,
        help="Validate specific language only"
    )
    parser.add_argument(
        "--report",
        "-r",
        help="Save validation report to file"
    )
    parser.add_argument(
        "--generate-test-urls",
        "-g",
        action="store_true",
        help="Generate list of URLs for Google Rich Results Test"
    )

    args = parser.parse_args()

    # Generate test URLs if requested
    if args.generate_test_urls:
        generate_test_urls()
        return

    # Run validation
    issues = validate_all_pages(args.lang, args.page)

    # Save report if requested
    if args.report:
        report_path = ROOT_DIR / args.report
        with open(report_path, 'w') as f:
            f.write("TVMaster VIP - Structured Data Validation Report\n")
            f.write("=" * 70 + "\n\n")
            f.write(f"Total issues found: {len(issues)}\n\n")

            if issues:
                current_page = None
                for page, schema_type, issue in issues:
                    if page != current_page:
                        f.write(f"\n{page}\n")
                        current_page = page
                    f.write(f"  [{schema_type}] {issue}\n")

        print(f"📄 Report saved to: {report_path}")

    # Exit code
    sys.exit(0 if not issues else 1)


if __name__ == "__main__":
    main()
