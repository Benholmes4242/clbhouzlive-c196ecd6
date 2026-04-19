import React from 'react';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import PostContentWithTags from '@/components/posts/PostContentWithTags';

interface PostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  start_index?: number;
  end_index?: number;
}

interface CaptionOverlayProps {
  content: string | null;
  postTags: PostTag[];
  truncatedContent: string;
  isReview?: boolean;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  content,
  postTags,
  truncatedContent,
  isReview = false,
}) => {
  const cleanContent = removeGolfCourseFromContent(content);

  // Review posts render caption inline via CreatorCapsule — no overlay
  if (isReview) return null;
  if (!truncatedContent) return null;

  const mappedTags = (postTags || []).map((tag) => ({
    id: tag.id,
    tagged_entity_id: tag.id,
    start_index: tag.start_index ?? 0,
    end_index: tag.end_index ?? 0,
    taggable_entities: {
      id: tag.id,
      entity_type: tag.entity_type,
      entity_id: tag.entity_id,
      name: tag.name,
      username: tag.username,
    },
  }));

  return (
    <div className="absolute bottom-5 left-3 right-20 z-20">
      <div
        className="text-white text-body-lg font-semibold leading-relaxed md:group"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
      >
        <div className="line-clamp-2 md:group-hover:line-clamp-none transition-all duration-200">
          <span className="md:group-hover:hidden text-body-lg font-semibold">
            {truncatedContent}
          </span>
          <span className="hidden md:group-hover:inline text-body-lg font-semibold">
            {mappedTags.length > 0 ? (
              <PostContentWithTags
                content={cleanContent}
                tags={mappedTags}
                className="inline"
              />
            ) : (
              cleanContent
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
