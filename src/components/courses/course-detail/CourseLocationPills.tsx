import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PRIMARY_REGION_LABELS,
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
  local_area?: string;
}

interface CourseLocationPillsProps {
  course: Course;
}

const pillStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#64748B',
  background: '#ffffff',
  border: '1px solid rgba(15,23,42,0.08)',
  borderRadius: 20,
  padding: '3px 10px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
};

const sepStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#CBD5E1',
};

const CourseLocationPills: React.FC<CourseLocationPillsProps> = ({ course }) => {
  const navigate = useNavigate();

  const primaryRegionKey: PrimaryRegionKey =
    (course.sub_country ? getRegionFromSubregion(course.sub_country) : null) ||
    dbValueToRegionKey(course.region || course.country);

  const primaryRegionLabel =
    PRIMARY_REGION_LABELS[primaryRegionKey] || course.region || course.country;

  const subCountryLabel: string | null = course.sub_country || null;
  const localAreaLabel: string | null = course.local_area || null;

  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  if (!primaryRegionLabel) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: '14px 16px 0' }}>
      <button
        type="button"
        onClick={() => {
          const params = new URLSearchParams({ tab: 'explore', region: primaryRegionKey });
          navigate(`/courses?${params.toString()}`);
        }}
        style={pillStyle}
      >
        {primaryRegionLabel}
      </button>

      {subCountryLabel && (
        <>
          <span style={sepStyle}>›</span>
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
            style={pillStyle}
          >
            {subCountryLabel}
          </button>
        </>
      )}

      {localAreaLabel && (
        <>
          <span style={sepStyle}>›</span>
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams({
                tab: 'explore',
                region: primaryRegionKey,
                ...(subKey ? { sub: subKey } : {}),
                query: localAreaLabel,
              });
              navigate(`/courses?${params.toString()}`);
            }}
            style={pillStyle}
          >
            {localAreaLabel}
          </button>
        </>
      )}
    </div>
  );
};

export default CourseLocationPills;
