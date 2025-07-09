
import React, { useMemo } from 'react';
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

const TaggedText = React.memo(({ text, tags = [] }: TaggedTextProps) => {
  const navigate = useNavigate();

  const handleTagClick = (tag: any, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (tag.entity_type === 'user') {
      navigate(`/profile/${tag.entity_id}`);
    } else if (tag.entity_type === 'golf_club') {
      navigate(`/courses/${tag.entity_id}`);
    } else if (tag.entity_type === 'business') {
      navigate(`/profile/${tag.entity_id}`);
    }
  };

  const renderedContent = useMemo(() => {
    if (!text || tags.length === 0) {
      return text;
    }

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

    // Sort tags by name length (longest first) to match longer names first
    const sortedTags = [...tags].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));
    
    // Create patterns for each tag
    const tagPatterns = sortedTags.map(tag => {
      const patterns = [];
      if (tag.username) {
        patterns.push(`@${tag.username}`);
      }
      if (tag.name) {
        patterns.push(`@${tag.name}`);
        // Also handle names with spaces replaced by nothing or underscores
        const nameNoSpaces = tag.name.replace(/\s+/g, '');
        const nameWithUnderscores = tag.name.replace(/\s+/g, '_');
        if (nameNoSpaces !== tag.name) patterns.push(`@${nameNoSpaces}`);
        if (nameWithUnderscores !== tag.name) patterns.push(`@${nameWithUnderscores}`);
      }
      return { tag, patterns };
    });

    // Find all mentions and their positions
    const mentions = [];
    tagPatterns.forEach(({ tag, patterns }) => {
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          mentions.push({
            start: match.index,
            end: match.index + match[0].length,
            text: match[0],
            tag: tag
          });
        }
      });
    });

    // Sort mentions by position and remove overlaps (keep longest matches)
    mentions.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const filteredMentions = [];
    for (const mention of mentions) {
      if (!filteredMentions.some(existing => 
        (mention.start >= existing.start && mention.start < existing.end) ||
        (mention.end > existing.start && mention.end <= existing.end)
      )) {
        filteredMentions.push(mention);
      }
    }

    // Build the final result
    const parts = [];
    let lastIndex = 0;

    filteredMentions.forEach((mention, index) => {
      // Add text before the mention
      if (mention.start > lastIndex) {
        parts.push(text.slice(lastIndex, mention.start));
      }

      // Add the mention as a clickable link
      const displayName = mention.tag.name || mention.tag.username;
      parts.push(
        <button
          key={`tag-${mention.start}-${mention.tag.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTagClick(mention.tag, e);
          }}
          className="text-blue-400 hover:text-blue-300 hover:underline font-medium cursor-pointer bg-transparent border-none p-0 inline-block relative z-10"
          style={{ pointerEvents: 'auto' }}
        >
          @{displayName}
        </button>
      );

      lastIndex = mention.end;
    });

    // Add remaining text after last mention
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  }, [text, tags]);

  return <span>{renderedContent}</span>;
});

export default TaggedText;
