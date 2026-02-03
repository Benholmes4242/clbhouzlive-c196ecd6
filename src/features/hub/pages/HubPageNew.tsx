/**
 * HubPageNew - Hub 2.0: The 19th Hole, Reimagined
 * Dark-mode only, fixed viewport, non-scrolling layout
 * Messages + Echo dual liquid glass cards
 */

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessaging } from '@/hooks/useMessaging';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Hub 2.0 dark mode components
import { HubMessagesCardDark } from '../components/hub-v2/HubMessagesCardDark';
import { HubEchoCardDark } from '../components/hub-v2/HubEchoCardDark';
import { HubPageSkeleton } from '../components/hub-v2';
import { HubEchoSheet } from '../components/HubEchoSheet';

// ============ System Font Stack ============
const systemFontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

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
  hidden: { opacity: 0, y: 16, scale: 0.98 },
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
      <div 
        className="h-screen flex flex-col overflow-hidden"
        style={{ background: 'hsl(222 47% 11%)' }}
      >
        <HubPageSkeleton />
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'hsl(222 47% 11%)' }}
    >
      {/* Subtle dark gradient overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 15%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 85%, rgba(251, 146, 60, 0.06) 0%, transparent 40%)
          `,
        }}
      />
      
      <FadeInContent className="relative z-10 flex flex-col h-full">
        {/* Header - flex-none */}
        <header 
          className="flex-none px-5 pt-3 pb-3"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            fontFamily: systemFontStack,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-4">
              <h1 
                className="font-bold tracking-tight truncate"
                style={{ fontSize: '26px', lineHeight: 1.15, color: 'white' }}
              >
                {getGreeting()}, {firstName}
              </h1>
              <p 
                className="mt-0.5 truncate"
                style={{ 
                  fontSize: '15px', 
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                Your golf conversations
              </p>
            </div>
            
            {/* User Avatar with subtle glass ring */}
            <motion.button
              onClick={handleOpenProfile}
              onMouseEnter={prefetchHandlers.onMouseEnter}
              onTouchStart={prefetchHandlers.onTouchStart}
              whileTap={{ scale: 0.95 }}
              className="relative flex-shrink-0"
              style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                borderRadius: '34%',
              }}
            >
              <div
                className="absolute -inset-[3px] pointer-events-none"
                style={{
                  borderRadius: '34%',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                }}
              />
              <SquircleAvatar
                size={44}
                src={profile?.profile_photo_url || undefined}
                alt={displayName}
                fallback={firstName.charAt(0).toUpperCase()}
                hideRing
              />
            </motion.button>
          </div>
        </header>

        {/* Main Content Area - flex-1 min-h-0 overflow-hidden */}
        <motion.div 
          className="flex-1 min-h-0 overflow-hidden flex flex-col gap-4 px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Messages Card - flex-1 min-h-0 */}
          <motion.div variants={cardVariants} className="flex-1 min-h-0 flex flex-col">
            <HubMessagesCardDark 
              conversations={conversations || []}
              userId={user?.id}
              unreadCount={unreadCount}
              className="flex-1 min-h-0"
            />
          </motion.div>

          {/* Echo Card - flex-1 min-h-0 */}
          <motion.div variants={cardVariants} className="flex-1 min-h-0 flex flex-col">
            <HubEchoCardDark 
              onOpenEcho={handleOpenEcho}
              recentContext={recentEchoContext}
              className="flex-1 min-h-0"
            />
          </motion.div>
        </motion.div>
      </FadeInContent>

      {/* Echo Sheet */}
      <HubEchoSheet 
        isOpen={echoOpen} 
        onClose={() => {
          setEchoOpen(false);
          setEchoInitialPrompt(undefined);
        }}
      />

      {/* 
        ========== COMMENTED OUT FOR LATER ==========
        Create Game/Trip and Schedule sections
        
        <HubCreateGameCard />
        <HubScheduleCard />
      */}
    </div>
  );
}

export default HubPageNew;
