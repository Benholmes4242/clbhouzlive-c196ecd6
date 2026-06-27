import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useUserHomeClubCourses } from '@/hooks/gam/useUserHomeClubCourses';
import type { LegendCategory } from '@/lib/gam/types';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { Skeleton, EmptyStub } from '../../../../gam/_shared/GamAtoms';
import SectionHeader from '@/components/ui/SectionHeader';
import CourseLegendsCard from '../CourseLegendsCard';
import type { CourseSelection } from '../types';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const GOLD = '#FBBC2E';
const GOLD_TINT = 'rgba(251,188,46,0.12)';

const DiscoveryFramingCard: React.FC<{ onTap: () => void }> = ({ onTap }) => (
  <div
    onClick={onTap}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTap();
      }
    }}
    style={{
      margin: '0 16px 16px',
      padding: 18,
      borderRadius: 14,
      background: `linear-gradient(135deg, ${GOLD_TINT} 0%, var(--hcp-bg-1) 70%)`,
      border: '1px solid rgba(251,188,46,0.25)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      fontFamily: FONT,
    }}
  >
    <div
      aria-hidden
      style={{
        position: 'absolute',
        right: -22,
        bottom: -28,
        opacity: 0.13,
        color: GOLD,
        transform: 'rotate(-8deg)',
        pointerEvents: 'none',
      }}
    >
      <Crown size={130} strokeWidth={1.4} />
    </div>

    <div style={{ position: 'relative', zIndex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 800,
          color: GOLD,
          letterSpacing: '0.16em',
          marginBottom: 8,
        }}
      >
        <Crown size={11} strokeWidth={2.4} />
        DISCOVER COURSE LEGENDS
      </div>

      <div
        style={{
          fontSize: 17,
          fontWeight: 900,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          marginBottom: 6,
        }}
      >
        See who holds records at world-class courses
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: 'var(--hcp-t-60)',
          lineHeight: 1.45,
          marginBottom: 14,
        }}
      >
        Play your way onto the leaderboard.
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 999,
          background: GOLD,
          color: '#1A1300',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Browse top 100 →
      </div>
    </div>
  </div>
);

interface Props {
  userId: string;
  holdersByCourse: Map<string, Map<LegendCategory, CourseLegendHolderRow>>;
  onSelectCourse: (c: CourseSelection) => void;
  friendName?: string | null;
}

export const HomeClubSubsection: React.FC<Props> = ({
  userId,
  holdersByCourse,
  onSelectCourse,
  friendName,
}) => {
  const navigate = useNavigate();
  const query = useUserHomeClubCourses(userId);
  const courses = query.data ?? [];
  const homeClubName = courses[0]?.home_club_name ?? null;

  if (query.isLoading) {
    return (
      <>
        <div style={{ marginTop: 24 }}><SectionHeader tier="standard" kicker="HOME CLUB" paddingX={16} /></div>
        <div style={{ padding: '0 16px' }}>
          <Skeleton height={220} radius={14} />
        </div>
      </>
    );
  }

  // Brand-new user: no home club set and no rounds — show discovery framing.
  if (!homeClubName && courses.length === 0) {
    return <DiscoveryFramingCard onTap={() => navigate('/courses?tab=top100')} />;
  }

  // Data integrity: home club set but no matching courses — keep the stub.
  if (homeClubName && courses.length === 0) {
    return (
      <>
        <div style={{ marginTop: 24 }}><SectionHeader tier="standard" kicker={`HOME CLUB · ${homeClubName.toUpperCase()}`} paddingX={16} /></div>
        <div style={{ padding: '0 16px' }}>
          <EmptyStub
            title="Courses not found"
            body={`We couldn't match courses for "${homeClubName}" — try searching below.`}
          />
        </div>
      </>
    );
  }

  const populatedCourses = courses.filter(
    (c) => (holdersByCourse.get(c.course_id)?.size ?? 0) > 0,
  );

  // Hide entire subsection when home club courses exist but none populated in active window.
  if (courses.length > 0 && populatedCourses.length === 0) {
    return null;
  }

  return (
    <>
      <div style={{ marginTop: 24 }}><SectionHeader tier="standard" kicker={`HOME CLUB · ${(homeClubName || '').toUpperCase()}`} paddingX={16} /></div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {populatedCourses.map((c) => (
          <CourseLegendsCard
            key={c.course_id}
            courseId={c.course_id}
            courseName={c.course_name}
            courseType={c.course_type}
            courseRegion={c.course_region}
            courseCountry={c.course_country}
            courseHeaderImage={c.course_header_image ?? null}
            holdersByCategory={holdersByCourse.get(c.course_id) ?? new Map()}
            friendName={friendName}
            onTap={() =>
              onSelectCourse({
                courseId: c.course_id,
                courseName: c.course_name,
                courseRegion: c.course_region,
                courseCountry: c.course_country,
                courseType: c.course_type,
              })
            }
          />
        ))}
      </div>
    </>
  );
};

export default HomeClubSubsection;
