import { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Reply, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadReceipts } from './ReadReceipts';
import { MessageReactions } from './MessageReactions';
import { MediaMessage } from './MediaMessage';
import { SharedContentCard } from './SharedContentCard';
import { EmojiPicker } from './EmojiPicker';
import type { MessageWithSender } from '@/types/messaging';
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
  const [isPressed, setIsPressed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const senderName = message.sender?.display_name || message.sender?.username || 'Unknown';
  const senderInitials = senderName.substring(0, 2).toUpperCase();

  // Check if this is a media message
  const isMediaMessage = message.message_type === 'image' || message.message_type === 'video';
  
  // Check if this is a shared content message
  const isSharedContent = message.message_type === 'course_share' || 
    message.message_type === 'tee_time' || 
    message.message_type === 'moment_share';

  // Get read status from message metadata
  const messageAny = message as any;
  const isRead = !!messageAny.read_at;
  const isDelivered = !!messageAny.delivered_at;

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
