import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Reply, Pencil, Trash2, MapPin, ExternalLink } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { cn } from '@/lib/utils';
import { ReadReceipts } from './ReadReceipts';
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
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
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
}: MessageBubbleProps) {
  const navigate = useNavigate();
  const [isPressed, setIsPressed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Handle system messages first - they render differently
  if (message.message_type === 'system') {
    return (
      <SystemMessage
        content={message.content}
        metadata={message.media_metadata as unknown as SystemMessageMetadata | null}
        timestamp={message.created_at}
      />
    );
  }

  const senderName = message.sender?.display_name || message.sender?.username || 'Unknown';
  const senderInitials = senderName.substring(0, 2).toUpperCase();

  // Get read status from message metadata
  const messageAny = message as any;
  const isRead = !!messageAny.read_at;
  const isDelivered = !!messageAny.delivered_at;

  // Handle course share as a standalone card-bubble (no nested card effect)
  if (message.message_type === 'course_share' && message.media_metadata) {
    const course = message.media_metadata as unknown as SharedCourse;
    const communityRating = course.rating;

    const courseCardContent = (
      <div
        className={cn(
          "max-w-[280px] flex gap-2",
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar for received messages */}
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
        
        {/* Spacer when avatar is hidden */}
        {!isOwnMessage && !showSenderInfo && (
          <div className="w-8 flex-shrink-0" />
        )}

        <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
          {/* Sender name for group messages */}
          {!isOwnMessage && showSenderInfo && (
            <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
              {senderName}
            </span>
          )}

          {/* Course card IS the bubble */}
          <button
            onClick={() => navigate(course.course_slug ? `/courses/${course.course_slug}` : `/courses/${course.course_id}`)}
            className={cn(
              "w-full rounded-2xl overflow-hidden text-left transition-all",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
            style={isOwnMessage ? {
              background: 'rgba(247, 147, 30, 0.1)',
              border: '1px solid rgba(247, 147, 30, 0.2)',
            } : {
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            {/* Course Image - Full width, top of bubble */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              {course.course_image_url ? (
                <img 
                  src={course.course_image_url} 
                  alt={course.course_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                  <span className="text-4xl">⛳</span>
                </div>
              )}
              
              {/* Ranking Badges - Top Left */}
              {(course.world_rank || course.country_rank) && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {course.world_rank && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full">
                      <span className="text-yellow-400 text-xs">🌍</span>
                      <span className="text-white text-xs font-semibold">#{course.world_rank}</span>
                    </div>
                  )}
                  {course.country_rank && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full">
                      <span className="text-xs">🏆</span>
                      <span className="text-white text-xs font-semibold">#{course.country_rank}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            
            {/* Course Info */}
            <div className="p-3">
              {/* Course name with community rating on right */}
              <div className="flex items-start justify-between gap-2">
                <h4 className={cn(
                  "font-semibold text-sm line-clamp-2 flex-1",
                  isOwnMessage ? "text-primary" : "text-foreground"
                )}>
                  {course.course_name}
                </h4>
                
                {/* Clbhouz community rating - same as course details page */}
                {communityRating && communityRating > 0 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ClubhouseLogo size="xs" />
                    <span className={cn(
                      "text-sm font-bold",
                      isOwnMessage ? "text-primary" : "text-foreground"
                    )}>
                      {communityRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              
              {course.location && (
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  isOwnMessage ? "text-primary/70" : "text-muted-foreground"
                )}>
                  <MapPin size={12} />
                  <span className="truncate">{course.location}</span>
                </div>
              )}
              
              {/* View Course Button */}
              <div className={cn(
                "mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium",
                isOwnMessage 
                  ? "bg-primary/20 text-primary" 
                  : "bg-primary/10 text-primary"
              )}>
                <span>View Course</span>
                <ExternalLink size={14} />
              </div>
              
              {/* Timestamp */}
              <div className={cn(
                "flex items-center justify-end gap-1 mt-2 text-[10px]",
                isOwnMessage ? "text-primary/60" : "text-muted-foreground"
              )}>
                {message.is_edited && <span>edited</span>}
                <span>{formatMessageTime(message.created_at)}</span>
                {isOwnMessage && (
                  <ReadReceipts 
                    sent={true} 
                    delivered={isDelivered} 
                    read={isRead} 
                  />
                )}
              </div>
            </div>
          </button>

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

    // Wrap in context menu
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={cn("flex mb-3", isOwnMessage ? "justify-end" : "justify-start")}>
            {courseCardContent}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onReply} className="gap-2">
            <Reply className="h-4 w-4" />
            Reply
          </ContextMenuItem>
          {isOwnMessage && (
            <>
              <ContextMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={onDelete} 
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // Check if this is a media message
  const isMediaMessage = message.message_type === 'image' || message.message_type === 'video';
  
  // Check if this is a voice note
  const isVoiceNote = message.message_type === 'voice';
  
  // Check if this is a shared content message (excluding course_share which is handled above)
  const isSharedContent = message.message_type === 'tee_time' || 
    message.message_type === 'moment_share';

  const handleEmojiSelect = (emoji: string) => {
    onToggleReaction?.(emoji);
    setShowEmojiPicker(false);
  };

  const bubbleContent = (
    <div
      className={cn(
        "max-w-[80%] flex gap-2",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar for received messages */}
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
      
      {/* Spacer when avatar is hidden but sender info would show */}
      {!isOwnMessage && !showSenderInfo && (
        <div className="w-8 flex-shrink-0" />
      )}

      <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
        {/* Sender name for group messages */}
        {!isOwnMessage && showSenderInfo && (
          <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
            {senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 break-words relative group",
            isPressed && "opacity-80"
          )}
          style={isOwnMessage ? {
            background: 'rgba(247, 147, 30, 0.1)',
            color: '#F7931E',
            border: '1px solid rgba(247, 147, 30, 0.2)',
            borderBottomRightRadius: '6px',
          } : {
            background: 'rgba(100, 116, 139, 0.1)',
            color: '#475569',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            borderBottomLeftRadius: '6px',
          }}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          onTouchCancel={() => setIsPressed(false)}
        >
          {/* Reply preview */}
          {replyToMessage && (
            <div 
              className={cn(
                "mb-2 pb-2 border-b text-sm opacity-70",
                isOwnMessage ? "border-[#F7931E]/30" : "border-slate-500/30"
              )}
            >
              <span className="font-medium">
                {replyToMessage.sender?.display_name || replyToMessage.sender?.username || 'Unknown'}
              </span>
              <p className="truncate max-w-[200px]">{replyToMessage.content}</p>
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
              duration={(message.media_metadata as any)?.duration}
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
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Time, edited indicator, and read receipts */}
          <div 
            className={cn(
              "flex items-center gap-1 mt-1 text-[10px]",
              isOwnMessage ? "text-[#F7931E]/70" : "text-slate-500/70"
            )}
          >
            {message.is_edited && <span>edited</span>}
            <span>{formatMessageTime(message.created_at)}</span>
            {isOwnMessage && (
              <ReadReceipts 
                sent={true} 
                delivered={isDelivered} 
                read={isRead} 
              />
            )}
          </div>

          {/* Emoji picker button (visible on hover for desktop) */}
          {onToggleReaction && (
            <div className={cn(
              "absolute -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity",
              isOwnMessage ? "left-0" : "right-0"
            )}>
              <EmojiPicker 
                onSelect={handleEmojiSelect}
                triggerClassName="h-6 w-6 bg-background border shadow-sm"
              />
            </div>
          )}
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

  // Only show context menu for own messages
  if (isOwnMessage) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
            {bubbleContent}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onReply} className="gap-2">
            <Reply className="h-4 w-4" />
            Reply
          </ContextMenuItem>
          <ContextMenuItem onClick={onEdit} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={onDelete} 
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  // For received messages, only show reply option
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}>
          {bubbleContent}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onReply} className="gap-2">
          <Reply className="h-4 w-4" />
          Reply
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
