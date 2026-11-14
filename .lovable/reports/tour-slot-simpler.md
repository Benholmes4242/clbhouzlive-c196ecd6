# Simpler Clubhouse Tour post

## Files and result
- `src/features/clubhouse-tour/TourSlot.tsx`: remove picks, record props/read and record readiness; compact header (38px trophy/19px icon, 16px name, 13px second line), fixed 162px photo, actions 10/16/2, live sentence 14.5px/1.4 with 6px top inset, board 26px rows/6px inset, comment 10/16/12 and 12px no-comment spacer.
- `src/test/tourSlot.test.tsx`: only authorised rendering case changes and four added cases.
- `roadmap.md` and this report: delivery accounting.
- `tourSlotRules.ts` and `useTourSlotData.ts` unchanged; prediction-based state selection, pure rule cases, top-three ties/colours, photo fit/fade/caption, facts, LikedByRow, navigation and engagement preserved. No SQL, migrations or feed_config changes.

## Renamed/rewritten tests (no deleted cases)
1. `src/test/tourSlot.test.tsx:105`: “renders the photo ten pixels under the shared hero height” → “renders the photo at 162px”. Assertion `.style.height).toBe('340px')` → `.style.height).toBe('162px')`; picks/record render props removed because the brief replaces the height and removes these props.
2. `src/test/tourSlot.test.tsx:106`: “shows the first top tie marker only and keeps pick positions in ink” → “shows the first top tie marker only”. Retained `expect([...positions].map(p=>p.textContent)).toEqual(['T1','','3'])`. Removed pick-only assertions `expect((p as HTMLElement).style.color).toBe('rgb(248, 250, 252)')` and `expect(INK).toBe('#F8FAFC')`, plus picks/record props and unused pick fixture/import, because picks no longer render.

## Added cases and totals
- “omits Our picks and the picks block in preview”
- “omits Our picks and the picks block in live”
- “omits Our picks and the picks block in result”
- “renders board rows 26px high in live and result”

Previous full baseline: **8,727**. After: **8,731 executed / 8,731 passed / 0 failed**. Delta **+4**, entirely the cases above; two renames do not change counts. Pure rule tests unchanged.

Focused command: `bunx vitest run src/test/tourSlot.test.tsx src/test/tourSlotVisit.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/tour-slot-simpler/focused.json` — **44/44**.

Four separate commands: `bunx vitest run --shard=N/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/tour-slot-simpler/shard-N.json` (N=1,2,3,4).

| Shard | Executed | Passed | Failed |
|---|---:|---:|---:|
| 1 | 2,203 | 2,203 | 0 |
| 2 | 2,110 | 2,110 | 0 |
| 3 | 2,196 | 2,196 | 0 |
| 4 | 2,222 | 2,222 | 0 |
| Total | 8,731 | 8,731 | 0 |

Preview build: `build OK`, 2026-11-14T20:52:23Z. Diff whitespace check passed. Real-member 430/320 visual comparison and live like/comment end-to-end checks remain unverified; no exact total-height/overflow parity claim. Surrounding mock content is reference-only; frozen photo overlay/facts/actions behaviour preserved.

