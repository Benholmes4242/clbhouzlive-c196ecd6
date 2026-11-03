/** Build 1 is an isolated sheet: overview wiring is deliberately absent. Our
 * predictions enter only as props; server state owns locks and current picks.
 * Session content mounts only while open, resetting search/selection each visit. */
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { PlayerAvatar } from '../../PlayerAvatar';
import { usePickField, useTournamentPickState, useSetTournamentPick, type PickFieldPlayer } from '../../../hooks/useTournamentPick';
import { localPickLock, pickCountry, searchPickField } from './yourPickRules';
import './yourPickSheet.css';

export interface YourPickSheetProps {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  eventName: string;
  ourPicks: { playerId: string; playerName: string }[];
  tourCode: string;
}

export function YourPickSheet(props: YourPickSheetProps) {
  return props.open ? <PickSession key={props.tournamentId} {...props} /> : null;
}

function PickSession({ onClose, tournamentId, eventName, ourPicks, tourCode }: YourPickSheetProps) {
  const { t } = useTranslation('tourhub');
  const titleId = useId();
  const fieldQuery = usePickField(tournamentId);
  const stateQuery = useTournamentPickState(tournamentId);
  const mutation = useSetTournamentPick();
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const field = fieldQuery.data ?? [];
  const state = stateQuery.data;
  useEffect(() => {
    if (!touched && state) setChosen(state.my_player_id);
  }, [state, touched]);
  const choose = (id: string) => { setTouched(true); setChosen(id); };
  const selected = field.find(player => player.player_id === chosen);
  const orderedPicks = ourPicks.slice(0, 3);
  const pickIds = new Set(orderedPicks.map(pick => pick.playerId));
  const ours = orderedPicks.flatMap(pick => {
    const player = field.find(row => row.player_id === pick.playerId);
    return player ? [player] : [];
  });
  const remaining = field.filter(player => !pickIds.has(player.player_id));
  const results = searchPickField(field, search);
  const lock = localPickLock(state?.locks_at ?? null);
  const copy = (key: string, options: Record<string, unknown> = {}) => t(`overview.yourPick.${key}`, options);

  async function submit() {
    if (!selected || mutation.isPending || !stateQuery.isSuccess || !state) return;
    if (selected.player_id === state.my_player_id) { onClose(); return; }
    try {
      await mutation.mutateAsync({ tournamentId, playerId: selected.player_id });
      onClose();
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
        photoUrl={player.photo_url} headshotOverride={player.headshot_override} size={36} /></span>
      <span className="your-pick-text"><span className="your-pick-name"><span>{player.full_name}</span>
        {rankIndex >= 0 && <span className="your-pick-tag" data-our-pick={rankIndex + 1}>{copy('ourPick', { rank: rankIndex + 1 })}</span>}</span>
        <span className="your-pick-meta block tabular-nums">{player.world_rank == null ? copy('notRanked') : copy('worldRank', { rank: player.world_rank })}{country && ` · ${country}`}</span>
      </span>
      <span className="your-pick-radio" aria-hidden="true">{chosen === player.player_id && <Check strokeWidth={3.4} />}</span>
    </Button>;
  }

  const loading = fieldQuery.isPending || stateQuery.isFetching && !state;
  const failed = fieldQuery.isError || stateQuery.isError || stateQuery.isSuccess && !state;
  return <BottomSheet open onClose={onClose} ariaLabelledBy={titleId} className="your-pick-sheet"
    maxHeight="85dvh" topRadius={22} grabberPadding="8px 0 12px" grabberRadius={2}
    style={{ height: '85dvh', paddingBottom: 0 }}>
    <header className="your-pick-header"><div className="your-pick-kicker">{copy('kicker')}</div>
      <h2 id={titleId}>{copy('title', { event: eventName })}</h2>
      <div className="your-pick-subline tabular-nums">{!fieldQuery.isPending && (lock
        ? copy('locksWithPlayers', { ...lock, count: field.length }) : copy('players', { count: field.length }))}</div>
    </header>
    {state?.locked ? <div className="your-pick-empty" data-picks-locked>{copy('locked')}</div> : <>
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
          {state && state.followed_pickers >= 1 && <>{heading('followed', copy('soFar', { count: state.followed_pickers }))}
            <div className="your-pick-followed" data-pick-followed>{state.followed_top.map(top => {
              const player = field.find(row => row.player_id === top.player_id);
              if (!player) return null;
              return <Button key={top.player_id} variant="ghost" className="your-pick-follow-tile" aria-label={top.player_name} onClick={() => choose(top.player_id)}>
                <PlayerAvatar playerId={top.player_id} playerName={top.player_name} tourCode={tourCode} photoUrl={player.photo_url} headshotOverride={player.headshot_override} size={22} />
                <span><b>{top.player_name.trim().split(/\s+/).at(-1)}</b><small className="tabular-nums">{copy('picks', { count: top.picks })}</small></span>
              </Button>;
            })}</div></>}
          {heading('field', copy('rankingOrder'))}<div role="radiogroup" aria-label={copy('field')} data-pick-field>{remaining.map(playerRow)}</div>
        </>}
      </div>
      <footer className="your-pick-bar"><Button variant="ghost" className="your-pick-submit" data-pick-submit
        disabled={!selected || mutation.isPending || loading || failed || !state} onClick={() => void submit()}>
        {selected ? copy('pickPlayer', { name: selected.full_name }) : copy('choosePlayer')}
      </Button><div className="your-pick-footnote">{copy('changeUntilTee')}</div></footer>
    </>}
  </BottomSheet>;
}

export default YourPickSheet;