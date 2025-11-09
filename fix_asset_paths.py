#!/usr/bin/env python3
"""
Fix asset paths in language subdirectories.
Changes ./assets/ to ../assets/ in all HTML files within language folders.
"""

import os
import re
from pathlib import Path

# Language directories to process
LANG_DIRS = ['de', 'fr', 'it', 'nl', 'no', 'sv', 'th']

# Root directory
ROOT_DIR = Path(__file__).parent

def fix_asset_paths(html_content):
    """
    Replace ./assets/ with ../assets/ in HTML content.
    Handles href, src, and other attributes.
    """
    # Replace ./assets/ with ../assets/ for:
    # - href="./assets/...
    # - src="./assets/...
    # - content="./assets/...
    # - url('./assets/...

    patterns = [
        (r'(href=")(\./assets/)', r'\1../assets/'),
        (r'(src=")(\./assets/)', r'\1../assets/'),
        (r'(content=")(\./assets/)', r'\1../assets/'),
        (r"(url\(')(\./assets/)", r"\1../assets/"),
        (r'(url\(")(\./assets/)', r'\1../assets/'),
    ]

    modified = html_content
    for pattern, replacement in patterns:
        modified = re.sub(pattern, replacement, modified)

    return modified

def process_html_files():
    """Process all HTML files in language directories."""
    files_processed = 0
    files_modified = 0

    for lang_dir in LANG_DIRS:
        lang_path = ROOT_DIR / lang_dir
        if not lang_path.exists():
            print(f"⚠ Directory not found: {lang_dir}")
            continue

        # Find all HTML files in the language directory
        for html_file in lang_path.rglob('*.html'):
            files_processed += 1

            try:
                # Read file
                with open(html_file, 'r', encoding='utf-8') as f:
                    original_content = f.read()

                # Fix paths
                fixed_content = fix_asset_paths(original_content)

                # Only write if changed
                if fixed_content != original_content:
                    with open(html_file, 'w', encoding='utf-8') as f:
                        f.write(fixed_content)
                    files_modified += 1
                    print(f"✓ Fixed: {html_file.relative_to(ROOT_DIR)}")
                else:
                    print(f"  Skipped (no changes): {html_file.relative_to(ROOT_DIR)}")

            except Exception as e:
                print(f"✗ Error processing {html_file}: {e}")

    print(f"\n{'='*60}")
    print(f"Files processed: {files_processed}")
    print(f"Files modified: {files_modified}")
    print(f"{'='*60}")

if __name__ == '__main__':
    print("Fixing asset paths in language directories...\n")
    process_html_files()
    print("\n✓ Done!")
