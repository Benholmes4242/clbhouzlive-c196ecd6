# Performance Test Checklist

## Quick Setup (5 min)
1. Open your app in Chrome: `https://74d6ba70-bf1d-4665-bd9a-aff281e4c1df.lovableproject.com`
2. Log in to your account
3. Open DevTools (F12 or Cmd+Option+I)

## For Each Tab (Videos & Shorts)

### Videos Tab Test
1. Navigate to `/discover?main=videos`
2. **Console**: Filter by `[perf]` → Copy all logs → Save as `videos_perf.txt`
3. **Network**: Enable "Disable cache" + "Fast 4G" throttling
4. Hard reload (Cmd+Shift+R)
5. Wait 10 seconds
6. Right-click Network → "Save all as HAR with content" → `videos_performance.har`
7. Screenshot the page (slow + loaded states)

### Shorts Tab Test  
1. Navigate to `/discover?main=shorts`
2. **Console**: Filter by `[perf]` → Copy all logs → Save as `shorts_perf.txt`
3. **Network**: Enable "Disable cache" + "Fast 4G" throttling
4. Hard reload (Cmd+Shift+R)
5. Wait 10 seconds
6. Right-click Network → "Save all as HAR with content" → `shorts_performance.har`
7. Screenshot the page (slow + loaded states)

## What to Look For

### In Console Logs (`[perf]`):
- `discover:data:resolve` - How long until data arrives?
- `ShortsGrid:mount→raf` - How long to paint the grid?
- `ShortsSuggestedProfiles:mount→raf` - Squircles paint time
- `first 6 squircles visible` - When do avatars show?
- Image/video load times - Any over 2 seconds?

### In Network Tab:
- Images over 500KB (especially banners)
- Requests taking over 2 seconds
- Any failed requests (4xx/5xx errors)
- Total requests before first paint

## Send Me Back

Just upload or paste:
- `videos_perf.txt` + `videos_performance.har`
- `shorts_perf.txt` + `shorts_performance.har`  
- Screenshots
- Quick note: "Top 3 things I noticed were slow"

I'll analyze everything and give you specific fixes! 🚀
