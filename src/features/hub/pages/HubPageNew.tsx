 /**
  * HubPageNew - Hub 2.0: WhatsApp-Style Chat Bubble Design
  * Clean, minimal, content-focused
  * A* Level - All 18 fixes applied
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
 import { WifiOff, RefreshCw } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Hub 2.0 modular components
 import { 
   HubMessagesCardPolished, 
   HubEchoCardPolished, 
   HubPageSkeleton,
 } from '../components/hub-v2';
 import { HUB_COLORS } from '../constants/hubTheme';

 // ============ Animation Variants (Reduced Motion Aware) ============
 const getContainerVariants = (prefersReduced: boolean) => ({
   hidden: { opacity: prefersReduced ? 1 : 0 },
   visible: {
     opacity: 1,
     transition: prefersReduced 
       ? { duration: 0 }
       : { staggerChildren: 0.08, delayChildren: 0.1 },
   },
 });
 
 const getCardVariants = (prefersReduced: boolean) => ({
   hidden: prefersReduced 
     ? { opacity: 1, y: 0, scale: 1 }
     : { opacity: 0, y: 20, scale: 0.98 },
   visible: { 
     opacity: 1, 
     y: 0,
     scale: 1,
     transition: prefersReduced 
       ? { duration: 0 }
       : { type: 'spring' as const, stiffness: 350, damping: 28 },
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
   
   // Online/offline state
   const [isOnline, setIsOnline] = useState(navigator.onLine);
   const [isRefreshing, setIsRefreshing] = useState(false);
   
   // Track online/offline status
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
   
   // Session expiry redirect
   useEffect(() => {
     if (!sessionLoading && !user) {
       navigate('/auth', { replace: true });
     }
   }, [user, sessionLoading, navigate]);
   
   // Unread notifications query (for orange badge)
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
  
  // Loading state
  const isLoading = sessionLoading || profileLoading;
   const hasError = !!(profileError || messagingError);
  
  const displayName = profile?.display_name || 'Golfer';
  const firstName = displayName.split(' ')[0];

  // Dynamic greeting based on time of day
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  }, []);
   
   // Manual refresh handler
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
  
  // Total unread count
  const unreadCount = useMemo(() => {
    return conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
  }, [conversations]);

  const handleOpenProfile = () => {
    prefetchHandlers.onTouchStart();
    haptic('light');
    navigate('/profile');
  };
  
  // Navigate directly to Echo full page
  const handleOpenEcho = useCallback((initialPrompt?: string) => {
    haptic('light');
    
    if (initialPrompt) {
      navigate(`/echo?prompt=${encodeURIComponent(initialPrompt)}`);
    } else {
      navigate('/echo');
    }
  }, [navigate]);
   
   // Animation variants (reduced motion aware)
   const containerVariants = useMemo(() => getContainerVariants(prefersReduced), [prefersReduced]);
   const cardVariants = useMemo(() => getCardVariants(prefersReduced), [prefersReduced]);

  // Show skeleton while loading
  if (isLoading) {
    return (
       <PageRoot fixedHeight className={`hub-page bg-[${HUB_COLORS.pageBg}]`}>
        <div 
          className="flex-1 flex flex-col px-4 pt-8"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <HubPageSkeleton />
        </div>
      </PageRoot>
    );
  }
 
   // Error state with retry
   if (hasError && !sessionLoading) {
     return (
       <PageRoot fixedHeight className={`hub-page bg-[${HUB_COLORS.pageBg}]`}>
         <div 
           className="flex-1 flex flex-col items-center justify-center px-6"
           style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
         >
           <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
             <RefreshCw className="w-8 h-8 text-red-500" />
           </div>
           <h2 className="text-[1.25rem] font-semibold text-[#1D1D1F] mb-2">
             Couldn't load your Hub
           </h2>
           <p className="text-[0.9375rem] text-[#8E8E93] text-center mb-6">
             Check your connection and try again
           </p>
           <button
             onClick={() => window.location.reload()}
             className={`px-6 py-3 bg-[${HUB_COLORS.unreadGreen}] text-white rounded-full text-[0.9375rem] font-semibold active:scale-95 transition-transform`}
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
       className={`hub-page bg-[${HUB_COLORS.pageBg}]`}
    >
      {/* Main content wrapper - accounts for safe areas */}
       <div 
         className="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
        }}
      >
         {/* Offline banner */}
         {!isOnline && (
           <div className={`flex-none flex items-center justify-center gap-2 py-2 px-4 bg-[${HUB_COLORS.offlineBg}]`}>
             <WifiOff className={`w-4 h-4 text-[${HUB_COLORS.offlineText}]`} />
             <span className={`text-[0.8125rem] font-medium text-[${HUB_COLORS.offlineText}]`}>
               You're offline — showing cached data
             </span>
           </div>
         )}
         
         {/* Header - WhatsApp style - fixed height */}
         <header className={`flex-none bg-[${HUB_COLORS.pageBg}] px-5 pt-8 pb-4`}>
          <div className="flex items-center justify-between">
             {/* Greeting - tappable for refresh */}
             <button
               onClick={handleRefresh}
               className="flex-1 min-w-0 mr-4 text-left"
               aria-label={`${getGreeting()}, ${firstName}. Tap to refresh`}
             >
               <h1 className="text-[1.75rem] font-bold text-[#1D1D1F] tracking-tight flex flex-col">
                 <span>{getGreeting()},</span>
                 <span 
                   className={`truncate transition-opacity duration-200 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
                 >
                   {firstName}
                 </span>
               </h1>
             </button>
             
             {/* Avatar with dual badge indicators */}
             <div className="relative flex-shrink-0">
               <motion.button
                 onClick={handleOpenProfile}
                 onMouseEnter={prefetchHandlers.onMouseEnter}
                 onTouchStart={prefetchHandlers.onTouchStart}
                 whileTap={{ scale: 0.95 }}
                 className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D5C] focus-visible:ring-offset-2 rounded-full"
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
                   className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[${HUB_COLORS.unreadGreen}] border-2 border-[${HUB_COLORS.pageBg}]`}
                   aria-hidden="true"
                 />
               )}
               
               {/* Orange notification dot — top-right */}
               {hasUnreadNotifications && (
                 <div 
                   className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[${HUB_COLORS.notificationOrange}] border-2 border-[${HUB_COLORS.pageBg}]`}
                   aria-hidden="true"
                 />
               )}
             </div>
          </div>
        </header>

        {/* Cards container - fills remaining space with 50/50 split */}
        <motion.div 
          className="flex-1 flex flex-col px-4 gap-3 min-h-0 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Messages Card - takes half the space */}
          <motion.div variants={cardVariants} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <HubMessagesCardPolished 
              conversations={conversations || []}
              userId={user?.id}
              unreadCount={unreadCount}
               isLoading={conversationsLoading}
              className="h-full"
            />
          </motion.div>

          {/* Echo Card - takes half the space */}
          <motion.div variants={cardVariants} className="flex-1 flex flex-col min-h-0 overflow-hidden">
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