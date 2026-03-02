import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, Search, Check, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import type { TaggableEntity } from '@/components/post/create-moment/types';

interface TagPeopleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: TaggableEntity[];
  onTagsChange: (tags: TaggableEntity[]) => void;
  accentColor?: string;
  bottomOffset?: number;
}

export function TagPeopleSheet({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  accentColor = '#f59e0b',
  bottomOffset = 0,
}: TagPeopleSheetProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaggableEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localSelected, setLocalSelected] = useState<TaggableEntity[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local selection when sheet opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelected([...selectedTags]);
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen, selectedTags]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('taggable_entities')
          .select('id, entity_id, entity_type, name, username, profile_image_url')
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .in('entity_type', ['user', 'business'])
          .limit(20);

        if (error) throw error;
        setResults(
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
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isSelected = useCallback(
    (id: string) => localSelected.some((t) => t.id === id),
    [localSelected]
  );

  const toggleSelect = useCallback((entity: TaggableEntity) => {
    setLocalSelected((prev) =>
      prev.some((t) => t.id === entity.id)
        ? prev.filter((t) => t.id !== entity.id)
        : [...prev, entity]
    );
  }, []);

  const removeChip = useCallback((id: string) => {
    setLocalSelected((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDone = useCallback(() => {
    onTagsChange(localSelected);
  }, [localSelected, onTagsChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[10010]"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed inset-x-0 z-[10011] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Tag people"
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: '85vh',
          bottom: bottomOffset,
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-lg font-semibold" style={{ color: '#1A1A1A' }}>
            Tag People
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ backgroundColor: '#F5F5F7' }}
          >
            <X className="w-4 h-4" style={{ color: '#7A7A7A' }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 flex-shrink-0 transition-colors duration-200"
              style={{ color: searchFocused ? '#f59e0b' : '#AEAEB2' }}
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search people and businesses..."
              className="w-full text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: '#F5F5F7',
                color: '#1A1A1A',
                caretColor: '#f59e0b',
                height: 44,
                borderRadius: 12,
                paddingLeft: 40,
                paddingRight: 40,
                border: searchFocused ? '1.5px solid #f59e0b' : '1.5px solid rgba(0,0,0,0.07)',
                boxShadow: searchFocused ? '0 0 0 3px rgba(245,158,11,0.10)' : 'none',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 active:scale-90 transition-transform"
              >
                <X className="w-4 h-4" style={{ color: '#AEAEB2' }} />
              </button>
            )}
          </div>
        </div>

        {/* Selected chips */}
        <AnimatePresence>
          {localSelected.length > 0 && (
            <motion.div
              className="px-5 pb-3 overflow-x-auto flex gap-2"
              style={{ scrollbarWidth: 'none' }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {localSelected.map((tag) => (
                <motion.div
                  key={tag.id}
                  className="flex items-center gap-1.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: '#F5F5F7',
                    height: 28,
                    padding: '0 12px 0 8px',
                    borderRadius: 980,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: accentColor + '20' }}
                  >
                    {tag.avatar_url ? (
                      <img src={tag.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-[9px] font-semibold" style={{ color: accentColor }}>
                        {tag.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: '#1A1A1A', maxWidth: 80 }}
                  >
                    {tag.name}
                  </span>
                  <button
                    onClick={() => removeChip(tag.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 transition-transform ml-0.5"
                  >
                    <X className="w-3.5 h-3.5" style={{ color: '#AEAEB2' }} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
          {query.trim() ? (
            <>
              <p
                className="text-[11px] font-semibold uppercase tracking-[1.5px] px-2 py-2"
                style={{ color: '#AEAEB2' }}
              >
                Results
              </p>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#E0E0E0', borderTopColor: accentColor }}
                  />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-10">
                  <UserPlus className="w-6 h-6 mx-auto mb-2" style={{ color: '#AEAEB2' }} />
                  <p className="text-sm" style={{ color: '#AEAEB2', fontWeight: 400 }}>
                    No results found
                  </p>
                </div>
              ) : (
                results.map((entity) => (
                  <PersonRow
                    key={entity.id}
                    entity={entity}
                    selected={isSelected(entity.id)}
                    onToggle={() => toggleSelect(entity)}
                    accentColor={accentColor}
                  />
                ))
              )}
            </>
          ) : localSelected.length > 0 ? (
            <>
              <p
                className="text-[11px] font-semibold uppercase tracking-[1.5px] px-2 py-2"
                style={{ color: '#AEAEB2' }}
              >
                Tagged
              </p>
              {localSelected.map((entity) => (
                <PersonRow
                  key={entity.id}
                  entity={entity}
                  selected={true}
                  onToggle={() => toggleSelect(entity)}
                  accentColor={accentColor}
                />
              ))}
            </>
          ) : (
            <p className="text-center text-sm py-12" style={{ color: '#AEAEB2' }}>
              Search to find people to tag
            </p>
          )}
        </div>

        {/* Done button */}
        <div
          className="px-5 pt-3"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}
        >
          <button
            onClick={handleDone}
            className="w-full font-semibold active:scale-[0.97] transition-all"
            style={{
              backgroundColor: localSelected.length > 0 ? '#f59e0b' : '#F5F5F7',
              color: localSelected.length > 0 ? '#FFFFFF' : '#AEAEB2',
              height: 48,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              boxShadow: localSelected.length > 0 ? '0 2px 12px rgba(245,158,11,0.22)' : 'none',
            }}
          >
            Done{localSelected.length > 0 ? ` (${localSelected.length})` : ''}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── PersonRow ──────────────────────────────────────────────────────

function PersonRow({
  entity,
  selected,
  onToggle,
  accentColor,
}: {
  entity: TaggableEntity;
  selected: boolean;
  onToggle: () => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-2 rounded-xl transition-colors duration-150"
      style={{ height: 60, backgroundColor: 'transparent' }}
      onMouseDown={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'rgba(245,158,11,0.06)';
      }}
      onMouseUp={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      onTouchStart={(e) => {
        const el = e.currentTarget;
        el.style.backgroundColor = 'rgba(245,158,11,0.06)';
      }}
      onTouchEnd={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: accentColor + '15' }}
      >
        {entity.avatar_url ? (
          <img src={entity.avatar_url} className="w-full h-full object-cover" alt="" />
        ) : (
          <span className="text-sm font-semibold" style={{ color: accentColor }}>
            {entity.name?.[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + username */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[15px] font-semibold truncate" style={{ color: '#1A1A1A' }}>
          {entity.name}
        </p>
        {entity.username && (
          <p className="text-[13px] truncate" style={{ color: '#7A7A7A' }}>
            @{entity.username}
          </p>
        )}
      </div>

      {/* Business badge */}
      {entity.entity_type === 'business' && (
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: '#92400e', backgroundColor: 'rgba(245,158,11,0.10)' }}
        >
          Business
        </span>
      )}

      {/* Check indicator */}
      {selected ? (
        <motion.div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accentColor }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 400 }}
        >
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </motion.div>
      ) : (
        <div
          className="w-5 h-5 rounded-full flex-shrink-0"
          style={{ border: '1.5px solid #E0E0E0' }}
        />
      )}
    </button>
  );
}
