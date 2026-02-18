/**
 * MentionText - Renders text with @mentions highlighted in amber.
 * Mentions are stored as slug-safe \w-only usernames (e.g. @danny_holmes).
 * On tap: resolves entity_id via taggable_entities, navigates by entity_id (not raw username).
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
 * Parse text into regular text and mention parts.
 * Regex matches slug-safe \w-only usernames (e.g. @danny_holmes).
 */
function parseTextWithMentions(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: 'mention',
      content: match[0],  // full match including @
      username: match[1], // slug without @
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Resolve a slug username to its entity and navigate by entity_id.
 * Lookup order:
 *  1. Exact match on username column (handles clean slugs like tomholmes42)
 *  2. Underscore→space variant (danny_holmes → "danny holmes")
 *  3. Underscore→removed variant (danny_holmes → "dannyholmes")
 * Always navigates by entity_id (UUID) — never by raw username string.
 */
export async function resolveAndNavigate(
  slugUsername: string,
  navigate: ReturnType<typeof useNavigate>
): Promise<void> {
  try {
    const cleaned = slugUsername.toLowerCase();
    const withSpaces = cleaned.replace(/_/g, ' ');
    const withoutSeparators = cleaned.replace(/_/g, '');

    // 1. Exact match
    let { data } = await supabase
      .from('taggable_entities')
      .select('entity_id, entity_type')
      .eq('username', cleaned)
      .in('entity_type', ['user', 'business'])
      .limit(1)
      .maybeSingle();

    // 2 & 3. Normalised fallback (space or no-separator variants)
    if (!data && withSpaces !== cleaned) {
      const { data: fuzzy } = await supabase
        .from('taggable_entities')
        .select('entity_id, entity_type')
        .or(`username.ilike.${withSpaces},username.ilike.${withoutSeparators}`)
        .in('entity_type', ['user', 'business'])
        .limit(1)
        .maybeSingle();
      data = fuzzy;
    }

    if (!data) return; // no match — don't navigate to a broken route

    if (data.entity_type === 'business') {
      navigate(`/business/${data.entity_id}`);
    } else {
      navigate(`/profile/${data.entity_id}`);
    }
  } catch {
    // Silent — avoid broken navigations
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
                'text-amber-500 font-medium hover:underline cursor-pointer',
                'inline bg-transparent border-none p-0',
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
