
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Users } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const FollowersPage = () => {
  const { user } = useSupabaseSession();

  const { data: followers, isLoading } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching followers for user:', user.id);
      
      // First get the follower relationships
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', user.id);

      if (followError) {
        console.error('Error fetching follow relationships:', followError);
        throw followError;
      }
      
      if (!followData || followData.length === 0) {
        console.log('No followers found');
        return [];
      }

      console.log('Follower IDs found:', followData.map(f => f.follower_id));

      // Then get the profile data for each follower
      const followerIds = followData.map(f => f.follower_id);
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, bio')
        .in('id', followerIds);

      if (profileError) {
        console.error('Error fetching follower profiles:', profileError);
        throw profileError;
      }

      console.log('Follower profiles:', profiles);
      return profiles || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">Loading followers...</div>
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
          <h1 className="text-xl font-semibold">Followers</h1>
        </div>

        {followers && followers.length > 0 ? (
          <div className="space-y-4">
            {followers.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={follower.profile_photo_url} 
                      alt={follower.username} 
                    />
                    <AvatarFallback>
                      {follower.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{follower.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {follower.display_name}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Following
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No followers yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersPage;
