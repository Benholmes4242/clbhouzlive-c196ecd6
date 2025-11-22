import React from 'react';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

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
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  content,
  postTags,
  truncatedContent
}) => {
  const cleanContent = removeGolfCourseFromContent(content);
  const isMobile = useIsMobile();

  if (!truncatedContent) return null;

  return (
    <div className="absolute bottom-5 left-3 right-20 z-20">
      {/* Golf Course Badge - REMOVED */}

      {/* Caption Text */}
      <div 
        className="text-white text-body-lg font-semibold leading-relaxed pointer-events-none md:pointer-events-auto md:group"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
        title={`${cleanContent}${postTags && postTags.length > 0 ? ' ' + postTags.map(tag => `@${tag.name}`).join(' ') : ''}`}
      >
      <div className="line-clamp-2 md:group-hover:line-clamp-none transition-all duration-200">
        <span className="md:group-hover:hidden text-body-lg font-semibold">
          {truncatedContent}
        </span>
        <span className="hidden md:group-hover:inline text-body-lg font-semibold">
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