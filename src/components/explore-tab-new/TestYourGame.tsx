import { memo, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { useNotableDifficultCourses, type DifficultCourse } from '@/hooks/gam/useNotableDifficultCourses';
import { ExploreSectionHeader } from './ExploreSectionHeader';
import { AMBER, INK } from '@/features/courses/_shared/tokens';

const BURNT_ORANGE = '#C2410C';

function DifficultCard({ course }: { course: DifficultCourse }) {
  const navigate = useNavigate();
  const over = course.avg_over_par;
  const overStr = over >= 0 ? `+${over}` : `${over}`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/courses/${course.course_id}?tab=holes`)}
      className="shrink-0 text-left focus:outline-none active:scale-[0.98] transition-transform"
      style={{ width: 250 }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#E2E8F0',
        }}
      >
        {course.thumbnail_image ? (
          <img
            src={course.thumbnail_image}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute', top: 10, left: 10,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 9px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.28)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <Flag size={11} color={AMBER} style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            color: '#fff', textTransform: 'uppercase',
          }}>
            Official hole data
          </span>
        </div>
      </div>

      <div style={{ paddingTop: 10 }}>
        <p
          style={{
            fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1.25,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {course.course_name}
        </p>
        <p
          style={{
            marginTop: 6,
            fontSize: 15, fontWeight: 900, color: BURNT_ORANGE,
            letterSpacing: '-0.01em', lineHeight: 1.15,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Plays {overStr} over par
        </p>
        {course.hardest_hole_no != null && course.hardest_hole_par != null && (
          <p
            style={{
              marginTop: 4,
              fontSize: 11, fontWeight: 600, color: '#475569', lineHeight: 1.35,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Hardest: H{course.hardest_hole_no} · par {course.hardest_hole_par}
            {course.hardest_hole_si != null ? ` · SI ${course.hardest_hole_si}` : ''}
          </p>
        )}
        <p
          style={{
            marginTop: 3,
            fontSize: 10, fontWeight: 600, color: '#94A3B8',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {course.total_rounds.toLocaleString()} rounds analysed
        </p>
      </div>
    </button>
  );
}

function TestYourGameInner() {
  const { data: courses, isLoading } = useNotableDifficultCourses();

  // One random seed per mount -> cards stay stable during this visit, but a fresh
  // visit (remount) re-picks 3 at random from the qualifying pool. De-duped by
  // course id (RPC already returns one row per course; this is insurance).
  const seedRef = useRef(Math.random());
  const picks = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    const seen = new Set<string>();
    const unique: DifficultCourse[] = [];
    for (const c of courses) {
      if (seen.has(c.course_id)) continue;
      seen.add(c.course_id);
      unique.push(c);
    }
    let s = Math.floor(seedRef.current * 2 ** 32) || 1;
    const rand = () => {
      s |= 0;
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const arr = unique.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 3);
  }, [courses]);

  if (isLoading) return null;
  if (picks.length === 0) return null;

  return (
    <section>
      <ExploreSectionHeader
        title="Courses that bite"
        icon={Flag}
        sub="How hard they really play — from member rounds"
      />
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide"
        style={{ padding: '0 16px 4px', willChange: 'transform' }}
      >
        {picks.map(c => <DifficultCard key={c.course_id} course={c} />)}
      </div>
    </section>
  );
}

export const TestYourGame = memo(TestYourGameInner);
