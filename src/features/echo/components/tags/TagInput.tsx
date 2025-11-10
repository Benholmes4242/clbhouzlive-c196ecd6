import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TagChip } from './TagChip';
import { suggestTags } from '../../api/tags';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  onSubmit,
  autoFocus,
  placeholder = 'Type to add tag, Enter to commit',
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Fetch suggestions debounced
  useEffect(() => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }

    if (inputValue.trim()) {
      debounceTimer.current = window.setTimeout(async () => {
        const results = await suggestTags(inputValue);
        // Filter out tags already selected
        const filtered = results.filter(
          (tag) => !value.some((v) => v.toLowerCase() === tag.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(-1);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [inputValue, value]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    // Deduplicate case-insensitive
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    onChange([...value, trimmed]);
    setInputValue('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
        if (onSubmit) onSubmit();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setInputValue('');
      inputRef.current?.blur();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const item = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 min-h-[38px] focus-within:ring-2 focus-within:ring-primary">
        {value.map((tag, index) => (
          <TagChip key={index} label={tag} onRemove={() => removeTag(index)} variant="solid" />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent outline-none text-sm min-w-[120px] placeholder:text-muted-foreground"
          aria-autocomplete="list"
          aria-label="Add tags"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                index === selectedIndex && "bg-accent"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
