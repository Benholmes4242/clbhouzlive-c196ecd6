import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
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
const CARD_W = 248;

const numFmt = (n: number | null | undefined, digits = 1) =>
  n == null || Number.isNaN(Number(n)) ? '–' : Number(n).toFixed(digits);

interface Props {
  userId?: string;
}

export function ToughestCoursesStrip(_: Props = {}) {
  const navigate = useNavigate();
  const { data, isLoading } = useNotableDifficultCourses();

  const shown = useMemo<DifficultCourse[]>(() => {
    const pool = data ?? [];
    if (pool.length === 0) return [];
    if (pool.length <= 6) return pool;
    const weekSeed = Math.floor(Date.now() / (7 * 864e5));
    const offset = (weekSeed * 6) % pool.length;
    return Array.from({ length: 6 }, (_unused, i) => pool[(offset + i) % pool.length]);
  }, [data]);

  if (isLoading) {
    return (
      <section style={{ fontFamily: FONT }}>
        <ExploreSectionHeader
          kicker="OFFICIAL WHS HANDICAP DATA"
          title="Toughest courses in the network"
        />
        <div
          className="flex overflow-x-auto"
          style={{ padding: '0 16px', gap: 12, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {Array.from({ length: 3 }).map((_v, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flexShrink: 0,
                width: CARD_W,
                height: 268,
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
    <section style={{ fontFamily: FONT }}>
      <ExploreSectionHeader
        kicker="OFFICIAL WHS HANDICAP DATA"
        title="Toughest courses in the network"
      />
      <div
        className="flex overflow-x-auto no-scrollbar"
        style={{
          padding: '0 16px 4px',
          gap: 12,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}
      >
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
        scrollSnapAlign: 'start',
        background: '#FFFFFF',
        border: `1px solid ${HAIRLINE_INK_8}`,
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {/* Hero */}
      <div style={{ position: 'relative', width: '100%', height: 132, background: INK_TINT_06 }}>
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
        {/* avg over par badge */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 4,
            padding: '4px 9px',
            borderRadius: 999,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            fontFeatureSettings: '"tnum" 1, "kern" 1',
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 300,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.01em',
            }}
          >
            +{numFmt(course.avg_over_par, 1)}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.14em',
              opacity: 0.78,
            }}
          >
            AVG
          </span>
        </div>
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

      {/* Hardest hole row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 12px 10px',
        }}
      >
        {/* squircle tile */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14, // ~34% radius
            background: INK,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {course.hardest_hole_no ?? '–'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: MAROON,
              lineHeight: 1,
            }}
          >
            Hardest hole
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 12,
              fontWeight: 600,
              color: INK_MUTE,
              lineHeight: 1.2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Par {course.hardest_hole_par ?? '–'}
            {course.hardest_hole_si != null ? ` · SI ${course.hardest_hole_si}` : ''}
          </p>
        </div>

        <span
          style={{
            fontSize: 20,
            fontWeight: 300,
            color: INK,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          +{numFmt(course.hardest_avg_to_par, 1)}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 12px 12px',
          borderTop: `1px solid ${HAIRLINE_INK_8}`,
          fontSize: 10,
          fontWeight: 600,
          color: INK_FAINT,
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {course.total_rounds.toLocaleString()} rounds analysed
      </div>
    </button>
  );
}

export default ToughestCoursesStrip;
