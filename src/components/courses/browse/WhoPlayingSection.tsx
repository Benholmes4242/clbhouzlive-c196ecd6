import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCircleLatestRounds, type CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { useCourseCardMeta } from '@/components/explore-tab-new/courseled/hooks/useCourseCardMeta';
import { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import { relativeDay } from '@/components/explore-tab-new/courseled/discoverWhen';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { GLASS_CHIP_CLASS } from '@/styles/glassChip';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SectionHead, SECTION_WRAP, HEAD_GAP } from './SectionHead';
import { RAIL_BLEED } from './format';

/**
 * SECTION 01 — WHO'S BEEN PLAYING (BRIEF_COURSES_PAGE_REBUILD §3).
 *
 * BUILT HERE, NOT EXTRACTED: FriendsPlayedRail's card is written inline in its
 * map with reactions, insights and movement wired through it, so it cannot be
 * lifted out without disturbing Discover. This card follows the brief's spec
 * and shares the rail's data hook, image fallback, scrim, glass and RoundShape.
 */
const CAP = 10;
const CARD_W = 214;
/** Taken from FriendsPlayedRail's SHAPE_H: 60 is the smallest height where a
 * two-shot swing is legible. Do NOT reduce it. */
const SHAPE_H = 60;
const BODY_PAD_X = 11;

function toParLabel(r: CircleRoundRow): string | null {
  if (r.gross == null || r.course_par == null) return null;
  const d = r.gross - r.course_par;
  if (d === 0) return 'LEVEL';
  return d > 0 ? `+${d}` : `\u2212${Math.abs(d)}`;
}

export function WhoPlayingSection() {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const roundsQuery = useCircleLatestRounds(user?.id, { limit: CAP, allowMultiplePerFriend: true });
  const rows = useMemo(() => (roundsQuery.data ?? []).slice(0, CAP), [roundsQuery.data]);
  const courseIds = useMemo(
    () => rows.map((r) => r.course_id).filter((v): v is string => !!v),
    [rows],
  );
  const meta = useCourseCardMeta(courseIds).data;
  const shapes = useRoundHoleShapes(useMemo(() => rows.map((r) => r.score_id), [rows]));

  if (rows.length === 0) return null;

  return (
    <section style={SECTION_WRAP}>
      <SectionHead
        n="01"
        tone="amber"
        kicker="This week"
        title="Who's been playing"
        subline="Every card is a real round, posted by a member, with what they went round in."
      />
      <div className="scrollbar-hide" style={{ ...RAIL_BLEED, gap: 10, marginTop: HEAD_GAP }}>
        {rows.map((r) => {
          const m = r.course_id ? meta?.get(r.course_id) : undefined;
          const name = m?.name ?? r.course_name ?? '';
          const shape = shapes?.get(r.score_id ?? '') ?? null;
          const toPar = toParLabel(r);
          return (
            <button
              key={r.round_id}
              type="button"
              onClick={() =>
                r.score_id
                  ? navigate(`/round/${r.score_id}`)
                  : r.course_id
                    ? navigate(`/courses/${r.course_id}`)
                    : undefined
              }
              style={{
                width: CARD_W,
                flex: 'none',
                background: MEMBER_PANEL,
                border: `1px solid ${A.BORDER}`,
                borderRadius: 12,
                overflow: 'hidden',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CourseImageFallback
                courseId={r.course_id}
                courseName={name}
                imageUrl={m?.imageUrl}
                style={{ height: 92, flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
                <span
                  className={GLASS_CHIP_CLASS}
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                  }}
                >
                  {relativeDay(r.play_date, t as never)}
                </span>
                {r.gross != null ? (
                  <span
                    className={GLASS_CHIP_CLASS}
                    style={{
                      position: 'absolute',
                      right: 8,
                      bottom: 8,
                      padding: '4px 9px',
                      borderRadius: 9,
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: '#FFFFFF',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {r.gross}
                    {toPar ? (
                      <small
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          color: 'rgba(255,255,255,0.72)',
                          marginLeft: 4,
                        }}
                      >
                        {toPar}
                      </small>
                    ) : null}
                  </span>
                ) : null}
              </CourseImageFallback>
              <div style={{ padding: `9px ${BODY_PAD_X}px 11px`, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: A.INK,
                    letterSpacing: '-0.012em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {name}
                </div>
                {/* No hole data → no shape block; never a fabricated line. */}
                {shape ? (
                  <div style={{ marginTop: 6 }}>
                    <RoundShape row={r} shape={shape} width={CARD_W - BODY_PAD_X * 2 - 2} height={SHAPE_H} showMeta={false} />
                  </div>
                ) : null}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, minWidth: 0 }}>
                  <SquircleAvatar src={r.profile_photo_url} userId={r.user_id} size={19} alt={r.display_name} />
                  <span
                    style={{
                      fontSize: 11,
                      color: A.DIM,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {r.display_name}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
