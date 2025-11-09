# UI Consistency QA Checklist

## ✅ Implementation Complete

All design primitives have been successfully integrated across the app. Run these quick device tests to verify everything works as expected.

---

## 🎯 Quick QA Tests

### **1. Echo Page** (`/hub/echo`)
- [ ] **Header**: Fixed, opaque, matches header tone
- [ ] **Footer**: Same opaque tone as header
- [ ] **Composer Input**: FrostedPill with white/15 background, blur visible
- [ ] **Send Button**: Baseline-aligned with input, 44px touch target
- [ ] **Keyboard**: Composer stays above keyboard (iOS Safari + PWA)
- [ ] **Safe Areas**: No content hidden by home indicator

### **2. Nearby Golfers** (`/hub/golfers`)
- [ ] **Header**: OpaqueHeader component, fixed and solid
- [ ] **Cards**: GlassCard with consistent border/shadow
- [ ] **Filters**: Distance chips (0.5/1/3 km) apply correctly
- [ ] **Open Filter**: Shows only open-to-play when enabled
- [ ] **Sorting**: Results sorted by distance (closest first)
- [ ] **Scroll**: Smooth scrolling under fixed header

### **3. Games Lists** (`/hub/your-games`)
- [ ] **Cards**: GlassCard with consistent glass styling
- [ ] **Expandable**: Chevron rotates, content smoothly reveals
- [ ] **Actions**: Buttons have 44px touch targets
- [ ] **Scroll**: No layout jank when expanding cards

### **4. Dropdowns** (all pages)
- [ ] **Scrim**: Black/28 backdrop appears, blocks interaction
- [ ] **Menu**: Glass panel with white/12 border, sharp shadow
- [ ] **Z-Index**: Dropdown above all other content
- [ ] **Close**: ESC, outside click, or route change closes it
- [ ] **No Bleed**: Content underneath not visible through dropdown

### **5. Clubhouse Scrubbing** (`/clubhouse`)
- [ ] **Long-Press**: Hold heart, scrub rail appears
- [ ] **Release**: Scroll immediately restored
- [ ] **Next Video**: Swipe up/down works instantly after release
- [ ] **No Lock**: No "stuck scroll" after scrubbing

### **6. Progress Rail** (Clubhouse video)
- [ ] **Color**: Frosted white track/fill (not mint green)
- [ ] **Position**: Above bottom nav, respects safe area
- [ ] **Visibility**: Subtle but visible on all backgrounds

### **7. Spacing Rhythm** (all pages)
- [ ] **Page Gutters**: 20-24px outer padding
- [ ] **Stack Gap**: 12-16px between elements
- [ ] **Hub Tiles**: Bottom spacer prevents crowding viewport edge
- [ ] **Safe Areas**: Content doesn't touch edges on notched devices

---

## 🔍 Visual Consistency Check

### Glass Surfaces
All glass cards should have:
- **Border radius**: rounded-xl (12px)
- **Border**: rgba(255, 255, 255, 0.15)
- **Shadow**: 0 8px 24px rgba(0, 0, 0, 0.12)
- **Backdrop**: 12px blur

### Frosted Pills
All frosted pills should have:
- **Background**: rgba(255, 255, 255, 0.15)
- **Border**: rgba(255, 255, 255, 0.2)
- **Border radius**: rounded-full (999px)
- **Backdrop**: 8px blur

### Headers & Footers
All opaque surfaces should have:
- **Background**: rgba(15, 15, 15, 0.95) with backdrop-blur
- **Border**: rgba(255, 255, 255, 0.1)
- **Fixed/Sticky**: Content scrolls underneath
- **Safe Area**: Respects top/bottom insets

---

## 🐛 Known Edge Cases

### iOS Safari PWA
- **Issue**: Keyboard may overlap footer in some cases
- **Expected**: Composer pushes up with keyboard
- **Verify**: Open Echo, tap input, type message

### Android Chrome
- **Issue**: Backdrop-filter may not work on older devices
- **Expected**: Fallback to solid background
- **Verify**: Check if glass surfaces still visible

### Notched Devices (iPhone X+)
- **Issue**: Content may hide behind home indicator
- **Expected**: Safe area insets applied
- **Verify**: Scroll to bottom, check if content visible

---

## 📊 Component Usage Reference

### OpaqueHeader
```tsx
import { OpaqueHeader } from '@/components/layout/OpaqueHeader';

<OpaqueHeader
  title="Page Title"
  onBack={() => navigate(-1)}
  rightAction={<button>Action</button>}
/>
```

### GlassCard
```tsx
import { GlassCard } from '@/components/shared/GlassCard';

<GlassCard interactive onClick={handleClick} className="p-4">
  Card content
</GlassCard>
```

### FrostedPill
```tsx
import { FrostedPill } from '@/components/shared/FrostedPill';

<FrostedPill variant="input" className="flex-1">
  <input placeholder="..." className="w-full bg-transparent" />
</FrostedPill>
```

---

## ✨ Design Tokens

All tokens are defined in `src/styles/style-tokens.css`:

```css
/* Headers & Footers */
--header-bg: rgba(15, 15, 15, 0.95);
--header-border: rgba(255, 255, 255, 0.1);

/* Glass Surfaces */
--glass-bg: rgba(255, 255, 255, 0.08);
--glass-border: rgba(255, 255, 255, 0.15);
--glass-blur: 12px;
--glass-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

/* Frosted Elements */
--frosted-bg: rgba(255, 255, 255, 0.15);
--frosted-border: rgba(255, 255, 255, 0.2);
--frosted-blur: 8px;

/* Dropdowns */
--dropdown-scrim-bg: rgba(0, 0, 0, 0.28);
--dropdown-menu-bg: rgba(28, 28, 28, 0.92);
--dropdown-menu-border: rgba(255, 255, 255, 0.12);

/* Z-Index Layers */
--z-header: 30;
--z-footer: 40;
--z-dropdown-scrim: 50;
--z-dropdown-menu: 60;
```

---

## ✅ Sign-Off Checklist

Before considering the audit complete:

- [ ] All pages use OpaqueHeader (no ad-hoc headers)
- [ ] All cards use GlassCard (Golfers, Games, Echo tiles)
- [ ] All input/button pills use FrostedPill
- [ ] Progress rail is frosted white (not colored)
- [ ] Dropdowns have scrim + proper z-index
- [ ] Scroll restoration works after long-press
- [ ] Mock data confirmed disabled
- [ ] Safe areas respected throughout
- [ ] Tested on iOS Safari, Chrome Android
- [ ] Tested with/without notch, different screen sizes

---

## 📝 Notes

- **Environment**: `VITE_USE_MOCK_GOLFERS=false` confirmed in `.env`
- **Filters**: Radius (0.5/1/3 km) + Open + Visibility all working
- **RPC**: `nearby_golfers` receives correct params
- **Scroll Fix**: `touchAction` properly restored in ClubhouseVerticalFeed

**Status**: ✅ All components implemented and ready for QA
