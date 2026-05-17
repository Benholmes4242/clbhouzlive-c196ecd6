# Gamified Handicap & Achievements Audit
_Read-only inventory. No code changes. Reference document for spec drafting._

> **Scope**: every database object, RPC, edge function, hook, component, type and
> notification surface that the four Handicap tabs (Today / Trends / Records /
> Friends) and the Achievements bottom sheet currently read from.
> All row counts captured from `pg_stat_user_tables` at audit time (small project).

---

## 1. Database — tables, views, materialized views

### Tables (public schema, in scope)

| Table | ~Rows | PK | Purpose |
| --- | --- | --- | --- |
| `whs_connections` | 4 | `id` (uuid) | One row per linked England Golf account. Holds `user_id`, `provider`, `passport_id`, `membership_number`, `last_synced_at`, `last_sync_status`, `initial_sync_complete`, `created_at`. |
| `whs_scores` | 800 | `id` | Round-level facts from EG. Key cols: `connection_id`, `play_date`, `course_id`→`whs_courses`, `adjusted_gross`, `actual_gross`, `stableford_points`, `handicap_differential`, `course_rating`, `slope_rating`, `pcc`, `course_handicap`, `is_counter`, `is_competition_score`, `is_nine_hole`, `total_holes`, `handicap_index_at_time`, `marker_name`, `hole_by_hole_fetched`, `permalink_url`. |
| `whs_score_holes` | 9 720 | `id` | Per-hole rows for rounds where `hole_by_hole_fetched=true`. Cols: `score_id`, `hole_no`, `par`, `actual_gross`, `adjusted_gross`, `distance_yards`, `stroke_index`, `played`, `hole_alias`. |
| `whs_courses` | 156 | `id` | EG course catalogue. `name`, `country_name`, `country_code`. |
| `whs_handicap_snapshots` | 4 | `id` | Append-only authoritative post-round handicap timeline. Cols: `connection_id`, `observed_at`, `handicap_index`, `source`. Source of truth for the Hero card / trend. |
| `whs_friend_handicap_snapshots` | 244 | `id` | Same shape for non-self EG passport handicaps (driven by `log_friend_handicap_snapshot` trigger). |
| `whs_friends` | 164 | `id` | Friend rows scraped from EG passport. `connection_id` (owner), `friend_passport_id`, `friend_name`, `friend_home_club`, `friend_handicap_index`, `friend_thumbnail_url`, `friend_privacy_mode`, `last_round_*`, `first_seen_at`, `last_seen_at`. |
| `whs_invites` | 0 | `id` | Outbound invite codes. `inviter_user_id`, `invitee_passport_id`, `invite_code`, `share_method`, `sent_at`, `redeemed_at`, `redeemed_by_user_id`. |
| `whs_invite_completions` | 0 | `id` | Records when an invite resulted in a new connection. |
| `whs_round_reactions` | 1 | `id` | Hearts on friend rounds. `score_id`, `user_id`, `reaction_type` (default `heart`). |
| `whs_ai_insights` | 4 | `id` | Cached LLM strings for Echo Insights card (Trends tab). |
| `whs_ai_recommendation_history` | 7 | `id` | Prompt/response audit for AI insight gen. |
| `whs_connection_nudges` | 0 | `id` | Rate-limit log for `send_whs_connection_nudge`. |
| `whs_to_golf_course_map` | 128 | `id` | Manual alias of WHS course id ↔ canonical `golf_courses.id`. |
| `whs_course_aliases` | 157 | `id` | Lookup by WHS name → `golf_courses.id` (with `thumbnail_url`). |
| `whs_country_to_golf_country` | 95 | `id` | EG country → `golf_courses.country` mapping. |
| `user_handicap_history` | 24 | `id` | Generic per-user handicap timeline (driven by `capture_handicap_change` trigger on `user_profiles.eg_handicap_index`). `user_id`, `recorded_at`, `handicap`, `season_id`, `source`. |
| `achievements` | 0 | `id` | Catalogue rows: `code`, `name`, `description`, `category`, `icon_key`, `points`, `is_active`, `sort_order`. **Currently empty.** |
| `user_achievements` | 0 | `id` | Unlocks: `user_id`, `achievement_id`, `unlocked_at`, `source_context`. **Currently empty.** |
| `badges` | 0 | `id` | Separate badge catalogue (`name`, `display_name`, `emoji`, `category` enum, `tier` enum, `criteria_value`, `criteria_type`). **Empty.** |
| `user_badges` | 0 | `id` | Unlock rows. **Empty.** |
| `user_badge_pins` | 0 | `id` | User-selected pinned badges for profile. |
| `combination_achievements` | 0 | `id` (text) | Combo achievements with `criteria_json`. **Empty.** |
| `streaks` | 0 | `id` | Daily/weekly/monthly streak counters used by `useStreaks` (Top 100 / engagement, not WHS rounds). **Empty.** |
| `user_streaks` | 0 | `id` | Older streak shape. **Empty.** |
| `rivals` | 0 | `id` | Top 100-XP rival list (`user_id`, `rival_user_id`). **Empty.** |
| `user_rivals` | 0 | `id` | Older shape. **Empty.** |
| `user_rival_overrides` | 1 | (`user_id`,`slot_index`) | User pins for Friends-tab rivalry slots. `rival_user_id` or `rival_friend_row_id`. |
| `friend_rivalry` | 0 | (`user_id`,`slot_index`) | Materialized 4 rivalry slots per user (slot kinds `regular`/`chasing`/`chased_by`/`pinned`). Filled by `compute_friend_rivalries(p_user_id)`. |
| `friend_featured_round` | 4 | `user_id` | One "featured friend round" per user (recency/rivalry/quality/novelty). Filled by `compute_friend_featured_round(p_user_id)`. |
| `college_rivalries` | 0 | `id` | College-vs-college weighting table (not surfaced on Handicap pages today). |
| `user_friends` | 0 | `id` | App-level friendship graph (separate from EG). Used by `useFriendsLeaderboard` and several social RPCs. |
| `posts` | n/a | `id` | No `whs_round_id` column. WHS rounds are NOT mirrored into `posts`. |
| `notifications` | n/a | `id` | Used for friend-request + accepted notifications. No dedicated handicap/achievement notification type exists in current code paths. |

