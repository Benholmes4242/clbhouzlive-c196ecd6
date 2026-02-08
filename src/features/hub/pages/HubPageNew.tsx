/**
 * HubPageNew - Hub 2.0: Premium Personal Dashboard
 * Redesigned with Quick Actions row, At a Glance stats, semantic tokens,
 * pull-to-refresh, and reactive greeting.
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessaging } from '@/hooks/useMessaging';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WifiOff, RefreshCw, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { haptic } from '@/utils/haptics';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';

import { 
  HubMessagesCardPolished, 
  HubEchoCardPolished, 
  HubPageSkeleton,
} from '../components/hub-v2';
import { HubQuickActions } from '../components/hub-v2/HubQuickActions';
import { HubAtAGlanceCard } from '../components/hub-v2/HubAtAGlanceCard';
import { HUB_COLORS } from '../constants/hubTheme';

// ============ Greeting Icon Helper ============
function GreetingIcon({ hour }: { hour: number }) {
  const iconClass = "w-5 h-5";
  
  if (hour >= 5 && hour < 12) return <Sunrise className={iconClass + " text-muted-foreground"} />;
  if (hour >= 12 && hour < 17) return <Sun className={iconClass + " text-muted-foreground"} />;
  if (hour >= 17 && hour < 21) return <Sunset className={iconClass + " text-muted-foreground"} />;
  return <Moon className={iconClass + " text-muted-foreground"} />;
}

// ============ Animation Variants ============
const getContainerVariants = (prefersReduced: boolean) => ({
  hidden: { opacity: prefersReduced ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: prefersReduced 
      ? { duration: 0 }
      : { staggerChildren: 0.05, delayChildren: 0.1 },
  },
});

const getCardVariants = (prefersReduced: boolean) => ({
  hidden: prefersReduced 
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 0, y: 16, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: prefersReduced 
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 350, damping: 28 },
  },
});

const getHeaderVariants = (prefersReduced: boolean) => ({
  hidden: prefersReduced 
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: prefersReduced
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
});

// ============ Component ============

export function HubPageNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile(user?.id);
  const { conversations, loading: conversationsLoading, error: messagingError, fetchConversations } = useMessaging();
  const { prefetchHandlers } = useProfilePrefetch(user?.id);
  const prefersReduced = usePrefersReducedMotion();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Reactive greeting — re-evaluate on visibility change
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  
  useEffect(() => {
    const update = () => setCurrentHour(new Date().getHours());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') update();
    });
    // Also update every minute
    const interval = setInterval(update, 60_000);
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    if (!sessionLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, sessionLoading, navigate]);
  
  const { data: unreadNotificationCount } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)
        .not('type', 'in', '("message","message_received","dm")');
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
  
  const hasUnreadNotifications = (unreadNotificationCount || 0) > 0;
  
  const isLoading = sessionLoading || profileLoading;
  const hasError = !!(profileError || messagingError);
  
  const displayName = profile?.display_name || 'Golfer';
  const firstName = displayName.split(' ')[0];

  const getGreeting = useCallback(() => {
    if (currentHour >= 5 && currentHour < 12) return 'Good morning';
    if (currentHour >= 12 && currentHour < 17) return 'Good afternoon';
    if (currentHour >= 17 && currentHour < 21) return 'Good evening';
    return 'Good night';
  }, [currentHour]);
  
  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    haptic('light');
    await Promise.all([
      refetchProfile?.(),
      fetchConversations?.(),
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['top100-progress-user'] }),
    ]);
  }, [refetchProfile, fetchConversations, queryClient]);

  const {
    containerRef,
    handlers: pullHandlers,
    isRefreshing,
    pullDistance,
    pullProgress,
  } = usePullToRefresh({ onRefresh: handleRefresh });
  
  const unreadCount = useMemo(() => {
    return conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
  }, [conversations]);
  
  const handleOpenEcho = useCallback((initialPrompt?: string) => {
    haptic('light');
    if (initialPrompt) {
      navigate(`/echo?prompt=${encodeURIComponent(initialPrompt)}`);
    } else {
      navigate('/echo');
    }
  }, [navigate]);
  
  const containerVariants = useMemo(() => getContainerVariants(prefersReduced), [prefersReduced]);
  const cardVariants = useMemo(() => getCardVariants(prefersReduced), [prefersReduced]);
  const headerVariants = useMemo(() => getHeaderVariants(prefersReduced), [prefersReduced]);

  if (isLoading) {
    return (
      <PageRoot fixedHeight className="hub-page" style={{ background: 'hsl(var(--background))' }}>
        <div 
          className="flex-1 flex flex-col px-4 pt-8"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <HubPageSkeleton />
        </div>
      </PageRoot>
    );
  }

  if (hasError && !sessionLoading) {
    return (
      <PageRoot fixedHeight className="hub-page" style={{ background: 'hsl(var(--background))' }}>
        <div 
          className="flex-1 flex flex-col items-center justify-center px-6"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-destructive/5">
            <RefreshCw className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-[1.25rem] font-semibold mb-2 text-foreground">
            Couldn't load your Hub
          </h2>
          <p className="text-[0.9375rem] text-center mb-6 text-muted-foreground">
            Check your connection and try again
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-white rounded-full text-[0.9375rem] font-semibold active:scale-95 transition-transform bg-primary"
          >
            Try Again
          </button>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot 
      fixedHeight
      className="hub-page"
      style={{ 
        background: `linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.3) 100%)`,
      }}
    >
      <div 
        ref={containerRef}
        {...pullHandlers}
        className="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full overflow-y-auto relative"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* Pull-to-refresh indicator */}
        <PullToRefreshIndicator
          isRefreshing={isRefreshing}
          pullDistance={pullDistance}
          pullProgress={pullProgress}
        />

        <div
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: isRefreshing ? 'transform 0.2s ease-out' : 'none',
          }}
        >
          {/* Offline banner */}
          {!isOnline && (
            <div className="flex-none flex items-center justify-center gap-2 py-2 px-4 bg-amber-50 dark:bg-amber-950/30">
              <WifiOff className="w-4 h-4 text-amber-800 dark:text-amber-200" />
              <span className="text-[0.8125rem] font-medium text-amber-800 dark:text-amber-200">
                You're offline — showing cached data
              </span>
            </div>
          )}
          
          {/* Header with greeting + quick actions */}
          <motion.header 
            className="flex-none px-5 pt-8 pb-6"
            style={{ background: 'transparent' }}
            variants={headerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center justify-between">
              {/* Greeting */}
              <div className="flex-1 min-w-0 mr-4">
                <h1 className="text-[1.75rem] font-bold tracking-tight flex flex-col text-foreground" style={{ lineHeight: 1.2 }}>
                  <span className="flex items-center gap-2">
                    {getGreeting()},
                    <GreetingIcon hour={currentHour} />
                  </span>
                  <motion.span 
                    className="truncate"
                    initial={prefersReduced ? {} : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
                  >
                    {firstName}
                  </motion.span>
                </h1>
              </div>
              
              {/* Quick Actions Row — replaces single avatar */}
              <HubQuickActions
                profilePhotoUrl={profile?.profile_photo_url}
                displayName={displayName}
                firstName={firstName}
                hasUnreadNotifications={hasUnreadNotifications}
                unreadNotificationCount={unreadNotificationCount || 0}
                unreadMessageCount={unreadCount}
                onProfilePrefetch={prefetchHandlers}
              />
            </div>
          </motion.header>

          {/* Cards container */}
          <motion.div 
            className="flex flex-col gap-4 px-4 pb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Messages Card */}
            <motion.div variants={cardVariants} style={{ willChange: 'transform' }}>
              <HubMessagesCardPolished 
                conversations={conversations || []}
                userId={user?.id}
                unreadCount={unreadCount}
                isLoading={conversationsLoading}
              />
            </motion.div>

            {/* At a Glance Card */}
            <motion.div variants={cardVariants} style={{ willChange: 'transform' }}>
              <HubAtAGlanceCard
                userId={user?.id}
                handicapIndex={profile?.eg_handicap_index ?? null}
                top100Count={null}
              />
            </motion.div>

            {/* Echo Card */}
            <motion.div variants={cardVariants} style={{ willChange: 'transform' }}>
              <HubEchoCardPolished 
                onOpenEcho={handleOpenEcho}
                expandable
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageRoot>
  );
}

export default HubPageNew;
