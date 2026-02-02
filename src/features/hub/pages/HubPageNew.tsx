/**
 * HubPageNew - Hub 2.0: The 19th Hole, Reimagined
 * Dual-soul layout: Messages (connection) + Echo (intelligence)
 * Liquid Golf design language with contextual awareness
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, BarChart3, Sparkles, Mic, MessageCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import echoMascot from '@/assets/echo-mascot.png';

// Sheet components
import { HubEchoSheet } from '../components/HubEchoSheet';

// ============ Types ============

interface ConversationPreview {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isGroup: boolean;
  participantCount?: number;
  isOnline?: boolean;
}

// ============ Component ============

export function HubPageNew() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { conversations } = useMessaging();
  const { hasCreatorFeatures } = usePermissions();
  const { prefetchHandlers } = useProfilePrefetch(user?.id);
  
  // Sheet states
  const [echoOpen, setEchoOpen] = useState(false);
  
  // Calculate total unread message count
  const unreadCount = useMemo(() => {
    return conversations?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
  }, [conversations]);
  
  // Format conversation previews for display
  const conversationPreviews: ConversationPreview[] = useMemo(() => {
    if (!conversations?.length || !user) return [];
    
    return conversations.slice(0, 3).map(conv => {
      // Get other participant for DM name/avatar
      const otherParticipant = conv.participants?.find(p => p.user_id !== user.id);
      const isGroup = conv.type === 'group';
      
      // Format timestamp
      const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      };
      
      return {
        id: conv.id,
        name: isGroup 
          ? conv.name || 'Group Chat' 
          : otherParticipant?.profile?.display_name || otherParticipant?.profile?.username || 'Unknown',
        avatarUrl: isGroup 
          ? conv.avatar_url || undefined 
          : otherParticipant?.profile?.profile_photo_url || undefined,
        lastMessage: conv.last_message_preview || 'No messages yet',
        timestamp: formatTime(conv.last_message_at),
        unreadCount: conv.unread_count || 0,
        isGroup,
        participantCount: isGroup ? conv.participants?.length : undefined,
        isOnline: false, // TODO: Implement online status
      };
    });
  }, [conversations, user]);
  
  // Check if user is a new creator (enabled within last 24 hours)
  const isNewCreator = useMemo(() => {
    const creatorEnabledAt = (profile as any)?.creator_enabled_at;
    if (!creatorEnabledAt || !hasCreatorFeatures) return false;
    const enabledTime = new Date(creatorEnabledAt).getTime();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return enabledTime > oneDayAgo;
  }, [profile, hasCreatorFeatures]);
  
  // Echo quick prompts (golf-specific)
  const quickPrompts = [
    "Find a course",
    "Weather check",
    "Trip ideas",
    "Fix my slice",
  ];
  
  // Contextual greeting based on time
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const echoGreetings = [
    "Ready to plan your next round?",
    "What's on your mind?",
    "Need course recommendations?",
    "Let's find you a tee time",
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromptIndex((prev) => (prev + 1) % echoGreetings.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [echoGreetings.length]);

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

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };
  
  // Contextual subtitle
  const getSubtitle = () => {
    if (unreadCount > 0) {
      return `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`;
    }
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) return 'Perfect morning for golf';
    if (hour >= 10 && hour < 17) return 'Your golf conversations';
    if (hour >= 17 && hour < 21) return 'How was your round?';
    return 'Your golf conversations';
  };

  const handleOpenMessages = () => {
    haptic('light');
    navigate('/messages');
  };

  const handleOpenEcho = () => {
    haptic('light');
    setEchoOpen(true);
  };

  const handleOpenProfile = () => {
    prefetchHandlers.onTouchStart();
    haptic('light');
    navigate('/profile');
  };
  
  const handleNewChat = () => {
    haptic('light');
    navigate('/messages?new=dm');
  };
  
  const handleNewGroup = () => {
    haptic('light');
    navigate('/messages?new=group');
  };

  // Animation variants
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

  // Liquid Golf card styles
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

  return (
    <PageRoot className="min-h-screen relative overflow-hidden bg-background">
      {/* Fairway Glass Background - shifts based on time */}
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
          {/* Hub Header - Dynamic contextual greeting */}
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
            
            {/* ═══════════════════════════════════════════════════════════
                MESSAGES CARD - Liquid Glass with conversation previews
                ═══════════════════════════════════════════════════════════ */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl overflow-hidden"
              style={liquidGlassStyle}
            >
              {/* Header */}
              <button
                onClick={handleOpenMessages}
                className="w-full flex items-center justify-between p-4 pb-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(217_91%_60%/0.12)] flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[hsl(217_91%_60%)]" />
                  </div>
                  <span className="text-body-lg font-semibold text-foreground">Messages</span>
                  {unreadCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-meta font-semibold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-tertiary" />
              </button>
              
              {/* Conversation Previews */}
              {conversationPreviews.length > 0 ? (
                <div className="px-4 pb-3 space-y-1">
                  {conversationPreviews.map((conv, index) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        haptic('light');
                        navigate(`/messages/${conv.id}`);
                      }}
                      className="w-full flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-black/5 active:bg-black/10 transition-colors"
                    >
                      {/* Avatar with online indicator */}
                      <div className="relative flex-shrink-0">
                        {conv.isGroup && conv.participantCount && conv.participantCount > 2 ? (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <SquircleAvatar
                            size={40}
                            src={conv.avatarUrl}
                            alt={conv.name}
                            fallback={conv.name.charAt(0).toUpperCase()}
                            hideRing
                          />
                        )}
                        {conv.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-body-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground'}`}>
                            {conv.name}
                          </span>
                          <span className="text-meta text-tertiary flex-shrink-0">
                            {conv.timestamp}
                          </span>
                        </div>
                        <p className={`text-body-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-secondary'}`}>
                          {conv.lastMessage}
                        </p>
                      </div>
                      
                      {/* Unread dot */}
                      {conv.unreadCount > 0 && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 pb-4 text-center">
                  <p className="text-body-sm text-secondary">Connect with fellow golfers</p>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={handleNewChat}
                  className="flex-1 py-2 px-3 rounded-full text-body-sm font-medium text-[hsl(217_91%_60%)] bg-[hsl(217_91%_60%/0.1)] hover:bg-[hsl(217_91%_60%/0.15)] transition-colors"
                >
                  New Chat
                </button>
                <button
                  onClick={handleNewGroup}
                  className="flex-1 py-2 px-3 rounded-full text-body-sm font-medium text-[hsl(217_91%_60%)] bg-[hsl(217_91%_60%/0.1)] hover:bg-[hsl(217_91%_60%/0.15)] transition-colors"
                >
                  New Group
                </button>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                ECHO CARD - Warm amber glass with quick prompts
                ═══════════════════════════════════════════════════════════ */}
            <motion.div
              variants={cardVariants}
              className="rounded-2xl overflow-visible relative"
              style={{
                ...echoGlassStyle,
                marginTop: '48px',
              }}
            >
              {/* Echo Mascot - Overlapping */}
              <div 
                className="absolute overflow-visible pointer-events-none"
                style={{
                  left: '16px',
                  top: '-56px',
                  width: '100px',
                  height: '100px',
                }}
              >
                <img 
                  src={echoMascot} 
                  alt="Echo" 
                  className="w-full h-full object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.12))',
                  }}
                />
              </div>
              
              {/* Header */}
              <button
                onClick={handleOpenEcho}
                className="w-full text-left p-4 pb-3"
              >
                <div className="flex items-start justify-between pl-24">
                  <div className="flex-1">
                    <span className="text-body-lg font-semibold text-foreground block">Echo</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={currentPromptIndex}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="text-body-sm text-secondary block mt-0.5"
                      >
                        {echoGreetings[currentPromptIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <ChevronRight className="w-5 h-5 text-tertiary mt-1" />
                </div>
              </button>
              
              {/* Quick Prompt Chips */}
              <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        haptic('light');
                        // TODO: Pre-fill Echo with prompt
                        setEchoOpen(true);
                      }}
                      className="flex-shrink-0 py-2 px-3 rounded-full text-body-sm font-medium text-primary-accent bg-primary-accent/10 hover:bg-primary-accent/15 transition-colors whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Input Field Teaser */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleOpenEcho}
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl bg-white/50 border border-black/5"
                >
                  <span className="flex-1 text-left text-body-sm text-tertiary">
                    Ask Echo anything golf...
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary-accent/10 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-primary-accent" />
                  </div>
                </button>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                CREATOR INSIGHTS - Only for creators
                ═══════════════════════════════════════════════════════════ */}
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
      <HubEchoSheet isOpen={echoOpen} onClose={() => setEchoOpen(false)} />
    </PageRoot>
  );
}

export default HubPageNew;
