import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DEFAULT_FILTERS, type RegionKind } from '@/components/explore-tab-new/courseled/boardFilters';
import { useStandoutRounds, type StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import { useRoundHoleShapes, type HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { standoutSentenceParts } from '@/components/explore-tab-new/courseled/standoutSentence';
import { useViewerScoreScope } from '../useViewerScoreScope';
import { useStandoutFeats, type StandoutFeat } from './useStandoutFeats';
import { SHELF_CARD } from './roundsShelfRules';
import { RoundTileMarks } from './RoundTileMarks';
import { RoundTileFoot, RoundTileWho } from './RoundTileParts';
import { featHeadlineParts, featRarity, interleaveStandouts, scopeHasTiles, selectStandoutScope, shortStandoutDate, type StandoutScopeData, type StandoutScopeKey } from './standoutShelfRules';
import './standout-shelf.css';

/** SAR1: parallel scope reads own qualification; this shelf owns only selection,
 * remembered per-viewer tap, one hole-shapes batch, and ungated scorecard doors.
 * Errors suppress the shelf, never claim emptiness. Recent rounds stays separate.
 * EXPLORE TILES A: this shelf reads the last 30 days (DEFAULT_FILTERS keeps 14
 * for the boards); the Who header and round foot come from RoundTileParts. */
function useScopeReads(userId: string | undefined, kind: RegionKind | null, value: string | null, enabled: boolean) {
  const rounds = useStandoutRounds(userId, { ...DEFAULT_FILTERS, window: '30', regionKind: kind, regionValue: value }, enabled, 10, { keepPrevious: true });
  const feats = useStandoutFeats(userId, kind, value, enabled, '30');
  return { rounds, feats };
}
function readRemembered(userId: string | undefined) {
  try { return userId ? localStorage.getItem(`standout-scope:${userId}`) : null; } catch { return null; }
}
/* The strip is the score post's HoleMarks (RoundTileMarks); the feat hole's
   highlight rides on the matching mark as data-raised, ringed in gold by
   standout-shelf.css — the same fact the old raised bar carried. */
function Strip({ shape, raised }: { shape: HoleShape | null; raised?: number | null }) {
  return shape ? <RoundTileMarks shape={shape} raised={raised} /> : null;
}
function Tile({ tile, shape, locale, onOpenRound, onOpenMember }: {
  tile: ReturnType<typeof interleaveStandouts>[number]; shape: HoleShape | null; locale: string;
  onOpenRound?: (scoreId: string, owner: string | null) => void; onOpenMember?: (id: string) => void;
}) {
  const { t } = useTranslation('courses');
  const round: StandoutRound | null = tile.kind === 'round' ? tile.row : null;
  const feat: StandoutFeat | null = tile.kind === 'feat' ? tile.row : null;
  const scoreId = round?.whs_score_id ?? feat?.latest_score_id;
  const owner = round?.user_id ?? feat?.latest_user_id ?? null;
  const name = round?.display_name ?? feat?.latest_display_name ?? t('discover.aMember', { defaultValue:'A member' });
  const parts = round ? standoutSentenceParts(round, locale) : feat ? featHeadlineParts(feat) : null;
  const date = feat ? shortStandoutDate(feat.latest_play_date ?? null, locale) : null;
  const rarity = feat ? featRarity(feat) : null;
  const open = () => { if (scoreId) onOpenRound?.(scoreId, owner); };
  const labels = { eagle:'EAGLE', albatross:'ALBATROSS', ace:'HOLE IN ONE', clean_card:'BOGEY-FREE' };
  return <div role="button" tabIndex={0} data-standout-tile={tile.kind} data-score-id={scoreId} className="standout-card" onClick={open} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } }}
    style={{ width:SHELF_CARD.width, minHeight:SHELF_CARD.minHeight, borderRadius:SHELF_CARD.radius, padding:SHELF_CARD.padding }}>
    {feat ? <div className="standout-kicker" data-clean={feat.feat_kind === 'clean_card'}><i />{t(`amateur.standoutShelf.kind.${feat.feat_kind}`, { defaultValue:labels[feat.feat_kind] })}</div> : null}
    <RoundTileWho userId={owner} name={name} photo={round?.profile_photo_url ?? feat?.latest_photo_url ?? null} course={round?.course_name ?? feat?.latest_course_name ?? null} onOpenMember={onOpenMember} />
    {parts ? <div className="standout-story">{t(parts.key, { ...parts, defaultValue:parts.defaultValue })}</div> : null}
    <div className="standout-bottom"><Strip shape={shape} raised={feat && feat.feat_kind !== 'clean_card' ? feat.hole_no : null} /></div>
    {round ? <RoundTileFoot round={round} locale={locale} /> : feat ? <>
      <div className="standout-rarity">{date}{rarity != null ? t(`amateur.standoutShelf.rarity.${feat.denominator_unit}`, { defaultValue:feat.denominator_unit === 'holes' ? ' · 1 in {{n}} holes' : ' · 1 in {{n}} rounds', n:rarity }) : ''}</div>
      {feat.viewer_year_events > 0 ? <div className="standout-you">{t('amateur.standoutShelf.you', { defaultValue:'You have {{n}} this year', n:feat.viewer_year_events })}</div> : null}
    </> : null}
  </div>;
}
export function StandoutRoundsShelf({ userId, onOpenRound, onOpenMember }: {
  userId: string | undefined; onOpenRound?: (scoreId: string, owner: string | null) => void; onOpenMember?: (id: string) => void;
}) {
  const { t, i18n } = useTranslation('courses');
  const geography = useViewerScoreScope(userId);
  const enabled = !!userId && geography.isFetched && !geography.unresolved;
  const county = useScopeReads(userId, 'region', geography.scope.county, enabled && !!geography.scope.county);
  const nation = useScopeReads(userId, 'sub_country', geography.scope.nation ?? null, enabled && !!geography.scope.nation);
  const everyone = useScopeReads(userId, null, null, !!userId);
  const [choice, setChoice] = useState<{ viewer: string | undefined; key: string | null }>(() => ({ viewer:userId, key:readRemembered(userId) }));
  const remembered = choice.viewer === userId ? choice.key : readRemembered(userId);
  const scopes: StandoutScopeData[] = [
    ...(geography.scope.county ? [{ key:'county' as const, label:geography.scope.county, rounds:county.rounds.data ?? [], feats:county.feats.data ?? [] }] : []),
    ...(geography.scope.nation ? [{ key:'nation' as const, label:geography.scope.nation, rounds:nation.rounds.data ?? [], feats:nation.feats.data ?? [] }] : []),
    { key:'everyone', label:t('discover.filterBoard.scope.everyone', { defaultValue:'Everyone' }), rounds:everyone.rounds.data ?? [], feats:everyone.feats.data ?? [] },
  ];
  const activeReads = [everyone, ...(geography.scope.county ? [county] : []), ...(geography.scope.nation ? [nation] : [])];
  const error = geography.unresolved || activeReads.some(read => read.rounds.isError || read.feats.isError);
  const loading = !!userId && (!geography.isFetched || activeReads.some(read => !read.rounds.isFetched || !read.feats.isFetched));
  const selected = selectStandoutScope(scopes, remembered);
  const held = useRef<{ viewer:string | undefined; selected:StandoutScopeData } | null>(null);
  if (!loading && !error && selected) held.current = { viewer:userId, selected };
  const shown = loading && held.current?.viewer === userId ? held.current.selected : selected;
  const rounds = shown?.rounds ?? []; const feats = shown?.feats ?? [];
  const ids = useMemo(() => [...rounds.map(row => row.whs_score_id), ...feats.map(row => row.latest_score_id)], [rounds, feats]);
  const shapes = useRoundHoleShapes(ids);
  useEffect(() => { if (error) console.warn('[standout shelf] read failed; shelf hidden'); }, [error]);
  if (!userId || error) return null;
  if (loading && held.current?.viewer !== userId) return <div className="standout-shelf standout-loading" data-standout-shelf="loading" aria-hidden><div className="standout-loading-heading"><i /><i /></div><div className="standout-rail">{[0,1].map(i => <div key={i} className="standout-card" />)}</div></div>;
  if (!shown || !scopeHasTiles(shown)) return null;
  const visibleScopes = scopes.filter(scopeHasTiles);
  const choose = (key: StandoutScopeKey) => {
    setChoice({ viewer:userId, key });
    try { localStorage.setItem(`standout-scope:${userId}`, key); } catch { /* the tap still works for this visit */ }
  };
  return <section className="standout-shelf" data-standout-shelf="ready">
    <div className="standout-heading"><div><b>{t('amateur.standout.title', { defaultValue:'Standout rounds' })}</b><span>{t('discover.filterBoard.window.d30', { defaultValue:'Last 30 days' })}</span></div></div>
    {visibleScopes.length > 1 ? <div className="standout-scopes" data-standout-scopes>{visibleScopes.map(scope => <Button key={scope.key} variant="ghost" className="standout-chip" aria-pressed={shown.key === scope.key} onClick={() => choose(scope.key)}>{scope.label}</Button>)}</div> : null}
    <div className="standout-rail" data-standout-rail>{interleaveStandouts(rounds, feats).map(tile => {
      const id = tile.kind === 'round' ? tile.row.whs_score_id : tile.row.latest_score_id;
      return <Tile key={tile.kind === 'round' ? `round:${id}:${tile.row.pos}` : `feat:${tile.row.feat_kind}:${id}`} tile={tile} shape={id ? shapes?.get(id) ?? null : null} locale={i18n?.language || 'en'} onOpenRound={onOpenRound} onOpenMember={onOpenMember} />;
    })}</div>
  </section>;
}