### Views

- `user_achievements_view` — `achievements` LEFT JOIN `user_achievements` (per-row `is_unlocked`).
- `whs_invite_status` — `whs_invites` + computed `status` (`pending`/`redeemed`/`expired`).
- `whs_friend_matches` — joins `whs_friends` ↔ `whs_connections` on passport_id (yields `owner_user_id`, `friend_user_id`, `friend_connection_id`, `is_clbhouz_user`).
- `whs_friend_course_bests` — `DISTINCT ON (connection_id, course_id)` lowest adjusted_gross in last 90 days.
- `whs_friend_window_rankings` — CTE-based aggregates per friend connection over `this_year` / `this_month` / `last_8`.
- `user_friend_pairs` — symmetric pairs derived from `user_follows`.

### Materialized views

| MV | Refresh | Underlying | Consumer |
| --- | --- | --- | --- |
| `whs_handicap_distribution` | Cron `refresh-whs-handicap-distribution` daily 03:00 (calls `refresh_whs_handicap_distribution()`) | `user_profiles` (filtered `eg_handicap_index IS NOT NULL AND peer_comparison_visible=true`) bucketed sub_zero/0_4/5_9/10_14/15_19/20_24/over_25. | `get_my_handicap_percentile` RPC → `WhereYouStandSection`. |
| `creator_quality_scores` | (unrelated to handicap; out of scope) | posts/likes/comments | clubhouse only. |

---

## 2. RPCs (public schema)

| RPC | Args | Returns | SECURITY DEFINER | Called from | Purpose |
| --- | --- | --- | --- | --- | --- |
| `get_my_handicap_percentile` | — | `jsonb` (`HandicapPercentileResult`) | ✅ | `src/lib/whs/usePercentile.ts` → `WhereYouStandSection` (Trends) | Returns viewer's bucket, percentile_top, cohort_size and 7-bucket histogram from `whs_handicap_distribution`. |
| `toggle_whs_round_reaction(p_score_id uuid, p_reaction_type text='heart')` | | `TABLE(reacted bool, total bigint)` | ✅ | `useToggleRoundReaction` (`hooks.ts`) → small friend cards | Toggle heart on a friend round. |
| `send_whs_connection_nudge(p_recipient_id uuid)` | | `jsonb` | ✅ | `src/lib/whs/nudge.ts` → Friends header / morning moment | Rate-limited 7-day nudge. |
| `has_recently_nudged_whs(p_recipient_id uuid)` | | `boolean` | ✅ | `src/lib/whs/nudge.ts` | Pre-check before sending nudge. |
| `mark_today_visited()` | — | `void` | ✅ | `useMarkTodayVisited` (`hooks.ts`) → Today view mount | Records "user opened Today" for Since-Last-Visit filtering. |
| `get_friend_rounds_since_last_visit(p_limit int=8)` | | `jsonb` | ✅ | `fetchFriendRoundsSinceLastVisit` → `SinceLastVisitRail` | Friend rounds posted since the user's last `mark_today_visited`. |
| `get_friend_leaderboard(p_user_id uuid)` | | `TABLE(... 15 cols incl handicap_30d_ago/delta, rounds_last_30d)` | ❌ | `fetchFriendLeaderboard` → `FriendsLeaderboardSection` | Self + friends ranked w/ 30-day delta & round count. |
| `compute_friend_rivalries(p_user_id uuid)` | | `void` | ✅ | Server-side (nightly + on-demand) | Fills `friend_rivalry` rows for a user. |
| `compute_friend_featured_round(p_user_id uuid)` | | `void` | ✅ | Server-side | Fills `friend_featured_round`. |
| `compute_all_friend_rivalries()` / `compute_all_friend_featured_rounds()` | — | `int` | ✅ | Called from `friend_content_nightly()` cron path. | Bulk variants. |
| `friend_content_nightly()` | — | `jsonb` | ✅ | Cron `friend_content_nightly` 04:00 | Runs the two `compute_all_*` functions + book-keeping. |
| `capture_handicap_snapshot()` | — | `void` | ✅ | Cron `weekly-handicap-snapshot` Sun 03:00 | Writes a row per active connection to `whs_handicap_snapshots`. |
| `capture_handicap_change()` | TRIGGER | — | ✅ | Trigger on `user_profiles.eg_handicap_index` | Writes into `user_handicap_history`. |
| `check_and_award_badges(user_id_param uuid)` | | `TABLE(newly_awarded_badges json)` | ✅ | `trigger_badge_check` on `user_follows` INSERT (only path wired today) | Evaluates `badges` catalogue against thresholds. |
| `complete_pending_whs_invites()` | TRIGGER | — | ✅ | Trigger on `whs_connections` INSERT | When a new connection lands, mark matching invite rows redeemed. |
| `detect_shared_rounds(p_user_id, p_rival_user_id)` | | `TABLE(...)` | ? | `fetchSharedRounds` → `FriendProfileSheet` | H2H shared rounds W/L/T. |
| `get_trophy_aggregates(p_user_id uuid, p_connection_id uuid)` | | `jsonb` (TrophyAggregates) | ? | `fetchTrophyAggregates` → `useTrophyAggregates` → `AllTrophiesSheet` | Hole_stats (aces, eagles, birdies, albatross, sub-par firsts), course_stats (countries, unique courses, Top100 list counts), social_stats. |
| `match_whs_course_to_golf_course(p_whs_name text, p_country_code text)` | | `TABLE(id,name,thumbnail_image,region,match_method,similarity_score)` | ✅ | `lookupCourseThumbnailV2`/`lookupCourseMetaV2` via `courseNameMatcher.ts` | pg_trgm matcher (T11.0/T11.2). |
| `refresh_whs_handicap_distribution()` | — | `void` | ✅ | Cron `refresh-whs-handicap-distribution` daily 03:00 | `REFRESH MATERIALIZED VIEW`. |
| `get_handicap_improvement_leaderboard(p_scope, p_current_user_id, p_club_id, p_country, p_limit, p_offset)` | | TABLE | ✅ | `useSeasonImprovementLeaderboard` / `useFastClimbers` (out of Handicap page scope, but related). |
| `get_friend_played_recommendations`, `get_friend_course_activity`, `get_friend_rounds_since_last_visit` | various | TABLE / jsonb | ✅ | Recently-active rails / since-last-visit. |
| `get_lowest_handicap_leaderboard`, `get_similar_handicap_leaderboard`, `get_season_improvement_leaderboard`, `get_user_exploration_status`, `get_fast_climbers`, `get_leaderboard_countries`, `get_course_leaderboard`, `nearby_golfers` | various | TABLE | mixed | Used by `/leaderboards` pages, NOT by `/handicap` directly. Included for completeness. |

