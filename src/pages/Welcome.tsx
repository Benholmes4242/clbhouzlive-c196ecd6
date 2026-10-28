import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useProfileData } from '@/hooks/useProfileData';
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileSave } from '@/hooks/useProfileSave';
import { useCourseSearch } from '@/hooks/useCourseSearch';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { ProfilePhotoCard, type ProfilePhotoCardHandle } from '@/components/profile/edit-v2/ProfilePhotoCard';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { WelcomeCourseCard } from '@/features/onboarding/WelcomeCourseCard';
import { WelcomeGolfers } from '@/features/onboarding/WelcomeGolfers';
import { WelcomeHandicap } from '@/features/onboarding/WelcomeHandicap';
import { WelcomeFirstLook } from '@/features/onboarding/WelcomeFirstLook';
import { canContinueIdentity, readWelcomeProgress, welcomeName, usernameSeed, usernameWithSuffix, WELCOME_USERNAME_RE, writeWelcomeProgress, type WelcomeProgress, type WelcomeStep } from '@/features/onboarding/welcomeRules';
import '@/styles/welcome.css';

/** OB1 owns first-sign-in only. Partial saves reuse useProfileSave; normal
 * ManageProfile and the canonical WHS controller retain their default behavior. */
export default function Welcome() {
  useHideBottomNav(); useHideHeader();
  const { user, loading: sessionLoading } = useSupabaseSession(); const profile = useProfileData();
  const { t } = useTranslation('auth');
  if (sessionLoading || profile.loading) return <main className="welcome-shell"><p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p></main>;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile.isError || !profile.profile) return <main className="welcome-shell"><Button onClick={() => void profile.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button></main>;
  return <WelcomeFlow key={user.id} user={user} profile={profile.profile} />;
}
function WelcomeFlow({ user, profile }: { user: NonNullable<ReturnType<typeof useSupabaseSession>['user']>; profile: NonNullable<ReturnType<typeof useProfileData>['profile']> }) {
  const { t } = useTranslation('auth'); const navigate = useNavigate(); const qc = useQueryClient();
  const [progress, setProgress] = useState<WelcomeProgress>(() => readWelcomeProgress(user.id));
  const [step, setStep] = useState<WelcomeStep>(() => Math.min(5, readWelcomeProgress(user.id).completed + 1) as WelcomeStep);
  const { form, setField } = useProfileForm({ ...profile, social_links: undefined }, false); const { save, isSaving } = useProfileSave(user.id);
  const initialName = welcomeName(profile, user.user_metadata); const [first, setFirst] = useState(initialName.first); const [last, setLast] = useState(initialName.last);
  const [editing, setEditing] = useState(false); const [username, setUsername] = useState(''); const [usernameEdited, setUsernameEdited] = useState(false);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [connectOpen, setConnectOpen] = useState(false); const [connectedNow, setConnectedNow] = useState(false);
  const photoPicker = useRef<ProfilePhotoCardHandle>(null); const base = usernameSeed(first, last); const connection = useWhsConnection(user.id);
  const [query, setQuery] = useState(''); const search = useCourseSearch(query, { includeClub: true });
  const availability = useQuery({ queryKey: ['welcome-username', user.id, usernameEdited ? username : base, usernameEdited], enabled: step === 1 && !!base, retry: false, queryFn: async () => {
    const candidateBase = usernameEdited ? username : base;
    if (!WELCOME_USERNAME_RE.test(candidateBase)) return { candidate: candidateBase, available: false };
    for (let suffix = 0; suffix < 100; suffix++) {
      const candidate = usernameWithSuffix(candidateBase, suffix);
      const { count, error } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true }).ilike('username', candidate.replace(/[\\%_]/g, '\\$&')).neq('id', user.id);
      if (error) throw error;
      if ((count ?? 0) === 0) return { candidate, available: true };
      if (usernameEdited) return { candidate, available: false };
    }
    return { candidate: candidateBase, available: false };
  } });
  const candidate = usernameEdited ? username : availability.data?.candidate ?? base;
  const persist = useCallback((next: WelcomeProgress) => { writeWelcomeProgress(user.id, next); setProgress(next); }, [user.id]);
  const complete = useCallback((current: WelcomeStep, choice: string) => { analyticsEvents.track('onboarding_step_completed', { step: current, choice }); const next = { ...progress, completed: Math.max(progress.completed, current) }; persist(next); setStep(Math.min(5, current + 1) as WelcomeStep); }, [progress, persist]);
  const noSuggestions = useCallback(() => complete(3, 'no_suggestions'), [complete]);
  const follow = useCallback((n: number) => { setProgress(prev => { const next = { ...prev, follows: Math.max(0, prev.follows + n) }; writeWelcomeProgress(user.id, next); return next; }); }, [user.id]);
  useEffect(() => { analyticsEvents.track('onboarding_step_viewed', { step }); }, [step]);
  useEffect(() => { if (step === 4 && connection.isSuccess && connection.data) complete(4, 'already_connected'); }, [step, connection.isSuccess, connection.data, complete]);
  const finish = async (skip: boolean) => {
    if (busy) return; setBusy(true); setMessage('');
    if (skip) { analyticsEvents.track('onboarding_skip_tapped', { has_user: true, is_skipping: false }); analyticsEvents.track('onboarding_skipped', { step }); }
    try {
      const { data, error } = await supabase.from('user_profiles').update({ has_completed_onboarding: true, updated_at: new Date().toISOString() }).eq('id', user.id).select('id').single();
      if (error || !data) { if (skip) analyticsEvents.track('onboarding_skip_failed', { reason: error?.code === 'PGRST116' || !data ? 'zero_rows' : 'update_error', code: error?.code ?? null, message: error?.message ?? 'update matched no row' }); throw error ?? new Error('Could not complete setup.'); }
      if (skip) analyticsEvents.track('onboarding_skip_succeeded', { user_id: user.id }); else analyticsEvents.track('onboarding_finished', { connected: !!connection.data || connectedNow, course_set: !!progress.course, follows: progress.follows });
      qc.setQueryData(['onboarding-status', user.id], { hasCompletedOnboarding: true, userType: profile.user_type });
      void qc.invalidateQueries({ queryKey: ['profile', user.id] }); navigate('/', { replace: true });
    } catch { setMessage(t('welcome.saveFailed', { defaultValue: 'Could not save. Please try again.' })); } finally { setBusy(false); }
  };
  const saveIdentity = async () => {
    if (!canContinueIdentity(first, last, candidate, availability.isSuccess && availability.data.available)) return;
    const result = await save({ ...form, firstName: first, lastName: last, displayName: `${first} ${last}`.trim(), username: candidate }, { welcomeFields: 'identity', isOnboarding: true, hasWhsConnection: !!connection.data });
    if (result === 'username_taken') { setUsername(candidate); setUsernameEdited(true); void availability.refetch(); return; }
    if (result) { setField('profilePhotoBlob', null); complete(1, 'identity_saved'); }
  };
  const saveCourse = async () => { const course = progress.course; if (!course) return; if (course.club_id) { const result = await save({ ...form, primaryClubId: course.club_id, homeClubName: course.name }, { welcomeFields: 'course', hasWhsConnection: !!connection.data }); if (!result) return; } complete(2, 'course_set'); };
  const settledConnection = connection.isSuccess || connection.isError;
  return <main className="welcome-shell" data-welcome-step={step}><header className="welcome-top"><div className="welcome-progress" aria-label={t('welcome.progress', { step, defaultValue: `Step ${step} of 5` })}>{[1, 2, 3, 4, 5].map(n => <i key={n} data-complete={n <= step} />)}</div>{step !== 5 && <Button variant="ghost" className="welcome-skip" disabled={busy || isSaving} onClick={() => void finish(true)}>{t('welcome.skip', { defaultValue: 'Skip' })}</Button>}</header><div className="welcome-body"><span className="welcome-kicker">{t(`welcome.kicker${step}`, { defaultValue: ['Welcome to clbhouz', 'Your golf', 'Your golf friends', 'Optional', 'Your first look'][step - 1] })}</span>
    {step === 1 && <><h1>{t('welcome.setupTitle', { defaultValue: "Let's get you set up." })}</h1><p className="welcome-sub">{t('welcome.setupSub', { defaultValue: 'About a minute. Everything here can be changed later.' })}</p><div className="welcome-photo-row"><Button variant="ghost" className="welcome-photo" onClick={() => photoPicker.current?.openPicker()} aria-label={t('welcome.addPhoto', { defaultValue: 'Add a photo' })}>{form.profilePhotoUrl ? <img src={form.profilePhotoUrl} alt="" /> : <Plus size={26} />}</Button><p><b>{t('welcome.addPhoto', { defaultValue: 'Add a photo' })}</b><span>{t('welcome.photoSub', { defaultValue: 'So golfers you know can spot you.' })}</span></p><div className="welcome-photo-picker"><ProfilePhotoCard ref={photoPicker} variant="bare" currentUrl={form.profilePhotoUrl} onFileChange={file => { setField('profilePhotoBlob', file); if (file) setField('profilePhotoUrl', URL.createObjectURL(file)); }} /></div></div><div className="welcome-field"><label>{t('welcome.name', { defaultValue: 'Your name' })}</label><div>{editing ? <><input aria-label={t('welcome.firstName', { defaultValue: 'First name' })} value={first} onChange={e => setFirst(e.target.value)} /><input aria-label={t('welcome.lastName', { defaultValue: 'Last name' })} value={last} onChange={e => setLast(e.target.value)} /></> : <><b>{`${first} ${last}`.trim()}</b><Button variant="ghost" onClick={() => setEditing(true)}>{t('welcome.edit', { defaultValue: 'Edit' })}</Button></>}</div></div><div className="welcome-field"><label htmlFor="welcome-username">{t('welcome.username', { defaultValue: 'Username' })}</label><div><span>@</span><input id="welcome-username" value={candidate} maxLength={20} onChange={e => { setUsernameEdited(true); setUsername(e.target.value.toLowerCase()); }} />{availability.isSuccess && availability.data.available && <span className="welcome-green"><Check size={12} />{t('welcome.available', { defaultValue: 'Available' })}</span>}</div>{availability.isSuccess && !availability.data.available && <p role="alert">{t(WELCOME_USERNAME_RE.test(candidate) ? 'welcome.taken' : 'welcome.invalidUsername', { defaultValue: WELCOME_USERNAME_RE.test(candidate) ? 'That username is taken - please choose another.' : 'Username must be 3-20 lowercase letters, numbers, _ or .' })}</p>}{availability.isError && <Button variant="ghost" onClick={() => void availability.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button>}</div></>}
    {step === 2 && <><h1>{t('welcome.courseTitle', { defaultValue: 'Where do you play most?' })}</h1><div className="welcome-search"><Search size={18} /><input aria-label={t('welcome.courseSearch', { defaultValue: 'Search courses' })} placeholder={t('welcome.courseSearch', { defaultValue: 'Search courses' })} value={query} onChange={e => setQuery(e.target.value)} /></div>{search.loading && <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p>}{search.error && <Button variant="ghost" onClick={search.refetch}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button>}{query.trim() && !search.loading && <div className="welcome-search-results">{search.data.map(course => <Button variant="ghost" key={course.id} onClick={() => { persist({ ...progress, course }); setQuery(''); }}>{course.thumbnail_image && <img src={course.thumbnail_image} alt="" />}<span><b>{course.name}</b><small>{course.region || course.country}</small></span></Button>)}</div>}{progress.course && <><WelcomeCourseCard course={progress.course} /><p className="welcome-alt">{t('welcome.realRounds', { defaultValue: 'From real rounds by golfers on clbhouz.' })}</p></>}</>}
    {step === 3 && <WelcomeGolfers viewerId={user.id} club={form.homeClubName} onEmpty={noSuggestions} onFollow={follow} />}
    {step === 4 && (!settledConnection ? <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p> : connection.isError ? <Button variant="ghost" onClick={() => void connection.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button> : <>{!connectOpen && <><h1>{t('welcome.handicapTitle', { defaultValue: 'Got an official handicap?' })}</h1><p className="welcome-sub">{t('welcome.handicapSub', { defaultValue: "Connect it and every round you've played comes in, hole by hole. No handicap? Courses, reviews, the Top 100, the tours and your Clubhouse all work without one." })}</p></>}<WelcomeHandicap userId={user.id} onBusy={setConnectOpen} onConnected={() => { setConnectedNow(true); complete(4, 'connected'); }} /></>)}
    {step === 5 && (connection.isSuccess ? <WelcomeFirstLook userId={user.id} first={first} course={progress.course} connectionId={connection.data?.id} onFollow={follow} /> : connection.isError ? <Button variant="ghost" onClick={() => void connection.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button> : <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p>)}{message && <p role="alert">{message}</p>}</div><footer className="welcome-foot">{step === 1 && <Button className="welcome-primary" disabled={isSaving || busy || !canContinueIdentity(first, last, candidate, availability.isSuccess && availability.data.available)} onClick={() => void saveIdentity()}>{t('welcome.continue', { defaultValue: 'Continue' })}</Button>}{step === 2 && <><Button className="welcome-primary" disabled={!progress.course || isSaving || busy} onClick={() => void saveCourse()}>{t('welcome.setCourse', { defaultValue: 'This is my course' })}</Button><Button variant="ghost" className="welcome-text" onClick={() => { persist({ ...progress, course: null, completed: Math.max(progress.completed, 2) }); analyticsEvents.track('onboarding_step_completed', { step: 2, choice: 'no_course' }); setStep(3); }}>{t('welcome.noCourse', { defaultValue: "I don't have a regular course" })}</Button></>}{step === 3 && <Button className="welcome-primary" onClick={() => complete(3, 'follows_selected')}>{t('welcome.continue', { defaultValue: 'Continue' })}</Button>}{step === 4 && !connectOpen && <Button className="welcome-primary welcome-glass" disabled={!connection.isSuccess} onClick={() => complete(4, 'no_handicap')}>{t('welcome.noHandicap', { defaultValue: "I don't have one" })}</Button>}{step === 5 && <Button className="welcome-primary" disabled={busy || !connection.isSuccess} onClick={() => void finish(false)}>{t('welcome.open', { defaultValue: 'Open clbhouz' })}</Button>}</footer></main>;
}