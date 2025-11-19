import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  PRIMARY_REGION_LABELS,
  dbValueToRegionKey,
  normalizeLabel,
  primaryRegionKeyToTop100Slug,
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

interface CourseLocationBreadcrumbProps {
  course: Course;
}

const CourseLocationBreadcrumb: React.FC<CourseLocationBreadcrumbProps> = ({ course }) => {
  const navigate = useNavigate();

  // Derive region / subregion / area for the current course
  const primaryRegionKey: PrimaryRegionKey = dbValueToRegionKey(
    course.region || course.country
  );

  const primaryRegionLabel =
    PRIMARY_REGION_LABELS[primaryRegionKey] || course.region || course.country;

  const subCountryLabel: string | null = course.sub_country || null;
  const localAreaLabel: string | null = course.local_area || null;

  // Normalised keys for URLs
  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  return (
    <div className="space-y-4">
      {/* Location breadcrumb */}
      {primaryRegionLabel && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
            className="inline-flex items-center px-3 py-1 rounded-full bg-surface-alt border border-border/60 hover:bg-surface-card transition-colors"
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
                className="inline-flex items-center px-3 py-1 rounded-full bg-surface-alt border border-border/60 hover:bg-surface-card transition-colors"
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
                className="inline-flex items-center px-3 py-1 rounded-full bg-surface-alt border border-border/60 hover:bg-surface-card transition-colors"
              >
                {localAreaLabel}
              </button>
            </>
          )}
        </div>
      )}

      {/* Quick filters from this course's location */}
      <section className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-2 text-xs font-medium text-muted-foreground tracking-wide uppercase">
          Explore more from here
        </div>
        
        <div className="divide-y divide-border/60">
          {/* Sub-country filter */}
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
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-alt transition-colors"
            >
              <span>
                See more courses in <span className="font-semibold">{subCountryLabel}</span>
              </span>
              <span className="text-muted-foreground">›</span>
            </button>
          )}

          {/* Primary region Top 100 */}
          <button
            type="button"
            onClick={() => {
              const top100Slug = primaryRegionKeyToTop100Slug(primaryRegionKey);
              const params = new URLSearchParams({
                tab: 'top-100',
                ...(top100Slug ? { list: top100Slug } : {}),
              });
              navigate(`/courses?${params.toString()}`);
            }}
            className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-surface-alt transition-colors"
          >
            <span>
              See Top 100 in <span className="font-semibold">{primaryRegionLabel}</span>
            </span>
            <span className="text-muted-foreground">›</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default CourseLocationBreadcrumb;
