# Translation Issues - Quick Reference Guide

## Issues Found by Language

### German (de) - 4 Issues

| Key | Current Value | Status | Recommendation | Priority |
|-----|---------------|--------|----------------|----------|
| `site.tagline` | #1 Premium IPTV Service | ⚠ Should translate | #1 Premium IPTV-Dienst | MEDIUM |
| `nav.live_hub` | Live Hub | ⚠ Should translate | Direkthub | LOW |
| `nav.faq` | FAQ | ✓ Acceptable | Keep as is | - |
| `nav.blog` | Blog | ✓ Acceptable | Keep as is | - |

---

### Dutch (nl) - 6 Issues

| Key | Current Value | Status | Recommendation | Priority |
|-----|---------------|--------|----------------|----------|
| `site.tagline` | #1 Premium IPTV Service | ⚠ Should translate | #1 Premium IPTV-Dienst | MEDIUM |
| `nav.home` | Home | ⚠ Consider translating | Start or Thuis | LOW |
| `nav.live_hub` | Live Hub | ⚠ Consider translating | Directe Hub | LOW |
| `footer.contact_title` | Contact | ✓ Acceptable | Keep as is | - |
| `nav.faq` | FAQ | ✓ Acceptable | Keep as is | - |
| `nav.blog` | Blog | ✓ Acceptable | Keep as is | - |

---

### French (fr) - 3 Issues

| Key | Current Value | Status | Recommendation | Priority |
|-----|---------------|--------|----------------|----------|
| `footer.contact_title` | Contact | ✓ Acceptable | Keep as is | - |
| `nav.faq` | FAQ | ✓ Acceptable | Keep as is | - |
| `nav.blog` | Blog | ✓ Acceptable | Keep as is | - |

---

### Italian (it) - 3 Issues

| Key | Current Value | Status | Recommendation | Priority |
|-----|---------------|--------|----------------|----------|
| `nav.home` | Home | ✓ Acceptable | Keep as is (or "Inizio") | - |
| `nav.faq` | FAQ | ✓ Acceptable | Keep as is | - |
| `nav.blog` | Blog | ✓ Acceptable | Keep as is | - |

---

### Norwegian (no) - 1 Issue

| Key | Current Value | Status | Recommendation | Priority |
|-----|---------------|--------|----------------|----------|
| `nav.faq` | FAQ | ✓ Acceptable | Keep as is | - |

---

### Swedish (sv) - 2 Issues

| Key | Current Value | Status | Recommendation | Priority |
|-----|---------------|--------|----------------|----------|
| `site.support_hours` | 24/7 Global Support | ⚠ Should translate | 24/7 Världsomspännande Support | LOW |
| `nav.faq` | FAQ | ✓ Acceptable | Keep as is | - |

---

### Thai (th) - 0 Issues ✓

**Perfect translation!** No issues found.

---

## Action Items Summary

### High Priority (Fix Immediately)
- None

### Medium Priority (Recommended to Fix)
1. **German** - Translate `site.tagline` to "#1 Premium IPTV-Dienst"
2. **Dutch** - Translate `site.tagline` to "#1 Premium IPTV-Dienst"

### Low Priority (Optional Improvements)
1. **German** - Translate `nav.live_hub` to "Direkthub"
2. **Dutch** - Translate `nav.home` to "Start"
3. **Dutch** - Translate `nav.live_hub` to "Directe Hub"
4. **Swedish** - Translate `site.support_hours` to "24/7 Världsomspännande Support"

### No Action Needed (Acceptable as International Terms)
- **FAQ** - All languages (international acronym)
- **Blog** - All languages (international term)
- **Contact** - French, Dutch (standard term)
- **Home** - Italian (widely understood)

---

## Copy-Paste Ready Changes

If you want to implement the recommended medium-priority changes, here are the exact values to update:

### German (de)
```json
"tagline": "#1 Premium IPTV-Dienst"
```

### Dutch (nl)
```json
"tagline": "#1 Premium IPTV-Dienst"
```

### Swedish (sv)
```json
"support_hours": "24/7 Världsomspännande Support"
```

### German (de) - Optional
```json
"live_hub": "Direkthub"
```

### Dutch (nl) - Optional
```json
"home": "Start",
"live_hub": "Directe Hub"
```

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ⚠ | Should fix or consider translating |
| ✓ | Acceptable as is (international term) |
| MEDIUM | Recommended to fix for better localization |
| LOW | Optional improvement |
| - | No action needed |
