/**
 * HubPageNew - Hub 2.0: The 19th Hole, Reimagined
 * Apple-grade polish with fixed viewport layout
 * Messages + Echo dual-card layout
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessaging } from '@/hooks/useMessaging';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Hub 2.0 modular components
import { 
  HubMessagesCardPolished, 
  HubEchoCardPolished, 
  HubPageSkeleton,
} from '../components/hub-v2';
import { HubEchoSheet } from '../components/HubEchoSheet';

// ============ System Font Stack ============
const systemFontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

// ============ Animation Variants ============
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
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
      <PageRoot className="h-screen flex flex-col overflow-hidden bg-background">
        <div 
          className="fixed inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(210 40% 96%) 40%, hsl(210 35% 94%) 70%, hsl(220 30% 96%) 100%)',
          }}
        />
        <HubPageSkeleton />
      </PageRoot>
    );
  }

  return (
    <PageRoot className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Soft gradient background */}
      <div 
        className="fixed inset-0"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(210 40% 96%) 40%, hsl(210 35% 94%) 70%, hsl(220 30% 96%) 100%)',
        }}
      />
      
      {/* Subtle depth layers */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(27, 94, 58, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 40%)
          `,
        }}
      />
      
      <FadeInContent className="relative z-10 flex flex-col h-full">
        {/* Header - flex-none */}
        <header 
          className="flex-none px-5 pt-3 pb-4"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            fontFamily: systemFontStack,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 
                className="font-bold tracking-tight text-foreground"
                style={{ fontSize: '28px', lineHeight: 1.15 }}
              >
                {getGreeting()}, {firstName}
              </h1>
              <p 
                className="mt-0.5"
                style={{ 
                  fontSize: '15px', 
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                Your golf conversations
              </p>
            </div>
            
            {/* User Avatar with ring border */}
            <motion.button
              onClick={handleOpenProfile}
              onMouseEnter={prefetchHandlers.onMouseEnter}
              onTouchStart={prefetchHandlers.onTouchStart}
              whileTap={{ scale: 0.95 }}
              className="relative"
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: '34%',
              }}
            >
              <div
                className="absolute -inset-[3px] pointer-events-none"
                style={{
                  borderRadius: '34%',
                  border: '2px solid rgba(148, 163, 184, 0.3)',
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

        {/* Main Content Area - flex-1 with min-h-0 for proper flex behavior */}
        <motion.div 
          className="flex-1 min-h-0 flex flex-col gap-4 px-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Messages Card - flex-1 */}
          <motion.div variants={cardVariants} className="flex-1 min-h-0 flex flex-col">
            <HubMessagesCardPolished 
              conversations={conversations || []}
              userId={user?.id}
              unreadCount={unreadCount}
            />
          </motion.div>

          {/* Echo Card - flex-1 */}
          <motion.div variants={cardVariants} className="flex-1 min-h-0 flex flex-col">
            <HubEchoCardPolished 
              onOpenEcho={handleOpenEcho}
              recentContext={recentEchoContext}
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
    </PageRoot>
  );
}

export default HubPageNew;
