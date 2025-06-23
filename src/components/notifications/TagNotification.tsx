
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tag, MessageSquare } from 'lucide-react';

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
    <div className="flex items-start gap-3 p-4 border-b border-border">
      <Avatar className="h-10 w-10">
        <AvatarImage src={tagger_photo} alt={tagger_name} />
        <AvatarFallback>
          {tagger_name?.charAt(0)?.toUpperCase() || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium">{tagger_name}</p>
        <p className="text-sm text-muted-foreground mb-1">
          {tagger_username ? `@${tagger_username}` : ''} • {formatTimeAgo(notification.created_at)}
        </p>
        {content_preview && (
          <div className="bg-muted p-2 rounded-md text-sm">
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs text-muted-foreground">Tagged you in:</span>
            </div>
            <p>"{content_preview}..."</p>
          </div>
        )}
      </div>
      <Tag className="h-5 w-5 text-blue-600" />
    </div>
  );
};

export default TagNotification;
