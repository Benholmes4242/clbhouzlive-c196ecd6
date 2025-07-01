
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

  const handleTagClick = (tag: any, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Tag clicked:', tag);
    
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

    console.log('Rendering text with tags:', { text, tags });

    // Create a map of tag identifiers to tag objects for faster lookup
    const tagMap = new Map();
    tags.forEach(tag => {
      const usernameIdentifier = `@${tag.username}`;
      const nameIdentifier = `@${tag.name}`;
      tagMap.set(usernameIdentifier, tag);
      tagMap.set(nameIdentifier, tag);
      
      // Also map by display name for more flexible matching
      const displayName = tag.username || tag.name;
      tagMap.set(`@${displayName}`, tag);
    });

    console.log('Tag map:', Array.from(tagMap.entries()));

    // Split text by words and process each word
    const words = text.split(' ');
    const result = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      if (word.startsWith('@')) {
        // Check if this @mention matches any of our tags
        const matchingTag = tagMap.get(word) || Array.from(tagMap.values()).find(tag => {
          const displayName = tag.username || tag.name;
          return word === `@${displayName}`;
        });

        if (matchingTag) {
          // Render as clickable link
          const displayName = matchingTag.username || matchingTag.name;
          result.push(
            <button
              key={`tag-${i}-${matchingTag.id}`}
              onClick={(e) => handleTagClick(matchingTag, e)}
              className="text-blue-500 hover:text-blue-700 hover:underline font-medium cursor-pointer bg-transparent border-none p-0 inline"
            >
              @{displayName}
            </button>
          );
        } else {
          // Render as blue text but not clickable
          result.push(
            <span key={`mention-${i}`} className="text-blue-500 font-medium">
              {word}
            </span>
          );
        }
      } else {
        // Regular text
        result.push(word);
      }

      // Add space between words (except for the last word)
      if (i < words.length - 1) {
        result.push(' ');
      }
    }

    return result.length > 0 ? result : text;
  };

  return <span>{renderTextWithTags()}</span>;
};

export default TaggedText;
