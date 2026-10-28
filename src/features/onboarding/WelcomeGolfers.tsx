import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useFollowState } from '@/hooks/useFollowState';
import { useSuggestedGolfers, type SuggestedGolfer } from '@/features/social-suggestions/useSuggestedGolfers';
import { reasonText } from '@/features/social-suggestions/SuggestedGolferRow';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';

export interface WelcomeFriend { user_id: string; display_name: string | null; username: string | null; profile_photo_url: string | null; is_following?: boolean }
function Golfer({ row, viewerId, onFollow }: { row: WelcomeFriend & { meta?: string }; viewerId: string; onFollow: (n: number) => void }) {
  const { t } = useTranslation('auth');
  const state = useFollowState({ viewerActorType: 'personal', viewerActorId: viewerId, targetActorType: 'personal', targetActorId: row.user_id });
  const toggle = useToggleFollow();
  const following = state.isFollowing ?? row.is_following;
  return <div className="welcome-person"><span className="welcome-person-avatar">{row.profile_photo_url ? <img src={row.profile_photo_url} alt="" /> : <PlayerSilhouette />}</span><div className="welcome-person-copy"><b>{row.display_name || row.username}</b><span>{row.meta}</span></div><Button className={`welcome-follow${following ? ' is-following' : ''}`} disabled={following === undefined || toggle.isPending} onClick={async () => { const result = await toggle.mutateAsync({ viewerActorType: 'personal', viewerActorId: viewerId, viewerUserId: viewerId, targetActorType: 'personal', targetActorId: row.user_id, targetUserId: row.user_id, isFollowing: !!following }); onFollow(result.next ? 1 : -1); }}>{t(following ? 'welcome.following' : 'welcome.follow', { defaultValue: following ? 'Following' : 'Follow' })}</Button></div>;
}
/** Follow-all over the existing toggle path; shared by screen 3 and the final page. */
export function useFollowAll(rows: WelcomeFriend[], viewerId: string, onFollow: (n: number) => void) {
  const qc = useQueryClient(); const toggle = useToggleFollow(); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);
  const all = async () => { setBusy(true); try { for (const row of rows) { const cached = qc.getQueryData<boolean | { isFollowing: boolean }>(['follow-status', 'personal', viewerId, 'personal', row.user_id]); const follows = typeof cached === 'boolean' ? cached : cached?.isFollowing ?? row.is_following; if (follows === undefined) return; if (!follows) { await toggle.mutateAsync({ viewerActorType: 'personal', viewerActorId: viewerId, viewerUserId: viewerId, targetActorType: 'personal', targetActorId: row.user_id, targetUserId: row.user_id, isFollowing: false }); onFollow(1); } } setDone(true); } finally { setBusy(false); } };
  return { all, busy, done };
}
export function WelcomeFriendsList({ rows, viewerId, onFollow, title, followAll = false }: { rows: (WelcomeFriend & { meta?: string })[]; viewerId: string; onFollow: (n: number) => void; title?: string; followAll?: boolean }) {
  const { t } = useTranslation('auth'); const { all, busy, done } = useFollowAll(rows, viewerId, onFollow);
  return <><div className="welcome-section-heading"><span>{title}</span>{followAll && <Button variant="ghost" disabled={busy} onClick={() => void all()}>{t(done ? 'welcome.following' : 'welcome.followAll', { defaultValue: done ? 'Following' : 'Follow all' })}</Button>}</div><div className="welcome-list">{rows.map(row => <Golfer key={row.user_id} row={row} viewerId={viewerId} onFollow={onFollow} />)}</div></>;
}
export function WelcomeGolfers({ viewerId, club, onEmpty, onFollow }: { viewerId: string; club: string; onEmpty: () => void; onFollow: (n: number) => void }) {
  const { t } = useTranslation(['auth', 'common']); const query = useSuggestedGolfers(24, true);
  useEffect(() => { if (query.isSuccess && query.data.length === 0) onEmpty(); }, [query.isSuccess, query.data, onEmpty]);
  if (query.isPending) return <p role="status">{t('auth:welcome.loading', { defaultValue: 'Loading…' })}</p>;
  if (query.isError) return <Button variant="ghost" onClick={() => void query.refetch()}>{t('auth:welcome.retry', { defaultValue: 'Try again' })}</Button>;
  const rows = query.data ?? []; const clubRows = rows.filter(row => row.reason_type === 'club'); const other = rows.filter(row => row.reason_type !== 'club').slice(0, 5);
  const name = clubRows[0]?.reason_club_name || club;
  const map = (row: SuggestedGolfer) => ({ ...row, meta: row.reason_club_name || reasonText(row, (key, opts) => t(`common:${key}`, opts)) });
  return <><h1>{t(clubRows.length ? 'auth:welcome.clubGolfers' : 'auth:welcome.suggestedGolfers', { club: name, defaultValue: clubRows.length ? `Golfers from ${name}.` : 'Golfers you might know.' })}</h1><p className="welcome-sub">{t('auth:welcome.followSub', { defaultValue: 'Follow them to see their rounds and posts in your Clubhouse.' })}</p>{clubRows.length > 0 && <WelcomeFriendsList rows={clubRows.map(map)} viewerId={viewerId} onFollow={onFollow} title={t('auth:welcome.atClub', { club: name, defaultValue: `At ${name}` })} followAll />}{other.length > 0 && <WelcomeFriendsList rows={other.map(map)} viewerId={viewerId} onFollow={onFollow} title={t('auth:welcome.suggested', { defaultValue: 'Suggested' })} />}</>;
}