import { useMessaging } from '@/hooks/useMessaging';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    <div className="flex items-center gap-3 p-3">
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
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map(i => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start a conversation with someone to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map(conversation => {
        const { name, avatarUrl, initials } = getConversationDisplay(
          conversation, 
          user?.id
        );
        const isSelected = selectedConversationId === conversation.id;

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50",
              isSelected && "bg-accent"
            )}
          >
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground truncate">
                  {name}
                </span>
                {conversation.last_message_at && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelativeTime(conversation.last_message_at)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.last_message_preview || 'No messages yet'}
                </p>
                {conversation.unread_count > 0 && (
                  <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
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
