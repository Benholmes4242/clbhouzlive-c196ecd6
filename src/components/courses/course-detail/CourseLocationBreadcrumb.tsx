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
    <div className="px-4 pt-4 pb-6 bg-slate-100 space-y-6">
      {/* Location breadcrumb */}
      {primaryRegionLabel && (
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
      )}

      {/* Quick filters - Seamless section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Explore More
        </h2>
        
        <div className="space-y-2">
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
              className="w-full flex items-center justify-between px-0 pb-2 text-base group hover:opacity-70 transition-opacity"
            >
              <span>
                Explore more <span className="font-semibold">{subCountryLabel}</span> courses
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          )}

          {/* Divider */}
          <div className="flex justify-center py-0.5">
            <div className="w-[85%] h-[0.7px] bg-border" />
          </div>

          {/* List-specific Top 100 */}
          <button
            type="button"
            onClick={() => {
              // Normalize database list slug to UI-expected format
              const normalizeListSlug = (dbSlug: string): string => {
                const slug = dbSlug.toLowerCase();
                // Check for GB&I variants
                if (slug.includes('gb-i') || slug.includes('britain') || slug.includes('ireland')) return 'gb-i';
                // Check for USA variants
                if (slug.includes('usa') || slug.includes('united-states')) return 'usa';
                // Check for Europe variants
                if (slug.includes('europe')) return 'europe';
                // Check for Rest of World
                if (slug.includes('rest')) return 'rest';
                // Check for Global
                if (slug.includes('global') || slug.includes('world')) return 'global';
                return 'global'; // fallback
              };
              
              const params = new URLSearchParams({
                tab: 'top100',
                list: normalizeListSlug(primaryListSlug),
              });
              navigate(`/courses?${params.toString()}`);
            }}
            className="w-full flex items-center justify-between px-0 pt-2 pb-2 text-base group hover:opacity-70 transition-opacity"
          >
            <span>
              Explore <span className="font-semibold">{primaryListName.includes('Top 100') ? primaryListName : `${primaryListName} Top 100`}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseLocationBreadcrumb;
