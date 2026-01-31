import React, { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  useTestUser,
  useSendFriendRequestFromTestUser,
  useAcceptFriendRequestAsTarget,
  useTestUserAcceptsFriendRequestFromTarget,
  useDeclineFriendRequestAsTarget,
  useCancelFriendRequestFromTestUser,
  useFollowTargetFromTestUser,
  useFollowTestUserFromTarget,
  useUnfollowBoth,
  useRemoveFriendship,
  useMockLikeNotification,
  useMockCommentNotification,
  useMockMentionNotification,
  useClearTestNotifications,
  // Quick Scenario hooks
  useFriendRequestHandshake,
  useBusyDayActivity,
  useFollowSwapScenario,
  useResetTestState,
  // Preset "Lives" hooks
  useNewUserOnboardingWeek,
  useHighEngagementCreatorDay,
  useQuietDayThenSpike,
  // Focus Preset hooks
  useClubsOnlyDay,
  useMessagesHeavyDay,
  useMentionsAndTagsDay,
  useAchievementsBurst,
} from '@/hooks/useAdminTestActions';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Users, UserPlus, Heart, MessageCircle, AtSign, Trash2, AlertCircle, Check, Zap, RotateCcw, Sparkles, Image, Download, RefreshCw } from 'lucide-react';
import { BusinessAccessTestLab } from '@/components/admin/BusinessAccessTestLab';
import { GameInviteTestLab } from '@/components/admin/GameInviteTestLab';
import { TourHubSyncTestLab } from '@/components/admin/TourHubSyncTestLab';

// Reusable button component
const TestButton: React.FC<{
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}> = ({ label, onClick, loading, variant = 'default', icon }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={cn(
      "flex items-center gap-2 rounded-sq-sm px-4 py-2.5 text-sm font-medium transition-colors",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      variant === 'danger'
        ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-200"
        : "bg-muted hover:bg-muted/80 border border-border"
    )}
  >
    {icon}
    {loading ? 'Processing...' : label}
  </button>
);

