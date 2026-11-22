# Shared headings and weights above 700

Read-only source audit. No project files changed; no builds or tests run.

## Scope and counting

Canon supplied by task (takes precedence over “canonical” comments in source): **eyebrow 11px / 700 / 0.16em / line-height 1 / ink; title and sheet title 21px / 700 / -0.035em / line-height 1.05 / ink**. Values below are size / weight / tracking / line-height / colour. `inherit` means not explicitly set, **not** a match to the canon. Ink means the surface’s main content ink; muted/quiet/accent colours are not ink.

Consumer counts are unique non-test source files directly importing the module, resolving relative paths and `@/` aliases; not JSX instance counts and not transitive importers. Modules containing tokens or multiple exports have module-wide counts (including imports of other exports). Export lists include public types/constants for clarity. Additional source evidence below disambiguates compound components and conditional roles.

Weight inventory counts declaration/class-token occurrences, **not lines**: multiple declarations on a minified CSS line receive separate rows. Includes shared constants, conditional branches, CSS/template rules, and font shorthand; declarations are listed even when a later selector/inline override may suppress them. Comments and non-typographic numeric uses are excluded. Test scope is exactly `src/test/**` and `*.test.*`.

## (a) Shared heading components and tokens

| File | Exported names | Current eyebrow/title metrics | Versus supplied canon | Direct module consumers |
|---|---|---|---|---|
| `src/components/ui/SectionHeader.tsx` | SectionHeader, default | E 11/700/.14em/inherit; prime amber A.AMBER, section A.MUTE (dark --hcp-t-60); accent/tone override. T prime 26, section 20 /700/-.02em/1.15/A.INK (dark --hcp-t-100); rail 19/700/-.01em/inherit/same ink. | E tracking, LH, colour differ; all T sizes/tracking/LH differ. | 15 |
| `src/components/ui/SheetHeader.tsx` | SheetHeader, default | E 9/700/.19em/inherit/#64748B (dark rgba white .55). T 17/700/-.032em/1.15/#0F172A (dark rgba white .96). | E size/tracking/LH/colour differ; T size/tracking/LH differ. | 7 — `src/components/moderation/ReportSheet.tsx`, `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx`, `src/components/profile/handicap/whs/sections/recently-played/FriendsRoundsSheet.tsx`, `src/features/tourhub/components/TourPickerSheet.tsx`, `src/pages/messaging-v2/ConversationRow.tsx`, `src/pages/messaging-v2/ConversationSettingsSheet.tsx`, `src/pages/messaging-v2/NewConversationSheet.tsx` |
| `src/components/friend-sheet/parts/SheetHeader.tsx` | SheetHeaderProps, SheetHeader | No E. T name 17/700/-.032em/1.05/T100 (from shared friend tokens). | T size/tracking differ; dark surface ink. | 1 — `src/components/friend-sheet/FriendSheet.tsx` |
| `src/components/watch/proshop/Kicker.tsx` | Kicker | E 9/700/.16em/inherit/#64748B default; amber #0E1216, emerald #006747, light rgba(255,255,255,.55). No T. | E size/LH/default colour differ. | 0 |
| `src/components/ui/DiscoverSectionHeading.tsx` | DiscoverSectionHeading | No E. T 16/700/-.01em/1.2/A.INK. | T size/tracking/LH differ. | 7 — `src/components/courses/ReviewFeaturedSlot.tsx`, `src/components/courses/course-detail/about/AboutSection.tsx`, `src/components/explore-tab-new/GalleryTab.tsx`, `src/components/explore-tab-new/NewsTabPage.tsx`, `src/components/explore-tab-new/courseled/CoursesPlayedSeeAllSheet.tsx`, `src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx`, `src/features/tourhub/news/StoryShapes.tsx` |
| `src/components/explore-tab-new/courseled/tokens.tsx` | INK, DISCOVER_FACT, DISCOVER_QUIET, KICKER, LABEL, GOLD, COMPETITION, PODIUM_ACCENT, PODIUM_GROUND, RHYTHM, ACT_GAP, HEAD_GAP, CARD_GAP, RAIL_GAP, CHIP_GAP, MOSAIC_GAP, PAGE_GUTTER, CARD_RADIUS, WELL_RADIUS, THUMBNAIL_RADIUS, CHIP_RADIUS, NUMF, CARD_SHELL, NewDot, NEW_CARD_RING, NEW_ROW_BAR, SECTION_TITLE, EYEBROW_TEXT, Eyebrow, Aside, InkAction, ImageChip, SELF_ROW_TINT, INDEX_CUT_BORDER, A, SANS, FIGS | KICKER 11/700/.16em/inherit/DISCOVER_QUIET; EYEBROW_TEXT and Eyebrow 11/700/.16em/1/DISCOVER_QUIET rgba(255,255,255,.70). SECTION_TITLE 17/700/-.02em/1.2/same quiet colour. | Eyebrow metrics match, colour is quiet rather than ink. T size/tracking/LH/colour differ. | 56 |
| `src/features/tourhub/overview/sections/OverviewSectionHead.tsx` | OverviewSectionHead | No E. T 20/800/0/1.2/INK. | T size/weight/tracking/LH differ. | 4 — `src/features/tourhub/overview/sections/AlsoThisWeek.tsx`, `src/features/tourhub/overview/sections/ComingUp.tsx`, `src/features/tourhub/overview/sections/OverviewNews.tsx`, `src/features/tourhub/overview/sections/WorldRankings.tsx` |
| `src/features/tourhub/tournament-v2/sections/SectionEyebrow.tsx` | SectionEyebrow | E 11/700/.16em/inherit/A.INK; CJK tracking 0 and no uppercase. No T. | LH not explicitly 1; CJK tracking differs. | 6 — `src/features/tourhub/tournament-v2/sections/ContestSection.tsx`, `src/features/tourhub/tournament-v2/sections/EventInfoSection.tsx`, `src/features/tourhub/tournament-v2/sections/MomentsSection.tsx`, `src/features/tourhub/tournament-v2/sections/MoveSection.tsx`, `src/features/tourhub/tournament-v2/sections/StorySection.tsx`, `src/features/tourhub/tournament-v2/sections/TeeTimesRail.tsx` |
| `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx` | Parts, SectionHead, TournamentHero, RaceSection, FieldSection, LastYearSection, CourseV3Section, NumbersSection, TeeV3Section | SectionHead h2 via .tv-head h2: 11/800/.16em/inherit/inherited tournament ink; aside 10.5/800/.12em/inherit/--tv-mute. | Despite h2 semantic tag, eyebrow-sized treatment: weight/LH differ from E; size/weight/tracking/LH differ from T. | 1 — `src/features/tourhub/tournament-v2/TournamentPage.tsx` |
| `src/features/search-v2/components/SearchSectionHeader.tsx` | SearchSectionHeader, ACTION | E 11/700/.19em/inherit/A.INK (lib KICKER size override). No T. | E tracking/LH differ. | 2 — `src/features/search-v2/SearchOverlayV2.tsx`, `src/features/search-v2/components/RecentsList.tsx` |
| `src/features/tourhub/news/NewsTab.tsx` | LeadStory, StoryRow, NewsTab | Local KickerLine delegates StoryImageKicker with INK: 9 or compact 9.5/700/.16em/1.2/INK. LeadStory uses StoryImageHeadline: 20 default or feed/compact 19 /700/-.015em (feed/compact -.02em)/1.15/INK. StoryRow T 14.5 or compact 13.5/700/-.01em/1.25/INK. Additional CSS heads listed below. | E size/LH differ; T size/tracking/LH differ. | 5 — `src/features/admin/components/amateur/AmateurStoryEditor.tsx`, `src/features/admin/components/wire/WireStoryEditor.tsx`, `src/features/amateur/AmateurNewsBlock.tsx`, `src/features/tourhub/news/WireNewsPage.tsx`, `src/features/tourhub/pages/TourHubMainPage.tsx` |
| `src/features/tourhub/news/StoryImageText.tsx` | StoryImageKicker, StoryRelativeTime, StoryImageHeadline | StoryImageKicker E 9 (compact 9.5)/700/.16em/1.2/INK_SOFT default, caller color override. StoryImageHeadline T 20 (feed/compact 19)/700/-.015em (feed/compact -.02em)/1.15/INK. | E size/LH/default colour differ; T size/tracking/LH differ. | 1 — `src/features/tourhub/news/NewsTab.tsx` |
| `src/components/business/home/BusinessWeekCard.tsx` | W, SubKind, subKind, HeadlineBranch, headlineBranch, daysSince, Bar, barShapes, TapKey, visibleTaps, BusinessWeekSkeleton, BusinessWeekError, BusinessWeekView, BusinessWeekCard | Local Kicker E 10.5/800/.16em/inherit/W.mute; right Last 7 days .12em/W.dim. headStyle T 18/700/-.015em/1.28/W.ink. | E size/weight/LH/colour differ; T size/tracking/LH differ. | 1 — `src/components/business/home/BusinessHomeSections.tsx` |
| `src/components/business/insights/InsightsAudienceSection.tsx` | InsightsAudienceSection | Local Kicker via .insights-visits-kicker: 10.5/800/.16em/inherit/var(--team-muted). | E size/weight/LH/colour differ. | 1 — `src/pages/BusinessInsightsPageV2.tsx` |
| `src/components/business/home/BusinessHomeHeader.tsx` | H, businessColour, businessInitials, shortBusinessName, ROLE_LINE, BusinessSwitcher, BusinessHomeHeader, BusinessHomeHeaderSkeleton | Compound business masthead, not a single E/T primitive; inspect exact source metrics below. Logo initials use 800 (not heading). | Multiple roles; do not mistake logo weight for section title. | 5 — `src/components/business/TeamListSection.tsx`, `src/components/business/TeamSummary.tsx`, `src/components/business/home/BusinessDoNextCard.tsx`, `src/pages/BusinessInvitePage.tsx`, `src/pages/MyBusinessesPage.tsx` |
| `src/features/courses/components/holes/analytical/tokens.tsx` | TOPAR_RED, A, SUB_SCORE_GREEN_MIN, courseSubScoreTone, BAR_RADIUS, RAMP, RAMP_TOPAR, RAMP_DIST, DIFFICULTY_RAMP, DIFFICULTY_HARD_HEX, DIFFICULTY_EASY_HEX, difficultyRampStop, difficultyRampColor, rampInk, SANS, FIGS, NUM, LABEL, KICKER, CAPTION, Hairline, TITLE, ToParParts, toParParts, Panel, StatItem, StatRow, Action, EmptyState, BIZ_KICKER, BIZ_LABEL, BIZ_TITLE, BIZ_BODY, bizFigure, BIZ_INSET, BIZ_TRACK_H | KICKER E 11/700/.16em/inherit/A.INK. TITLE T 13/700/inherit/inherit/A.INK. Panel renders kicker OR title, not both. | E LH unspecified; T size/tracking/LH differ. | 334 |
| `src/lib/tokens/type.ts` | KICKER, LABEL, TITLE, BODY, FIGURE, FIGS, DISPLAY_TRACKING, SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP | KICKER E 9/700/.19em/inherit/no colour (caller). TITLE T 17/700/-.032em/1.2/no colour (caller). | E size/tracking/LH differ; T size/tracking/LH differ; caller must provide ink. | 54 |
| `src/components/courses/browse/SectionHead.tsx` | SectionHeadProps, HEAD_KICKER_SIZE, HEAD_TITLE_SIZE, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_GAP, SectionHead, HEAD_GAP, SECTION_WRAP | E 11/700/.16em/1/A.INK. T 21/700/-.035em/1.05/A.INK. | MATCH both roles. | 11 |
| `src/components/friend-sheet/parts/_shared/Eyebrow.tsx` | Eyebrow | E 10.5/700/.16em/inherit/T60. No T. | E size/LH/colour differ. | 3 — `src/components/friend-sheet/parts/HeadToHeadCard.tsx`, `src/components/friend-sheet/parts/LatestPostCard.tsx`, `src/components/friend-sheet/parts/TheirFormSection.tsx` |
| `src/features/tourhub/overview/sections/SectionShell.tsx` | SectionShell, V4Card | E 11/700/.16em/inherit/eyebrowColor or rgba(255,255,255,.62). Optional companion text 13/700/-.005em/1.35/V4.ink. | E LH/colour differ; companion is not canon T. | 1 — `src/features/tourhub/overview/sections/OnTheCourse.tsx` |
| `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx` | DARK_ROW_TITLE, Verdict, verdictForDelta, DarkSectionHeaderProps, DarkSectionHeader, DarkCardProps, DarkCard, KPICellProps, KPICell, TripleStrip, VerdictNumberProps, VerdictNumber, VerdictPillProps, VerdictPill, LiveStatusProps, LiveStatus | DarkSectionHeader delegates ui SectionHeader: section role, dark surface (E 11/700/.14em/inherit/--hcp-t-60; T 20/700/-.02em/1.15/--hcp-t-100). | Same section-role deviations as ui SectionHeader. | 3 — `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx`, `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx`, `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx` |
| `src/components/profile/handicap/whs/sections/course-legends/_shared/CourseEyebrow.tsx` | CourseEyebrow, default | E 11.5/700/.16em/1.2/onPhoto #FFFFFF else var(--hcp-t-100). | E size/LH differ; surface ink variant. | 1 — `src/components/profile/handicap/whs/sections/course-legends/drilldown/DrilldownHeader.tsx` |
| `src/components/ui/sheet.tsx` | Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger | SheetTitle primitive: text-lg font-semibold text-foreground => 18/600/inherit/28px/foreground by standard Tailwind defaults; className may override. | T size/weight/tracking/LH differ; theme foreground is surface ink. | 14 |

### Additional shared heads and exact source evidence

This catalogue also includes compound mastheads and local reusable helpers found by name search; these are not all interchangeable section headings. Metrics and conditional expressions are quoted exactly so inherited/unset properties are not silently invented. For an additional helper, any of the five canon properties absent in the quoted declaration is inherited/caller-controlled and is not guaranteed to match canon. Delegating wrappers retain the called component’s treatment. CSS rules referenced by class are collected after this catalogue.


#### `src/components/business/home/BusinessHomeHeader.tsx`
Exports: H, businessColour, businessInitials, shortBusinessName, ROLE_LINE, BusinessSwitcher, BusinessHomeHeader, BusinessHomeHeaderSkeleton. Direct module consumers: 5 — `src/components/business/TeamListSection.tsx`, `src/components/business/TeamSummary.tsx`, `src/components/business/home/BusinessDoNextCard.tsx`, `src/pages/BusinessInvitePage.tsx`, `src/pages/MyBusinessesPage.tsx`.

```tsx
…
33: 
34: /* Literal mock values. */
35: export const H = {
36:   ink: '#F8FAFC',
37:   mute: 'rgba(248,250,252,0.62)',
38:   dim: 'rgba(248,250,252,0.42)',
…
56:   'linear-gradient(140deg,#4a3a1f,#8a7a3c)',
57: ];
58: export function businessColour(id: string): string {
59:   let h = 0;
60:   for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
61:   return GRADIENTS[h % GRADIENTS.length];
62: }
63: export function businessInitials(name: string): string {
64:   return getInitialsFromName(name);
65: }
66: /**
…
70:  * button falls back to a bare "Post".
71:  */
72: export function shortBusinessName(name: string): string | null {
73:   const words = name.trim().split(/\s+/);
74:   const punctOnly = (w: string) => !/[\p{L}\p{N}]/u.test(w);
75:   while (words.length > 1 && words.join(' ').length > 14) {
…
81: }
82: 
83: export const ROLE_LINE: Record<BusinessMembership['role'], string> = {
84:   owner: "You're the owner",
85:   admin: "You're an admin",
86:   editor: "You're an editor",
…
90: type Biz = BusinessMembership['business'];
91: 
92: function Logo({ business, size, radius, fontSize }: { business: Biz; size: number; radius: number; fontSize: number }) {
93:   return (
94:     <div
95:       data-business-logo=""
…
99:         background: business.logo_url ? '#1a1a1f' : businessColour(business.id),
100:         border: size >= 60 ? `1px solid ${H.line}` : undefined,
101:         fontSize, fontWeight: 800, color: '#fff',
102:       }}
103:     >
104:       {business.logo_url
…
111: /* ─────────────────────── switcher ─────────────────────── */
112: 
113: export function BusinessSwitcher({
114:   memberships, selectedId, onSelect, onAdd,
115: }: { memberships: BusinessMembership[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void }) {
116:   return (
…
133:               gap: 7, height: 36, padding: '0 12px 0 5px', borderRadius: 18,
134:               border: `1px solid ${on ? H.chipOn : H.line}`, background: 'transparent',
135:               color: on ? H.ink : H.mute, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
136:             }}
137:           >
138:             <Logo business={m.business} size={26} radius={9} fontSize={10} />
139:             {m.business.name}
140:           </button>
141:         );
…
148:         style={{
149:           gap: 4, height: 36, padding: '0 12px', borderRadius: 18, border: `1px solid ${H.line}`,
150:           background: 'transparent', color: H.mute, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
151:         }}
152:       >
153:         <Plus style={{ width: 16, height: 16 }} strokeWidth={1.9} />
…
176:       }}
177:     >
178:       <span className="flex shrink-0" style={{ color: H.mute }}><Icon style={{ width: 16, height: 16 }} strokeWidth={1.9} /></span>
179:       <div className="flex-1 min-w-0">
180:         <b className="block" style={{ fontSize: 13.5, fontWeight: 700, color: H.ink }}>{title}</b>
181:         <span className="block" style={{ marginTop: 2, fontSize: 12, lineHeight: 1.35, color: H.mute }}>{sub}</span>
182:       </div>
183:       {action && (
184:         <button
…
189:           style={{
190:             height: 30, padding: '0 13px', borderRadius: 15, border: `1px solid ${H.btnHair}`,
191:             background: H.actFill, color: H.ink, fontSize: 12.5, fontWeight: 700,
192:           }}
193:         >
194:           {action}
…
243: /* ─────────────────────── header ─────────────────────── */
244: 
245: export function BusinessHomeHeader({
246:   membership, userId, onRequestDelete,
247: }: { membership: BusinessMembership; userId: string; onRequestDelete: (input: { id: string; name: string }) => void }) {
248:   const navigate = useNavigate();
…
258: 
259:   const btn: React.CSSProperties = {
260:     flex: 1, height: 44, borderRadius: 14, gap: 7, fontSize: 14, fontWeight: 700,
261:   };
262:   const menuItem: React.CSSProperties = { height: 44, padding: '0 14px', gap: 10, fontSize: 14, fontWeight: 600 };
263: 
264:   return (
265:     <div data-business-header="" data-role={role}>
266:       <div style={{ padding: '16px 16px 0' }}>
267:         <div className="flex items-center" style={{ gap: 14 }}>
268:           <Logo business={business} size={60} radius={18} fontSize={20} />
269:           <div className="min-w-0 flex-1">
270:             <div className="flex items-center" style={{ gap: 7, fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', color: H.ink, lineHeight: 1.2 }}>
271:               <span className="truncate">{business.name}</span>
272:               {business.is_verified && <span data-verified-badge="" className="inline-flex shrink-0"><VerifiedBadge size="sm" className="!w-[17px] !h-[17px]" /></span>}
273:             </div>
274:             {subline && <div data-subline="" style={{ marginTop: 3, fontSize: 13, color: H.mute }}>{subline}</div>}
275:             <div data-role-line="" style={{ marginTop: 2, fontSize: 12, color: H.dim }}>{ROLE_LINE[role]}</div>
276:           </div>
277:           {canManage && (
278:             <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
279:               <DropdownMenuTrigger asChild>
280:                 <button type="button" aria-label="More options" data-header-menu="" className="self-start shrink-0 flex items-center justify-center" style={{ minWidth: 40, minHeight: 40, marginTop: -6, marginRight: -10, color: H.mute, background: 'transparent', border: 'none' }}>
281:                   <MoreHorizontal style={{ width: 16, height: 16 }} strokeWidth={1.9} />
282:                 </button>
283:               </DropdownMenuTrigger>
…
286:                   data-menu-item="share"
287:                   className="cursor-pointer rounded-none"
288:                   style={{ ...menuItem, color: H.ink }}
289:                   onClick={() => shareBusinessProfile({ businessId: business.id, name: business.name, url: businessProfileShareUrl(slugOrId), userId })}
290:                 >
291:                   <Share style={{ width: 16, height: 16 }} strokeWidth={1.9} />Share profile
…
295:                     data-menu-item="delete"
296:                     className="cursor-pointer rounded-none"
297:                     style={{ ...menuItem, color: H.danger, borderTop: `1px solid ${H.hair}` }}
298:                     onClick={() => {
299:                       // Close the menu before the hoisted dialog opens (Radix layer race).
300:                       setMenuOpen(false);
…
316:               onClick={() => usePostStudioStore.getState().openPostStudio({ actorType: 'business', actorId: business.id })}
317:               className="flex items-center justify-center min-w-0"
318:               style={{ ...btn, background: H.ink, color: H.onInk, border: 'none' }}
319:             >
320:               <Plus className="shrink-0" style={{ width: 16, height: 16 }} strokeWidth={1.9} />
321:               <span className="truncate">{(() => { const s = shortBusinessName(business.name); return s ? `Post as ${s}` : 'Post'; })()}</span>
…
327:             onClick={() => navigate(`/business/${slugOrId}`)}
328:             className="flex items-center justify-center"
329:             style={{ ...btn, background: 'transparent', border: `1px solid ${H.btnHair}`, color: H.ink }}
330:           >
331:             <Eye className="shrink-0" style={{ width: 16, height: 16 }} strokeWidth={1.9} />
332:             View profile
…
341: /* ─────────────────────── loading ─────────────────────── */
342: 
343: export function BusinessHomeHeaderSkeleton() {
344:   const sk = { background: 'rgba(255,255,255,0.06)', borderRadius: 8 } as const;
345:   return (
346:     <div data-business-header-skeleton="">
```

#### `src/components/business/home/BusinessWeekCard.tsx`
Exports: W, SubKind, subKind, HeadlineBranch, headlineBranch, daysSince, Bar, barShapes, TapKey, visibleTaps, BusinessWeekSkeleton, BusinessWeekError, BusinessWeekView, BusinessWeekCard. Direct module consumers: 1 — `src/components/business/home/BusinessHomeSections.tsx`.

```tsx
…
11: import { formatNumber } from '@/i18n/format';
12: 
13: export const W = {
14:   card: '#17171B',
15:   line: 'rgba(255,255,255,0.08)',
16:   hair: 'rgba(255,255,255,0.06)',
…
31: // ── Pure rules (exported for tests) ──────────────────────────────────────
32: 
33: export type SubKind = 'first' | 'zero' | 'up' | 'down' | 'same';
34: export function subKind(cur: number, prev: number, firstWeek: boolean): SubKind {
35:   if (firstWeek) return 'first';
36:   if (cur === 0) return 'zero';
37:   if (cur > prev) return 'up';
…
40: }
41: 
42: export type HeadlineBranch = 'first_week' | 'visits' | 'seen' | 'quiet';
43: export function headlineBranch(w: BusinessWeek): HeadlineBranch {
44:   if (w.first_week) return 'first_week';
45:   if (w.visits > 0) return 'visits';
46:   if (w.seen_by > 0) return 'seen';
…
49: 
50: /** Whole days since the last post; null when never posted. */
51: export function daysSince(lastPostAt: string | null, now = Date.now()): number | null {
52:   if (!lastPostAt) return null;
53:   return Math.max(0, Math.floor((now - new Date(lastPostAt).getTime()) / DAY));
54: }
55: 
56: export type Bar = { kind: 'stub' } | { kind: 'bar'; pct: number; latest: boolean };
57: export function barShapes(values: number[]): Bar[] {
58:   const vals = Array.from({ length: 7 }, (_, i) => Math.max(0, values?.[i] ?? 0));
59:   const max = Math.max(...vals);
60:   return vals.map((v, i) => (v === 0 || max === 0 ? { kind: 'stub' } : { kind: 'bar', pct: (v / max) * 100, latest: i === 6 }));
61: }
62: 
63: export type TapKey = 'website' | 'directions' | 'call' | 'message';
64: export function visibleTaps(taps: BusinessWeek['taps'] | undefined): { key: TapKey; count: number }[] {
65:   const order: TapKey[] = ['website', 'directions', 'call', 'message'];
66:   return order.map((key) => ({ key, count: taps?.[key] ?? 0 })).filter((x) => x.count > 0);
67: }
…
73: };
74: const kickerStyle: CSSProperties = {
75:   display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em',
76:   textTransform: 'uppercase', color: W.mute,
77: };
78: const headStyle: CSSProperties = { marginTop: 8, fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.28, color: W.ink };
79: const paraStyle: CSSProperties = { marginTop: 4, fontSize: 13, lineHeight: 1.45, color: W.mute };
80: const figsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 16 };
81: const labelStyle: CSSProperties = { fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: W.dim };
82: const figStyle: CSSProperties = {
83:   marginTop: 4, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: W.ink, fontVariantNumeric: 'tabular-nums',
84: };
85: const subStyle: CSSProperties = { marginTop: 5, fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: W.dim };
86: const sparkStyle: CSSProperties = { marginTop: 9, display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 };
87: const skStyle: CSSProperties = { background: W.sk, borderRadius: 6 };
88: 
89: // ── Pieces ───────────────────────────────────────────────────────────────
90: 
91: function Kicker() {
92:   const { t } = useTranslation();
93:   return (
94:     <div data-week-kicker="" style={kickerStyle}>
95:       <span>{t('business.week.kicker', { defaultValue: 'This week' })}</span>
96:       <span style={{ color: W.dim, letterSpacing: '0.12em' }}>{t('business.week.window', { defaultValue: 'Last 7 days' })}</span>
97:     </div>
98:   );
99: }
…
118:       style={{
119:         marginTop: 14, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
120:         fontSize: 13.5, fontWeight: 600, color: W.ink, background: 'none', border: 'none', padding: 0, textAlign: 'left',
121:       }}
122:     >
123:       {t('business.week.fullInsights', { defaultValue: 'Full insights' })}
124:       <span aria-hidden style={{ color: W.mute }}>›</span>
125:     </button>
126:   );
127: }
…
145:   const kind = subKind(cur, prev, first);
146:   let text: string;
147:   let color: string = W.dim;
148:   if (kind === 'first') text = t('business.week.sub.firstWeek', { defaultValue: 'first week' });
149:   else if (kind === 'zero') text = t('business.week.sub.lastWeek', { defaultValue: '{{value}} last week', value: n(prev) });
150:   else if (kind === 'up') { text = `↑ ${n(cur - prev)}`; color = W.green; }
…
154: }
155: 
156: function Headline({ w, name }: { w: BusinessWeek; name: string }) {
157:   const { t } = useTranslation();
158:   const branch = headlineBranch(w);
159:   let head: ReactNode;
…
169:     } else {
170:       const delta = diff > 0
171:         ? <span data-week-head-delta="up" style={{ color: W.green }}>{t('business.week.head.more', { defaultValue: '{{value}} more', value: n(diff) })}</span>
172:         : <span data-week-head-delta="down">{t('business.week.head.fewer', { defaultValue: '{{value}} fewer', value: n(-diff) })}</span>;
173:       head = <>{lead}{delta}{t('business.week.head.thanLastWeek', { defaultValue: ' than last week.' })}</>;
174:     }
…
216:       style={{
217:         marginTop: 14, paddingTop: 12, borderTop: `1px solid ${W.hair}`, display: 'flex', flexWrap: 'wrap',
218:         gap: '6px 14px', fontSize: 12.5, color: W.mute,
219:       }}
220:     >
221:       {items.map(({ key, count }) => (
222:         <span key={key} data-tap={key}>
223:           <b style={{ color: W.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{n(count)}</b> {word(key, count)}
224:         </span>
225:       ))}
226:     </div>
…
230: // ── States ───────────────────────────────────────────────────────────────
231: 
232: export function BusinessWeekSkeleton({ businessId }: { businessId: string }) {
233:   const labels = Labels();
234:   return (
235:     <section data-business-week="loading" aria-busy="true" style={cardStyle}>
…
251: }
252: 
253: export function BusinessWeekError({ onRetry }: { onRetry: () => void }) {
254:   const { t } = useTranslation();
255:   return (
256:     <section data-business-week="error" style={cardStyle}>
…
265:           style={{
266:             display: 'inline-flex', alignItems: 'center', height: 30, padding: '0 13px', borderRadius: 15,
267:             border: `1px solid ${W.btnHair}`, background: W.btnFill, color: W.ink, fontSize: 12.5, fontWeight: 700,
268:           }}
269:         >
270:           {t('business.week.error.retry', { defaultValue: 'Try again' })}
…
275: }
276: 
277: export function BusinessWeekView({ week, businessId, name }: { week: BusinessWeek; businessId: string; name: string }) {
278:   const { t } = useTranslation();
279:   const labels = Labels();
280:   const total = t('business.week.sub.total', { defaultValue: '{{value}} in total', value: n(week.followers_total) });
…
282:     <section data-business-week="ready" style={cardStyle}>
283:       <Kicker />
284:       <Headline w={week} name={name} />
285:       <div style={figsStyle}>
286:         <div data-week-fig="visits">
287:           <div style={labelStyle}>{labels[0]}</div>
…
309: }
310: 
311: export function BusinessWeekCard({ businessId, name }: { businessId: string; name: string }) {
312:   const { data, isLoading, isError, refetch } = useBusinessWeek(businessId);
313:   if (isError) return <BusinessWeekError onRetry={() => { void refetch(); }} />;
314:   if (isLoading || !data) return <BusinessWeekSkeleton businessId={businessId} />;
```

#### `src/components/business/insights/InsightsAudienceSection.tsx`
Exports: InsightsAudienceSection. Direct module consumers: 1 — `src/pages/BusinessInsightsPageV2.tsx`.

```tsx
…
1: /**
2:  * CB84 — Insights section 3 "Your golfers". Replaces the permanently locked
3:  * "Who's viewing you" card. Draws nothing until the read settles; a failed
4:  * read draws no card. The server owns every privacy merge — bands and regions
5:  * render exactly as returned, in the returned order, and the card ignores the
6:  * 7/30/90 picker. Styled as sections 1–2 (insights-visits-card family).
7:  */
8: import { useTranslation } from 'react-i18next';
9: import { formatNumber } from '@/i18n/format';
10: import {
11:   useBusinessAudience, bandLabel, largestBand, formatMedian, type BusinessAudience,
12: } from '@/hooks/useBusinessAudience';
13: 
14: const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
15: 
16: const BarRow = ({ label, count, max, elsewhere = false, dataAttr }: {
17:   label: string; count: number; max: number; elsewhere?: boolean; dataAttr: Record<string, string | number>;
18: }) => (
19:   <div className="insights-audience-row" data-elsewhere={elsewhere || undefined} {...dataAttr}>
20:     <span>{label}</span>
21:     <div className="insights-audience-track">
22:       <i style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }} />
23:     </div>
24:     <span className="insights-audience-value">{formatNumber(count)}</span>
25:   </div>
26: );
27: 
28: const Kicker = ({ left, right }: { left: string; right?: string }) => (
29:   <div className="insights-visits-kicker"><span>{left}</span>{right !== undefined && <span>{right}</span>}</div>
30: );
31: 
32: const ReadyCard = ({ a, k }: { a: BusinessAudience; k: (key: string, o?: Record<string, unknown>) => string }) => {
33:   const best = largestBand(a.bands);
34:   const oneBand = a.bands.length === 1 || !best;
35:   const title = oneBand
36:     ? k('titleOneBand', { count: a.with_handicap, n: formatNumber(a.with_handicap) })
37:     : k('titleMost', { band: lowerFirst(bandLabel(best.from, best.to)) });
38:   const bandMax = Math.max(1, ...a.bands.map(b => b.count));
39:   const regionRows: { region: string; count: number; elsewhere: boolean }[] = [
40:     ...a.regions.map(r => ({ ...r, elsewhere: false })),
41:     ...(a.elsewhere ? [{ region: k('elsewhere'), count: a.elsewhere, elsewhere: true }] : []),
42:   ];
43:   const regionMax = Math.max(1, ...regionRows.map(r => r.count));
44:   return (
45:     <>
46:       <h3 className="insights-audience-title" data-title={oneBand ? 'one-band' : 'most'} data-band={oneBand || !best ? undefined : bandLabel(best.from, best.to)}>{title}</h3>
47:       <div className="insights-audience-tiles">
48:         <div className="insights-audience-tile" data-tile="handicap" data-value={a.with_handicap}>
49:           <div className="n">{formatNumber(a.with_handicap)}</div>
50:           <div className="l">{k('tileHandicap')}</div>
51:         </div>
52:         <div className="insights-audience-tile" data-tile="median" data-value={a.median ?? undefined}>
53:           <div className="n">{a.median == null ? '–' : formatMedian(a.median)}</div>
54:           <div className="l">{k('tileMedian', { n: formatNumber(a.with_handicap) })}</div>
55:         </div>
56:       </div>
57:       <div className="insights-visits-kicker insights-audience-sub"><span>{k('handicapsKicker')}</span></div>
58:       <div className="insights-audience-rows" data-rows="bands">
59:         {a.bands.map(b => (
60:           <BarRow key={`${b.from}-${b.to}`} label={bandLabel(b.from, b.to)} count={b.count} max={bandMax}
61:             dataAttr={{ 'data-band': `${b.from}-${b.to}`, 'data-count': b.count }} />
62:         ))}
63:       </div>
64:       {a.elsewhere != null && (
65:         <>
66:           <div className="insights-visits-kicker insights-audience-sub"><span>{k('regionsKicker')}</span></div>
67:           <div className="insights-audience-rows" data-rows="regions">
68:             {regionRows.map(r => (
69:               <BarRow key={r.elsewhere ? 'elsewhere' : r.region} label={r.region} count={r.count} max={regionMax}
70:                 elsewhere={r.elsewhere} dataAttr={{ 'data-region': r.elsewhere ? 'elsewhere' : r.region, 'data-count': r.count }} />
71:             ))}
72:           </div>
73:         </>
74:       )}
75:       <p className="insights-audience-fine">{k('fine')}</p>
76:     </>
77:   );
78: };
79: 
80: export function InsightsAudienceSection({ businessId }: { businessId: string; businessName?: string }) {
81:   const { t } = useTranslation('common');
82:   const q = useBusinessAudience(businessId);
83:   if (!q.isFetched || q.isError || !q.data) return null;
84:   const a = q.data;
85:   // CB100 — no followers: the Followers card alone says so; this card is absent.
86:   if (a.state === 'none') return null;
87:   const k = (key: string, options: Record<string, unknown> = {}) =>
88:     t(`business.insights.golfers.${key}`, { ...options, defaultValue: '' });
89:   const followers = k('followers', { count: a.followers_total, n: formatNumber(a.followers_total) });
90: 
91:   return (
92:     <section className="insights-audience-card" data-card="audience" data-state={a.state}>
93:       <Kicker left={k('kicker')} right={followers} />
94:       {a.state === 'ready' && <ReadyCard a={a} k={k} />}
95:       {a.state === 'not_enough' && (
96:         <>
97:           <h3 className="insights-audience-title" data-title="not-enough">{k('notEnoughTitle')}</h3>
98:           <div className="insights-audience-wait" data-with-handicap={a.with_handicap}>
99:             <b>{a.with_handicap === 0 ? k('leadZero') : k('lead', { count: a.with_handicap, n: formatNumber(a.with_handicap) })}</b>{' '}
100:             {k('notEnoughBody')}
101:             <div className="insights-audience-progress">
102:               <i data-progress={a.with_handicap} style={{ width: `${Math.min(100, (a.with_handicap / 10) * 100)}%` }} />
103:             </div>
104:           </div>
105:           <p className="insights-audience-fine">{k('notAffected')}</p>
106:         </>
107:       )}
108:     </section>
109:   );
110: }
```

#### `src/components/chrome/AppHeader.tsx`
Exports: AppHeaderTab, AppHeaderProps, AppHeaderBurger, AppHeader, default. Direct module consumers: 2 — `src/components/explore-tab-new/DiscoverHeader.tsx`, `src/features/tourhub/components/TourPageShell.tsx`.

```tsx
…
35:  */
36: 
37: export interface AppHeaderTab {
38:   id: string;
39:   label: string;
40: }
41: 
42: export interface AppHeaderProps {
43:   /** THE ONE SUBSTITUTION. Defaults to the clbhouz mark (Discover). */
44:   left?: ReactNode;
45:   /** Foot tab strip. Omit entirely when the surfaces are not tabbed siblings. */
…
71: 
72: /** The Tour burger — glass values taken from GlassDurationBadge, not re-derived. */
73: export function AppHeaderBurger({ onTap, label }: { onTap: () => void; label: string }) {
74:   return (
75:     <button
76:       type="button"
…
100: }
101: 
102: export function AppHeader({
103:   left,
104:   tabs,
105:   active,
…
214:               aria-label="Search"
215:               onClick={() => setSearchOpen(true)}
216:               style={{ width: 30, height: 34, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', padding: 0, border: 0, background: 'transparent', color: A.INK, cursor: 'pointer' }}
217:             >
218:               <Search size={16} strokeWidth={2.3} />
219:             </button>
…
245:                     border: 0,
246:                     background: 'transparent',
247:                     color: selected ? A.INK : A.MUTE,
248:                     fontSize: 15,
249:                     lineHeight: '18px',
250:                     fontWeight: 700,
251:                     letterSpacing: 0,
252:                     cursor: 'pointer',
253:                   }}
254:                 >
…
269: }
270: 
271: export default AppHeader;
```

#### `src/components/chrome/FixedPageHeader.tsx`
Exports: FIXED_HEADER_ROW_H, FIXED_HEADER_H_CSS, FixedPageHeader, default. Direct module consumers: 1 — `src/components/manage/ManagePageShell.tsx`.

```tsx
…
25:  */
26: 
27: export const FIXED_HEADER_ROW_H = 42;
28: 
29: /** First-paint fallback, replaced by the measured height on layout. */
30: export const FIXED_HEADER_H_CSS =
31:   `calc(env(safe-area-inset-top, 0px) + ${FIXED_HEADER_ROW_H + 1}px)`;
32: 
33: interface Props {
…
43: }
44: 
45: export function FixedPageHeader({
46:   title,
47:   onBack,
48:   right,
…
108:                 border: `1px solid ${A.BORDER}`,
109:                 background: A.PANEL,
110:                 color: A.INK,
111:                 cursor: 'pointer',
112:                 flexShrink: 0,
113:               }}
…
126: 
127:           {/* Absolutely centred so flanking controls cannot pull it off centre. */}
128:           <h1
129:             style={{
130:               position: 'absolute',
131:               left: 52,
…
137:               justifyContent: 'center',
138:               margin: 0,
139:               fontSize: 16,
140:               fontWeight: 700,
141:               letterSpacing: '-0.01em',
142:               color: A.INK,
143:               textAlign: 'center',
144:               whiteSpace: 'nowrap',
145:               overflow: 'hidden',
…
179: }
180: 
181: export default FixedPageHeader;
```

#### `src/components/chrome/GlassHeaderPlate.tsx`
Exports: GlassHeaderPlate, default. Direct module consumers: 1 — `src/features/watch-v2/WatchHubV2.tsx`.

```tsx
…
1: /**
2:  * Fixed glass veil spanning the island band (safe-area + 62px island row).
3:  * Sits above scrolling content, below the floating islands. Non-interactive.
4:  *
5:  * Optional `visible` prop (default true). Visibility is a CONDITIONAL MOUNT,
6:  * not an opacity transition. WebKit mishandles opacity (especially transitioned
7:  * opacity) on the same element as backdrop-filter: the backdrop gets captured
8:  * into a stale snapshot layer instead of live-sampling, rendering as a flat
9:  * opaque band. Never re-add `opacity` or `transition` to this element.
10:  *
11:  * Safe-area source: `var(--sat, env(safe-area-inset-top, 0px))` so the plate
12:  * height and sticky rows below it (which read --sat) stay in lockstep.
13:  *
14:  * Perf note: blur is limited to this thin fixed band. Do NOT add will-change
15:  * or transforms. If older Android WebViews jank, downgrade to opaque:
16:  *   background: '#15171F'; remove both backdrop-filter declarations.
17:  */
18: export function GlassHeaderPlate({
19:   visible = true,
20:   heightPx = 1,
21: }: {
22:   visible?: boolean;
23:   /** Non-safe-area portion of the plate. Default 1px — the plate is now a
24:    *  NOTCH VEIL only; the page's single sticky row (chips/tabs) locks at
25:    *  var(--sat) and owns the rest of the stuck-header footprint. */
26:   heightPx?: number;
27: }) {
28:   if (!visible) return null;
29:   return (
30:     <div
31:       aria-hidden
32:       style={{
33:         position: 'fixed',
34:         top: 0,
35:         left: 0,
36:         right: 0,
37:         height: `calc(var(--sat, env(safe-area-inset-top, 0px)) + ${heightPx}px)`,
38:          background: 'var(--glass-bg)',
39:         backdropFilter: 'blur(14px)',
40:         WebkitBackdropFilter: 'blur(14px)',
41:         zIndex: 11,
42:         pointerEvents: 'none',
43:       }}
44:     />
45:   );
46: }
47: 
48: export default GlassHeaderPlate;
```

#### `src/components/course-media-tab/CourseMediaHeader.tsx`
Exports: CourseMediaHeader. Direct module consumers: 0.

```tsx
…
1: import { RailChips, RAIL_CHIP_GAP } from '@/components/ui/RailChips';
2: import React, { useEffect } from 'react';
3: import { useTranslation } from 'react-i18next';
4: import { Plus } from 'lucide-react';
5: import { useNavigate } from 'react-router-dom';
6: import type { MediaCounts } from './hooks/useCourseMedia';
7: import type { CourseMediaFilter } from './hooks/useCourseMedia';
8: import { INK, INK_MUTE, HAIRLINE_INK_10 } from '@/features/courses/_shared/tokens';
9: import { A } from '@/features/courses/components/holes/analytical/tokens';
10: import { INK_ON_LIGHT } from '@/lib/tokens/surfaces';
11: 
12: 
13: 
14: interface CourseMediaHeaderProps {
15:   mediaCounts: MediaCounts;
16:   activeFilter: CourseMediaFilter;
17:   onFilterChange: (filter: CourseMediaFilter) => void;
18:   courseId: string;
19: }
20: 
21: const FILTER_KEYS: { key: CourseMediaFilter; i18nKey: string }[] = [
22:   { key: 'all', i18nKey: 'courses:media.filterAll' },
23:   { key: 'photos', i18nKey: 'courses:media.filterPhotos' },
24:   { key: 'videos', i18nKey: 'courses:media.filterVideos' },
25: ];
26: 
27: export const CourseMediaHeader: React.FC<CourseMediaHeaderProps> = ({
28:   mediaCounts,
29:   activeFilter,
30:   onFilterChange,
31:   courseId,
32: }) => {
33:   const { t } = useTranslation(['courses']);
34:   const navigate = useNavigate();
35: 
36:   const hasMedia = mediaCounts.total > 0;
37:   const hasBothTypes = mediaCounts.photos > 0 && mediaCounts.videos > 0;
38: 
39:   useEffect(() => {
40:     if (!hasBothTypes && activeFilter !== 'all') {
41:       onFilterChange('all');
42:     }
43:   }, [hasBothTypes, activeFilter, onFilterChange]);
44: 
45:   const countFor = (key: CourseMediaFilter) =>
46:     key === 'all' ? mediaCounts.total : key === 'photos' ? mediaCounts.photos : mediaCounts.videos;
47: 
48:   if (!hasMedia) return null;
49: 
50:   const onlyPhotos = mediaCounts.photos > 0;
51:   const rawCount = onlyPhotos ? mediaCounts.photos : mediaCounts.videos;
52:   const formatted = rawCount.toLocaleString();
53: 
54:   if (!hasBothTypes) {
55:     return (
56:       <div style={{ display: 'flex', alignItems: 'center', gap: RAIL_CHIP_GAP, padding: '0 20px 12px' }}>
57:         {/* ONE KIND, NO CHIPS (§3) — so this must not read as a lone chip
58:             pretending not to be a filter. A quiet 11px DIM line, sentence
59:             case, beside the add control. */}
60:         <span
61:           style={{
62:             fontSize: 11, fontWeight: 600, color: A.DIM,
63:             fontVariantNumeric: 'tabular-nums lining-nums',
64:           }}
65:         >
66:           {t(onlyPhotos ? 'courses:media.countPhotos' : 'courses:media.countVideos', {
67:             count: rawCount,
68:             formatted,
69:           })}
70:         </span>
71: 
72:         <button
73:           onClick={() => navigate(`/courses/${courseId}/rate`)}
74:           aria-label={t('courses:media.addMediaA11y')}
75:           style={{
76:             marginLeft: 'auto', width: 34, height: 34, borderRadius: 17,
77:             background: A.INK, color: INK_ON_LIGHT, border: 'none',
78:             display: 'flex', alignItems: 'center', justifyContent: 'center',
79:             cursor: 'pointer', flexShrink: 0,
80:           }}
81:         >
82:           <Plus className="w-4 h-4" strokeWidth={2.4} />
83:         </button>
84:       </div>
85:     );
86:   }
87: 
88:   return (
89:     <div style={{ display: 'flex', alignItems: 'center', gap: RAIL_CHIP_GAP, padding: '0 20px 12px' }}>
90:       <div style={{ flex: 1, minWidth: 0 }}>
91:         <RailChips
92:           ariaLabel={t('courses:media.filterA11y')}
93:           options={FILTER_KEYS.map(({ key, i18nKey }) => ({ id: key, label: t(i18nKey), value: countFor(key) }))}
94:           value={activeFilter}
95:           onChange={(next) => onFilterChange(next as typeof activeFilter)}
96:         />
97:       </div>
98: 
99:       {(
100:         <button
101:           onClick={() => navigate(`/courses/${courseId}/rate`)}
102:           aria-label={t('courses:media.addMediaA11y')}
103:           style={{
104:             marginLeft: 'auto', width: 34, height: 34, borderRadius: 17,
105:             background: A.INK, color: INK_ON_LIGHT, border: 'none',
106:             display: 'flex', alignItems: 'center', justifyContent: 'center',
107:             cursor: 'pointer', flexShrink: 0,
108:           }}
109: 
110:         >
111:           <Plus className="w-4 h-4" strokeWidth={2.4} />
112:         </button>
113:       )}
114:     </div>
115:   );
116: };
```

#### `src/components/courses/browse/ListScopeHeader.tsx`
Exports: ListScopeFigures, ListScopeHeader, default. Direct module consumers: 1 — `src/components/courses/StatBrowse.tsx`.

```tsx
…
1: import React from 'react';
2: import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
3: import { ALL_COURSES_ANCHOR } from './ByRegionSection';
4: import { fmtCount } from './format';
5: 
6: /**
7:  * ListScopeHeader — the Courses list's own head (BRIEF_COURSES_LIST_PHOTO_CARDS §2).
8:  * Rendered by StatBrowse above the sticky control bar, so its caption and its
9:  * three figures describe exactly the scope the area/region dropdowns have
10:  * selected. It replaces the page's old "Every course we hold" section and keeps
11:  * that section's id, so a By region tile tap still scrolls here.
12:  *
13:  * The mock's 16px caption gutter is already the page's own gutter: StatBrowse
14:  * sits inside CoursesContent's px-4 wrapper, so nothing here adds it a second time.
15:  *
16:  * Figures come from `browseFiguresForScope`, which uses the same arithmetic as
17:  * `groupBrowseRegions` — so a region's header equals that region's By region tile.
18:  */
19: 
20: const CAPTION: React.CSSProperties = {
21:   fontSize: 10,
22:   fontWeight: 800,
23:   letterSpacing: '0.18em',
24:   textTransform: 'uppercase',
25:   color: A.DIM,
26: };
27: 
28: const FIGURE_LABEL: React.CSSProperties = {
29:   display: 'block',
30:   fontSize: 9,
31:   fontWeight: 800,
32:   letterSpacing: '0.14em',
33:   textTransform: 'uppercase',
34:   lineHeight: 1,
35:   color: A.DIM,
36: };
37: 
38: const FIGURE_VALUE: React.CSSProperties = {
39:   ...FIGS,
40:   display: 'block',
41:   marginTop: 4,
42:   fontSize: 22,
43:   fontWeight: 700,
44:   lineHeight: 1,
45: };
46: 
47: export interface ListScopeFigures {
48:   courses: number;
49:   rounds: number;
50:   /** rounds × 18 for the same scope; exact (see browseFiguresForScope). */
51:   holes: number;
52:   avgToPar?: number | null;
53: }
54: 
55: /** The three columns, in order: Courses, Rounds, Holes — all ink. Plays to
56:  *  is not part of this header (BRIEF_COURSE_CARD_V3 §5). */
57: function scopeCells(figures: ListScopeFigures): Array<{ label: string; value: string; colour: string }> {
58:   return [
59:     { label: 'Courses', value: fmtCount(figures.courses), colour: A.INK },
60:     { label: 'Rounds', value: fmtCount(figures.rounds), colour: A.INK },
61:     { label: 'Holes', value: fmtCount(figures.holes), colour: A.INK },
62:   ];
63: }
64: 
65: export function ListScopeHeader({
66:   region,
67:   country,
68:   figures,
69: }: {
70:   /** The selected region, when one is. It leads the caption. */
71:   region: string | null;
72:   /** The selected area (sub_country), when one is. */
73:   country: string | null;
74:   figures: ListScopeFigures;
75: }) {
76:   const caption = region
77:     ? `Every course in ${region}`
78:     : country
79:       ? `Every course in ${country}`
80:       : 'Every course played';
81:   const cells = scopeCells(figures);
82:   return (
83:     <section id={ALL_COURSES_ANCHOR} style={{ paddingBottom: 14 }}>
84:       <div style={CAPTION}>{caption}</div>
85:       {/* No played courses in this scope: the caption is the whole head. */}
86:       {figures.courses > 0 ? (
87:         <div
88:           style={{
89:             display: 'grid',
90:             gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
91:             paddingTop: 10,
92:             textAlign: 'center',
93:           }}
94:         >
95:           {cells.map((cell) => (
96:             <div key={cell.label} style={{ minWidth: 0 }}>
97:               <span style={FIGURE_LABEL}>{cell.label}</span>
98:               <span style={{ ...FIGURE_VALUE, color: cell.colour }}>{cell.value}</span>
99:             </div>
100:           ))}
101:         </div>
102:       ) : null}
103:     </section>
104:   );
105: }
106: 
107: export default ListScopeHeader;
```

#### `src/components/courses/browse/SectionHead.tsx`
Exports: SectionHeadProps, HEAD_KICKER_SIZE, HEAD_TITLE_SIZE, HEAD_TITLE_LINE_HEIGHT, HEAD_TITLE_GAP, SectionHead, HEAD_GAP, SECTION_WRAP. Direct module consumers: 11.

```tsx
…
1: import React from 'react';
2: import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';
3: import { A } from '@/features/courses/components/holes/analytical/tokens';
4: 
5: /**
6:  * SectionHead — the one heading for the eight Courses page sections
7:  * (BRIEF_COURSES_PAGE_REBUILD §1a), now the signed-off Courses/Top 100 head:
8:  * eyebrow 11/700/0.16em ink, title 21/700/-0.035em/1.05. Larger than
9:  * SECTION_TITLE: it carries a magazine section, not a panel. No section writes
10:  * its own. `tone` is kept for callers but ignored: every eyebrow is ink.
11:  */
12: export interface SectionHeadProps {
13:   kicker: string;
14:   /** Omitted = no title element at all (section 08's list head). */
15:   title?: string;
16:   /** Ignored (signed-off heads: every eyebrow is ink). */
17:   tone?: 'amber' | 'quiet';
18: }
19: 
20: /* Head geometry, read by SectionHead AND its shell (BRIEF_COURSES_SKELETONS 2.2). */
21: export const HEAD_KICKER_SIZE = SECTION_EYEBROW.fontSize as number;
22: export const HEAD_TITLE_SIZE = SECTION_TITLE.fontSize as number;
23: export const HEAD_TITLE_LINE_HEIGHT = SECTION_TITLE.lineHeight as number;
24: export const HEAD_TITLE_GAP = SECTION_TITLE_GAP;
25: 
26: export function SectionHead({ kicker, title }: SectionHeadProps) {
27:   return (
28:     <div>
29:       {/* Matched to ScoresLeaderboardsPage's local EYEBROW const (11 / 700 /
30:           0.16em / uppercase) — must not drift from it. A fork until that const
31:           is published as a shared token; KICKER is the 9px one neither uses. */}
32:       <div style={{ ...SECTION_EYEBROW, color: A.INK }}>
33:         {kicker}
34:       </div>
35:       {title ? <h2
36:         style={{
37:           ...SECTION_TITLE,
38:           color: A.INK,
39:           // These are the Courses page's own head spacing. The Explore page is being
40:           // brought to these values, not the other way round.
41:           marginTop: HEAD_TITLE_GAP,
42:           marginBottom: 0,
43:         }}
44:       >
45:         {title}
46:       </h2> : null}
47:     </div>
48:   );
49: }
50: 
51: /** Gap between a section's head and its content — every section reads this. */
52: /* HEAD_GAP and the title's marginTop are the Courses page's own head spacing.
53:  * The Explore page is being brought to these values, not the other way round. */
54: export const HEAD_GAP = 12;
55: 
56: /** The wrapper every section's head + content sits in. */
57: export const SECTION_WRAP: React.CSSProperties = { padding: '20px 16px 14px' };
```

#### `src/components/courses/user/UserCoursesHeader.tsx`
Exports: default. Direct module consumers: 1 — `src/components/courses/UserCoursesContent.tsx`.

```tsx
…
1: 
2: import React from 'react';
3: 
4: interface UserCoursesHeaderProps {
5:   displayName: string;
6:   isOwnProfile: boolean;
7: }
8: 
9: const UserCoursesHeader: React.FC<UserCoursesHeaderProps> = ({ 
10:   displayName, 
11:   isOwnProfile 
12: }) => {
13:   // Extract first name from display name or use display name if it's a single word
14:   const firstName = displayName?.split(' ')[0] || displayName || 'User';
15: 
16:   // Dynamic intro text based on profile ownership
17:   const introText = isOwnProfile 
18:     ? "Here's how you rate the world's top courses"
19:     : `Here's how ${firstName} rates the world's top courses`;
20: 
21:   return (
22:     <div>
23:     </div>
24:   );
25: };
26: 
27: export default UserCoursesHeader;
```

#### `src/components/explore-tab-new/DiscoverHeader.tsx`
Exports: DiscoverTab, DiscoverHeader. Direct module consumers: 2 — `src/components/explore-tab-new/ExploreTabContent.tsx`, `src/components/explore-tab-new/discoverReturnState.ts`.

```tsx
…
1: import { AppHeader } from '@/components/chrome/AppHeader';
2: 
3: /**
4:  * The Discover band is now a THIN CALL of the shared header
5:  * (`src/components/chrome/AppHeader.tsx`) — see BRIEF_TOUR_HEADER_CORRECTION,
6:  * Correction 1. Discover passes no `left`, so it gets the clbhouz mark; Tour
7:  * passes the glass burger. There is no second implementation to drift.
8:  */
9: 
10: export type DiscoverTab = 'scores' | 'news' | 'gallery';
11: 
12: const TABS = [
13:   { id: 'scores', label: 'SCORES' },
14:   { id: 'news', label: 'NEWS' },
15:   { id: 'gallery', label: 'WATCH' },
16: ] as const;
17: 
18: export function DiscoverHeader({ active, onChange }: { active: DiscoverTab; onChange: (tab: DiscoverTab) => void }) {
19:   return (
20:     <AppHeader
21:       tabs={TABS}
22:       active={active}
23:       onTabChange={(id) => onChange(id as DiscoverTab)}
24:       tabsAriaLabel="Discover sections"
25:       inset="self"
26:       heightVar="--discover-header-h"
27:     />
28:   );
29: }
```

#### `src/components/explore-tab-new/courseled/tokens.tsx`
Exports: INK, DISCOVER_FACT, DISCOVER_QUIET, KICKER, LABEL, GOLD, COMPETITION, PODIUM_ACCENT, PODIUM_GROUND, RHYTHM, ACT_GAP, HEAD_GAP, CARD_GAP, RAIL_GAP, CHIP_GAP, MOSAIC_GAP, PAGE_GUTTER, CARD_RADIUS, WELL_RADIUS, THUMBNAIL_RADIUS, CHIP_RADIUS, NUMF, CARD_SHELL, NewDot, NEW_CARD_RING, NEW_ROW_BAR, SECTION_TITLE, EYEBROW_TEXT, Eyebrow, Aside, InkAction, ImageChip, SELF_ROW_TINT, INDEX_CUT_BORDER, A, SANS, FIGS. Direct module consumers: 56.

```tsx
…
19: 
20: /** Dark ink ramp of record for this area. Identical to A.INK / BODY / MUTE / DIM. */
21: export const INK = SURFACE.dark;
22: 
23: /** Amendment 1: Discover content is white; interface labels are one quiet tier. */
24: export const DISCOVER_FACT = '#FFFFFF';
25: export const DISCOVER_QUIET = 'rgba(255,255,255,0.70)';
26: 
27: export const KICKER: React.CSSProperties = { ...KICKER_LEGACY, fontWeight: 700, color: DISCOVER_QUIET };
28: export const LABEL: React.CSSProperties = { ...LABEL_LEGACY, fontWeight: 700, color: DISCOVER_QUIET };
29: 
30: export const GOLD = '#D8A93C';
31: 
32: /**
33:  * CHIP1.3 — a competition round. Deliberately neutral grey (A.MUTE): a
…
35:  * amber (the viewer) and not gold (a rare feat).
36:  */
37: export const COMPETITION = A.MUTE;
38: 
39: /**
40:  * METAL SEMANTICS (BRIEF_BAND_TILES_PODIUM §0).
…
50:  * to-par colour grammar and must not be "fixed" back to white.
51:  */
52: export const PODIUM_ACCENT = {
53:   gold: GOLD,
54:   white: DISCOVER_FACT,
55:   red: TOPAR_UNDER_DARK,
…
58: 
59: /** Low-alpha grounds used only by podium margin chips. */
60: export const PODIUM_GROUND = {
61:   gold: 'rgba(216,169,60,0.14)',
62:   white: 'rgba(255,255,255,0.08)',
63:   red: 'rgba(255,107,96,0.12)',
…
66: } as const;
67: 
68: export { A, SANS, FIGS };
69: 
70: /** Discover content geometry: one master, all subordinate radii derived. */
71: /**
…
86:  *               is a wall, and 2px is a seam rather than a rhythm.
87:  */
88: export const RHYTHM = 28;
89: export const ACT_GAP = Math.round(RHYTHM * 1.5);
90: export const HEAD_GAP = Math.round(RHYTHM * 0.36);
91: export const CARD_GAP = Math.round(RHYTHM * 0.36);
92: export const RAIL_GAP = Math.round(RHYTHM * 0.36);
93: export const CHIP_GAP = Math.round(RHYTHM * 0.43);
94: export const MOSAIC_GAP = 2;
95: export const PAGE_GUTTER = 14;
96: 
97: export const CARD_RADIUS = 8;
98: export const WELL_RADIUS = Math.round(CARD_RADIUS * 0.85);
99: export const THUMBNAIL_RADIUS = Math.round(CARD_RADIUS * 0.78);
100: export const CHIP_RADIUS = Math.round(CARD_RADIUS * 0.5);
101: 
102: 
103: export const NUMF: React.CSSProperties = {
104:   fontWeight: 700,
105:   letterSpacing: '-0.02em',
106:   fontVariantNumeric: 'tabular-nums lining-nums',
107: };
108: 
109: 
110: export const CARD_SHELL: React.CSSProperties = {
111:   background: A.PANEL,
112:   border: `1px solid ${A.BORDER}`,
113:   borderRadius: CARD_RADIUS,
…
122: 
123: /** 6px ink dot after a section eyebrow when that section holds anything new. */
124: export function NewDot() {
125:   return (
126:     <span
127:       aria-hidden
…
140: 
141: /** 1.5px ink ring on a new card/tile. Inset so it survives overflow: hidden. */
142: export const NEW_CARD_RING: React.CSSProperties = {
143:   boxShadow: `inset 0 0 0 1.5px ${A.INK}`,
144: };
145: 
146: /** 3px ink bar at a new world row's left edge, inside the card padding. */
147: export const NEW_ROW_BAR: React.CSSProperties = {
148:   width: 3,
149:   alignSelf: 'stretch',
150:   borderRadius: 999,
…
162:  * par or the viewing member.
163:  */
164: export const SECTION_TITLE: React.CSSProperties = {
165:   fontFamily: SANS,
166:   fontSize: 17,
167:   fontWeight: 700,
168:   letterSpacing: '-0.02em',
169:   color: DISCOVER_QUIET,
170:   lineHeight: 1.2,
171: };
172: 
173: /**
…
184:  * SECTION_TITLE is left untouched at source.
185:  */
186: export const EYEBROW_TEXT: React.CSSProperties = {
187:   fontFamily: SANS,
188:   ...KICKER,
189:   color: DISCOVER_QUIET,
190:   lineHeight: 1,
191: };
192: 
193: export function Eyebrow({
194:   children,
195:   aside,
196:   dot = false,
…
221:         }}
222:       >
223:         <span style={EYEBROW_TEXT}>
224:           {children}
225:           {dot ? <NewDot /> : null}
226:         </span>
…
236:             marginTop: 3,
237:             fontFamily: SANS,
238:             fontSize: 12,
239:             fontWeight: 500,
240:             lineHeight: 1.4,
241:             color: DISCOVER_QUIET,
242:           }}
243:         >
244:           {subline}
…
250: }
251: 
252: export function Aside({ children }: { children: React.ReactNode }) {
253:   return <span style={{ ...LABEL, lineHeight: 1 }}>{children}</span>;
254: }
255: 
256: export function InkAction({
257:   children,
258:   onClick,
259: }: {
…
270:         gap: 4,
271:         ...LABEL,
272:         fontSize: 11,
273:         lineHeight: 1,
274:         color: DISCOVER_QUIET,
275:         background: 'transparent',
276:         border: 'none',
277:         // 44px tap target without disturbing the eyebrow baseline: the padding
…
301: 
302: /** Glass corner chip used on every course image (when / tour / days). */
303: export function ImageChip({
304:   children,
305:   side = 'right',
306:   gold = false,
…
318:         /* READ, not AXIS: this chip carries WORDS (when / tour / days), so it
319:            takes the 11px floor rather than the axis exception. */
320:         fontSize: 11,
321:         fontWeight: 700,
322:         letterSpacing: '0.1em',
323:         textTransform: 'uppercase',
324:         color: '#FFFFFF',
325:         background: 'rgba(10,14,10,0.55)',
326:         border: gold ? `1px solid ${GOLD}` : '1px solid transparent',
327:         borderRadius: CHIP_RADIUS,
…
336: /* Leaderboards Phase 9 — the board row's three named tints. */
337: /** The viewing member's own row, in both grammars and on the pinned copy. */
338: export const SELF_ROW_TINT = 'rgba(247,147,30,0.07)';
339: /** A cut on the index chip: A.GREEN's own hue at 35%. */
340: export const INDEX_CUT_BORDER = 'rgba(47,163,90,0.35)';
```

#### `src/components/friend-sheet/parts/SheetHeader.tsx`
Exports: SheetHeaderProps, SheetHeader. Direct module consumers: 1 — `src/components/friend-sheet/FriendSheet.tsx`.

```tsx
…
5: import { TITLE } from '@/lib/tokens/type';
6: 
7: export interface SheetHeaderProps {
8:   avatarUrl: string | null;
9:   name: string;
10:   /** Only for clbhouz users */
…
22: }
23: 
24: export const SheetHeader: React.FC<SheetHeaderProps> = ({
25:   avatarUrl,
26:   name,
27:   handle,
…
83:           }}
84:         >
85:           <h2
86:             style={{
87:               margin: 0,
88:               ...TITLE,
89:               color: T100,
90:               lineHeight: 1.05,
91:               fontFamily: FONT,
92:             }}
93:           >
…
97:         </div>
98:         {handle && handle !== name && (
99:           <div style={{ fontSize: 14, color: T60, marginTop: 2 }}>
100:             @{handle}
101:           </div>
102:         )}
…
108:               gap: 4,
109:               marginTop: 4,
110:               fontSize: 12,
111:               color: T60,
112:             }}
113:           >
114:             <MapPin size={12} strokeWidth={2} />
…
158:           style={{
159:             margin: '8px 0 0',
160:             fontSize: 13,
161:             color: T100,
162:             lineHeight: 1.4,
163:           }}
164:         >
165:           {bio}
…
178:       ? {
179:           bg: 'rgba(47,163,90,0.12)',
180:           color: GREEN,
181:         }
182:       : {
183:           bg: BG_2,
184:           color: T60,
185:         };
186:   return (
187:     <span
…
190:         borderRadius: 999,
191:         background: palette.bg,
192:         color: palette.color,
193:         fontSize: 10,
194:         fontWeight: 700,
195:         letterSpacing: '0.06em',
196:         textTransform: 'uppercase',
197:         lineHeight: 1.4,
198:       }}
199:     >
200:       {label}
```

#### `src/components/friend-sheet/parts/_shared/Eyebrow.tsx`
Exports: Eyebrow. Direct module consumers: 3 — `src/components/friend-sheet/parts/HeadToHeadCard.tsx`, `src/components/friend-sheet/parts/LatestPostCard.tsx`, `src/components/friend-sheet/parts/TheirFormSection.tsx`.

```tsx
…
1: import React from 'react';
2: import { T60 } from './tokens';
3: 
4: export const Eyebrow: React.FC<{ label: string }> = ({ label }) => (
5:   <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
6:     <span
7:       style={{
8:         fontSize: 10.5,
9:         fontWeight: 700,
10:         color: T60,
11:         letterSpacing: '0.16em',
12:         textTransform: 'uppercase',
13:       }}
14:     >
15:       {label}
16:     </span>
17:   </div>
18: );
```

#### `src/components/header/GlobalHeader.tsx`
Exports: default. Direct module consumers: 1 — `src/App.tsx`.

```tsx
…
1: import React, { useLayoutEffect } from 'react';
2: import { useModalContext } from '@/contexts/ModalContext';
3: import { isPerfEnabled, noteHeaderMount, noteHeaderUnmount } from '@/perf/navTiming';
4: import ChromeIsland from '@/features/chrome-v2/ChromeIsland';
5: 
6: const HeaderPerfTracker: React.FC = () => {
7:   useLayoutEffect(() => {
8:     if (!isPerfEnabled()) return;
9:     noteHeaderMount();
10:     return () => noteHeaderUnmount();
11:   }, []);
12:   return null;
13: };
14: 
15: /**
16:  * GlobalHeader — island-only. The registry (features/chrome-v2/registry.ts)
17:  * owns route-level hiding; this component only forwards the runtime
18:  * modal/fullscreen suppression signal.
19:  */
20: const GlobalHeader: React.FC = () => {
21:   const { shouldHideHeader } = useModalContext();
22: 
23:   return (
24:     <>
25:       <HeaderPerfTracker />
26:       <ChromeIsland hidden={shouldHideHeader} />
27:     </>
28:   );
29: };
30: 
31: export default GlobalHeader;
```

#### `src/components/header/globalHeaderRules.ts`
Exports: IMMERSIVE_ROUTE_PREFIXES, IMMERSIVE_EXACT_ROUTES, LIGHT_IMMERSIVE_EXACT_ROUTES, WHS_CONNECT_PATH, setWhsConnectImmersive, isWhsConnectImmersive, isLightImmersiveRoute, BUSINESS_RESERVED_SEGMENTS, isBusinessProfilePath, isImmersiveRoute, DARK_CHROME_ROUTES, isDarkChromeRoute, CANVAS_DARK_CANVAS, isCanvasDarkRoute. Direct module consumers: 6 — `src/components/layout/PageRoot.tsx`, `src/components/profile/handicap/whs/WhsConnectScreen.tsx`, `src/features/chrome-v2/registry.ts`, `src/hooks/useNavTheme.ts`, `src/lib/routeChrome.ts`, `src/main.tsx`.

```tsx
…
1: // Route classification for status-bar / immersive-surface concerns.
2: // Header visibility now lives in features/chrome-v2/registry.ts.
3: import { IMMERSIVE_FEED_CANVAS } from '@/lib/tokens/surfaces';
4: 
5: /**
6:  * Routes whose hero media bleeds into the safe area.
7:  * On these routes, .app-shell background must be transparent
8:  * so no grey shows through while the hero mounts.
9:  */
10: export const IMMERSIVE_ROUTE_PREFIXES = [
11:   '/courses/',        // Course Detail pages
12:   '/profile',         // Own profile + /profile/:username
13:   '/profile/',
14:   /* Tour overview is exact below; tournament detail roots are matched in
15:      isImmersiveRoute. All other /tourhub/* pages remain shell-inset. */
16:   '/discover/explore/region/', // Region pages
17: ] as const;
18: 
19: export const IMMERSIVE_EXACT_ROUTES = [
20:   '/',
21:   '/clubhouse',
22:   '/courses',
23:   '/explore',
24:   /* '/amateur' REMOVED (BRIEF_EXPLORE_MAGAZINE §3a correction, 12 Sep 2026):
25:      immersive is for hero pages whose photograph runs under the notch.
26:      Explore has NO hero — its first content is a card, and a card photo
27:      sliding under the floating islands reads as the page failing to start.
28:      Content starts BELOW the islands via CHROME_CLEARANCE, exactly as the
29:      Handicap page does. The '/explore' entry stays: it is the redirect shim
30:      into /amateur, not a surface of its own. */
31:   '/tourhub',
32: ] as const;
33: 
34: export const LIGHT_IMMERSIVE_EXACT_ROUTES = [
35: ] as const;
36: 
37: /**
38:  * /manage/handicap serves TWO surfaces: the WHS connect flow (page owns its
39:  * own back + title, wash runs through the notch) and the CONNECTED manage
40:  * surface (keeps ManagePageShell's header). Immersive is therefore scoped by
41:  * state, not by path: the connect screen raises this flag while mounted.
42:  */
43: export const WHS_CONNECT_PATH = '/manage/handicap';
44: let whsConnectImmersive = false;
45: 
46: export function setWhsConnectImmersive(value: boolean): void {
47:   whsConnectImmersive = value;
48: }
49: 
50: export function isWhsConnectImmersive(): boolean {
51:   return whsConnectImmersive;
52: }
53: 
54: export function isLightImmersiveRoute(pathname: string): boolean {
55:   if (pathname === WHS_CONNECT_PATH && whsConnectImmersive) return true;
56:   return (LIGHT_IMMERSIVE_EXACT_ROUTES as readonly string[]).includes(pathname);
57: }
58: 
59: 
60: /**
61:  * Static segments that follow /business/ but are NOT a business identifier.
62:  * They look like a profile path by shape (3 segments) but are standard shell
63:  * pages, so they must be excluded by name.
64:  */
65: export const BUSINESS_RESERVED_SEGMENTS = new Set([
66:   'create',
67:   'success',
68:   'intro',
69:   'invite',
70: ]);
71: 
72: /**
73:  * Business PROFILE only is immersive (hero bleed). All other /business/*
74:  * routes (create wizard, managed subpages, invite pages, follower lists)
75:  * are standard shell pages whose headers must sit below the notch.
76:  *
77:  * A profile path is exactly 3 segments after stripping a trailing slash AND
78:  * its third segment is not one of BUSINESS_RESERVED_SEGMENTS. Shape alone is
79:  * not enough: '/business/create' is also 3 segments.
80:  *
81:  * This is the single definition. The chrome-v2 registry profile rule calls
82:  * this function rather than re-deriving the test, so the two systems cannot
83:  * disagree — and cannot be made to disagree by reordering the registry.
84:  */
85: export function isBusinessProfilePath(pathname: string): boolean {
86:   if (!pathname.startsWith('/business/')) return false;
87:   const segs = pathname.replace(/\/$/, '').split('/');
88:   if (segs.length !== 3) return false;
89:   return !BUSINESS_RESERVED_SEGMENTS.has(segs[2].toLowerCase());
90: }
91: 
92: 
93: export function isImmersiveRoute(pathname: string): boolean {
94:   // The review composer is a plain light page, not a hero page — it must
95:   // never mount immersive (the post-mount flip caused device paint bugs).
96:   if (/^\/courses\/[^/]+\/rate\/?$/.test(pathname)) return false;
97:   // Connect flow only — the connected manage surface stays non-immersive.
98:   if (pathname === WHS_CONNECT_PATH) return whsConnectImmersive;
99:   if (isBusinessProfilePath(pathname)) return true;
100:   if (/^\/tourhub\/tournament\/[^/]+\/?$/.test(pathname)) return true;
101:   const exactMatch = (IMMERSIVE_EXACT_ROUTES as readonly string[]).some(
102:     (r) => pathname === r
103:   );
104:   const prefixMatch = (IMMERSIVE_ROUTE_PREFIXES as readonly string[]).some(
105:     (p) => pathname.startsWith(p)
106:   );
107:   return exactMatch || prefixMatch;
108: }
109: 
110: 
111: /**
112:  * Dark chrome is the app default. The retained route list documents the
113:  * original launch surfaces for consumers that need that classification.
114:  * Single source of truth for: html/body bg, status bar, bottom nav,
115:  * PageRoot status-bar styling, and pre-React shell seeding.
116:  *
117:  * The cold-launch chain (splash → shell → skeleton → feed) is all
118:  * `#0A0A0C` on these routes so there is no perceptible colour transition.
119:  */
120: export const DARK_CHROME_ROUTES = ['/', '/clubhouse', '/auth', '/signup'] as const;
121: 
122: export function isDarkChromeRoute(_pathname: string): boolean {
123:   return true;
124: }
125: 
126: /**
127:  * NEAR-BLACK CANVAS ROUTES — Messages.
128:  *
129:  * Messages renders a `position: fixed; inset: 0` root (`.messages-root`) on
130:  * #05070A, so it already bleeds under the notch. What painted the white band
131:  * above it was ROUTE CHROME, not layout: the default branch of applyRouteChrome
132:  * gave it the light surface (#F8FAFC) on html/body, the #safe-area-shield
133:  * (fixed, z-index 55) and the native status bar. Chrome for these routes must
134:  * be the same near-black as the canvas.
135:  */
136: export const CANVAS_DARK_CANVAS = IMMERSIVE_FEED_CANVAS;
137: 
138: export function isCanvasDarkRoute(pathname: string): boolean {
139:   return (
140:     pathname === '/messages' ||
141:     pathname.startsWith('/messages/')
142:   );
143: }
```

#### `src/components/profile/edit-v2/HeaderPhotoCard.tsx`
Exports: HeaderPhotoCard. Direct module consumers: 0.

```tsx
…
1: import React, { useRef, useState, useCallback } from 'react';
2: import { Camera } from 'lucide-react';
3: import { ImageCropperModal } from './ImageCropperModal';
4: import { PhotoActionSheet } from './PhotoActionSheet';
5: import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';
6: import { MEMBER_CELL, MEMBER_PANEL } from '@/lib/tokens/surfaces';
7: 
8: 
9: 
10: interface HeaderPhotoCardProps {
11:   currentUrl?: string | null;
12:   previewUrl?: string | null;
13:   onFileChange: (file: File | null) => void;
14:   onRemove?: () => void;
15:   aspectRatio: number;
16:   aspectCss: string;
17: }
18: 
19: /**
20:  * Shape-agnostic: the cover's shape belongs to the surface mounting this card
21:  * (aspect constants live in coverAspect.ts). One card, parameterised — never fork.
22:  * Stored covers are NOT re-cropped: they keep composing under objectFit cover.
23:  */
24: 
25: export const HeaderPhotoCard: React.FC<HeaderPhotoCardProps> = ({
26:   currentUrl,
27:   previewUrl,
28:   onFileChange,
29:   onRemove,
30:   aspectRatio,
31:   aspectCss,
32: }) => {
33:   
34:   const inputRef = useRef<HTMLInputElement>(null);
35:   const [cropperImage, setCropperImage] = useState<string | null>(null);
36:   const [showCropper, setShowCropper] = useState(false);
37:   const [sheetOpen, setSheetOpen] = useState(false);
38: 
39:   const displayUrl = previewUrl || currentUrl;
40: 
41:   const handleClick = () => setSheetOpen(true);
42: 
43:   const triggerPicker = () => inputRef.current?.click();
44:   const triggerCapture = () => {
45:     const el = inputRef.current;
46:     if (!el) return;
47:     el.setAttribute('capture', 'environment');
48:     el.click();
49:     setTimeout(() => el.removeAttribute('capture'), 300);
50:   };
51: 
52: 
53:   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
54:     const file = e.target.files?.[0];
55:     if (file) {
56:       const reader = new FileReader();
57:       reader.onload = () => {
58:         setCropperImage(reader.result as string);
59:         setShowCropper(true);
60:       };
61:       reader.readAsDataURL(file);
62:     }
63:     e.target.value = '';
64:   };
65: 
66:   const handleCropComplete = useCallback((croppedBlob: Blob) => {
67:     const file = new File([croppedBlob], 'header-photo.jpg', { type: 'image/jpeg' });
68:     onFileChange(file);
69:     setCropperImage(null);
70:   }, [onFileChange]);
71: 
72:   const handleCropperClose = (open: boolean) => {
73:     if (!open) {
74:       setCropperImage(null);
75:     }
76:     setShowCropper(open);
77:   };
78: 
79:   const cropper = cropperImage ? (
80:     <ImageCropperModal
81:       open={showCropper}
82:       onOpenChange={handleCropperClose}
83:       image={cropperImage}
84:       aspectRatio={aspectRatio}
85:       cropShape="rect"
86:       title="Crop Header Photo"
87:       onCropComplete={handleCropComplete}
88:     />
89:   ) : null;
90: 
91:   const fileInput = (
92:     <input
93:       ref={inputRef}
94:       type="file"
95:       accept="image/jpeg,image/png,image/webp"
96:       onChange={handleChange}
97:       className="hidden"
98:     />
99:   );
100: 
101: return (
102:     <>
103:       <button
104:         type="button"
105:         onClick={handleClick}
106:         aria-label={displayUrl ? 'Edit cover' : 'Add cover'}
107:         style={{
108:           position: 'relative',
109:           display: 'block',
110:           width: '100%',
111:           aspectRatio: aspectCss,
112:           /* Stands in for a photo: same decision as the other missing-image
113:              fallbacks — Cell to Panel, both stops from the ramp. */
114:           background: displayUrl
115:             ? 'transparent'
116:             : `linear-gradient(135deg,${MEMBER_CELL},${MEMBER_PANEL})`,
117:           overflow: 'hidden',
118:           border: 'none',
119:           padding: 0,
120:           cursor: 'pointer',
121:         }}
122:       >
123:         {displayUrl ? (
124:           <img
125:             src={displayUrl}
126:             alt=""
127:             style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
128:           />
129:         ) : null}
130:         <span
131:           className={CHIP_GLASS_CLASS}
132:           style={{
133:             position: 'absolute',
134:             top: 10,
135:             right: 10,
136:             display: 'inline-flex',
137:             alignItems: 'center',
138:             gap: 6,
139:             color: '#fff',
140:             fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
141:             fontSize: 12.5,
142:             fontWeight: 500,
143:             padding: '7px 11px',
144:             borderRadius: 9,
145:           }}
146:         >
147:           <Camera size={13} strokeWidth={2.25} />
148:           {displayUrl ? 'Edit cover' : 'Add cover'}
149:         </span>
150:       </button>
151:       {fileInput}
152:       {cropper}
153:       <PhotoActionSheet
154:         open={sheetOpen}
155:         onClose={() => setSheetOpen(false)}
156:         title="Cover photo"
157:         hasPhoto={Boolean(displayUrl)}
158:         removeLabel="Remove cover"
159:         onChoose={triggerPicker}
160:         onTake={triggerCapture}
161:         onRemove={onRemove}
162:       />
163:     </>
164:   );
165: };
```

#### `src/components/profile/handicap/whs/sections/_shared/darkAtoms.tsx`
Exports: DARK_ROW_TITLE, Verdict, verdictForDelta, DarkSectionHeaderProps, DarkSectionHeader, DarkCardProps, DarkCard, KPICellProps, KPICell, TripleStrip, VerdictNumberProps, VerdictNumber, VerdictPillProps, VerdictPill, LiveStatusProps, LiveStatus. Direct module consumers: 3 — `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/LeaderboardRow.tsx`, `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx`, `src/components/profile/handicap/whs/sections/trends/RecentRoundsCard.tsx`.

```tsx
…
33:  * drift the moment either is touched, so never copy these numbers.
34:  */
35: export const DARK_ROW_TITLE: React.CSSProperties = {
36:   fontSize: 13,
37:   fontWeight: 600,
38:   letterSpacing: '-0.015em',
39:   color: 'var(--hcp-t-100)',
40:   lineHeight: 1.3,
41: };
42: 
43: 
44: // ── Type guards ────────────────────────────────────────────────────
45: 
46: export type Verdict = 'good' | 'bad' | 'mid' | 'neutral';
47: 
48: /**
49:  * Pick the verdict for an index/score-diff delta.
…
52:  * @param invert pass true when higher-is-better (e.g. stableford pts)
53:  */
54: export function verdictForDelta(
55:   delta: number | null | undefined,
56:   invert = false,
57: ): Verdict {
…
88: import { SectionHeader } from '@/components/ui/SectionHeader';
89: 
90: export interface DarkSectionHeaderProps {
91:   eyebrow: string;
92:   title?: React.ReactNode;
93:   sub?: string;
…
97: }
98: 
99: export const DarkSectionHeader: React.FC<DarkSectionHeaderProps> = ({
100:   eyebrow,
101:   title,
102:   sub,
103:   right,
104: }) => (
105:   <SectionHeader
106:     surface="dark"
107:     role="section"
108:     kicker={eyebrow}
…
117: // ── Card wrapper ───────────────────────────────────────────────────
118: 
119: export interface DarkCardProps {
120:   children: React.ReactNode;
121:   /** Adds a subtle accent rail on the left edge (used by Next Round Watch) */
122:   accent?: 'good' | 'bad' | 'amber' | 'none';
…
129: }
130: 
131: export const DarkCard: React.FC<DarkCardProps> = ({
132:   children,
133:   accent = 'none',
134:   glow = 'none',
…
182: // ── KPI cell (used in triple-strip and elsewhere) ──────────────────
183: 
184: export interface KPICellProps {
185:   label: string;
186:   value: React.ReactNode;
187:   meta?: React.ReactNode;
…
192: }
193: 
194: export const KPICell: React.FC<KPICellProps> = ({
195:   label,
196:   value,
197:   meta,
…
223:         style={{
224:           textTransform: 'uppercase',
225:           fontSize: 11,
226:           letterSpacing: '0.16em',
227:           fontWeight: 700,
228:           color: 'var(--hcp-t-60)',
229:         }}
230:       >
231:         {label}
…
233:       <span
234:         style={{
235:           fontSize: 26,
236:           fontWeight: 700,
237:           letterSpacing: '-0.025em',
238:           lineHeight: 1,
239:           fontVariantNumeric: 'tabular-nums lining-nums',
240:           color: valueColor,
241:         }}
242:       >
243:         {value}
…
246:         <span
247:           style={{
248:             fontSize: 11,
249:             color: 'var(--hcp-t-40)',
250:             fontVariantNumeric: 'tabular-nums lining-nums',
251:           }}
252:         >
…
260: // ── Triple-strip (3 KPICells in a row, used under hero rings) ──────
261: 
262: export const TripleStrip: React.FC<{
263:   children: React.ReactNode;
264:   style?: React.CSSProperties;
265:   /**
…
301: // ── Verdict number (auto-coloured by sign) ─────────────────────────
302: 
303: export interface VerdictNumberProps {
304:   value: number | null | undefined;
305:   /** Add explicit + sign for positives */
306:   showSign?: boolean;
…
317: }
318: 
319: export const VerdictNumber: React.FC<VerdictNumberProps> = ({
320:   value,
321:   showSign = false,
322:   invert = false,
…
335:     v === 'mid'  ? 'var(--hcp-mid)' :
336:     'var(--hcp-t-100)';
337:   const fontSize =
338:     size === 'sm' ? 14 :
339:     size === 'md' ? 18 :
340:     size === 'lg' ? 24 : 32;
…
344:       style={{
345:         color,
346:         fontWeight: 700,
347:         letterSpacing: '-0.02em',
348:         fontVariantNumeric: 'tabular-nums lining-nums',
349:         fontSize,
350:         ...style,
351:       }}
352:     >
…
358: // ── Verdict pill (small badge) ─────────────────────────────────────
359: 
360: export interface VerdictPillProps {
361:   children: React.ReactNode;
362:   verdict?: Verdict;
363: }
364: 
365: export const VerdictPill: React.FC<VerdictPillProps> = ({ children, verdict = 'neutral' }) => {
366:   const bg =
367:     verdict === 'good' ? 'var(--hcp-good-tint)' :
368:     verdict === 'bad'  ? 'var(--hcp-bad-tint)' :
…
385:         color,
386:         textTransform: 'uppercase',
387:         fontSize: 11,
388:         letterSpacing: '0.14em',
389:         fontWeight: 700,
390:         fontVariantNumeric: 'tabular-nums lining-nums',
391:       }}
392:     >
…
398: // ── Live status row (the topbar "LIVE · synced Xm ago") ────────────
399: 
400: export interface LiveStatusProps {
401:   status: 'live' | 'syncing' | 'stale' | 'offline';
402:   /** e.g. "4M AGO" — already-formatted relative time */
403:   syncedAgo?: string;
404: }
405: 
406: export const LiveStatus: React.FC<LiveStatusProps> = ({ status, syncedAgo }) => {
407:   const dotColor =
408:     status === 'live'    ? 'var(--hcp-good)' :
409:     status === 'syncing' ? 'var(--hcp-amber)' :
…
440:         style={{
441:           textTransform: 'uppercase',
442:           fontSize: 11,
443:           letterSpacing: '0.18em',
444:           fontWeight: 700,
445:           color: 'var(--hcp-t-60)',
446:         }}
447:       >
448:         <span style={{ color: labelColor, fontWeight: 700 }}>{label}</span>
449:         {syncedAgo && (
450:           <>
451:             <span style={{ color: 'var(--hcp-t-40)' }}> · SYNCED {syncedAgo}</span>
452:           </>
453:         )}
454:       </span>
```

#### `src/components/profile/handicap/whs/sections/course-legends/_shared/CourseEyebrow.tsx`
Exports: CourseEyebrow, default. Direct module consumers: 1 — `src/components/profile/handicap/whs/sections/course-legends/drilldown/DrilldownHeader.tsx`.

```tsx
…
1: import React from 'react';
2: import { buildEyebrow } from './eyebrowLabel';
3: 
4: const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
5: 
6: 
7: export const CourseEyebrow: React.FC<{
8:   type?: string | null;
9:   region?: string | null;
10:   country?: string | null;
11:   onPhoto?: boolean;
12: }> = ({ type, region, country, onPhoto = false }) => {
13:   const label = buildEyebrow(type, region, country);
14:   if (!label) return null;
15:   return (
16:     <div
17:       style={{
18:         fontFamily: FONT,
19:         fontSize: 11.5,
20:         fontWeight: 700,
21:         letterSpacing: '0.16em',
22:         color: onPhoto ? '#FFFFFF' : 'var(--hcp-t-100)',
23:         textTransform: 'uppercase',
24:         lineHeight: 1.2,
25:         marginBottom: 4,
26:         ...(onPhoto && { textShadow: '0 1px 3px rgba(0,0,0,0.55)' }),
27:       }}
28:     >
29:       {label}
30:     </div>
31:   );
32: };
33: 
34: export default CourseEyebrow;
```

#### `src/components/profile/handicap/whs/sections/course-legends/drilldown/DrilldownHeader.tsx`
Exports: DrilldownHeader. Direct module consumers: 1 — `src/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown.tsx`.

```tsx
…
1: import { GAM } from '../../../gam/tokens';
2: import React from 'react';
3: import { Crown } from 'lucide-react';
4: import { CourseEyebrow } from '../_shared/CourseEyebrow';
5: import type { CourseSelection } from '../types';
6: 
7: interface Props {
8:   state: CourseSelection;
9:   youOwnedCount: number;
10:   totalCategories?: number;
11:   /** Course header photo. Null/undefined → renders gradient fallback. */
12:   courseHeaderImage?: string | null;
13:   /** Course Rating (e.g. 69.4). Hidden when null. */
14:   cr?: number | null;
15:   /** Slope rating (e.g. 130). Hidden when null. */
16:   slope?: number | null;
17: }
18: 
19: 
20: export const DrilldownHeader: React.FC<Props> = ({
21:   state,
22:   youOwnedCount,
23:   totalCategories = 6,
24:   courseHeaderImage,
25:   cr = null,
26:   slope = null,
27: }) => (
28: 
29:   <div
30:     className="relative overflow-hidden"
31:     style={{
32:       height: '306px',
33:       fontFamily: GAM.FONT_SF,
34:     }}
35:   >
36:     {/* Gradient fallback behind image — matches GolfClubView */}
37:     <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-green-400 to-blue-500" />
38: 
39:     {courseHeaderImage && (
40:       <img
41:         src={courseHeaderImage}
42:         alt=""
43:         aria-hidden
44:         loading="eager"
45:         className="absolute inset-0 h-full w-full object-cover"
46:         onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
47:       />
48:     )}
49: 
50:     {/* Dark gradient scrim — matches GolfClubView */}
51:     <div
52:       className="absolute inset-0 pointer-events-none"
53:       style={{
54:         background:
55:           'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)',
56:       }}
57:     />
58: 
59:     {/* Titles badge — drilldown-specific, top-right */}
60:     <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
61:       <div
62:         style={{
63:           display: 'inline-flex',
64:           alignItems: 'center',
65:           gap: 5,
66:           padding: '5px 11px',
67:           marginBottom: 6,
68:           borderRadius: 999,
69:           background: 'rgba(0,0,0,0.45)',
70:           border: '1px solid rgba(255,255,255,0.12)',
71:           backdropFilter: 'blur(8px)',
72:           WebkitBackdropFilter: 'blur(8px)',
73:           fontSize: 11,
74:           fontWeight: 700,
75:           color: '#FFFFFF',
76:           fontVariantNumeric: 'tabular-nums lining-nums',
77:           letterSpacing: '-0.01em',
78:         }}
79:       >
80:         <Crown size={11} strokeWidth={2.4} />
81:         {youOwnedCount}/{totalCategories}
82:       </div>
83:     </div>
84: 
85:     {/* Bottom-left overlay — matches GolfClubView layout */}
86:     <div className="absolute inset-x-0 bottom-4 px-4">
87:       <CourseEyebrow
88:         type={state.courseType}
89:         region={state.courseRegion}
90:         country={state.courseCountry}
91:         onPhoto
92:       />
93:       <h1
94:         className="text-[22px] md:text-[28px] font-bold tracking-[-0.3px] text-white drop-shadow-2xl"
95:         style={{ lineHeight: 1.15, marginBottom: 6 }}
96:       >
97:         {state.courseName}
98:       </h1>
99:       {(cr != null || slope != null) && (
100:         <p
101:           className="drop-shadow-lg"
102:           style={{
103:             fontSize: 11,
104:             fontWeight: 700,
105:             letterSpacing: '0.08em',
106:             color: 'rgba(255,255,255,0.65)',
107:             fontVariantNumeric: 'tabular-nums lining-nums',
108:             margin: 0,
109:           }}
110:         >
111:           {[cr != null ? `CR ${cr}` : null, slope != null ? `SLOPE ${slope}` : null].filter(Boolean).join(' · ')}
112:         </p>
113:       )}
114:     </div>
115:   </div>
116: );
117: 
```

#### `src/components/profile/handicap/whs/sections/invite-to-clbhouz/SentInvitesSheet.tsx`
Exports: SentInvitesSheet, default. Direct module consumers: 1 — `src/components/profile/handicap/whs/sections/invite-to-clbhouz/InviteToClbhouzV2.tsx`.

```tsx
…
26: const TITLE_ID = 'sent-invites-title';
27: 
28: const GroupKicker: React.FC<{ children: React.ReactNode }> = ({ children }) => (
29:   <div style={{ ...LABEL, fontFamily: REC.FONT, padding: '16px 16px 8px' }}>{children}</div>
30: );
31: 
…
60:             margin: 0,
61:             fontFamily: REC.FONT,
62:             fontSize: 13.5,
63:             fontWeight: 700,
64:             color: REC.INK,
65:             whiteSpace: 'nowrap',
66:             overflow: 'hidden',
67:             textOverflow: 'ellipsis',
…
85:         </div>
86:       </div>
87:       <span style={{ ...LABEL, fontFamily: REC.FONT, color: statusColor, flexShrink: 0 }}>
88:         {statusLabel}
89:       </span>
90:     </div>
…
108: };
109: 
110: export const SentInvitesSheet: React.FC<Props> = ({ open, onClose }) => {
111:   const { t } = useTranslation('handicap');
112:   const { data: invites, isLoading } = useSentInvites();
113: 
…
125:   const statusFor = (invite: WhsInviteStatus) => {
126:     if (invite.status === 'redeemed') {
127:       return { label: t('invites.status.joined'), color: REC.GOOD };
128:     }
129:     if (invite.status === 'expired') {
130:       return { label: t('invites.status.expired'), color: REC.DIM };
131:     }
132:     return { label: formatRelativeAgoLong(invite.sent_at), color: REC.MUTE };
133:   };
134: 
135:   const renderGroup = (
…
192:       >
193:         <div style={{ ...KICKER, fontFamily: REC.FONT }}>{t('invites.kicker')}</div>
194:         <h2
195:           id={TITLE_ID}
196:           style={{
197:             margin: '6px 0 0',
198:             fontFamily: REC.FONT,
199:             fontSize: 17,
200:             fontWeight: 700,
201:             letterSpacing: '-0.02em',
202:             color: REC.INK,
203:             ...REC.TABULAR,
204:           }}
205:         >
…
254: };
255: 
256: export default SentInvitesSheet;
```

#### `src/components/profile/handicap/whs/sections/round-detail/roundDateEyebrow.ts`
Exports: fmtDateEyebrow, fmtDateLong. Direct module consumers: 2 — `src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx`, `src/features/courses/_shared/scorecard/RoundPagePreview.tsx`.

```tsx
…
1: /**
2:  * THE ROUND'S DATE LINE, in one place.
3:  *
4:  * Extracted from RoundDetailSheet unchanged so the swipe preview prints the
5:  * date exactly as the sheet does (BRIEF_ROUND_SHEET_PEEK §1) — a second copy
6:  * would be a second format the moment either was touched.
7:  *
8:  * Two named formats live here, and only here:
9:  *  - fmtDateEyebrow — short caps ("FRI, 2 OCT") for the TOUR eyebrow (KICKER,
10:  *    nowrap 252px at 390pt; the long form clips there).
11:  *  - fmtDateLong — the locale's long date, weekday, no year ("Friday 2 October")
12:  *    for the MEMBER place line. No ordinal: Intl has none, and composing one
13:  *    is English sentence structure.
14:  */
15: 
16: import { formatWeekdayShortGB, formatMonthShortGB } from '@/i18n/format';
17: 
18: export function fmtDateEyebrow(iso: string | null | undefined): string {
19:   if (!iso) return '';
20:   const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
21:   const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
22:   if (isNaN(d.getTime())) return '';
23:   const dow = formatWeekdayShortGB(d).toUpperCase();
24:   const day = d.getDate();
25:   const mon = formatMonthShortGB(d).toUpperCase();
26:   return `${dow}, ${day} ${mon}`;
27: }
28: 
29: /** fmtDateLong lives in @/i18n/format (shared with Explore's featured round). */
30: export { fmtDateLong } from '@/i18n/format';
```

#### `src/components/security/SecurityHeaders.tsx`
Exports: SecurityHeaders, default. Direct module consumers: 1 — `src/App.tsx`.

```tsx
…
1: export function SecurityHeaders() {
2:   return null;
3: }
4: export default SecurityHeaders;
```

#### `src/components/ui/DiscoverSectionHeading.tsx`
Exports: DiscoverSectionHeading. Direct module consumers: 7 — `src/components/courses/ReviewFeaturedSlot.tsx`, `src/components/courses/course-detail/about/AboutSection.tsx`, `src/components/explore-tab-new/GalleryTab.tsx`, `src/components/explore-tab-new/NewsTabPage.tsx`, `src/components/explore-tab-new/courseled/CoursesPlayedSeeAllSheet.tsx`, `src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx`, `src/features/tourhub/news/StoryShapes.tsx`.

```tsx
…
1: import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
2: import { formatNumber } from '@/i18n/format';
3: 
4: /**
5:  * ONE SECTION HEADING FOR DISCOVER (BRIEF_DISCOVER_SECTION_HEADS_SENTENCE_CASE).
6:  *
7:  * Scores, News and Watch each had their own treatment; this is the single one.
8:  * A sports app sets its section heads as HEADINGS — 16 / 700 / sentence case —
9:  * rather than tracked-out small caps, which read as instrument panel.
10:  *
11:  * It lives in components/ui because all three Discover tabs plus the SHARED
12:  * StoryChipRail (which also serves Tour Hub) must reach it, so it cannot sit
13:  * inside any one tab's directory.
14:  *
15:  * RULES: no weight above 700, no textTransform, never amber. The right slot is
16:  * genuinely absent when no string is passed — News renders no empty space.
17:  */
18: 
19: /** Groups every digit run through the app's one number formatter, so "3520 rounds" reads "3,520 rounds". */
20: function withSeparators(text: string): string {
21:   return text.replace(/\d+/g, (digits) => formatNumber(Number(digits)));
22: }
23: 
24: interface DiscoverSectionHeadingProps {
25:   title: string;
26:   /** Optional right-hand string — "See all 104", "3,520 rounds". Omit for no slot. */
27:   right?: string | null;
28:   /** When present the right slot is a button. */
29:   onRightPress?: () => void;
30:   /**
31:    * YOU_TAB_THIN_COURSE_1 P5 — opt-in: the title wraps to two lines instead of
32:    * truncating, for headings that carry a long course name. Default is
33:    * unchanged (single line, ellipsis) everywhere else.
34:    */
35:   wrap?: boolean;
36:   id?: string;
37: }
38: 
39: export function DiscoverSectionHeading({ title, right, onRightPress, wrap = false, id }: DiscoverSectionHeadingProps) {
40:   const rightText = right ? withSeparators(right) : null;
41: 
42:   return (
43:     <div
44:       style={{
45:         display: 'flex',
46:         alignItems: 'baseline',
47:         justifyContent: 'space-between',
48:         gap: 12,
49:         marginBottom: 10,
50:         fontFamily: SANS,
51:       }}
52:     >
53:       <h2
54:         id={id}
55:         style={{
56:           minWidth: 0,
57:           margin: 0,
58:           fontSize: 16,
59:           fontWeight: 700,
60:           letterSpacing: '-0.01em',
61:           lineHeight: 1.2,
62:           color: A.INK,
63:           ...(wrap
64:             ? null
65:             : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }),
66:         }}
67:       >
68:         {title}
69:       </h2>
70:       {rightText ? (
71:         onRightPress ? (
72:           <button
73:             type="button"
74:             onClick={onRightPress}
75:             className="tabular-nums lining-nums"
76:             style={{
77:               flexShrink: 0,
78:               padding: 0,
79:               border: 0,
80:               background: 'transparent',
81:               fontFamily: SANS,
82:               fontSize: 11,
83:               fontWeight: 700,
84:               color: A.MUTE,
85:               whiteSpace: 'nowrap',
86:               cursor: 'pointer',
87:             }}
88:           >
89:             {rightText}
90:           </button>
91:         ) : (
92:           <span
93:             className="tabular-nums lining-nums"
94:             style={{
95:               flexShrink: 0,
96:               fontSize: 11,
97:               fontWeight: 700,
98:               color: A.MUTE,
99:               whiteSpace: 'nowrap',
100:             }}
101:           >
102:             {rightText}
103:           </span>
104:         )
105:       ) : null}
106:     </div>
107:   );
108: }
```

#### `src/components/ui/SectionHeader.tsx`
Exports: SectionHeader, default. Direct module consumers: 15.

```tsx
…
31: };
32: 
33: const EYEBROW_TONE: Record<EyebrowTone, string> = {
34:   slate: A.MUTE,
35:   amber: A.AMBER,
36:   danger: BAND_RED_DARK,
…
101:         gap: 2,
102:         fontFamily: SF_STACK,
103:         fontSize: 13,
104:         fontWeight: 700,
105:         color,
106:         background: 'transparent',
107:         border: 0,
…
122:       style={{
123:         fontFamily: SF_STACK,
124:         fontSize: 10,
125:         fontWeight: 700,
126:         letterSpacing: '0.12em',
127:         textTransform: 'uppercase',
128:         color: 'var(--hcp-t-40, rgba(248,250,252,0.62))',
129:         fontVariantNumeric: 'tabular-nums',
130:         fontFeatureSettings: '"kern" 1, "liga" 1',
131:         whiteSpace: 'nowrap',
…
139: 
140: 
141: function SectionHeaderInner(props: SectionHeaderProps) {
142:   const {
143:     tier: tierProp,
144:     role: roleProp,
…
182:         }}
183:       >
184:         <h3
185:           style={{
186:             margin: 0,
187:             fontFamily: SF_STACK,
188:             fontSize: 19,
189:             fontWeight: 700,
190:             letterSpacing: '-0.01em',
191:             color: titleColor,
192:           }}
193:         >
194:           {title}
…
205:   const cutWidth = isPrime ? 34 : 22;
206:   const cutHeight = isPrime ? 3 : 2;
207:   const defaultEyebrowColor = isPrime
208:     ? A.AMBER
209:     : isDark
210:       ? 'var(--hcp-t-60)'
…
213:   const cutColor = accent ?? A.AMBER;
214: 
215:   const hasTitle = Boolean(title);
216: 
217:   return (
218:     <div className={className} style={{ ...pad, marginBottom: 14 }}>
…
233:               gap: 6,
234:               fontFamily: SF_STACK,
235:               fontSize: 11,
236:               fontWeight: 700,
237:               letterSpacing: '0.14em',
238:               textTransform: 'uppercase',
239:               color: eyebrowColor,
240:               fontFeatureSettings: '"kern" 1, "liga" 1',
241:             }}
242:           >
…
246:             {kicker}
247:             {required && (
248:               <span aria-hidden="true" style={{ color: A.AMBER, marginLeft: 3, letterSpacing: 0 }}>
249:                 *
250:               </span>
251:             )}
…
255:                   marginLeft: 8,
256:                   fontFamily: SF_STACK,
257:                   fontSize: 11,
258:                   fontWeight: 700,
259:                   color: A.MUTE,
260:                   fontVariantNumeric: 'tabular-nums',
261:                   letterSpacing: 0,
262:                 }}
263:               >
264:                 {formatNumber(count)}
…
279:           }}
280:         >
281:           <h2
282:             style={{
283:               margin: 0,
284:               fontFamily: SF_STACK,
285:               fontSize: titleSize,
286:               fontWeight: 700,
287:               letterSpacing: titleTracking,
288:               color: titleColor,
289:               lineHeight: 1.15,
290:             }}
291:           >
292:             {title}
…
314:             margin: '8px 0 0 0',
315:             fontFamily: SF_STACK,
316:             fontSize: 13,
317:             fontWeight: 500,
318:             color: subColor,
319:             lineHeight: 1.4,
320:           }}
321:         >
322:           {sub}
…
327: }
328: 
329: export const SectionHeader = memo(SectionHeaderInner);
330: export default SectionHeader;
```

#### `src/components/ui/SheetHeader.tsx`
Exports: SheetHeader, default. Direct module consumers: 7 — `src/components/moderation/ReportSheet.tsx`, `src/components/profile/handicap/whs/sections/friends-leaderboard-v2/FullLeaderboardSheet.tsx`, `src/components/profile/handicap/whs/sections/recently-played/FriendsRoundsSheet.tsx`, `src/features/tourhub/components/TourPickerSheet.tsx`, `src/pages/messaging-v2/ConversationRow.tsx`, `src/pages/messaging-v2/ConversationSettingsSheet.tsx`, `src/pages/messaging-v2/NewConversationSheet.tsx`.

```tsx
…
1: import React from 'react';
2: import { X } from 'lucide-react';
3: import { useTranslation } from 'react-i18next';
4: import { KICKER, TITLE, BODY } from '@/lib/tokens/type';
5: 
6: 
7: const FONT_SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
8: 
9: interface SheetHeaderProps {
10:   /** Caps eyebrow above the title. Optional — omit for sheets with no eyebrow context. */
11:   eyebrow?: string;
12:   /** Sheet title — the main identity moment. */
13:   title: React.ReactNode;
14:   /** Optional subhead below the title. */
15:   sub?: React.ReactNode;
16:   /** Click handler for the X close button. */
17:   onClose: () => void;
18:   /** Optional accessible label for the close button. Defaults to "Close". */
19:   closeAriaLabel?: string;
20:   /** Whether to render a bottom border separating the header from body content. Defaults to true. */
21:   borderBottom?: boolean;
22:   /** When true, flips colours for dark-scope contexts (handicap dashboard). */
23:   dark?: boolean;
24: }
25: 
26: /**
27:  * Canonical sheet header for bottom sheets across the app.
28:  */
29: export const SheetHeader: React.FC<SheetHeaderProps> = ({
30:   eyebrow,
31:   title,
32:   sub,
33:   onClose,
34:   closeAriaLabel,
35:   borderBottom = true,
36:   dark = false,
37: }) => {
38:   const { t } = useTranslation('common');
39:   const resolvedCloseLabel = closeAriaLabel ?? t('action.close');
40:   // Literal dark handicap tokens — sheets portal outside `.hcp-dark`, so
41:   // `var(--hcp-*)` resolves to nothing. Values copied from handicap-dark.css.
42:   const titleColor = dark ? 'rgba(255,255,255,0.96)' : '#0F172A';
43:   const eyebrowColor = dark ? 'rgba(255,255,255,0.55)' : '#64748B';
44:   const subColor = dark ? 'rgba(255,255,255,0.55)' : '#64748B';
45:   const borderColor = dark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)';
46:   const closeBg = dark ? '#272C37' : 'rgba(15,23,42,0.06)';
47:   const closeColor = dark ? 'rgba(255,255,255,0.96)' : '#0F172A';
48: 
49:   return (
50:     <div
51:       style={{
52:         display: 'flex',
53:         alignItems: 'flex-start',
54:         justifyContent: 'space-between',
55:         gap: 12,
56:         padding: '8px 16px 14px',
57:         borderBottom: borderBottom ? `0.5px solid ${borderColor}` : 'none',
58:         flexShrink: 0,
59:       }}
60:     >
61:       <div style={{ flex: 1, minWidth: 0 }}>
62:         {eyebrow && (
63:           <div style={{ marginBottom: 6 }}>
64:             <span
65:               style={{
66:                 fontFamily: FONT_SANS,
67:                 ...KICKER,
68:                 color: eyebrowColor,
69:               }}
70:             >
71:               {eyebrow}
72:             </span>
73:           </div>
74:         )}
75:         <h2
76:           style={{
77:             fontFamily: FONT_SANS,
78:             ...TITLE,
79:             color: titleColor,
80:             lineHeight: 1.15,
81:             margin: 0,
82:           }}
83:         >
84:           {title}
85:         </h2>
86:         {sub && (
87:           <p
88:             style={{
89:               fontFamily: FONT_SANS,
90:               ...BODY,
91:               color: subColor,
92:               lineHeight: 1.4,
93:               margin: '6px 0 0',
94:             }}
95:           >
96: 
97:             {sub}
98:           </p>
99:         )}
100:       </div>
101:       <button
102:         onClick={onClose}
103:         aria-label={resolvedCloseLabel}
104:         style={{
105:           flexShrink: 0,
106:           width: 30,
107:           height: 30,
108:           borderRadius: '50%',
109:           background: closeBg,
110:           border: 'none',
111:           display: 'flex',
112:           alignItems: 'center',
113:           justifyContent: 'center',
114:           cursor: 'pointer',
115:           padding: 0,
116:           color: closeColor,
117:         }}
118:       >
119:         <X size={15} strokeWidth={2.4} />
120:       </button>
121:     </div>
122:   );
123: };
124: 
125: export default SheetHeader;
```

#### `src/components/ui/alert-dialog.tsx`
Exports: AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel. Direct module consumers: 13.

```tsx
…
1: import * as React from "react"
2: import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
3: 
4: import { cn } from "@/lib/utils"
5: import { buttonVariants } from "@/components/ui/button"
6: 
7: const AlertDialog = AlertDialogPrimitive.Root
8: 
9: const AlertDialogTrigger = AlertDialogPrimitive.Trigger
10: 
11: const AlertDialogPortal = AlertDialogPrimitive.Portal
12: 
13: const AlertDialogOverlay = React.forwardRef<
14:   React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
15:   React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
16: >(({ className, ...props }, ref) => (
17:   <AlertDialogPrimitive.Overlay
18:     className={cn(
19:       "fixed inset-0 z-[200] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
20:       className
21:     )}
22:     {...props}
23:     ref={ref}
24:   />
25: ))
26: AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName
27: 
28: interface AlertDialogContentProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
29:   overlayClassName?: string;
30: }
31: 
32: const AlertDialogContent = React.forwardRef<
33:   React.ElementRef<typeof AlertDialogPrimitive.Content>,
34:   AlertDialogContentProps
35: >(({ className, overlayClassName, ...props }, ref) => (
36:   <AlertDialogPortal>
37:     <AlertDialogOverlay className={overlayClassName} />
38:     <AlertDialogPrimitive.Content
39:       ref={ref}
40:       className={cn(
41:         "fixed left-[50%] top-[50%] z-[201] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-sq-lg",
42:         className
43:       )}
44:       {...props}
45:     />
46:   </AlertDialogPortal>
47: ))
48: AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName
49: 
50: const AlertDialogHeader = ({
51:   className,
52:   ...props
53: }: React.HTMLAttributes<HTMLDivElement>) => (
54:   <div
55:     className={cn(
56:       "flex flex-col space-y-2 text-center sm:text-left",
57:       className
58:     )}
59:     {...props}
60:   />
61: )
62: AlertDialogHeader.displayName = "AlertDialogHeader"
63: 
64: const AlertDialogFooter = ({
65:   className,
66:   ...props
67: }: React.HTMLAttributes<HTMLDivElement>) => (
68:   <div
69:     className={cn(
70:       "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
71:       className
72:     )}
73:     {...props}
74:   />
75: )
76: AlertDialogFooter.displayName = "AlertDialogFooter"
77: 
78: const AlertDialogTitle = React.forwardRef<
79:   React.ElementRef<typeof AlertDialogPrimitive.Title>,
80:   React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
81: >(({ className, ...props }, ref) => (
82:   <AlertDialogPrimitive.Title
83:     ref={ref}
84:     className={cn("text-lg font-semibold", className)}
85:     {...props}
86:   />
87: ))
88: AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName
89: 
90: const AlertDialogDescription = React.forwardRef<
91:   React.ElementRef<typeof AlertDialogPrimitive.Description>,
92:   React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
93: >(({ className, ...props }, ref) => (
94:   <AlertDialogPrimitive.Description
95:     ref={ref}
96:     className={cn("text-sm text-muted-foreground", className)}
97:     {...props}
98:   />
99: ))
100: AlertDialogDescription.displayName =
101:   AlertDialogPrimitive.Description.displayName
102: 
103: const AlertDialogAction = React.forwardRef<
104:   React.ElementRef<typeof AlertDialogPrimitive.Action>,
105:   React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
106: >(({ className, ...props }, ref) => (
107:   <AlertDialogPrimitive.Action
108:     ref={ref}
109:     className={cn(buttonVariants(), className)}
110:     {...props}
111:   />
112: ))
113: AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName
114: 
115: const AlertDialogCancel = React.forwardRef<
116:   React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
117:   React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
118: >(({ className, ...props }, ref) => (
119:   <AlertDialogPrimitive.Cancel
120:     ref={ref}
121:     className={cn(
122:       buttonVariants({ variant: "outline" }),
123:       "mt-2 sm:mt-0",
124:       className
125:     )}
126:     {...props}
127:   />
128: ))
129: AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName
130: 
131: export {
132:   AlertDialog,
133:   AlertDialogPortal,
134:   AlertDialogOverlay,
135:   AlertDialogTrigger,
136:   AlertDialogContent,
137:   AlertDialogHeader,
138:   AlertDialogFooter,
139:   AlertDialogTitle,
140:   AlertDialogDescription,
141:   AlertDialogAction,
142:   AlertDialogCancel,
143: }
```

#### `src/components/ui/dialog.tsx`
Exports: Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription. Direct module consumers: 12.

```tsx
…
1: 
2: import * as React from "react"
3: import * as DialogPrimitive from "@radix-ui/react-dialog"
4: import { X } from "lucide-react"
5: 
6: import { cn } from "@/lib/utils"
7: 
8: const Dialog = DialogPrimitive.Root
9: 
10: const DialogTrigger = DialogPrimitive.Trigger
11: 
12: const DialogPortal = DialogPrimitive.Portal
13: 
14: const DialogClose = DialogPrimitive.Close
15: 
16: const DialogOverlay = React.forwardRef<
17:   React.ElementRef<typeof DialogPrimitive.Overlay>,
18:   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
19: >(({ className, ...props }, ref) => (
20:   <DialogPrimitive.Overlay
21:     ref={ref}
22:     className={cn(
23:       "fixed inset-0 z-50 bg-black/80 transition-opacity duration-motion-medium ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
24:       className
25:     )}
26:     {...props}
27:   />
28: ))
29: DialogOverlay.displayName = DialogPrimitive.Overlay.displayName
30: 
31: const DialogContent = React.forwardRef<
32:   React.ElementRef<typeof DialogPrimitive.Content>,
33:   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
34: >(({ className, children, ...props }, ref) => (
35:   <DialogPortal>
36:     <DialogOverlay />
37:     <DialogPrimitive.Content
38:       ref={ref}
39:       className={cn(
40:         "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/10 bg-card p-6 text-card-foreground shadow-lg transition-all duration-motion-medium ease-standard",
41:         "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
42:         className
43:       )}
44:       {...props}
45:     >
46:       {children}
47:     </DialogPrimitive.Content>
48:   </DialogPortal>
49: ))
50: DialogContent.displayName = DialogPrimitive.Content.displayName
51: 
52: const DialogHeader = ({
53:   className,
54:   ...props
55: }: React.HTMLAttributes<HTMLDivElement>) => (
56:   <div
57:     className={cn(
58:       "flex flex-col space-y-1.5 text-center sm:text-left",
59:       className
60:     )}
61:     {...props}
62:   />
63: )
64: DialogHeader.displayName = "DialogHeader"
65: 
66: const DialogFooter = ({
67:   className,
68:   ...props
69: }: React.HTMLAttributes<HTMLDivElement>) => (
70:   <div
71:     className={cn(
72:       "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
73:       className
74:     )}
75:     {...props}
76:   />
77: )
78: DialogFooter.displayName = "DialogFooter"
79: 
80: const DialogTitle = React.forwardRef<
81:   React.ElementRef<typeof DialogPrimitive.Title>,
82:   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
83: >(({ className, ...props }, ref) => (
84:   <DialogPrimitive.Title
85:     ref={ref}
86:     className={cn(
87:       "text-lg font-semibold leading-none tracking-tight",
88:       className
89:     )}
90:     {...props}
91:   />
92: ))
93: DialogTitle.displayName = DialogPrimitive.Title.displayName
94: 
95: const DialogDescription = React.forwardRef<
96:   React.ElementRef<typeof DialogPrimitive.Description>,
97:   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
98: >(({ className, ...props }, ref) => (
99:   <DialogPrimitive.Description
100:     ref={ref}
101:     className={cn("text-sm text-muted-foreground", className)}
102:     {...props}
103:   />
104: ))
105: DialogDescription.displayName = DialogPrimitive.Description.displayName
106: 
107: export {
108:   Dialog,
109:   DialogPortal,
110:   DialogOverlay,
111:   DialogClose,
112:   DialogTrigger,
113:   DialogContent,
114:   DialogHeader,
115:   DialogFooter,
116:   DialogTitle,
117:   DialogDescription,
118: }
```

#### `src/components/ui/drawer.tsx`
Exports: Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription. Direct module consumers: 0.

```tsx
…
1: import * as React from "react"
2: import { Drawer as DrawerPrimitive } from "vaul"
3: 
4: import { cn } from "@/lib/utils"
5: 
6: const Drawer = ({
7:   shouldScaleBackground = true,
8:   ...props
9: }: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
10:   <DrawerPrimitive.Root
11:     shouldScaleBackground={shouldScaleBackground}
12:     {...props}
13:   />
14: )
15: Drawer.displayName = "Drawer"
16: 
17: const DrawerTrigger = DrawerPrimitive.Trigger
18: 
19: const DrawerPortal = DrawerPrimitive.Portal
20: 
21: const DrawerClose = DrawerPrimitive.Close
22: 
23: const DrawerOverlay = React.forwardRef<
24:   React.ElementRef<typeof DrawerPrimitive.Overlay>,
25:   React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
26: >(({ className, ...props }, ref) => (
27:   <DrawerPrimitive.Overlay
28:     ref={ref}
29:     className={cn(
30:       "fixed inset-0 z-[10001] bg-black/40 transition-opacity pointer-events-none data-[state=open]:pointer-events-auto data-[state=closed]:opacity-0",
31:       className
32:     )}
33:     {...props}
34:   />
35: ))
36: DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName
37: 
38: const DrawerContent = React.forwardRef<
39:   React.ElementRef<typeof DrawerPrimitive.Content>,
40:   React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
41: >(({ className, children, ...props }, ref) => (
42:   <DrawerPortal>
43:     <DrawerOverlay />
44:     <DrawerPrimitive.Content
45:       ref={ref}
46:       className={cn(
47:         "fixed inset-x-0 bottom-0 z-[10002] mt-24 flex h-auto flex-col rounded-t-2xl data-[state=closed]:pointer-events-none",
48:         className
49:       )}
50:       style={{
51:         background: 'var(--cm-surface-card)',
52:         paddingBottom: 'env(safe-area-inset-bottom, 16px)',
53:       }}
54:       {...props}
55:     >
56:       {/* Handle - matches Visibility sheet */}
57:       <div className="pt-3 pb-2 flex justify-center">
58:         <div 
59:           className="w-9 h-1 rounded-full bg-muted-foreground/30"
60:         />
61:       </div>
62:       {children}
63:     </DrawerPrimitive.Content>
64:   </DrawerPortal>
65: ))
66: DrawerContent.displayName = "DrawerContent"
67: 
68: const DrawerHeader = ({
69:   className,
70:   ...props
71: }: React.HTMLAttributes<HTMLDivElement>) => (
72:   <div
73:     className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
74:     {...props}
75:   />
76: )
77: DrawerHeader.displayName = "DrawerHeader"
78: 
79: const DrawerFooter = ({
80:   className,
81:   ...props
82: }: React.HTMLAttributes<HTMLDivElement>) => (
83:   <div
84:     className={cn("mt-auto flex flex-col gap-2 p-4", className)}
85:     {...props}
86:   />
87: )
88: DrawerFooter.displayName = "DrawerFooter"
89: 
90: const DrawerTitle = React.forwardRef<
91:   React.ElementRef<typeof DrawerPrimitive.Title>,
92:   React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
93: >(({ className, ...props }, ref) => (
94:   <DrawerPrimitive.Title
95:     ref={ref}
96:     className={cn(
97:       "text-lg font-semibold leading-none tracking-tight",
98:       className
99:     )}
100:     {...props}
101:   />
102: ))
103: DrawerTitle.displayName = DrawerPrimitive.Title.displayName
104: 
105: const DrawerDescription = React.forwardRef<
106:   React.ElementRef<typeof DrawerPrimitive.Description>,
107:   React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
108: >(({ className, ...props }, ref) => (
109:   <DrawerPrimitive.Description
110:     ref={ref}
111:     className={cn("text-sm text-muted-foreground", className)}
112:     {...props}
113:   />
114: ))
115: DrawerDescription.displayName = DrawerPrimitive.Description.displayName
116: 
117: export {
118:   Drawer,
119:   DrawerPortal,
120:   DrawerOverlay,
121:   DrawerTrigger,
122:   DrawerClose,
123:   DrawerContent,
124:   DrawerHeader,
125:   DrawerFooter,
126:   DrawerTitle,
127:   DrawerDescription,
128: }
```

#### `src/components/ui/sheet.tsx`
Exports: Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger. Direct module consumers: 14.

```tsx
…
1: import * as SheetPrimitive from "@radix-ui/react-dialog"
2: import { cva, type VariantProps } from "class-variance-authority"
3: import { X } from "lucide-react"
4: import * as React from "react"
5: 
6: import { cn } from "@/lib/utils"
7: import { audioDuck } from "@/audio/audioDuckStore"
8: 
9: const Sheet = SheetPrimitive.Root
10: 
11: const SheetTrigger = SheetPrimitive.Trigger
12: 
13: const SheetClose = SheetPrimitive.Close
14: 
15: const SheetPortal = SheetPrimitive.Portal
16: 
17: const SheetOverlay = React.forwardRef<
18:   React.ElementRef<typeof SheetPrimitive.Overlay>,
19:   React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
20: >(({ className, ...props }, ref) => (
21:   <SheetPrimitive.Overlay
22:     className={cn(
23:       "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
24:       className
25:     )}
26:     {...props}
27:     ref={ref}
28:   />
29: ))
30: SheetOverlay.displayName = SheetPrimitive.Overlay.displayName
31: 
32: const sheetVariants = cva(
33:   "fixed z-50 gap-4 bg-card text-card-foreground border-border/10 p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-500 data-[state=open]:duration-500",
34:   {
35:     variants: {
36:       side: {
37:         top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
38:         bottom:
39:           "inset-x-0 bottom-0 border-t max-h-[85dvh] overflow-hidden flex flex-col data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
40:         left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
41:         right:
42:           "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
43:       },
44:     },
45:     defaultVariants: {
46:       side: "right",
47:     },
48:   }
49: )
50: 
51: interface SheetContentProps
52:   extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
53:   VariantProps<typeof sheetVariants> {
54:     container?: HTMLElement | null;
55:     hideCloseButton?: boolean;
56:     /**
57:      * Opt-in: silence inline video audio while this sheet is mounted.
58:      * Only "audio-suppressive" surfaces (comment sheets, mention pickers,
59:      * action sheets, share sheets) should set this. Applying it wholesale
60:      * to every shadcn sheet kills audio site-wide because the duck signal
61:      * is a hard override in `VideoEngine.reconcileAudio`.
62:      */
63:     duckAudio?: boolean;
64:   }
65: 
66: const SheetContent = React.forwardRef<
67:   React.ElementRef<typeof SheetPrimitive.Content>,
68:   SheetContentProps
69: >(({ side = "right", className, children, container, hideCloseButton = false, duckAudio = false, ...props }, ref) => {
70:   // Duck inline video audio only when explicitly opted in.
71:   const duckKey = React.useId();
72:   React.useEffect(() => {
73:     if (!duckAudio) return;
74:     const k = `sheet:${duckKey}`;
75:     audioDuck.hold(k);
76:     return () => audioDuck.release(k);
77:   }, [duckAudio, duckKey]);
78:   return (
79:     <SheetPortal container={container}>
80:       <div data-filter-sheet className="fixed inset-0 z-[10050] pointer-events-none" />
81:       <SheetOverlay />
82:       <SheetPrimitive.Content
83:         ref={ref}
84:         className={cn(sheetVariants({ side }), "z-[10050]", className)}
85:         {...props}
86:       >
87:         {children}
88:         {!hideCloseButton && (
89:           <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
90:             <X className="h-4 w-4" />
91:             <span className="sr-only">Close</span>
92:           </SheetPrimitive.Close>
93:         )}
94:       </SheetPrimitive.Content>
95:     </SheetPortal>
96:   )
97: })
98: SheetContent.displayName = SheetPrimitive.Content.displayName
99: 
100: const SheetHeader = ({
101:   className,
102:   ...props
103: }: React.HTMLAttributes<HTMLDivElement>) => (
104:   <div
105:     className={cn(
106:       "flex flex-col space-y-2 text-center sm:text-left",
107:       className
108:     )}
109:     {...props}
110:   />
111: )
112: SheetHeader.displayName = "SheetHeader"
113: 
114: const SheetFooter = ({
115:   className,
116:   ...props
117: }: React.HTMLAttributes<HTMLDivElement>) => (
118:   <div
119:     className={cn(
120:       "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
121:       className
122:     )}
123:     {...props}
124:   />
125: )
126: SheetFooter.displayName = "SheetFooter"
127: 
128: const SheetTitle = React.forwardRef<
129:   React.ElementRef<typeof SheetPrimitive.Title>,
130:   React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
131: >(({ className, ...props }, ref) => (
132:   <SheetPrimitive.Title
133:     ref={ref}
134:     className={cn("text-lg font-semibold text-foreground", className)}
135:     {...props}
136:   />
137: ))
138: SheetTitle.displayName = SheetPrimitive.Title.displayName
139: 
140: const SheetDescription = React.forwardRef<
141:   React.ElementRef<typeof SheetPrimitive.Description>,
142:   React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
143: >(({ className, ...props }, ref) => (
144:   <SheetPrimitive.Description
145:     ref={ref}
146:     className={cn("text-sm text-muted-foreground", className)}
147:     {...props}
148:   />
149: ))
150: SheetDescription.displayName = SheetPrimitive.Description.displayName
151: 
152: export {
153:   Sheet, SheetClose,
154:   SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
155: }
156: 
```

#### `src/components/watch/proshop/Kicker.tsx`
Exports: Kicker. Direct module consumers: 0.

```tsx
…
1: import { memo } from 'react';
2: 
3: interface KickerProps {
4:   children: React.ReactNode;
5:   color?: 'amber' | 'emerald' | 'slate' | 'light';
6: }
7: 
8: // Canonical kickers default to slate-500. amber + emerald variants kept for
9: // intentional tone shifts (e.g. curated hero cards use emerald to signal
10: // curated content). amber kept available for explicit one-off editorial
11: // moments — should be rare. light is for dark mastheads.
12: const COLOR_MAP: Record<NonNullable<KickerProps['color']>, string> = {
13:   amber: '#0E1216',              // ink flip (Aug 2026) — was amber on white
14:   emerald: '#006747',
15:   slate: '#64748B',              // canonical neutral kicker
16:   light: 'rgba(255,255,255,0.55)', // light-on-dark eyebrow for dark mastheads
17: };
18: 
19: /**
20:  * Pro Shop primitive — small uppercase editorial label.
21:  * Sits above section titles to set tone.
22:  */
23: function KickerInner({ children, color = 'slate' }: KickerProps) {
24:   return (
25:     <div
26:       style={{
27:         fontSize: 9,
28:         fontWeight: 700,
29:         letterSpacing: '0.16em',
30:         textTransform: 'uppercase',
31:         color: COLOR_MAP[color],
32:         marginBottom: 4,
33:       }}
34:     >
35:       {children}
36:     </div>
37:   );
38: }
39: 
40: export const Kicker = memo(KickerInner);
```

#### `src/features/activity-v2/ActivityPageV2.tsx`
Exports: ActivityPageV2, default. Direct module consumers: 2 — `src/App.tsx`, `src/routes/chunkLoaders.ts`.

```tsx
…
96:     aria-selected={docked ? active : undefined}
97:     className="shrink-0 inline-flex items-center transition-all active:scale-[0.96]"
98:     style={docked ? { height: 34, padding: '0 13px', borderRadius: 13, border: '1px solid var(--island-back-edge)', color: active ? 'var(--island-back-ink)' : INK_60, fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flex: 'none' } : { ...railChipStyle(active), gap: 6 }}
99:   >
100:     {label}
101:     {typeof count === 'number' && count > 0 && (
…
104:           ...FIGURE,
105:           // READ 11: a chip count is a number a member reads, not a coordinate.
106:           fontSize: 11,
107:           padding: '2px 7px',
108:           borderRadius: 20,
109:           background: AMBER_SOFT,
110:           color: AMBER_DEEP,
111:           lineHeight: 1,
112:         }}
113:       >
114:         {count}
…
119: 
120: // -- Section header (dispatch caps) ------------------------------------
121: const SectionHeader: React.FC<{ label: string; tone?: 'new' | 'date' }> = ({ label, tone = 'date' }) => (
122:   <div
123:     style={{
124:       padding: '18px 18px 8px',
125:       // READ 11 floor (section headers: TODAY / THIS WEEK / EARLIER).
126:       fontSize: 11,
127:       fontWeight: 700,
128:       letterSpacing: '0.14em',
129:       textTransform: 'uppercase',
130:       color: ACT.INK_45,
131:       fontFamily: SF_STACK,
132:     }}
133:   >
…
180: 
181: 
182: export const ActivityPageV2: React.FC = () => {
183:   useHideBottomNav();
184:   // G2F: Activity opts out of the legacy header; the flush left slot reuses
185:   // canonical back chrome while retaining its replace-aware push exit callback.
186:   const titleRef = useRef<HTMLHeadingElement>(null);
187:   const chipsAnchor = useRef<HTMLDivElement>(null);
188:   useIslandBackName('Activity', titleRef);
189: 
…
444:         background: 'transparent',
445:         border: 'none',
446:         color: 'hsl(var(--foreground) / 0.75)',
447:         fontSize: 13,
448:         fontWeight: 700,
449:         cursor: 'pointer',
450:         fontFamily: SF_STACK,
451:       }}
…
483:     return (
484:       <section key={label}>
485:         <SectionHeader label={headerLabel} tone={tone} />
486:         <div>
487:           {segments.map((seg) => {
488:             if (seg.kind === 'row') {
…
548:               alignItems: 'center',
549:               gap: 12,
550:               color: INK_60,
551:               fontSize: 13,
552:             }}
553:           >
554:             <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
555:               Couldn't load your activity
556:             </div>
557:             <button
…
560:               style={{
561:                 background: INK,
562:                 color: PAGE,
563:                 border: 'none',
564:                 borderRadius: 999,
565:                 padding: '8px 16px',
566:                 fontSize: 13,
567:                 fontWeight: 700,
568:                 cursor: 'pointer',
569:                 fontFamily: SF_STACK,
570:               }}
…
576: 
577:         {isEmpty && (
578:           <div style={{ padding: '60px 24px', textAlign: 'center', color: INK_60 }}>
579:             <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginBottom: 6 }}>
580:               {EMPTY_COPY[chip].title}
581:             </div>
582:             {/* Empty-state copy is prose: body 14. */}
583:             <div style={{ fontSize: 14, fontWeight: 500, color: INK_60, lineHeight: 1.4 }}>
584:               {EMPTY_COPY[chip].sub}
585:             </div>
586:           </div>
…
632: };
633: 
634: export default ActivityPageV2;
```

#### `src/features/composer-flow/components/ComposerStepHeader.tsx`
Exports: COMPOSER_HEADER_HEIGHT, default. Direct module consumers: 2 — `src/features/post-v2/StageComposer.tsx`, `src/features/review-v2/components/ReviewScoreHeadings.tsx`.

```tsx
…
1: /**
2:  * ComposerStepHeader — THE ONE HEADER for every step of the unified composer.
3:  *
4:  * The entry sheet is unnumbered. Post displays one step with no counter;
5:  * review displays two steps while its internal wizard numbering stays intact.
6:  * Leading-control ownership stays with each host; numbering is display-only.
7:  *
8:  * LEFT SLOT: × on step 1 (closes the flow), ← on every later step (returns to
9:  * the previous step with state intact). `left="none"` is for a host that
10:  * already owns its own leading control — the review composer's fixed header
11:  * carries the course name, the delete action and the one back/close glyph, and
12:  * two back buttons on one screen would be a worse answer than a counter that
13:  * sits under it.
14:  */
15: import { ArrowLeft, X } from 'lucide-react';
16: import { useTranslation } from 'react-i18next';
17: import { CT } from '@/features/_shared/composerTokens';
18: 
19: export const COMPOSER_HEADER_HEIGHT = 52;
20: 
21: interface Props {
22:   /** 1-based. */
23:   step: number;
24:   /** Displayed total; entry sheet is unnumbered. One hides the counter. */
25:   total: number;
26:   /** Step 1 shows ×; later steps show ←. Ignored when left is 'none'. */
27:   onLeft?: () => void;
28:   /**
29:    * Which leading control to draw. Defaults to the step-derived one: 'close'
30:    * on step 1, 'back' after it. 'none' draws no button at all.
31:    */
32:   left?: 'close' | 'back' | 'none';
33: }
34: 
35: export default function ComposerStepHeader({ step, total, onLeft, left }: Props) {
36:   const { t } = useTranslation('composerFlow');
37:   const resolved = left ?? (step <= 1 ? 'close' : 'back');
38:   const isFirst = resolved === 'close';
39: 
40:   return (
41:     <div>
42:       <div
43:         style={{
44:           height: COMPOSER_HEADER_HEIGHT,
45:           display: 'flex',
46:           alignItems: 'center',
47:           gap: 10,
48:           padding: '0 12px',
49:         }}
50:       >
51:         {resolved !== 'none' && (
52:         <button
53:           type="button"
54:           onClick={onLeft}
55:           aria-label={isFirst ? t('close') : t('back')}
56:           style={{
57:             width: 34,
58:             height: 34,
59:             display: 'grid',
60:             placeItems: 'center',
61:             background: 'transparent',
62:             border: 'none',
63:             padding: 0,
64:             color: CT.ink,
65:             cursor: 'pointer',
66:           }}
67:         >
68:           {isFirst ? <X size={20} strokeWidth={2.2} /> : <ArrowLeft size={20} strokeWidth={2.2} />}
69:         </button>
70:         )}
71:         {total > 1 && <span style={{ fontSize: 12, fontWeight: 700, color: CT.muted }}>
72:           {t('step', { n: step, m: total })}
73:         </span>}
74:       </div>
75: 
76:       {total > 1 && <div
77:         aria-hidden
78:         style={{ display: 'flex', gap: 4, padding: '0 16px 12px' }}
79:       >
80:         {Array.from({ length: total }, (_, i) => (
81:           <span
82:             key={i}
83:             style={{
84:               flex: '1 1 0',
85:               height: 3,
86:               borderRadius: 2,
87:               background: i < step ? CT.ink : CT.track,
88:             }}
89:           />
90:         ))}
91:       </div>}
92:     </div>
93:   );
94: }
```

#### `src/features/courses/components/holes/analytical/tokens.tsx`
Exports: TOPAR_RED, A, SUB_SCORE_GREEN_MIN, courseSubScoreTone, BAR_RADIUS, RAMP, RAMP_TOPAR, RAMP_DIST, DIFFICULTY_RAMP, DIFFICULTY_HARD_HEX, DIFFICULTY_EASY_HEX, difficultyRampStop, difficultyRampColor, rampInk, SANS, FIGS, NUM, LABEL, KICKER, CAPTION, Hairline, TITLE, ToParParts, toParParts, Panel, StatItem, StatRow, Action, EmptyState, BIZ_KICKER, BIZ_LABEL, BIZ_TITLE, BIZ_BODY, bizFigure, BIZ_INSET, BIZ_TRACK_H. Direct module consumers: 334.

```tsx
…
40:  * red serves every golf surface. See BRIEF_UNDER_PAR_RED.
41:  */
42: export const TOPAR_RED = TOPAR_UNDER_DARK;
43: 
44: export const A = {
45:   CANVAS: PAGE_CANVAS,
46:   PANEL: MEMBER_PANEL,
47:   BORDER: 'rgba(255,255,255,0.10)',
…
89:  * Absent scores keep MUTE. The old threshold remains exported for compatibility.
90:  */
91: export const SUB_SCORE_GREEN_MIN = 9;
92: 
93: export function courseSubScoreTone(score: number | null | undefined): string {
94:   return score != null ? A.INK : A.MUTE;
95: }
96: 
97: /** Every analytical bar, track and segment. A measurement, not a pill. */
98: export const BAR_RADIUS = 2;
99: 
100: /**
101:  * NEUTRAL ink ramp for score-distribution bars.
…
107:  * it and that surface was not in scope of the brief.
108:  */
109: export const RAMP = {
110:   birdie: 'rgba(14,18,22,0.10)',
111:   par: 'rgba(14,18,22,0.24)',
112:   bogey: 'rgba(14,18,22,0.44)',
…
124:  * These are distribution/text tones, distinct from the deeper chip-fill ramp.
125:  */
126: export const RAMP_TOPAR = {
127:   birdie: TOPAR_UNDER_DARK,
128:   par: 'rgba(248,250,252,0.42)',
129:   bogey: SC_BOGEY_DARK,
…
140:  * same bar as the under-par red without two reds fighting.
141:  */
142: export const RAMP_DIST = {
143:   eagles: SC_FILL_GOLD,
144:   birdie: RAMP_TOPAR.birdie,
145:   par: RAMP_TOPAR.par,
…
179:    hardest stop is intentionally darker, not brighter: these tones fill bars and
180:    marks and are never used as small text. */
181: export const DIFFICULTY_RAMP = [
182:   'rgba(120,128,140,0.42)', // 0 easiest — slate
183:   '#786F78', // 1
184:   '#8E5F63', // 2
…
188: ] as const;
189: 
190: export const DIFFICULTY_HARD_HEX = DIFFICULTY_RAMP[5];
191: export const DIFFICULTY_EASY_HEX = DIFFICULTY_RAMP[0];
192: 
193: /** Stop by INDEX, clamped. The stepped form callers should prefer. */
194: export function difficultyRampStop(i: number): string {
195:   const k = Math.max(0, Math.min(DIFFICULTY_RAMP.length - 1, Math.round(i)));
196:   return DIFFICULTY_RAMP[k];
197: }
…
201:  * on the course's own spread; the result is always one of the six literals.
202:  */
203: export function difficultyRampColor(t: number): string {
204:   const k = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
205:   return difficultyRampStop(Math.round(k * (DIFFICULTY_RAMP.length - 1)));
206: }
…
229:  * stop can never silently produce an unreadable numeral. Accepts hex or rgb().
230:  */
231: export function rampInk(colour: string): string {
232:   const L = relLuminance(colour);
233:   if (L == null) return A.INK;
234:   const inkL = relLuminance(A.INK) ?? 0;
…
240: 
241: 
242: export const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
243: 
244: /** Tabular figures WITHOUT a monospace face - this is what removes the slash. */
245: export const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };
246: 
247: export const NUM: React.CSSProperties = {
248:   fontFamily: SANS,
249:   letterSpacing: '-0.02em',
250:   fontWeight: 700,
251:   ...FIGS,
252: };
253: 
…
255:  * READ. Floor 11. Repointed 9 -> 11 by BRIEF_ANALYTICAL_SCALE_REPOINT (Part B).
256:  */
257: export const LABEL: React.CSSProperties = {
258:   fontSize: 11,
259:   fontWeight: 700,
260:   letterSpacing: '0.13em',
261:   textTransform: 'uppercase',
262:   color: A.DIM,
263: };
264: 
265: /** READ. Floor 11. Repointed 10 -> 11 by BRIEF_ANALYTICAL_SCALE_REPOINT (Part B). */
…
272:  * The two have NOT been reconciled. Neither value is being changed here.
273:  */
274: export const KICKER: React.CSSProperties = {
275:   fontSize: 11,
276:   fontWeight: 700,
277:   letterSpacing: '0.16em',
278:   textTransform: 'uppercase',
279:   color: A.INK,
280: };
281: 
282: /** Quiet sentence-case caption. Not a figure and not a column label. */
283: /** READ. Repointed 10.5 -> 12 by BRIEF_ANALYTICAL_SCALE_REPOINT (Part B). */
284: export const CAPTION: React.CSSProperties = {
285:   fontSize: 12,
286:   fontWeight: 600,
287:   letterSpacing: '0.01em',
288:   color: A.MUTE,
289: };
290: 
291: /** Horizontal rule; the only divider the analytical treatment allows. */
292: export const Hairline: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
293:   <div style={{ height: 1, background: A.HAIRLINE, ...style }} />
294: );
295: 
…
313:  * real sentence-cased heading path, or rename this token PANEL_LABEL.
314:  */
315: export const TITLE: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: A.INK };
316: 
317: export interface ToParParts { text: string; tone: string }
318: 
319: /**
320:  * Round first, then branch on the rounded value.
…
326:  * connected, errors, rating bands) - only the tone SELECTION moved.
327:  */
328: export function toParParts(v: number | null | undefined, digits = 1): ToParParts | null {
329:   if (v == null || !Number.isFinite(v)) return null;
330:   const f = Math.pow(10, digits);
331:   const r = Math.round(v * f) / f;
…
343:  * four. It has deliberately NOT been repointed or migrated.
344:  */
345: export const Panel: React.FC<{
346:   kicker?: string;
347:   /** Panel-level heading (13/700 INK). Used where a panel titles itself. */
348:   title?: string;
…
384:         }}
385:       >
386:         {kicker && <span style={KICKER}>{kicker}</span>}
387:         {title && !kicker && <span style={TITLE}>{title}</span>}
388:         {aside && !action && <span style={{ ...LABEL, textAlign: 'right' }}>{aside}</span>}
389:         {action && (
390:           <button
…
403:             }}
404:           >
405:             <span style={{ ...LABEL, color: A.INK }}>{action.label}</span>
406:             <span style={{ fontSize: 11, color: A.INK, fontWeight: 700 }} aria-hidden="true">
407:               {'\u203A'}
408:             </span>
409:           </button>
…
415:         style={{
416:           margin: `0 0 ${headerGap}px`,
417:           fontSize: 12.5,
418:           fontWeight: 500,
419:           lineHeight: 1.35,
420:           color: A.MUTE,
421:         }}
422:       >
423:         {subline}
…
445:         }}
446:       >
447:         <span style={{ ...LABEL, color: A.INK }}>{footer}</span>
448:         <span style={{ fontSize: 12, color: A.INK, fontWeight: 700 }} aria-hidden="true">
449:           {'\u203A'}
450:         </span>
451:       </button>
…
454: );
455: 
456: export interface StatItem {
457:   label: string;
458:   value: React.ReactNode;
459:   tone?: string;
…
475:  */
476: const STATROW_LABEL_LH = 1.25;
477: const statRowLabelBox = (fontSize: number, lines: 1 | 2 = 2): React.CSSProperties => ({
478:   lineHeight: STATROW_LABEL_LH,
479:   minHeight: `${fontSize * STATROW_LABEL_LH * lines}px`,
480: });
481: 
482: export const StatRow: React.FC<{
483:   items: StatItem[];
484:   size?: number;
485:   style?: React.CSSProperties;
…
520:           <div
521:             key={`l-${it.label}`}
522:             style={{ ...LABEL, lineHeight: STATROW_LABEL_LH, textAlign: 'center', minWidth: 0, ...noWrap }}
523:           >
524:             {it.label}
525:           </div>
…
530:             style={{
531:               ...NUM,
532:               fontSize: size,
533:               color: it.tone ?? A.INK,
534:               marginTop: 4,
535:               textAlign: 'center',
536:               whiteSpace: 'nowrap',
…
560:         const subStyle: React.CSSProperties =
561:           it.subVariant === 'caption' ? { ...CAPTION } : { ...LABEL };
562:         const subFontSize = (subStyle.fontSize as number) ?? 11;
563:         return (
564:           <div key={it.label} style={{ textAlign: 'center', minWidth: 0 }}>
565:             {/* Reservation keeps every value on one baseline; labels stay top-aligned. */}
566:             <div style={{ ...LABEL, ...statRowLabelBox(LABEL.fontSize as number, labelLines), ...noWrap }}>
567:               {it.label}
568:             </div>
569: 
570:             <div style={{ ...NUM, fontSize: size, color: it.tone ?? A.INK, marginTop: 4, whiteSpace: 'nowrap' }}>
571:               {it.value}
572:             </div>
573:             {anySub ? (
…
576:                   ...subStyle,
577:                   marginTop: 3,
578:                   lineHeight: STATROW_LABEL_LH,
579:                   minHeight: `${subFontSize * STATROW_LABEL_LH}px`,
580:                   ...(it.subTone ? { color: it.subTone } : null),
581:                   overflow: 'hidden',
582:                   textOverflow: 'ellipsis',
583:                   whiteSpace: 'nowrap',
…
600:  * Never a filled pill - the analytical treatment has no tinted buttons.
601:  */
602: export const Action: React.FC<{
603:   label: string;
604:   onClick: () => void;
605:   align?: 'left' | 'center';
…
624:     }}
625:   >
626:     <span style={{ ...LABEL, color: tone }}>{label}</span>
627:     <span style={{ fontSize: 12, color: tone, fontWeight: 700 }} aria-hidden="true">
628:       {'\u203A'}
629:     </span>
630:   </button>
…
639:  * the action is the surface's purpose, and it is INK.
640:  */
641: export const EmptyState: React.FC<{
642:   kicker?: string;
643:   title: string;
644:   body?: string;
…
680:         style={biz
681:           ? BIZ_TITLE
682:           : { fontSize: 16, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}
683:       >
684:         {title}
685:       </div>
…
687:         <p style={biz
688:           ? { ...BIZ_BODY, margin: 0, maxWidth: '34em' }
689:           : { fontSize: 13.5, lineHeight: 1.5, color: A.MUTE, margin: 0, maxWidth: '34em' }}>
690:           {body}
691:         </p>
692:       )}
…
700:             border: 'none',
701:             background: A.INK,
702:             color: A.PANEL,
703:             borderRadius: 999,
704:             padding: biz ? '13px 24px' : '12px 22px',
705:             fontSize: biz ? 14.5 : 13.5,
706:             fontWeight: 700,
707:             letterSpacing: biz ? '-0.01em' : undefined,
708:             fontFamily: SANS,
709:             cursor: 'pointer',
710:           }}
…
716:       {footnote && (
717:         <div style={biz
718:           ? { fontSize: 12, fontWeight: 500, color: A.DIM }
719:           : { fontSize: 12, fontWeight: 600, color: A.DIM }}>{footnote}</div>
720:       )}
721:     </div>
722: 
723:     {guidance && guidance.length > 0 && (
724:       <div style={{ marginTop: biz ? 22 : 18, textAlign: 'left' }}>
725:         {guidanceHeading && <div style={{ ...(biz ? BIZ_LABEL : LABEL), marginBottom: 12 }}>{guidanceHeading}</div>}
726: 
727:         <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
728:           {guidance.map((g) => (
729:             <div key={g.title}>
730:               <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, letterSpacing: biz ? '-0.01em' : undefined }}>{g.title}</div>
731:               <div style={biz
732:                 ? { ...BIZ_BODY, marginTop: 2 }
733:                 : { fontSize: 12.5, lineHeight: 1.45, color: A.MUTE, marginTop: 2 }}>
734:                 {g.body}
735:               </div>
736:             </div>
…
762:    TARGET: do not re-pin either of these below 11. */
763: 
764: export const BIZ_KICKER: React.CSSProperties = {
765:   fontSize: 11,
766:   fontWeight: 700,
767:   letterSpacing: '0.19em',
768:   textTransform: 'uppercase',
769:   color: A.INK,
770: };
771: 
772: export const BIZ_LABEL: React.CSSProperties = {
773:   fontSize: 11,
774:   fontWeight: 700,
775:   letterSpacing: '0.16em',
776:   textTransform: 'uppercase',
777:   color: A.DIM,
778: };
779: 
780: export const BIZ_TITLE: React.CSSProperties = {
781:   fontSize: 17,
782:   fontWeight: 700,
783:   letterSpacing: '-0.032em',
784:   lineHeight: 1.2,
785:   color: A.INK,
786: };
787: 
788: export const BIZ_BODY: React.CSSProperties = {
789:   fontSize: 13,
790:   fontWeight: 400,
791:   lineHeight: 1.55,
792:   color: A.MUTE,
793: };
794: 
795: /** Figures get bigger and TIGHTER, never heavier: 700 with -0.04em. */
796: export const bizFigure = (
797:   fontSize: number,
798:   color: string = A.INK,
799: ): React.CSSProperties => ({
800:   fontSize,
801:   fontWeight: 700,
802:   letterSpacing: '-0.04em',
803:   lineHeight: 1,
804:   color,
805:   ...FIGS,
806:   fontFeatureSettings: '"kern" 1, "liga" 1',
…
808: 
809: /** The one inset every business chart region sits in, populated or not. */
810: export const BIZ_INSET: React.CSSProperties = {
811:   background: A.SOFT,
812:   borderRadius: 13,
813:   border: 'none',
…
815: 
816: /** 5px bar track. Business traffic is neither a score nor a member. */
817: export const BIZ_TRACK_H = 5;
```

#### `src/features/explore-magazine/watch/CourseVideosShelf.tsx`
Exports: __resetCourseShelfViewed, shelfRow, ShelfHeading, DurationChip, CourseVideosShelf, default. Direct module consumers: 5 — `src/features/explore-magazine/watch/CreatorSpotlight.tsx`, `src/features/explore-magazine/watch/CreatorsRow.tsx`, `src/features/explore-magazine/watch/RegionsShelf.tsx`, `src/features/explore-magazine/watch/Top100FilmShelf.tsx`, `src/features/explore-magazine/watch/WatchFeed.tsx`.

```tsx
…
1: /**
2:  * WS2 §3 — FILMED AT YOUR COURSES (signed-off watch-s2 mock A). Videos at courses
3:  * the viewer has played or rated, newest first, from get_watch_course_videos(12).
4:  * Hidden, heading included, under two rows or on error. Tap opens the canonical
5:  * viewer on the tile with this shelf's list. See all → /watch/courses.
6:  */
7: import { useEffect, useRef } from 'react';
8: import { useNavigate } from 'react-router-dom';
9: import { useTranslation } from 'react-i18next';
10: import { MapPin } from 'lucide-react';
11: import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
12: import { shortCourseName } from '@/lib/courses/shortCourseName';
13: import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
14: import { analyticsEvents } from '@/utils/analyticsEvents';
15: import { useCourseVideos } from './useWatchMiddle';
16: import { showsCourseShelf, whoLine } from './watchMiddle';
17: import { openVideoList } from './openVideoList';
18: import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
19: /* WS5: the Shorts tile size (QH_W × QH_H in WatchFeed.tsx) and its badge props.
20:    Literals, not imports: WatchFeed imports this file, so importing back would be circular. */
21: const TILE_W = 156; // = QH_W
22: const TILE_H = 248; // = QH_H
23: const SHELF_BADGE = { placement: 'top-right', top: 6, right: 6 } as const; // = WatchFeed SHELF_BADGE
24: 
25: let viewedThisSession = false;
26: /** Test hook: reset the once-per-session flag. */
27: export function __resetCourseShelfViewed() { viewedThisSession = false; }
28: 
29: export const shelfRow: React.CSSProperties = {
30:   display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none',
31:   overscrollBehaviorX: 'contain', touchAction: 'pan-x pan-y', willChange: 'transform',
32: };
33: 
34: export function ShelfHeading({ title, sub, seeAll, onSeeAll }: { title: string; sub?: string; seeAll?: string; onSeeAll?: () => void }) {
35:   return (
36:     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '28px 16px 10px' }}>
37:       <div>
38:         <b style={{ display: 'block', fontSize: 19, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>{title}</b>
39:         {sub ? <span style={{ display: 'block', fontSize: 12.5, color: A.DIM, marginTop: 2 }}>{sub}</span> : null}
40:       </div>
41:       {onSeeAll ? (
42:         <button type="button" onClick={onSeeAll} style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 14, fontWeight: 600, color: A.MUTE }}>
43:           {seeAll}
44:         </button>
45:       ) : null}
46:     </div>
47:   );
48: }
49: 
50: export function DurationChip({ seconds, top, right, size, bottom }: { seconds: number | null | undefined; top?: number; right: number; size: number; bottom?: number }) {
51:   if (!seconds) return null;
52:   return (
53:     <span data-duration style={{ position: 'absolute', top, bottom, right, zIndex: 1, background: 'rgba(0,0,0,0.62)', borderRadius: 6, padding: '2px 6px', fontSize: size, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: A.INK }}>
54:       {formatDuration(seconds)}
55:     </span>
56:   );
57: }
58: 
59: export function CourseVideosShelf({ userId, onDepart }: { userId: string | null | undefined; onDepart?: () => void }) {
60:   const { t } = useTranslation('courses');
61:   const navigate = useNavigate();
62:   const q = useCourseVideos(userId);
63:   const rows = q.data ?? [];
64:   const ref = useRef<HTMLDivElement | null>(null);
65:   const shown = !!userId && !q.isError && showsCourseShelf(rows.length);
66: 
67:   useEffect(() => {
68:     const el = ref.current;
69:     if (!shown || !el || viewedThisSession || typeof IntersectionObserver === 'undefined') return;
70:     const io = new IntersectionObserver((entries) => {
71:       if (entries.some((e) => e.isIntersecting) && !viewedThisSession) {
72:         viewedThisSession = true;
73:         analyticsEvents.track('watch_course_shelf_viewed', { count: rows.length });
74:         io.disconnect();
75:       }
76:     }, { threshold: 0.5 });
77:     io.observe(el);
78:     return () => io.disconnect();
79:   }, [shown, rows.length]);
80: 
81:   const title = t('amateur.watch.courseShelf.title', 'Filmed at your courses');
82:   const sub = t('amateur.watch.courseShelf.sub', "Courses you've played or rated");
83: 
84:   if (!userId || q.isError) return null;
85:   if (q.isLoading) {
86:     return (
87:       <div data-course-shelf="loading">
88:         <ShelfHeading title={title} sub={sub} />
89:         <div style={shelfRow}>
90:           {[0, 1].map((i) => <div key={i} style={{ flex: 'none', width: TILE_W, height: TILE_H, borderRadius: 12, background: A.PANEL }} />)}
91:         </div>
92:       </div>
93:     );
94:   }
95:   if (!shown) return null;
96: 
97:   return (
98:     <div data-course-shelf="ready" ref={ref}>
99:       <ShelfHeading title={title} sub={sub} seeAll={t('amateur.watch.seeAll', 'See all')} onSeeAll={() => navigate('/watch/courses')} />
100:       <div data-course-shelf-rail style={shelfRow}>
101:         {rows.map((row, i) => (
102:           <button
103:             key={row.post_id}
104:             type="button"
105:             data-course-tile={row.post_id}
106:             onClick={() => { onDepart?.(); openVideoList(rows, i); }}
107:             style={{ flex: 'none', width: TILE_W, height: TILE_H, borderRadius: 12, position: 'relative', overflow: 'hidden', padding: 0, border: 0, background: '#1E1E23', cursor: 'pointer', textAlign: 'left', fontFamily: SANS, color: A.INK }}
108:           >
109:             {row.poster_url || row.media_url ? (
110:               row.poster_url
111:                 ? <img src={row.poster_url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
112:                 : <video src={`${row.media_url}#t=0.1`} muted playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
113:             ) : null}
114:             <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.82))' }} />
115:             <span data-course-badge style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}><GlassDurationBadge seconds={row.duration_seconds ?? null} {...SHELF_BADGE} /></span>
116:             <span style={{ position: 'absolute', left: 10, right: 10, bottom: 10, zIndex: 1 }}>
117:               <span data-course-name style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
118:                 <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} aria-hidden />
119:                 {shortCourseName(row.course_name ?? '')}
120:               </span>
121:               <span data-course-who style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'rgba(248,250,252,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
122:                 {whoLine(row)}
123:               </span>
124:             </span>
125:           </button>
126:         ))}
127:       </div>
128:     </div>
129:   );
130: }
131: 
132: export default CourseVideosShelf;
```

#### `src/features/post-v2/components/BottomSheet.tsx`
Exports: default. Direct module consumers: 15.

```tsx
…
1: // Shared sheet chrome. Bottom sheet with hairline grabber, 17/800 title.
2: // Aligned to messaging-v2 sheet polish.
3: 
4: import { useEffect, useRef } from 'react';
5: import { X } from 'lucide-react';
6: import { pushSheetEntry, releaseSheetEntry } from '@/components/ui/sheetHistory';
7: import { useTranslation } from 'react-i18next';
8: import { Z } from '@/config/zIndex';
9: import { CT } from '@/features/_shared/composerTokens';
10: import { TITLE } from '@/lib/tokens/type';
11: 
12: interface Props {
13:   open: boolean;
14:   title?: string;
15:   onClose: () => void;
16:   children: React.ReactNode;
17:   fullHeight?: boolean;
18:   /** Fixed height (e.g. '75dvh'). Sheet won't grow/shrink with content. */
19:   fixedHeight?: string;
20:   /** Extra bottom padding on the backdrop; lifts the sheet above the iOS keyboard. */
21:   bottomOffset?: number;
22:   /** Opt-in entry-sheet material/geometry; default composer sheets unchanged. */
23:   surfaceClassName?: string;
24: }
25: 
26: export default function BottomSheet({ open, title, onClose, children, fullHeight, fixedHeight, bottomOffset, surfaceClassName }: Props) {
27:   const { t } = useTranslation('common');
28: 
29:   /* BRIEF_SHEET_BACK_BEHAVIOUR §2 — THE SECOND PRIMITIVE.
30:      The post composer does not use ui/BottomSheet; it has its own sheet chrome
31:      (this file), which automatic registration in the shared primitive would
32:      have missed entirely. It registers with the SAME stack, so a composer
33:      stage sheet and a sheet opened over it pop in order. Reported as the one
34:      mounting pattern that defeated a single-primitive default.
35:      NOTE: this primitive still has no escape-key handling — backdrop tap and
36:      the X are its only dismiss paths. Back now joins them, unchanged. */
37:   const closeRef = useRef(onClose);
38:   closeRef.current = onClose;
39:   useEffect(() => {
40:     if (!open) return;
41:     const entry = pushSheetEntry(() => closeRef.current());
42:     return () => releaseSheetEntry(entry);
43:   }, [open]);
44: 
45:   if (!open) return null;
46: 
47:   /* BRIEF_CHOOSE_A_COURSE §B — THE HEAD IS ALWAYS BELOW THE STATUS BAR.
48:      This sheet's height was read straight from `fixedHeight` while the backdrop
49:      was ALSO padded by the keyboard height, so with the keyboard up a 60dvh
50:      sheet was pushed above the top of the screen and its title and close button
51:      rendered under the clock. The height is now capped to what is actually free
52:      between the safe-area inset and the keyboard, so the head stays put and the
53:      body scrolls beneath it. With no keyboard the cap is above every existing
54:      value, so closed-keyboard geometry is unchanged. */
55:   const headroom = `calc(100dvh - max(env(safe-area-inset-top, 0px), 47px) - 12px${bottomOffset ? ` - ${bottomOffset}px` : ''})`;
56:   const cap = (v: string) => `min(${v}, ${headroom})`;
57: 
58:   return (
59:     <div
60:       style={{
61:         position: 'fixed',
62:         inset: 0,
63:         zIndex: Z.sheet ?? 12003,
64:         display: 'flex',
65:         alignItems: 'flex-end',
66:         background: 'linear-gradient(to bottom, rgba(15,17,23,0.62) 0px, rgba(15,17,23,0.45) calc(env(safe-area-inset-top, 47px) + 8px), rgba(15,17,23,0.45) 100%)',
67:         paddingBottom: bottomOffset ? `${bottomOffset}px` : undefined,
68:         transition: 'padding-bottom 180ms cubic-bezier(.2,.8,.2,1)',
69:       }}
70:       onClick={onClose}
71:     >
72:       <div
73:         className={surfaceClassName}
74:         onClick={(e) => e.stopPropagation()}
75:         style={{
76:           width: '100%',
77:           maxHeight: cap(fixedHeight ?? '85dvh'),
78:           height: fixedHeight ? cap(fixedHeight) : (fullHeight ? cap('85dvh') : 'auto'),
79:           background: CT.canvas,
80:           borderTopLeftRadius: 20,
81:           borderTopRightRadius: 20,
82:           display: 'flex',
83:           flexDirection: 'column',
84:           overflow: 'hidden',
85:           boxShadow: '0 -8px 24px rgba(15,17,23,0.18)',
86:           paddingBottom: (fullHeight || fixedHeight) ? undefined : 'env(safe-area-inset-bottom, 0px)',
87:         }}
88:       >
89:         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 4px' }}>
90:           <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.18)' }} />
91:         </div>
92:         {title && (
93:           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px' }}>
94:             <div style={{ ...TITLE, color: CT.ink }}>{title}</div>
95:             <button
96:               onClick={onClose}
97:               aria-label={t('action.close')}
98:               style={{ background: 'transparent', border: 0, color: CT.ink, cursor: 'pointer', padding: 4 }}
99:             >
100:               <X size={20} />
101:             </button>
102:           </div>
103:         )}
104:         <div style={{ flex: (fullHeight || fixedHeight) ? 1 : '0 1 auto', overflow: 'auto', minHeight: 0 }}>{children}</div>
105:       </div>
106:     </div>
107:   );
108: }
```

#### `src/features/pro-profile/ProAskSheets.tsx`
Exports: ProExplainerSheet, ProAskSheet, ProQuestionsSheet, ProAnswerSheet, ProAllAnswersSheet. Direct module consumers: 2 — `src/features/pro-profile/ProAskSection.tsx`, `src/features/pro-profile/ProOwnerSections.tsx`.

```tsx
…
15: import { answerFooter, askerLabel, inboxTime, type ProInboxRow } from './proAskRules';
16: 
17: const Kicker = ({ first }: { first: string }) => <div className="pro-collection-kicker">ASK {first.toUpperCase()}</div>;
18: 
19: const EXPLAINER_STEPS: [string, string][] = [
20:   ['Members ask you questions', "About your practice, your kit, life on tour, anything. Up to 200 characters, so they're quick to read."],
…
25: ];
26: 
27: export function ProExplainerSheet({ userId, first, close }: { userId: string; first: string; close: () => void }) {
28:   const [busy, setBusy] = useState(false);
29:   const cache = useQueryClient();
30:   const turnOn = async () => {
…
44:       <div className="pro-profile pro-profile-sheet pro-ask-sheet">
45:         <Kicker first={first} />
46:         <h2 id="pro-ask-title">Answer questions from members</h2>
47:         <div className="pro-ask-how">
48:           {EXPLAINER_STEPS.map(([title, text], i) => (
49:             <div key={title}><i>{i + 1}</i><p><b>{title}</b><span>{text}</span></p></div>
…
65: }
66: 
67: export function ProAskSheet({ proId, first, viewerId, close }: { proId: string; first: string; viewerId?: string; close: () => void }) {
68:   const [text, setText] = useState('');
69:   const [busy, setBusy] = useState(false);
70:   const write = useProAskWrite(proId);
…
84:       <div className="pro-profile pro-profile-sheet pro-ask-sheet">
85:         <Kicker first={first} />
86:         <h2 id="pro-ask-title">Ask a question</h2>
87:         <Textarea
88:           className="pro-ask-ta"
89:           aria-label="Your question"
…
101: }
102: 
103: export function ProQuestionsSheet({ proId, first, close }: { proId: string; first: string; close: () => void }) {
104:   const [tab, setTab] = useState<'waiting' | 'answered'>('waiting');
105:   const [answerFor, setAnswerFor] = useState<ProInboxRow | null>(null);
106:   const [busyId, setBusyId] = useState<string | null>(null);
…
134:       <div className="pro-profile pro-profile-sheet pro-ask-sheet">
135:         <Kicker first={first} />
136:         <h2 id="pro-ask-title">Questions for you</h2>
137:         <div className="pro-ask-seg" role="tablist">
138:           <Button variant={null} size={null} role="tab" aria-selected={tab === 'waiting'} className={tab === 'waiting' ? 'on' : ''} onClick={() => setTab('waiting')}>Waiting · {waiting.isSuccess ? waiting.data.length : 0}</Button>
139:           <Button variant={null} size={null} role="tab" aria-selected={tab === 'answered'} className={tab === 'answered' ? 'on' : ''} onClick={() => setTab('answered')}>Answered · {answeredTotal}</Button>
…
176: }
177: 
178: export function ProAnswerSheet({ proId, first, row, close }: { proId: string; first: string; row: ProInboxRow; close: () => void }) {
179:   const editing = !!row.answer;
180:   const [text, setText] = useState(row.answer ?? '');
181:   const [busy, setBusy] = useState(false);
…
192:       <div className="pro-profile pro-profile-sheet pro-ask-sheet">
193:         <Kicker first={first} />
194:         <h2 id="pro-answer-title">Your answer</h2>
195:         <div className="pro-ask-quote">
196:           <b>{row.question}</b>
197:           <small>{[row.asker_name, row.asker_club].filter(Boolean).join(' · ')}</small>
…
217: }
218: 
219: export function ProAllAnswersSheet({ proId, first, owner, close }: { proId: string; first: string; owner: boolean; close: () => void }) {
220:   const [offset, setOffset] = useState(0);
221:   const query = useProAnswers(proId, 20, offset);
222:   const data = query.isSuccess && !query.isError ? query.data : null;
…
225:       <div className="pro-profile pro-profile-sheet pro-ask-sheet">
226:         <Kicker first={first} />
227:         <h2 id="pro-ask-title">Answers</h2>
228:         <div className="pro-ask-list">
229:           {data?.answers.map((a) => (
230:             <div className="pro-ask-q" key={a.id}>
```

#### `src/features/review-v2/components/ReviewComposerHeader.tsx`
Exports: ReviewComposerHeader. Direct module consumers: 1 — `src/features/review-v2/ReviewComposerV2.tsx`.

```tsx
…
43: 
44: /** The reference line's " · " separator, drawn as CourseTitleOverlay draws it. */
45: const RefSep = () => <span style={{ fontWeight: 500, color: SURFACE.dark.dim }}>{' · '}</span>;
46: 
47: function PhotoHero({
48:   courseId, courseRegion, subCountry, country, name, thumbnail, facts, backLabel, glyph, onBack,
…
69:   return (
70:     <ReviewCourseHero courseId={courseId} courseRegion={courseRegion} subCountry={subCountry} country={country} name={name} thumbnail={thumbnail} reference={hasReference ? (
71:       <div data-header-reference className="tabular-nums lining-nums" style={{ fontSize: 13, fontWeight: 600, color: SURFACE.dark.body }}>
72:         {score && <><b style={{ fontWeight: 700, color: '#F8FAFC' }}>{score.avg}</b> {fromMembers}{refParts.length > 0 && <RefSep />}</>}
73:         {refParts.map((part, i) => <Fragment key={i}>{i > 0 && <RefSep />}{part}</Fragment>)}
74:       </div>
75:     ) : null}>
…
81:           position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 6px)', left: 14,
82:           width: 36, height: 36, borderRadius: 999, border: 'none', background: 'var(--review-header-back)',
83:           color: RV2.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
84:           fontSize: 21, lineHeight: 1, cursor: 'pointer',
85:         }}
86:       >
87:         {glyph}
…
91: }
92: 
93: export const ReviewComposerHeader = forwardRef<HTMLElement, Props>(function ReviewComposerHeader(
94:   { form, name, region, thumbnail, facts, courseId, courseRegion, subCountry, country, leadingIsClose, onBack, isEditMode, onDelete },
95:   ref,
96: ) {
…
146:                   width: 36, height: 36, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.07)',
147:                   display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
148:                   fontSize: 21, lineHeight: 1, color: RV2.ink,
149:                 }}
150:               >
151:                 {glyph}
…
153:             </span>
154:             <div style={{ flex: 1, minWidth: 0 }}>
155:               <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em', color: RV2.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
156:                 {name}
157:               </div>
158:               <div data-compact-meta style={{ fontSize: 12, color: RV2.secondary }}>
159:                 {score ? `${region} · ${score.avg} ${fromMembers}` : region}
160:               </div>
161:             </div>
…
165:                 onClick={onDelete}
166:                 aria-label={t('review.wizard.deleteA11y')}
167:                 style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: RV2.danger }}
168:               >
169:                 <Trash2 size={16} />
170:               </button>
```

#### `src/features/review-v2/components/ReviewScoreHeadings.tsx`
Exports: ReviewStepHeading, ReviewCategoriesHeading. Direct module consumers: 1 — `src/features/review-v2/ReviewComposerV2.tsx`.

```tsx
…
1: /** The score page replaces only its own shared strip; Step 1 retains it.
2:  * The fixed-height categories heading prevents average arrival moving rows. */
3: import React from 'react';
4: import { useTranslation } from 'react-i18next';
5: import ComposerStepHeader from '@/features/composer-flow/components/ComposerStepHeader';
6: import { categoryAverage } from '../lib/categoryAverage';
7: import type { CategoryKey } from '../types';
8: 
9: export function ReviewStepHeading({ step, total }: { step: number; total: number }) {
10:   const { t } = useTranslation(['courses', 'composerFlow']);
11:   if (step !== total) return <ComposerStepHeader step={step} total={total} left="none" />;
12:   return <div className="review-score-heading-row" data-score-step-heading>
13:     <h1 className="review-score-heading">{t('review.wizard.step3.heading')}</h1>
14:     <span className="review-score-step-label">{t('step', { ns: 'composerFlow', n: step, m: total })}</span>
15:   </div>;
16: }
17: 
18: export function ReviewCategoriesHeading({ scores }: { scores: Record<CategoryKey, number | null> }) {
19:   const { t } = useTranslation('courses');
20:   const average = categoryAverage(scores);
21:   return <div className="review-score-cats-intro">
22:     <div className="review-score-cats-heading">
23:       <div className="review-score-kicker">{t('review.wizard.step3.breakdownLabel')}</div>
24:       {average != null && <span className="review-score-average" data-category-average>
25:         {t('review.wizard.step3.average')} <b className="review-score-number">{average.toFixed(1)}</b>
26:       </span>}
27:     </div>
28:     <p>{t('review.wizard.step3.catsIntro')}</p>
29:   </div>;
30: }
```

#### `src/features/review-v2/hooks/useReviewHeaderFacts.ts`
Exports: ReviewHeaderFacts, headerScore, useReviewHeaderFacts. Direct module consumers: 3 — `src/features/review-v2/ReviewComposerV2.tsx`, `src/features/review-v2/components/OverallScrubber.tsx`, `src/features/review-v2/components/ReviewComposerHeader.tsx`.

```tsx
…
1: /**
2:  * The review header's course facts (BRIEF_REVIEW_STEP_ONE §1): the community
3:  * average and count from course_rating_aggregates. Reads nothing about rounds
4:  * or handicaps. A failed read yields no facts, so the header omits them rather
5:  * than guessing.
6:  *
7:  * The rank no longer lives here: since BRIEF_REVIEW_STEP_ONE_COURSE_HERO it is
8:  * part of the masthead kicker, built by courseMastheadKicker from
9:  * useCourseTop100Standing — the same rule the course page uses.
10:  */
11: import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
12: 
13: export interface ReviewHeaderFacts {
14:   avg: number | null;
15:   count: number;
16: }
17: 
18: /** "{avg} from {n} members" applies only with at least one review and an average. */
19: export function headerScore(facts: ReviewHeaderFacts): { avg: string; count: number } | null {
20:   if (!facts.count || facts.avg == null || !Number.isFinite(facts.avg)) return null;
21:   return { avg: facts.avg.toFixed(1), count: facts.count };
22: }
23: 
24: export function useReviewHeaderFacts(courseId: string | undefined): ReviewHeaderFacts {
25:   const agg = useCourseRatingAggregates(courseId);
26:   const a = agg.isError ? null : agg.data;
27:   return {
28:     avg: a?.avg_overall_score != null ? Number(a.avg_overall_score) : null,
29:     count: Number(a?.review_count ?? 0),
30:   };
31: }
```

#### `src/features/search-v2/components/SearchSectionHeader.tsx`
Exports: SearchSectionHeader, ACTION. Direct module consumers: 2 — `src/features/search-v2/SearchOverlayV2.tsx`, `src/features/search-v2/components/RecentsList.tsx`.

```tsx
…
1: import type React from 'react';
2: import { ChevronRight } from 'lucide-react';
3: import { A } from '@/features/courses/components/holes/analytical/tokens';
4: import { KICKER as KICKER_METRICS, LABEL as LABEL_METRICS } from '@/lib/tokens/type';
5: 
6: /**
7:  * Canonical metrics; the surface supplies the ink.
8:  * MICRO_BRIEF_SEARCH_OVERLAY_TYPE_SCALE: fontSize is a LOCAL TRIAL override
9:  * (9 -> 11). Tracking, weight and transform still come from the shared token —
10:  * only the size is local. Do NOT repoint KICKER in lib/tokens/type (18
11:  * importers); this is a trial, not a fork.
12:  */
13: const KICKER: React.CSSProperties = { ...KICKER_METRICS, fontSize: 11, color: A.INK };
14: 
15: interface Props {
16:   label: string;
17:   onSeeAll?: () => void;
18:   /** Arbitrary right-slot action (e.g. RecentsList's Clear). */
19:   right?: React.ReactNode;
20: }
21: 
22: /** The ONLY definition of the search-overlay kicker style. Renamed from SectionHeader
23:  * (BRIEF_SECTION_HEADING_UNTANGLE addendum A fix 1) so that only
24:  * components/ui/SectionHeader carries that name. Rendered output unchanged. */
25: export function SearchSectionHeader({ label, onSeeAll, right }: Props) {
26:   return (
27:     <div
28:       style={{
29:         display: 'flex',
30:         alignItems: 'baseline',
31:         justifyContent: 'space-between',
32:         padding: '16px 16px 12px',
33:       }}
34:     >
35:       <span style={KICKER}>{label}</span>
36:       {right ??
37:         (onSeeAll && (
38:           <button type="button" onClick={onSeeAll} style={ACTION}>
39:             See all
40:             <ChevronRight size={11} strokeWidth={2.4} />
41:           </button>
42:         ))}
43:     </div>
44:   );
45: }
46: 
47: /**
48:  * MICRO_BRIEF_SEARCH_OVERLAY_TYPE_SCALE: fontSize is a LOCAL TRIAL override
49:  * (LABEL 8 -> 10). Shared LABEL has 21 importers and stays at 8.
50:  */
51: export const ACTION: React.CSSProperties = {
52:   ...LABEL_METRICS,
53:   fontSize: 10,
54:   color: A.INK,
55:   background: 'none',
56:   border: 'none',
57:   cursor: 'pointer',
58:   padding: 0,
59:   display: 'inline-flex',
60:   alignItems: 'center',
61:   gap: 2,
62: };
```

#### `src/features/tourhub/news/NewsTab.tsx`
Exports: LeadStory, StoryRow, NewsTab. Direct module consumers: 5 — `src/features/admin/components/amateur/AmateurStoryEditor.tsx`, `src/features/admin/components/wire/WireStoryEditor.tsx`, `src/features/amateur/AmateurNewsBlock.tsx`, `src/features/tourhub/news/WireNewsPage.tsx`, `src/features/tourhub/pages/TourHubMainPage.tsx`.

```tsx
…
89: const HERO_SUBJECT_DROP = 26;
90: 
91: function KickerLine({ kicker, at, compact = false, trailing }: { kicker: string | null; at: string | null; compact?: boolean; trailing?: React.ReactNode }) {
92:   return (
93:     <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
94:       {kicker && (
…
117:  * one gutter, owned once.
118:  */
119: export function LeadStory({ story, onOpen, compact = false, immersiveHero = true, engagement, bleed = false, onGutter = false }: { story: TourStory; onOpen: () => void; compact?: boolean; immersiveHero?: boolean; engagement?: StoryEngagement | null; bleed?: boolean; onGutter?: boolean }) {
120:   const bandPadding = compact ? 6 : 8;
121:   const sidePadding = onGutter ? 0 : bleed ? 20 : compact ? 17 : 14;
122:   const standfirstPad = compact ? 4 : 6;
…
167:         </div>
168:         <div style={{ position: 'absolute', bottom: bandPadding, left: sidePadding, right: sidePadding }}>
169:           <StoryImageHeadline compact={compact}>{story.headline}</StoryImageHeadline>
170:         </div>
171:       </div>
172:       {story.standfirst && (
173:         <div style={{ padding: `${standfirstPad}px ${bleed || onGutter ? 0 : 14}px 0`, fontSize: 13, lineHeight: 1.45, color: INK_MUTE }}>
174:           {story.standfirst}
175:         </div>
176:       )}
…
198:  * nothing. Ingest or proxy at publish time — see the roadmap open list.
199:  */
200: export function StoryRow({ story, onOpen, compact = false, engagement }: { story: TourStory; onOpen: () => void; compact?: boolean; engagement?: StoryEngagement | null }) {
201:   const [imageFailed, setImageFailed] = useState(false);
202:   return (
203:     <button
…
216:           trailing={<StoryRowEngagement engagement={engagement} inkColor={INK_FAINT} />}
217:         />
218:         <div style={{ marginTop: 5, fontSize: compact ? 13.5 : 14.5, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', color: INK }}>
219:           {story.headline}
220:         </div>
221:         {!compact && story.standfirst && (
222:           <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.45, color: INK_MUTE }}>
223:             {story.standfirst}
224:           </div>
225:         )}
…
255:       </div>
256:       <div>
257:         <h4>{headline}</h4>
258:         <div className="tour-news-ar-meta">
259:           {label && <span>{label}</span>}
260:           {label && <span className="sep" aria-hidden>·</span>}
…
271:  * live in the details line; the story page keeps the actions.
272:  */
273: export function NewsTab({ immersiveHero = true, islands = false }: { immersiveHero?: boolean; islands?: boolean }) {
274:   const { t } = useTranslation('tourhub');
275:   const navigate = useNavigate();
276:   const [tourLens, setTourLens] = useState<string | null>(() => {
…
355:   if (!lead) {
356:     return (
357:       <div style={{ padding: islands ? `calc(${CHROME_CLEARANCE} + 18px) 14px 0` : immersiveHero ? 'calc(env(safe-area-inset-top, 0px) + 76px) 14px 0' : '18px 14px 0', fontSize: 13, color: INK_MUTE, fontFamily: FONT }}>
358:         {t('news.empty', 'No stories on the wire yet.')}
359:       </div>
360:     );
…
407:         <span>{lead.kicker}</span>
408:       </div>
409:       <h2>{lead.headline}</h2>
410:       {lead.standfirst && <p className="tour-news-standfirst">{lead.standfirst}</p>}
411:       <NewsDetails story={lead} presentation={presentationFor(lead)} short={false} />
412:     </div>
…
520:               {lead.image_url && <img src={lead.image_url} alt="" loading="eager" decoding="async" />}
521:               <header className="tour-news-head" style={{ position: 'absolute', top: CHROME_CLEARANCE, left: 24, right: 24, padding: 0, zIndex: 2 }}>
522:                 <h1>Tour News</h1>
523:                 <button type="button" className="tour-news-search-btn" aria-label="Search stories" onClick={(e) => { e.stopPropagation(); setSearchOpen(true); }}>
524:                   <Search size={17} aria-hidden />
525:                 </button>
…
542:       ) : (
543:         <header className="tour-news-head">
544:           <h1>Tour News</h1>
545:           <button type="button" className="tour-news-search-btn" aria-label="Search stories" onClick={() => setSearchOpen(true)}>
546:             <Search size={17} aria-hidden />
547:           </button>
```

#### `src/features/tourhub/news/StoryBody.tsx`
Exports: StoryBody. Direct module consumers: 1 — `src/features/tourhub/news/StoryPage.tsx`.

```tsx
…
48: function Paragraph({ text }: { text: string }) {
49:   return (
50:     <p style={{ margin: '0 0 14px', fontSize: 14.5, lineHeight: 1.65, color: INK_MUTE, whiteSpace: 'pre-wrap' }}>
51:       {text}
52:     </p>
53:   );
54: }
55: 
56: function Heading({ text }: { text: string }) {
57:   return (
58:     <h2
59:       style={{
60:         margin: '22px 0 10px',
61:         fontSize: 16,
62:         fontWeight: 700,
63:         lineHeight: 1.25,
64:         letterSpacing: '-0.01em',
65:         color: INK,
66:       }}
67:     >
68:       {text}
…
87:       {(caption || credit) && (
88:         <figcaption style={{ marginTop: 6 }}>
89:           {caption && <span style={{ fontSize: 12, lineHeight: 1.4, color: INK_MUTE }}>{caption}</span>}
90:           {credit && (
91:             <span style={{ fontSize: 10, lineHeight: 1.4, color: INK_FAINT, marginLeft: caption ? 6 : 0 }}>
92:               {credit}
93:             </span>
94:           )}
…
108:       }}
109:     >
110:       <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.015em', color: INK }}>
111:         {text}
112:       </div>
113:       {attribution && (
…
115:           style={{
116:             marginTop: 6,
117:             fontSize: 9,
118:             fontWeight: 700,
119:             letterSpacing: '0.16em',
120:             textTransform: 'uppercase',
121:             color: INK_FAINT,
122:           }}
123:         >
124:           {attribution}
…
207:             <span
208:               style={{
209:                 fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
210:                 color: isLive ? LIVE_INK : INK_FAINT, whiteSpace: 'nowrap',
211:               }}
212:             >
213:               {isLive
…
222:               style={{
223:                 marginLeft: 'auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
224:                 fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: INK_FAINT,
225:               }}
226:             >
227:               {meta.venue_name}
…
229:           )}
230:         </div>
231:         <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.015em', color: INK, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
232:           {meta?.name ?? ''}
233:         </div>
234:         {(fieldSize != null || meta?.venue_par != null || leaderScore != null) && (
…
236:             {fieldSize != null && (
237:               <div>
238:                 <div style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{fieldSize}</div>
239:                 <div style={{ marginTop: 4, fontSize: 8, lineHeight: 1, fontWeight: 700, letterSpacing: '0.14em', color: INK_FAINT }}>{t('news.players', 'PLAYERS')}</div>
240:               </div>
241:             )}
242:             {meta?.venue_par != null && (
243:               <div>
244:                 <div style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, color: INK, fontVariantNumeric: 'tabular-nums' }}>{meta.venue_par}</div>
245:                 <div style={{ marginTop: 4, fontSize: 8, lineHeight: 1, fontWeight: 700, letterSpacing: '0.14em', color: INK_FAINT }}>{t('news.par', 'PAR')}</div>
246:               </div>
247:             )}
248:             {leaderScore != null && (
249:               <div>
250:                 <div style={{ fontSize: 13, lineHeight: 1, fontWeight: 700, color: getScoreColor(leaderScore, 'dark'), fontVariantNumeric: 'tabular-nums' }}>{fmtScore(leaderScore)}</div>
251:                 <div style={{ marginTop: 4, fontSize: 8, lineHeight: 1, fontWeight: 700, letterSpacing: '0.14em', color: INK_FAINT }}>{t('news.leader', 'LEADER')}</div>
252:               </div>
253:             )}
254:           </div>
…
275:             width: '100%', padding: '11px 16px', cursor: 'pointer',
276:             background: 'none', border: 'none', borderTop: `1px solid ${HAIRLINE_INK_10}`,
277:             fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
278:             textTransform: 'uppercase', color: INK,
279:           }}
280:         >
281:           {t('news.fullBoard', 'FULL LEADERBOARD')}
…
345:       <div
346:         style={{
347:           fontSize: 9.5,
348:           fontWeight: 700,
349:           letterSpacing: '0.14em',
350:           textTransform: 'uppercase',
351:           color: INK_FAINT,
352:         }}
353:       >
354:         {t('news.player', 'PLAYER')}
…
366:             <span
367:               style={{
368:                 fontSize: 14.5,
369:                 fontWeight: 700,
370:                 color: INK,
371:                 lineHeight: 1.25,
372:                 overflow: 'hidden',
373:                 textOverflow: 'ellipsis',
374:                 whiteSpace: 'nowrap',
…
380:           </div>
381:           {subline && (
382:             <div style={{ marginTop: 3, fontSize: 12, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
383:               {subline}
384:             </div>
385:           )}
…
419:           <div
420:             style={{
421:               fontSize: 8,
422:               fontWeight: 700,
423:               letterSpacing: '0.14em',
424:               textTransform: 'uppercase',
425:               color: INK_FAINT,
426:               whiteSpace: 'nowrap',
427:               overflow: 'hidden',
428:               textOverflow: 'ellipsis',
…
434:             style={{
435:               marginTop: 3,
436:               fontSize: 17,
437:               fontWeight: 700,
438:               color: INK,
439:               lineHeight: 1.1,
440:               fontVariantNumeric: 'tabular-nums',
441:               fontFeatureSettings: '"kern" 1, "liga" 1',
442:             }}
…
451: 
452: /** Header row shared by both blocks: avatar, name, flag, kicker and a subline. */
453: function StatHeader({
454:   player,
455:   kicker,
456:   subline,
…
471:       <SquircleAvatar size={40} srcCandidates={candidates} alt={name} userId={player.id} hideRing />
472:       <div style={{ flex: 1, minWidth: 0 }}>
473:         <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_FAINT }}>
474:           {kicker}
475:         </div>
476:         <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, minWidth: 0 }}>
477:           <span
478:             style={{
479:               fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.25,
480:               overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
481:             }}
482:           >
…
486:         </div>
487:         {subline && (
488:           <div style={{ marginTop: 2, fontSize: 11, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
489:             {subline}
490:           </div>
491:         )}
…
704: }
705: 
706: export function StoryBody({ blocks }: { blocks: StoryBlock[] }) {
707:   return (
708: 
709:     <div style={{ fontFamily: FONT }}>
…
713:             return <Paragraph key={i} text={b.text} />;
714:           case 'heading':
715:             return <Heading key={i} text={b.text} />;
716:           case 'image':
717:             return <ImageBlock key={i} url={b.url} caption={b.caption} credit={b.credit} />;
718:           case 'quote':
```

#### `src/features/tourhub/news/StoryImageText.tsx`
Exports: StoryImageKicker, StoryRelativeTime, StoryImageHeadline. Direct module consumers: 1 — `src/features/tourhub/news/NewsTab.tsx`.

```tsx
…
1: import React from 'react';
2: import { storyTime } from './storyTime';
3: import { INK, INK_MUTE, INK_SOFT } from '../_shared/tokens';
4: 
5: export function StoryImageKicker({ children, color = INK_SOFT, compact = false }: { children: React.ReactNode; color?: string; compact?: boolean }) {
6:   return (
7:     <span style={{ fontSize: compact ? 9.5 : 9, fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.16em', textTransform: 'uppercase', color }}>
8:       {children}
9:     </span>
10:   );
11: }
12: 
13: export function StoryRelativeTime({ at }: { at: string | null | undefined }) {
14:   const label = storyTime(at);
15:   if (!label) return null;
16:   /* Meta lines are uniformly caps app-wide. Cased in CSS, never on the string,
17:      so locale files and aria labels keep the underlying sentence case. */
18:   return <time dateTime={at ?? undefined} style={{ color: INK_MUTE, fontSize: 9, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{label}</time>;
19: }
20: 
21: export function StoryImageHeadline({ children, feed = false, compact = false }: { children: React.ReactNode; feed?: boolean; compact?: boolean }) {
22:   const size = compact ? 19 : feed ? 19 : 20;
23:   const tracking = compact ? '-0.02em' : feed ? '-0.02em' : '-0.015em';
24:   return (
25:     <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.15, letterSpacing: tracking, color: INK }}>
26:       {children}
27:     </div>
28:   );
29: }
```

#### `src/features/tourhub/overview/sections/ComingUpEvent.tsx`
Exports: ComingUpNext, ComingUpListRow. Direct module consumers: 1 — `src/features/tourhub/overview/sections/ComingUp.tsx`.

```tsx
…
1: import { useTranslation, Trans } from 'react-i18next';
2: import { CalendarDays, Flag } from 'lucide-react';
3: import { Button } from '@/components/ui/button';
4: import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
5: import type { ComingUpRow } from '../data/useComingUp';
6: import type { LastYearFinisher } from '../../hooks/useTournamentLastYearTop4';
7: import { fullTourLabel } from '../../_shared/tourOrder';
8: import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
9: import { getScoreColor } from '../../_shared/scoreColor';
10: import { comingCountdown, comingTag, comingDates, comingMoney, comingDateBlock, defendingResult, type OwnCourseFigure } from './comingUpRules';
11: import { displayEventName } from './ComingUp';
12: import { openComingUpCalendar } from './comingUpCalendar';
13: 
14: function Countdown({ row }: { row: ComingUpRow }) {
15:   const { t } = useTranslation('tourhub'); const { key, count } = comingCountdown(row.start_date);
16:   return <>{t(`overview.comingUp.countdown.${key}`, { count })}</>;
17: }
18: function Kicker({ row, next = false }: { row: ComingUpRow; next?: boolean }) {
19:   const { t } = useTranslation('tourhub'); const tag = comingTag(row);
20:   return <div className="coming-kick"><span>{next ? `${t('overview.comingUp.next')} · ` : ''}{fullTourLabel(row.tour_slug)}</span>{tag ? <span className="coming-tag" data-coming-tag={tag}>{t(`overview.comingUp.tags.${tag}`)}</span> : null}</div>;
21: }
22: export function ComingUpNext({ row, photo, lastYear, own, onOpen }: { row: ComingUpRow; photo?: string | null; lastYear?: LastYearFinisher[] | null; own?: OwnCourseFigure; onOpen: () => void }) {
23:   const { t } = useTranslation('tourhub'); const defending = defendingResult(row.defending_champion, lastYear);
24:   const purse = comingMoney(row.purse, row.currency); const winner = comingMoney(row.winning_share, row.currency);
25:   const facts = [purse ? { value: purse, label: t('overview.comingUp.purse') } : null, winner ? { value: winner, label: t('overview.comingUp.winner') } : null, row.venue_par != null ? { value: `${t('overview.comingUp.par')} ${row.venue_par}`, label: row.venue_yardage != null ? `${row.venue_yardage.toLocaleString('en-GB')} ${t('overview.comingUp.yards')}` : '' } : null].filter(f => f != null);
26:   const nameBlock = <div className="coming-over"><Kicker row={row} next/><div className="coming-name">{displayEventName(row.name)}</div>{row.venue ? <div className="coming-venue">{row.venue}</div> : null}</div>;
27:   return <article className="coming-next" data-coming-next={row.id}>
28:     {photo ? <div className="coming-photo"><img src={photo} alt=""/>{nameBlock}</div> : <div className="coming-plain">{nameBlock}</div>}
29:     <div className="coming-when"><span className="coming-dates num">{comingDates(row.start_date, row.end_date)}</span><span className="coming-away"><Countdown row={row}/></span></div>
30:     {facts.length ? <div className="coming-facts">{facts.map(f => <div className="coming-fact" key={f.label}><div className="coming-fv num">{f.value}</div><div className="coming-fl">{f.label}</div></div>)}</div> : null}
31:     {defending ? <div className="coming-last"><SquircleAvatar size={30} className="coming-avatar" hideRing alt={row.defending_champion ?? ''} srcCandidates={resolvePlayerAvatarCandidates({ name: row.defending_champion, photoUrl: defending.photoUrl, tourSlug: row.tour_slug })}/><span className="coming-last-text"><Trans ns="tourhub" i18nKey="overview.comingUp.defends" values={{ name: defending.surname }} components={{ b: <b/> }}/>{defending.margin != null && defending.score != null ? <> <Trans ns="tourhub" i18nKey="overview.comingUp.wonAt" values={{ score: defending.scoreLabel }} components={{ b: <b className="num" style={{ color: getScoreColor(defending.score, 'dark') }}/> }}/>{defending.margin === 0 ? t('overview.comingUp.playoff') : t('overview.comingUp.margin', { count: defending.margin })}</> : null}</span></div> : null}
32:     {own && own.rounds > 0 ? <div className="coming-yours"><span className="coming-pin"><Flag size={16}/></span><span><b>{t('overview.comingUp.played', { course: row.venue_course_name || row.venue_name || row.venue || '' })}</b>{own.best != null ? <> <span className="num"><Trans ns="tourhub" i18nKey="overview.comingUp.best" values={{ gross: own.best, count: own.rounds }} count={own.rounds} components={{ b: <strong/> }}/></span></> : null}</span></div> : null}
33:     <div className="coming-actions"><Button variant="ghost" className="coming-pill" onClick={() => void openComingUpCalendar(row)}><CalendarDays size={15}/>{t('overview.comingUp.calendar')}</Button><Button variant="ghost" className="coming-pill coming-pill-solid" onClick={onOpen}>{t('overview.comingUp.preview')}</Button></div>
34:   </article>;
35: }
36: export function ComingUpListRow({ row, played, onOpen }: { row: ComingUpRow; played?: boolean; onOpen: () => void }) {
37:   const { t } = useTranslation('tourhub'); const date = comingDateBlock(row.start_date); const purse = comingMoney(row.purse, row.currency);
38:   return <Button variant="ghost" className="coming-row" data-coming-up-item={row.id} onClick={onOpen}><div className="coming-date"><div className="coming-day num">{date.day}</div><div className="coming-week"><span>{date.weekday}</span><span>{date.month}</span></div></div><div className="coming-mid"><Kicker row={row}/><div className="coming-row-name">{displayEventName(row.name)}</div>{row.venue || played ? <div className="coming-row-venue">{played ? <><span className="coming-played-prefix">{t('overview.comingUp.playedHere')}</span>{row.venue ? ' · ' : ''}</> : null}{row.venue}</div> : null}</div><div className="coming-right"><div className="coming-row-away"><Countdown row={row}/></div>{purse ? <div className="coming-purse num">{purse}</div> : null}</div></Button>;
39: }
```

#### `src/features/tourhub/overview/sections/OverviewSectionHead.tsx`
Exports: OverviewSectionHead. Direct module consumers: 4 — `src/features/tourhub/overview/sections/AlsoThisWeek.tsx`, `src/features/tourhub/overview/sections/ComingUp.tsx`, `src/features/tourhub/overview/sections/OverviewNews.tsx`, `src/features/tourhub/overview/sections/WorldRankings.tsx`.

```tsx
…
1: import { ChevronRight } from 'lucide-react';
2: import { FONT, INK, INK_MUTE } from '../../_shared/tokens';
3: 
4: interface OverviewSectionHeadProps {
5:   title: string;
6:   action?: string;
7:   onAction?: () => void;
8:   meta?: React.ReactNode;
9: }
10: 
11: export function OverviewSectionHead({ title, action, onAction, meta }: OverviewSectionHeadProps) {
12:   return (
13:     <div style={{ minHeight: 28, margin: '0 24px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, fontFamily: FONT }}>
14:       <h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 800, letterSpacing: 0, color: INK }}>{title}</h2>
15:       {meta}
16:       {action && onAction ? (
17:         <button type="button" onClick={onAction} style={{ minHeight: 28, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2, border: 0, background: 'transparent', color: INK_MUTE, fontFamily: FONT, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
18:           {action}<ChevronRight size={14} aria-hidden />
19:         </button>
20:       ) : null}
21:     </div>
22:   );
23: }
```

#### `src/features/tourhub/overview/sections/SectionShell.tsx`
Exports: SectionShell, V4Card. Direct module consumers: 1 — `src/features/tourhub/overview/sections/OnTheCourse.tsx`.

```tsx
…
1: /**
2:  * DUPLICATE OF src/features/tourhub/tournament-v2/sections/SectionEyebrow.tsx.
3:  * Both are Tour Hub section headings, both render the same KICKER token, and
4:  * they live in sibling directories (overview/sections and
5:  * tournament-v2/sections). They do the same job. THE MERGE IS PENDING and is a
6:  * treatment decision, not a mechanical one — do not fold them together here.
7:  *
8:  * Shared SectionShell — dispatch section header + optional right link.
9:  * Spec (analytical): eyebrow is the KICKER token in surface ink (A.INK),
10:  * right link 11/700 muted. Eyebrows are never amber (EYEBROW INK FLIP) —
11:  * eyebrowColor stays for SEMANTIC overrides only (live green etc).
12:  */
13: 
14: import type { ReactNode } from 'react';
15: import { V4 } from '../tokens';
16: import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';
17: import { SPACE } from '@/lib/spacing';
18: 
19: 
20: export function SectionShell({
21:   eyebrow,
22:   subline,
23:   linkLabel,
24:   onLinkClick,
25:   children,
26:   eyebrowColor,
27:   rightMeta,
28:   padX = SPACE.pagePadX,
29: }: {
30:   eyebrow: string;
31:   subline?: string;
32:   linkLabel?: string;
33:   onLinkClick?: () => void;
34:   children: ReactNode;
35:   eyebrowColor?: string;
36:   rightMeta?: ReactNode;
37:   /**
38:    * Horizontal gutter for the HEADER ROW ONLY — children own their own.
39:    * Defaults to SPACE.pagePadX (16), which is what every existing caller
40:    * renders today, so this prop is additive and changes nothing unless passed.
41:    * The Tour Hub overview passes OVERVIEW_GUTTER (20) per its structural brief.
42:    */
43:   padX?: number;
44: }) {
45:   return (
46:     <section style={{ padding: '0 0 4px' }}>
47:       <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: `0 ${padX}px`, marginBottom: SPACE.sectionHeaderContent }}>
48:         <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
49:           {/* DARK EYEBROW: the fallback is the dark MUTE, not A.INK (now
50:               #F8FAFC) and never amber — amber means the viewing member.
51:               eyebrowColor remains for SEMANTIC overrides only (live green). */}
52:           <span style={{ ...KICKER, color: eyebrowColor ?? 'rgba(255,255,255,0.62)' }}>
53:             {eyebrow}
54:           </span>
55: 
56:           {subline && (
57:             <span style={{ fontSize: 13, fontWeight: 700, color: V4.ink, letterSpacing: '-0.005em', lineHeight: 1.35 }}>
58:               {subline}
59:             </span>
60:           )}
61:         </div>
62:         {rightMeta ? (
63:           <span style={{ color: V4.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontVariantNumeric: 'tabular-nums' }}>
64:             {rightMeta}
65:           </span>
66:         ) : linkLabel ? (
67:           <button
68:             onClick={onLinkClick}
69:             style={{ background: 'transparent', border: 'none', color: V4.inkFaint, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', cursor: 'pointer', padding: 0 }}
70:           >
71:             {linkLabel} ›
72:           </button>
73:         ) : null}
74:       </div>
75:       {children}
76:     </section>
77:   );
78: }
79: 
80: 
81: 
82: export function V4Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
83:   return (
84:     <div
85:       style={{
86:         background: V4.surface,
87:         border: `0.5px solid ${V4.cardBorder}`,
88:         borderRadius: V4.cardRadius,
89:         boxShadow: V4.cardShadow,
90:         ...style,
91:       }}
92:     >
93:       {children}
94:     </div>
95:   );
96: }
```

#### `src/features/tourhub/players-v2/picks/LinePicksCard.tsx`
Exports: LinePicksCard. Direct module consumers: 1 — `src/features/tourhub/players-v2/front/FrontPage.tsx`.

```tsx
…
24: } from './linePicksRules';
25: 
26: const kickStyle: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, textTransform: 'uppercase' };
27: const lineStyle: CSSProperties = { margin: '4px 0 0', fontSize: 13, lineHeight: 1.4, color: P.MUTE };
28: const footStyle: CSSProperties = { marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.HAIR}`, fontSize: 12, lineHeight: 1.45, color: P.MUTE };
29: const rowGrid = (first: boolean): CSSProperties => ({ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) 92px', columnGap: 10, alignItems: 'center', minHeight: 52, borderTop: first ? 'none' : `1px solid ${P.HAIR}` });
30: const rankStyle: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: P.MUTE, ...FIG };
31: 
32: function Shell({ state, children }: { state: PickState; children: ReactNode }) {
33:   return (
…
38: }
39: 
40: function Kicker({ left, right }: { left: string; right: string }) {
41:   return (
42:     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
43:       <span data-picks-kicker style={kickStyle}>{left}</span>
44:       <span data-picks-kicker-right style={{ fontSize: 11.5, color: P.DIM, whiteSpace: 'nowrap' }}>{right}</span>
45:     </div>
46:   );
47: }
…
51:     <div data-drawn-line style={{ height: 26, display: 'flex', alignItems: 'center', gap: 10 }}>
52:       <span style={{ flex: 1, height: 1, background: P.RULE }} />
53:       <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, whiteSpace: 'nowrap' }}>THE LINE</span>
54:       <span style={{ flex: 1, height: 1, background: P.RULE }} />
55:     </div>
56:   );
…
65: }
66: 
67: export function LinePicksCard({ stake, data, now = new Date() }: { stake: Stake; data: PageData; now?: Date }) {
68:   const state = resolvePickState(data.race, stake, now);
69:   const L = stake.after_position;
70:   const year = data.race?.season_year ?? 0;
…
98:         <p data-picks-line style={lineStyle}>
99:           {settledLine({ viewer_picks: r?.viewer_picks ?? 0, viewer_correct: r?.viewer_correct ?? 0, all_correct: r?.all_correct ?? 0, total_pickers: r?.total_pickers ?? total })
100:             .map((x, i) => (x.bold ? <b key={i} style={{ color: P.INK, fontWeight: 700 }}>{x.text}</b> : <span key={i}>{x.text}</span>))}
101:         </p>
102:         {myPicks.length ? (
103:           <div style={{ marginTop: 8 }}>
…
107:         {list.length ? (
108:           <>
109:             <div style={{ marginTop: 12, marginBottom: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.DIM }}>WHO CALLED IT</div>
110:             {list.map((c, i) => (
111:               <CallerRow key={c.user_id} c={c} first={i === 0} onOpen={() => {
112:                 analyticsEvents.track('tour_line_pick_caller_tapped', { tour: data.tour, after: L, viewer: c.is_viewer });
…
163:           {open ? (
164:             <button type="button" data-pick-button aria-pressed={picked} onClick={() => onTap(p)}
165:               style={{ height: 30, padding: '0 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'inherit', cursor: full ? 'default' : 'pointer', opacity: full ? 0.4 : 1,
166:                 background: picked ? AMBER : 'transparent', border: `1px solid ${picked ? AMBER : 'rgba(255,255,255,0.12)'}`, color: picked ? '#0A0A0C' : P.INK }}>
167:               {picked ? 'Picked' : 'Keeps card'}
168:             </button>
169:           ) : picked ? (
170:             <span data-your-pick style={{ height: 26, padding: '0 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', background: 'rgba(247,147,30,0.14)', color: AMBER }}>Your pick</span>
171:           ) : null}
172:         </span>
173:       </div>
…
202:       <PlayerCell rawName={player?.rawName ?? pick.player_name} name={name} tourCode={player?.tourCode ?? null} country={player?.country ?? null} followed={false} nameSize={14}
203:         sub={pick.position_at_pick ? `Picked at ${ordinal(pick.position_at_pick)}` : undefined} />
204:       <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', color: kept ? P.INK : P.DIM }}>
205:         <span aria-hidden style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, flex: 'none',
206:           background: kept ? P.INK : 'transparent', border: kept ? 'none' : '1px solid rgba(255,255,255,0.12)', color: kept ? '#0A0A0C' : P.DIM }}>{kept ? '✓' : '✕'}</span>
207:         {kept ? 'Kept card' : 'Missed out'}
208:       </span>
209:     </div>
…
217:   return (
218:     <button type="button" data-caller-row={c.rank} data-caller-viewer={you || undefined} onClick={onOpen}
219:       style={{ width: '100%', display: 'grid', gridTemplateColumns: '22px 28px minmax(0,1fr) auto', columnGap: 10, alignItems: 'center', minHeight: 40, padding: 0, border: 0, borderTop: first ? 'none' : `1px solid ${P.HAIR}`, background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: P.INK }}>
220:       <span style={{ ...rankStyle, color: you ? AMBER : P.MUTE }}>{c.rank}</span>
221:       <SquircleAvatar size={28} src={c.profile_photo_url} userId={c.user_id} fallback={initials} alt={name} />
222:       <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: you ? AMBER : P.INK }}>{name}</span>
223:       <span style={{ fontSize: 12, color: P.MUTE, whiteSpace: 'nowrap', ...FIG }}>{`${c.correct} of ${c.picks} · picked ${fmtDMon(c.last_picked_at)}`}</span>
224:     </button>
225:   );
226: }
```

#### `src/features/tourhub/tournament-v2/sections/CourseSection.tsx`
Exports: CourseSection, HolesSheet. Direct module consumers: 1 — `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx`.

```tsx
…
36: type RoundKey = 'all' | '1' | '2' | '3' | '4';
37: 
38: export function CourseSection({ tournamentId }: Props) {
39:   const { t } = useTranslation(['tourhub', 'courses']);
40:   // Preview always represents the full tournament (all rounds combined).
41:   const { data } = useTournamentHoleAnalysis(tournamentId, null);
…
133: }
134: 
135: export function HolesSheet({
136:   open,
137:   onClose,
138:   tournamentId,
…
231:       <div style={{ fontFamily: FONT, height: 'auto', maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}>
232:         <div style={{ padding: '0 16px 10px' }}>
233:           <div style={KICKER}>{t('tournament.course.title', { ns: 'tourhub' })}</div>
234:           <h2
235:             id="tournament-holes-sheet-title"
236:             style={{ margin: '3px 0 6px', ...TITLE, color: A.INK }}
237:           >
238:             {t('tournament.course.sheetTitle', { ns: 'tourhub', defaultValue: 'How the field scores' })}
239:           </h2>
…
289: 
290: 
291: function SectionKicker({ text }: { text: string }) {
292:   const { i18n } = useTranslation();
293:   const cjk = /^(ja|ko)/.test(i18n.language);
294:   return <div style={{ ...LABEL, fontSize: 10, letterSpacing: cjk ? 0 : '0.12em', textTransform: cjk ? 'none' : 'uppercase', margin: '14px 0 8px' }}>{text}</div>;
295: }
296: 
297: function CourseComparison({ hardest, easiest }: { hardest: TournamentHole; easiest: TournamentHole }) {
…
301:   const key = tenths > 0 && tenths < 10 ? 'tournament.course.comparisonTenths' : 'tournament.course.comparison';
302:   return (
303:     <div style={{ fontSize: 14, fontWeight: 400, color: A.BODY, lineHeight: 1.5, marginBottom: 8 }}>
304:       {t(key, { ns: 'tourhub', hardest: t('tournament.course.holeN', { ns: 'tourhub', n: hardest.hole_no }), easiest: t('tournament.course.holeN', { ns: 'tourhub', n: easiest.hole_no }), gap, tenths })}
305:     </div>
306:   );
```

#### `src/features/tourhub/tournament-v2/sections/SectionEyebrow.tsx`
Exports: SectionEyebrow. Direct module consumers: 6 — `src/features/tourhub/tournament-v2/sections/ContestSection.tsx`, `src/features/tourhub/tournament-v2/sections/EventInfoSection.tsx`, `src/features/tourhub/tournament-v2/sections/MomentsSection.tsx`, `src/features/tourhub/tournament-v2/sections/MoveSection.tsx`, `src/features/tourhub/tournament-v2/sections/StorySection.tsx`, `src/features/tourhub/tournament-v2/sections/TeeTimesRail.tsx`.

```tsx
…
1: /**
2:  * DUPLICATE OF src/features/tourhub/overview/sections/SectionShell.tsx. Both
3:  * are Tour Hub section headings, both render the same KICKER token, and they
4:  * live in sibling directories (tournament-v2/sections and overview/sections).
5:  * They do the same job. THE MERGE IS PENDING and is a treatment decision, not
6:  * a mechanical one — do not fold them together here. Note this component is
7:  * also consumed OUTSIDE Tour Hub, by features/search-v2 (SearchEmptyState).
8:  *
9:  * SectionEyebrow - TD1 section header: kicker + optional right action.
10:  *
11:  * Analytical grammar (BRIEF_TOUR_TOURNAMENT_PAGE): the kicker is the canonical
12:  * KICKER token (A.INK, 0.16em) and the action is the canonical quiet
13:  * Action - never a filled pill, never a raw chevron glyph.
14:  */
15: import { A, KICKER, LABEL, SANS } from '@/features/courses/components/holes/analytical/tokens';
16: import { useTranslation } from 'react-i18next';
17: 
18: interface Props {
19:   kicker: string;
20:   actionLabel?: string;
21:   onAction?: () => void;
22: }
23: 
24: export function SectionEyebrow({ kicker, actionLabel, onAction }: Props) {
25:   const { i18n } = useTranslation();
26:   const cjk = /^(ja|ko)/.test(i18n.language);
27:   return (
28:     <div
29:       style={{
30:         display: 'flex', alignItems: 'baseline', gap: 12,
31:         padding: '16px 16px 12px', fontFamily: SANS,
32:       }}
33:     >
34:       <span style={{ ...KICKER, letterSpacing: cjk ? 0 : KICKER.letterSpacing, textTransform: cjk ? 'none' : KICKER.textTransform }}>{kicker}</span>
35:       {actionLabel && onAction && (
36:         <button
37:           type="button"
38:           onClick={onAction}
39:           style={{
40:             marginLeft: 'auto',
41:             minHeight: 32,
42:             display: 'flex',
43:             alignItems: 'center',
44:             gap: 6,
45:             background: 'transparent',
46:             border: 'none',
47:             padding: 0,
48:             cursor: 'pointer',
49:             fontFamily: SANS,
50:           }}
51:           className="active:opacity-70 transition-opacity"
52:         >
53:           {/* CAPS BUTTON: two points below the READ floor, 0.10em, height unchanged. */}
54:           <span style={{ ...LABEL, fontSize: 9, letterSpacing: cjk ? 0 : '0.10em', textTransform: cjk ? 'none' : LABEL.textTransform, color: A.INK }}>{actionLabel}</span>
55:           <span style={{ fontSize: 12, color: A.INK, fontWeight: 700 }} aria-hidden="true">
56:             {'\u203A'}
57:           </span>
58:         </button>
59:       )}
60:     </div>
61:   );
62: }
```

#### `src/features/tourhub/tournament-v2/sections/TournamentV3Sections.tsx`
Exports: Parts, SectionHead, TournamentHero, RaceSection, FieldSection, LastYearSection, CourseV3Section, NumbersSection, TeeV3Section. Direct module consumers: 1 — `src/features/tourhub/tournament-v2/TournamentPage.tsx`.

```tsx
…
1: /** Selected-event sections consume normalized facts only. Shared picks, avatars
2:  * and drill-in sheets keep their canonical owners; all empty facts self-hide. */
3: import {useState, type RefObject} from 'react';
4: import {CourseGlance} from './CourseGlance';
5: import {useTranslation} from 'react-i18next';
6: import {Button} from '@/components/ui/button';
7: import {BottomSheet} from '@/components/ui/BottomSheet';
8: import {PlayerAvatar} from '../../components/PlayerAvatar';
9: import type {TournamentMeta} from '../../leaderboard/useTournamentMeta';
10: import type {BoardEntry} from '../../leaderboard/BoardTable';
11: import type {PickFieldPlayer} from '../../hooks/useTournamentPick';
12: import type {LastYearFinisher} from '../../hooks/useTournamentLastYearTop4';
13: import type {TournamentHoleAnalysis} from '../data/useTournamentHoleAnalysis';
14: import type {TeeGroup} from '../data/useTeeTimesAll';
15: import {HolesSheet} from './CourseSection';
16: import {surnameOf} from '../../_shared/playerName';
17: import {PhotoBandFade} from '../../components/overview-v3/HybridHeroBands/photoBandMaterial';
18: import {HERO_CONTENT_TOP,HERO_CONTENT_BOTTOM} from '@/lib/heroHeights';
19: import {heroStateLine} from '../../components/overview-v3/HybridHeroBands/heroStateLine';
20: import {copy,words,cap,score,ordinal,ordinalWord,day,heroStartDay,heroStartDayForm,eventZone,heroSentence,venueLine,glanceFacts,fieldLead,backThisYear,chartLines,labelPositions,playedRounds,roundStanding,raceNarrative,playedCourse,buckets,percentages,completeCount,selectTeeGroups,localTime,teeCaption,numberFacts,type Phase,type Part,type CourseHole} from '../data/tournamentRules';
21: import {PhotoBand} from '../../components/overview-v3/HybridHeroBands/PhotoBand';
22: import {formatOverviewDateRange,getOverviewCountdown} from '../../components/overview-v3/HybridHero';
23: import {upcomingSentence} from '../../components/overview-v3/upcomingOverviewRules';
24: import {UpcomingFacts, upcomingPar5Count} from '../../components/overview-v3/UpcomingOverviewSections';
25: export function Parts({parts}:{parts:Part[]}){return <>{parts.map((p,i)=>p.bold?<b key={i}>{p.text}</b>:<span key={i}>{p.text}</span>)}</>;}
26: export function SectionHead({title,aside,action,onAction}:{title:string;aside?:string;action?:string;onAction?:()=>void}){return <div className="tv-head"><h2>{title}</h2>{action?<Button variant="ghost" className="tv-link" onClick={onAction}>{action}</Button>:aside?<span>{aside}</span>:null}</div>;}
27: /* HERO BLOCKS §1: the upcoming phase renders the ONE shared upcoming block —
28:    the overview's PhotoBand builders (kicker, title, place line without
29:    country, last-year sentence, countdown figure) at the overview's sizes, and
30:    the shared UpcomingFacts band. The page keeps its own back island and has
31:    no tour buttons; the band is not a door here, so onOpen is inert. */
32: export function TournamentHero({meta,phase,rows,field,last,holes,image,nameRef,firstTee=null,drawnField=null,wonAt=null}:{nameRef?:RefObject<HTMLHeadingElement>;meta:TournamentMeta;phase:Phase;rows:BoardEntry[];field:PickFieldPlayer[];last:LastYearFinisher[];holes:CourseHole[];image:string|null;firstTee?:string|null;drawnField?:number|null;wonAt?:number|null}){const{t}=useTranslation('tourhub');const facts=glanceFacts(holes);
33: if(phase==='upcoming'){const zone=eventZone(meta);const startForm=heroStartDayForm(meta);const upcomingField=field.map(p=>({id:p.player_id,name:p.full_name,worldRank:p.world_rank}));return <div data-tv-section="hero"><PhotoBand title={meta.name} venueName={meta.venue_name??null} datesString={meta.start_date?formatOverviewDateRange(meta.start_date,meta.end_date):null} venueImageUrl={image} state={{kind:'upcoming',variant:'far',countdown:'',meta:''}} tourLabel={meta.tour_full_name??meta.tour_code?.toUpperCase()??null} leader={null} countdown={meta.start_date?getOverviewCountdown(meta.start_date):[]} startDay={startForm.text||null} titleRef={nameRef} segments={upcomingSentence(last,upcomingField,firstTee,zone)}/><UpcomingFacts first={firstTee} zone={zone} field={drawnField??field.length} purse={meta.purse??null} par={facts?.par??meta.venue_par??null} yards={facts?.yards??meta.venue_yardage??null} startDayNamed={startForm.weekday} par5s={upcomingPar5Count(holes)} wonAt={wonAt}/></div>;}
34: const sentence=heroSentence(meta,phase,rows,field,last);const stateLine=heroStateLine(t,phase==='completed'?{kind:'results'}:meta.current_round_status==='suspended'?{kind:'suspended',round:meta.current_round??1}:{kind:'live',round:meta.current_round??1});const figures=[field.length?{label:'FIELD',value:String(field.length)}:null,meta.purse!=null?{label:'PURSE',value:`$${meta.purse>=1000000?`${Number((meta.purse/1000000).toFixed(1))}M`:meta.purse.toLocaleString('en-GB')}`}:null,(facts?.par??meta.venue_par)!=null?{label:'PAR',value:String(facts?.par??meta.venue_par)}:null,(facts?.yards??meta.venue_yardage)!=null?{label:'YARDS',value:(facts?.yards??meta.venue_yardage??0).toLocaleString('en-GB')}:null].filter((f):f is {label:string;value:string}=>f!=null);return <div data-tv-section="hero"><div className="tv-hero" style={{paddingTop:HERO_CONTENT_TOP,paddingBottom:HERO_CONTENT_BOTTOM}}>{image&&<img src={image} alt=""/>}<PhotoBandFade/><div className="tv-hero-in"><div className="tv-tour">{[meta.tour_full_name?.toUpperCase()??meta.tour_code?.toUpperCase(),stateLine].filter(Boolean).join(' · ')}</div><h1 ref={nameRef} className="tv-title">{meta.name}</h1><div className="tv-venue">{venueLine(meta)}</div>{sentence.length>0&&<p className="tv-hero-sentence"><Parts parts={sentence}/></p>}</div></div>{figures.length>0&&<div className="tv-figures">{figures.map(f=><div key={f.label}><b>{f.value}</b><span>{f.label}</span></div>)}</div>}</div>;}
35: export function RaceSection({meta,phase,rows}:{meta:TournamentMeta;phase:Phase;rows:BoardEntry[]}){const lines=chartLines(rows,phase,meta.winner_id),n=playedRounds(rows),narrative=raceNarrative(meta,phase,rows);if(!lines.length||n<1)return null;const lo=Math.min(-20,...lines.flatMap(l=>l.values)),max=Math.ceil(Math.abs(lo)/10)*10+2,x=(i:number)=>28+i*234/n,y=(v:number)=>8+Math.abs(v)/max*160;const ys=labelPositions(lines.map(l=>y(l.values[n]??0)+3.5));return <section className="tv-section" data-tv-section="race"><SectionHead title={copy(phase==='completed'?'wasWon':'unfolding')} aside={copy('chartAxis')}/>{narrative.length>0&&<p className="tv-lead"><Parts parts={narrative}/></p>}<svg viewBox="0 0 350 210" className="tv-chart" role="img" aria-label={copy(phase==='completed'?'wasWon':'unfolding')}>{Array.from({length:Math.floor(max/10)+1},(_,i)=>-i*10).map(v=><g key={v}><line className="tv-grid" x1="28" x2="262" y1={y(v)} y2={y(v)}/><text x="0" y={y(v)+3.5}>{score(v)}</text></g>)}{Array.from({length:n+1},(_,i)=><text key={i} x={x(i)} y="204" textAnchor="middle">{i===0?'START':`R${i}`}</text>)}{[...lines].sort((a,b)=>Number(a.winner)-Number(b.winner)).map(l=><g key={l.row.id}><polyline className={`tv-line ${l.winner?'tv-winner':l.faint?'tv-faint':''}`} strokeLinejoin="round" strokeLinecap="round" points={l.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}/><circle className={`tv-dot ${l.winner?'tv-dot-winner':l.faint?'tv-dot-faint':''}`} cx={x(n)} cy={y(l.values[n]??0)} r={l.winner?3.5:2.5}/></g>)}{lines.map((l,i)=><text key={l.row.id} data-chart-label data-score={l.values[n]} className={`tv-label ${l.winner?'tv-label-winner':''}`} x="270" y={ys[i]}>{surnameOf(l.row.player?.full_name??'')} {score(l.values[n]??0)}</text>)}</svg><div className="tv-lead-tiles" style={{gridTemplateColumns:`repeat(${n},minmax(0,1fr))`}}>{Array.from({length:n},(_,i)=>{const s=roundStanding(rows,i+1),lead=s[0];if(!lead)return null;const leaders=s.filter(r=>r.rank===1),next=s.find(r=>r.rank>1);return <div className="tv-lead-tile" key={i} data-round-lead={i+1}><small>{copy('afterR',{n:i+1})}</small><b>{leaders.map(r=>surnameOf(r.row.player?.full_name??'')).join(' / ')}</b><span><strong className={lead.total<0?'tv-under':''}>{score(lead.total)}</strong> {leaders.length>1?copy('level'):next?copy('leadScore',{n:next.total-lead.total}):''}</span></div>;})}</div></section>;}
36: export function FieldSection({field,tour}:{field:PickFieldPlayer[];tour:string}){const [open,setOpen]=useState(false);if(!field.length)return null;const sorted=[...field].filter(p=>p.full_name).sort((a,b)=>(a.world_rank??Infinity)-(b.world_rank??Infinity));return <section className="tv-section" data-tv-section="field"><SectionHead title={copy('field')} aside={copy('worldRanking')}/><p className="tv-lead"><Parts parts={fieldLead(field)}/></p><div className="tv-tiles">{sorted.slice(0,6).map(p=><div className="tv-tile tv-field-tile" key={p.player_id}><PlayerAvatar playerId={p.player_id} playerName={p.full_name} photoUrl={p.photo_url} headshotOverride={p.headshot_override} tourCode={tour} size={30}/><div style={{minWidth:0}}><b>{surnameOf(p.full_name)}</b>{p.world_rank!=null&&<small>{copy('rank',{n:p.world_rank})}</small>}</div></div>)}</div><Button variant="ghost" className="tv-link" onClick={()=>setOpen(true)}>{copy('allPlayers',{n:field.length})}</Button><BottomSheet open={open} onClose={()=>setOpen(false)} ariaLabelledBy="tv-field-title"><div className="tournament-v3 tv-field-list"><h2 id="tv-field-title">{copy('field')}</h2>{sorted.map(p=><div className="tv-last-row" key={p.player_id}><PlayerAvatar playerId={p.player_id} playerName={p.full_name} photoUrl={p.photo_url} tourCode={tour} size={30}/><span>{p.full_name}</span>{p.world_rank!=null&&<b>{copy('rank',{n:p.world_rank})}</b>}</div>)}</div></BottomSheet></section>;}
37: export function LastYearSection({last,field,tour}:{last:LastYearFinisher[];field:PickFieldPlayer[];tour:string}){const rows=last.filter(p=>p.name&&p.name!=='—');if(!rows.length)return null;const winner=rows.find(p=>p.rank==='1')??rows[0],playoff=rows[1]?.score===winner?.score;return <section className="tv-section" data-tv-section="last-year"><SectionHead title={copy('lastYear')} aside={rows[0]?.year}/>{rows.map((p,i)=><div className="tv-last-row" key={`${p.name}-${i}`}><span className={p===winner?'tv-gold':''}>{p.rank}</span><div className="tv-last-who"><PlayerAvatar playerId={p.name} playerName={p.name} photoUrl={p.photoUrl} tourCode={tour} size={24}/><span>{p.name}</span>{p===winner&&playoff&&<small>{copy('wonInPlayoff')}</small>}</div><b className={p.score.startsWith('−')||p.score.startsWith('-')?'tv-under':''}>{p.score}</b></div>)}{field.length>0&&<p className="tv-caption">{backThisYear(rows,field)}</p>}</section>;}
38: function Split({shares}:{shares:number[]}){return <div className="tv-split">{shares.map((v,i)=><i key={i} style={{width:`${v}%`}}/>)}</div>;}
39: export function CourseV3Section({id,phase,holes,analysis,rows,currentRound}:{id:string;phase:Phase;holes:CourseHole[];analysis:TournamentHoleAnalysis|null;rows:BoardEntry[];currentRound:number}){const [open,setOpen]=useState(false),glance=glanceFacts(holes),played=analysis?.available?playedCourse(analysis.holes,phase):null;if(phase==='upcoming'?!glance:!played)return null;return <section className="tv-section" data-tv-section="course"><SectionHead title={copy('course')} aside={copy(phase==='upcoming'?'atGlance':phase==='completed'?'howPlayed':'soFar')}/>{phase==='upcoming'&&glance?<><CourseGlance holes={holes}/><div className="tv-tiles tv-facts">{glance.longest&&<div className="tv-tile"><small>{copy('longest')}</small><b>{copy('holeYards',{hole:ordinal(glance.longest.hole_no),yards:glance.longest.yards})}</b><span>{copy('par',{n:glance.longest.par})}</span></div>}{glance.shortest&&<div className="tv-tile"><small>{copy('shortest4')}</small><b>{copy('holeYards',{hole:ordinal(glance.shortest.hole_no),yards:glance.shortest.yards})}</b><span>{glance.shortest.yards<=330?copy('reachable'):copy('par',{n:4})}</span></div>}</div></>:played?<><p className="tv-lead"><Parts parts={played.parts}/></p><Split shares={played.shares}/><div className="tv-split-key" data-scoring-key>{(['birdie','parKey','bogey','double'] as const).map((k,i)=><div key={k}><b>{Math.round(played.shares[i]??0)}%</b><i data-bucket={i}/>{copy(k)}</div>)}</div><h3 className="tv-subtitle">{copy('hardEasy')}</h3>{played.preview.map(h=>{const pct=percentages(buckets(h));return <div className="tv-hole" key={h.hole_no}><div className="tv-hole-number">{h.hole_no}<small>{copy('par',{n:h.par}).toUpperCase()}</small></div><div>{pct&&<Split shares={pct}/>}<div className="tv-hole-detail">{copy('holeDetail',{yards:h.yards??'',birdie:Math.round(pct?.[0]??0),bogey:Math.round((pct?.[2]??0)+(pct?.[3]??0))})}</div></div><div className={`tv-hole-value ${h.avg_to_par<0?'tv-under':''}`}>{h.avg_to_par>0?'+':h.avg_to_par<0?'−':''}{Math.abs(h.avg_to_par).toFixed(2)}</div></div>;})}<p className="tv-caption">{phase==='live'?copy('liveCaption'):completeCount(rows,phase,currentRound)>0?copy('roundCaption',{n:completeCount(rows,phase,currentRound)}):copy('noCountCaption')}</p><Button variant="ghost" className="tv-link" onClick={()=>setOpen(true)}>{copy('allHoles')}</Button><HolesSheet open={open} onClose={()=>setOpen(false)} tournamentId={id} roundsPresent={analysis?.rounds_present??[]}/></>:null}</section>;}
40: export function NumbersSection({meta,phase,rows,field,picks}:{meta:TournamentMeta;phase:Phase;rows:BoardEntry[];field:number;picks:Set<string>}){const facts=numberFacts(meta,phase,rows,field,picks);if(!facts.length)return null;return <section className="tv-section" data-tv-section="numbers"><SectionHead title={copy(phase==='completed'?'weekNumbers':'round',phase==='live'?{n:meta.current_round??1}:{})} aside={phase==='live'?copy('dayNumbers'):undefined}/><div className={`tv-tiles ${phase==='completed'?'tv-week':''}`}>{facts.map(f=><div className="tv-tile" key={f.label}><small>{f.label}</small><b className={f.under?'tv-under':''}>{f.value}</b><span>{f.detail}</span></div>)}</div></section>;}
41: export function TeeV3Section({groups,phase,round,rounds,onRound,onAll,meta,picks,follows,field,defender,rows}:{groups:TeeGroup[];phase:Phase;round:number;rounds:number[];onRound:(n:number)=>void;onAll:()=>void;meta:TournamentMeta;picks:Set<string>;follows:Set<string>;field:PickFieldPlayer[];defender:string|null;rows:BoardEntry[]}){if(phase==='completed'||!rounds.includes(round)||!groups.length)return null;const selected=selectTeeGroups(groups,phase,picks,follows,field,defender),first=selected.all[0],last=selected.all[selected.all.length-1];if(!first||!last)return null;const render=(g:TeeGroup,i:number)=><div className="tv-tee-group" key={`${g.teeTime}-${i}`}><div className="tv-tee-time"><b>{localTime(g.teeTime)}</b><small>{copy('tee',{n:ordinal(g.startingHole).toUpperCase()})}</small></div><div className="tv-tee-players">{g.players.filter(p=>p.id&&p.name).map(p=>{const tag=p.id&&picks.has(p.id)?'ourPick':p.id&&follows.has(p.id)?'following':p.id===defender||p.name.toLowerCase()===defender?.toLowerCase()?'defending':null,total=rows.find(r=>r.player?.id===p.id)?.score;return <div className="tv-tee-player" key={p.id}><PlayerAvatar playerId={p.id??''} playerName={p.name} photoUrl={p.photoUrl} headshotOverride={p.headshotOverride} tourCode={meta.tour_code??'pga'} size={22}/><span className="tv-tee-name">{p.name}</span>{tag&&<span className="tv-tag">{copy(tag)}</span>}{phase==='live'&&total!=null&&<span className={`tv-tee-score ${total<0?'tv-under':''}`}>{score(total)}</span>}</div>;})}</div></div>;return <section className="tv-section" data-tv-section="tees"><div className="tv-head tv-tee-head"><h2>{phase==='live'?copy('dayTees',{day:day(meta.start_date,round).toUpperCase()}):copy('teeTimes')}</h2>{phase==='upcoming'&&rounds.includes(1)&&rounds.includes(2)&&<div className="tv-switch">{[1,2].map(n=><Button key={n} variant="ghost" aria-pressed={round===n} onClick={()=>onRound(n)}>{day(meta.start_date,n).slice(0,3).toUpperCase()}</Button>)}</div>}</div>{selected.your.length>0&&<><h3 className="tv-subtitle">{copy('yourGroups')}</h3>{selected.your.map(render)}</>}{selected.feature.length>0&&<><h3 className="tv-subtitle">{copy(phase==='live'?'lastThree':'marquee')}</h3>{selected.feature.map(render)}</>}<div className="tv-tee-footer"><span>{phase==='upcoming'?copy('firstLast',{first:localTime(first.teeTime),last:localTime(last.teeTime)}):copy(selected.all.every(g=>g.players.length===2&&g.startingHole===1)?'twoBalls':'threeBalls')}</span><span>{phase==='upcoming'?copy('groups',{n:selected.all.length}):copy('leadersOut',{time:localTime(last.teeTime)})}</span></div><p className="tv-caption">{teeCaption(meta.course_timezone??null,first.teeTime)}</p><Button variant="ghost" className="tv-link" onClick={onAll}>{copy('allTees')}</Button></section>;}
```

#### `src/lib/tokens/type.ts`
Exports: KICKER, LABEL, TITLE, BODY, FIGURE, FIGS, DISPLAY_TRACKING, SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP. Direct module consumers: 54.

```tsx
…
1: /**
2:  * THE CANONICAL TYPE SCALE (BRIEF_AUTH_TYPE_CANONICAL).
3:  *
4:  * One scale for the whole app, converted surface by surface. Auth is first.
5:  *
6:  * These roles carry SIZE, WEIGHT, TRACKING and LINE-HEIGHT only - never
7:  * colour. Colour belongs to the surface: the light member surfaces, the dark
8:  * admin console and the dark auth screens all use these same metrics and
9:  * supply their own ink. Spread a role and set `color` alongside it.
10:  *
11:  * TYPEFACE: none declared. The app stack (SF Pro / system) is inherited.
12:  * Do NOT add a font-family here.
13:  *
14:  * WEIGHTS IN USE ARE 400, 500, 600, 700. NOTHING ELSE - no 650, no 800.
15:  *
16:  * NOTE ON `features/courses/.../analytical/tokens.tsx`: that file still holds
17:  * the older, heavier values (LABEL 9/800, TITLE 13/800) and bakes in
18:  * light-mode colour. It is scheduled to be repointed at this module; until
19:  * then it is the legacy source and this one is canonical.
20:  */
21: import type { CSSProperties } from 'react';
22: 
23: /**
24:  * Section eyebrow. Uppercase, widest tracking in the scale.
25:  *
26:  * THE CANON GAP (BRIEF_SECTION_HEADING_UNTANGLE addendum A fix 5): this token
27:  * is CANONICAL at 9 / 700 / 0.19em, but only two heading files consume it and
28:  * BOTH override its size locally. What the app actually runs on is the LEGACY
29:  * kicker in src/features/courses/components/holes/analytical/tokens.tsx
30:  * (11 / 700 / 0.16em), inherited by Tour Hub, Discover's courseled grammar,
31:  * Business and club analytics. The two have NOT been reconciled. Neither value
32:  * is being changed here.
33:  */
34: export const KICKER: CSSProperties = {
35:   fontSize: 9,
36:   fontWeight: 700,
37:   letterSpacing: '0.19em',
38:   textTransform: 'uppercase',
39: };
40: 
41: /** The smallest role: names a value, a column or a field. Uppercase. */
42: export const LABEL: CSSProperties = {
43:   fontSize: 8,
44:   fontWeight: 700,
45:   letterSpacing: '0.16em',
46:   textTransform: 'uppercase',
47: };
48: 
49: /** Panel, sheet and screen headings. Tracking tightens as size grows. */
50: export const TITLE: CSSProperties = {
51:   fontSize: 17,
52:   fontWeight: 700,
53:   letterSpacing: '-0.032em',
54:   lineHeight: 1.2,
55: };
56: 
57: /** Running prose, captions, supporting sentences. */
58: export const BODY: CSSProperties = {
59:   fontSize: 13,
60:   fontWeight: 400,
61:   lineHeight: 1.55,
62: };
63: 
64: /**
65:  * Numbers. Size is set by the caller - a figure may be large - but the weight,
66:  * tracking and tabular figures are fixed so digits hold position as they
67:  * change. Tabular figures are non-negotiable anywhere a value updates in place
68:  * (counters, code boxes, scores).
69:  */
70: export const FIGURE: CSSProperties = {
71:   fontWeight: 700,
72:   letterSpacing: '-0.04em',
73:   fontVariantNumeric: 'tabular-nums lining-nums',
74: };
75: 
76: /** Tabular figures on their own, for text that is mostly prose but holds digits. */
77: export const FIGS: CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums' };
78: 
79: /**
80:  * Headline sizes for hero type. Tracking follows TITLE (tighter as size grows);
81:  * the size itself is a layout decision left to the surface.
82:  */
83: export const DISPLAY_TRACKING = '-0.032em';
84: 
85: /**
86:  * THE CANONICAL SECTION HEADING (CANONICAL SECTION HEADING — FOUNDATION).
87:  * Taken from the Courses tab as shipped in 52f015a; the Courses tab
88:  * (PlayedHead, SectionHead) is the reference every page and sheet copies.
89:  * Colourless: the caller supplies ink (#F8FAFC on dark surfaces).
90:  * Mirrored for stylesheets as --section-eyebrow-* / --section-title-* in
91:  * src/index.css; keep both in step.
92:  */
93: export const SECTION_EYEBROW: CSSProperties = {
94:   fontSize: 11,
95:   fontWeight: 700,
96:   letterSpacing: '0.16em',
97:   textTransform: 'uppercase',
98:   lineHeight: 1,
99: };
100: 
101: export const SECTION_TITLE: CSSProperties = {
102:   fontSize: 21,
103:   fontWeight: 700,
104:   letterSpacing: '-0.035em',
105:   lineHeight: 1.05,
106:   fontSynthesis: 'none',
107: };
108: 
109: /** Gap (px) between a section eyebrow and its title. */
110: export const SECTION_TITLE_GAP = 5;
```

### CSS-backed heading and sheet-title treatments

Each rule below states the current declared metrics; missing fields inherit. These include business/insights, NewsTab-family heads, tournament SectionHead, and shared sheet chrome. Compare with the five-field canon above: any nonmatching explicit metric is a deviation; inherited metrics are not guaranteed matches.

```css
/* src/components/business/businessMentions.css:1 */ .business-mentions-head h2 { margin:0; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--business-mention-mute); }
/* src/components/course-media-tab/hole-photo-fast.css:4 */ .hole-photo-fast-title { font-size: 16px; font-weight: 700; line-height: 1.2; letter-spacing: 0; }
/* src/components/course-media-tab/media-v2.css:4 */ .media-v2-head h3 { font-size:17px; font-weight:700; margin:0; letter-spacing:0; color:var(--media-v2-ink); }
/* src/components/course-media-tab/media-v3.css:5 */ .media-v3-tag-heading h2 { font-size:19px; font-weight:700; line-height:1.2; margin:4px 0 0; overflow-wrap:anywhere; }
/* src/components/course-media-tab/shot-tag-choices.css:6 */ .shot-tag-title { font-size:20px;font-weight:700;line-height:1.2;letter-spacing:0;margin:5px 0 0; }
/* src/components/courses/course-detail/about/course-honours.css:3 */ .honours-head { display: flex; justify-content: space-between; padding: 0 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(248,250,252,0.62); }
/* src/components/courses/course-detail/about/course-honours.css:4 */ .honours-head b { color: #F8FAFC; font-weight: 700; font-variant-numeric: tabular-nums; }
/* src/components/courses/top100/t100Race.css:1 */ .t100-row, .t100-tile, .t100-see, .t100-dropdown-header { appearance: none; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
/* src/components/courses/top100/t100Race.css:57 */ .t100-dropdown-header > svg { color: var(--t100-dim); flex: none; }
/* src/components/courses/top100/top100Compare.css:2 */ .t100b-kicker { font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;line-height:1;color:var(--t100b-ink) }
/* src/components/courses/top100/top100Compare.css:2 */ .t100b-title { margin-top:5px;font-size:21px;font-weight:700;line-height:1.05;letter-spacing:-.035em;font-synthesis:none;color:var(--t100b-ink) }
/* src/components/feed/feed-media-chrome.css:3 */ [data-hole-card-title] { font-size:15.5px }
/* src/components/feed/feed-media-chrome.css:11 */ [data-hole-card-title] { font-size:14px }
/* src/components/fullscreen-feed/course-gallery.css:9 */ .course-gallery-heading b { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; font-size:17px; font-weight:700; letter-spacing:-0.02em; line-height:1.2; color:#FFFFFF; }
/* src/components/fullscreen-feed/course-gallery.css:10 */ .course-gallery-heading span { display:block; margin-top:1px; font-size:12.5px; font-weight:500; color:rgba(248,250,252,0.68); font-variant-numeric:tabular-nums; }
/* src/components/fullscreen-feed/course-gallery.css:39 */ .course-gallery-kicker { display:flex; align-items:center; gap:6px; font-size:9.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:rgba(248,250,252,0.68); }
/* src/components/fullscreen-feed/course-gallery.css:65 */ .course-gallery-grid header .course-gallery-label { font-size:12px; font-weight:400; letter-spacing:0; text-transform:none; color:rgba(248,250,252,0.5); }
/* src/components/invite/inviteConnected.css:2 */ .if1-title { margin:6px 0 0; font-size:22px; font-weight:700; letter-spacing:-.02em; line-height:1.2; }
/* src/components/invite/inviteConnected.css:18 */ .if1-group-title { display:flex; justify-content:space-between; gap:12px; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--invite-dim); margin:20px 20px 4px; }
/* src/components/moderation/reportSheet.css:5 */ .report-reason-title { display: block; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: #F8FAFC; }
/* src/components/profile/courses/coursesArchive.css:6 */ .courses-archive .archive-heading h2 { font-family: inherit !important;
  font-size: 22px !important;
  line-height: 26px !important;
  letter-spacing: 0 !important; }
/* src/components/profile/courses/coursesArchive.css:12 */ .courses-archive .archive-heading > div:first-child > div { font-family: inherit !important;
  font-size: 13px !important;
  line-height: 16px !important; }
/* src/components/settings/settingsYourData.css:2 */ .bizc-sheet[data-testid=st5-your-data-sheet] .bizc-sheet-title { font-size:20px;font-weight:700;letter-spacing:0 }
/* src/features/admin/components/memberRadar.css:31 */ .mr-kicker { display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--mr-faint); }
/* src/features/admin/components/memberRadar.css:88 */ .mr-title { font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase; }
/* src/features/amateur-ranking/ranking-tab.css:48 */ .amateur-ranking-tab.amr-sheet .pro-collection-kicker { font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(248,250,252,.62);margin-bottom:6px }
/* src/features/amateur-ranking/wagr-settings.css:13 */ .wagr-kicker { font-size:9.5px;font-weight:800;letter-spacing:0.16em;color:var(--pro-profile-amber) }
/* src/features/amateur-ranking/wagr-settings.css:14 */ .wagr-heading.wagr-heading { margin:6px 0 0;font-size:22px;font-weight:700;letter-spacing:-0.02em;line-height:normal;color:var(--ep-ink) }
/* src/features/business-create/business-create.css:7 */ .bizc-kicker { font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-mute) }
/* src/features/business-create/business-create.css:80 */ .bizc-areahead { font-size:15.5px;font-weight:600;line-height:1.45;margin-top:8px }
/* src/features/business-create/business-create.css:105 */ .bizc-xrow-title { display:block;font-size:15px;font-weight:600;color:var(--bizc-ink) }
/* src/features/business-create/business-create.css:112 */ .bizc-sheet-title { font-size:20px;font-weight:700;letter-spacing:-0.02em;color:var(--bizc-ink) }
/* src/features/business/clubAnalytics/courseLead.css:3 */ .club-course-lead-headline { margin: 0; font-size: 23px; font-weight: 700; letter-spacing: -.02em; line-height: 1.2; color: var(--team-ink); overflow-wrap: anywhere; }
/* src/features/business/clubAnalytics/teeSheet.css:1 */ .tee-sheet-kicker { font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tee-sheet-muted); }
/* src/features/business/clubAnalytics/teeSheet.css:2 */ .tee-sheet-title { margin:6px 0 0; font-size:17px; font-weight:700; letter-spacing:-0.01em; line-height:1.3; }
/* src/features/business/clubAnalytics/teeSheet.css:5 */ .tee-sheet-subheading { margin:16px 0 0; font-size:10.5px; font-weight:800; letter-spacing:.14em; color:var(--tee-sheet-dim); }
/* src/features/chrome-v2/index-glance.css:11 */ .connect-glance-kicker { color: var(--glance-amber); font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
/* src/features/chrome-v2/index-glance.css:12 */ .connect-glance-headline { margin-top: 8px; color: var(--glance-ink); font-size: 19px; font-weight: 700; line-height: 1.25; }
/* src/features/chrome-v2/page-title.css:3 */ .chrome-page-title h1 { margin:0; min-width:0; overflow-wrap:anywhere; font-size:30px; font-weight:700; letter-spacing:0; line-height:1.1; color:var(--island-back-ink); }
/* src/features/chrome-v2/page-title.css:4 */ .chrome-page-title-subtitle { margin:6px 0 0; font-size:13.5px; color:var(--player-other); }
/* src/features/chrome-v2/tour-glance.css:6 */ .tour-menu-header { display:flex;align-items:baseline;justify-content:space-between;margin:16px 2px 4px;font-size:10.5px;color:var(--tour-menu-dim) }
/* src/features/chrome-v2/tour-glance.css:7 */ .tour-menu-kicker { font-size:9.5px;font-weight:800;letter-spacing:0.14em }
/* src/features/clubhouse-tour/tourSlot.css:6 */ .tour-slot-kicker { font-size: 11px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: var(--feed-tour-amber); }
/* src/features/clubhouse-tour/tourSlot.css:8 */ .tour-slot-title { font-size: 28px; font-weight: 700; line-height: 1.08; letter-spacing: -.01em; margin-top: 7px; overflow-wrap: anywhere; }
/* src/features/clubhouse-tour/tourSlot.css:13 */ .tour-slot-lead-heading { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--feed-tour-mute); }
/* src/features/clubhouse-tour/tourSlot.css:40 */ .tour-slot-board-header { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--feed-tour-faint); padding-bottom: 6px; }
/* src/features/clubhouse-tour/tourSlot.css:50 */ .tour-slot-title { font-size: 24px; }
/* src/features/coach/coach.css:1 */ .coach-kicker { display:flex;justify-content:space-between;gap:12px;font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--club-you-muted);margin-bottom:10px; }
/* src/features/coach/coach.css:2 */ .coach-kicker span:last-child { color:var(--tee-sheet-dim);letter-spacing:.12em;white-space:nowrap; }
/* src/features/coach/coach.css:3 */ .coach-title { font-size:17px;font-weight:700;letter-spacing:-.01em;line-height:1.3;margin:0;overflow-wrap:anywhere; }
/* src/features/composer-flow/post-or-review.css:10 */ .post-or-review-header h1 { flex: 1; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0; }
/* src/features/composer-flow/post-or-review.css:17 */ .post-or-review-box-head h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0; }
/* src/features/composer-flow/post-or-review.css:18 */ .post-or-review-box-head p { margin: 2px 0 0; font-size: 12.5px; color: var(--post-review-mute); }
/* src/features/composer-flow/review-course-search.css:7 */ .rcs-head h1 { flex: 1; margin: 0; font-size: 22px; font-weight: 700; color: var(--rcs-ink); letter-spacing: 0; }
/* src/features/edit-profile/edit-profile.css:5 */ .ep-title { flex:1;text-align:center;margin-right:48px;font-size:17px;font-weight:700 }
/* src/features/explore-magazine/roundsGate.css:7 */ .rounds-gate-kicker { font-size: 10.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; line-height: 1; color: var(--rounds-gate-amber); }
/* src/features/explore-magazine/roundsGate.css:10 */ .rounds-gate-head { margin: 7px 0 0; font-size: 21px; font-weight: 700; line-height: 1.2; letter-spacing: 0; }
/* src/features/explore-magazine/roundsGate.css:11 */ .rounds-gate-tile-head { font-size: 22px; }
/* src/features/explore-magazine/roundsGate.css:26 */ .rounds-gate-option-title { display: block; font-size: 15px; font-weight: 650; color: var(--rounds-gate-ink); }
/* src/features/explore-magazine/watch/featured.css:2 */ .featured-kicker { font-size:11px; font-weight:800; letter-spacing:0.2em; color:var(--featured-amber); }
/* src/features/explore-magazine/watch/featured.css:3 */ .featured-title { font-size:22px; font-weight:700; letter-spacing:-0.02em; margin:3px 0 0; }
/* src/features/explore-magazine/watch/standout-shelf.css:2 */ .standout-heading b { display:block; font-size:19px; font-weight:700; }
/* src/features/explore-magazine/watch/standout-shelf.css:3 */ .standout-heading span { display:block; font-size:12.5px; color:var(--standout-dim); margin-top:2px; }
/* src/features/explore-magazine/watch/standout-shelf.css:31 */ .standout-kicker { display:flex; align-items:center; gap:6px; margin-bottom:9px; font-size:9.5px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:var(--standout-dim); }
/* src/features/guest/guestGate.css:65 */ .guest-gate-kicker { font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f7931e; }
/* src/features/guest/guestGate.css:73 */ .guest-gate-head { margin: 9px 0 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.12;
  text-wrap: balance;
  color: #f8fafc; }
/* src/features/guest/guestGate.css:173 */ .guest-gate-head { font-size: 22px; }
/* src/features/member-badge/member-badge.css:6 */ .mbc-kicker > span:last-child { font-size:9.5px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:rgba(248,250,252,0.42); }
/* src/features/member-badge/member-badge.css:7 */ .mbc-title { margin-top:12px; font-size:22px; font-weight:800; letter-spacing:-0.02em; }
/* src/features/onboarding/welcome-cropper.css:8 */ .welcome-cropper-head b { display:block;font-size:17px;font-weight:700 }
/* src/features/onboarding/welcome-cropper.css:9 */ .welcome-cropper-head span { display:block;font-size:13px;color:var(--welcome-mute);margin-top:2px }
/* src/features/post-v2/components/golf/composerGolf.css:2 */ .composer-golf-kicker { font-size:10.5px;font-weight:800;color:var(--pf-dim);text-transform:uppercase;letter-spacing:.18em }
/* src/features/post-v2/components/golf/composerGolf.css:88 */ .pf4-with-selhead { display:flex;justify-content:space-between;gap:8px;margin-top:12px;font-size:12px;color:rgba(248,250,252,.42) }
/* src/features/post-v2/components/golf/composerGolf.css:89 */ .pf4-with-selhead b { color:#F8FAFC;font-weight:600 }
/* src/features/post-v2/components/golf/composerGolf.css:98 */ .composer-rounds-head h3 { margin:0;font-size:17px;font-weight:700;letter-spacing:-.02em }
/* src/features/post-v2/components/golf/composerGolf.css:99 */ .composer-rounds-head p { margin:3px 0 0;font-size:12.5px;color:rgba(248,250,252,.62) }
/* src/features/post-v2/components/video/roundVideoCreator.css:2 */ .video-creator .vc-round-head .vc-note { font-size:12px }
/* src/features/post-v2/components/video/videoCreator.css:2 */ .video-creator .vc-kicker { font-size:10.5px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--video-dim) }
/* src/features/post-v2/components/video/videoCreator.css:9 */ .video-creator .vc-title-type { letter-spacing:.12em }
/* src/features/post-v2/components/video/videoCreator.css:10 */ .video-creator .vc-title { display:block;width:100%;resize:none;border:0;background:transparent;color:var(--video-ink);font-size:21px;font-weight:700;line-height:1.25;padding:6px 16px 0;overflow:hidden;outline:none;min-height:33px }
/* src/features/post-v2/components/video/videoCreator.css:11 */ .video-creator .vc-title::placeholder { color:var(--video-dim) }
/* src/features/post-v2/components/video/videoCreator.css:23 */ .video-creator .vc-part-head { display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:13.5px;font-weight:700 }
/* src/features/pro-profile/pro-profile.css:3 */ .pro-profile-heading h2 { margin:0; font-size:9px; font-weight:700; letter-spacing:.16em; color:var(--pro-profile-dim); }
/* src/features/pro-profile/pro-profile.css:6 */ .pro-profile-kicker { font-size:9px; font-weight:700; letter-spacing:.1em; color:var(--pro-profile-mute); }
/* src/features/pro-profile/pro-profile.css:36 */ .pro-season-form-heading { display:flex; justify-content:space-between; margin-bottom:8px; color:var(--pro-profile-dim); }
/* src/features/pro-profile/pro-profile.css:37 */ .pro-season-form-heading span { font-size:9px; font-weight:700; letter-spacing:.16em; }
/* src/features/pro-profile/pro-profile.css:38 */ .pro-season-form-heading span:last-child { font-size:10px; letter-spacing:0; }
/* src/features/pro-profile/pro-profile.css:90 */ .pro-hero-headline>strong { font-size:40px; font-weight:700; line-height:.9; }
/* src/features/pro-profile/pro-profile.css:92 */ .pro-hero-headline b { display:block; font-size:10px; font-weight:700; letter-spacing:.14em; color:var(--pro-profile-mute); }
/* src/features/pro-profile/pro-profile.css:93 */ .pro-hero-headline p { margin:4px 0 0; font-size:12.5px; font-weight:700; }
/* src/features/pro-profile/pro-profile.css:138 */ .pro-collection-kicker { font-size:10px; font-weight:700; letter-spacing:.14em; color:var(--pro-profile-mute); }
/* src/features/pro-profile/pro-profile.css:177 */ .pro-ask-kicker { display:block; font-size:9px; font-weight:700; letter-spacing:.12em; color:var(--pro-profile-amber); margin-bottom:6px; }
/* src/features/pro-profile/pro-profile.css:229 */ .pro-kit-title { font-size:16px; font-weight:700; }
/* src/features/pro-profile/pro-profile.css:296 */ .pro-finish-header>span { font-size:9px; font-weight:700; letter-spacing:.14em; color:var(--pro-profile-amber); }
/* src/features/pro-profile/pro-profile.css:297 */ .pro-finish-header>b { font-size:11px; font-weight:700; color:var(--pro-profile-dim); }
/* src/features/pro-verification/pro-label.css:22 */ .profile-pro-tour-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; font-size:10px; font-weight:800; letter-spacing:0.14em; color:var(--pro-note-muted); margin-bottom:4px; }
/* src/features/pro-verification/pro-status-controls.css:13 */ .pro-status-kicker { font-size:10px;font-weight:800;letter-spacing:0.16em;color:var(--pro-controls-muted) }
/* src/features/pro-verification/pro-status-controls.css:14 */ .pro-status-heading { display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:22px;font-weight:800;margin:4px 0 0 }
/* src/features/pro-verification/pro-verification.css:9 */ .pds-kicker { font-size:10px;font-weight:800;letter-spacing:0.16em;color:rgba(248,250,252,0.62) }
/* src/features/pro-verification/pro-verification.css:10 */ .pds-head h2 { margin:4px 0 0;font-size:22px;font-weight:800;line-height:1.2;color:#F8FAFC }
/* src/features/pro-verification/pro-verification.css:11 */ .pds-head p { margin:6px 0 0;font-size:13.5px;line-height:1.45;color:rgba(248,250,252,0.62) }
/* src/features/review-v2/components/reviewReceipt.css:9 */ .receipt-status-title { font-size:15px;font-weight:700 }
/* src/features/review-v2/components/reviewReceipt.css:12 */ .receipt-pending-head { display:flex;justify-content:space-between;gap:10px;font-size:13.5px;font-weight:650 }
/* src/features/review-v2/components/reviewReceipt.css:13 */ .receipt-pending-head>span+span { font-weight:600;color:var(--receipt-mute) }
/* src/features/review-v2/components/reviewReceipt.css:20 */ .receipt-score-head>span { font-size:12px;color:var(--receipt-mute) }
/* src/features/review-v2/components/reviewReceipt.css:21 */ .receipt-score-head b { font-size:14px;font-weight:700;color:var(--receipt-ink) }
/* src/features/review-v2/components/reviewReceipt.css:39 */ .receipt-impact-title { font-size:14px;line-height:1.4 }
/* src/features/review-v2/components/reviewReceipt.css:40 */ .receipt-impact-title b { font-weight:700 }
/* src/features/review-v2/components/reviewReceipt.css:46 */ .review-receipt b,.receipt-pending-head { font-variant-numeric:tabular-nums;font-feature-settings:"kern" 1,"liga" 1 }
/* src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:1 */ .pick-panel-kicker { color:var(--pick-amber); font-size:10px; font-weight:800; letter-spacing:.16em; }
/* src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:2 */ .pick-panel-header h2 { margin:3px 0 0; font-size:21px; font-weight:800; }
/* src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:68 */ .pick-record-event-head b { flex:1; min-width:0; font-size:14.5px; font-weight:700; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
/* src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:69 */ .pick-record-event-head small { font-size:12px; color:var(--pick-dim); }
/* src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:81 */ .pick-mine-heading { font-size:15px; font-weight:800; color:var(--pick-section-white); }
/* src/features/tourhub/components/overview-v3/recapNextUp.css:16 */ .recap-next-up-kicker { font-size: 9.5px; font-weight: 700; letter-spacing: .15em; color: var(--recap-next-up-accent); margin-bottom: 4px; }
/* src/features/tourhub/leaderboard/leaderboard.css:15 */ .tour-board-title { margin:4px 0 0; font-size:26px; font-weight:800; line-height:1.1; letter-spacing:0; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; }
/* src/features/tourhub/leaderboard/leaderboard.css:23 */ .tour-board-section-title { margin:0; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--tour-board-ink); white-space:nowrap; }
/* src/features/tourhub/leaderboard/leaderboard.css:33 */ .tour-board-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:20px 18px 6px; font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tour-board-amber); }
/* src/features/tourhub/leaderboard/leaderboard.css:34 */ .full-board-sheet .tour-board-kicker { color:var(--tour-board-ink); }
/* src/features/tourhub/leaderboard/leaderboard.css:36 */ .tour-board-kicker small { font-size:11.5px; font-weight:600; letter-spacing:.02em; color:var(--tour-board-dim); }
/* src/features/tourhub/overview/sections/alsoWeek.css:4 */ .also-week .also-head { display:block;width:100%;height:auto;padding:0;margin:0;border:0;border-radius:0;background:transparent;color:inherit;text-align:left;white-space:normal;transform:none }
/* src/features/tourhub/overview/sections/alsoWeek.css:13 */ .also-title span { min-width:0;flex:1;font-size:17px;line-height:1.25;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
/* src/features/tourhub/overview/sections/alsoWeek.css:14 */ .also-title svg { flex:none;color:var(--tour-board-dim) }
/* src/features/tourhub/overview/sections/comingUp.css:7 */ .coming-kick { display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--tour-board-mute); }
/* src/features/tourhub/player-v2/playerPage.css:9 */ .pv-kicker { display:flex; flex-wrap:wrap; align-items:center; gap:6px; color:var(--pick-mute); font-size:10.5px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
/* src/features/tourhub/player-v2/playerPage.css:35 */ .pv-head h2 { margin:0; font-size:11px; font-weight:800; letter-spacing:.16em; }
/* src/features/tourhub/player-v2/playerPage.css:36 */ .pv-head > span,.pv-head .pv-link { font-size:10.5px; font-weight:800; letter-spacing:.12em; color:var(--pick-mute); }
/* src/features/tourhub/player-v2/playerPage.css:80 */ .pv-hole-head { border:0; padding:0 0 4px; font-size:10px; font-weight:700; letter-spacing:.08em; color:var(--pick-mute); }
/* src/features/tourhub/player-v2/playerPage.css:81 */ .pv-hole-head > span { font-size:10px; }
/* src/features/tourhub/tournament-v2/tournamentPage.css:3 */ .tv-title { margin:4px 0 0;font-size:26px;font-weight:800;line-height:1.1;color:var(--tv-white) }
/* src/features/tourhub/tournament-v2/tournamentPage.css:4 */ .tv-head h2 { margin:0;font-size:11px;font-weight:800;letter-spacing:.16em }
/* src/features/tourhub/tournament-v2/tournamentPage.css:4 */ .tv-head>span { font-size:10.5px;font-weight:800;letter-spacing:.12em;color:var(--tv-mute) }
/* src/features/tourhub/tournament-v2/tournamentPage.css:4 */ .tv-head .tv-link { padding:0;font-weight:800;letter-spacing:.1em }
/* src/features/tourhub/tournament-v2/tournamentPage.css:5 */ .tv-subtitle { margin:14px 0 2px;font-size:9.5px;font-weight:800;letter-spacing:.13em;color:var(--tv-dim) }
/* src/features/tourhub/tournament-v2/tournamentPage.css:5 */ .tv-board-head { font-size:10px;color:var(--tv-mute);padding-bottom:6px }
/* src/features/video-details/round-video.css:1 */ .round-video-kicker { font-size:9.5px;font-weight:800;letter-spacing:.14em;color:var(--video-about-mute) }
/* src/features/video-details/video-viewer.css:1 */ .video-teaser .video-title { display:block;max-width:100%;height:auto;padding:0;border-radius:0;background:none;color:var(--video-about-ink);text-align:left;white-space:normal;overflow-wrap:break-word;font-size:16px;font-weight:800;line-height:1.3;margin-top:10px;letter-spacing:0 }
/* src/features/video-details/video-viewer.css:7 */ .video-teaser-feed .video-title { font-size:15px;margin-top:0 }
/* src/features/video-details/video-viewer.css:15 */ .video-about-kicker { font-size:10.5px;font-weight:800;letter-spacing:.18em;color:var(--video-about-dim);text-transform:uppercase;margin:0 0 6px }
/* src/features/video-details/video-viewer.css:21 */ .profile-video-long-title { display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;overflow-wrap:normal;word-break:normal;font-size:12.5px;font-weight:700;line-height:1.3;margin-top:6px;color:var(--video-about-ink) }
/* src/index.css:533 */ .club-you-kicker { font-size:10.5px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:var(--club-you-muted); margin:0 0 10px; overflow-wrap:anywhere; }
/* src/index.css:534 */ .club-you-title { font-size:17px; font-weight:700; line-height:1.3; letter-spacing:-0.01em; margin:0; overflow-wrap:anywhere; }
/* src/index.css:535 */ .club-you-title span { color:var(--club-you-muted); }
/* src/index.css:555 */ .club-visiting-kicker { font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--club-visiting-mute); margin-bottom:4px; }
/* src/index.css:638 */ .manage-header-subtitle { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 24px); left: 108px; right: 108px; height: 15px; display: flex; justify-content: center; pointer-events: none; font-size: 11.5px; line-height: 14px; font-weight: 600; color: var(--team-dim); text-align: center; }
/* src/index.css:640 */ .team-header-invite { height: 34px; padding: 0 13px; border-radius: 17px; background: var(--team-ink); color: var(--team-inverted-ink); font-size: 13px; font-weight: 700; gap: 6px; border: 0; }
/* src/index.css:652 */ .team-request-kicker { font-size: 10.5px; line-height: 1.4; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--team-muted); display: flex; justify-content: space-between; }
/* src/index.css:667 */ .team-sheet-title { padding: 0 20px; margin: 0; font-size: 18px; line-height: 1.4; font-weight: 700; letter-spacing: 0; color: var(--team-ink); overflow-wrap: anywhere; }
/* src/index.css:676 */ .team-role-title { font-size: 15px; line-height: 1.4; font-weight: 700; }
/* src/index.css:722 */ .team-list-error-title { font-size: 13px; font-weight: 600; color: var(--team-ink); }
/* src/index.css:725 */ .team-list-sheet-head { display: flex; gap: 12px; align-items: center; padding: 0 20px 14px; color: var(--team-ink); }
/* src/index.css:726 */ .team-list-sheet-head b { display: block; font-size: 16px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* src/index.css:727 */ .team-list-sheet-head span { display: block; margin-top: 2px; font-size: 12.5px; color: var(--team-muted); }
/* src/index.css:740 */ .team-list-title { letter-spacing: -0.01em; }
/* src/index.css:1483 */ .section-header { @apply text-[13px] font-medium uppercase tracking-[0.5px] text-muted-foreground px-2.5; }
/* src/index.css:4891 */ .statTitle { font-size: 12px;
  line-height: 1.2;
  margin-bottom: 6px;
  opacity: 0.7;
  font-weight: 600; }
/* src/index.css:4974 */ .eh-row__title { flex: 1 1 auto;
  font-size: 17px; 
  font-weight: 600; 
  color: var(--eh-title);
  line-height: 1.25;
  min-width: 0; }
/* src/index.css:5509 */ .insights-visits-kicker { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 10.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--team-muted); }
/* src/index.css:5510 */ .insights-visits-kicker > span:last-child { color: var(--team-dim); letter-spacing: .12em; text-align: right; }
/* src/index.css:5538 */ .insights-audience-title { margin: 6px 0 0; font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.3; }
/* src/index.css:5558 */ .insights-posts-title { margin: 6px 0 0; font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.3; }
/* src/index.css:5579 */ .insights-followers-title { margin: 6px 0 0; font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.3; }
/* src/index.css:5592 */ .insights-engagement-title { margin: 6px 0 0; font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.3; }
/* src/index.css:5606 */ .insights-reviews-title { margin: 6px 0 0; font-size: 17px; font-weight: 700; letter-spacing: -.01em; line-height: 1.3; }
/* src/index.css:5607 */ .insights-reviews-title [data-avg] { font-variant-numeric: tabular-nums; }
/* src/index.css:5630 */ .insights-course-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--team-muted); }
/* src/index.css:5631 */ .insights-course-kicker > span:nth-child(2) { color:var(--team-dim); letter-spacing:.12em; text-align:right; }
/* src/index.css:5632 */ .insights-course-title { margin:6px 0 0; font-size:17px; font-weight:700; letter-spacing:-0.01em; line-height:1.3; }
/* src/index.css:5676 */ .review-score-heading { margin:0; font-size:22px; font-weight:700; color:var(--score-ink); }
/* src/index.css:5699 */ .review-score-kicker { font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--score-muted); }
/* src/index.css:5711 */ .review-score-share-title { font-size:14px; font-weight:700; color:var(--score-ink); }
/* src/index.css:5767 */ .overview-news-kicker { display:flex; align-items:center; gap:8px; font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--news-mute); }
/* src/index.css:5777 */ .overview-news-hero .overview-news-kicker { color:var(--news-photo-ink); }
/* src/index.css:5802 */ .tour-news-head h1 { margin:0; font-size:26px; font-weight:800; }
/* src/index.css:5816 */ .tour-news-lead-copy .overview-news-kicker { color:var(--news-photo-ink); }
/* src/index.css:5831 */ .tour-news-sec { margin:30px 24px 4px; display:flex; align-items:baseline; justify-content:space-between; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--news-dim); }
/* src/index.css:5832 */ .tour-news-sec .count { letter-spacing:0; font-size:11.5px; font-weight:600; text-transform:none; }
/* src/index.css:5833 */ .tour-news-sec.you { color:var(--news-amber); }
/* src/index.css:5834 */ .tour-news-sec.you .count { color:var(--news-dim); }
/* src/index.css:5844 */ .tour-news-grp { margin:22px 24px 2px; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--news-dim); }
/* src/styles/dark-golf-passport.css:317 */ .dgp-section-title { font-size: 18px;
  font-weight: 600;
  color: var(--dgp-text-primary);
  letter-spacing: -0.01em; }
/* src/styles/glassToast.css:20 */ .glass-toast-title, .glass-tile-title { display: block; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25;
  color: #F8FAFC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* src/styles/handicap-dark.css:234 */ .hcp-dark .hcp-eyebrow { display: inline-flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  font-size: 10.5px;
  letter-spacing: 0.16em;
  font-weight: 700;
  color: var(--hcp-t-60); }
/* src/styles/hybrid-hero.css:17 */ .hybrid-hero-title { margin: 0;
  font-family: inherit;
  font-weight: 700;
  letter-spacing: -0.035em;
  font-size: clamp(24px, 8.5vw, 42px);
  line-height: 0.96;
  color: white;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.40);
  text-wrap: balance;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word; }
/* src/styles/hybrid-hero.css:72 */ .upcoming-kicker { margin:0;font-size:10px;font-weight:800;letter-spacing:.16em;color:rgba(248,250,252,.62);text-transform:uppercase;line-height:1.4 }
/* src/styles/hybrid-hero.css:76 */ .upcoming-last-header { display:grid;grid-template-columns:24px minmax(0,1fr) 40px;gap:4px;align-items:end;margin-top:8px;padding-bottom:6px;font-size:10px;font-weight:700;letter-spacing:.08em;color:rgba(248,250,252,.62) }
/* src/styles/hybrid-hero.css:87 */ .recap-block .upcoming-kicker { font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--cw-mute);line-height:1.4 }
/* src/styles/hybrid-hero.css:89 */ .recap-block .recap-head { align-items:flex-start;line-height:14px }
/* src/styles/hybrid-hero.css:103 */ [data-recap-record] .upcoming-kicker,[data-recap-record] .recap-link.recap-link { font-size:10px;font-weight:700;letter-spacing:.16em;color:var(--cw-mute);text-transform:uppercase;line-height:1.4;white-space:nowrap }
/* src/styles/post-flow.css:3 */ .pf-header h3 { margin:0;font-size:17px;font-weight:800; }
/* src/styles/post-flow.css:11 */ .pf-group { margin:20px 20px 8px;display:flex;justify-content:space-between;gap:8px;font-size:10.5px;font-weight:800;letter-spacing:.16em;color:var(--pf-dim); }
/* src/styles/post-flow.css:33 */ .pf-best-head { display:flex;justify-content:space-between;font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--pf-dim); }
/* src/styles/post-flow.css:45 */ .pf-label { margin:20px 20px 10px;font-size:10.5px;font-weight:800;letter-spacing:.16em;color:var(--pf-dim); }
/* src/styles/post-flow.css:60 */ .pf-kicker { margin-top:24px;display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.16em; }
/* src/styles/post-flow.css:63 */ .pf-headline { margin:14px 0 0;font-size:30px;font-weight:800;line-height:1.1; }
/* src/styles/quest-theme.css:57 */ .quest-theme-light .quest-section-title { color: hsl(var(--muted-foreground));
  font-weight: 600;
  font-size: 14px; }
/* src/styles/shorts_live_clubhouse.css:34 */ .suggested-golfers-title { font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground)); }
/* src/styles/shorts_live_clubhouse.css:115 */ .live-row-title { font-size: 13px;
  font-weight: 500;
  color: hsl(var(--muted-foreground)); }
/* src/styles/theme-tokens.css:135 */ .tile-title { font-size: 17px;
  font-weight: 600;
  color: var(--hub-text);
  line-height: 1.3;
  letter-spacing: -0.01em; }
/* src/styles/theme-tokens.css:143 */ .eyebrow { font-size: 13px;
  color: var(--hub-text-dim);
  font-weight: 400;
  margin-top: 4px; }
/* src/styles/tour-hub-tokens.css:230 */ .th-headline { font-family: var(--th-font-display);
  font-size: 22px;
  line-height: 28px;
  letter-spacing: -0.015em;
  font-weight: 600; }
/* src/styles/tour-hub-tokens.css:238 */ .th-title-1 { font-family: var(--th-font-text);
  font-size: 20px;
  line-height: 24px;
  letter-spacing: -0.012em;
  font-weight: 600; }
/* src/styles/tour-hub-tokens.css:246 */ .th-title-2 { font-family: var(--th-font-text);
  font-size: 17px;
  line-height: 22px;
  letter-spacing: -0.010em;
  font-weight: 600; }
/* src/styles/tour-hub-tokens.css:254 */ .th-title-3 { font-family: var(--th-font-text);
  font-size: 15px;
  line-height: 20px;
  letter-spacing: -0.008em;
  font-weight: 600; }
/* src/styles/welcome.css:6 */ .welcome-kicker { font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--welcome-mute) }
/* src/styles/welcome.css:13 */ .welcome-section-heading { display:flex;justify-content:space-between;align-items:center;margin-top:22px;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--welcome-mute) }
/* src/styles/welcome.css:13 */ .welcome-section-heading button { font-size:13.5px;text-transform:none;padding:0;height:24px;color:var(--welcome-ink) }
```

## (b) Every weight above 700
**527 occurrences in 167 non-test files.** Excluded test files with matching actual weight forms: **7** (count only). Total files in the excluded test scope: **884**.

### Totals by area
| Area | Occurrences | Files |
|---|---:|---:|
| (src root) | 25 | 1 |
| components/business | 32 | 14 |
| components/course-media-tab | 4 | 3 |
| components/courses | 54 | 21 |
| components/explore-tab-new | 17 | 9 |
| components/feed | 2 | 1 |
| components/invite | 2 | 1 |
| components/likes | 1 | 1 |
| components/profile | 60 | 20 |
| components/settings | 1 | 1 |
| components/shared | 1 | 1 |
| components/ui | 1 | 1 |
| features/admin | 51 | 15 |
| features/amateur-ranking | 9 | 2 |
| features/business | 13 | 3 |
| features/business-create | 7 | 1 |
| features/chrome-v2 | 5 | 3 |
| features/coach | 1 | 1 |
| features/courses | 2 | 2 |
| features/creator | 1 | 1 |
| features/edit-profile | 3 | 1 |
| features/explore-magazine | 21 | 8 |
| features/find-people | 1 | 1 |
| features/guest | 1 | 1 |
| features/member-badge | 1 | 1 |
| features/post-v2 | 10 | 5 |
| features/pro-verification | 11 | 3 |
| features/profile-sheet-v2 | 1 | 1 |
| features/tourhub | 152 | 34 |
| features/video-details | 7 | 2 |
| pages | 6 | 5 |
| styles | 24 | 3 |

### Totals by form
| Form | Occurrences |
|---|---:|
| CSS font-weight | 234 |
| SVG fontWeight attribute | 4 |
| Tailwind | 4 |
| canvas font shorthand constant | 1 |
| fontWeight | 282 |
| weight token | 2 |

### Inventory
| file:line | form | snippet | context (what text it styles) |
|---|---|---|---|
| `src/components/business/BusinessEmptyState.tsx:68` | fontWeight | <code>const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE };</code> | kicker — text/value styled by this declaration |
| `src/components/business/BusinessEmptyState.tsx:69` | fontWeight | <code>const rightLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM, whiteSpace: 'nowrap' };</code> | rightLabel — text/value styled by this declaration |
| `src/components/business/BusinessFollowersCard.tsx:80` | fontWeight | <code>&lt;span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}&gt;</code> | mine — ; {t('business.followers.kicker', { defaultValue: 'Their followers' })}; {handicap_count != null && ( |
| `src/components/business/BusinessFollowersCard.tsx:84` | fontWeight | <code>&lt;span data-followers-count style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}&gt;</code> | mine — {handicap_count != null && (; )}; {showMix && ( |
| `src/components/business/BusinessFollowersCard.tsx:102` | fontWeight | <code>&lt;span data-band-you style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim, marginLeft: 5 }}&gt;</code> | me — {t('business.followers.you', { defaultValue: 'You' })}; )};  |
| `src/components/business/BusinessNearbyCourses.tsx:82` | fontWeight | <code>fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink, verticalAlign: 'middle' }}&gt;</code> | meta — {t('business.nearby.top100', { defaultValue: 'Top 100' })}; )};  |
| `src/components/business/BusinessNearbyCourses.tsx:127` | fontWeight | <code>&lt;span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}&gt;</code> | open — ; {t('business.nearby.kicker', { defaultValue: 'Courses nearby' })};  |
| `src/components/business/BusinessNearbyCourses.tsx:130` | fontWeight | <code>&lt;span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim }}&gt;</code> | open — {t('business.nearby.within', { defaultValue: 'Within 10 miles' })}; ;  |
| `src/components/business/ClubFromTheClub.tsx:54` | fontWeight | <code>&lt;span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.62)', ...(title !== undefined ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 } : {}) }} data-club-feed-title={title !== undefined ? "" : undefined}&gt;{heading}&lt;/span&gt;</code> | empty — ; {heading}; 0 && ( |
| `src/components/business/ClubFromTheClub.tsx:56` | fontWeight | <code>&lt;span data-club-feed-count style={{ ...(title !== undefined ? { flex: 'none', marginLeft: 12 } : {}), fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)' }}&gt;</code> | empty — {postsCount === 1 ? '1 post' : &#96;${postsCount} posts&#96;}; )};  |
| `src/components/business/ClubHowItPlays.tsx:99` | fontWeight | <code>&lt;span data-club-plays-early style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',</code> | heights — {settled && (; = 1 && rounds; Early data |
| `src/components/business/ClubHowItPlays.tsx:149` | fontWeight | <code>&lt;div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}&gt;How it plays&lt;/div&gt;</code> | total — {allIn && (; {roundsLabel(total)}; )} |
| `src/components/business/ClubHowItPlays.tsx:151` | fontWeight | <code>&lt;div data-club-plays-total style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}&gt;</code> | total — )}; (; ))} |
| `src/components/business/ClubWhatGolfersSay.tsx:136` | fontWeight | <code>&lt;div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute, marginBottom: 10 }}&gt;</code> | picker — What golfers say; ; No one has reviewed {courseActivityClubName(businessName)} yet. |
| `src/components/business/ClubWhatGolfersSay.tsx:161` | fontWeight | <code>&lt;div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}&gt;What golfers say&lt;/div&gt;</code> | latest — What golfers say; ; {total === 1 ? '1 review' : &#96;${formatNumber(total)} reviews&#96;} |
| `src/components/business/ClubWhatGolfersSay.tsx:162` | fontWeight | <code>&lt;div data-club-say-count style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}&gt;</code> | latest — ; ;  |
| `src/components/business/businessMentions.css:2` | CSS font-weight | <code>.business-mentions-head h2 { margin:0; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--business-mention-mute); }</code> | CSS selector .business-mentions-head h2 |
| `src/components/business/businessMentions.css:3` | CSS font-weight | <code>.business-mentions-count { font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--business-mention-dim); white-space:nowrap; }</code> | CSS selector .business-mentions-count |
| `src/components/business/businessMentions.css:19` | CSS font-weight | <code>.business-mention-hidden { position:absolute; top:10px; left:36px; padding:2px 7px; border-radius:999px; background:var(--business-mention-menu); color:var(--business-mention-photo-ink); font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; pointer-events:none; }</code> | CSS selector .business-mention-hidden |
| `src/components/business/editor/business-edit.css:64` | CSS font-weight | <code>.be2-fld&gt;span { display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ep-dim) }</code> | CSS selector .be2-fld>span |
| `src/components/business/editor/business-where-contact.css:8` | CSS font-weight | <code>.be3-fld&gt;span,.be3-field-label { display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ep-dim) }</code> | CSS selector .be3-fld>span,.be3-field-label |
| `src/components/business/hero/ClubProfileHero.tsx:188` | fontWeight | <code>&lt;span style={{ display: 'block', marginTop: 4, fontSize: placement === 'beside' ? 9.5 : 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}&gt;{c.label}&lt;/span&gt;</code> | body — ; {c.label};  |
| `src/components/business/hero/ClubProfileHero.tsx:265` | fontWeight | <code>&lt;h1 ref={p.nameRef} style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: 0, lineHeight: 1.1, color: INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}&gt;</code> | el — ; ;  |
| `src/components/business/hero/ClubProfileHero.tsx:314` | fontWeight | <code>&lt;span data-soon-tag="" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, border: GLASS_BORDER, borderRadius: 999, padding: '2px 7px' }}&gt;</code> | el — {t('business.clubHero.soon', 'Soon')}; ; ) : p.secondAction ? ( |
| `src/components/business/hero/ClubProfileHero.tsx:327` | fontWeight | <code>&lt;span data-soon-tag="" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, border: GLASS_BORDER, borderRadius: 999, padding: '2px 7px' }}&gt;</code> | el — {t('business.clubHero.soon', 'Soon')}; } |
| `src/components/business/home/BusinessDoNextCard.tsx:73` | fontWeight | <code>&lt;div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: H.mute }}&gt;</code> | tap — {t('business.doNext.kicker')}; ; ( |
| `src/components/business/home/BusinessDoNextCard.tsx:91` | fontWeight | <code>display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: H.mute,</code> | tap — ; ; {resolveDoNextMsg(t, item.title)} |
| `src/components/business/home/BusinessHomeHeader.tsx:101` | fontWeight | <code>fontSize, fontWeight: 800, color: '#fff',</code> | Logo — : businessInitials(business.name)} |
| `src/components/business/home/BusinessHomeHeader.tsx:270` | fontWeight | <code>&lt;div className="flex items-center" style={{ gap: 7, fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', color: H.ink, lineHeight: 1.2 }}&gt;</code> | menuItem — {business.name}; {business.is_verified &&; } |
| `src/components/business/home/BusinessWeekCard.tsx:75` | fontWeight | <code>display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em',</code> | kickerStyle — text/value styled by this declaration |
| `src/components/business/home/BusinessWeekCard.tsx:83` | fontWeight | <code>marginTop: 4, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: W.ink, fontVariantNumeric: 'tabular-nums',</code> | figStyle — text/value styled by this declaration |
| `src/components/business/insights/InsightsFunnel.tsx:170` | fontWeight | <code>fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: FUNNEL_MUTE,</code> | bold — {k('kicker')}; ; {k('kickerDays', { days })} |
| `src/components/course-media-tab/HolePhotoPicker.tsx:39` | Tailwind | <code>className="aspect-square h-auto min-w-0 p-0 rounded-[9px] text-sm font-extrabold tabular-nums"</code> | selected — text/value styled by this declaration |
| `src/components/course-media-tab/HolePhotoTagButton.tsx:11` | Tailwind | <code>if (assigned != null) return &lt;span className="absolute right-[5px] bottom-[5px] z-10 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold" style={{ background: A.INK, color: A.CANVAS }}&gt;Hole {assigned}&lt;/span&gt;;</code> | assigned — ; taggedHoles?: ReadonlyMap; Hole {assigned} |
| `src/components/course-media-tab/HolePhotoTagButton.tsx:13` | Tailwind | <code>return &lt;Button variant="ghost" size="sm" aria-label={post.mediaItems[0]?.type === 'video' ? 'Tag video' : 'Tag photograph'} className="absolute right-[5px] bottom-[5px] z-10 h-auto min-h-0 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.06em]"</code> | assigned — Hole {assigned}; Tag a hole |
| `src/components/course-media-tab/hole-photo-fast.css:37` | CSS font-weight | <code>.hole-photo-batch-badge { position: absolute; left: 3px; top: 3px; z-index: 2; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 9.5px; font-weight: 800; color: #fff; background: var(--hole-photo-success); }</code> | CSS selector .hole-photo-batch-badge |
| `src/components/courses/CourseMasthead.tsx:35` | fontWeight | <code>fontWeight: 800,</code> | MASTHEAD_NAME — text/value styled by this declaration |
| `src/components/courses/CourseMasthead.tsx:77` | fontWeight | <code>fontWeight: 800,</code> | HERO_FIGURE_VALUE — text/value styled by this declaration |
| `src/components/courses/browse/ListScopeHeader.tsx:22` | fontWeight | <code>fontWeight: 800,</code> | CAPTION — text/value styled by this declaration |
| `src/components/courses/browse/ListScopeHeader.tsx:31` | fontWeight | <code>fontWeight: 800,</code> | FIGURE_LABEL — text/value styled by this declaration |
| `src/components/courses/browse/PlayedTile.tsx:108` | fontWeight | <code>&lt;b data-tile-title="" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', overflowWrap: 'anywhere', fontSize: 18, lineHeight: &#96;${TILE_NAME_LINE}px&#96;, fontWeight: 800, color: A.INK }}&gt;{title}&lt;/b&gt;</code> | ell — ; ; 0 ? ( |
| `src/components/courses/browse/PlayedTile.tsx:114` | fontWeight | <code>&lt;span data-best-kicker="" style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}&gt;ROUNDS LATELY&lt;/span&gt;</code> | ell — ; ROUNDS LATELY |
| `src/components/courses/browse/PlayedTile.tsx:144` | fontWeight | <code>&lt;span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}&gt;LATEST REVIEW&lt;/span&gt;</code> | under — ; ;  |
| `src/components/courses/browse/PlayedTile.tsx:176` | fontWeight | <code>&lt;span style={{ transform: 'translateZ(0)', position: 'absolute', top: 8, left: 10, fontSize: 28, fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1 }}&gt;{p.holeNo}&lt;/span&gt;</code> | under — ; {p.holeNo}; {tile.hardestHole === p.holeNo ? |
| `src/components/courses/browse/PlayedTile.tsx:177` | fontWeight | <code>{tile.hardestHole === p.holeNo ? &lt;span data-hardest="" style={{ transform: 'translateZ(0)', position: 'absolute', top: 10, right: 8, padding: '3px 6px', borderRadius: 6, background: 'rgba(10,10,12,.6)', color: A.AMBER, fontSize: 8, fontWeight: 800, letterSpacing: '.1em', lineHeight: '10px' }}&gt;HARDEST&lt;/span&gt; : null}</code> | under — : null}; ;  |
| `src/components/courses/browse/PlayedTile.tsx:185` | fontWeight | <code>&lt;span style={{ ...GLASS, boxShadow: undefined, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', transform: 'translateZ(0)', position: 'absolute', top: 10, left: 10, padding: '3px 7px', borderRadius: 6, fontSize: 8, fontWeight: 800, letterSpacing: '.12em', lineHeight: '10px', color: '#FFFFFF' }}&gt;COURSE&lt;/span&gt;</code> | under — ; {p.caption \|\| short};  |
| `src/components/courses/browse/RegionRails.tsx:36` | fontWeight | <code>const nameStyle: React.CSSProperties = { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', fontSize: 14, fontWeight: 800, lineHeight: 1.15 };</code> | nameStyle — text/value styled by this declaration |
| `src/components/courses/browse/RegionRails.tsx:56` | fontWeight | <code>&lt;span data-rail-count="" style={{ ...glassTop, fontSize: 10, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF' }}&gt;{fmtCount(group.activity)}&lt;/span&gt;</code> | media — {course.region ?; {course.region};  |
| `src/components/courses/browse/RegionRails.tsx:67` | fontWeight | <code>Best round &lt;b data-best-gross="" style={{ color: '#FFFFFF', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}&gt;{best.gross_score}&lt;/b&gt;</code> | media — : null}; ;  |
| `src/components/courses/browse/latestHoles.css:11` | CSS font-weight | <code>.latest-hole-label { margin-top: 6px; font-size: 8.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--latest-hole-label-ink); text-shadow: var(--latest-hole-label-shadow); }</code> | CSS selector .latest-hole-label |
| `src/components/courses/course-detail/CategoryScores.tsx:92` | fontWeight | <code>&lt;div style={{ marginTop: 3, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}&gt;{label}&lt;/div&gt;</code> | tone — {label}; ; {hasLead ? ( |
| `src/components/courses/course-detail/about/DefendsPar.tsx:162` | fontWeight | <code>style={{ textAlign: 'center', fontSize: 8.5, fontWeight: hi ? 800 : 700, color: hi ?? A.FAINT, ...FIGS }}</code> | hi — {labelled.has(h.hole_no) ? h.hole_no : ''}; ;  |
| `src/components/courses/course-detail/about/DefendsPar.tsx:182` | fontWeight | <code>&lt;div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}&gt;{c.v}&lt;/div&gt;</code> | hi — {nineLine ?; {nineLine}; : null} |
| `src/components/courses/course-detail/about/DefendsPar.tsx:245` | fontWeight | <code>fontWeight: 800,</code> | amber — ; {signed(p.perHole, 2)};  |
| `src/components/courses/course-detail/about/DefendsPar.tsx:285` | fontWeight | <code>&lt;div style={{ fontSize: 15, fontWeight: 800, color: b.key === 'par' ? A.INK : b.color, ...FIGS }}&gt;</code> | amber — ))}; ; ) : null} |
| `src/components/courses/course-detail/about/HeroCourseRecord.tsx:70` | fontWeight | <code>&lt;div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: MEDAL_GOLD, lineHeight: 1.2 }}&gt;</code> | score — {names}; ;  |
| `src/components/courses/course-detail/about/HeroCourseRecord.tsx:78` | fontWeight | <code>&lt;span className="tabular-nums lining-nums" style={{ fontSize: 21, fontWeight: 800, color: MEDAL_GOLD, lineHeight: 1 }}&gt;</code> | score — ; Gross;  |
| `src/components/courses/course-detail/about/TheVerdict.tsx:58` | fontWeight | <code>&lt;div style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.82, color: A.INK, ...FIGS }}&gt;</code> | parLabel — ; {t('courseDetail.verdict.overPar')};  |
| `src/components/courses/course-detail/about/WhatPeopleSay.tsx:151` | fontWeight | <code>&lt;strong style={{ color: A.INK, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}&gt;{yours.toFixed(1)}&lt;/strong&gt;</code> | seeAll — ; Yours;  |
| `src/components/courses/course-detail/about/WhatPeopleSay.tsx:179` | fontWeight | <code>&lt;strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}&gt;{score?.toFixed(1)}&lt;/strong&gt;</code> | ratedViewer — ; {score?.toFixed(1)};  |
| `src/components/courses/course-detail/about/WhatPeopleSay.tsx:186` | fontWeight | <code>nsform: 'uppercase' }}&gt;You&lt;/span&gt;&lt;b style={{ color: A.INK, fontSize: 14, ...FIGS }}&gt;{yours?.toFixed(1)}&lt;/b&gt;&lt;span style={{ color: A.INK, fontSize: 10, fontWeight: 800, ...FIGS }}&gt;{community.delta &gt; 0 ? '▲' : community.delta &lt; 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}&lt;/span&gt;&lt;/div&gt;}</code> | ratedViewer — }; 0 && (;  |
| `src/components/courses/course-detail/about/verdictBits.tsx:25` | fontWeight | <code>&lt;div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}&gt;{value}&lt;/div&gt;</code> | FactTile — ; {label};  |
| `src/components/courses/course-detail/reviews/FewReviews.tsx:69` | fontWeight | <code>&lt;strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}&gt;{community.score?.toFixed(1)}&lt;/strong&gt;</code> | fullName — ; {getRatingTierLabel(community.score)};  |
| `src/components/courses/course-detail/reviews/FewReviews.tsx:75` | fontWeight | <code>You&lt;/span&gt;&lt;b style={{ color: A.AMBER, fontSize: 14, ...FIGS }}&gt;{community.viewerScore?.toFixed(1)}&lt;/b&gt;&lt;span style={{ color: A.IMPROVED, fontSize: 10, fontWeight: 800, ...FIGS }}&gt;{community.delta &gt; 0 ? '▲' : community.delta &lt; 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}&lt;/span&gt;&lt;/div&gt;}</code> | fullName — }; {!stateFour &&; person.name) && |
| `src/components/courses/course-detail/reviews/FewReviews.tsx:97` | fontWeight | <code>{facts && known.length &gt; 0 && &lt;section style={section}&gt;&lt;span style={{ display: 'inline-block', color: MEDAL_GOLD, background: inkWithAlpha(MEDAL_GOLD, 0.10), border: &#96;1px solid ${inkWithAlpha(MEDAL_GOLD, 0.28)}&#96;, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 11 }}&gt;People you know&lt;/span&gt;{known.map(review =&gt; renderPerson(review, true))}&lt;/section&gt;}</code> | fullName — 0 &&; Everyone else; renderPerson(review, true))} |
| `src/components/courses/course-detail/reviews/SingleReview.tsx:65` | fontWeight | <code>&lt;div data-community-score style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.9, color: A.INK, ...FIGS }}&gt;{Number(communityScore).toFixed(1)}&lt;/div&gt;</code> | lede — ; The community score;  |
| `src/components/courses/course-detail/reviews/SingleReview.tsx:110` | fontWeight | <code>{month && &lt;span data-played-season style={{ display: 'inline-block', marginTop: 9, padding: '3px 9px', borderRadius: 999, color: SC_BOGEY_DARK, background: inkWithAlpha(SC_BOGEY_DARK, 0.10), border: &#96;1px solid ${inkWithAlpha(SC_BOGEY_DARK, 0.22)}&#96;, fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' }}&gt;Played {month}&lt;/span&gt;}</code> | contextItems — Played {month}; } |
| `src/components/courses/course-detail/reviews/TheScore.tsx:52` | fontWeight | <code>fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1,</code> | EYEBROW — {children} |
| `src/components/courses/course-detail/reviews/TheScore.tsx:55` | fontWeight | <code>...FIGS, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8,</code> | FIGURE — ( |
| `src/components/courses/course-detail/you/BoardList.tsx:59` | fontWeight | <code>&lt;div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: r.held ? A.DIM : MEDAL_GOLD }}&gt;</code> | rows — {r.held ? t('courseDetail.youTab.grabs.heldTag') : t('courseDetail.youTab.unclaimed.open')}; ; ))} |
| `src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:58` | fontWeight | <code>&lt;div className="tabular-nums" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: MEDAL_GOLD, ...FIGS }}&gt;</code> | boardTotal — ; {formatNumber(openBoards)};  |
| `src/components/courses/course-detail/you/many/ManySections.tsx:39` | fontWeight | <code>&lt;div style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}&gt;{value}&lt;/div&gt;</code> | LadderRow — ; {value};  |
| `src/components/courses/course-detail/you/many/ManySections.tsx:121` | SVG fontWeight attribute | <code>&lt;text x={cx} y={66} textAnchor="middle" fontSize={10} fontWeight={800} fill={on ? A.CANVAS : A.BODY}&gt;{f1(s.avgGross as number)}&lt;/text&gt;</code> | SVG chart labels — season average gross |
| `src/components/courses/course-detail/you/many/ManySections.tsx:122` | SVG fontWeight attribute | <code>&lt;text x={cx} y={86} textAnchor="middle" fontSize={9} fontWeight={on ? 800 : 700} fill={on ? A.IMPROVED : A.FAINT}&gt;{s.year}&lt;/text&gt;</code> | SVG chart labels — season year |
| `src/components/courses/course-detail/you/many/ManySections.tsx:151` | fontWeight | <code>&lt;div style={{ width: 42, textAlign: 'right', fontSize: 12.5, fontWeight: 800, letterSpacing: '-0.02em', color: under ? RAMP_TOPAR.birdie : A.INK, ...FIGS }}&gt;{signed1(v)}&lt;/div&gt;</code> | under — ; {signed1(v)};  |
| `src/components/courses/course-detail/you/many/ManySections.tsx:241` | SVG fontWeight attribute | <code>fontWeight={least?.hole_no === e.hole_no \|\| level.has(e.hole_no) ? 800 : 700}</code> | SVG chart labels — hole numbers |
| `src/components/courses/course-detail/you/many/ManySections.tsx:309` | fontWeight | <code>&lt;div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.9, color: Y.GOLD, ...FIGS }}&gt;{done}&lt;/div&gt;</code> | one — birdied here; ;  |
| `src/components/courses/course-detail/you/many/ManySections.tsx:326` | fontWeight | <code>&lt;b style={{ display: 'block', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}&gt;{v}&lt;/b&gt;</code> | one — {l}; ; ))} |
| `src/components/courses/course-detail/you/many/ManySections.tsx:361` | fontWeight | <code>&lt;b style={{ display: 'block', fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}&gt;{r.value}&lt;/b&gt;</code> | WithinReachSection — {r.mark}; ;  |
| `src/components/courses/course-detail/you/many/ManySections.tsx:399` | fontWeight | <code>&lt;div style={{ fontSize: 13, fontWeight: 800, color: A.INK, ...FIGS }}&gt;{v}&lt;/div&gt;</code> | link — ; 0 ? (; ( |
| `src/components/courses/course-detail/you/many/manyBits.tsx:68` | fontWeight | <code>&lt;div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: f.tone ?? A.INK, ...FIGS }}&gt;{f.value}&lt;/div&gt;</code> | Facts — {f.label}; ; ))} |
| `src/components/courses/course-detail/you/many/manyBits.tsx:83` | fontWeight | <code>&lt;div style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.9, color: A.INK, ...FIGS }}&gt;{value}&lt;/div&gt;</code> | Verd — {line2}; : null};  |
| `src/components/courses/courseListCard.css:12` | CSS font-weight | <code>.course-list-name { margin:0; font-size:18px; font-weight:800; letter-spacing:-0.01em; line-height:1.1; color:var(--course-list-photo-ink); text-shadow:var(--course-list-name-shadow); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }</code> | CSS selector .course-list-name |
| `src/components/courses/courseListCard.css:28` | CSS font-weight | <code>.course-list-record-label { font-size:8.5px; font-weight:800; letter-spacing:0.14em; line-height:1.1; color:var(--course-list-record) }</code> | CSS selector .course-list-record-label |
| `src/components/courses/courseListCard.css:32` | CSS font-weight | <code>.course-list-gross-label { margin-top:2px; font-size:8px; font-weight:800; letter-spacing:0.14em; color:var(--course-list-dim) }</code> | CSS selector .course-list-gross-label |
| `src/components/courses/courseListView.css:6` | CSS font-weight | <code>.course-list-columns { padding:0 16px 8px; font-size:9px; font-weight:800; letter-spacing:0.14em; color:var(--course-list-dim) }</code> | CSS selector .course-list-columns |
| `src/components/courses/top100/t100Race.css:15` | CSS font-weight | <code>.t100-captions { position: relative; height: 12px; margin-top: 7px; font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--t100-dim); }</code> | CSS selector .t100-captions |
| `src/components/courses/top100/t100Race.css:25` | CSS font-weight | <code>.t100-photo-rank { position: absolute; left: 8px; top: 6px; font-size: 10px; font-weight: 800; text-shadow: var(--t100-photo-shadow); color: var(--t100-ink); }</code> | CSS selector .t100-photo-rank |
| `src/components/courses/top100/t100Race.css:26` | CSS font-weight | <code>.t100-photo-name { position: absolute; left: 8px; right: 8px; bottom: 7px; font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; line-height: 1.15; text-align: left; white-space: normal; color: var(--t100-ink); text-shadow: var(--t100-photo-shadow); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }</code> | CSS selector .t100-photo-name |
| `src/components/courses/top100/t100Race.css:43` | CSS font-weight | <code>.t100-see { display: flex; gap: 6px; height: auto; padding: 14px 16px 0; border-radius: 0; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--t100-mute); }</code> | CSS selector .t100-see |
| `src/components/explore-tab-new/courseled/BoardFilterPanel.tsx:435` | fontWeight | <code>style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, lineHeight: 1 }}</code> | headerTitle — ; ; {/* S1.4 — RESET lives here now. Disabled and dim at defaults. */} |
| `src/components/explore-tab-new/courseled/BoardRows.tsx:348` | fontWeight | <code>fontWeight: 800,</code> | BoardDaySeparator — {label} |
| `src/components/explore-tab-new/courseled/BoardRows.tsx:479` | fontWeight | <code>fontWeight: 800,</code> | chip — ; {feat ? ( |
| `src/components/explore-tab-new/courseled/CompetitionBoards.tsx:57` | fontWeight | <code>&lt;div style={{ display: 'flex', alignItems: 'center', lineHeight: 1.25, fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.FAINT, ...style }}&gt;</code> | Heads — ; {t('discover.filterBoard.col.net', { defaultValue: 'Net' })};  |
| `src/components/explore-tab-new/courseled/CompetitionBoards.tsx:82` | fontWeight | <code>&lt;span style={{ lineHeight: 1.25, width: 22, flex: 'none', fontSize: 10, fontWeight: 800, color: isSelf ? A.AMBER : A.FAINT }}&gt;{posText(r)}&lt;/span&gt;</code> | isSelf — ; {posText(r)};  |
| `src/components/explore-tab-new/courseled/CompetitionBoards.tsx:126` | fontWeight | <code>&lt;span style={{ lineHeight: 1.25, width: 30, flex: 'none', fontSize: 10.5, fontWeight: 800, color: isSelf ? A.AMBER : A.FAINT }}&gt;{posText(r)}&lt;/span&gt;</code> | isSelf — {posText(r)}; ;  |
| `src/components/explore-tab-new/courseled/CompetitionMark.tsx:26` | fontWeight | <code>&lt;span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1 }}&gt;{t('discover.filterBoard.competitionShort', { defaultValue: 'Comp' })}&lt;/span&gt;</code> | CompetitionMark — ; {t('discover.filterBoard.competitionShort', { defaultValue: 'Comp' })};  |
| `src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx:320` | fontWeight | <code>fontWeight: 800,</code> | height — ; {row.name ?? '\u2014'};  |
| `src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx:509` | fontWeight | <code>&lt;h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: A.INK }}&gt;</code> | hasAnalytics — ; {media};  |
| `src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx:855` | fontWeight | <code>&lt;span className="tabular-nums" style={{ fontSize: 17, fontWeight: 800, color: A.INK, lineHeight: 1 }}&gt;</code> | lowLabel — {toParText}; )};  |
| `src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx:201` | fontWeight | <code>&lt;h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: A.INK }}&gt;</code> | clear — ; {subjectName ?? '\u2014'};  |
| `src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx:265` | fontWeight | <code>fontWeight: 800,</code> | CoursePhoto — ; {name ?? '\u2014'}; {area && ( |
| `src/components/explore-tab-new/courseled/RoundShape.tsx:262` | SVG fontWeight attribute | <code>&lt;text x={point.x} y={labelY} textAnchor="middle" fontSize={7.5} fontWeight={800}</code> | SVG chart labels — hole numbers |
| `src/components/explore-tab-new/courseled/StandoutTile.tsx:352` | fontWeight | <code>fontWeight: 800,</code> | large — ;  |
| `src/components/explore-tab-new/courseled/StandoutTile.tsx:386` | fontWeight | <code>fontWeight: 800,</code> | large — ) : null}; {wait} |
| `src/components/explore-tab-new/courseled/rowMetrics.ts:21` | weight token | <code>figureWeight: 800,</code> | Leaderboard row figure/rank token |
| `src/components/explore-tab-new/courseled/rowMetrics.ts:30` | weight token | <code>posWeight: 800,</code> | Leaderboard row figure/rank token |
| `src/components/feed/PostGolfContext.tsx:186` | fontWeight | <code>&lt;b style={{ display: 'block', fontSize: 13.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: INK }}&gt;</code> | cols — {signedScore(toPar)}; )};  |
| `src/components/feed/PostGolfContext.tsx:192` | fontWeight | <code>&lt;span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: DIM, marginTop: 2 }}&gt;</code> | cols — ROUND; ; {shape && ( |
| `src/components/invite/inviteConnected.css:10` | CSS font-weight | <code>.if1-stat span { display:block; margin-top:2px; font-size:9.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--invite-dim); }</code> | CSS selector .if1-stat span |
| `src/components/invite/inviteConnected.css:19` | CSS font-weight | <code>.if1-group-title { display:flex; justify-content:space-between; gap:12px; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--invite-dim); margin:20px 20px 4px; }</code> | CSS selector .if1-group-title |
| `src/components/likes/LikesSheet.tsx:195` | fontWeight | <code>&lt;div style={{ padding: '14px 16px 7px', fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: A.DIM }}&gt;</code> | eyebrow — (; {label};  |
| `src/components/profile/AchievementsPane.tsx:41` | Tailwind | <code>className="mt-1 text-[32px] font-extrabold leading-none text-foreground tabular-nums"</code> | Figure — {label}; ;  |
| `src/components/profile/courses/BreakdownsPickerSheet.tsx:144` | fontWeight | <code>fontWeight: 800,</code> | bandLabel — ;  |
| `src/components/profile/courses/CourseLegacyCard.tsx:101` | fontWeight | <code>&lt;span data-testid="legacy-brand" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em', color: MEDAL_GOLD }}&gt;</code> | farName — {year}; ;  |
| `src/components/profile/courses/CourseLegacyCard.tsx:108` | fontWeight | <code>&lt;div style={{ fontSize: 58, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.85, marginTop: 12, color: A.INK, fontVariantNumeric: 'tabular-nums' }}&gt;</code> | farName — ; {clauses.join(' · ')}; {best && ( |
| `src/components/profile/courses/JourneySummaryCard.tsx:121` | fontWeight | <code>&lt;span data-testid="record-played" style={{ fontSize: 76, fontWeight: 800, letterSpacing: 0, lineHeight: 0.8, color: A.INK, fontVariantNumeric: 'tabular-nums lining-nums' }}&gt;</code> | tiles — courses played; ; across |
| `src/components/profile/courses/JourneySummaryCard.tsx:139` | fontWeight | <code>&lt;div data-testid={&#96;tile-${tile.label}&#96;} style={{ fontSize: 21, fontWeight: 800, letterSpacing: 0, color: tile.missing ? A.DIM : A.INK, fontVariantNumeric: 'tabular-nums', minHeight: 21, textAlign: 'center' }}&gt;</code> | tiles — ; {tile.value};  |
| `src/components/profile/courses/my-ratings/MyRatingsYearDivider.tsx:26` | fontWeight | <code>fontWeight: 800,</code> | MyRatingsYearDivider — ; {year ?? 'Undated'};  |
| `src/components/profile/handicap/whs/connect/connect-seat.css:2` | CSS font-weight | <code>.connect-seat h1 { margin: 0; font-size: 38px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.04; overflow-wrap: anywhere; }</code> | CSS selector .connect-seat h1 |
| `src/components/profile/handicap/whs/connect/connect-seat.css:10` | CSS font-weight | <code>.connect-seat-index { flex: none; font-size: 19px; font-weight: 800; font-variant-numeric: tabular-nums; }</code> | CSS selector .connect-seat-index |
| `src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:64` | fontWeight | <code>&lt;span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: CHART.DIM, ...FIG }}&gt;{a.current.toFixed(1)}&lt;/span&gt;</code> | bodyVars — ; {a.settleAt.toFixed(1)}; {a.inRounds != null && ( |
| `src/components/profile/handicap/whs/sections/AgeingOutSection.tsx:66` | fontWeight | <code>&lt;span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: CHART.AMBER, ...FIG }}&gt;{a.settleAt.toFixed(1)}&lt;/span&gt;</code> | bodyVars — ; {a.settleAt.toFixed(1)}; {a.inRounds != null && ( |
| `src/components/profile/handicap/whs/sections/HolesSection.tsx:142` | fontWeight | <code>&lt;span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: A.MUTE, ...FIG }}&gt;</code> | fill — {row.shotsPerRound.toFixed(1)}; )};  |
| `src/components/profile/handicap/whs/sections/HolesSection.tsx:186` | fontWeight | <code>&lt;div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, color: b.pct === 0 ? CHART.MUTE : b.color, ...FIG }}&gt;</code> | fill — ; {b.pct}%;  |
| `src/components/profile/handicap/whs/sections/NotConnectedSection.tsx:57` | fontWeight | <code>fontWeight: 800,</code> | navigate — ; ;  |
| `src/components/profile/handicap/whs/sections/RoundsThatCountSection.tsx:273` | fontWeight | <code>fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1,</code> | r — {fmtDiff(r.diff as number)}; ;  |
| `src/components/profile/handicap/whs/sections/compare/CompareSheet.tsx:238` | fontWeight | <code>&lt;div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(248,250,252,0.5)' }}&gt;HEAD TO HEAD&lt;/div&gt;</code> | handleClose — HEAD TO HEAD; ; {target.name ? &#96;You and ${targetFirst}&#96; : |
| `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:22` | fontWeight | <code>const KICK: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(248,250,252,0.5)', textTransform: 'uppercase' };</code> | KICK — text/value styled by this declaration |
| `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:23` | fontWeight | <code>const COLH: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(248,250,252,0.45)', textTransform: 'uppercase' };</code> | COLH — text/value styled by this declaration |
| `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:94` | fontWeight | <code>&lt;b data-hh-score="me" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: meBright ? HH_INK : HH_DIM }}&gt;{r.wins}&lt;/b&gt;</code> | themBright — ; {DASH};  |
| `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:96` | fontWeight | <code>&lt;b data-hh-score="them" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: themBright ? HH_INK : HH_DIM }}&gt;{r.losses}&lt;/b&gt;</code> | themBright — ; ;  |
| `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:115` | fontWeight | <code>const recSmall: React.CSSProperties = { color: 'rgba(248,250,252,0.45)', fontWeight: 800, fontSize: 8.5, letterSpacing: '0.12em', marginRight: 5 };</code> | recSmall —  |
| `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:136` | fontWeight | <code>&lt;span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(248,250,252,0.5)', marginTop: 2 }}&gt;{x.l}&lt;/span&gt;</code> | recSmall — ))}; ;  |
| `src/components/profile/handicap/whs/sections/compare/HeadToHeadDetail.tsx:194` | fontWeight | <code>&lt;span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(248,250,252,0.5)' }}&gt;SHOTS APART&lt;/span&gt;</code> | groups — ; YOU V {first.toUpperCase()};  |
| `src/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere.tsx:52` | fontWeight | <code>&lt;div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: A.AMBER }}&gt;{championsBoardName(category)}&lt;/div&gt;</code> | cards — ; You {row.user_value} · {row.leader_value} to beat;  |
| `src/components/profile/handicap/whs/sections/course-legends/flat/ChampionsElsewhere.tsx:59` | fontWeight | <code>&lt;div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: A.AMBER, fontVariantNumeric: 'tabular-nums' }}&gt;{Number(Number(row.gap).toFixed(1))} off&lt;/div&gt;</code> | cards — ; )}; Only courses you have already played appear here, because a rank is the thing that makes a gap real. |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:16` | CSS font-weight | <code>.champions-cabinet-name { font-size: 9px; font-weight: 800; text-transform: uppercase; line-height: 1.2; overflow-wrap: anywhere; }</code> | CSS selector .champions-cabinet-name |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:17` | CSS font-weight | <code>.champions-cabinet-value { font-size: 15px; font-weight: 800; margin-top: 5px; line-height: 1; font-variant-numeric: tabular-nums; }</code> | CSS selector .champions-cabinet-value |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:18` | CSS font-weight | <code>.champions-cabinet-state { font-size: 9px; font-weight: 800; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; }</code> | CSS selector .champions-cabinet-state |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:40` | CSS font-weight | <code>.champions-field-record strong { font-size: 32px; font-weight: 800; line-height: 1; }</code> | CSS selector .champions-field-record strong |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:43` | CSS font-weight | <code>.champions-field-stats strong { display: block; font-size: 14px; font-weight: 800; }</code> | CSS selector .champions-field-stats strong |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:51` | CSS font-weight | <code>.champions-cabinet-projected .champions-cabinet-state { font-weight: 800; }</code> | CSS selector .champions-cabinet-projected .champions-cabinet-state |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:57` | CSS font-weight | <code>.champions-cabinet-tile[data-state="yours"] .champions-cabinet-state { font-weight: 800; letter-spacing: 0.08em; }</code> | CSS selector .champions-cabinet-tile[data-state="yours"] .champions-cabinet-state |
| `src/components/profile/handicap/whs/sections/course-legends/flat/championsEmpty.css:60` | CSS font-weight | <code>.champions-pinned-divider { display: flex; align-items: center; gap: 8px; margin: 8px 0; font-size: 9.5px; text-transform: uppercase; font-weight: 800; }</code> | CSS selector .champions-pinned-divider |
| `src/components/profile/hero/ProfileCoverBand.tsx:189` | fontWeight | <code>fontWeight: 800,</code> | showCover — text/value styled by this declaration |
| `src/components/profile/hero/ProfileCoverBand.tsx:255` | fontWeight | <code>fontWeight: 800,</code> | showCover —  |
| `src/components/profile/hero/ProfileHero.tsx:200` | fontWeight | <code>&lt;span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: A.INK }}&gt;#{amateurRank}&lt;/span&gt;</code> | rankingLine — World amateur ranking; {amateurMovement &&;  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:179` | fontWeight | <code>fontWeight: 800,</code> | kicker — {kicker}; ;  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:201` | fontWeight | <code>&lt;div style={{ fontSize: story ? 10.5 : 9.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ON_PHOTO_KICKER }}&gt;</code> | kicker — ; {t('topTen.share.no', { n: 1, defaultValue: 'No. {{n}}' })};  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:204` | fontWeight | <code>&lt;div style={{ marginTop: story ? 6 : 3, fontSize: story ? 31 : 24, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: story ? 1.02 : 1.04, color: ON_PHOTO }}&gt;</code> | kicker — ; {heroName.short};  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:212` | fontWeight | <code>&lt;div style={{ fontSize: story ? 46 : 34, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.95, color: scoreColor(hero.rating) }}&gt;</code> | kicker — ; {hero.rating != null ? hero.rating.toFixed(1) : ''}; {hero.rating != null && ( |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:216` | fontWeight | <code>&lt;div style={{ marginTop: story ? 6 : 4, fontSize: story ? 9.5 : 8.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: scoreColor(hero.rating) }}&gt;</code> | kicker — ; ; 0 && ( |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:275` | fontWeight | <code>&lt;div style={{ fontSize: story ? 9 : 8.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ON_PHOTO_KICKER }}&gt;</code> | photo — ; {t('topTen.share.no', { n: c.position, defaultValue: 'No. {{n}}' })};  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:282` | fontWeight | <code>fontWeight: 800,</code> | photo —  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:303` | fontWeight | <code>&lt;span style={{ flexShrink: 0, fontSize: story ? 20 : 17, fontWeight: 800, letterSpacing: story ? '-0.035em' : '-0.03em', lineHeight: 1, color: scoreColor(c.rating) }}&gt;</code> | photo — {c.rating != null ? c.rating.toFixed(1) : ''}; ;  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:330` | fontWeight | <code>&lt;span style={{ fontSize: 12, fontWeight: 800, color: ROW_NUM }}&gt;{String(c.position).padStart(2, '0')}&lt;/span&gt;</code> | nm — {String(c.position).padStart(2, '0')}; ;  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:332` | fontWeight | <code>&lt;div style={{ fontSize: 14.5, fontWeight: 750, letterSpacing: '-0.015em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...CLIP }}&gt;</code> | nm — ; {nm.short};  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:339` | fontWeight | <code>&lt;span style={{ textAlign: 'right', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: scoreColor(c.rating) }}&gt;</code> | nm — {c.rating != null ? c.rating.toFixed(1) : ''}; ; ) : ( |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:355` | fontWeight | <code>&lt;span style={{ fontSize: 11, fontWeight: 800, color: ROW_NUM }}&gt;{String(c.position).padStart(2, '0')}&lt;/span&gt;</code> | nm — {String(c.position).padStart(2, '0')}; ; {nm.short}{' '} |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:356` | fontWeight | <code>&lt;div style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, fontWeight: 750, letterSpacing: '-0.01em', ...CLIP }}&gt;</code> | nm — {tersePlace(c, nm.variant)}; ;  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:360` | fontWeight | <code>&lt;span style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: scoreColor(c.rating) }}&gt;</code> | nm — ; {c.rating != null ? c.rating.toFixed(1) : ''};  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:406` | fontWeight | <code>fontWeight: 800,</code> | nm — {initialsOf(identity.displayName)}; )};  |
| `src/components/profile/hero/topTenShare/TopTenShareCard.tsx:413` | fontWeight | <code>&lt;div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.01em' }}&gt;{identity.displayName}&lt;/div&gt;</code> | nm — ; ; ) : ( |
| `src/components/profile/hero/topTenShare/TopTenShareSheet.tsx:159` | fontWeight | <code>fontWeight: active ? 800 : 700,</code> | segBtn — ;  |
| `src/components/profile/hero/topTenShare/TopTenShareSheet.tsx:167` | fontWeight | <code>&lt;h1 id="top-ten-share-title" style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}&gt;</code> | segBtn — ; {t('topTen.share.title', 'Share your ten')};  |
| `src/components/profile/hero/topTenShare/TopTenShareSheet.tsx:246` | fontWeight | <code>style={{ flex: 1.4, minHeight: 50, border: 'none', borderRadius: 14, background: '#F8FAFC', color: '#0A0A0C', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}</code> | segBtn — ; ; {/* Off-screen full-size card; capture never uses the scaled preview. */} |
| `src/components/profile/rounds/ProfileRoundsTab.tsx:57` | fontWeight | <code>const DIVIDER_TITLE: React.CSSProperties = { fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: RT.INK, ...TAB };</code> | DIVIDER_TITLE — text/value styled by this declaration |
| `src/components/profile/rounds/ProfileRoundsTab.tsx:109` | fontWeight | <code>style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: CHART.INK, color: CHART.CANVAS, border: 0, borderRadius: 12, padding: 14, fontFamily: SANS, fontSize: 13.5, fontWeight: 800, letterSpacing: '0.02em', cursor: 'pointer' }}</code> | year — ; ;  |
| `src/components/profile/rounds/ProfileRoundsTab.tsx:238` | fontWeight | <code>&lt;span style={{ width: COL.gross, flex: 'none', textAlign: 'right', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: isBest ? CHART.AMBER : RT.INK, ...TAB }}&gt;</code> | fig — )}; ;  |
| `src/components/profile/rounds/sections/SeasonSection.tsx:27` | fontWeight | <code>&lt;div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: RT.INK, minHeight: 19, ...TAB }}&gt;{value}&lt;/div&gt;</code> | Tile — ; {label};  |
| `src/components/profile/rounds/sections/SeasonSection.tsx:47` | fontWeight | <code>&lt;span style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.82, color: RT.INK, ...TAB }}&gt;</code> | months — ; scoring average;  |
| `src/components/settings/settingsPrivacy.css:3` | CSS font-weight | <code>.st3-seen i { display:block;font-style:normal;font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:var(--ep-dim) }</code> | CSS selector .st3-seen i |
| `src/components/shared/ReviewGhostScore.tsx:82` | fontWeight | <code>fontWeight: 800,</code> | labelSpan — {tierLabel} |
| `src/components/ui/RailChips.tsx:290` | fontWeight | <code>fontWeight: size === 'tile' ? 800 : RAIL_CHIP_WEIGHT,</code> | active — text/value styled by this declaration |
| `src/features/admin/AdminShell.tsx:292` | fontWeight | <code>background: 'rgba(61,220,145,0.12)', color: t.okText, fontSize: 12, fontWeight: 800, cursor: 'pointer',</code> | q — ; {num(q.data?.now ?? null)} in app |
| `src/features/admin/components/analytics/BehaviourLens.tsx:53` | fontWeight | <code>&lt;span style={{ fontSize: 12.5, fontWeight: 800, textAlign: 'right' }}&gt;{pct(r.ret)}&lt;/span&gt;</code> | tone — ; {lift == null ? DASH : &#96;${lift.toFixed(1)}x&#96;};  |
| `src/features/admin/components/analytics/BehaviourLens.tsx:54` | fontWeight | <code>&lt;span style={{ fontSize: 11, fontWeight: 800, textAlign: 'right', color: tone === 'good' ? t.okText : tone === 'bad' ? t.dangerText : t.inkMuted }}&gt;</code> | tone — {lift == null ? DASH : &#96;${lift.toFixed(1)}x&#96;}; ; Shows who uses what, not proof a feature makes them stay. |
| `src/features/admin/components/analytics/BehaviourLens.tsx:115` | fontWeight | <code>&lt;span style={{ fontSize: 12, fontWeight: 800, textAlign: 'right' }}&gt;{pct(f.pct)}&lt;/span&gt;</code> | top — ; ))}; )} |
| `src/features/admin/components/analytics/BehaviourLens.tsx:148` | fontWeight | <code>&lt;span style={{ fontWeight: 800 }}&gt;{pct(r.pct)}&lt;/span&gt;</code> | colour — ))}; ; )} |
| `src/features/admin/components/analytics/HealthLens.tsx:59` | fontWeight | <code>&lt;span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}&gt;{num(wg.this_week)}&lt;/span&gt;</code> | chip — {chip.text}; };  |
| `src/features/admin/components/analytics/HealthLens.tsx:60` | fontWeight | <code>{chip && &lt;span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: chip.bg, color: chip.fg }}&gt;{chip.text}&lt;/span&gt;}</code> | chip — ; Members who opened the app this week and have rounds clbhouz can analyse;  |
| `src/features/admin/components/analytics/HealthLens.tsx:97` | fontWeight | <code>&lt;span style={{ fontSize: 16, fontWeight: 800, color: colour }}&gt;{pct(value)}&lt;/span&gt;</code> | EffectRow — ; ;  |
| `src/features/admin/components/analytics/HealthLens.tsx:120` | fontWeight | <code>&lt;span style={{ display: 'block', marginTop: 2, fontSize: 16, fontWeight: 800 }}&gt;</code> | m — after joining; )};  |
| `src/features/admin/components/analytics/HealthLens.tsx:155` | fontWeight | <code>height: 24, borderRadius: 4, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 10.5, fontWeight: 800,</code> | v — {v}; ))} |
| `src/features/admin/components/analytics/JourneysLens.tsx:71` | fontWeight | <code>&lt;span style={{ fontSize: 16, fontWeight: 800 }}&gt;{num(st.n)}&lt;/span&gt;</code> | w — ; ;  |
| `src/features/admin/components/analytics/LiveLens.tsx:29` | fontWeight | <code>&lt;span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}&gt;{num(d.now)}&lt;/span&gt;</code> | unit — {unit}; ;  |
| `src/features/admin/components/analytics/LiveLens.tsx:77` | fontWeight | <code>&lt;span style={{ width: 34, height: 34, borderRadius: 17, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, fontWeight: 800, color: t.canvas, background: bg }}&gt;{initials(p)}&lt;/span&gt;</code> | screen — {initials(p)}; )};  |
| `src/features/admin/components/analytics/LiveLens.tsx:82` | fontWeight | <code>{p.is_staff && &lt;span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}&gt;Staff&lt;/span&gt;}</code> | screen — {screen}; ;  |
| `src/features/admin/components/analytics/LiveLens.tsx:87` | fontWeight | <code>&lt;span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}&gt;{onFor(p.on_secs)}&lt;/span&gt;</code> | screen — {p.session_secs == null ? DASH : &#96;${Math.floor(p.session_secs / 60)} min in&#96;}; ;  |
| `src/features/admin/components/analytics/LiveLens.tsx:132` | fontWeight | <code>&lt;span style={{ fontSize: 13, fontWeight: 800 }}&gt;{num(r.n)}&lt;/span&gt;</code> | first — ; ;  |
| `src/features/admin/components/analytics/ScreensLens.tsx:68` | fontWeight | <code>&lt;span style={{ fontSize: 13, fontWeight: 800 }}&gt;{dur(r.secs)}&lt;/span&gt;</code> | on — {num(r.members)}; ;  |
| `src/features/admin/components/analytics/analyticsUi.tsx:48` | fontWeight | <code>&lt;div style={{ marginTop: 2, fontSize: size, fontWeight: 800, color: valueColor }}&gt;{value}&lt;/div&gt;</code> | Fig — {sub != null &&; {sub}; } |
| `src/features/admin/components/content/StorySection.tsx:54` | fontWeight | <code>color: primary ? t.canvas : t.ink, fontSize: 12.5, fontWeight: primary ? 800 : 700, cursor: 'pointer',</code> | btn — text/value styled by this declaration |
| `src/features/admin/components/content/StorySection.tsx:92` | fontWeight | <code>fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 999,</code> | throughOk — )}; ;  |
| `src/features/admin/components/content/StorySection.tsx:98` | fontWeight | <code>{story?.kicker && &lt;div style={{ marginTop: 10, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkFaint }}&gt;{story.kicker}&lt;/div&gt;}</code> | throughOk — }; {story?.headline ?? ''}; {story?.standfirst && |
| `src/features/admin/components/content/StorySection.tsx:99` | fontWeight | <code>&lt;h1 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25, color: t.ink }}&gt;{story?.headline ?? ''}&lt;/h1&gt;</code> | throughOk — {story?.standfirst &&; {story.standfirst}; } |
| `src/features/admin/components/content/StorySection.tsx:153` | fontWeight | <code>&lt;span style={{ fontSize: 12, fontWeight: 800, textAlign: 'right', color: t.ink }}&gt;{s.opens}&lt;/span&gt;</code> | r — Shared link: the session started on this story, so someone outside the app sent it.; ;  |
| `src/features/admin/components/content/deskTokens.ts:28` | fontWeight | <code>export const FIG: React.CSSProperties = { marginTop: 2, fontSize: 20, fontWeight: 800, color: t.ink };</code> | FIG — text/value styled by this declaration |
| `src/features/admin/components/health/AppLens.tsx:28` | fontWeight | <code>&lt;span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color }}&gt;{cf ? cf.text : '-'}&lt;/span&gt;</code> | color — ; {body};  |
| `src/features/admin/components/health/AppLens.tsx:53` | fontWeight | <code>&lt;div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, lineHeight: 1 }}&gt;-&lt;/div&gt;</code> | members — ) : (; ;  |
| `src/features/admin/components/health/AppLens.tsx:59` | fontWeight | <code>&lt;span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}&gt;{Math.round(pctOf(b.current))}%&lt;/span&gt;</code> | members — ; ;  |
| `src/features/admin/components/health/AppLens.tsx:85` | fontWeight | <code>{(m.errors ?? 0) &gt; 0 && &lt;span style={{ fontSize: 12, fontWeight: 800, color: H.amber }}&gt;{plural(m.errors!, 'error')}&lt;/span&gt;}</code> | members — 3 && !all && (; {a.old_members.length - 3} more; )} |
| `src/features/admin/components/health/AppLens.tsx:133` | fontWeight | <code>&lt;span style={{ fontSize: 12, fontWeight: 800 }}&gt;{num(e.n)}&lt;/span&gt;</code> | h — ; ))}; )} |
| `src/features/admin/components/health/AppLens.tsx:161` | fontWeight | <code>&lt;span style={{ fontSize: 13, fontWeight: 800, color: !q ? t.ink : q.errored_24h &gt; 0 ? H.dangerText : H.okText }}&gt;{q ? &#96;${num(q.errored_24h)} failed&#96; : '-'}&lt;/span&gt;</code> | newest — ; ;  |
| `src/features/admin/components/health/AppLens.tsx:170` | fontWeight | <code>&lt;span style={{ marginLeft: 6, fontSize: 13, fontWeight: 800 }}&gt;{latest.length ? &#96;${okN}/${latest.length}&#96; : '-'}&lt;/span&gt;</code> | newest — ; ;  |
| `src/features/admin/components/health/AppLens.tsx:201` | fontWeight | <code>fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: cool ? 'default' : 'pointer', opacity: cool ? 0.6 : 1,</code> | send — ; };  |
| `src/features/admin/components/health/GolfDataLens.tsx:54` | fontWeight | <code>&lt;span style={{ fontSize: 16, fontWeight: 800 }}&gt;{num(r.n)}&lt;/span&gt;</code> | rows — ; ))}; )} |
| `src/features/admin/components/health/GolfDataLens.tsx:73` | fontWeight | <code>&lt;div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color: kind === 'fresh' ? H.okText : hot ? H.amber : t.ink }}&gt;{num(v)}&lt;/div&gt;</code> | hot — ; ;  |
| `src/features/admin/components/health/GolfDataLens.tsx:82` | fontWeight | <code>&lt;span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}&gt;{num(c.connected)}&lt;/span&gt;</code> | hot — members connected; ;  |
| `src/features/admin/components/health/GolfDataLens.tsx:106` | fontWeight | <code>&lt;span style={{ fontSize: 12, fontWeight: 800 }}&gt;{m.last_synced_at ? &#96;${ageOf(m.last_synced_at)} ago&#96; : 'never'}&lt;/span&gt;</code> | hot — ))}; ; )} |
| `src/features/admin/components/health/GolfDataLens.tsx:125` | fontWeight | <code>&lt;span style={{ fontSize: 14, fontWeight: 800, color: p == null ? t.ink : good ? H.okText : H.amber }}&gt;{p == null ? '-' : &#96;${p}%&#96;}&lt;/span&gt;</code> | good — ; {missing == null ? '-' : missing === 0 ? 'None missing' : sub(missing)};  |
| `src/features/admin/components/health/JobsLens.tsx:97` | fontWeight | <code>{problem && &lt;span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: PROBLEM_LABEL[problem].color }}&gt;{PROBLEM_LABEL[problem].text}&lt;/span&gt;}</code> | err — &middot;; ; {info.what && |
| `src/features/admin/components/health/JobsLens.tsx:248` | fontWeight | <code>&lt;span style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, fontWeight: 800, color: t.canvas, background: ic.bg }}&gt;{ic.letter}&lt;/span&gt;</code> | inner — ; {logTitle(r)};  |
| `src/features/admin/components/health/StatusLens.tsx:42` | fontWeight | <code>&lt;div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}&gt;</code> | first — {first?.body &&; {first.body}; 1 && ( |
| `src/features/admin/components/health/StatusLens.tsx:57` | fontWeight | <code>height: 34, padding: '0 14px', borderRadius: 999, background: p.btn, color: t.canvas, fontSize: 12, fontWeight: 800,</code> | first — Open {lensLabel(first.lens)}; )};  |
| `src/features/admin/components/health/StatusLens.tsx:87` | fontWeight | <code>&lt;span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}&gt;{hoursMins(p.median_hrs)}&lt;/span&gt;</code> | scale — ; {hoursMins(p.median_hrs)}; {p.median_hrs != null && ( |
| `src/features/admin/components/health/StatusLens.tsx:89` | fontWeight | <code>&lt;span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: over ? H.warnChip : H.okChip, color: over ? H.amber : H.okText }}&gt;</code> | scale — {over ? &#96;over ${p.target_hrs}h&#96; : &#96;inside ${p.target_hrs}h&#96;}; )};  |
| `src/features/admin/components/health/StatusLens.tsx:196` | fontWeight | <code>&lt;span style={{ fontSize: 13, fontWeight: 800, color: tone.value }}&gt;{r.value}&lt;/span&gt;</code> | tone — ; ;  |
| `src/features/admin/components/health/healthUi.tsx:44` | fontWeight | <code>? { border: 0, background: t.ink, color: t.canvas, fontWeight: 800 }</code> | PillButton — {children} |
| `src/features/admin/components/memberRadar.css:142` | CSS font-weight | <code>.mr-pill { font-size: 9.5px;   font-weight: 800;   letter-spacing: 0.08em;   text-transform: uppercase;   padding: 3px 7px;   border-radius: 999px;   background: var(--mr-neutral);   color: var(--mr-muted); }</code> | CSS selector .mr-pill |
| `src/features/admin/components/memberRadar.css:163` | CSS font-weight | <code>.mr-index-value { display: block;   font-size: 30px;   font-weight: 800;   letter-spacing: -0.03em;   line-height: 1; }</code> | CSS selector .mr-index-value |
| `src/features/admin/components/memberRadar.css:244` | CSS font-weight | <code>.mr-figure { margin-top: 3px;   font-size: 20px;   font-weight: 800; }</code> | CSS selector .mr-figure |
| `src/features/admin/components/memberRadar.css:370` | CSS font-weight | <code>.mr-area-time { font-size: 12px;   font-weight: 800;   text-align: right; }</code> | CSS selector .mr-area-time |
| `src/features/admin/components/memberRadar.css:445` | CSS font-weight | <code>.mr-seconds { font-size: 12px;   font-weight: 800; }</code> | CSS selector .mr-seconds |
| `src/features/admin/components/memberRadar.css:489` | CSS font-weight | <code>.mr-session-right { text-align: right;   font-size: 12px;   font-weight: 800; }</code> | CSS selector .mr-session-right |
| `src/features/amateur-ranking/ranking-tab.css:10` | CSS font-weight | <code>.amateur-ranking-tab .amr-hl&gt;strong { font-size:44px;font-weight:800;line-height:.9;letter-spacing:-.02em }</code> | CSS selector .amateur-ranking-tab .amr-hl>strong |
| `src/features/amateur-ranking/ranking-tab.css:12` | CSS font-weight | <code>.amateur-ranking-tab .amr-hl b { display:block;font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(248,250,252,.62) }</code> | CSS selector .amateur-ranking-tab .amr-hl b |
| `src/features/amateur-ranking/ranking-tab.css:20` | CSS font-weight | <code>.amateur-ranking-tab .amr-ch .amr-cl { font-size:10px;font-weight:800;fill:rgba(248,250,252,.62) }</code> | CSS selector .amateur-ranking-tab .amr-ch .amr-cl |
| `src/features/amateur-ranking/ranking-tab.css:27` | CSS font-weight | <code>.amateur-ranking-tab .amr-fin { width:40px;flex:none;font-size:13px;font-weight:800 }</code> | CSS selector .amateur-ranking-tab .amr-fin |
| `src/features/amateur-ranking/ranking-tab.css:31` | CSS font-weight | <code>.amateur-ranking-tab .amr-pts { flex:none;text-align:right;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums }</code> | CSS selector .amateur-ranking-tab .amr-pts |
| `src/features/amateur-ranking/ranking-tab.css:39` | CSS font-weight | <code>.amateur-ranking-tab .amr-career b { display:block;font-size:9px;font-weight:800;letter-spacing:.14em;color:rgba(248,250,252,.42) }</code> | CSS selector .amateur-ranking-tab .amr-career b |
| `src/features/amateur-ranking/ranking-tab.css:49` | CSS font-weight | <code>.amateur-ranking-tab.amr-sheet .pro-collection-kicker { font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(248,250,252,.62);margin-bottom:6px }</code> | CSS selector .amateur-ranking-tab.amr-sheet .pro-collection-kicker |
| `src/features/amateur-ranking/ranking-tab.css:52` | CSS font-weight | <code>.amateur-ranking-tab.amr-sheet .pro-collection-field label { display:block;font-size:10px;font-weight:800;letter-spacing:.1em;margin-bottom:6px;color:rgba(248,250,252,.42) }</code> | CSS selector .amateur-ranking-tab.amr-sheet .pro-collection-field label |
| `src/features/amateur-ranking/wagr-settings.css:14` | CSS font-weight | <code>.wagr-kicker { font-size:9.5px;font-weight:800;letter-spacing:0.16em;color:var(--pro-profile-amber) }</code> | CSS selector .wagr-kicker |
| `src/features/business-create/business-create.css:8` | CSS font-weight | <code>.bizc-kicker { font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-mute) }</code> | CSS selector .bizc-kicker |
| `src/features/business-create/business-create.css:11` | CSS font-weight | <code>.bizc-group { font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-dim);margin:20px 0 8px }</code> | CSS selector .bizc-group |
| `src/features/business-create/business-create.css:24` | CSS font-weight | <code>.bizc-field-label { display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--bizc-dim) }</code> | CSS selector .bizc-field-label |
| `src/features/business-create/business-create.css:50` | CSS font-weight | <code>.bizc-facts i { display:block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--bizc-dim);margin-top:5px }</code> | CSS selector .bizc-facts i |
| `src/features/business-create/business-create.css:57` | CSS font-weight | <code>.bizc-crest { width:44px;height:44px;border-radius:12px;background:#1E1E23;color:var(--bizc-mute);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex:none;overflow:hidden }</code> | CSS selector .bizc-crest |
| `src/features/business-create/business-create.css:80` | CSS font-weight | <code>.bizc-areakick { font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-mute) }</code> | CSS selector .bizc-areakick |
| `src/features/business-create/business-create.css:93` | CSS font-weight | <code>.bizc-row-label { width:70px;flex:none;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--bizc-dim) }</code> | CSS selector .bizc-row-label |
| `src/features/business/clubAnalytics/courseLead.css:3` | CSS font-weight | <code>.club-course-lead-early { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 12px; border: 1px solid var(--team-selected-border); font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--team-ink); margin-bottom: 10px; }</code> | CSS selector .club-course-lead-early |
| `src/features/business/clubAnalytics/sections.tsx:144` | fontWeight | <code>&lt;div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}&gt;</code> | fine — {fmt(ladder.rounds)} FULL ROUNDS; ;  |
| `src/features/business/clubAnalytics/sections.tsx:154` | fontWeight | <code>&lt;h4 style={{ margin: '14px 0 0', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: HIP.DIM }}&gt;{rows.length === 1 ? &#96;Plays ${direction} than its card&#96; : &#96;Play ${direction} than their card&#96;}&lt;/h4&gt;</code> | rows — ; {rows.length === 1 ? &#96;Plays ${direction} than its card&#96; : &#96;Play ${direction} than their card&#96;};  |
| `src/features/business/clubAnalytics/sections.tsx:207` | fontWeight | <code>&lt;div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}&gt;The sample&lt;/div&gt;</code> | cells — The sample; ; ( |
| `src/features/business/clubAnalytics/sections.tsx:212` | fontWeight | <code>&lt;div style={{ marginTop: 2, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM }}&gt;{c.label}&lt;/div&gt;</code> | cells — ; {line}; {bars && ( |
| `src/features/business/clubAnalytics/sections.tsx:298` | fontWeight | <code>const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };</code> | kicker — text/value styled by this declaration |
| `src/features/business/clubAnalytics/sections.tsx:299` | fontWeight | <code>const heading: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM, whiteSpace: 'nowrap', fontFamily: 'Geist, sans-serif' };</code> | heading —  |
| `src/features/business/clubAnalytics/sections.tsx:427` | fontWeight | <code>&lt;div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}&gt;</code> | minGrow — {&#96;${fmt(m.total)} HOLES&#96;}; ;  |
| `src/features/business/clubAnalytics/sections.tsx:483` | fontWeight | <code>const S7_KICKER: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };</code> | S7_KICKER — text/value styled by this declaration |
| `src/features/business/clubAnalytics/sections.tsx:550` | fontWeight | <code>const TEE_HEAD7: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM };</code> | TEE_HEAD7 —  |
| `src/features/business/clubAnalytics/sections.tsx:671` | fontWeight | <code>const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };</code> | kicker — ; Who plays here;  |
| `src/features/business/clubAnalytics/teeSheet.css:2` | CSS font-weight | <code>.tee-sheet-kicker { font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tee-sheet-muted); }</code> | CSS selector .tee-sheet-kicker |
| `src/features/business/clubAnalytics/teeSheet.css:6` | CSS font-weight | <code>.tee-sheet-subheading { margin:16px 0 0; font-size:10.5px; font-weight:800; letter-spacing:.14em; color:var(--tee-sheet-dim); }</code> | CSS selector .tee-sheet-subheading |
| `src/features/chrome-v2/ChromeIsland.tsx:578` | fontWeight | <code>fontWeight: 800,</code> | activeUnreadCount — text/value styled by this declaration |
| `src/features/chrome-v2/account-glance.css:28` | CSS font-weight | <code>.account-count { flex-shrink: 0; display: inline-flex; justify-content: center; align-items: center; box-sizing: border-box; min-width: 18px; height: 18px; border-radius: 9px; background: var(--account-ink); color: var(--account-count-ink); padding: 0 5px; font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums; }</code> | CSS selector .account-count |
| `src/features/chrome-v2/account-glance.css:44` | CSS font-weight | <code>.account-admin { font-size: 9.5px; font-weight: 800; letter-spacing: .13em; color: var(--account-dim); }</code> | CSS selector .account-admin |
| `src/features/chrome-v2/tour-glance.css:8` | CSS font-weight | <code>.tour-menu-kicker { font-size:9.5px;font-weight:800;letter-spacing:0.14em }</code> | CSS selector .tour-menu-kicker |
| `src/features/chrome-v2/tour-glance.css:21` | CSS font-weight | <code>.tour-menu-live { display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;color:var(--tour-menu-live) }</code> | CSS selector .tour-menu-live |
| `src/features/coach/coach.css:2` | CSS font-weight | <code>.coach-kicker { display:flex;justify-content:space-between;gap:12px;font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--club-you-muted);margin-bottom:10px; }</code> | CSS selector .coach-kicker |
| `src/features/courses/_shared/scorecard/scorecardParts.tsx:110` | fontWeight | <code>fontWeight: emphasis === 'strokes' ? 800 : undefined,</code> | CardRow — ))}; {total};  |
| `src/features/courses/components/holes/analytical/Extremes.tsx:53` | fontWeight | <code>style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.025em', color: A.INK, lineHeight: 1 }}</code> | fig — {hole.hole_no}; {fig && (;  |
| `src/features/creator/profile-creator.css:7` | CSS font-weight | <code>.profile-round-video { display:inline-flex;align-items:center;flex:none;height:20px;padding:0 8px;border-radius:999px;background:var(--welcome-ink);color:var(--welcome-canvas);font-size:10px;font-weight:800;letter-spacing:.02em;text-transform:none;gap:4px;cursor:pointer }</code> | CSS selector .profile-round-video |
| `src/features/edit-profile/edit-profile.css:33` | CSS font-weight | <code>.ep-group { font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--ep-dim);margin:22px 4px 8px }</code> | CSS selector .ep-group |
| `src/features/edit-profile/edit-profile.css:88` | CSS font-weight | <code>.ep-golf-or { display:flex;align-items:center;gap:10px;margin:16px 0 4px;font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--ep-dim);text-transform:uppercase }</code> | CSS selector .ep-golf-or |
| `src/features/edit-profile/edit-profile.css:156` | CSS font-weight | <code>.st2-figure&gt;span { display:block;font-size:9.5px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--ep-dim);margin-top:3px }</code> | CSS selector .st2-figure>span |
| `src/features/explore-magazine/AchievementCallout.tsx:480` | fontWeight | <code>style={{ fontFamily: SANS, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1, textTransform: 'uppercase', color: A.AMBER, whiteSpace: 'nowrap', marginBottom: 5 }}</code> | hasSentence — {tag ? (; {tag}; ) : null} |
| `src/features/explore-magazine/AchievementCallout.tsx:514` | fontWeight | <code>export const CAPS: React.CSSProperties = { fontFamily: ANALYTICAL_SANS, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' };</code> | CAPS — ( |
| `src/features/explore-magazine/ExploreCard.tsx:217` | fontWeight | <code>fontWeight: stacked ? 800 : 700,</code> | cjkUnit — {figure}; {unit ? ( |
| `src/features/explore-magazine/ExploreCard.tsx:821` | fontWeight | <code>fontFamily: SANS, fontSize: 17, fontWeight: 800, lineHeight: 1, color: tone,</code> | tone — {label}; ; {score.toFixed(1)} |
| `src/features/explore-magazine/ExploreCard.tsx:1358` | fontWeight | <code>fontFamily: SANS, fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,</code> | reviewFoot —  |
| `src/features/explore-magazine/ExploreCard.tsx:1369` | fontWeight | <code>marginTop: 3, fontFamily: SANS, fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',</code> | reviewFoot — ; {getScoreTier(item.facts.rating).label};  |
| `src/features/explore-magazine/LeaderboardsSection.tsx:57` | fontWeight | <code>&lt;span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', lineHeight: '11px', color: selected ? A.INK : A.MUTE }}&gt;</code> | count — {t(BOARD_LABELS[key].i18n, { defaultValue: BOARD_LABELS[key].label })}; ;  |
| `src/features/explore-magazine/LeaderboardsSection.tsx:61` | fontWeight | <code>&lt;span data-board-tile-count style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: selected ? A.INK : A.BODY }}&gt;{count ?? '\u2014'}&lt;/span&gt;</code> | count — ; {count ?? '\u2014'};  |
| `src/features/explore-magazine/rareAir.ts:42` | fontWeight | <code>name: { fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' },</code> | RARE_AIR — text/value styled by this declaration |
| `src/features/explore-magazine/rareAir.ts:43` | fontWeight | <code>pill: { fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', border: 'rgba(247,147,30,0.45)', padding: '1px 5px' },</code> | RARE_AIR — text/value styled by this declaration |
| `src/features/explore-magazine/rareAir.ts:44` | fontWeight | <code>count: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em', marginTop: 8 },</code> | RARE_AIR — text/value styled by this declaration |
| `src/features/explore-magazine/watch/WatchFeed.tsx:134` | fontWeight | <code>&lt;h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', color: A.INK }}&gt;</code> | Section — ; {kicker}; ) : null} |
| `src/features/explore-magazine/watch/WatchFeed.tsx:495` | fontWeight | <code>&lt;h2 style={{ margin: 0, fontSize: 17, fontWeight: 750, letterSpacing: '-0.01em', color: A.INK }}&gt;</code> | quickHeading — ; {t('amateur.watch.rail.quick', 'Quick hits')};  |
| `src/features/explore-magazine/watch/WatchLead.tsx:226` | fontWeight | <code>fontWeight: 800,</code> | kickerEl — {kickerLabel} |
| `src/features/explore-magazine/watch/featured.css:3` | CSS font-weight | <code>.featured-kicker { font-size:11px; font-weight:800; letter-spacing:0.2em; color:var(--featured-amber); }</code> | CSS selector .featured-kicker |
| `src/features/explore-magazine/watch/featured.css:18` | CSS font-weight | <code>.featured-badge { left:14px; padding:0 12px; background:var(--featured-glass); backdrop-filter:blur(16px); border:1px solid var(--featured-edge); font-size:10.5px; font-weight:800; letter-spacing:0.16em; }</code> | CSS selector .featured-badge |
| `src/features/explore-magazine/watch/standout-shelf.css:19` | CSS font-weight | <code>.standout-circle { font-size:9px; font-weight:800; letter-spacing:0.12em; color:var(--standout-dim); }</code> | CSS selector .standout-circle |
| `src/features/explore-magazine/watch/standout-shelf.css:25` | CSS font-weight | <code>.standout-figure small { display:block; font-size:8.5px; font-weight:800; letter-spacing:0.14em; color:var(--standout-dim); }</code> | CSS selector .standout-figure small |
| `src/features/explore-magazine/watch/standout-shelf.css:26` | CSS font-weight | <code>.standout-figure b { font-size:20px; font-weight:800; color:var(--standout-ink); }</code> | CSS selector .standout-figure b |
| `src/features/explore-magazine/watch/standout-shelf.css:31` | CSS font-weight | <code>.standout-comp { display:flex; gap:4px; align-items:center; justify-content:flex-end; font-size:9px; font-weight:800; letter-spacing:0.12em; }</code> | CSS selector .standout-comp |
| `src/features/explore-magazine/watch/standout-shelf.css:32` | CSS font-weight | <code>.standout-kicker { display:flex; align-items:center; gap:6px; margin-bottom:9px; font-size:9.5px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:var(--standout-dim); }</code> | CSS selector .standout-kicker |
| `src/features/find-people/follow-tiles.css:17` | CSS font-weight | <code>.follow-tile .follow-tile-follow { margin-top:10px; width:100%; height:34px; min-height:34px; border-radius:999px; border:0; background:var(--follow-tile-ink); color:var(--follow-tile-canvas); font-size:13.5px; font-weight:800; padding:0; }</code> | CSS selector .follow-tile .follow-tile-follow |
| `src/features/guest/guestGate.css:75` | CSS font-weight | <code>.guest-gate-head { margin: 9px 0 0;   font-size: 26px;   font-weight: 800;   letter-spacing: -0.025em;   line-height: 1.12;   text-wrap: balance;   color: #f8fafc; }</code> | CSS selector .guest-gate-head |
| `src/features/member-badge/member-badge.css:8` | CSS font-weight | <code>.mbc-title { margin-top:12px; font-size:22px; font-weight:800; letter-spacing:-0.02em; }</code> | CSS selector .mbc-title |
| `src/features/post-v2/StageComposer.tsx:1055` | fontWeight | <code>&lt;/div&gt;&lt;button onClick={saveAsDraft} disabled={savingDraft} style={{height:54,background:GP.ink,color:GP.onInk,border:0,borderRadius:999,fontSize:15,fontWeight:800,textTransform:'uppercase',letterSpacing:'.14em'}}&gt;{savingDraft?'Saving':t('closeGuard.saveDraft')}&lt;/button&gt;</code> | it — {t('closeGuard.saveDraftLosesSchedule')}; }; } |
| `src/features/post-v2/StageComposer.tsx:1057` | fontWeight | <code>&lt;button onClick={()=&gt;{setSheet(null);reset();onClose();}} style={{background:'none',border:0,color:'var(--composer-golf-under)',fontSize:13,fontWeight:800,letterSpacing:'.14em'}}&gt;DISCARD&lt;/button&gt;</code> | it — ; ;  |
| `src/features/post-v2/components/golf/ShareFooter.tsx:27` | fontWeight | <code>fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em',</code> | ShareFooter —  |
| `src/features/post-v2/components/golf/composerGolf.css:3` | CSS font-weight | <code>.composer-golf-kicker { font-size:10.5px;font-weight:800;color:var(--pf-dim);text-transform:uppercase;letter-spacing:.18em }</code> | CSS selector .composer-golf-kicker |
| `src/features/post-v2/components/golf/composerGolf.css:81` | CSS font-weight | <code>.pf4-filmstrip .pf4-filmstrip-remove,.pf4-filmstrip-number { position:absolute;width:24px;height:24px;padding:0;border:0;border-radius:999px;background:var(--composer-tag-glass);color:var(--pf-ink);display:grid;place-items:center;font-size:12px;font-weight:800 }</code> | CSS selector .pf4-filmstrip .pf4-filmstrip-remove,.pf4-filmstrip-number |
| `src/features/post-v2/components/video/roundVideoCreator.css:3` | CSS font-weight | <code>.vc-round-score { font-weight:800;font-variant-numeric:tabular-nums;color:var(--video-ink) }</code> | CSS selector .vc-round-score |
| `src/features/post-v2/components/video/roundVideoCreator.css:8` | CSS font-weight | <code>.video-creator .vc-mark-primary { width:100%;height:50px;border-radius:999px;margin-top:14px;background:var(--video-ink);color:var(--video-canvas);font-size:15px;font-weight:800;white-space:normal;line-height:1.2;padding:0 12px }</code> | CSS selector .video-creator .vc-mark-primary |
| `src/features/post-v2/components/video/videoCreator.css:3` | CSS font-weight | <code>.video-creator .vc-kicker { font-size:10.5px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--video-dim) }</code> | CSS selector .video-creator .vc-kicker |
| `src/features/post-v2/components/video/videoCreator.css:60` | CSS font-weight | <code>.video-creator .vc-glyph { width:30px;height:30px;border-radius:9px;border:1px solid var(--video-edge);display:grid;place-items:center;flex:none;font-size:12px;font-weight:800;color:var(--video-mute) }</code> | CSS selector .video-creator .vc-glyph |
| `src/features/post-v2/components/video/videoCreator.css:73` | CSS font-weight | <code>.video-creator .vc-sheet-action { width:100%;height:54px;border-radius:999px;background:var(--video-ink);color:var(--video-canvas);font-size:15px;font-weight:800;margin-top:18px;letter-spacing:.14em }</code> | CSS selector .video-creator .vc-sheet-action |
| `src/features/pro-verification/pro-label.css:2` | CSS font-weight | <code>.pro-label-text { font-size:7.5px; font-weight:800; letter-spacing:0.14em; margin-right:-0.14em; line-height:1; background:var(--member-badge-foil); -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; text-transform:uppercase; }</code> | CSS selector .pro-label-text |
| `src/features/pro-verification/pro-label.css:20` | CSS font-weight | <code>.pro-hero-descriptor b { display:block; font-size:17px; font-weight:800; line-height:28px; }</code> | CSS selector .pro-hero-descriptor b |
| `src/features/pro-verification/pro-label.css:21` | CSS font-weight | <code>.pro-hero-descriptor span { display:block; margin-top:2px; font-size:9.5px; font-weight:800; letter-spacing:0.13em; color:var(--pro-note-muted); text-transform:uppercase; }</code> | CSS selector .pro-hero-descriptor span |
| `src/features/pro-verification/pro-label.css:23` | CSS font-weight | <code>.profile-pro-tour-heading { display:flex; justify-content:space-between; align-items:center; gap:12px; font-size:10px; font-weight:800; letter-spacing:0.14em; color:var(--pro-note-muted); margin-bottom:4px; }</code> | CSS selector .profile-pro-tour-heading |
| `src/features/pro-verification/pro-status-controls.css:6` | CSS font-weight | <code>.pro-being-checked { display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:7px;border:1px solid var(--pro-controls-pending-rule);font-size:9.5px;font-weight:800;letter-spacing:0.12em;color:var(--pro-controls-muted);white-space:nowrap }</code> | CSS selector .pro-being-checked |
| `src/features/pro-verification/pro-status-controls.css:14` | CSS font-weight | <code>.pro-status-kicker { font-size:10px;font-weight:800;letter-spacing:0.16em;color:var(--pro-controls-muted) }</code> | CSS selector .pro-status-kicker |
| `src/features/pro-verification/pro-status-controls.css:15` | CSS font-weight | <code>.pro-status-heading { display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:22px;font-weight:800;margin:4px 0 0 }</code> | CSS selector .pro-status-heading |
| `src/features/pro-verification/pro-status-controls.css:23` | CSS font-weight | <code>.pro-status-confirm h2 { font-size:17px;font-weight:800;margin:0 }</code> | CSS selector .pro-status-confirm h2 |
| `src/features/pro-verification/pro-verification.css:10` | CSS font-weight | <code>.pds-kicker { font-size:10px;font-weight:800;letter-spacing:0.16em;color:rgba(248,250,252,0.62) }</code> | CSS selector .pds-kicker |
| `src/features/pro-verification/pro-verification.css:11` | CSS font-weight | <code>.pds-head h2 { margin:4px 0 0;font-size:22px;font-weight:800;line-height:1.2;color:#F8FAFC }</code> | CSS selector .pds-head h2 |
| `src/features/pro-verification/pro-verification.css:19` | CSS font-weight | <code>.pds-label { margin:18px 0 8px;font-size:10px;font-weight:800;letter-spacing:0.14em;color:rgba(248,250,252,0.42) }</code> | CSS selector .pds-label |
| `src/features/profile-sheet-v2/components/YourCourseAnalyticsSheet.tsx:734` | fontWeight | <code>fontWeight: 800,</code> | subLine — ; {label};  |
| `src/features/tourhub/_shared/tokens.ts:264` | fontWeight | <code>fontWeight: 800,</code> | CAPS_10 — text/value styled by this declaration |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand.tsx:630` | fontWeight | <code>&lt;div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: OVERVIEW.mute }}&gt;</code> | RoundMovementBand — ; {t('overview.biggestMovers', { round })};  |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx:89` | fontWeight | <code>&lt;div style={live ? { fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,.62)' } : { fontSize: upcoming ? 10 : 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: L.amber }}&gt;{t('overview.leadersGroup.kicker')}&lt;/div&gt;</code> | namesMarkup — {t('overview.leadersGroup.kicker')}; ; {state === 'onCourse' && !(live && suspended) ? |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx:89` | fontWeight | <code>&lt;div style={live ? { fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,.62)' } : { fontSize: upcoming ? 10 : 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: L.amber }}&gt;{t('overview.leadersGroup.kicker')}&lt;/div&gt;</code> | namesMarkup — {t('overview.leadersGroup.kicker')}; ; {state === 'onCourse' && !(live && suspended) ? |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/LeadersGroup.tsx:116` | fontWeight | <code>&lt;span style={{ ...(scaled ? HERO_POS_TYPE : { fontSize: 11, fontWeight: 800 }), letterSpacing: scaled ? 0 : '0.04em', color: live \|\| e?.position === 1 ? L.ink : L.mute }} className="tabular-nums"&gt;{pos}&lt;/span&gt;</code> | RowTag — ; {pos};  |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/LiveHeroBoard.tsx:100` | fontWeight | <code>&lt;span style={{ gridColumn: '1 / 3', fontWeight: 800, letterSpacing: '0.16em', lineHeight: 1.4 }}&gt;{t('rebuilt.leaderboard', { defaultValue: 'Leaderboard' })}&lt;/span&gt;</code> | colRound — ; {t('rebuilt.leaderboard', { defaultValue: 'Leaderboard' })};  |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:229` | fontWeight | <code>&lt;div style={{ ...NUMERIC_STYLE, fontSize: 21, lineHeight: 1, fontWeight: 800, letterSpacing: 0, color: getScoreColor(leader.score, 'dark') }}&gt;{fmtScore(leader.score)}&lt;/div&gt;</code> | bandHeight — ) : null}; {fmtScore(leader.score)}; {leader.caps ? |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:236` | fontWeight | <code>&lt;div style={{ ...NUMERIC_STYLE, fontSize: 21, lineHeight: 1, fontWeight: 800, color: INK }}&gt;{firstTee}&lt;/div&gt;</code> | bandHeight — ; {t('overview.hero.firstTee')};  |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:243` | fontWeight | <code>&lt;div style={{ ...NUMERIC_STYLE, fontSize: 21, lineHeight: 1, fontWeight: 800, letterSpacing: 0, color: INK }}&gt;{figure.value}&lt;/div&gt;</code> | bandHeight — ; {figure.value};  |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PhotoBand.tsx:250` | fontWeight | <code>&lt;div style={{ ...NUMERIC_STYLE, fontSize: 21, lineHeight: 1, fontWeight: 800, color: INK }}&gt;{countdown[0].value}&lt;/div&gt;</code> | bandHeight — {countdown[0].value}; ; {t(&#96;overview.upcomingPlus.${countdown[0].label}&#96;, { count: countdown[0].value })} |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx:204` | fontWeight | <code>&lt;span ref={picksRef} style={{ fontSize: up ? 10 : 11, fontWeight: up ? 700 : 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: AMBER, whiteSpace: 'nowrap', flex: 'none' }}&gt;{t('overview.hero.ourPicks')}&lt;/span&gt;</code> | ro — {t('overview.hero.ourPicks')}; {teeDay && phase !== 'completed' ? (;  |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx:207` | fontWeight | <code>&lt;span data-overview-picks-tee-day style={{ marginLeft: 'auto', fontSize: up ? 10 : 9.5, fontWeight: up ? 700 : 800, letterSpacing: up ? '0.16em' : '0.12em', textTransform: 'uppercase', color: up ? 'rgba(248,250,252,0.62)' : 'rgba(248,250,252,0.42)', whiteSpace: 'nowrap', flex: 'none' }}&gt;{teeFits ? teeDay : teeDayOnly}&lt;/span&gt;</code> | ro — ; {teeFits ? teeDay : teeDayOnly};  |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx:208` | fontWeight | <code>&lt;span ref={fullRef} data-overview-picks-tee-measure aria-hidden style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: 0, top: 0, fontSize: up ? 10 : 9.5, fontWeight: up ? 700 : 800, letterSpacing: up ? '0.16em' : '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}&gt;{teeDay}&lt;/span&gt;</code> | ro — ; ) : phase !== 'upcoming' ?; {phase==='completed'?recordCopy('final'):recordCopy('roundLive',{round:currentRound??''})} |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/PicksBlock.tsx:210` | fontWeight | <code>) : phase !== 'upcoming' ? &lt;span className="pick-panel-dim" style={{marginLeft:'auto',fontSize:9.5,fontWeight:800,letterSpacing:'.12em'}}&gt;{phase==='completed'?recordCopy('final'):recordCopy('roundLive',{round:currentRound??''})}&lt;/span&gt; : null}</code> | ro — {phase==='completed'?recordCopy('final'):recordCopy('roundLive',{round:currentRound??''})}; : null}; 0 && up && |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/SituationBand.tsx:19` | fontWeight | <code>&lt;div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: AMBER }}&gt;</code> | label — {t('overview.situation.label')}; {onFullBoard ? ( |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/championStrip.css:28` | CSS font-weight | <code>.tv-champion-name { font-size: 18px; font-weight: 800; margin-top: 2px; color: var(--tv-ink); }</code> | CSS selector .tv-champion-name |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/championStrip.css:29` | CSS font-weight | <code>.tv-champion-label { font-size: 10px; font-weight: 800; letter-spacing: .13em; color: var(--tv-gold); }</code> | CSS selector .tv-champion-label |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/championStrip.css:31` | CSS font-weight | <code>.tv-champion-score b { display: block; font-size: 26px; font-weight: 800; line-height: 1; }</code> | CSS selector .tv-champion-score b |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:2` | CSS font-weight | <code>.pick-panel-kicker { color:var(--pick-amber); font-size:10px; font-weight:800; letter-spacing:.16em; }</code> | CSS selector .pick-panel-kicker |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:3` | CSS font-weight | <code>.pick-panel-header h2 { margin:3px 0 0; font-size:21px; font-weight:800; }</code> | CSS selector .pick-panel-header h2 |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:6` | CSS font-weight | <code>.pick-panel-label { margin-bottom:8px; font-size:9.5px; font-weight:800; letter-spacing:.13em; color:var(--pick-mute); }</code> | CSS selector .pick-panel-label |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:13` | CSS font-weight | <code>.pick-panel-name { font-size:19px; font-weight:800; overflow-wrap:anywhere; }</code> | CSS selector .pick-panel-name |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:15` | CSS font-weight | <code>.pick-panel-result b { font-size:18px; font-weight:800; }</code> | CSS selector .pick-panel-result b |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:22` | CSS font-weight | <code>.pick-panel-verdict &gt; b { font-size:16px; font-weight:800; }</code> | CSS selector .pick-panel-verdict > b |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:26` | CSS font-weight | <code>.pick-panel-vote { width:34px; height:26px; display:grid; place-items:center; border-radius:8px; background:var(--pick-hair); font-size:11.5px; font-weight:800; }</code> | CSS selector .pick-panel-vote |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:32` | CSS font-weight | <code>.pick-panel-stat &gt; b { text-align:right; font-size:13px; font-weight:800; }</code> | CSS selector .pick-panel-stat > b |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:44` | CSS font-weight | <code>.pick-panel-figures b { display:block; margin-top:3px; font-size:16px; font-weight:800; }</code> | CSS selector .pick-panel-figures b |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:53` | CSS font-weight | <code>.pick-panel-darkhorse &gt; b { font-size:13px; font-weight:800; }</code> | CSS selector .pick-panel-darkhorse > b |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:62` | CSS font-weight | <code>.pick-record-three b { display:block; font-size:24px; line-height:1; font-weight:800; }</code> | CSS selector .pick-record-three b |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:63` | CSS font-weight | <code>.pick-record-three span { display:block; margin-top:2px; font-size:9.5px; font-weight:800; letter-spacing:.13em; color:var(--pick-mute); }</code> | CSS selector .pick-record-three span |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:82` | CSS font-weight | <code>.pick-mine-heading { font-size:15px; font-weight:800; color:var(--pick-section-white); }</code> | CSS selector .pick-mine-heading |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:90` | CSS font-weight | <code>.pick-mine-label { font-size:9.5px; font-weight:800; letter-spacing:.13em; color:var(--pick-amber); }</code> | CSS selector .pick-mine-label |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:93` | CSS font-weight | <code>.pick-mine-action { flex:none; height:34px; padding:0 18px; border:0; border-radius:999px; background:var(--pick-amber); color:var(--pick-on-amber); font-size:13.5px; font-weight:800; }</code> | CSS selector .pick-mine-action |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:95` | CSS font-weight | <code>.pick-mine-figure { text-align:right; font-size:14px; font-weight:800; white-space:nowrap; }</code> | CSS selector .pick-mine-figure |
| `src/features/tourhub/components/overview-v3/HybridHeroBands/pickPanels.css:103` | CSS font-weight | <code>.pick-record-door &gt; span:first-child { font-size:9.5px; font-weight:800; letter-spacing:.13em; color:var(--pick-mute); }</code> | CSS selector .pick-record-door > span:first-child |
| `src/features/tourhub/leaderboard/BoardTable.tsx:382` | canvas font shorthand constant | <code>const markFont = &#96;800 9.5px ${F}&#96;;</code> | Leaderboard canvas mark text; markFont used as a font shorthand. |
| `src/features/tourhub/leaderboard/LeaderboardTab.tsx:138` | fontWeight | <code>fontWeight: 800,</code> | text — {text};  |
| `src/features/tourhub/leaderboard/leaderboard.css:14` | CSS font-weight | <code>.tour-board-live { display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:800; letter-spacing:.12em; color:#34D77F; }</code> | CSS selector .tour-board-live |
| `src/features/tourhub/leaderboard/leaderboard.css:16` | CSS font-weight | <code>.tour-board-title { margin:4px 0 0; font-size:26px; font-weight:800; line-height:1.1; letter-spacing:0; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden; }</code> | CSS selector .tour-board-title |
| `src/features/tourhub/leaderboard/leaderboard.css:21` | CSS font-weight | <code>.tour-board-figures b { display:block; font-size:19px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; white-space:nowrap; }</code> | CSS selector .tour-board-figures b |
| `src/features/tourhub/leaderboard/leaderboard.css:23` | CSS font-weight | <code>.tour-board-figures span { display:block; margin-top:6px; font-size:9.5px; font-weight:800; letter-spacing:.12em; color:var(--tour-board-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }</code> | CSS selector .tour-board-figures span |
| `src/features/tourhub/leaderboard/leaderboard.css:24` | CSS font-weight | <code>.tour-board-section-title { margin:0; font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--tour-board-ink); white-space:nowrap; }</code> | CSS selector .tour-board-section-title |
| `src/features/tourhub/leaderboard/leaderboard.css:34` | CSS font-weight | <code>.tour-board-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding:20px 18px 6px; font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tour-board-amber); }</code> | CSS selector .tour-board-kicker |
| `src/features/tourhub/leaderboard/leaderboard.css:41` | CSS font-weight | <code>.tour-board-movement { font-size:9.5px; font-weight:800; line-height:1; font-variant-numeric:tabular-nums; white-space:nowrap; }</code> | CSS selector .tour-board-movement |
| `src/features/tourhub/news/StoryShapes.tsx:159` | fontWeight | <code>&lt;h1 style={{ margin: 0, fontSize: 25, fontWeight: 800, lineHeight: 1.13, letterSpacing: '-0.01em', color: A.INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 4, overflow: 'hidden', overflowWrap: 'anywhere' }}&gt;</code> | HeroStory — ; {story.headline}; {story.standfirst && ( |
| `src/features/tourhub/news/WireFeedSlide.tsx:86` | fontWeight | <code>&lt;span style={{ color: AMBER, fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', lineHeight: 1.2, textTransform: 'uppercase' }}&gt;</code> | moreLabel — ; {/* W.3 — hero unchanged. */};  |
| `src/features/tourhub/news/WireFeedSlide.tsx:97` | fontWeight | <code>&lt;div style={{ marginTop: story.kicker ? 6 : 0, color: INK, fontSize: 24, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.028em', ...CLAMP(3) }}&gt;</code> | moreLabel — ; {story.standfirst && (; {story.standfirst} |
| `src/features/tourhub/news/WireFeedSlide.tsx:114` | fontWeight | <code>&lt;div style={{ padding: '11px 14px 0', fontSize: 12.5, fontWeight: 800, color: AMBER }}&gt;</code> | moreLabel — {t('news.readStory')} ›; ; 0 && ( |
| `src/features/tourhub/news/WireFeedSlide.tsx:122` | fontWeight | <code>&lt;div style={{ padding: '10px 14px 2px', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: A.DIM }}&gt;</code> | moreLabel — 0 && (; ; {moreLabel} |
| `src/features/tourhub/overview/sections/OverviewSectionHead.tsx:14` | fontWeight | <code>&lt;h2 style={{ margin: 0, fontSize: 20, lineHeight: 1.2, fontWeight: 800, letterSpacing: 0, color: INK }}&gt;{title}&lt;/h2&gt;</code> | OverviewSectionHead — ; {title} |
| `src/features/tourhub/overview/sections/WorldRankings.tsx:41` | fontWeight | <code>return &lt;span data-movement-tone={up ? 'rise' : down ? 'fall' : 'unchanged'} style={{ textAlign: 'right', fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: up ? TREND_UP : down ? INK_FAINT : UNMOVED_INK }}&gt;{up ? &#96;▲${value}&#96; : down ? &#96;▼${Math.abs(value)}&#96; : '–'}&lt;/span&gt;;</code> | down — 0; const down = value != null && value; {up ? &#96;▲${value}&#96; : down ? &#96;▼${Math.abs(value)}&#96; : '–'} |
| `src/features/tourhub/overview/sections/WorldRankings.tsx:141` | fontWeight | <code>&lt;span style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: INK_FAINT, whiteSpace: 'nowrap', textTransform: 'uppercase' }}&gt;</code> | line — ; ;  |
| `src/features/tourhub/overview/sections/WorldRankings.tsx:155` | fontWeight | <code>up: &lt;span style={{ color: TREND_UP, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }} /&gt;,</code> | line — ; ; {line ? ( |
| `src/features/tourhub/overview/sections/WorldRankings.tsx:236` | fontWeight | <code>&lt;div style={{ margin: '14px 24px 2px', display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', color: AMBER }}&gt;</code> | openPlayer — ; {t('overview.rankings.followedCount', { count: followedCount })};  |
| `src/features/tourhub/overview/sections/alsoWeek.css:8` | CSS font-weight | <code>.also-kick { display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:9.5px;line-height:1.2;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--tour-board-mute) }</code> | CSS selector .also-kick |
| `src/features/tourhub/overview/sections/alsoWeek.css:14` | CSS font-weight | <code>.also-title span { min-width:0;flex:1;font-size:17px;line-height:1.25;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }</code> | CSS selector .also-title span |
| `src/features/tourhub/overview/sections/alsoWeek.css:35` | CSS font-weight | <code>.also-fv { font-size:16px;font-weight:800 }</code> | CSS selector .also-fv |
| `src/features/tourhub/overview/sections/comingUp.css:8` | CSS font-weight | <code>.coming-kick { display:flex; gap:8px; align-items:center; flex-wrap:wrap; font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--tour-board-mute); }</code> | CSS selector .coming-kick |
| `src/features/tourhub/overview/sections/comingUp.css:9` | CSS font-weight | <code>.coming-tag { display:inline-flex; align-items:center; height:18px; padding:0 7px; border-radius:6px; border:1px solid var(--tour-board-faint); color:var(--tour-board-ink); font-size:9px; font-weight:800; letter-spacing:.1em; }</code> | CSS selector .coming-tag |
| `src/features/tourhub/overview/sections/comingUp.css:10` | CSS font-weight | <code>.coming-name { margin-top:6px; font-size:21px; line-height:1.18; font-weight:800; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }</code> | CSS selector .coming-name |
| `src/features/tourhub/overview/sections/comingUp.css:13` | CSS font-weight | <code>.coming-dates { font-size:15px; font-weight:800; }</code> | CSS selector .coming-dates |
| `src/features/tourhub/overview/sections/comingUp.css:18` | CSS font-weight | <code>.coming-fv { font-size:16px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }</code> | CSS selector .coming-fv |
| `src/features/tourhub/overview/sections/comingUp.css:32` | CSS font-weight | <code>.coming-month { margin:22px 24px 2px; font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tour-board-dim); }</code> | CSS selector .coming-month |
| `src/features/tourhub/overview/sections/comingUp.css:36` | CSS font-weight | <code>.coming-day { font-size:22px; line-height:1; font-weight:800; }</code> | CSS selector .coming-day |
| `src/features/tourhub/overview/sections/comingUp.css:37` | CSS font-weight | <code>.coming-week { margin-top:4px; font-size:9px; font-weight:800; letter-spacing:.12em; color:var(--tour-board-dim); }</code> | CSS selector .coming-week |
| `src/features/tourhub/player-v2/playerPage.css:6` | CSS font-weight | <code>.player-v3 b { font-weight:800; }</code> | CSS selector .player-v3 b |
| `src/features/tourhub/player-v2/playerPage.css:10` | CSS font-weight | <code>.pv-kicker { display:flex; flex-wrap:wrap; align-items:center; gap:6px; color:var(--pick-mute); font-size:10.5px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }</code> | CSS selector .pv-kicker |
| `src/features/tourhub/player-v2/playerPage.css:13` | CSS font-weight | <code>.pv-name { margin:8px 0 0; font-size:30px; line-height:1.05; font-weight:800; overflow-wrap:normal; }</code> | CSS selector .pv-name |
| `src/features/tourhub/player-v2/playerPage.css:15` | CSS font-weight | <code>.pv-photo [data-avatar-fallback] { font-size:38px!important; font-weight:800!important; letter-spacing:0!important; }</code> | CSS selector .pv-photo [data-avatar-fallback] |
| `src/features/tourhub/player-v2/playerPage.css:25` | CSS font-weight | <code>.pv-figs span { display:block; margin-top:6px; font-size:9.5px; font-weight:800; letter-spacing:.12em; color:var(--pick-dim); }</code> | CSS selector .pv-figs span |
| `src/features/tourhub/player-v2/playerPage.css:31` | CSS font-weight | <code>.pv-next small,.pv-you &gt; small { display:block; font-size:9.5px; font-weight:800; letter-spacing:.13em; color:var(--pick-amber); }</code> | CSS selector .pv-next small,.pv-you > small |
| `src/features/tourhub/player-v2/playerPage.css:34` | CSS font-weight | <code>.pv-next .pv-pick { height:32px; min-height:32px; flex:none; padding:0 16px; border-radius:999px; background:var(--pick-amber); color:var(--player-canvas); font-size:13px; font-weight:800; }</code> | CSS selector .pv-next .pv-pick |
| `src/features/tourhub/player-v2/playerPage.css:36` | CSS font-weight | <code>.pv-head h2 { margin:0; font-size:11px; font-weight:800; letter-spacing:.16em; }</code> | CSS selector .pv-head h2 |
| `src/features/tourhub/player-v2/playerPage.css:37` | CSS font-weight | <code>.pv-head &gt; span,.pv-head .pv-link { font-size:10.5px; font-weight:800; letter-spacing:.12em; color:var(--pick-mute); }</code> | CSS selector .pv-head > span,.pv-head .pv-link |
| `src/features/tourhub/player-v2/playerPage.css:43` | CSS font-weight | <code>.pv-form &gt; div { height:40px; border-radius:9px; display:grid; place-items:center; background:var(--pick-tile); font-size:12.5px; font-weight:800; color:var(--pick-mute); }</code> | CSS selector .pv-form > div |
| `src/features/tourhub/player-v2/playerPage.css:67` | CSS font-weight | <code>.pv-percentile { text-align:right; font-size:13.5px; font-weight:800; }</code> | CSS selector .pv-percentile |
| `src/features/tourhub/player-v2/playerPage.css:74` | CSS font-weight | <code>.pv-duo small { display:block; color:var(--pick-mute); font-size:9.5px; font-weight:800; letter-spacing:.13em; }</code> | CSS selector .pv-duo small |
| `src/features/tourhub/player-v2/playerPage.css:79` | CSS font-weight | <code>.pv-hole &gt; strong { text-align:right; font-size:14px; font-weight:800; }</code> | CSS selector .pv-hole > strong |
| `src/features/tourhub/player-v2/playerPage.css:90` | CSS font-weight | <code>.pv-you &gt; b { display:block; margin-top:4px; font-size:16px; font-weight:800; }</code> | CSS selector .pv-you > b |
| `src/features/tourhub/player-v2/playerPage.css:101` | CSS font-weight | <code>.pv-rounds span { margin-top:7px; font-size:10px; font-weight:800; letter-spacing:.12em; color:var(--pick-dim); }</code> | CSS selector .pv-rounds span |
| `src/features/tourhub/player-v2/playerPage.css:103` | CSS font-weight | <code>.pv-best &gt; small { display:block; margin:16px 0 4px; font-size:10px; font-weight:800; letter-spacing:.16em; color:var(--pick-mute); }</code> | CSS selector .pv-best > small |
| `src/features/tourhub/player-v2/playerPage.css:126` | CSS font-weight | <code>.pv-date span { display:block; margin-top:4px; font-size:9.5px; font-weight:800; letter-spacing:.12em; color:var(--pick-dim); }</code> | CSS selector .pv-date span |
| `src/features/tourhub/player-v2/playerPage.css:129` | CSS font-weight | <code>.pv-event small { flex:none; font-size:9.5px; font-weight:800; letter-spacing:.12em; color:var(--pick-dim); }</code> | CSS selector .pv-event small |
| `src/features/tourhub/player-v2/playerPage.css:134` | CSS font-weight | <code>.pv-position &gt; span { display:block; margin-top:4px; font-size:13px; font-weight:800; }</code> | CSS selector .pv-position > span |
| `src/features/tourhub/player-v2/playerPage.css:137` | CSS font-weight | <code>.pv-about small { display:block; font-size:9.5px; font-weight:800; letter-spacing:.13em; color:var(--pick-dim); }</code> | CSS selector .pv-about small |
| `src/features/tourhub/players-v2/PlayerCell.tsx:28` | fontWeight | <code>&lt;span data-headshot style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', background: P.PHOTO, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', position: 'relative', flex: 'none', fontSize: size &gt;= 30 ? 11 : 8, fontWeight: 800, color: P.MUTE }}&gt;</code> | Headshot — : null} |
| `src/features/tourhub/players-v2/PlayerCell.tsx:70` | fontWeight | <code>return &lt;span data-move={tone} style={{ textAlign: 'right', fontSize: size, fontWeight: 800, color: tone === 'up' ? P.GREEN : tone === 'down' ? P.DIM : P.FAINT }}&gt;{text}&lt;/span&gt;;</code> | text — {text} |
| `src/features/tourhub/players-v2/field/FormTiles.tsx:6` | fontWeight | <code>win: { background: P.INK, color: P.CANVAS, border: &#96;1px solid ${P.INK}&#96;, fontWeight: 800 },</code> | TONE — text/value styled by this declaration |
| `src/features/tourhub/players-v2/field/FullField.tsx:100` | fontWeight | <code>&lt;span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, textTransform: 'uppercase' }}&gt;{stake.line_label}&lt;/span&gt;</code> | stake — {p.points != null ? &#96;${fmtInt(p.points)} pts&#96; : ''}; ; ) : null} |
| `src/features/tourhub/players-v2/field/FullField.tsx:202` | fontWeight | <code>&lt;h2 style={{ margin: 0, flex: 1, fontSize: 20, fontWeight: 800, color: P.INK }}&gt;All {n} players&lt;/h2&gt;</code> | anyLive — ; )}; {sentence ? |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:36` | fontWeight | <code>const kickStyle: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, textTransform: 'uppercase' };</code> | kickStyle — ;  |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:101` | fontWeight | <code>&lt;h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.15, fontWeight: 800, color: P.INK }}&gt;{data.title}&lt;/h1&gt;</code> | figs — ; ;  |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:105` | fontWeight | <code>&lt;div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(248,250,252,0.72)' }}&gt;THE SEASON&lt;/div&gt;</code> | figs — ; {headline}; {sub ? |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:106` | fontWeight | <code>&lt;h2 data-hero-headline style={{ margin: '8px 0 0', maxWidth: 240, fontSize: 28, lineHeight: 1.08, fontWeight: 800, color: P.INK }}&gt;{headline}&lt;/h2&gt;</code> | figs — {sub}; : null}; ( |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:111` | fontWeight | <code>&lt;b style={{ display: 'block', fontSize: 22, fontWeight: 800, lineHeight: 1, color: P.INK, ...FIG }}&gt;{v}&lt;/b&gt;</code> | figs — ))}; ;  |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:112` | fontWeight | <code>&lt;span style={{ display: 'block', marginTop: 5, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(248,250,252,0.6)' }}&gt;{l}&lt;/span&gt;</code> | figs — ))}; ;  |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:142` | fontWeight | <code>&lt;span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.DIM, textTransform: 'uppercase' }}&gt;{race.phase_label ?? ''}&lt;/span&gt;</code> | next — {left.length} to go; ;  |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:161` | fontWeight | <code>&lt;span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, whiteSpace: 'nowrap' }}&gt;{label}&lt;/span&gt;</code> | TheLine — {label}; ;  |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:252` | fontWeight | <code>&lt;div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: P.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase' }}&gt;{d.label}&lt;/div&gt;</code> | tiles — {lead!.display}; ;  |
| `src/features/tourhub/players-v2/front/FrontPage.tsx:253` | fontWeight | <code>&lt;div style={{ marginTop: 6, fontSize: 22, fontWeight: 800, lineHeight: 1, ...FIG }}&gt;{lead!.display}&lt;/div&gt;</code> | tiles — ; ;  |
| `src/features/tourhub/players-v2/picks/LinePicksCard.tsx:26` | fontWeight | <code>const kickStyle: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, textTransform: 'uppercase' };</code> | kickStyle — text/value styled by this declaration |
| `src/features/tourhub/players-v2/picks/LinePicksCard.tsx:53` | fontWeight | <code>&lt;span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.INK, whiteSpace: 'nowrap' }}&gt;THE LINE&lt;/span&gt;</code> | TheLine — THE LINE; ;  |
| `src/features/tourhub/players-v2/picks/LinePicksCard.tsx:109` | fontWeight | <code>&lt;div style={{ marginTop: 12, marginBottom: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: P.DIM }}&gt;WHO CALLED IT&lt;/div&gt;</code> | list — ; WHO CALLED IT; ( |
| `src/features/tourhub/players-v2/you/YouAndTourCard.tsx:48` | fontWeight | <code>&lt;span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: AMBER_SEG }}&gt;YOU AND THE TOUR&lt;/span&gt;</code> | small — Your last {me.rounds} rounds; ;  |
| `src/features/tourhub/players-v2/you/YouAndTourCard.tsx:63` | fontWeight | <code>&lt;span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: P.MUTE }}&gt;{HOLE_NAME[k].toUpperCase()}&lt;/span&gt;</code> | small — YOU; ; {signed(tours(tour, k))} |
| `src/features/tourhub/players-v2/you/YouAndTourCard.tsx:66` | fontWeight | <code>&lt;span style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, color: P.INK, ...FIG }}&gt;{b.lost[k].toFixed(1)}&lt;small style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: P.DIM }}&gt;a round&lt;/small&gt;&lt;/span&gt;</code> | small — ))}; ; (s.bold ? |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:91` | fontWeight | <code>fontWeight: 800,</code> | SEASON_KICKER — text/value styled by this declaration |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:140` | fontWeight | <code>style={{ display: 'block', marginTop: 4, fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}</code> | startDate —  |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:634` | fontWeight | <code>style={{ display: 'block', fontSize: 26, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}</code> | hasTimeline — ; {nextMajor.daysAway};  |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:634` | fontWeight | <code>fontWeight: 800,</code> | hasTimeline — {t('schedule.nextMajor.days', { count: nextMajor.daysAway ?? 0 })}; ;  |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:643` | fontWeight | <code>fontWeight: 800,</code> | hasTimeline — ; {t('schedule.nextMajor.label')};  |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:663` | fontWeight | <code>&lt;span style={{ display: 'block', marginTop: 3, fontSize: 16, fontWeight: 800 }}&gt;</code> | hasTimeline — ; {displayEventName(nextMajor.name)};  |
| `src/features/tourhub/schedule-v2/ScheduleTab.tsx:768` | fontWeight | <code>fontWeight: 800,</code> | weekBreak — ; {leftLabel} |
| `src/features/tourhub/schedule-v2/SeasonRow.tsx:136` | fontWeight | <code>style={{ display: 'block', fontSize: 20, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}</code> | fieldLine — ; {startDay(event.startDate)};  |
| `src/features/tourhub/schedule-v2/SeasonRow.tsx:145` | fontWeight | <code>fontWeight: 800,</code> | fieldLine — ; {/* Middle */};  |
| `src/features/tourhub/schedule-v2/SeasonRow.tsx:162` | fontWeight | <code>fontWeight: 800,</code> | fieldLine — ; {tourLabel}; {tag ? ( |
| `src/features/tourhub/schedule-v2/SeasonRow.tsx:180` | fontWeight | <code>fontWeight: 800,</code> | fieldLine — {t(&#96;schedule.tag.${tag}&#96;)}; ) : null};  |
| `src/features/tourhub/schedule-v2/SeasonRow.tsx:256` | fontWeight | <code>fontWeight: 800,</code> | labelStyle — ; {t('schedule.row.purse')};  |
| `src/features/tourhub/schedule-v2/SeasonRow.tsx:373` | fontWeight | <code>fontWeight: 800,</code> | label — )}; {rc.scoreText};  |
| `src/features/tourhub/tournament-v2/sections/ContestSection.tsx:80` | fontWeight | <code>&lt;div style={{ fontSize: 66, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.84, color: INK, fontVariantNumeric: 'tabular-nums lining-nums' }}&gt;{contest.margin}&lt;/div&gt;</code> | qualifier — ; {contest.margin};  |
| `src/features/tourhub/tournament-v2/sections/ContestSection.tsx:87` | fontWeight | <code>&lt;div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.02, color: INK }}&gt;{word}&lt;/div&gt;</code> | qualifier — {qualifier &&; {qualifier}; } |
| `src/features/tourhub/tournament-v2/sections/FullBoardSheet.tsx:155` | fontWeight | <code>style={{ margin: '3px 0 0', fontSize:21,fontWeight:800,letterSpacing:0,color:A.INK,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}</code> | pid — {meta?.name && (; {meta.name}; )} |
| `src/features/tourhub/tournament-v2/sections/HeroBoardRows.tsx:368` | fontWeight | <code>&lt;span ref={kickerRef} data-hero-board-kicker style={{ gridColumn: labelsOwnLine ? '1 / -1' : showOverviewPosition ? '1 / 3' : '1 / 2', gridRow: 1, fontWeight: 800, letterSpacing: '0.16em', textAlign: 'left', minWidth: 0 }}&gt;{t('rebuilt.leaderboard', { defaultValue: 'Leaderboard' })}&lt;/span&gt;</code> | boardKicker — {t('rebuilt.leaderboard', { defaultValue: 'Leaderboard' })}; ;  |
| `src/features/tourhub/tournament-v2/sections/MoveSection.tsx:48` | fontWeight | <code>&lt;div style={{ fontSize: 26, fontWeight: 800, color: getScoreColor(contest.moverToday, 'dark'), fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 1 }}&gt;{fmtScore(contest.moverToday)}&lt;/div&gt;</code> | figureLabel — ; ;  |
| `src/features/tourhub/tournament-v2/sections/completedWeek.css:5` | CSS font-weight | <code>.cw-kick { margin:0;padding:var(--hero-section-gap) var(--cw-side) 0;font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--cw-mute);line-height:1.4 }</code> | CSS selector .cw-kick |
| `src/features/tourhub/tournament-v2/sections/completedWeek.css:6` | CSS font-weight | <code>.cw-sub { margin:0;padding:13px var(--cw-side) 0;font-size:9.5px;font-weight:800;letter-spacing:.14em;color:var(--cw-dim);line-height:1.4 }</code> | CSS selector .cw-sub |
| `src/features/tourhub/tournament-v2/sections/completedWeek.css:10` | CSS font-weight | <code>.cw-week-cell span { display:block;margin-top:6px;font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cw-dim) }</code> | CSS selector .cw-week-cell span |
| `src/features/tourhub/tournament-v2/sections/completedWeek.css:12` | CSS font-weight | <code>.cw-chart-round { fill:var(--cw-dim);font-size:9px;font-weight:800;letter-spacing:1.2px }</code> | CSS selector .cw-chart-round |
| `src/features/tourhub/tournament-v2/sections/completedWeek.css:23` | CSS font-weight | <code>.cw-cell span { display:block;margin-top:var(--hero-label-gap);font-size:9.5px;font-weight:800;letter-spacing:var(--hero-label-tracking);line-height:13px;color:var(--cw-dim);white-space:nowrap }</code> | CSS selector .cw-cell span |
| `src/features/tourhub/tournament-v2/sections/heroRoundPanel.css:7` | CSS font-weight | <code>.hero-round-label { font-size:9.5px; font-weight:800; letter-spacing:.14em; color:var(--hero-round-dim); white-space:nowrap; }</code> | CSS selector .hero-round-label |
| `src/features/tourhub/tournament-v2/sections/heroRoundPanel.css:9` | CSS font-weight | <code>.hero-round-label i { margin-left:4px; font-size:12px; font-weight:800; font-style:normal; letter-spacing:0; }</code> | CSS selector .hero-round-label i |
| `src/features/tourhub/tournament-v2/tournamentPage.css:3` | CSS font-weight | <code>.tv-tour { margin-top:0;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--tv-amber) }</code> | CSS selector .tv-tour |
| `src/features/tourhub/tournament-v2/tournamentPage.css:3` | CSS font-weight | <code>.tv-title { margin:4px 0 0;font-size:26px;font-weight:800;line-height:1.1;color:var(--tv-white) }</code> | CSS selector .tv-title |
| `src/features/tourhub/tournament-v2/tournamentPage.css:3` | CSS font-weight | <code>.tv-hero-sentence b { font-weight:800 }</code> | CSS selector .tv-hero-sentence b |
| `src/features/tourhub/tournament-v2/tournamentPage.css:3` | CSS font-weight | <code>.tv-figures b { display:block;font-size:19px;font-weight:800;line-height:1 }</code> | CSS selector .tv-figures b |
| `src/features/tourhub/tournament-v2/tournamentPage.css:3` | CSS font-weight | <code>.tv-figures span { display:block;margin-top:6px;font-size:9.5px;font-weight:800;letter-spacing:.12em;color:var(--tv-dim) }</code> | CSS selector .tv-figures span |
| `src/features/tourhub/tournament-v2/tournamentPage.css:4` | CSS font-weight | <code>.tv-head h2 { margin:0;font-size:11px;font-weight:800;letter-spacing:.16em }</code> | CSS selector .tv-head h2 |
| `src/features/tourhub/tournament-v2/tournamentPage.css:4` | CSS font-weight | <code>.tv-head&gt;span { font-size:10.5px;font-weight:800;letter-spacing:.12em;color:var(--tv-mute) }</code> | CSS selector .tv-head>span |
| `src/features/tourhub/tournament-v2/tournamentPage.css:4` | CSS font-weight | <code>.tv-head .tv-link { padding:0;font-weight:800;letter-spacing:.1em }</code> | CSS selector .tv-head .tv-link |
| `src/features/tourhub/tournament-v2/tournamentPage.css:4` | CSS font-weight | <code>.tv-tile small { font-size:9.5px;font-weight:800;color:var(--tv-dim);display:block }</code> | CSS selector .tv-tile small |
| `src/features/tourhub/tournament-v2/tournamentPage.css:4` | CSS font-weight | <code>.tv-tile b { font-size:18px;font-weight:800;display:block;margin-top:6px }</code> | CSS selector .tv-tile b |
| `src/features/tourhub/tournament-v2/tournamentPage.css:4` | CSS font-weight | <code>.tv-chart .tv-label-winner { fill:var(--tv-gold);font-weight:800 }</code> | CSS selector .tv-chart .tv-label-winner |
| `src/features/tourhub/tournament-v2/tournamentPage.css:4` | CSS font-weight | <code>.tv-lead-tile small { font-size:9.5px;font-weight:800;color:var(--tv-dim) }</code> | CSS selector .tv-lead-tile small |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-switch button { height:26px;padding:0 10px;border-radius:7px;color:var(--tv-mute);font-size:11px;font-weight:800;background:none }</code> | CSS selector .tv-switch button |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-subtitle { margin:14px 0 2px;font-size:9.5px;font-weight:800;letter-spacing:.13em;color:var(--tv-dim) }</code> | CSS selector .tv-subtitle |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-tee-time b { font-size:16px;font-weight:800;display:block;line-height:1 }</code> | CSS selector .tv-tee-time b |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-tee-time small { display:block;margin-top:5px;font-size:9.5px;font-weight:800;color:var(--tv-dim) }</code> | CSS selector .tv-tee-time small |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-tag { flex:none;font-size:9px;font-weight:800;border:1px solid var(--tv-rule);padding:2px 6px;border-radius:999px;color:var(--tv-soft) }</code> | CSS selector .tv-tag |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-split-key b { display:block;font-size:15px;font-weight:800;color:var(--tv-ink) }</code> | CSS selector .tv-split-key b |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-hole-number { font-size:17px;font-weight:800 }</code> | CSS selector .tv-hole-number |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-hole-value { text-align:right;font-size:13.5px;font-weight:800 }</code> | CSS selector .tv-hole-value |
| `src/features/tourhub/tournament-v2/tournamentPage.css:5` | CSS font-weight | <code>.tv-board-row&gt;span:last-child { font-size:13.5px;font-weight:800 }</code> | CSS selector .tv-board-row>span:last-child |
| `src/features/video-details/round-video.css:2` | CSS font-weight | <code>.round-video-kicker { font-size:9.5px;font-weight:800;letter-spacing:.14em;color:var(--video-about-mute) }</code> | CSS selector .round-video-kicker |
| `src/features/video-details/round-video.css:2` | CSS font-weight | <code>.round-video-value { font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.2 }</code> | CSS selector .round-video-value |
| `src/features/video-details/round-video.css:5` | CSS font-weight | <code>.round-video-chapter-score { font-weight:800;font-variant-numeric:tabular-nums;color:var(--video-about-ink) }</code> | CSS selector .round-video-chapter-score |
| `src/features/video-details/video-viewer.css:2` | CSS font-weight | <code>.video-teaser .video-title { display:block;max-width:100%;height:auto;padding:0;border-radius:0;background:none;color:var(--video-about-ink);text-align:left;white-space:normal;overflow-wrap:break-word;font-size:16px;font-weight:800;line-height:1.3;margin-top:10px;letter-spacing:0 }</code> | CSS selector .video-teaser .video-title |
| `src/features/video-details/video-viewer.css:11` | CSS font-weight | <code>.video-about h2 { font-size:17px;font-weight:800;line-height:1.3;overflow-wrap:break-word;margin:0 }</code> | CSS selector .video-about h2 |
| `src/features/video-details/video-viewer.css:15` | CSS font-weight | <code>.video-about-kicker { font-size:10.5px;font-weight:800;letter-spacing:.18em;color:var(--video-about-dim);text-transform:uppercase;margin:0 0 6px }</code> | CSS selector .video-about-kicker |
| `src/features/video-details/video-viewer.css:20` | CSS font-weight | <code>.video-about-glyph { width:28px;height:28px;flex:none;border:1px solid var(--video-about-edge);border-radius:6px;display:grid;place-items:center;font-size:9px;font-weight:800 }</code> | CSS selector .video-about-glyph |
| `src/index.css:534` | CSS font-weight | <code>.club-you-kicker { font-size:10.5px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase; color:var(--club-you-muted); margin:0 0 10px; overflow-wrap:anywhere; }</code> | CSS selector .club-you-kicker |
| `src/index.css:556` | CSS font-weight | <code>.club-visiting-kicker { font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--club-visiting-mute); margin-bottom:4px; }</code> | CSS selector .club-visiting-kicker |
| `src/index.css:565` | CSS font-weight | <code>.club-visiting-tag { font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; border:1px solid var(--club-visiting-control-hair); border-radius:999px; padding:2px 7px; }</code> | CSS selector .club-visiting-tag |
| `src/index.css:601` | CSS font-weight | <code>.review-upload-failed { background:var(--review-upload-failed); font-size:10.5px; font-weight:800; }</code> | CSS selector .review-upload-failed |
| `src/index.css:644` | CSS font-weight | <code>.team-summary-avatar { width: 34px; height: 34px; flex: none; border-radius: 11px; border: 2px solid var(--team-inverted-ink); margin-left: -8px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; background: var(--team-avatar-surface); color: var(--team-muted); }</code> | CSS selector .team-summary-avatar |
| `src/index.css:653` | CSS font-weight | <code>.team-request-kicker { font-size: 10.5px; line-height: 1.4; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--team-muted); display: flex; justify-content: space-between; }</code> | CSS selector .team-request-kicker |
| `src/index.css:657` | CSS font-weight | <code>.team-request-avatar { width: 44px; height: 44px; border-radius: 14px; flex: none; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; background: var(--team-avatar-surface); color: var(--team-muted); }</code> | CSS selector .team-request-avatar |
| `src/index.css:686` | CSS font-weight | <code>.team-s4-table th { font-size: 9.5px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--team-dim); text-align: center; padding: 4px 0 8px; }</code> | CSS selector .team-s4-table th |
| `src/index.css:695` | CSS font-weight | <code>.team-s4-tile { width: 24px; height: 24px; border-radius: 8px; flex: none; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; background: var(--team-avatar-surface); color: var(--team-muted); }</code> | CSS selector .team-s4-tile |
| `src/index.css:707` | CSS font-weight | <code>.team-list-avatar { width: 44px; height: 44px; border-radius: 14px; flex: none; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; background: var(--team-avatar-surface); color: var(--team-muted); }</code> | CSS selector .team-list-avatar |
| `src/index.css:5510` | CSS font-weight | <code>.insights-visits-kicker { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 10.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--team-muted); }</code> | CSS selector .insights-visits-kicker |
| `src/index.css:5519` | CSS font-weight | <code>.insights-visits-marker &gt; span { position: absolute; left: 12px; top: -3px; font-size: 9.5px; font-weight: 800; color: var(--team-muted); }</code> | CSS selector .insights-visits-marker > span |
| `src/index.css:5564` | CSS font-weight | <code>.insights-posts-rank { width: 14px; flex: none; font-size: 11px; font-weight: 800; color: var(--team-dim); font-variant-numeric: tabular-nums; }</code> | CSS selector .insights-posts-rank |
| `src/index.css:5631` | CSS font-weight | <code>.insights-course-kicker { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--team-muted); }</code> | CSS selector .insights-course-kicker |
| `src/index.css:5700` | CSS font-weight | <code>.review-score-kicker { font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--score-muted); }</code> | CSS selector .review-score-kicker |
| `src/index.css:5768` | CSS font-weight | <code>.overview-news-kicker { display:flex; align-items:center; gap:8px; font-size:10px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:var(--news-mute); }</code> | CSS selector .overview-news-kicker |
| `src/index.css:5779` | CSS font-weight | <code>.overview-news-hero h3 { margin:10px 0 0; font-size:27px; font-weight:800; line-height:1.12; overflow-wrap:anywhere; }</code> | CSS selector .overview-news-hero h3 |
| `src/index.css:5797` | CSS font-weight | <code>.overview-news-player em { font-style:normal; font-weight:800; }</code> | CSS selector .overview-news-player em |
| `src/index.css:5803` | CSS font-weight | <code>.tour-news-head h1 { margin:0; font-size:26px; font-weight:800; }</code> | CSS selector .tour-news-head h1 |
| `src/index.css:5818` | CSS font-weight | <code>.tour-news-lead-copy h2 { margin:10px 0 0; font-size:27px; font-weight:800; line-height:1.12; overflow-wrap:anywhere; }</code> | CSS selector .tour-news-lead-copy h2 |
| `src/index.css:5830` | CSS font-weight | <code>.tour-news-event-row .score { text-align:right; font-size:15px; font-weight:800; }</code> | CSS selector .tour-news-event-row .score |
| `src/index.css:5832` | CSS font-weight | <code>.tour-news-sec { margin:30px 24px 4px; display:flex; align-items:baseline; justify-content:space-between; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--news-dim); }</code> | CSS selector .tour-news-sec |
| `src/index.css:5845` | CSS font-weight | <code>.tour-news-grp { margin:22px 24px 2px; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--news-dim); }</code> | CSS selector .tour-news-grp |
| `src/index.css:5848` | CSS font-weight | <code>.tour-news-ar-date b { display:block; font-size:17px; font-weight:800; line-height:1; }</code> | CSS selector .tour-news-ar-date b |
| `src/index.css:5849` | CSS font-weight | <code>.tour-news-ar-date small { display:block; margin-top:4px; font-size:9px; font-weight:800; letter-spacing:.12em; color:var(--news-dim); }</code> | CSS selector .tour-news-ar-date small |
| `src/pages/BusinessInvitePage.tsx:279` | fontWeight | <code>padding: '18px 20px 0', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em',</code> | headingStyle — text/value styled by this declaration |
| `src/pages/FindPeoplePage.tsx:319` | fontWeight | <code>fontWeight: 800,</code> | total — ; {copy(group.label)}; {group.followAll ? ( |
| `src/pages/auth/components/auth-hero.css:20` | CSS font-weight | <code>.auth-hero-brand h1 { margin: 18px 0 0; font-size: 34px; font-weight: 800; letter-spacing: -.035em; line-height: 1.05; color: var(--auth-ink); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; font-synthesis: none; transition: margin-top 240ms cubic-bezier(.2,.8,.2,1); }</code> | CSS selector .auth-hero-brand h1 |
| `src/pages/auth/components/auth-hero.css:40` | CSS font-weight | <code>.auth-hero-panel h2 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -.025em; line-height: normal; }</code> | CSS selector .auth-hero-panel h2 |
| `src/pages/messaging-v2/HeadToHeadCard.tsx:29` | fontWeight | <code>fontWeight: 800,</code> | LABEL — text/value styled by this declaration |
| `src/pages/messaging-v2/ShareCards.tsx:74` | fontWeight | <code>fontWeight: 800,</code> | toPar — ; {t('share.roundLabel', { defaultValue: 'Round' })};  |
| `src/styles/hybrid-hero.css:70` | CSS font-weight | <code>.upcoming-facts b { display:block;font-size:19px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }</code> | CSS selector .upcoming-facts b |
| `src/styles/hybrid-hero.css:71` | CSS font-weight | <code>.upcoming-facts span { display:block;margin-top:6px;font-size:9.5px;font-weight:800;letter-spacing:.12em;color:var(--tv-dim);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis }</code> | CSS selector .upcoming-facts span |
| `src/styles/hybrid-hero.css:72` | CSS font-weight | <code>.upcoming-kicker { margin:0;font-size:10px;font-weight:800;letter-spacing:.16em;color:rgba(248,250,252,.62);text-transform:uppercase;line-height:1.4 }</code> | CSS selector .upcoming-kicker |
| `src/styles/hybrid-hero.css:88` | CSS font-weight | <code>.recap-block .upcoming-kicker { font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--cw-mute);line-height:1.4 }</code> | CSS selector .recap-block .upcoming-kicker |
| `src/styles/hybrid-hero.css:120` | CSS font-weight | <code>.upcoming-event-facts span { display:block;margin-top:var(--hero-label-gap);font-size:9.5px;font-weight:800;letter-spacing:var(--hero-label-tracking);line-height:13px;text-transform:uppercase;color:rgba(248,250,252,.42);white-space:nowrap }</code> | CSS selector .upcoming-event-facts span |
| `src/styles/hybrid-hero.css:124` | CSS font-weight | <code>.upcoming-sec-kick { margin:0;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(248,250,252,.62);line-height:1.4 }</code> | CSS selector .upcoming-sec-kick |
| `src/styles/post-flow.css:4` | CSS font-weight | <code>.pf-header h3 { margin:0;font-size:17px;font-weight:800; }</code> | CSS selector .pf-header h3 |
| `src/styles/post-flow.css:12` | CSS font-weight | <code>.pf-group { margin:20px 20px 8px;display:flex;justify-content:space-between;gap:8px;font-size:10.5px;font-weight:800;letter-spacing:.16em;color:var(--pf-dim); }</code> | CSS selector .pf-group |
| `src/styles/post-flow.css:30` | CSS font-weight | <code>.pf .pf-pill { height:44px;padding:0 22px;border-radius:999px;border:0;background:var(--pf-ink);color:var(--pf-canvas);font-size:14px;font-weight:800;white-space:nowrap;flex:none; }</code> | CSS selector .pf .pf-pill |
| `src/styles/post-flow.css:34` | CSS font-weight | <code>.pf-best-head { display:flex;justify-content:space-between;font-size:10px;font-weight:800;letter-spacing:.16em;color:var(--pf-dim); }</code> | CSS selector .pf-best-head |
| `src/styles/post-flow.css:46` | CSS font-weight | <code>.pf-label { margin:20px 20px 10px;font-size:10.5px;font-weight:800;letter-spacing:.16em;color:var(--pf-dim); }</code> | CSS selector .pf-label |
| `src/styles/post-flow.css:48` | CSS font-weight | <code>.pf-day-week { font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--pf-dim); }</code> | CSS selector .pf-day-week |
| `src/styles/post-flow.css:49` | CSS font-weight | <code>.pf-day-num { font-size:19px;font-weight:800; }</code> | CSS selector .pf-day-num |
| `src/styles/post-flow.css:53` | CSS font-weight | <code>.pf-time-value { font-size:30px;font-weight:800; }</code> | CSS selector .pf-time-value |
| `src/styles/post-flow.css:61` | CSS font-weight | <code>.pf-kicker { margin-top:24px;display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.16em; }</code> | CSS selector .pf-kicker |
| `src/styles/post-flow.css:64` | CSS font-weight | <code>.pf-headline { margin:14px 0 0;font-size:30px;font-weight:800;line-height:1.1; }</code> | CSS selector .pf-headline |
| `src/styles/welcome.css:6` | CSS font-weight | <code>.welcome-kicker { font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--welcome-mute) }</code> | CSS selector .welcome-kicker |
| `src/styles/welcome.css:10` | CSS font-weight | <code>.welcome-field label { font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--welcome-dim);text-transform:uppercase }</code> | CSS selector .welcome-field label |
| `src/styles/welcome.css:12` | CSS font-weight | <code>.welcome-stats span { font-size:9.5px;font-weight:800;text-transform:uppercase;color:var(--welcome-dim);letter-spacing:.12em }</code> | CSS selector .welcome-stats span |
| `src/styles/welcome.css:13` | CSS font-weight | <code>.welcome-section-heading { display:flex;justify-content:space-between;align-items:center;margin-top:22px;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--welcome-mute) }</code> | CSS selector .welcome-section-heading |
| `src/styles/welcome.css:15` | CSS font-weight | <code>.welcome-group-label { font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.16em;color:var(--welcome-dim);margin:12px 0 2px }</code> | CSS selector .welcome-group-label |
| `src/styles/welcome.css:16` | CSS font-weight | <code>.welcome-tiles span { display:block;font-size:10px;font-weight:800;text-transform:uppercase;color:var(--welcome-dim);margin-top:4px;line-height:1.5 }</code> | CSS selector .welcome-tiles span |
| `src/styles/welcome.css:38` | CSS font-weight | <code>.welcome-final-facts i { display:block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--welcome-dim);margin-top:5px }</code> | CSS selector .welcome-final-facts i |
| `src/styles/welcome.css:41` | CSS font-weight | <code>.welcome-final-sec { font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--welcome-dim);margin-top:22px }</code> | CSS selector .welcome-final-sec |

### Exclusions and interpretation

Excluded non-font examples include z-index, animation/timer durations, image geometry, colour literals (including Tailwind slate/gray-800/900), analytics thresholds, viewport buffers, prose comments and historical typography annotations. No runtime computed-style claim is made: CSS cascades, caller className/style overrides, and theme variables remain caller/surface-dependent. Source declarations, not stale comments, determine the inventory.
