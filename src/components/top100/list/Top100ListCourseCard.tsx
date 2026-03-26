import React from 'react';
import { UnifiedCourseCard } from '@/components/courses/UnifiedCourseCard';
import { toCourseCardModel } from '@/lib/mappers/toCourseCardModel';

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
  reviewCount?: number;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
}

interface Top100ListCourseCardProps {
  course: CourseData;
  listSlug?: string;
  onClick: () => void;
}

/**
 * Thin wrapper for Top 100 list pages.
 * Now uses UnifiedCourseCard as the SINGLE SOURCE OF TRUTH.
 */
export const Top100ListCourseCard: React.FC<Top100ListCourseCardProps> = ({
  course,
  listSlug,
  onClick,
}) => {
  // Map to unified CourseCardModel
  const cardModel = toCourseCardModel({
    id: course.id,
    name: course.name,
    country: course.country,
    sub_country: course.subCountry,
    thumbnail_image: course.imageUrl,
    global_rank: course.globalRank,
    regional_rank: course.regionalRank,
    usa_rank: course.usaRank,
    average_rating: course.communityRating,
  }, {
    isPlayedByViewer: course.played,
  });

  return (
    <UnifiedCourseCard
      course={cardModel}
      variant="vertical"
      showRankBadges={true}
      showRating={true}
      showPlayedStatus={true}
      activeListSlug={listSlug ?? null}
      onClick={onClick}
    />
  );
};
