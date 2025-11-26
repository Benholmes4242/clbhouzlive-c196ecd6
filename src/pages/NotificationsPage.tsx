
import React, { useEffect, useState, useMemo } from 'react';
import ClubhouseHeaderNew from '@/components/clubhouse/ClubhouseHeaderNew';
import BottomNavigation from '@/components/BottomNavigation';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationsHeader from '@/components/notifications/NotificationsHeader';
import NotificationsEmptyState from '@/components/notifications/NotificationsEmptyState';
import NotificationsList from '@/components/notifications/NotificationsList';
import { analyticsEvents } from '@/utils/analyticsEvents';

type NotificationFilter = "all" | "social" | "messages" | "system";

const NotificationsPage = () => {
  const { user } = useSupabaseSession();
  const { 
    notifications, 
    isLoading, 
    markAllNonFriendRequestsAsRead 
  } = useNotifications();
  
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
  
  // Filter notifications by type
  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    
    const socialTypes = ['follow', 'friend_request', 'friend_accepted', 'like', 'comment', 'tag', 'share'];
    const messageTypes = ['message'];
    const systemTypes = ['golf_news', 'course_activity'];
    
    return notifications.filter((n) => {
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

          {filteredNotifications.length === 0 ? (
            <NotificationsEmptyState />
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
