/**
 * HubPageNew - Hub 2.0: The 19th Hole, Reimagined
 * Dual-soul layout: Messages (connection) + Echo (intelligence)
 * Liquid Golf design language with contextual awareness
 * 
 * Phase 1-5: Complete implementation
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, BarChart3, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessaging } from '@/hooks/useMessaging';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

// Hub 2.0 modular components
import { 
  HubMessagesCard, 
  HubEchoCard, 
  GolfGrapevine,
  HubPageSkeleton,
} from '../components/hub-v2';
import { HubEchoSheet } from '../components/HubEchoSheet';

// ============ Liquid Golf Styles ============

const liquidGlassStyle = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.75) 50%, rgba(255, 255, 255, 0.8) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
};

const echoGlassStyle = {
  background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.12) 0%, rgba(247, 147, 30, 0.08) 50%, rgba(245, 166, 35, 0.1) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(245, 166, 35, 0.25)',
  boxShadow: '0 8px 32px rgba(245, 166, 35, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
};

// ============ Animation Variants (Golf Swing Curve) ============

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
  const { hasCreatorFeatures } = usePermissions();
  const { prefetchHandlers } = useProfilePrefetch(user?.id);
  
  // Sheet states
  const [echoOpen, setEchoOpen] = useState(false);
  const [echoInitialPrompt, setEchoInitialPrompt] = useState<string | undefined>();
  const [recentEchoContext, setRecentEchoContext] = useState<string | null>(null);
  
  // Loading state
  const isLoading = sessionLoading || profileLoading;
  
  // Check if user is a new creator (enabled within last 24 hours)
  const isNewCreator = useMemo(() => {
    const creatorEnabledAt = (profile as any)?.creator_enabled_at;
    if (!creatorEnabledAt || !hasCreatorFeatures) return false;
    const enabledTime = new Date(creatorEnabledAt).getTime();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return enabledTime > oneDayAgo;
  }, [profile, hasCreatorFeatures]);

  // Track Hub open
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', analyticsEvents.hub.opened.event, {
        event_category: analyticsEvents.hub.opened.category,
        event_label: analyticsEvents.hub.opened.label,
      });
    }
  }, []);

  const displayName = profile?.display_name || 'Golfer';
  const firstName = displayName.split(' ')[0];

  // Dynamic greeting based on time of day (Phase 1)
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  }, []);
  
  // Contextual subtitle (Phase 1)
  const getSubtitle = useCallback(() => {
    const unreadCount = conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
    if (unreadCount > 0) {
      return `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`;
    }
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'Perfect morning for golf';
    if (hour >= 10 && hour < 17) return 'Your golf conversations';
    if (hour >= 17 && hour < 21) return 'How was your round?';
    return 'Your golf conversations';
  }, [conversations]);

  const handleOpenProfile = () => {
    prefetchHandlers.onTouchStart();
    haptic('light');
    navigate('/profile');
  };
  
  // Echo sheet opener with optional initial prompt (Phase 3)
  const handleOpenEcho = useCallback((initialPrompt?: string) => {
    haptic('light');
    setEchoInitialPrompt(initialPrompt);
    setEchoOpen(true);
    
    // Track the last prompt for "recent context" (Phase 3)
    if (initialPrompt) {
      setRecentEchoContext(initialPrompt);
    }
  }, []);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <PageRoot className="min-h-screen relative overflow-hidden bg-background">
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
    <PageRoot className="min-h-screen relative overflow-hidden bg-background">
      {/* Fairway Glass Background */}
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
      
      <FadeInContent>
        <div 
          className="relative z-10 flex flex-col"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Hub Header - Dynamic contextual greeting (Phase 1) */}
          <header className="px-5 pt-3 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-heading-lg font-semibold tracking-tight text-foreground">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="text-body-sm text-secondary mt-0.5">
                  {getSubtitle()}
                </p>
              </div>
              
              {/* User Avatar */}
              <motion.button
                onClick={handleOpenProfile}
                onMouseEnter={prefetchHandlers.onMouseEnter}
                onTouchStart={prefetchHandlers.onTouchStart}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    borderRadius: '34%',
                    border: '0.5px solid rgba(148, 163, 184, 0.4)',
                    aspectRatio: '1 / 1.05',
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

          {/* Dual-Soul Cards */}
          <motion.div 
            className="flex flex-col gap-4 px-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Messages Card (Phase 1-2) */}
            <motion.div variants={cardVariants}>
              <HubMessagesCard 
                conversations={conversations || []}
                userId={user?.id}
                cardStyle={liquidGlassStyle}
              />
            </motion.div>

            {/* Echo Card (Phase 1-3) */}
            <motion.div variants={cardVariants}>
              <HubEchoCard 
                cardStyle={echoGlassStyle}
                onOpenEcho={handleOpenEcho}
                recentContext={recentEchoContext}
              />
            </motion.div>

            {/* Golf Grapevine - Ambient Social Strip (Phase 4) */}
            <motion.div variants={cardVariants}>
              <GolfGrapevine />
            </motion.div>

            {/* Creator Insights - Only for creators */}
            {hasCreatorFeatures && (
              <motion.button
                variants={cardVariants}
                onClick={() => {
                  haptic('light');
                  navigate('/insights');
                }}
                className="flex items-center p-4 rounded-2xl text-left relative overflow-hidden"
                style={liquidGlassStyle}
                whileTap={{ scale: 0.98 }}
              >
                {/* New creator badge */}
                {isNewCreator && (
                  <motion.div 
                    className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-meta font-semibold bg-primary-accent text-white"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  >
                    <Sparkles className="w-3 h-3" />
                    NEW
                  </motion.div>
                )}
                
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary-accent/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-primary-accent" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-body-lg font-semibold text-foreground block">
                    Creator Insights
                  </span>
                  <span className="text-body-sm text-secondary block mt-0.5">
                    {isNewCreator ? 'Track your content performance' : 'View your content analytics'}
                  </span>
                </div>
                
                <ChevronRight className="w-5 h-5 text-tertiary ml-2" />
              </motion.button>
            )}

          </motion.div>
        </div>
      </FadeInContent>

      {/* Echo Sheet */}
      <HubEchoSheet 
        isOpen={echoOpen} 
        onClose={() => {
          setEchoOpen(false);
          setEchoInitialPrompt(undefined);
        }}
        // Note: Pass initialPrompt to sheet if it supports it
      />
    </PageRoot>
  );
}

export default HubPageNew;
