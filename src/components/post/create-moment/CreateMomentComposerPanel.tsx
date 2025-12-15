import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, Sparkles, AtSign } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { IdentitySelector } from "@/components/identity/IdentitySelector";
import CourseTagInput from "@/components/posts/CourseTagInput";
import { StudioEdits } from "@/types/studio";
import { GolfCourse } from "./types";
import MentionSuggestions from "./MentionSuggestions";

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
  const handleMentionSelect = useCallback((mention: { id: string; name: string; username: string }) => {
    const textBeforeCursor = caption.slice(0, cursorPosition);
    const textAfterCursor = caption.slice(cursorPosition);
    
    // Find and replace the @query with the selected mention
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const newCaption = `${beforeMention}@${mention.username} ${textAfterCursor}`;
    
    onCaptionChange(newCaption);
    setShowMentions(false);
    setMentionQuery('');
    
    // Focus back on textarea
    textareaRef.current?.focus();
  }, [caption, cursorPosition, onCaptionChange]);

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
      className="flex flex-col px-4 gap-2 overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Posting As Row - fixed 44px */}
      {availableActorsCount > 1 && (
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{ height: '44px' }}
        >
          <span className="text-[11px] text-white/50">Posting as</span>
          <IdentitySelector compact variant="dark" />
        </div>
      )}

      {/* Caption Field - fixed 56px collapsed, auto-expands when typing */}
      <div className="flex flex-col relative flex-shrink-0">
        <textarea
          ref={textareaRef}
          className="caption-input w-full rounded-xl px-3 py-2 text-[14px] leading-snug resize-none text-white placeholder:text-white/50 focus:outline-none"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            height: '56px',
            minHeight: '56px',
            maxHeight: '80px'
          }}
          placeholder="Add a caption..."
          value={caption}
          onChange={handleCaptionInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={2200}
        />
        
        {/* Helper row - compact */}
        {(isFocused || caption.length > 0) && (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-[10px] text-white/35">
              <AtSign className="w-2.5 h-2.5" />
              <span>@mention</span>
            </div>
            {caption.length > 0 && (
              <span className={`text-[10px] ${caption.length > 2000 ? 'text-amber-400' : 'text-white/35'}`}>
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

      {/* Course Input - fixed 48px */}
      <div className="flex-shrink-0" style={{ height: '48px' }}>
        <CourseTagInput
          onCourseSelect={onCourseSelect}
          selectedCourse={selectedCourse}
          placeholder="Where was this played?"
        />
      </div>

      {/* Enhance Card - compact single line, fixed 52px */}
      <button
        onClick={onOpenStudio}
        disabled={!hasMedia}
        className="w-full flex items-center justify-between px-3 rounded-xl flex-shrink-0"
        style={{
          height: '52px',
          background: 'linear-gradient(135deg, rgba(255, 147, 30, 0.10) 0%, rgba(255, 200, 100, 0.06) 100%)',
          border: '1px solid rgba(255, 147, 30, 0.20)',
          opacity: hasMedia ? 1 : 0.5,
          cursor: hasMedia ? 'pointer' : 'not-allowed'
        }}
        title={!hasMedia ? 'Add media to open Studio' : 'Enhance your moment'}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #FFB366 0%, #FF9933 100%)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[13px] font-medium text-white">
            {currentFilter && currentFilter !== 'normal' 
              ? `Filter: ${currentFilter}` 
              : 'Enhance your moment'}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40" />
      </button>
    </div>
  );
}
