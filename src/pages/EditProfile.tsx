import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, ChevronDown, ChevronUp, Flag, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { supabase } from '@/integrations/supabase/client';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp } from '@/lib/formatHcp';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { Button } from '@/components/ui/button';
import { SectionEyebrow } from '@/components/ui/SectionEyebrow';
import { SectionCard } from '@/components/profile/edit-v2/SectionCard';
import { SegToggle } from '@/components/profile/edit-v2/SegToggle';
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { ProfilePhotoCard } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { HomeClubCard } from '@/components/profile/edit-v2/HomeClubCard';
import { AdditionalClubsList } from '@/components/profile/edit-v2/AdditionalClubsList';

import { HandicapInput } from '@/components/profile/edit-v2/HandicapInput';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { LocationSection } from '@/components/profile/edit-v2/LocationSection';
import { PrivacySection } from '@/components/profile/edit-v2/PrivacySection';
import { SocialLinksSection } from '@/components/profile/edit-v2/SocialLinksSection';
import { DISPLAY_NAME_MAX, USERNAME_MAX } from '@/components/profile/profile-wizard/types';
import HandicapConnectSheet from '@/components/profile/handicap/HandicapConnectSheet';
import { HandicapVisibilityControl, type HandicapVisibility } from '@/components/profile/edit-v2/HandicapVisibilityControl';

