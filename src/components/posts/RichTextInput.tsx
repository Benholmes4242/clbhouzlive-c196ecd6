import React, { useState, useRef, useEffect } from 'react';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedTags: TaggableEntity[];
  className?: string;
  disabled?: boolean;
}

const RichTextInput: React.FC<RichTextInputProps> = ({
  value,
  onChange,
  placeholder = "Write your caption...",
  selectedTags,
  className = "",
  disabled = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [displayText, setDisplayText] = useState(value);

  // Update display text when value or tags change
  useEffect(() => {
    if (selectedTags.length > 0) {
      let formattedText = value;
      
      // Replace tagged usernames with styled versions
      selectedTags.forEach(tag => {
        const username = tag.username || tag.name;
        const tagRegex = new RegExp(`@${username}\\b`, 'g');
        formattedText = formattedText.replace(tagRegex, `@${username}`);
      });
      
      setDisplayText(formattedText);
    } else {
      setDisplayText(value);
    }
  }, [value, selectedTags]);

  // Function to render text with styled tags
  const renderFormattedText = (text: string) => {
    if (selectedTags.length === 0) {
      return [{ type: 'text', content: text, key: 'full-text' }];
    }

    const parts = [];
    let lastIndex = 0;
    
    // Find all mentions in the text
    selectedTags.forEach(tag => {
      const username = tag.username || tag.name;
      const mentionRegex = new RegExp(`(@${username})\\b`, 'g');
      let match;
      
      while ((match = mentionRegex.exec(text)) !== null) {
        // Add text before the mention
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            content: text.slice(lastIndex, match.index),
            key: `text-${lastIndex}`
          });
        }
        
        // Add the styled mention
        parts.push({
          type: 'mention',
          content: match[1],
          key: `mention-${match.index}`,
          tag: tag
        });
        
        lastIndex = match.index + match[1].length;
      }
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
        key: `text-${lastIndex}`
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text, key: 'full-text' }];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const textParts = renderFormattedText(displayText);

  return (
    <div className={`relative ${className}`}>
      {/* Hidden textarea for actual input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-sq-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent bg-transparent relative z-10"
        style={{ 
          color: 'transparent',
          caretColor: '#000',
          background: 'transparent'
        }}
        rows={4}
      />
      
      {/* Overlay div showing formatted text */}
      <div 
        className="absolute inset-0 p-3 pointer-events-none z-0 whitespace-pre-wrap break-words overflow-hidden"
        style={{
          fontSize: 'inherit',
          lineHeight: 'inherit',
          border: '1px solid transparent', // Match textarea border
        }}
      >
        {value === '' ? (
          <span className="text-gray-500">{placeholder}</span>
        ) : (
          textParts.map((part) => (
            part.type === 'mention' ? (
              <span 
                key={part.key}
                className="text-blue-600 font-medium bg-blue-50 px-1 rounded"
                style={{ textDecoration: 'none' }}
              >
                {part.content}
              </span>
            ) : (
              <span key={part.key} className="text-gray-900">
                {part.content}
              </span>
            )
          ))
        )}
      </div>
    </div>
  );
};

export default RichTextInput;