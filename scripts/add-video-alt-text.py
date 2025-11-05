#!/usr/bin/env python3
"""
Add ARIA labels to product videos for screen reader accessibility
"""

import re
from pathlib import Path

# Product video descriptions based on the product names
VIDEO_DESCRIPTIONS = {
    "English TV": "Premier English IPTV package preview - UK and US channels",
    "France TV": "France IPTV Collective package preview - French channels",
    "German TV": "DACH Sports & News package preview - German channels",
    "italy TV": "Italian Serie A IPTV package preview - Italian channels",
    "Latin TV": "LATAM Sports & Novelas package preview - Spanish and Portuguese channels",
    "Scandinavia TV": "Nordic IPTV Fabric package preview - Scandinavian channels",
    "India TV": "India Cricket & Cinema package preview - Indian channels",
    "Netherlands TV": "Netherlands All Access package preview - Dutch channels",
    "The world TV": "Global Hospitality IPTV package preview - Worldwide channels",
}

def add_aria_labels_to_videos(content: str, file_name: str) -> tuple[str, int]:
    """Add aria-label attributes to video elements"""
    changes = 0

    # Find all video elements with poster attributes
    video_pattern = r'<video class="catalog-video[^"]*"([^>]*?)>(.*?)</video>'

    def replace_video(match):
        nonlocal changes
        full_tag = match.group(0)
        video_attrs = match.group(1)
        video_content = match.group(2)

        # Check if aria-label already exists
        if 'aria-label=' in video_attrs:
            return full_tag  # No change

        # Extract poster filename to determine description
        poster_match = re.search(r'poster="[^"]*/([\w%\s]+)\.jpg"', video_attrs)
        if not poster_match:
            return full_tag

        filename = poster_match.group(1).replace('%20', ' ')
        description = VIDEO_DESCRIPTIONS.get(filename, f"{filename} package preview")

        # Add aria-label before the closing >
        new_attrs = video_attrs.rstrip() + f' aria-label="{description}"'
        changes += 1

        return f'<video class="catalog-video hover-play lazy-video" {new_attrs}>{video_content}</video>'

    new_content = re.sub(video_pattern, replace_video, content, flags=re.DOTALL)

    return new_content, changes

def process_file(file_path: str):
    """Process a single HTML file"""
    path = Path(file_path)

    if not path.exists():
        print(f"⚠️  File not found: {file_path}")
        return

    print(f"\n📄 Processing: {file_path}")

    # Read file
    content = path.read_text(encoding='utf-8')

    # Add aria-labels to videos
    new_content, changes = add_aria_labels_to_videos(content, path.name)

    if changes > 0:
        # Write back
        path.write_text(new_content, encoding='utf-8')
        print(f"   ✓ Added aria-label to {changes} video element(s)")
    else:
        print(f"   ℹ️  No changes needed")

    return changes

def main():
    """Main execution"""
    print("=" * 70)
    print("📹 Adding ARIA Labels to Product Videos")
    print("=" * 70)

    files = [
        "iptv-products.html",
        "tv-box-products.html",
    ]

    total_changes = 0
    for file in files:
        changes = process_file(file)
        if changes:
            total_changes += changes

    print("\n" + "=" * 70)
    print(f"✅ Added {total_changes} aria-label attributes to videos")
    print("=" * 70)

if __name__ == "__main__":
    main()
