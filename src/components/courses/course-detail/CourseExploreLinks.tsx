import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  dbValueToRegionKey,
  normalizeLabel,
  getRegionFromSubregion,
  type PrimaryRegionKey,
} from '@/constants/courseRegions';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  course_top100_memberships?: Array<{
    list_id: string;
    top100_lists: {
      slug: string;
      name: string;
    } | null;
  }>;
}

interface CourseExploreLinksProps {
  course: Course;
}

const CourseExploreLinks: React.FC<CourseExploreLinksProps> = ({ course }) => {
  const navigate = useNavigate();

  const primaryRegionKey: PrimaryRegionKey =
    (course.sub_country ? getRegionFromSubregion(course.sub_country) : null) ||
    dbValueToRegionKey(course.region || course.country);

  const subCountryLabel: string | null = course.sub_country || null;
  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  const membership = course.course_top100_memberships?.[0];
  const primaryListSlug = membership?.top100_lists?.slug ?? 'global-top-100';
  const primaryListName = membership?.top100_lists?.name ?? 'Worldwide';

  const normalizeListSlug = (dbSlug: string): string => {
    const slug = dbSlug.toLowerCase();
    if (slug.includes('gb-i') || slug.includes('britain') || slug.includes('ireland')) return 'gb-i';
    if (slug.includes('usa') || slug.includes('united-states')) return 'usa';
    if (slug.includes('europe')) return 'europe';
    if (slug.includes('rest')) return 'rest';
    if (slug.includes('global') || slug.includes('world')) return 'global';
    return 'global';
  };

  const links: { label: React.ReactNode; onClick: () => void }[] = [];

  if (subCountryLabel) {
    links.push({
      label: (
        <>
          More <span style={{ fontWeight: 700 }}>{subCountryLabel}</span> courses
        </>
      ),
      onClick: () => {
        const params = new URLSearchParams({
          tab: 'explore',
          region: primaryRegionKey,
          sub: subKey || '',
        });
        navigate(`/courses?${params.toString()}`);
      },
    });
  }

  links.push({
    label: (
      <>
        Explore{' '}
        <span style={{ fontWeight: 700 }}>
          {primaryListName.includes('Top 100') ? primaryListName : `${primaryListName} Top 100`}
        </span>
      </>
    ),
    onClick: () => {
      const params = new URLSearchParams({
        tab: 'top100',
        list: normalizeListSlug(primaryListSlug),
      });
      navigate(`/courses?${params.toString()}`);
    },
  });

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', marginBottom: 6 }}>
        <div style={{ width: 3, height: 13, background: '#0F172A', borderRadius: 1 }} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
          }}
        >
          Explore More
        </span>
      </div>

      {links.map((l, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={l.onClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{l.label}</span>
            <span style={{ fontSize: 16, color: '#CBD5E1' }}>›</span>
          </button>
          {i < links.length - 1 && (
            <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.07)', margin: '0 16px' }} />
          )}
        </div>
      ))}
    </div>
  );
};

export default CourseExploreLinks;
