import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  PRIMARY_REGION_LABELS,
  dbValueToRegionKey,
  normalizeLabel,
  primaryRegionKeyToTop100Slug,
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
  course_top100_memberships?: Array<{
    list_id: string;
    top100_lists: {
      slug: string;
      name: string;
    } | null;
  }>;
}

interface CourseLocationBreadcrumbProps {
  course: Course;
}

const CourseLocationBreadcrumb: React.FC<CourseLocationBreadcrumbProps> = ({ course }) => {
  const navigate = useNavigate();

  // Derive region / subregion / area for the current course
  // Prefer deriving from sub_country if available (more reliable)
  const primaryRegionKey: PrimaryRegionKey = 
    (course.sub_country ? getRegionFromSubregion(course.sub_country) : null) ||
    dbValueToRegionKey(course.region || course.country);

  const primaryRegionLabel =
    PRIMARY_REGION_LABELS[primaryRegionKey] || course.region || course.country;

  const subCountryLabel: string | null = course.sub_country || null;
  const localAreaLabel: string | null = course.local_area || null;

  // Normalised keys for URLs
  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  // Derive primary Top 100 list for the CTA
  const membership = course.course_top100_memberships?.[0];
  const primaryListSlug = membership?.top100_lists?.slug ?? 'global-top-100';
  const primaryListName = membership?.top100_lists?.name ?? 'Worldwide';

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
          {/* Sub-country filter - TEMPORARILY DISABLED */}
          {subCountryLabel && (
            <div className="w-full flex items-center justify-between px-4 py-3 text-sm opacity-50 cursor-not-allowed">
              <span>
                See more courses in <span className="font-semibold">{subCountryLabel}</span>
              </span>
              <span className="text-muted-foreground">›</span>
            </div>
          )}

          {/* List-specific Top 100 - TEMPORARILY DISABLED */}
          <div className="w-full flex items-center justify-between px-4 py-3 text-sm opacity-50 cursor-not-allowed">
            <span>
              See Top 100 in <span className="font-semibold">{primaryListName}</span>
            </span>
            <span className="text-muted-foreground">›</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseLocationBreadcrumb;
