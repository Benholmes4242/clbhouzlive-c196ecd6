import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, ChevronDown, ChevronUp, Flag, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { supabase } from '@/integrations/supabase/client';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp } from '@/lib/formatHcp';
import { Button } from '@/components/ui/button';
import { PageRoot } from '@/components/layout/PageRoot';
import { ManageCard, Label, Nudge, PAGE_BG, INK as INK_TOKEN, INK_45 as INK_45_TOKEN } from '@/components/manage/ui';
import { SegToggle } from '@/components/profile/edit-v2/SegToggle';
import { HeaderPhotoCard } from '@/components/profile/edit-v2/HeaderPhotoCard';
import { ProfilePhotoCard, type ProfilePhotoCardHandle } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { HomeClubCard } from '@/components/profile/edit-v2/HomeClubCard';
import { AdditionalClubsList } from '@/components/profile/edit-v2/AdditionalClubsList';

import { HandicapInput } from '@/components/profile/edit-v2/HandicapInput';
import { BioWebsitesSection } from '@/components/profile/edit-v2/BioWebsitesSection';
import { LocationSection } from '@/components/profile/edit-v2/LocationSection';
import { SocialLinksSection } from '@/components/profile/edit-v2/SocialLinksSection';
import { DISPLAY_NAME_MAX, USERNAME_MAX } from '@/components/profile/profile-wizard/types';

import { SettingsTabContent } from '@/components/settings/SettingsTabContent';

const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = INK_TOKEN;
const INK_55 = INK_45_TOKEN;
const SLATE_BG = PAGE_BG;
const GREEN = '#059669';


const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

type TabId = 'profile' | 'settings';

