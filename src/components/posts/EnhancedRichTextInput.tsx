import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useTaggableEntities } from '@/hooks/useTaggableEntities';
import TagAutocomplete from './TagAutocomplete';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
  profile_image_url?: string | null;
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

const EnhancedRichTextInput: React.FC<EnhancedRichTextInputProps> = ({
  value,
  onChange,
  onTagsChange,
  placeholder = 'Write about your moment...',
  disabled = false,
  className = '',
  selectedTags = []
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
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
    const match = textBeforeCursor.match(mentionRegex);
    
    if (match) {
      const query = match[1];
      const mentionStart = cursorPosition - match[0].length;
      
      setMentionPosition({
        start: mentionStart,
        end: mentionStart + match[0].length
      });
      
      if (query.length >= 0) {
        searchEntities(query);
        setShowSuggestions(true);
        setSelectedIndex(0);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value, searchEntities]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || entities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < entities.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : entities.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (entities[selectedIndex]) {
          handleSelectEntity(entities[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  const handleSelectEntity = (entity: TaggableEntity) => {
    console.log('EnhancedRichTextInput: Selecting entity:', entity);
    console.log('EnhancedRichTextInput: Current selectedTags:', selectedTags);
    console.log('EnhancedRichTextInput: onTagsChange callback exists:', !!onTagsChange);
    
    const newText = 
      value.slice(0, mentionPosition.start) +
      `@${entity.name} ` +
      value.slice(mentionPosition.end);
    
    onChange(newText);
    
    // Add to selected tags if callback provided
    if (onTagsChange && !selectedTags.find(tag => tag.id === entity.id)) {
      const newTags = [...selectedTags, entity];
      console.log('EnhancedRichTextInput: Adding entity to tags, new tags:', newTags);
      onTagsChange(newTags);
    } else {
      console.log('EnhancedRichTextInput: Not adding tag - callback missing or tag already exists');
    }
    
    setShowSuggestions(false);
    
    // Focus back to textarea and position cursor
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const newCursorPosition = mentionPosition.start + `@${entity.name} `.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full min-h-20 max-h-50 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none ${className}`}
        style={{ minHeight: '80px' }}
      />
      
      <TagAutocomplete
        entities={entities}
        isVisible={showSuggestions}
        onSelect={handleSelectEntity}
        selectedIndex={selectedIndex}
        loading={loading}
      />
    </div>
  );
};

export default EnhancedRichTextInput;