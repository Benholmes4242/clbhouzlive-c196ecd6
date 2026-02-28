/**
 * GameInviteTestLab - Comprehensive Game Invite & RSVP Notification Testing
 * 
 * Features:
 * 1) Test Lab → Ben flow (Ben receives invite, accepts, appears in Your Games)
 * 2) Ben → Test Lab flow (Ben hosts, invites Test Lab, Test Lab accepts, Ben gets RSVP notification)
 * 3) Manual controls for edge cases
 * 4) Activity logging with timestamps
 * 5) State snapshots showing participant status
 * 6) Cleanup functionality
 * 
 * Uses the SAME production code paths:
 * - useSendGameInviteNotification 
 * - useSendRsvpNotification
 * - Real game_participants table
 * - Real notifications table
 */

import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTestUser } from '@/hooks/useAdminTestActions';
import { cn } from '@/lib/utils';
import { 
  Flag, Loader2, Check, X, Send, Calendar, Trash2, 
  ExternalLink, RefreshCw, User, Users, Bell, Clock,
  ChevronDown, ChevronUp, Play, Inbox
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { 
  useSendGameInviteNotification, 
  useSendRsvpNotification,
  formatGameDateForNotification,
  formatGameTimeForNotification,
} from '@/features/hub/hooks/useGameNotifications';

// Constants
const BENJAMIN_HOLMES_ID = '6a5bcbb9-c22c-4655-ad8e-088b2858ca3e';
const BENJAMIN_HOLMES_NAME = 'Benjamin Holmes';
const TEST_GAME_PREFIX = '[TEST LAB]';

// ===========================================
// UI Components
// ===========================================

const ActionButton: React.FC<{
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'primary' | 'warning';
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}> = ({ label, onClick, loading, disabled, variant = 'default', icon, size = 'md' }) => {
  const variantClasses = {
    default: 'bg-muted hover:bg-muted/80 border-border text-foreground',
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 text-emerald-700',
    danger: 'bg-red-500/10 hover:bg-red-500/20 border-red-200 text-red-600',
    primary: 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary',
    warning: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-200 text-amber-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "flex items-center gap-2 rounded-sq-sm font-medium transition-colors border",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {loading ? 'Processing...' : label}
    </button>
  );
};

const ScenarioCard: React.FC<{
  title: string;
  description: string;
  emoji: string;
  buttonLabel: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'success';
}> = ({ title, description, emoji, buttonLabel, onClick, loading, disabled, variant = 'primary' }) => (
  <div className={cn(
    "rounded-sq-md border p-4 space-y-3",
    variant === 'primary' 
      ? "bg-primary/5 border-primary/20" 
      : "bg-emerald-500/5 border-emerald-500/20"
  )}>
    <div className="flex items-start gap-3">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 rounded-sq-sm px-4 py-2.5 text-sm font-medium transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === 'primary'
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Running...
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          {buttonLabel}
        </>
      )}
    </button>
  </div>
);

interface LogEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const ActivityLog: React.FC<{ entries: LogEntry[] }> = ({ entries }) => {
  const [expanded, setExpanded] = useState(true);
  
  if (entries.length === 0) return null;

