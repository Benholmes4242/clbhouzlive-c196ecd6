import { useEffect, useMemo, useState } from 'react';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { RailChips } from '@/components/ui/RailChips';
import { shareCourseName } from '@/lib/courses/shareCourseName';
import { imageSrc } from '@/utils/imageSrc';
import { buildAreaTabs, isNewRing, orderRings, readSeen, writeSeen, type RingGroup, type SeenMap } from './playedRings';
import { usePlayedRounds, type PlayedCourse, type PlayedRoundRow } from './usePlayedRounds';
import { relativeDay } from '@/components/explore-tab-new/courseled/discoverWhen';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { GLASS_CHIP_CLASS } from '@/styles/glassChip';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { fmtCount, plural } from './format';
import { firstName } from '@/lib/whs/share';
import { settled, useSectionReady } from './PageLoadGate';
import { WhoPlayingShell } from './sectionShells';

/**
 * SECTION 01 — WHAT'S BEEN PLAYED. BRIEF_PLAYED_RINGS_AND_AREA_TABS replaced the
 * course-card rail with Explore-style area tabs and course rings (signed-off
 * rings-v1 mock); the old course card stays, for the selected ring only, until
 * its tile is designed. Rules live in playedRings.ts, reads in usePlayedRounds.ts.
 */
/* Card geometry, read by the card AND the shell (BRIEF_COURSES_SKELETONS 2.3). */
export const WHO_CARD_W = 300;
export const WHO_CARD_RADIUS = 12;
export const WHO_PHOTO_H = 150;
export const WHO_RAIL_GAP = 10;
export const WHO_FOOTER_PAD = { top: 10, x: 12, bottom: 11 } as const;
export const WHO_FACE_H = 20;
/* Ring geometry (mock v1), read by the rings AND the shell. */
export const RING_SIZE = 64;
export const RING_ITEM_W = 72;
export const RING_GAP = 8;
export const RING_RAIL_TOP = 14;
export const RING_RAIL_PAD = '4px 16px 0';
export const TAB_ROW_H = 34;
export const RING_SEEN = 'rgba(255,255,255,0.16)';
export const BADGE_SEEN = '#2A2A30';
export const BADGE_RADIUS = 6;

interface Member { user_id: string; display_name: string | null; profile_photo_url: string | null }
interface CourseGroup extends RingGroup {
  courseName: string;
  best: number | null;
  members: Member[]; // one row per distinct member, most recent first
}

function groupRounds(rows: PlayedRoundRow[]): CourseGroup[] {
  const sorted = [...rows].sort((a, b) => b.play_date.localeCompare(a.play_date));
  const map = new Map<string, CourseGroup>();
  for (const r of sorted) {
    if (!r.course_id) continue;
    let g = map.get(r.course_id);
    if (!g) {
      g = { courseId: r.course_id, courseName: r.course_name ?? '', best: null, latestDate: r.play_date, latestScoreId: r.whs_score_id, rounds: 0, members: [] };
      map.set(r.course_id, g);
    }
    g.rounds += 1;
    if (r.gross_score != null && (g.best == null || r.gross_score < g.best)) g.best = r.gross_score;
    if (!g.members.some((m) => m.user_id === r.user_id)) g.members.push(r);
  }
  return [...map.values()];
}