---

## 3. Triggers (in-scope tables)

| Table | Trigger | Event | Function | Purpose |
| --- | --- | --- | --- | --- |
| `user_profiles` | `trigger_capture_handicap_change` | AFTER UPDATE OF `eg_handicap_index` | `capture_handicap_change()` | Writes row into `user_handicap_history`. |
| `user_profiles` | `trg_log_self_handicap_snapshot_insert`/`_update` | AFTER INSERT / AFTER UPDATE OF `eg_handicap_index` | `log_self_handicap_snapshot()` | Mirrors the user's handicap into the snapshot timeline. |
| `whs_handicap_snapshots` | `trg_sync_user_profiles_handicap_from_snapshot` | AFTER INSERT | `sync_user_profiles_handicap_from_snapshot()` | Pushes WHS-sourced handicap onto `user_profiles.eg_handicap_index`. |
| `whs_friends` | `trg_log_friend_handicap_snapshot_insert/update` | AFTER INSERT / UPDATE OF `friend_handicap_index` | `log_friend_handicap_snapshot()` | Maintains `whs_friend_handicap_snapshots`. |
| `whs_connections` | `whs_connections_complete_invites_aft_insert` | AFTER INSERT | `complete_pending_whs_invites()` | Marks matching invite rows redeemed. |
| `whs_connections` | `whs_connections_set_updated_at` | BEFORE UPDATE | `set_updated_at()` | timestamp bookkeeping. |
| `whs_invites` | `whs_invites_set_updated_at` | BEFORE UPDATE | `set_updated_at()` | timestamp bookkeeping. |
| `user_friends` | `on_friend_request_created` | AFTER INSERT | `create_friend_request_notification()` | Notifications. |
| `user_friends` | `on_friend_request_accepted` | AFTER UPDATE | `create_friend_accepted_notification()` | Notifications. |
| `user_friends` | `on_friend_request_accepted_auto_follow` | AFTER UPDATE | `auto_follow_on_friend_accept()` | Mirrors friendship to `user_follows`. |
| `user_follows` | `check_badges_on_user_follows` | AFTER INSERT | `trigger_badge_check()` → `check_and_award_badges()` | Only place `check_and_award_badges` is wired. |

**Notable absence**: no triggers on `whs_scores`, `whs_score_holes`, `user_achievements`, `user_badges`, or `user_streaks`. Achievements are NOT awarded server-side on round insert.

---

## 4. Edge functions

| Function | Trigger | Purpose | Secrets |
| --- | --- | --- | --- |
| `connect-whs` | HTTP (frontend `callConnectWhs`) | Validates EG credentials, performs initial sync, creates `whs_connections` row, imports scores/friends. **Not present in `supabase/functions/` in this repo** — deployed externally. | EG token (mitmproxy daily ritual) |
| `sync-whs-one` | HTTP (frontend `callSyncWhsOne`) | Re-sync the calling user's connection. **Not present in repo.** | EG token |
| `disconnect-whs` | HTTP | Mark connection disconnected. ✅ in repo. | – |
| `delete-whs-data` | HTTP | Wipe a user's WHS data. ✅ in repo. | – |
| `backfill-whs-course-mapping` | HTTP / manual | Backfill `whs_to_golf_course_map`. ✅ in repo. | – |
| `create-whs-invite` | HTTP (`callCreateInvite`) | Generate invite code/share URL. **Not present in repo.** | – |
| `generate-handicap-insights` | HTTP / scheduled | Writes `whs_ai_insights` rows for the Trends tab Echo card. ✅ in repo. | `LOVABLE_API_KEY` |
| `calculate-streaks` | HTTP / scheduled | Maintains `streaks` table (engagement streaks — not WHS round streaks; those are derived client-side in `useStreaks` from `useAllScores`). ✅ in repo. | – |
| Crons that are paused per brief: `tournament-live-sync` and `tourhub-sync-every-5min` — **both currently `active=true`** in `cron.job`. `tournament-live-sync` runs every minute. There is no job called `tourhub-sync-every-5min`; closest is `tourhub-sync-enrich-daily` (daily 03:10). |

