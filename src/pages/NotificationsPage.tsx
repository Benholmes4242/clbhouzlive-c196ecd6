
import React, { useEffect } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationsHeader from '@/components/notifications/NotificationsHeader';
import NotificationsEmptyState from '@/components/notifications/NotificationsEmptyState';
import NotificationsList from '@/components/notifications/NotificationsList';

const NotificationsPage = () => {
  const { user } = useSupabaseSession();
  const { 
    notifications, 
    isLoading, 
    markAllNonFriendRequestsAsRead 
  } = useNotifications();

  // Mark non-friend-request notifications as read when visiting the page
  useEffect(() => {
    if (notifications.length > 0) {
      markAllNonFriendRequestsAsRead();
    }
  }, [notifications.length, markAllNonFriendRequestsAsRead]);

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
      <main className="px-4 md:container md:mx-auto md:px-0 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Notifications</h1>
          
          {notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-4 border rounded-lg">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No notifications</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
