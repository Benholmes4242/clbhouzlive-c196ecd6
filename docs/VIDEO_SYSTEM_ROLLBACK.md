# Video System Refactor: Rollback Procedures

## Overview

This document outlines rollback procedures for the poster → paused-video architecture migration.

---

## Rollback Triggers (Circuit Breakers)

Monitor these metrics. If any threshold is breached, initiate rollback:

| Metric | Threshold | Action |
|--------|-----------|--------|
| TTFF (P95) | Increases >30% | Level 1 Rollback |
| Video startup failure rate | Increases >5% | Level 1 Rollback |
| Video completion rate | Drops >10% | Level 2 Rollback |
| Crash/error rate | Significant increase | Level 3 Rollback |

---

## Level 1: Feature Flag Disable (< 5 minutes)

**When to use:** Performance degradation across all surfaces.

### Steps

1. Open `src/config/flags.ts`
2. Set the flag to `false`:

```typescript
// src/config/flags.ts
export const FLAGS = {
  // ... other flags
  USE_PAUSED_VIDEO_INSTEAD_OF_POSTER: false, // DISABLED - rollback
} as const;
```

3. Commit and deploy:
```bash
git add src/config/flags.ts
git commit -m "Rollback: Disable paused video mode"
git push origin main
```

4. Monitor dashboards for recovery (metrics should return to baseline within 5-10 minutes)

---

## Level 2: Component-Level Disable (< 30 minutes)

**When to use:** Only specific surfaces are affected.

### Steps

1. Identify the problematic surface (e.g., Watch page, Clubhouse feed)

2. Add explicit `usePausedVideo={false}` to affected components:

```tsx
// Example: src/media/MediaTile.tsx
<HLSPlayer
  src={videoUrl}
  poster={posterUrl}
  usePausedVideo={false}  // Force poster mode on this surface
  // ... other props
/>
```

3. Commit and deploy:
```bash
git add <affected-files>
git commit -m "Rollback: Disable paused video on [surface name]"
git push origin main
```

4. Re-enable globally once the surface-specific issue is identified and fixed

---

## Level 3: Full Git Revert (< 1 hour)

**When to use:** Critical bugs affecting core functionality.

### Steps

1. Identify the commit(s) to revert:
```bash
git log --oneline | head -20
```

2. Revert the migration commits:
```bash
git revert <commit-hash>
# Or for multiple commits:
git revert <oldest-hash>..<newest-hash>
```

3. Resolve any conflicts if they arise

4. Push to production:
```bash
git push origin main
```

5. Schedule post-mortem to identify root cause

---

## Monitoring Dashboards

### Key Metrics to Watch

1. **TTFF (Time to First Frame)**
   - Analytics event: `video_ttff`
   - Key fields: `ttff_ms`, `used_poster`, `surface`, `device`
   - Compare `used_poster=true` vs `used_poster=false`

2. **Video Failures**
   - Analytics event: `video_failure`
   - Key fields: `error`, `fatal`, `surface`

3. **Video Sessions**
   - Analytics event: `video_session_end`
   - Key fields: `duration_ms`, `had_error`, `rebuffer_count`

### Debug Tools

```javascript
// In browser console:
window.__videoPerf.logReport()  // Performance summary
window.__videoPerf.getSummary() // Raw metrics object
window.__videoPerf.getActiveSessions() // Current sessions
```

---

## Post-Rollback Checklist

- [ ] Verify metrics returned to baseline
- [ ] Notify team of rollback
- [ ] Document timeline of events
- [ ] Create investigation ticket
- [ ] Schedule post-mortem if Level 3 rollback

---

## Feature Flag Reference

```typescript
// src/config/flags.ts
FLAGS.USE_PAUSED_VIDEO_INSTEAD_OF_POSTER
// true  = New architecture (paused video first frame)
// false = Current architecture (poster images)

// Component-level override
<HLSPlayer usePausedVideo={true|false} />
// Overrides global flag for specific components
```

---

## Contact

For urgent rollback decisions during off-hours:
- On-call engineer: Check rotation schedule
- Escalation: Engineering lead

---

*Last updated: December 29, 2024*
*Owner: Engineering Team*
