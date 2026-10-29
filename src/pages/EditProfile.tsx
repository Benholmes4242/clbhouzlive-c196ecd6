/** Canonical Edit profile. Auth, back and
 * the ?tab= param behave as ManageProfile's do; photos save one field at once
 * through useProfileSave's opt-in photoField partial. EP2 adds the You group,
 * whose sheets save their own columns through the profileFields partial.
 * EP3 golf patches share that saved/retry line without touching visibility. */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp, parseHcpFormString } from '@/lib/formatHcp';
import { DANGER } from '@/components/manage/ui';
import { ManagePageSkeleton } from '@/components/skeletons/ManagePageSkeleton';
import { SettingsTabContent } from '@/components/settings/SettingsTabContent';
import { EditProfileCard, type PhotoKind, type PhotoActions } from '@/features/edit-profile/EditProfileCard';
import { EditProfileYou, type YouFields, type YouPatch, type YouActions } from '@/features/edit-profile/EditProfileYou';
import { EditProfileGolf, type GolfFields, type GolfPatch, type GolfActions } from '@/features/edit-profile/EditProfileGolf';
import { EditProfileLinksPrivacy, type LinksPrivacyFields, type LinksPrivacyPatch } from '@/features/edit-profile/EditProfileLinksPrivacy';
import { EditProfileCompletion } from '@/features/edit-profile/EditProfileCompletion';
import { arrivalAction, type CompletionAction } from '@/features/edit-profile/completionRules';
import '@/features/business-create/business-create.css';
import '@/features/edit-profile/edit-profile.css';

