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

const CourseLocationPills: React.FC<CourseLocationPillsProps> = ({ course }) => {
  const navigate = useNavigate();

  // Derive region / subregion / area for the current course
  const primaryRegionKey: PrimaryRegionKey = 
    (course.sub_country ? getRegionFromSubregion(course.sub_country) : null) ||
    dbValueToRegionKey(course.region || course.country);

  const primaryRegionLabel =
    PRIMARY_REGION_LABELS[primaryRegionKey] || course.region || course.country;

  const subCountryLabel: string | null = course.sub_country || null;
  const localAreaLabel: string | null = course.local_area || null;

  // Normalised keys for URLs
  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  if (!primaryRegionLabel) return null;

  return (
    <div className="px-4 pt-4 pb-2 bg-slate-100">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {/* Level 1 – Primary region */}
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams({
              tab: 'explore',
              region: primaryRegionKey,
            });
            navigate(`/courses?${params.toString()}`);
          }}
          className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-border/60 hover:bg-surface-card transition-colors"
        >
          {primaryRegionLabel}
        </button>

        {/* → separator & Level 2 – Sub-country */}
        {subCountryLabel && (
          <>
            <span className="text-muted-foreground/50">›</span>
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
              className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-border/60 hover:bg-surface-card transition-colors"
            >
              {subCountryLabel}
            </button>
          </>
        )}

        {/* → separator & Level 3 – Local area / county / state */}
        {localAreaLabel && (
          <>
            <span className="text-muted-foreground/50">›</span>
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
              className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-border/60 hover:bg-surface-card transition-colors"
            >
              {localAreaLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseLocationPills;
