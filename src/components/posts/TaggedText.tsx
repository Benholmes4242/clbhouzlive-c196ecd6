
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

    // Create a map of tag identifiers to tag objects for faster lookup
    const tagMap = new Map();
    tags.forEach(tag => {
      const usernameIdentifier = `@${tag.username}`;
      const nameIdentifier = `@${tag.name}`;
      tagMap.set(usernameIdentifier, tag);
      tagMap.set(nameIdentifier, tag);
    });

    // Find all @mentions in the text using a more comprehensive regex
    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const mention = match[0];
      // Find matching tag by checking both username and name patterns
      const matchingTag = Array.from(tagMap.values()).find(tag => 
        mention === `@${tag.username}` || mention === `@${tag.name}`
      );

      if (matchingTag) {
        parts.push(
          <button
            key={`tag-${match.index}-${matchingTag.id}`}
            onClick={() => handleTagClick(matchingTag)}
            className="text-blue-500 hover:text-blue-700 hover:underline font-medium cursor-pointer bg-transparent border-none p-0 inline"
          >
            {mention}
          </button>
        );
      } else {
        // If no matching tag found, render as plain text but still styled
        parts.push(
          <span key={`mention-${match.index}`} className="text-blue-500 font-medium">
            {mention}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last mention
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <span>{renderTextWithTags()}</span>;
};

export default TaggedText;
