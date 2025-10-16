# Clubhouse Auto-Hide Chrome - Audit Mode

This document explains how to enable and use the audit instrumentation to validate the architecture before implementing auto-hide header/nav.

## 🎯 Purpose

Collect evidence to validate:
- DOM structure and compositing layers
- Scroll performance and metrics
- IntersectionObserver behavior
- Safe-area handling
- Accessibility compliance

## 🔧 How to Enable

### In Browser Console

```javascript
// Enable audit mode
clubhouseAudit.enable()

// Reload page to see telemetry
location.reload()

// Disable when done
clubhouseAudit.disable()
```

### Or Manually

```javascript
localStorage.setItem('AUDIT_CLUBHOUSE', 'true')
location.reload()
```

## 📊 What Gets Logged

### 1. Component Mount Events

```
[audit:clubhouse] 🔍 ClubhouseHeaderNew mounted
  - position: relative
  - zIndex: 60
  - height: 64px
  - backdropFilter: blur(12px)
  - transform: none
  - willChange: auto
  - hasOwnLayer: false
  - Warning: backdrop-filter without layer promotion may hurt performance
```

### 2. Safe-Area Variables

```
[audit:clubhouse] CSS variables:
  - --safe-top: 44px (iPhone notch)
  - --safe-bottom: 34px (home indicator)
  - --header-h-mobile: 60px
  - --nav-height: 56px
  - --bottom-nav-height: 90px
```

### 3. Scroll Metrics

```
[audit:clubhouse] scroll:
  - scrollTop: 812
  - deltaY: -45
  - velocity: -1.25 px/ms
  - direction: up
  - avgVelocity: 1.05 px/ms
```

**Key metrics for auto-hide:**
- Velocity > 0.8 px/ms = fast scroll
- Direction change = potential reveal trigger
- Average velocity smooths out jitter

### 4. IntersectionObserver Events

```
[audit:clubhouse] playRef (autoplay@65%) intersection:
  - postId: a1b2c3d4
  - isIntersecting: true
  - ratio: 0.67
  - timestamp: 1234567890
```

**Confirms:**
- 65% threshold triggers correctly
- root: null (uses viewport)
- No dependency on header height

### 5. Layer Promotion Checks

```
[audit:clubhouse] GlobalBottomNavigation layer promotion:
  - transform: true ✅
  - willChange: true ✅
  - backfaceVisibility: false
  - hasOwnLayer: true ✅
  - hasBackdropFilter: true
  - Warning: null (already on GPU)
```

### 6. Performance Marks

```
[audit:clubhouse] 🏁 header-mount-start
[audit:clubhouse] 🏁 header-mount-end
[audit:clubhouse] ⏱️  header-mount: 2.34ms
```

## 📋 Evidence Bundle Checklist

Collect and document:

### ✅ DOM & Styling
- [ ] React DevTools screenshot of component tree
- [ ] Computed styles for header (position, z-index, height, backdrop-filter)
- [ ] Computed styles for bottom nav (same properties)
- [ ] Computed styles for feed container (overflow, snap, transform)

### ✅ Scroll Behavior
- [ ] Confirm scroll container is `ClubhouseVerticalFeed` inner div
- [ ] Log shows `overscrollBehavior: none`
- [ ] Log shows `touchAction: pan-y`
- [ ] Direction detection working (up/down/idle)
- [ ] Velocity calculation reasonable (0.5-2.0 px/ms range)

### ✅ Video Observers
- [ ] `nearRef` logs show 300px prebuffer working
- [ ] `playRef` logs show 65% threshold triggering
- [ ] Both use `root: null` (viewport)
- [ ] No header height dependencies

### ✅ Safe-Area
- [ ] `--safe-top` and `--safe-bottom` have values on iPhone
- [ ] Feed items use `100svh` not `100vh`
- [ ] Bottom nav has `paddingBottom: env(safe-area-inset-bottom)`