type TabId = 'profile' | 'settings';
type SaveState = 'idle' | 'saving' | 'error';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { profile: raw, loading } = useProfileData();
  const profile = raw as Record<string, any> | null | undefined;
  const { form } = useProfileForm(profile as any, loading);
  const { save } = useProfileSave(user?.id ?? '');
  const { data: whs, isLoading: whsLoading, isError: whsError } = useWhsConnection(user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>(searchParams.get('tab') === 'settings' ? 'settings' : 'profile');
  const [state, setState] = useState<SaveState>('idle');
  const running = useRef(0);
  const lastFailed = useRef<(() => void) | null>(null);

  const photos = useRef<PhotoActions>(null);
  const youActions = useRef<YouActions>(null);
  const golfActions = useRef<GolfActions>(null);
  const consumedArrival = useRef(false);
  useEffect(() => {
    if (loading || !profile || consumedArrival.current || tab !== 'profile') return;
    consumedArrival.current = true;
    const action = arrivalAction(searchParams.get('src'));
    if (action === 'username') youActions.current?.open(action);
    if (action === 'homeClub') golfActions.current?.open(action);
  }, [loading, profile, searchParams, tab]);
  const openCompletion = (action: CompletionAction) => {
    if (action === 'avatar' || action === 'cover') photos.current?.open(action);
    else if (action === 'bio') youActions.current?.open(action);
    else golfActions.current?.open(action);
  };

  const onTab = (t: TabId) => {
    setTab(t);
    const next = new URLSearchParams(searchParams);
    if (t === 'profile') next.delete('tab'); else next.set('tab', t);
    setSearchParams(next, { replace: true });
  };

  const [usernameNow, setUsernameNow] = useState<{ username: string; at: string } | null>(null);
  const [youNow, setYouNow] = useState<YouPatch>({});
  const [golfNow, setGolfNow] = useState<GolfPatch>({});
  const [linksPrivacyNow, setLinksPrivacyNow] = useState<LinksPrivacyPatch>({});

  const runSave = (next: typeof form, opts: Parameters<typeof save>[1], onOk?: () => void) => {
    const run = async (): Promise<boolean> => {
      running.current += 1; setState('saving');
      let ok = false;
      try { ok = (await save(next, opts)) === true; } catch { ok = false; }
      running.current -= 1;
      if (!ok) { lastFailed.current = () => { void run(); }; setState('error'); return false; }
      lastFailed.current = null;
      onOk?.();
      if (running.current === 0) setState('idle');
      return true;
    };
    return run();
  };

  const savePhoto = (kind: PhotoKind, file: File | null) => {
    const next = kind === 'avatar'
      ? { ...form, profilePhotoBlob: file, profilePhotoUrl: file ? form.profilePhotoUrl : null }
      : { ...form, headerPhotoBlob: file, headerPhotoUrl: file ? form.headerPhotoUrl : null };
    void runSave(next, { photoField: kind === 'avatar' ? 'profile' : 'header' });
  };

  const saveYou = (fields: YouFields, patch: YouPatch) =>
    runSave({ ...form, ...youNow, ...patch } as typeof form, { profileFields: fields }, () => setYouNow(v => ({ ...v, ...patch })));
  const saveGolf = (fields: GolfFields, patch: GolfPatch) =>
    runSave({ ...form, ...golfNow, ...patch }, { profileFields: fields, hasWhsConnection: !!whs }, () => setGolfNow(v => ({ ...v, ...patch })));
  const saveLinksPrivacy = (fields: LinksPrivacyFields, patch: LinksPrivacyPatch) =>
    runSave({ ...form, ...linksPrivacyNow, ...patch }, { profileFields: fields }, () => setLinksPrivacyNow(v => ({ ...v, ...patch })));

  if (loading && !profile) return <ManagePageSkeleton />;

  const resolved = resolveDisplayHandicap({
    egHandicapIndex: profile?.eg_handicap_index ?? null,
    manualHandicapIndex: golfNow.handicapIndex !== undefined ? parseHcpFormString(golfNow.handicapIndex) : profile?.manual_handicap_index ?? null,
    hasWhsConnection: !!whs,
  });
  const you = {
    firstName: youNow.firstName ?? profile?.first_name ?? '',
    lastName: youNow.lastName ?? profile?.last_name ?? '',
    displayName: youNow.displayName ?? profile?.display_name ?? '',
    bio: youNow.bio ?? profile?.bio ?? '',
    city: youNow.city ?? profile?.city ?? '',
    country: youNow.country ?? profile?.country ?? '',
    gender: youNow.gender ?? profile?.gender ?? '',
  };
  const name = you.displayName || `${you.firstName} ${you.lastName}`.trim();
  const username = usernameNow?.username ?? profile?.username ?? '';

  return (
    <div className="ep-shell" data-testid="ep-page">
      <header className="ep-head">
        <button type="button" className="ep-back" aria-label="Back" onClick={() => navigate(-1)}><ChevronLeft size={20} strokeWidth={2} /></button>
        <div className="ep-title">Edit profile</div>
      </header>
      <div className="ep-tabs" role="tablist">
        {(['profile', 'settings'] as TabId[]).map(t => (
          <button key={t} type="button" role="tab" className="ep-tab" aria-selected={tab === t} onClick={() => onTab(t)}>{t === 'profile' ? 'Profile' : 'Settings'}</button>
        ))}
      </div>
      {tab === 'settings' ? <SettingsTabContent /> : (
        <main className="ep-body">
          {state === 'error'
            ? <button type="button" className="ep-saved" data-state="error" data-testid="ep-saved" style={{ color: DANGER }} onClick={() => lastFailed.current?.()}>Couldn't save. Try again.</button>
            : <div className="ep-saved" data-state={state} data-testid="ep-saved" role="status">{state === 'saving' ? 'Saving…' : 'All changes saved'}</div>}
          {profile && <EditProfileCard
            ref={photos}
            name={name}
            username={username}
            city={you.city}
            coverUrl={profile.header_photo_url ?? null}
            avatarUrl={profile.profile_photo_url ?? null}
            indexLabel={resolved.value != null ? formatHcp(resolved.value) : null}
            homeClub={(golfNow.homeClubName ?? profile.home_club)?.trim() || null}
            onSavePhoto={savePhoto}
          />}
          {profile && <EditProfileCompletion userId={user?.id ?? ''} inputs={{ avatar: profile.profile_photo_url, cover: profile.header_photo_url, bio: you.bio, homeClub: !!(golfNow.primaryClubId ?? profile.primary_club_id) || !!(golfNow.homeClubName ?? profile.home_club)?.trim(), handicap: resolved.value }} loading={loading || !!whsLoading || !!whsError} onAction={openCompletion} />}
          {profile && <EditProfileYou
            ref={youActions}
            userId={user?.id ?? ''}
            {...you}
            displayName={name}
            username={username}
            usernameChangedAt={usernameNow?.at ?? profile.username_changed_at ?? null}
            onSave={saveYou}
            onUsernameChanged={(u, at) => setUsernameNow({ username: u, at })}
          />}
          {profile && <EditProfileGolf ref={golfActions} userId={user?.id ?? ''} form={{ ...form, ...golfNow }} egHandicapIndex={profile.eg_handicap_index ?? null} manualHandicapIndex={golfNow.handicapIndex !== undefined ? parseHcpFormString(golfNow.handicapIndex) : profile.manual_handicap_index ?? null} connection={whs} onSave={saveGolf} />}
          {profile && <EditProfileLinksPrivacy userId={user?.id ?? ''} form={{ ...form, ...linksPrivacyNow }} handicapVisibility={profile.handicap_visibility === 'friends' || profile.handicap_visibility === 'private' ? profile.handicap_visibility : 'public'} onSave={saveLinksPrivacy} />}
        </main>
      )}
    </div>
  );
}
