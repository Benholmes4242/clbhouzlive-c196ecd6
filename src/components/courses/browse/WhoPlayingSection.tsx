import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { relativeDay } from '@/components/explore-tab-new/courseled/discoverWhen';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { GLASS_CHIP_CLASS } from '@/styles/glassChip';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { joinNames, plural, RAIL_BLEED } from './format';

/**
 * SECTION 01 — WHAT'S BEEN PLAYED (BRIEF_COURSES_PAGE_DEVICE_REVISION §3).
 * Clubhouse asks WHO played; this asks WHAT got played. Same rounds hook,
 * grouped client-side: one card per course, most recent first, capped at 10.
 * No RoundShape — it describes a round, and this card's subject is a course.
 */
const CAP = 10;
/** Rounds read before grouping — the hook's own cap, unchanged. */
const ROUND_LIMIT = 24;

interface CourseGroup {
  key: string;
  courseId: string | null;
  courseName: string;
  best: number | null;
  latestDate: string;
  rounds: number;
  members: CircleRoundRow[]; // one row per distinct member, most recent first
}

function firstName(name: string): string {
  const s = (name ?? '').trim();
  return s ? s.split(/\s+/)[0] : 'Golfer';
}

export function WhoPlayingSection() {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const roundsQuery = useCircleLatestRounds(user?.id, { limit: ROUND_LIMIT, allowMultiplePerFriend: true });
  const groups = useMemo(() => {
    const rows = [...(roundsQuery.data ?? [])].sort((a, b) => b.play_date.localeCompare(a.play_date));
    const map = new Map<string, CourseGroup>();
    for (const r of rows) {
      const key = r.course_id ?? `name:${r.course_name ?? r.round_id}`;
      let g = map.get(key);
      if (!g) {
        g = { key, courseId: r.course_id ?? null, courseName: r.course_name ?? '', best: null, latestDate: r.play_date, rounds: 0, members: [] };
        map.set(key, g);
      }
      g.rounds += 1;
      if (r.gross != null && (g.best == null || r.gross < g.best)) g.best = r.gross;
      if (!g.members.some((m) => m.user_id === r.user_id)) g.members.push(r);
    }
    return [...map.values()].slice(0, CAP);
  }, [roundsQuery.data]);
  const courseIds = useMemo(() => groups.map((g) => g.courseId).filter((v): v is string => !!v), [groups]);
  const meta = useCourseCardMeta(courseIds).data;

  if (groups.length === 0) return null;

  return (
    <section style={SECTION_WRAP}>
      <SectionHead
        tone="amber"
        kicker="Recently"
        title="What's been played"
        subline="The courses members have been playing, and what they went round in."
      />
      <div className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: 10, marginTop: HEAD_GAP }}>
        {groups.map((g) => {
          const m = g.courseId ? meta?.get(g.courseId) : undefined;
          const name = m?.name ?? g.courseName;
          const tail = g.rounds === 1 ? relativeDay(g.latestDate, t as never) : plural(g.rounds, 'round', 'rounds');
          const faces = g.members.slice(0, 3);
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => (g.courseId ? navigate(`/courses/${g.courseId}`) : undefined)}
              style={{ width: 300, flex: 'none', background: MEMBER_PANEL, border: `1px solid ${A.BORDER}`, borderRadius: 12, overflow: 'hidden', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <CourseImageFallback courseId={g.courseId} courseName={name} imageUrl={m?.imageUrl} style={{ height: 150, flexShrink: 0 }}>
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
                {m?.region ? (
                  <div style={{ position: 'absolute', left: 12, bottom: 11, fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.74)' }}>{m.region}</div>
                ) : null}
              </CourseImageFallback>
              <div style={{ padding: '10px 12px 11px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span aria-hidden="true" style={{ position: 'relative', flex: 'none', height: 20, width: 19 + (faces.length - 1) * 12 }}>
                  {faces.map((f, i) => (
                    <span key={f.user_id} style={{ position: 'absolute', top: 0, left: i * 12, width: 19, height: 20, borderRadius: '34%', boxShadow: `0 0 0 1.5px ${MEMBER_PANEL}`, zIndex: 3 - i }}>
                      <SquircleAvatar src={f.profile_photo_url} userId={f.user_id} size={19} alt={f.display_name} />
                    </span>
                  ))}
                </span>
                <span style={{ fontSize: 11.5, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                  <span style={{ color: A.BODY, fontWeight: 600 }}>{joinNames(g.members.map((m) => firstName(m.display_name)))}</span>
                  {` \u00B7 ${tail}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
