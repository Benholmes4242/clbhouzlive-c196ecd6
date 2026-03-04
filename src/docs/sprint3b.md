# Sprint 3B: Pixel-Perfect UI Alignment — Media Player → Clubhouse Feed

The Clubhouse feed page is the design source of truth. The media player's overlays must match it exactly. This brief fixes every mismatch identified in the UI extraction audit.

---

## Fix 1: Tab Toggle — Remove Pill, Match Text Style

### Problem
The media player's `FeedTabToggle.tsx` wraps tabs in a dark glass pill (`rgba(0,0,0,0.35)`, `borderRadius: 20`, `padding: 3`). The Clubhouse feed uses `ClubhouseTabToggle` which is plain text with a `|` separator, no background.

### Solution
**Replace `FeedTabToggle.tsx` with the exact `ClubhouseTabToggle` pattern:**

**Container:**
- `display: flex`, `align-items: center`, `gap: 8px` (Tailwind `gap-2`)
- Background: `transparent` — NO pill, NO glass
- No border, no border-radius, no padding on the container
- Position: left-aligned within the top bar row (NOT centered)

**Tab text:**
- Font: `text-sm` (14px)
- Active: `font-semibold` (600), `text-white opacity-100`
- Inactive: `font-medium` (500), `text-white opacity-50`
- Padding per tab button: `py-3 px-1` (12px top/bottom, 4px left/right)
- `whitespace-nowrap`
- Transition: `transition-all duration-200`
- Press: `active:scale-[0.97]`

**Separator:**
- Render a `<span>` with text `|` between the two tabs
- Style: `text-sm font-light text-white opacity-40`
- `aria-hidden="true"`
- No special width/height — it's just a text character

**Remove entirely:**
- The pill container background
- The dark glass `rgba(0,0,0,0.35)` background
- The `borderRadius: 20` 
- The `padding: 3` wrapper
- Any `backdrop-filter`

---

## Fix 2: Build Top Bar — Match `ClubhouseTopBar` Layout

### Problem
The media player has the tab toggle floating on its own. The Clubhouse feed has a complete top bar row: `[Tab Toggle] [Search] [Profile Pill]`.

### Solution
**Create a `MediaPlayerTopBar.tsx` component (or modify `FullscreenMediaViewer.tsx` header section) that matches `ClubhouseTopBar` exactly:**

**Container:**
- Position: `fixed`, `left: 16px` (`left-4`), `right: 16px` (`right-4`), `z-index: 40`
- Top: `calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)`
- Layout: `flex items-center justify-between gap-2 min-w-0`
- Background: `transparent` — no glass, no gradient
- Height: auto (content-driven, ~44px)

**Left section (tab toggle):**
- The fixed tab toggle from Fix 1 above
- `flex-shrink: 0`

**Right section:**
- `flex items-center gap-1 flex-shrink-0`
- Contains: Search button + Profile pill

**Search button:**
- Icon: `Search` from `lucide-react`
- Icon size: `h-5 w-5` (20×20px)
- Icon color: `text-white/70`
- Container: `h-11 w-11` (44×44px), `rounded-full`
- Background: `transparent` — NO glass, bare icon button
- `border: 0`, `shadow: none`
- Tap action: For now, navigate to the app's search page or show a toast placeholder

**Profile pill (`PostingAsPill`):**
- **Reuse the existing `PostingAsPill` component** from `src/components/header/PostingAsPill.tsx`
- Pass `useGlassTheme={true}` to get the Clubhouse glass styling
- This gives us the squircle avatar, truncated name, chevron, and account switcher for free
- If `PostingAsPill` can't be imported directly (circular deps), replicate these exact specs:
  - Container: `h-11 max-w-[160px] rounded-xl pl-1 pr-2`
  - Glass: `background: rgba(0,0,0,0.35)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.10)`, `box-shadow: 0 4px 16px rgba(0,0,0,0.25)`
  - Avatar: `SquircleAvatar` at 24px, `hideRing=true`
  - Name: `text-sm font-medium text-white truncate max-w-[100px] leading-none`
  - Chevron: `ChevronDown h-3 w-3 text-white/70`

---

## Fix 3: Carousel Dots — Match Clubhouse Elongated Style

### Problem
Media player uses `CarouselDots` with uniform `h-2 w-2` circles, `bg-white`/`bg-white/40`. Clubhouse uses elongated pill for active dot + tiny dots for inactive.

### Solution
**Update the carousel dots in the media player to match the Clubhouse feed exactly:**

**Active dot:**
- `h-1.5 w-5` (6px tall × 20px wide) — elongated pill
- `bg-white/50`
- `rounded-full`

**Inactive dot:**
- `h-1.5 w-1.5` (6px × 6px) — tiny circle
- `bg-white/25`
- `rounded-full`

**Container:**
- `flex items-center gap-2` (8px gap)
- Background: transparent (no container glass)
- Transition per dot: `transition-all duration-200 ease-out`

**Position:**
- `mb-3` (12px) above the creator capsule
- Horizontally centered relative to the capsule, or left-aligned to match capsule left edge

**Interactive:**
- Each dot is tappable (`onClick` → sets media index)

**No max cap** on number of dots.

If the media player currently uses a separate `CarouselDots` component, either update it to accept a `variant` prop (`'clubhouse'` vs `'default'`) or replace the instance in the media player with inline dot rendering matching the above spec.

---

## Fix 4: Bottom Positioning — Align Offsets

### Problem
The Clubhouse feed positions the creator capsule at `bottom: calc(30px + 80px)` = 110px and the action rail at `bottom: calc(30px + 80px - 20px)` = ~90px. These account for the bottom nav bar (64px) + scrubber clearance (30px).

