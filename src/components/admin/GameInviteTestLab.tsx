/**
 * GameInviteTestLab - Test Lab section for testing game invite flows
 * 
 * Uses the SAME code paths as the real product:
 * - useSendGameInviteNotification for invites
 * - useSendRsvpNotification for RSVP updates
 * 
 * Flow: Test User (host) → Admin (recipient)
 * This proves the multi-user notification path works correctly.
 */

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTestUser } from '@/hooks/useAdminTestActions';
import { cn } from '@/lib/utils';
import { Flag, Loader2, Check, X, Send, Calendar, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { 
  useSendGameInviteNotification, 
  useSendRsvpNotification,
  formatGameDateForNotification,
  formatGameTimeForNotification,
} from '@/features/hub/hooks/useGameNotifications';

// Button component matching test lab style
const ActionButton: React.FC<{
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'primary';
  icon?: React.ReactNode;
}> = ({ label, onClick, loading, disabled, variant = 'default', icon }) => {
  const variantClasses = {
    default: 'bg-muted hover:bg-muted/80 border-border text-foreground',
    success: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-200 text-emerald-700',
    danger: 'bg-red-500/10 hover:bg-red-500/20 border-red-200 text-red-600',
    primary: 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "flex items-center gap-2 rounded-sq-sm px-3 py-2 text-sm font-medium transition-colors border",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant]
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {loading ? 'Processing...' : label}
    </button>
  );
};

// Scenario button for multi-step flows
const ScenarioButton: React.FC<{
  label: string;
  description: string;
  emoji: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}> = ({ label, description, emoji, onClick, loading, disabled }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={cn(
      "w-full flex items-center justify-between rounded-sq-md px-4 py-3 text-left transition-colors",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "bg-muted/50 hover:bg-muted border border-border"
    )}
  >
    <span className="flex items-center gap-3">
      <span className="text-lg">{emoji}</span>
      <span className={cn("font-medium", loading && "animate-pulse")}>
        {loading ? 'Running...' : label}
      </span>
    </span>
    <span className="text-xs text-muted-foreground">{description}</span>
  </button>
);

