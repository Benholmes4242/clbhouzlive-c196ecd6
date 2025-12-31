import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { IdentitySelector } from "@/components/identity/IdentitySelector";
import CourseTagInput from "@/components/posts/CourseTagInput";
import { StudioEdits } from "@/types/studio";
import { GolfCourse, TaggableEntity, MomentType } from "./types";
import MentionSuggestions from "./MentionSuggestions";
import MomentTypeSelector from "./MomentTypeSelector";

interface CreateMomentComposerPanelProps {
  hasMedia: boolean;
  caption: string;
  onCaptionChange: (value: string) => void;
  selectedCourse: GolfCourse | null;
  onCourseSelect: (course: GolfCourse | null) => void;
  onOpenStudio: () => void;
  availableActorsCount: number;
  currentFilter?: string;
  onTypingStateChange?: (isTyping: boolean) => void;
  selectedTags: TaggableEntity[];
  onTagsChange: (tags: TaggableEntity[]) => void;
  momentType: MomentType | null;
  onMomentTypeChange: (type: MomentType) => void;
}

export default function CreateMomentComposerPanel({
  hasMedia,
  caption,
  onCaptionChange,
  selectedCourse,
  onCourseSelect,
  onOpenStudio,
  availableActorsCount,
  currentFilter,
  onTypingStateChange,
  selectedTags,
  onTagsChange,
  momentType,
  onMomentTypeChange,
}: CreateMomentComposerPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-grow textarea - starts small, expands as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      // Min 48px (2 lines), max 100px
      textarea.style.height = `${Math.max(48, Math.min(textarea.scrollHeight, 100))}px`;
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
    
    // Add to selected tags if not already present (use taggable_entities.id)
    if (!selectedTags.some(t => t.id === mention.id)) {
      onTagsChange([...selectedTags, mention]);
    }
    
    // Focus back on textarea
    textareaRef.current?.focus();
  }, [caption, cursorPosition, onCaptionChange, selectedTags, onTagsChange]);

  // Track typing state
  const handleFocus = () => {
    setIsFocused(true);
    onTypingStateChange?.(true);
  };
  const handleBlur = () => {
    setIsFocused(false);
    onTypingStateChange?.(false);
  };

  return (
    <div 
      className="flex flex-col px-4 pt-2 gap-2.5"
      style={{
        paddingBottom: '8px',
        touchAction: 'pan-y',
        background: 'var(--cm-surface-card)',
      }}
      data-ecm-scroll-container="true"
    >
      <div className="flex flex-col gap-2.5">
        {/* Moment Type Selector - Required */}
        <MomentTypeSelector
          selected={momentType}
          onSelect={onMomentTypeChange}
        />

        {/* Posting As Selector - light row */}
        {availableActorsCount > 1 && (
          <div 
            className="flex items-center justify-between py-1"
            style={{ borderBottom: '1px solid var(--cm-border-subtle)' }}
          >
            <div>
              <span className="text-[14px] font-semibold" style={{ color: 'var(--cm-text-primary)' }}>Posting as</span>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--cm-text-primary)', opacity: 0.7 }}>
                This moment will appear on this profile
              </p>
            </div>
            <IdentitySelector compact variant="light" />
          </div>
        )}

        {/* Caption Section - slate input */}
        <div className="flex flex-col relative">
          <label 
            className="block text-sm font-semibold mb-1.5"
            style={{ color: 'var(--cm-text-primary)' }}
          >
            Add a caption
          </label>
          
          <textarea
            ref={textareaRef}
            className="w-full rounded-xl px-3 py-3 text-[14px] leading-relaxed resize-none transition-colors"
            style={{
              background: 'var(--cm-surface-input)',
              border: '1px solid var(--cm-border-subtle)',
              color: 'var(--cm-text-primary)',
              minHeight: '64px',
              maxHeight: '120px',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              WebkitAppearance: 'none'
            }}
            placeholder="What happened here?"
            value={caption}
            onChange={handleCaptionInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={2200}
          />
          
          {/* Character count and tagged entities - same row */}
          {(caption.length > 0 || selectedTags.length > 0) && (
            <div className="flex items-start justify-between gap-2 mt-1">
              {/* Tagged entities confirmation chips */}
              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: 'var(--cm-text-tertiary)' }}>Tagged:</span>
                  {selectedTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onTagsChange(selectedTags.filter(t => t.id !== tag.id))}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                      style={{
                        background: 'var(--cm-accent-subtle)',
                        color: 'var(--cm-accent)',
                        border: '1px solid rgba(247, 147, 30, 0.25)',
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
                  className="text-[10px] flex-shrink-0"
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

        {/* Course Tagging Section */}
        <div className="flex flex-col">
          <CourseTagInput
            onCourseSelect={onCourseSelect}
            selectedCourse={selectedCourse}
            placeholder="Where was this played?"
            variant="light"
          />
          <p 
            className="mt-1 text-[10px]"
            style={{ color: 'var(--cm-text-tertiary)' }}
          >
            Tag a course to help others discover your round
          </p>
        </div>

        {/* Studio Entry Card - Apple Settings row style */}
        <button
          onClick={onOpenStudio}
          disabled={!hasMedia}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200"
          style={{
            background: 'var(--cm-surface-card)',
            border: '1px solid var(--cm-border-subtle)',
            opacity: hasMedia ? 1 : 0.5,
            cursor: hasMedia ? 'pointer' : 'not-allowed'
          }}
          title={!hasMedia ? 'Add media to open Studio' : 'Enhance your moment'}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                background: 'var(--cm-surface-alt)',
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--cm-accent)' }} />
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--cm-text-primary)' }}
            >
              {currentFilter && currentFilter !== 'normal' 
                ? `Filter: ${currentFilter}` 
                : 'Enhance your moment'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--cm-icon-secondary)' }} />
        </button>
      </div>
    </div>
  );
}
