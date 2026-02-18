/**
 * MentionText - Renders text with @mentions highlighted
 * User mentions: orange (#F7931E), navigate to /profile/{username}
 * Business mentions: primary green, navigate to /business/{entity_id}
 * Resolves entity type on tap via taggable_entities lookup
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

/**
 * Resolve a username to its entity type and navigate accordingly
 */
export async function resolveAndNavigate(
  username: string,
  navigate: ReturnType<typeof useNavigate>
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('taggable_entities')
      .select('entity_id, entity_type')
      .eq('username', username.toLowerCase())
      .in('entity_type', ['user', 'business'])
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback to profile page
      navigate(`/profile/${username}`);
      return;
    }

    if (data.entity_type === 'business') {
      navigate(`/business/${data.entity_id}`);
    } else {
      navigate(`/profile/${username}`);
    }
  } catch {
    // Fallback on any error
    navigate(`/profile/${username}`);
  }
}

export function MentionText({
  text,
  className,
  mentionClassName,
  onMentionTap,
}: MentionTextProps) {
  const navigate = useNavigate();

  const parts = useMemo(() => parseTextWithMentions(text), [text]);

  const handleMentionClick = useCallback(
    (username: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (onMentionTap) {
        onMentionTap(username);
      } else {
        // Resolve entity type then navigate
        resolveAndNavigate(username, navigate);
      }
    },
    [onMentionTap, navigate]
  );

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
                "text-amber-500 font-medium hover:underline cursor-pointer",
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
