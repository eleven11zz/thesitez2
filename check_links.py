import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

BASE_URL = "https://eleven11zz.github.io/thesitez2/"
visited_pages = set()
broken_links = []

# Headers to avoid 403 errors
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def is_internal_link(href):
    if not href:
        return False
    parsed = urlparse(href)
    # Internal if no netloc OR same host & path starts with /thesitez2
    if not parsed.netloc:
        return True
    return parsed.netloc == "eleven11zz.github.io"

def crawl(url):
    if url in visited_pages:
        return
    visited_pages.add(url)

    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
    except Exception as e:
        print(f"[ERROR] {url} -> {e}")
        return

    if r.status_code != 200:
        print(f"[PAGE ERROR] {url} -> {r.status_code}")
        return

    soup = BeautifulSoup(r.text, "html.parser")

    for a in soup.find_all("a"):
        href = a.get("href")
        if not href or href.startswith("mailto:") or href.startswith("tel:") or href.startswith("javascript:"):
            continue

        if is_internal_link(href):
            target = urljoin(url, href)
            # Strip fragments
            target = target.split("#")[0]

            # Skip non-html assets
            if any(target.endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".ico", ".pdf", ".zip", ".txt", ".json")):
                continue

            try:
                res = requests.get(target, headers=HEADERS, timeout=10)
                if res.status_code == 404:
                    broken_links.append((url, href, target, res.status_code))
                # Crawl deeper only for html pages under /thesitez2/
                if res.status_code == 200 and "/thesitez2/" in target and target not in visited_pages:
                    crawl(target)
            except Exception as e:
                broken_links.append((url, href, target, str(e)))


if __name__ == "__main__":
    crawl(BASE_URL)

    print("\n=== Broken / suspicious internal links ===")
    if not broken_links:
        print("None found ✅")
    else:
        for src, raw, full, status in broken_links:
            print(f"On {src} -> '{raw}' -> {full} => {status}")
