import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfilePathById } from '@/lib/profileRoutes';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  creator_only?: boolean | null;
}

interface NestedPostTag {
  id: string;
  tagged_entity_id: string;
  start_index: number;
  end_index: number;
  taggable_entities: TaggableEntity;
}

interface FlatPostTag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  start_index?: number;
  end_index?: number;
  creator_only?: boolean | null;
}

interface NormalizedPostTag {
  id: string;
  start_index: number;
  end_index: number;
  taggable_entities: TaggableEntity;
}

interface PostContentWithTagsProps {
  content: string;
  tags: Array<NestedPostTag | FlatPostTag>;
  className?: string;
}

const MENTIONABLE_TYPES = new Set(['user', 'business']);

const isNestedTag = (tag: NestedPostTag | FlatPostTag): tag is NestedPostTag => {
  return 'taggable_entities' in tag;
};

const normalizeTags = (tags: Array<NestedPostTag | FlatPostTag>): NormalizedPostTag[] => {
  return tags.map((tag) => {
    if (isNestedTag(tag)) {
      return {
        id: tag.id,
        start_index: tag.start_index ?? 0,
        end_index: tag.end_index ?? 0,
        taggable_entities: tag.taggable_entities,
      };
    }

    return {
      id: tag.id,
      start_index: tag.start_index ?? 0,
      end_index: tag.end_index ?? 0,
      taggable_entities: {
        id: tag.id,
        entity_type: tag.entity_type,
        entity_id: tag.entity_id,
        name: tag.name,
        username: tag.username,
        creator_only: tag.creator_only,
      },
    };
  });
};

const PostContentWithTags: React.FC<PostContentWithTagsProps> = ({
  content,
  tags,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleTagClick = (entity: TaggableEntity) => {
    if (entity.entity_type === 'user') {
      const path = getProfilePathById(entity.entity_id, entity.creator_only, entity.username);
      navigate(path);
    } else if (entity.entity_type === 'business') {
      navigate(`/business/${entity.entity_id}`);
    }
  };

  if (!content) return <span className={className}>{content}</span>;

  const mentionableTags = normalizeTags(tags)
    .filter((tag) => tag.taggable_entities && MENTIONABLE_TYPES.has(tag.taggable_entities.entity_type))
    .sort((a, b) => a.start_index - b.start_index);

  if (mentionableTags.length === 0) {
    return <span className={className}>{content}</span>;
  }

  let lastIndex = 0;
  const elements: React.ReactNode[] = [];

  mentionableTags.forEach((tag, index) => {
    const { start_index, end_index, taggable_entities } = tag;

    if (start_index > lastIndex) {
      elements.push(<span key={`text-${index}`}>{content.slice(lastIndex, start_index)}</span>);
    }

    const fallbackLabel = `@${taggable_entities.username || taggable_entities.name}`;
    const tagText = content.slice(start_index, end_index) || fallbackLabel;

    elements.push(
      <span
        key={`tag-${tag.id}`}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          handleTagClick(taggable_entities);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            handleTagClick(taggable_entities);
          }
        }}
        className="font-medium hover:underline cursor-pointer bg-transparent border-none p-0 m-0 inline"
        style={{ color: 'var(--mention-color, #E8980A)', fontSize: 'inherit', lineHeight: 'inherit' }}
      >
        {tagText}
      </span>
    );

    lastIndex = end_index;
  });

  if (lastIndex < content.length) {
    elements.push(<span key="text-end">{content.slice(lastIndex)}</span>);
  }

  return <div className={className}>{elements}</div>;
};

export default PostContentWithTags;
