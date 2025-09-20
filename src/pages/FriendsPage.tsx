
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const FriendsPage = () => {
  const { user } = useSupabaseSession();

  const { data: following, isLoading } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching following for user:', user.id);
      
      // Get all users the current user follows
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) {
        console.error('Error fetching following relationships:', followError);
        throw followError;
      }
      
      if (!followData || followData.length === 0) {
        console.log('Not following anyone');
        return [];
      }

      console.log('Following IDs found:', followData.map(f => f.following_id));

      // Then get the profile data for each person being followed
      const followingIds = followData.map(f => f.following_id);
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, bio')
        .in('id', followingIds);

      if (profileError) {
        console.error('Error fetching following profiles:', profileError);
        throw profileError;
      }

      console.log('Following profiles:', profiles);
      return profiles || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">Loading following...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold">Friends</h1>
        </div>

        {following && following.length > 0 ? (
          <div className="space-y-4">
            {following.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={friend.profile_photo_url} 
                      alt={friend.username} 
                    />
                    <AvatarFallback>
                      {friend.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {friend.display_name}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Message
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No friends yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
