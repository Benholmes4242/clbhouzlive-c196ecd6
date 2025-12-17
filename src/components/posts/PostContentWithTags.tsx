import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostTag {
  id: string;
  tagged_entity_id: string;
  start_index: number;
  end_index: number;
  taggable_entities: TaggableEntity;
}

interface PostContentWithTagsProps {
  content: string;
  tags: PostTag[];
  className?: string;
}

// Only these entity types render as orange @mentions
const MENTIONABLE_TYPES = new Set(['user', 'business']);

const PostContentWithTags: React.FC<PostContentWithTagsProps> = ({
  content,
  tags,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleTagClick = (entity: TaggableEntity) => {
    if (entity.entity_type === 'user') {
      if (entity.username) {
        navigate(`/profile/${entity.username}`);
      } else {
        navigate(`/profile/${entity.entity_id}`);
      }
    } else if (entity.entity_type === 'business') {
      navigate(`/business/${entity.entity_id}`);
    }
    // golf_club navigation is handled via "Played at" CTA, not @mentions
  };

  const renderContentWithTags = () => {
    if (!content) {
      return <span>{content}</span>;
    }

    // Filter to only mentionable types (user, business) - golf_club uses "Played at" CTA instead
    const mentionableTags = tags.filter(tag => 
      tag.taggable_entities && MENTIONABLE_TYPES.has(tag.taggable_entities.entity_type)
    );

    if (mentionableTags.length === 0) {
      return <span>{content}</span>;
    }

    // Sort tags by start_index to process them in order
    const sortedTags = [...mentionableTags].sort((a, b) => a.start_index - b.start_index);
    
    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    sortedTags.forEach((tag, index) => {
      const { start_index, end_index, taggable_entities } = tag;
      
      // Add text before the tag
      if (start_index > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {content.slice(lastIndex, start_index)}
          </span>
        );
      }

      // Add the clickable tag with orange accent styling
      const tagText = content.slice(start_index, end_index);
      const displayName = taggable_entities.username 
        ? `@${taggable_entities.username}` 
        : `@${taggable_entities.name}`;

      elements.push(
        <button
          key={`tag-${tag.id}`}
          onClick={(e) => {
            e.stopPropagation();
            handleTagClick(taggable_entities);
          }}
          className="text-primary font-medium hover:underline cursor-pointer bg-transparent border-none p-0 m-0 inline"
          style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
        >
          {tagText || displayName}
        </button>
      );

      lastIndex = end_index;
    });

    // Add remaining text after the last tag
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className={className}>
      {renderContentWithTags()}
    </div>
  );
};

export default PostContentWithTags;