export default function ManageProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  const { profile, loading } = useProfileData();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    form, setField, isDirty, errors, isValid,
    addWebsite, removeWebsite, updateWebsite,
    addClub, removeClub,
  } = useProfileForm(profile, loading);

  const { save, isSaving } = useProfileSave(user?.id ?? '');

  const usernameIsLocked = !!(profile as any)?.has_completed_onboarding;
  const isNewUser = useRef(
    searchParams.get('onboarding') === '1' ||
    !(profile as any)?.has_completed_onboarding
  );
  useEffect(() => {
    if (loading) return;
    isNewUser.current =
      searchParams.get('onboarding') === '1' ||
      !(profile as any)?.has_completed_onboarding;
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
    if (!user?.id || isSkipping) return;
    setIsSkipping(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ has_completed_onboarding: true, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
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

  if (loading && !isNewUser.current) return <ProfileSkeleton />;

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
    const result = await save(form, { isOnboarding: isNewUser.current });
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

  const isDisabled = isNewUser.current
    ? (!isValid || isSaving || isSkipping)
    : (!isValid || !isDirty || isSaving);

  const showTabBar = !isNewUser.current;
  const renderProfile = isNewUser.current || activeTab === 'profile';

  return (
    <PageRoot hasBottomNav={!isNewUser.current} className="md:!max-w-[440px]" style={{ background: SLATE_BG } as any}>
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
                    background: '#fff', border: '1px solid rgba(15,23,42,0.10)',
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
                  fontFamily: GEIST, fontSize: 18, fontWeight: 600, color: INK,
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
                  fontFamily: GEIST, fontSize: 13, fontWeight: 700, color: INK_55,
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
                        fontFamily: GEIST,
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
              <div style={{ height: 1, width: '100%', background: 'rgba(15,23,42,0.08)' }} />
            </>
          )}
          {!showTabBar && (
            <div style={{ height: 1, width: '100%', background: 'rgba(15,23,42,0.08)' }} />
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
  form: any;
  setField: (k: any, v: any) => void;
  errors: any;
  addClub: any;
  removeClub: any;
  addWebsite: any;
  removeWebsite: any;
  updateWebsite: any;
  isNewUser: boolean;
  usernameIsLocked: boolean;
  usernameStatus: 'idle' | 'invalid' | 'checking' | 'available' | 'taken';
  hasTouchedDisplayName: boolean;
  setHasTouchedDisplayName: (v: boolean) => void;
  resolved: { source: string; value: number | null };
  showManualEntry: boolean;
  setShowManualEntry: (fn: any) => void;
  
  navigate: (to: any, opts?: any) => void;
  showSocial: boolean;
  setShowSocial: (fn: any) => void;
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
              variant="bare"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: -34 }}>
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
            <div style={{ paddingTop: 12, paddingBottom: 12 }}>
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
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <Label>Name</Label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setField('firstName', e.target.value)}
                placeholder="First name"
                className="w-1/2 bg-[#F8FAFC] border border-[rgba(15,23,42,0.08)] rounded-[10px] px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(15,23,42,0.20)] focus:bg-background transition-colors"
              />
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setField('lastName', e.target.value)}
                placeholder="Last name"
                className="w-1/2 bg-[#F8FAFC] border border-[rgba(15,23,42,0.08)] rounded-[10px] px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(15,23,42,0.20)] focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <Label right={
              <span className="text-[11px] text-muted-foreground/60">
                {form.displayName.length}/{DISPLAY_NAME_MAX}
              </span>
            }>
              Display name
            </Label>
            <input
              type="text"
              value={form.displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={(e) => { setHasTouchedDisplayName(true); setField('displayName', e.target.value); }}
              placeholder="Your full name"
              className="w-full bg-[#F8FAFC] border border-[rgba(15,23,42,0.08)] rounded-[10px] px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(15,23,42,0.20)] focus:bg-background transition-colors"
            />
            {errors.displayName && (
              <p className="text-[12px] text-destructive mt-1">{errors.displayName}</p>
            )}
          </div>

          {/* Username */}
          <div className="px-4 pt-3 pb-4" style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
            <Label right={
              usernameIsLocked ? (
                <span className="text-[11px] text-muted-foreground/60">
                  Contact{' '}
                  <a href="mailto:support@clbhouz.co.uk" className="underline text-muted-foreground/60">
                    support@clbhouz.co.uk
                  </a>{' '}to change
                </span>
              ) : undefined
            }>
              Username
            </Label>
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
                className={`w-full bg-[#F8FAFC] border border-[rgba(15,23,42,0.08)] rounded-[10px] pl-8 pr-24 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(15,23,42,0.20)] focus:bg-background transition-colors ${usernameIsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {!usernameIsLocked && isNewUser && form.username.trim().length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[12px]">
                  {usernameStatus === 'checking' && (
                    <span style={{ width: 12, height: 12, border: `2px solid ${INK}`, borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                  )}
                  {usernameStatus === 'available' && (
                    <span style={{ color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={14} strokeWidth={2.25} /> available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (<span style={{ color: '#DC2626' }}>taken</span>)}
                  {usernameStatus === 'invalid' && (<span style={{ color: '#DC2626' }}>invalid</span>)}
                </span>
              )}
            </div>
            {!usernameIsLocked && isNewUser && (
              <p className="text-[12px] text-muted-foreground mt-1.5">
                3-20 characters - lowercase letters, numbers, underscores, periods
              </p>
            )}
          </div>

          {/* Gender (INK active) */}
          <div className="px-4 pt-3 pb-4">
            <Label>Gender</Label>
            <SegToggle
              value={form.gender}
              onChange={(v) => setField('gender', v as any)}
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
          style={{ color: INK_55, fontFamily: GEIST }}
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

      {/* Save (INK primary) */}
      <div className="px-4 pt-6 pb-2">
        <Button
          onClick={handleSave}
          disabled={isDisabled}
          className="w-full min-h-[52px] rounded-[13px] text-[15px] font-bold border-0 active:opacity-90 transition-opacity"
          style={{
            background: isDisabled ? 'rgba(15,23,42,0.06)' : INK,
            color: isDisabled ? 'rgba(15,23,42,0.45)' : '#fff',
            fontFamily: GEIST,
          }}
        >
          {isSaving ? (
            <><Loader2 size={18} className="animate-spin mr-2" /> Saving...</>
          ) : isNewUser ? (
            'Save & continue'
          ) : isDirty ? (
            'Save changes'
          ) : (
            'All Saved'
          )}
        </Button>
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
      <div style={{ fontFamily: GEIST }}>
        <Label>Official handicap</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: INK, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {value != null ? formatHcp(value) : '-'}
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
              padding: '12px 14px', borderRadius: 10,
              background: '#F8FAFC', border: '1px solid rgba(15,23,42,0.08)',
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
              padding: '12px 14px', borderRadius: 10,
              background: '#fff', border: '1px solid rgba(15,23,42,0.08)',
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
            padding: '12px 16px', borderRadius: 12,
            background: INK, color: '#fff', border: 'none',
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

  return (
    <div style={{ fontFamily: GEIST }}>
      <Label>Handicap</Label>
      <button
        onClick={onOpenConnect}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 16px', borderRadius: 12,
          background: INK, color: '#fff', border: 'none',
          fontSize: 15, fontWeight: 700, fontFamily: GEIST, cursor: 'pointer',
        }}
      >
        Connect official handicap
        <ArrowRight size={18} strokeWidth={2.4} />
      </button>
      <p style={{ fontSize: 12, color: INK_55, margin: '10px 4px 14px', lineHeight: 1.5 }}>
        {HELPER_COPY}
      </p>
      <p style={{ fontSize: 13, color: INK_55, margin: '4px 4px 0', lineHeight: 1.5, textAlign: 'center' }}>
        Don't have an official WHS handicap?{' '}
        <button
          onClick={onToggleManualEntry}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            fontSize: 13, fontWeight: 600, color: INK_55, fontFamily: GEIST,
            cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          {showManualEntry ? 'Hide manual entry' : 'Enter yours manually'}
        </button>
      </p>
      {showManualEntry && (
        <div style={{ marginTop: 12 }}>
          <HandicapInput value={form.handicapIndex} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
