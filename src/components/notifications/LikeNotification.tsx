import React from 'react';
import { Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface LikeNotificationProps {
  notification: {
    id: string;
    actor_id?: string;
    data?: { post_id?: string };
    created_at: string;
  };
}

const LikeNotification: React.FC<LikeNotificationProps> = ({ notification }) => {
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
    if (notification.data?.post_id) {
      // Navigate to post when post detail view is implemented
      console.log('Navigate to post:', notification.data.post_id);
    }
  };

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
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Heart className="h-5 w-5 text-red-500" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">
          <span className="font-semibold">{actor?.display_name || 'Someone'}</span>
          {' '}liked your post
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
      <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
    </div>
  );
};

export default LikeNotification;