## Exact application/test diff from last reported baseline
```diff
diff --git a/src/features/clubhouse-tour/TourSlot.tsx b/src/features/clubhouse-tour/TourSlot.tsx
index a8d8f4855e..2b471ab6e6 100644
--- a/src/features/clubhouse-tour/TourSlot.tsx
+++ b/src/features/clubhouse-tour/TourSlot.tsx
@@ -11,7 +11,6 @@ import { useSupabaseSession } from '@/hooks/useSupabaseSession';
 import { useActiveActor } from '@/context/ActiveActorContext';
 import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
 import { writeStoredTour } from '@/features/tourhub/hooks/useTourSelection';
-import { useOurPickRecord } from '@/features/tourhub/hooks/usePickInsights';
 import { useBatchCourseImages } from '@/features/tourhub/hooks/useBatchCourseImages';
 import { PhotoBandFade } from '@/features/tourhub/components/overview-v3/HybridHeroBands/photoBandMaterial';
 import { COURSE_GRADIENT } from '@/features/tourhub/components/overview-v3/HybridHero.constants';
@@ -26,7 +25,6 @@ import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
 import { fmtScore } from '@/features/tourhub/utils/fmtScore';
 import { INK, INK_SOFT, INK_MUTE, INK_FAINT, AMBER, TOUR_LIVE_GREEN } from '@/features/tourhub/_shared/tokens';
 import { FEED_CARD_SURFACE, MEMBER_CELL } from '@/lib/tokens/surfaces';
-import { HERO_PHOTO_HEIGHT } from '@/lib/heroHeights';
 import { countInWords } from '@/features/tourhub/components/overview-v3/overviewTokens';
 import { formatOverviewDateRange } from '@/features/tourhub/components/overview-v3/HybridHero';
 import { FeedPostActions, FeedAddComment } from '@/components/feed/FeedPostControls';
@@ -39,18 +37,18 @@ import type { FeedPost } from '@/components/media-system/types/media';
 import type { CommentOpenSource } from '@/types/commentOpenSource';
 import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
 import { useTourSlotData, type TourSlotVisit } from './useTourSlotData';
-import { TOUR_DISPLAY, slotPosition, pickScore, recordLine, bestOfThree, chaserSentence, type SlotSelection, type SlotPick } from './tourSlotRules';
+import { TOUR_DISPLAY, chaserSentence, type SlotSelection } from './tourSlotRules';
 
-// The slot photo sits 10px under the shared hero height so the card reads between the top islands and the floating nav.
-const TOUR_SLOT_PHOTO_HEIGHT = HERO_PHOTO_HEIGHT - 10;
+// The slot photo is a fixed 162px (signed off with the simpler slot).
+const TOUR_SLOT_PHOTO_HEIGHT = 162;
 const ellipsis: React.CSSProperties = { minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
 const numeric: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
 const caps: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase' };
 const dateLabel = (date: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${date.slice(0,10)}T12:00:00Z`)).replace(',', '');
 const weekday = (date: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/London' }).format(new Date(`${date.slice(0,10)}T12:00:00Z`));
-export interface TourSlotViewProps { selection: SlotSelection; picks: readonly SlotPick[]; board: BoardEntry[]; image: string | null; record: string | null; sentence: string | null; chase: string | null; actions?: React.ReactNode; comment?: React.ReactNode; onOpen: () => void }
+export interface TourSlotViewProps { selection: SlotSelection; board: BoardEntry[]; image: string | null; sentence: string | null; chase: string | null; actions?: React.ReactNode; comment?: React.ReactNode; onOpen: () => void }
 
-export function TourSlotView({ selection, picks, board, image, record, sentence, chase, actions, comment, onOpen }: TourSlotViewProps) {
+export function TourSlotView({ selection, board, image, sentence, chase, actions, comment, onOpen }: TourSlotViewProps) {
   const { t } = useTranslation('tourhub');
   const { tournament: event, tour, state } = selection;
   const rows = board.filter(row => row.position != null).sort((a,b) => (a.position ?? Infinity) - (b.position ?? Infinity));
@@ -70,10 +68,10 @@ export function TourSlotView({ selection, picks, board, image, record, sentence,
   const scoreStyle = (score: number | null): React.CSSProperties => ({ ...numeric, color: score != null && score > 0 ? INK : getScoreColor(score, 'dark'), fontSize: 15, fontWeight: 800, textAlign: 'right' });
   return <>
     <article data-tour-slot={state} data-tour-slot-id={event.id} onClick={onOpen} style={{ background: FEED_CARD_SURFACE, color: INK, width: '100%', minWidth: 0, cursor: 'pointer' }}>
-      <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px 12px' }}>
-        <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: '34%', background: MEMBER_CELL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={22} strokeWidth={1.8} /></div>
-        <div style={{ minWidth: 0 }}><div style={{ ...ellipsis, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{TOUR_DISPLAY[tour]}</div>
-          <div style={{ ...ellipsis, fontSize: 14, color: INK_MUTE, marginTop: 3 }}>{state === 'live' ? <><span style={{ color: TOUR_LIVE_GREEN, fontSize: 11, fontWeight: 800, letterSpacing: '.14em' }}>● LIVE</span>{'  '}Round {round}</> : state === 'preview' ? `Starts ${dateLabel(event.start_date)}` : `Final · ${dateLabel(event.end_date)}`}</div>
+      <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 16px 8px' }}>
+        <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: '34%', background: MEMBER_CELL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trophy size={19} strokeWidth={1.8} /></div>
+        <div style={{ minWidth: 0 }}><div style={{ ...ellipsis, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{TOUR_DISPLAY[tour]}</div>
+          <div style={{ ...ellipsis, fontSize: 13, color: INK_MUTE, marginTop: 2 }}>{state === 'live' ? <><span style={{ color: TOUR_LIVE_GREEN, fontSize: 11, fontWeight: 800, letterSpacing: '.14em' }}>● LIVE</span>{'  '}Round {round}</> : state === 'preview' ? `Starts ${dateLabel(event.start_date)}` : `Final · ${dateLabel(event.end_date)}`}</div>
         </div>
       </header>
       <div data-tour-slot-photo style={{ position: 'relative', height: TOUR_SLOT_PHOTO_HEIGHT, width: '100%', background: COURSE_GRADIENT }}>
@@ -91,20 +89,13 @@ export function TourSlotView({ selection, picks, board, image, record, sentence,
       </div>
       {actions && <div data-tour-slot-actions onClick={e => e.stopPropagation()}>{actions}</div>}
       {state === 'preview' && <div style={{ display: 'flex', gap: 26, padding: '10px 16px 0', minWidth: 0 }}>{facts.map(f => <div key={f.label} style={{ minWidth: 0, flex: '0 1 auto' }}><div style={{ ...ellipsis, fontSize: 16, fontWeight: 800 }}>{f.value}</div><div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', color: INK_FAINT, textTransform: 'uppercase', marginTop: 3 }}>{f.label}</div></div>)}</div>}
-      {state === 'live' && sentence && <p style={{ fontSize: 15, lineHeight: 1.45, color: INK_SOFT, padding: '8px 16px 0', margin: 0 }}><strong style={{ color: INK, fontWeight: 700 }}>{sentence}</strong>{chase ? ` ${chase}` : ''}</p>}
-      {state !== 'preview' && <div data-tour-slot-board style={{ padding: '8px 16px 0' }}>{rows.slice(0,3).map((row,i) => <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) auto', alignItems: 'center', gap: 8, height: 30 }}>
+      {state === 'live' && sentence && <p style={{ fontSize: 14.5, lineHeight: 1.4, color: INK_SOFT, padding: '6px 16px 0', margin: 0 }}><strong style={{ color: INK, fontWeight: 700 }}>{sentence}</strong>{chase ? ` ${chase}` : ''}</p>}
+      {state !== 'preview' && <div data-tour-slot-board style={{ padding: '6px 16px 0' }}>{rows.slice(0,3).map((row,i) => <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) auto', alignItems: 'center', gap: 8, height: 26 }}>
         <span style={{ ...numeric, color: INK, fontSize: 13, fontWeight: 700 }}>{i > 0 && rows[i-1].position === row.position ? '' : `${row.position_tied || rows.filter(r => r.position === row.position).length > 1 ? 'T' : ''}${row.position}`}</span>
         <span style={{ ...ellipsis, fontSize: 14.5, fontWeight: 600 }}>{row.player?.full_name ?? row.team?.display_name ?? ''}</span><span style={scoreStyle(row.score)}>{row.score == null ? '' : fmtScore(row.score)}</span>
       </div>)}</div>}
-      <div style={{ ...caps, color: INK_FAINT, padding: '16px 16px 0' }}>Our picks</div>
-      <div data-tour-slot-picks style={{ padding: '8px 16px 0' }}>{picks.map(pick => {
-        const row = board.find(row => row.player?.id === pick.playerId);
-        const score = state === 'preview' ? null : pickScore(row);
-        return <div key={pick.playerId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto 44px', gap: 8, alignItems: 'center', height: 30 }}><span style={{ ...ellipsis, fontSize: 14.5, fontWeight: 600 }}>{pick.playerName}</span><span data-tour-slot-position style={{ ...numeric, fontSize: 13, fontWeight: 700, color: INK, textAlign: 'right' }}>{state === 'preview' ? '' : slotPosition(row)}</span><span style={scoreStyle(score)}>{score == null ? '' : fmtScore(score)}</span></div>;
-      })}</div>
-      {record && <div style={{ fontSize: 12.5, color: INK_FAINT, padding: '8px 16px 0' }}>{record}</div>}
       {comment && <div data-tour-slot-comment onClick={e => e.stopPropagation()}>{comment}</div>}
-      {!comment && <div style={{ height: 16 }} />}
+      {!comment && <div style={{ height: 12 }} />}
     </article><div aria-hidden style={{ height: 8 }} />
   </>;
 }
@@ -129,7 +120,6 @@ export function TourSlot({ visit, onComment }: { visit: TourSlotVisit; onComment
   const { activeActor, availableActors, setActiveActor } = useActiveActor();
   const imagesInput = useMemo(() => event ? [{ id: event.id, venue_name: event.venue_name, venue_course_name: event.venue_course_name, venue_city: event.venue_city, venue_state: event.venue_state, venue_country: event.venue_country }] : [], [event]);
   const images = useBatchCourseImages(imagesInput);
-  const record = useOurPickRecord(selection?.tour ?? '', event?.season.year ?? null);
   const postIdQuery = useTournamentSlotPost(event?.id ?? null, event?.name ?? null);
   const postId = postIdQuery.data ?? null;
   const engagement = useQuery({ queryKey: ['post-engagement', postId, 'tour-slot', activeActor?.type, activeActor?.id], enabled: !!postId,
@@ -148,7 +138,7 @@ export function TourSlot({ visit, onComment }: { visit: TourSlotVisit; onComment
   const { handleLike, getActiveLikeState } = useClubhouseLikes({ userId: user?.id, activeActor });
   const { handleShare } = useClubhouseShare(user?.id);
   const lastView = useRef<TourSlotViewProps | null>(null);
-  const settled = !!event && (images.isFetched || images.isError) && (record.isFetched || record.isError) && (postIdQuery.isFetched || postIdQuery.isError) && (!postId || engagement.isFetched || engagement.isError);
+  const settled = !!event && (images.isFetched || images.isError) && (postIdQuery.isFetched || postIdQuery.isError) && (!postId || engagement.isFetched || engagement.isError);
   const root = useRef<HTMLDivElement>(null);
   useEffect(() => {
     if (!settled || !event || !selection || !root.current || visit.shown.has(event.id)) return;
@@ -162,19 +152,17 @@ export function TourSlot({ visit, onComment }: { visit: TourSlotVisit; onComment
   }, [settled, event, selection, visit]);
   if (settled && selection && event && payload) {
     const board = payload.boards.get(event.id) ?? [];
-    const picks = payload.predictions.get(event.id) ?? [];
     const data = engagement.data;
     const post: FeedPost | null = postId && data ? { id: postId, userId: data.userId, actorId: data.userId, actorType: 'system', username: 'clbhouz', displayName: TOUR_DISPLAY[selection.tour], avatarUrl: '', isVerified: false, creatorRelation: 'system', caption: event.name, mediaItems: [], createdAt: data.createdAt, likeCount: data.likeCount, commentCount: data.commentCount, shareCount: 0, review: null, isReview: false, isLikedByMe: data.isLikedByMe, isFollowedByMe: false, postType: 'tournament_live' } : null;
     const likes = getActiveLikeState(post);
     const guest = (action: 'like' | 'comment' | 'share', fn: () => void) => { if (!gateGuestActionNow(action, { postKind: 'post' })) fn(); };
     const open = (source: CommentOpenSource) => { if (post) guest('comment', () => onComment(post, source)); };
     const heroTournament = { ...event, name: event.name, startDate: event.start_date, endDate: event.end_date } as unknown as HeroTournament;
-    lastView.current = { selection, picks, board, image: images.data?.get(event.id) ?? null,
-      record: selection.state === 'result' ? bestOfThree(picks, board) : recordLine(selection.tour, record.isError ? null : record.data),
+    lastView.current = { selection, board, image: images.data?.get(event.id) ?? null,
       sentence: selection.state === 'live' ? tournamentHeadline({ tournament: heroTournament, state: { kind: 'live', round: event.current_round ?? 1, totalRounds: roundsFromSchedule(event.start_date, event.end_date) }, leaderboard: board, t }) : null,
       chase: chaserSentence(board, t),
-      actions: post ? <><FeedPostActions actor={activeActor} onActorChange={setActiveActor} liked={likes.isLiked} likeCount={likes.count} commentCount={post.commentCount} padding="14px 16px 4px" gap={26} onLike={() => guest('like', () => handleLike(post))} onComment={() => open('footer_glyph')} onShare={() => guest('share', () => handleShare(post))} /><LikedByRow postId={post.id} count={likes.count} source="post" kind="like" surfaceColor={FEED_CARD_SURFACE} style={{ padding: '0 16px' }} /></> : null,
-      comment: post ? <FeedAddComment currentUserId={user?.id} actor={activeActor} multipleActors={availableActors.length > 1} onActorChange={setActiveActor} onComment={() => open('add_comment_row')} padding="14px 16px 16px" /> : null,
+      actions: post ? <><FeedPostActions actor={activeActor} onActorChange={setActiveActor} liked={likes.isLiked} likeCount={likes.count} commentCount={post.commentCount} padding="10px 16px 2px" gap={26} onLike={() => guest('like', () => handleLike(post))} onComment={() => open('footer_glyph')} onShare={() => guest('share', () => handleShare(post))} /><LikedByRow postId={post.id} count={likes.count} source="post" kind="like" surfaceColor={FEED_CARD_SURFACE} style={{ padding: '0 16px' }} /></> : null,
+      comment: post ? <FeedAddComment currentUserId={user?.id} actor={activeActor} multipleActors={availableActors.length > 1} onActorChange={setActiveActor} onComment={() => open('add_comment_row')} padding="10px 16px 12px" /> : null,
       onOpen: () => { selectTour(selection.tour, { tournamentId: event.id }); writeStoredTour(selection.tour); analyticsEvents.track('tour_slot_tapped', { state: selection.state, tour: selection.tour, tournament_id: event.id }); navigate('/tourhub'); },
     };
   }
diff --git a/src/test/tourSlot.test.tsx b/src/test/tourSlot.test.tsx
index 5546bcbfdb..8e38e3d1bd 100644
--- a/src/test/tourSlot.test.tsx
+++ b/src/test/tourSlot.test.tsx
@@ -7,7 +7,6 @@ import type { BoardEntry } from '@/features/tourhub/leaderboard/BoardTable';
 import type { SlotTournament, SlotSelection } from '@/features/clubhouse-tour/tourSlotRules';
 import { advanceTourSlotCursor, bestOfThree, chaserSentence, CURSOR_KEY, orderTourSlots, pickScore, recordLine, resolveTourSlot, resultHeld, slotPosition, tourSlotPlacement } from '@/features/clubhouse-tour/tourSlotRules';
 import { stripEventSponsorClause } from '@/features/tourhub/_shared/eventName';
-import { INK } from '@/features/tourhub/_shared/tokens';
 
 const h = vi.hoisted(() => ({ selection: null as SlotSelection | null, postId: 'post-123' as string | null, select: vi.fn(), invoke: vi.fn(), track: vi.fn(), onLike: vi.fn(), comments: vi.fn() }));
 vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
@@ -84,11 +83,25 @@ function mount() {
   return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><MemoryRouter initialEntries={['/clubhouse']}><TourSlot visit={visit} onComment={h.comments} /><Location /></MemoryRouter></QueryClientProvider>);
 }
 describe('Tour slot rendering and post binding', () => {
+  it.each(['preview', 'live', 'result'] as const)('omits Our picks and the picks block in %s', state => {
+    const { container } = render(<TourSlotView selection={{ tournament: event(), tour: 'pga', state }} board={board} image={null} sentence={null} chase={null} onOpen={() => {}} />);
+    expect(screen.queryByText('Our picks')).toBeNull();
+    expect(container.querySelector('[data-tour-slot-picks]')).toBeNull();
+  });
+  it('renders board rows 26px high in live and result', () => {
+    for (const state of ['live', 'result'] as const) {
+      const { container, unmount } = render(<TourSlotView selection={{ tournament: event(), tour: 'pga', state }} board={board} image={null} sentence={null} chase={null} onOpen={() => {}} />);
+      const rows = container.querySelectorAll<HTMLElement>('[data-tour-slot-board] > div');
+      expect(rows).toHaveLength(3);
+      for (const row of rows) expect(row.style.height).toBe('26px');
+      unmount();
+    }
+  });
   it('renders nothing without an eligible tournament', () => { const {container}=mount(); expect(container.querySelector('[data-tour-slot]')).toBeNull(); expect(h.invoke).not.toHaveBeenCalled(); });
   it('binds actions and liked-by to the returned persistent post id', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot-actions]')).not.toBeNull()); expect(h.invoke).toHaveBeenCalledWith('upsert-live-tournament-post',{body:{tournamentId:'event',tournamentName:'Austin Championship'}}); expect(container.querySelector('[data-likers-post]')?.getAttribute('data-likers-post')).toBe('post-123'); const buttons=container.querySelectorAll('[data-tour-slot-actions] button'); fireEvent.pointerDown(buttons[0], { pointerId: 1 }); fireEvent.pointerUp(buttons[0], { pointerId: 1 }); expect(h.onLike.mock.calls[0]?.[0]?.id).toBe('post-123'); });
   it('hides actions and comment doors when no post id is returned', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; h.postId=null; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot]')).not.toBeNull()); expect(container.querySelector('[data-tour-slot-actions]')).toBeNull(); expect(container.querySelector('[data-tour-slot-comment]')).toBeNull(); });
   it('selects the tournament tour and navigates when the body is tapped', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot]')).not.toBeNull()); const article=container.querySelector('[data-tour-slot]'); if (!article) throw Error('slot missing'); fireEvent.click(article); expect(h.select).toHaveBeenCalledWith('pga',{tournamentId:'event'}); expect(screen.getByTestId('location').textContent).toBe('/tourhub'); expect(localStorage.getItem('tourhub:selectedTour')).toBe('pga'); });
   it('does not navigate when the action or comment row is tapped', async () => { h.selection={tournament:event(),tour:'pga',state:'preview'}; const {container}=mount(); await waitFor(()=>expect(container.querySelector('[data-tour-slot-actions]')).not.toBeNull()); const action=container.querySelector('[data-tour-slot-actions]'); const comment=container.querySelector('[data-tour-slot-comment] button'); if (!action || !comment) throw Error('doors missing'); fireEvent.click(action); fireEvent.click(comment); expect(h.select).not.toHaveBeenCalled(); expect(screen.getByTestId('location').textContent).toBe('/clubhouse'); expect(h.comments.mock.calls[0]?.[0]?.id).toBe('post-123'); });
-  it('renders the photo ten pixels under the shared hero height', () => { const {container}=render(<TourSlotView selection={{tournament:event(),tour:'pga',state:'preview'}} picks={picks} board={board} image={null} record={null} sentence={null} chase={null} onOpen={()=>{}} />); expect((container.querySelector('[data-tour-slot-photo]') as HTMLElement).style.height).toBe('340px'); });
-  it('shows the first top tie marker only and keeps pick positions in ink', () => { const tied=[row(1,'A Player',-10,true),row(1,'B Player',-10,true),row(3,'C Player',2)]; const ps=tied.map((r,i)=>({rank:i+1,playerId:r.player?.id??'',playerName:r.player?.full_name??''})); const {container}=render(<TourSlotView selection={{tournament:event(),tour:'pga',state:'live'}} picks={ps} board={tied} image={null} record={null} sentence={null} chase={null} onOpen={()=>{}} />); const positions=container.querySelectorAll('[data-tour-slot-board] > div > span:first-child'); expect([...positions].map(p=>p.textContent)).toEqual(['T1','','3']); for (const p of container.querySelectorAll('[data-tour-slot-position]')) expect((p as HTMLElement).style.color).toBe('rgb(248, 250, 252)'); expect(INK).toBe('#F8FAFC'); });
+  it('renders the photo at 162px', () => { const {container}=render(<TourSlotView selection={{tournament:event(),tour:'pga',state:'preview'}} board={board} image={null} sentence={null} chase={null} onOpen={()=>{}} />); expect((container.querySelector('[data-tour-slot-photo]') as HTMLElement).style.height).toBe('162px'); });
+  it('shows the first top tie marker only', () => { const tied=[row(1,'A Player',-10,true),row(1,'B Player',-10,true),row(3,'C Player',2)]; const {container}=render(<TourSlotView selection={{tournament:event(),tour:'pga',state:'live'}} board={tied} image={null} sentence={null} chase={null} onOpen={()=>{}} />); const positions=container.querySelectorAll('[data-tour-slot-board] > div > span:first-child'); expect([...positions].map(p=>p.textContent)).toEqual(['T1','','3']); });
 });
\ No newline at end of file
```
