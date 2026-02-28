/**
 * TagInputPopover - Add tag to conversation
 * Autocomplete with user's existing tags
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { suggestTags, addTagsToThread } from '../api/tags';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';
import { toast } from 'sonner';

export interface TagInputPopoverProps {
  threadId: string;
  existingTags: string[];
  onClose: () => void;
  onTagAdded: (tag: string) => void;
}

export const TagInputPopover: React.FC<TagInputPopoverProps> = ({
  threadId,
  existingTags,
  onClose,
  onTagAdded,
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user's existing tags for autocomplete
  useEffect(() => {
    suggestTags().then(setAllTags);
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const query = input.toLowerCase().trim();
    const filtered = allTags
      .filter((tag) => tag.toLowerCase().includes(query))
      .filter((tag) => !existingTags.includes(tag))
      .slice(0, 5);

    setSuggestions(filtered);
  }, [input, allTags, existingTags]);

  const handleSubmit = async (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    
    if (!normalizedTag || normalizedTag.length > 32) {
      toast.error('Tag must be 1-32 characters', { duration: 2000 });
      return;
    }

    if (existingTags.includes(normalizedTag)) {
      toast.error('Tag already exists', { duration: 2000 });
      return;
    }

    setLoading(true);
    try {
      await addTagsToThread(threadId, [normalizedTag]);
      echoHistoryAnalytics.tagAdded({ thread_id: threadId, tag: normalizedTag });
      onTagAdded(normalizedTag);
      toast.success(`Tagged: ${normalizedTag}`, { duration: 2000 });
      onClose();
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast.error('Failed to add tag', { duration: 2000 });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSubmit(suggestions[0]);
      } else {
        handleSubmit(input);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Popover */}
      <div
        className="absolute left-0 mt-2 w-64 rounded-xl border shadow-xl backdrop-blur-md p-3 z-[9999]"
        style={{
          borderColor: 'var(--hub-stroke)',
          background: 'rgba(22, 24, 27, 0.98)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[13px] font-medium mb-2" style={{ color: 'var(--hub-text)' }}>
          Add tag
        </div>
        
        {/* Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type a tag..."
            maxLength={32}
            className="w-full px-3 py-2 rounded-lg text-[14px] focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--hub-stroke)',
              color: 'var(--hub-text)',
            }}
          />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-2 space-y-1">
            {suggestions.map((tag) => (
              <button
                key={tag}
                onClick={() => handleSubmit(tag)}
                disabled={loading}
                className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-white/10 transition-colors disabled:opacity-50"
                style={{ color: 'var(--hub-text)' }}
              >
                <Plus size={12} className="inline mr-2" />
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 text-[11px]" style={{ color: 'var(--hub-text-dim)' }}>
          Press Enter to add · Esc to cancel
        </div>
      </div>
    </>
  );
};
