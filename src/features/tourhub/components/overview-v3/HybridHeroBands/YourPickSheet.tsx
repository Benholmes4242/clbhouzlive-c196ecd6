/** Session owns field/board/summary navigation. Public board and guest locks
 * never call member state; saved picks return to summary without dismissing. */
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Search, X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { ACTIVE_RING_GRADIENT } from '@/features/find-people/ActiveRing';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { getGuestUser } from '@/features/guest/guestGateStore';
import { usePickTeeTimes } from '../../../tournament-v2/data/usePickTeeTimes';
import { TournamentPicksBoard } from './TournamentPicksBoard';
import { PlayerAvatar } from '../../PlayerAvatar';
import { usePickField, useTournamentPickState, useSetTournamentPick, useGuestTournamentPickLock, useTournamentPicksBoard, type PickFieldPlayer } from '../../../hooks/useTournamentPick';
import { localPickLock, pickCountry, searchPickField } from './yourPickRules';
import './yourPickSheet.css';

export interface YourPickSheetProps {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  eventName: string;
  ourPicks: { playerId: string; playerName: string }[];
  tourCode: string;
  /** Player-page entry preselects locally; it never writes before submit. */
  initialPlayerId?: string;
  initialView?: 'field' | 'board';
}

export function YourPickSheet(props: YourPickSheetProps) {
  return props.open ? <PickSession key={props.tournamentId} {...props} /> : null;
}

