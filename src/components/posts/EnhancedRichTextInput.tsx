import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Smile } from 'lucide-react';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';
import TagAutocomplete from './TagAutocomplete';
import HashtagAutocomplete from './HashtagAutocomplete';
import EmojiPicker from './EmojiPicker';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  profile_image_url?: string | null;
}

interface TaggedEntityWithPosition extends TaggableEntity {
  startIndex: number;
  endIndex: number;
}

interface HashtagSuggestion {
  tag: string;
  count: number;
}

interface EnhancedRichTextInputProps {
  value: string;
  onChange: (text: string) => void;
  onTagsChange?: (tags: TaggableEntity[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  selectedTags?: TaggableEntity[];
}

const popularHashtags: HashtagSuggestion[] = [
  { tag: '#holeinone', count: 1234 },
  { tag: '#golfhumour', count: 987 },
  { tag: '#bestround', count: 856 },
  { tag: '#golflife', count: 743 },
  { tag: '#weekendgolf', count: 621 },
  { tag: '#golfcourse', count: 543 },
  { tag: '#putting', count: 432 },
  { tag: '#golftips', count: 321 },
  { tag: '#golfswing', count: 298 },
  { tag: '#pga', count: 276 }
];

const EnhancedRichTextInput: React.FC<EnhancedRichTextInputProps> = ({
  value,
  onChange,
  onTagsChange,
  placeholder = 'Write about your moment...',
  disabled = false,
  className = '',
  selectedTags = []
}) => {
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [hashtagPosition, setHashtagPosition] = useState({ start: 0, end: 0 });
  const [hashtagSuggestions, setHashtagSuggestions] = useState<HashtagSuggestion[]>([]);
  const [taggedEntities, setTaggedEntities] = useState<Map<string, TaggedEntityWithPosition>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { entities, loading, searchEntities } = useTaggableEntities();

  // Handle @ mention detection
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    
    // Look for @ followed by word characters at the end of the text before cursor
    const mentionRegex = /@(\w*)$/;
    const mentionMatch = textBeforeCursor.match(mentionRegex);
    
    // Look for # followed by word characters at the end of the text before cursor
    const hashtagRegex = /#(\w*)$/;
    const hashtagMatch = textBeforeCursor.match(hashtagRegex);
    
    if (mentionMatch && !hashtagMatch) {
      const query = mentionMatch[1];
      const mentionStart = cursorPosition - mentionMatch[0].length;
      
      setMentionPosition({
        start: mentionStart,
        end: mentionStart + mentionMatch[0].length
      });
      
      searchEntities(query);
      setShowMentionSuggestions(true);
      setShowHashtagSuggestions(false);
      setSelectedIndex(0);
    } else if (hashtagMatch && !mentionMatch) {
      const query = hashtagMatch[1].toLowerCase();
      const hashtagStart = cursorPosition - hashtagMatch[0].length;
      
      setHashtagPosition({
        start: hashtagStart,
        end: hashtagStart + hashtagMatch[0].length
      });
      
      // Filter hashtags based on query
      const filtered = popularHashtags.filter(h => 
        h.tag.toLowerCase().includes('#' + query)
      );
      setHashtagSuggestions(filtered);
      setShowHashtagSuggestions(true);
      setShowMentionSuggestions(false);
      setSelectedIndex(0);
    } else {
      setShowMentionSuggestions(false);
      setShowHashtagSuggestions(false);
    }
  }, [value, searchEntities]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const hasSuggestions = (showMentionSuggestions && entities.length > 0) || 
                          (showHashtagSuggestions && hashtagSuggestions.length > 0);
    
    if (!hasSuggestions) return;

    const maxItems = showMentionSuggestions ? entities.length : hashtagSuggestions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < maxItems - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : maxItems - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (showMentionSuggestions && entities[selectedIndex]) {
          handleSelectEntity(entities[selectedIndex]);
        } else if (showHashtagSuggestions && hashtagSuggestions[selectedIndex]) {
          handleSelectHashtag(hashtagSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowMentionSuggestions(false);
        setShowHashtagSuggestions(false);
        break;
    }
  };

  const handleSelectEntity = (entity: TaggableEntity) => {
    const displayText = entity.username ? `@${entity.username}` : `@${entity.name}`;
    const newText = 
      value.slice(0, mentionPosition.start) +
      `${displayText} ` +
      value.slice(mentionPosition.end);
    
    onChange(newText);
    
    // Track the tagged entity with its position for database storage
    const tagKey = `${mentionPosition.start}-${displayText}`;
    const newTaggedEntities = new Map(taggedEntities);
    newTaggedEntities.set(tagKey, {
      ...entity,
      startIndex: mentionPosition.start,
      endIndex: mentionPosition.start + displayText.length
    });
    setTaggedEntities(newTaggedEntities);
    
    // Add to selected tags if callback provided
    if (onTagsChange && !selectedTags.find(tag => tag.id === entity.id)) {
      const newTags = [...selectedTags, entity];
      onTagsChange(newTags);
    }
    
    setShowMentionSuggestions(false);
    
    // Focus back to textarea and position cursor
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const newCursorPosition = mentionPosition.start + `${displayText} `.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleSelectHashtag = (hashtag: HashtagSuggestion) => {
    const newText = 
      value.slice(0, hashtagPosition.start) +
      `${hashtag.tag} ` +
      value.slice(hashtagPosition.end);
    
    onChange(newText);
    setShowHashtagSuggestions(false);
    
    // Focus back to textarea and position cursor
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const newCursorPosition = hashtagPosition.start + `${hashtag.tag} `.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const newText = 
      value.slice(0, cursorPosition) +
      emoji +
      value.slice(cursorPosition);
    
    onChange(newText);
    setShowEmojiPicker(false);
    
    // Focus back to textarea and position cursor after emoji
    setTimeout(() => {
      const newCursorPosition = cursorPosition + emoji.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Auto-resize textarea with min/max height constraints
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const lineHeight = 24; // Approximate line height in pixels
      const minLines = 3;
      const maxLines = 6;
      const minHeight = lineHeight * minLines;
      const maxHeight = lineHeight * maxLines;
      
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      
      textarea.style.height = newHeight + 'px';
    }
  }, [value]);

  // Clean up tagged entities when text changes
  useEffect(() => {
    if (taggedEntities.size > 0) {
      const newTaggedEntities = new Map();
      taggedEntities.forEach((entity, key) => {
        const displayText = entity.username ? `@${entity.username}` : `@${entity.name}`;
        if (value.includes(displayText)) {
          newTaggedEntities.set(key, entity);
        }
      });
      
      if (newTaggedEntities.size !== taggedEntities.size) {
        setTaggedEntities(newTaggedEntities);
      }
    }
  }, [value, taggedEntities]);

  return (
    <div className="relative">
      <div className="relative rounded-xl border border-gray-200 bg-white transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3.5 py-3.5 pr-12 text-[15px] leading-6 border-0 rounded-xl bg-transparent resize-none placeholder:text-gray-400 focus:outline-none ${className}`}
          style={{ 
            minHeight: '72px', // 3 lines * 24px line height
          }}
        />
        
        {/* Enhanced Emoji Button */}
        <button
          type="button"
          onClick={() => {
            console.log('Emoji button clicked!');
            setShowEmojiPicker(!showEmojiPicker);
          }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors z-20 focus:outline-none"
          disabled={disabled}
          title="Add emoji 😄"
          aria-label="Add emoji"
        >
          <span className="text-sm">😄</span>
        </button>
      </div>
      
      {/* Enhanced Mention Autocomplete with improved styling */}
      <TagAutocomplete
        entities={entities}
        isVisible={showMentionSuggestions}
        onSelect={handleSelectEntity}
        selectedIndex={selectedIndex}
        loading={loading}
      />
      
      {/* Hashtag Autocomplete */}
      <HashtagAutocomplete
        hashtags={hashtagSuggestions}
        isVisible={showHashtagSuggestions}
        onSelect={handleSelectHashtag}
        selectedIndex={selectedIndex}
      />
      
      {/* Emoji Picker */}
      <EmojiPicker
        isVisible={showEmojiPicker}
        onSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />
      
      {/* Helper text for tagging */}
      {(showMentionSuggestions || showHashtagSuggestions) && (
        <div className="absolute top-full left-0 right-0 text-xs text-gray-500 mt-1 px-1">
          Use ↑↓ arrows to navigate, Enter to select, Esc to cancel
        </div>
      )}
    </div>
  );
};

export default EnhancedRichTextInput;