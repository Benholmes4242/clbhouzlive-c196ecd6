/**
 * HubPageNew - Hub Warm Redesign (Cleo-inspired)
 * Fixed viewport, animated warm gradient bg, glassmorphic cards
 * "Less container, more content" design language
 */

import { useCallback, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMessaging } from '@/hooks/useMessaging';
import { useProfilePrefetch } from '@/hooks/useProfilePrefetch';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WifiOff, RefreshCw, Bell, ChevronRight, MessageCircle, ArrowUp, Mic, Flag, Compass, Target } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { toast } from 'sonner';
import { AnimatedNumber } from '@/components/ui/motion';
import { useTop100ProgressForUser } from '@/hooks/useTop100ProgressForUser';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import { CanonicalAmberBg } from '@/components/ui/CanonicalAmberBg';
import { GlassCard } from '@/components/hub-warm/GlassCard';
import { usePresence } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

// ============ Streak Computation ============
function computeStreak(rounds: { played_at: string }[]): { streak: number; hasLoggedThisMonth: boolean } {
  const now = new Date();
  let streak = 0;
  let checkMonth = now;
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const hasThisMonth = rounds.some((r) => {
    const playedDate = new Date(r.played_at);
    return isWithinInterval(playedDate, { start: thisMonthStart, end: thisMonthEnd });
  });
  for (let i = 0; i < 24; i++) {
    const monthStart = startOfMonth(checkMonth);
    const monthEnd = endOfMonth(checkMonth);
    const hasLog = rounds.some((r) => {
      const playedDate = new Date(r.played_at);
      return isWithinInterval(playedDate, { start: monthStart, end: monthEnd });
    });
    if (hasLog) {
      streak++;
      checkMonth = subMonths(checkMonth, 1);
    } else {
      if (i === 0 && !hasLog) {
        checkMonth = subMonths(checkMonth, 1);
        continue;
      }
      break;
    }
  }
  return { streak: hasThisMonth ? streak : Math.max(0, streak), hasLoggedThisMonth: hasThisMonth };
}

// ============ Echo Suggestion Prompts ============
const WHISPER_PROMPTS = [
  { text: "Find a course with availability this weekend", icon: 'flag' as const },
  { text: "Find the perfect course for your skill level", icon: 'target' as const },
  { text: "Check today's weather in my location", icon: 'compass' as const },
  { text: "Find a hidden gem course near you", icon: 'flag' as const },
  { text: "Plan your next golf trip abroad", icon: 'compass' as const },
  { text: "Get tips to improve your short game", icon: 'target' as const },
];

function PromptIcon({ type }: { type: string }) {
  const cls = "w-3.5 h-3.5 flex-shrink-0";
  const style = { color: '#D97706' };
  switch (type) {
    case 'flag': return <Flag className={cls} style={style} />;
    case 'compass': return <Compass className={cls} style={style} />;
    case 'target': return <Target className={cls} style={style} />;
    default: return <Flag className={cls} style={style} />;
  }
}

// ============ Animation Variants ============
const getContainerVariants = (prefersReduced: boolean) => ({
  hidden: { opacity: prefersReduced ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: prefersReduced ? { duration: 0 } : { staggerChildren: 0.06, delayChildren: 0.15 },
  },
});

const getCardVariants = (prefersReduced: boolean) => ({
  hidden: prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: prefersReduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 350, damping: 28 },
  },
});

