// MentionPanel — @mention search, dark glass bottom sheet
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, UserRound } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { usePostStudioContext } from '../usePostStudio';
import { SPRING } from '../constants';
import { AMBER_DIM, AMBER_GHOST, TEXT_PRIMARY, TEXT_SECONDARY } from '../tokens';
import type { MentionToken } from '../types';

interface TaggableResult {
  id: string; entity_id: string; entity_type: 'user' | 'business';
  name: string; username: string | null; profile_image_url: string | null;
}

// Suppress usernames that look like email addresses
function isEmail(str: string): boolean {
  return str.includes('@') || str.includes('.');
}

export function MentionPanel() {
  const { state, closePanel, setMentions, setCaption, setMentionTriggerIndex } = usePostStudioContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaggableResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dragControls = useDragControls();

  useEffect(() => {
    const atIndex = state.caption.lastIndexOf('@');
    if (atIndex >= 0) {
      const typed = state.caption.slice(atIndex + 1).trim();
      if (typed.length > 0 && typed.length < 20) setQuery(typed);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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
    const displayName = `@${entity.name}`;
    const atIndex = state.caption.lastIndexOf('@');
    // Calculate exact insertion position — don't use indexOf which finds wrong occurrence
    const insertAt = atIndex >= 0 ? atIndex : state.caption.length + 1;
    const newCaption = atIndex >= 0
      ? `${state.caption.slice(0, atIndex)}${displayName} `
      : `${state.caption} ${displayName} `;
    const newMention: MentionToken = {
      start: insertAt,
      end: insertAt + displayName.length,
      entityId: entity.id,
      displayName: entity.name,
      entityType: entity.entity_type,
      avatarUrl: entity.profile_image_url ?? undefined,
    };
    setCaption(newCaption);
    setMentions([...state.mentions, newMention]);
    closePanel();
  }, [state.caption, state.mentions, setCaption, setMentions, closePanel]);

  return (
    <>
      {/* Tap-outside backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={closePanel}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', ...SPRING.panel }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_e, info) => {
          if (info.offset.y > 80 || info.velocity.y > 400) closePanel();
        }}
        className="absolute inset-x-0 bottom-0 z-40 rounded-t-[24px] max-h-[65vh] flex flex-col"
        style={{
          background: 'rgba(13,13,13,0.99)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.20)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: AMBER_DIM }}>
              Mention
            </p>
            <h3 className="text-sm font-semibold mt-0.5" style={{ color: TEXT_PRIMARY }}>
              Tag a golfer
            </h3>
          </div>
          <button onClick={closePanel} className="w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.60)' }} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3">
          <div
            className="flex items-center gap-2.5 px-3.5 py-3"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}
          >
            <Search className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search golfers & clubs…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'rgba(255,255,255,0.85)', caretColor: 'rgba(232,152,10,0.90)' }}
            />
            {query.length > 0 && (
              <button onClick={() => setQuery('')} className="shrink-0">
                <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.40)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(232,152,10,0.30)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!isSearching && query.length < 2 && (
            <div className="flex flex-col items-center text-center py-10">
              <UserRound className="w-6 h-6 mb-2" style={{ color: 'rgba(255,255,255,0.20)' }} strokeWidth={1.5} />
              <p className="text-xs" style={{ color: TEXT_SECONDARY }}>
                Type a name to tag a golfer or club
              </p>
            </div>
          )}

          {!isSearching && results.length === 0 && query.length >= 2 && (
            <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {results.map((entity, i) => (
            <motion.button
              key={entity.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleSelect(entity)}
              className="w-full flex items-center gap-3 py-3 min-h-[56px]"
              style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                {entity.profile_image_url
                  ? <img src={entity.profile_image_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      {entity.name.charAt(0).toUpperCase()}
                    </div>
                }
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>{entity.name}</p>
                {entity.username && !isEmail(entity.username) && (
                  <p className="text-xs mt-0.5" style={{ color: TEXT_SECONDARY }}>
                    @{entity.username}
                  </p>
                )}
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: AMBER_GHOST, color: AMBER_DIM }}>
                {entity.entity_type === 'business' ? 'Club' : 'Golfer'}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </>
  );
}
