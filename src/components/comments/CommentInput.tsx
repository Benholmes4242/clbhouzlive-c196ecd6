import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X, Pencil, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CommentingAsIndicator } from '@/components/comments/CommentingAsIndicator';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { MentionBottomSheet, MentionSuggestion } from '@/components/post/post-wizard/steps/MentionBottomSheet';
import type { CommentWithReplies, CommentReply } from '@/hooks/useCommentsWithReplies';

interface ReplyingToState {
  topLevelId: string;
  displayName: string;
}

interface CommentInputProps {
  isDark: boolean;
  isGrey: boolean;
  newComment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  
  isAddingComment: boolean;
  isUpdatingComment: boolean;
  editingComment: CommentWithReplies | CommentReply | null;
  onCancelEdit: () => void;
  replyingTo: ReplyingToState | null;
  onCancelReply: () => void;
  keyboardOffset: number;
  activeActor?: { avatarUrl?: string; name?: string } | null;
  // Emoji
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  // Mentions
  showMentions: boolean;
  onMentionsOpenChange: (open: boolean) => void;
  mentionQuery: string;
  onMentionSelect: (mention: MentionSuggestion) => void;
  // Refs
  inputRef: React.RefObject<HTMLTextAreaElement>;
  // Photo attachment
  attachedPhoto?: { file: File; previewUrl: string } | null;
  onRemovePhoto?: () => void;
  sheetHeight?: string;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  isDark,
  isGrey,
  newComment,
  onCommentChange,
  onSubmit,
  