// ============ Component ============
export function HubPageNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useUserProfile(user?.id);
  const { conversations, loading: conversationsLoading, error: messagingError, fetchConversations } = useMessaging();
  const { prefetchHandlers } = useProfilePrefetch(user?.id);
  const prefersReduced = usePrefersReducedMotion();
  const { presenceMap, subscribeToPresence } = usePresence();
  const { isListening, transcript, startListening, stopListening, isSupported, error: speechError } = useSpeechToText();
  
  // Transparent overlay status bar so the warm gradient bleeds into safe area
  // "dark" = white icons (not applicable here, "light" = black icons on warm bg)
  useMedianStatusBar("light", "transparent", true, false, true);

  // Add route-hub class to body so CSS can make .app-shell transparent
  // (same pattern as Clubhouse.tsx with route-clubhouse)
  useLayoutEffect(() => {
    document.body.classList.add('route-hub');
    return () => document.body.classList.remove('route-hub');
  }, []);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [echoInput, setEchoInput] = useState('');

  // Progress data for At a Glance
  const { data: progressData, isLoading: progressLoading } = useTop100ProgressForUser(user?.id);

  useEffect(() => {
    const update = () => setCurrentHour(new Date().getHours());
    const handler = () => { if (document.visibilityState === 'visible') update(); };
    document.addEventListener('visibilitychange', handler);
    const interval = setInterval(update, 60_000);
    return () => { document.removeEventListener('visibilitychange', handler); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!sessionLoading && !user) navigate('/auth', { replace: true });
  }, [user, sessionLoading, navigate]);

  useEffect(() => {
    if (transcript) setEchoInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (speechError) toast.error(speechError);
  }, [speechError]);

  // Subscribe to presence for DM conversations
  useEffect(() => {
    if (!conversations?.length || !user?.id) return;
    const dmUserIds = conversations
      .filter((c: any) => c.type !== 'group')
      .flatMap((c: any) => c.participants?.filter((p: any) => p.user_id !== user.id).map((p: any) => p.user_id) || [])
      .filter(Boolean);
    if (dmUserIds.length > 0) subscribeToPresence(dmUserIds);
  }, [conversations, user?.id, subscribeToPresence]);

  const { data: unreadNotificationCount } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)
        .not('type', 'in', '("message","message_received","dm")');
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const isLoading = sessionLoading || profileLoading;
  const hasError = !!(profileError || messagingError);
  const displayName = profile?.display_name || 'Golfer';
  const firstName = displayName.split(' ')[0];
  const hasUnreadNotifications = (unreadNotificationCount || 0) > 0;

  const unreadCount = useMemo(() => {
    return conversations?.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0) || 0;
  }, [conversations]);

  const getGreeting = useCallback(() => {
    if (currentHour >= 5 && currentHour < 12) return 'Good morning';
    if (currentHour >= 12 && currentHour < 17) return 'Good afternoon';
    if (currentHour >= 17 && currentHour < 21) return 'Good evening';
    return 'Good night';
  }, [currentHour]);

  // Conversation previews for badge chips
  const conversationBadges = useMemo(() => {
    if (!conversations?.length || !user?.id) return [];
    return conversations.slice(0, 4).map((conv: any) => {
      const otherParticipants = conv.participants?.filter((p: any) => p.user_id !== user.id) || [];
      const isGroup = conv.type === 'group';
      const first = otherParticipants[0];
      const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(diffMs / 3600000);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(diffMs / 86400000);
        return `${days}d`;
      };
      return {
        id: conv.id,
        name: isGroup ? (conv.name || 'Group') : (first?.profile?.display_name || first?.profile?.username || 'Unknown'),
        avatarUrl: isGroup ? conv.avatar_url : first?.profile?.profile_photo_url,
        time: formatTime(conv.last_message_at),
        isOnline: !isGroup && first?.user_id ? presenceMap.get(first.user_id)?.status === 'online' : false,
      };
    });
  }, [conversations, user?.id, presenceMap]);

  // At a Glance stats
  const top100Count = progressData?.totalTop100Played ?? 0;
  const { streak, hasLoggedThisMonth } = useMemo(() => {
    if (!progressData?.all_rounds_for_streak?.length) return { streak: 0, hasLoggedThisMonth: false };
    return computeStreak(progressData.all_rounds_for_streak);
  }, [progressData?.all_rounds_for_streak]);

  const avgRating = useMemo(() => {
    if (!progressData?.recent_rounds?.length) return null;
    const rated = progressData.recent_rounds.filter((r: any) => r.rating != null && r.rating > 0);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc: number, r: any) => acc + (r.rating ?? 0), 0);
    return Math.round((sum / rated.length) * 10) / 10;
  }, [progressData?.recent_rounds]);

  const handleOpenEcho = useCallback((initialPrompt?: string) => {
    haptic('light');
    if (initialPrompt) {
      navigate(`/echo?prompt=${encodeURIComponent(initialPrompt)}`);
    } else {
      navigate('/echo');
    }
  }, [navigate]);

  const handleEchoSubmit = useCallback(() => {
    const q = echoInput.trim();
    if (!q) return;
    haptic('light');
    handleOpenEcho(q);
    setEchoInput('');
  }, [echoInput, handleOpenEcho]);

  const shuffledPrompts = useMemo(() => {
    return [...WHISPER_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3);
  }, []);

  const containerVariants = useMemo(() => getContainerVariants(prefersReduced), [prefersReduced]);
  const cardVariants = useMemo(() => getCardVariants(prefersReduced), [prefersReduced]);

  const formatCount = (count: number) => count > 99 ? '99+' : String(count);

  // ============ Loading ============
  if (isLoading) {
    return (
      <div className="h-[100dvh] overflow-hidden relative">
        <CanonicalAmberBg />
        <div className="relative z-10 flex-1 flex flex-col px-5 font-dm-sans" style={{ paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 47px)' }}>
          <Skeleton className="h-4 w-28 mb-2 bg-white/30" />
          <Skeleton className="h-9 w-40 mb-8 bg-white/30" />
          <Skeleton className="h-[120px] w-full rounded-[20px] mb-4 bg-white/30" />
          <Skeleton className="h-[56px] w-full rounded-[20px] mb-4 bg-white/30" />
          <Skeleton className="flex-1 w-full rounded-[20px] bg-white/30" />
        </div>
      </div>
    );
  }

  // ============ Error ============
  if (hasError && !sessionLoading) {
    return (
      <div className="h-[100dvh] overflow-hidden relative">
        <CanonicalAmberBg />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 h-full font-dm-sans">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/40">
            <RefreshCw className="w-8 h-8" style={{ color: '#D97706' }} />
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#1C1917' }}>Couldn't load your Hub</h2>
          <p className="text-[15px] text-center mb-6" style={{ color: '#78716C' }}>Check your connection and try again</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-white rounded-full text-[15px] font-semibold active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ============ Main Render ============
  return (
    <div className="h-[100dvh] overflow-hidden relative hub-warm-page font-dm-sans">
      <CanonicalAmberBg />

      {/* Content layer */}
      <div
        className="relative z-10 flex flex-col h-full max-w-lg mx-auto w-full"
        style={{
          paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 47px)',
          paddingBottom: 'calc(82px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Offline banner */}
        {!isOnline && (
          <div className="flex-none flex items-center justify-center gap-2 py-2 px-4 mx-6 rounded-full bg-white/40 mb-2">
            <WifiOff className="w-4 h-4" style={{ color: '#92400E' }} />
            <span className="text-[13px] font-medium" style={{ color: '#92400E' }}>You're offline</span>
          </div>
        )}

        {/* === Header === */}
        <motion.header
          className="flex-none px-6 pt-9 pb-3"
          initial={prefersReduced ? {} : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center justify-between">
            {/* Greeting */}
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(120,90,60,0.45)' }}>
                {getGreeting()}
              </p>
              <h1 className="font-playfair text-[30px] font-bold truncate" style={{ color: '#1C1917', lineHeight: 1.15 }}>
                {firstName}
              </h1>
            </div>

            {/* Bell + Avatar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { haptic('light'); navigate('/activity'); }}
                className="relative w-[38px] h-[38px] rounded-full flex items-center justify-center active:scale-[0.93] transition-transform"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.4)' }}
                aria-label={`Notifications${hasUnreadNotifications ? `, ${unreadNotificationCount} unread` : ''}`}
              >
                <Bell className="w-[18px] h-[18px]" style={{ color: '#78716C' }} />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-amber-500 flex items-center justify-center px-1">
                    <span className="text-[10px] font-bold text-white leading-none">{formatCount(unreadNotificationCount || 0)}</span>
                  </span>
                )}
                {unreadCount > 0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-amber-500 border-2 border-white/60 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white leading-none">{formatCount(unreadCount)}</span>
                  </span>
                )}
              </button>

              <button
                onClick={() => { prefetchHandlers?.onTouchStart(); haptic('light'); navigate('/profile'); }}
                onMouseEnter={prefetchHandlers?.onMouseEnter}
                className="w-[38px] h-[38px] rounded-full overflow-hidden active:scale-[0.93] transition-transform"
                style={{
                  background: profile?.profile_photo_url ? undefined : 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
                aria-label="View profile"
              >
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold flex items-center justify-center w-full h-full">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.header>

        {/* === Cards Container (flex-1 to fill remaining space) === */}
        <motion.div
          className="flex-1 flex flex-col gap-3 px-5 min-h-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Messages Card — compact badge chips style */}
          <motion.div variants={cardVariants}>
            <GlassCard className="px-[18px] py-[14px]">
              {/* Header */}
              <button
                onClick={() => { haptic('light'); navigate('/messages'); }}
                className="flex items-center justify-between w-full mb-2 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span className="text-[16px] font-semibold" style={{ color: '#1C1917' }}>Messages</span>
                  {unreadCount > 0 && (
                     <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{unreadCount}</span>
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-medium" style={{ color: '#D97706' }}>
                  See all →
                </span>
              </button>

              {/* Conversation badge chips */}
              {conversationsLoading && !conversations?.length ? (
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-32 rounded-full bg-white/30" />
                  <Skeleton className="h-8 w-28 rounded-full bg-white/30" />
                </div>
              ) : conversationBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-3">
                  {conversationBadges.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => { haptic('light'); navigate(`/messages/${conv.id}`); }}
                      className="warm-conv-badge"
                    >
                      <div className="relative">
                        <SquircleAvatar
                          size={24}
                          src={conv.avatarUrl}
                          alt={conv.name}
                          fallback={conv.name.charAt(0).toUpperCase()}
                          hideRing
                        />
                        {conv.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-white/80" />
                        )}
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: '#44403C' }}>{conv.name.split(' ')[0]}</span>
                      <span className="text-[11px]" style={{ color: '#A8A29E' }}>{conv.time}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] mb-3" style={{ color: '#A8A29E' }}>No conversations yet</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { haptic('light'); navigate('/messages?new=dm'); }}
                  className="flex-1 py-2.5 rounded-[10px] text-[12px] font-semibold active:scale-[0.97] transition-transform"
                  style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.12)', color: '#B45309' }}
                >
                  New Chat
                </button>
                <button
                  onClick={() => { haptic('light'); navigate('/messages?new=group'); }}
                  className="flex-1 py-2.5 rounded-[10px] text-[12px] font-semibold active:scale-[0.97] transition-transform"
                  style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.12)', color: '#B45309' }}
                >
                  New Group
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* At a Glance — compact single-row */}
          <motion.div variants={cardVariants}>
            <GlassCard className="px-[18px] py-[12px]">
              <div className="flex items-center justify-between">
                {/* Left: label */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm">⛳</span>
                  <span className="text-[14px] font-semibold" style={{ color: '#1C1917' }}>At a Glance</span>
                </div>

                {/* Right: stats inline */}
                <div className="flex items-center gap-4">
                  {progressLoading ? (
                    <>
                      <Skeleton className="h-5 w-8 bg-white/30" />
                      <Skeleton className="h-5 w-8 bg-white/30" />
                    </>
                  ) : (
                    <>
                      <button onClick={() => { haptic('light'); navigate('/profile'); }} className="text-center active:scale-95 transition-transform">
                        <span className="text-[17px] font-bold block" style={{ color: '#1C1917' }}>
                          {profile?.eg_handicap_index != null ? profile.eg_handicap_index.toFixed(1) : '—'}
                        </span>
                        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#A8A29E' }}>HCP</span>
                      </button>
                      <button onClick={() => { haptic('light'); navigate('/top100'); }} className="text-center active:scale-95 transition-transform">
                        <span className="text-[17px] font-bold block" style={{ color: '#1C1917' }}>{top100Count}</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#A8A29E' }}>Top 100</span>
                      </button>
                      <button onClick={() => { haptic('light'); navigate('/top100?tab=my-progress'); }} className="text-center active:scale-95 transition-transform">
                        <span className="text-[17px] font-bold block" style={{ color: '#1C1917' }}>{streak}</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#A8A29E' }}>Streak</span>
                      </button>
                      <button onClick={() => { haptic('light'); navigate('/top100'); }} className="text-center active:scale-95 transition-transform">
                        <span className="text-[17px] font-bold block" style={{ color: '#1C1917' }}>{avgRating ?? '—'}</span>
                        <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: '#A8A29E' }}>Avg</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { haptic('light'); navigate('/profile'); }}
                    className="active:scale-95 transition-transform"
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: '#D97706' }} />
                  </button>
                </div>
              </div>

              {/* Next milestone (compact) */}
              {progressData?.next_milestone && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
                  <button
                    onClick={() => { haptic('light'); navigate('/achievements'); }}
                    className="flex items-center gap-2 w-full text-left active:scale-[0.98] transition-transform"
                  >
                    <span className="text-[13px]" style={{ color: '#1C1917' }}>
                      <span className="font-semibold">{progressData.next_milestone.remaining} more</span>
                      <span style={{ color: '#78716C' }}> to {progressData.next_milestone.tierName}</span>
                    </span>
                    <span className="text-[12px] font-medium ml-auto" style={{ color: '#D97706' }}>View Details</span>
                  </button>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Echo Card — flex-1 to fill remaining space */}
          <motion.div variants={cardVariants} className="flex-1 min-h-0 flex flex-col">
            <div className="warm-echo-gradient flex-1 flex flex-col min-h-0 px-[18px] py-[14px]">
              {/* Header */}
              <button
                onClick={() => { haptic('light'); navigate('/echo'); }}
                className="flex items-center justify-between mb-2 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  {/* Echo orb */}
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
                    style={{
                      background: '#F59E0B',
                      animation: prefersReduced ? 'none' : 'warmPulseGlow 2s ease-in-out infinite',
                    }}
                  >
                    <div className="flex items-center gap-[2px]">
                      <div className="w-[2px] h-2 bg-white rounded-full" style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite' }} />
                      <div className="w-[2px] h-3 bg-white rounded-full" style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} />
                      <div className="w-[2px] h-2 bg-white rounded-full" style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[17px] font-bold block" style={{ color: '#1C1917' }}>Echo</span>
                    <span className="text-[12px]" style={{ color: '#B45309' }}>Your personal caddie</span>
                  </div>
                </div>
                <span className="text-[16px]" style={{ color: '#D97706' }}>→</span>
              </button>

              {/* Greeting text — fills the gap */}
              <p className="text-[13px] font-normal mb-2" style={{ color: 'rgba(146,64,14,0.5)' }}>
                How can I help today?
              </p>

              {/* Suggestion chips — 3 chips, tight spacing */}
              <div className="flex flex-col gap-[6px] min-h-0">
                {shuffledPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { haptic('light'); handleOpenEcho(prompt.text); }}
                    className="warm-suggestion-chip w-full"
                  >
                    <PromptIcon type={prompt.icon} />
                    <span className="flex-1 text-left line-clamp-1">{prompt.text}</span>
                    <span className="text-[11px] flex-shrink-0" style={{ color: '#D97706' }}>→</span>
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <div className="flex-none mt-[12px]">
                <div className="warm-input-bar">
                  <input
                    type="text"
                    value={echoInput}
                    onChange={(e) => setEchoInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEchoSubmit(); } }}
                    placeholder="Ask Echo anything..."
                    aria-label="Type a question for Echo"
                  />
                  {echoInput.trim() ? (
                    <button
                      onClick={handleEchoSubmit}
                      className="warm-mic-btn"
                      aria-label="Send"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-white" />
                    </button>
                  ) : isSupported ? (
                    <button
                      onClick={() => { if (isListening) stopListening(); else { haptic('light'); startListening(); } }}
                      className={cn("warm-mic-btn", isListening && "animate-pulse")}
                      style={isListening ? { background: '#EF4444' } : {}}
                      aria-label={isListening ? "Stop listening" : "Voice input"}
                    >
                      <Mic className="w-3.5 h-3.5 text-white" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default HubPageNew;
