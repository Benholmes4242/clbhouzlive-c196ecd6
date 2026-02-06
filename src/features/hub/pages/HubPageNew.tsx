/**
 * HubPageNew - Hub 2.0: Premium Personal Dashboard
 * A* Polish — all inline styles, stagger animations, gradient bg
 */

import { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessaging } from '@/hooks/useMessaging';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WifiOff, RefreshCw, Sun, Moon, Sunrise, Sunset, ChevronDown } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

import { 
  HubMessagesCardPolished, 
  HubEchoCardPolished, 
  HubPageSkeleton,
} from '../components/hub-v2';
import { HUB_COLORS } from '../constants/hubTheme';

// ============ Greeting Icon Helper ============
function GreetingIcon({ hour }: { hour: number }) {
  const iconClass = "w-5 h-5";
  const style = { color: HUB_COLORS.textSecondary };
  
  if (hour >= 5 && hour < 12) return <Sunrise className={iconClass} style={style} />;
  if (hour >= 12 && hour < 17) return <Sun className={iconClass} style={style} />;
  if (hour >= 17 && hour < 21) return <Sunset className={iconClass} style={style} />;
  return <Moon className={iconClass} style={style} />;
}

// ============ Animation Variants ============
const getContainerVariants = (prefersReduced: boolean) => ({
  hidden: { opacity: prefersReduced ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: prefersReduced 
      ? { duration: 0 }
      : { staggerChildren: 0.1, delayChildren: 0.15 },
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
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile(user?.id);
  const { conversations, loading: conversationsLoading, error: messagingError, fetchConversations } = useMessaging();
  const { prefetchHandlers } = useProfilePrefetch(user?.id);
  const prefersReduced = usePrefersReducedMotion();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshHint, setShowRefreshHint] = useState(true);
  
  // Hide the refresh hint after 3s
  useEffect(() => {
    const timer = setTimeout(() => setShowRefreshHint(false), 3000);
    return () => clearTimeout(timer);
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
  const currentHour = new Date().getHours();

  const getGreeting = useCallback(() => {
    if (currentHour >= 5 && currentHour < 12) return 'Good morning';
    if (currentHour >= 12 && currentHour < 17) return 'Good afternoon';
    if (currentHour >= 17 && currentHour < 21) return 'Good evening';
    return 'Good night';
  }, [currentHour]);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    haptic('light');
    try {
      await Promise.all([
        refetchProfile?.(),
        fetchConversations?.(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };
  
  const unreadCount = useMemo(() => {
    return conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
  }, [conversations]);

  const handleOpenProfile = () => {
    prefetchHandlers.onTouchStart();
    haptic('light');
    navigate('/profile');
  };
  
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
      <PageRoot fixedHeight className="hub-page" style={{ background: HUB_COLORS.pageBg }}>
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
      <PageRoot fixedHeight className="hub-page" style={{ background: HUB_COLORS.pageBg }}>
        <div 
          className="flex-1 flex flex-col items-center justify-center px-6"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#FEE2E2' }}>
            <RefreshCw className="w-8 h-8" style={{ color: '#EF4444' }} />
          </div>
          <h2 className="text-[1.25rem] font-semibold mb-2" style={{ color: HUB_COLORS.textPrimary }}>
            Couldn't load your Hub
          </h2>
          <p className="text-[0.9375rem] text-center mb-6" style={{ color: HUB_COLORS.textSecondary }}>
            Check your connection and try again
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-white rounded-full text-[0.9375rem] font-semibold active:scale-95 transition-transform"
            style={{ backgroundColor: HUB_COLORS.unreadGreen }}
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
        background: `linear-gradient(180deg, ${HUB_COLORS.pageBg} 0%, ${HUB_COLORS.pageBgEnd} 100%)`,
      }}
    >
      <div 
        className="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* Offline banner */}
        {!isOnline && (
          <div 
            className="flex-none flex items-center justify-center gap-2 py-2 px-4"
            style={{ backgroundColor: HUB_COLORS.offlineBg }}
          >
            <WifiOff className="w-4 h-4" style={{ color: HUB_COLORS.offlineText }} />
            <span className="text-[0.8125rem] font-medium" style={{ color: HUB_COLORS.offlineText }}>
              You're offline — showing cached data
            </span>
          </div>
        )}
        
        {/* Header with stagger animation */}
        <motion.header 
          className="flex-none px-5 pt-8 pb-6"
          style={{ background: 'transparent' }}
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between">
            {/* Greeting - tappable for refresh */}
            <button
              onClick={handleRefresh}
              className="flex-1 min-w-0 mr-4 text-left group"
              aria-label={`${getGreeting()}, ${firstName}. Tap to refresh`}
            >
              <h1 className="text-[1.75rem] font-bold tracking-tight flex flex-col" style={{ color: HUB_COLORS.textPrimary, lineHeight: 1.2 }}>
                <span className="flex items-center gap-2">
                  {getGreeting()},
                  <GreetingIcon hour={currentHour} />
                </span>
                <motion.span 
                  className={`truncate transition-opacity duration-200 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
                  initial={prefersReduced ? {} : { opacity: 0, x: -8 }}
                  animate={{ opacity: isRefreshing ? 0.5 : 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}
                >
                  {firstName}
                </motion.span>
              </h1>
              {/* Refresh hint - subtle chevron that fades out */}
              {showRefreshHint && !prefersReduced && (
                <motion.div
                  className="flex items-center gap-1 mt-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0.5, 0] }}
                  transition={{ duration: 3, times: [0, 0.2, 0.7, 1] }}
                >
                  <ChevronDown className="w-3 h-3" style={{ color: HUB_COLORS.textSecondary }} />
                  <span className="text-[11px]" style={{ color: HUB_COLORS.textSecondary }}>
                    Tap to refresh
                  </span>
                </motion.div>
              )}
            </button>
            
            {/* Avatar with ring treatment + dual badge indicators */}
            <div className="relative flex-shrink-0">
              <motion.button
                onClick={handleOpenProfile}
                onMouseEnter={prefetchHandlers.onMouseEnter}
                onTouchStart={prefetchHandlers.onTouchStart}
                whileTap={{ scale: 0.95 }}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-full ring-2 ring-white/90 shadow-md"
                aria-label="Open profile"
              >
                <SquircleAvatar
                  size={64}
                  src={profile?.profile_photo_url}
                  alt={displayName}
                  fallback={firstName.charAt(0).toUpperCase()}
                  hideRing
                />
              </motion.button>
              
              {/* Green message dot — bottom-right */}
              {unreadCount > 0 && (
                <div 
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                  style={{ 
                    backgroundColor: HUB_COLORS.unreadGreen, 
                    borderColor: HUB_COLORS.pageBg,
                  }}
                  aria-hidden="true"
                />
              )}
              
              {/* Orange notification dot — top-right */}
              {hasUnreadNotifications && (
                <div 
                  className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                  style={{ 
                    backgroundColor: HUB_COLORS.notificationOrange, 
                    borderColor: HUB_COLORS.pageBg,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </motion.header>

        {/* Cards container - gap-4 for breathing */}
        <motion.div 
          className="flex-1 flex flex-col px-4 gap-4 min-h-0 overflow-y-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Messages Card */}
          <motion.div 
            variants={cardVariants} 
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
            style={{ willChange: 'transform' }}
          >
            <HubMessagesCardPolished 
              conversations={conversations || []}
              userId={user?.id}
              unreadCount={unreadCount}
              isLoading={conversationsLoading}
              className="h-full"
            />
          </motion.div>

          {/* Echo Card */}
          <motion.div 
            variants={cardVariants} 
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
            style={{ willChange: 'transform' }}
          >
            <HubEchoCardPolished 
              onOpenEcho={handleOpenEcho}
              expandable
              className="h-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </PageRoot>
  );
}

export default HubPageNew;
