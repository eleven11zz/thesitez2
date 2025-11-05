#!/usr/bin/env python3
"""
Sports Events Fetcher for TVMaster VIP
======================================
Automatically fetches upcoming sports events from TheSportsDB API
and updates the events.json file for the live sports hub.

Usage:
    python3 fetch-events.py

Requirements:
    pip install requests

TheSportsDB API:
    Free tier: 2 requests per second
    Premium: Unlimited (Patreon supporters get API key)
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Any
import urllib.request
import urllib.error

# Configuration
OUTPUT_FILE = "../assets/js/events.json"
DAYS_AHEAD = 60  # Fetch events for next 60 days

# TheSportsDB API Configuration
# Free API key for testing (limited to 2 requests/second)
API_KEY = "3"  # Use "3" for testing or get your own from https://www.thesportsdb.com/api.php
API_BASE = f"https://www.thesportsdb.com/api/v1/json/{API_KEY}"

# Leagues to fetch (leagueId from TheSportsDB)
LEAGUES_CONFIG = [
    # Soccer / Football
    {"id": "4328", "name": "English Premier League", "slug": "premier-league", "sport": "Soccer"},
    {"id": "4335", "name": "Spanish La Liga", "slug": "la-liga", "sport": "Soccer"},
    {"id": "4331", "name": "Italian Serie A", "slug": "serie-a", "sport": "Soccer"},
    {"id": "4332", "name": "German Bundesliga", "slug": "bundesliga", "sport": "Soccer"},
    {"id": "4334", "name": "French Ligue 1", "slug": "ligue-1", "sport": "Soccer"},
    {"id": "4380", "name": "UEFA Champions League", "slug": "uefa-champions-league", "sport": "Soccer"},
    {"id": "4481", "name": "UEFA Europa League", "slug": "uefa-europa-league", "sport": "Soccer"},

    # American Sports
    {"id": "4391", "name": "National Football League", "slug": "nfl", "sport": "American Football"},
    {"id": "4387", "name": "NBA", "slug": "nba", "sport": "Basketball"},
    {"id": "4424", "name": "Major League Baseball", "slug": "mlb", "sport": "Baseball"},
    {"id": "4370", "name": "National Hockey League", "slug": "nhl", "sport": "Ice Hockey"},
    {"id": "4346", "name": "Major League Soccer", "slug": "mls", "sport": "Soccer"},

    # Combat Sports
    {"id": "4443", "name": "Ultimate Fighting Championship", "slug": "ufc", "sport": "Mixed Martial Arts"},
    {"id": "4444", "name": "Bellator MMA", "slug": "bellator", "sport": "Mixed Martial Arts"},

    # Motorsports
    {"id": "4370", "name": "Formula 1", "slug": "formula-1", "sport": "Motorsport"},

    # Other Sports
    {"id": "4460", "name": "Six Nations Rugby", "slug": "rugby-six-nations", "sport": "Rugby"},
    {"id": "4482", "name": "Indian Premier League", "slug": "cricket-ipl", "sport": "Cricket"},
    {"id": "4511", "name": "Big Bash League", "slug": "cricket-bbl", "sport": "Cricket"},
]


def fetch_url(url: str) -> Dict[str, Any]:
    """Fetch data from URL with error handling"""
    try:
        print(f"  Fetching: {url}")
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
            return data
    except urllib.error.HTTPError as e:
        print(f"  ❌ HTTP Error {e.code}: {e.reason}")
        return {}
    except urllib.error.URLError as e:
        print(f"  ❌ URL Error: {e.reason}")
        return {}
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return {}


def fetch_league_events(league_id: str) -> List[Dict[str, Any]]:
    """Fetch upcoming events for a specific league"""
    url = f"{API_BASE}/eventsnextleague.php?id={league_id}"
    data = fetch_url(url)

    if not data or "events" not in data or not data["events"]:
        return []

    return data["events"] or []


def parse_event(event_data: Dict[str, Any]) -> Dict[str, Any]:
    """Parse event data from TheSportsDB format to our format"""

    # Parse date and time
    date_str = event_data.get("dateEvent", "")
    time_str = event_data.get("strTime", "")

    # Combine date and time to create UTC datetime
    utc_datetime = None
    if date_str:
        try:
            if time_str:
                utc_datetime = f"{date_str}T{time_str}Z"
            else:
                utc_datetime = f"{date_str}T00:00:00Z"
        except:
            pass

    # Extract TV stations
    tv_stations = []
    for i in range(1, 6):
        station = event_data.get(f"strTVStation{i}")
        if station:
            tv_stations.append(station)

    # Create event object
    event = {
        "id": event_data.get("idEvent"),
        "slug": event_data.get("strEvent", "").lower().replace(" ", "-").replace("vs", "vs"),
        "title": event_data.get("strEvent"),
        "league": event_data.get("strLeague"),
        "season": event_data.get("strSeason"),
        "sport": event_data.get("strSport"),
        "start": {
            "utc": utc_datetime,
            "date": date_str,
            "time": time_str or "00:00"
        },
        "venue": event_data.get("strVenue"),
        "city": event_data.get("strCity"),
        "tvStations": tv_stations,
        "image": event_data.get("strThumb") or event_data.get("strPoster"),
        "article": event_data.get("strArticle"),
        "highlights": event_data.get("strVideo"),
        "odds": None,
        "mapsUrl": None,
        "eventUrl": f"https://www.thesportsdb.com/event/{event_data.get('idEvent')}",
        "homeTeam": {
            "id": event_data.get("idHomeTeam"),
            "name": event_data.get("strHomeTeam"),
            "badge": event_data.get("strHomeTeamBadge")
        },
        "awayTeam": {
            "id": event_data.get("idAwayTeam"),
            "name": event_data.get("strAwayTeam"),
            "badge": event_data.get("strAwayTeamBadge")
        }
    }

    # Generate Google Maps URL if venue and city available
    if event["venue"] and event["city"]:
        query = f"{event['venue']} {event['city']}".replace(" ", "%20")
        event["mapsUrl"] = f"https://www.google.com/maps/search/?api=1&query={query}"

    return event


def filter_upcoming_events(events: List[Dict[str, Any]], days: int = DAYS_AHEAD) -> List[Dict[str, Any]]:
    """Filter events to only include those in the next X days"""
    now = datetime.utcnow()
    cutoff = now + timedelta(days=days)

    filtered = []
    for event in events:
        date_str = event.get("start", {}).get("date")
        if not date_str:
            continue

        try:
            event_date = datetime.strptime(date_str, "%Y-%m-%d")
            if now <= event_date <= cutoff:
                filtered.append(event)
        except:
            continue

    return filtered


def fetch_all_events() -> Dict[str, Any]:
    """Fetch events from all configured leagues"""
    print("\n🔄 Fetching sports events from TheSportsDB...\n")

    leagues_data = []

    for league_config in LEAGUES_CONFIG:
        league_id = league_config["id"]
        league_name = league_config["name"]

        print(f"📊 {league_name} (ID: {league_id})")

        raw_events = fetch_league_events(league_id)

        if not raw_events:
            print(f"  ⚠️  No upcoming events found\n")
            continue

        # Parse and filter events
        parsed_events = [parse_event(e) for e in raw_events]
        upcoming_events = filter_upcoming_events(parsed_events)

        if not upcoming_events:
            print(f"  ⚠️  No events in next {DAYS_AHEAD} days\n")
            continue

        print(f"  ✅ Found {len(upcoming_events)} upcoming events\n")

        league_data = {
            "leagueId": league_id,
            "slug": league_config["slug"],
            "label": league_name,
            "sport": league_config["sport"],
            "events": upcoming_events
        }

        leagues_data.append(league_data)

    return {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "source": "TheSportsDB",
        "leagues": leagues_data
    }


def save_events(data: Dict[str, Any], output_path: str):
    """Save events data to JSON file"""
    try:
        # Get absolute path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        full_path = os.path.join(script_dir, output_path)

        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        # Write JSON file
        with open(full_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Events saved to: {full_path}")
        print(f"📊 Total leagues: {len(data['leagues'])}")

        total_events = sum(len(league["events"]) for league in data["leagues"])
        print(f"🎯 Total events: {total_events}")

        return True
    except Exception as e:
        print(f"\n❌ Error saving file: {str(e)}")
        return False


def main():
    """Main execution function"""
    print("=" * 60)
    print("   TVMaster VIP - Sports Events Fetcher")
    print("=" * 60)

    # Fetch events
    events_data = fetch_all_events()

    if not events_data["leagues"]:
        print("\n⚠️  No events fetched. Check your internet connection or API key.")
        sys.exit(1)

    # Save to file
    success = save_events(events_data, OUTPUT_FILE)

    if success:
        print("\n✅ Event update complete!")
        print(f"⏰ Next update recommended in 24 hours")
        sys.exit(0)
    else:
        print("\n❌ Failed to save events")
        sys.exit(1)


if __name__ == "__main__":
    main()
