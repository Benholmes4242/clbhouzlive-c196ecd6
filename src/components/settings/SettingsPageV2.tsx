import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronLeft, ChevronRight, User, Mail, Bell, Shield, UserX,
  HelpCircle, MessageSquare, FileText, Trash2, LogOut, Eye, BarChart2, Link2, Briefcase,
} from 'lucide-react';
import { useHasBusinesses } from '@/hooks/useMyBusinesses';
import { useWhsConnection } from '@/lib/whs/hooks';
import HandicapConnectSheet from '@/components/profile/handicap/HandicapConnectSheet';
import { formatHcp } from '@/lib/formatHcp';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSettingsSheets } from '@/hooks/useSettingsSheets';
import { supabase } from '@/integrations/supabase/client';
import {
  SettingsSection,
  SettingsChevronRow,
  SettingsToggleRow,
  SettingsLevelRow,
  SettingsSkeleton,
} from './ui';
import type { VisibilityLevel } from '@/hooks/usePrivacySettings';
import {
  EmailChangeSheet,
  BlockedUsersSheet,
  NotificationsSheet,
  HelpCentreSheet,
  ContactSupportSheet,
  LegalSheet,
} from './sheets';
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
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
const APP_VERSION = '1.0.0';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export function SettingsPageV2() {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { profile, loading } = useProfileData();
  const { hasBusinesses, count } = useHasBusinesses(user?.id);

  // Sync email RPC on mount
  useEffect(() => {
    if (user?.id && user?.email) {
      supabase.rpc('sync_user_email', { user_id_param: user.id, current_email: user.email }).then(() => {});
    }
  }, [user?.id, user?.email]);

  const isOAuthUser = !user?.app_metadata?.providers?.includes('email');

  const privacy = usePrivacySettings(
    user?.id,
    !!(profile as any)?.is_public,
    ((profile as any)?.handicap_visibility ?? 'public') as VisibilityLevel,
    ((profile as any)?.leaderboard_visibility ?? 'public') as VisibilityLevel,
  );

  const deleteAccount = useDeleteAccount(user?.id);
  const { sheets, open, close } = useSettingsSheets();
  const { data: whsConnection } = useWhsConnection(user?.id);
  const [whsSheetOpen, setWhsSheetOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (sessionLoading || loading || !profile) return <SettingsSkeleton />;

  const p = profile as any;
  const handicapSuffix = p?.eg_handicap_index != null
    ? ` · ${formatHcp(p.eg_handicap_index)} hcp`
    : '';

  const whsSubtitle = whsConnection
    ? whsConnection.last_synced_at
      ? `Connected · synced ${formatDistanceToNow(new Date(whsConnection.last_synced_at), { addSuffix: true })}`
      : 'Connected'
    : 'Not connected';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-4"
        style={{ paddingTop: 'max(var(--safe-top, env(safe-area-inset-top, 0px)), 8px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          aria-label="Back"
        >
          <ChevronLeft size={20} strokeWidth={2.5} style={{ color: '#64748B' }} />
        </button>
        <div>
          <div style={{ marginBottom: 2 }}>
            <SectionEyebrow label="Profile" />
          </div>
          <h1 style={{ fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: 34, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1, margin: 0 }}>
            Settings
          </h1>
        </div>
      </div>

      {/* Profile hero card */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate(`/profile/${p?.username}`)}
          className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left active:opacity-70"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)', WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
        >
          <SquircleAvatar
            src={p?.profile_photo_url}
            alt={p?.display_name || ''}
            size={52}
            fallback={p?.display_name?.charAt(0) || '?'}
            hideRing
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

      <div className="px-4 pb-32 space-y-6">

        {/* Account */}
        <SettingsSection title="Account">
          <SettingsChevronRow
            icon={<User size={18} />}
            title="Edit Profile"
            iconTheme="account"
            onClick={() => navigate('/edit-profile')}
          />
          <SettingsChevronRow
            icon={<Mail size={18} />}
            title="Email"
            value={user?.email ? maskEmail(user.email) : undefined}
            iconTheme="account"
            onClick={() => open('email')}
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
            subtitle="Controls whether you appear in ranked and competitive boards"
            iconTheme="privacy"
            value={privacy.leaderboardVisibility}
            disabled={privacy.isUpdatingLeaderboardVisibility}
            onChange={privacy.setLeaderboardVisibilityLevel}
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

        {/* Connections */}
        <SettingsSection title="Connections">
          <SettingsChevronRow
            icon={<Link2 size={18} />}
            title="England Golf"
            subtitle={whsSubtitle}
            iconTheme="account"
            onClick={() => setWhsSheetOpen(true)}
          />
        </SettingsSection>


        {/* Support & Legal */}
        <SettingsSection title="Support & Legal">
          <SettingsChevronRow
            icon={<HelpCircle size={18} />}
            title="Help Centre"
            iconTheme="support"
            onClick={() => open('help')}
          />
          <SettingsChevronRow
            icon={<MessageSquare size={18} />}
            title="Contact Us"
            iconTheme="support"
            onClick={() => open('contact')}
          />
          <SettingsChevronRow
            icon={<FileText size={18} />}
            title="Legal & Policies"
            iconTheme="legal"
            onClick={() => open('legal')}
          />
        </SettingsSection>

        {/* Account Actions */}
        <SettingsSection title="Account Actions" variant="danger">
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

        {/* Version footer */}
        <div
          className="pt-4 text-center"
          style={{ fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, sans-serif', fontSize: 12, color: '#94A3B8', letterSpacing: '0.01em' }}
        >
          clbhouz · v{APP_VERSION}
        </div>

      </div>

      {/* Sheets */}
      <EmailChangeSheet open={sheets.email} onClose={() => close('email')} />
      
      <BlockedUsersSheet open={sheets.blocked} onClose={() => close('blocked')} userId={user?.id} />
      <NotificationsSheet open={sheets.notifications} onClose={() => close('notifications')} userId={user?.id} />
      <HelpCentreSheet open={sheets.help} onClose={() => close('help')} />
      <ContactSupportSheet open={sheets.contact} onClose={() => close('contact')} />
      <LegalSheet open={sheets.legal} onClose={() => close('legal')} />
      <HandicapConnectSheet
        open={whsSheetOpen}
        onClose={() => setWhsSheetOpen(false)}
        userId={user?.id}
      />

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
    </div>
  );
}

export default SettingsPageV2;
