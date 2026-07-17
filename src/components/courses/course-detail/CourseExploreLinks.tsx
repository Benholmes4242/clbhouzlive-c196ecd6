import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Trophy } from 'lucide-react';
import { HAIRLINE_INK_7, INK } from '@/features/courses/_shared/tokens';
import { SectionHeader } from '@/components/ui/SectionHeader';

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

const SHORT_LIST_LABELS: Record<string, string> = {
  'gb-i': 'GB&I',
  usa: 'USA',
  europe: 'Europe',
  global: 'World',
  rest: 'Rest of World',
};

const CourseExploreLinks: React.FC<CourseExploreLinksProps> = ({ course }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();

  const primaryRegionKey: PrimaryRegionKey =
    (course.sub_country ? getRegionFromSubregion(course.sub_country) : null) ||
    dbValueToRegionKey(course.region || course.country);

  const subCountryLabel: string | null = course.sub_country || null;
  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  const membership = course.course_top100_memberships?.[0];
  const primaryListSlug = membership?.top100_lists?.slug ?? 'global-top-100';

  const normalizeListSlug = (dbSlug: string): string => {
    const slug = dbSlug.toLowerCase();
    if (slug.includes('gb-i') || slug.includes('britain') || slug.includes('ireland')) return 'gb-i';
    if (slug.includes('usa') || slug.includes('united-states')) return 'usa';
    if (slug.includes('europe')) return 'europe';
    if (slug.includes('rest')) return 'rest';
    if (slug.includes('global') || slug.includes('world')) return 'global';
    return 'global';
  };

  const shortListLabel = SHORT_LIST_LABELS[normalizeListSlug(primaryListSlug)] ?? 'World';

  return (
    <div>
      <SectionHeader role="section" kicker={t('courseDetail.exploreLinks.kicker')} paddingX={16} />
      <div style={{ display: 'flex', gap: 12, padding: '9px 16px 0' }}>
        {subCountryLabel && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams({
                tab: 'explore',
                region: primaryRegionKey,
                sub: subKey || '',
              });
              navigate(`/courses?${params.toString()}`);
            }}
            style={{
              flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer',
              background: '#FFFFFF', border: `1px solid ${HAIRLINE_INK_7}`,
              borderRadius: 16, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 9,
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(247,147,30,0.10)', color: '#F7931E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MapPin size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
                {subCountryLabel}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,23,42,0.55)', marginTop: 2 }}>
                {t('courseDetail.exploreLinks.nearby')}
              </div>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams({
              tab: 'top100',
              list: normalizeListSlug(primaryListSlug),
            });
            navigate(`/courses?${params.toString()}`);
          }}
          style={{
            flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer',
            background: '#FFFFFF', border: `1px solid ${HAIRLINE_INK_7}`,
            borderRadius: 16, padding: 14,
            display: 'flex', flexDirection: 'column', gap: 9,
          }}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'rgba(247,147,30,0.10)', color: '#F7931E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trophy size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.25 }}>
              {t('courseDetail.exploreLinks.top100Suffix', { region: shortListLabel })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(15,23,42,0.55)', marginTop: 2 }}>
              {t('courseDetail.exploreLinks.exploreList')}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default CourseExploreLinks;