/** The old rail's course card, unchanged, for the selected course only. */
function WhoCourseCard({ g, meta }: { g: CourseGroup; meta: PlayedCourse | undefined }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const m = meta;
  const name = m?.name ?? g.courseName;
  const place = m ? m.region || m.subCountry || m.country : null;
  const tail = g.rounds === 1 ? relativeDay(g.latestDate, t as never) : plural(g.rounds, 'round', 'rounds');
  const faces = g.members.slice(0, 3);
  return (
            <button
              type="button"
              data-played-card={g.courseId}
              onClick={() => navigate(`/courses/${g.courseId}`)}
              style={{ width: WHO_CARD_W, maxWidth: '100%', flex: 'none', background: MEMBER_PANEL, border: `1px solid ${A.BORDER}`, borderRadius: WHO_CARD_RADIUS, overflow: 'hidden', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <CourseImageFallback courseId={g.courseId} courseName={name} imageUrl={m?.imageUrl} style={{ height: WHO_PHOTO_H, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
                {g.best != null ? (
                  <span className={GLASS_CHIP_CLASS} style={{ position: 'absolute', right: 10, top: 10, padding: '5px 10px', borderRadius: 10, textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: '#FFFFFF', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{g.best}</span>
                    <span style={{ display: 'block', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.72)', textAlign: 'right' }}>BEST</span>
                  </span>
                ) : null}
                <div style={{ position: 'absolute', left: 12, right: 70, bottom: 28, fontSize: 18, fontWeight: 700, letterSpacing: '-0.028em', color: '#FFFFFF', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.55)', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
                  {name}
                </div>
                {place ? (
                  <div style={{ position: 'absolute', left: 12, bottom: 11, fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.74)' }}>{place}</div>
                ) : null}
              </CourseImageFallback>
              <div style={{ padding: `${WHO_FOOTER_PAD.top}px ${WHO_FOOTER_PAD.x}px ${WHO_FOOTER_PAD.bottom}px`, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span aria-hidden="true" style={{ position: 'relative', flex: 'none', height: WHO_FACE_H, width: 19 + (faces.length - 1) * 12 }}>
                  {faces.map((f, i) => (
                    <span key={f.user_id} style={{ position: 'absolute', top: 0, left: i * 12, width: 19, height: 20, borderRadius: '34%', boxShadow: `0 0 0 1.5px ${MEMBER_PANEL}`, zIndex: 3 - i }}>
                      <SquircleAvatar src={f.profile_photo_url} userId={f.user_id} size={19} alt={f.display_name} hairlineRing />
                    </span>
                  ))}
                </span>
                <span style={{ fontSize: 11.5, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                  <span style={{ color: A.BODY, fontWeight: 600 }}>{g.members.slice(0, 2).map((member, i) => <span key={member.user_id}>{i > 0 ? g.members.length > 2 ? ', ' : ' and ' : ''}<InlineProMemberName userId={member.user_id}>{firstName(member.display_name)}</InlineProMemberName></span>)}{g.members.length > 2 ? ` and ${fmtCount(g.members.length - 2)} more` : ''}</span>
                  {` \u00B7 ${tail}`}
                </span>
              </div>
            </button>
  );
}

type RingState = 'new' | 'seen' | 'selected';
const RING_BG: Record<RingState, string> = { new: A.AMBER, seen: RING_SEEN, selected: A.INK };
const BADGE_BG: Record<RingState, string> = { new: A.AMBER, seen: BADGE_SEEN, selected: A.INK };
const BADGE_INK: Record<RingState, string> = { new: A.CANVAS, seen: A.MUTE, selected: A.CANVAS };
const dpr = () => (typeof window !== 'undefined' ? Math.min(3, window.devicePixelRatio || 1) : 1);

export function CourseRing({ g, meta, state, onSelect }: { g: CourseGroup; meta: PlayedCourse | undefined; state: RingState; onSelect: () => void }) {
  const raw = meta?.name ?? g.courseName;
  const { short, variant } = shareCourseName(raw);
  const url = meta?.imageUrl ? imageSrc(meta.imageUrl, Math.round(RING_SIZE * dpr())) : null;
  return (
    <button type="button" data-played-ring={g.courseId} data-ring-state={state} aria-pressed={state === 'selected'} onClick={onSelect}
      style={{ flex: 'none', width: RING_ITEM_W, textAlign: 'center', background: 'none', border: 0, padding: 0, cursor: 'pointer', color: A.INK, minWidth: 0 }}>
      <span data-ring style={{ position: 'relative', display: 'block', width: RING_SIZE, height: RING_SIZE, margin: '0 auto', borderRadius: '34%', padding: 1.5, boxSizing: 'border-box', background: RING_BG[state] }}>
        <CourseImageFallback courseId={g.courseId} courseName={raw} imageUrl={url} initialsSize={14}
          style={{ width: '100%', height: '100%', borderRadius: '32%', border: `2.5px solid ${A.CANVAS}`, boxSizing: 'border-box' }} />
        <span data-ring-badge style={{ position: 'absolute', left: '50%', bottom: -8, transform: 'translateX(-50%)', minWidth: 20, height: 18, padding: '0 5px', boxSizing: 'border-box', borderRadius: BADGE_RADIUS, border: `2px solid ${A.CANVAS}`, background: BADGE_BG[state], color: BADGE_INK[state], fontSize: 9.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{fmtCount(g.rounds)}</span>
      </span>
      <span data-ring-name style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', marginTop: 9, fontSize: 10.5, fontWeight: 600, lineHeight: 1.25, color: state === 'seen' ? A.MUTE : A.INK, overflowWrap: 'anywhere' }}>{short}</span>
      {variant ? <span data-ring-variant style={{ display: 'block', marginTop: 1, fontSize: 9.5, fontWeight: 600, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{variant}</span> : null}
    </button>
  );
}

export function WhoPlayingSection() {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { rounds, courses, ids, home, homeReady } = usePlayedRounds(sessionLoading ? undefined : user?.id);
  const groups = useMemo(() => groupRounds(rounds.data ?? []), [rounds.data]);
  const meta = courses.data;
  const tabs = useMemo(() => {
    const placed = groups.map((g) => meta?.get(g.courseId)).filter((c): c is PlayedCourse => !!c);
    return buildAreaTabs(placed, home);
  }, [groups, meta, home]);
  const [tabId, setTabId] = useState<string | null>(null);
  const [ringId, setRingId] = useState<string | null>(null);
  const [seen, setSeen] = useState<SeenMap | null>(null);
  const uid = user?.id ?? null;
  useEffect(() => { setSeen(readSeen(uid)); }, [uid]);
  const tab = tabs.find((x) => x.id === tabId) ?? tabs[0];
  const rings = useMemo(() => {
    if (!tab) return [];
    const inTab = new Set(tab.courseIds);
    return orderRings(groups.filter((g) => inTab.has(g.courseId)));
  }, [groups, tab]);
  const selected = rings.find((g) => g.courseId === ringId) ?? rings[0];
  /* Selecting a ring, the default included, marks it seen. Storage failures
     leave `seen` null, so every course keeps reading as new. */
  useEffect(() => {
    if (!selected) return;
    const stored = readSeen(uid);
    if (!stored || stored[selected.courseId] === selected.latestScoreId) return;
    const next = { ...stored, [selected.courseId]: selected.latestScoreId };
    writeSeen(uid, next);
    setSeen(readSeen(uid));
  }, [selected, uid]);

  const ready = !sessionLoading && settled(rounds) && (ids.length === 0 || settled(courses)) && homeReady;
  useSectionReady('whoPlaying', ready);
  if (!ready) return <WhoPlayingShell />;
  if (groups.length === 0 || !tab) return null;

  return (
    <section style={SECTION_WRAP} data-played-section>
      <SectionHead tone="amber" kicker="Recently" title="What's been played" />
      <div style={{ marginTop: HEAD_GAP, marginLeft: -16, marginRight: -16 }} data-played-tabs>
        <RailChips options={tabs.map((x) => ({ id: x.id, label: x.label }))} value={tab.id} onChange={(id) => { setTabId(id); setRingId(null); }} ariaLabel="Area" size="tile" style={{ paddingLeft: 16, paddingRight: 16 }} />
      </div>
      <div className="scrollbar-hide" data-played-rings style={{ display: 'flex', overflowX: 'auto', gap: RING_GAP, padding: RING_RAIL_PAD, marginTop: RING_RAIL_TOP, marginLeft: -16, marginRight: -16 }}>
        {rings.map((g) => (
          <CourseRing key={g.courseId} g={g} meta={meta?.get(g.courseId)} onSelect={() => setRingId(g.courseId)}
            state={g === selected ? 'selected' : isNewRing(g, seen) ? 'new' : 'seen'} />
        ))}
      </div>
      {selected ? <div style={{ marginTop: 16 }}><WhoCourseCard key={selected.courseId} g={selected} meta={meta?.get(selected.courseId)} /></div> : null}
    </section>
  );
}

