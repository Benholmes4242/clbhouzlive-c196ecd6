
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, ArrowLeft } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNotifications } from '@/hooks/useNotifications';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import FriendRequestNotification from '@/components/notifications/FriendRequestNotification';
import FollowNotification from '@/components/notifications/FollowNotification';
import TagNotification from '@/components/notifications/TagNotification';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { 
    notifications, 
    isLoading, 
    handleFriendRequest, 
    markAllNonFriendRequestsAsRead 
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'friend_requests' | 'followers' | 'tags'>('all');

  // Mark non-friend-request notifications as read when visiting the page
  useEffect(() => {
    if (notifications.length > 0) {
      markAllNonFriendRequestsAsRead();
    }
  }, [notifications.length, markAllNonFriendRequestsAsRead]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Please log in to view notifications.</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'friend_requests') return notification.type === 'friend_request';
    if (filter === 'followers') return notification.type === 'follow';
    if (filter === 'tags') return notification.type === 'tag';
    return true;
  });

  const friendRequestCount = notifications.filter(n => n.type === 'friend_request').length;
  const followCount = notifications.filter(n => n.type === 'follow').length;
  const tagCount = notifications.filter(n => n.type === 'tag').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
            <p className="text-center text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'friend_requests' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('friend_requests')}
              className="flex items-center gap-1"
            >
              Friend Requests
              {friendRequestCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {friendRequestCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === 'followers' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('followers')}
              className="flex items-center gap-1"
            >
              Followers
              {followCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {followCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === 'tags' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('tags')}
              className="flex items-center gap-1"
            >
              Tags
              {tagCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tagCount}
                </Badge>
              )}
            </Button>
          </div>

          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'all' ? 'No notifications' : `No ${filter.replace('_', ' ')}`}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'all' ? "You're all caught up!" : `No ${filter.replace('_', ' ')} yet`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {filteredNotifications.map((notification) => {
                  if (notification.type === 'friend_request') {
                    return (
                      <FriendRequestNotification
                        key={notification.id}
                        notification={notification}
                        onAccept={() => handleFriendRequest(notification.data.friend_request_id, 'accept')}
                        onDecline={() => handleFriendRequest(notification.data.friend_request_id, 'decline')}
                      />
                    );
                  }
                  
                  if (notification.type === 'follow') {
                    return (
                      <FollowNotification
                        key={notification.id}
                        notification={notification}
                      />
                    );
                  }
                  
                  if (notification.type === 'tag') {
                    return (
                      <TagNotification
                        key={notification.id}
                        notification={notification}
                      />
                    );
                  }

                  if (notification.type === 'friend_accepted') {
                    return (
                      <div key={notification.id} className="flex items-center gap-3 p-4 border-b border-border">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Bell className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default NotificationsPage;
