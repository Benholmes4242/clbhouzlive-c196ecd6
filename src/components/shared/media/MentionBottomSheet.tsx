// MentionBottomSheet — Shared mention/tag bottom sheet for review wizard
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AtSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface MentionSuggestion {
  id: string;
  entity_type: 'user' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  avatar_url?: string | null;
}

interface MentionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mention: MentionSuggestion) => void;
  query?: string;
}

export function MentionBottomSheet({ isOpen, onClose, onSelect, query: initialQuery = '' }: MentionBottomSheetProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MentionSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('taggable_entities')
          .select('*')
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .in('entity_type', ['user', 'business'])
          .limit(15);
        if (data) setResults(data as MentionSuggestion[]);
      } catch {
        // silent
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 mx-auto z-50 w-full max-w-[480px] bg-background rounded-t-[20px] border-t border-border/50 max-h-[50vh] flex flex-col"
      >
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground">Tag People</h3>
          <button onClick={onClose} className="w-11 h-11 flex items-center justify-center">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people…"
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect(r); onClose(); }}
              className="w-full flex items-center gap-3 py-3 border-b border-border/30 min-h-[52px]"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <AtSign className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                {r.username && <p className="text-xs text-muted-foreground">@{r.username}</p>}
              </div>
            </button>
          ))}
          {isSearching && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
