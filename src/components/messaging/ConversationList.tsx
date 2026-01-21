import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessaging } from '@/hooks/useMessaging';
import { cn } from '@/lib/utils';
import type { ConversationListItem } from '@/types/messaging';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversationId?: string;
}

function getConversationDisplayInfo(conversation: ConversationListItem) {
  if (conversation.type === 'direct' && conversation.other_user) {
    return {
      name: conversation.other_user.display_name || conversation.other_user.username,
      avatar: conversation.other_user.profile_photo_url,
      initials: (conversation.other_user.display_name || conversation.other_user.username)
        .substring(0, 2)
        .toUpperCase(),
    };
  }

  // For groups/clubs/travel companies
  const name = conversation.name || 'Group Chat';
  return {
    name,
    avatar: conversation.avatar_url,
    initials: name.substring(0, 2).toUpperCase(),
  };
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: false })
        .replace('about ', '')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace('less than a minute', 'now');
    }
    
    if (diffInHours < 48) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: ConversationListItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const displayInfo = getConversationDisplayInfo(conversation);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 text-left transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted'
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={displayInfo.avatar || undefined} alt={displayInfo.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {displayInfo.initials}
          </AvatarFallback>
        </Avatar>
        {conversation.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-xs font-bold text-white">
            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'font-medium truncate',
            conversation.unread_count > 0 && 'text-foreground'
          )}>
            {displayInfo.name}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatRelativeTime(conversation.last_message_at)}
          </span>
        </div>
        <p className={cn(
          'text-sm truncate',
          conversation.unread_count > 0 
            ? 'text-foreground font-medium' 
            : 'text-muted-foreground'
        )}>
          {conversation.last_message_preview || 'No messages yet'}
        </p>
      </div>
    </button>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">No conversations yet</h3>
      <p className="text-muted-foreground text-sm max-w-[240px]">
        Start a conversation with a fellow golfer to see it here
      </p>
    </div>
  );
}

export function ConversationList({
  onSelectConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { conversations, loading } = useMessaging();

  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <ConversationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedConversationId === conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
        />
      ))}
    </div>
  );
}
