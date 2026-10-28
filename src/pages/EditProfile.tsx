/** EP1 — new Edit profile (hidden /edit-profile-v2 until EP5). Auth, back and
 * the ?tab= param behave as ManageProfile's do; photos save one field at once
 * through useProfileSave's opt-in photoField partial. EP2 adds the You group,
 * whose sheets save their own columns through the profileFields partial. */
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { useWhsConnection } from '@/lib/whs/hooks';
import { resolveDisplayHandicap } from '@/lib/handicap/resolveHandicap';
import { formatHcp } from '@/lib/formatHcp';
import { DANGER } from '@/components/manage/ui';
import { ManagePageSkeleton } from '@/components/skeletons/ManagePageSkeleton';
import { SettingsTabContent } from '@/components/settings/SettingsTabContent';
import { EditProfileCard, type PhotoKind } from '@/features/edit-profile/EditProfileCard';
import { EditProfileYou, type YouFields, type YouPatch } from '@/features/edit-profile/EditProfileYou';
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
  const { data: whs } = useWhsConnection(user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>(searchParams.get('tab') === 'settings' ? 'settings' : 'profile');
  const [state, setState] = useState<SaveState>('idle');
  const running = useRef(0);
  const lastFailed = useRef<(() => void) | null>(null);

  const onTab = (t: TabId) => {
    setTab(t);
    const next = new URLSearchParams(searchParams);
    if (t === 'profile') next.delete('tab'); else next.set('tab', t);
    setSearchParams(next, { replace: true });
  };

  const [usernameNow, setUsernameNow] = useState<{ username: string; at: string } | null>(null);
  const [youNow, setYouNow] = useState<YouPatch>({});

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

  if (loading && !profile) return <ManagePageSkeleton />;

  const resolved = resolveDisplayHandicap({
    egHandicapIndex: profile?.eg_handicap_index ?? null,
    manualHandicapIndex: profile?.manual_handicap_index ?? null,
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
            name={name}
            username={username}
            city={you.city}
            coverUrl={profile.header_photo_url ?? null}
            avatarUrl={profile.profile_photo_url ?? null}
            indexLabel={resolved.value != null ? formatHcp(resolved.value) : null}
            homeClub={profile.home_club?.trim() || null}
            onSavePhoto={savePhoto}
          />}
          {profile && <EditProfileYou
            userId={user?.id ?? ''}
            {...you}
            displayName={name}
            username={username}
            usernameChangedAt={usernameNow?.at ?? profile.username_changed_at ?? null}
            onSave={saveYou}
            onUsernameChanged={(u, at) => setUsernameNow({ username: u, at })}
          />}
        </main>
      )}
    </div>
  );
}
