# GitHub Actions Automation Guide

## 🤖 Automatic Sports Events Updates

Your repository is now configured to automatically fetch and update sports events **every day at 3:00 AM UTC**.

### ✨ What Happens Automatically

Every day at 3 AM UTC, GitHub Actions will:

1. ✅ Fetch fresh events from TheSportsDB API
2. ✅ Update `assets/js/events.json`
3. ✅ Commit changes (if any)
4. ✅ Push to your repository
5. ✅ GitHub Pages rebuilds automatically (2-3 minutes)

**Result:** Your live sports hub always shows the latest upcoming events!

---

## 📅 Schedule

- **Frequency:** Daily
- **Time:** 3:00 AM UTC
- **Timezone Conversions:**
  - 🇺🇸 PST: 7:00 PM (previous day)
  - 🇺🇸 EST: 10:00 PM (previous day)
  - 🇬🇧 London: 3:00 AM
  - 🇪🇺 Paris: 4:00 AM
  - 🇮🇳 India: 8:30 AM
  - 🇦🇺 Sydney: 2:00 PM

---

## 🎮 Manual Trigger (Run On-Demand)

Want to update events immediately? You can trigger the workflow manually:

### Steps:

1. **Go to GitHub Actions Tab**
   ```
   https://github.com/eleven11zz/thesitez2/actions
   ```

2. **Click "Update Sports Events"** workflow on the left sidebar

3. **Click "Run workflow"** button (top right)

4. **Select branch** (usually `main`)

5. **Click green "Run workflow"** button

6. **Wait ~30-60 seconds** for completion

7. **Check your live site** - events are updated!

---

## 📊 Monitor Automation

### View Workflow Runs:

Visit: `https://github.com/eleven11zz/thesitez2/actions/workflows/update-sports-events.yml`

You'll see:
- ✅ **Green checkmark** = Successful update
- ⏸️ **Yellow dot** = Currently running
- ❌ **Red X** = Failed (check logs)

### Check What Changed:

1. Go to workflow run
2. Click on the run
3. View "Summary" tab for details
4. Click commit to see changes

### View Commit History:

```
https://github.com/eleven11zz/thesitez2/commits/main
```

Look for commits like:
```
🔄 Auto-update sports events - 2025-01-15 03:00 UTC
```

---

## 🔧 Customization

### Change Update Frequency

Edit `.github/workflows/update-sports-events.yml`:

```yaml
# Current: Daily at 3 AM UTC
schedule:
  - cron: '0 3 * * *'

# Every 12 hours (3 AM and 3 PM UTC):
schedule:
  - cron: '0 3,15 * * *'

# Twice daily (3 AM and 3 PM UTC):
schedule:
  - cron: '0 3 * * *'
  - cron: '0 15 * * *'

# Every 6 hours:
schedule:
  - cron: '0 */6 * * *'

# Only on weekdays at 6 AM UTC:
schedule:
  - cron: '0 6 * * 1-5'

# Only on weekends at 10 AM UTC:
schedule:
  - cron: '0 10 * * 0,6'
```

**Cron Syntax:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
```

### Change Timezone

GitHub Actions always uses UTC. Convert your desired time:
- Use [Time Zone Converter](https://www.timeanddate.com/worldclock/converter.html)

**Examples:**
```yaml
# 9 AM EST = 2 PM UTC
- cron: '0 14 * * *'

# 6 PM PST = 2 AM UTC (next day)
- cron: '0 2 * * *'

# Midnight London time = 12 AM UTC
- cron: '0 0 * * *'
```

### Disable Automation

Comment out or remove the schedule section:

```yaml
# Temporarily disabled
# schedule:
#   - cron: '0 3 * * *'

# Keep manual trigger
workflow_dispatch:
```

---

## 🛠️ Troubleshooting

### Workflow Not Running

**Check:**
1. Workflow file exists: `.github/workflows/update-sports-events.yml`
2. File is on `main` branch
3. Repository has Actions enabled: Settings → Actions → Allow all actions

**Note:** GitHub disables scheduled workflows on inactive repos after 60 days. Manual trigger re-enables them.

### Workflow Failing

**Common Issues:**

1. **API Rate Limit**
   - Wait 1 hour and try again
   - Consider premium API key

2. **Network Issues**
   - TheSportsDB might be temporarily down
   - Will retry next scheduled run

3. **Permission Denied**
   - Check repository settings
   - Ensure Actions has write permissions

**View Error Logs:**
1. Go to failed workflow run
2. Click on job name
3. Expand failed step
4. Read error message

### No New Events

**This is normal if:**
- No new games scheduled since last update
- All events already in events.json
- Workflow will show "No Updates Needed"

### Events Not Showing on Website

**After workflow runs:**
1. Wait 2-3 minutes for GitHub Pages rebuild
2. Hard refresh browser: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
3. Check `events.json` was actually updated (view file on GitHub)

---

## 📈 Best Practices

### 1. Monitor First Week

Check Actions tab daily for first week to ensure everything works smoothly.

### 2. Set Up Notifications

**Get email when workflow fails:**

1. Go to: `https://github.com/settings/notifications`
2. Under "Actions"
3. Check "Send notifications for failed workflows only"

### 3. Check Before Big Events

**Manual trigger recommended before:**
- Super Bowl
- World Cup matches
- UFC PPV events
- Major playoffs

Run manually 2-3 hours before event starts to ensure latest info.

### 4. Review Monthly

Once a month, check:
- Workflow runs are completing successfully
- Events.json is updating regularly
- Live hub is displaying correctly

---

## 🔍 Advanced: Webhook Integration

Want to trigger updates from external services? Add webhook support:

```yaml
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:
  repository_dispatch:  # Add this
    types: [update-events]
```

Then trigger via API:
```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: token YOUR_PAT_TOKEN" \
  https://api.github.com/repos/eleven11zz/thesitez2/dispatches \
  -d '{"event_type":"update-events"}'
```

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cron Syntax Checker](https://crontab.guru/)
- [TheSportsDB API](https://www.thesportsdb.com/api.php)

---

## ✅ Quick Reference

| Action | How |
|--------|-----|
| **Manual Update** | Actions tab → "Update Sports Events" → Run workflow |
| **View Runs** | Actions tab → "Update Sports Events" |
| **Check Logs** | Click on workflow run → Click job name |
| **Change Schedule** | Edit `.github/workflows/update-sports-events.yml` |
| **Disable Auto-Update** | Comment out `schedule:` section |

---

**Questions?** Check workflow logs or open an issue in the repository.

🎉 **Your sports events now update automatically every day!**
