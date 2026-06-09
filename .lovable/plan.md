# Unified Edit Profile + Handicap Connection — Rebuild Plan

Implements the rebuild brief end-to-end. Replaces the 3-step wizard and quick-edit page with one single-scroll `/edit-profile`, adds one canonical handicap connect sheet, and introduces a separate manual handicap column (fixing the bug where the profile form overwrites the WHS-synced handicap).

---

## 1. Database (runs first, separate approval)

Migration on `public.user_profiles`:
- Add `manual_handicap_index numeric NULL` with a comment describing it as the user-entered fallback used only when no active WHS connection exists.
- No backfill; no change to `eg_handicap_index`.

After approval, the Supabase types regenerate automatically and `manual_handicap_index` becomes available to the form.

## 2. Display resolution helper

New `src/lib/handicap/resolveHandicap.ts` exporting `resolveDisplayHandicap({ egHandicapIndex, manualHandicapIndex, hasWhsConnection })`:
- Returns `{ value, source: 'whs' | 'manual' | 'none' }`.
- WHS wins whenever a connection is active and `eg_handicap_index` is present; otherwise falls back to manual; otherwise `none`.

Wire into:
- New `/edit-profile` handicap row (Part 5).
- `GlassmorphicProfileCard` and `HandicapSummaryCard` handicap displays (swap direct `eg_handicap_index` read for the helper). Leaderboard membership keeps its existing WHS-only logic — manual-only users continue to show on profile but not on ranked leaderboards.

## 3. Form model fix (the bug fix)

- `ProfileFormData.handicapIndex` stays as the form string but now maps to the **manual** column. Inline comment added.
- `useProfileForm.makeInitial`: initialise `handicapIndex` from `profile.manual_handicap_index` (not `eg_handicap_index`).
- `useProfileSave`: write `manual_handicap_index: parseHcpFormString(form.handicapIndex)`. The form NEVER writes `eg_handicap_index` again — that column is owned exclusively by the WHS sync/connect-whs edge function.

## 4. One canonical handicap connect sheet

New `src/components/profile/handicap/HandicapConnectSheet.tsx`:
- Props: `{ open, onClose, userId, onConnected? }`.
- Uses `useWhsConnection(userId)`.
- No connection → renders `WhsConnectScreen` (the existing self-contained country picker → England Golf form → syncing → welcome flow) inside the bottom-sheet shell. On success, invalidates the WHS query keys (reuses `WhsConnectionSheet`'s `invalidateAll` pattern) and calls `onConnected`.
- Connected → renders the synced/manage body lifted verbatim from `WhsConnectionSheet` (SyncedBody + Disconnect/Delete confirm sheets).
- Header: MiniFlag + "England Golf" eyebrow + title ("Connect handicap" / "Connection details").

Rewire three entry points to open this sheet:
1. `SettingsPageV2` — swap `WhsConnectionSheet` for `HandicapConnectSheet`; connects in-sheet (no `/handicap` detour).
2. New `/edit-profile` handicap row (Part 5).
3. Onboarding — inherits from #2 because the unified edit page IS the onboarding surface.

`/handicap` page stays intact (still hosts the full `WhsConnectScreen` + `HandicapDashboard`).

## 5. Unified Edit Profile page

New `src/pages/EditProfile.tsx`: single-scroll page backed by `useProfileForm` + `useProfileSave`, Activity-style header, inline Save at end. Composes existing `edit-v2/` sections:
- Header photo + profile photo cards.
- Identity (display name, locked username).
- Location.
- Golf group (home club, additional clubs, college selector, golf info) + the smart Handicap row (below).
- About group (bio + websites).
- Collapsible social links.
- Privacy.

**Smart Handicap row** (in the GOLF SectionCard), three states:
- (a) WHS connected → "Official Handicap" with synced value, green "Synced with England Golf" pill, manage row that opens `HandicapConnectSheet`, "View full stats ›" link to `/handicap`. Manual input hidden (but stored value preserved in form).
- (b) Not connected, has manual → `HandicapInput` (editable) + prominent "Connect official handicap" button.
- (c) Not connected, no handicap → primary "Connect official handicap" CTA + helper copy + secondary "or enter manually" reveals `HandicapInput`.
- Helper copy under connect CTA: "Connect your official WHS handicap to appear on leaderboards, feature in course Champions, and unlock your full stats dashboard."

**First-login gating** (returning users: none):
- `isNewUser = !profile?.has_completed_onboarding`.
- Pass `{ requireOnboardingFields: isNewUser }` to `useProfileForm`; require Display Name + Gender. Handicap is never required.

## 6. Routing + retire old pages

- `App.tsx`: `/edit-profile` → new `EditProfile`; delete `/quick-edit-profile` route + import.
- `useEditProfileRoute.ts`: return `'/edit-profile'` always.
- `globalHeaderRules.ts`, `PageRoot.tsx`, `AuthWrapper.tsx`, `CompactHeader.tsx`: remove `/quick-edit-profile` references; keep `/edit-profile`.
- Delete: `QuickEditProfilePage.tsx`, old `EditProfilePage.tsx` wrapper, `PersonalProfileWizard.tsx`, `WizardHeader.tsx`, `WizardProgress.tsx`, `steps/PhotosIdentityStep.tsx`, `steps/GolfInfoStep.tsx`, `steps/AboutStep.tsx`. Remove `PersonalProfileWizard` export from `profile-wizard/index.ts`.
- Keep: business wizard + steps, `types.ts`, `useProfileForm`, `useProfileSave`, all of `edit-v2/`, `WhsConnectScreen`, `HandicapDashboard`, `useWhsConnection`, `callConnectWhs`.

## Constraints

- Edit-profile form never writes `eg_handicap_index` again.
- Manual handicap is preserved when WHS connects (fallback on disconnect).
- No changes to `connect-whs` / `disconnect-whs` edge functions or the WHS sync pipeline.
- No changes to the business wizard.
- No `ProfileFormData` fields dropped.

## Ship order

1. Run Part 1 migration (separate approval step).
2. After types regenerate: ship Parts 2–6 together (helper, form fixes, sheet, page, routing, deletes).
3. Verify: `grep -rn "quick-edit-profile" src` returns zero; `useProfileSave` no longer writes `eg_handicap_index`; tsc clean.

## Open question

Brief notes leaderboards stay WHS-only by default but flags this for confirmation. **Default chosen: WHS-only for ranked leaderboards; manual handicap shows on profile only.** Flag in commit message; revisit if you want manual users included.
