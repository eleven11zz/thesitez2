#!/bin/bash
#
# Convert images to WebP format for better performance
# WebP typically reduces file size by 30-50% compared to JPEG/PNG
#
# Requirements: cwebp (install via: apt-get install webp or brew install webp)
#
# Usage: ./convert-to-webp.sh [directory]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "======================================================================="
echo -e "${BLUE}🖼️  WebP Image Conversion Tool${NC}"
echo "======================================================================="
echo ""

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}❌ Error: cwebp is not installed${NC}"
    echo ""
    echo "Install cwebp:"
    echo "  • Ubuntu/Debian: sudo apt-get install webp"
    echo "  • macOS: brew install webp"
    echo "  • Windows: Download from https://developers.google.com/speed/webp/download"
    echo ""
    exit 1
fi

# Get directory to convert (default to assets)
TARGET_DIR="${1:-./assets}"

if [ ! -d "$TARGET_DIR" ]; then
    echo -e "${RED}❌ Error: Directory not found: $TARGET_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Target directory:${NC} $TARGET_DIR"
echo ""

# Counters
CONVERTED=0
SKIPPED=0
ERRORS=0
TOTAL_ORIGINAL_SIZE=0
TOTAL_WEBP_SIZE=0

# Find all JPEG and PNG files
while IFS= read -r -d '' file; do
    # Get filename without extension
    filename=$(basename "$file")
    extension="${filename##*.}"
    filename_no_ext="${filename%.*}"
    directory=$(dirname "$file")

    # Skip if WebP version already exists
    webp_file="$directory/$filename_no_ext.webp"
    if [ -f "$webp_file" ]; then
        echo -e "${YELLOW}⏭️  Skipping (WebP exists):${NC} $filename"
        ((SKIPPED++))
        continue
    fi

    # Get original file size
    original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    TOTAL_ORIGINAL_SIZE=$((TOTAL_ORIGINAL_SIZE + original_size))

    # Convert to WebP with quality 85 (good balance between quality and size)
    echo -e "${BLUE}🔄 Converting:${NC} $filename"

    if cwebp -q 85 "$file" -o "$webp_file" > /dev/null 2>&1; then
        # Get WebP file size
        webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
        TOTAL_WEBP_SIZE=$((TOTAL_WEBP_SIZE + webp_size))

        # Calculate savings
        savings=$((100 - (webp_size * 100 / original_size)))

        echo -e "${GREEN}   ✓ Created:${NC} $filename_no_ext.webp (${savings}% smaller)"
        ((CONVERTED++))
    else
        echo -e "${RED}   ❌ Failed to convert:${NC} $filename"
        ((ERRORS++))
    fi

done < <(find "$TARGET_DIR" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -type f -print0)

# Summary
echo ""
echo "======================================================================="
echo -e "${BLUE}📊 CONVERSION SUMMARY${NC}"
echo "======================================================================="
echo -e "${GREEN}✓ Converted:${NC} $CONVERTED files"
echo -e "${YELLOW}⏭️  Skipped:${NC} $SKIPPED files"
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Errors:${NC} $ERRORS files"
fi

if [ $CONVERTED -gt 0 ]; then
    # Calculate total savings
    total_savings=$((100 - (TOTAL_WEBP_SIZE * 100 / TOTAL_ORIGINAL_SIZE)))
    original_mb=$(echo "scale=2; $TOTAL_ORIGINAL_SIZE / 1048576" | bc)
    webp_mb=$(echo "scale=2; $TOTAL_WEBP_SIZE / 1048576" | bc)
    saved_mb=$(echo "scale=2; ($TOTAL_ORIGINAL_SIZE - $TOTAL_WEBP_SIZE) / 1048576" | bc)

    echo ""
    echo -e "${BLUE}💾 Storage Savings:${NC}"
    echo "   Original: ${original_mb} MB"
    echo "   WebP: ${webp_mb} MB"
    echo -e "   ${GREEN}Saved: ${saved_mb} MB (${total_savings}%)${NC}"
fi

echo ""
echo "======================================================================="
echo -e "${BLUE}📝 NEXT STEPS:${NC}"
echo "======================================================================="
echo "1. Update HTML to use <picture> tag with WebP fallback:"
echo ""
echo "   <picture>"
echo "     <source srcset=\"image.webp\" type=\"image/webp\">"
echo "     <img src=\"image.jpg\" alt=\"Description\">"
echo "   </picture>"
echo ""
echo "2. Or use simple <img> with .webp src (modern browsers support it)"
echo ""
echo "3. Test images display correctly across browsers"
echo ""
echo "4. Consider keeping original files as fallback for older browsers"
echo "======================================================================="
