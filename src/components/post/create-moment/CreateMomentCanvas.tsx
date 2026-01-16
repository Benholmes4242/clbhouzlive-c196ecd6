import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import CourseTagInput from "@/components/posts/CourseTagInput";
import { IdentitySelector } from "@/components/identity/IdentitySelector";
import { useActiveActor } from "@/context/ActiveActorContext";
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
  const { availableActors } = useActiveActor();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Fixed height textarea - no auto-grow, internal scroll only

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

  // Silently enforce max length
  const handleCaptionInputWithLimit = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // Silently enforce max length
    if (value.length > 2200) return;
    handleCaptionInput(e);
  }, [handleCaptionInput]);

  return (
    <div 
      className="flex flex-col"
      style={{
        touchAction: 'pan-y',
        background: '#F8FAFC',
      }}
      data-ecm-scroll-container="true"
    >
      {/* Caption Input - Borderless, flat design */}
      <div className="flex flex-col relative px-4 py-4">
        <textarea
          ref={textareaRef}
          className="w-full text-base leading-relaxed resize-none"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1e293b',
            minHeight: '100px',
            overflowY: 'auto',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitAppearance: 'none',
          }}
          placeholder="What's on your mind?"
          value={caption}
          onChange={handleCaptionInputWithLimit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={2200}
        />
        
        {/* Tagged entities pills only (no character count) */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {selectedTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onTagsChange(selectedTags.filter(t => t.id !== tag.id))}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                style={{
                  background: '#1e293b',
                  color: 'white',
                }}
              >
                @{tag.username || tag.name}
                <X className="w-3 h-3 opacity-60 hover:opacity-100" />
              </button>
            ))}
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
    </div>
  );
}
