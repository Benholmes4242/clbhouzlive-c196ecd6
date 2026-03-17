import React from 'react';
import { Link } from 'react-router-dom';

interface Tag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  start_index?: number;
  end_index?: number;
}

interface TaggedTextProps {
  text: string;
  tags: Tag[];
  className?: string;
}

// Only these entity types render as orange @mentions
const MENTIONABLE_TYPES = new Set(['user', 'business']);

const TaggedText: React.FC<TaggedTextProps> = ({ text, tags, className = '' }) => {
  if (!tags || tags.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Filter to only mentionable types (user, business) - golf_club uses "Played at" CTA instead
  const mentionableTags = tags.filter(tag => MENTIONABLE_TYPES.has(tag.entity_type));

  if (mentionableTags.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort tags by start_index to process them in order
  const sortedTags = [...mentionableTags].sort((a, b) => (a.start_index ?? 0) - (b.start_index ?? 0));
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedTags.forEach((tag, index) => {
    // Add text before the tag
    if ((tag.start_index ?? 0) > lastIndex) {
      parts.push(text.slice(lastIndex, tag.start_index));
    }

    // Generate the appropriate link based on entity type
    const getEntityLink = (tag: Tag) => {
      switch (tag.entity_type) {
        case 'user':
          return `/profile/${tag.entity_id}`;
        case 'business':
          return `/business/${tag.entity_id}`;
        default:
          return '#';
      }
    };

    // Add the tagged link with orange accent styling
    parts.push(
      <Link
        key={`tag-${index}`}
        to={getEntityLink(tag)}
        className="font-medium hover:underline cursor-pointer"
        style={{ color: '#E8980A' }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        @{tag.name}
      </Link>
    );

    lastIndex = tag.end_index ?? 0;
  });

  // Add any remaining text after the last tag
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};

export default TaggedText;