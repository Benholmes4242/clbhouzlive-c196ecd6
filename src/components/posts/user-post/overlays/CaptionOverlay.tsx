import React from 'react';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PostTag {
  id: string;
  name: string;
}

interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

interface CaptionOverlayProps {
  content: string | null;
  postTags: PostTag[];
  truncatedContent: string;
  golfCourse?: GolfCourse | null;
  showFullCourseTag?: boolean;
  onCourseTagClick?: (e: React.MouseEvent) => void;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  content,
  postTags,
  truncatedContent,
  golfCourse,
  showFullCourseTag = false,
  onCourseTagClick
}) => {
  const cleanContent = removeGolfCourseFromContent(content);
  const isMobile = useIsMobile();

  if (!truncatedContent) return null;

  return (
    <div className="absolute bottom-5 left-3 right-20 z-20">
      {/* Golf Course Badge - Above Caption for both mobile and desktop */}
      {golfCourse && (
        <div className="mb-2">
          {isMobile ? (
            // Mobile: Map pin that expands to show golf club name
            <div className="flex items-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCourseTagClick?.(e);
                }}
                className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-2 transition-all duration-200"
              >
                <MapPin className="w-4 h-4 text-white" />
              </button>
              
              {/* Golf club name that appears on click */}
              {showFullCourseTag && (
                <div className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap animate-scale-in">
                  {golfCourse.name}
                </div>
              )}
            </div>
          ) : (
            // Desktop: Single pill with map pin and golf club name together
            <div className="inline-flex items-center bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
              <MapPin className="w-5 h-5 text-white mr-2" />
              {golfCourse.name}
            </div>
          )}
        </div>
      )}

      {/* Caption Text */}
      <div 
        className="text-white text-base font-bold leading-[1.4] pointer-events-none md:pointer-events-auto md:group"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
        title={`${cleanContent}${postTags && postTags.length > 0 ? ' ' + postTags.map(tag => `@${tag.name}`).join(' ') : ''}`}
      >
      <div className="whitespace-nowrap overflow-hidden text-ellipsis md:group-hover:whitespace-normal md:group-hover:overflow-visible transition-all duration-200">
        <span className="md:group-hover:hidden text-base font-bold">
          {truncatedContent}
        </span>
        <span className="hidden md:group-hover:inline text-base font-bold">
          {cleanContent}
        </span>
        {postTags && postTags.length > 0 && (
          <span>
            {' '}
            {postTags.map((tag) => (
              <span key={tag.id} className="text-blue-400 font-medium">
                @{tag.name}{' '}
              </span>
            ))}
          </span>
        )}
        </div>
      </div>
    </div>
  );
};