import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeAgoLong } from '@/i18n/format';
import {
  ChevronRight, Mail, Bell, Shield, UserX,
  HelpCircle, MessageSquare, FileText, Trash2, LogOut, Eye, BarChart2, Link2, Briefcase, UserPlus,
} from 'lucide-react';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { useHasBusinesses } from '@/hooks/useMyBusinesses';
import { useWhsConnection } from '@/lib/whs/hooks';
import { formatHcp } from '@/lib/formatHcp';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
  SettingsSection,
  SettingsChevronRow,
  SettingsToggleRow,
  SettingsLevelRow,
  SettingsSkeleton,
} from './ui';
import type { VisibilityLevel } from '@/hooks/usePrivacySettings';
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
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import DeleteAccountConfirmSheet from '@/components/manage/overlays/DeleteAccountConfirmSheet';
import { useLogout } from '@/hooks/useLogout';


const APP_VERSION = '1.0.0';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'\u2022'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

/**
 * Settings content for the Manage Profile -> Settings tab.
 * Rows navigate to /manage/* sub-pages (Phase 3). Destructive confirms stay
 * as overlays.
 */
export function SettingsTabContent() {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { profile, loading } = useProfileData();
  const { hasBusinesses, count } = useHasBusinesses(user?.id);
  const { openInviteSheet } = useInviteSheet();

  useEffect(() => {
    if (user?.id && user?.email) {
      supabase
        .rpc('sync_user_email', { user_id_param: user.id, current_email: user.email })
        .then(({ error }) => {
          if (error) console.warn('[settings] sync_user_email skipped:', error.message);
        });
    }
  }, [user?.id, user?.email]);

  const privacy = usePrivacySettings(
    user?.id,
    !!(profile as any)?.is_public,
    ((profile as any)?.handicap_visibility ?? 'public') as VisibilityLevel,
    ((profile as any)?.leaderboard_visibility ?? 'public') as VisibilityLevel,
  );

  const deleteAccount = useDeleteAccount(user?.id);
  const { data: whsConnection } = useWhsConnection(user?.id);

  const { logout } = useLogout();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const queryClient = useQueryClient();
  const hideHandicapChip = !!(profile as any)?.hide_handicap_chip;
  const [chipUpdating, setChipUpdating] = useState(false);
  const handleToggleHandicapChip = async (nextChecked: boolean) => {
    if (!user?.id || chipUpdating) return;
    const nextHidden = !nextChecked; // toggle shows chip when ON
    setChipUpdating(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ hide_handicap_chip: nextHidden })
        .eq('id', user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    } catch (e) {
      console.error('[settings] hide_handicap_chip update failed', e);
      toast.error('Could not update. Please try again.');
    } finally {
      setChipUpdating(false);
    }
  };

  const handleConfirmSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try { (window as any).median?.onesignal?.logout?.(); } catch {}
    try {
      await logout();
    } catch {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  };


  if (sessionLoading || loading || !profile) return <SettingsSkeleton />;

  const p = profile as any;
  const resolvedHcp = resolveDisplayHandicap({
    egHandicapIndex: p?.eg_handicap_index ?? null,
    manualHandicapIndex: p?.manual_handicap_index ?? null,
    hasWhsConnection: !!whsConnection,
  });
  const handicapSuffix = resolvedHcp.value != null
    ? ` \u00B7 ${formatHcp(resolvedHcp.value)} hcp`
    : '';

  const whsSubtitle = whsConnection
    ? whsConnection.last_synced_at
      ? `Connected \u00B7 synced ${formatRelativeAgoLong(whsConnection.last_synced_at)}`
      : 'Connected'
    : 'Not connected';

  return (
    <>
      {/* Profile mini-card */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate(`/profile/${p?.username}`)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left active:opacity-70"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
        >
          <SquircleAvatar
            src={p?.profile_photo_url}
            alt={p?.display_name || ''}
            size={52}
            fallback={p?.display_name?.charAt(0) || '?'}
            hairlineRing
            ringColor={LIGHT_HAIRLINE}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-foreground truncate">
              {p?.display_name || 'Your Profile'}
            </p>
            <p className="text-[13px] text-muted-foreground truncate">
              @{p?.username}{handicapSuffix}
            </p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground/40 flex-shrink-0" />
        </button>
      </div>

      <div className="px-4 pb-0 space-y-6">
        {/* Account */}
        <SettingsSection title="Account">
          <SettingsChevronRow
            icon={<Mail size={18} />}
            title="Email"
            value={user?.email ? maskEmail(user.email) : undefined}
            iconTheme="account"
            onClick={() => navigate('/manage/email')}
          />
        </SettingsSection>

        {/* Business */}
        <SettingsSection title="Business">
          <SettingsChevronRow
            icon={<Briefcase size={18} />}
            title={hasBusinesses ? 'Manage businesses' : 'Set up a business profile'}
            value={hasBusinesses ? String(count) : undefined}
            iconTheme="account"
            onClick={() => navigate('/businesses/manage')}
          />
        </SettingsSection>

        {/* Privacy */}
        <SettingsSection title="Privacy">
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
            icon={<Eye size={18} />}
            title="Handicap button"
            subtitle="Show the Connect HCP button in your header"
            iconTheme="privacy"
            checked={!hideHandicapChip}
            disabled={chipUpdating}
            onCheckedChange={handleToggleHandicapChip}
          />
          <SettingsLevelRow
            icon={<Shield size={18} />}
            title="Who can see your handicap"
            subtitle="Controls the handicap number wherever it's shown as yours"
            iconTheme="privacy"
            value={privacy.handicapVisibility}
            disabled={privacy.isUpdatingHandicapVisibility}
            onChange={privacy.setHandicapVisibilityLevel}
          />
          <SettingsLevelRow
            icon={<BarChart2 size={18} />}
            title="Who can see you in leaderboards"
            subtitle="Controls whether you appear in ranked boards, including Course Champions and course records"
            iconTheme="privacy"
            value={privacy.leaderboardVisibility}
            disabled={privacy.isUpdatingLeaderboardVisibility}
            onChange={privacy.setLeaderboardVisibilityLevel}
          />
          <SettingsChevronRow
            icon={<UserX size={18} />}
            title="Blocked Users"
            iconTheme="privacy"
            onClick={() => navigate('/manage/blocked')}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsChevronRow
            icon={<Bell size={18} />}
            title="Notification Preferences"
            iconTheme="notifications"
            onClick={() => navigate('/manage/notifications')}
          />
        </SettingsSection>

        {/* Connections */}
        <SettingsSection title="Connections">
          <SettingsChevronRow
            icon={<Link2 size={18} />}
            title="England Golf"
            subtitle={whsSubtitle}
            iconTheme="account"
            onClick={() => navigate('/manage/handicap')}
          />
        </SettingsSection>

        {/* Friends */}
        <SettingsSection title="Friends">
          <SettingsChevronRow
            icon={<UserPlus size={18} />}
            title="Invite friends"
            subtitle={"Share your link \u2014 golf's better with your circle"}
            iconTheme="account"
            onClick={() => openInviteSheet('settings')}
          />
        </SettingsSection>

        {/* Support & Legal */}
        <SettingsSection title="Support & Legal">
          <SettingsChevronRow
            icon={<HelpCircle size={18} />}
            title="Help Centre"
            iconTheme="support"
            onClick={() => navigate('/manage/help')}
          />
          <SettingsChevronRow
            icon={<MessageSquare size={18} />}
            title="Contact Us"
            iconTheme="support"
            onClick={() => navigate('/manage/contact')}
          />
          <SettingsChevronRow
            icon={<MessageSquare size={18} />}
            title="My requests"
            iconTheme="support"
            onClick={() => navigate('/manage/requests')}
          />
          <SettingsChevronRow
            icon={<FileText size={18} />}
            title="Legal & Policies"
            iconTheme="legal"
            onClick={() => navigate('/manage/legal')}
          />
        </SettingsSection>

        {/* Account Actions */}
        <SettingsSection title="Account Actions" variant="danger">
          <SettingsChevronRow
            icon={<LogOut size={18} />}
            title="Sign Out"
            onClick={() => setSignOutOpen(true)}
            iconTheme="danger"
          />
          <SettingsChevronRow
            icon={<Trash2 size={18} />}
            title="Delete Account"
            onClick={deleteAccount.initiateDelete}
            iconTheme="danger"
          />
        </SettingsSection>

        {/* Version footer */}
        <div
          className="pt-4 text-center"
          style={{ fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, sans-serif', fontSize: 12, color: '#94A3B8', letterSpacing: '0.01em' }}
        >
          {`clbhouz \u00B7 v${APP_VERSION}`}
        </div>
      </div>

      {/* Sign out confirm */}
      <AlertDialog open={signOutOpen} onOpenChange={(o) => { if (!signingOut) setSignOutOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again with your email to get back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={signingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirmSignOut(); }}
              disabled={signingOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Business warning dialog (kept as AlertDialog: informational, not destructive confirm) */}

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

      {/* Delete-account confirm (Direction A overlay) */}
      <DeleteAccountConfirmSheet
        open={deleteAccount.showDeleteConfirm}
        onClose={() => deleteAccount.setShowDeleteConfirm(false)}
        onConfirm={deleteAccount.confirmDelete}
        confirmText={deleteAccount.deleteConfirmText}
        setConfirmText={deleteAccount.setDeleteConfirmText}
        isWorking={deleteAccount.isDeleting}
      />
    </>
  );
}

export default SettingsTabContent;
