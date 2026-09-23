# BRIEF_CANVAS_STAGE_0_CONSOLIDATE — Migration Map

Scope: member-app (non-admin) page / panel / card / sheet **background** literals
and their existing token imports. Excludes glass/scrim/backdrop overlays, media
letterboxing, avatar/image fallbacks, skeletons, charts, and maps. No prior
canvas-specific audit exists in the repo (`AUDIT_TOUR_TOKENS_PART_A.md` covers
tourhub ink/score tokens only — unrelated surface). This map is built fresh
from a repo-wide scan.

## 0. Canonical anchors already in place

- `--bg-page` (index.css:233/401/1001) — the one true page-canvas var, dark
  value `#15171F` (light override `#111113` in one block — check for drift).
  Consumed via `bg-[var(--bg-page)]` and `clbhouzBg` Tailwind color
  (`tailwind.config.ts`: `clbhouzBg: 'var(--bg-page)'`).
- `--surface-card` / `--surface-slate` / `--surface-alt` (tailwind.config.ts,
  index.css) — card/panel canon, but shadowed by a **second, competing**
  `--cm-surface-card` / `--cm-surface-alt` / `--cm-surface-slate` scale scoped
  to `src/styles/create-moment-light.css` (light-mode literals: `#ffffff`,
  `#f8fafc`, `#1e293b`). These are namespaced copies, not re-uses of the
  global tokens — candidate for STAGE_0 dedupe or explicit "why separate"
  note.
- `src/lib/tokens/field.ts` — already a canonical module (`FIELD_REST_BG`,
  `FIELD_FOCUS_BG` = `rgba(255,255,255,0.06 / 0.10)`) for text-field paint,
  not panel backgrounds, but the **same alpha values recur untokenized** as
  panel/row backgrounds elsewhere (see §2).
- `src/features/courses/components/holes/analytical/tokens.ts` → `A.PANEL` —
  already imported correctly by `ActivityActionsSheet.tsx` and
  `FriendRequestsRail.tsx`. Model pattern for what "good" looks like.

## 1. Dark sheet/panel literal `#1B1E27` / `#20242E` family (Tailwind hex, repeated)

One hand-authored dark elevation ramp, copy-pasted per file instead of
imported:

| File | Literal | Role |
| --- | --- | --- |
| `components/courses/CourseSearchSheet.tsx:198` | `backgroundColor: '#1B1E27'` | sheet body |
| `components/profile/edit-v2/ImageCropperModal.tsx:168,191` | `bg-[#1B1E27]` | modal panel |
| `components/post/scheduled/ScheduledPostsList.tsx:52,89,92,115,134` | `bg-[#20242E]` | header pill / thumb well / icon buttons |
| `components/post/scheduled/ScheduledPostsList.tsx:81` | `bg-[#1B1E27]` | list card body |

Likely canonical name: **`SURFACE_PANEL_DARK` (`#1B1E27`)** and
**`SURFACE_INSET_DARK` (`#20242E`)** — a two-step elevation pair, same family
as `A.PANEL`. Needs confirmation these are/aren't already equal to
`--surface-card`/`--surface-slate` HSL equivalents (currently expressed as
raw hex, not `hsl(var(--…))`, so no live token linkage even if values match).

## 2. White-alpha overlay-on-dark family — `rgba(255,255,255,0.06|0.09|0.10|0.14|0.18|0.22)`

Re-declared per call site instead of importing `field.ts` or a new
`SURFACE_ALPHA_*` set:

