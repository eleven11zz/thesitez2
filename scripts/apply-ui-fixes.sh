#!/bin/bash

# Script to apply UI/UX fixes to all HTML pages
# Adds ui-ux-fixes.css after mobile-tablet-fixes.css
# Adds navigation.js before </body>

FILES=(
  "tv-box-products.html"
  "blog.html"
  "faq.html"
  "channel-lists.html"
  "search.html"
)

cd /home/user/thesitez2

for file in "${FILES[@]}"; do
  echo "Processing $file..."

  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "  ⚠️  File not found, skipping"
    continue
  fi

  # Add ui-ux-fixes.css if not already present
  if ! grep -q "ui-ux-fixes.css" "$file"; then
    # Find the line with mobile-tablet-fixes.css and add ui-ux-fixes.css after it
    sed -i '/mobile-tablet-fixes.css/a\  <link rel="stylesheet" href="./assets/css/ui-ux-fixes.css">' "$file"
    echo "  ✅ Added ui-ux-fixes.css"
  else
    echo "  ℹ️  ui-ux-fixes.css already present"
  fi

  # Add navigation.js if not already present
  if ! grep -q "navigation.js" "$file"; then
    # Add before </body>
    sed -i 's|</body>|  <script src="./assets/js/navigation.js" defer></script>\n</body>|' "$file"
    echo "  ✅ Added navigation.js"
  else
    echo "  ℹ️  navigation.js already present"
  fi

  echo ""
done

echo "✅ All files processed!"
