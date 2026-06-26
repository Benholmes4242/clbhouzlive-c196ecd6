import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { MountainMark } from './DiscoverMarks';
import { useNotableDifficultCourses, type DifficultCourse } from '@/hooks/gam/useNotableDifficultCourses';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import {
  INK,
  INK_MUTE,
  INK_FAINT,
  HAIRLINE_INK_8,
  INK_TINT_06,
} from '@/features/courses/_shared/tokens';

const MAROON = '#9F1D1D';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const CARD_W = 240;

const numFmt = (n: number | null | undefined, digits = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(digits);

interface Props {
  userId?: string;
}

export function ToughestCoursesStrip(_: Props = {}) {
  const navigate = useNavigate();
  const { data, isLoading } = useNotableDifficultCourses();

  const shown = useMemo<DifficultCourse[]>(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <section style={{ padding: '0 0 0', fontFamily: FONT }}>
        <ExploreSectionHeader
          mark={<MountainMark />}
          title="Toughest courses"
          sub="The hardest courses, based on official WHS round data"
        />
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
          {Array.from({ length: 3 }).map((_v, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flexShrink: 0,
                width: CARD_W,
                height: 238,
                borderRadius: 14,
                background: INK_TINT_06,
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (shown.length < 3) return null;

  return (
    <section style={{ padding: '0 0 0', fontFamily: FONT }}>
      <ExploreSectionHeader
        mark={<MountainMark />}
        title="Toughest courses"
        sub="The hardest courses, based on official WHS round data"
      />
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
        {shown.map((c) => (
          <ToughCourseCard
            key={c.course_id}
            course={c}
            onTap={() =>
              navigate(`/courses/${c.course_id}`, { state: { activeTab: 'holes' } })
            }
          />
        ))}
      </div>
    </section>
  );
}

interface CardProps {
  course: DifficultCourse;
  onTap: () => void;
}

function ToughCourseCard({ course, onTap }: CardProps) {
  const region =
    course.course_region || course.course_country || '';

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:scale-[0.98] transition-transform"
      style={{
        flexShrink: 0,
        width: CARD_W,
        background: '#FFFFFF',
        border: `1px solid ${HAIRLINE_INK_8}`,
        borderTop: `2px solid ${MAROON}`,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {/* Photo identity band */}
      <div style={{ position: 'relative', width: '100%', height: 104, background: INK_TINT_06 }}>
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
        {/* Bottom gradient for legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(15,23,42,0) 40%, rgba(15,23,42,0.78) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Name + region overlay */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 10,
            color: '#FFFFFF',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              textShadow: '0 1px 2px rgba(0,0,0,0.45)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {course.course_name}
          </p>
          {region ? (
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                fontWeight: 500,
                opacity: 0.85,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {region}
            </p>
          ) : null}
        </div>
      </div>

      {/* Data block */}
      <div style={{ padding: '12px 13px 13px', display: 'flex', flexDirection: 'column' }}>
        {/* Hero stat row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  color: MAROON,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                +{numFmt(course.avg_over_par, 1)}
              </p>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: INK_FAINT,
                  lineHeight: 1,
                }}
              >
                strokes over par
              </span>
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                fontWeight: 500,
                color: INK_MUTE,
                lineHeight: 1.3,
              }}
            >
              avg per round · {course.total_rounds ?? '–'} rounds
            </p>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              color: INK_MUTE,
              fontSize: 10.5,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            <Mountain size={12} />
          </div>
        </div>

        {/* Hardest-hole stat row */}
        <div
          style={{
            borderTop: `0.5px solid ${HAIRLINE_INK_8}`,
            marginTop: 12,
            paddingTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: INK_FAINT,
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            HARDEST HOLE
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hole badge */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: INK_TINT_06,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  color: INK_FAINT,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                HOLE
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: INK,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {course.hardest_hole_no ?? '–'}
              </span>
            </div>
            {/* Detail lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              {course.hardest_hole_no != null ? (
                <>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      color: INK,
                      lineHeight: 1.2,
                    }}
                  >
                    Par {course.hardest_hole_par ?? '–'} · Stroke index {course.hardest_hole_si ?? '–'}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 600,
                      color: MAROON,
                      lineHeight: 1.2,
                    }}
                  >
                    plays +{numFmt(course.hardest_avg_to_par, 1)} avg
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default ToughestCoursesStrip;
