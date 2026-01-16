/**
 * HubPageNew - Redesigned Hub matching the reference design
 * Soft lavender background, greeting header, action cards with gradient backgrounds
 */

import { useState, useEffect } from 'react';
import { ChevronRight, MessageCircle, Trophy, MapPin, Bot } from 'lucide-react';
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

  // Count active chats (conversations with any messages)
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
        background: 'linear-gradient(180deg, #F0F2F8 0%, #E8EBF2 100%)',
      }}
    >
      <FadeInContent>
        <div
          className="flex-1 flex flex-col"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Header - Centered Greeting */}
          <header className="text-center mb-8 px-5">
            <h1
              className="text-[28px] font-bold tracking-tight mb-1"
              style={{ color: '#1e293b' }}
            >
              {getGreeting()}, {firstName}
            </h1>
            <p
              className="text-[15px]"
              style={{ color: '#64748b' }}
            >
              What's on your mind?
            </p>
          </header>

          {/* Action Cards */}
          <div className="px-5 flex flex-col gap-3">
            
            {/* Messages Card - With Avatars (if has chats) */}
            {activeChatCount > 0 && (
              <motion.button
                onClick={handleOpenMessages}
                className="relative w-full rounded-[20px] p-4 text-left overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Stacked Avatars */}
                    <div className="relative flex items-center">
                      {recentChatAvatars.map((avatar, index) => (
                        <div
                          key={index}
                          className="relative rounded-full border-2 border-white overflow-hidden"
                          style={{
                            width: 44,
                            height: 44,
                            marginLeft: index > 0 ? -12 : 0,
                            zIndex: 3 - index,
                          }}
                        >
                          <Avatar className="w-full h-full">
                            <AvatarImage src={avatar.url || undefined} alt={avatar.name} />
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-sm">
                              {avatar.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      ))}
                      {/* Notification Badge */}
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center z-10"
                        style={{
                          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                          boxShadow: '0 2px 6px rgba(249, 115, 22, 0.4)',
                        }}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-semibold text-[16px]" style={{ color: '#1e293b' }}>
                        Messages
                      </div>
                      <div className="text-[14px]" style={{ color: '#64748b' }}>
                        {activeChatCount} active chat{activeChatCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </motion.button>
            )}

            {/* Messages Card - Simple (if no chats) */}
            {activeChatCount === 0 && (
              <ActionCard
                icon={<MessageCircle className="w-6 h-6" />}
                iconColor="#3B82F6"
                iconBg="linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)"
                title="Messages"
                subtitle="Check your chats"
                gradientBg="linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)"
                onClick={handleOpenMessages}
              />
            )}

            {/* Create Game Card */}
            <ActionCard
              icon={<Trophy className="w-6 h-6" />}
              iconColor="#D97706"
              iconBg="linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
              title="Create Game"
              subtitle="Set up a new match!"
              gradientBg="linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
              onClick={handleCreateGame}
            />

            {/* Plan a Trip Card */}
            <ActionCard
              icon={<MapPin className="w-6 h-6" />}
              iconColor="#059669"
              iconBg="linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)"
              title="Plan a Trip"
              subtitle="Organize activities"
              gradientBg="linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
              onClick={handlePlanTrip}
            />

            {/* Echo AI Assistant Card */}
            <motion.button
              onClick={handleOpenEcho}
              className="relative w-full rounded-[20px] p-4 text-left overflow-hidden mt-2"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-4">
                {/* Echo Bot Icon */}
                <div
                  className="relative w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Bot className="w-7 h-7 text-white" />
                  {/* Smile indicator */}
                  <div
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-2 rounded-b-full"
                    style={{ background: 'rgba(255,255,255,0.4)' }}
                  />
                </div>
                
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[15px]" style={{ color: '#64748b' }}>
                    How can I assist you today?...
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
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

// Reusable Action Card Component
interface ActionCardProps {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  gradientBg: string;
  onClick: () => void;
}

function ActionCard({ icon, iconColor, iconBg, title, subtitle, gradientBg, onClick }: ActionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="relative w-full rounded-[20px] p-4 text-left overflow-hidden"
      style={{
        background: gradientBg,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon Container */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ 
              background: iconBg,
              color: iconColor,
            }}
          >
            {icon}
          </div>
          
          <div>
            <div className="font-semibold text-[16px]" style={{ color: '#1e293b' }}>
              {title}
            </div>
            <div className="text-[14px]" style={{ color: '#64748b' }}>
              {subtitle}
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    </motion.button>
  );
}

export default HubPageNew;
