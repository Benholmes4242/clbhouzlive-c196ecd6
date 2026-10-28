import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useSocialCounts } from '@/hooks/useSocialCounts';
import { useHandicapTrend } from '@/lib/whs/hooks';
import { useImportedCounts } from '@/components/profile/handicap/whs/connect/useImportedCounts';
import { formatHcp } from '@/lib/formatHcp';
import { formatNumber } from '@/i18n/format';
import type { WelcomeCourse } from './welcomeRules';
import { useFollowAll, type WelcomeFriend } from './WelcomeGolfers';

export type WelcomeDestination = 'clubhouse' | 'courses' | 'top100';

/**
 * OB1.4 final page (design A). Reads only what it shows: Following count via
 * useSocialCounts (the profile page's get_actor_social_counts source; the
 * follow cache bumps it after Follow all), the handicap index, imported
 * counts, handicap friends and the live catalogue count. Rows hand their
 * destination to the parent's single completion path.
 */
export function WelcomeFirstLook({ userId, first, fullName, username, photoUrl, course, connectionId, busy, onFollow, onOpen }: { userId: string; first: string; fullName: string; username: string; photoUrl?: string | null; course: WelcomeCourse | null; connectionId?: string; busy: boolean; onFollow: (n: number) => void; onOpen: (destination: WelcomeDestination) => void }) {
  const { t } = useTranslation('auth');
  const social = useSocialCounts({ type: 'personal', id: userId });
  const trend = useHandicapTrend(connectionId); const counts = useImportedCounts(connectionId);
  const friends = useQuery({ queryKey: ['welcome-handicap-friends', userId], enabled: !!connectionId, retry: false, queryFn: async () => { const { data, error } = await supabase.rpc('get_my_handicap_friends_on_clbhouz'); if (error) throw error; return (data ?? []) as WelcomeFriend[]; } });
  // Catalogue count: exact head/count; failure/null shows a chevron, never a fixed number.
  const catalogue = useQuery({ queryKey: ['welcome-catalogue-count'], retry: false, queryFn: async () => { const { count, error } = await supabase.from('golf_courses').select('id', { count: 'exact', head: true }); if (error) throw error; return count; } });
  const followAll = useFollowAll(friends.data ?? [], userId, onFollow);
  const ready = !social.isPending && !catalogue.isPending && (!connectionId || (!trend.isPending && !counts.isPending && !friends.isPending));
  if (!ready) return <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p>;
  const following = social.isError ? null : social.data?.following ?? null;
  const index = connectionId && !trend.isError && trend.data?.current != null ? formatHcp(trend.data.current) : '—';
  const friendRows = connectionId && !friends.isError ? friends.data ?? [] : [];
  const chevron = <ChevronRight size={18} className="welcome-final-chev" aria-hidden />;
  const rows: { dest: WelcomeDestination; title: string; sub: string; value?: string | null }[] = [
    { dest: 'courses', title: t('welcome.rowCourses', { defaultValue: 'Courses' }), sub: t('welcome.rowCoursesSub', { defaultValue: 'How every course really plays' }), value: !catalogue.isError && catalogue.data != null ? formatNumber(catalogue.data) : null },
    { dest: 'top100', title: t('welcome.rowTop100', { defaultValue: 'Top 100' }), sub: t('welcome.rowTop100Sub', { defaultValue: "Tick off the ones you've played" }) },
    { dest: 'clubhouse', title: t('welcome.rowClubhouse', { defaultValue: 'Your Clubhouse' }), sub: t('welcome.rowClubhouseSub', { defaultValue: 'Rounds and posts from golfers you follow' }) },
  ];
  return <div className="welcome-final">
    <h1>{t('welcome.inTitle', { first, defaultValue: `You're in, ${first}.` })}</h1>
    <p className="welcome-sub">{t('welcome.finalSub', { defaultValue: 'This is how golfers will see you.' })}</p>
    <div className="welcome-final-card" data-welcome-profile-card>
      <div className="welcome-final-prof"><SquircleAvatar size={64} src={photoUrl} alt={fullName} hideRing /><div className="welcome-final-id"><b>{fullName}</b><span>@{username}</span>{course && <span className="welcome-final-course" data-welcome-home-course>{course.name}</span>}</div></div>
      <div className="welcome-final-facts"><div data-welcome-fact="following"><b>{following != null ? formatNumber(following) : '—'}</b><i>{t('welcome.factFollowing', { defaultValue: 'Following' })}</i></div><div data-welcome-fact="handicap"><b>{index}</b><i>{t('welcome.factHandicap', { defaultValue: 'Handicap' })}</i></div></div>
      {connectionId && !counts.isError && <p className="welcome-final-line" data-welcome-rounds>{counts.data ? t('welcome.roundsBrought', { count: counts.data.rounds, defaultValue: `${formatNumber(counts.data.rounds)} rounds brought in from your handicap account.` }) : t('welcome.importing', { defaultValue: 'Your rounds are coming in now.' })}</p>}
    </div>
    {friendRows.length > 0 && <div className="welcome-final-friends" data-welcome-friends><div><b>{t('welcome.friendsHere', { count: friendRows.length, defaultValue: friendRows.length === 1 ? '1 golf friend is already here' : `${friendRows.length} golf friends are already here` })}</b><span>{t('welcome.fromHandicap', { defaultValue: 'From your handicap account' })}</span></div><button type="button" className={`welcome-follow${followAll.done ? ' is-following' : ''}`} data-welcome-follow-all disabled={followAll.busy || followAll.done} onClick={() => void followAll.all()}>{t(followAll.done ? 'welcome.following' : 'welcome.followAll', { defaultValue: followAll.done ? 'Following' : 'Follow all' })}</button></div>}
    <div className="welcome-final-sec">{t('welcome.startHere', { defaultValue: 'Start here' })}</div>
    <div className="welcome-final-rows">{rows.map(row => <button type="button" key={row.dest} data-welcome-row={row.dest} disabled={busy} onClick={() => onOpen(row.dest)}><span className="welcome-final-row-copy"><b>{row.title}</b><span>{row.sub}</span></span>{row.value ? <span className="welcome-final-value">{row.value}</span> : chevron}</button>)}</div>
  </div>;
}
