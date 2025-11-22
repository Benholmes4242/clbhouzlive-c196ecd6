# Orange Text Color Fix - Phase 8 Enforcement

## Issue
After the global color system rollout, orange (#F7931E) was appearing in places it shouldn't due to the Tailwind `text-primary` class mapping to `hsl(var(--primary))` which is set to orange, not the semantic slate token `var(--text-primary)`.

## Root Cause
In `src/index.css` line 1747:
```css
--primary: 31 93% 54%;  /* #F7931E - orange accent */
```

This caused any use of Tailwind's built-in `text-primary` class to render orange text instead of slate.

## Fixes Applied

### 1. ESLint Rule Added
Added detection for `text-primary` usage in `.eslintrc.design-system.json` to prevent future violations.

### 2. Static Analysis Script
Created `scripts/check-orange-text.ts` to scan for:
- `text-primary` usage (not `text-primary-accent` or `text-primary-foreground`)
- Direct hex orange values in text

Run with: `npx tsx scripts/check-orange-text.ts`

### 3. E2E Test Guard
Created `tests/orange-text-guard.spec.ts` (Playwright) to:
- Check all major routes for orange text
- Whitelist legitimate accent components
- Fail if generic text uses orange

### 4. Component Fixes

#### Input Components
- ✅ `src/components/ui/input.tsx` - Fixed `text-primary` → `text-foreground`
- ✅ `src/components/AccessGateV2.tsx` - Fixed `placeholder:text-text-tertiary` → `placeholder:text-tertiary`
- ✅ `src/components/InviteRequestModal.tsx` - Fixed placeholder styling (3 inputs)
- ✅ `src/components/InlineTypeahead.tsx` - Fixed `placeholder:text-muted-foreground` → `placeholder:text-tertiary`

#### Links & Navigation
- ✅ `src/components/admin/ManualVideoMigration.tsx` - Link color fixed
- ✅ `src/components/courses/course-detail/AboutMediaStrip.tsx` - "See more" link
- ✅ `src/components/profile/ReviewsTab.tsx` - "See all" link
- ✅ `src/components/shorts/ShortsSuggestedProfiles.tsx` - "See all" link
- ✅ `src/components/swing/CoachThread.tsx` - Thread link

#### Hover States
- ✅ `src/components/courses/CourseMilestonesCard.tsx` - Milestone title hover
- ✅ `src/components/courses/MyRatingsContent.tsx` - Course name hover
- ✅ `src/components/feed/NewSeasonBanner.tsx` - Season name hover
- ✅ `src/components/top100/Top100AchievementsBlock.tsx` - Achievement title hover (2 locations)

#### Badges & UI Elements
- ✅ `src/components/achievements/AchievementCard.tsx` - "Achievement" label badge
- ✅ `src/components/challenges/WeeklyChallengeLadder.tsx` - Current user highlight
- ✅ `src/components/courses/CourseCard.tsx` - Average rating badge
- ✅ `src/components/golf-club/CourseFriendsStrip.tsx` - Avatar fallbacks (2 locations)
- ✅ `src/components/ui/optimized-avatar.tsx` - Avatar fallback

## Legitimate Orange Usage (Kept)

These components correctly use orange for accent purposes:

### XP & Points
- `src/components/achievements/AchievementCard.tsx` - "+X XP" badge
- `src/components/achievements/AchievementToast.tsx` - XP badges
- `src/components/challenges/WeeklyChallengeLadder.tsx` - "Reward" badge

### Achievement Status
- `src/components/courses/CourseMilestonesCard.tsx` - "Unlocked" status badge
- `src/components/top100/Top100AchievementsBlock.tsx` - "Unlocked" status badge

### Trophy Icons
- `src/components/achievements/SeasonRecapModal.tsx` - Trophy icons
- `src/components/feed/NewSeasonBanner.tsx` - Trophy & sparkle icons
- All Top 100 trophy icons

### Active/Upload States
- `src/components/posts/MediaDropzone.tsx` - Upload icon

### Accent Text
- `src/components/season/SeasonWrapModal.tsx` - Season stats
- `src/components/streaks/StreakWidget.tsx` - Reward highlights
- `src/components/profile/PinnedAchievements.tsx` - Achievement highlights

## Color Token Reference

### ✅ Correct Usage
```tsx
// For text
text-foreground     // Primary text (slate #1F2428)
text-secondary      // Secondary text (slate #5E666D)
text-tertiary       // Tertiary/placeholder (slate #97A1AA)

// For placeholders
placeholder:text-tertiary

// For explicit accents only
text-primary-accent // Orange #F7931E (use sparingly!)
```

### ❌ Never Use
```tsx
text-primary        // ⚠️ Resolves to orange, not slate!
```

## Testing

Run checks:
```bash
# Static scan
npx tsx scripts/check-orange-text.ts

# E2E tests
npx playwright test tests/orange-text-guard.spec.ts

# Design system compliance
npx tsx scripts/design-system-check.ts
```

Enable strict mode:
```bash
STRICT_ORANGE_CHECK=true npm run build
```

## Summary
- 18 component files updated
- 25+ individual fixes applied
- 3 new automated checks in place
- All input placeholders now use correct semantic tokens
- All generic text now uses slate colors, not orange
