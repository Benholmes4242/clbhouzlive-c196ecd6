
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
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
        <Header />
        <div className="container mx-auto px-4 md:px-0 py-6">
          <p className="text-center text-muted-foreground">Please log in to view notifications.</p>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="px-4 md:container md:mx-auto md:px-0 py-6">
          <div className="max-w-2xl mx-auto">
            <NotificationsHeader />
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
      
      <main className="px-4 md:container md:mx-auto md:px-0 py-6">
        <div className="max-w-2xl mx-auto">
          <NotificationsHeader />

          {notifications.length === 0 ? (
            <NotificationsEmptyState />
          ) : (
            <NotificationsList
              notifications={notifications}
            />
          )}
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default NotificationsPage;
