#!/usr/bin/env python3
"""
Add Resource Hints for Performance Optimization
Adds preload, prefetch, preconnect, and dns-prefetch hints
"""

import re
import os
from pathlib import Path

HTML_FILES = [
    "index.html",
    "iptv-products.html",
    "tv-box-products.html",
    "blog.html",
    "faq.html",
    "channel-lists.html",
    "search.html",
    "sports/live.html",
]

def add_resource_hints_to_head(content: str, filepath: str) -> tuple[str, list]:
    """Add resource hints to <head> section"""
    changes = []

    # Check if resource hints already exist
    if 'rel="preconnect"' in content and 'rel="preload"' in content:
        return content, changes

    # Resource hints to add
    hints = []

    # 1. DNS Prefetch and Preconnect for CDNs
    if 'cdn.jsdelivr.net' in content and 'rel="preconnect"' not in content:
        hints.append('  <!-- DNS Prefetch and Preconnect for faster CDN loading -->')
        hints.append('  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">')
        hints.append('  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>')
        changes.append("Added preconnect for CDN")

    # 2. Preload critical CSS
    if 'modern-header-footer.css' in content and 'rel="preload"' not in content:
        hints.append('')
        hints.append('  <!-- Preload critical CSS for faster rendering -->')
        hints.append('  <link rel="preload" href="./assets/css/modern-header-footer.css" as="style">')
        changes.append("Added preload for critical CSS")

    # 3. Preload critical fonts (if any)
    # hints.append('  <link rel="preload" href="./assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>')

    # 4. Preload hero image for faster LCP
    if filepath == "index.html":
        # Preload hero/above-fold images
        hints.append('')
        hints.append('  <!-- Preload hero logo for faster LCP -->')
        hints.append('  <link rel="preload" href="./assets/footer_picture.png" as="image">')
        changes.append("Added preload for hero logo")

    # 5. Add performance.css
    if 'performance.css' not in content:
        hints.append('')
        hints.append('  <!-- Performance optimizations for Core Web Vitals -->')
        hints.append('  <link rel="stylesheet" href="./assets/css/performance.css">')
        changes.append("Added performance.css")

    if not hints:
        return content, changes

    # Find insertion point (after meta tags, before first CSS link or end of head)
    insertion_point = None

    # Try to insert after theme-color meta tag
    match = re.search(r'<meta name="theme-color"[^>]*>\n', content)
    if match:
        insertion_point = match.end()
    else:
        # Insert before first link rel="stylesheet"
        match = re.search(r'<link rel="stylesheet"', content)
        if match:
            insertion_point = match.start()
        else:
            # Insert before </head>
            match = re.search(r'</head>', content)
            if match:
                insertion_point = match.start()

    if insertion_point:
        hints_text = '\n'.join(hints) + '\n\n'
        content = content[:insertion_point] + hints_text + content[insertion_point:]

    return content, changes

def optimize_script_loading(content: str) -> tuple[str, list]:
    """Ensure all scripts use defer or async"""
    changes = []

    # Find script tags without defer/async (except inline scripts and JSON-LD)
    script_pattern = r'<script\s+src="([^"]+)"([^>]*)></script>'

    def replace_script(match):
        nonlocal changes
        src = match.group(1)
        attrs = match.group(2)

        # Skip if already has defer or async
        if 'defer' in attrs or 'async' in attrs:
            return match.group(0)

        # Skip if it's JSON-LD
        if 'application/ld+json' in attrs:
            return match.group(0)

        # Add defer for local scripts, async for CDN scripts
        if src.startswith('http'):
            # CDN scripts can use async
            changes.append(f"Added async to {src}")
            return f'<script src="{src}"{attrs} async></script>'
        else:
            # Local scripts should use defer to maintain order
            changes.append(f"Added defer to {src}")
            return f'<script src="{src}"{attrs} defer></script>'

    new_content = re.sub(script_pattern, replace_script, content)
    return new_content, changes

def process_file(filepath: str) -> dict:
    """Process a single HTML file"""
    print(f"\n📄 Processing: {filepath}")

    if not os.path.exists(filepath):
        print(f"   ⚠️  File not found, skipping")
        return {"file": filepath, "changes": []}

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    all_changes = []

    # Add resource hints
    content, changes = add_resource_hints_to_head(content, filepath)
    all_changes.extend(changes)
    for change in changes:
        print(f"   ✓ {change}")

    # Optimize script loading
    content, changes = optimize_script_loading(content)
    all_changes.extend(changes)
    for change in changes:
        print(f"   ✓ {change}")

    # Write back if changes were made
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   💾 Saved {len(all_changes)} optimization(s)")
    else:
        print("   ℹ️  No changes needed")

    return {"file": filepath, "changes": all_changes}

def main():
    """Main execution"""
    print("=" * 70)
    print("⚡ Resource Hints & Script Optimization")
    print("=" * 70)
    print("Target: Faster LCP via preloading critical resources")
    print()

    # Change to project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    os.chdir(project_root)

    results = []
    total_files = 0
    total_changes = 0

    for html_file in HTML_FILES:
        result = process_file(html_file)
        results.append(result)
        if result["changes"]:
            total_files += 1
            total_changes += len(result["changes"])

    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"Total files processed: {len(HTML_FILES)}")
    print(f"Files modified: {total_files}")
    print(f"Total improvements: {total_changes}")

    if total_changes > 0:
        print("\n✅ Resource hints applied successfully!")
        print("\n📋 Changes by file:")
        for result in results:
            if result["changes"]:
                print(f"\n   {result['file']}:")
                for change in result["changes"]:
                    print(f"      • {change}")
    else:
        print("\n✅ All files already optimized!")

    print("\n" + "=" * 70)
    print("🎯 Expected Impact:")
    print("   • Faster DNS resolution (preconnect)")
    print("   • Critical CSS loaded earlier (preload)")
    print("   • Hero images load faster (preload)")
    print("   • Non-blocking JavaScript (defer/async)")
    print("   • Improved LCP score")
    print("=" * 70)

if __name__ == "__main__":
    main()