---

## 5. Cron jobs (handicap-relevant subset)

| jobname | schedule | active | calls |
| --- | --- | --- | --- |
| `refresh-whs-handicap-distribution` | `0 3 * * *` | ✅ | `SELECT refresh_whs_handicap_distribution()` |
| `weekly-handicap-snapshot` | `0 3 * * 0` | ✅ | `SELECT capture_handicap_snapshot()` |
| `sync-whs-due-every-6h` | `0 */6 * * *` | ✅ | HTTP → `sync-whs-due` edge function (not in repo) |
| `whs-course-bridge-nightly` | `0 3 * * *` | ✅ | maintenance of WHS↔golf_courses bridges |
| `friend_content_nightly` | `0 4 * * *` | ✅ | `SELECT friend_content_nightly()` (recomputes rivalries + featured rounds) |
| `tournament-live-sync` | `* * * * *` | ✅ | per-minute tour sync (brief expected paused — **still active**) |
| `auto-map-tournament-venues` | `0 4 * * *` | ✅ | tour mapping |
| `tourhub-sync-enrich-daily` | `10 3 * * *` | ✅ | tour enrichment |

(Full list in `cron.job` has 30+ rows; only handicap/round-pipeline jobs included above.)

---

## 6. React hooks (Handicap pages + Achievements sheet)

