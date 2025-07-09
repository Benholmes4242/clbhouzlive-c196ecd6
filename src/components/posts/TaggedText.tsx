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

const TaggedText: React.FC<TaggedTextProps> = ({ text, tags, className = '' }) => {
  if (!tags || tags.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort tags by start_index to process them in order
  const sortedTags = [...tags].sort((a, b) => a.start_index - b.start_index);
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedTags.forEach((tag, index) => {
    // Add text before the tag
    if (tag.start_index > lastIndex) {
      parts.push(text.slice(lastIndex, tag.start_index));
    }

    // Generate the appropriate link based on entity type
    const getEntityLink = (tag: Tag) => {
      switch (tag.entity_type) {
        case 'user':
          return `/profile/${tag.entity_id}`;
        case 'golf_club':
          return `/course/${tag.entity_id}`;
        case 'business':
          return `/business/${tag.entity_id}`;
        default:
          return '#';
      }
    };

    // Add the tagged link
    parts.push(
      <Link
        key={`tag-${index}`}
        to={getEntityLink(tag)}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
        onClick={(e) => {
          e.stopPropagation(); // Prevent parent click handlers
        }}
      >
        @{tag.name}
      </Link>
    );

    lastIndex = tag.end_index;
  });

  // Add any remaining text after the last tag
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};

export default TaggedText;