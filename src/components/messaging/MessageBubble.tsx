import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Reply, Pencil, Trash2, MapPin, ExternalLink, Check, CheckCheck, Copy, Forward, Star } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import CountryFlag from '@/components/ui/country-flag';
import { cn } from '@/lib/utils';
import { MessageReactions } from './MessageReactions';
import { MediaMessage } from './MediaMessage';
import { SharedContentCard } from './SharedContentCard';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { EmojiPicker } from './EmojiPicker';
import { SystemMessage, type SystemMessageMetadata } from './SystemMessage';
import type { MessageWithSender, SharedCourse } from '@/types/messaging';
import type { Reaction } from '@/hooks/useMessageReactions';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  showSenderInfo: boolean;
  replyToMessage?: MessageWithSender | null;
  reactions?: Reaction[];
  currentUserId?: string;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleReaction?: (emoji: string) => void;
  onForward?: () => void;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function ReadReceipt({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  if (status === 'read') {
    return <CheckCheck className="w-3.5 h-3.5 text-[hsl(38,92%,50%)]/60" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />;
  }
  return <Check className="w-3.5 h-3.5 text-muted-foreground" />;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showSenderInfo,
  replyToMessage,
  reactions = [],
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  onForward,
}: MessageBubbleProps) {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasFetchedSaved, setHasFetchedSaved] = useState(false);

  // Fetch saved state lazily when context menu opens
  const fetchSavedState = async () => {
    if (hasFetchedSaved || !message.id) return;
    const { data, error } = await supabase.rpc('is_message_saved', {
      p_message_id: message.id
    });
    if (!error && data) {
      setIsSaved(true);
    }
    setHasFetchedSaved(true);
  };

  // Handle system messages first
  if (message.message_type === 'system') {
    return (
      <div className="py-1">
        <SystemMessage
          content={message.content}
          metadata={message.media_metadata as unknown as SystemMessageMetadata | null}
          timestamp={message.created_at}
        />
      </div>
    );
  }

  const senderName = message.sender?.display_name || message.sender?.username || 'Unknown';
  const senderInitials = senderName.substring(0, 2).toUpperCase();

  // TODO: Read receipts require read_at and delivered_at fields on the messages schema.
  // Until these are added to the DB and Message type, delivery status is always 'sent'.
  const deliveryStatus = 'sent' as const;

  // Handle course share as standalone card
  if (message.message_type === 'course_share' && message.media_metadata) {
    const course = message.media_metadata as unknown as SharedCourse;
    const communityRating = course.rating;

    const courseCardContent = (
      <div className={cn("flex gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
        {/* Avatar for received */}
        {!isOwnMessage && showSenderInfo && (
          <SquircleAvatar
            src={message.sender?.profile_photo_url}
            alt={senderName}
            size={32}
            fallback={senderInitials}
            hideRing
            className="flex-shrink-0 mt-1"
          />
        )}
        {!isOwnMessage && !showSenderInfo && <div className="w-8 flex-shrink-0" />}

        <div className={cn("flex flex-col max-w-[280px]", isOwnMessage ? "items-end" : "items-start")}>
          {!isOwnMessage && showSenderInfo && (
          <span className="text-[12px] font-semibold text-[hsl(35,80%,43%)]/80 mb-1 px-1">
              {senderName}
            </span>
          )}

          <button
            onClick={() => navigate(course.course_slug ? `/courses/${course.course_slug}` : `/courses/${course.course_id}`)}
            className={cn(
              "w-full max-w-[260px] rounded-[16px] overflow-hidden text-left transition-all backdrop-blur-[16px]",
              "hover:scale-[1.02] active:scale-[0.98]",
              "bg-background/80 border border-border shadow-sm"
            )}
          >
            {/* Course Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[16px]">
              {course.course_image_url ? (
                <img src={course.course_image_url} alt={course.course_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[hsl(38,92%,50%)]/80 flex items-center justify-center">
                  <span className="text-4xl">⛳</span>
                </div>
              )}
              
              {(course.world_rank || course.country_rank) && (
                <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
                  {course.country_rank && course.country_rank <= 100 && (() => {
                    const isGBI = ['United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Isle of Man', 'Britain & Ireland'].includes(course.country_code || '');
                    const isUSA = ['United States', 'USA'].includes(course.country_code || '');
                    const flagCountry = isGBI ? 'Britain & Ireland' : isUSA ? 'USA' : (course.country_code || 'Britain & Ireland');
                    
                    return (
                      <div className="glass-badge-tight shadow-lg">
                        <CountryFlag country={flagCountry} size="md" />
                        <span className="text-white">#{course.country_rank}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-[15px] line-clamp-2 flex-1 text-foreground">
                  {course.course_name}
                </h4>
                
                {communityRating && communityRating > 0 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ClubhouseLogo size="xs" />
                    <span className="text-[14px] font-bold text-foreground/80">{communityRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              {course.location && (
                <div className="flex items-center gap-1 mt-1 text-[12px] font-normal text-muted-foreground">
                  <MapPin size={12} className="text-muted-foreground" />
                  <span className="truncate">{course.location}</span>
                </div>
              )}
              
              <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-[10px] text-[13px] font-semibold w-full bg-[hsl(38,92%,50%)]/5 text-[hsl(35,80%,43%)] border border-[hsl(38,92%,50%)]/10">
                <span>View Course</span>
                <ExternalLink size={14} />
              </div>
              {/* Timestamp */}
              <div className="flex items-center justify-end gap-1 mt-2 text-[11px] font-normal text-muted-foreground">
                {message.is_edited && <span>edited</span>}
                <span>{formatMessageTime(message.created_at)}</span>
                {isOwnMessage && <ReadReceipt status={deliveryStatus} />}
              </div>
            </div>
          </button>

          {reactions.length > 0 && (
            <MessageReactions
              reactions={reactions}
              currentUserId={currentUserId}
              onToggleReaction={(emoji) => onToggleReaction?.(emoji)}
              isOwnMessage={isOwnMessage}
            />
          )}
        </div>
      </div>
    );

    return (
      <div className="py-1">
        <ContextMenu onOpenChange={(open) => { if (open) fetchSavedState(); }}>
          <ContextMenuTrigger asChild>{courseCardContent}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={onReply} className="gap-2">
              <Reply className="h-4 w-4" />Reply
            </ContextMenuItem>
            {isOwnMessage && (
              <>
                <ContextMenuItem onClick={onEdit} className="gap-2">
                  <Pencil className="h-4 w-4" />Edit
                </ContextMenuItem>
                <ContextMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />Delete
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  }

  // Check message types
  const isMediaMessage = message.message_type === 'image' || message.message_type === 'video';
  const isVoiceNote = message.message_type === 'voice';
  const isSharedContent = message.message_type === 'tee_time' || message.message_type === 'moment_share';

  const handleEmojiSelect = (emoji: string) => {
    haptic('light');
    onToggleReaction?.(emoji);
    setShowEmojiPicker(false);
  };

  const handleCopy = () => {
    haptic('light');
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success('Copied to clipboard');
    }
  };

  const handleStar = async () => {
    haptic('light');
    try {
      const { data, error } = await supabase.rpc('toggle_saved_message', {
        p_message_id: message.id
      });
      if (error) throw error;
      
      const nowSaved = data === true;
      setIsSaved(nowSaved);
      toast.success(nowSaved ? "Saved to Caddie's Picks ⛳" : "Removed from Caddie's Picks");
    } catch {
      toast.error('Failed to save message');
    }
  };

  const bubbleContent = (
    <div className={cn("flex gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
      {/* Avatar for received */}
      {!isOwnMessage && showSenderInfo && (
        <SquircleAvatar
          src={message.sender?.profile_photo_url}
          alt={senderName}
          size={32}
          fallback={senderInitials}
          hideRing
          className="flex-shrink-0 mt-1"
        />
      )}
      {!isOwnMessage && !showSenderInfo && <div className="w-8 flex-shrink-0" />}

      <div className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "items-end" : "items-start")}>
        {/* Sender name for groups */}
        {!isOwnMessage && showSenderInfo && (
          <span className="text-[12px] font-semibold text-[hsl(35,80%,43%)]/80 mb-0.5 px-1">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "px-[14px] py-[10px] break-words relative group backdrop-blur-[12px]",
            isPressed && "opacity-80",
            isOwnMessage 
              ? "rounded-[18px_18px_4px_18px] bg-[hsl(38,92%,50%)]/[0.08] border border-[hsl(38,92%,50%)]/[0.12]"
              : "rounded-[18px_18px_18px_4px] bg-background/80 border border-border/40"
          )}
          onTouchCancel={() => setIsPressed(false)}
        >
          {/* Reply preview */}
          {replyToMessage && (
            <div className="mb-2 pl-2 border-l-2 border-[hsl(38,92%,50%)]/40 bg-foreground/[0.03] rounded-r-lg py-1.5 pr-2">
              <p className="text-[12px] font-semibold text-[hsl(35,80%,43%)]/70">
                {replyToMessage.sender?.display_name || replyToMessage.sender?.username || 'You'}
              </p>
              <p className="text-[13px] text-muted-foreground truncate">
                {replyToMessage.content || 'Media'}
              </p>
            </div>
          )}

          {/* Media content */}
          {isMediaMessage && message.media_url && (
            <MediaMessage 
              type={message.message_type as 'image' | 'video'} 
              url={message.media_url} 
              className="mb-2"
            />
          )}

          {/* Voice note */}
          {isVoiceNote && message.media_url && (
            <VoiceNotePlayer
              audioUrl={message.media_url}
              duration={(message.media_metadata as Record<string, unknown>)?.duration as number | undefined}
              isOwn={isOwnMessage}
            />
          )}

          {/* Shared golf content */}
          {isSharedContent && message.media_metadata && (
            <SharedContentCard
              messageType={message.message_type}
              metadata={message.media_metadata}
              isOwnMessage={isOwnMessage}
              className="mb-2"
            />
          )}

          {/* Message content */}
          {message.content && (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-foreground">
              {message.content}
            </p>
          )}

          {/* Timestamp + Read receipt */}
          <div className="flex items-center gap-1 mt-1 justify-end">
            {message.is_edited && <span className="text-[11px] font-normal text-muted-foreground/70">edited</span>}
            <span className="text-[11px] font-normal text-muted-foreground/70">{formatMessageTime(message.created_at)}</span>
            {isOwnMessage && <ReadReceipt status={deliveryStatus} />}
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            onToggleReaction={(emoji) => onToggleReaction?.(emoji)}
            isOwnMessage={isOwnMessage}
          />
        )}
      </div>
    </div>
  );

  return (
    <ContextMenu onOpenChange={(open) => { if (open) fetchSavedState(); }}>
      <ContextMenuTrigger asChild>{bubbleContent}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-background border border-border shadow-lg rounded-xl z-50">
        {/* Quick reactions row */}
        <div className="flex items-center justify-around py-2 px-3 border-b border-border">
          {['👍', '🔥', '⛳', '😂', '❤️', '🏌️'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                handleEmojiSelect(emoji);
              }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[hsl(38,92%,50%)]/5 rounded-full active:scale-[0.97] transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
        
        <ContextMenuItem onClick={() => { haptic('light'); onReply(); }} className="gap-3 py-2.5 cursor-pointer">
          <Reply className="h-4 w-4" />Reply
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCopy} className="gap-3 py-2.5 cursor-pointer">
          <Copy className="h-4 w-4" />Copy
        </ContextMenuItem>
        
        {onForward && (
          <ContextMenuItem onClick={() => { haptic('light'); onForward(); }} className="gap-3 py-2.5 cursor-pointer">
            <Forward className="h-4 w-4" />Forward
          </ContextMenuItem>
        )}
        
        <ContextMenuItem onClick={handleStar} className="gap-3 py-2.5 cursor-pointer">
          <Star className={cn("h-4 w-4", isSaved && "fill-current text-[hsl(38,92%,50%)]")} />
          {isSaved ? "Remove from Picks" : "Caddie's Pick ⛳"}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {isOwnMessage && (
          <>
            <ContextMenuItem onClick={() => { haptic('light'); onEdit(); }} className="gap-3 py-2.5 cursor-pointer">
              <Pencil className="h-4 w-4" />Edit
            </ContextMenuItem>
            <ContextMenuItem onClick={() => { haptic('medium'); onDelete(); }} className="gap-3 py-2.5 cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}