const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_55 = '#64748B';
const AMBER = '#F7931E';
const GREEN = '#059669';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { profile, loading } = useProfileData();
  const [searchParams] = useSearchParams();

  // Light-shield for the notch / status bar on this page.
  // Must opt-in explicitly or the previous page's dark shield bleeds through
  // on a cold OAuth land. Render dark icons on the #F8FAFC surface.
  useMedianStatusBar('light', '#F8FAFC');

  const {
    form, setField, isDirty, errors, isValid,
    addWebsite, removeWebsite, updateWebsite,
    addClub, removeClub,
  } = useProfileForm(profile, loading);

  const { save, isSaving } = useProfileSave(user?.id ?? '');

  const usernameIsLocked = !!(profile as any)?.has_completed_onboarding;
  // Treat as new user when EITHER the profile says onboarding is incomplete OR
  // we arrived from the AuthWrapper onboarding redirect (?onboarding=1). The
  // URL flag means the header / nav decisions don't have to wait for the
  // profile fetch — fixes the "blank header on cold OAuth land" race.
  const isNewUser = useRef(
    searchParams.get('onboarding') === '1' ||
    !(profile as any)?.has_completed_onboarding
  );
  // Keep ref in sync once profile resolves (covers the first paint where
  // profile is still null).
  useEffect(() => {
    if (loading) return;
    isNewUser.current =
      searchParams.get('onboarding') === '1' ||
      !(profile as any)?.has_completed_onboarding;
  }, [loading, profile, searchParams]);

  const [isSkipping, setIsSkipping] = useState(false);

  const skipOnboarding = async () => {
    if (!user?.id || isSkipping) return;
    setIsSkipping(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ has_completed_onboarding: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      // Prime the cache so AuthWrapper doesn't immediately re-redirect us back.
      queryClient.setQueryData(['onboarding-status', user.id], {
        hasCompletedOnboarding: true,
        userType: (profile as any)?.user_type ?? null,
      });
      await queryClient.invalidateQueries({ queryKey: ['onboarding-status', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not skip onboarding. Please try again.');
    } finally {
      setIsSkipping(false);
    }
  };

  const { data: whsConnection } = useWhsConnection(user?.id);
  const hasWhsConnection = !!whsConnection;
  const resolved = resolveDisplayHandicap({
    egHandicapIndex: (profile as any)?.eg_handicap_index ?? null,
    manualHandicapIndex: (profile as any)?.manual_handicap_index ?? null,
    hasWhsConnection,
  });

  const [showSocial, setShowSocial] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [connectSheetOpen, setConnectSheetOpen] = useState(false);

  // ── Onboarding-only state: username availability + display-name auto-fill ──
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'invalid' | 'checking' | 'available' | 'taken'
  >('idle');
  const [hasTouchedDisplayName, setHasTouchedDisplayName] = useState(false);
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout>>();

  const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

  // Debounced availability check while onboarding
  useEffect(() => {
    if (!isNewUser.current) return;
    clearTimeout(usernameCheckRef.current);
    const candidate = form.username.trim().toLowerCase();
    if (!candidate) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_RE.test(candidate)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    usernameCheckRef.current = setTimeout(async () => {
      try {
        const { count, error } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .ilike('username', candidate.replace(/[\\%_]/g, '\\$&'))
          .neq('id', user?.id ?? '');
        if (error) {
          setUsernameStatus('idle');
          return;
        }
        setUsernameStatus((count ?? 0) > 0 ? 'taken' : 'available');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
    return () => clearTimeout(usernameCheckRef.current);
  }, [form.username, user?.id]);

  // Auto-fill display name from First + Last while user hasn't touched it
  useEffect(() => {
    if (!isNewUser.current || hasTouchedDisplayName) return;
    const combined = `${form.firstName} ${form.lastName}`.trim();
    if (combined !== form.displayName) {
      setField('displayName', combined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.firstName, form.lastName, hasTouchedDisplayName]);

  const golfRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);
  const photosRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (loading) return;
    const section = searchParams.get('section');
    const target =
      section === 'golf' ? golfRef.current :
      section === 'about' ? aboutRef.current :
      section === 'photos' ? photosRef.current :
      null;
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [loading, searchParams]);

  // For onboarding (cold OAuth land), NEVER block on the skeleton. The
  // header / chrome must paint immediately so the user has Skip + Save
  // affordances on first paint. The form sections happily render with empty
  // defaults until the profile fetch resolves and `useProfileForm` hydrates.
  // For returning users (deep-link refresh of /edit-profile), keep the
  // skeleton as-is to avoid a flash of empty fields.
  if (loading && !isNewUser.current) return <ProfileSkeleton />;

  const handleSave = async () => {
    // Onboarding is OPTIONAL — no required fields. We only enforce FORMAT
    // checks on values the user actually entered (username charset, length).
    if (isNewUser.current && form.username.trim()) {
      const candidate = form.username.trim().toLowerCase();
      if (!USERNAME_RE.test(candidate)) {
        toast.error('Username must be 3–20 lowercase letters, numbers, _ or .');
        return;
      }
      if (usernameStatus === 'checking') {
        toast.error('Checking username availability — please wait.');
        return;
      }
      if (usernameStatus === 'taken') {
        toast.error('That username is taken — please choose another.');
        return;
      }
    }
    const result = await save(form, { isOnboarding: isNewUser.current });
    if (result === 'username_taken') {
      setUsernameStatus('taken');
      toast.error('That username was just taken — please choose another.');
      return;
    }
    if (result) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user?.id) {
        queryClient.setQueryData(['onboarding-status', user.id], {
          hasCompletedOnboarding: true,
          userType: (profile as any)?.user_type ?? null,
        });
      }
      if (isNewUser.current) {
        navigate('/', { replace: true });
      } else {
        navigate(-1);
      }
    }
  };


  // For onboarding users, "Save & continue" is enabled whenever validation
  // passes — dirty is NOT required because OAuth prefills already make the
  // form complete. Existing users keep the dirty gate.
  const isDisabled = isNewUser.current
    ? (!isValid || isSaving || isSkipping)
    : (!isValid || !isDirty || isSaving);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header — Activity layout */}
      <div
        className="flex items-end px-4 pb-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
            aria-label="Back"
          >
            <ChevronLeft size={20} strokeWidth={2.5} style={{ color: INK_55 }} />
          </button>
          <div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: GEIST, fontSize: 9, fontWeight: 800, color: INK_55, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Profile
              </span>
            </div>
            <h1 style={{ fontFamily: GEIST, fontSize: 34, fontWeight: 800, color: INK, letterSpacing: '-0.025em', lineHeight: 1, margin: 0 }}>
              Edit Profile
            </h1>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto pt-4"
        style={{ paddingBottom: 'calc(var(--bottom-nav-height, 88px) + var(--sab) + 24px)' }}
      >
        {/* ── Photos + Identity ───────────────────────────── */}
        <div ref={photosRef} className="space-y-4 px-4 pb-4">
          <HeaderPhotoCard
            currentUrl={form.headerPhotoUrl}
            onFileChange={(file) => {
              setField('headerPhotoBlob', file);
              if (file) setField('headerPhotoUrl', URL.createObjectURL(file));
            }}
            onRemove={() => {
              setField('headerPhotoBlob', null);
              setField('headerPhotoUrl', null);
            }}
          />

          <div className="-mt-10 ml-4 mb-2 z-10 relative">
            <ProfilePhotoCard
              currentUrl={form.profilePhotoUrl}
              onFileChange={(file) => {
                setField('profilePhotoBlob', file);
                if (file) setField('profilePhotoUrl', URL.createObjectURL(file));
              }}
            />
            {!form.profilePhotoBlob && !form.profilePhotoUrl && (
              <p className="text-[12px] text-[hsl(38,92%,50%)] mt-1.5 ml-1 inline-flex items-center gap-1.5">
                <Sparkles size={12} strokeWidth={2.25} />
                <span>Golfers with a photo get 3× more friend requests</span>
              </p>
            )}
          </div>

          <SectionCard noPadding>
            <div>
              {/* Name (first + last) — onboarding-relevant */}
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
                <div style={{ marginBottom: 8 }}>
                  <SectionEyebrow label="Name" required={isNewUser.current} />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                    placeholder="First name"
                    className="w-1/2 bg-[#F8FAFC] border border-border/60 rounded-[11px] px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
                  />
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                    placeholder="Last name"
                    className="w-1/2 bg-[#F8FAFC] border border-border/60 rounded-[11px] px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
                <div className="flex justify-between items-baseline">
                  <div style={{ marginBottom: 8 }}>
                    <SectionEyebrow label="Display Name" required={isNewUser.current} />
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">
                    {form.displayName.length}/{DISPLAY_NAME_MAX}
                  </span>
                </div>
                <input
                  type="text"
                  value={form.displayName}
                  maxLength={DISPLAY_NAME_MAX}
                  onChange={(e) => { setHasTouchedDisplayName(true); setField('displayName', e.target.value); }}
                  placeholder="Your full name"
                  className="w-full bg-[#F8FAFC] border border-border/60 rounded-[11px] px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
                />
                {errors.displayName && (
                  <p className="text-[12px] text-destructive mt-1">{errors.displayName}</p>
                )}
              </div>

              {/* Username */}
              <div className="px-4 pt-3 pb-4" style={{ borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
                <div className="flex justify-between items-baseline">
                  <div style={{ marginBottom: 8 }}>
                    <SectionEyebrow label="Username" required={isNewUser.current && !usernameIsLocked} />
                  </div>
                  {usernameIsLocked && (
                    <span className="text-[11px] text-muted-foreground/60">
                      Contact{' '}
                      <a href="mailto:support@clbhouz.co.uk" className="underline text-muted-foreground/60">
                        support@clbhouz.co.uk
                      </a>{' '}to change
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">@</span>
                  <input
                    type="text"
                    value={form.username}
                    maxLength={USERNAME_MAX}
                    readOnly={usernameIsLocked}
                    onChange={(e) => {
                      if (usernameIsLocked) return;
                      setField('username', e.target.value.toLowerCase());
                    }}
                    placeholder="choose a username"
                    className={`w-full bg-[#F8FAFC] border border-border/60 rounded-[11px] pl-8 pr-24 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors ${usernameIsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {!usernameIsLocked && isNewUser.current && form.username.trim().length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[12px]">
                      {usernameStatus === 'checking' && (
                        <span style={{ width: 12, height: 12, border: '2px solid #F7931E', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                      )}
                      {usernameStatus === 'available' && (
                        <span style={{ color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} strokeWidth={2.25} /> available
                        </span>
                      )}
                      {usernameStatus === 'taken' && (
                        <span style={{ color: '#DC2626' }}>taken</span>
                      )}
                      {usernameStatus === 'invalid' && (
                        <span style={{ color: '#DC2626' }}>invalid</span>
                      )}
                    </span>
                  )}
                </div>
                {!usernameIsLocked && isNewUser.current && (
                  <p className="text-[12px] text-muted-foreground mt-1.5">
                    3–20 characters · lowercase letters, numbers, underscores, periods
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="px-4 pt-3 pb-4">
                <div style={{ marginBottom: 8 }}>
                  <SectionEyebrow label="Gender" required={isNewUser.current} />
                </div>
                <SegToggle
                  value={form.gender}
                  onChange={(v) => setField('gender', v as any)}
                  options={GENDER_OPTIONS}
                />
              </div>
            </div>
          </SectionCard>
        </div>


        {/* ── Location ────────────────────────────────────── */}
        <div className="space-y-4 px-4 pb-4">
          <SectionCard>
            <LocationSection
              country={form.country}
              city={form.city}
              onCountryChange={(v) => setField('country', v)}
              onCityChange={(v) => setField('city', v)}
            />
          </SectionCard>
        </div>

        {/* ── Golf group ──────────────────────────────────── */}
        <div ref={golfRef} className="space-y-4 px-4 pb-4">
          <SectionCard>
            <HomeClubCard
              clubName={form.homeClubName}
              clubId={form.primaryClubId}
              visibility={form.homeClubVisibility}
              onClubSelect={(name, id) => {
                setField('homeClubName', name);
                setField('primaryClubId', id);
              }}
              onVisibilityChange={(v) => setField('homeClubVisibility', v)}
            />
            {!form.homeClubName && (
              <p style={{ fontFamily: GEIST, fontSize: 12, color: AMBER, marginTop: 6, marginLeft: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Flag size={12} strokeWidth={2.25} />
                <span>Your home club appears on your profile and leaderboards</span>
              </p>
            )}
          </SectionCard>

          <SectionCard>
            <AdditionalClubsList
              clubs={form.additionalClubs}
              visibility={form.additionalClubsVisibility}
              onAdd={addClub}
              onRemove={removeClub}
              onVisibilityChange={(v) => setField('additionalClubsVisibility', v)}
            />
          </SectionCard>

          {/* SMART HANDICAP ROW */}
          <SectionCard>
            <HandicapRow
              state={
                resolved.source === 'whs' ? 'whs'
                : resolved.source === 'manual' ? 'manual'
                : 'none'
              }
              value={resolved.value}
              form={form}
              onChange={(v) => setField('handicapIndex', v)}
              showManualEntry={showManualEntry}
              onToggleManualEntry={() => setShowManualEntry((s) => !s)}
              onOpenConnect={() => setConnectSheetOpen(true)}
              onViewFullStats={() => navigate('/handicap')}
            />
          </SectionCard>

          <SectionCard>
            <HandicapVisibilityControl
              championsVisibility={(form.championsVisibility as HandicapVisibility) || 'everyone'}
              handicapPageVisibility={(form.handicapPageVisibility as HandicapVisibility) || 'everyone'}
              onChampionsChange={(v) => setField('championsVisibility', v)}
              onHandicapPageChange={(v) => setField('handicapPageVisibility', v)}
            />
          </SectionCard>

        </div>

        {/* ── About + Privacy ─────────────────────────────── */}
        <div ref={aboutRef} className="space-y-4 px-4 pb-4">
          <SectionCard>
            <BioWebsitesSection
              bio={form.bio}
              websites={form.websites}
              bioError={errors.bio}
              websitesError={errors.websites}
              onBioChange={(v) => setField('bio', v)}
              onAddWebsite={addWebsite}
              onRemoveWebsite={removeWebsite}
              onUpdateWebsite={updateWebsite}
            />
          </SectionCard>

          <SectionCard>
            <PrivacySection
              isPublic={form.isPublic}
              onChange={(v) => setField('isPublic', v)}
            />
          </SectionCard>

          <button
            onClick={() => setShowSocial((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold text-muted-foreground/40 bg-transparent border-0 cursor-pointer"
          >
            {showSocial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showSocial ? 'Hide social links' : 'Add social links'}
          </button>

          {showSocial && (
            <SectionCard>
              <SocialLinksSection
                instagram={form.instagramHandle}
                twitter={form.twitterHandle}
                tiktok={form.tiktokHandle}
                youtube={form.youtubeHandle}
                onInstagramChange={(v) => setField('instagramHandle', v)}
                onTwitterChange={(v) => setField('twitterHandle', v)}
                onTiktokChange={(v) => setField('tiktokHandle', v)}
                onYoutubeChange={(v) => setField('youtubeHandle', v)}
              />
            </SectionCard>
          )}
        </div>

        {/* Inline Save */}
        <div className="px-4 pt-6 pb-2">
          <Button
            onClick={handleSave}
            disabled={isDisabled && !isNewUser.current}
            className="w-full min-h-[52px] rounded-[14px] text-[15px] font-bold border-0 active:opacity-90 transition-opacity"
            style={{
              background: isDisabled && !isNewUser.current ? 'rgba(15,23,42,0.06)' : AMBER,
              color: isDisabled && !isNewUser.current ? 'rgba(15,23,42,0.45)' : '#fff',
              boxShadow: isDisabled && !isNewUser.current ? 'none' : '0 4px 16px rgba(247,147,30,0.28)',
              fontFamily: GEIST,
            }}
          >
            {isSaving ? (
              <><Loader2 size={18} className="animate-spin mr-2" /> Saving…</>
            ) : isNewUser.current ? (
              'Complete Profile'
            ) : isDirty ? (
              'Save Profile'
            ) : (
              'All Saved'
            )}
          </Button>
        </div>
      </div>

      <HandicapConnectSheet
        open={connectSheetOpen}
        onClose={() => setConnectSheetOpen(false)}
        userId={user?.id}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Smart handicap row
// ─────────────────────────────────────────────────────────────────────

interface HandicapRowProps {
  state: 'whs' | 'manual' | 'none';
  value: number | null;
  form: { handicapIndex: string };
  onChange: (v: string) => void;
  showManualEntry: boolean;
  onToggleManualEntry: () => void;
  onOpenConnect: () => void;
  onViewFullStats: () => void;
}

const HELPER_COPY =
  'Connect your official WHS handicap to appear on leaderboards, feature in course Champions, and unlock your full stats dashboard.';

function HandicapRow({
  state, value, form, onChange,
  showManualEntry, onToggleManualEntry,
  onOpenConnect, onViewFullStats,
}: HandicapRowProps) {
  if (state === 'whs') {
    return (
      <div style={{ fontFamily: GEIST }}>
        <div style={{ marginBottom: 8 }}>
          <SectionEyebrow label="Official Handicap" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: INK, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {value != null ? formatHcp(value) : '—'}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(5,150,105,0.10)', color: GREEN,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
          }}>
            <CheckCircle2 size={12} strokeWidth={2.6} />
            Synced with England Golf
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onViewFullStats}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12,
              background: '#F8FAFC', border: '0.5px solid rgba(15,23,42,0.10)',
              fontSize: 14, fontWeight: 600, color: INK, fontFamily: GEIST, cursor: 'pointer',
            }}
          >
            View full stats
            <ArrowRight size={16} strokeWidth={2.4} color={INK_55} />
          </button>
          <button
            onClick={onOpenConnect}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 12,
              background: '#fff', border: '0.5px solid rgba(15,23,42,0.10)',
              fontSize: 13, fontWeight: 500, color: INK_55, fontFamily: GEIST, cursor: 'pointer',
            }}
          >
            Manage connection
            <ArrowRight size={14} strokeWidth={2.4} color={INK_55} />
          </button>
        </div>
      </div>
    );
  }

  if (state === 'manual') {
    return (
      <div style={{ fontFamily: GEIST }}>
        <HandicapInput value={form.handicapIndex} onChange={onChange} />
        <button
          onClick={onOpenConnect}
          style={{
            marginTop: 12,
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px 16px', borderRadius: 12,
            background: AMBER, color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, fontFamily: GEIST, cursor: 'pointer',
          }}
        >
          Connect official handicap
          <ArrowRight size={16} strokeWidth={2.4} />
        </button>
        <p style={{ fontSize: 12, color: INK_55, margin: '8px 4px 0', lineHeight: 1.5 }}>
          {HELPER_COPY}
        </p>
      </div>
    );
  }

  // none
  return (
    <div style={{ fontFamily: GEIST }}>
      <div style={{ marginBottom: 8 }}>
        <SectionEyebrow label="Handicap" />
      </div>
      <button
        onClick={onOpenConnect}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '14px 16px', borderRadius: 12,
          background: AMBER, color: '#fff', border: 'none',
          fontSize: 15, fontWeight: 700, fontFamily: GEIST, cursor: 'pointer',
        }}
      >
        Connect official handicap
        <ArrowRight size={18} strokeWidth={2.4} />
      </button>
      <p style={{ fontSize: 12, color: INK_55, margin: '10px 4px 14px', lineHeight: 1.5 }}>
        {HELPER_COPY}
      </p>
      <button
        onClick={onToggleManualEntry}
        style={{
          width: '100%', textAlign: 'center',
          padding: '8px 12px', borderRadius: 999,
          background: 'transparent', border: 'none',
          fontSize: 13, fontWeight: 600, color: INK_55, fontFamily: GEIST, cursor: 'pointer',
        }}
      >
        {showManualEntry ? 'Hide manual entry' : 'or enter manually'}
      </button>
      {showManualEntry && (
        <div style={{ marginTop: 8 }}>
          <HandicapInput value={form.handicapIndex} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