// Hook to fetch test games created by test user
function useTestGames(testUserId: string | undefined) {
  return useQuery({
    queryKey: ['test-lab-games', testUserId],
    queryFn: async () => {
      if (!testUserId) return [];
      
      const { data, error } = await supabase
        .from('games')
        .select(`
          id,
          start_time,
          status,
          course_id,
          golf_courses:course_id (name)
        `)
        .eq('host_user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!testUserId,
    staleTime: 30000,
  });
}

// Hook to fetch target's participation in test games
function useTargetGameParticipations(testUserId: string | undefined, targetUserId: string | undefined) {
  return useQuery({
    queryKey: ['test-lab-participations', testUserId, targetUserId],
    queryFn: async () => {
      if (!testUserId || !targetUserId) return [];
      
      // Get games hosted by test user where target is participant
      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          id,
          game_id,
          rsvp_status,
          state,
          games!inner (
            id,
            start_time,
            host_user_id,
            golf_courses:course_id (name)
          )
        `)
        .eq('user_id', targetUserId)
        .eq('games.host_user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!testUserId && !!targetUserId,
    staleTime: 10000,
  });
}

// Hook to create a test game
function useCreateTestGame() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async () => {
      if (!testUser) throw new Error('Test user not configured');

      // Pick a sample course (Augusta National or similar)
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name')
        .limit(1);
      
      const courseId = courses?.[0]?.id || null;
      
      // Create game for tomorrow at 10am
      const startTime = addDays(new Date(), 1);
      startTime.setHours(10, 0, 0, 0);
      
      // Expires 24h after start
      const expiresAt = addDays(startTime, 1);

      const { data, error } = await supabase
        .from('games')
        .insert({
          host_user_id: testUser.id,
          course_id: courseId,
          start_time: startTime.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'scheduled',
          visibility: 'private',
          slots_total: 4,
          slots_open: 3,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Add test user as host participant
      await supabase
        .from('game_participants')
        .insert({
          game_id: data.id,
          user_id: testUser.id,
          role: 'host',
          state: 'confirmed',
          rsvp_status: 'going',
          reserves_slot: true,
        });

      return data;
    },
    onSuccess: () => {
      toast.success('Test game created', { position: 'top-center' });
      queryClient.invalidateQueries({ queryKey: ['test-lab-games'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create game', { position: 'top-center' });
    },
  });
}

// Hook to send game invite from test user to target
// Uses the SAME useSendGameInviteNotification hook as the real InviteToGameModal
function useSendGameInvite() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();
  const sendGameInviteNotification = useSendGameInviteNotification();

  return useMutation({
    mutationFn: async ({ gameId, targetUserId }: { gameId: string; targetUserId: string }) => {
      if (!testUser) throw new Error('Test user not configured');

      // Get game details for notification
      const { data: game } = await supabase
        .from('games')
        .select('start_time, golf_courses:course_id (name)')
        .eq('id', gameId)
        .single();

      const courseName = (game?.golf_courses as any)?.name || 'Golf Course';
      const startTime = game?.start_time ? new Date(game.start_time) : new Date();

      // Add as participant with invited status (same as InviteToGameModal)
      const { error: participantError } = await supabase
        .from('game_participants')
        .upsert({
          game_id: gameId,
          user_id: targetUserId,
          role: 'player',
          state: 'invited',
          rsvp_status: 'invited',
          invited_by: testUser.id,
          reserves_slot: false,
        }, { onConflict: 'game_id,user_id' });

      if (participantError) throw participantError;

      // Use the SAME notification hook as real product
      // Note: We pass actorUserId to override current user (since admin is logged in)
      await sendGameInviteNotification.mutateAsync({
        gameId,
        invitedUserIds: [targetUserId],
        courseName,
        date: formatGameDateForNotification(startTime),
        time: formatGameTimeForNotification(startTime),
      });

      return { success: true, courseName };
    },
    onSuccess: () => {
      toast.success('Game invite sent (via real hook)', { 
        description: 'Check your notifications!',
        position: 'top-center' 
      });
      queryClient.invalidateQueries({ queryKey: ['test-lab-participations'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['game-rsvp'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invite', { position: 'top-center' });
    },
  });
}

// Hook to respond to game invite (accept/decline)
// Uses the SAME useSendRsvpNotification hook as the real RSVP flow
function useRespondToInvite() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();
  const sendRsvpNotification = useSendRsvpNotification();

  return useMutation({
    mutationFn: async ({ 
      gameId, 
      participantId,
      response,
      targetUserId,
      targetDisplayName,
    }: { 
      gameId: string; 
      participantId: string;
      response: 'going' | 'declined';
      targetUserId: string;
      targetDisplayName: string;
    }) => {
      if (!testUser) throw new Error('Test user not configured');

      // Update participant status (same as real RSVP flow)
      const { error: updateError } = await supabase
        .from('game_participants')
        .update({
          rsvp_status: response,
          state: response === 'going' ? 'confirmed' : 'declined',
          reserves_slot: response === 'going',
          rsvp_updated_at: new Date().toISOString(),
        })
        .eq('id', participantId);

      if (updateError) throw updateError;

      // If accepted, use the SAME notification hook as real product
      if (response === 'going') {
        // Get game details
        const { data: game } = await supabase
          .from('games')
          .select('start_time, golf_courses:course_id (name)')
          .eq('id', gameId)
          .single();

        const courseName = (game?.golf_courses as any)?.name || 'Golf Course';
        const gameDate = game?.start_time 
          ? formatGameDateForNotification(game.start_time) 
          : 'TBD';

        // Use the SAME notification hook - notify host (test user)
        await sendRsvpNotification.mutateAsync({
          gameId,
          newStatus: 'going',
          playerName: targetDisplayName,
          courseName,
          date: gameDate,
          recipientUserIds: [testUser.id], // Notify the host
        });
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      const action = variables.response === 'going' ? 'Accepted' : 'Declined';
      toast.success(`${action} game invite (via real hook)`, { position: 'top-center' });
      queryClient.invalidateQueries({ queryKey: ['test-lab-participations'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      queryClient.invalidateQueries({ queryKey: ['game-rsvp'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to respond', { position: 'top-center' });
    },
  });
}

// Hook to clean up test games
function useCleanupTestGames() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Delete games hosted by test user (cascade will handle participants)
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('host_user_id', testUser.id);

      if (error) throw error;

      // Clear game-related notifications between test user and target
      await supabase
        .from('notifications')
        .delete()
        .or(`actor_id.eq.${testUser.id},user_id.eq.${testUser.id}`)
        .in('type', ['game_invite', 'rsvp_update', 'game_reminder_24h', 'game_updated']);

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Test games cleaned up', { position: 'top-center' });
      queryClient.invalidateQueries({ queryKey: ['test-lab-games'] });
      queryClient.invalidateQueries({ queryKey: ['test-lab-participations'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cleanup', { position: 'top-center' });
    },
  });
}

// Hook for full invite flow scenario
// Uses the SAME notification hooks as the real product
function useFullInviteFlow() {
  const queryClient = useQueryClient();
  const { data: testUser } = useTestUser();
  const sendGameInviteNotification = useSendGameInviteNotification();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!testUser) throw new Error('Test user not configured');

      // Step 1: Create a test game
      const { data: courses } = await supabase
        .from('golf_courses')
        .select('id, name')
        .limit(1);
      
      const courseId = courses?.[0]?.id || null;
      const courseName = courses?.[0]?.name || 'Golf Course';
      
      const startTime = addDays(new Date(), 2);
      startTime.setHours(9, 30, 0, 0);
      
      // Expires 24h after start
      const expiresAt = addDays(startTime, 1);

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          host_user_id: testUser.id,
          course_id: courseId,
          start_time: startTime.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'scheduled',
          visibility: 'private',
          slots_total: 4,
          slots_open: 3,
        })
        .select('id')
        .single();

      if (gameError) throw gameError;

      // Add test user as host
      await supabase
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: testUser.id,
          role: 'host',
          state: 'confirmed',
          rsvp_status: 'going',
          reserves_slot: true,
        });

      await new Promise(r => setTimeout(r, 300));

      // Step 2: Invite target using same flow as InviteToGameModal
      await supabase
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: targetUserId,
          role: 'player',
          state: 'invited',
          rsvp_status: 'invited',
          invited_by: testUser.id,
          reserves_slot: false,
        });

      // Use the SAME notification hook as real product
      await sendGameInviteNotification.mutateAsync({
        gameId: game.id,
        invitedUserIds: [targetUserId],
        courseName,
        date: formatGameDateForNotification(startTime),
        time: formatGameTimeForNotification(startTime),
      });

      return { gameId: game.id, courseName };
    },
    onSuccess: (data) => {
      toast.success('Full invite flow completed (via real hooks)', {
        description: `Game created at ${data.courseName} → Invite sent`,
        position: 'top-center',
      });
      queryClient.invalidateQueries({ queryKey: ['test-lab-games'] });
      queryClient.invalidateQueries({ queryKey: ['test-lab-participations'] });
      queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete flow', { position: 'top-center' });
    },
  });
}

export function GameInviteTestLab() {
  const { user } = useSupabaseSession();
  const { data: testUser, isLoading: testUserLoading } = useTestUser();
  const targetUserId = user?.id;

  // Fetch current admin's display name for RSVP notifications
  const { data: adminProfile } = useQuery({
    queryKey: ['admin-profile-for-test', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', targetUserId)
        .single();
      return data;
    },
    enabled: !!targetUserId,
  });

  const adminDisplayName = adminProfile?.display_name || 'Admin';

  const { data: testGames, isLoading: gamesLoading } = useTestGames(testUser?.id);
  const { data: participations, isLoading: participationsLoading } = useTargetGameParticipations(testUser?.id, targetUserId);

  const createGame = useCreateTestGame();
  const sendInvite = useSendGameInvite();
  const respondToInvite = useRespondToInvite();
  const cleanup = useCleanupTestGames();
  const fullFlow = useFullInviteFlow();

  const isLoading = testUserLoading || gamesLoading || participationsLoading;
  const hasTestUser = !!testUser;
  const hasTarget = !!targetUserId;

  // Find pending invites for target
  const pendingInvites = participations?.filter(p => p.rsvp_status === 'invited') || [];
  const acceptedGames = participations?.filter(p => p.rsvp_status === 'going') || [];

  return (
    <div className="rounded-sq-md border-2 border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Flag className="h-5 w-5 text-emerald-600" />
        <h2 className="text-sm font-semibold tracking-wide uppercase text-emerald-700">
          Game Invite Testing
        </h2>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />}
      </div>

      <p className="text-xs text-muted-foreground">
        Test game invite notifications end-to-end. The Test User creates games and invites you.
      </p>

      {!hasTestUser && (
        <div className="p-3 rounded-sq-sm bg-amber-50 border border-amber-200 text-sm text-amber-700">
          Test user not configured. Create a user profile with <code className="text-xs bg-muted px-1 py-0.5 rounded">is_test = true</code>
        </div>
      )}

      {hasTestUser && hasTarget && (
        <>
          {/* Quick Scenarios */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Quick Scenarios
            </div>
            <ScenarioButton
              emoji="⛳"
              label="Full invite flow"
              description="Create game → Send invite → Notification"
              onClick={() => fullFlow.mutate(targetUserId!)}
              loading={fullFlow.isPending}
            />
          </div>

          {/* Manual Actions */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Manual Actions
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                label="Create Test Game"
                icon={<Calendar className="w-4 h-4" />}
                onClick={() => createGame.mutate()}
                loading={createGame.isPending}
              />

              {testGames && testGames.length > 0 && (
                <ActionButton
                  label="Invite Me to Latest Game"
                  icon={<Send className="w-4 h-4" />}
                  onClick={() => sendInvite.mutate({ 
                    gameId: testGames[0].id, 
                    targetUserId: targetUserId! 
                  })}
                  loading={sendInvite.isPending}
                  variant="primary"
                />
              )}

              <ActionButton
                label="Cleanup Test Games"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => cleanup.mutate(targetUserId!)}
                loading={cleanup.isPending}
                variant="danger"
              />
            </div>
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Your Pending Invites ({pendingInvites.length})
              </div>
              {pendingInvites.map(invite => {
                const game = invite.games as any;
                const courseName = game?.golf_courses?.name || 'Golf Course';
                const gameTime = game?.start_time ? format(new Date(game.start_time), 'EEE d MMM · HH:mm') : 'TBD';

                return (
                  <div 
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-sq-sm bg-card border border-border"
                  >
                    <div>
                      <div className="font-medium text-sm">{courseName}</div>
                      <div className="text-xs text-muted-foreground">{gameTime}</div>
                    </div>
                    <div className="flex gap-2">
                      <ActionButton
                        label="Accept"
                        icon={<Check className="w-4 h-4" />}
                        variant="success"
                        onClick={() => respondToInvite.mutate({
                          gameId: invite.game_id,
                          participantId: invite.id,
                          response: 'going',
                          targetUserId: targetUserId!,
                          targetDisplayName: adminDisplayName,
                        })}
                        loading={respondToInvite.isPending}
                      />
                      <ActionButton
                        label="Decline"
                        icon={<X className="w-4 h-4" />}
                        variant="danger"
                        onClick={() => respondToInvite.mutate({
                          gameId: invite.game_id,
                          participantId: invite.id,
                          response: 'declined',
                          targetUserId: targetUserId!,
                          targetDisplayName: adminDisplayName,
                        })}
                        loading={respondToInvite.isPending}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Accepted Games */}
          {acceptedGames.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Your Accepted Games ({acceptedGames.length})
              </div>
              {acceptedGames.map(participation => {
                const game = participation.games as any;
                const courseName = game?.golf_courses?.name || 'Golf Course';
                const gameTime = game?.start_time ? format(new Date(game.start_time), 'EEE d MMM · HH:mm') : 'TBD';

                return (
                  <div 
                    key={participation.id}
                    className="flex items-center gap-3 p-3 rounded-sq-sm bg-emerald-50 border border-emerald-200"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium text-sm text-emerald-800">{courseName}</div>
                      <div className="text-xs text-emerald-600">{gameTime}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Test Games List */}
          {testGames && testGames.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Test Games (hosted by Test User)
              </div>
              <div className="space-y-1">
                {testGames.map(game => {
                  const courseName = (game.golf_courses as any)?.name || 'No Course';
                  const gameTime = format(new Date(game.start_time), 'EEE d MMM · HH:mm');

                  return (
                    <div 
                      key={game.id}
                      className="flex items-center justify-between p-2 rounded-sq-xs bg-muted/50 text-sm"
                    >
                      <span>{courseName}</span>
                      <span className="text-xs text-muted-foreground">{gameTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
