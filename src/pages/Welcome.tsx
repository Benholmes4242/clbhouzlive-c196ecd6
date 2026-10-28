import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { getCountryById } from '@/lib/whs/whsCountries';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';
import { WelcomeCropper } from '@/features/onboarding/WelcomeCropper';
import { WelcomeErrorBoundary } from '@/features/onboarding/WelcomeErrorBoundary';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { WelcomeCourseCard } from '@/features/onboarding/WelcomeCourseCard';
import { WelcomeGolfers } from '@/features/onboarding/WelcomeGolfers';
import { WelcomeHandicap } from '@/features/onboarding/WelcomeHandicap';
import { WelcomeFirstLook, type WelcomeDestination } from '@/features/onboarding/WelcomeFirstLook';
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
  return <WelcomeErrorBoundary><WelcomeFlow key={user.id} user={user} profile={profile.profile} /></WelcomeErrorBoundary>;
}
function WelcomeFlow({ user, profile }: { user: NonNullable<ReturnType<typeof useSupabaseSession>['user']>; profile: NonNullable<ReturnType<typeof useProfileData>['profile']> }) {
  const { t } = useTranslation('auth'); const navigate = useNavigate(); const location = useLocation(); const qc = useQueryClient();
  const [progress, setProgress] = useState<WelcomeProgress>(() => readWelcomeProgress(user.id));
  const [step, setStep] = useState<WelcomeStep>(() => Math.min(5, readWelcomeProgress(user.id).completed + 1) as WelcomeStep);
  const { form, setField } = useProfileForm({ ...profile, social_links: undefined }, false); const { save, isSaving } = useProfileSave(user.id);
  const initialName = welcomeName(profile, user.user_metadata); const [first, setFirst] = useState(initialName.first); const [last, setLast] = useState(initialName.last);
  const [username, setUsername] = useState(''); const [usernameEdited, setUsernameEdited] = useState(false);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [connectedNow, setConnectedNow] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null); const firstRef = useRef<HTMLInputElement>(null); const lastRef = useRef<HTMLInputElement>(null); const usernameRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null); const [photoPreview, setPhotoPreview] = useState<string | null>(null); const photoUrl = photoPreview ?? form.profilePhotoUrl;
  // OB1.2: the open connect body is a history entry on /welcome, so the back
  // button and iOS edge-swipe pop to screen 4 rather than leaving the flow.
  const connectCountryId = step === 4 ? ((location.state as { welcomeConnect?: string } | null)?.welcomeConnect ?? null) : null; const connectOpen = !!connectCountryId;
  const closeConnect = () => { if (location.key !== 'default') navigate(-1); else navigate('/welcome', { replace: true, state: null }); };
  // OB1.5: while the connect call is in flight the heading swaps to the
  // syncing copy and the back button and Skip hide; the bar stays on step 4.
  const [syncing, setSyncing] = useState(false);
  const connectBody = connectCountryId ? getCountryById(connectCountryId)?.body ?? null : null;
  const pickPhoto = (file: File | undefined) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setCropSrc(reader.result as string); reader.readAsDataURL(file); };
  const usePhoto = (file: File) => { setField('profilePhotoBlob', file); const url = URL.createObjectURL(file); setField('profilePhotoUrl', url); setPhotoPreview(url); setCropSrc(null); };
  const nextOnEnter = (next: () => void) => (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }; const base = usernameSeed(first, last); const connection = useWhsConnection(user.id);
  const [query, setQuery] = useState(''); const search = useCourseSearch(query, { includeClub: true });
  const checkAvailability = useCallback(async (candidateBase: string, edited: boolean) => {
    if (!WELCOME_USERNAME_RE.test(candidateBase)) return { candidate: candidateBase, available: false };
    for (let suffix = 0; suffix < 100; suffix++) {
      const candidate = usernameWithSuffix(candidateBase, suffix);
      const { count, error } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true }).ilike('username', candidate.replace(/[\\%_]/g, '\\$&')).neq('id', user.id);
      if (error) throw error;
      if ((count ?? 0) === 0) return { candidate, available: true };
      if (edited) return { candidate, available: false };
    }
    return { candidate: candidateBase, available: false };
  }, [user.id]);
  const [seedReady, setSeedReady] = useState(false);
  // The seed is chosen by checking availability, so that known-good result is
  // recorded under the screen's query key: "Available" and Continue are ready
  // the moment the seed appears, with no second round trip. Edited usernames
  // still check through the query as before.
  useEffect(() => {
    if (step !== 1 || usernameEdited || !base || seedReady) return;
    let alive = true;
    void checkAvailability(base, false).then(result => { if (!alive) return; qc.setQueryData(['welcome-username', user.id, base, false], result); setSeedReady(true); }).catch(() => { if (alive) setSeedReady(true); });
    return () => { alive = false; };
  }, [step, usernameEdited, base, seedReady, checkAvailability, qc, user.id]);
  const availability = useQuery({ queryKey: ['welcome-username', user.id, usernameEdited ? username : base, usernameEdited], enabled: step === 1 && !!base && (usernameEdited || seedReady), retry: false, staleTime: Infinity, queryFn: () => checkAvailability(usernameEdited ? username : base, usernameEdited) });
  const candidate = usernameEdited ? username : availability.data?.candidate ?? base;
  const persist = useCallback((next: WelcomeProgress) => { writeWelcomeProgress(user.id, next); setProgress(next); }, [user.id]);
  const complete = useCallback((current: WelcomeStep, choice: string) => { analyticsEvents.track('onboarding_step_completed', { step: current, choice }); const next = { ...progress, completed: Math.max(progress.completed, current) }; persist(next); setStep(Math.min(5, current + 1) as WelcomeStep); }, [progress, persist]);
  const noSuggestions = useCallback(() => complete(3, 'no_suggestions'), [complete]);
  const follow = useCallback((n: number) => { setProgress(prev => { const next = { ...prev, follows: Math.max(0, prev.follows + n) }; writeWelcomeProgress(user.id, next); return next; }); }, [user.id]);
  useEffect(() => { analyticsEvents.track('onboarding_step_viewed', { step }); }, [step]);
  useEffect(() => { if (step === 4 && connection.isSuccess && connection.data) complete(4, 'already_connected'); }, [step, connection.isSuccess, connection.data, complete]);
  const finish = async (skip: boolean, destination: WelcomeDestination = 'clubhouse') => {
    if (busy) return; setBusy(true); setMessage('');
    if (skip) { analyticsEvents.track('onboarding_skip_tapped', { has_user: true, is_skipping: false }); analyticsEvents.track('onboarding_skipped', { step }); }
    try {
      const { data, error } = await supabase.from('user_profiles').update({ has_completed_onboarding: true, updated_at: new Date().toISOString() }).eq('id', user.id).select('id').single();
      if (error || !data) { if (skip) analyticsEvents.track('onboarding_skip_failed', { reason: error?.code === 'PGRST116' || !data ? 'zero_rows' : 'update_error', code: error?.code ?? null, message: error?.message ?? 'update matched no row' }); throw error ?? new Error('Could not complete setup.'); }
      if (skip) analyticsEvents.track('onboarding_skip_succeeded', { user_id: user.id }); else analyticsEvents.track('onboarding_finished', { connected: !!connection.data || connectedNow, course_set: !!progress.course, follows: progress.follows, destination });
      qc.setQueryData(['onboarding-status', user.id], { hasCompletedOnboarding: true, userType: profile.user_type });
      void qc.invalidateQueries({ queryKey: ['profile', user.id] }); navigate(destination === 'courses' ? '/courses' : destination === 'top100' ? '/courses?tab=top100' : '/', { replace: true });
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
  return <main className="welcome-shell" data-welcome-step={step}><header className="welcome-top">{connectOpen && !syncing && <button type="button" className="welcome-back" aria-label={t('welcome.back', { defaultValue: 'Back' })} onClick={closeConnect}>‹</button>}<div className="welcome-progress" aria-label={t('welcome.progress', { step, defaultValue: `Step ${step} of 5` })}>{[1, 2, 3, 4, 5].map(n => <i key={n} data-complete={n <= step} />)}</div>{step !== 5 && !syncing && <Button variant="ghost" className="welcome-skip" disabled={busy || isSaving} onClick={() => void finish(true)}>{t('welcome.skip', { defaultValue: 'Skip' })}</Button>}</header><div className="welcome-body"><span className="welcome-kicker">{connectOpen ? t('welcome.kickerConnect', { defaultValue: 'Your handicap' }) : t(`welcome.kicker${step}`, { defaultValue: ['Welcome to clbhouz', 'Your golf', 'Your golf friends', 'Optional', 'All set'][step - 1] })}</span>
    {connectOpen && <><h1>{syncing ? t('whsConnect.sync.headline', { ns: 'handicap', defaultValue: 'Pulling your record.' }) : t('welcome.connectTitle', { body: connectBody, defaultValue: `Sign in to ${connectBody}.` })}</h1><p className="welcome-sub">{syncing ? t('whsConnect.sync.sub', { ns: 'handicap', defaultValue: 'Under a minute for most accounts. It finishes on our servers either way.' }) : t('welcome.connectSub', { body: connectBody, defaultValue: `The same details you use for the ${connectBody} app.` })}</p></>}
    {step === 1 && <><h1>{t('welcome.setupTitle', { defaultValue: "Let's get you set up." })}</h1><p className="welcome-sub">{t('welcome.setupSub', { defaultValue: 'About a minute. Everything here can be changed later.' })}</p><div className="welcome-photo-row"><Button variant="ghost" className="welcome-photo" data-has-photo={!!photoUrl} onClick={() => photoInput.current?.click()} aria-label={t(photoUrl ? 'welcome.changePhoto' : 'welcome.addPhoto', { defaultValue: photoUrl ? 'Change photo' : 'Add a photo' })}>{photoUrl ? <img src={photoUrl} alt="" /> : <Plus size={26} />}</Button><p><b>{photoUrl ? t('welcome.changePhoto', { defaultValue: 'Change photo' }) : t('welcome.addPhoto', { defaultValue: 'Add a photo' })}</b><span>{photoUrl ? t('welcome.photoDone', { defaultValue: 'Looking good.' }) : t('welcome.photoSub', { defaultValue: 'So golfers you know can spot you.' })}</span></p><input ref={photoInput} type="file" accept="image/*" className="welcome-photo-picker" data-welcome-photo-input onChange={e => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} /></div><div className="welcome-field welcome-name" data-welcome-name onClick={e => { if (!(e.target instanceof HTMLInputElement)) firstRef.current?.focus(); }}><label htmlFor="welcome-first">{t('welcome.name', { defaultValue: 'Your name' })}</label><div className="welcome-two"><input ref={firstRef} id="welcome-first" aria-label={t('welcome.firstName', { defaultValue: 'First name' })} placeholder={t('welcome.firstPlaceholder', { defaultValue: 'First' })} value={first} autoCapitalize="words" autoComplete="given-name" enterKeyHint="next" onKeyDown={nextOnEnter(() => lastRef.current?.focus())} onChange={e => setFirst(e.target.value)} /><input ref={lastRef} aria-label={t('welcome.lastName', { defaultValue: 'Last name' })} placeholder={t('welcome.lastPlaceholder', { defaultValue: 'Last' })} value={last} autoCapitalize="words" autoComplete="family-name" enterKeyHint="next" onKeyDown={nextOnEnter(() => usernameRef.current?.focus())} onChange={e => setLast(e.target.value)} /></div></div><div className="welcome-field" onClick={e => { if (!(e.target instanceof HTMLInputElement)) usernameRef.current?.focus(); }}><label htmlFor="welcome-username">{t('welcome.username', { defaultValue: 'Username' })}</label><div><span className="welcome-at">@</span><input ref={usernameRef} id="welcome-username" placeholder="yourname" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" enterKeyHint="done" onKeyDown={nextOnEnter(() => usernameRef.current?.blur())} value={candidate} maxLength={20} onChange={e => { setUsernameEdited(true); setUsername(e.target.value.toLowerCase()); }} />{availability.isSuccess && availability.data.available && <span className="welcome-green"><Check size={12} />{t('welcome.available', { defaultValue: 'Available' })}</span>}</div>{availability.isSuccess && !availability.data.available && <p role="alert">{t(WELCOME_USERNAME_RE.test(candidate) ? 'welcome.taken' : 'welcome.invalidUsername', { defaultValue: WELCOME_USERNAME_RE.test(candidate) ? 'That username is taken - please choose another.' : 'Username must be 3-20 lowercase letters, numbers, _ or .' })}</p>}{availability.isError && <Button variant="ghost" onClick={() => void availability.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button>}</div></>}
    {step === 2 && <><h1>{t('welcome.courseTitle', { defaultValue: 'Where do you play most?' })}</h1><div className="welcome-search"><Search size={18} /><input aria-label={t('welcome.courseSearch', { defaultValue: 'Search courses' })} placeholder={t('welcome.courseSearch', { defaultValue: 'Search courses' })} value={query} onChange={e => setQuery(e.target.value)} /></div>{search.loading && <p role="status" className="welcome-search-status">{t('welcome.searching', { defaultValue: 'Searching…' })}</p>}{search.error && <Button variant="ghost" onClick={search.refetch}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button>}{query.trim() && !search.loading && <div className="welcome-search-results">{search.data.map(course => <Button variant="ghost" key={course.id} onClick={() => { persist({ ...progress, course }); setQuery(''); }}>{course.thumbnail_image && <img src={course.thumbnail_image} alt="" />}<span><b>{course.name}</b><small>{course.region || course.country}</small></span></Button>)}</div>}{progress.course && <><WelcomeCourseCard course={progress.course} /><p className="welcome-alt">{t('welcome.realRounds', { defaultValue: 'From real rounds by golfers on clbhouz.' })}</p></>}</>}
    {step === 3 && <WelcomeGolfers viewerId={user.id} club={form.homeClubName} onEmpty={noSuggestions} onFollow={follow} />}
    {step === 4 && (!settledConnection ? <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p> : connection.isError ? <Button variant="ghost" onClick={() => void connection.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button> : <>{!connectOpen && <><h1>{t('welcome.handicapTitle', { defaultValue: 'Got an official handicap?' })}</h1><p className="welcome-sub">{t('welcome.handicapSub', { defaultValue: "Connect it and every round you've played comes in, hole by hole. No handicap? Courses, reviews, the Top 100, the tours and your Clubhouse all work without one." })}</p></>}<WelcomeHandicap userId={user.id} connectCountryId={connectCountryId} onOpenConnect={c => navigate('/welcome', { state: { welcomeConnect: c.id } })} onSyncingChange={setSyncing} onConnected={() => { setConnectedNow(true); navigate('/welcome', { replace: true, state: null }); complete(4, 'connected'); }} /></>)}
    {step === 5 && (connection.isSuccess ? <WelcomeFirstLook userId={user.id} first={first} fullName={`${first} ${last}`.trim()} username={candidate || profile.username || ''} photoUrl={photoUrl} course={progress.course} connectionId={connection.data?.id} busy={busy} onFollow={follow} onOpen={dest => void finish(false, dest)} /> : connection.isError ? <Button variant="ghost" onClick={() => void connection.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button> : <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p>)}{message && <p role="alert">{message}</p>}</div><footer className="welcome-foot">{step === 1 && <Button className="welcome-primary" disabled={isSaving || busy || !canContinueIdentity(first, last, candidate, availability.isSuccess && availability.data.available)} onClick={() => void saveIdentity()}>{t('welcome.continue', { defaultValue: 'Continue' })}</Button>}{step === 2 && <><Button className="welcome-primary" disabled={!progress.course || isSaving || busy} onClick={() => void saveCourse()}>{t('welcome.setCourse', { defaultValue: 'This is my course' })}</Button><Button variant="ghost" className="welcome-text" onClick={() => { persist({ ...progress, course: null, completed: Math.max(progress.completed, 2) }); analyticsEvents.track('onboarding_step_completed', { step: 2, choice: 'no_course' }); setStep(3); }}>{t('welcome.noCourse', { defaultValue: "I don't have a regular course" })}</Button></>}{step === 3 && <Button className="welcome-primary" onClick={() => complete(3, 'follows_selected')}>{t('welcome.continue', { defaultValue: 'Continue' })}</Button>}{step === 4 && !connectOpen && <Button variant="ghost" className="welcome-glass-button" disabled={!connection.isSuccess} onClick={() => complete(4, 'no_handicap')}>{t('welcome.noHandicap', { defaultValue: "I don't have one" })}</Button>}{step === 5 && <Button className="welcome-primary" disabled={busy || !connection.isSuccess} onClick={() => void finish(false)}>{t('welcome.open', { defaultValue: 'Open clbhouz' })}</Button>}</footer>{cropSrc && <WelcomeCropper image={cropSrc} onCancel={() => setCropSrc(null)} onUse={usePhoto} />}</main>;
}