  isAddingComment,
  isUpdatingComment,
  editingComment,
  onCancelEdit,
  replyingTo,
  onCancelReply,
  keyboardOffset,
  activeActor,
  showEmojiPicker,
  onToggleEmojiPicker,
  showMentions,
  onMentionsOpenChange,
  mentionQuery,
  onMentionSelect,
  inputRef,
  attachedPhoto,
  onRemovePhoto,
  sheetHeight = '75dvh',
}) => {
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
  }, [newComment, inputRef]);

  const handleEmojiSelect = useCallback((emoji: any) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = newComment.slice(0, start) + emoji.native + newComment.slice(end);
      onCommentChange(newValue);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
      });
    } else {
      onCommentChange(newComment + emoji.native);
    }
  }, [newComment, onCommentChange, inputRef]);


  const hasContent = newComment.trim().length > 0 || !!attachedPhoto;

  return (
    <>
      {/* Input bar */}
      <motion.div
        className="flex-shrink-0 px-4 py-3"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          background: isDark
            ? 'rgba(13, 13, 13, 0.98)'
            : isGrey
              ? 'rgba(248, 250, 252, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid hsl(var(--border) / 0.5)',
        }}
        animate={{ y: -keyboardOffset }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      >
        <CommentingAsIndicator isDark={isDark} />

        {/* Edit indicator */}
        <AnimatePresence>
          {editingComment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 36 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="flex items-center justify-between mb-2 px-1 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[13px] text-amber-700 font-medium">Editing comment</span>
              </div>
              <button
                onClick={onCancelEdit}
                className="w-11 h-11 flex items-center justify-center rounded-full -mr-1 hover:bg-amber-100 transition-colors"
              >
                <X className="w-4 h-4 text-amber-600" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply indicator */}
        <AnimatePresence>
          {replyingTo && !editingComment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 28 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="flex items-center justify-between mb-2 overflow-hidden"
            >
              <span className={cn("text-[13px]", isDark ? "text-white/60" : "text-muted-foreground")}>
                Replying to <span className="font-medium">{replyingTo.displayName}</span>
              </span>
              <button
                onClick={onCancelReply}
                className={cn(
                  "w-11 h-11 flex items-center justify-center rounded-full transition-colors -mr-1",
                  isDark ? "hover:bg-white/10" : "hover:bg-muted"
                )}
              >
                <X className={cn("w-4 h-4", isDark ? "text-white/60" : "text-muted-foreground")} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo attachment preview */}
        <AnimatePresence>
          {attachedPhoto && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative mb-2 overflow-hidden"
            >
              <div className="relative inline-block">
                <img
                  src={attachedPhoto.previewUrl}
                  alt="Attachment preview"
                  className={cn(
                    "w-20 h-20 object-cover rounded-lg border",
                    isDark ? "border-white/10" : "border-border/50"
                  )}
                />
                <button
                  onClick={onRemovePhoto}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center shadow-sm"
                >
                  <X className="w-3 h-3 text-destructive-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={32}
              src={activeActor?.avatarUrl}
              alt={activeActor?.name || 'You'}
              fallback={activeActor?.name?.charAt(0) || '?'}
              hideRing
            />
          </div>

          <motion.div
            className={cn(
              "flex-1 flex items-center rounded-[22px] pl-4 pr-1.5",
              "transition-all duration-200",
              editingComment
                ? "border border-amber-300 bg-amber-50 focus-within:border-amber-400"
                : isDark
                  ? "bg-white/10 border border-white/15 focus-within:border-white/25 focus-within:bg-white/12"
                  : "bg-background border border-border/50 focus-within:border-border focus-within:shadow-sm"
            )}
            animate={{}}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ paddingTop: 8, paddingBottom: 8 }}
          >
            <div className="flex-1 relative py-1" style={{ fontSize: 14 }}>
              {/* Mirror overlay for @mention highlighting */}
              <div
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 pointer-events-none",
                  "text-[14px] leading-[20px] whitespace-pre-wrap break-words overflow-hidden"
                )}
                style={{ height: inputRef.current?.style.height }}
              >
                {newComment
                  ? newComment.split(/(@\w+)/).map((part, i) =>
                      /^@\w+$/.test(part)
                        ? <span key={i} style={{ color: '#f59e0b' }}>{part}</span>
                        : <span key={i} className={editingComment ? 'text-amber-900' : isDark ? 'text-white' : 'text-foreground'}>{part}</span>
                    )
                  : null
                }
              </div>
              <textarea
                ref={inputRef}
                placeholder={
                  editingComment
                    ? "Edit your comment..."
                    : replyingTo
                      ? `Reply to ${replyingTo.displayName}...`
                      : "Share your thoughts…use @ to mention"
                }
                value={newComment}
                onChange={(e) => onCommentChange(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => { if (showEmojiPicker) onToggleEmojiPicker(); }}
                rows={1}
                className={cn(
                  'relative w-full bg-transparent resize-none',
                  'text-[14px] leading-[20px]',
                  'outline-none border-none',
                  newComment
                    ? 'text-transparent caret-current'
                    : editingComment
                      ? 'text-amber-700 placeholder:text-amber-400'
                      : isDark
                        ? 'text-white placeholder:text-white/40'
                        : 'text-foreground placeholder:text-muted-foreground',
                  isDark && !editingComment ? '[caret-color:white]' : '[caret-color:theme(colors.foreground)]'
                )}
                style={{
                  maxHeight: '100px',
                  overflowY: 'hidden',
                  transition: 'height 0.1s ease-out',
                }}
              />
            </div>

          <div className="flex flex-col items-center justify-end gap-0.5 pb-0.5 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onToggleEmojiPicker}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-colors emoji-button",
                  isDark
                    ? "text-white/40 hover:text-white/60"
                    : "text-muted-foreground hover:text-foreground",
                  showEmojiPicker && (isDark ? "text-white/80" : "text-foreground")
                )}
              >
                <Smile className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88 }}
                animate={{
                  rotate: (isAddingComment || isUpdatingComment) ? 45 : 0,
                  scale: hasContent ? 1.02 : 1,
                }}
                onClick={onSubmit}
                disabled={!hasContent || isAddingComment || isUpdatingComment}
                className={cn(
                  'w-8 h-8 rounded-full relative overflow-hidden',
                  'flex items-center justify-center',
                  'transition-all duration-200',
                  hasContent
                    ? editingComment
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25'
                      : isDark
                        ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/15'
                        : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
                    : isDark
                      ? 'bg-white/12 text-white/35'
                      : 'bg-muted text-muted-foreground/35',
                  'disabled:cursor-not-allowed'
                )}
              >
                <motion.div
                  animate={(isAddingComment || isUpdatingComment) ? { scale: 0.9, opacity: 0.7 } : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  {editingComment ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Emoji picker backdrop */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[105]"
            style={{ pointerEvents: 'auto' }}
            onClick={onToggleEmojiPicker}
          />
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "fixed z-[110] emoji-picker-container",
              "rounded-[16px] overflow-hidden shadow-xl"
            )}
            style={{
              bottom: `calc(${sheetHeight} - 60px)`,
              left: '16px',
              right: '16px',
              maxWidth: 'calc(100% - 32px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme={isDark ? 'dark' : 'light'}
              previewPosition="none"
              skinTonePosition="none"
              maxFrequentRows={2}
              perLine={8}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mention bottom sheet */}
      <MentionBottomSheet
        open={showMentions}
        onOpenChange={onMentionsOpenChange}
        query={mentionQuery}
        onSelect={onMentionSelect}
        zIndex={110}
        bottomOffset={Math.round(window.innerHeight * 0.75) + 12 + keyboardOffset}
      />
    </>
  );
};

export default CommentInput;
