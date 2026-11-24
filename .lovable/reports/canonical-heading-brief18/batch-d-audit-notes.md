# Batch D — audit notes

Requested 24 November 2026. Baseline at request start: `7c86830e3b`; accepted test population **10,435 tests / 900 files**. No production or test changes during the audit.

## Scope and route entrypoints

- `/`: `App.tsx:235,268` → `ClubhouseWrapped` (re-export) → `Clubhouse` → feed, HomeRail, TourSlot and opened sheets.
- `/profile`, `/profile/:username`: `App.tsx:627,656` → `ProfileWrapped` → `ProfilePageV2`; all personal/pro/ranking tabs, Handicap and opened sheets.
- `/profile/:username/followers`, `/profile/:username/following`: `App.tsx:751–752` → `ProfileSocialListRoute`; legacy own social routes redirect here; friends redirects to following.
- `/handicap/rivalry/:rivalUserId`, `/handicap/:friendUserId/rivalry/:rivalUserId`: `App.tsx:632,634` → `RivalryCompareRedirect` → profile Handicap compare state.
- `/round/:whsScoreId`: `App.tsx:717` → `RoundPage`.
- `/messages`, `/messages/:conversationId`: `App.tsx:737–738` → `InboxV2Page`, `ThreadV2Page`.
- `/notificationmessages`: `App.tsx:744` → `ActivityPageV2`.
- Global chrome/account/search and sheets opened without leaving these routes are included. Navigation to a different, unlisted page is a scope exit, not authority to traverse the whole application. Previously recorded A–C components retain their recorded roles and are cross-references, not new classifications.

`batch-d-import-inventory.json` preserves a 1,071-file **syntactic** local-import closure. It is supplementary discovery evidence only: runtime mount/caller trace and dormant/excluded branches must be recorded in the full table. An import alone does not prove reachability.

## Read-only investigation areas

1. Profile/Handicap tabs, social lists, rivalry compare and nested sheets.
2. Clubhouse/round page and nested sheets.
3. Messaging/Activity routes and nested sheets.
4. Global chrome/profile glance/search/account and nested sheets.

Full findings will be transferred into `report.md` before source changes. Audit notes stay in this directory; raw execution logs remain outside the repository. Temporary capture pages/before copies must never be staged or committed.

## Test-authorisation question (held)

`src/test/brief18EyebrowInk.test.tsx:90` currently asserts `expect(sites).toHaveLength(76)`. Step 2 requires adding each newly changed E1/E2 site, but authorises assertion changes only where old grey is pinned. This length assertion is not a grey assertion. Asked Ben to authorise **only** its old → audited-total update, or hold it and the required additions for a separate ruling. No test has been changed or run to manufacture a failure.

**Ruling received 21:10 UTC:** Ben authorised only the length expectation's 76 → audited-total update, alongside the new entries; report its exact old → new value.

## Messaging ink conflict (held)

The brief says **“Change every E1 and E2 to its surface's ink.”** Messages' `MSG.INK` resolves to `EC.INK` = **#F4F6F8** (`src/features/messaging-dark/tokens.ts:29`, `src/features/echo-chat/tokens.ts:38`). The standing eyebrow canon is **#F8FAFC**, and the existing declaration probe asserts **rgb(248, 250, 252)** for every site (`src/test/brief18EyebrowInk.test.tsx:114`). Four source-reachable Messages labels use `MT.EYEBROW`: Business messaging, Played with, Members and Playing off. Asked Ben to choose canonical label-only ink or the surface ink with explicit per-new-entry probe authorisation. These four planned values stay held; neither choice is silently assumed, and shared MSG/MT/EC tokens remain frozen.

**Ruling received 21:13 UTC:** canonical **#F8FAFC** only on the four labels; keep MSG/MT/EC tokens and every other Messages colour unchanged. The conflict is resolved; no per-entry alternate probe expectation is needed.

## Frozen styling / stale drift alerts

Fonts, branding copy, weights, sizes, tracking, spacing and semantic K-label colours are frozen by this brief. The incoming memory-drift alerts are not authority to change them. Any actual contradiction encountered in a scoped declaration will be reported rather than silently corrected.