import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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

  // Derive region / subregion for the current course
  const primaryRegionKey: PrimaryRegionKey = 
    (course.sub_country ? getRegionFromSubregion(course.sub_country) : null) ||
    dbValueToRegionKey(course.region || course.country);

  const subCountryLabel: string | null = course.sub_country || null;
  const subKey = subCountryLabel ? normalizeLabel(subCountryLabel) : null;

  // Derive primary Top 100 list for the CTA
  const membership = course.course_top100_memberships?.[0];
  const primaryListSlug = membership?.top100_lists?.slug ?? 'global-top-100';
  const primaryListName = membership?.top100_lists?.name ?? 'Worldwide';

  return (
    <div className="px-4 pt-4 pb-2 bg-slate-100">
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
              if (slug.includes('gb-i') || slug.includes('britain') || slug.includes('ireland')) return 'gb-i';
              if (slug.includes('usa') || slug.includes('united-states')) return 'usa';
              if (slug.includes('europe')) return 'europe';
              if (slug.includes('rest')) return 'rest';
              if (slug.includes('global') || slug.includes('world')) return 'global';
              return 'global';
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
  );
};

export default CourseExploreLinks;
