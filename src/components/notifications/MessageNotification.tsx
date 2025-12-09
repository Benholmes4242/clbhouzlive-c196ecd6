import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface MessageNotificationProps {
  notification: {
    id: string;
    actor_id?: string;
    message?: string;
    data?: { message_preview?: string; sender_id?: string };
    created_at: string;
  };
}

const MessageNotification: React.FC<MessageNotificationProps> = ({ notification }) => {
  const navigate = useNavigate();
  
  const { data: actor } = useQuery({
    queryKey: ['user-profile', notification.actor_id],
    enabled: !!notification.actor_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', notification.actor_id!)
        .single();
      return data;
    },
  });

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
    navigate('/messages');
  };

  const messagePreview = notification.data?.message_preview || '';

  return (
    <div 
      className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50"
      onClick={handleClick}
    >
      {actor?.profile_photo_url ? (
        <SquircleAvatar
          src={actor.profile_photo_url}
          alt={actor.display_name || 'User'}
          size={40}
        />
      ) : (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <MessageSquare className="h-5 w-5 text-blue-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">
          <span className="font-semibold">{actor?.display_name || 'Someone'}</span>
          {' '}sent you a message
        </p>
        {messagePreview && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
            "{messagePreview}"
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
      <span className="text-xs text-blue-600 font-medium">Open chat</span>
    </div>
  );
};

export default MessageNotification;
