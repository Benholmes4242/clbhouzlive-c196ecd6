/**
 * HubPageNew - Hub 2.0: WhatsApp-Style Chat Bubble Design
 * Clean, minimal, content-focused
 */

import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessaging } from '@/hooks/useMessaging';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { PageRoot } from '@/components/layout/PageRoot';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Hub 2.0 modular components
import { 
  HubMessagesCardPolished, 
  HubEchoCardPolished, 
  HubPageSkeleton,
} from '../components/hub-v2';

// ============ Animation Variants ============
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 28,
    },
  },
};

// ============ Component ============

export function HubPageNew() {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { conversations } = useMessaging();
  const { prefetchHandlers } = useProfilePrefetch(user?.id);
  
  // Loading state
  const isLoading = sessionLoading || profileLoading;
  
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

  // Show skeleton while loading
  if (isLoading) {
    return (
      <PageRoot className="min-h-screen bg-[#F0F2F5]">
        <div className="max-w-[500px] mx-auto px-4 pt-8 pb-24">
          <HubPageSkeleton />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-[#F0F2F5] flex flex-col">
      {/* Header - WhatsApp style - fixed height */}
      <header 
        className="flex-none bg-[#F0F2F5] px-5 pb-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 32px)',
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
          <motion.button
            onClick={handleOpenProfile}
            onMouseEnter={prefetchHandlers.onMouseEnter}
            onTouchStart={prefetchHandlers.onTouchStart}
            whileTap={{ scale: 0.95 }}
            className="focus:outline-none"
          >
            <SquircleAvatar
              size={48}
              src={profile?.profile_photo_url}
              alt={displayName}
              fallback={firstName.charAt(0).toUpperCase()}
              className="shadow-sm"
            />
          </motion.button>
        </div>
      </header>

      {/* Cards container - fills remaining space */}
      <motion.div 
        className="flex-1 flex flex-col px-4 gap-3 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Messages Card - fixed height */}
        <motion.div variants={cardVariants} className="flex-none">
          <HubMessagesCardPolished 
            conversations={conversations || []}
            userId={user?.id}
            unreadCount={unreadCount}
          />
        </motion.div>

        {/* Echo Card - expands to fill remaining space */}
        <motion.div variants={cardVariants} className="flex-1 flex flex-col min-h-[200px]">
          <HubEchoCardPolished 
            onOpenEcho={handleOpenEcho}
            expandable
          />
        </motion.div>
      </motion.div>
    </PageRoot>
  );
}

export default HubPageNew;