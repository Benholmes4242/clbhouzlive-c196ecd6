# 🔍 Shorts Autoplay & White Flash Audit Report

**Status:** Instrumentation Added - Awaiting Console Data  
**Date:** 2025-10-11  
**Audit Mode:** Active (`AUDIT_SHORTS_AUTOPLAY = true`)

---

## 📊 Instrumentation Added

### Files Modified with Audit Logging

1. **`src/components/shorts/ShortsVideoTile.tsx`**
   - Card mount timing (performance marks)
   - Poster URL computation & load events
   - Video `canplay`, `loadedmetadata`, `playing` events
   - IntersectionObserver intersection timing
   - `play()` request & promise resolution tracking
   - Container background color diagnostic (red tint if no poster)

2. **`src/components/discover/ShortsGrid.tsx`**
   - Grid mount/update logging
   - IntersectionObserver setup with thresholds
   - Visibility change events per card
   - Infinite scroll trigger detection
   - New batch append detection
   - Row/column alternation logic verification

---

## 🎯 Key Metrics to Capture (Per Card)

All timings logged with prefix `[ShortsAudit]` in console:

| Metric | Description | Expected "Good" Value |
|--------|-------------|----------------------|
| `T_mount→posterReady` | Time from mount to poster image loaded | < 100ms |
| `T_mount→IO_intersect` | Time from mount to IO first detects visibility | < 50ms (initial cards) |
| `T_IO→playRequested` | Delay from IO detection to `play()` call | < 10ms |
| `T_playRequested→playing` | Delay from `play()` to `playing` event | < 200ms |
| **`T_mount→playing`** | **Total time to first frame** | **< 500ms** |

---

## 🔬 Root Cause Hypotheses

### 1. White Flash Issue

**Potential Causes to Verify:**

| # | Hypothesis | Evidence to Look For | Current Code Status |
|---|------------|---------------------|---------------------|
| 1a | Container default background is white/light | Check `bg-muted` CSS value | ✅ Currently `bg-muted` (could be light) |
| 1b | No poster rendered before video | Check poster URL validity & 404s | ⚠️ Using `posterUrl ∣∣ item.src` (fallback) |
| 1c | Opacity transition starts from white | CSS transition on video/poster | ⚠️ 150ms opacity transition present |
| 1d | Video `poster` attribute not set | Check video element poster prop | ✅ Set on `<video>` element |

**Expected Logs:**
- Poster load time vs video canplay time
- Background color diagnostic (red tint if missing poster)
- Poster 404 errors

---

### 2. Autoplay Delay Issue

**Potential Causes to Verify:**

| # | Hypothesis | Evidence to Look For | Current Code Status |
|---|------------|---------------------|---------------------|
| 2a | IO threshold too high (0.6) delays detection | Check initial cards IO timing | ⚠️ Threshold = 0.6 (60% visibility) |
| 2b | IO doesn't fire on initial render | Check `T_mount→IO_intersect` for initial cards | 🔴 **LIKELY ISSUE** (items dependency) |
| 2c | Waiting for `canplay` instead of `metadata` | Check readyState sequence | ✅ Using `canplay` (correct) |
| 2d | `play()` called before `muted`/`playsInline` set | Check attribute timing | ✅ Attributes set in effect before play |
| 2e | React effect order delays IO setup | Check IO observer setup timing | 🔴 **LIKELY ISSUE** (effect runs late) |
| 2f | Alternation logic breaks after append | Check row/col calculation after batch | ⚠️ Uses `i / cols` (should be OK) |

**Expected Logs:**
- IO setup timing vs first card mount
- IO intersection events for cards 0-5
- `play()` request timing vs `canplay` timing

---

## 🔍 Specific Issues Identified in Code Review

### Issue A: IntersectionObserver Effect Dependency on `items`
**Location:** `ShortsGrid.tsx` line 52-103  
**Problem:** Observer re-creates on every `items` change, causing:
- Observer disconnect/reconnect on initial load
- Delayed initial card observation
- Cards may not be observed until after first render + effect

**Evidence Needed:**
- Time between grid mount and IO setup
- Initial cards IO intersection timing

