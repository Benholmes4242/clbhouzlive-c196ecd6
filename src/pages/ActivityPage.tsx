import React, { useState } from 'react';
import { Bell, Settings } from 'lucide-react';
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
    if (notification.context_url) {
      navigate(notification.context_url);
    }

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

  console.log('[ActivityPage] Rendering, isLoading:', isLoading, 'buckets:', buckets);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F4F5F7',
      paddingBottom: '96px'
    }}>
      {/* DEBUG: Red dot to prove page renders */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '48px',
        height: '48px',
        backgroundColor: 'red',
        borderRadius: '50%',
        zIndex: 9999
      }} />
      
      {/* Main content wrapper */}
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '16px'
      }}>
        {/* Header section - ALL INLINE STYLES */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '20px', 
              fontWeight: 600, 
              color: '#0f172a',
              display: 'block',
              lineHeight: 1.2,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              Activity
            </span>
            <span style={{ 
              fontSize: '14px', 
              color: '#64748b',
              display: 'block',
              marginTop: '4px',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              Updates from friends, clubs, courses & messages.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleMarkAllAsRead}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Mark all as read"
            >
              <Bell style={{ width: '16px', height: '16px', color: '#1f2428' }} />
            </button>
            <button 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Notification settings"
            >
              <Settings style={{ width: '16px', height: '16px', color: '#1f2428' }} />
            </button>
          </div>
        </div>

        {/* Filter tabs - keep some Tailwind here since tabs text DOES show */}
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
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            <p>Failed to load activity</p>
          </div>
        ) : isEmpty || !buckets ? (
          <ActivityEmptyState tab={activeTab} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Today */}
            {buckets.today.length > 0 && (
              <section>
                <h2 style={{ 
                  marginBottom: '8px', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Today
                </h2>
                <div style={{ 
                  borderRadius: '18px', 
                  backgroundColor: '#ffffff', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
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
                <h2 style={{ 
                  marginBottom: '8px', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Yesterday
                </h2>
                <div style={{ 
                  borderRadius: '18px', 
                  backgroundColor: '#ffffff', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
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
                <h2 style={{ 
                  marginBottom: '8px', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  This Week
                </h2>
                <div style={{ 
                  borderRadius: '18px', 
                  backgroundColor: '#ffffff', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
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
                <h2 style={{ 
                  marginBottom: '8px', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.5px',
                  color: '#64748b',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Earlier
                </h2>
                <div style={{ 
                  borderRadius: '18px', 
                  backgroundColor: '#ffffff', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}>
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
      </div>
    </div>
  );
};

export default ActivityPage;
