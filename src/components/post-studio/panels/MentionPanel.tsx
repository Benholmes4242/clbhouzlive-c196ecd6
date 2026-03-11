// MentionPanel — @mention search bottom sheet
// Queries taggable_entities for users and businesses

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { MentionToken } from '../types';

interface TaggableResult {
  id: string;
  entity_id: string;
  entity_type: 'user' | 'business';
  name: string;
  username: string | null;
  profile_image_url: string | null;
}

export function MentionPanel() {
  const { state, closePanel, setMentions, setCaption } = usePostStudioContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaggableResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Autofocus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('taggable_entities')
          .select('id, entity_id, entity_type, name, username, avatar_url')
          .in('entity_type', ['user', 'business'])
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(15);

        if (!error && data) {
          setResults(data as TaggableResult[]);
        }
      } catch (err) {
        console.error('[MentionPanel] search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback(
    (entity: TaggableResult) => {
      const displayName = entity.username ? `@${entity.username}` : `@${entity.name}`;
      // Insert mention at end of caption
      const newCaption = state.caption
        ? `${state.caption} ${displayName} `
        : `${displayName} `;

      const start = newCaption.indexOf(displayName);
      const end = start + displayName.length;

      const newMention: MentionToken = {
        start,
        end,
        entityId: entity.id,
        displayName: entity.name,
        entityType: entity.entity_type,
        avatarUrl: entity.avatar_url ?? undefined,
      };

      setCaption(newCaption);
      setMentions([...state.mentions, newMention]);
      closePanel();
    },
    [state.caption, state.mentions, setCaption, setMentions, closePanel]
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', ...SPRING.panel }}
      className="absolute inset-x-0 bottom-0 z-40 bg-background rounded-t-[20px] border-t border-border/50 backdrop-blur-xl max-h-[60vh] flex flex-col"
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">Mention</h3>
        <button
          onClick={closePanel}
          className="w-11 h-11 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people & businesses…"
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {!isSearching && results.length === 0 && query.length >= 2 && (
          <p className="text-center text-muted-foreground text-sm py-6">No results</p>
        )}

        {results.map((entity) => (
          <button
            key={entity.id}
            onClick={() => handleSelect(entity)}
            className="w-full flex items-center gap-3 py-3 border-b border-border/30 last:border-0 min-h-[52px]"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-muted shrink-0 overflow-hidden">
              {entity.avatar_url ? (
                <img src={entity.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-semibold">
                  {entity.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Name */}
            <div className="flex-1 text-left">
              <p className="text-foreground text-sm font-medium">{entity.name}</p>
              {entity.username && (
                <p className="text-muted-foreground text-xs">@{entity.username}</p>
              )}
            </div>
            {/* Type badge */}
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {entity.entity_type === 'business' ? 'Business' : 'Person'}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