---

### Issue B: No Initial Visibility Check
**Location:** `ShortsGrid.tsx` line 52-103  
**Problem:** No code to check if cards are already in viewport on mount
- Cards that are visible on load won't trigger IO until scroll happens
- Relies on IO firing after setup (may be delayed)

**Evidence Needed:**
- Do initial visible cards show `IO intersect` logs?
- What's the delay from mount to first IO event?

---

### Issue C: Poster URL Fallback Logic
**Location:** `ShortsGrid.tsx` line 185  
**Code:** `posterUrl={item.thumbnailSrc || item.src}`  
**Problem:** If `thumbnailSrc` is missing, falls back to HLS manifest URL
- HLS manifest (`.m3u8`) cannot be used as an image poster
- Will result in 404 or failed poster load
- Container shows `bg-muted` background (potentially white)

**Evidence Needed:**
- Check for poster 404 errors in logs
- Check if `item.thumbnailSrc` is null for any cards

---

### Issue D: Cloudflare Stream Poster URL Generation
**Location:** Not using Cloudflare thumbnail API  
**Problem:** Not generating proper Cloudflare poster URLs
- Should use: `https://videodelivery.net/{uid}/thumbnails/thumbnail.jpg?height=600`
- Currently using raw `thumbnailSrc` which may be HLS URL

**Evidence Needed:**
- Inspect actual poster URLs in logs
- Check if they're valid JPEG/PNG URLs or HLS manifests

---

## 📋 Acceptance Criteria for Findings

✅ **Complete when we have:**

1. Console table with timings for first 12 cards:
   ```
   | Card ID | T_mount→poster | T_mount→IO | T_IO→play | T_play→playing | T_mount→playing | hasPoster | shouldAutoplay |
   ```

2. Summary of top 2-3 root causes for:
   - White flash (with avg timing deltas)
   - Autoplay lag (with avg timing deltas)

3. Exact code locations (file:line) where issues originate

4. One-paragraph recommendation per issue

---

## 🎬 Next Steps After Data Collection

**Phase 1: Collect Console Data** (Current)
- User loads `/discover?duration=shorts`
- Capture first 20-30 console logs with `[ShortsAudit]` prefix
- Scroll to trigger infinite append and capture 6 more card logs

**Phase 2: Analyze Data**
- Create timing summary table
- Identify bottlenecks (which T_x→y is largest?)
- Check for 404s, missing posters, IO timing issues

**Phase 3: Targeted Fix** (Not Yet)
- Based on findings, apply minimal fixes:
  - If IO timing issue → check initial visibility on mount
  - If poster issue → implement Cloudflare thumbnail URL generation
  - If white flash → adjust background color & transition strategy
  - If alternation breaks → verify column reflow logic

---

## 🔧 Configuration Summary

**Current Settings:**

```typescript
// IntersectionObserver
threshold: [0, 0.6, 1]        // 60% visibility required
rootMargin: '200px 0px'        // Preload 200px before viewport

// Video Element
preload: 'auto'                // Aggressive preload
muted: true                    // Required for autoplay
playsInline: true              // Required for iOS
loop: true                     // Seamless loop

// Poster/Video Transition
opacity transition: 150ms      // Fade between poster/video
```

**Recommended "Good" Settings:**

```typescript
// IntersectionObserver (for initial autoplay)
threshold: 0.05                // 5% visibility (much faster)
rootMargin: '0px'              // No preload margin for initial

// Video Element (same as current - OK)

// Poster/Video Transition
No opacity transition          // Instant swap (no flash)
background: #000               // Dark background (not muted)
```

---

## 📊 Data Collection Checklist

- [ ] Initial page load logs captured
- [ ] First 12 card timings recorded
- [ ] Poster URL format verified (JPEG vs m3u8)
- [ ] Poster load success/404 status
- [ ] IO intersection timing for visible cards
- [ ] `play()` promise resolution status
- [ ] Infinite scroll batch append logs
- [ ] New batch autoplay behavior
- [ ] Mobile vs Desktop comparison (if available)

---

**Audit Status:** 🟡 Instrumentation Active - Awaiting User Console Data