function PickSession({ onClose, tournamentId, eventName, ourPicks, tourCode, initialPlayerId, initialView = 'field' }: YourPickSheetProps) {
  const { t } = useTranslation('tourhub');
  const titleId = useId();
  const fieldQuery = usePickField(tournamentId);
  const stateQuery = useTournamentPickState(tournamentId);
  const mutation = useSetTournamentPick();
  const { user } = useSupabaseSession();
  const guest = !user || user.is_anonymous || Boolean(getGuestUser());
  const guestLock = useGuestTournamentPickLock(tournamentId);
  const board = useTournamentPicksBoard(tournamentId);
  const [view, setView] = useState<'field' | 'board' | 'summary'>(initialView);
  const [changing, setChanging] = useState(false);
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<string | null>(initialPlayerId ?? null);
  const [touched, setTouched] = useState(false);
  const field = fieldQuery.data ?? [];
  const state = guest ? null : stateQuery.data;
  const lockState = guest ? guestLock.data : state;
  const locked = lockState?.locked === true;
  const hasPick = Boolean(state?.my_player_id);
  const mine = field.find(player => player.player_id === state?.my_player_id);
  const mineName = mine?.full_name ?? state?.my_player_name ?? board.data?.find(row => row.is_viewer)?.player_name ?? '';
  const mineId = state?.my_player_id ?? '';
  const tees = usePickTeeTimes(tournamentId, 1, mineId ? [mineId] : [], { enabled: Boolean(mineId) });
  const tee = localPickLock(tees.isError ? null : tees.data?.get(mineId) ?? null);
  const displayView = locked || hasPick && !changing ? 'summary' : guest ? 'board' : view;
  useEffect(() => {
    if (!touched && state) setChosen(initialPlayerId ?? state.my_player_id);
  }, [state, touched, initialPlayerId]);
  const choose = (id: string) => { setTouched(true); setChosen(current => current === id ? null : id); };
  const selected = field.find(player => player.player_id === chosen);
  const orderedPicks = ourPicks.slice(0, 3);
  const pickIds = new Set(orderedPicks.map(pick => pick.playerId));
  const ours = orderedPicks.flatMap(pick => {
    const player = field.find(row => row.player_id === pick.playerId);
    return player ? [player] : [];
  });
  const remaining = field.filter(player => !pickIds.has(player.player_id));
  const results = searchPickField(field, search);
  const lock = localPickLock(lockState?.locks_at ?? null);
  const copy = (key: string, options: Record<string, unknown> = {}) => t(`overview.yourPick.${key}`, options);

  async function submit() {
    if (!selected || mutation.isPending || !stateQuery.isSuccess || !state) return;
    if (locked || selected.player_id === state.my_player_id) return;
    try {
      await mutation.mutateAsync({ tournamentId, playerId: selected.player_id });
      setChanging(false);
      setView('summary');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message).toLowerCase() : '';
      if (message.includes('picks are locked')) {
        toast.error(copy('locked'));
        onClose();
      } else if (message.includes('that player is not in the field')) {
        toast.error(copy('noLongerInField'));
        setChosen(null);
        void fieldQuery.refetch();
      } else toast.error(copy('saveError'));
    }
  }

  function heading(key: string, note?: string) {
    return <div className="your-pick-heading"><span>{copy(key)}</span>{note != null && <small className="tabular-nums">{note}</small>}</div>;
  }

  function playerRow(player: PickFieldPlayer) {
    const rankIndex = orderedPicks.findIndex(pick => pick.playerId === player.player_id);
    const country = pickCountry(player.country);
    return <Button key={player.player_id} variant="ghost" className="your-pick-row" role="radio" aria-checked={chosen === player.player_id}
      aria-label={player.full_name} data-pick-player={player.player_id} onClick={() => choose(player.player_id)}>
      <span className="your-pick-avatar"><PlayerAvatar playerId={player.player_id} playerName={player.full_name} tourCode={tourCode}
        photoUrl={player.photo_url} headshotOverride={player.headshot_override} size={36} className="your-pick-face" ringGradient={chosen === player.player_id ? ACTIVE_RING_GRADIENT : undefined} /></span>
      <span className="your-pick-text"><span className="your-pick-name"><span>{player.full_name}</span>
        {rankIndex >= 0 && <span className="your-pick-tag" data-our-pick={rankIndex + 1}>{copy('ourPick', { rank: rankIndex + 1 })}</span>}{changing && state?.my_player_id === player.player_id && <span className="your-pick-tag your-pick-tag-yours">{copy('yourPickTag')}</span>}</span>
        <span className="your-pick-meta block tabular-nums">{player.world_rank == null ? copy('notRanked') : copy('worldRank', { rank: player.world_rank })}{country && ` · ${country}`}</span>
      </span>
      <span className="your-pick-radio" aria-hidden="true">{chosen === player.player_id && <Check strokeWidth={3.4} />}</span>
    </Button>;
  }

  const loading = fieldQuery.isPending || stateQuery.isFetching && !state;
  const failed = fieldQuery.isError || stateQuery.isError || stateQuery.isSuccess && !state;
  const submitDisabled = !selected || mutation.isPending || loading || failed || !state || locked || selected.player_id === state.my_player_id;
  const openField = () => { setChanging(hasPick); setChosen(state?.my_player_id ?? null); setTouched(true); setSearch(''); setView('field'); };
  const keep = () => { setChanging(false); setView('summary'); };
  return <BottomSheet open onClose={onClose} ariaLabelledBy={titleId} className="your-pick-sheet"
    maxHeight="85dvh" topRadius={22} grabberPadding="8px 0 12px" grabberRadius={2}
    style={{ height: '85dvh', paddingBottom: 0 }}>
    <header className="your-pick-header"><div className="your-pick-kicker">{copy('kicker')}</div>
      <h2 id={titleId}>{copy('title', { event: eventName })}</h2>
      <div className="your-pick-subline tabular-nums">{!fieldQuery.isPending && (lock
        ? copy('locksWithPlayers', { ...lock, count: field.length }) : copy('players', { count: field.length }))}</div>
    </header>
    {!hasPick && !locked && !guest && <div className="your-pick-switch" role="tablist">
      <Button variant={null} size={null} role="tab" aria-selected={displayView === 'field'} onClick={openField}>{copy('pickAPlayer')}</Button>
      <Button variant={null} size={null} role="tab" aria-selected={displayView === 'board'} onClick={() => setView('board')}>{copy('whoTab')}<b className="tabular-nums">{board.isError ? '' : board.data?.length ?? ''}</b></Button>
    </div>}
    {displayView !== 'field' ? <>
      {hasPick && <div className="your-pick-mine" data-sheet-your-pick><PlayerAvatar playerId={mineId} playerName={mineName} tourCode={tourCode} photoUrl={mine?.photo_url} headshotOverride={mine?.headshot_override} size={56} ringGradient={ACTIVE_RING_GRADIENT}/><div>
        <div className="your-pick-mine-kicker">{copy('kicker')}</div><div className="your-pick-mine-name">{mineName}</div>
        <div className="your-pick-mine-meta">{orderedPicks.some(p => p.playerId === mineId) ? copy('ourPick', {rank:orderedPicks.findIndex(p => p.playerId === mineId)+1}) : ''}{orderedPicks.some(p => p.playerId === mineId) && mine?.world_rank != null ? ' · ' : ''}{mine?.world_rank != null ? copy('worldRank',{rank:mine.world_rank}) : ''}{!orderedPicks.some(p => p.playerId === mineId) && mine?.country ? `${mine.world_rank != null ? ' · ' : ''}${pickCountry(mine.country)}` : ''}</div>
        {tee && <div className="your-pick-mine-meta">{copy('sectionTee',tee)}</div>}
      </div></div>}
      {(locked || hasPick) && <div className="your-pick-lock-note" data-picks-locked={locked ? '' : undefined}>{copy(locked ? lock ? 'lockedNote' : 'lockedNoteNoTime' : lock ? 'savedNote' : 'savedNoteNoTime',lock ?? {})}</div>}
      <div className="your-pick-list" data-sheet-scroll><TournamentPicksBoard rows={board.isError ? [] : board.data ?? []} field={field} ourPicks={orderedPicks} tourCode={tourCode} pending={board.isPending} failed={board.isError} retry={() => void board.refetch()}/></div>
      {!locked && !guest && <footer className="your-pick-bar"><Button variant={null} size={null} className="your-pick-outline" onClick={openField}>{copy(hasPick ? 'changePick' : 'pickAPlayer')}</Button></footer>}
    </> : <>
      <div className="your-pick-search"><Search size={16} aria-hidden="true" /><input value={search} onChange={event => setSearch(event.target.value)}
        placeholder={copy('search')} aria-label={copy('search')} />
        {search && <Button variant="ghost" className="your-pick-clear" onClick={() => setSearch('')} aria-label={copy('clearSearch')}><X strokeWidth={4} /></Button>}
      </div>
      <div className="your-pick-list" data-sheet-scroll>
        {loading ? <div className="your-pick-empty" role="status">{copy('loading')}</div> : failed ? <div className="your-pick-empty" role="alert">{copy('loadError')}<Button variant="ghost" onClick={() => { void fieldQuery.refetch(); void stateQuery.refetch(); }}>{copy('retry')}</Button></div> : search ? <>
          {heading('results', String(results.length))}
          <div role="radiogroup" aria-label={copy('results')}>{results.map(playerRow)}</div>
          {results.length === 0 && <div className="your-pick-empty" data-pick-no-results>{copy('noMatches', { text: search })}</div>}
        </> : <>
          {ours.length > 0 && <>{heading('ourPicks')}<div role="radiogroup" aria-label={copy('ourPicks')} data-pick-ours>{ours.map(playerRow)}</div></>}
          {heading('field', copy('rankingOrder'))}<div role="radiogroup" aria-label={copy('field')} data-pick-field>{remaining.map(playerRow)}</div>
        </>}
      </div>
      <footer className="your-pick-bar"><Button variant={null} size={null} className="your-pick-submit" data-pick-submit
        style={{ background: submitDisabled ? 'var(--pick-disabled)' : 'var(--pick-section-white)', color: submitDisabled ? 'var(--pick-dim)' : 'var(--pick-on-amber)', fontWeight: 800, fontSize: 15, height: 48, borderRadius: 999, opacity: 1 }}
        disabled={submitDisabled} onClick={() => void submit()}>
        {selected ? copy(changing ? selected.player_id === state?.my_player_id ? 'currentPick' : 'changeTo' : 'pickPlayer', { name: selected.full_name }) : copy('choosePlayer')}
      </Button><div className="your-pick-footnote">{changing ? <Button variant={null} size={null} className="your-pick-keep" onClick={keep}>{copy('keepPick',{name:mineName})}</Button> : copy('changeUntilTee')}</div></footer>
    </>}
  </BottomSheet>;
}

export default YourPickSheet;