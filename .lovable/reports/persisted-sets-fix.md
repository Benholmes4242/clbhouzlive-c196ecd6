# PERSISTED_SETS_FIX

## Changes
- `src/components/courses/browse/useFeaturedSignals.ts:22–63`: five queryFns now return sorted unique string arrays; memoized Sets reject non-array legacy values.
- `src/components/courses/useBrowseReviews.ts:203–220`: Top 100 array payload, memoized Set, legacy-object empty stamps; query identity/timing and active-list qualification unchanged.
- `src/components/courses/browse/usePlayedRounds.ts:113–138`: played-faces and played-courses now cache plain rows, expose memoized Maps through existing query wrappers; shared readMemberFaces remains unchanged for other callers.
- `src/features/explore-magazine/useTop100RankIndex.ts:57–92`: winning rank selection unchanged, cache tuple arrays and memoize Map.
- `src/features/tourhub/tournament-v2/data/usePickTeeTimes.ts:20–42`: cache tuple arrays and memoize Map, same first-per-player selection.
- `src/features/tourhub/news/newsPageData.ts:15–28`: names cache tuples and expose memoized Map.
- `src/hooks/top100/useTop100Enrichment.ts:93–217`: cache plain enrichment rows; preserve previous-map merge and Map consumer API.
- `src/test/persistedCourseSignals.test.tsx`: one new regression, no existing tests rewritten, renamed or deleted.
- `roadmap.md`: request and verification state.

Architecture decisions are documented alongside the affected modules; root AGENTS.md stays unchanged because its remaining 81-byte budget cannot fit a rule and local ownership belongs in headers.

## Sweep
Static audit covered useQuery/useInfiniteQuery files, exact first-string prefix matching, returned Set/Map types, nested payloads, shared query-key factories and indirect queryFn readers. Six additional Map query hits were converted: played-faces (indirect readMemberFaces), played-courses, top100-rank-index, tournament-v2 pick-tee-times, tour-news-event-names, top100-enrichment (top100Keys.enrichment → batchKey root).
No persisted Date or class-instance result was found: dates in query filters/sort/derived display are strings or numbers in returned data. Plain server JSON rows remain plain JSON. `profile-sheet-stats` has no active query producer. `top100-verdict-config` uses a variable called map but it is a Record object, not a Map; feed_config and this module were not changed. The allowlist, persister, build buster, staleTimes, maintenance flag, SQL/RPC contracts and round_pool_cap remain untouched.

### Every non-JSON construction found near allowlisted query roots
Line numbers are post-edit. This includes query-local helper and consumer-only hits, not just unsafe returned instances.

