import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TaggableEntity } from '@/components/post/create-moment/types';

export interface MentionMatch {
  query: string;
  startIndex: number;
  endIndex: number;
}

interface UseMentionDetectionOptions {
  text: string;
  cursorPosition: number;
  enabled?: boolean;
}

interface UseMentionDetectionReturn {
  mentionQuery: string | null;
  mentionMatch: MentionMatch | null;
  suggestions: TaggableEntity[];
  isLoading: boolean;
  clearMention: () => void;
}

export function useMentionDetection({
  text,
  cursorPosition,
  enabled = true,
}: UseMentionDetectionOptions): UseMentionDetectionReturn {
  const [mentionMatch, setMentionMatch] = useState<MentionMatch | null>(null);
  const [suggestions, setSuggestions] = useState<TaggableEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Detect @mention at cursor
  useEffect(() => {
    if (!enabled) {
      setMentionMatch(null);
      return;
    }

    const textBeforeCursor = text.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      setMentionMatch({
        query: match[1],
        startIndex: cursorPosition - match[0].length,
        endIndex: cursorPosition,
      });
    } else {
      setMentionMatch(null);
      setSuggestions([]);
    }
  }, [text, cursorPosition, enabled]);

  // Fetch suggestions
  useEffect(() => {
    if (!mentionMatch || mentionMatch.query.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('taggable_entities')
          .select('id, entity_id, entity_type, name, username, profile_image_url')
          .or(`name.ilike.%${mentionMatch.query}%,username.ilike.%${mentionMatch.query}%`)
          .in('entity_type', ['user', 'business'])
          .limit(8);

        if (error) throw error;

        setSuggestions(
          (data || []).map((e) => ({
            id: e.id,
            entity_id: e.entity_id,
            entity_type: e.entity_type as 'user' | 'business',
            name: e.name || 'Unknown',
            username: e.username,
            avatar_url: e.profile_image_url || undefined,
          }))
        );
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mentionMatch?.query]);

  const clearMention = useCallback(() => {
    setMentionMatch(null);
    setSuggestions([]);
  }, []);

  return {
    mentionQuery: mentionMatch?.query ?? null,
    mentionMatch,
    suggestions,
    isLoading,
    clearMention,
  };
}
