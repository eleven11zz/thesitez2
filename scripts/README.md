# Sports Events Auto-Fetcher

Automatically fetch and update sports events for the TVMaster VIP live sports hub.

## 📋 Overview

The `fetch-events.py` script pulls upcoming sports events from TheSportsDB API and updates your `assets/js/events.json` file automatically.

### Current Sports Categories (15 leagues):

**Soccer / Football:**
- ⚽ English Premier League
- ⚽ Spanish La Liga
- ⚽ Italian Serie A
- ⚽ German Bundesliga
- ⚽ French Ligue 1
- ⚽ UEFA Champions League
- ⚽ UEFA Europa League

**American Sports:**
- 🏈 NFL (National Football League)
- 🏀 NBA (Basketball)
- ⚾ MLB (Major League Baseball)
- 🏒 NHL (Ice Hockey)
- ⚽ MLS (Major League Soccer)

**Combat Sports:**
- 🥊 UFC (Ultimate Fighting Championship)
- 🥊 Bellator MMA

**Other Sports:**
- 🏎️ Formula 1
- 🏉 Six Nations Rugby
- 🏏 Indian Premier League (Cricket)
- 🏏 Big Bash League (Cricket)

## 🚀 Quick Start

### 1. Install Python Requirements

```bash
# The script uses only standard Python libraries
# No additional packages needed!
python3 --version  # Make sure Python 3.6+ is installed
```

### 2. Run the Script

```bash
cd scripts
python3 fetch-events.py
```

### 3. Output

The script will:
- ✅ Fetch events from TheSportsDB API
- ✅ Filter events for next 60 days
- ✅ Update `assets/js/events.json`
- ✅ Show summary of fetched events

Example output:
```
============================================================
   TVMaster VIP - Sports Events Fetcher
============================================================

🔄 Fetching sports events from TheSportsDB...

📊 English Premier League (ID: 4328)
  Fetching: https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328
  ✅ Found 12 upcoming events

📊 Spanish La Liga (ID: 4335)
  Fetching: https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4335
  ✅ Found 10 upcoming events

...

✅ Events saved to: /path/to/assets/js/events.json
📊 Total leagues: 15
🎯 Total events: 87

✅ Event update complete!
⏰ Next update recommended in 24 hours
```

## 🔧 Configuration

### Change Leagues

Edit `LEAGUES_CONFIG` in `fetch-events.py`:

```python
LEAGUES_CONFIG = [
    {"id": "4328", "name": "English Premier League", "slug": "premier-league", "sport": "Soccer"},
    # Add more leagues here
]
```

### Find League IDs

