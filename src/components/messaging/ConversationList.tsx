import { useState, useEffect, useMemo } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useArchivedConversations } from '@/hooks/useArchivedConversations';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Plus, Archive, ChevronDown, ChevronRight, Users, Check, CheckCheck, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SwipeableConversationItem } from './SwipeableConversationItem';
import type { ConversationWithDetails } from '@/types/messaging';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversationId?: string;
  searchQuery?: string;
  onNewConversation?: () => void;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-GB', { weekday: 'short' });
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getConversationDisplay(
  conversation: ConversationWithDetails,
  currentUserId: string | undefined
): { name: string; avatarUrl: string | null; initials: string } {
  if (conversation.type === 'direct') {
    const otherParticipant = conversation.participants.find(
      p => p.user_id !== currentUserId
    );
    
    if (otherParticipant?.profile) {
      const profile = otherParticipant.profile;
      const name = profile.display_name || profile.username || 'Unknown';
      return {
        name,
        avatarUrl: profile.profile_photo_url,
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
}

// Format last message preview with "You:" prefix if from current user
function formatLastMessagePreview(
  preview: string | null,
  conversation: ConversationWithDetails,
  currentUserId: string | undefined
): string {
  if (!preview) return 'No messages yet';
  
  // Check if the last message was from the current user
  // We'll infer this from the conversation metadata or the preview itself
  // For now, check if preview starts with common "You:" patterns
  // The real fix would be to add last_message_sender_id to the query
  return preview;
}

// Delivery status indicator
function DeliveryStatus({ isOwn, isRead }: { isOwn: boolean; isRead?: boolean }) {
  if (!isOwn) return null;
  
  if (isRead) {
    return <CheckCheck className="w-3.5 h-3.5 text-[#2A9D5C] flex-shrink-0" />;
  }
  
  return <Check className="w-3.5 h-3.5 text-[#8E8E93] flex-shrink-0" />;
}

// Component to show typing indicator or message preview
function ConversationTypingOrPreview({ conversationId, preview }: { conversationId: string; preview: string | null }) {
  const { typingUsers } = useTypingIndicator(conversationId);
  
  if (typingUsers.length > 0) {
    const text = typingUsers.length === 1 
      ? `${typingUsers[0].name} is typing...`
      : `${typingUsers.length} people typing...`;
    
    return (
      <span className="text-primary italic flex items-center gap-1">
        {text}
        <span className="inline-flex gap-0.5">
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </span>
    );
  }
  
  return <>{preview || 'No messages yet'}</>;
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function EmptyState({ onNewConversation }: { onNewConversation?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100/50 flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-amber-300" />
      </div>
      <h3 className="font-semibold text-gray-900 text-lg mb-1">No messages yet</h3>
      <p className="text-sm text-gray-400 mb-6 max-w-[240px]">
        Start a conversation with your golf buddies
      </p>
      {onNewConversation && (
        <button 
          onClick={onNewConversation}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-full font-semibold active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" />
          Start a Chat
        </button>
      )}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-amber-100/50 flex items-center justify-center mb-3">
        <MessageCircle className="h-6 w-6 text-amber-300" />
      </div>
      <h3 className="font-medium text-gray-900 mb-1">No results found</h3>
      <p className="text-sm text-gray-400">
        No conversations match "{query}"
      </p>
    </div>
  );
}

export function ConversationList({ 
  onSelectConversation, 
  selectedConversationId,
  searchQuery = '',
  onNewConversation
}: ConversationListProps) {
  const { conversations, loading, fetchConversations } = useMessaging();
  const { user } = useSupabaseSession();
  const { archivedConversations, hasArchived, unarchive, refetch: refetchArchived } = useArchivedConversations();
  const [showArchived, setShowArchived] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    return !localStorage.getItem('swipeHintDismissed');
  });
  const { toast } = useToast();

  // Dismiss hint after 10 seconds
  useEffect(() => {
    if (showSwipeHint && conversations.length > 0) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        localStorage.setItem('swipeHintDismissed', 'true');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint, conversations.length]);

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase.rpc('toggle_conversation_archive', {
        p_conversation_id: conversationId,
        p_archive: true,
      });
      
      if (error) throw error;
      
      await fetchConversations();
      await refetchArchived();
      toast({ title: 'Chat archived' });
    } catch (error) {
      console.error('Error archiving:', error);
      toast({ title: 'Failed to archive', variant: 'destructive' });
    }
  };

  const handleUnarchiveConversation = async (conversationId: string) => {
    const success = await unarchive(conversationId);
    if (success) {
      await fetchConversations();
      toast({ title: 'Chat unarchived' });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      await fetchConversations();
      toast({ title: 'Conversation deleted' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({ title: 'Failed to delete conversation', variant: 'destructive' });
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const { name } = getConversationDisplay(conversation, user?.id);
    const lastMessage = conversation.last_message_preview?.toLowerCase() || '';
    
    return name.toLowerCase().includes(query) || lastMessage.includes(query);
  });

  if (loading) {
    return (
      <div className="overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return <EmptyState onNewConversation={onNewConversation} />;
  }

  if (filteredConversations.length === 0 && searchQuery) {
    return <NoResults query={searchQuery} />;
  }

  const renderConversationItem = (conversation: ConversationWithDetails, isArchived: boolean = false, index: number = 0, total: number = 0) => {
    const { name, avatarUrl, initials } = getConversationDisplay(conversation, user?.id);
    const isSelected = selectedConversationId === conversation.id;
    const hasUnread = conversation.unread_count > 0;
    const showDivider = index < total - 1;
    const isGroup = conversation.type === 'group';
    const isMuted = conversation.participants.find(p => p.user_id === user?.id)?.is_muted;

    return (
      <SwipeableConversationItem
        key={conversation.id}
        onArchive={() => isArchived 
          ? handleUnarchiveConversation(conversation.id) 
          : handleArchiveConversation(conversation.id)
        }
        onDelete={() => handleDeleteConversation(conversation.id)}
        isArchived={isArchived}
      >
        <div className="relative">
          <button
            onClick={() => {
              if (isArchived) {
                handleUnarchiveConversation(conversation.id);
              }
              onSelectConversation(conversation.id);
            }}
            className={cn(
              "w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors",
              "active:bg-amber-100/30",
              isSelected && "bg-amber-50/50",
              isArchived && "opacity-70"
            )}
          >
            {/* Avatar - Group icon or user photo */}
            <div className="relative flex-shrink-0">
              {isGroup && !avatarUrl ? (
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <SquircleAvatar
                  src={avatarUrl}
                  alt={name}
                  size={48}
                  fallback={initials}
                  hideRing
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {/* Unread dot */}
                  {hasUnread && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  )}
                  <span className={cn(
                    "text-[14px] truncate",
                    hasUnread ? "font-bold" : "font-semibold"
                  )}
                    style={{ color: '#1C1917' }}
                  >
                    {name}
                  </span>
                  {isMuted && (
                    <BellOff className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#A8A29E' }} />
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className={cn(
                    "text-[12px] font-normal",
                  )}
                    style={{ color: hasUnread ? '#F59E0B' : '#A8A29E' }}
                  >
                    {formatRelativeTime(conversation.last_message_at)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-[13px] truncate flex-1 font-normal",
                )}
                  style={{ color: hasUnread ? '#44403C' : '#A8A29E' }}
                >
                  <ConversationTypingOrPreview 
                    conversationId={conversation.id}
                    preview={conversation.last_message_preview}
                  />
                </p>
                
                {hasUnread && (
                  <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-amber-500">
                    <span className="text-[12px] font-bold text-white">
                      {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </button>
          
          {/* Divider - inset after avatar, Apple Messages style */}
          {showDivider && (
            <div className="h-px ml-[76px] bg-amber-200/15" />
          )}
        </div>
      </SwipeableConversationItem>
    );
  };

  return (
    <div>
      {/* Swipe hint */}
      {showSwipeHint && filteredConversations.length > 0 && (
        <div className="px-4 py-2 rounded-xl mb-3 text-center text-[13px] flex items-center justify-center gap-2 bg-amber-50 border border-amber-200/20 text-gray-400">
          <span>← Swipe left to delete</span>
          <span>•</span>
          <span>Swipe right to archive →</span>
          <button 
            onClick={() => {
              setShowSwipeHint(false);
              localStorage.setItem('swipeHintDismissed', 'true');
            }}
            className="ml-2 font-medium text-amber-600"
          >
            Got it
          </button>
        </div>
      )}

      {/* Conversations card — matches HubMessagesCard warm glass */}
      <div 
        className="overflow-hidden rounded-[20px]"
        style={{
          background: 'var(--hub-card)',
          border: '1px solid var(--hub-card-border)',
          boxShadow: '0 8px 24px rgba(2, 6, 23, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {filteredConversations.map((conversation, index) => 
          renderConversationItem(conversation, false, index, filteredConversations.length)
        )}
      </div>

      {/* Archived section */}
      {hasArchived && (
        <div className="mt-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 rounded-xl text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Archive size={18} />
              <span className="font-medium">Archived</span>
              <span className="text-sm text-gray-400">({archivedConversations.length})</span>
            </div>
            {showArchived ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          {showArchived && (
            <div className="mt-2 overflow-hidden">
              {archivedConversations.map((conversation, index) => 
                renderConversationItem(conversation, true, index, archivedConversations.length)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
