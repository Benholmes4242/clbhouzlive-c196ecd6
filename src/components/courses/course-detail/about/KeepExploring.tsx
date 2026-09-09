/**
 * BRIEF_COURSE_TAB_REBUILD §3.11 — KEEP EXPLORING, flat.
 *
 * The last section: navigation away from this course. Same three destinations
 * and the same routing as CourseActionRows built them — more courses nearby,
 * the Top 100 list this course belongs to (a navigation link, NOT this course's
 * own standing, which lives in the hero), and the official website behind the
 * external-link sheet.
 *
 * Navigation rows carry a right chevron. The website opens a confirmation
 * sheet, so it carries a down chevron; the claim sheet carries none.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import {
  dbValueToRegionKey,
  normalizeLabel,
  getRegionFromSubregion,
  type PrimaryRegionKey,
} from '@/constants/courseRegions';
import AboutSection from './AboutSection';

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

const Row: React.FC<{
  label: string;
  meta?: string;
  onClick: () => void;
  muted?: boolean;
  indicator?: 'right' | 'down' | 'none';
}> = ({ label, meta, onClick, muted = false, indicator = 'right' }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      minHeight: 44,
      padding: '12px 0',
      border: 'none',
      borderBottom: `1px solid ${A.HAIRLINE}`,
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: SANS,
    }}
  >
    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: muted ? A.MUTE : A.INK }}>
      {label}
    </span>
    {meta && <span style={{ fontSize: 13, color: muted ? A.MUTE : A.DIM }}>{meta}</span>}
    {indicator !== 'none' && (
      <span style={{ fontSize: 13, color: A.DIM }} aria-hidden="true">
        {indicator === 'down' ? '\u2304' : '\u203A'}
      </span>
    )}
  </button>
);

interface Props {
  course: Course;
  /** Opens the external-link confirmation sheet for the official website. */
  onWebsiteClick?: () => void;
  /** Opens the existing claim sheet; omitted for claimed or pending courses. */
  onClaimClick?: () => void;
}

const KeepExploring: React.FC<Props> = ({ course, onWebsiteClick, onClaimClick }) => {
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

  const rows: {
    key: string;
    label: string;
    meta?: string;
    onClick: () => void;
    indicator?: 'right' | 'down' | 'none';
  }[] = [];

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
      indicator: 'down',
    });
  }

  if (onClaimClick) {
    rows.push({
      key: 'claim',
      label: t('courseDetail.claim.cta.title'),
      meta: t('courseDetail.claim.cta.action'),
      onClick: onClaimClick,
      indicator: 'none',
    });
  }

  if (rows.length === 0) return null;

  /* No heading in the signed-off mock: a rule, then the rows. The section is
     the last thing on the tab and every row names its own destination. */
  return (
    <AboutSection>
      <div style={{ display: 'grid', borderTop: `1px solid ${A.HAIRLINE}`, paddingTop: 4 }}>
        {rows.map((r) => (
          <Row
            key={r.key}
            label={r.label}
            meta={r.meta}
            onClick={r.onClick}
            muted={r.key === 'claim'}
            indicator={r.indicator}
          />
        ))}
      </div>
    </AboutSection>
  );
};

export default KeepExploring;
