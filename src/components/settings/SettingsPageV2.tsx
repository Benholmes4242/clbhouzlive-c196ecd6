import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, AtSign, Sparkles, EyeOff, ExternalLink, 
  ShieldBan, Bell, Lock, HelpCircle, MessageSquare, 
  Headphones, FileText, Shield, ScrollText, Trash2, ArrowLeft,
  Smartphone, Eye
} from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { 
  SettingsSection, 
  SettingsChevronRow, 
  SettingsToggleRow,
  SettingsSkeleton,
  SettingsRow 
} from './ui';
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
import { Label } from '@/components/ui/label';
import {
  EmailChangeSheet,
  BlockedUsersSheet,
  NotificationsSheet,
  PasswordChangeSheet,
  HelpCentreSheet,
  ReportProblemSheet,
  ContactSupportSheet,
  LegalSheet,
} from './sheets';

/**
 * SettingsPageV2 - World-class settings redesign
 * 
 * Light theme with global blue-grey background + slate text hierarchy.
 * Only functional controls are shown.
 */
export function SettingsPageV2() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { profile, loading, error, fetchProfile } = useProfileData();
  
  // Push notifications
  const { state: pushState, isRegistering: isPushRegistering, enable: enablePush, disable: disablePush } = usePushNotifications();

  // Check if user signed up with OAuth (Google, Apple, etc.)
  const isOAuthUser = React.useMemo(() => {
    if (!user) return false;
    const provider = user.app_metadata?.provider;
    return provider && provider !== 'email';
  }, [user]);

  // Creator mode state
  const [isCreator, setIsCreator] = React.useState(false);
  const [creatorOnly, setCreatorOnly] = React.useState(false);
  const [isUpdatingCreator, setIsUpdatingCreator] = React.useState(false);
  const [showCreatorOnlyConfirm, setShowCreatorOnlyConfirm] = React.useState(false);
  const [showDisableCreatorOnlyConfirm, setShowDisableCreatorOnlyConfirm] = React.useState(false);

  // Privacy visibility states
  const [isPublic, setIsPublic] = React.useState(true);
  const [showHandicap, setShowHandicap] = React.useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = React.useState(false);
  const [isUpdatingHandicap, setIsUpdatingHandicap] = React.useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Bottom sheet states
  const [showEmailSheet, setShowEmailSheet] = React.useState(false);
  const [showBlockedSheet, setShowBlockedSheet] = React.useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = React.useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = React.useState(false);
  const [showHelpSheet, setShowHelpSheet] = React.useState(false);
  const [showReportSheet, setShowReportSheet] = React.useState(false);
  const [showContactSheet, setShowContactSheet] = React.useState(false);
  const [showLegalSheet, setShowLegalSheet] = React.useState<'terms' | 'privacy' | 'guidelines' | null>(null);

  // Sync creator and privacy state from profile
  React.useEffect(() => {
    if (profile) {
      setIsCreator((profile as any)?.is_creator || false);
      setCreatorOnly((profile as any)?.creator_only || false);
      setIsPublic((profile as any)?.is_public ?? true);
      setShowHandicap((profile as any)?.show_handicap ?? true);
    }
  }, [profile]);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Helper to mask email
  const maskEmail = (email?: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const masked = local.charAt(0) + '••••••••';
    return `${masked}@${domain}`;
  };

  // Creator mode toggle
  const handleCreatorToggle = async (checked: boolean) => {
    if (!user) return;
    setIsUpdatingCreator(true);
    setIsCreator(checked);

    try {
      const updates: Record<string, any> = { is_creator: checked };
      if (!checked && creatorOnly) {
        updates.creator_only = false;
        setCreatorOnly(false);
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      toast.success(checked ? 'Creator Mode enabled' : 'Creator Mode disabled');
    } catch (err) {
      console.error('[Settings] creator toggle error:', err);
      setIsCreator(!checked);
      toast.error('Failed to update Creator Mode');
    } finally {
      setIsUpdatingCreator(false);
    }
  };

  // Creator-only toggle
  const handleCreatorOnlyToggle = (checked: boolean) => {
    if (checked) {
      setShowCreatorOnlyConfirm(true);
    } else {
      setShowDisableCreatorOnlyConfirm(true);
    }
  };

  const confirmCreatorOnly = async (enable: boolean) => {
    if (!user) return;
    setIsUpdatingCreator(true);
    setCreatorOnly(enable);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ creator_only: enable })
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      toast.success(enable ? 'Creator-only mode enabled' : 'Personal profile restored');
    } catch (err) {
      console.error('[Settings] creator_only error:', err);
      setCreatorOnly(!enable);
      toast.error('Failed to update creator-only mode');
    } finally {
      setIsUpdatingCreator(false);
      setShowCreatorOnlyConfirm(false);
      setShowDisableCreatorOnlyConfirm(false);
    }
  };

  // Public profile toggle
  const handlePublicToggle = async (checked: boolean) => {
    if (!user) return;
    setIsUpdatingPrivacy(true);
    setIsPublic(checked);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_public: checked })
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['liveClubhouseBase'] });
      toast.success(checked ? 'Profile is now public' : 'Profile is now private');
    } catch (err) {
      console.error('[Settings] public toggle error:', err);
      setIsPublic(!checked);
      toast.error('Failed to update profile visibility');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  // Handicap visibility toggle
  const handleHandicapToggle = async (checked: boolean) => {
    if (!user) return;
    setIsUpdatingHandicap(true);
    setShowHandicap(checked);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ show_handicap: checked })
        .eq('id', user.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      toast.success(checked ? 'Handicap is now visible' : 'Handicap is now hidden');
    } catch (err) {
      console.error('[Settings] handicap toggle error:', err);
      setShowHandicap(!checked);
      toast.error('Failed to update handicap visibility');
    } finally {
      setIsUpdatingHandicap(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error("Please type 'DELETE' to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast.success('Account deleted');
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (err) {
      console.error('[Settings] delete account error:', err);
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  // Loading state
  if (loading) {
    return (
      <PageRoot className="min-h-screen bg-[#F8FAFC]">
        <SettingsHeader onBack={() => navigate(-1)} />
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 pb-28">
          <SettingsSkeleton />
        </div>
      </PageRoot>
    );
  }

  // Error state
  if (error) {
    return (
      <PageRoot className="min-h-screen bg-[#F8FAFC]">
        <SettingsHeader onBack={() => navigate(-1)} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <span className="text-red-600 text-base">Error loading settings</span>
            <button 
              onClick={() => window.location.reload()} 
              className="block mx-auto text-sm text-[#5E666D] hover:text-[#1F2428]"
            >
              Try refreshing the page
            </button>
          </div>
        </div>
      </PageRoot>
    );
  }

  if (!user) return null;

  const isPersonalProfile = profile?.profile_type !== 'business';

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC] w-full max-w-full overflow-x-hidden box-border">
      <SettingsHeader onBack={() => navigate(-1)} />
      
      <div className="w-full max-w-full py-6 pb-28 space-y-3 box-border overflow-hidden">
        
        {/* ========== ACCOUNT ========== */}
        <SettingsSection title="Account">
          <SettingsChevronRow
            icon={<User className="w-[18px] h-[18px]" />}
            title="Profile"
            subtitle="Edit your name, bio, club and profile details."
            onClick={() => navigate('/edit-profile')}
            isFirst
          />
          <SettingsChevronRow
            icon={<Mail className="w-[18px] h-[18px]" />}
            title="Email"
            subtitle={maskEmail(user.email)}
            onClick={() => setShowEmailSheet(true)}
          />
          <SettingsRow
            icon={<AtSign className="w-[18px] h-[18px]" />}
            title="Username"
            subtitle="Usernames can't be changed."
            isLocked
            isLast
            rightContent={
              <span className="text-[13px] text-[#97A1AA] max-w-[45%] truncate block">
                @{profile?.username || 'not set'}
              </span>
            }
          />
        </SettingsSection>

        {/* ========== IDENTITY & CREATOR ========== */}
        {isPersonalProfile && (
          <SettingsSection title="Identity & Creator">
            <SettingsToggleRow
              icon={<Sparkles className="w-[18px] h-[18px]" />}
              title="Creator Mode"
              subtitle={isCreator ? 'Creator features enabled.' : 'Create a creator page for content and highlights.'}
              checked={isCreator}
              onCheckedChange={handleCreatorToggle}
              disabled={isUpdatingCreator}
              isFirst
            />
            
            {/* Always show these rows - disabled/gated when Creator Mode is off */}
            <SettingsToggleRow
              icon={<EyeOff className="w-[18px] h-[18px]" />}
              title="Use creator page only"
              subtitle="Hides your personal profile. People will only see your creator page."
              checked={creatorOnly}
              onCheckedChange={(checked) => {
                if (!isCreator) {
                  toast('Turn on Creator Mode to unlock this.', { duration: 2000 });
                  return;
                }
                handleCreatorOnlyToggle(checked);
              }}
              disabled={!isCreator || isUpdatingCreator}
              helperNote={isCreator && creatorOnly ? "Your personal profile is hidden." : undefined}
            />
            <SettingsChevronRow
              icon={<ExternalLink className="w-[18px] h-[18px]" />}
              title="View creator page"
              subtitle="Preview how others see you."
              onClick={() => {
                if (!isCreator) {
                  toast('Turn on Creator Mode to unlock this.', { duration: 2000 });
                  return;
                }
                navigate(`/creator/${user.id}`);
              }}
              disabled={!isCreator}
              isLast
            />
          </SettingsSection>
        )}

        {/* ========== PRIVACY & SAFETY ========== */}
        <SettingsSection title="Privacy & Safety">
          <SettingsToggleRow
            icon={<Eye className="w-[18px] h-[18px]" />}
            title="Public profile"
            subtitle="When off, you won't appear in search or recommendations."
            checked={isPublic}
            onCheckedChange={handlePublicToggle}
            disabled={isUpdatingPrivacy}
            isFirst
          />
          <SettingsToggleRow
            icon={<Eye className="w-[18px] h-[18px]" />}
            title="Show my handicap publicly"
            subtitle="Display handicap on your profile and in recommendations."
            checked={showHandicap}
            onCheckedChange={handleHandicapToggle}
            disabled={isUpdatingHandicap}
          />
          <SettingsChevronRow
            icon={<ShieldBan className="w-[18px] h-[18px]" />}
            title="Blocked users"
            subtitle="Manage people you've blocked."
            onClick={() => setShowBlockedSheet(true)}
            isLast
          />
        </SettingsSection>

        {/* ========== NOTIFICATIONS ========== */}
        <SettingsSection title="Notifications">
          {/* Push notifications toggle - show disabled state when unavailable */}
          <SettingsToggleRow
            icon={<Smartphone className="w-[18px] h-[18px]" />}
            title="Push notifications"
            subtitle={
              pushState === 'unavailable' 
                ? 'Available in the app.' 
                : pushState === 'enabled' 
                  ? 'Enabled on this device.' 
                  : 'Get alerts when something important happens.'
            }
            checked={pushState === 'enabled'}
            onCheckedChange={async (checked) => {
              if (checked) {
                await enablePush();
              } else {
                await disablePush();
              }
            }}
            disabled={isPushRegistering || pushState === 'denied' || pushState === 'unavailable'}
            isLoading={isPushRegistering}
            isFirst
            helperNote={pushState === 'denied' ? 'Permission denied. Enable in device settings.' : undefined}
          />
          <SettingsChevronRow
            icon={<Bell className="w-[18px] h-[18px]" />}
            title="In-app notifications"
            subtitle="Choose what you're notified about."
            onClick={() => setShowNotificationsSheet(true)}
            isBeta
            isLast
          />
        </SettingsSection>

        {/* ========== SECURITY ========== */}
        <SettingsSection title="Security">
          {isOAuthUser ? (
            <SettingsRow
              icon={<Lock className="w-[18px] h-[18px]" />}
              title="Password"
              subtitle={`Signed in with ${user?.app_metadata?.provider || 'OAuth'}. Password managed by provider.`}
              isFirst
              isLast
            />
          ) : (
            <SettingsChevronRow
              icon={<Lock className="w-[18px] h-[18px]" />}
              title="Password"
              subtitle="Update your password."
              onClick={() => setShowPasswordSheet(true)}
              isFirst
              isLast
            />
          )}
        </SettingsSection>

        {/* ========== SUPPORT ========== */}
        <SettingsSection title="Support">
          <SettingsChevronRow
            icon={<HelpCircle className="w-[18px] h-[18px]" />}
            title="Help centre"
            subtitle="Answers to common questions."
            onClick={() => setShowHelpSheet(true)}
            isFirst
          />
          <SettingsChevronRow
            icon={<MessageSquare className="w-[18px] h-[18px]" />}
            title="Report a problem"
            subtitle="Tell us what's not working."
            onClick={() => setShowReportSheet(true)}
          />
          <SettingsChevronRow
            icon={<Headphones className="w-[18px] h-[18px]" />}
            title="Contact support"
            subtitle="Get in touch with the team."
            onClick={() => setShowContactSheet(true)}
            isLast
          />
        </SettingsSection>

        {/* ========== LEGAL ========== */}
        <SettingsSection title="Legal">
          <SettingsChevronRow
            icon={<FileText className="w-[18px] h-[18px]" />}
            title="Terms of Service"
            subtitle="Read the terms."
            onClick={() => setShowLegalSheet('terms')}
            isFirst
          />
          <SettingsChevronRow
            icon={<Shield className="w-[18px] h-[18px]" />}
            title="Privacy Policy"
            subtitle="How we handle your data."
            onClick={() => setShowLegalSheet('privacy')}
          />
          <SettingsChevronRow
            icon={<ScrollText className="w-[18px] h-[18px]" />}
            title="Community Guidelines"
            subtitle="What's allowed on Clbhouz."
            onClick={() => setShowLegalSheet('guidelines')}
            isLast
          />
        </SettingsSection>

        {/* ========== DANGER ZONE ========== */}
        <SettingsSection title="Danger Zone">
          <SettingsChevronRow
            icon={<Trash2 className="w-[18px] h-[18px] text-red-500" />}
            title="Delete account"
            subtitle="Permanently remove your profile from Clbhouz."
            onClick={() => setShowDeleteConfirm(true)}
            isFirst
            isLast
          />
        </SettingsSection>
      </div>

      {/* ========== BOTTOM SHEETS ========== */}
      <EmailChangeSheet 
        open={showEmailSheet} 
        onOpenChange={setShowEmailSheet}
        currentEmail={user?.email || ''}
      />
      <BlockedUsersSheet 
        open={showBlockedSheet} 
        onOpenChange={setShowBlockedSheet}
        userId={user?.id || ''}
      />
      <NotificationsSheet 
        open={showNotificationsSheet} 
        onOpenChange={setShowNotificationsSheet}
        userId={user?.id || ''}
      />
      <PasswordChangeSheet 
        open={showPasswordSheet} 
        onOpenChange={setShowPasswordSheet}
      />
      <HelpCentreSheet 
        open={showHelpSheet} 
        onOpenChange={setShowHelpSheet}
      />
      <ReportProblemSheet 
        open={showReportSheet} 
        onOpenChange={setShowReportSheet}
        userId={user?.id || ''}
      />
      <ContactSupportSheet 
        open={showContactSheet} 
        onOpenChange={setShowContactSheet}
      />
      <LegalSheet 
        open={showLegalSheet !== null} 
        onOpenChange={(open) => !open && setShowLegalSheet(null)}
        type={showLegalSheet || 'terms'}
      />

      
      {/* Enable creator-only confirmation */}
      <AlertDialog open={showCreatorOnlyConfirm} onOpenChange={setShowCreatorOnlyConfirm}>
        <AlertDialogContent className="bg-white border-[rgba(31,36,40,0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1F2428] flex items-center gap-2">
              <EyeOff className="w-5 h-5" />
              Hide your personal profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#5E666D] space-y-2">
              <span className="block">When enabled, your personal profile won't be visible. Your posts and mentions will link to your creator page instead.</span>
              <span className="block text-[#97A1AA] text-[12px]">You can switch back at any time.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#EDEFF2] border-transparent text-[#1F2428] hover:bg-[#E4E6E9]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmCreatorOnly(true)}
              disabled={isUpdatingCreator}
              className="bg-[#1F2428] text-white hover:bg-[#2A3038]"
            >
              {isUpdatingCreator ? 'Enabling...' : 'Enable creator-only'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable creator-only confirmation */}
      <AlertDialog open={showDisableCreatorOnlyConfirm} onOpenChange={setShowDisableCreatorOnlyConfirm}>
        <AlertDialogContent className="bg-white border-[rgba(31,36,40,0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1F2428]">
              Show your personal profile again?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#5E666D]">
              Your personal profile will become visible again, alongside your creator page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#EDEFF2] border-transparent text-[#1F2428] hover:bg-[#E4E6E9]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmCreatorOnly(false)}
              disabled={isUpdatingCreator}
              className="bg-[#1F2428] text-white hover:bg-[#2A3038]"
            >
              {isUpdatingCreator ? 'Updating...' : 'Show personal profile'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete account confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-white border-[rgba(31,36,40,0.1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#5E666D] space-y-3">
              <p>
                This removes your profile from Clbhouz. Some content may remain anonymised.
              </p>
              <div className="space-y-2 pt-2">
                <Label htmlFor="delete-confirm" className="text-[#5E666D]">
                  Type <strong className="text-[#1F2428]">DELETE</strong> to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="bg-[#FAFAFB] border-[rgba(31,36,40,0.1)] text-[#1F2428] font-mono placeholder:text-[#97A1AA]"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-[#EDEFF2] border-transparent text-[#1F2428] hover:bg-[#E4E6E9]"
              onClick={() => setDeleteConfirmText('')}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageRoot>
  );
}

// ========== SETTINGS HEADER (Matches Top100Hub pattern) ==========

function SettingsHeader({ onBack }: { onBack: () => void }) {
  return (
    <header 
      className="sticky top-0 z-50 bg-[#F8FAFC]"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
      }}
    >
      {/* Back button - top left */}
      <div className="pt-4 pb-4 px-4">
        <button
          onClick={onBack}
          className="inline-flex items-center text-sm font-medium text-[#5E666D] hover:text-[#1F2428] transition"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </button>
      </div>
      
      {/* Title centered below */}
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 pb-4">
        <h1 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-[#1F2428]">
          Settings
        </h1>
        <p className="text-center text-sm text-[#5E666D]/70">
          Manage your account, creator identity<br />and preferences.
        </p>
      </div>
    </header>
  );
}

export default SettingsPageV2;