// Scenario button component
const ScenarioButton: React.FC<{
  label: string;
  description: string;
  emoji: string;
  onClick: () => void;
  loading?: boolean;
  variant?: 'default' | 'danger';
}> = ({ label, description, emoji, onClick, loading, variant = 'default' }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={cn(
      "w-full flex items-center justify-between rounded-sq-md px-4 py-3 text-left transition-colors",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      variant === 'danger'
        ? "bg-red-500/10 hover:bg-red-500/15 border border-red-200"
        : "bg-muted/50 hover:bg-muted border border-border"
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

// Section wrapper
const TestSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div className="rounded-sq-md border border-border bg-card p-4 space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      {icon}
      {title}
    </div>
    <div className="flex flex-wrap gap-2">
      {children}
    </div>
  </div>
);

// Button to set test user profile photo
const SetTestUserPhotoButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  
  const handleSetPhoto = async () => {
    setLoading(true);
    try {
      const photoUrl = `${window.location.origin}/images/test-user-avatar.jpg`;
      const { error } = await supabase.rpc('admin_set_test_user_photo', {
        p_photo_url: photoUrl
      });
      
      if (error) throw error;
      
      toast.success('Test user photo set!');
      queryClient.invalidateQueries({ queryKey: ['test-user'] });
    } catch (err) {
      console.error('Error setting test user photo:', err);
      toast.error('Failed to set photo');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleSetPhoto}
      disabled={loading}
      className="text-xs px-2 py-1 rounded-sq-xs bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
    >
      {loading ? 'Setting...' : 'Set Photo'}
    </button>
  );
};

export function AdminTestLabPage() {
  const { user } = useSupabaseSession();
  const { data: testUser, isLoading: testUserLoading, error: testUserError } = useTestUser();
  
  // All the test action hooks
  const sendFriendRequest = useSendFriendRequestFromTestUser();
  const acceptFriendRequest = useAcceptFriendRequestAsTarget();
  const testUserAcceptsRequest = useTestUserAcceptsFriendRequestFromTarget();
  const declineFriendRequest = useDeclineFriendRequestAsTarget();
  const cancelFriendRequest = useCancelFriendRequestFromTestUser();
  const followTarget = useFollowTargetFromTestUser();
  const followTestUser = useFollowTestUserFromTarget();
  const unfollowBoth = useUnfollowBoth();
  const removeFriendship = useRemoveFriendship();
  const mockLike = useMockLikeNotification();
  const mockComment = useMockCommentNotification();
  const mockMention = useMockMentionNotification();
  const clearNotifications = useClearTestNotifications();

  // Quick Scenario hooks
  const friendRequestHandshake = useFriendRequestHandshake();
  const busyDayActivity = useBusyDayActivity();
  const followSwapScenario = useFollowSwapScenario();
  const resetTestState = useResetTestState();

  // Preset "Lives" hooks
  const newUserOnboardingWeek = useNewUserOnboardingWeek();
  const highEngagementCreatorDay = useHighEngagementCreatorDay();
  const quietDayThenSpike = useQuietDayThenSpike();

  // Focus Preset hooks
  const clubsOnlyDay = useClubsOnlyDay();
  const messagesHeavyDay = useMessagesHeavyDay();
  const mentionsAndTagsDay = useMentionsAndTagsDay();
  const achievementsBurst = useAchievementsBurst();


  // Target is always the current user for now
  const targetUserId = user?.id;

  // Check if any scenario is running
  const isScenarioRunning = 
    friendRequestHandshake.isPending || 
    testUserAcceptsRequest.isPending ||
    busyDayActivity.isPending || 
    followSwapScenario.isPending || 
    resetTestState.isPending ||
    newUserOnboardingWeek.isPending ||
    highEngagementCreatorDay.isPending ||
    quietDayThenSpike.isPending ||
    clubsOnlyDay.isPending ||
    messagesHeavyDay.isPending ||
    mentionsAndTagsDay.isPending ||
    achievementsBurst.isPending;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-sq-md border border-border bg-card p-6 text-center">
          <p className="text-muted-foreground">Please log in to use the Test Lab</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Test Lab</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use the Clbhouz Test User to simulate friend requests, follows, and
          notifications against your currently logged-in account.
        </p>
      </div>

      {/* Test User Status Card */}
      <div className="rounded-sq-md border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Test User
        </div>
        
        {testUserLoading ? (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ) : testUser ? (
          <div className="flex items-center gap-3">
            <SquircleAvatar
              src={testUser.profile_photo_url}
              alt={testUser.display_name}
              size={48}
              fallback={testUser.display_name?.charAt(0) || 'T'}
            />
            <div>
              <div className="font-medium">{testUser.display_name}</div>
              <div className="text-sm text-muted-foreground">@{testUser.username}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {!testUser.profile_photo_url && (
                <SetTestUserPhotoButton />
              )}
              <div className="flex items-center gap-1 text-emerald-600 text-sm">
                <Check className="h-4 w-4" />
                <span>Active</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <div>
              <div className="font-medium">Test User Not Configured</div>
              <div className="text-sm text-muted-foreground">
                Create a user profile with <code className="text-xs bg-muted px-1 py-0.5 rounded">is_test = true</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Target User Card */}
      <div className="rounded-sq-md border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Target User (You)
        </div>
        <div className="flex items-center gap-3">
          <SquircleAvatar
            src={null}
            alt="You"
            size={48}
            fallback={user.email?.charAt(0) || 'U'}
          />
          <div>
            <div className="font-medium">{user.email}</div>
            <div className="text-sm text-muted-foreground font-mono">{user.id}</div>
          </div>
        </div>
      </div>

      {/* Quick Scenarios Section - NEW */}
      {testUser && targetUserId && (
        <div className="rounded-sq-md border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Quick Scenarios</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            One-click flows that run several actions in sequence using the Test User.
          </p>

          <div className="space-y-2">
            <ScenarioButton
              emoji="🤝"
              label="Friend request handshake"
              description="Test User ↔ Target"
              onClick={() => friendRequestHandshake.mutate(targetUserId)}
              loading={friendRequestHandshake.isPending}
            />

            <ScenarioButton
              emoji="✅"
              label="Test User accepts YOUR request"
              description="You see 'accepted your friend request'"
              onClick={() => testUserAcceptsRequest.mutate(targetUserId)}
              loading={testUserAcceptsRequest.isPending}
            />

            <ScenarioButton
              emoji="📬"
              label="Busy day activity feed"
              description="20+ mixed notifications"
              onClick={() => busyDayActivity.mutate(targetUserId)}
              loading={busyDayActivity.isPending}
            />

            <ScenarioButton
              emoji="👣"
              label="Follow swap"
              description="Follow / follow-back"
              onClick={() => followSwapScenario.mutate(targetUserId)}
              loading={followSwapScenario.isPending}
            />

            <ScenarioButton
              emoji="🧹"
              label="Reset test state"
              description="Clears test friend/follow + notifications"
              onClick={() => resetTestState.mutate(targetUserId)}
              loading={resetTestState.isPending}
              variant="danger"
            />
          </div>

          {isScenarioRunning && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
              <RotateCcw className="h-3 w-3 animate-spin" />
              <span>Running scenario...</span>
            </div>
          )}
        </div>
      )}

      {/* Preset "Lives" Section */}
      {testUser && targetUserId && (
        <div className="rounded-sq-md border-2 border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Preset "Lives"</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulate different notification patterns to test how the Activity feed looks and feels.
          </p>

          <div className="space-y-2">
            <ScenarioButton
              emoji="🆕"
              label="New user onboarding week"
              description="Gentle, varied activity over days"
              onClick={() => newUserOnboardingWeek.mutate(targetUserId)}
              loading={newUserOnboardingWeek.isPending}
            />

            <ScenarioButton
              emoji="🚀"
              label="High-engagement creator day"
              description="Likes, follows, comments in 24h"
              onClick={() => highEngagementCreatorDay.mutate(targetUserId)}
              loading={highEngagementCreatorDay.isPending}
            />

            <ScenarioButton
              emoji="📉"
              label="Quiet day → spike"
              description="Almost nothing, then a burst"
              onClick={() => quietDayThenSpike.mutate(targetUserId)}
              loading={quietDayThenSpike.isPending}
            />
          </div>
        </div>
      )}

      {/* Focus Presets Section */}
      {testUser && targetUserId && (
        <div className="rounded-sq-md border-2 border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <AtSign className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Focus Presets</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Stress-test specific notification channels to see how each tab behaves.
          </p>

          <div className="space-y-2">
            <ScenarioButton
              emoji="🏌️"
              label="Clubs-only day"
              description="Only golf club updates & invites"
              onClick={() => clubsOnlyDay.mutate(targetUserId)}
              loading={clubsOnlyDay.isPending}
            />

            <ScenarioButton
              emoji="💬"
              label="DM-heavy day"
              description="Back-and-forth messages"
              onClick={() => messagesHeavyDay.mutate(targetUserId)}
              loading={messagesHeavyDay.isPending}
            />

            <ScenarioButton
              emoji="@"
              label="Mentions & tags day"
              description="Lots of @you in posts & comments"
              onClick={() => mentionsAndTagsDay.mutate(targetUserId)}
              loading={mentionsAndTagsDay.isPending}
            />

            <ScenarioButton
              emoji="🏆"
              label="Achievements burst"
              description="Handicap, milestones & unlocks"
              onClick={() => achievementsBurst.mutate(targetUserId)}
              loading={achievementsBurst.isPending}
            />
          </div>
        </div>
      )}

      {/* Tour Hub Sync Test Lab */}
      {user && <TourHubSyncTestLab />}

      {/* Game Invite Test Lab */}
      {user && <GameInviteTestLab />}

      {/* Business Access Test Lab */}
      {user && <BusinessAccessTestLab />}

      {/* Action Sections */}
      {testUser && targetUserId && (
        <>
          <TestSection title="Friend Requests" icon={<Users className="h-4 w-4" />}>
            <TestButton
              label="Test User → Send request to you"
              onClick={() => sendFriendRequest.mutate(targetUserId)}
              loading={sendFriendRequest.isPending}
              icon={<UserPlus className="h-4 w-4" />}
            />
            <TestButton
              label="Accept request from Test User"
              onClick={() => acceptFriendRequest.mutate(targetUserId)}
              loading={acceptFriendRequest.isPending}
            />
            <TestButton
              label="Decline request from Test User"
              onClick={() => declineFriendRequest.mutate(targetUserId)}
              loading={declineFriendRequest.isPending}
            />
            <TestButton
              label="Cancel pending request"
              onClick={() => cancelFriendRequest.mutate(targetUserId)}
              loading={cancelFriendRequest.isPending}
            />
            <TestButton
              label="Remove friendship"
              onClick={() => removeFriendship.mutate(targetUserId)}
              loading={removeFriendship.isPending}
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
            />
          </TestSection>

          <TestSection title="Follows" icon={<UserPlus className="h-4 w-4" />}>
            <TestButton
              label="Test User follows you"
              onClick={() => followTarget.mutate(targetUserId)}
              loading={followTarget.isPending}
            />
            <TestButton
              label="You follow Test User"
              onClick={() => followTestUser.mutate(targetUserId)}
              loading={followTestUser.isPending}
            />
            <TestButton
              label="Unfollow (both directions)"
              onClick={() => unfollowBoth.mutate(targetUserId)}
              loading={unfollowBoth.isPending}
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
            />
          </TestSection>

          <TestSection title="Activity Feed Samples" icon={<Heart className="h-4 w-4" />}>
            <TestButton
              label="Simulate: Test User liked your post"
              onClick={() => mockLike.mutate(targetUserId)}
              loading={mockLike.isPending}
              icon={<Heart className="h-4 w-4" />}
            />
            <TestButton
              label="Simulate: Test User commented"
              onClick={() => mockComment.mutate(targetUserId)}
              loading={mockComment.isPending}
              icon={<MessageCircle className="h-4 w-4" />}
            />
            <TestButton
              label="Simulate: Test User mentioned you"
              onClick={() => mockMention.mutate(targetUserId)}
              loading={mockMention.isPending}
              icon={<AtSign className="h-4 w-4" />}
            />
          </TestSection>


          <TestSection title="Cleanup" icon={<Trash2 className="h-4 w-4" />}>
            <TestButton
              label="Clear all test notifications"
              onClick={() => clearNotifications.mutate(targetUserId)}
              loading={clearNotifications.isPending}
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
            />
          </TestSection>
        </>
      )}

      {/* Help text */}
      <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
        <p>
          <strong>How it works:</strong> Actions use the real friend/follow/notification pipelines.
          The Test User has <code className="bg-muted px-1 rounded">is_test = true</code> so it won't appear in normal discovery.
        </p>
        <p>
          After triggering an action, navigate to <code className="bg-muted px-1 rounded">/notificationmessages</code> to see the results in your Activity feed.
        </p>
      </div>
    </div>
  );
}

export default AdminTestLabPage;
