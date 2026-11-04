# REMOVE_BADGES_1 report

## Changes
- §1 ProfileHero: Badges counter, `'badges'` HeroStat and the `useProfileAchievementFigures` call/import removed. Other counters unchanged in order and style.
- §2 TheirFormSection: "{n} badges" item, Award icon and its "·" separator removed (unused Award/T40 imports dropped). Streak item untouched; `badges_earned` stays in the type.
- §3 Activity: new `retiredActivityKinds.ts` drops `badge_earned` rows where ActivityPageV2 maps feed pages (first page and flattened rows), before featured pick, grouping and New/unread buckets. `badge_earned` removed from the gamification category types (and "Badges" dropped from its sub-line). ledgerKinds and activityLinks handling kept, commented as retired.
- §4 AchievementsPane: **not reachable**. `tabFromParam` valid tabs exclude `achievements`, `getProfileTabs` doesn't list it, and `?sheet=achievements` is consumed without opening anything. Nothing changed.

## Limitation
The Activity tab's global unread number comes from the server RPC `get_unread_notification_count`, which still counts unread badge_earned rows. No server edits were allowed. On the page, these rows are hidden and don't count toward New. "Mark all read" still marks them read, which does no harm.

## Server side (source only, unchanged)
- `supabase/functions/gam-evaluator/index.ts` still enqueues `badge_earned` notifications (lines ~1660, ~1713) and has priority/dedupe/text cases for them (~3119, ~3136, ~3392).
- `gam-notifications-dispatcher/index.ts:278` still formats them; `_shared/notifRoute.ts:114` routes them; `delete-account` references badge data.
- Several migrations define badge tables and awards.

## Files touched
src/components/profile/hero/ProfileHero.tsx, src/components/friend-sheet/parts/TheirFormSection.tsx, src/features/activity-v2/ActivityPageV2.tsx, src/features/activity-v2/retiredActivityKinds.ts (new), src/lib/notifications/notificationCategories.ts, src/features/activity-v2/components/ledgerKinds.tsx (comments), src/features/activity-v2/utils/activityLinks.ts (comment), src/test/linkedHandicapProfile.test.tsx, src/test/removeBadges1.test.tsx (new).

## Tests
Rewritten: `linkedHandicapProfile.test.tsx` "preserves all three counter actions below the notice" → renamed "preserves the remaining counter actions below the notice".
- Old: `toHaveLength(3)` … `toEqual(['rounds', 'rated', 'badges'])`
- New: `toHaveLength(2)` … `toEqual(['rounds', 'rated'])`
- Why: the Badges counter is removed by §1.

Added `removeBadges1.test.tsx` (6 tests):
- No badges counter on own profile, another member's profile, or a pro's.
- Friend sheet shows no badges text or Award icon, and the streak item still shows.
- badge_earned rows are dropped and don't count as unread.
- No badge setting in notification preferences.

The Activity test checks the shared filter function, not a full render of the Activity page.

## Counts
Before: 6,748 / 593 files. After: 1,748 / 1,605 / 1,720 / 1,681 = 6,754 / 594 files (+6 new tests, +1 file). 0 failures, 0 unhandled errors, no pre-existing failures. Build OK at 2026-11-04T21:25:01Z. Logs: docs/verification/remove-badges-1/.
