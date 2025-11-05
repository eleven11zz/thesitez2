#!/usr/bin/env python3
"""
Fix Cumulative Layout Shift (CLS) by adding image dimensions
Prevents layout shifts by reserving space for images before they load

WCAG Core Web Vitals Target: CLS < 0.1
"""

import re
import os
from pathlib import Path
from typing import Dict, List, Tuple
from PIL import Image

# HTML files to process
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

# Common image dimensions (you can expand this based on actual images)
IMAGE_DIMENSIONS = {
    "footer_picture.png": (200, 60),  # Logo dimensions
    # Streaming service logos
    "netflix.png": (120, 60),
    "prime.png": (120, 60),
    "disney.png": (120, 60),
    "hbo.png": (120, 60),
    "huluu.jpg": (120, 60),
    "max.jpg": (120, 60),
    "apple.jpg": (120, 60),
    "espn.jpg": (120, 60),
    "paramount.jpg": (120, 60),
    "peacock.jpg": (120, 60),
    "roku.jpg": (120, 60),
    "youtube.png": (120, 60),
}

def get_image_dimensions(image_path: str) -> Tuple[int, int]:
    """Get actual dimensions of an image file"""
    try:
        # Try to get actual image dimensions
        if os.path.exists(image_path):
            with Image.open(image_path) as img:
                return img.size
    except Exception as e:
        print(f"   ⚠️  Could not read image: {image_path} - {e}")

    # Fallback to known dimensions
    filename = os.path.basename(image_path)
    if filename in IMAGE_DIMENSIONS:
        return IMAGE_DIMENSIONS[filename]

    # Default dimensions if unknown
    return None

def add_dimensions_to_images(content: str, html_file: str) -> Tuple[str, int]:
    """Add width and height attributes to img tags"""
    changes = 0

    # Pattern to match img tags without width/height
    img_pattern = r'<img\s+([^>]*?)src="([^"]+)"([^>]*?)>'

    def replace_img(match):
        nonlocal changes
        before_src = match.group(1)
        src = match.group(2)
        after_src = match.group(3)

        # Check if width/height already exist
        full_tag = match.group(0)
        if 'width=' in full_tag and 'height=' in full_tag:
            return full_tag  # Already has dimensions

        # Get image path relative to HTML file
        if html_file.startswith('sports/'):
            image_path = src.replace('../', '')
        else:
            image_path = src.replace('./', '')

        # Get dimensions
        dimensions = get_image_dimensions(image_path)

        if dimensions:
            width, height = dimensions
            changes += 1

            # Build new img tag with dimensions
            new_tag = f'<img {before_src}src="{src}" width="{width}" height="{height}"{after_src}>'
            return new_tag

        return full_tag  # No dimensions found, keep as is

    new_content = re.sub(img_pattern, replace_img, content)
    return new_content, changes

def add_lazy_loading(content: str) -> Tuple[str, int]:
    """Add loading='lazy' to images that don't have it"""
    changes = 0

    # Pattern for img tags without loading attribute
    def replace_lazy(match):
        nonlocal changes
        full_tag = match.group(0)

        # Skip if already has loading attribute or if it's above the fold (header logo)
        if 'loading=' in full_tag or 'header-logo' in full_tag:
            return full_tag

        changes += 1
        # Add loading="lazy" before the closing >
        new_tag = full_tag.replace('>', ' loading="lazy" decoding="async">')
        return new_tag

    img_pattern = r'<img\s+[^>]*?>'
    new_content = re.sub(img_pattern, replace_lazy, content)

    return new_content, changes

def add_aspect_ratio_css(content: str) -> Tuple[str, int]:
    """Add aspect-ratio CSS for responsive images"""
    # Check if aspect-ratio CSS already exists
    if 'aspect-ratio:' in content:
        return content, 0

    # This would be added to the CSS, not HTML
    return content, 0

def process_file(filepath: str) -> dict:
    """Process a single HTML file"""
    print(f"\n📄 Processing: {filepath}")

    if not os.path.exists(filepath):
        print(f"   ⚠️  File not found, skipping")
        return {"file": filepath, "changes": []}

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changes = []

    # Add image dimensions
    content, dim_changes = add_dimensions_to_images(content, filepath)
    if dim_changes > 0:
        changes.append(f"Added dimensions to {dim_changes} images")
        print(f"   ✓ Added width/height to {dim_changes} image(s)")

    # Add lazy loading
    content, lazy_changes = add_lazy_loading(content)
    if lazy_changes > 0:
        changes.append(f"Added lazy loading to {lazy_changes} images")
        print(f"   ✓ Added lazy loading to {lazy_changes} image(s)")

    # Write back if changes were made
    if changes:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   💾 Saved {len(changes)} performance improvements")
    else:
        print("   ℹ️  No changes needed")

    return {"file": filepath, "changes": changes}

def main():
    """Main execution"""
    print("=" * 70)
    print("⚡ Core Web Vitals Optimization - CLS Fix")
    print("=" * 70)
    print("Target: Cumulative Layout Shift (CLS) < 0.1")
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
        print("\n✅ CLS optimization applied successfully!")
        print("\n📋 Changes by file:")
        for result in results:
            if result["changes"]:
                print(f"\n   {result['file']}:")
                for change in result["changes"]:
                    print(f"      • {change}")
    else:
        print("\n✅ All files already optimized for CLS!")

    print("\n" + "=" * 70)
    print("🎯 Expected Impact:")
    print("   • Reduced layout shifts during image loading")
    print("   • Improved CLS score (target: < 0.1)")
    print("   • Better user experience (no jumping content)")
    print("   • Faster perceived performance with lazy loading")
    print("=" * 70)

if __name__ == "__main__":
    main()