| Hook | File | Reads | Cache (queryKey, staleTime) | Consumers |
| --- | --- | --- | --- | --- |
| `useWhsConnection(userId)` | `src/lib/whs/hooks.ts` | `whs_connections` (single row) | `['whs-connection', userId]`, 30s | `HandicapPage`, `WhsHandicapTab`, `FriendHandicapDashboard` |
| `useHandicapTrend(connectionId)` | hooks.ts | `whs_handicap_snapshots` + fallback `whs_scores.handicap_index_at_time` | `['whs-handicap-trend', cid]`, 60s | `HeroHandicapCardDark`, `HandicapDashboard` |
| `useLastRound(connectionId)` | hooks.ts | `whs_scores` + `whs_handicap_snapshots` | `['whs-last-round']`, 60s | `LastRoundCard` |
| `useCounters(connectionId)` | hooks.ts | `whs_scores WHERE is_counter` (top 8) | `['whs-counters']`, 60s | `RoundsThatCountCard` |
| `useAllScores(connectionId)` | hooks.ts | `whs_scores` (limit 1000) + thumbnail enrichment via `courseNameMatcher` | `['whs-all-scores']`, 60s | `useStreaks` (client streaks), `TrophiesSheetMount`, `RecentRoundsCard`, `Pattern14Card` |
| `useHandicapHistory(cid, daysBack)` | hooks.ts | `whs_handicap_snapshots` ∪ `whs_scores.handicap_index_at_time` deduped per day | `['whs-handicap-history', cid, daysBack]`, 60s | `IndexHistoryCard`, `TrophiesSheetMount` (365d), `HandicapProjectionCard` |
| `useFriendsActivity(ownerUserId)` | hooks.ts | `whs_friend_matches` + `whs_scores` + `whs_round_reactions` | `['whs-friends-activity']`, 30s | `RecentlyPlayedFeed`, `RecentlyActiveRail` |
| `useFriendCourseBests(ownerUserId)` | hooks.ts | `whs_friend_course_bests` view | `['whs-friend-course-bests']`, 60s | rosette flag in `RecentlyPlayedFeed` |
| `useFriendWindowRankings(ownerUserId)` | hooks.ts | `whs_friend_window_rankings` view | `['whs-friend-window-rankings']`, 60s | `FriendsLeaderboardSection` |
| `useFriendLeaderboard(userId)` | hooks.ts | RPC `get_friend_leaderboard` | `['whs-friend-leaderboard']`, 30s | `FriendsLeaderboardSection` |
| `useFriendFeaturedRound(userId)` | hooks.ts | `friend_featured_round` + joins | `['whs-friend-featured-round']`, 60s | `FeaturedFriendRoundHero` |
| `useFriendRivalries(userId)` | hooks.ts | `friend_rivalry` + `whs_friend_matches` | `['whs-friend-rivalries']`, 60s | `RivalriesSection` |
| `useUserRivalOverrides(userId)` | hooks.ts | `user_rival_overrides` | `[..]`, 0 | `RivalriesSection` (pin/unpin) |
| `useUpsertRivalOverride` / `useDeleteRivalOverride` | hooks.ts | mutations on `user_rival_overrides`; invalidates rivalries | – | `RivalryEditSheet` |
| `useSharedRounds(userId, rivalUserId)` | hooks.ts | RPC `detect_shared_rounds` | `['whs-shared-rounds']`, 60s | `FriendProfileSheet` |
| `useTrophyAggregates(userId, cid)` | hooks.ts | RPC `get_trophy_aggregates` | `['trophy-aggregates']`, 5m | `TrophiesSheetMount` |
| `useFriendRoundsSinceLastVisit(enabled)` | hooks.ts | RPC `get_friend_rounds_since_last_visit` | `['whs','friend-rounds-since-last-visit']`, 60s | `SinceLastVisitRail` |
| `useMarkTodayVisited()` | hooks.ts | RPC `mark_today_visited` | mutation | Today view onMount |
| `useToggleRoundReaction()` | hooks.ts | RPC `toggle_whs_round_reaction` | optimistic on `['whs-friends-activity']` | small friend cards |
| `useRoundDetail(scoreId)` / `useFriendRoundDetail` | hooks.ts | `whs_scores` + `whs_score_holes` | `['whs-round-detail']`, 60s | `RoundDetailSheet`, cinema sheets |
| `useCourseForm(cid, currentHcp)` | hooks.ts | `whs_scores` grouped by course (client-side) + thumbnail enrichment | `['whs-course-form']`, 60s | `CourseFormCard` |
| `useTryNextCourses(userId, country)` | hooks.ts | `user_courses` + `golf_courses` (filter by country_rank) | `['try-next-courses']`, 5m | `TryNextCourses` (legacy, not in current views) |
| `useSentInvites()` | hooks.ts | `whs_invite_status` view | `['whs-sent-invites']`, 30s | `SentInvitesSheet` |
| `useHandicapPercentile(userId)` | `src/lib/whs/usePercentile.ts` | RPC `get_my_handicap_percentile` | `['whs','percentile']`, 12h | `WhereYouStandSection` (Trends) |
| `useStreaks(connectionId)` | `src/lib/whs/useStreaks.ts` | derived from `useAllScores` (no DB call) | – | `StreaksSection`. Computes `noUp`, `cutting`, `counter` streaks + 12-round timeline. |
| `useFriendsYesterday` | `src/lib/handicap/useFriendsYesterday.ts` | `whs_friend_matches` + `whs_scores` filtered to yesterday window | own key | `MorningMoment` / `FriendsYesterdayCard` |
| `sendWhsConnectionNudge`, `hasRecentlyNudged` | `src/lib/whs/nudge.ts` | RPCs | – | Friends header / Morning Moment |
| `useUserAchievements(userId)` | `src/hooks/useUserAchievements.ts` | view `user_achievements_view` | `['user-achievements', uid]`, 60s | profile (NOT used by current Handicap pages' AllTrophiesSheet) |
| `useProfileAchievements(userId)` | `src/hooks/useProfileAchievements.ts` | `useTop100ProgressForUser` + `ALL_ACHIEVEMENTS` from `lib/achievementDefinitions.ts` | derived | `ProfileAchievementsRail` / `ProfileAchievementsPanel`. Honors `DEBUG_UNLOCK_ALL_ACHIEVEMENTS` for Benjamin's email. |
| `useRecentAchievements(userId,limit)` | `src/hooks/useRecentAchievements.ts` | `user_achievements` JOIN `achievements` | `['user-achievements-recent']`, 30s | `ProfileRecentAchievementsStrip` |
| `useAchievementCatalogue()` | `src/hooks/useAchievementCatalogue.ts` | `achievements WHERE is_active` | `['achievements-catalogue']`, 5m | profile achievement screens |
| `useRivals(userId)` | `src/hooks/useRivals.ts` | `rivals` + `user_season_xp` | `['rivals']`, 60s | `RivalsPanel` (Top 100 engagement — **not** the Friends-tab rivalries on Handicap page) |
| `useStreaks(userId)` (engagement) | `src/hooks/useStreaks.ts` | `streaks` table | `['streaks']`, 30s | `StreakWidget` (engagement) — separate from `whs/useStreaks` |
| `useFriendsLeaderboard(userId)` | `src/hooks/useFriendsLeaderboard.tsx` | `user_friends` + `course_ratings` + `golf_courses` (Top 100 counts) | `['friends-leaderboard']`, 5m | quest/Top100 — NOT the Handicap Friends tab |
| `useTop100ProgressForUser(userId)` | `src/hooks/useTop100ProgressForUser.ts` | `user_course_activity` ∩ `course_top100_memberships` | `['top100-progress-for-user']` | `TrophiesSheetMount` (overrides `agg.course_stats.top100_lists`) |

---

## 7. Components on Handicap pages + Achievements sheet

### Entry / shell

- `src/pages/HandicapPage.tsx` — route `/handicap` and `/handicap/:userId`. Builds header (greeting or friend title), 4-tab segmented control, fetches `user_profiles{username,display_name,profile_photo_url}` for greeting, picks `WhsHandicapTab` (own) or `FriendHandicapDashboard` (friend).
- `src/components/profile/handicap/whs/WhsHandicapTab.tsx` — gate: shows `WhsConnectScreen` if no connection else `HandicapDashboard`.
- `src/components/profile/handicap/whs/HandicapDashboard.tsx` — picks subtab from `?subtab=` and renders `views/TodayView | TrendsView | RecordsView | FriendsView` + mounts `TrophiesSheetMount` + connection caption footer.

### Today view (`views/TodayView.tsx`)

- `sections/TodayGreeting`
- `sections/HeroHandicapCardDark` — big "INDEX" card. Uses `useHandicapTrend`.
- `sections/NextRoundWatch` — wraps `predictHandicap.ts` (`projectNextRound`) over last 20.
- `sections/Pattern14Card` — 14-round form / temperature card.
- `sections/IndexHistoryCard` — sparkline from `useHandicapHistory`.
- `sections/LastRoundCard` — `useLastRound`, derives `HCP ↓/↑` delta from snapshot − `handicap_index_at_time`.
- `sections/RoundsThatCountCard` — `useCounters` + ring.
- `sections/StreaksSection` — `useStreaks(connectionId)` (client-derived).
- `sections/since-last-visit/SinceLastVisitRail` — `useFriendRoundsSinceLastVisit` after `mark_today_visited`.

### Trends view (`views/TrendsView.tsx`)

- `sections/trends/TrendCardsStack` — composes `HandicapProjectionCard`, `StablefordCard`, `TrendNarrativeSection`.
- `sections/trends/HandicapProjectionCard` — uses `useHandicapHistory` + `predictHandicap`.
- `sections/trends/StablefordCard` (+ `StablefordDetailSheet`) — uses `useAllScores` and `computeStablefordDistribution.ts`.
- `sections/trends/TrendNarrativeSection`
- `sections/WhereYouStandSection` — `useHandicapPercentile`.
- `sections/EchoInsightsCard` — reads `whs_ai_insights` (generated by `generate-handicap-insights` edge fn).

### Records view (`views/RecordsView.tsx`)

- `sections/trends/CourseFormCard` — `useCourseForm`.
- `sections/trends/RecentRoundsCard` — `useAllScores` + `computeRoundDeltas.ts` (HCP ↑/↓ pill per round).

### Friends view (`views/FriendsView.tsx`)

- `components/handicap/MorningMoment` + `morning-moment/FriendsYesterdayCard` (uses `useFriendsYesterday`, `sendWhsConnectionNudge`).
- `sections/friends-header/FriendsHeaderSection`
- `sections/recently-active/RecentlyActiveRail` + `RecentlyActiveItem`
- `sections/friends/FriendsEchoSection`
- `sections/recently-played/RecentlyPlayedFeed` + `FriendRoundCard`, `cinema-friend-card/*`, `small-friend-cards/*` (uses `useFriendsActivity`, `useToggleRoundReaction`, `useFriendCourseBests`).
- `sections/rivalries/RivalriesSection` + `RivalryAddCard`, `RivalryCard`, `RivalryEditSheet`, `RivalryInfoSheet` (uses `useFriendRivalries`, `useUserRivalOverrides`, `useSharedRounds`, `useUpsert/DeleteRivalOverride`).
- `sections/friends-leaderboard-v2/FriendsLeaderboardSection` + `LeaderboardRow` (uses `useFriendLeaderboard`, `useFriendWindowRankings`).
- `sections/invite-to-clbhouz/InviteToClbhouzV2` + `InviteCard`, `SentInvitesSheet` (uses `useSentInvites`, `callCreateInvite`).
- `sections/featured-friend-round/FeaturedFriendRoundHero` (uses `useFriendFeaturedRound`).
- `sections/friend-profile-sheet/FriendProfileSheet`, `FriendProfileContent`, `FriendProfileBlocks`.

### Achievements bottom sheet

- `sections/TrophiesSheetMount.tsx` — listens to `openTrophiesSheet` event; loads `useAllScores`, `useHandicapHistory(365)`, `useTrophyAggregates`, `useTop100ProgressForUser`, plus `user_profiles.primary_club_id` → `golf_clubs`; calls `computeAchievements({...})` from `lib/whs/achievements.ts`; passes the resulting `Achievement[]` to `AllTrophiesSheet`.
- `sections/AllTrophiesSheet.tsx` — renders trophies grouped by category (`handicap`, `scoring`, `courses`, `community`) with per-category accent (green/amber/blue/purple). Opens `AchievementInfoSheet` on tap.
- `sections/AchievementInfoSheet.tsx` — detail sheet per achievement.
- `sections/AchievementsStrip.tsx` — preview rail of "next up" trophies via `pickNextUpTrophies`.

---

## 8. Type definitions (in-scope)

Most in `src/lib/whs/types.ts`:
- `WhsConnection`, `WhsHandicapTrend`, `WhsCourseRef`, `WhsScore`, `WhsLastRound`, `WhsCounterScore`, `WhsScoreWithIndex`, `WhsRoundDetail`, `WhsScoreHole`
- `HandicapPoint`, `CourseForm`
- `WhsFriendCourseBest`, `WhsFriendActivityWithImage`, `WhsFriendWindowRanking`
- `FriendFeaturedRound`, `FriendFeaturedRoundHydrated`
- `RivalrySlotKind`, `FriendRivalry`, `FriendRivalryHydrated`, `UserRivalOverride`
- `FriendLeaderboardEntry`
- `FriendRoundSinceLastVisit`, `FriendRoundsSinceLastVisitResult`
- `HandicapBucket`, `HandicapPercentileBucket`, `HandicapPercentileResult`
- `Achievement`, `AchievementType` (22 values), `AchievementCategory` (`handicap|scoring|courses|community`), `AchievementKind` (`binary|counter|list`)
- `ConnectWhsResponse`, `SyncWhsResponse`, `CreateInviteResponse`, `WhsInviteStatus`

Achievement-system types (separate domain):
- `src/types/badges.ts`: `Badge`, `UserBadge`, `BadgeProgress`
- `src/hooks/useUserAchievements.ts`: `UserAchievement` (from `user_achievements_view`)
- `src/hooks/useAchievementCatalogue.ts`: `Achievement` (catalogue row — different shape than WHS Achievement)
- `src/hooks/useRecentAchievements.ts`: `RecentAchievement`
- `src/lib/achievementDefinitions.ts`: `AchievementDefinition`, `ALL_ACHIEVEMENTS` (hardcoded Top 100 milestone list)

Rival/Streak types:
- `src/hooks/useRivals.ts`: `Rival` (different shape than `FriendRivalry`)
- `src/lib/whs/useStreaks.ts`: `StreakResult`, `StreaksData` (no-up / cutting / counter)
- `src/hooks/useStreaks.ts`: `StreakData` (daily/weekly/monthly engagement)

`TrophyAggregates` is defined inside `src/lib/whs/api.ts` (the RPC return).

---

## 9. Notifications

- DB triggers `create_friend_request_notification` and `create_friend_accepted_notification` write rows into `public.notifications` for the social graph.
- No DB-side notification trigger fires for handicap changes, new WHS rounds, achievements unlocked, badges awarded, or rivalry deltas.
- OneSignal: registered in `register-push-device` edge fn; push delivery handled via `process-push-queue` edge fn.
- `process-push-queue` consumes the `notifications` (or push-queue) table; **no handicap/achievement event types** are produced today.

---

## 10. Cron jobs (full handicap-related)

See §5. The brief's expectation that `tournament-live-sync` and `tourhub-sync-every-5min` are paused is **not matched in current state**: `tournament-live-sync` is `active=true` running `* * * * *`, and `tourhub-sync-every-5min` does not exist (closest live job is `tourhub-sync-enrich-daily 10 3 * * *`).

---

## 11. WHS data pipeline (end-to-end)

```
England Golf web (HowDidiDo)
   │
   │ daily token ritual (developer captures EG session token via mitmproxy)
   ▼
[connect-whs] edge fn   ← initial sync (POST {membership_number, password})
[sync-whs-one] edge fn  ← per-user resync, called from UI "Sync now"
[sync-whs-due] (cron sync-whs-due-every-6h) ← background bulk
   │
   │ writes:
   ▼
public.whs_connections (1 per user/provider)
public.whs_scores (1 per round)  ──► triggers? none (no per-row trigger)
public.whs_score_holes (Phase 1.5 hole enrichment — only fetched for newer
  EG-app rounds where hole_by_hole_fetched=true)
public.whs_handicap_snapshots (post-round authoritative)
  └─► trigger sync_user_profiles_handicap_from_snapshot
        └─► user_profiles.eg_handicap_index
              └─► trigger capture_handicap_change → user_handicap_history
              └─► trigger log_self_handicap_snapshot → whs_handicap_snapshots (loop guarded)
public.whs_friends + whs_friend_handicap_snapshots
public.whs_courses (catalogue rows)
   │
   ▼
Daily 03:00  refresh_whs_handicap_distribution()  → whs_handicap_distribution MV
Nightly 04:00 friend_content_nightly()
   ├─ compute_all_friend_rivalries → friend_rivalry
   └─ compute_all_friend_featured_rounds → friend_featured_round
Sun 03:00 capture_handicap_snapshot()
   │
   ▼
Frontend: useWhsConnection → useHandicapTrend / useLastRound / useAllScores / etc.
```

Daily token ritual touchpoints: `connect-whs` and `sync-whs-one` require a fresh EG token in the edge-fn secrets vault; the matcher (`match_whs_course_to_golf_course`) and `whs_course_aliases` are populated by `backfill-whs-course-mapping` and the new T11.0/T11.2 migrations.

---

## 12. Achievement engine

There is **no central server-side evaluator** for the trophies shown in the Handicap "AllTrophiesSheet". The flow is:

1. Frontend (`TrophiesSheetMount`) fetches:
   - `useAllScores(connectionId)` → all `whs_scores`
   - `useHandicapHistory(connectionId, 365)` → snapshots ∪ score-derived series
   - `useTrophyAggregates(userId, connectionId)` → RPC `get_trophy_aggregates` (server-side aggregates of hole stats, course/country stats, social stats — this is the only server-side achievement evaluator)
   - `useTop100ProgressForUser(userId)` → overrides Top100 list counts
   - `user_profiles.primary_club_id` + `golf_clubs.name`
2. Frontend calls `computeAchievements()` in `src/lib/whs/achievements.ts` which **hardcodes** 22 trophy definitions across 4 categories and combines hole/course/social aggregates with handicap-history threshold crossings (`findFirstCrossDown(history,0)`, etc.) to determine `earned`, `count`, `list_played/list_total`.
3. The `Achievement` records are ephemeral — not persisted to `user_achievements`.

Separately:
- The `achievements` + `user_achievements` tables (and `user_achievements_view`) exist with associated hooks (`useUserAchievements`, `useRecentAchievements`, `useAchievementCatalogue`) but are **empty** and consumed only by the legacy/profile rails (`ProfileAchievementsRail`, `ProfileRecentAchievementsStrip`).
- The `badges` + `user_badges` system has its own evaluator `check_and_award_badges(user_id)`, wired through `trigger_badge_check()` ON INSERT to `user_follows` only. Catalogue tables are empty.
- `combination_achievements` table exists with `criteria_json` but is unwired and empty.
- `useProfileAchievements` mixes Top-100 milestone progress with `ALL_ACHIEVEMENTS` (hardcoded list in `src/lib/achievementDefinitions.ts`).

Net: 3 parallel achievement subsystems (WHS-trophies, `achievements`/`badges` DB catalogue, Top-100 milestones) with no shared definition source and no DB-side awarding for the WHS trophies surfaced on the Handicap pages.

---

## 13. Dead code / deprecated touching this surface

- `useUploadProgress` — confirmed not present anywhere in `src/` (rg returns no hits).
- `WhsRecentRound` aliased to `WhsScoreWithIndex` in `types.ts` (`@deprecated`).
- `WhsLastRoundDetail` aliased to `WhsRoundDetail` (`@deprecated`).
- `useStreaks` exists twice — `src/lib/whs/useStreaks.ts` (client-derived WHS streaks) and `src/hooks/useStreaks.ts` (server `streaks` table for engagement). Both are live, separate domains.
- `user_streaks` (legacy table) is empty and not read anywhere on Handicap pages — `streaks` is the live table.
- `user_rivals` empty / superseded by `rivals` (XP-rivals) and `friend_rivalry` + `user_rival_overrides` (WHS Friends-tab rivalries). All three coexist.
- `college_rivalries` populated to 0 rows; no frontend consumer in Handicap surface.
- `HandicapDemoExperience.tsx`, `HandicapComingSoonCard.tsx`, `EnhancedHandicapLayout.tsx`, `ThomasHandicapPerformanceChart.tsx`, `StoriesRow.tsx`, `OfficialHandicapCard.tsx`, `ManualHandicapCard.tsx`, `ManualHandicapModal.tsx`, `StandardHandicapCard.tsx`, `HandicapJourneyCard.tsx`, `HandicapMilestonesCard.tsx`, `HandicapStatGrid.tsx`, `HandicapSummaryStats.tsx`, `HandicapPerformanceChart.tsx`, `HandicapNextRoundPredictionCard.tsx`, `HandicapCourseImpactCard.tsx`, `HandicapHeroStrip.tsx`, `HandicapActions.tsx`, `PredictiveInsight.tsx`, `ShareHandicap.tsx`, `RecentRoundsFeed.tsx`, `FriendsHandicapCard.tsx`, `FriendsLeaderboard.tsx`, `AchievementsSpotlight.tsx`, `AnalyticsTabs.tsx`, `ConnectHandicapPrompt.tsx`, `HandicapConnectModal.tsx`, `HandicapProgressChart.tsx`, `HandicapSummaryCard.tsx` — all in `src/components/profile/handicap/*` (root level), none referenced from the live `HandicapPage` flow. These predate the `whs/` redesign and appear orphaned.

---

## 14. Gaps and unknowns

- **`connect-whs` / `sync-whs-one` / `create-whs-invite` / `sync-whs-due` edge functions are not in this repo**. They are called from `src/lib/whs/api.ts` and exist on the Supabase project (deployment occurs outside Lovable). Their actual code paths, EG-token handling, and rate-limiting were not inspectable in this audit.
- **No DB triggers fire on `whs_scores` insert**. So neither `user_achievements` nor `whs_handicap_snapshots` are derived from `whs_scores` directly at the row level — both come from the edge-function sync writing those tables itself. Couldn't fully verify what `sync-whs-one` writes because the source isn't in the repo.
- **Brief's expectation that `tournament-live-sync` and `tourhub-sync-every-5min` are paused is not reflected in DB**. `tournament-live-sync` is active and runs every minute. `tourhub-sync-every-5min` does not exist.
- **No central achievement engine**. The trophies in `AllTrophiesSheet` are computed client-side from `get_trophy_aggregates` + hardcoded thresholds in `src/lib/whs/achievements.ts`; the `achievements`/`badges`/`combination_achievements` tables are present but empty and the only wired evaluator (`check_and_award_badges`) fires only on `user_follows` INSERT.
- **No handicap/achievement-typed notification rows or push templates** in current code; OneSignal pipeline exists but no event types are produced for these surfaces.
- **`useProfileAchievements` hardcodes Benjamin's email via `DEBUG_UNLOCK_ALL_ACHIEVEMENTS`** to unlock everything in debug — be aware this masks empty-state behavior in dev.
- **`get_friend_leaderboard` is `SECURITY INVOKER`** (not DEFINER) — RLS on `whs_friends` / `whs_connections` must allow the calling user; haven't verified whether all expected friends surface under RLS.
- **`detect_shared_rounds` and `get_trophy_aggregates` SECDEF status** wasn't captured by the filtered RPC query — they exist (return non-null in code) but their security model was not retrieved.
- **`whs_handicap_distribution` materialized view's last_refreshed is not exposed** to clients; staleness only inferable from the 03:00 cron run.
- **`whs_courses` has no FK link to `golf_courses`** — bridging happens via `whs_to_golf_course_map` + `whs_course_aliases` + `match_whs_course_to_golf_course` RPC. Coverage gap risk for unmapped EG names.
- **Mixed Achievement type system**: at least 3 different `Achievement` TypeScript interfaces in the codebase (`src/lib/whs/types.ts`, `src/hooks/useAchievementCatalogue.ts`, `src/lib/achievementDefinitions.ts`). Migrating to a single source will require a reconciliation pass.
- **`badges` table is the only one with a Postgres enum** for `category` and `tier` (USER-DEFINED types). Enum values were not enumerated in this audit (would need `pg_enum` query).
- **`whs_round_reactions` only supports `reaction_type='heart'`** in code; column allows other strings but UI/RPC default to heart. No reaction-summary RPC — counts are computed inline in `fetchFriendsActivity`.
- **No row-count yet for `notifications`** specific to handicap/achievement events because none are produced. If gamification adds new types they'll need new enum values + push templates.
