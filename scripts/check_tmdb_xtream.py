#!/usr/bin/env python3
"""
Validate that a TMDB metadata server is returning genuine Xtream Codes API responses
instead of a thin mimic that breaks Tuliprox compatibility.

Usage:
    python3 check_tmdb_xtream.py --base-url https://example.com --username demo --password demo
"""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Tuple


REQUIRED_USER_KEYS = {"auth", "status", "exp_date", "is_trial"}
REQUIRED_SERVER_KEYS = {"server_protocol", "https_port", "time_now"}


def fetch_xtream_payload(base_url: str, username: str, password: str) -> Tuple[int, Dict[str, Any]]:
    query = urllib.parse.urlencode({"username": username, "password": password})
    url = f"{base_url.rstrip('/')}/player_api.php?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "tmdb-xtream-validator/1.0"})

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            content_type = response.headers.get("Content-Type", "")
            body = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:  # pragma: no cover - defensive logging only
        return exc.code, {"error": f"HTTP {exc.code} while calling {url}"}
    except urllib.error.URLError as exc:  # pragma: no cover - defensive logging only
        return 0, {"error": f"Network error: {exc.reason}"}

    if "json" not in content_type.lower():
        return 200, {"error": "Response is not JSON", "body": body[:500]}

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return 200, {"error": "Invalid JSON", "body": body[:500]}

    return 200, payload


def check_keys(name: str, payload: Dict[str, Any], required: set) -> Tuple[bool, set]:
    missing = required - set(payload.keys())
    return len(missing) == 0, missing


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate TMDB server Xtream output")
    parser.add_argument("--base-url", required=True, help="Base URL of the TMDB/Xtream server (no trailing slash)")
    parser.add_argument("--username", required=True, help="Xtream username to test")
    parser.add_argument("--password", required=True, help="Xtream password to test")
    args = parser.parse_args()

    status, payload = fetch_xtream_payload(args.base_url, args.username, args.password)
    if status != 200:
        print(f"❌ Request failed (HTTP {status}): {payload.get('error', 'Unknown error')}")
        return 1

    if "error" in payload:
        print(f"❌ Response error: {payload['error']}")
        if "body" in payload:
            print(f"Body preview: {payload['body']}")
        return 1

    user_info = payload.get("user_info", {})
    server_info = payload.get("server_info", {})

    user_ok, missing_user = check_keys("user_info", user_info, REQUIRED_USER_KEYS)
    server_ok, missing_server = check_keys("server_info", server_info, REQUIRED_SERVER_KEYS)

    if not isinstance(user_info, dict) or not isinstance(server_info, dict):
        print("❌ Response shape does not match Xtream Codes format (user_info/server_info missing)")
        return 1

    problems = []
    if not user_ok:
        problems.append(f"user_info missing keys: {', '.join(sorted(missing_user))}")
    if not server_ok:
        problems.append(f"server_info missing keys: {', '.join(sorted(missing_server))}")

    if problems:
        print("⚠️ Response resembles Xtream Codes but is incomplete:")
        for item in problems:
            print(f"  - {item}")
        return 1

    streams = payload.get("available_channels") or payload.get("available_series") or payload.get("available_movies")
    if streams is None:
        print("⚠️ Response is Xtream-shaped but missing content listings (channels/series/movies).")
        return 1

    print("✅ TMDB server is returning a valid Xtream Codes response.")
    print(f"User status: {user_info.get('status')}, expires: {user_info.get('exp_date')}, trial: {user_info.get('is_trial')}")
    print(f"Server protocol: {server_info.get('server_protocol')} (HTTPS port {server_info.get('https_port')})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
