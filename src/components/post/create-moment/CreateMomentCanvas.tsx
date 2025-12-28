import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import CourseTagInput from "@/components/posts/CourseTagInput";
import { GolfCourse, TaggableEntity } from "./types";
import MentionSuggestions from "./MentionSuggestions";

interface CreateMomentCanvasProps {
  hasMedia: boolean;
  caption: string;
  onCaptionChange: (value: string) => void;
  selectedCourse: GolfCourse | null;
  onCourseSelect: (course: GolfCourse | null) => void;
  onTypingStateChange?: (isTyping: boolean) => void;
  selectedTags: TaggableEntity[];
  onTagsChange: (tags: TaggableEntity[]) => void;
}

/**
 * CreateMomentCanvas - Simplified canvas-first composer
 * Only shows: Caption input (larger) + Course picker (optional)
 * No configuration clutter - that's handled by bottom sheets
 */
export default function CreateMomentCanvas({
  hasMedia,
  caption,
  onCaptionChange,
  selectedCourse,
  onCourseSelect,
  onTypingStateChange,
  selectedTags,
  onTagsChange,
}: CreateMomentCanvasProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Auto-grow textarea - larger default, more breathing room
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Min 64px (3 lines), max 140px - more vertical space
      textarea.style.height = `${Math.max(64, Math.min(textarea.scrollHeight, 140))}px`;
    }
  }, [caption]);

  // Handle caption input with mention detection
  const handleCaptionInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    onCaptionChange(value);
    setCursorPosition(cursor);

    // Detect @mention trigger
    const textBeforeCursor = value.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [onCaptionChange]);

  // Handle mention selection
  const handleMentionSelect = useCallback((mention: TaggableEntity) => {
    const textBeforeCursor = caption.slice(0, cursorPosition);
    const textAfterCursor = caption.slice(cursorPosition);
    
    // Find and replace the @query with the selected mention
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const displayName = mention.username || mention.name;
    const newCaption = `${beforeMention}@${displayName} ${textAfterCursor}`;
    
    onCaptionChange(newCaption);
    setShowMentions(false);
    setMentionQuery('');
    
    // Add to selected tags if not already present
    if (!selectedTags.some(t => t.id === mention.id)) {
      onTagsChange([...selectedTags, mention]);
    }
    
    // Focus back on textarea
    textareaRef.current?.focus();
  }, [caption, cursorPosition, onCaptionChange, selectedTags, onTagsChange]);

  // Track typing state
  const handleFocus = () => onTypingStateChange?.(true);
  const handleBlur = () => onTypingStateChange?.(false);

  return (
    <div 
      className="flex flex-col px-4 gap-4"
      style={{
        paddingTop: '12px',
        paddingBottom: '12px',
        touchAction: 'pan-y',
        background: 'var(--cm-surface-card)',
      }}
      data-ecm-scroll-container="true"
    >
      {/* Caption Input - Large, emotional core */}
      <div className="flex flex-col relative">
        <textarea
          ref={textareaRef}
          className="w-full rounded-xl px-4 py-3 text-[15px] leading-relaxed resize-none transition-colors"
          style={{
            background: 'var(--cm-surface-input)',
            border: '1px solid var(--cm-border-subtle)',
            color: 'var(--cm-text-primary)',
            minHeight: '64px',
            maxHeight: '140px',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitAppearance: 'none'
          }}
          placeholder="Add a caption..."
          value={caption}
          onChange={handleCaptionInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={2200}
        />
        
        {/* Character count and tagged entities */}
        {(caption.length > 0 || selectedTags.length > 0) && (
          <div className="flex items-start justify-between gap-2 mt-2">
            {/* Tagged entities pills */}
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => onTagsChange(selectedTags.filter(t => t.id !== tag.id))}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                    style={{
                      background: 'var(--cm-surface-slate)',
                      color: 'white',
                      border: '1px solid var(--cm-border)',
                    }}
                  >
                    @{tag.username || tag.name}
                    <X className="w-3 h-3 opacity-60 hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : (
              <div />
            )}
            
            {/* Character count */}
            {caption.length > 0 && (
              <span 
                className="text-[11px] flex-shrink-0"
                style={{ color: caption.length > 2000 ? '#D97706' : 'var(--cm-text-tertiary)' }}
              >
                {caption.length}/2200
              </span>
            )}
          </div>
        )}

        {/* Mentions dropdown */}
        {showMentions && (
          <MentionSuggestions
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentions(false)}
          />
        )}
      </div>

      {/* Course Tagging - Optional, secondary */}
      <div className="flex flex-col">
        <CourseTagInput
          onCourseSelect={onCourseSelect}
          selectedCourse={selectedCourse}
          placeholder="Where was this played?"
          variant="light"
        />
      </div>
    </div>
  );
}
