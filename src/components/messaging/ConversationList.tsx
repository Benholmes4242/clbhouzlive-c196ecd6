import { useState } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useArchivedConversations } from '@/hooks/useArchivedConversations';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Plus, Archive, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
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
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground text-lg mb-1">No messages yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
        Start a conversation with your golf buddies
      </p>
      {onNewConversation && (
        <Button 
          onClick={onNewConversation}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Start a Chat
        </Button>
      )}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <MessageCircle className="h-6 w-6 text-muted-foreground" />
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
  onNewConversation
}: ConversationListProps) {
  const { conversations, loading } = useMessaging();
  const { user } = useSupabaseSession();
  const { archivedConversations, hasArchived, unarchive } = useArchivedConversations();
  const [showArchived, setShowArchived] = useState(false);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const { name } = getConversationDisplay(conversation, user?.id);
    const lastMessage = conversation.last_message_preview?.toLowerCase() || '';
    
    return name.toLowerCase().includes(query) || lastMessage.includes(query);
  });

  if (loading) {
    return (
      <div className="divide-y divide-border/50">
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

  const renderConversationItem = (conversation: ConversationWithDetails, isArchived: boolean = false) => {
    const { name, avatarUrl, initials } = getConversationDisplay(
      conversation, 
      user?.id
    );
    const isSelected = selectedConversationId === conversation.id;
    const hasUnread = conversation.unread_count > 0;

    return (
      <button
        key={conversation.id}
        onClick={() => {
          if (isArchived) {
            unarchive(conversation.id);
          }
          onSelectConversation(conversation.id);
        }}
        className={cn(
          "w-full flex items-center gap-3 py-3 px-4 text-left transition-colors",
          "hover:bg-muted/50 active:bg-muted/70",
          isSelected && "bg-muted/60",
          isArchived && "opacity-70"
        )}
      >
        {/* Avatar */}
        <SquircleAvatar
          src={avatarUrl}
          alt={name}
          size={48}
          fallback={initials}
          hideRing
          className="flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "font-medium text-foreground truncate text-[15px]",
              hasUnread && "font-semibold"
            )}>
              {name}
            </span>
            {conversation.last_message_at && (
              <span className={cn(
                "text-xs flex-shrink-0",
                hasUnread ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {formatRelativeTime(conversation.last_message_at)}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className={cn(
              "text-sm truncate",
              hasUnread ? "text-foreground" : "text-muted-foreground"
            )}>
              {conversation.last_message_preview || 'No messages yet'}
            </p>
            {hasUnread && (
              <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="divide-y divide-border/30">
      {/* Regular conversations */}
      {filteredConversations.map(conversation => renderConversationItem(conversation))}

      {/* Archived section */}
      {hasArchived && (
        <div className="border-t border-border mt-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="w-full flex items-center justify-between px-4 py-3 text-muted-foreground hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Archive size={18} />
              <span>Archived</span>
              <span className="text-sm text-muted-foreground/70">({archivedConversations.length})</span>
            </div>
            {showArchived ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          
          {showArchived && (
            <div className="bg-muted/30">
              {archivedConversations.map(conversation => renderConversationItem(conversation, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
