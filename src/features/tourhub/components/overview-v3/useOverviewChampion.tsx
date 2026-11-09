/**
 * THE OVERVIEW CHAMPION — ONE derivation, two readers (extracted from
 * HybridHero for BUILD_TOUR_BUTTONS_UNDER_HERO §1). HybridHero needs the
 * champion's closing round for the photo sentence and the showChampion gate
 * that drops it; OverviewHero renders the ChampionStrip BELOW the tour chip
 * row (on finished events the champion block follows the row rather than the
 * photo). Both read the same useTourLeaderboard key, so the second call is a
 * cache hit.
 *
 * The gate is unchanged: only a genuinely finished event
 * (isChampionResolvable) with an authoritative winner — never a name or
 * position read off a live/suspended/playoff board.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTourLeaderboard } from '../../hooks/useTourHubData';
import type { HeroSlide } from '../../hooks/useHeroCarouselData';
import { resolveBoardEntity, resolveChampionEntry, teamNamesNeedInitials } from '../../_shared/boardEntity';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { detectTopTie, fmtScore, isChampionResolvable, type HeroState } from './HybridHero.utils';
import { ChampionStrip } from './HybridHeroBands/ChampionStrip';
import { championNarrative } from '../../tournament-v2/data/tournamentRules';
import { championScoreLabel } from '../../tournament-v2/data/weekFactsRules';
import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';

export interface OverviewChampion {
  name: string;
  score: number;
  margin: number | null;
  playoff: boolean;
  rounds: number[];
  closingRound: number | null;
}

/**
 * The champion's gross closing round. round_N is a TO-PAR figure, so the
 * venue par is added to turn it into strokes. Either absent → null, and the
 * sentence takes its variant without a closing round.
 */
function closingGross(round4: number | null | undefined, par: number | null | undefined): number | null {
  if (typeof round4 !== 'number' || !Number.isFinite(round4)) return null;
  if (typeof par !== 'number' || !Number.isFinite(par) || par <= 0) return null;
  return par + round4;
}

export function useOverviewChampion(slide: HeroSlide, state: HeroState) {
  const { tournament } = slide;
  const { data: leaderboard = [] } = useTourLeaderboard(state.kind === 'upcoming' ? '' : tournament.id);
  const rows = Array.isArray(leaderboard) ? leaderboard : [];
  const top = rows[0];
  const needsInitials = useMemo(() => teamNamesNeedInitials(rows), [rows]);

  const champion: OverviewChampion | null = useMemo(() => {
    // Champion gate — the SAME rule as the pick trophy in HeroBoardBand: only a
    // genuinely finished event (isChampionResolvable) with an authoritative
    // winner. Never by name or position on a live/suspended/playoff board.
    if (!isChampionResolvable(state) || top?.score == null) return null;
    // event_type comes from sr_tournaments via the slide — never inferred
    // from the shape of the top board row. Resolved even when winnerName is
    // set: its rounds and country feed the strip.
    const championEntry = resolveChampionEntry(rows, { winner_id: tournament.winnerId, event_type: tournament.eventType });
    const teamChampion = championEntry && !tournament.winnerName ? resolveBoardEntity(championEntry, needsInitials) : null;
    const championName = tournament.winnerName ?? teamChampion?.prose ?? null;
    if (!championName) return null;
    const championScore = championEntry?.score ?? top.score;
    const runner = rows
      .filter((row) => row.id !== championEntry?.id && row.score != null && row.score > championScore)
      .sort((a, b) => (a.score ?? Number.POSITIVE_INFINITY) - (b.score ?? Number.POSITIVE_INFINITY))[0]
      ?? rows.find((row) => row.id !== championEntry?.id && row.score != null);
    const margin = runner?.score != null ? runner.score - championScore : null;
    const tiedAtTop = detectTopTie(rows);
    return {
      name: championName,
      score: championScore,
      margin: tiedAtTop ? null : margin != null && margin > 0 ? margin : null,
      playoff: Boolean(tiedAtTop),
      rounds: championEntry
        ? [championEntry.round_1, championEntry.round_2, championEntry.round_3, championEntry.round_4]
            .filter((r): r is number => typeof r === 'number' && Number.isFinite(r)) // to-par: 0 and negatives are real rounds
        : [],
      closingRound: closingGross(championEntry?.round_4, tournament.venuePar),
    };
  }, [needsInitials, rows, state, top?.player, top?.score, top?.team, tournament.eventType, tournament.winnerId, tournament.winnerName, tournament.venuePar]);

  const championAvatarCandidates = champion
    ? resolvePlayerAvatarCandidates({
        name: champion.name,
        photoUrl: tournament.winnerPhotoUrl,
        tourSlug: tournament.tourSlug,
        headshotOverride: tournament.winnerHeadshotOverride,
      })
    : [];

  /* The overview's champion block IS the tournament page's: same narrative
     (championNarrative over the FULL field) and the same "BY {words}" score
     label rule as TournamentPage. The meta it reads is assembled from the
     slide's tournament fields. */
  const championMeta = useMemo(
    () => ({ winner_id: tournament.winnerId, venue_par: tournament.venuePar, start_date: tournament.startDate }) as TournamentMeta,
    [tournament.winnerId, tournament.venuePar, tournament.startDate],
  );

  const showChampion = isChampionResolvable(state) && champion != null;

  return { rows, needsInitials, champion, championAvatarCandidates, championMeta, showChampion };
}

/**
 * The champion block as the overview renders it: the shared .tv-champion
 * strip, mounted by OverviewHero BELOW the tour chip row (and inside the
 * slide's cross-fade, with the content below the row).
 */
export function OverviewChampionBlock({ slide, state }: { slide: HeroSlide; state: HeroState }) {
  const { t } = useTranslation('tourhub');
  const { rows, champion, championAvatarCandidates, championMeta, showChampion } = useOverviewChampion(slide, state);
  if (!showChampion || !champion) return null;
  return (
    <ChampionStrip
      name={champion.name}
      score={fmtScore(champion.score)}
      scoreValue={champion.score}
      scoreLabel={championScoreLabel(champion.margin, champion.playoff)}
      eyebrow={t('overview.hero.champion')}
      avatarCandidates={championAvatarCandidates}
      playerKey={slide.tournament.winnerKey}
      narrativeParts={championNarrative(championMeta, rows)}
    />
  );
}
