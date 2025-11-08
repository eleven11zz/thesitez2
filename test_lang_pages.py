#!/usr/bin/env python3
"""Test language page accessibility"""
import requests

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

BASE_URL = "https://eleven11zz.github.io/thesitez2"

# Test each language page
languages = ['de', 'fr', 'it', 'nl', 'no', 'sv', 'th']

print("Testing language pages on GitHub Pages:\n")
print("=" * 70)

for lang in languages:
    url = f"{BASE_URL}/{lang}/"
    url_with_index = f"{BASE_URL}/{lang}/index.html"

    try:
        # Test directory URL
        response = requests.get(url, headers=HEADERS, timeout=10)
        status1 = response.status_code

        # Test with explicit index.html
        response2 = requests.get(url_with_index, headers=HEADERS, timeout=10)
        status2 = response2.status_code

        print(f"/{lang}/")
        print(f"  ├─ /{lang}/ → {status1} {'✅' if status1 == 200 else '❌'}")
        print(f"  └─ /{lang}/index.html → {status2} {'✅' if status2 == 200 else '❌'}")

    except Exception as e:
        print(f"/{lang}/ → ERROR: {e}")

    print()

print("=" * 70)
