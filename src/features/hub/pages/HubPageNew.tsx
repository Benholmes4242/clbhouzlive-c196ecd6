/**
 * HubPageNew - Hub 2.0: The 19th Hole, Reimagined
 * Fixed viewport, non-scrolling layout with dual Liquid Glass cards
 * Messages (blue) + Echo (orange) - 50/50 split
 */

import { useState, useCallback, useMemo } from 'react';
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
import { HubEchoSheet } from '../components/HubEchoSheet';

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
  
  // Sheet states
  const [echoOpen, setEchoOpen] = useState(false);
  const [echoInitialPrompt, setEchoInitialPrompt] = useState<string | undefined>();
  const [recentEchoContext, setRecentEchoContext] = useState<string | null>(null);
  
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
  
  // Echo sheet opener with optional initial prompt
  const handleOpenEcho = useCallback((initialPrompt?: string) => {
    haptic('light');
    setEchoInitialPrompt(initialPrompt);
    setEchoOpen(true);
    
    if (initialPrompt) {
      setRecentEchoContext(initialPrompt);
    }
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <PageRoot className="h-screen flex flex-col overflow-hidden bg-[#F8FAFC]">
        <HubPageSkeleton />
      </PageRoot>
    );
  }

  return (
    <PageRoot className="h-screen flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* HEADER — fixed height */}
      <header 
        className="flex-none px-5 pt-6 pb-4"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-[15px] text-gray-500 mt-1">
              Your golf conversations
            </p>
          </div>
          
          {/* Profile Avatar - Squircle shape */}
          <motion.button
            onClick={handleOpenProfile}
            onMouseEnter={prefetchHandlers.onMouseEnter}
            onTouchStart={prefetchHandlers.onTouchStart}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <SquircleAvatar
              size={56}
              src={profile?.profile_photo_url || undefined}
              alt={displayName}
              fallback={firstName.charAt(0).toUpperCase()}
              className="shadow-lg ring-[3px] ring-white"
            />
          </motion.button>
        </div>
      </header>

      {/* CARDS CONTAINER — flexible, no scroll */}
      <motion.main 
        className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4 px-5 pb-4"
        style={{
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Messages Card - flex-1 */}
        <motion.section 
          variants={cardVariants} 
          className="flex-1 min-h-0 overflow-hidden"
        >
          <HubMessagesCardPolished 
            conversations={conversations || []}
            userId={user?.id}
            unreadCount={unreadCount}
          />
        </motion.section>

        {/* Echo Card - flex-1 */}
        <motion.section 
          variants={cardVariants} 
          className="flex-1 min-h-0 overflow-hidden"
        >
          <HubEchoCardPolished 
            onOpenEcho={handleOpenEcho}
            recentContext={recentEchoContext}
          />
        </motion.section>
      </motion.main>

      {/* Echo Sheet */}
      <HubEchoSheet 
        isOpen={echoOpen} 
        onClose={() => {
          setEchoOpen(false);
          setEchoInitialPrompt(undefined);
        }}
      />
    </PageRoot>
  );
}

export default HubPageNew;
