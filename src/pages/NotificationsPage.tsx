import React, { useEffect, useState, useMemo } from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNotifications } from '@/hooks/useNotifications';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { useFriendship } from '@/hooks/useFriendship';
import NotificationsHeader from '@/components/notifications/NotificationsHeader';
import NotificationsEmptyState from '@/components/notifications/NotificationsEmptyState';
import NotificationsList from '@/components/notifications/NotificationsList';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Squircle } from '@/components/ui/squircle';
import { UserCheck, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type NotificationFilter = "all" | "social" | "messages" | "system";

// Individual friend request card component
const FriendRequestCard: React.FC<{ 
  request: any;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}> = ({ request, onAccept, onDecline, isProcessing }) => {
  const navigate = useNavigate();
  const requester = request.requester;
  const name = requester?.display_name || 'Someone';
  const username = requester?.username;
  const photo = requester?.profile_photo_url;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-border last:border-b-0">
      <div 
        onClick={() => requester?.id && navigate(`/profile/${requester.id}`)}
        className="cursor-pointer"
      >
        <Squircle width={48} height={48}>
          {photo ? (
            <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--muted))', fontSize: '18px', fontWeight: 600 }}>
              {name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </Squircle>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">
          {username ? `@${username}` : name}
        </p>
        <p className="text-xs text-muted-foreground">sent you a friend request</p>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={onAccept}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <UserCheck className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDecline}
          disabled={isProcessing}
          className="border-muted-foreground/30"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Friend requests section using the friendship hook for each request
const FriendRequestItem: React.FC<{ request: any; onComplete: () => void }> = ({ request, onComplete }) => {
  const { acceptRequest, declineRequest, isUpdating } = useFriendship(request.user_id);

  const handleAccept = async () => {
    await acceptRequest();
    onComplete();
  };

  const handleDecline = async () => {
    await declineRequest();
    onComplete();
  };

  return (
    <FriendRequestCard
      request={request}
      onAccept={handleAccept}
      onDecline={handleDecline}
      isProcessing={isUpdating}
    />
  );
};

const NotificationsPage = () => {
  const { user } = useSupabaseSession();
  const { 
    notifications, 
    isLoading, 
    markAllNonFriendRequestsAsRead 
  } = useNotifications();
  const { requests: friendRequests, refetch: refetchFriendRequests } = useFriendRequests();
  
  const [filter, setFilter] = useState<NotificationFilter>("all");

  // Track page open
  useEffect(() => {
    analyticsEvents.notifications.opened({ source: "bell" });
  }, []);

  // Mark non-friend-request notifications as read when visiting the page
  useEffect(() => {
    if (notifications.length > 0) {
      markAllNonFriendRequestsAsRead();
    }
  }, [notifications.length, markAllNonFriendRequestsAsRead]);
  
  // Filter notifications by type (exclude friend_request as they're shown in separate section)
  const filteredNotifications = useMemo(() => {
    // Exclude friend_request type as it's shown in the dedicated section
    const notificationsWithoutFriendRequests = notifications.filter(n => n.type !== 'friend_request');
    
    if (filter === "all") return notificationsWithoutFriendRequests;
    
    const socialTypes = ['follow', 'friend_accepted', 'like', 'comment', 'tag', 'share'];
    const messageTypes = ['message'];
    const systemTypes = ['golf_news', 'course_activity'];
    
    return notificationsWithoutFriendRequests.filter((n) => {
      if (filter === "social") return socialTypes.includes(n.type);
      if (filter === "messages") return messageTypes.includes(n.type);
      if (filter === "system") return systemTypes.includes(n.type);
      return true;
    });
  }, [notifications, filter]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-0 py-6">
          <p className="text-center text-muted-foreground">Please log in to view notifications.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 md:container md:mx-auto md:px-0 py-6">
          <div className="max-w-2xl mx-auto">
            <NotificationsHeader />
            <p className="text-center text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClubhouseHeaderNew />
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6">
        <div className="max-w-2xl mx-auto">
          <NotificationsHeader />
          
          {/* Friend Requests Section */}
          {friendRequests.length > 0 && (
            <Card className="mb-6 rounded-sq-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Friend Requests ({friendRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {friendRequests.map((request) => (
                  <FriendRequestItem 
                    key={request.id} 
                    request={request}
                    onComplete={refetchFriendRequests}
                  />
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 border-b border-border">
            {(['all', 'social', 'messages', 'system'] as NotificationFilter[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  filter === filterType
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>

          {filteredNotifications.length === 0 && friendRequests.length === 0 ? (
            <NotificationsEmptyState />
          ) : filteredNotifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notifications in this category.</p>
          ) : (
            <NotificationsList
              notifications={filteredNotifications}
              onNotificationClick={(notification) => {
                analyticsEvents.notifications.clicked({
                  id: notification.id,
                  type: notification.type,
                  source: "notifications_page",
                });
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;