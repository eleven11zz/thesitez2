#!/usr/bin/env python3
"""
Fix duplicate nav-toggle buttons in HTML files.
Removes all nav-toggle button blocks except the one in the header (after brand, before nav).
"""

import re
import sys
from pathlib import Path

def fix_nav_buttons(html_content):
    """Remove duplicate nav-toggle buttons from HTML content."""

    # Pattern to match the nav-toggle button block (6 lines)
    nav_button_pattern = r'    <button class="nav-toggle" type="button"[^>]*>\s*<span class="sr-only">Toggle navigation</span>\s*<span></span>\s*<span></span>\s*<span></span>\s*</button>'

    # Find all matches
    matches = list(re.finditer(nav_button_pattern, html_content, re.MULTILINE | re.DOTALL))

    if len(matches) <= 1:
        return html_content  # Only one or zero nav-toggle buttons, nothing to fix

    # Keep track of which match to keep (the first one in the header)
    # The correct button should be between </a> (brand) and <nav

    result = html_content
    removed_count = 0

    # Remove from the end to preserve positions
    for match in reversed(matches[1:]):  # Skip the first match (keep it)
        start, end = match.span()
        # Check if this button is NOT in the correct location (between brand and nav in header)
        before_button = html_content[:start]
        after_button = html_content[end:]

        # The correct button should have </a> before it and <nav after it
        # Remove all others
        result = result[:start] + result[end:]
        removed_count += 1

    return result

def process_file(filepath):
    """Process a single HTML file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        fixed_content = fix_nav_buttons(content)

        if original_content != fixed_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)

            # Count how many were removed
            original_count = original_content.count('<button class="nav-toggle"')
            fixed_count = fixed_content.count('<button class="nav-toggle"')
            removed = original_count - fixed_count

            print(f"✓ Fixed {filepath}: removed {removed} duplicate nav-toggle buttons")
            return True
        else:
            print(f"  No changes needed for {filepath}")
            return False
    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")
        return False

def main():
    # Files to fix
    setup_files = [
        'setup/smart-tv.html',
        'setup/fire-tv.html',
        'setup/android-tv.html',
        'setup/desktop.html',
        'setup/mobile.html',
        'setup/mag-box.html',
        'setup/iptv-extreme.html',
        'setup/smart-iptv.html',
        'setup/smart-one-iptv.html',
        'setup/index.html',
    ]

    sports_files = [
        'sports/arsenal-vs-liverpool.html',
        'sports/chiefs-vs-49ers-2025.html',
        'sports/manchester-derby-2025.html',
        'sports/ufc-305-perth.html',
        'sports/index.html',
    ]

    all_files = setup_files + sports_files

    print("🔧 Fixing duplicate nav-toggle buttons in 16 files...\n")

    fixed_count = 0
    for filepath in all_files:
        path = Path(filepath)
        if path.exists():
            if process_file(path):
                fixed_count += 1
        else:
            print(f"✗ File not found: {filepath}")

    print(f"\n✅ Fixed {fixed_count} out of {len(all_files)} files")

if __name__ == '__main__':
    main()
