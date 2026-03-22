import { useState, useEffect } from 'react';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useArchivedConversations } from '@/hooks/useArchivedConversations';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MessageCircle, Plus, Archive, ChevronDown, ChevronRight, Users, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SwipeableConversationItem } from './SwipeableConversationItem';
import type { ConversationWithDetails } from '@/types/messaging';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversationId?: string;
  searchQuery?: string;
  onNewConversation?: () => void;
  filterType?: 'all' | 'unread' | 'groups';
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

// Component to show typing indicator or message preview
// Only subscribes to typing indicators when isActive to avoid N simultaneous realtime channels
function ConversationTypingOrPreview({ conversationId, preview, isActive }: { conversationId: string; preview: string | null; isActive: boolean }) {
  // Only subscribe to typing indicators for the active conversation
  const { typingUsers } = useTypingIndicator(isActive ? conversationId : '');
  
  if (isActive && typingUsers.length > 0) {
    const text = typingUsers.length === 1 
      ? `${typingUsers[0].name} is typing...`
      : `${typingUsers.length} people typing...`;
    
    return (
      <span className="text-[hsl(35,80%,43%)] italic flex items-center gap-1">
        {text}
        <span className="inline-flex gap-0.5">
          <span className="w-1 h-1 bg-[hsl(38,92%,50%)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-[hsl(38,92%,50%)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 bg-[hsl(38,92%,50%)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div className="w-16 h-16 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-[hsl(38,92%,50%)]/50" />
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-1">No messages yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
        Start a conversation with your golf buddies
      </p>
      {onNewConversation && (
        <button 
          onClick={onNewConversation}
          className="flex items-center gap-2 px-6 py-3 bg-[hsl(38,92%,50%)] text-white rounded-full font-semibold active:scale-[0.97] transition-transform"
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
      <div className="w-12 h-12 rounded-full bg-[hsl(38,92%,50%)]/10 flex items-center justify-center mb-3">
        <MessageCircle className="h-6 w-6 text-[hsl(38,92%,50%)]/50" />
      </div>
      <h3 className="font-medium text-foreground mb-1">No results found</h3>
      <p className="text-sm text-muted-foreground">
        No conversations match "{query}"
      </p>
    </div>
  );
}

export function ConversationList({ 
  onSelectConversation, 
  selectedConversationId,
  searchQuery = '',
  onNewConversation,
  filterType = 'all'
}: ConversationListProps) {
  const { conversations, loading, fetchConversations } = useMessagingContext();
  const { user } = useSupabaseSession();
  const { archivedConversations, hasArchived, unarchive, refetch: refetchArchived } = useArchivedConversations();
  const [showArchived, setShowArchived] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    try { return !localStorage.getItem('swipeHintDismissed'); }
    catch { return true; }
  });
  

  // Dismiss hint after 10 seconds
  useEffect(() => {
    if (showSwipeHint && conversations.length > 0) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
        try { localStorage.setItem('swipeHintDismissed', 'true'); }
        catch { /* silent fail in WebView */ }
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
      toast.success('Chat archived');
    } catch {
      toast.error("Couldn't archive");
    }
  };

  const handleUnarchiveConversation = async (conversationId: string) => {
    const success = await unarchive(conversationId);
    if (success) {
      await fetchConversations();
      toast.success('Chat unarchived');
    }
  };

  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

  const handleDeleteConversation = (conversationId: string) => {
    setDeletingConversationId(conversationId);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingConversationId) return;
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', deletingConversationId)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      await fetchConversations();
      toast.success('Conversation deleted');
    } catch {
      toast.error("Couldn't delete conversation");
    } finally {
      setDeletingConversationId(null);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    // Apply filter type
    if (filterType === 'unread' && conversation.unread_count <= 0) return false;
    if (filterType === 'groups' && conversation.type !== 'group') return false;
    
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
              "w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors duration-150",
              "active:bg-[hsl(38,92%,50%)]/10",
              isSelected && "bg-[hsl(38,92%,50%)]/5",
              isArchived && "opacity-70"
            )}
          >
            {/* Avatar - Group icon or user photo */}
            <div className="relative flex-shrink-0">
              {isGroup && !avatarUrl ? (
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[hsl(38,92%,50%)]">
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
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(38,92%,50%)] flex-shrink-0" />
                  )}
                  <span className={cn(
                    "text-[14px] truncate text-foreground",
                    hasUnread ? "font-semibold" : "font-semibold"
                  )}>
                    {name}
                  </span>
                  {isMuted && (
                    <BellOff className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className={cn(
                    "text-[11px] font-normal",
                    hasUnread ? "text-[hsl(35,80%,43%)]" : "text-muted-foreground"
                  )}>
                    {formatRelativeTime(conversation.last_message_at)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-[13px] truncate flex-1 font-normal",
                  hasUnread ? "text-foreground" : "text-muted-foreground"
                )}>
                  <ConversationTypingOrPreview 
                    conversationId={conversation.id}
                    preview={conversation.last_message_preview}
                    isActive={selectedConversationId === conversation.id}
                  />
                </p>
                
                {hasUnread && (
                   <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center bg-[hsl(38,92%,50%)]">
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
            <div className="h-px ml-[76px] bg-border/30" />
          )}
        </div>
      </SwipeableConversationItem>
    );
  };

  return (
    <div>
      {/* Swipe hint */}
      {showSwipeHint && filteredConversations.length > 0 && (
        <div className="px-4 py-2 rounded-xl mb-3 text-center text-[13px] flex items-center justify-center gap-2 bg-[hsl(38,92%,50%)]/5 border border-border text-muted-foreground">
          <span>← Swipe left to delete</span>
          <span>•</span>
          <span>Swipe right to archive →</span>
          <button 
            onClick={() => {
              setShowSwipeHint(false);
              try { localStorage.setItem('swipeHintDismissed', 'true'); }
              catch { /* silent fail in WebView */ }
            }}
            className="ml-2 font-medium text-[hsl(35,80%,43%)]"
          >
            Got it
          </button>
        </div>
      )}

      {/* Conversations card — warm glass container */}
      <div className="overflow-hidden rounded-2xl">
        {filteredConversations.map((conversation, index) => 
          renderConversationItem(conversation, false, index, filteredConversations.length)
        )}
      </div>

      {/* Archived section */}
      {hasArchived && (
        <div className="mt-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(38,92%,50%)]/5 rounded-xl text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Archive size={18} />
              <span className="font-medium">Archived</span>
              <span className="text-sm text-muted-foreground">({archivedConversations.length})</span>
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

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!deletingConversationId} 
        onOpenChange={(open) => !open && setDeletingConversationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}