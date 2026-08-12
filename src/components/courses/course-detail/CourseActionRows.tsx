/**
 * CourseActionRows - Block 4d of the Course tab.
 *
 * Collapses what used to be four separate single-row cards (nearby courses,
 * Top 100 list, official website, claim this course) into ONE panel of quiet
 * chevron rows. No icon tiles, no tinted pills, no gradients.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, Panel, SANS } from '@/features/courses/components/holes/analytical/tokens';
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
  website_url?: string | null;
  course_top100_memberships?: Array<{
    list_id: string;
    top100_lists: { slug: string; name: string } | null;
  }>;
}

const SHORT_LIST_LABELS: Record<string, string> = {
  'gb-i': 'GB&I',
  usa: 'USA',
  europe: 'Europe',
  global: 'World',
  rest: 'Rest of World',
};

const normalizeListSlug = (dbSlug: string): string => {
  const slug = dbSlug.toLowerCase();
  if (slug.includes('gb-i') || slug.includes('britain') || slug.includes('ireland')) return 'gb-i';
  if (slug.includes('usa') || slug.includes('united-states')) return 'usa';
  if (slug.includes('europe')) return 'europe';
  if (slug.includes('rest')) return 'rest';
  if (slug.includes('global') || slug.includes('world')) return 'global';
  return 'global';
};

const Row: React.FC<{ label: string; meta?: string; onClick: () => void; last?: boolean }> = ({
  label,
  meta,
  onClick,
  last,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      minHeight: 44,
      padding: last ? '0' : '0 0 2px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: SANS,
    }}
  >
    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: A.INK }}>{label}</span>
    {meta && <span style={{ fontSize: 11.5, color: A.MUTE }}>{meta}</span>}
    <span style={{ fontSize: 13, color: A.DIM, fontWeight: 700 }} aria-hidden="true">
      {'\u203A'}
    </span>
  </button>
);

interface Props {
  course: Course;
  /** Opens the external-link confirmation sheet for the official website. */
  onWebsiteClick?: () => void;
  /** Opens the claim sheet; omitted when the course is claimed or pending. */
  onClaimClick?: () => void;
}

export const CourseActionRows: React.FC<Props> = ({ course, onWebsiteClick, onClaimClick }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();

  const primaryRegionKey: PrimaryRegionKey =
    (course.sub_country ? getRegionFromSubregion(course.sub_country) : null) ||
    dbValueToRegionKey(course.region || course.country);

  const subCountryLabel = course.sub_country || null;
  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  const membership = course.course_top100_memberships?.[0];
  const primaryListSlug = membership?.top100_lists?.slug ?? 'global-top-100';
  const shortListLabel = SHORT_LIST_LABELS[normalizeListSlug(primaryListSlug)] ?? 'World';

  const rows: { key: string; label: string; meta?: string; onClick: () => void }[] = [];

  if (subCountryLabel) {
    rows.push({
      key: 'nearby',
      label: t('courseDetail.exploreLinks.nearby'),
      meta: subCountryLabel,
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

  rows.push({
    key: 'top100',
    label: t('courseDetail.exploreLinks.top100Suffix', { region: shortListLabel }),
    meta: t('courseDetail.exploreLinks.exploreList'),
    onClick: () => {
      const params = new URLSearchParams({
        tab: 'top100',
        list: normalizeListSlug(primaryListSlug),
      });
      navigate(`/courses?${params.toString()}`);
    },
  });

  if (course.website_url && onWebsiteClick) {
    rows.push({
      key: 'website',
      label: t('courseDetail.about.officialWebsite'),
      onClick: onWebsiteClick,
    });
  }

  if (onClaimClick) {
    rows.push({
      key: 'claim',
      label: t('courseDetail.claim.cta.title'),
      meta: t('courseDetail.claim.cta.action'),
      onClick: onClaimClick,
    });
  }

  if (rows.length === 0) return null;

  return (
    <Panel kicker={t('courseDetail.exploreLinks.kicker')} style={{ padding: '16px' }}>
      <div style={{ display: 'grid' }}>
        {rows.map((r, i) => (
          <Row
            key={r.key}
            label={r.label}
            meta={r.meta}
            onClick={r.onClick}
            last={i === rows.length - 1}
          />
        ))}
      </div>
    </Panel>
  );
};

export default CourseActionRows;