| File:line | Construction | Disposition |
|---|---|---|
| `src/providers/AppPrefetchProvider.tsx:267` | `const prefetchedRoutes = useRef<Set<string>>(new Set());` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/uploads/UploadToastsBridge.tsx:38` | `? `Goes live ${format(new Date(evt.scheduledAt), 'EEE d MMM')} at ${format(new Date(evt.scheduledAt), 'HH:mm')}`` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/pages/HandicapPage.tsx:71` | `function getGreeting(now: Date = new Date()): string {` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/useBrowseReviews.ts:176` | `new Set(rows.filter((r) => !r.reviewerName && r.userId).map((r) => r.userId as string)),` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/useBrowseReviews.ts:183` | `const byId = new Map((pub ?? []).map((p: { id: string } & Record<string, unknown>) => [p.id, p]));` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/useBrowseReviews.ts:201` | `const courseIds = Array.from(new Set(pool.map((r) => r.courseId))).sort();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/useBrowseReviews.ts:216` | `const top100 = useMemo(() => new Set(Array.isArray(top100Query.data) ? top100Query.data : []), [top100Query.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/usePlayedRounds.ts:61` | `export const windowStartIso = (now = Date.now()) => new Date(now - ACTIVITY_WINDOW_DAYS * 86_400_000).toISOString();` | Safe: Date immediately becomes an ISO string before query/cache use. |
| `src/components/courses/browse/usePlayedRounds.ts:89` | `export const postCourseIds = (p: Pick<PlayedPostRow, 'course_id' &#124; 'tagged_course_ids'>) => Array.from(new Set([p.course_id, ...(p.tagged_course_ids ?? [])].filter((v): v is string => !!v)));` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/usePlayedRounds.ts:103` | `const ids = useMemo(() => Array.from(new Set([` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/usePlayedRounds.ts:108` | `const memberIds = useMemo(() => Array.from(new Set([` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/usePlayedRounds.ts:123` | `const faceMap = useMemo(() => new Map((Array.isArray(faces.data) ? faces.data : []).map((f) => [f.id, f])), [faces.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/usePlayedRounds.ts:124` | `const courseMap = useMemo(() => new Map((Array.isArray(courses.data) ? courses.data : []).map((c) => [c.id, c])), [courses.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/useFeaturedSignals.ts:22` | `const ids = <T,>(rows: unknown, pick: (r: T) => string &#124; null &#124; undefined) => Array.from(new Set((Array.isArray(rows) ? rows as T[] : []).map(pick).filter((v): v is string => !!v))).sort();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/useFeaturedSignals.ts:47` | `const out = new Set(following);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/useFeaturedSignals.ts:58` | `const playedIds = useMemo(() => new Set(Array.isArray(played.data) ? played.data : []), [played.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/useFeaturedSignals.ts:59` | `const reviewedIds = useMemo(() => new Set(Array.isArray(reviewed.data) ? reviewed.data : []), [reviewed.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/useFeaturedSignals.ts:60` | `const top100Ids = useMemo(() => new Set(Array.isArray(top100.data) ? top100.data : []), [top100.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/useFeaturedSignals.ts:61` | `const connectedIds = useMemo(() => new Set(Array.isArray(connected.data) ? connected.data : []), [connected.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/browse/useFeaturedSignals.ts:62` | `const likedIds = useMemo(() => new Set(Array.isArray(liked.data) ? liked.data : []), [liked.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/UserCoursesContent.tsx:96` | `const aDate = new Date(a.played_date &#124;&#124; a.created_at &#124;&#124; 0);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/components/courses/UserCoursesContent.tsx:97` | `const bDate = new Date(b.played_date &#124;&#124; b.created_at &#124;&#124; 0);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/overview/sections/useOverviewNewsData.ts:25` | `const rounds = new Map<string, number>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/overview/sections/useOverviewNewsData.ts:37` | `const tournamentIds = [...new Set(liveStories.flatMap(story => story.tournament_id ? [story.tournament_id] : []))].sort();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/overview/sections/useOverviewNewsData.ts:38` | `const playerIds = [...new Set(liveStories.flatMap(storyPlayerIds))].sort();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/overview/sections/useOverviewNewsData.ts:41` | `const followed = [...new Set(stories.flatMap(storyPlayerIds))].filter(id => follows.has(id)).sort();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/overview/sections/useOverviewNewsData.ts:48` | `const namesById = new Map((names.isError ? [] : names.data ?? []).map(player => [player.id, player.last_name &#124;&#124; player.full_name]));` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/overview/sections/useOverviewNewsData.ts:49` | `const result = new Map<string, NewsPresentation>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/news/useTourStories.ts:41` | `return new Date().toISOString();` | Safe: Date immediately becomes an ISO string before query/cache use. |
| `src/features/tourhub/news/newsPageData.ts:26` | `const data = useMemo(() => query.data == null ? undefined : new Map<string, string>(Array.isArray(query.data) ? query.data : []), [query.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/news/newsPageData.ts:75` | `.lte('published_at', new Date().toISOString())` | Safe: Date immediately becomes an ISO string before query/cache use. |
| `src/features/tourhub/news/StoryBody.tsx:561` | `const yearOf = new Map((seasons ?? []).map((s: any) => [s.id, s.year ?? 0]));` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/clubhouse-tour/TourSlot.tsx:53` | `const dateLabel = (date: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${date.slice(0,10)}T12:00:00Z`)).replace(',', '');` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/clubhouse-tour/TourSlot.tsx:54` | `const weekday = (date: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/London' }).format(new Date(`${date.slice(0,10)}T12:00:00Z`));` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/leaderboard/useBoardHoles.ts:28` | `const map = new Map<string, BoardHole[]>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:25` | `export const LIVE_STATUSES = new Set([` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:31` | `export const COMPLETED_STATUSES = new Set(['closed', 'complete', 'completed']);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:33` | `export function endDateInPast(endISO: string &#124; null, now = new Date()): boolean {` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:35` | `const today = new Date(now);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:37` | `const end = new Date(endISO);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:49` | `function withinWindow(startISO: string &#124; null, endISO: string &#124; null, now = new Date()): boolean {` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:51` | `const today = new Date(now);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:53` | `const start = new Date(startISO);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:54` | `const end = new Date(endISO);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:101` | `const HELD_STATUSES = new Set(['playoff', 'inplayoff', 'in_playoff', 'suspended', 'delayed', 'weather', 'holdup']);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:104` | `export function endedWithinDays(endISO: string &#124; null, days: number, now = new Date()): boolean {` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:106` | `const today = new Date(now); today.setHours(0, 0, 0, 0);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:107` | `const end = new Date(endISO); end.setHours(0, 0, 0, 0);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/components/overview-v3/useTournamentPulse.ts:117` | `export function pulseStateFor(row: Pick<PulseRow, 'start_date' &#124; 'end_date' &#124; 'status'>, now = new Date()): TournamentPulseState {` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/hooks/useTournamentsCache.ts:73` | `const today = new Date().toISOString().split('T')[0];` | Safe: Date immediately becomes an ISO string before query/cache use. |
| `src/hooks/useTournamentsCache.ts:78` | `const completedFromDate = new Date(` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/hooks/useTop100ProgressForUser.ts:120` | `const viewByListId = new Map<string, any>(` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:123` | `const viewBySlug = new Map<string, any>(` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:135` | `const playedCourseIds = new Set((userActivity &#124;&#124; []).map((a: any) => a.course_id));` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:164` | `const playedTop100Courses = new Set<string>(` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:170` | `const regionsWithProgress = new Set<string>();` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:180` | `new Set(` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:221` | `const currentYear = new Date().getFullYear();` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:242` | `const eighteenMonthsAgo = new Date();` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:263` | `const allCourseIds = new Set([` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:276` | `const courseMap = new Map((allCourses &#124;&#124; []).map(c => [c.id, c]));` | Safe: temporary lookup/count/date, plain result at :334; member-golf exclusion additionally prevents persistence. |
| `src/hooks/useTop100ProgressForUser.ts:299` | `played_at: activity.played_at &#124;&#124; new Date().toISOString(),` | Safe: Date immediately becomes an ISO string before query/cache use. |
| `src/hooks/useTop100ListSummaries.ts:62` | `const ratedCourseIds = new Set(userRatings.map(r => r.course_id));` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/hooks/useTop100CoursesData.tsx:58` | `const playedCourseIds = new Set(` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/explore-magazine/useTop100RankIndex.ts:68` | `const out: Top100RankIndex = new Map();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/explore-magazine/useTop100RankIndex.ts:91` | `const index = useMemo(() => query.data == null ? null : new Map<string, CourseRankStanding>(Array.isArray(query.data) ? query.data : []), [query.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useTournamentLeadersWinners.ts:109` | `const byTournament = new Map<string, TournamentFinisher[]>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/tournament-v2/data/usePickTeeTimes.ts:19` | `const ids = [...new Set(playerIds.filter(Boolean))].sort();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/tournament-v2/data/usePickTeeTimes.ts:32` | `const map = new Map<string, string>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/tournament-v2/data/usePickTeeTimes.ts:41` | `const data = useMemo(() => query.data == null ? undefined : new Map<string, string>(Array.isArray(query.data) ? query.data : []), [query.data]);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/tournament-v2/data/useDrawnRounds.ts:28` | `const set = new Set<number>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useTourHubData.ts:183` | `const currentYear = new Date().getFullYear();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useTourHubData.ts:502` | `const playerIds = [...new Set(stats.map(s => s.player_id))];` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useTourHubData.ts:515` | `const playerMap = new Map(players?.map(p => [p.id, p]) &#124;&#124; []);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useTourHubData.ts:767` | `const roundStats = new Map<number, { scores: number[]; birdies: number; eagles: number; bogeys: number; doubleBogeys: number; pars: number }>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useLiveTournaments.ts:40` | `const today = new Date();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useLiveTournaments.ts:61` | `const leaders = new Map<string, { name: string &#124; null; count: number; toPar: number &#124; null }>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useLiveTournaments.ts:75` | `const byTournament = new Map<string, BoardEntry[]>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/usePlayerState.ts:171` | `(r) => now - new Date(r.tournament_end_date).getTime() < twelveMonthsMs,` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/usePlayerState.ts:177` | `const endedAt = new Date(mostRecent.tournament_end_date).getTime();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/usePlayerState.ts:207` | `? formatMonthYearShort(new Date(mostRecent.tournament_end_date))` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useElitePlayers.ts:67` | `const seen = new Set<string>();` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/useElitePlayers.ts:88` | `const playerMap = new Map(players?.map(p => [p.id, p]) &#124;&#124; []);` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/usePlayerResults.ts:104` | `new Date(b.tournament_end_date).getTime() -` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/tourhub/hooks/usePlayerResults.ts:105` | `new Date(a.tournament_end_date).getTime()` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/hooks/useGolfCoursesInfinite.ts:44` | `const ratingsMap = new Map<string, number &#124; null>(` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/admin/hooks/useTourStoriesAdmin.ts:60` | `return new Date(s.published_at).getTime() > Date.now() ? 'scheduled' : 'published';` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |
| `src/features/admin/hooks/useTourStoriesAdmin.ts:107` | `.update({ ...patch, body_blocks: patch.body_blocks as any, updated_at: new Date().toISOString() })` | Safe: Date immediately becomes an ISO string before query/cache use. |
| `src/features/admin/hooks/useTourStoriesAdmin.ts:122` | `.update({ published_at: publishedAt, updated_at: new Date().toISOString() })` | Safe: Date immediately becomes an ISO string before query/cache use. |
| `src/hooks/useGolfCoursesSearch.ts:72` | `const ratingsMap = new Map<string, number>(` | Safe: local computation or consumer-only memo/ref; query returns arrays/plain objects, not this instance. |

### Indirect/factory and excluded hits
- `src/hooks/top100/useTop100Enrichment.ts:57,77,123,159,180,207,213`: converted cache; temporary Maps/Sets and previousRef stay outside persisted data.
- `src/lib/members/readMemberFaces.ts:36–56`: Map-returning helper; converted only the persisted played-faces adapter at usePlayedRounds:113. Other consumers retain shared helper API.
- `src/lib/queryPersister.ts:144,169`: diagnostic Set is module-local; root Map/Set payload guard is already present and unchanged.
- `src/components/courses/browse/WhoPlayingSection.tsx:128–131`: Set fallbacks are consumer-only; hook now always returns validated memoized Sets, so no presentation edit is required.
- `src/components/courses/useCourseRecordHolders.ts:113`: nested Maps returned, but root `course-record-holders` does NOT start with `courses`; not allowlisted, unchanged.
- `src/lib/whs/hooks.ts:420–423`: nested byFriendRowId Map under `whs_leaderboard_rank_deltas`, not allowlisted, unchanged.
- `src/components/explore-tab-new/courseled/hooks/useRoundNetScores.ts:50–62`, `useRoundHoleShapes.ts:158–179`, `useCourseCardMeta.ts:32`: Map results under gam-round-net / round-hole-shapes / courseled; excluded, unchanged.
- `src/hooks/gam/useWallLevels.ts:17–37`, `src/hooks/gam/useMyRoundsByCourse.ts:40`: Map results under gam; excluded.
- `src/hooks/top100/useTop100GolferBaseline.ts:20`: memoized Map from gam RPC plain rows; excluded root and safe consumer boundary.
- `src/components/profile/handicap/whs/connect/useHandicapWaitlist.ts:23–29`: Set under whs-handicap-waitlist (not a handicap prefix), excluded.
- `src/hooks/feed/usePostGolfTags.ts:17–20`, `usePostGolfContext.ts:83`, `usePostVideoDetails.ts:17–39`: Maps/nested Maps under post-golf-tags / post-golf-context / post-video-details-page, excluded.
- `src/hooks/feed/usePostCourseContext.ts:63`, post-round/comment-preview factory hooks: feedKeys roots start post-* / feed-* (not allowlisted media-feed/friends-feed), excluded.
- `src/hooks/useProTourCourses.ts:21–41`: Map under pro-tour-courses, excluded.
- `src/features/explore-magazine/watch/useWatchSignals.ts:27`: Map under video-progress, excluded.
- `src/features/tourhub/overview/sections/useOverviewNewsData.ts:25,48,49`: query reads return plain rows; Maps are presentation outputs under nonpersisted overview keys. tournaments-cache invalidation is not a producer.
- `src/features/tourhub/schedule-v2/useMergedSchedule.ts:100,248`: derived Set/Map only; schedule-v2 itself is excluded.
- AppPrefetch queryFns fetch plain base rows / course rows; prefetchedRoutes Set is a ref, not query data. Feed paging's seen Set immediately becomes an array; media-feed payload remains {posts,rawRowCount}. Feed/Watch sibling queryFns return RPC JSON arrays/objects, not class instances.

## Brief correction
The claimed direct root-Set restoration through the current persister is not reproducible via the normal current allowlist predicate: `queryPersister.ts:166–176` already refuses root Map/Set payloads. Direct `dehydrate` without that predicate can reproduce {}, and older cache payloads or nested Maps remain unsafe. Conversion is still needed to let these reads actually persist and to defensively handle legacy objects; the new regression explicitly uses shouldPersistQuery and verifies all ten new array payloads survive JSON serialization.

## Verification
- Focused command: `npx vitest run src/test/persistedCourseSignals.test.tsx src/test/featuredTop100Active.test.ts --maxWorkers=2`: **3/3**, two files.
- New case: “persists Featured signals and browse Top 100 as arrays, restores membership, and treats legacy objects as empty”. Also covers rank index, tee times and event names; uses dehydrate → JSON round-trip → hydrate, no reads before restored membership checks; {} returns empty Maps/Sets.
- Last fully passing baseline: **9,156**. Prior Latest reviews changed inventory by **+3** (four card tests replaced with seven); expected pre-request inventory **9,159**, expected after this one new case **9,160**. No tests deleted/renamed/rewritten for this request.
- Four sequential shards started using `npx vitest run --maxWorkers=2 --shard=N/4`; runner captures exit code before logging and stops immediately on any failure. **STOPPED after shard 2**: shard 1 **2,293 passed**, shard 2 **2,252 passed / 1 failed**. Executed total **4,546**, passing **4,545**; shards 3–4 not run. Full-suite total remains unmeasured (expected inventory 9,160). Failure is the unchanged cb69CourseNameLink case at :81:19 quoted below; no existing test edited.
- Preview harness latest build is OK; no manual build/typecheck was run, per environment instructions.
- Authenticated same-build Courses page reload unavailable: external unmanaged Supabase session. Hook cache restoration is verified; no claim of authenticated end-to-end/device acceptance.

## Previous reviews-suite failure discovered
The leftover previous runner incorrectly checked PIPESTATUS after echo, continuing after shard 2 failed. Stopped only its runner and current npm/Vitest processes; no broad process kill. Prior shard 1: 2,293 passed. Prior shard 2: 2,252 passed / 1 failed, 202 files; shards 3–4 are not accepted verification because the stop rule was already triggered.
Exact failure (left untouched):
```
FAIL src/test/cb69CourseNameLink.test.tsx > CB69 review course names open the course page > ReviewRailSlot: the name is a button that opens /courses/:id without the tile's tap
Error: Unable to fire a "click" event - please provide a DOM element.
❯ src/test/cb69CourseNameLink.test.tsx:81:19
fireEvent.click(c.querySelector('[data-review-rail-course]')!);
```
No assertion or component was changed to mask this prior unrelated failure.

## Final stop
Current run reproduces the exact prior cb69 failure quoted above: `Error: Unable to fire a "click" event - please provide a DOM element.` at `src/test/cb69CourseNameLink.test.tsx:81:19`. Stopped all further verification immediately, no isolated rerun or assertion repair. Focused restoration regression and Top 100 scoring passed 3/3 before shards. Current run logs: `/tmp/persisted-sets-suite/shard1.log`, `shard2.log`, `status.txt`. Preview harness build OK at 09:01:56 UTC; typecheck not run because the harness owns build/type verification and the suite stop precludes additional checks.

## Approved selector-only rerun — 2026-11-18
- Changed only `src/test/cb69CourseNameLink.test.tsx:81`: `[data-review-rail-course]` → `[data-review-course]`.
- Existing case: “ReviewRailSlot: the name is a button that opens /courses/:id without the tile's tap”. No test renamed/deleted, no assertion changed. Preserved `expect(c.querySelectorAll('button[data-course-name-link]')).toHaveLength(0)`, `expect(tile).toHaveBeenCalledTimes(1)`, and `expect(path).not.toBe('/courses/course-1')` exactly. Reason: explicitly approved selector repair following the magazine card's attribute rename.
- Test-file count before/after: **19 → 19**; file passed **19/19** in shard 2. Expected full-suite inventory before/after this request: **9,160 → 9,160** (zero delta). Last full pass remains 9,156; intervening +3 Latest reviews and +1 persistence regression were reconciled above.
- Commands, sequentially: `npx vitest run --maxWorkers=2 --shard=1/4`, then `--shard=2/4`, then `--shard=3/4`. Shard 4 was not started.
- Results: shard 1 **2,293/2,293**, shard 2 **2,253/2,253**, shard 3 **2,267 passed / 2 failed / 2,269 executed**. Total executed **6,815**, passed **6,813**, failed **2**; full-suite executed total remains unavailable because shard 4 was stopped.
- STOP: no source repair, other test edit, or further verification after these unexpected failures:
```
FAIL src/test/courseRatingConsistency.test.ts > C1 course rating consistency > routes every C3 display caller through the canonical helper
AssertionError: expected '/**\n * LATEST REVIEWS rails (LATEST_…' to contain 'courseSubScoreTone'
❯ src/test/courseRatingConsistency.test.ts:119:20
expect(file).toContain('courseSubScoreTone');

FAIL src/test/fixOverflowSource.test.ts > FIX_OVERFLOW_1 scoped source contracts > all non-test inline grids declare columns except the three wizard-owned files
AssertionError: expected [ Array(1) ] to deeply equal []
Received: ["src/components/courses/ReviewRailSlot.tsx: { position: 'relative', height: MOSAIC_H, display: 'grid', gap: 2, ...grid }"]
❯ src/test/fixOverflowSource.test.ts:66:24
expect(violations).toEqual([]);
```
- Preview harness: build OK at 2026-11-18T09:22:00Z. No manual build/typecheck. Logs retained in `/tmp/review-selector-suite/` (shard1.log, shard2.log, shard3.log, status.txt); runner recorded STOPPED at shard 3.

## Approved component contract repairs — complete, 2026-11-18
- `ReviewRailSlot.tsx`: imported courseSubScoreTone and used it for the category numbers, score disc, and written-card score. Replaced the mosaic grid object/spread with gridColumns/gridRows strings and explicit inline gridTemplateColumns/gridTemplateRows. No other component changes; no tests edited, deleted, renamed or rewritten.
- Focused command: `npx vitest run src/test/courseRatingConsistency.test.ts src/test/fixOverflowSource.test.ts src/test/coursesPageV5Sections.test.tsx src/test/whatsBeenPlayedV6.test.tsx src/test/cb69CourseNameLink.test.tsx src/test/reviewMentionsPreview.test.tsx --maxWorkers=2`: **74/74**, six files.
- Sequential full-suite commands: `npx vitest run --maxWorkers=2 --shard=1/4`, then `--shard=2/4`, then `--shard=3/4`, then `--shard=4/4`. All completed with exit 0, no failures or unhandled-error summary.
- Shards: **2,293 / 2,253 / 2,269 / 2,345 = 9,160 passed / 9,160 executed**, **807 files**. Inventory before/after this request **9,160 → 9,160**, zero delta. Against last full pass 9,156: +3 Latest reviews cases and +1 persistedCourseSignals regression, as reconciled above. This run resolves both prior shard stops without changing their tests.
- Harness build OK at 2026-11-18T09:47:10Z; no manual build/typecheck. Logs retained at `/tmp/review-contract-suite/` including focused.log, shard1–4.log and COMPLETE status.
- No SQL, migrations, feed_config, round_pool_cap, query contracts or unrelated font/branding changes. Authenticated browser/device checks remain unavailable and are not claimed by this test-only verification closeout.
