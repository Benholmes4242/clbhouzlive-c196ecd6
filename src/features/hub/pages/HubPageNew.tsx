/**
 * HubPageNew - Redesigned Hub with polished design
 * Atmospheric gradient background, avatar header, refined cards
 */

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessages } from '@/hooks/useMessages';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import messagesIcon from '@/assets/messages-icon.png';
import echoMascot from '@/assets/echo-mascot.png';
import gameIcon from '@/assets/game-icon.png';
import scheduleIcon from '@/assets/schedule-icon.png';

// Sheet components
import { HubMessagesSheet } from '../components/HubMessagesSheet';
import { HubEchoSheet } from '../components/HubEchoSheet';
import { CreateGameTripSheetV2 } from '../components/create-game-trip-v2';
import { YourGamesTripsSheetV2 } from '../components/your-games-trips-v2';
import { HubQuickActionsSheetV2 } from '../components/HubQuickActionsSheetV2';
import { DiscoverGamesBottomSheetV2 } from '../components/discover-games';

export function HubPageNew() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { conversations } = useMessages();
  
  // Sheet states
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  
  // Echo tooltip hints (max 40 characters each)
  const echoHints = [
    "How far does Rory drive the ball?",
    "What's the latest driver on the market?",
    "How do I fix my slice?",
    "Who's leading the Race to Dubai?",
    "When is the next major?",
  ];
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  
  // Cycle through hints
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHintIndex((prev) => (prev + 1) % echoHints.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [echoHints.length]);

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
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  };

  const handleOpenMessages = () => {
    haptic('light');
    setMessagesOpen(true);
  };

  const handleOpenEcho = () => {
    haptic('light');
    setEchoOpen(true);
  };

  const handleCreateGameOrTrip = () => {
    haptic('light');
    setQuickActionsOpen(true);
  };

  const handleOpenSchedule = () => {
    haptic('light');
    setScheduleOpen(true);
  };

  const handleOpenProfile = () => {
    haptic('light');
    navigate('/profile');
  };

  // Card shadow style
  const cardShadow = '0 2px 12px rgba(0, 0, 0, 0.06), 0 4px 20px rgba(0, 0, 0, 0.03)';

  // Animation variants for staggered fade-in
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
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
    },
  };

  return (
    <PageRoot className="min-h-screen relative overflow-hidden">
      {/* Atmospheric Background - Light at top, warm at bottom */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 25%, #e8f0f8 50%, #f0eef5 75%, #f5f3f8 100%)',
        }}
      />
      {/* Blur overlay for depth - more toward bottom */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 90%, rgba(221, 214, 243, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 70%, rgba(200, 220, 240, 0.25) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 80%, rgba(230, 220, 250, 0.3) 0%, transparent 45%)
          `,
          filter: 'blur(60px)',
        }}
      />
      
      <FadeInContent>
        {/* Content */}
        <div 
          className="relative z-10 flex flex-col"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Header with Avatar */}
          <header className="px-6 pt-4 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 
                  className="text-2xl font-semibold tracking-tight"
                  style={{ color: '#1e293b' }}
                >
                  {getGreeting()}, {firstName}
                </h1>
                <p 
                  className="text-sm mt-1"
                  style={{ color: '#64748b' }}
                >
                  What's on your mind?
                </p>
              </div>
              
              {/* User Avatar - Squircle like CreatorCapsule with glass ring */}
              <motion.button
                onClick={handleOpenProfile}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                {/* Glass ring overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    borderRadius: '34%',
                    border: '0.5px solid rgba(148, 163, 184, 0.5)',
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

          {/* Action Cards with staggered animation */}
          <motion.div 
            className="flex flex-col gap-4 px-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            
            {/* Messages Card - Frosted glass with shimmer */}
            <motion.button
              variants={cardVariants}
              onClick={handleOpenMessages}
              className="flex items-start p-4 rounded-2xl text-left relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.4) 30%, rgba(241, 245, 249, 0.5) 70%, rgba(255, 255, 255, 0.55) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated shimmer overlay */}
              <motion.div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
                }}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 4,
                  ease: 'easeInOut',
                }}
              />
              {/* Large Messages Icon */}
              <div className="w-20 h-20 -ml-2 -my-2 mr-3 flex items-center justify-center flex-shrink-0">
                <img 
                  src={messagesIcon} 
                  alt="Messages" 
                  className="w-20 h-20 object-contain"
                  style={{ 
                    background: 'transparent',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <span 
                  className="font-semibold block text-base"
                  style={{ color: '#1e293b' }}
                >
                  Messages
                </span>
                <span 
                  className="text-sm leading-snug block mt-0.5"
                  style={{ color: '#64748b' }}
                >
                  Keep in touch with friends and your community
                </span>
              </div>
              
              <ChevronRight className="w-5 h-5 flex-shrink-0 ml-2 self-end" style={{ color: '#94a3b8' }} />
            </motion.button>

            {/* Create Game or Trip Card - Frosted glass with shimmer */}
            <motion.button
              variants={cardVariants}
              onClick={handleCreateGameOrTrip}
              className="flex items-start p-4 rounded-2xl text-left relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.4) 30%, rgba(241, 245, 249, 0.5) 70%, rgba(255, 255, 255, 0.55) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated shimmer overlay */}
              <motion.div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
                }}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 5,
                  ease: 'easeInOut',
                }}
              />
              {/* Large Game Icon */}
              <div className="w-[88px] h-[88px] -ml-3 -my-3 mr-2 flex items-center justify-center flex-shrink-0">
                <img 
                  src={gameIcon} 
                  alt="Create Game or Trip" 
                  className="w-[88px] h-[88px] object-contain"
                  style={{ 
                    background: 'transparent',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <span 
                  className="font-semibold block text-base"
                  style={{ color: '#1e293b' }}
                >
                  Create Game or Trip
                </span>
                <span 
                  className="text-sm leading-snug block mt-0.5"
                  style={{ color: '#64748b' }}
                >
                  Start your next golf adventure here
                </span>
              </div>
              
              <ChevronRight className="w-5 h-5 flex-shrink-0 ml-2 self-end" style={{ color: '#94a3b8' }} />
            </motion.button>

            {/* Your Schedule Card - Frosted glass with shimmer */}
            <motion.button
              variants={cardVariants}
              onClick={handleOpenSchedule}
              className="flex items-start p-4 rounded-2xl text-left relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.4) 30%, rgba(241, 245, 249, 0.5) 70%, rgba(255, 255, 255, 0.55) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated shimmer overlay */}
              <motion.div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
                }}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 6,
                  ease: 'easeInOut',
                }}
              />
              {/* Large Schedule Icon */}
              <div className="w-20 h-20 -ml-2 -my-2 mr-3 flex items-center justify-center flex-shrink-0">
                <img 
                  src={scheduleIcon} 
                  alt="Your Schedule" 
                  className="w-20 h-20 object-contain"
                  style={{ 
                    background: 'transparent',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <span 
                  className="font-semibold block text-base"
                  style={{ color: '#1e293b' }}
                >
                  Your Schedule
                </span>
                <span 
                  className="text-sm leading-snug block mt-0.5"
                  style={{ color: '#64748b' }}
                >
                  Stay on top of your golfing life
                </span>
              </div>
              
              <ChevronRight className="w-5 h-5 flex-shrink-0 ml-2 self-end" style={{ color: '#94a3b8' }} />
            </motion.button>

            {/* Echo AI Assistant Card - Glassy amber-to-orange gradient */}
            <motion.button
              variants={cardVariants}
              onClick={handleOpenEcho}
              className="flex items-start p-4 rounded-2xl text-left relative overflow-visible"
              style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.65) 0%, rgba(245, 158, 11, 0.7) 50%, rgba(249, 115, 22, 0.65) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(251, 191, 36, 0.7)',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35), 0 2px 8px rgba(0, 0, 0, 0.06)',
                marginTop: '80px',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Echo Mascot Icon - Larger, centered vertically with top overhang */}
              <div 
                className="absolute overflow-visible flex items-center justify-center"
                style={{
                  left: '-20px',
                  top: '-45px',
                  width: '150px',
                  height: '150px',
                }}
              >
                <img 
                  src={echoMascot} 
                  alt="Echo" 
                  className="w-full h-full object-contain"
                  style={{ 
                    background: 'transparent',
                    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))',
                  }}
                />
              </div>
              
              {/* Spacer for the icon area */}
              <div className="w-24 mr-3" />
              
              <div className="flex-1 flex flex-col gap-1">
                {/* Permanent intro line */}
                <span 
                  className="text-[15px] font-semibold text-white whitespace-nowrap"
                >
                  I'm Echo – How can I help?
                </span>
                
                {/* Cycling hint carousel */}
                <div className="h-10 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={currentHintIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="text-[13px] italic block text-white/80 leading-snug"
                    >
                      "{echoHints[currentHintIndex]}"
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 flex-shrink-0 text-white self-end" />
            </motion.button>

          </motion.div>
        </div>
      </FadeInContent>

      {/* Sheets */}
      <HubMessagesSheet isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <HubEchoSheet isOpen={echoOpen} onClose={() => setEchoOpen(false)} />
      <CreateGameTripSheetV2 
        isOpen={createOpen} 
        onClose={() => setCreateOpen(false)} 
      />
      <YourGamesTripsSheetV2
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
      <HubQuickActionsSheetV2
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onOpenCreateGame={() => {
          setQuickActionsOpen(false);
          setCreateOpen(true);
        }}
        onOpenDiscoverGames={() => {
          setDiscoverOpen(true);
        }}
      />
      <DiscoverGamesBottomSheetV2
        isOpen={discoverOpen}
        onClose={() => setDiscoverOpen(false)}
      />
    </PageRoot>
  );
}

export default HubPageNew;
