import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import TaggedText from './TaggedText';
import CourseLocationRow from './CourseLocationRow';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface Tag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  start_index?: number;
  end_index?: number;
}

interface GolfCourse {
  id?: string | null;
  name?: string | null;
  region?: string | null;
  country?: string | null;
  sub_country?: string | null;
  slug?: string | null;
}

interface PostMetaProps {
  /** Caption/text content */
  text?: string | null;
  /** Tags for @mentions (user, business) */
  tags?: Tag[];
  /** Golf course for "Played at" row */
  golfCourse?: GolfCourse | null;
  /** Additional class names */
  className?: string;
  /** Dark mode styling (for overlays on video) */
  isDark?: boolean;
  /** Max lines for caption before truncation */
  maxLines?: number;
  /** Show "more" button for truncated captions */
  showMore?: boolean;
  /** Hide course row even if course exists */
  hideCourse?: boolean;
  /** Text shadow for readability on video overlays */
  textShadow?: boolean;
}

/**
 * PostMeta - Unified component for post caption + course display
 * 
 * This is the single source of truth for rendering:
 * - Caption with @mentions (orange, clickable via TaggedText)
 * - "Played at" course row (MapPin icon, clickable via CourseLocationRow)
 * 
 * Matches Business Profile Activity tab + Clubhouse Creator Capsule standards.
 */
const PostMeta: React.FC<PostMetaProps> = ({
  text,
  tags,
  golfCourse,
  className,
  isDark = false,
  maxLines = 2,
  showMore = true,
  hideCourse = false,
  textShadow = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Clean caption by removing embedded "Played at" text (since we show it separately)
  const cleanCaption = text ? removeGolfCourseFromContent(text) : '';
  const shouldShowMore = showMore && cleanCaption && cleanCaption.length > 100;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Don't render if no content
  if (!cleanCaption && (!golfCourse || hideCourse)) {
    return null;
  }

  const textStyle = textShadow 
    ? { textShadow: '0 1px 3px rgba(0,0,0,0.7)', wordBreak: 'break-word' as const }
    : { wordBreak: 'break-word' as const };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Caption with @mentions */}
      {cleanCaption && (
        <div className="relative">
          <div 
            className={cn(
              "text-sm leading-relaxed",
              isDark ? "text-white" : "text-foreground",
              !isExpanded && maxLines > 0 && `line-clamp-${maxLines}`
            )}
            style={textStyle}
          >
            {tags && tags.length > 0 ? (
              <TaggedText 
                text={cleanCaption} 
                tags={tags}
                className={isDark ? "text-white" : "text-foreground"}
              />
            ) : (
              cleanCaption
            )}
            {shouldShowMore && !isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
                className={cn(
                  "ml-2 transition-colors",
                  isDark 
                    ? "text-white/80 hover:text-white" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={textShadow ? { textShadow: '0 1px 3px rgba(0,0,0,0.7)' } : undefined}
              >
                ...more
              </button>
            )}
          </div>
          {isExpanded && shouldShowMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              className={cn(
                "mt-1 text-sm transition-colors",
                isDark 
                  ? "text-white/80 hover:text-white" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={textShadow ? { textShadow: '0 1px 3px rgba(0,0,0,0.7)' } : undefined}
            >
              Show less
            </button>
          )}
        </div>
      )}
      
      {/* Course row - breathing room from caption (mt-3) and media below (pb included in row) */}
      {golfCourse && !hideCourse && (
        <div className={cn(cleanCaption && "mt-3", "pb-2")}>
          <CourseLocationRow 
            course={golfCourse}
            isDark={isDark}
            showChevron={true}
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(PostMeta);
