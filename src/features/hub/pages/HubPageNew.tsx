/**
 * HubPageNew - Redesigned Hub matching the target mockup design EXACTLY
 * Atmospheric gradient background, status dots, refined greeting, 3D-style cards
 */

import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessages } from '@/hooks/useMessages';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { PageRoot } from '@/components/layout/PageRoot';
import { FadeInContent } from '@/components/ui/FadeInContent';
import { haptic } from '@/utils/haptics';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import messagesIcon from '@/assets/messages-icon.png';

// Sheet components
import { HubMessagesSheet } from '../components/HubMessagesSheet';
import { HubEchoSheet } from '../components/HubEchoSheet';
import { CreateGameTripSheetV2 } from '../components/create-game-trip-v2';

export function HubPageNew() {
  const { user } = useSupabaseSession();
  const { data: profile } = useUserProfile(user?.id);
  const { conversations } = useMessages();
  
  // Sheet states
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [echoOpen, setEchoOpen] = useState(false);
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [createTripOpen, setCreateTripOpen] = useState(false);

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
  // Use shorter first name (e.g., "Ben" instead of "Benjamin")
  const firstName = displayName.split(' ')[0];
  const shortFirstName = firstName.length > 6 ? firstName.slice(0, 3) : firstName;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Count active chats
  const activeChatCount = conversations?.length || 0;

  // Get recent chat avatars (up to 3)
  const recentChatAvatars = conversations?.slice(0, 3).map(conv => ({
    url: conv.friend_photo_url,
    name: conv.friend_name || 'User',
  })) || [];

  const handleOpenMessages = () => {
    haptic('light');
    setMessagesOpen(true);
  };

  const handleOpenEcho = () => {
    haptic('light');
    setEchoOpen(true);
  };

  const handleCreateGame = () => {
    haptic('light');
    setCreateGameOpen(true);
  };

  const handlePlanTrip = () => {
    haptic('light');
    setCreateTripOpen(true);
  };

  // Card shadow style
  const cardShadow = '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.02)';

  return (
    <PageRoot className="min-h-screen relative overflow-hidden">
      {/* Atmospheric Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #e8f4fc 0%, #f0f5fa 30%, #f5f0f5 60%, #faf8fa 100%)',
        }}
      />
      {/* Blur overlay for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(173, 216, 230, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(221, 214, 243, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, rgba(200, 220, 240, 0.25) 0%, transparent 40%)
          `,
          filter: 'blur(60px)',
        }}
      />
      
      <FadeInContent>
        {/* Content */}
        <div 
          className="relative z-10 flex flex-col"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)',
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Status Indicator Dots */}
          <div className="flex justify-center gap-2 pb-4">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <div className="w-2 h-2 rounded-full bg-gray-300" />
          </div>

          {/* Greeting Header */}
          <header className="text-center px-6 pt-4 pb-6">
            <h1 className="text-2xl font-semibold text-gray-700 tracking-tight">
              {getGreeting()}, {shortFirstName}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              What's on your mind?
            </p>
          </header>

          {/* Action Cards */}
          <div className="flex flex-col gap-3 px-4">
            
            {/* Messages Card with Avatars - Only show when has active chats */}
            {activeChatCount > 0 && (
              <motion.button
                onClick={handleOpenMessages}
                className="flex items-center p-4 rounded-2xl text-left"
                style={{
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #e1f5fe 100%)',
                  boxShadow: cardShadow,
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Avatar Stack */}
                <div className="flex items-center -space-x-3 mr-4">
                  {recentChatAvatars.length > 0 ? (
                    recentChatAvatars.map((avatar, index) => (
                      <div
                        key={index}
                        className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shadow-sm"
                        style={{ zIndex: 30 - index * 10 }}
                      >
                        <Avatar className="w-full h-full">
                          <AvatarImage src={avatar.url || undefined} alt={avatar.name} />
                          <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 text-sm font-medium">
                            {avatar.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ))
                  ) : (
                    // Placeholder avatars
                    <>
                      <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shadow-sm relative z-30">
                        <img src="https://i.pravatar.cc/150?img=5" alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shadow-sm relative z-20">
                        <img src="https://i.pravatar.cc/150?img=8" alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shadow-sm relative z-10">
                        <img src="https://i.pravatar.cc/150?img=12" alt="" className="w-full h-full object-cover" />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Messages</span>
                    <div className="w-5 h-5 rounded-full bg-orange-400 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-gray-500 text-sm">{activeChatCount} active chat{activeChatCount !== 1 ? 's' : ''}</span>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </motion.button>
            )}

            {/* Simple Messages Card - Blue gradient with 3D bubbles */}
            <motion.button
              onClick={handleOpenMessages}
              className="flex items-center p-4 rounded-2xl text-left"
              style={{
                background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                boxShadow: cardShadow,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Messages Icon */}
              <div className="w-12 h-12 mr-4 flex items-center justify-center">
                <img 
                  src={messagesIcon} 
                  alt="Messages" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              
              <div className="flex-1">
                <span className="font-semibold text-gray-800 block">Messages</span>
                <span className="text-gray-500 text-sm">Check your chats</span>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.button>

            {/* Create Game Card - Yellow/gold gradient with trophy */}
            <motion.button
              onClick={handleCreateGame}
              className="flex items-center p-4 rounded-2xl text-left"
              style={{
                background: 'linear-gradient(135deg, #fff9e6 0%, #ffecb3 50%, #ffe082 100%)',
                boxShadow: cardShadow,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* 3D Trophy Icon */}
              <div 
                className="w-12 h-12 mr-4 flex items-center justify-center"
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(255, 193, 7, 0.3))',
                }}
              >
                <span className="text-4xl">🏆</span>
              </div>
              
              <div className="flex-1">
                <span className="font-semibold text-gray-800 block">Create Game</span>
                <span className="text-gray-500 text-sm">Set up a new match!</span>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.button>

            {/* Plan a Trip Card - Soft green/teal gradient with palm tree */}
            <motion.button
              onClick={handlePlanTrip}
              className="flex items-center p-4 rounded-2xl text-left"
              style={{
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
                boxShadow: cardShadow,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* 3D Palm Tree Icon */}
              <div 
                className="w-12 h-12 mr-4 flex items-center justify-center"
                style={{
                  filter: 'drop-shadow(0 3px 5px rgba(76, 175, 80, 0.3))',
                }}
              >
                <span className="text-4xl">🌴</span>
              </div>
              
              <div className="flex-1">
                <span className="font-semibold text-gray-800 block">Plan a Trip</span>
                <span className="text-gray-500 text-sm">Organize activities</span>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.button>

            {/* Echo AI Assistant Card - White/light gray with 3D robot */}
            <motion.button
              onClick={handleOpenEcho}
              className="flex items-center p-4 rounded-2xl text-left"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
                boxShadow: cardShadow,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* 3D Robot Icon */}
              <div 
                className="w-12 h-12 mr-4 flex items-center justify-center"
                style={{
                  filter: 'drop-shadow(0 3px 6px rgba(66, 165, 245, 0.3))',
                }}
              >
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  {/* Antenna ball */}
                  <circle cx="22" cy="6" r="3" fill="#64b5f6" />
                  {/* Antenna stem */}
                  <rect x="21" y="8" width="2" height="4" fill="#90caf9" />
                  
                  {/* Head */}
                  <rect x="8" y="12" width="28" height="24" rx="8" fill="url(#robotBlue)" />
                  
                  {/* Face plate / screen */}
                  <rect x="12" y="16" width="20" height="14" rx="4" fill="#e3f2fd" />
                  
                  {/* Eyes */}
                  <circle cx="17" cy="23" r="3" fill="#1976d2" />
                  <circle cx="27" cy="23" r="3" fill="#1976d2" />
                  
                  {/* Eye highlights */}
                  <circle cx="18" cy="22" r="1" fill="#ffffff" />
                  <circle cx="28" cy="22" r="1" fill="#ffffff" />
                  
                  {/* Smile */}
                  <path 
                    d="M17 27 Q22 30 27 27" 
                    stroke="#1976d2" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    fill="none"
                  />
                  
                  {/* Ears/sides */}
                  <rect x="4" y="18" width="4" height="10" rx="2" fill="#42a5f5" />
                  <rect x="36" y="18" width="4" height="10" rx="2" fill="#42a5f5" />
                  
                  <defs>
                    <linearGradient id="robotBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#64b5f6" />
                      <stop offset="100%" stopColor="#42a5f5" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              <div className="flex-1">
                <span className="text-gray-500 text-sm">How can I assist you today?...</span>
              </div>
              
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.button>

          </div>
        </div>
      </FadeInContent>

      {/* Sheets */}
      <HubMessagesSheet isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <HubEchoSheet isOpen={echoOpen} onClose={() => setEchoOpen(false)} />
      <CreateGameTripSheetV2 
        isOpen={createGameOpen || createTripOpen} 
        onClose={() => { setCreateGameOpen(false); setCreateTripOpen(false); }} 
      />
    </PageRoot>
  );
}

export default HubPageNew;
