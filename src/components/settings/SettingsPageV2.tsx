import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Lock, Bell, Shield, EyeOff, UserX, HelpCircle, Flag, MessageSquare, FileText, Trash2, LogOut, Eye, BarChart2, Map } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCreatorSettings } from '@/hooks/useCreatorSettings';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSettingsSheets } from '@/hooks/useSettingsSheets';
import { supabase } from '@/integrations/supabase/client';
import {
  SettingsSection,
  SettingsChevronRow,
  SettingsToggleRow,
  SettingsSkeleton,
} from './ui';
import {
  EmailChangeSheet,
  PasswordChangeSheet,
  BlockedUsersSheet,
  NotificationsSheet,
  HelpCentreSheet,
  ReportProblemSheet,
  ContactSupportSheet,
  LegalSheet,
} from './sheets';
import { CreatorWelcomeDialog } from '@/components/creator/CreatorWelcomeDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export function SettingsPageV2() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { profile, loading } = useProfileData();

  // Sync email RPC on mount
  useEffect(() => {
    if (user?.id && user?.email) {
      supabase.rpc('sync_user_email', { user_id_param: user.id, current_email: user.email }).then(() => {});
    }
  }, [user?.id, user?.email]);

  const isOAuthUser = !user?.app_metadata?.providers?.includes('email');
  const isPersonalProfile = (profile as any)?.actor_type !== 'business';

  const creator = useCreatorSettings(
    user?.id,
    !!(profile as any)?.is_creator,
    !!(profile as any)?.creator_only,
  );

  const privacy = usePrivacySettings(
    user?.id,
    !!(profile as any)?.is_public,
    !!(profile as any)?.show_handicap,
    (profile as any)?.show_in_handicap_leaderboards ?? true,
    (profile as any)?.show_in_exploration_leaderboards ?? true,
  );

  const deleteAccount = useDeleteAccount(user?.id);
  const { sheets, open, close } = useSettingsSheets();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) return <SettingsSkeleton />;

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 text-foreground"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <h1 className="text-[16px] font-semibold text-foreground">Settings</h1>
      </div>

      <div className="px-4 pb-32 space-y-6">

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsChevronRow
            icon={<User size={18} />}
            title="Profile"
            iconTheme="account"
            onClick={() => navigate('/profile')}
          />
          <SettingsChevronRow
            icon={<Mail size={18} />}
            title="Email"
            value={user?.email ? maskEmail(user.email) : undefined}
            iconTheme="account"
            onClick={() => open('email')}
          />
          <SettingsChevronRow
            icon={<User size={18} />}
            title="Username"
            value={`@${(profile as any)?.username ?? ''}`}
            subtitle="Contact support to change your username"
            onClick={() => {}}
            disabled
            iconTheme="account"
          />
        </SettingsSection>

        {/* Identity & Creator — personal profiles only */}
        {isPersonalProfile && (
          <SettingsSection title="Identity & Creator">
            <SettingsToggleRow
              icon={<Shield size={18} />}
              title="Creator Mode"
              subtitle="Unlock creator tools and analytics"
              iconTheme="creator"
              checked={creator.isCreator}
              disabled={creator.isUpdating}
              onCheckedChange={(val) =>
                val ? creator.setShowEnableConfirm(true) : creator.setShowDisableConfirm(true)
              }
            />
            {creator.isCreator && (
              <SettingsToggleRow
                icon={<EyeOff size={18} />}
                title="Hide Personal Profile"
                subtitle="Only your creator profile is visible"
                iconTheme="creator"
                checked={creator.creatorOnly}
                disabled={creator.isUpdating}
                onCheckedChange={(val) =>
                  val
                    ? creator.setShowCreatorOnlyConfirm(true)
                    : creator.setShowDisableCreatorOnlyConfirm(true)
                }
              />
            )}
            <SettingsChevronRow
              icon={<Eye size={18} />}
              title="View Profile"
              iconTheme="creator"
              onClick={() => navigate(`/profile/${(profile as any)?.username}`)}
            />
          </SettingsSection>
        )}

        {/* Privacy & Safety */}
        <SettingsSection title="Privacy & Safety">
          <SettingsToggleRow
            icon={<Eye size={18} />}
            title="Public Profile"
            subtitle="Anyone can view your profile and posts"
            iconTheme="privacy"
            checked={privacy.isPublic}
            disabled={privacy.isUpdatingPrivacy}
            onCheckedChange={privacy.togglePublic}
          />
          <SettingsToggleRow
            icon={<Shield size={18} />}
            title="Show Handicap"
            subtitle="Display your handicap index on your profile"
            iconTheme="privacy"
            checked={privacy.showHandicap}
            disabled={privacy.isUpdatingHandicap}
            onCheckedChange={privacy.toggleHandicap}
          />
          <SettingsToggleRow
            icon={<BarChart2 size={18} />}
            title="Handicap Leaderboards"
            subtitle="Show in handicap and improvement rankings"
            iconTheme="privacy"
            checked={privacy.showInHandicapLeaderboards}
            disabled={privacy.isUpdatingHandicapLb}
            onCheckedChange={privacy.toggleHandicapLeaderboards}
          />
          <SettingsToggleRow
            icon={<Map size={18} />}
            title="Course Leaderboards"
            subtitle="Show in courses played and exploration rankings"
            iconTheme="privacy"
            checked={privacy.showInExplorationLeaderboards}
            disabled={privacy.isUpdatingExplorationLb}
            onCheckedChange={privacy.toggleExplorationLeaderboards}
          />
          <SettingsChevronRow
            icon={<UserX size={18} />}
            title="Blocked Users"
            iconTheme="privacy"
            onClick={() => open('blocked')}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsChevronRow
            icon={<Bell size={18} />}
            title="Notification Preferences"
            isBeta
            iconTheme="notifications"
            onClick={() => open('notifications')}
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security">
          <SettingsChevronRow
            icon={<Lock size={18} />}
            title="Change Password"
            disabled={isOAuthUser}
            iconTheme="security"
            onClick={() => !isOAuthUser && open('password')}
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="Support">
          <SettingsChevronRow
            icon={<HelpCircle size={18} />}
            title="Help Centre"
            iconTheme="support"
            onClick={() => open('help')}
          />
          <SettingsChevronRow
            icon={<Flag size={18} />}
            title="Report a Problem"
            iconTheme="support"
            onClick={() => open('report')}
          />
          <SettingsChevronRow
            icon={<MessageSquare size={18} />}
            title="Contact Support"
            iconTheme="support"
            onClick={() => open('contact')}
          />
        </SettingsSection>

        {/* Legal */}
        <SettingsSection title="Legal">
          <SettingsChevronRow
            icon={<FileText size={18} />}
            title="Terms of Service"
            value="ToS"
            iconTheme="legal"
            onClick={() => open('legal')}
          />
          <SettingsChevronRow
            icon={<FileText size={18} />}
            title="Privacy Policy"
            value="Policy"
            iconTheme="legal"
            onClick={() => open('legal')}
          />
          <SettingsChevronRow
            icon={<FileText size={18} />}
            title="Community Guidelines"
            value="Guidelines"
            iconTheme="legal"
            onClick={() => open('legal')}
          />
        </SettingsSection>

        {/* Account Actions */}
        <SettingsSection title="Account" variant="danger">
          <SettingsChevronRow
            icon={<LogOut size={18} />}
            title="Sign Out"
            onClick={handleSignOut}
            iconTheme="danger"
          />
          <SettingsChevronRow
            icon={<Trash2 size={18} />}
            title="Delete Account"
            onClick={deleteAccount.initiateDelete}
            iconTheme="danger"
          />
        </SettingsSection>

      </div>

      {/* Sheets */}
      <EmailChangeSheet open={sheets.email} onClose={() => close('email')} />
      <PasswordChangeSheet open={sheets.password} onClose={() => close('password')} />
      <BlockedUsersSheet open={sheets.blocked} onClose={() => close('blocked')} userId={user?.id} />
      <NotificationsSheet open={sheets.notifications} onClose={() => close('notifications')} userId={user?.id} />
      <HelpCentreSheet open={sheets.help} onClose={() => close('help')} />
      <ReportProblemSheet open={sheets.report} onClose={() => close('report')} userId={user?.id} />
      <ContactSupportSheet open={sheets.contact} onClose={() => close('contact')} />
      <LegalSheet open={sheets.legal} onClose={() => close('legal')} />

      {/* Creator dialogs */}
      <AlertDialog open={creator.showEnableConfirm} onOpenChange={creator.setShowEnableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Creator Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll unlock creator tools, analytics, and the ability to monetise your content on Clbhouz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => creator.toggleCreatorMode(true)}>Enable</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={creator.showDisableConfirm} onOpenChange={creator.setShowDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Creator Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              Your creator profile and analytics will be hidden. You can re-enable at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => creator.toggleCreatorMode(false)}
            >
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={creator.showCreatorOnlyConfirm} onOpenChange={creator.setShowCreatorOnlyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide Personal Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Your personal profile will be hidden. Only your creator profile will be visible to others.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => creator.toggleCreatorOnly(true)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={creator.showDisableCreatorOnlyConfirm} onOpenChange={creator.setShowDisableCreatorOnlyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Show Personal Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              Your personal profile will become visible again alongside your creator profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => creator.toggleCreatorOnly(false)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Business warning dialog */}
      <AlertDialog open={deleteAccount.showBusinessWarning} onOpenChange={deleteAccount.setShowBusinessWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Business Ownership First</AlertDialogTitle>
            <AlertDialogDescription>
              You own the following business {deleteAccount.ownedBusinessNames.length === 1 ? 'account' : 'accounts'}:{' '}
              <strong>{deleteAccount.ownedBusinessNames.join(', ')}</strong>.
              Please transfer ownership before deleting your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => deleteAccount.setShowBusinessWarning(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete account confirmation */}
      <AlertDialog open={deleteAccount.showDeleteConfirm} onOpenChange={deleteAccount.setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data, posts, and connections will be permanently removed.
              Type <strong>DELETE</strong> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Input
              placeholder="Type DELETE to confirm"
              value={deleteAccount.deleteConfirmText}
              onChange={(e) => deleteAccount.setDeleteConfirmText(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => deleteAccount.setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAccount.deleteConfirmText !== 'DELETE' || deleteAccount.isDeleting}
              onClick={deleteAccount.confirmDelete}
            >
              {deleteAccount.isDeleting ? 'Deleting…' : 'Delete My Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Creator welcome */}
      <CreatorWelcomeDialog
        isOpen={creator.showWelcome}
        onClose={() => creator.setShowWelcome(false)}
        onGoToHub={() => {
          creator.setShowWelcome(false);
          navigate('/hub');
        }}
      />
    </div>
  );
}

export default SettingsPageV2;
