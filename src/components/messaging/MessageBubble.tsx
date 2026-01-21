import { useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical, Reply, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { MessageWithSender } from '@/types/messaging';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  showSenderInfo: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showSenderInfo,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  const senderName = message.sender?.display_name || message.sender?.username || 'Unknown';
  const senderInitials = senderName.substring(0, 2).toUpperCase();
  const timestamp = format(new Date(message.created_at), 'h:mm a');

  return (
    <div
      className={cn(
        'group flex gap-2 px-4 py-1',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar - only for received messages with sender info */}
      {!isOwnMessage && showSenderInfo && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage 
            src={message.sender?.profile_photo_url || undefined} 
            alt={senderName} 
          />
          <AvatarFallback className="text-xs bg-muted">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Spacer when no avatar but need alignment */}
      {!isOwnMessage && !showSenderInfo && (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message content */}
      <div className={cn(
        'flex flex-col max-w-[75%]',
        isOwnMessage ? 'items-end' : 'items-start'
      )}>
        {/* Sender name for group chats */}
        {!isOwnMessage && showSenderInfo && (
          <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">
            {senderName}
          </span>
        )}

        {/* Reply preview */}
        {message.reply_to && (
          <div className={cn(
            'text-xs px-3 py-1.5 rounded-t-lg border-l-2 mb-0.5',
            isOwnMessage 
              ? 'bg-primary/20 border-primary/50 text-primary-foreground/70' 
              : 'bg-muted border-muted-foreground/30 text-muted-foreground'
          )}>
            <p className="truncate max-w-[200px]">
              {message.reply_to.content}
            </p>
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          'relative rounded-2xl px-4 py-2',
          isOwnMessage 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : 'bg-muted text-foreground rounded-bl-md'
        )}>
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}>
            <span className={cn(
              'text-[10px]',
              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {timestamp}
            </span>
            {message.is_edited && (
              <span className={cn(
                'text-[10px]',
                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}>
                · edited
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions menu */}
      <div className={cn(
        'flex items-center self-center transition-opacity',
        showActions ? 'opacity-100' : 'opacity-0'
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-full hover:bg-muted">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
            <DropdownMenuItem onClick={onReply}>
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </DropdownMenuItem>
            {isOwnMessage && (
              <>
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
