# BRIEF_PROFILE_COVER_FALLBACK — report

## What was built

**Cover chain (personal profile).** `ProfileHero`'s cover now resolves: own
`header_photo_url` → home club's own course photo → #1 Top 10 course thumbnail
→ fairway contours. The club photo is read only while the member has no cover of
their own, and a hidden home club never supplies one because `useProfileClubs`
withholds it.

**New files**
- `src/components/profile/hero/ContourCover.tsx` — absolute inset-0 layer,
  `linear-gradient(165deg, #33503b 0%, #1f2e25 50%, #0A0A0C 100%)`, with an
  inline SVG (`viewBox 0 0 390 255`, `preserveAspectRatio="xMidYMid slice"`,
  width/height 100%) of 14 closed polylines. Ring `k`: base radius
  `18 + 17k`, one point every 10°, `rr = r * (1 + 0.18*sin(3a + 0.4k) +
  0.08*cos(5a))`, `x = 250 + 1.35*rr*cos(a)`, `y = 120 + rr*sin(a)`. Stroke
  1px, no fill, `rgba(255,255,255,0.11)` when `k % 4 === 0` else
  `rgba(255,255,255,0.07)`. Computed once at module load from fixed constants —
  deterministic, no randomness.
- `src/components/profile/hooks/useClubCoverPhoto.ts` — reads
  `golf_courses (thumbnail_image)` where `club_id = clubId`, ordered
  `created_at` ascending, first non-empty `thumbnail_image`, else null. Same
  rule `BusinessProfilePage` applies to `clubCourseImage`.

**Edited files**
- `src/components/profile/hero/ProfileCoverBand.tsx` — no image, or an image
  that fails to load, renders `ContourCover` with `PhotoBandFade` on top
  (previously a flat canvas); new optional `onAddCover` / `addCoverLabel`
  props; the "+ Add a cover" pill sits inside the identity block at
  `right: 0`, `bottom: calc(100% + 8px)`, 28px tall, radius 999, 9.5px/800,
  0.14em uppercase, white on the band's control ground.
- `src/components/profile/hero/ProfileHero.tsx` — chain above; the pill is
  passed only when `isSelf && !coverUrl` and navigates to
  `/edit-profile?src=cover`.
- `src/components/business/hero/ClubProfileHero.tsx` — the no-cover branch's
  flat `linear-gradient(180deg, #17171B 0%, #0B0B0D 100%)` is replaced by
  `ContourCover` plus `PhotoBandFade canvas={CANVAS}`; no pill. The page's
  own cover → club course image rule is untouched.
- `src/features/edit-profile/completionRules.ts` — `arrivalAction` now also
  maps `src=cover` → `'cover'`.
- `src/pages/EditProfile.tsx` — arrival opens the existing cover picker:
  `if (action === 'cover') photos.current?.open('cover')`.
- `public/locales/en/profile.json` — new `hero.addCover` = "+ Add a cover".

## Tests

New file `src/test/profileCoverFallback.test.tsx` — **17 cases**, covering the
chain order, the club-photo rule (first non-empty thumbnail in `created_at`
ascending; nothing read without a club id), the hidden-home-club privacy case,
broken-photo fallback, pill geometry/callback, pill absence on a visitor
profile and on a profile with its own cover, `src=cover` arrival wiring, the
business hero both ways, and the contour artwork (14 closed polylines, 1px
strokes, no fill, the `k % 4` stroke rule, identical output across renders).

**Authorised test-side additions (Ben's ruling).** Seven files that render
`<ProfileHero>` with no query client each gained one `vi.mock` line for
`@/components/profile/hooks/useClubCoverPhoto`, returning the hook's own shape
with nothing in it (`{ coverPhoto: null, isLoading: false }`, plus `default`),
so no network read is possible and the chain falls through exactly as before:

1. `src/test/heroConnectPanel.test.tsx`
2. `src/test/heroConnectExample.test.tsx`
3. `src/test/linkedHandicapProfile.test.tsx`
4. `src/test/removeBadges1.test.tsx`
5. `src/test/profileBioFull.test.tsx`
6. `src/test/proVerification2Hero.test.tsx`
7. `src/test/wagrProfileLine.test.tsx`

Nothing else in those files changed. No test was deleted, renamed or rewritten;
no existing assertion was edited.

## Counts

Baseline before this work was **8,814** (Command Centre v3B: 2,243 / 2,135 /
2,212 / 2,224). The brief quoted 8,797, which predates that build.
8,814 + 17 new = **8,831**.

Full suite, one shard at a time: 2,243 / 2,143 / 2,217 / 2,228 = **8,831**
(770 test files; no failures, no skips). Delta reconciles by name: the only
addition is the 17-case file above.

## 320×568 check

The real `ProfileCoverBand` was rendered at 320×568 through the dev server
(temporary probe module, deleted afterwards):
- band `padding-top` 193.9px, width 320, no sideways overflow
  (`scrollWidth` 320);
- pill top **157.89px**, bottom 185.89px, height 28px, right edge 300px
  (20px gutter);
- the real top island chrome's lowest edge at that viewport is **96px**
  (fixed island band 0→96, island itself 10→56), so the pill clears it by
  **61.9px**;
- 14 contour polylines and the shared fade present in the fallback.

## Not verified

The profile page sits behind auth and this project's Supabase is
`external_unmanaged`, so no session could be minted: the pill was measured on
the real component rendered standalone at 320×568, not on a live signed-in
profile, and the cover picker was not driven end-to-end in a browser.
