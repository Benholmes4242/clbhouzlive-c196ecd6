import { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { RailChips } from '@/components/ui/RailChips';
import { shareCourseName } from '@/lib/courses/shareCourseName';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { fmtCount } from './format';
import { useSectionReady } from './PageLoadGate';
import { settled } from './PageLoadGate';
import { WhoPlayingShell } from './sectionShells';
import { buildAreaTabs, buildRails, isNewRing, orderRings, readSeen, writeSeen, type RingGroup, type SeenMap } from './playedRings';
type MemberFacesMap = Map<string, { displayName: string | null; username: string | null; photoUrl: string | null }>;
const NO_FACES: MemberFacesMap = new Map();
import { postCourseIds, usePlayedRounds, type PlayedCourse, type PlayedPostRow, type PlayedReviewRow, type PlayedRoundRow } from './usePlayedRounds';
import { usePlayedTile } from './usePlayedTile';
import { PlayedHead, type Face } from './playedParts';
import { PlayedTile } from './PlayedTile';
import { RegionRails } from './RegionRails';

/**
 * SECTION 01 — WHAT'S BEEN PLAYED (BRIEF_WHATS_BEEN_PLAYED, three signed-off
 * mocks, revised by BRIEF_WHATS_BEEN_PLAYED_V2). Tabs from the home county
 * outwards, course rings busiest by activity first,
 * the selected ring's tile, then region rails for every active course outside
 * the first tab.
 * Reads: usePlayedRounds (rounds, course geography, home), usePlayedTile (the
 * selected course's photos). All of them gate 'whoPlaying'.
 * Guests see nothing (get_recent_rounds is 401 signed out).
 */
/* Geometry, read by the section AND WhoPlayingShell. Whole pixels only. */
export const RING_ITEM_W = 72;
export const RING_SIZE = 64;
export const RING_GAP = 8;
export const RING_BORDER = 1.5;
export const RING_RADIUS = 21.76;
export const RING_INSET = 2.5;
export const RING_PHOTO_RADIUS = 17.76;
export const RING_ROW_TOP = 14;
/** V3 §1: 10px so the corner count (top -7px) is never clipped by the row. */
export const RING_ROW_PAD_TOP = 10;
export const RING_LABEL_GAP = 9;
export const RING_LABEL_LINE = 13;
export const RING_VARIANT_LINE = 12;
export const BADGE_RADIUS = 6;
export const TABS_TOP = 12;
export const TAB_H = 34;
const SEEN_EDGE = 'rgba(255,255,255,.16)';

export interface CourseGroup extends RingGroup {
  rows: PlayedRoundRow[];
  /** Reviews in the window, newest first. */
  reviews: PlayedReviewRow[];
  posts: number;
  faces: Face[];
  best: number | null;
}
type MemberFaces = ReadonlyMap<string, { displayName: string | null; username: string | null; photoUrl: string | null }>;
type Item = { courseId: string; userId: string | null; at: string; key: string; round?: PlayedRoundRow; review?: PlayedReviewRow; post?: true };

/**
 * §2 activity per course: rounds + posts + reviews. Members are the distinct
 * people behind any of it, newest first; names and faces come from the round
 * row, then readMemberFaces. Business-actor posts count as activity but not
 * as a member.
 */
export function groupActivity(rows: PlayedRoundRow[], posts: PlayedPostRow[] = [], reviews: PlayedReviewRow[] = [], faces: MemberFaces = new Map()): CourseGroup[] {
  const items: Item[] = [];
  for (const r of rows) if (r.course_id) items.push({ courseId: r.course_id, userId: r.user_id, at: r.play_date, key: `round:${r.whs_score_id}`, round: r });
  for (const p of posts) for (const id of postCourseIds(p)) items.push({ courseId: id, userId: p.actor_type === 'business' ? null : p.user_id, at: p.created_at, key: `post:${p.id}`, post: true });
  for (const r of reviews) if (r.course_id) items.push({ courseId: r.course_id, userId: r.user_id, at: r.created_at, key: `review:${r.id}`, review: r });
  items.sort((a, b) => b.at.localeCompare(a.at) || b.key.localeCompare(a.key));
  const map = new Map<string, CourseGroup>();
  for (const it of items) {
    let g = map.get(it.courseId);
    if (!g) { g = { courseId: it.courseId, activity: 0, latestDate: it.at, latestKey: it.key, rows: [], reviews: [], posts: 0, faces: [], best: null }; map.set(it.courseId, g); }
    g.activity += 1;
    const face = it.userId ? faces.get(it.userId) : undefined;
    const name = it.round?.display_name || face?.displayName || face?.username || null;
    if (it.round) {
      const r = it.round;
      g.rows.push(r.display_name ? r : { ...r, display_name: name, profile_photo_url: r.profile_photo_url ?? face?.photoUrl ?? null });
      if (r.gross_score != null && (g.best == null || r.gross_score < g.best)) g.best = r.gross_score;
    } else if (it.review) g.reviews.push(it.review);
    else g.posts += 1;
    if (it.userId && !g.faces.some((f) => f.userId === it.userId)) g.faces.push({ userId: it.userId, photo: it.round?.profile_photo_url ?? face?.photoUrl ?? null, name });
  }
  return orderRings([...map.values()]);
}
/** Rounds only (kept for callers and tests that group rounds alone). */
export const groupRounds = (rows: PlayedRoundRow[]) => groupActivity(rows);

export function WhoPlayingSection() {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const userId = user?.id;
  const played = usePlayedRounds(userId);
  const courseMap = played.courses.data as Map<string, PlayedCourse> | undefined;
  const postRows = played.posts?.data as PlayedPostRow[] | undefined;
  const reviewRows = played.reviews?.data as PlayedReviewRow[] | undefined;
  const faceMap = played.faces?.data as MemberFacesMap | undefined;
  const groups = useMemo(
    () => groupActivity((played.rounds.data ?? []) as PlayedRoundRow[], postRows ?? [], reviewRows ?? [], faceMap ?? NO_FACES).filter((g) => !courseMap || courseMap.has(g.courseId)),
    [played.rounds.data, postRows, reviewRows, faceMap, courseMap],
  );
  const courses = useMemo(() => groups.map((g) => courseMap?.get(g.courseId)).filter((c): c is PlayedCourse => !!c), [groups, courseMap]);
  const tabs = useMemo(() => buildAreaTabs(courses, played.home), [courses, played.home]);
  const [tabId, setTabId] = useState<string | null>(null);
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0] ?? null;
  const ringGroups = useMemo(() => (tab ? groups.filter((g) => tab.courseIds.includes(g.courseId)) : []), [groups, tab]);
  const [selected, setSelected] = useState<string | null>(null);
  const current = ringGroups.find((g) => g.courseId === selected) ?? ringGroups[0] ?? null;
  const [seen, setSeen] = useState<SeenMap | null>(() => readSeen(userId));
  useEffect(() => { setSeen(readSeen(userId)); }, [userId]);

  // §2 (BRIEF_WHATS_BEEN_PLAYED_FIXES): the ring whose tile is showing counts as
  // seen. One owner writes it — the default on load, the default after a tab
  // change and a tap all land here — once per change of selection. The selected
  // ring still draws as selected; it reads as seen as soon as another is picked.
  const seenWritten = useRef<string | null>(null);
  useEffect(() => {
    if (!current || !userId) return;
    const stamp = `${userId}|${current.courseId}:${current.latestKey}`;
    if (seenWritten.current === stamp) return;
    seenWritten.current = stamp;
    // Build from storage, not state: on the render where userId changes the
    // state can still hold the previous key's map (the read effect has not
    // landed yet), and merging that would overwrite the new member's history.
    const next = { ...(readSeen(userId) ?? {}), [current.courseId]: current.latestKey };
    setSeen(next);
    writeSeen(userId, next);
  }, [current, userId]);

  // §6: rails hold every active course outside the FIRST tab only.
  const tabIds = useMemo(() => new Set(tabs[0]?.courseIds ?? []), [tabs]);
  const rails = useMemo(() => buildRails(courses, groups, tabIds, played.home), [courses, groups, tabIds, played.home]);
  const tile = usePlayedTile(current?.courseId ?? null, userId);

  const opt = (q: Parameters<typeof settled>[0] | undefined) => !q || settled(q);
  const roundsReady = settled(played.rounds) && opt(played.posts) && opt(played.reviews)
    && (played.ids.length === 0 || settled(played.courses))
    && (!played.memberIds?.length || opt(played.faces));
  const firstReady = !sessionLoading && (!user || (roundsReady && played.homeReady && (!current || tile.ready)));
  // Latched: after the first ready the section never returns to the shell;
  // later selections re-render in place and only the photo row waits.
  const everReady = useRef(false);
  if (firstReady) everReady.current = true;
  const ready = everReady.current;
  useSectionReady('whoPlaying', ready);

  if (!ready) return <WhoPlayingShell />;
  if (!user || groups.length === 0 || !tab) return null;

  const select = (g: CourseGroup) => { setSelected(g.courseId); };

  return (
    <section data-whats-been-played="" style={{ padding: '20px 0 14px', overflow: 'hidden' }}>
      <PlayedHead kicker="RECENTLY" title="What's been played" />
      <RailChips
        size="tile"
        ariaLabel="Choose area"
        options={tabs.map((t) => ({ id: t.id, label: t.label }))}
        value={tab.id}
        onChange={(id) => { setTabId(id); setSelected(null); }}
        style={{ marginTop: TABS_TOP, padding: '0 16px' }}
      />
      <div className="scrollbar-hide" data-played-rings="" style={{ display: 'flex', alignItems: 'flex-start', gap: RING_GAP, overflowX: 'auto', scrollbarWidth: 'none', marginTop: RING_ROW_TOP, padding: `${RING_ROW_PAD_TOP}px 16px 2px` }}>
        {ringGroups.map((g) => {
          const c = courseMap?.get(g.courseId);
          const { short, variant } = shareCourseName(c?.name ?? '');
          const isSel = current?.courseId === g.courseId;
          const isNew = isNewRing(g, seen);
          const edge = isSel ? A.INK : isNew ? A.AMBER : SEEN_EDGE;
          const badge = isSel ? A.INK : isNew ? A.AMBER : A.MUTE;
          const state = isSel ? 'selected' : isNew ? 'new' : 'seen';
          return (
            <button key={g.courseId} type="button" data-played-ring={state} aria-pressed={isSel} onClick={() => select(g)}
              style={{ flex: 'none', width: RING_ITEM_W, padding: 0, background: 'none', border: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', alignSelf: 'flex-start', textAlign: 'center', cursor: 'pointer', color: A.INK }}>
              <span style={{ position: 'relative', display: 'block', width: RING_SIZE, height: RING_SIZE, margin: '0 4px', boxSizing: 'border-box', borderRadius: RING_RADIUS, border: `${RING_BORDER}px solid ${edge}` }}>
                <CourseImageFallback courseId={g.courseId} courseName={c?.name} imageUrl={c?.imageUrl} initialsSize={14}
                  style={{ position: 'absolute', inset: RING_INSET, borderRadius: RING_PHOTO_RADIUS, overflow: 'hidden' }} />
                <span data-ring-count="" style={{ position: 'absolute', top: -7, right: -7, zIndex: 2, minWidth: 20, height: 18, padding: '0 5px', boxSizing: 'border-box', borderRadius: BADGE_RADIUS, background: A.CANVAS, border: `1.5px solid ${edge}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: badge }}>
                  {fmtCount(g.activity)}
                </span>
              </span>
              <span style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', marginTop: RING_LABEL_GAP, fontSize: 10.5, fontWeight: 600, lineHeight: `${RING_LABEL_LINE}px`, color: state === 'seen' ? A.MUTE : A.INK, overflowWrap: 'anywhere' }}>{short}</span>
              {variant ? <span style={{ display: 'block', marginTop: 1, fontSize: 9.5, fontWeight: 600, lineHeight: `${RING_VARIANT_LINE}px`, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{variant}</span> : null}
            </button>
          );
        })}
      </div>
      {current && courseMap?.get(current.courseId) ? (
        <PlayedTile group={current} course={courseMap.get(current.courseId) as PlayedCourse} tile={tile} faces={faceMap ?? NO_FACES} />
      ) : null}
      <RegionRails rails={rails} groups={groups} courseMap={courseMap} />
    </section>
  );
}
