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

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
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
  const handleFocus = () => onTypingStateChange?.(true);
  const handleBlur = () => onTypingStateChange?.(false);

  return (
    <div 
      className={`composer-scroll flex h-full flex-col px-4 gap-4 overflow-auto ${hasMedia ? '' : 'pt-4'}`}
      style={{
        paddingBottom: '12px',
        maxHeight: 'var(--composer-height)',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
      data-ecm-scroll-container="true"
    >
      <div className="flex flex-col gap-3 flex-1">
        {/* Posting As Selector */}
        {availableActorsCount > 1 && (
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <span className="text-xs text-white/60">Posting as:</span>
            <IdentitySelector compact />
          </div>
        )}

        {/* Caption Section */}
        <div className="flex flex-col relative">
          <label className="block text-base font-semibold text-white mb-3">Add a caption</label>
          
          <textarea
            ref={textareaRef}
            className="caption-input w-full rounded-xl px-4 py-3 text-[15px] leading-snug resize-none text-white placeholder:text-white/50 focus:outline-none transition-all duration-200 min-h-[80px]"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
            placeholder="Write a caption..."
            value={caption}
            onChange={handleCaptionInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            maxLength={2200}
          />
          
          {/* Character count */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1 text-xs text-white/40">
              <AtSign className="w-3 h-3" />
              <span>Tag someone with @</span>
            </div>
            <span className={`text-xs ${caption.length > 2000 ? 'text-amber-400' : 'text-white/40'}`}>
              {caption.length}/2200
            </span>
          </div>

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
          />
          <p className="mt-2 text-xs text-white/60">
            Tag a course to help other golfers discover your round
          </p>
        </div>

        {/* Studio Entry Card - Premium redesign */}
        <button
          onClick={onOpenStudio}
          disabled={!hasMedia}
          className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 147, 30, 0.12) 0%, rgba(255, 200, 100, 0.08) 100%)',
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
            border: '1px solid rgba(255, 147, 30, 0.25)',
            opacity: hasMedia ? 1 : 0.5,
            cursor: hasMedia ? 'pointer' : 'not-allowed'
          }}
          title={!hasMedia ? 'Add media to open Studio' : 'Enhance your moment'}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #FFB366 0%, #FF9933 100%)',
                boxShadow: '0 4px 12px rgba(255, 147, 30, 0.3)'
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-white">
                Enhance your moment
              </div>
              <div className="text-xs text-white/60">
                {currentFilter && currentFilter !== 'normal' 
                  ? `Filter: ${currentFilter}` 
                  : 'Add filters, text & more'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </button>
      </div>
    </div>
  );
}
