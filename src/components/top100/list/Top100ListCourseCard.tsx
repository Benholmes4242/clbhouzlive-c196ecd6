import React from 'react';
import { Top100RankBadge } from '@/components/top100/Top100RankBadge';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';

interface CourseData {
  id: string;
  name: string;
  rank: number;
  imageUrl: string | null;
  country: string;
  subCountry?: string | null;
  flagEmoji?: string;
  regionShort?: string;
  played: boolean;
  rankingBadges?: Array<{ id: string; label: string }>;
  communityRating?: number | null;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
}

interface Top100ListCourseCardProps {
  course: CourseData;
  listSlug?: string;
  onClick: () => void;
}

export const Top100ListCourseCard: React.FC<Top100ListCourseCardProps> = ({
  course,
  listSlug,
  onClick,
}) => {
  // Determine which rank to show based on current list
  const getRankForList = () => {
    switch (listSlug) {
      case 'global':
        return course.globalRank ?? course.rank;
      case 'usa':
        return course.usaRank ?? course.rank;
      case 'gb-i':
        return course.regionalRank ?? course.rank;
      case 'europe':
        return course.regionalRank ?? course.rank;
      default:
        return course.rank;
    }
  };

  const rankToShow = getRankForList();
  const badgeSlug = (listSlug || 'global') as 'global' | 'gb-i' | 'usa' | 'europe';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-none sm:rounded-xl overflow-hidden bg-card border-y sm:border border-border/60 text-left shadow-none sm:shadow-sm hover:sm:shadow-md transition-all"
    >
      {/* Hero image with rank badge */}
      <div className="relative w-full aspect-[1.6/1] overflow-hidden">
        <img
          src={course.imageUrl || '/placeholder.svg'}
          alt={course.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        
        {/* Single rank badge for current list - top-left */}
        <div className="absolute top-3 left-3">
          <Top100RankBadge listSlug={badgeSlug} rank={rankToShow} />
        </div>
      </div>

      {/* Meta area */}
      <div className="px-4 py-3 bg-background space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground">
              {course.name}
            </h3>
            
            <p className="text-sm text-muted-foreground">
              {course.subCountry && `${course.subCountry}, `}
              {course.country}
            </p>
          </div>

          {course.communityRating != null && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ClubhouseLogo className="h-5 w-5" />
              <span className="text-sm font-semibold text-foreground">
                {course.communityRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
