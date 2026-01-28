/**
 * MentionText - Renders text with @mentions highlighted in orange
 * Matches @username patterns and makes them tappable
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MentionTextProps {
  text: string;
  className?: string;
  mentionClassName?: string;
  onMentionTap?: (username: string) => void;
}

interface TextPart {
  type: 'text' | 'mention';
  content: string;
  username?: string;
}

/**
 * Parse text into parts (regular text and mentions)
 */
function parseTextWithMentions(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add the mention
    parts.push({
      type: 'mention',
      content: match[0], // Full match including @
      username: match[1], // Just the username without @
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last mention
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
}

export function MentionText({
  text,
  className,
  mentionClassName,
  onMentionTap,
}: MentionTextProps) {
  const navigate = useNavigate();

  const parts = useMemo(() => parseTextWithMentions(text), [text]);

  const handleMentionClick = (username: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onMentionTap) {
      onMentionTap(username);
    } else {
      // Default: navigate to profile
      navigate(`/profile/${username}`);
    }
  };

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'mention' && part.username) {
          return (
            <button
              key={index}
              type="button"
              onClick={(e) => handleMentionClick(part.username!, e)}
              className={cn(
                "text-[#F7931E] font-medium hover:underline cursor-pointer",
                "inline bg-transparent border-none p-0",
                mentionClassName
              )}
            >
              {part.content}
            </button>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}

export default MentionText;