  return (
    <div className="rounded-sq-sm border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          Activity Log ({entries.length})
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {expanded && (
        <div className="max-h-48 overflow-y-auto border-t border-border">
          {entries.map(entry => (
            <div 
              key={entry.id}
              className={cn(
                "px-3 py-2 text-xs border-b border-border/50 last:border-0",
                entry.type === 'error' && "bg-red-50",
                entry.type === 'success' && "bg-emerald-50",
                entry.type === 'warning' && "bg-amber-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-mono">
                  {format(entry.timestamp, 'HH:mm:ss')}
                </span>
                <span className={cn(
                  "font-medium",
                  entry.type === 'error' && "text-red-700",
                  entry.type === 'success' && "text-emerald-700",
                  entry.type === 'warning' && "text-amber-700"
                )}>
                  {entry.action}
                </span>
              </div>
              <div className="text-muted-foreground mt-0.5 pl-14">{entry.details}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===========================================
// Data Hooks
// ===========================================

// Fetch test games (tagged with TEST LAB prefix or by test user)
function useTestLabGames(testUserId: string | undefined, benId: string) {
  return useQuery({
    queryKey: ['test-lab-games-all', testUserId, benId],
    queryFn: async () => {
      if (!testUserId) return { byTestUser: [], byBen: [] };
      
      // Games hosted by test user
      const { data: testUserGames } = await supabase
        .from('games')
        .select(`
          id, start_time, status, note,
          golf_courses:course_id (name),
          game_participants (id, user_id, rsvp_status, state, role)
        `)
        .eq('host_user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Games hosted by Ben (for reverse testing)
      const { data: benGames } = await supabase
        .from('games')
        .select(`
          id, start_time, status, note,
          golf_courses:course_id (name),
          game_participants (id, user_id, rsvp_status, state, role)
        `)
        .eq('host_user_id', benId)
        .ilike('note', `${TEST_GAME_PREFIX}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return {
        byTestUser: testUserGames || [],
        byBen: benGames || [],
      };
    },
    enabled: !!testUserId,
    staleTime: 5000,
    refetchInterval: 10000,
  });
}

// Fetch participant statuses for a game
function useGameParticipantStatus(gameId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['game-participant-status', gameId, userId],
    queryFn: async () => {
      if (!gameId || !userId) return null;
      
      const { data } = await supabase
        .from('game_participants')
        .select('id, rsvp_status, state, role')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!gameId && !!userId,
    staleTime: 5000,
  });
}

// Fetch recent notifications for debugging
function useRecentNotifications(userId: string | undefined, types: string[]) {
  return useQuery({
    queryKey: ['test-lab-notifications', userId, types],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data } = await supabase
        .from('notifications')
        .select('id, type, title, message, actor_id, entity_id, created_at, is_read')
        .eq('user_id', userId)
        .in('type', types)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5000,
    refetchInterval: 5000,
  });
}

// ===========================================
// Action Hooks
// ===========================================

// Create a test game
function useCreateTestGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hostUserId, hostName }: { hostUserId: string; hostName: string }) => {
      // Pick a sample course
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name')
        .limit(1);
      
      const courseId = courses?.[0]?.id || null;
      const courseName = courses?.[0]?.name || 'Golf Course';
      
      const startTime = addDays(new Date(), 1);
      startTime.setHours(10, 0, 0, 0);
      const expiresAt = addDays(startTime, 1);

      const { data, error } = await supabase
        .from('games')
        .insert({
          host_user_id: hostUserId,
          course_id: courseId,
          start_time: startTime.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'scheduled',
          visibility: 'private',
          slots_total: 4,
          slots_open: 3,
          note: `${TEST_GAME_PREFIX} Created by ${hostName}`,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Add host as participant
      await supabase
        .from('game_participants')
        .insert({
          game_id: data.id,
          user_id: hostUserId,
          role: 'host',
          state: 'confirmed',
          rsvp_status: 'going',
          reserves_slot: true,
        });

      return { gameId: data.id, courseName, startTime };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-lab-games-all'] });
    },
  });
}

// Send game invite (uses production hook)
function useSendTestInvite() {
  const queryClient = useQueryClient();
  const sendGameInviteNotification = useSendGameInviteNotification();

  return useMutation({
    mutationFn: async ({ 
      gameId, 
      inviterId,
      inviteeId, 
    }: { 
      gameId: string;
      inviterId: string;
      inviteeId: string;
    }) => {
      // Get game details
      const { data: game } = await supabase
        .from('games')
        .select('start_time, golf_courses:course_id (name)')
        .eq('id', gameId)
        .single();

      const courseName = (game?.golf_courses as any)?.name || 'Golf Course';
      const startTime = game?.start_time ? new Date(game.start_time) : new Date();

      // Add as participant (same as InviteToGameModal)
      const { error: participantError } = await supabase
        .from('game_participants')
        .upsert({
          game_id: gameId,
          user_id: inviteeId,
          role: 'player',
          state: 'invited',
          rsvp_status: 'invited',
          invited_by: inviterId,
          reserves_slot: false,
        }, { onConflict: 'game_id,user_id' });

      if (participantError) throw participantError;

      // Use production notification hook
      await sendGameInviteNotification.mutateAsync({
        gameId,
        invitedUserIds: [inviteeId],
        courseName,
        date: formatGameDateForNotification(startTime),
        time: formatGameTimeForNotification(startTime),
      });

      return { courseName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-lab-games-all'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['test-lab-notifications'] });
    },
  });
}

// RSVP to a game (uses production hook)
function useTestRsvp() {
  const queryClient = useQueryClient();
  const sendRsvpNotification = useSendRsvpNotification();

  return useMutation({
    mutationFn: async ({ 
      gameId, 
      participantId,
      responderId,
      responderName,
      newStatus,
      hostUserId,
    }: { 
      gameId: string;
      participantId: string;
      responderId: string;
      responderName: string;
      newStatus: 'going' | 'maybe' | 'declined';
      hostUserId: string;
    }) => {
      // Update participant status
      const { error: updateError } = await supabase
        .from('game_participants')
        .update({
          rsvp_status: newStatus,
          state: newStatus === 'going' ? 'confirmed' : newStatus === 'declined' ? 'declined' : 'invited',
          reserves_slot: newStatus === 'going',
          rsvp_updated_at: new Date().toISOString(),
        })
        .eq('id', participantId);

      if (updateError) throw updateError;

      // If going, send RSVP notification to host (uses production hook)
      if (newStatus === 'going') {
        const { data: game } = await supabase
          .from('games')
          .select('start_time, golf_courses:course_id (name)')
          .eq('id', gameId)
          .single();

        const courseName = (game?.golf_courses as any)?.name || 'Golf Course';
        const gameDate = game?.start_time 
          ? formatGameDateForNotification(game.start_time) 
          : 'TBD';

        await sendRsvpNotification.mutateAsync({
          gameId,
          newStatus: 'going',
          playerName: responderName,
          courseName,
          date: gameDate,
          recipientUserIds: [hostUserId],
        });
      }

      return { newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-lab-games-all'] });
      queryClient.invalidateQueries({ queryKey: ['game-participant-status'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['test-lab-notifications'] });
    },
  });
}

// Cleanup test games
function useCleanupTestGames() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ testUserId, benId }: { testUserId: string; benId: string }) => {
      // Delete games hosted by test user
      const { error: testGameError } = await supabase
        .from('games')
        .delete()
        .eq('host_user_id', testUserId);

      if (testGameError) console.warn('Error deleting test user games:', testGameError);

      // Delete test games hosted by Ben
      const { error: benGameError } = await supabase
        .from('games')
        .delete()
        .eq('host_user_id', benId)
        .ilike('note', `${TEST_GAME_PREFIX}%`);

      if (benGameError) console.warn('Error deleting Ben test games:', benGameError);

      // Clear game-related notifications between test user and Ben
      await supabase
        .from('notifications')
        .delete()
        .or(`actor_id.eq.${testUserId},user_id.eq.${testUserId}`)
        .in('type', ['game_invite', 'rsvp_update', 'game_reminder_24h', 'game_updated']);

      await supabase
        .from('notifications')
        .delete()
        .eq('actor_id', benId)
        .in('type', ['game_invite', 'rsvp_update'])
        .eq('user_id', testUserId);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-lab-games-all'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['test-lab-notifications'] });
    },
  });
}

// ===========================================
// Main Component
// ===========================================

export function GameInviteTestLab() {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { data: testUser, isLoading: testUserLoading } = useTestUser();
  
  // Activity log state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showManualControls, setShowManualControls] = useState(false);

  const addLog = useCallback((action: string, details: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      action,
      details,
      type,
    }, ...prev].slice(0, 50));
  }, []);

  // Current admin's profile
  const { data: adminProfile } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Games data
  const { data: gamesData, isLoading: gamesLoading, refetch: refetchGames } = useTestLabGames(testUser?.id, BENJAMIN_HOLMES_ID);

  // Notifications for Ben
  const { data: benNotifications } = useRecentNotifications(
    BENJAMIN_HOLMES_ID, 
    ['game_invite', 'rsvp_update']
  );

  // Notifications for Test User
  const { data: testUserNotifications } = useRecentNotifications(
    testUser?.id, 
    ['game_invite', 'rsvp_update']
  );

  // Mutations
  const createGame = useCreateTestGame();
  const sendInvite = useSendTestInvite();
  const testRsvp = useTestRsvp();
  const cleanup = useCleanupTestGames();

  // Derived state
  const isBen = user?.id === BENJAMIN_HOLMES_ID;
  const currentUserName = adminProfile?.display_name || 'Admin';
  const testUserName = testUser?.display_name || 'Test User';

  // Find pending invites
  const benPendingInvites = gamesData?.byTestUser?.flatMap(game => 
    (game.game_participants as any[])?.filter(p => 
      p.user_id === BENJAMIN_HOLMES_ID && p.rsvp_status === 'invited'
    ).map(p => ({ ...p, game })) || []
  ) || [];

  const testUserPendingInvites = gamesData?.byBen?.flatMap(game =>
    (game.game_participants as any[])?.filter(p =>
      p.user_id === testUser?.id && p.rsvp_status === 'invited'
    ).map(p => ({ ...p, game })) || []
  ) || [];

  // ===========================================
  // Scenario Handlers
  // ===========================================

  // Flow 1: Test Lab invites Ben
  const handleTestLabInvitesBen = async () => {
    if (!testUser) return;
    
    try {
      addLog('Starting', 'Test Lab → Ben invite flow', 'info');
      
      // Step 1: Create game
      addLog('Creating game', `Host: ${testUserName}`, 'info');
      const gameResult = await createGame.mutateAsync({
        hostUserId: testUser.id,
        hostName: testUserName,
      });
      addLog('Game created', `ID: ${gameResult.gameId.slice(0, 8)}... at ${gameResult.courseName}`, 'success');
      
      // Step 2: Send invite
      addLog('Sending invite', `To: ${BENJAMIN_HOLMES_NAME}`, 'info');
      await sendInvite.mutateAsync({
        gameId: gameResult.gameId,
        inviterId: testUser.id,
        inviteeId: BENJAMIN_HOLMES_ID,
      });
      addLog('Invite sent', 'Notification created via production hook', 'success');
      
      toast.success('Flow complete!', {
        description: 'Ben should see invite in Notifications',
        position: 'top-center',
      });
    } catch (error: any) {
      addLog('Error', error.message, 'error');
      toast.error(error.message);
    }
  };

  // Flow 2: Ben invites Test Lab user
  const handleBenInvitesTestLab = async () => {
    if (!testUser) return;
    
    try {
      addLog('Starting', 'Ben → Test Lab invite flow', 'info');
      
      // Step 1: Create game as Ben
      addLog('Creating game', `Host: ${BENJAMIN_HOLMES_NAME}`, 'info');
      const gameResult = await createGame.mutateAsync({
        hostUserId: BENJAMIN_HOLMES_ID,
        hostName: BENJAMIN_HOLMES_NAME,
      });
      addLog('Game created', `ID: ${gameResult.gameId.slice(0, 8)}... at ${gameResult.courseName}`, 'success');
      
      // Step 2: Send invite to Test User
      addLog('Sending invite', `To: ${testUserName}`, 'info');
      await sendInvite.mutateAsync({
        gameId: gameResult.gameId,
        inviterId: BENJAMIN_HOLMES_ID,
        inviteeId: testUser.id,
      });
      addLog('Invite sent', 'Notification created via production hook', 'success');
      
      toast.success('Flow complete!', {
        description: 'Test Lab user has pending invite. Accept it below to test RSVP notification.',
        position: 'top-center',
      });
    } catch (error: any) {
      addLog('Error', error.message, 'error');
      toast.error(error.message);
    }
  };

  // Handle Test User accepting invite (triggers RSVP notification to Ben)
  const handleTestUserAccept = async (participantId: string, gameId: string) => {
    if (!testUser) return;

    // Find host
    const game = gamesData?.byBen?.find(g => g.id === gameId);
    if (!game) return;

    try {
      addLog('RSVP', `${testUserName} accepting invite`, 'info');
      
      await testRsvp.mutateAsync({
        gameId,
        participantId,
        responderId: testUser.id,
        responderName: testUserName,
        newStatus: 'going',
        hostUserId: BENJAMIN_HOLMES_ID,
      });
      
      addLog('RSVP sent', `${BENJAMIN_HOLMES_NAME} should receive notification`, 'success');
      
      toast.success('Accepted!', {
        description: 'Ben should receive RSVP notification',
        position: 'top-center',
      });
    } catch (error: any) {
      addLog('Error', error.message, 'error');
      toast.error(error.message);
    }
  };

  // Handle Ben accepting invite from Test User
  const handleBenAccept = async (participantId: string, gameId: string) => {
    if (!testUser) return;

    try {
      addLog('RSVP', `${BENJAMIN_HOLMES_NAME} accepting invite`, 'info');
      
      await testRsvp.mutateAsync({
        gameId,
        participantId,
        responderId: BENJAMIN_HOLMES_ID,
        responderName: BENJAMIN_HOLMES_NAME,
        newStatus: 'going',
        hostUserId: testUser.id,
      });
      
      addLog('RSVP sent', 'Acceptance recorded', 'success');
      
      toast.success('RSVP confirmed');
    } catch (error: any) {
      addLog('Error', error.message, 'error');
      toast.error(error.message);
    }
  };

  // Cleanup handler
  const handleCleanup = async () => {
    if (!testUser) return;

    try {
      addLog('Cleanup', 'Deleting test games and notifications', 'warning');
      
      await cleanup.mutateAsync({
        testUserId: testUser.id,
        benId: BENJAMIN_HOLMES_ID,
      });
      
      addLog('Cleanup complete', 'All test data removed', 'success');
      toast.success('Cleanup complete');
    } catch (error: any) {
      addLog('Error', error.message, 'error');
      toast.error(error.message);
    }
  };

  // ===========================================
  // Render
  // ===========================================

  const isLoading = testUserLoading || gamesLoading;

  return (
    <div className="rounded-sq-md border-2 border-emerald-500/20 bg-emerald-500/5 p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-emerald-600" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-emerald-700">
            Game Invite Testing
          </h2>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            label="Refresh"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => {
              refetchGames();
              queryClient.invalidateQueries({ queryKey: ['test-lab-notifications'] });
            }}
            size="sm"
          />
          <ActionButton
            label="Cleanup"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={handleCleanup}
            loading={cleanup.isPending}
            variant="danger"
            size="sm"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4 p-3 rounded-sq-sm bg-muted/50 text-xs">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Test User:</span>
          <span className="font-medium">{testUser?.display_name || 'Not configured'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Target:</span>
          <span className="font-medium">{BENJAMIN_HOLMES_NAME}</span>
          {isBen && <span className="text-emerald-600 font-medium">(You)</span>}
        </div>
      </div>

      {!testUser && (
        <div className="p-3 rounded-sq-sm bg-amber-50 border border-amber-200 text-sm text-amber-700">
          Test user not configured. Create a user profile with <code className="text-xs bg-muted px-1 py-0.5 rounded">is_test = true</code>
        </div>
      )}

      {testUser && (
        <>
          {/* Quick Scenarios */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Core Flows
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <ScenarioCard
                emoji="📨"
                title="Test Lab invites Ben"
                description="Creates game, sends invite. Ben sees notification and can accept."
                buttonLabel="Run Flow"
                onClick={handleTestLabInvitesBen}
                loading={createGame.isPending || sendInvite.isPending}
                variant="primary"
              />
              
              <ScenarioCard
                emoji="🔄"
                title="Ben invites Test Lab"
                description="Ben hosts, invites Test Lab. Accept below to test RSVP notification back to Ben."
                buttonLabel="Run Flow"
                onClick={handleBenInvitesTestLab}
                loading={createGame.isPending || sendInvite.isPending}
                variant="success"
              />
            </div>
          </div>

          {/* Pending Invites Section */}
          {(benPendingInvites.length > 0 || testUserPendingInvites.length > 0) && (
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pending Invites
              </div>

              {/* Ben's pending invites (from Test User) */}
              {benPendingInvites.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-primary">
                    Ben's Invites (from Test Lab)
                  </div>
                  {benPendingInvites.map((invite: any) => {
                    const courseName = invite.game?.golf_courses?.name || 'Golf Course';
                    const gameTime = invite.game?.start_time 
                      ? format(new Date(invite.game.start_time), 'EEE d MMM · HH:mm') 
                      : 'TBD';

                    return (
                      <div key={invite.id} className="flex items-center justify-between p-3 rounded-sq-sm bg-card border border-border">
                        <div>
                          <div className="font-medium text-sm">{courseName}</div>
                          <div className="text-xs text-muted-foreground">{gameTime}</div>
                        </div>
                        <div className="flex gap-2">
                          <ActionButton
                            label="Accept as Ben"
                            icon={<Check className="w-3.5 h-3.5" />}
                            variant="success"
                            size="sm"
                            onClick={() => handleBenAccept(invite.id, invite.game.id)}
                            loading={testRsvp.isPending}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Test User's pending invites (from Ben) */}
              {testUserPendingInvites.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-emerald-700">
                    Test Lab's Invites (from Ben) — Accept to send RSVP notification
                  </div>
                  {testUserPendingInvites.map((invite: any) => {
                    const courseName = invite.game?.golf_courses?.name || 'Golf Course';
                    const gameTime = invite.game?.start_time 
                      ? format(new Date(invite.game.start_time), 'EEE d MMM · HH:mm') 
                      : 'TBD';

                    return (
                      <div key={invite.id} className="flex items-center justify-between p-3 rounded-sq-sm bg-emerald-50 border border-emerald-200">
                        <div>
                          <div className="font-medium text-sm text-emerald-900">{courseName}</div>
                          <div className="text-xs text-emerald-700">{gameTime}</div>
                        </div>
                        <div className="flex gap-2">
                          <ActionButton
                            label="Accept → Notify Ben"
                            icon={<Check className="w-3.5 h-3.5" />}
                            variant="success"
                            size="sm"
                            onClick={() => handleTestUserAccept(invite.id, invite.game.id)}
                            loading={testRsvp.isPending}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notifications Snapshot */}
          <div className="space-y-3 pt-3 border-t border-border/50">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-3.5 h-3.5" />
              Recent Notifications
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Ben's notifications */}
              <div className="p-3 rounded-sq-sm bg-muted/30 border border-border">
                <div className="text-xs font-medium mb-2">Ben's Game Notifications</div>
                {benNotifications && benNotifications.length > 0 ? (
                  <div className="space-y-1.5">
                    {benNotifications.slice(0, 5).map((n: any) => (
                      <div key={n.id} className="text-xs p-2 bg-card rounded-sq-xs border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{n.type}</span>
                          <span className="text-muted-foreground">{format(new Date(n.created_at), 'HH:mm')}</span>
                        </div>
                        <div className="text-muted-foreground truncate">{n.title}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No recent notifications</div>
                )}
              </div>

              {/* Test User's notifications */}
              <div className="p-3 rounded-sq-sm bg-muted/30 border border-border">
                <div className="text-xs font-medium mb-2">Test Lab's Game Notifications</div>
                {testUserNotifications && testUserNotifications.length > 0 ? (
                  <div className="space-y-1.5">
                    {testUserNotifications.slice(0, 5).map((n: any) => (
                      <div key={n.id} className="text-xs p-2 bg-card rounded-sq-xs border border-border/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{n.type}</span>
                          <span className="text-muted-foreground">{format(new Date(n.created_at), 'HH:mm')}</span>
                        </div>
                        <div className="text-muted-foreground truncate">{n.title}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">No recent notifications</div>
                )}
              </div>
            </div>
          </div>

          {/* Deep Links */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
            <a 
              href="/hub" 
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Hub
            </a>
            <a 
              href="/notifications" 
              target="_blank"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Inbox className="w-3.5 h-3.5" />
              Open Notifications
            </a>
          </div>

          {/* Manual Controls (Collapsible) */}
          <div className="pt-3 border-t border-border/50">
            <button
              onClick={() => setShowManualControls(!showManualControls)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showManualControls ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Manual Controls
            </button>
            
            {showManualControls && (
              <div className="mt-3 space-y-3 p-3 rounded-sq-sm bg-muted/30 border border-border">
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    label="Create game as Test User"
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    size="sm"
                    onClick={() => createGame.mutate({ hostUserId: testUser.id, hostName: testUserName })}
                    loading={createGame.isPending}
                  />
                  <ActionButton
                    label="Create game as Ben"
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    size="sm"
                    onClick={() => createGame.mutate({ hostUserId: BENJAMIN_HOLMES_ID, hostName: BENJAMIN_HOLMES_NAME })}
                    loading={createGame.isPending}
                  />
                </div>

                {gamesData?.byTestUser && gamesData.byTestUser.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      label="Invite Ben to latest Test User game"
                      icon={<Send className="w-3.5 h-3.5" />}
                      size="sm"
                      variant="primary"
                      onClick={() => sendInvite.mutate({
                        gameId: gamesData.byTestUser[0].id,
                        inviterId: testUser.id,
                        inviteeId: BENJAMIN_HOLMES_ID,
                      })}
                      loading={sendInvite.isPending}
                    />
                  </div>
                )}

                {gamesData?.byBen && gamesData.byBen.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      label="Invite Test User to latest Ben game"
                      icon={<Send className="w-3.5 h-3.5" />}
                      size="sm"
                      variant="success"
                      onClick={() => sendInvite.mutate({
                        gameId: gamesData.byBen[0].id,
                        inviterId: BENJAMIN_HOLMES_ID,
                        inviteeId: testUser.id,
                      })}
                      loading={sendInvite.isPending}
                    />
                  </div>
                )}

                {/* Games List */}
                {((gamesData?.byTestUser?.length || 0) > 0 || (gamesData?.byBen?.length || 0) > 0) && (
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <div className="text-xs font-medium text-muted-foreground">Test Games</div>
                    
                    {gamesData?.byTestUser?.slice(0, 3).map((game: any) => (
                      <div key={game.id} className="text-xs p-2 bg-card rounded-sq-xs border border-border/50 flex justify-between">
                        <span>
                          <span className="font-medium">{(game.golf_courses as any)?.name || 'No course'}</span>
                          <span className="text-muted-foreground ml-2">(Test User host)</span>
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(game.start_time), 'EEE d MMM')}
                        </span>
                      </div>
                    ))}
                    
                    {gamesData?.byBen?.slice(0, 3).map((game: any) => (
                      <div key={game.id} className="text-xs p-2 bg-emerald-50 rounded-sq-xs border border-emerald-200 flex justify-between">
                        <span>
                          <span className="font-medium text-emerald-900">{(game.golf_courses as any)?.name || 'No course'}</span>
                          <span className="text-emerald-700 ml-2">(Ben host)</span>
                        </span>
                        <span className="text-emerald-600">
                          {format(new Date(game.start_time), 'EEE d MMM')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <ActivityLog entries={logs} />
        </>
      )}
    </div>
  );
}
