import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, AtSign, Sparkles, EyeOff, ExternalLink, 
  ShieldBan, Bell, Lock, HelpCircle, MessageSquare, 
  Headphones, FileText, Shield, ScrollText, Trash2, ArrowLeft,
  Smartphone, Eye, CheckCircle2
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
import { CreatorWelcomeDialog } from '@/components/creator/CreatorWelcomeDialog';

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
  const [showCreatorWelcome, setShowCreatorWelcome] = React.useState(false);
  const [showDisableCreatorConfirm, setShowDisableCreatorConfirm] = React.useState(false);

  // Privacy visibility states
  const [isPublic, setIsPublic] = React.useState(true);
  const [showHandicap, setShowHandicap] = React.useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = React.useState(false);
  const [isUpdatingHandicap, setIsUpdatingHandicap] = React.useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showBusinessWarning, setShowBusinessWarning] = React.useState(false);
  const [ownedBusinessNames, setOwnedBusinessNames] = React.useState<string[]>([]);
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

  // Creator mode toggle attempt - show confirmation for disable
  const handleCreatorToggleAttempt = (checked: boolean) => {
    if (!checked && isCreator) {
      // Show confirmation before disabling
      setShowDisableCreatorConfirm(true);
    } else {
      handleCreatorToggle(checked);
    }
  };

  // Creator mode toggle with optimistic updates
  const handleCreatorToggle = async (checked: boolean) => {
    if (!user) return;
    
    // Store previous values for rollback
    const previousCreator = isCreator;
    const previousCreatorOnly = creatorOnly;
    const isFirstTimeEnabling = checked && !(profile as any)?.creator_enabled_at;
    
    setIsUpdatingCreator(true);
    setIsCreator(checked);

    // Optimistic cache updates for instant UI feedback
    const optimisticUpdate = (old: any) => old ? { ...old, is_creator: checked, ...((!checked && creatorOnly) ? { creator_only: false } : {}) } : old;
    queryClient.setQueryData(['profile', user.id], optimisticUpdate);
    queryClient.setQueryData(['user-profile', user.id], optimisticUpdate);
    queryClient.setQueryData(['creator-features', user.id], optimisticUpdate);

    try {
      const updates: Record<string, any> = { is_creator: checked };
      if (!checked && creatorOnly) {
        updates.creator_only = false;
        setCreatorOnly(false);
      }
      
      // If enabling for first time, set the timestamp
      if (isFirstTimeEnabling) {
        updates.creator_enabled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['creator-features', user.id] });
      
      // Show appropriate feedback
      if (checked) {
        // Check if we should show the welcome dialog
        if (isFirstTimeEnabling || !(profile as any)?.has_seen_creator_welcome) {
          setShowCreatorWelcome(true);
        } else {
          toast.success('Creator Mode enabled');
        }
      } else {
        toast.success('Creator Mode disabled');
      }
    } catch (err) {
      console.error('[Settings] creator toggle error:', err);
      
      // Rollback optimistic updates on error
      setIsCreator(previousCreator);
      setCreatorOnly(previousCreatorOnly);
      const rollbackUpdate = (old: any) => old ? { ...old, is_creator: previousCreator, creator_only: previousCreatorOnly } : old;
      queryClient.setQueryData(['profile', user.id], rollbackUpdate);
      queryClient.setQueryData(['user-profile', user.id], rollbackUpdate);
      queryClient.setQueryData(['creator-features', user.id], rollbackUpdate);
      
      toast.error('Failed to update Creator Mode');
    } finally {
      setIsUpdatingCreator(false);
    }
  };

  // Handler for welcome dialog dismissal
  const handleCreatorWelcomeDismiss = async () => {
    setShowCreatorWelcome(false);
    
    // Mark as seen in database
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ has_seen_creator_welcome: true })
        .eq('id', user.id);
      
      // Update cache
      queryClient.setQueryData(['profile', user.id], (old: any) => 
        old ? { ...old, has_seen_creator_welcome: true } : old
      );
    }
    
    toast.success('Creator Mode enabled!');
  };

  // Handler for "Go to Hub" button
  const handleGoToHub = async () => {
    setShowCreatorWelcome(false);
    
    // Mark as seen in database
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ has_seen_creator_welcome: true })
        .eq('id', user.id);
      
      queryClient.setQueryData(['profile', user.id], (old: any) => 
        old ? { ...old, has_seen_creator_welcome: true } : old
      );
    }
    
    navigate('/hub');
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
    
    const previousValue = creatorOnly;
    setIsUpdatingCreator(true);
    setCreatorOnly(enable);

    // Optimistic cache updates
    const optimisticUpdate = (old: any) => old ? { ...old, creator_only: enable } : old;
    queryClient.setQueryData(['profile', user.id], optimisticUpdate);
    queryClient.setQueryData(['user-profile', user.id], optimisticUpdate);
    queryClient.setQueryData(['creator-features', user.id], optimisticUpdate);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ creator_only: enable })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['creator-features', user.id] });
      toast.success(enable ? 'Creator-only mode enabled' : 'Personal profile restored');
    } catch (err) {
      console.error('[Settings] creator_only error:', err);
      
      // Rollback optimistic updates
      setCreatorOnly(previousValue);
      const rollbackUpdate = (old: any) => old ? { ...old, creator_only: previousValue } : old;
      queryClient.setQueryData(['profile', user.id], rollbackUpdate);
      queryClient.setQueryData(['user-profile', user.id], rollbackUpdate);
      queryClient.setQueryData(['creator-features', user.id], rollbackUpdate);
      
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

  // Pre-check for owned businesses before showing delete confirmation
  const handleDeleteAttempt = async () => {
    if (!user) return;
    try {
      // Check if user owns any businesses
      const { data: ownerships } = await supabase
        .from('business_members')
        .select('business_id, business_accounts!inner(name)')
        .eq('user_profile_id', user.id)
        .eq('role', 'owner');

      if (ownerships && ownerships.length > 0) {
        const names = ownerships.map((o: any) => o.business_accounts?.name || 'Unknown business');
        setOwnedBusinessNames(names);
        setShowBusinessWarning(true);
      } else {
        setShowDeleteConfirm(true);
      }
    } catch (err) {
      console.error('[Settings] business check error:', err);
      // Proceed to delete confirmation even if check fails
      setShowDeleteConfirm(true);
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
      <PageRoot className="min-h-screen bg-background">
        <SettingsHeader onBack={() => navigate(-1)} />
        <div className="max-w-2xl mx-auto py-6 pb-32">
          <SettingsSkeleton />
        </div>
      </PageRoot>
    );
  }

  // Error state
  if (error) {
    return (
      <PageRoot className="min-h-screen bg-background">
        <SettingsHeader onBack={() => navigate(-1)} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <span className="text-destructive text-base">Error loading settings</span>
            <button 
              onClick={() => window.location.reload()} 
              className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
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
    <PageRoot className="min-h-screen w-full bg-background">
      <SettingsHeader onBack={() => navigate(-1)} />
      
      <div className="w-full max-w-2xl mx-auto py-6 pb-32 space-y-6">
        
        {/* ========== ACCOUNT ========== */}
        <SettingsSection title="Account">
          <SettingsChevronRow
            icon={<User className="w-5 h-5" />}
            title="Profile"
            subtitle="Edit your name, bio, club and profile details."
            onClick={() => navigate('/edit-profile')}
            iconTheme="account"
            isFirst
          />
          <SettingsChevronRow
            icon={<Mail className="w-5 h-5" />}
            title="Email"
            subtitle={maskEmail(user.email)}
            onClick={() => setShowEmailSheet(true)}
            iconTheme="account"
          />
          <SettingsRow
            icon={<AtSign className="w-5 h-5" />}
            title="Username"
            subtitle="Usernames can't be changed."
            isLocked
            isLast
            iconTheme="account"
            rightContent={
              <span className="text-[13px] text-muted-foreground font-mono max-w-[45%] truncate block">
                @{profile?.username || 'not set'}
              </span>
            }
          />
        </SettingsSection>

        {/* ========== IDENTITY & CREATOR ========== */}
        {isPersonalProfile && (
          <SettingsSection title="Identity & Creator">
            <SettingsToggleRow
              icon={<Sparkles className="w-5 h-5" />}
              title="Creator Mode"
              subtitle={isCreator ? '✓ Creator features active' : 'Unlock pinned posts, featured video, and analytics.'}
              checked={isCreator}
              onCheckedChange={handleCreatorToggleAttempt}
              disabled={isUpdatingCreator}
              iconTheme="creator"
              isFirst
            />
            
            <SettingsToggleRow
              icon={<EyeOff className="w-5 h-5" />}
              title="Hide personal profile"
              subtitle="Only followers can view your full profile. Others see your creator content only."
              checked={creatorOnly}
              onCheckedChange={(checked) => {
                if (!isCreator) {
                  toast('Turn on Creator Mode to unlock this.', { duration: 2000 });
                  return;
                }
                handleCreatorOnlyToggle(checked);
              }}
              disabled={!isCreator || isUpdatingCreator}
              iconTheme="creator"
              helperNote={isCreator && creatorOnly ? "Your personal profile is hidden." : undefined}
            />
            <SettingsChevronRow
              icon={<ExternalLink className="w-5 h-5" />}
              title="View profile"
              subtitle="View your profile."
              onClick={() => {
                if (!isCreator) {
                  toast('Turn on Creator Mode to unlock this.', { duration: 2000 });
                  return;
                }
                navigate(`/profile/${user.id}`);
              }}
              disabled={!isCreator}
              iconTheme="creator"
              isLast
            />
          </SettingsSection>
        )}

        {/* ========== PRIVACY & SAFETY ========== */}
        <SettingsSection title="Privacy & Safety">
          <SettingsToggleRow
            icon={<Eye className="w-5 h-5" />}
            title="Public profile"
            subtitle="Appear in search results and recommendations. When off, only people with your link can find you."
            checked={isPublic}
            onCheckedChange={handlePublicToggle}
            disabled={isUpdatingPrivacy}
            iconTheme="privacy"
            isFirst
          />
          <SettingsToggleRow
            icon={<Eye className="w-5 h-5" />}
            title="Show my handicap publicly"
            subtitle="Display handicap on your profile and in recommendations."
            checked={showHandicap}
            onCheckedChange={handleHandicapToggle}
            disabled={isUpdatingHandicap}
            iconTheme="privacy"
          />
          <SettingsChevronRow
            icon={<ShieldBan className="w-5 h-5" />}
            title="Blocked users"
            subtitle="Manage people you've blocked."
            onClick={() => setShowBlockedSheet(true)}
            iconTheme="privacy"
            isLast
          />
        </SettingsSection>

        {/* ========== NOTIFICATIONS ========== */}
        <SettingsSection title="Notifications">
          <SettingsToggleRow
            icon={<Smartphone className="w-5 h-5" />}
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
            iconTheme="notifications"
            isFirst
            helperNote={pushState === 'denied' ? 'Permission denied. Enable in device settings.' : undefined}
          />
          <SettingsChevronRow
            icon={<Bell className="w-5 h-5" />}
            title="In-app notifications"
            subtitle="Choose what you're notified about."
            onClick={() => setShowNotificationsSheet(true)}
            isBeta
            iconTheme="notifications"
            isLast
          />
        </SettingsSection>

        {/* ========== SECURITY ========== */}
        <SettingsSection title="Security">
          {isOAuthUser ? (
            <SettingsRow
              icon={<Lock className="w-5 h-5" />}
              title="Password"
              subtitle={`Signed in with ${user?.app_metadata?.provider || 'OAuth'}. Password managed by provider.`}
              iconTheme="security"
              isFirst
              isLast
            />
          ) : (
            <SettingsChevronRow
              icon={<Lock className="w-5 h-5" />}
              title="Password"
              subtitle="Update your password."
              onClick={() => setShowPasswordSheet(true)}
              iconTheme="security"
              isFirst
              isLast
            />
          )}
        </SettingsSection>

        {/* ========== SUPPORT ========== */}
        <SettingsSection title="Support">
          <SettingsChevronRow
            icon={<HelpCircle className="w-5 h-5" />}
            title="Help centre"
            subtitle="Answers to common questions."
            onClick={() => setShowHelpSheet(true)}
            iconTheme="support"
            isFirst
          />
          <SettingsChevronRow
            icon={<MessageSquare className="w-5 h-5" />}
            title="Report a problem"
            subtitle="Tell us what's not working."
            onClick={() => setShowReportSheet(true)}
            iconTheme="support"
          />
          <SettingsChevronRow
            icon={<Headphones className="w-5 h-5" />}
            title="Contact support"
            subtitle="Get in touch with the team."
            onClick={() => setShowContactSheet(true)}
            iconTheme="support"
            isLast
          />
        </SettingsSection>

        {/* ========== LEGAL ========== */}
        <SettingsSection title="Legal">
          <SettingsChevronRow
            icon={<FileText className="w-5 h-5" />}
            title="Terms of Service"
            subtitle="Read the terms."
            onClick={() => setShowLegalSheet('terms')}
            iconTheme="legal"
            isFirst
          />
          <SettingsChevronRow
            icon={<Shield className="w-5 h-5" />}
            title="Privacy Policy"
            subtitle="How we handle your data."
            onClick={() => setShowLegalSheet('privacy')}
            iconTheme="legal"
          />
          <SettingsChevronRow
            icon={<ScrollText className="w-5 h-5" />}
            title="Community Guidelines"
            subtitle="What's allowed on Clbhouz."
            onClick={() => setShowLegalSheet('guidelines')}
            iconTheme="legal"
            isLast
          />
        </SettingsSection>

        {/* ========== DANGER ZONE ========== */}
        <SettingsSection title="Danger Zone" variant="danger">
          <SettingsChevronRow
            icon={<Trash2 className="w-5 h-5" />}
            title="Delete account"
            subtitle="Permanently remove your profile from Clbhouz."
            onClick={handleDeleteAttempt}
            iconTheme="danger"
            isFirst
            isLast
          />
        </SettingsSection>

        {/* Version info */}
        <p className="text-xs text-muted-foreground text-center py-8">
          Clbhouz v1.0.0 (Beta)
        </p>
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
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <EyeOff className="w-5 h-5" />
              Hide your personal profile?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-2">
              <span className="block">When enabled, your profile will be hidden from non-followers.</span>
              <span className="block text-muted-foreground/60 text-[12px]">You can switch back at any time.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-transparent text-foreground hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmCreatorOnly(true)}
              disabled={isUpdatingCreator}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {isUpdatingCreator ? 'Enabling...' : 'Enable creator-only'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable creator-only confirmation */}
      <AlertDialog open={showDisableCreatorOnlyConfirm} onOpenChange={setShowDisableCreatorOnlyConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Show your personal profile again?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Your profile will become visible to everyone again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-transparent text-foreground hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmCreatorOnly(false)}
              disabled={isUpdatingCreator}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {isUpdatingCreator ? 'Updating...' : 'Show personal profile'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Business ownership warning before delete */}
      <AlertDialog open={showBusinessWarning} onOpenChange={setShowBusinessWarning}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              You own a business profile
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-3">
              <p>
                You own <strong className="text-foreground">{ownedBusinessNames.join(', ')}</strong>. Deleting your account will deactivate {ownedBusinessNames.length === 1 ? 'this business' : 'these businesses'} if no other owner exists.
              </p>
              <p className="text-[12px] text-muted-foreground/60">
                Consider transferring ownership first via Manage Team.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-transparent text-foreground hover:bg-muted/80">
              Transfer ownership first
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowBusinessWarning(false);
                setShowDeleteConfirm(true);
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete account confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-3">
              <p>
                This removes your profile from Clbhouz. Some content may remain anonymised.
              </p>
              <div className="space-y-2 pt-2">
                <Label htmlFor="delete-confirm" className="text-muted-foreground">
                  Type <strong className="text-foreground">DELETE</strong> to confirm:
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="bg-muted border-border text-foreground font-mono placeholder:text-muted-foreground/50"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-muted border-transparent text-foreground hover:bg-muted/80"
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

      {/* Disable Creator Mode confirmation */}
      <AlertDialog open={showDisableCreatorConfirm} onOpenChange={setShowDisableCreatorConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Disable Creator Mode?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-2">
              <span className="block">You'll lose access to Creator Insights, pinned posts, and featured video.</span>
              <span className="block text-muted-foreground/60 text-[12px]">Your content will remain, but these features will be hidden.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-transparent text-foreground hover:bg-muted/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowDisableCreatorConfirm(false);
                handleCreatorToggle(false);
              }}
              disabled={isUpdatingCreator}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              {isUpdatingCreator ? 'Disabling...' : 'Disable Creator Mode'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Creator Welcome Dialog */}
      <CreatorWelcomeDialog
        isOpen={showCreatorWelcome}
        onClose={handleCreatorWelcomeDismiss}
        onGoToHub={handleGoToHub}
      />
    </PageRoot>
  );
}

// ========== SETTINGS HEADER (Matches Top100Hub pattern) ==========

function SettingsHeader({ onBack }: { onBack: () => void }) {
  return (
    <header 
      className="sticky top-0 z-50 bg-background"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0px)',
      }}
    >
      {/* Back button - pill style */}
      <div className="pt-4 pb-3 px-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 px-3 min-h-[44px] text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 rounded-full transition-all active:opacity-70 active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
      
      {/* Title centered below */}
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 pb-5">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          Manage your account, creator identity<br />and preferences.
        </p>
      </div>
    </header>
  );
}

export default SettingsPageV2;
