
import React from 'react';
import { Squircle } from '@/components/ui/squircle';
import { useNavigate } from 'react-router-dom';

interface TagNotificationProps {
  notification: any;
}

const TagNotification: React.FC<TagNotificationProps> = ({ notification }) => {
  const navigate = useNavigate();
  const { tagger_name, tagger_photo, tagger_username, content_preview, post_id } = notification.data;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleClick = () => {
    if (post_id) {
      // Navigate to the specific post - for now, we'll navigate to the user's profile
      // In a full implementation, you'd have a dedicated post view route
      navigate(`/profile/${tagger_username}`);
    }
  };

  return (
    <div 
      className={`p-4 border-b border-border ${post_id ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <Squircle width={56} height={56}>
          {tagger_photo ? (
            <img src={tagger_photo} alt={tagger_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '22px', fontWeight: 600 }}>
              {tagger_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </Squircle>
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
          {post_id && (
            <p className="text-xs text-blue-600 mt-1">Tap to view post</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagNotification;
