import { useEffect, useRef, useState, useCallback } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useMessaging } from '@/hooks/useMessaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { cn } from '@/lib/utils';
import type { MessageWithSender, ConversationListItem } from '@/types/messaging';

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  
  return format(date, 'MMMM d, yyyy');
}

function getConversationDisplayInfo(
  conversation: ConversationListItem | undefined,
  currentUserId: string | undefined
) {
  if (!conversation) {
    return { name: 'Chat', avatar: null, initials: 'CH' };
  }

  if (conversation.type === 'direct' && conversation.other_user) {
    const name = conversation.other_user.display_name || conversation.other_user.username;
    return {
      name,
      avatar: conversation.other_user.profile_photo_url,
      initials: name.substring(0, 2).toUpperCase(),
    };
  }

  const name = conversation.name || 'Group Chat';
  return {
    name,
    avatar: conversation.avatar_url,
    initials: name.substring(0, 2).toUpperCase(),
  };
}

function ChatHeader({
  conversation,
  currentUserId,
  onBack,
}: {
  conversation: ConversationListItem | undefined;
  currentUserId: string | undefined;
  onBack: () => void;
}) {
  const displayInfo = getConversationDisplayInfo(conversation, currentUserId);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="flex-shrink-0 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>

      <Avatar className="h-10 w-10">
        <AvatarImage src={displayInfo.avatar || undefined} alt={displayInfo.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {displayInfo.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold truncate">{displayInfo.name}</h2>
        {conversation?.type !== 'direct' && conversation?.participants && (
          <p className="text-xs text-muted-foreground">
            {conversation.participants.length} members
          </p>
        )}
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex gap-2',
            i % 2 === 0 ? 'justify-start' : 'justify-end'
          )}
        >
          {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          <Skeleton className={cn(
            'h-12 rounded-2xl',
            i % 2 === 0 ? 'w-48' : 'w-36'
          )} />
        </div>
      ))}
    </div>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full">
        {formatDateSeparator(date)}
      </span>
    </div>
  );
}

export function ChatView({ conversationId, onBack }: ChatViewProps) {
  const { user } = useSupabaseSession();
  const { conversations } = useMessaging();
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
  } = useConversationMessages(conversationId);

  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const conversation = conversations.find(c => c.id === conversationId);
  const isGroupChat = conversation?.type !== 'direct';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [loading]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  }, [loadMore, loadingMore, hasMore]);

  const handleSendMessage = useCallback(async (content: string, replyToId?: string) => {
    await sendMessage(content, 'text', null, null, replyToId || null);
  }, [sendMessage]);

  const handleReply = useCallback((message: MessageWithSender) => {
    setReplyingTo(message);
  }, []);

  const handleEdit = useCallback(async (message: MessageWithSender) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      await editMessage(message.id, newContent);
    }
  }, [editMessage]);

  const handleDelete = useCallback(async (message: MessageWithSender) => {
    if (confirm('Delete this message?')) {
      await deleteMessage(message.id);
    }
  }, [deleteMessage]);

  // Group messages by date
  const messagesWithDates = messages.reduce<Array<{ type: 'date' | 'message'; date?: string; message?: MessageWithSender }>>((acc, message, index) => {
    const messageDate = new Date(message.created_at);
    const prevMessage = messages[index - 1];
    
    // Add date separator if this is a new day
    if (!prevMessage || !isSameDay(messageDate, new Date(prevMessage.created_at))) {
      acc.push({ type: 'date', date: message.created_at });
    }
    
    acc.push({ type: 'message', message });
    return acc;
  }, []);

  // Determine if we should show sender info (for groups, show when sender changes)
  const shouldShowSenderInfo = (message: MessageWithSender, index: number): boolean => {
    if (!isGroupChat) return false;
    if (message.sender_id === user?.id) return false;
    
    const prevMessage = messages[index - 1];
    if (!prevMessage) return true;
    
    return prevMessage.sender_id !== message.sender_id;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader conversation={conversation} currentUserId={user?.id} onBack={onBack} />
        <MessagesSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversation} currentUserId={user?.id} onBack={onBack} />

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-background"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load older messages'
              )}
            </Button>
          </div>
        )}

        {/* Messages */}
        {messagesWithDates.map((item, index) => {
          if (item.type === 'date' && item.date) {
            return <DateSeparator key={`date-${item.date}`} date={item.date} />;
          }

          if (item.type === 'message' && item.message) {
            const message = item.message;
            const messageIndex = messages.findIndex(m => m.id === message.id);
            const isOwnMessage = message.sender_id === user?.id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={isOwnMessage}
                showSenderInfo={shouldShowSenderInfo(message, messageIndex)}
                onReply={() => handleReply(message)}
                onEdit={() => handleEdit(message)}
                onDelete={() => handleDelete(message)}
              />
            );
          }

          return null;
        })}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
