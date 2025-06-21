
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TaggedTextProps {
  text: string;
  tags?: Array<{
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
  }>;
}

const TaggedText = ({ text, tags = [] }: TaggedTextProps) => {
  const navigate = useNavigate();

  const handleTagClick = (tag: any) => {
    if (tag.entity_type === 'user') {
      navigate(`/profile/${tag.entity_id}`);
    } else if (tag.entity_type === 'golf_club') {
      // Navigate to golf club page when implemented
      console.log('Navigate to golf club:', tag);
    } else if (tag.entity_type === 'business') {
      // Navigate to business page when implemented
      console.log('Navigate to business:', tag);
    }
  };

  const renderTextWithTags = () => {
    if (!text || tags.length === 0) {
      return text;
    }

    let result = text;
    const tagMap = new Map();
    
    // Create a map of tag identifiers to tag objects
    tags.forEach(tag => {
      const identifier = `@${tag.username || tag.name}`;
      tagMap.set(identifier, tag);
    });

    // Find all @mentions in the text
    const mentionRegex = /@\w+/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(result)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(result.substring(lastIndex, match.index));
      }

      const mention = match[0];
      const tag = Array.from(tagMap.values()).find(t => 
        mention === `@${t.username}` || mention === `@${t.name}`
      );

      if (tag) {
        parts.push(
          <button
            key={`tag-${match.index}`}
            onClick={() => handleTagClick(tag)}
            className="text-blue-500 hover:text-blue-700 hover:underline font-medium"
          >
            {mention}
          </button>
        );
      } else {
        parts.push(mention);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < result.length) {
      parts.push(result.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <span>{renderTextWithTags()}</span>;
};

export default TaggedText;
