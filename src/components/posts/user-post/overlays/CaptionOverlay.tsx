import React from 'react';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface PostTag {
  id: string;
  name: string;
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

  if (!truncatedContent) return null;

  return (
    <div 
      className="absolute bottom-3 left-3 right-20 z-20 text-white text-base font-bold leading-[1.4] pointer-events-none md:pointer-events-auto md:group"
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
  );
};