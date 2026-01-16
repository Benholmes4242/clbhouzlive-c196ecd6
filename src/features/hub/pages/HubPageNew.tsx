/**
 * HubPageNew - Redesigned Hub matching the reference design EXACTLY
 * Soft lavender background, greeting header, illustrated action cards
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
  const firstName = displayName.split(' ')[0];

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

  return (
    <PageRoot
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #ECEEF4 0%, #E4E7EF 100%)',
      }}
    >
      <FadeInContent>
        <div
          className="flex-1 flex flex-col"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Header - Centered Greeting */}
          <header className="text-center mb-6 px-5">
            <h1
              className="text-[26px] font-bold tracking-tight mb-1"
              style={{ 
                color: '#1a1f36',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              {getGreeting()}, {firstName}
            </h1>
            <p
              className="text-[15px]"
              style={{ color: '#6b7280' }}
            >
              What's on your mind?
            </p>
          </header>

          {/* Action Cards */}
          <div className="px-4 flex flex-col gap-3">
            
            {/* Messages Card - With Stacked Avatars (when has chats) */}
            {activeChatCount > 0 && (
              <motion.button
                onClick={handleOpenMessages}
                className="relative w-full rounded-[16px] p-4 text-left"
                style={{
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Stacked Avatars */}
                    <div className="relative flex items-center">
                      {recentChatAvatars.map((avatar, index) => (
                        <div
                          key={index}
                          className="relative rounded-full border-[2.5px] border-white overflow-hidden"
                          style={{
                            width: 48,
                            height: 48,
                            marginLeft: index > 0 ? -14 : 0,
                            zIndex: 3 - index,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        >
                          <Avatar className="w-full h-full">
                            <AvatarImage src={avatar.url || undefined} alt={avatar.name} />
                            <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 text-sm font-medium">
                              {avatar.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                      {/* Orange notification badge */}
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center z-10"
                        style={{
                          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                          boxShadow: '0 2px 4px rgba(249, 115, 22, 0.4)',
                          border: '2px solid white',
                        }}
                      >
                        <span className="text-white text-[10px]">💬</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-semibold text-[16px]" style={{ color: '#1a1f36' }}>
                        Messages
                      </div>
                      <div className="text-[14px]" style={{ color: '#6b7280' }}>
                        {activeChatCount} active chat{activeChatCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5" style={{ color: '#9ca3af' }} />
                </div>
              </motion.button>
            )}

            {/* Messages Card - Blue gradient style */}
            <motion.button
              onClick={handleOpenMessages}
              className="relative w-full rounded-[16px] p-4 text-left overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #E8F4FD 0%, #D6ECFA 50%, #C4E4F8 100%)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Blue speech bubble icon */}
                  <div className="w-12 h-12 flex items-center justify-center">
                    <span className="text-[32px]">💬</span>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-[16px]" style={{ color: '#1a1f36' }}>
                      Messages
                    </div>
                    <div className="text-[14px]" style={{ color: '#5b6b7d' }}>
                      Check your chats
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5" style={{ color: '#7ba3c4' }} />
              </div>
            </motion.button>

            {/* Create Game Card - Yellow/cream gradient */}
            <motion.button
              onClick={handleCreateGame}
              className="relative w-full rounded-[16px] p-4 text-left overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FEF9E7 0%, #FCF0C8 50%, #FAEBBA 100%)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Trophy icon */}
                  <div className="w-12 h-12 flex items-center justify-center">
                    <span className="text-[32px]">🏆</span>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-[16px]" style={{ color: '#1a1f36' }}>
                      Create Game
                    </div>
                    <div className="text-[14px]" style={{ color: '#8b7355' }}>
                      Set up a new match!
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5" style={{ color: '#c9a866' }} />
              </div>
            </motion.button>

            {/* Plan a Trip Card - Mint/teal gradient */}
            <motion.button
              onClick={handlePlanTrip}
              className="relative w-full rounded-[16px] p-4 text-left overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #E6F7F1 0%, #C8EFE0 50%, #B5E8D4 100%)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Landscape with heart icon */}
                  <div className="w-12 h-12 flex items-center justify-center">
                    <span className="text-[32px]">🏝️</span>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-[16px]" style={{ color: '#1a1f36' }}>
                      Plan a Trip
                    </div>
                    <div className="text-[14px]" style={{ color: '#4d7c6a' }}>
                      Organize activities
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5" style={{ color: '#6ba890' }} />
              </div>
            </motion.button>

            {/* Echo AI Assistant Card - With cute robot */}
            <motion.button
              onClick={handleOpenEcho}
              className="relative w-full rounded-[16px] p-4 text-left overflow-hidden mt-1"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                {/* Cute Robot Icon - 3D style */}
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                    }}
                  >
                    {/* Robot face */}
                    <div className="flex flex-col items-center">
                      {/* Eyes */}
                      <div className="flex gap-2 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                      {/* Smile */}
                      <div 
                        className="w-4 h-2 rounded-b-full"
                        style={{ 
                          background: 'rgba(255,255,255,0.9)',
                        }}
                      />
                    </div>
                  </div>
                  {/* Antenna */}
                  <div 
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-2 rounded-full"
                    style={{ background: '#3B82F6' }}
                  />
                  <div 
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
                    style={{ 
                      background: 'linear-gradient(180deg, #93C5FD 0%, #60A5FA 100%)',
                      boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
                    }}
                  />
                </div>
                
                <div className="flex-1 flex items-center">
                  <span className="text-[15px]" style={{ color: '#6b7280' }}>
                    How can I assist you today?...
                  </span>
                </div>
                
                <ChevronRight className="w-5 h-5" style={{ color: '#9ca3af' }} />
              </div>
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
