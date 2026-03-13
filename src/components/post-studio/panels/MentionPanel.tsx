// MentionPanel — @mention search, dark glass bottom sheet

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import type { MentionToken } from '../types';

const PANEL_STYLE: React.CSSProperties = {
  background: 'rgba(18,18,18,0.98)',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
};

const SEARCH_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
};

interface TaggableResult {
  id: string; entity_id: string; entity_type: 'user' | 'business';
  name: string; username: string | null; profile_image_url: string | null;
}

export function MentionPanel() {
  const { state, closePanel, setMentions, setCaption } = usePostStudioContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaggableResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('taggable_entities')
          .select('id, entity_id, entity_type, name, username, profile_image_url')
          .in('entity_type', ['user', 'business'])
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(15);
        if (!error && data) setResults(data as unknown as TaggableResult[]);
      } catch (err) { console.error('[MentionPanel]', err); }
      finally { setIsSearching(false); }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback((entity: TaggableResult) => {
    const displayName = entity.username ? `@${entity.username}` : `@${entity.name}`;
    const newCaption = state.caption ? `${state.caption} ${displayName} ` : `${displayName} `;
    const start = newCaption.indexOf(displayName);
    const newMention: MentionToken = {
      start, end: start + displayName.length, entityId: entity.id,
      displayName: entity.name, entityType: entity.entity_type,
      avatarUrl: entity.profile_image_url ?? undefined,
    };
    setCaption(newCaption);
    setMentions([...state.mentions, newMention]);
    closePanel();
  }, [state.caption, state.mentions, setCaption, setMentions, closePanel]);

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', ...SPRING.panel }} className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] max-h-[65vh] flex flex-col" style={PANEL_STYLE}>
      <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} /></div>

      <div className="flex items-center justify-between px-5 pb-3 pt-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: 'rgba(245,158,11,0.70)' }}>Mention</p>
          <h3 className="text-base font-semibold text-white mt-0.5">Tag a creator</h3>
        </div>
        <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.60)' }} />
        </button>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-center gap-2.5 px-3.5 py-3" style={SEARCH_STYLE}>
          <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people & businesses…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'rgba(255,255,255,0.85)', caretColor: '#f59e0b' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(245,158,11,0.30)', borderTopColor: 'transparent' }} />
          </div>
        )}
        {!isSearching && results.length === 0 && query.length >= 2 && (
          <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>No results for "{query}"</p>
        )}
        {results.map((entity, i) => (
          <motion.button key={entity.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => handleSelect(entity)} className="w-full flex items-center gap-3 py-3.5 min-h-[56px]" style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
              {entity.profile_image_url
                ? <img src={entity.profile_image_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.50)' }}>{entity.name.charAt(0).toUpperCase()}</div>
              }
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">{entity.name}</p>
              {entity.username && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>@{entity.username}</p>}
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: 'rgba(245,158,11,0.80)' }}>
              {entity.entity_type === 'business' ? 'Business' : 'Creator'}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
