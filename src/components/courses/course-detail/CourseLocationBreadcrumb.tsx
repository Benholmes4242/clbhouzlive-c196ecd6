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
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
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
            className="inline-flex items-center px-2.5 py-1 rounded-full bg-card border border-border/60 hover:bg-card/80 transition-colors text-muted-foreground"
          >
            {primaryRegionLabel}
          </button>

          {/* → separator & Level 2 – Sub-country */}
          {subCountryLabel && (
            <>
              <ChevronRight className="w-3 h-3 opacity-60 text-muted-foreground" />
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
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-card border border-border/60 hover:bg-card/80 transition-colors text-muted-foreground"
              >
                {subCountryLabel}
              </button>
            </>
          )}

          {/* → separator & Level 3 – Local area / county / state */}
          {localAreaLabel && (
            <>
              <ChevronRight className="w-3 h-3 opacity-60 text-muted-foreground" />
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
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-card border border-border/60 hover:bg-card/80 transition-colors text-muted-foreground"
              >
                {localAreaLabel}
              </button>
            </>
          )}
        </div>
      )}

      {/* Quick filters from this course's location */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-3 flex flex-col gap-2">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          Explore more from here
        </div>

        {/* 1. More courses in this local area / sub-country */}
        {(localAreaLabel || subCountryLabel) && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams({
                tab: 'explore',
                region: primaryRegionKey,
              });

              if (subKey) params.set('sub', subKey);

              if (localAreaLabel) {
                params.set('query', localAreaLabel);
              } else if (subCountryLabel) {
                params.set('query', subCountryLabel);
              }

              navigate(`/courses?${params.toString()}`);
            }}
            className="inline-flex items-center justify-between w-full rounded-lg bg-background/80 hover:bg-background px-3 py-2 text-sm transition-colors"
          >
            <span className="text-foreground">
              See more courses in{' '}
              <span className="font-medium">
                {localAreaLabel || subCountryLabel}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>
        )}

        {/* 2. Top 100 in primary region (if a list exists) */}
        {primaryRegionKey !== 'all' && (
          <button
            type="button"
            onClick={() => {
              const listSlug = primaryRegionKeyToTop100Slug(primaryRegionKey);
              const params = new URLSearchParams({
                tab: 'top100',
              });
              if (listSlug) params.set('list', listSlug);

              navigate(`/courses?${params.toString()}`);
            }}
            className="inline-flex items-center justify-between w-full rounded-lg bg-background/80 hover:bg-background px-3 py-2 text-sm transition-colors"
          >
            <span className="text-foreground">
              See Top 100 in{' '}
              <span className="font-medium">{primaryRegionLabel}</span>
            </span>
            <ChevronRight className="w-4 h-4 opacity-60" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseLocationBreadcrumb;