| File | Value | Role |
| --- | --- | --- |
| `lib/tokens/field.ts:74,77,123,126` | `0.06 / 0.10 / 0.09 / 0.14` | canonical source (fields, not panels) |
| `components/courses/CourseSearchSheet.tsx:217` | `rgba(255,255,255,0.06)` | icon-button fill inside sheet |
| `components/profile/edit-v2/AdditionalClubsList.tsx:50,117` | `rgba(255,255,255,0.06)` | row card fill |
| `components/profile/edit-v2/LocationSection.tsx:79` | `rgba(255,255,255,0.06)` | row card fill |
| `components/profile/edit-v2/BioWebsitesSection.tsx:79` | `rgba(255,255,255,0.06)` | row card fill |
| `components/settings/ui/SettingsToggleRow.tsx:66` | `rgba(255,255,255,0.14)` | row background (toggle row surface, not the switch track — in scope) |
| `pages/manage/NotificationsPage.tsx:62` | `rgba(255,255,255,0.14)` | same row-surface pattern, duplicated file-local |
| `components/explore-tab-new/courseled/DiscoverSectionShells.tsx:125,130,138` | `rgba(11,15,19,0.30)` inset panel + `rgba(255,255,255,0.22/0.18)` skeleton bars | tour-rail inset card (bars are skeleton-adjacent — flag, don't move, per exclusion) |

Likely canonical name: **`SURFACE_ROW_ALPHA_06`**, **`SURFACE_ROW_ALPHA_14`**
— a row/card-on-dark-canvas alpha scale distinct from (but numerically
overlapping) `FIELD_REST_BG`. STAGE_0 should decide: fold into `field.ts`
constants (rename module to a broader `surfaceAlpha.ts`) vs. keep fields and
panels conceptually separate with a parallel export.

## 3. Brand-orange panel/CTA fills expressed as raw hex (`#F7931E` family)

Not a background of a *container* in most spots (many are buttons/badges,
out of strict scope) but three are card/panel fills:

| File | Value | Role |
| --- | --- | --- |
| `components/header/PostingAsMenu.tsx:378`, `PostingAsPill.tsx:84,200` | `bg-[#F7931E]` | active-pill panel fill |
| `components/profile/edit-v2/PrivacySection.tsx:43` | `bg-[#F7931E]` | selected-row panel fill |
| `components/profile/courses/TieredCourseCard.tsx:92` | `backgroundColor: '#F7931E'` | card accent fill |
| `pages/ProfilePageV2.tsx:645,678` | `backgroundColor: '#F7931E'` | card/badge fill |
| `pages/auth/components/AuthHeroScreen.tsx:157` | `backgroundColor: '#F7931E'` | hero panel |
| `pages/PostDeepLinkPage.tsx` (retry button) | `background: '#F7931E'` | button, borderline in/out of scope |

Existing token: `--brand-orange` / Tailwind `brand-orange` already defined
(`tailwind.config.ts`). None of the above import it — pure literal drift.
Likely canonical name: **`brand-orange` (Tailwind class) / `--brand-orange`**
already exists; this is a "reuse existing token" migration, not a "coin new
name" one.

## 4. Page-canvas literal drift (`#0D0F11`, `#0F172A`, `#111113` vs `--bg-page`)

| File | Value | Role |
| --- | --- | --- |
| `components/layout/PageRoot.tsx:71` | `bg-[#0F172A]` (immersive branch) vs `bg-[var(--bg-page)]` (default branch) | **page root itself** — the single highest-leverage file for this brief; ternary hard-codes a second canvas color instead of an `--bg-page-immersive` token |
| `pages/PostDeepLinkPage.tsx:368,377,408,440` | `bg-[#0D0F11]` | full-page loading/error canvases, four repeats of one literal in one file |
| `index.css:401` | `--bg-page: #111113` (scoped block) vs `:233` `#15171F` vs `:1001` `#15171F` | token itself has two definitions — verify which media/selector wins; possible unintentional value fork inside the token, not just at call sites |

Likely canonical names: **`--bg-page`** (fix the fork), plus a new
**`--bg-page-immersive`** (`#0F172A`) if that variant is intentional, so
`PageRoot.tsx` stops hard-coding it. `PostDeepLinkPage.tsx` should just
consume `--bg-page` unless `#0D0F11` is deliberately a distinct "deep-link
standalone" canvas — flag for product confirmation.

## 5. Region/tier theme panel colors (`lib/regionTheme.ts`)

`bg-[#334E3D]`, `bg-[#C1A84C]`, `bg-[#64748B]` (each doubled, lines
75/76/95/96/115/116/136/137) — these back Top-100 region badge/card
containers. Already centralized in one file (good), but the doubled literals
per region (two nearly-identical Tailwind arbitrary classes per constant)
suggest a light/dark or fill/border pair that isn't named as such. Likely
canonical names: **`region-{global,gbi,usa,europe}` already exist** in
`tailwind.config.ts` as `rgb(var(--region-*) / <alpha-value>)` — `regionTheme.ts`
is not using them and instead re-encodes the same colors as flat hex.
Confirm hex-vs-CSS-var value parity, then point `regionTheme.ts` at the
existing `region.*` Tailwind tokens instead of literal hex.

## 6. Miscellaneous single-file panel/card fills (lower blast radius)

- `components/business/PinDropModal.tsx:249` — `bg-[#f59e0b]/[#e8920f]` (modal action panel) — should reuse `warning`/amber token if that's the intent, else confirm bespoke.
- `components/courses/review/ReviewResponseBlock.tsx:256,420` — `bg-[#f59e0b]` repeated twice in one file — same-file dedupe candidate at minimum.
- `components/post/GalleryPicker.tsx:157,175` / `MultiSelectPreview.tsx:56` — `#6e9277`, `#b66b41`/`#a55a3a` selection-state panel fills, no existing token match found; likely new bespoke tokens to name (`SELECTION_FILL_GREEN`, `SELECTION_FILL_RUST`).
- `components/business/AccessRequestsSection.tsx:307` — `bg-[hsl(38,92%,50%)]` / `hsl(36,84%,46%)` — HSL-literal pair (rest/hover) matching the same hue family as `--warning`; check for direct equivalence.
- `components/profile/edit-v2/ImageCropperModal.tsx:201,236` / `ProfilePhotoCard.tsx:260` — repeats of the same `hsl(38,92%,50%)` pair inside crop-tool panels — same-family as above, cross-file dedupe target.

## 7. Out-of-scope but adjacent (excluded per brief, noted only)

- `components/ui/BottomSheet.tsx:512` `rgba(0,0,0,0.4)` — scrim/backdrop, excluded.
- `components/explore-tab-new/courseled/CourseImageFallback.tsx:90` — image fallback, excluded.
- `components/feed/InlineVideo.tsx:291`, `utils/toast.ts:11` `#0a0a0a` — media letterbox / toast chrome, excluded (toast is transient chrome, not page/panel/card/sheet — flagged only in case Stage 1 wants it).
- `review-island/panel.tsx` — internal dev/QA tool (html2canvas capture bg + its own floating panel), not member-app surface.
- Skeleton bars inside `DiscoverSectionShells.tsx` — excluded per rule, but they live inside an otherwise in-scope inset panel; keep the panel's own `rgba(11,15,19,0.30)` fill in scope, leave the bar fills alone.

## 8. STAGE_0 consolidation targets (proposed, not yet named canon)

1. `--bg-page` value fork in `index.css` (233/401/1001) — resolve first, it's the token everything else should point at.
2. `PageRoot.tsx:71` immersive branch — introduce `--bg-page-immersive` or confirm reuse of an existing dark token, remove the literal `#0F172A`.
3. New `SURFACE_PANEL_DARK` (`#1B1E27`) / `SURFACE_INSET_DARK` (`#20242E`) constants — consolidate `CourseSearchSheet`, `ImageCropperModal`, `ScheduledPostsList`.
4. Extend or rename `lib/tokens/field.ts` alphas into a shared row/panel alpha scale (`0.06/0.09/0.10/0.14`) — consolidate `AdditionalClubsList`, `LocationSection`, `BioWebsitesSection`, `SettingsToggleRow`, `NotificationsPage`.
5. Point `regionTheme.ts` at existing `region.*` Tailwind color tokens instead of parallel hex.
6. Route all `#F7931E` panel/card fills through the existing `brand-orange` token (no new name needed, pure literal→token swap).
7. Confirm and name the amber/warning `hsl(38,92%,50%)` family used across `ImageCropperModal`, `ProfilePhotoCard`, `AccessRequestsSection`, `PinDropModal`, `ReviewResponseBlock` — likely maps to existing `--warning`.
8. Decide fate of `create-moment-light.css`'s `--cm-surface-*` shadow tokens: merge into global `--surface-*` or document the deliberate light-mode carve-out.