### ✅ Layer Promotion
- [ ] Header shows `hasOwnLayer: true` or will after transform applied
- [ ] Bottom nav shows `hasOwnLayer: true`
- [ ] No warnings about backdrop-filter on non-composited layers

### ✅ Performance
- [ ] Mount timings < 5ms for each component
- [ ] Scroll logs show consistent velocity tracking
- [ ] No console errors or warnings

### ✅ Accessibility
- [ ] Elements remain in DOM (not display:none)
- [ ] Can add aria-hidden when off-screen
- [ ] Tab order makes sense

## 🧪 Testing Scenarios

### Scenario 1: Scroll Direction Detection
1. Scroll down 3 posts
2. Check logs show: `direction: down`
3. Scroll up 2 posts
4. Check logs show: `direction: up`
5. Stop scrolling
6. Check logs show: `direction: idle` after a moment

### Scenario 2: Video Autoplay
1. Watch console for `playRef` intersection logs
2. Note when `ratio` crosses 0.65
3. Verify video starts playing
4. Scroll away (ratio < 0.65)
5. Verify video pauses

### Scenario 3: Safe-Area Handling
1. Open on iPhone with notch
2. Check `--safe-top` is 44px (portrait) or 0px (landscape)
3. Check `--safe-bottom` is 34px (home indicator)
4. Verify content doesn't go under notch/indicator

### Scenario 4: Layer Promotion
1. Check header layer promotion log
2. If `hasOwnLayer: false`, note it needs `transform: translateZ(0)`
3. Same for bottom nav
4. Backdrop-filter + no layer = performance warning

## 📈 Acceptance Criteria

Before implementing auto-hide, confirm:

- ✅ Scroll velocity tracking works smoothly
- ✅ Direction detection is accurate (no false positives)
- ✅ Header and nav will compose to own layers (or can be easily promoted)
- ✅ Safe-area variables are correct on iOS
- ✅ IntersectionObserver thresholds are validated
- ✅ No accessibility blockers
- ✅ 60fps scrolling (check via browser DevTools performance tab separately)

## 🚫 Known Limitations

**Cannot programmatically capture:**
- Performance profiles (use Chrome DevTools → Performance tab manually)
- Layer borders visualization (use Chrome DevTools → Rendering → Layer borders)
- Exact FPS (use DevTools or 3rd party tools)
- Passive event listener detection (audit logs note configuration only)

**For these, use browser DevTools manually and screenshot.**

## 🔍 Manual DevTools Steps

### Layer Visualization
1. Open DevTools → More tools → Rendering
2. Enable "Layer borders"
3. Green borders = composited layers
4. Scroll clubhouse page
5. Header and nav should have green borders (or will after `transform` applied)

### Performance Profile
1. Open DevTools → Performance tab
2. Click Record
3. Scroll through 5-7 posts on Clubhouse
4. Stop recording
5. Check FPS graph (should be 55-60fps)
6. Check Main thread (should not show long tasks > 50ms)
7. Screenshot and save

### Scroll Listener Check
1. DevTools → Sources → Event Listener Breakpoints
2. Enable "scroll" breakpoint
3. Scroll on clubhouse
4. Inspect call stack to confirm listener on correct element

## 📤 What to Share

After running audit mode and manual checks:

1. **Console logs** (copy/paste or screenshot)
2. **DevTools screenshots:**
   - Component tree (React DevTools)
   - Computed styles panel (header + nav)
   - Layer borders (with green borders visible)
   - Performance profile (FPS graph + summary)
3. **Notes on any mismatches** with initial audit report
4. **Device info:** Browser, OS, screen size, safe-area values

## 🎬 Ready for Implementation?

Once all acceptance criteria are met and evidence bundle is complete, the team can green-light auto-hide implementation with confidence that:

- Architecture supports GPU-accelerated transforms
- Scroll metrics are reliable for direction/velocity detection
- Safe-areas won't cause content jumps
- Video autoplay won't break when chrome hides
- No accessibility regressions

---

**Next step:** Share evidence bundle for review before implementing auto-hide chrome behavior.
