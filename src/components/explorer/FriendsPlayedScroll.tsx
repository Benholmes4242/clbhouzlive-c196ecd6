
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Card, CardContent } from '@/components/ui/card';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';

interface FriendsPlayedScrollProps {
  audience: 'friends' | 'all';
}

const FriendsPlayedScroll: React.FC<FriendsPlayedScrollProps> = ({ audience }) => {
  const { user } = useSupabaseSession();

  const { data: friendsActivity = [], isLoading } = useQuery({
    queryKey: ['friendsTop100Activity', user?.id, audience],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('user_top100_courses')
        .select(`
          *,
          golf_courses(name, country, thumbnail_image),
          user_profiles(display_name, username, profile_photo_url),
          posts(
            id,
            content,
            created_at,
            post_media(media_url, media_type)
          )
        `)
        .order('played_date', { ascending: false })
        .limit(10);

      if (audience === 'friends') {
        // Get user's friends first
        const { data: friends } = await supabase
          .from('user_friends')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (friends && friends.length > 0) {
          query = query.in('user_id', friends.map(f => f.friend_id));
        } else {
          return []; // No friends found
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {audience === 'friends' ? 'Played by Friends' : 'Recent Community Activity'}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="flex-shrink-0 w-64 animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (friendsActivity.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {audience === 'friends' ? 'No friends have played Top 100 courses yet' : 'No recent activity'}
        </h3>
        <p className="text-gray-500">
          {audience === 'friends' 
            ? 'Encourage your friends to start their Top 100 journey!'
            : 'Check back later for community updates'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {audience === 'friends' ? 'Played by Friends' : 'Recent Community Activity'}
        </h2>
        <Badge variant="secondary">{friendsActivity.length} recent</Badge>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {friendsActivity.map((activity: any) => (
          <Card key={activity.id} className="flex-shrink-0 w-64 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              {/* Course Image */}
              <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-gray-100">
                {activity.posts?.[0]?.post_media?.[0] ? (
                  <img
                    src={activity.posts[0].post_media[0].media_url}
                    alt={activity.golf_courses?.name}
                    className="w-full h-full object-cover"
                  />
                ) : activity.golf_courses?.thumbnail_image ? (
                  <img
                    src={activity.golf_courses.thumbnail_image}
                    alt={activity.golf_courses?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white opacity-50" />
                  </div>
                )}
              </div>

              {/* User & Course Info */}
              <div className="flex items-center gap-2 mb-2">
                <OptimizedAvatar
                  src={activity.user_profiles?.profile_photo_url}
                  alt={activity.user_profiles?.display_name || activity.user_profiles?.username || 'User'}
                  size={24}
                  className="h-6 w-6"
                  fallback={(activity.user_profiles?.display_name || activity.user_profiles?.username || 'U').charAt(0).toUpperCase()}
                />
                <span className="text-sm font-medium">
                  {activity.user_profiles?.display_name || activity.user_profiles?.username}
                </span>
              </div>

              <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                {activity.golf_courses?.name}
              </h3>
              <p className="text-xs text-gray-600">
                {activity.golf_courses?.country}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FriendsPlayedScroll;
