
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TagNotificationProps {
  notification: any;
}

const TagNotification: React.FC<TagNotificationProps> = ({ notification }) => {
  const { tagger_name, tagger_photo, tagger_username, content_preview } = notification.data;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={tagger_photo} alt={tagger_name} />
          <AvatarFallback>
            {tagger_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-muted-foreground mb-1">You were tagged</h4>
          <p className="text-sm">
            <span className="font-medium">@{tagger_username || tagger_name}</span> tagged you in a post.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatTimeAgo(notification.created_at)}
          </p>
          {content_preview && (
            <div className="bg-muted p-2 rounded-md text-sm mt-2">
              <p className="text-muted-foreground">"{content_preview}..."</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagNotification;
