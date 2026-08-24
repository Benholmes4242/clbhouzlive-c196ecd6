import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, ChevronDown, ChevronUp, Flag, Sparkles, ArrowRight, CheckCircle2, Check } from 'lucide-react';
import { A, bizFigure } from '@/features/courses/components/holes/analytical/tokens';
import {
  FIELD_LABEL,
  FIELD_HINT,
  FIELD_INPUT_CLASS,
  FIELD_INPUT_STYLE,
  FIELD_PLACEHOLDER_CLASS,
  FIELD_COUNTER,
  FieldLabel,
  LOCKED_CLASS,
  LOCKED_STYLE,
  QuietAction,
} from '@/components/manage/fieldTreatment';

import { toast } from '@/lib/toast';
import { ManagePageSkeleton } from '@/components/skeletons/ManagePageSkeleton';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp } from '@/lib/formatHcp';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
import { ManageCard, Label, Nudge, PAGE_BG, CARD_BG, SURFACE_RAISED, HAIR, DANGER, GREEN as GREEN_TOKEN, INK as INK_TOKEN, INK_45 as INK_45_TOKEN } from '@/components/manage/ui';

/**
 * Inert-but-present fill for the DISABLED SAVE BUTTON. Same value as the field
 * canon's rest fill today, DIFFERENT MEANING: a button's disabled state must
 * not follow a field alpha change. Do not repoint this at FIELD_REST_BG.
 */
const DISABLED_BUTTON_FILL = 'rgba(255,255,255,0.06)';
import { SegToggle } from '@/components/profile/edit-v2/SegToggle';
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { CoverGuidance } from '@/components/profile/edit-v2/CoverGuidance';
import { ProfilePhotoCard, type ProfilePhotoCardHandle } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { HomeClubCard } from '@/components/profile/edit-v2/HomeClubCard';
import { AdditionalClubsList } from '@/components/profile/edit-v2/AdditionalClubsList';

import { HandicapInput } from '@/components/profile/edit-v2/HandicapInput';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { LocationSection } from '@/components/profile/edit-v2/LocationSection';
import { SocialLinksSection } from '@/components/profile/edit-v2/SocialLinksSection';
import { DISPLAY_NAME_MAX, USERNAME_MAX } from '@/components/profile/profile-wizard/types';
import type { ProfileFormData, ClubEntry, WebsiteEntry } from '@/components/profile/profile-wizard/types';
import type { NavigateOptions, To } from 'react-router-dom';

import { SettingsTabContent } from '@/components/settings/SettingsTabContent';

const SF_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = INK_TOKEN;
const INK_55 = INK_45_TOKEN;
const SLATE_BG = PAGE_BG;
const GREEN = GREEN_TOKEN;


const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

type TabId = 'profile' | 'settings';

type UserProfileRow = {
  id?: string;
  username?: string | null;
  has_completed_onboarding?: boolean | null;
  user_type?: string | null;
  eg_handicap_index?: number | null;
  manual_handicap_index?: number | null;
} | null | undefined;

