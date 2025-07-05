
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

    // Create a comprehensive mapping of possible @mentions to tag objects
    const tagMap = new Map();
    tags.forEach(tag => {
      // Map by username
      if (tag.username) {
        tagMap.set(`@${tag.username}`, tag);
        tagMap.set(`@${tag.username.toLowerCase()}`, tag);
      }
      // Map by name
      if (tag.name) {
        tagMap.set(`@${tag.name}`, tag);
        tagMap.set(`@${tag.name.toLowerCase()}`, tag);
        // Also handle name with spaces replaced by nothing or underscores
        const nameNoSpaces = tag.name.replace(/\s+/g, '');
        const nameWithUnderscores = tag.name.replace(/\s+/g, '_');
        tagMap.set(`@${nameNoSpaces}`, tag);
        tagMap.set(`@${nameWithUnderscores}`, tag);
        tagMap.set(`@${nameNoSpaces.toLowerCase()}`, tag);
        tagMap.set(`@${nameWithUnderscores.toLowerCase()}`, tag);
      }
    });

    console.log('Tag map:', Array.from(tagMap.entries()));

    // Use regex to find all @mentions and replace them
    const mentionRegex = /@[\w\s]+/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const mention = match[0].trim();
      console.log('Processing mention:', mention);

      // Try to find matching tag
      let matchingTag = tagMap.get(mention) || tagMap.get(mention.toLowerCase());
      
      // If no direct match, try partial matching
      if (!matchingTag) {
        const mentionWithoutAt = mention.slice(1).toLowerCase();
        for (const tag of tags) {
          if (tag.name && tag.name.toLowerCase().includes(mentionWithoutAt)) {
            matchingTag = tag;
            break;
          }
          if (tag.username && tag.username.toLowerCase().includes(mentionWithoutAt)) {
            matchingTag = tag;
            break;
          }
        }
      }

      if (matchingTag) {
        // Use the person's display name (name) instead of username for better UX
        const displayName = matchingTag.name || matchingTag.username;
        parts.push(
          <button
            key={`tag-${match.index}-${matchingTag.id}`}
            onClick={(e) => handleTagClick(matchingTag, e)}
            className="text-blue-400 hover:text-blue-300 hover:underline font-medium cursor-pointer bg-transparent border-none p-0 inline"
          >
            @{displayName}
          </button>
        );
      } else {
        // Render as blue text but not clickable
        parts.push(
          <span key={`mention-${match.index}`} className="text-blue-400 font-medium">
            {mention}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last mention
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <span>{renderTextWithTags()}</span>;
};

export default TaggedText;