Visit [TheSportsDB](https://www.thesportsdb.com/):
1. Search for your league
2. View the league page
3. ID is in the URL: `thesportsdb.com/league/{LEAGUE_ID}`

Popular League IDs:
- **4328** - English Premier League
- **4335** - Spanish La Liga
- **4391** - NFL
- **4387** - NBA
- **4424** - MLB
- **4370** - NHL
- **4443** - UFC
- **4420** - Formula 1
- **4482** - Indian Premier League (Cricket)

### Change Time Range

Edit `DAYS_AHEAD` in `fetch-events.py`:

```python
DAYS_AHEAD = 60  # Fetch events for next 60 days
```

## ⏰ Automate Updates

### Option 1: Cron Job (Linux/Mac)

Update events daily at 3 AM:

```bash
crontab -e
```

Add this line:
```cron
0 3 * * * cd /path/to/thesitez2/scripts && /usr/bin/python3 fetch-events.py >> /tmp/fetch-events.log 2>&1
```

### Option 2: GitHub Actions (Automatic)

Create `.github/workflows/update-events.yml`:

```yaml
name: Update Sports Events

on:
  schedule:
    # Run daily at 3:00 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-events:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Fetch Events
        run: |
          cd scripts
          python3 fetch-events.py

      - name: Commit and Push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add assets/js/events.json
          git diff --quiet && git diff --staged --quiet || git commit -m "Update sports events - $(date '+%Y-%m-%d')"
          git push
```

### Option 3: Manual Update

Simply run whenever you want fresh data:
```bash
cd scripts && python3 fetch-events.py
```

## 🔑 API Key (Optional)

The script uses the free TheSportsDB test API key (`"3"`).

**Limitations:**
- 2 requests per second
- Suitable for testing and low-volume use

**Get Premium Access:**
1. Visit [TheSportsDB Patreon](https://www.patreon.com/thesportsdb)
2. Subscribe ($2/month)
3. Get your personal API key
4. Update `API_KEY` in `fetch-events.py`:

```python
API_KEY = "YOUR_API_KEY_HERE"
```

**Premium Benefits:**
- Unlimited requests
- Higher priority
- Support development

## 📊 Data Format

The script outputs JSON in this format:

```json
{
  "generatedAt": "2025-01-15T12:00:00.000Z",
  "source": "TheSportsDB",
  "leagues": [
    {
      "leagueId": "4328",
      "slug": "premier-league",
      "label": "English Premier League",
      "sport": "Soccer",
      "events": [
        {
          "id": "2056445",
          "slug": "arsenal-vs-liverpool",
          "title": "Arsenal vs Liverpool",
          "start": {
            "utc": "2025-02-15T17:30:00Z",
            "date": "2025-02-15",
            "time": "17:30"
          },
          "venue": "Emirates Stadium",
          "city": "London, England",
          "tvStations": ["Sky Sports", "NBC"],
          "homeTeam": {
            "name": "Arsenal",
            "badge": "https://..."
          },
          "awayTeam": {
            "name": "Liverpool",
            "badge": "https://..."
          }
        }
      ]
    }
  ]
}
```

## 🐛 Troubleshooting

### "No events fetched"
- Check internet connection
- Verify TheSportsDB is accessible
- Try with different league IDs

### "HTTP Error 429"
- You're hitting API rate limits
- Wait 1 minute and try again
- Consider getting premium API key

### "Permission denied"
- Make script executable: `chmod +x fetch-events.py`
- Check file write permissions

### Events not showing on website
- Clear browser cache (Ctrl+F5)
- Check `events.json` was updated
- Verify file path is correct

## 📈 Adding More Sports

Want to add more sports categories? Here are popular options:

**More Soccer Leagues:**
```python
{"id": "4346", "name": "MLS", "slug": "mls", "sport": "Soccer"},
{"id": "4344", "name": "Brazilian Serie A", "slug": "brasileirao", "sport": "Soccer"},
{"id": "4347", "name": "Eredivisie", "slug": "eredivisie", "sport": "Soccer"},
```

**More Combat Sports:**
```python
{"id": "4444", "name": "Bellator", "slug": "bellator", "sport": "MMA"},
{"id": "4443", "name": "PFL", "slug": "pfl", "sport": "MMA"},
```

**Tennis:**
```python
{"id": "4421", "name": "ATP Tour", "slug": "atp", "sport": "Tennis"},
{"id": "4422", "name": "WTA Tour", "slug": "wta", "sport": "Tennis"},
```

**Motorsports:**
```python
{"id": "4370", "name": "Formula 1", "slug": "f1", "sport": "Motorsport"},
{"id": "4433", "name": "MotoGP", "slug": "motogp", "sport": "Motorsport"},
{"id": "4480", "name": "NASCAR", "slug": "nascar", "sport": "Motorsport"},
```

**Golf:**
```python
{"id": "4424", "name": "PGA Tour", "slug": "pga", "sport": "Golf"},
```

## 🔗 Useful Links

- [TheSportsDB API Docs](https://www.thesportsdb.com/api.php)
- [TheSportsDB Patreon](https://www.patreon.com/thesportsdb)
- [Find League IDs](https://www.thesportsdb.com/sport/Soccer)
- [GitHub - TheSportsDB](https://github.com/enen92/script.module.thesportsdb)

## 📝 License

This script is part of TVMaster VIP website and uses TheSportsDB API.

---

**Need help?** Contact TVMaster VIP support or check the API documentation.