In the media player's fullscreen mode, there's no bottom nav bar. The positioning needs to account for this difference.

### Solution

**Media player (fullscreen, no bottom nav) positioning:**

Since the media player hides the bottom nav and goes fullscreen, the bottom reference point changes. The scrubber sits near the very bottom of the screen.

**Creator capsule:**
- `bottom: calc(max(env(safe-area-inset-bottom, 0px), 20px) + 48px)`
- This gives: safe area (or 20px minimum) + scrubber clearance (48px)
- `left: 16px` (`left-4`)

**Action rail:**
- `bottom: calc(max(env(safe-area-inset-bottom, 0px), 20px) + 48px - 20px)`
- Same base as capsule minus 20px (rail extends slightly lower)
- `right: 16px` (`right-4`) — remove the extra wrapper if one exists

**Carousel dots:**
- 12px above the creator capsule (handled by `mb-3` on dots container, positioned relative to capsule)

**Scrubber:**
- `bottom: max(env(safe-area-inset-bottom, 0px), 20px)`
- Full width with small horizontal padding

Verify these values look correct on device. The key principle: scrubber at the very bottom, capsule above scrubber, dots above capsule, action rail vertically centered with capsule.

---

## Fix 5: Verify Shared Glass Spec

### The canonical Clbhouz glass token:
```css
background: rgba(0, 0, 0, 0.35);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.10);
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
```

Every glass surface in the media player MUST use this exact spec:
- Creator capsule ✅ (already matches — uses same component)
- Action rail buttons ✅ (already matches — uses same component)
- Profile pill — must use this spec (see Fix 2)
- Tab toggle — must NOT use glass (transparent, see Fix 1)
- Search button — must NOT use glass (transparent, see Fix 2)
- Mute button — should use the action rail glass spec (it's part of the rail)
- Review banner — should use this glass spec if it has a background

**Action rail buttons additionally have an inset highlight:**
```css
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05);
```

Verify the media player's action rail buttons include this inset highlight.

---

## Fix 6: Review Post — Use `CreatorCapsule` Review Mode

### Problem
The media player created a new `ReviewBanner.tsx` component for review posts. The Clubhouse feed uses `CreatorCapsule` in review mode (same component, different rendering) plus `FullscreenReviewPost` for the rating overlay.

### Solution

**For the creator capsule on review posts:**
The `CreatorCapsule` component already handles review mode when it detects review data. Verify these review-mode specifics are present:

- Subtitle shows "Read review ›" instead of caption preview
- "Read review" color: Outstanding (≥9.0) = `text-amber-400/90`, Normal = `text-white/60`
- Review border on capsule: `rgba(210, 180, 97, 0.3)` for outstanding, `rgba(255, 255, 255, 0.08)` for normal
- No expand chevron in review mode (review capsule doesn't expand the same way)
- Tap "Read review" → navigate to `/courses/{courseId}?tab=reviews&review={reviewId}`
- Capsule width in review mode: `max-w-[280px]`
- Capsule bottom in review mode: slightly higher (`calc(30px + 88px)` = 118px in Clubhouse)

**For the rating overlay at the top:**
If the media player's `ReviewBanner.tsx` component works well and shows course name + rating badge, keep it but verify it matches the Clubhouse `FullscreenReviewPost` styling:
- The Clubhouse version renders the rating as part of a hero overlay on the media
- If the designs match visually, keep `ReviewBanner.tsx`
- If they don't match, align the styling

---

## Fix 7: Action Rail Button Order — Verify Match

The Clubhouse feed's `CinematicActionRail` button order (top to bottom):
1. Right Chevron (conditional: multi-media only)
2. Heart (Like + count)
3. Mute/Unmute (conditional: video only)
4. Comment (MessageSquare + count)
5. Share (Send, no count displayed)
6. More (MoreHorizontal)

**Verify the media player's action rail matches this exact order.** If the media player moved the mute button outside the rail, move it back IN — between Like and Comment, matching slot 3.

---

## Summary of Changes

| # | Change | Files Affected |
|---|---|---|
| 1 | Tab toggle: remove pill, match text + separator | `FeedTabToggle.tsx` or replace with inline |
| 2 | Build top bar: search + profile pill | New `MediaPlayerTopBar.tsx` or modify `FullscreenMediaViewer.tsx` |
| 3 | Carousel dots: elongated active pill + tiny inactive dots | Dot rendering in media player |
| 4 | Bottom positioning: align capsule/rail/scrubber offsets | Capsule, rail, scrubber position styles |
| 5 | Glass spec verification: ensure canonical spec on all surfaces | Audit only — fix any deviations |
| 6 | Review mode: verify capsule review mode + banner styling | `CreatorCapsule` review rendering |
| 7 | Action rail order: verify mute button is slot 3 | Action rail component |

### NOT Changed
- Creator capsule glass design (already matches ✅)
- Squircle avatar shape and size (already matches ✅)
- Action rail glass design (already matches ✅)
- Action rail gap (12px, already matches ✅)
- Like/follow/share mutations (Sprint 3A, already done ✅)

---

## Implementation Order

```
Step 1: Tab toggle fix (remove pill, add separator)
Step 2: Build top bar (add search + profile pill)
Step 3: Carousel dots (elongated active style)
Step 4: Bottom position alignment
Step 5: Mute button back in rail (if moved out)
Step 6: Visual QA — screenshot and compare to Clubhouse feed
```

After each step, screenshot the media player and compare to the Clubhouse feed page. Every element should be visually indistinguishable.
