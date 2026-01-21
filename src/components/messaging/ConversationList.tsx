import { useMessaging } from '@/hooks/useMessaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationWithDetails } from '@/types/messaging';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversationId?: string;
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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getConversationDisplay(
  conversation: ConversationWithDetails,
  currentUserId: string | undefined
): { name: string; avatarUrl: string | null; initials: string } {
  if (conversation.type === 'direct') {
    // For DMs, find the other participant
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

  // For group/club/travel_company chats
  const name = conversation.name || 'Group Chat';
  return {
    name,
    avatarUrl: conversation.avatar_url,
    initials: name.substring(0, 2).toUpperCase(),
  };
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-border/60">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

export function ConversationList({ 
  onSelectConversation, 
  selectedConversationId 
}: ConversationListProps) {
  const { conversations, loading } = useMessaging();
  const { user } = useSupabaseSession();

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3, 4, 5].map(i => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-[#e2e8f0] flex items-center justify-center mb-4">
          <MessageCircle className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start a conversation with someone to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {conversations.map(conversation => {
        const { name, avatarUrl, initials } = getConversationDisplay(
          conversation, 
          user?.id
        );
        const isSelected = selectedConversationId === conversation.id;
        const hasUnread = conversation.unread_count > 0;

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 text-left transition-all rounded-2xl",
              "bg-white border border-border/60 hover:border-border hover:shadow-sm",
              isSelected && "border-primary/30 bg-primary/5 shadow-sm"
            )}
          >
            <SquircleAvatar
              src={avatarUrl}
              alt={name}
              size={48}
              fallback={initials}
              hideRing
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={cn(
                  "font-medium text-foreground truncate",
                  hasUnread && "font-semibold"
                )}>
                  {name}
                </span>
                {conversation.last_message_at && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(conversation.last_message_at)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className={cn(
                  "text-sm truncate",
                  hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
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
      })}
    </div>
  );
}
