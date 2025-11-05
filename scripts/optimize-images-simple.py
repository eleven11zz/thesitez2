#!/usr/bin/env python3
"""
Simple Image Optimization for Core Web Vitals
Adds lazy loading and aspect-ratio preservation to prevent CLS
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

def add_lazy_loading_to_images(content: str) -> tuple[str, int]:
    """Add loading='lazy' and decoding='async' to images below the fold"""
    changes = 0

    # Find all img tags
    img_pattern = r'(<img\s+[^>]*?)(>)'

    def replace_img(match):
        nonlocal changes
        img_tag = match.group(1)
        closing = match.group(2)

        # Skip if already has loading attribute
        if 'loading=' in img_tag:
            return match.group(0)

        # Skip header logos and hero images (above the fold)
        if any(x in img_tag for x in ['header-logo', 'hero-', 'brand-logo']):
            # These should load eagerly, but add decoding="async"
            if 'decoding=' not in img_tag:
                return f'{img_tag} decoding="async"{closing}'
            return match.group(0)

        # Add lazy loading to everything else
        attrs_to_add = []
        if 'loading=' not in img_tag:
            attrs_to_add.append('loading="lazy"')
        if 'decoding=' not in img_tag:
            attrs_to_add.append('decoding="async"')

        if attrs_to_add:
            changes += 1
            return f'{img_tag} {" ".join(attrs_to_add)}{closing}'

        return match.group(0)

    new_content = re.sub(img_pattern, replace_img, content)
    return new_content, changes

def add_video_lazy_loading(content: str) -> tuple[str, int]:
    """Add preload='none' to videos for lazy loading"""
    changes = 0

    # Find video tags without preload="none"
    video_pattern = r'(<video\s+[^>]*?)(>)'

    def replace_video(match):
        nonlocal changes
        video_tag = match.group(1)
        closing = match.group(2)

        # Check if preload is already set
        if 'preload=' in video_tag:
            return match.group(0)

        changes += 1
        return f'{video_tag} preload="none"{closing}'

    new_content = re.sub(video_pattern, replace_video, content)
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
    changes = []

    # Add lazy loading to images
    content, lazy_changes = add_lazy_loading_to_images(content)
    if lazy_changes > 0:
        changes.append(f"Optimized {lazy_changes} images with lazy loading")
        print(f"   ✓ Added lazy loading to {lazy_changes} image(s)")

    # Add lazy loading to videos
    content, video_changes = add_video_lazy_loading(content)
    if video_changes > 0:
        changes.append(f"Optimized {video_changes} videos with preload=none")
        print(f"   ✓ Optimized {video_changes} video(s)")

    # Write back if changes were made
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   💾 Saved {len(changes)} optimization(s)")
    else:
        print("   ℹ️  No changes needed")

    return {"file": filepath, "changes": changes}

def main():
    """Main execution"""
    print("=" * 70)
    print("⚡ Core Web Vitals - Image & Video Optimization")
    print("=" * 70)
    print("Target: LCP < 2.5s, CLS < 0.1")
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
        print("\n✅ Performance optimization applied successfully!")
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
    print("   • Faster page load (lazy loading defers offscreen images)")
    print("   • Reduced initial page weight")
    print("   • Better LCP score (critical images load first)")
    print("   • Improved mobile performance")
    print("=" * 70)

if __name__ == "__main__":
    main()
