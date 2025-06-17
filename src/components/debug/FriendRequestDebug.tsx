
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const FriendRequestDebug = () => {
  const { user } = useSupabaseSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkFriendRequests = async () => {
    if (!user) return;

    console.log('Checking friend requests for user:', user.id);
    
    // Check friend requests
    const { data: friendRequests, error: friendError } = await supabase
      .from('user_friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    // Check notifications
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Check user profiles for the other users
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, username, display_name')
      .in('username', ['thomas.holmes', 'oliver.holmes']);

    setDebugInfo({
      friendRequests,
      friendError,
      notifications,
      notifError,
      profiles,
      profileError,
      currentUserId: user.id
    });

    console.log('Debug info:', {
      friendRequests,
      friendError,
      notifications,
      notifError,
      profiles,
      profileError
    });
  };

  if (!user) return null;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug: Friend Requests & Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkFriendRequests} className="mb-4">
          Check Friend Requests & Notifications
        </Button>
        
        {debugInfo && (
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold">Current User ID:</h4>
              <p>{debugInfo.currentUserId}</p>
            </div>
            
            <div>
              <h4 className="font-semibold">Friend Requests:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo.friendRequests, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold">Notifications:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo.notifications, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold">User Profiles (Thomas & Oliver):</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo.profiles, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FriendRequestDebug;
