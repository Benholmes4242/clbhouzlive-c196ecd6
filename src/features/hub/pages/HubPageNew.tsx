/**
 * HubPageNew - Hub 2.0: The 19th Hole, Reimagined
 * Professional polish with Apple-grade finish
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
      <PageRoot className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-[500px] mx-auto px-4 pt-6 pb-24">
          <HubPageSkeleton />
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC]">
      <div 
        className="max-w-[500px] mx-auto px-4 pb-24"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        }}
      >
        {/* HEADER — Refined greeting */}
        <header className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight leading-[1.1]">
              {getGreeting()},
              <br />
              {firstName}
            </h1>
            <p className="text-[15px] text-[#86868B] mt-2">
              Your golf conversations
            </p>
          </div>
          
          {/* Profile Avatar - Prominent with ring & shadow */}
          <motion.button
            onClick={handleOpenProfile}
            onMouseEnter={prefetchHandlers.onMouseEnter}
            onTouchStart={prefetchHandlers.onTouchStart}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 rounded-full overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.1)] ring-2 ring-white"
          >
            {profile?.profile_photo_url ? (
              <img 
                src={profile.profile_photo_url} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-[20px] font-semibold text-gray-600">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </motion.button>
        </header>

        {/* CARDS CONTAINER */}
        <motion.main 
          className="flex flex-col gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Messages Card */}
          <motion.section variants={cardVariants}>
            <HubMessagesCardPolished 
              conversations={conversations || []}
              userId={user?.id}
              unreadCount={unreadCount}
            />
          </motion.section>

          {/* Echo Card */}
          <motion.section variants={cardVariants}>
            <HubEchoCardPolished 
              onOpenEcho={handleOpenEcho}
            />
          </motion.section>
        </motion.main>
      </div>
    </PageRoot>
  );
}

export default HubPageNew;
