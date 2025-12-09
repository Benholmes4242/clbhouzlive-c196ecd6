import React, { useState } from 'react';
import { Bell, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useActivityFeed, ActivityTabId, ACTIVITY_TABS } from '@/hooks/useActivityFeed';
import { ActivityNotificationRow } from '@/components/activity/ActivityNotificationRow';
import { ActivityEmptyState } from '@/components/activity/ActivityEmptyState';
import { ActivitySkeleton } from '@/components/activity/ActivitySkeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';

const ActivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActivityTabId>('all');
  const { data: buckets, isLoading, error } = useActivityFeed(activeTab);
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const hasUnread = buckets && (
    buckets.today.some(n => !n.is_read) ||
    buckets.yesterday.some(n => !n.is_read) ||
    buckets.thisWeek.some(n => !n.is_read) ||
    buckets.earlier.some(n => !n.is_read)
  );

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      toast.error('Failed to mark all as read');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    toast.success('All marked as read');
  };

  const handleNotificationClick = async (notification: any) => {
    // Navigate first for snappiness
    if (notification.context_url) {
      navigate(notification.context_url);
    }

    // Mark as read if unread
    if (!notification.is_read) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    }
  };

  const isEmpty = !buckets || (
    buckets.today.length === 0 && 
    buckets.yesterday.length === 0 && 
    buckets.thisWeek.length === 0 && 
    buckets.earlier.length === 0
  );

  // Debug: log when component mounts
  console.log('[ActivityPage] Rendering, isLoading:', isLoading, 'buckets:', buckets);

  return (
    <div className="min-h-screen bg-muted/50">
      {/* DEBUG: Fixed position tests to prove rendering works */}
      <div className="fixed top-20 left-4 z-[9999] bg-blue-500 p-4 rounded-lg">
        <p style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>STATIC TEST 1</p>
      </div>
      <div className="fixed top-40 left-4 z-[9999] bg-green-500 p-4 rounded-lg">
        <span style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', display: 'block' }}>Activity (FIXED)</span>
        <span style={{ color: 'white', fontSize: '14px', display: 'block' }}>Updates from friends test</span>
      </div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-red-500 rounded-full z-[9999]" />
      
      <main className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-24">
        {/* Header - changed from <header> to <div> to test if semantic element is the issue */}
        <div className="flex items-center justify-between mb-4" style={{ position: 'relative', zIndex: 10 }}>
          {/* Title section with explicit styling */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            color: '#000000',
            visibility: 'visible',
            opacity: 1
          }}>
            <span style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              color: '#0f172a',
              display: 'block',
              lineHeight: 1.2
            }}>
              Activity
            </span>
            <span style={{ 
              fontSize: '14px', 
              color: '#64748b',
              display: 'block',
              marginTop: '4px'
            }}>
              Updates from friends, clubs, courses & messages.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mark all as read */}
            <button 
              onClick={handleMarkAllAsRead}
              className="relative h-9 w-9 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60 hover:bg-accent transition-colors"
              title="Mark all as read"
            >
              <Bell className="h-4 w-4 text-foreground" />
              {hasUnread && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>

            {/* Settings */}
            <button 
              className="h-9 w-9 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60 hover:bg-accent transition-colors"
              title="Notification settings"
            >
              <Settings className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 overflow-x-auto scrollbar-hide">
          <div className="inline-flex rounded-sq-pill bg-white/70 border border-border/60 px-1 py-1 gap-1">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-sq-pill whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:bg-white/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <ActivitySkeleton />
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Failed to load activity</p>
          </div>
        ) : isEmpty || !buckets ? (
          <ActivityEmptyState tab={activeTab} />
        ) : (
          <div className="space-y-6">
            {/* Today */}
            {buckets.today.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Today
                </h2>
                <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                  {buckets.today.map((notification) => (
                    <ActivityNotificationRow
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Yesterday */}
            {buckets.yesterday.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Yesterday
                </h2>
                <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                  {buckets.yesterday.map((notification) => (
                    <ActivityNotificationRow
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* This Week */}
            {buckets.thisWeek.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  This Week
                </h2>
                <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                  {buckets.thisWeek.map((notification) => (
                    <ActivityNotificationRow
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Earlier */}
            {buckets.earlier.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Earlier
                </h2>
                <div className="rounded-sq-md bg-background shadow-sm divide-y divide-border/40 overflow-hidden">
                  {buckets.earlier.map((notification) => (
                    <ActivityNotificationRow
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ActivityPage;