export default function ManageProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { profile: profileRaw, loading, isError: profileError, refetch: refetchProfile } = useProfileData();
  const profile = profileRaw as UserProfileRow;
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    form, setField, isDirty, errors, isValid,
    addWebsite, removeWebsite, updateWebsite,
    addClub, removeClub,
  } = useProfileForm(profile, loading);

  const { save, isSaving } = useProfileSave(user?.id ?? '');

  const usernameIsLocked = !!profile?.has_completed_onboarding;
  const isNewUser = useRef(
    searchParams.get('onboarding') === '1' ||
    !profile?.has_completed_onboarding
  );
  useEffect(() => {
    if (loading) return;
    isNewUser.current =
      searchParams.get('onboarding') === '1' ||
      !profile?.has_completed_onboarding;
  }, [loading, profile, searchParams]);

  // Active tab (URL-backed). Onboarding always forces 'profile' and hides the bar.
  const initialTab: TabId = searchParams.get('tab') === 'settings' ? 'settings' : 'profile';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const onTabChange = (t: TabId) => {
    setActiveTab(t);
    const next = new URLSearchParams(searchParams);
    if (t === 'profile') next.delete('tab'); else next.set('tab', t);
    setSearchParams(next, { replace: true });
  };

  const [isSkipping, setIsSkipping] = useState(false);

  const skipOnboarding = async () => {
    analyticsEvents.track('onboarding_skip_tapped', {
      has_user: !!user?.id,
      is_skipping: isSkipping,
    });
    if (isSkipping) return; // genuine double-tap guard, no toast
    if (!user?.id) {
      analyticsEvents.track('onboarding_skip_failed', {
        reason: 'no_session',
        code: null,
        message: 'session not resolved',
      });
      toast.error('Still signing you in - please try again in a moment.');
      return;
    }
    setIsSkipping(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ has_completed_onboarding: true, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select('id')
        .single();
      if (error) {
        analyticsEvents.track('onboarding_skip_failed', {
          reason: (error as any).code === 'PGRST116' ? 'zero_rows' : 'update_error',
          code: (error as any).code ?? null,
          message: error.message ?? null,
        });
        toast.error(error.message || 'Could not skip onboarding. Please try again.');
        return;
      }
      if (!data) {
        analyticsEvents.track('onboarding_skip_failed', {
          reason: 'zero_rows',
          code: null,
          message: 'update matched no row',
        });
        toast.error('Could not skip onboarding. Please try again.');
        return;
      }
      analyticsEvents.track('onboarding_skip_succeeded', { user_id: user.id });
      navigate('/', { replace: true });
      // Fire and forget - never block navigation on a refetch.
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not skip onboarding. Please try again.';
      analyticsEvents.track('onboarding_skip_failed', {
        reason: 'exception',
        code: null,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setIsSkipping(false);
    }
  };


  const { data: whsConnection } = useWhsConnection(user?.id);
  const hasWhsConnection = !!whsConnection;
  const resolved = resolveDisplayHandicap({
    egHandicapIndex: profile?.eg_handicap_index ?? null,
    manualHandicapIndex: profile?.manual_handicap_index ?? null,
    hasWhsConnection,
  });

  const [showSocial, setShowSocial] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  // connectSheetOpen state removed in Phase 3 — handicap connect is now /manage/handicap.

  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'invalid' | 'checking' | 'available' | 'taken'
  >('idle');
  const [hasTouchedDisplayName, setHasTouchedDisplayName] = useState(false);
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout>>();

  const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

  useEffect(() => {
    if (!isNewUser.current) return;
    clearTimeout(usernameCheckRef.current);
    const candidate = form.username.trim().toLowerCase();
    if (!candidate) { setUsernameStatus('idle'); return; }
    if (!USERNAME_RE.test(candidate)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    usernameCheckRef.current = setTimeout(async () => {
      try {
        const { count, error } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .ilike('username', candidate.replace(/[\\%_]/g, '\\$&'))
          .neq('id', user?.id ?? '');
        if (error) { setUsernameStatus('idle'); return; }
        setUsernameStatus((count ?? 0) > 0 ? 'taken' : 'available');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
    return () => clearTimeout(usernameCheckRef.current);
  }, [form.username, user?.id]);

  useEffect(() => {
    if (!isNewUser.current || hasTouchedDisplayName) return;
    const combined = `${form.firstName} ${form.lastName}`.trim();
    if (combined !== form.displayName) {
      setField('displayName', combined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.firstName, form.lastName, hasTouchedDisplayName]);

  if (profileError && !isNewUser.current) {
    return (
      <PageRoot className="min-h-screen" style={{ background: PAGE_BG } as React.CSSProperties}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
          <h2 className="text-lg font-semibold" style={{ color: INK_TOKEN }}>Couldn't load your profile</h2>
          <p className="text-sm" style={{ color: INK_45_TOKEN }}>Check your connection and try again. Nothing has been changed.</p>
          <div className="flex gap-3">
            <Button onClick={() => refetchProfile()}>Retry</Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
          </div>
        </div>
      </PageRoot>
    );
  }

  if (loading && !isNewUser.current) return <ManagePageSkeleton />;

  const handleSave = async () => {
    if (isNewUser.current && form.username.trim()) {
      const candidate = form.username.trim().toLowerCase();
      if (!USERNAME_RE.test(candidate)) {
        toast.error('Username must be 3-20 lowercase letters, numbers, _ or .');
        return;
      }
      if (usernameStatus === 'checking') {
        toast.error('Checking username availability - please wait.');
        return;
      }
      if (usernameStatus === 'taken') {
        toast.error('That username is taken - please choose another.');
        return;
      }
    }
    // A connected account's handicap comes from the federation, full stop —
    // the save must not carry a manual figure for them.
    const result = await save(form, {
      isOnboarding: isNewUser.current,
      hasWhsConnection,
    });
    if (result === 'username_taken') {
      setUsernameStatus('taken');
      toast.error('That username was just taken - please choose another.');
      return;
    }
    if (result) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user?.id) {
        queryClient.setQueryData(['onboarding-status', user.id], {
          hasCompletedOnboarding: true,
          userType: profile?.user_type ?? null,
        });
      }
      if (isNewUser.current) {
        navigate('/', { replace: true });
      } else {
        navigate(-1);
      }
    }
  };

  const isDisabled = isNewUser.current
    ? (!isValid || isSaving || isSkipping)
    : (!isValid || !isDirty || isSaving);

  const showTabBar = !isNewUser.current;
  const renderProfile = isNewUser.current || activeTab === 'profile';

  return (
    <PageRoot hasBottomNav={!isNewUser.current} className="md:!max-w-[440px]" style={{ background: SLATE_BG } as React.CSSProperties}>
      <div className="min-h-screen flex flex-col w-full" style={{ background: SLATE_BG }}>

        {/* Sticky Header (Direction A) + Tab bar */}
        <div
          className="sticky top-0 z-30"
          style={{
            background: 'rgba(248,250,252,0.85)',
            backdropFilter: 'saturate(180%) blur(14px)',
            WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 pb-3"
            style={{ paddingTop: 8, minHeight: 56 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {!isNewUser.current && (
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: CARD_BG, border: `1px solid ${HAIR}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: 'pointer',
                  }}
                  aria-label="Back"
                >
                  <ChevronLeft size={18} strokeWidth={2.5} style={{ color: INK }} />
                </button>
              )}
              <h1
                style={{
                  fontFamily: SF_STACK, fontSize: 18, fontWeight: 600, color: INK,
                  letterSpacing: '-0.01em', margin: 0,
                }}
              >
                {isNewUser.current ? 'Set up your profile' : 'Manage profile'}
              </h1>
            </div>
            {isNewUser.current && (
              <button
                onClick={skipOnboarding}
                disabled={isSkipping}
                style={{
                  fontFamily: SF_STACK, fontSize: 13, fontWeight: 700, color: INK_55,
                  background: 'transparent', border: 'none',
                  cursor: isSkipping ? 'default' : 'pointer',
                  padding: '8px 4px', opacity: isSkipping ? 0.5 : 1,
                }}
                aria-label="Skip onboarding"
              >
                {isSkipping ? 'Skipping...' : 'Skip for now'}
              </button>
            )}
          </div>

          {showTabBar && (
            <>
              <div className="flex items-center gap-6 px-4" role="tablist">
                {(['profile', 'settings'] as TabId[]).map((t) => {
                  const active = activeTab === t;
                  return (
                    <button
                      key={t}
                      role="tab"
                      aria-selected={active}
                      onClick={() => onTabChange(t)}
                      style={{
                        position: 'relative',
                        padding: '12px 2px 12px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: SF_STACK,
                        fontSize: 15,
                        fontWeight: active ? 600 : 500,
                        color: active ? INK : INK_55,
                        letterSpacing: '-0.005em',
                      }}
                    >
                      {t === 'profile' ? 'Profile' : 'Settings'}
                      {active && (
                        <span
                          style={{
                            position: 'absolute', left: 0, right: 0, bottom: 6,
                            height: 2, background: INK, borderRadius: 2,
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ height: 1, width: '100%', background: HAIR }} />
            </>
          )}
          {!showTabBar && (
            <div style={{ height: 1, width: '100%', background: HAIR }} />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-4" style={{ paddingBottom: 32 }}>
          {renderProfile ? (
            <ProfileTabBody
              form={form}
              setField={setField}
              errors={errors}
              addClub={addClub}
              removeClub={removeClub}
              addWebsite={addWebsite}
              removeWebsite={removeWebsite}
              updateWebsite={updateWebsite}
              isNewUser={isNewUser.current}
              usernameIsLocked={usernameIsLocked}
              usernameStatus={usernameStatus}
              hasTouchedDisplayName={hasTouchedDisplayName}
              setHasTouchedDisplayName={setHasTouchedDisplayName}
              resolved={resolved}
              showManualEntry={showManualEntry}
              setShowManualEntry={setShowManualEntry}
              
              navigate={navigate}
              showSocial={showSocial}
              setShowSocial={setShowSocial}
              handleSave={handleSave}
              isDisabled={isDisabled}
              isSaving={isSaving}
              isDirty={isDirty}
            />
          ) : (
            <SettingsTabContent />
          )}
        </div>

      </div>
    </PageRoot>
  );
}





// -------------------------------------------------------------------------
// Profile tab body
// -------------------------------------------------------------------------



interface ProfileTabBodyProps {
  form: ProfileFormData;
  setField: <K extends keyof ProfileFormData>(k: K, v: ProfileFormData[K]) => void;
  errors: Partial<Record<keyof ProfileFormData, string>>;
  addClub: (club: Omit<ClubEntry, 'id'>) => void;
  removeClub: (id: string) => void;
  addWebsite: () => void;
  removeWebsite: (id: string) => void;
  updateWebsite: (id: string, url: string) => void;
  isNewUser: boolean;
  usernameIsLocked: boolean;
  usernameStatus: 'idle' | 'invalid' | 'checking' | 'available' | 'taken';
  hasTouchedDisplayName: boolean;
  setHasTouchedDisplayName: (v: boolean) => void;
  resolved: { source: string; value: number | null };
  showManualEntry: boolean;
  setShowManualEntry: React.Dispatch<React.SetStateAction<boolean>>;

  navigate: (to: To, opts?: NavigateOptions) => void;
  showSocial: boolean;
  setShowSocial: React.Dispatch<React.SetStateAction<boolean>>;
  handleSave: () => void;
  isDisabled: boolean;
  isSaving: boolean;
  isDirty: boolean;
}

function ProfileTabBody({
  form, setField, errors, addClub, removeClub,
  addWebsite, removeWebsite, updateWebsite,
  isNewUser, usernameIsLocked, usernameStatus,
  hasTouchedDisplayName, setHasTouchedDisplayName,
  resolved, showManualEntry, setShowManualEntry,
  navigate, showSocial, setShowSocial,
  handleSave, isDisabled, isSaving, isDirty,
}: ProfileTabBodyProps) {
  const profilePickerRef = useRef<ProfilePhotoCardHandle>(null);
  const hasAvatar = Boolean(form.profilePhotoBlob || form.profilePhotoUrl);
  const hasHeader = Boolean(form.headerPhotoBlob || form.headerPhotoUrl);

  return (
    <>
      {/* Photos card: cover band with overlapping squircle */}
      <div className="px-4 pb-4">
        <ManageCard padding={0} style={{ overflow: 'visible' }}>
          <div style={{ position: 'relative', borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: 'hidden' }}>
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
          </div>
          <div style={{ position: 'relative', padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -34 }}>
              <div style={{ flexShrink: 0 }}>
                <ProfilePhotoCard
                  ref={profilePickerRef}
                  variant="bare"
                  currentUrl={form.profilePhotoUrl}
                  onFileChange={(file) => {
                    setField('profilePhotoBlob', file);
                    if (file) setField('profilePhotoUrl', URL.createObjectURL(file));
                  }}
                  onRemove={() => {
                    setField('profilePhotoBlob', null);
                    setField('profilePhotoUrl', null);
                  }}
                />
              </div>
              <CoverGuidance />
            </div>
            <div style={{ paddingTop: 14, paddingBottom: 12 }}>

              {!hasAvatar ? (
                <Nudge icon={<Sparkles size={12} strokeWidth={2.25} />}>
                  Golfers with a photo get 3x more friend requests
                </Nudge>
              ) : null}
            </div>
          </div>
        </ManageCard>
      </div>


      {/* Identity card (hairline-divided rows) */}
      <div className="px-4 pb-4">
        <ManageCard padding={0}>
          {/* Name */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${HAIR}` }}>
            <FieldLabel>Name</FieldLabel>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                placeholder="First name"
                className={`${FIELD_INPUT_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
                style={{ ...FIELD_INPUT_STYLE, width: '50%' }}
              />
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                placeholder="Last name"
                className={`${FIELD_INPUT_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
                style={{ ...FIELD_INPUT_STYLE, width: '50%' }}
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: `1px solid ${HAIR}` }}>
            <FieldLabel
              right={
                <span style={FIELD_COUNTER}>
                  {form.displayName.length}/{DISPLAY_NAME_MAX}
                </span>
              }
            >
              Display name
            </FieldLabel>
            <input
              type="text"
              value={form.displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(e) => { setHasTouchedDisplayName(true); setField('displayName', e.target.value); }}
              placeholder="Your full name"
              className={`${FIELD_INPUT_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
              style={FIELD_INPUT_STYLE}
            />
            {errors.displayName && (
              <p className="text-[12px] text-destructive mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* Username. Locked reads as locked: the quiet inset, and its
              explanation sits in the hint slot beneath where it has room. */}
          <div className="px-4 pt-3 pb-4" style={{ borderBottom: `1px solid ${HAIR}` }}>
            <FieldLabel>Username</FieldLabel>
            {usernameIsLocked ? (
              <>
                <div className={LOCKED_CLASS} style={LOCKED_STYLE}>
                  <span>@{form.username}</span>
                </div>
                <p style={FIELD_HINT}>Contact support@clbhouz.co.uk to change</p>
              </>
            ) : (
              <>
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ fontSize: 14, color: A.DIM }}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    value={form.username}
                    maxLength={USERNAME_MAX}
                    onChange={(e) => setField('username', e.target.value.toLowerCase())}
                    placeholder="choose a username"
                    className={`${FIELD_INPUT_CLASS} ${FIELD_PLACEHOLDER_CLASS} pl-8 pr-24`}
                    style={FIELD_INPUT_STYLE}
                  />
                  {isNewUser && form.username.trim().length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[12px]">
                      {usernameStatus === 'checking' && (
                        <span style={{ width: 12, height: 12, border: `2px solid ${INK}`, borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                      )}
                      {usernameStatus === 'available' && (
                        <span style={{ color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} strokeWidth={2.25} /> available
                        </span>
                      )}
                      {usernameStatus === 'taken' && (<span style={{ color: DANGER }}>taken</span>)}
                      {usernameStatus === 'invalid' && (<span style={{ color: DANGER }}>invalid</span>)}
                    </span>
                  )}
                </div>
                {isNewUser && (
                  <p style={FIELD_HINT}>
                    3-20 characters - lowercase letters, numbers, underscores, periods
                  </p>
                )}
              </>
            )}
          </div>


          {/* Gender (INK active) */}
          <div className="px-4 pt-3 pb-4">
            <FieldLabel>Gender</FieldLabel>
            <SegToggle
              value={form.gender}
              onChange={(v) => setField('gender', v)}
              options={GENDER_OPTIONS}
            />
          </div>
        </ManageCard>
      </div>

      {/* Location */}
      <div className="px-4 pb-4">
        <ManageCard>
          <LocationSection
            country={form.country}
            city={form.city}
            onCountryChange={(v) => setField('country', v)}
            onCityChange={(v) => setField('city', v)}
          />
        </ManageCard>
      </div>

      {/* Golf */}
      <div className="space-y-4 px-4 pb-4">
        <ManageCard>
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
            <Nudge icon={<Flag size={12} strokeWidth={2.25} />}>
              Your home club appears on your profile and leaderboards
            </Nudge>
          )}
        </ManageCard>

        <ManageCard>
          <AdditionalClubsList
            clubs={form.additionalClubs}
            visibility={form.additionalClubsVisibility}
            onAdd={addClub}
            onRemove={removeClub}
            onVisibilityChange={(v) => setField('additionalClubsVisibility', v)}
          />
        </ManageCard>

        <ManageCard>
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
            onToggleManualEntry={() => setShowManualEntry((s: boolean) => !s)}
            onOpenConnect={() => navigate('/manage/handicap')}
            onViewFullStats={() => navigate('/handicap')}
          />
        </ManageCard>
      </div>

      {/* About */}
      <div className="space-y-4 px-4 pb-4">
        <ManageCard>
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
        </ManageCard>

        <button
          onClick={() => setShowSocial((v: boolean) => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold bg-transparent border-0 cursor-pointer"
          style={{ color: INK_55, fontFamily: SF_STACK }}
        >
          {showSocial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showSocial ? 'Hide social links' : 'Add social links'}
        </button>

        {showSocial && (
          <ManageCard>
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
          </ManageCard>
        )}
      </div>

      {/*
        THE SAVE CONTROL SPLITS IN TWO. A completion state is not a control:
        clean and not saving renders a line, not a dead slab. What SAVES is
        untouched - isDirty / isSaving / isDisabled / handleSave all unchanged.
      */}
      <div className="px-4 pt-6 pb-2">
        {isDirty || isSaving ? (
          <Button
            onClick={handleSave}
            disabled={isDisabled}
            className="w-full border-0 active:opacity-90 transition-opacity"
            style={{
              minHeight: 50,
              borderRadius: 999,
              fontSize: 14.5,
              fontWeight: 700,
              // Disabled must read as DISABLED BUT PRESENT: a raised inert
              // fill with a hairline, label at the 0.62 quiet floor.
              background: (isDisabled && !isSaving) ? DISABLED_BUTTON_FILL : INK,
              color: (isDisabled && !isSaving) ? INK_55 : PAGE_BG,
              border: (isDisabled && !isSaving) ? `1px solid ${HAIR}` : 'none',
              fontFamily: SF_STACK,
            }}
          >
            {isSaving ? (
              <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</>
            ) : isNewUser ? (
              'Save & continue'
            ) : (
              'Save changes'
            )}
          </Button>
        ) : (
          <div
            style={{
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              ...FIELD_LABEL,
              color: A.MUTE,
            }}
          >
            <Check size={11} strokeWidth={3} />
            All changes saved
          </div>
        )}
      </div>

    </>
  );
}

// -------------------------------------------------------------------------
// Smart handicap row (Direction A: INK primary, green only for sync status)
// -------------------------------------------------------------------------
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
      <div style={{ fontFamily: SF_STACK }}>
        <FieldLabel>Official handicap</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <span style={bizFigure(34, INK)}>
            {value != null ? formatHcp(value) : '-'}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(5,150,105,0.10)', color: GREEN,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
          }}>
            <CheckCircle2 size={12} strokeWidth={2.6} />
            {value != null ? 'Synced with England Golf' : 'Syncing with England Golf'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onViewFullStats}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10,
              background: SURFACE_RAISED, border: `1px solid ${HAIR}`,
              fontSize: 14, fontWeight: 600, color: INK, fontFamily: SF_STACK, cursor: 'pointer',
            }}
          >

            View full stats
            <ArrowRight size={16} strokeWidth={2.4} color={INK_55} />
          </button>
          <button
            onClick={onOpenConnect}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10,
              background: CARD_BG, border: `1px solid ${HAIR}`,
              fontSize: 13, fontWeight: 500, color: INK_55, fontFamily: SF_STACK, cursor: 'pointer',
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
      <div style={{ fontFamily: SF_STACK }}>
        <HandicapInput value={form.handicapIndex} onChange={onChange} />
        <p style={{ fontSize: 12, color: INK_55, margin: '12px 4px 10px', lineHeight: 1.5 }}>
          {HELPER_COPY}
        </p>
        <button
          onClick={onOpenConnect}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 46, padding: '12px 16px', borderRadius: 999,
            background: INK, color: PAGE_BG, border: 'none',
            fontSize: 14, fontWeight: 700, fontFamily: SF_STACK, cursor: 'pointer',
          }}
        >
          Connect official handicap
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: SF_STACK }}>
      <FieldLabel>Handicap</FieldLabel>
      {/* The helper reads BEFORE the button - it explains why you would tap it. */}
      <p style={{ fontSize: 12, color: INK_55, margin: '0 4px 12px', lineHeight: 1.5 }}>
        {HELPER_COPY}
      </p>
      <button
        onClick={onOpenConnect}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 46, padding: '12px 16px', borderRadius: 999,
          background: INK, color: PAGE_BG, border: 'none',
          fontSize: 14, fontWeight: 700, fontFamily: SF_STACK, cursor: 'pointer',
        }}
      >
        Connect official handicap
      </button>
      <div style={{ marginTop: 4 }}>
        <QuietAction center onClick={onToggleManualEntry}>
          {showManualEntry ? 'Hide manual entry' : 'Enter a handicap manually'}
        </QuietAction>
      </div>
      {showManualEntry && (
        <div style={{ marginTop: 12 }}>
          <HandicapInput value={form.handicapIndex} onChange={onChange} />
        </div>
      )}
    </div>
  );

}
