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
import { buildAreaTabs, buildRails, isNewRing, orderRings, readSeen, writeSeen, UKI_GROUPING, type RingGroup, type SeenMap } from './playedRings';
import { usePlayedRounds, type PlayedCourse, type PlayedRoundRow } from './usePlayedRounds';
import { usePlayedTile } from './usePlayedTile';
import { useRailTopUps } from './useRailTopUps';
import { PlayedHead, GLASS, type Face } from './playedParts';
import { PlayedTile } from './PlayedTile';
import { RegionRails } from './RegionRails';

/**
 * SECTION 01 — WHAT'S BEEN PLAYED (BRIEF_WHATS_BEEN_PLAYED, three signed-off
 * mocks). Area tabs for the member's own patch, course rings busiest first,
 * the selected ring's tile, then region rails for every other played course.
 * Reads: usePlayedRounds (rounds, course geography, home), usePlayedTile (the
 * selected course's photos), useRailTopUps. All of them gate 'whoPlaying'.
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
export const RING_ROW_PAD_TOP = 4;
export const RING_LABEL_GAP = 9;
export const RING_LABEL_LINE = 13;
export const RING_VARIANT_LINE = 12;
export const BADGE_RADIUS = 6;
export const TABS_TOP = 12;
export const TAB_H = 34;
const SEEN_EDGE = 'rgba(255,255,255,.16)';

export interface CourseGroup extends RingGroup { rows: PlayedRoundRow[]; faces: Face[]; best: number | null }

export function groupRounds(rows: PlayedRoundRow[]): CourseGroup[] {
  const sorted = [...rows].sort((a, b) => b.play_date.localeCompare(a.play_date) || b.whs_score_id.localeCompare(a.whs_score_id));
  const map = new Map<string, CourseGroup>();
  for (const r of sorted) {
    if (!r.course_id) continue;
    let g = map.get(r.course_id);
    if (!g) { g = { courseId: r.course_id, rounds: 0, latestDate: r.play_date, latestScoreId: r.whs_score_id, rows: [], faces: [], best: null }; map.set(r.course_id, g); }
    g.rounds += 1;
    g.rows.push(r);
    if (r.gross_score != null && (g.best == null || r.gross_score < g.best)) g.best = r.gross_score;
    if (!g.faces.some((f) => f.userId === r.user_id)) g.faces.push({ userId: r.user_id, photo: r.profile_photo_url, name: r.display_name });
  }
  return orderRings([...map.values()]);
}

export function WhoPlayingSection() {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const userId = user?.id;
  const played = usePlayedRounds(userId);
  const courseMap = played.courses.data as Map<string, PlayedCourse> | undefined;
  const groups = useMemo(() => groupRounds((played.rounds.data ?? []) as PlayedRoundRow[]).filter((g) => !courseMap || courseMap.has(g.courseId)), [played.rounds.data, courseMap]);
  const courses = useMemo(() => groups.map((g) => courseMap?.get(g.courseId)).filter((c): c is PlayedCourse => !!c), [groups, courseMap]);
  const roundsByCourse = useMemo(() => new Map(groups.map((g) => [g.courseId, g.rounds])), [groups]);
  const tabs = useMemo(() => buildAreaTabs(courses, played.home, roundsByCourse), [courses, played.home, roundsByCourse]);
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
    if (!current) return;
    const stamp = `${userId}|${current.courseId}:${current.latestScoreId}`;
    if (seenWritten.current === stamp) return;
    seenWritten.current = stamp;
    const next = { ...(seen ?? {}), [current.courseId]: current.latestScoreId };
    setSeen(next);
    writeSeen(userId, next);
  }, [current, seen, userId]);

  const tabIds = useMemo(() => new Set(tabs.flatMap((t) => t.courseIds)), [tabs]);
  const rails = useMemo(() => buildRails(courses, groups, tabIds, played.home), [courses, groups, tabIds, played.home]);
  const grouping = played.home?.country ?? UKI_GROUPING;
  const topUps = useRailTopUps(rails, grouping, userId);
  const tile = usePlayedTile(current?.courseId ?? null, userId);

  const roundsReady = settled(played.rounds) && (played.ids.length === 0 || settled(played.courses));
  const firstReady = !sessionLoading && (!user || (roundsReady && played.homeReady && (!current || tile.ready) && topUps.ready));
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
      <div className="scrollbar-hide" data-played-rings="" style={{ display: 'flex', gap: RING_GAP, overflowX: 'auto', scrollbarWidth: 'none', marginTop: RING_ROW_TOP, padding: `${RING_ROW_PAD_TOP}px 16px 2px` }}>
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
              style={{ flex: 'none', width: RING_ITEM_W, padding: 0, background: 'none', border: 0, textAlign: 'center', cursor: 'pointer', color: A.INK }}>
              <span style={{ position: 'relative', display: 'block', width: RING_SIZE, height: RING_SIZE, margin: '0 4px', boxSizing: 'border-box', borderRadius: RING_RADIUS, border: `${RING_BORDER}px solid ${edge}` }}>
                <CourseImageFallback courseId={g.courseId} courseName={c?.name} imageUrl={c?.imageUrl} initialsSize={14}
                  style={{ position: 'absolute', inset: RING_INSET, borderRadius: RING_PHOTO_RADIUS, overflow: 'hidden' }}>
                  <span data-ring-count="" style={{ ...GLASS, position: 'absolute', top: 5, right: 5, minWidth: 20, height: 17, padding: '0 5px', boxSizing: 'border-box', borderRadius: BADGE_RADIUS, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: badge }}>
                    {fmtCount(g.rounds)}
                  </span>
                </CourseImageFallback>
              </span>
              <span style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', marginTop: RING_LABEL_GAP, fontSize: 10.5, fontWeight: 600, lineHeight: `${RING_LABEL_LINE}px`, color: state === 'seen' ? A.MUTE : A.INK, overflowWrap: 'anywhere' }}>{short}</span>
              {variant ? <span style={{ display: 'block', marginTop: 1, fontSize: 9.5, fontWeight: 600, lineHeight: `${RING_VARIANT_LINE}px`, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{variant}</span> : null}
            </button>
          );
        })}
      </div>
      {current && courseMap?.get(current.courseId) ? (
        <PlayedTile group={current} course={courseMap.get(current.courseId) as PlayedCourse} home={played.home} tile={tile} />
      ) : null}
      <RegionRails rails={rails} groups={groups} courseMap={courseMap} topUps={topUps.byRail} tabIds={tabIds} />
    </section>
  );
}
