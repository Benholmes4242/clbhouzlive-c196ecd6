import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useMessaging } from '@/hooks/useMessaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { usePresence } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { OnlineIndicator } from './OnlineIndicator';
import type { MessageWithSender, ConversationWithDetails } from '@/types/messaging';
import { supabase } from '@/integrations/supabase/client';

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}

function groupMessagesByDate(messages: MessageWithSender[]): Map<string, MessageWithSender[]> {
  const groups = new Map<string, MessageWithSender[]>();
  
  messages.forEach(message => {
    const dateKey = new Date(message.created_at).toDateString();
    const existing = groups.get(dateKey) || [];
    existing.push(message);
    groups.set(dateKey, existing);
  });
  
  return groups;
}

function ChatSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className="flex gap-2 max-w-[70%]">
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-2xl`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatView({ conversationId, onBack }: ChatViewProps) {
  const { user } = useSupabaseSession();
  const { conversations, markAsRead } = useMessaging();
  const { 
    messages, 
    loading, 
    hasMore, 
    loadMore, 
    sendMessage,
    editMessage,
    deleteMessage,
  } = useConversationMessages(conversationId);

  // Typing indicator
  const { typingUsers, setTyping, clearTyping } = useTypingIndicator(conversationId);
  
  // Message reactions
  const { reactions, toggleReaction } = useMessageReactions(conversationId);
  
  // Presence
  const { presenceMap, subscribeToPresence } = usePresence();

  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Find current conversation
  const conversation = useMemo(() => 
    conversations.find(c => c.id === conversationId),
    [conversations, conversationId]
  );

  // Get other user for DM (for presence)
  const otherUser = useMemo(() => {
    if (!conversation || !user || conversation.type !== 'direct') return null;
    return conversation.participants.find(p => p.user_id !== user.id);
  }, [conversation, user]);

  // Subscribe to other user's presence for DMs
  useEffect(() => {
    if (otherUser?.user_id) {
      subscribeToPresence([otherUser.user_id]);
    }
  }, [otherUser?.user_id, subscribeToPresence]);

  // Get presence status for other user
  const otherUserPresence = otherUser?.user_id ? presenceMap.get(otherUser.user_id) : null;

  // Get display info for conversation header
  const headerInfo = useMemo(() => {
    if (!conversation || !user) {
      return { name: 'Loading...', avatarUrl: null, initials: '...' };
    }

    if (conversation.type === 'direct') {
      const other = conversation.participants.find(p => p.user_id !== user.id);
      if (other?.profile) {
        const name = other.profile.display_name || other.profile.username || 'Unknown';
        return {
          name,
          avatarUrl: other.profile.profile_photo_url,
          initials: name.substring(0, 2).toUpperCase(),
        };
      }
      return { name: 'Unknown User', avatarUrl: null, initials: 'U' };
    }

    const name = conversation.name || 'Group Chat';
    return {
      name,
      avatarUrl: conversation.avatar_url,
      initials: name.substring(0, 2).toUpperCase(),
    };
  }, [conversation, user]);

  // Is this a group conversation (show sender info)?
  const isGroupChat = conversation?.type !== 'direct';

  // Create a map for quick reply-to lookup
  const messagesMap = useMemo(() => {
    const map = new Map<string, MessageWithSender>();
    messages.forEach(m => map.set(m.id, m));
    return map;
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

  const handleSend = useCallback(async (
    content: string, 
    replyToId?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video'
  ) => {
    clearTyping();
    await sendMessage(content, replyToId, mediaUrl, mediaType);
  }, [sendMessage, clearTyping]);

  const handleReply = (message: MessageWithSender) => {
    setReplyingTo(message);
  };

  const handleEdit = async (message: MessageWithSender) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent !== message.content) {
      await editMessage(message.id, newContent);
    }
  };

  const handleDelete = async (message: MessageWithSender) => {
    if (confirm('Delete this message?')) {
      await deleteMessage(message.id);
    }
  };

  const handleToggleReaction = useCallback((messageId: string) => (emoji: string) => {
    toggleReaction(messageId, emoji);
  }, [toggleReaction]);

  // Group messages by date
  const groupedMessages = useMemo(() => 
    groupMessagesByDate(messages),
    [messages]
  );

  // Determine which messages should show sender info (first in a sequence from same sender)
  const shouldShowSenderInfo = (message: MessageWithSender, index: number): boolean => {
    if (!isGroupChat) return false;
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    if (!prevMessage) return true;
    
    // Show if different sender or different date
    if (prevMessage.sender_id !== message.sender_id) return true;
    if (new Date(prevMessage.created_at).toDateString() !== new Date(message.created_at).toDateString()) return true;
    
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={headerInfo.avatarUrl || undefined} alt={headerInfo.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {headerInfo.initials}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator for DMs */}
          {!isGroupChat && otherUserPresence && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineIndicator 
                status={otherUserPresence.status} 
                size="sm"
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{headerInfo.name}</h2>
          {isGroupChat && conversation ? (
            <p className="text-xs text-muted-foreground">
              {conversation.participants.length} members
            </p>
          ) : otherUserPresence ? (
            <p className="text-xs text-muted-foreground">
              {otherUserPresence.status === 'online' ? 'Active now' : 
               otherUserPresence.status === 'away' ? 'Away' : 'Offline'}
            </p>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <ChatSkeleton />
      ) : (
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load earlier messages
              </Button>
            </div>
          )}

          {/* Messages grouped by date */}
          {Array.from(groupedMessages.entries()).map(([dateKey, dateMessages]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                  {formatDateHeader(dateMessages[0].created_at)}
                </span>
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {dateMessages.map((message, index) => {
                  const globalIndex = messages.indexOf(message);
                  const isOwn = message.sender_id === user?.id;
                  const showSender = shouldShowSenderInfo(message, globalIndex);
                  const replyTo = message.reply_to_id 
                    ? messagesMap.get(message.reply_to_id) 
                    : null;
                  const messageReactions = reactions[message.id] || [];

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwnMessage={isOwn}
                      showSenderInfo={showSender}
                      replyToMessage={replyTo}
                      reactions={messageReactions}
                      currentUserId={user?.id}
                      onReply={() => handleReply(message)}
                      onEdit={() => handleEdit(message)}
                      onDelete={() => handleDelete(message)}
                      onToggleReaction={handleToggleReaction(message.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onTyping={setTyping}
        disabled={loading}
      />
    </div>
  );
}
